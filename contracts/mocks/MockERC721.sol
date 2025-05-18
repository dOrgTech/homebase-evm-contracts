// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24; // Or ^0.8.24 if that's what Factories_W uses

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockERC721 is ERC721 {
    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
}