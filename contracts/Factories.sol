// contracts/Factories_W.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24; 

// Imports
import "./Dao.sol"; 
import "./Registry.sol"; 
import "./HBEVM_Wrapped_Token.sol"; 
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {IAdminToken} from "./IAdminToken.sol"; 
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Interfaces for Factories
interface ITokenFactory {
    function deployWrappedToken(
        IERC20 underlyingToken,
        string memory wrappedTokenName, // Will be same as daoName
        string memory wrappedTokenSymbol
    ) external returns (address);
}

interface ITimelockFactory {
    function deployTimelock(address admin, uint256 executionDelay) external returns (address);
}

interface IDAOFactory {
    function deployDAO( 
        address tokenAddress,
        address timelockAddress,
        string memory name, // DAO Name
        uint[] memory daoSettingsArray 
    ) external returns (address);
}

contract WrapperContract_W {
    ITokenFactory tokenFactory;
    ITimelockFactory timelockFactory;
    IDAOFactory daoFactory;

    address[] public deployedDAOs_W; 
    address[] public deployedTokens_W; 
    address[] public deployedTimelocks_W;
    address[] public deployedRegistries_W;

    event DaoWrappedDeploymentInfo( 
        address indexed daoAddress,
        address indexed wrappedTokenAddress,
        address registryAddress,
        string daoName,         // Used for DAO and Wrapped Token Name
        string wrappedTokenSymbol, // Still need symbol for wrapped token
        string description,
        uint8 quorumFraction    // ADDED (DAO Setting)
        // Other DAO settings (voting delay, period, threshold) can be fetched
    );

    struct DaoParamsWrapped {
        string daoName;                 // Will also be used as wrappedTokenName
        // string wrappedTokenName;     // REMOVED
        string wrappedTokenSymbol;      
        string description;             
        uint256 executionDelay;         
        address underlyingTokenAddress; 
        uint48 minsVotingDelay;         
        uint32 minsVotingPeriod;        
        uint256 proposalThreshold;      
        uint8 quorumFraction;           // Will be emitted
        string[] keys;                  
        string[] values;                
    }

    constructor(
        address _tokenFactory,
        address _timelockFactory,
        address _daoFactory
    ) {
        tokenFactory = ITokenFactory(_tokenFactory);
        timelockFactory = ITimelockFactory(_timelockFactory);
        daoFactory = IDAOFactory(_daoFactory);
    }

    function getNumberOfDAOs_W() public view returns (uint) {
        return deployedDAOs_W.length;
    }

    function deployDAOwithWrappedToken(DaoParamsWrapped memory params) public payable {
        // Use params.daoName for wrappedTokenName
        address wrappedToken = tokenFactory.deployWrappedToken(
            IERC20(params.underlyingTokenAddress), params.daoName, params.wrappedTokenSymbol
        );
        address timelock = timelockFactory.deployTimelock(address(this), params.executionDelay);

        uint256[] memory daoSettingsArray = new uint256[](4);
        daoSettingsArray[0] = params.minsVotingDelay;
        daoSettingsArray[1] = params.minsVotingPeriod;
        daoSettingsArray[2] = params.proposalThreshold;
        daoSettingsArray[3] = params.quorumFraction;

        // DAO is deployed with params.daoName
        address dao = daoFactory.deployDAO(wrappedToken, timelock, params.daoName, daoSettingsArray);
        
        Registry reg = new Registry(timelock, address(this)); 
        address payable registryAddress = payable(address(reg));

        _finalizeDeployment_W(dao, wrappedToken, timelock, registryAddress, params.keys, params.values);

        emit DaoWrappedDeploymentInfo(
            dao, 
            wrappedToken, 
            registryAddress,
            params.daoName, // Used for both DAO and (implicitly) wrapped token name
            params.wrappedTokenSymbol,
            params.description,
            params.quorumFraction // Emitting quorumFraction
        );
    }

    function _finalizeDeployment_W(
        address dao,
        address token, 
        address timelock,
        address payable registry,
        string[] memory keys,
        string[] memory values
    ) internal {
        deployedDAOs_W.push(dao);
        deployedTokens_W.push(token); 
        deployedTimelocks_W.push(timelock);
        deployedRegistries_W.push(registry);
        
        IAdminToken(token).setAdmin(timelock); 

        TimelockController timelockController = TimelockController(payable(timelock));
        timelockController.grantRole(timelockController.PROPOSER_ROLE(), dao);
        timelockController.grantRole(timelockController.EXECUTOR_ROLE(), dao); 
        if (keys.length > 0) { 
            Registry(registry).batchEditRegistry(keys, values);
        }
    }
}
// Factories_W.sol