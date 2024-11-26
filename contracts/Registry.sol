// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Registry {
    mapping (string => string) private reg;
    string[] private keys;
    address public owner;
    address public wrapper;

    modifier _onlyOwner() {
        require(msg.sender == owner || msg.sender==wrapper, "Only the DAO can edit registry");
        _;
    }

    constructor(address _owner, address _wrapper) {
        require(_owner != address(0), "Owner address cannot be zero");
        owner = _owner;
        wrapper=_wrapper;
    }

    function editRegistry(string memory key, string memory value) public _onlyOwner {
        if (bytes(reg[key]).length == 0) {
            keys.push(key); // Only add new keys
        }
        reg[key] = value;
    }
    
    function batchEditRegistry(string[] memory newKeys, string[] memory values) public _onlyOwner {
        for (uint256 i = 0; i < newKeys.length; i++) {
            string memory key = newKeys[i];
            string memory value = values[i];

            // Check if key already exists in reg
            if (bytes(reg[key]).length == 0) {
                keys.push(key);
            }

            // Update the value in reg mapping
            reg[key] = value;
        }
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
