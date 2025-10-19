// contracts/TimelockFactory.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/governance/TimelockController.sol";

contract TimelockFactory {
    address[] public deployedTimelocks;

    function deployTimelock(address admin, uint256 executionDelay) external returns (address) {
        address[] memory proposers;
        address[] memory executors;
        TimelockController timelock = new TimelockController(uint32(executionDelay), proposers, executors, admin);
        deployedTimelocks.push(address(timelock));
        return address(timelock);
    }
}
// TimelockFactory.sol