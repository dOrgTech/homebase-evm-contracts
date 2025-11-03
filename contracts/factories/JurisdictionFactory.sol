// contracts/factories/JurisdictionFactory.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../Jurisdiction.sol";

contract JurisdictionFactory {
    address[] public deployedJurisdictionTokens;
    
    function deployJurisdictionToken(
        string memory name,
        string memory symbol,
        address payable registryAddress,
        address timelockAddress,
        address[] memory initialMembers,
        uint256[] memory initialAmounts
    ) external returns (address) {
        require(initialMembers.length == initialAmounts.length, "JurisdictionFactory: member and amount arrays must have the same length");

        Jurisdiction jurisdiction = new Jurisdiction(name, symbol, registryAddress, timelockAddress, initialMembers, initialAmounts);
        deployedJurisdictionTokens.push(address(jurisdiction));
        return address(jurisdiction);
    }
}
// contracts/factories/JurisdictionFactory.sol