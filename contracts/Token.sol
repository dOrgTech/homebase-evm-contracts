// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol"; 
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";


contract HBEVM_token is ERC20, ERC20Permit, ERC20Votes {

    constructor(string memory name, string memory symbol, address[] memory initialMembers, uint256[] memory initialAmounts) 
        ERC20(name, symbol)
        ERC20Permit(name) 
    {

        require (initialMembers.length == initialAmounts.length,"initialAmounts must be as many as initialMembers");
        for (uint32 i=0;i<initialMembers.length;i++){
            _mint(initialMembers[i],initialAmounts[i]);
        }
    }

    
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value); // Calls the next overridden function in the inheritance chain
    }

    modifier onlyOwner{
        _;
    }

    // Mint function with proper access control
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
    return super.nonces(owner);
    }
}