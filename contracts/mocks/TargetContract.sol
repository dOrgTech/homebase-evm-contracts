// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/access/Ownable.sol";

contract TargetContract is Ownable {
    uint256 public value;
    event ValueChanged(uint256 newValue);

    constructor() Ownable(msg.sender) {} // Initial owner is deployer

    function setValue(uint256 _newValue) public onlyOwner { // Only current owner (Timelock) can call
        value = _newValue;
        emit ValueChanged(_newValue);
    }
}