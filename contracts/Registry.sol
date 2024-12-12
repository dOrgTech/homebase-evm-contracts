// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract Registry is IERC721Receiver, ReentrancyGuard {

    mapping (string => string) private reg;
    string[] private keys;
    address public owner;
    address public wrapper;

    modifier _treasuryOps(){
         require(msg.sender == owner , "Only the DAO can make transfers");
        _;
    }

    modifier _regedit() {
        require(msg.sender == owner || msg.sender==wrapper, "Only the DAO can edit registry");
        _;
    }

    event ReceivedETH(address indexed from, uint256 amount);
    event ReceivedERC721(address indexed from, address indexed token, uint256 tokenId);
    event TransferredETH(address indexed to, uint256 amount);
    event TransferredERC20(address indexed token, address indexed to, uint256 amount);
    event TransferredERC721(address indexed token, address indexed to, uint256 tokenId);

     receive() external payable {
        emit ReceivedETH(msg.sender, msg.value);
    }
     function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        // Silence unused parameter warnings
        operator; data;
        emit ReceivedERC721(from, msg.sender, tokenId);
        return this.onERC721Received.selector;
    }

    // Transfer ETH
    function transferETH(address payable to, uint256 amount) _treasuryOps external nonReentrant {
        require(address(this).balance >= amount, "Insufficient balance");
        uint256 initialBalance = address(this).balance;
        to.transfer(amount);
        require(address(this).balance == initialBalance - amount, "Transfer failed");
        emit TransferredETH(to, amount);
    }

    // Transfer ERC20 tokens
    function transferERC20(
        address token,
        address to,
        uint256 amount
    ) external _treasuryOps {
        bool success = IERC20(token).transfer(to, amount);
        require(success, "ERC20 transfer failed");
        emit TransferredERC20(token, to, amount);
    }

    // Transfer ERC721 tokens
    function transferERC721(
        address token,
        address to,
        uint256 tokenId
    ) external _treasuryOps {
        require(isERC721(token), "Token is not a valid ERC721");
        IERC721(token).safeTransferFrom(address(this), to, tokenId);
        emit TransferredERC721(token, to, tokenId);
    }

    function isERC721(address token) internal returns (bool) {
        try IERC721(token).safeTransferFrom(address(this), address(this), 0) {
            return true;
        } catch {
            return false;
        }
    }
    
    constructor(address _owner, address _wrapper) {
        require(_owner != address(0), "Owner address cannot be zero");
        owner = _owner;
        wrapper=_wrapper;
    }

    event RegistryUpdated(string  key, string  value);

    function editRegistry(string memory key, string memory value) public _regedit {
        if (bytes(reg[key]).length == 0) {
            keys.push(key); // Only add new keys
        }
        reg[key] = value;
        emit RegistryUpdated(key, value);
    }
    
    function batchEditRegistry(string[] memory newKeys, string[] memory values) public _regedit {
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
