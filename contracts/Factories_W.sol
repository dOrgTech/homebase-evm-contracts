// contracts/Factories_W.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24; // Consistent pragma

// Imports for dependent contracts and interfaces
import "./Dao.sol"; 
import "./Registry.sol"; 
import "./HBEVM_Wrapped_Token.sol"; 
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {IAdminToken} from "./IAdminToken.sol"; 
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ITokenFactory {
    function deployWrappedToken(
        IERC20 underlyingToken,
        string memory wrappedTokenName,
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
        string memory name,
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

    // VERY LEAN event for wrapped token DAO creation to avoid stack issues
    event NewDaoWrappedInfo( // Renamed to be distinct and simple
        address indexed dao,
        address indexed wrappedToken,
        address indexed underlyingToken,
        string daoName, // Essential info
        address registryAddress // Essential info
    );

    struct DaoParamsWrapped {
        string daoName;                 
        string wrappedTokenName;        
        string wrappedTokenSymbol;      
        string description;             // Will be set in registry, not critical for this lean event
        uint256 executionDelay;         
        address underlyingTokenAddress; 
        uint48 minsVotingDelay;         // DAO setting, can be queried
        uint32 minsVotingPeriod;        // DAO setting, can be queried
        uint256 proposalThreshold;      // DAO setting, can be queried
        uint8 quorumFraction;           // DAO setting, can be queried
        string[] keys;                  // For registry
        string[] values;                // For registry
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
        address wrappedToken = tokenFactory.deployWrappedToken(
            IERC20(params.underlyingTokenAddress), params.wrappedTokenName, params.wrappedTokenSymbol
        );
        address timelock = timelockFactory.deployTimelock(address(this), params.executionDelay);

        uint256[] memory daoSettingsArray = new uint256[](4);
        daoSettingsArray[0] = params.minsVotingDelay;
        daoSettingsArray[1] = params.minsVotingPeriod;
        daoSettingsArray[2] = params.proposalThreshold;
        daoSettingsArray[3] = params.quorumFraction;

        address dao = daoFactory.deployDAO(wrappedToken, timelock, params.daoName, daoSettingsArray);
        
        Registry reg = new Registry(timelock, address(this)); 
        address payable registryAddress = payable(address(reg));

        _finalizeDeployment_W(dao, wrappedToken, timelock, registryAddress, params.keys, params.values);

        // Emit the new, lean event
        emit NewDaoWrappedInfo(
            dao, 
            wrappedToken, 
            params.underlyingTokenAddress,
            params.daoName,
            registryAddress // Only essential, directly available info
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