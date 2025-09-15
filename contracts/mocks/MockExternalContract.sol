// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockExternalContract
 * @dev Mock external contract for testing DAO contract execution proposals
 */
contract MockExternalContract {
    uint256 public value;
    string public message;
    address public lastCaller;
    uint256 public callCount;
    mapping(address => uint256) public addressAmounts;
    address[] public addresses;
    
    event StateUpdated(uint256 newValue, string newMessage, address caller);
    event PaymentReceived(address sender, uint256 amount);
    event BatchUpdated(address[] addresses, uint256[] amounts);
    event FunctionCalled(string functionName, address caller);

    constructor() {
        value = 0;
        message = "";
        callCount = 0;
    }

    /**
     * @dev Update the contract state
     * @param newValue New value to set
     * @param newMessage New message to set
     */
    function updateState(uint256 newValue, string memory newMessage) public {
        value = newValue;
        message = newMessage;
        lastCaller = msg.sender;
        callCount++;
        
        emit StateUpdated(newValue, newMessage, msg.sender);
        emit FunctionCalled("updateState", msg.sender);
    }

    /**
     * @dev Increment the current value by 1
     */
    function incrementValue() public {
        value++;
        lastCaller = msg.sender;
        callCount++;
        
        emit FunctionCalled("incrementValue", msg.sender);
    }

    /**
     * @dev Decrement the current value by 1
     */
    function decrementValue() public {
        if (value > 0) {
            value--;
        }
        lastCaller = msg.sender;
        callCount++;
        
        emit FunctionCalled("decrementValue", msg.sender);
    }

    /**
     * @dev Receive ETH payment
     */
    function receivePayment() public payable {
        require(msg.value > 0, "Must send ETH");
        lastCaller = msg.sender;
        callCount++;
        
        emit PaymentReceived(msg.sender, msg.value);
        emit FunctionCalled("receivePayment", msg.sender);
    }

    /**
     * @dev Function that always fails for testing error handling
     */
    function failingFunction() public pure {
        revert("This function always fails");
    }

    /**
     * @dev Function that fails conditionally
     * @param shouldFail Whether the function should fail
     */
    function conditionalFailure(bool shouldFail) public {
        if (shouldFail) {
            revert("Conditional failure triggered");
        }
        
        emit FunctionCalled("conditionalFailure", msg.sender);
    }

    /**
     * @dev Batch update multiple addresses with amounts
     * @param _addresses Array of addresses to update
     * @param amounts Array of amounts corresponding to addresses
     */
    function batchUpdate(address[] memory _addresses, uint256[] memory amounts) public {
        require(_addresses.length == amounts.length, "Arrays length mismatch");
        
        // Clear previous data
        for (uint256 i = 0; i < addresses.length; i++) {
            delete addressAmounts[addresses[i]];
        }
        delete addresses;
        
        // Set new data
        for (uint256 i = 0; i < _addresses.length; i++) {
            addresses.push(_addresses[i]);
            addressAmounts[_addresses[i]] = amounts[i];
        }
        
        lastCaller = msg.sender;
        callCount++;
        
        emit BatchUpdated(_addresses, amounts);
        emit FunctionCalled("batchUpdate", msg.sender);
    }

    /**
     * @dev Reset all state to initial values
     */
    function reset() public {
        value = 0;
        message = "";
        lastCaller = address(0);
        callCount = 0;
        
        // Clear addresses mapping and array
        for (uint256 i = 0; i < addresses.length; i++) {
            delete addressAmounts[addresses[i]];
        }
        delete addresses;
        
        emit FunctionCalled("reset", msg.sender);
    }

    /**
     * @dev Get the number of addresses in the batch
     * @return The count of addresses
     */
    function getAddressCount() public view returns (uint256) {
        return addresses.length;
    }

    /**
     * @dev Get address at specific index
     * @param index The index to query
     * @return The address at the given index
     */
    function getAddressAtIndex(uint256 index) public view returns (address) {
        require(index < addresses.length, "Index out of bounds");
        return addresses[index];
    }

    /**
     * @dev Get amount for a specific address
     * @param addr The address to query
     * @return The amount associated with the address
     */
    function getAmountForAddress(address addr) public view returns (uint256) {
        return addressAmounts[addr];
    }

    /**
     * @dev Get all addresses and their amounts
     * @return _addresses Array of all addresses
     * @return amounts Array of amounts corresponding to addresses
     */
    function getAllData() public view returns (address[] memory _addresses, uint256[] memory amounts) {
        _addresses = new address[](addresses.length);
        amounts = new uint256[](addresses.length);
        
        for (uint256 i = 0; i < addresses.length; i++) {
            _addresses[i] = addresses[i];
            amounts[i] = addressAmounts[addresses[i]];
        }
        
        return (_addresses, amounts);
    }

    /**
     * @dev Get contract balance
     * @return The ETH balance of this contract
     */
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Withdraw ETH from contract (only for testing)
     * @param to Address to send ETH to
     * @param amount Amount of ETH to withdraw
     */
    function withdraw(address payable to, uint256 amount) public {
        require(address(this).balance >= amount, "Insufficient balance");
        to.transfer(amount);
        
        emit FunctionCalled("withdraw", msg.sender);
    }

    /**
     * @dev Function to test complex parameter encoding
     * @param numbers Array of numbers
     * @param text String parameter
     * @param flag Boolean parameter
     */
    function complexParameters(
        uint256[] memory numbers,
        string memory text,
        bool flag
    ) public {
        if (flag) {
            value = numbers.length > 0 ? numbers[0] : 0;
            message = text;
        }
        
        lastCaller = msg.sender;
        callCount++;
        
        emit FunctionCalled("complexParameters", msg.sender);
    }

    /**
     * @dev Fallback function to receive ETH
     */
    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value);
    }

    /**
     * @dev Fallback function for unknown function calls
     */
    fallback() external payable {
        emit FunctionCalled("fallback", msg.sender);
    }
}
