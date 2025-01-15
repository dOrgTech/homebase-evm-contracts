// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract MyNFT is ERC721, Ownable {
    using Strings for uint256;

    uint256 public constant TOTAL_SUPPLY = 7;
    uint256 public mintedCount;

    mapping(uint256 => string) private _tokenURIs;

    constructor() ERC721("MyNFT", "MNFT") Ownable(msg.sender) {
        // Mint all tokens to the contract owner
        for (uint256 i = 1; i <= TOTAL_SUPPLY; i++) {
            _safeMint(msg.sender, i);
            // _setTokenURI(i, string(abi.encodePacked("https://raw.githubusercontent.com/project-snooze/test/refs/heads/master/metadata/", i.toString(), ".json")));
            _setTokenURI(i, string(abi.encodePacked("https://raw.githubusercontent/metadata/", i.toString(), ".json")));
        }
        mintedCount = TOTAL_SUPPLY;
    }

    function _setTokenURI(uint256 tokenId, string memory uri) internal {
        require(_exists(tokenId), "ERC721Metadata: URI set of nonexistent token");
        _tokenURIs[tokenId] = uri;
    }

 

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}



contract HBEVM_token is ERC20, ERC20Permit, ERC20Votes {
    uint8 private _decimals;
    address public admin;
    bool public isTransferable;
    bool private adminSet;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        address[] memory initialMembers,
        uint256[] memory initialAmounts
    ) 
        ERC20(name, symbol)
        ERC20Permit(name) 
    {   
        _decimals = decimals_;
        isTransferable = false;
        adminSet = false;
        // require(initialMembers.length == initialAmounts.length, "Mismatched initial arrays");

        for (uint32 i = 0; i < initialMembers.length; i++) {
            _mint(initialMembers[i], initialAmounts[i]);
        }
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }

    modifier onlyOwner {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }

    // Function to set the admin, callable only once
    function setAdmin(address newAdmin) public {
        require(admin == address(0), "Admin has already been set");
        require(newAdmin != address(0), "New admin address cannot be zero");
        admin = newAdmin;
        adminSet = true;
    }

    // Explicitly override _update to resolve conflict between ERC20 and ERC20Votes
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    // Override the nonces function to resolve the conflict between ERC20Permit and Nonces
    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }

    // Override the transfer function to restrict based on isTransferable
    function transfer(address recipient, uint256 amount) public override returns (bool) {
        require(isTransferable, "Transfers are currently disabled");
        return super.transfer(recipient, amount);
    }

    // Override the transferFrom function to restrict based on isTransferable
    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        require(isTransferable, "Transfers are currently disabled");
        return super.transferFrom(sender, recipient, amount);
    }
}
