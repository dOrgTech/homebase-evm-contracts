// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/governance/utils/IVotes.sol";

contract IncentivizedGovernor is Governor, GovernorCountingSimple, GovernorVotes, GovernorVotesQuorumFraction {
    IERC20 public paymentToken;   // The token used for rewards
    uint256 public lastRewardTime;  // Last time rewards were calculated
    uint256 public rewardInterval = 30 days; // Monthly reward period
    mapping(address => uint256) public delegateRewards;  // Track accumulated rewards for each delegate
    mapping(address => uint256) public delegateLastSnapshot;  // Last snapshot of voting power for each delegate
    IVotes govToken;
    constructor(IVotes _token, IERC20 _paymentToken)
        Governor("IncentivizedGovernor")
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4) 
    {
        paymentToken = _paymentToken;
        govToken=IVotes(_token);
        lastRewardTime = block.timestamp;
    }

    // Override functions for voting delay, period, and proposal threshold
    function votingDelay() public pure override returns (uint256) {
        return 1 days;
    }

    function votingPeriod() public pure override returns (uint256) {
        return 1 weeks;
    }

    function proposalThreshold() public pure override returns (uint256) {
        return 0;
    }

    // Allow delegates to claim rewards based on their voting power
    function claimRewards() public {
        require(block.timestamp >= lastRewardTime + rewardInterval, "Reward interval has not passed yet");

        // Calculate the voting power of the delegate over the last month
        uint256 delegateVotingPower = getVotes(msg.sender, block.number - 1); // voting power at previous block

        // Calculate the total token amount held in the treasury (assuming the treasury holds the payment token)
        uint256 treasuryBalance = paymentToken.balanceOf(address(this));

        // Calculate the delegate's share of the rewards
        uint256 rewardShare = (delegateVotingPower * treasuryBalance) / totalSupply(); // reward proportional to voting power

        // Update delegate's reward balance
        delegateRewards[msg.sender] += rewardShare;

        // Update the last reward calculation time
        lastRewardTime = block.timestamp;
    }

    // Allow the delegate to withdraw their rewards
    function withdrawRewards() public {
        uint256 rewardAmount = delegateRewards[msg.sender];
        require(rewardAmount > 0, "No rewards to withdraw");

        // Reset the delegate's reward balance
        delegateRewards[msg.sender] = 0;

        // Transfer the reward to the delegate
        paymentToken.transfer(msg.sender, rewardAmount);
    }

    // Helper function to set a new payment token via a governance proposal
    function setPaymentToken(IERC20 _newPaymentToken) public onlyGovernance {
        paymentToken = _newPaymentToken;
    }

    // Calculate total supply of voting power in the system (based on the voting token)
    function totalSupply() public view returns (uint256) {
        return IVotes(govToken).getPastTotalSupply(block.number - 1); // retrieve total voting supply
    }
}
