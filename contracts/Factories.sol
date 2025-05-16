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
        string memory name,
        string memory symbol,
        uint8 decimals,
        address[] memory initialMembers,
        uint256[] memory combinedInitialAmounts, // Contains mint amounts for members + DAO settings
        bool transferrable
    ) public returns (address) {
        // Extract only the amounts for initial members for minting
        uint256 membersCount = initialMembers.length;
        uint256[] memory mintAmounts = new uint256[](membersCount);
        for (uint i = 0; i < membersCount; i++) {
            // Assuming combinedInitialAmounts is long enough as checked by WrapperContract
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
    // Reverted to take daoSettingsArray as the WrapperContract will prepare this
    function deployDAO(address tokenAddress, address timelockAddress,
    string memory name, uint[] memory daoSettingsArray 
    ) public returns (address) {
        require(daoSettingsArray.length == 4, "DAOFactory: DAO settings array must have 4 elements");
        uint48 minsDelay = uint48(daoSettingsArray[0]);    
        uint32 minsVoting = uint32(daoSettingsArray[1]);   
        uint256 pThreshold = daoSettingsArray[2];          
        uint8 qvrm = uint8(daoSettingsArray[3]);           
        
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

    // Event signatures simplified in previous attempts, keeping them simple for now
    event NewDaoCreated(
        address indexed dao,
        address token,
        string daoName, 
        string tokenSymbol, 
        uint256 executionDelay,
        address registry
        // If you need more data, add it back, but be mindful if errors reappear
    );

    event NewDaoWithWrappedTokenCreated(
        address indexed dao,
        address wrappedToken,
        address underlyingToken,
        string daoName,
        string wrappedTokenName,
        string wrappedTokenSymbol,
        uint256 executionDelay,
        address registry
    );

    // Original struct that was compiling fine
    struct DaoParams {
        string tokenName;       
        string daoName;         
        string symbol;          
        string description;     // Used for registry, not directly for DAO/Token contract names
        uint8 decimals;         
        uint256 executionDelay; 
        address[] initialMembers;       
        uint256[] initialAmounts; // Combined: N mint amounts + 4 DAO settings
        string[] keys;          
        string[] values;        
        bool transferrable;     
    }

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

    // Restoring deployDAOwithToken to use its struct, as this was compiling
    function deployDAOwithToken(DaoParams memory params) public payable {
        require(
            params.initialMembers.length <= params.initialAmounts.length,
            "Wrapper: initialAmounts too short for members"
        );
        require(
            params.initialAmounts.length >= params.initialMembers.length + 4,
            "Wrapper: Insufficient settings data in initialAmounts"
        );

        // Deploy token contract
        // TokenFactory's deployToken will handle extracting mintAmounts from params.initialAmounts
        address token = tokenFactory.deployToken(
            params.tokenName, // Name for the new token
            params.symbol,    // Symbol for the new token
            params.decimals,
            params.initialMembers,
            params.initialAmounts, // Pass the combined array
            params.transferrable
        );

        // Deploy timelock contract
        address timelock = timelockFactory.deployTimelock(
            address(this), 
            params.executionDelay
        );
        
        // Prepare DAO settings array for DAOFactory from the combined initialAmounts
        uint256[] memory daoSettingsArray = new uint256[](4);
        uint256 len = params.initialAmounts.length;
        daoSettingsArray[0] = params.initialAmounts[len - 4]; // minsDelay
        daoSettingsArray[1] = params.initialAmounts[len - 3]; // minsVoting
        daoSettingsArray[2] = params.initialAmounts[len - 2]; // pThreshold
        daoSettingsArray[3] = params.initialAmounts[len - 1]; // qvrm

        // Deploy DAO contract
        address dao = daoFactory.deployDAO(
            token,
            timelock,
            params.daoName, // Name for the DAO
            daoSettingsArray
        );

        // Deploy registry
        // The registry's owner is the timelock, wrapper is this contract for initial setup
        Registry reg = new Registry(timelock, address(this)); 
        address payable registryAddress = payable(address(reg));

        // Finalize core deployment (setting roles, etc.)
        _finalizeCoreDeployment(dao, token, timelock, registryAddress);

        // Batch-edit registry using keys/values from params
        // The 'params.description' can be one of the key/value pairs if needed, e.g., keys=["description"], values=[params.description]
        if (params.keys.length > 0) {
             Registry(registryAddress).batchEditRegistry(params.keys, params.values);
        }

        emit NewDaoCreated(
            dao,
            token,
            params.daoName,
            params.symbol, // Token symbol
            params.executionDelay,
            registryAddress
        );
    }

    function deployDAOwithWrappedToken(DaoParamsWrapped memory params) public payable {
        // Deploy wrapped token contract
        address wrappedToken = tokenFactory.deployWrappedToken(
            IERC20(params.underlyingTokenAddress),
            params.wrappedTokenName,
            params.wrappedTokenSymbol
        );

        // Deploy timelock contract
        address timelock = timelockFactory.deployTimelock(
            address(this), 
            params.executionDelay
        );

        // Prepare DAO settings array for DAOFactory
        uint256[] memory daoSettingsArray = new uint256[](4);
        daoSettingsArray[0] = params.minsVotingDelay;
        daoSettingsArray[1] = params.minsVotingPeriod;
        daoSettingsArray[2] = params.proposalThreshold;
        daoSettingsArray[3] = params.quorumFraction;

        // Deploy DAO contract
        address dao = daoFactory.deployDAO(
            wrappedToken,
            timelock,
            params.daoName,
            daoSettingsArray
        );

        // Deploy registry
        Registry reg = new Registry(timelock, address(this));
        address payable registryAddress = payable(address(reg));

        _finalizeCoreDeployment(dao, wrappedToken, timelock, registryAddress);

        // Batch-edit registry
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

    // This internal function has a small, manageable stack footprint
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
        // timelockController.grantRole(timelockController.TIMELOCK_ADMIN_ROLE(), dao);
        // timelockController.renounceRole(timelockController.TIMELOCK_ADMIN_ROLE(), address(this));
    }
}
// Factories.sol