// contracts/Factories.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Dao.sol";
import "./Registry.sol";
import "./Token.sol";
import "./HBEVM_Wrapped_Token.sol"; 
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol"; 
import {IAdminToken} from "./IAdminToken.sol"; 
import "@openzeppelin/contracts/governance/TimelockController.sol"; 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; 

contract TokenFactory {
    address[] public deployedTokens;
    address[] public deployedWrappedTokens; 

    function deployToken(
        string memory name, // Name for the token
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
            executionDelay,
            proposers,      
            executors,      
            admin           
        );
        deployedTimelocks.push(address(timelock));
        return address(timelock);
    }
}

contract DAOFactory {
    address[] public deployedDAOs;
    function deployDAO(address tokenAddress, address timelockAddress,
    string memory name, // Name for the DAO
    uint[] memory daoSettingsArray 
    ) public returns (address) {
        require(daoSettingsArray.length == 4, "DAOFactory: DAO settings array must have 4 elements");
        uint48 minsDelay = uint48(daoSettingsArray[0]);    
        uint32 minsVoting = uint32(daoSettingsArray[1]);   
        uint256 pThreshold = daoSettingsArray[2];          
        uint8 qvrm = uint8(daoSettingsArray[3]);           
        
        HomebaseDAO dao = new HomebaseDAO(
            IVotes(tokenAddress), 
            TimelockController(payable(timelockAddress)),
            name, // DAO's name
            minsDelay,
            minsVoting,
            pThreshold,
            qvrm
            );
        deployedDAOs.push(address(dao));
        return address(dao);
    }
}


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
        string name, // Single name for DAO & Token as per original behavior
        string tokenSymbol, 
        uint256 executionDelay,
        address registry
    );

    event NewDaoWithWrappedTokenCreated(
        address indexed dao,
        address wrappedToken,
        address underlyingToken,
        string daoName, // For wrapped, DAO can have its own name distinct from wrapped token
        string wrappedTokenName,
        string wrappedTokenSymbol,
        uint256 executionDelay,
        address registry
    );

    // Reverted DaoParams to use a single 'name' field
    struct DaoParams {
        string name;            // Used for BOTH Token name and DAO name
        string symbol;          // Symbol for the new governance token
        string description;     // Description for the registry
        uint8 decimals;         
        uint256 executionDelay; 
        address[] initialMembers;       
        uint256[] initialAmounts; // Combined: N mint amounts + 4 DAO settings
        string[] keys;          
        string[] values;        
        bool transferrable;     
    }

    // DaoParamsWrapped remains as it was, as it's for the new functionality
    struct DaoParamsWrapped {
        string daoName;                 
        string wrappedTokenName;        
        string wrappedTokenSymbol;      
        string description;             
        uint256 executionDelay;         
        address underlyingTokenAddress; 
        uint48 minsVotingDelay;         
        uint32 minsVotingPeriod;        
        uint256 proposalThreshold;      
        uint8 quorumFraction;           
        string[] keys;
        string[] values;
    }

    function deployDAOwithToken(DaoParams memory params) public payable {
        require(
            params.initialMembers.length <= params.initialAmounts.length,
            "Wrapper: initialAmounts too short for members"
        );
        require(
            params.initialAmounts.length >= params.initialMembers.length + 4,
            "Wrapper: Insufficient settings data in initialAmounts"
        );

        // Deploy token contract using params.name for the token's name
        address token = tokenFactory.deployToken(
            params.name,    // TOKEN NAME
            params.symbol,
            params.decimals,
            params.initialMembers,
            params.initialAmounts, 
            params.transferrable
        );

        address timelock = timelockFactory.deployTimelock(
            address(this), 
            params.executionDelay
        );
        
        uint256[] memory daoSettingsArray = new uint256[](4);
        uint256 len = params.initialAmounts.length;
        daoSettingsArray[0] = params.initialAmounts[len - 4]; 
        daoSettingsArray[1] = params.initialAmounts[len - 3]; 
        daoSettingsArray[2] = params.initialAmounts[len - 2]; 
        daoSettingsArray[3] = params.initialAmounts[len - 1]; 

        // Deploy DAO contract using params.name for the DAO's name
        address dao = daoFactory.deployDAO(
            token,
            timelock,
            params.name,    // DAO NAME
            daoSettingsArray
        );

        Registry reg = new Registry(timelock, address(this)); 
        address payable registryAddress = payable(address(reg));

        _finalizeCoreDeployment(dao, token, timelock, registryAddress);

        if (params.keys.length > 0) {
             Registry(registryAddress).batchEditRegistry(params.keys, params.values);
        }
        // The event emits the single 'name' used for both, and the token's symbol
        emit NewDaoCreated(
            dao,
            token,
            params.name, // Emitting the common name
            params.symbol, 
            params.executionDelay,
            registryAddress
        );
    }

    function deployDAOwithWrappedToken(DaoParamsWrapped memory params) public payable {
        address wrappedToken = tokenFactory.deployWrappedToken(
            IERC20(params.underlyingTokenAddress),
            params.wrappedTokenName,
            params.wrappedTokenSymbol
        );

        address timelock = timelockFactory.deployTimelock(
            address(this), 
            params.executionDelay
        );

        uint256[] memory daoSettingsArray = new uint256[](4);
        daoSettingsArray[0] = params.minsVotingDelay;
        daoSettingsArray[1] = params.minsVotingPeriod;
        daoSettingsArray[2] = params.proposalThreshold;
        daoSettingsArray[3] = params.quorumFraction;

        address dao = daoFactory.deployDAO(
            wrappedToken,
            timelock,
            params.daoName, // For wrapped, DAO has its explicit name
            daoSettingsArray
        );

        Registry reg = new Registry(timelock, address(this));
        address payable registryAddress = payable(address(reg));

        _finalizeCoreDeployment(dao, wrappedToken, timelock, registryAddress);

        if (params.keys.length > 0) {
            Registry(registryAddress).batchEditRegistry(params.keys, params.values);
        }

        emit NewDaoWithWrappedTokenCreated(
            dao,
            wrappedToken,
            params.underlyingTokenAddress,
            params.daoName,
            params.wrappedTokenName,
            params.wrappedTokenSymbol,
            params.executionDelay,
            registryAddress
        );
    }

    function _finalizeCoreDeployment(
        address dao,
        address token, 
        address timelock,
        address payable registryAddress 
    ) internal {
        deployedDAOs.push(dao);
        deployedTokens.push(token); 
        deployedTimelocks.push(timelock);
        deployedRegistries.push(registryAddress);

        IAdminToken(token).setAdmin(timelock); 

        TimelockController timelockController = TimelockController(payable(timelock));
        timelockController.grantRole(timelockController.PROPOSER_ROLE(), dao);
        timelockController.grantRole(timelockController.EXECUTOR_ROLE(), dao); 
        
        // TODO: Decentralize Timelock Admin Role
    }
}
// Factories.sol