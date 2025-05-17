// contracts/Token.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20; // Assuming this is the pragma from your original file
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";
// import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol"; // From original, not used
// import "@openzeppelin/contracts/access/Ownable.sol"; // From original, not used by HBEVM_token
// import "@openzeppelin/contracts/utils/Strings.sol"; // From original, not used
import {IAdminToken} from "./IAdminToken.sol"; // Added import
    
contract HBEVM_token is ERC20, ERC20Permit, ERC20Votes, IAdminToken { // Added IAdminToken
    uint8 private _decimals;
    address public admin; // 'public' makes getter automatically
    bool public isTransferable;
    bool private adminSet; // Matches your original variable declaration style

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        address[] memory initialMembers,
        uint256[] memory initialAmounts, // Original: HBEVM_token constructor uses the prefix of this for minting
        bool transferrable
    ) 
        ERC20(name, symbol)
        ERC20Permit(name) 
    {   
        _decimals = decimals_;
        isTransferable = transferrable;
        adminSet = false; 

        for (uint32 i = 0; i < initialMembers.length; i++) {
            // This loop correctly only uses the portion of initialAmounts corresponding to initialMembers
             _mint(initialMembers[i], initialAmounts[i]);
        }
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }

    // onlyOwner modifier if you plan to add mint/burn callable by admin
    modifier onlyOwner {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    // Optional: mint and burn functions if needed, guarded by admin
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    function clock() public view override returns (uint48) { // Added override
        return uint48(block.timestamp);
    }

    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }

    // Function to set the admin, callable only once
    function setAdmin(address newAdmin) public override { // Added override for IAdminToken
        require(admin == address(0), "Admin has already been set"); // Original logic
        require(newAdmin != address(0), "New admin address cannot be zero");
        admin = newAdmin;
        adminSet = true; // Assuming you want to track this
    }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }

    // Original transfer function logic
    function transfer(address recipient, uint256 amount) public override returns (bool) {
        require(isTransferable, "Transfers are currently disabled");
        return super.transfer(recipient, amount);
    }

    // Original transferFrom function logic
    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        require(isTransferable, "Transfers are currently disabled");
        return super.transferFrom(sender, recipient, amount);
    }
}
// Token.sol