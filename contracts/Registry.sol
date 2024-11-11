// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Registry {
    mapping (string => string) private reg;
    string[] private keys;
    address public owner;

    modifier _onlyOwner() {
        require(msg.sender == owner, "Only the DAO can edit registry");
        _;
    }

    constructor(address _owner) {
        require(_owner != address(0), "Owner address cannot be zero");
        owner = _owner;
    }

    function editRegistry(string memory key, string memory value) public _onlyOwner {
        if (bytes(reg[key]).length == 0) {
            keys.push(key); // Only add new keys
        }
        reg[key] = value;
    }

    function getRegistryValue(string memory key) public view returns (string memory) {
        return reg[key];
    }

    function getAllKeys() public view returns (string[] memory) {
        return keys;
    }

    function getAllValues() public view returns (string[] memory) {
        string[] memory values = new string[](keys.length);
        for (uint i = 0; i < keys.length; i++) {
            values[i] = reg[keys[i]];
        }
        return values;
    }
}
