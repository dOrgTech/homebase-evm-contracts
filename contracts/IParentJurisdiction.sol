// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IParentJurisdiction Interface
 * @dev Defines the functions required for parent-child DAO interactions.
 */
interface IParentJurisdiction {
    /**
     * @dev Called by a child Jurisdiction to report a payment and accrue reputation
     * for its members in the parent DAO's context.
     */
    function accrueReputationFromChild(
        address[] calldata members,
        uint256[] calldata amounts,
        address paymentToken
    ) external;

    /**
     * @dev Returns the address of the implementing contract's Registry.
     * This is crucial for the parent to verify the child's identity.
     */
    function registryAddress() external view returns (address payable); // <-- CORRECTED to address payable
}