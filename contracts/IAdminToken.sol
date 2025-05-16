// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAdminToken {
    function setAdmin(address newAdmin) external;
    function admin() external view returns (address);
}
// IAdminToken.sol