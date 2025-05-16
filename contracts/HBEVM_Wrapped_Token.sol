// contracts/HBEVM_Wrapped_Token.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {ERC20Wrapper} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Wrapper.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";
import {IAdminToken} from "./IAdminToken.sol"; 

contract HBEVM_Wrapped_Token is ERC20, ERC20Permit, ERC20Votes, ERC20Wrapper, IAdminToken {
    address public override admin;
    bool private adminSet;

    constructor(
        IERC20 underlyingToken,
        string memory name_, 
        string memory symbol_ 
    )
        ERC20(name_, symbol_)
        ERC20Permit(name_) 
        ERC20Wrapper(underlyingToken)
    {
        adminSet = false;
    }

    // --- ERC20Votes requirements ---
    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp"; 
    }

    function clock() public view virtual override returns (uint48) {
        return uint48(block.timestamp); 
    }

    // --- Overrides required by Solidity due to multiple inheritance ---

    function decimals() public view override(ERC20, ERC20Wrapper) returns (uint8) {
        return super.decimals();
    }

    // Adjusted override list for _update to match the OZ example for this inheritance
    function _update(address from, address to, uint256 amount) 
        internal 
        override(ERC20, ERC20Votes) // As per the OpenZeppelin example for this inheritance structure
    {
        super._update(from, to, amount);
    }

    function nonces(address owner_) public view virtual override(ERC20Permit, Nonces) returns (uint256) { 
        return super.nonces(owner_);
    }

    // --- Admin functionality ---
    modifier onlyOwner {
        require(msg.sender == admin, "HBEVM_Wrapped_Token: caller is not the admin");
        _;
    }

    // Function to set the admin, callable only once
    function setAdmin(address newAdmin) public override {
        require(!adminSet, "HBEVM_Wrapped_Token: admin has already been set"); 
        require(newAdmin != address(0), "HBEVM_Wrapped_Token: new admin address cannot be zero");
        admin = newAdmin;
        adminSet = true;
    }
}
// HBEVM_Wrapped_Token.sol