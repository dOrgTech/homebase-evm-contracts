// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24; // Matched to your working version

// Original imports from your working file
import "./Dao.sol";
import "./Registry.sol";
import "./Token.sol"; // This is your original HBEVM_token
import "@openzeppelin/contracts/governance/TimelockController.sol"; 

// New imports needed for WrapperContract_W
import "./HBEVM_Wrapped_Token.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol"; // For DAOFactory with wrapped tokens
import {IAdminToken} from "./IAdminToken.sol"; // For setting admin on wrapped token
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; // For IERC20 type


// --- FACTORIES (TokenFactory, TimelockFactory, DAOFactory as previously corrected) ---
contract TokenFactory {
    address[] public deployedTokens;
    address[] public deployedWrappedTokens; 

    function deployToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        address[] memory initialMembers,
        uint256[] memory combinedInitialAmounts, 
        bool transferrable
    ) public returns (address) {
        uint256 membersCount = initialMembers.length;
        uint256[] memory mintAmounts = new uint256[](membersCount);
        for (uint i = 0; i < membersCount; i++) {
            mintAmounts[i] = combinedInitialAmounts[i];
        }
        HBEVM_token token = new HBEVM_token(name, symbol, decimals, initialMembers, mintAmounts, transferrable);
        deployedTokens.push(address(token));
        return address(token);
    }

    function deployWrappedToken(
        IERC20 underlyingToken,
        string memory wrappedTokenName,
        string memory wrappedTokenSymbol
    ) public returns (address) {
        HBEVM_Wrapped_Token wrappedToken = new HBEVM_Wrapped_Token(underlyingToken, wrappedTokenName, wrappedTokenSymbol);
        deployedWrappedTokens.push(address(wrappedToken));
        return address(wrappedToken);
    }
}

contract TimelockFactory {
    address[] public deployedTimelocks;
    function deployTimelock(address admin, uint256 executionDelay) public returns (address) {
        address[] memory proposers;
        address[] memory executors;
        TimelockController timelock = new TimelockController(
            executionDelay, proposers, executors, admin
        );
        deployedTimelocks.push(address(timelock));
        return address(timelock);
    }
}

contract DAOFactory {
    address[] public deployedDAOs;
    function deployDAO(address tokenAddress, address timelockAddress,
    string memory name, uint[] memory initialAmounts 
    ) public returns (address) {
        require(initialAmounts.length >= 4, "DAOFactory: Insufficient settings in initialAmounts");
        uint48 minsDelay = uint48(initialAmounts[initialAmounts.length - 4]);
        uint32 minsVoting = uint32(initialAmounts[initialAmounts.length - 3]);
        uint256 pThreshold = initialAmounts[initialAmounts.length - 2];
        uint8 qvrm = uint8(initialAmounts[initialAmounts.length - 1]);
        
        HomebaseDAO dao = new HomebaseDAO(
            IVotes(tokenAddress), 
            TimelockController(payable(timelockAddress)),
            name,
            minsDelay,
            minsVoting,
            pThreshold,
            qvrm
        );
        deployedDAOs.push(address(dao));
        return address(dao);
    }
}

// --- ORIGINAL WrapperContract (UNCHANGED from your working version) ---
contract WrapperContract {
    TokenFactory tokenFactory;
    TimelockFactory timelockFactory;
    DAOFactory daoFactory;
    address[] public deployedDAOs;
    address[] public deployedTokens;
    address[] public deployedTimelocks;
    address[] public deployedRegistries;

    constructor(
        address _tokenFactory,
        address _timelockFactory,
        address _daoFactory
    ) {
        tokenFactory = TokenFactory(_tokenFactory);
        timelockFactory = TimelockFactory(_timelockFactory);
        daoFactory = DAOFactory(_daoFactory);
    }

    function getNumberOfDAOs() public view returns (uint) {
        return deployedDAOs.length;
    }

    event NewDaoCreated( 
        address indexed dao,
        address token,
        address[] initialMembers,
        uint256[] initialAmounts, 
        string name,
        string symbol,
        string description,
        uint256 executionDelay,
        address registry,
        string[] keys,
        string[] values
    );

    struct DaoParams { 
        string name;
        string symbol;
        string description;
        uint8 decimals;
        uint256 executionDelay;
        address[] initialMembers;
        uint256[] initialAmounts; 
        string[] keys;
        string[] values;
        bool transferrable;
    }

    function deployDAOwithToken(DaoParams memory params) public payable { 
        require(
            params.initialAmounts.length >= params.initialMembers.length + 4,
            "Insufficient settings data in initialAmounts array"
        );
        address token = tokenFactory.deployToken(
            params.name, params.symbol, params.decimals,
            params.initialMembers, params.initialAmounts, params.transferrable
        );
        address timelock = timelockFactory.deployTimelock(address(this), params.executionDelay);
        address dao = daoFactory.deployDAO(token, timelock, params.name, params.initialAmounts);
        Registry reg = new Registry(timelock, address(this));
        _finalizeDeployment(dao, token, timelock, payable(address(reg)), params.keys, params.values);

        emit NewDaoCreated(
            dao, token, params.initialMembers, params.initialAmounts,
            params.name, params.symbol, params.description,
            params.executionDelay, address(reg), params.keys, params.values
        );
    }

    function _finalizeDeployment( 
        address dao,
        address token,
        address timelock,
        address payable registry,
        string[] memory keys,
        string[] memory values
    ) internal {
        deployedDAOs.push(dao);
        deployedTokens.push(token);
        deployedTimelocks.push(timelock);
        deployedRegistries.push(registry);
        HBEVM_token(token).setAdmin(timelock); 
        TimelockController timelockController = TimelockController(payable(timelock));
        timelockController.grantRole(timelockController.PROPOSER_ROLE(), dao);
        timelockController.grantRole(timelockController.EXECUTOR_ROLE(), dao);
        if (keys.length > 0) { 
            Registry(registry).batchEditRegistry(keys, values);
        }
    }
}
