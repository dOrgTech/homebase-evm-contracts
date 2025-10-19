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
        uint256[] memory combinedInitialAmounts // <-- CHANGED to accept the full array
    ) external returns (address) {
        // --- NEW: Slicing logic is now inside the factory ---
        uint256[] memory memberAmounts = new uint256[](initialMembers.length);
        for(uint i = 0; i < initialMembers.length; i++) {
            // Assumes DAO settings are the first 4 elements, member amounts follow
            memberAmounts[i] = combinedInitialAmounts[4 + i]; 
        }

        Jurisdiction jurisdiction = new Jurisdiction(name, symbol, registryAddress, timelockAddress, initialMembers, memberAmounts);
        deployedJurisdictionTokens.push(address(jurisdiction));
        return address(jurisdiction);
    }
}
// JurisdictionFactory.sol