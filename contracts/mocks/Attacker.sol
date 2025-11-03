// contracts/mocks/Attacker.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IParentJurisdiction {
    function accrueReputationFromChild(
        address[] calldata members,
        uint256[] calldata amounts,
        address paymentToken
    ) external;
}

contract Attacker {
    function attack(
        address targetJurisdiction,
        address[] calldata members,
        uint256[] calldata amounts,
        address paymentToken
    ) external {
        IParentJurisdiction(targetJurisdiction).accrueReputationFromChild(members, amounts, paymentToken);
    }
}
// contracts/mocks/Attacker.sol