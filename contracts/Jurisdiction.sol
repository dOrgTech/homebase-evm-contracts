// contracts/Jurisdiction.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";
import {IAdminToken} from "./IAdminToken.sol";
import {Registry} from "./Registry.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import {Checkpoints} from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import {IParentJurisdiction} from "./IParentJurisdiction.sol";
import {IJurisdictionData} from "./IJurisdictionData.sol"; // <-- ADDED IMPORT

contract Jurisdiction is ERC20, ERC20Permit, ERC20Votes, IAdminToken, IParentJurisdiction, IJurisdictionData { // <-- ADDED IJurisdictionData
    using Checkpoints for Checkpoints.Trace208;

    address public admin;
    bool private adminSet;
    bool public constant isTransferable = false;

    address payable public override immutable registryAddress;
    address public immutable timelockAddress;

    mapping(address => uint256) public reputationOwed;
    
    mapping(address => Checkpoints.Trace208) private _balanceHistory;

    struct RewardEpoch {
        uint256 budget;
        address paymentToken;
        uint48 startTimestamp;
    }

    uint256 public currentPassiveIncomeEpoch;
    mapping(uint256 => RewardEpoch) public passiveIncomeEpochs;
    mapping(uint256 => mapping(address => bool)) public hasClaimedPassiveIncome;

    uint256 public currentDelegateRewardEpoch;
    mapping(uint256 => RewardEpoch) public delegateRewardEpochs;
    mapping(uint256 => mapping(address => bool)) public hasClaimedDelegateReward;

    event ReputationAccrued(address indexed member, uint256 amount);
    event ReputationClaimed(address indexed member, uint256 amount);
    event NewPassiveIncomeEpoch(uint256 indexed epochId, uint256 budget, address indexed paymentToken);
    event PassiveIncomeClaimed(address indexed member, uint256 indexed epochId, uint256 amount);
    event NewDelegateRewardEpoch(uint256 indexed epochId, uint256 budget, address indexed paymentToken);
    event DelegateRewardClaimed(address indexed delegate, uint256 indexed epochId, uint256 amount);
    
    constructor(
        string memory name,
        string memory symbol,
        address payable _registryAddress,
        address _timelockAddress,
        address[] memory initialMembers,
        uint256[] memory initialAmounts
    )
        ERC20(name, symbol)
        ERC20Permit(name)
    {
        require(_registryAddress != address(0) && _timelockAddress != address(0), "Jurisdiction: Invalid addresses");
        registryAddress = _registryAddress;
        timelockAddress = _timelockAddress;
        adminSet = false;

        for (uint i = 0; i < initialMembers.length; i++) {
            _mint(initialMembers[i], initialAmounts[i]);
        }
    }

    // --- REPUTATION ACCRUAL LOGIC ---

    function accrueReputation(address[] calldata members, uint256[] calldata amounts, address paymentToken) external {
        require(msg.sender == timelockAddress, "Jurisdiction: Only Timelock can accrue");
        _accrueReputation(members, amounts, paymentToken);
    }

    function accrueAndForwardReputation(address[] calldata members, uint256[] calldata amounts, address paymentToken) external {
        require(msg.sender == timelockAddress, "Jurisdiction: Only Timelock can accrue");
        _accrueReputation(members, amounts, paymentToken);
        
        forwardReputationToParent(members, amounts, paymentToken);
    }

    function accrueReputationFromChild(
        address[] calldata members,
        uint256[] calldata amounts,
        address paymentToken
    ) external override {
        address childJurisdictionAddress = msg.sender;
        address payable childRegistryAddress = IParentJurisdiction(childJurisdictionAddress).registryAddress();
        string memory childRegistryKey = string.concat("child.registry.", Strings.toHexString(uint256(uint160(address(childRegistryAddress)))));
        string memory isRecognized = Registry(registryAddress).getRegistryValue(childRegistryKey);
        require(bytes(isRecognized).length > 0, "Jurisdiction: Caller is not a recognized child DAO");

        _accrueReputation(members, amounts, paymentToken);
    }

    function _accrueReputation(address[] calldata members, uint256[] calldata amounts, address paymentToken) internal {
        require(members.length == amounts.length, "Jurisdiction: Array lengths must match");

        string memory parityKey = string.concat("jurisdiction.parity.", Strings.toHexString(paymentToken));
        string memory parityStr = Registry(registryAddress).getRegistryValue(parityKey);
        uint256 parity = Strings.parseUint(parityStr);
        require(parity > 0, "Jurisdiction: Parity not set or invalid for token");

        for (uint i = 0; i < members.length; i++) {
            uint256 reputationToAccrue = amounts[i] * parity;
            if (reputationToAccrue > 0) {
                reputationOwed[members[i]] += reputationToAccrue;
                emit ReputationAccrued(members[i], reputationToAccrue);
            }
        }
    }

    function forwardReputationToParent(address[] calldata members, uint256[] calldata amounts, address paymentToken) internal {
        string memory parentRegistryStr = Registry(registryAddress).getRegistryValue("parent.registry");
        if (bytes(parentRegistryStr).length > 0) {
            address payable parentRegistryAddress = payable(address(uint160(Strings.parseUint(parentRegistryStr))));
            if (parentRegistryAddress != address(0)) {
                address parentJurisdictionAddress = Registry(parentRegistryAddress).jurisdictionAddress();
                if (parentJurisdictionAddress != address(0)) {
                    try IParentJurisdiction(parentJurisdictionAddress).accrueReputationFromChild(members, amounts, paymentToken) {} catch {}
                }
            }
        }
    }
    
    // --- END ACCRUAL LOGIC ---

    function claimOwedReputation() external {
        uint256 amountToClaim = reputationOwed[msg.sender];
        require(amountToClaim > 0, "Jurisdiction: No reputation owed");

        reputationOwed[msg.sender] = 0;
        _mint(msg.sender, amountToClaim);
        emit ReputationClaimed(msg.sender, amountToClaim);
    }

    function startNewPassiveIncomeEpoch(uint256 budget, address paymentToken) external {
        require(msg.sender == timelockAddress, "Jurisdiction: Only Timelock can start an epoch");
        currentPassiveIncomeEpoch++;
        passiveIncomeEpochs[currentPassiveIncomeEpoch] = RewardEpoch({
            budget: budget,
            paymentToken: paymentToken,
            startTimestamp: clock()
        });
        emit NewPassiveIncomeEpoch(currentPassiveIncomeEpoch, budget, paymentToken);
    }

    function startNewDelegateRewardEpoch(uint256 budget, address paymentToken) external {
        require(msg.sender == timelockAddress, "Jurisdiction: Only Timelock can start an epoch");
        currentDelegateRewardEpoch++;
        delegateRewardEpochs[currentDelegateRewardEpoch] = RewardEpoch({
            budget: budget,
            paymentToken: paymentToken,
            startTimestamp: clock()
        });
        emit NewDelegateRewardEpoch(currentDelegateRewardEpoch, budget, paymentToken);
    }

    function claimPassiveIncome(uint256 epochId) external {
        RewardEpoch storage epoch = passiveIncomeEpochs[epochId];
        require(epochId > 0 && epochId <= currentPassiveIncomeEpoch, "Jurisdiction: Invalid epoch ID");
        require(epoch.startTimestamp > 0, "Jurisdiction: Epoch does not exist");
        require(!hasClaimedPassiveIncome[epochId][msg.sender], "Jurisdiction: Already claimed for this epoch");
        uint256 snapshotTime = epoch.startTimestamp - 1;
        uint256 userReputation = _getPastBalance(msg.sender, snapshotTime);
        require(userReputation > 0, "Jurisdiction: No reputation at epoch start");
        uint256 totalReputation = getPastTotalSupply(snapshotTime);
        require(totalReputation > 0, "Jurisdiction: Zero total supply at epoch start");
        uint256 rewardAmount = (userReputation * epoch.budget) / totalReputation;
        require(rewardAmount > 0, "Jurisdiction: Reward amount is zero");
        hasClaimedPassiveIncome[epochId][msg.sender] = true;
        bytes32 purpose = keccak256(abi.encodePacked("PASSIVE_INCOME", epochId, epoch.paymentToken));
        Registry(registryAddress).disburseEarmarked(msg.sender, rewardAmount, purpose, epoch.paymentToken);
        emit PassiveIncomeClaimed(msg.sender, epochId, rewardAmount);
    }

    function claimRepresentationReward(uint256 epochId) external {
        RewardEpoch storage epoch = delegateRewardEpochs[epochId];
        require(epochId > 0 && epochId <= currentDelegateRewardEpoch, "Jurisdiction: Invalid epoch ID");
        require(epoch.startTimestamp > 0, "Jurisdiction: Epoch does not exist");
        require(!hasClaimedDelegateReward[epochId][msg.sender], "Jurisdiction: Already claimed for this epoch");
        uint256 snapshotTime = epoch.startTimestamp - 1;
        uint256 totalVotingPower = getPastVotes(msg.sender, snapshotTime);
        uint256 ownPastBalance = _getPastBalance(msg.sender, snapshotTime);
        require(totalVotingPower > ownPastBalance, "Jurisdiction: No delegated votes at epoch start");
        uint256 delegatedVotes = totalVotingPower - ownPastBalance;
        uint256 totalReputation = getPastTotalSupply(snapshotTime);
        require(totalReputation > 0, "Jurisdiction: Zero total supply at epoch start");
        uint256 rewardAmount = (delegatedVotes * epoch.budget) / totalReputation;
        require(rewardAmount > 0, "Jurisdiction: Reward amount is zero");
        hasClaimedDelegateReward[epochId][msg.sender] = true;
        bytes32 purpose = keccak256(abi.encodePacked("DELEGATE_REWARD", epochId, epoch.paymentToken));
        Registry(registryAddress).disburseEarmarked(msg.sender, rewardAmount, purpose, epoch.paymentToken);
        emit DelegateRewardClaimed(msg.sender, epochId, rewardAmount);
    }

    // --- START: NEW GETTER FUNCTIONS ---
    function getPassiveIncomeEpochStart(uint256 epochId) external view override returns (uint48) {
        return passiveIncomeEpochs[epochId].startTimestamp;
    }

    function getDelegateRewardEpochStart(uint256 epochId) external view override returns (uint48) {
        return delegateRewardEpochs[epochId].startTimestamp;
    }
    // --- END: NEW GETTER FUNCTIONS ---

    function getPastBalance(address account, uint256 timepoint) public view returns (uint256) {
        return _getPastBalance(account, timepoint);
    }

    function _getPastBalance(address account, uint256 timepoint) internal view returns (uint256) {
        require(timepoint <= type(uint48).max, "Jurisdiction: timepoint exceeds uint48 range");
        return _balanceHistory[account].upperLookup(uint48(timepoint));
    }

    function decimals() public pure override returns (uint8) { return 18; }
    function CLOCK_MODE() public pure override returns (string memory) { return "mode=timestamp"; }
    function clock() public view override returns (uint48) { return uint48(block.timestamp); }

    function setAdmin(address newAdmin) public override {
        require(!adminSet, "Admin has already been set");
        admin = newAdmin;
        adminSet = true;
    }

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
        uint48 timestamp = clock();
        if (from != address(0)) {
            _balanceHistory[from].push(timestamp, uint208(balanceOf(from)));
        }
        if (to != address(0)) {
            _balanceHistory[to].push(timestamp, uint208(balanceOf(to)));
        }
    }
    
    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) { return super.nonces(owner); }
    function transfer(address, uint256) public pure override returns (bool) { revert("Jurisdiction: Reputation is non-transferable"); }
    function transferFrom(address, address, uint256) public pure override returns (bool) { revert("Jurisdiction: Reputation is non-transferable"); }
}
// Jurisdiction.sol