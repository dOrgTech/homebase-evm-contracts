// contracts/Factories.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAdminToken} from "./IAdminToken.sol";
import {Registry} from "./Registry.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";

// Interfaces to the single-purpose factory contracts
interface IDAOFactory {
    function deployDAO(address tokenAddress, address timelockAddress, string memory name, uint[] memory daoSettings) external returns (address);
}
interface ITokenFactory {
    function deployToken(string memory name, string memory symbol, uint8 decimals, address[] memory initialMembers, uint256[] memory combinedInitialAmounts, bool transferrable) external returns (address);
}
interface IJurisdictionFactory {
    function deployJurisdictionToken(string memory name, string memory symbol, address payable registryAddress, address timelockAddress, address[] memory initialMembers, uint256[] memory combinedInitialAmounts) external returns (address);
}
interface IInfrastructureFactory {
    function deployTimelock(address admin, uint256 executionDelay) external returns (address);
    function deployRegistry(address timelockAddress, address wrapperAddress) external returns (address);
}

contract WrapperContract {
    IDAOFactory           public immutable daoFactory;
    ITokenFactory         public immutable tokenFactory;
    IJurisdictionFactory  public immutable jurisdictionFactory;
    IInfrastructureFactory public immutable infrastructureFactory;

    uint256 public nextDeploymentId;
    struct PendingDeployment {
        address token;
        address timelock;
        address registry;
        bool isJurisdiction;
    }
    mapping(uint256 => PendingDeployment) public pendingDeployments;

    address[] public deployedDAOs;
    address[] public deployedTokens;
    address[] public deployedTimelocks;
    address[] public deployedRegistries;

    constructor(
        address _daoFactory,
        address _tokenFactory,
        address _jurisdictionFactory,
        address _infrastructureFactory
    ) {
        daoFactory = IDAOFactory(_daoFactory);
        tokenFactory = ITokenFactory(_tokenFactory);
        jurisdictionFactory = IJurisdictionFactory(_jurisdictionFactory);
        infrastructureFactory = IInfrastructureFactory(_infrastructureFactory);
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
        bool isJurisdiction;
    }

    function prepareDeployment(DaoParams memory params) public payable returns (uint256 deploymentId) {
        deploymentId = nextDeploymentId++;
        
        address token;
        address timelock = infrastructureFactory.deployTimelock(address(this), params.executionDelay);
        address registry = infrastructureFactory.deployRegistry(timelock, address(this));

        if (params.isJurisdiction) {
            token = jurisdictionFactory.deployJurisdictionToken(params.name, params.symbol, payable(registry), timelock, params.initialMembers, params.initialAmounts);
        } else {
            token = tokenFactory.deployToken(params.name, params.symbol, params.decimals, params.initialMembers, params.initialAmounts, params.transferrable);
        }

        pendingDeployments[deploymentId] = PendingDeployment({
            token: token,
            timelock: timelock,
            registry: registry,
            isJurisdiction: params.isJurisdiction
        });
        
        return deploymentId; // <-- THE MISSING, CRITICAL RETURN STATEMENT
    }

    function finalizeDeployment(uint256 deploymentId, DaoParams memory params) public {
        PendingDeployment memory pending = pendingDeployments[deploymentId];
        require(pending.token != address(0), "Invalid or completed deploymentId");

        uint[] memory daoSettings;
        if (pending.isJurisdiction) {
            require(params.initialAmounts.length >= 4, "Jurisdiction DAO settings requires 4 elements");
            daoSettings = new uint[](4);
            for(uint i=0; i < 4; i++){
                daoSettings[i] = params.initialAmounts[i];
            }
        } else {
            require(params.initialAmounts.length >= params.initialMembers.length + 4, "Insufficient legacy settings");
            daoSettings = new uint[](params.initialAmounts.length - params.initialMembers.length);
            for(uint i = 0; i < daoSettings.length; i++) {
                daoSettings[i] = params.initialAmounts[params.initialMembers.length + i];
            }
        }
        
        address dao = daoFactory.deployDAO(pending.token, pending.timelock, params.name, daoSettings);

        _finalize(dao, pending.token, pending.timelock, payable(pending.registry), params.keys, params.values);
        IAdminToken(pending.token).setAdmin(pending.timelock);

        if (pending.isJurisdiction) {
            Registry(payable(pending.registry)).setJurisdictionAddress(pending.token);
        }
        
        emit NewDaoCreated(dao, pending.token, params.initialMembers, params.initialAmounts, params.name, params.symbol, params.description, params.executionDelay, pending.registry, params.keys, params.values);
        delete pendingDeployments[deploymentId];
    }

    function _finalize(address dao, address token, address timelock, address payable registry, string[] memory keys, string[] memory values) internal {
        deployedDAOs.push(dao);
        deployedTokens.push(token);
        deployedTimelocks.push(timelock);
        deployedRegistries.push(registry);
        
        TimelockController timelockController = TimelockController(payable(timelock));
        timelockController.grantRole(timelockController.PROPOSER_ROLE(), dao);
        timelockController.grantRole(timelockController.EXECUTOR_ROLE(), dao);

        if (keys.length > 0) {
            Registry(registry).batchEditRegistry(keys, values);
        }
    }
}
// Factories.sol