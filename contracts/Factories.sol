// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Dao.sol";
import "./Registry.sol";
import "./Token.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";


contract TokenFactory {
    address[] public deployedTokens;
    function deployToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        address[] memory initialMembers,
        uint256[] memory initialAmounts
    ) public returns (address) {
        HBEVM_token token = new HBEVM_token(name, symbol, decimals,initialMembers, initialAmounts);
        deployedTokens.push(address(token));
        return address(token);
    }
}


contract TimelockFactory {
    address[] public deployedTimelocks;
    function deployTimelock(address admin, uint256 executionDelay) public returns (address) {
        address[] memory proposers;
        address[] memory executors;

        TimelockController timelock = new TimelockController(
            executionDelay, // Minimum delay for execution, can be customized
            proposers,      // Empty proposers array
            executors,      // Empty executors array
            admin           // Admin role set to the provided admin
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
        // Read the last 4 values from initialAmounts for settings
        uint48 minsDelay = uint48(initialAmounts[initialAmounts.length - 4]);
        uint32 minsVoting = uint32(initialAmounts[initialAmounts.length - 3]);
        uint256 pThreshold = initialAmounts[initialAmounts.length - 2];
        uint8 qvrm = uint8(initialAmounts[initialAmounts.length - 1]);
        HomebaseDAO dao = new HomebaseDAO(
            HBEVM_token(tokenAddress),
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
}

function deployDAOwithToken(DaoParams memory params) public payable {
    // Validate array lengths
    require(
        params.initialAmounts.length >= params.initialMembers.length + 4,
        "Insufficient settings data in initialAmounts array"
    );

    // Deploy token contract
    address token = tokenFactory.deployToken(
        params.name,
        params.symbol,
        params.decimals,
        params.initialMembers,
        params.initialAmounts
    );

    // Deploy timelock contract
    address timelock = timelockFactory.deployTimelock(
        address(this),
        params.executionDelay
    );

    // Deploy DAO contract
    address dao = daoFactory.deployDAO(
        token,
        timelock,
        params.name,
        params.initialAmounts
    );

    // Deploy registry
    Registry reg = new Registry(timelock, address(this));

    // Continue deployment and grant roles
    _finalizeDeployment(dao, token, timelock, payable(address(reg)), params.keys, params.values);

    // Emit event for DAO creation
    emit NewDaoCreated(
        dao,
        token,
        params.initialMembers,
        params.initialAmounts,
        params.name,
        params.symbol,
        params.description,
        params.executionDelay,
        address(reg),
        params.keys,
        params.values
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
    // Store deployed addresses
    deployedDAOs.push(dao);
    deployedTokens.push(token);
    deployedTimelocks.push(timelock);
    deployedRegistries.push(registry);
    // Set admin for token contract
    HBEVM_token(token).setAdmin(timelock);
    // Grant roles to DAO
    TimelockController timelockController = TimelockController(payable(timelock));
    timelockController.grantRole(timelockController.PROPOSER_ROLE(), dao);
    timelockController.grantRole(timelockController.EXECUTOR_ROLE(), dao);

    // Batch-edit registry
    Registry(registry).batchEditRegistry(keys, values);
    }

}