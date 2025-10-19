// contracts/RegistryFactory.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Registry.sol";

contract RegistryFactory {
    address[] public deployedRegistries;

    function deployRegistry(address timelockAddress, address wrapperAddress) external returns (address) {
        Registry registry = new Registry(timelockAddress, wrapperAddress);
        deployedRegistries.push(address(registry));
        return address(registry);
    }
}
// RegistryFactory.sol