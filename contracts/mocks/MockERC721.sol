// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

/**
 * @title MockERC721
 * @dev Mock NFT contract for testing purposes
 */
contract MockERC721 is ERC721, Ownable {
    uint256 private _nextTokenId = 1;

    constructor(string memory name, string memory symbol) 
        ERC721(name, symbol) 
        Ownable(msg.sender)
    {}

    /**
     * @dev Mint a new NFT to the specified address
     * @param to The address to mint the NFT to
     * @param tokenId The token ID to mint
     */
    function mint(address to, uint256 tokenId) public onlyOwner {
        _mint(to, tokenId);
    }

    /**
     * @dev Mint a new NFT to the specified address with auto-incrementing ID
     * @param to The address to mint the NFT to
     * @return tokenId The minted token ID
     */
    function safeMint(address to) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        return tokenId;
    }

    /**
     * @dev Batch mint NFTs to multiple addresses
     * @param recipients Array of addresses to mint NFTs to
     * @param tokenIds Array of token IDs to mint
     */
    function batchMint(address[] memory recipients, uint256[] memory tokenIds) public onlyOwner {
        require(recipients.length == tokenIds.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], tokenIds[i]);
        }
    }

    /**
     * @dev Burn an NFT
     * @param tokenId The token ID to burn
     */
    function burn(uint256 tokenId) public {
        require(_isAuthorized(ownerOf(tokenId), msg.sender, tokenId), "Not authorized to burn");
        _burn(tokenId);
    }

    /**
     * @dev Get the next token ID that will be minted
     * @return The next token ID
     */
    function getNextTokenId() public view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @dev Check if a token exists
     * @param tokenId The token ID to check
     * @return True if the token exists
     */
    function exists(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /**
     * @dev Get all token IDs owned by an address
     * @param owner The address to query
     * @return tokenIds Array of token IDs owned by the address
     */
    function tokensOfOwner(address owner) public view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        uint256 index = 0;
        
        for (uint256 tokenId = 1; tokenId < _nextTokenId && index < tokenCount; tokenId++) {
            if (_ownerOf(tokenId) == owner) {
                tokenIds[index] = tokenId;
                index++;
            }
        }
        
        return tokenIds;
    }

    /**
     * @dev Override tokenURI to provide metadata
     * @param tokenId The token ID to get URI for
     * @return The token URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 
            ? string(abi.encodePacked(baseURI, _toString(tokenId)))
            : "";
    }

    /**
     * @dev Internal function to get base URI
     * @return The base URI for token metadata
     */
    function _baseURI() internal pure override returns (string memory) {
        return "https://api.mockdao.org/nft/";
    }

    /**
     * @dev Convert uint256 to string
     * @param value The value to convert
     * @return The string representation
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
