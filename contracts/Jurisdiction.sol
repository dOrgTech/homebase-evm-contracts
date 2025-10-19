// contracts/Jurisdiction.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";
import {IAdminToken} from "./IAdminToken.sol";
import {Registry} from "./Registry.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Jurisdiction is ERC20, ERC20Permit, ERC20Votes, IAdminToken {
    address public admin;
    bool private adminSet;
    bool public constant isTransferable = false;

    address payable public immutable registryAddress; // <-- FIXED
    address public immutable timelockAddress;

    mapping(bytes32 => bool) public authorizedPayments;
    mapping(bytes32 => bool) public claimedPayments;

    event PaymentAuthorized(bytes32 indexed paymentId);
    event ReputationClaimed(address indexed payee, bytes32 indexed paymentId, uint256 amount);
    
    constructor(
        string memory name,
        string memory symbol,
        address payable _registryAddress, // <-- FIXED
        address _timelockAddress,
        address[] memory initialMembers,
        uint256[] memory initialAmounts
    )
        ERC20(name, symbol)
        ERC20Permit(name)
    {
        require(_registryAddress != address(0) && _timelockAddress != address(0), "Jurisdiction: Invalid addresses");
        registryAddress = _registryAddress;
        timelockAddress = _timelockAddress;
        adminSet = false;

        for (uint i = 0; i < initialMembers.length; i++) {
            _mint(initialMembers[i], initialAmounts[i]);
        }
    }

    function authorizePayments(bytes32[] calldata paymentIds) external {
        require(msg.sender == timelockAddress, "Jurisdiction: Only Timelock can authorize");
        for (uint i = 0; i < paymentIds.length; i++) {
            authorizedPayments[paymentIds[i]] = true;
            emit PaymentAuthorized(paymentIds[i]);
        }
    }

    function claimReputation(bytes32 paymentId, address payee, uint256 amount, address paymentToken) external {
        require(msg.sender == payee, "Jurisdiction: Only the payee can claim");
        require(authorizedPayments[paymentId], "Jurisdiction: Payment not authorized");
        require(!claimedPayments[paymentId], "Jurisdiction: Reputation already claimed");

        string memory parityKey = string.concat("jurisdiction.parity.", Strings.toHexString(paymentToken));
        string memory parityStr = Registry(registryAddress).getRegistryValue(parityKey); // <-- THIS CALL IS NOW VALID
        uint256 parity = Strings.parseUint(parityStr);
        require(parity > 0, "Jurisdiction: Parity not set or invalid for token");
        
        claimedPayments[paymentId] = true;

        uint256 reputationToMint = amount * parity;
        _mint(payee, reputationToMint);
        emit ReputationClaimed(payee, paymentId, reputationToMint);
    }

    function decimals() public pure override returns (uint8) { return 18; }
    function CLOCK_MODE() public pure override returns (string memory) { return "mode=timestamp"; }
    function clock() public view override returns (uint48) { return uint48(block.timestamp); }

    function setAdmin(address newAdmin) public override {
        require(!adminSet, "Admin has already been set");
        admin = newAdmin;
        adminSet = true;
    }

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) { super._update(from, to, value); }
    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) { return super.nonces(owner); }
    function transfer(address, uint256) public pure override returns (bool) { revert("Jurisdiction: Reputation is non-transferable"); }
    function transferFrom(address, address, uint256) public pure override returns (bool) { revert("Jurisdiction: Reputation is non-transferable"); }
}
// Jurisdiction.sol