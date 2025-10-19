// contracts/factories/TokenFactory.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../Token.sol";

contract TokenFactory {
    address[] public deployedTokens;

    function deployToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        address[] memory initialMembers,
        uint256[] memory combinedInitialAmounts,
        bool transferrable
    ) external returns (address) {
        HBEVM_token token = new HBEVM_token(name, symbol, decimals, initialMembers, combinedInitialAmounts, transferrable);
        deployedTokens.push(address(token));
        return address(token);
    }
}
// TokenFactory.sol