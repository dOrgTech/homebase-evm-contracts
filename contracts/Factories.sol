// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Token.sol";
import "./Registry.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "./Dao.sol";

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

function deployDAOwithToken(
    string memory name,
    string memory symbol,
    uint8 decimals,
    uint256 executionDelay,
    address[] memory initialMembers,
    uint256[] memory initialAmounts // This array will include both member amounts and settings
) public payable {
    // Ensure `initialAmounts` has the required length (members + 4 for settings)
    require(initialAmounts.length >= initialMembers.length + 4, "Insufficient settings data in initialAmounts array");

    // Deploy the token, passing `initialAmounts` directly
    address token = tokenFactory.deployToken(name, symbol, decimals, initialMembers, initialAmounts);

    // Deploy other contracts as before
    address timelock = timelockFactory.deployTimelock(address(this), executionDelay);
    address dao = daoFactory.deployDAO(token, timelock, name, initialAmounts);

    Registry reg = new Registry(dao);

    // Store deployed addresses
    deployedDAOs.push(dao);
    deployedTokens.push(address(token));
    deployedTimelocks.push(address(timelock));
    deployedRegistries.push(address(reg));

    // Grant roles and make DAO the admin as before
    HBEVM_token tokenContract = HBEVM_token(token);
    tokenContract.setAdmin(dao);
    TimelockController timelockController = TimelockController(payable(timelock));
    bytes32 proposerRole = timelockController.PROPOSER_ROLE();
    bytes32 executorRole = timelockController.EXECUTOR_ROLE();
    timelockController.grantRole(proposerRole, dao);
    timelockController.grantRole(executorRole, dao);
}


}
