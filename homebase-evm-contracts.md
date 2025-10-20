# Folder Structure

- homebase-evm-contracts/
  - contracts/
    - DAOFactory.sol
    - Dao.sol
    - Factories.sol
    - Factories_W.sol
    - HBEVM_Wrapped_Token.sol
    - IAdminToken.sol
    - Jurisdiction.sol
    - Registry.sol
    - RegistryFactory.sol
    - Settings.sol
    - TimelockFactory.sol
    - Token.sol
    - remix.config.json
    - factories/
      - DAOFactory.sol
      - InfrastructureFactory.sol
      - JurisdictionFactory.sol
      - TokenFactory.sol
    - mocks/
      - MockERC20.sol
      - MockERC721.sol
      - MockFactories.sol
      - ReentrantAttacker.sol
      - TargetContract.sol

# File Contents

### `contracts/DAOFactory.sol`
```sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Dao.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";

contract DAOFactory {
    address[] public deployedDAOs;

    function deployDAO(
        address tokenAddress,
        address timelockAddress,
        string memory name,
        uint[] memory daoSettings
    ) external returns (address) {
        require(daoSettings.length >= 4, "DAO settings requires 4 elements");
        uint48 minsDelay = uint48(daoSettings[0]);
        uint32 minsVoting = uint32(daoSettings[1]);
        uint256 pThreshold = daoSettings[2];
        uint8 qvrm = uint8(daoSettings[3]);
        
        HomebaseDAO dao = new HomebaseDAO(
            IVotes(tokenAddress),
            TimelockController(payable(timelockAddress)),
            name,
            minsDelay,
            minsVoting,
            pThreshold,
            qvrm
        );
        deployedDAOs.push(address(dao));
        return address(dao);
    }
}
// DAOFactory.sol
```

### `contracts/Dao.sol`
```sol
// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

contract HomebaseDAO is Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes, GovernorVotesQuorumFraction, GovernorTimelockControl {
constructor(
        IVotes _token,
        TimelockController _timelock,
        string memory name,
        uint48 minsDelay,
        uint32 minsVoting,
        uint256 pThreshold,
        uint8 qvrm
    )
        Governor(name)
        GovernorSettings(minsDelay * 1 minutes, minsVoting * 1 minutes, pThreshold) 
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(qvrm)
        GovernorTimelockControl(_timelock)
    {}

    function votingDelay()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function _queueOperations(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(Governor, GovernorTimelockControl)
        returns (uint48)
    {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(Governor, GovernorTimelockControl)
    {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(Governor, GovernorTimelockControl)
        returns (uint256)
    {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }
}

```

### `contracts/Factories.sol`
```sol
// contracts/Factories.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAdminToken} from "./IAdminToken.sol";
import {Registry} from "./Registry.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";

// Interfaces to the single-purpose factory contracts
interface IDAOFactory {
    function deployDAO(address tokenAddress, address timelockAddress, string memory name, uint[] memory daoSettings) external returns (address);
}
interface ITokenFactory {
    function deployToken(string memory name, string memory symbol, uint8 decimals, address[] memory initialMembers, uint256[] memory combinedInitialAmounts, bool transferrable) external returns (address);
}
interface IJurisdictionFactory {
    function deployJurisdictionToken(string memory name, string memory symbol, address payable registryAddress, address timelockAddress, address[] memory initialMembers, uint256[] memory combinedInitialAmounts) external returns (address);
}
interface IInfrastructureFactory {
    function deployTimelock(address admin, uint256 executionDelay) external returns (address);
    function deployRegistry(address timelockAddress, address wrapperAddress) external returns (address);
}

contract WrapperContract {
    IDAOFactory           public immutable daoFactory;
    ITokenFactory         public immutable tokenFactory;
    IJurisdictionFactory  public immutable jurisdictionFactory;
    IInfrastructureFactory public immutable infrastructureFactory;

    uint256 public nextDeploymentId;
    struct PendingDeployment {
        address token;
        address timelock;
        address registry;
        bool isJurisdiction;
    }
    mapping(uint256 => PendingDeployment) public pendingDeployments;

    address[] public deployedDAOs;
    address[] public deployedTokens;
    address[] public deployedTimelocks;
    address[] public deployedRegistries;

    constructor(
        address _daoFactory,
        address _tokenFactory,
        address _jurisdictionFactory,
        address _infrastructureFactory
    ) {
        daoFactory = IDAOFactory(_daoFactory);
        tokenFactory = ITokenFactory(_tokenFactory);
        jurisdictionFactory = IJurisdictionFactory(_jurisdictionFactory);
        infrastructureFactory = IInfrastructureFactory(_infrastructureFactory);
    }

    event NewDaoCreated( 
        address indexed dao,
        address token,
        address[] initialMembers,
        uint256[] initialAmounts, 
        string name,
        string symbol,
        string description,
        uint256 executionDelay,
        address registry,
        string[] keys,
        string[] values
    );

    struct DaoParams {
        string name;
        string symbol;
        string description;
        uint8 decimals;
        uint256 executionDelay;
        address[] initialMembers;
        uint256[] initialAmounts; 
        string[] keys;
        string[] values;
        bool transferrable;
        bool isJurisdiction;
    }

    function prepareDeployment(DaoParams memory params) public payable returns (uint256 deploymentId) {
        deploymentId = nextDeploymentId++;
        
        address token;
        address timelock = infrastructureFactory.deployTimelock(address(this), params.executionDelay);
        address registry = infrastructureFactory.deployRegistry(timelock, address(this));

        if (params.isJurisdiction) {
            token = jurisdictionFactory.deployJurisdictionToken(params.name, params.symbol, payable(registry), timelock, params.initialMembers, params.initialAmounts);
        } else {
            token = tokenFactory.deployToken(params.name, params.symbol, params.decimals, params.initialMembers, params.initialAmounts, params.transferrable);
        }

        pendingDeployments[deploymentId] = PendingDeployment({
            token: token,
            timelock: timelock,
            registry: registry,
            isJurisdiction: params.isJurisdiction
        });
        
        return deploymentId; // <-- THE MISSING, CRITICAL RETURN STATEMENT
    }

    function finalizeDeployment(uint256 deploymentId, DaoParams memory params) public {
        PendingDeployment memory pending = pendingDeployments[deploymentId];
        require(pending.token != address(0), "Invalid or completed deploymentId");

        uint[] memory daoSettings;
        if (pending.isJurisdiction) {
            require(params.initialAmounts.length >= 4, "Jurisdiction DAO settings requires 4 elements");
            daoSettings = new uint[](4);
            for(uint i=0; i < 4; i++){
                daoSettings[i] = params.initialAmounts[i];
            }
        } else {
            require(params.initialAmounts.length >= params.initialMembers.length + 4, "Insufficient legacy settings");
            daoSettings = new uint[](params.initialAmounts.length - params.initialMembers.length);
            for(uint i = 0; i < daoSettings.length; i++) {
                daoSettings[i] = params.initialAmounts[params.initialMembers.length + i];
            }
        }
        
        address dao = daoFactory.deployDAO(pending.token, pending.timelock, params.name, daoSettings);

        _finalize(dao, pending.token, pending.timelock, payable(pending.registry), params.keys, params.values);
        IAdminToken(pending.token).setAdmin(pending.timelock);

        if (pending.isJurisdiction) {
            Registry(payable(pending.registry)).setJurisdictionAddress(pending.token);
        }
        
        emit NewDaoCreated(dao, pending.token, params.initialMembers, params.initialAmounts, params.name, params.symbol, params.description, params.executionDelay, pending.registry, params.keys, params.values);
        delete pendingDeployments[deploymentId];
    }

    function _finalize(address dao, address token, address timelock, address payable registry, string[] memory keys, string[] memory values) internal {
        deployedDAOs.push(dao);
        deployedTokens.push(token);
        deployedTimelocks.push(timelock);
        deployedRegistries.push(registry);
        
        TimelockController timelockController = TimelockController(payable(timelock));
        timelockController.grantRole(timelockController.PROPOSER_ROLE(), dao);
        timelockController.grantRole(timelockController.EXECUTOR_ROLE(), dao);

        if (keys.length > 0) {
            Registry(registry).batchEditRegistry(keys, values);
        }
    }
}
// Factories.sol
```

### `contracts/Factories_W.sol`
```sol
// contracts/Factories_W.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24; 

// Imports
import "./Dao.sol"; 
import "./Registry.sol"; 
import "./HBEVM_Wrapped_Token.sol"; 
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {IAdminToken} from "./IAdminToken.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Interfaces for Factories
interface ITokenFactory {
    function deployWrappedToken(
        IERC20 underlyingToken,
        string memory wrappedTokenName, // Will be same as daoName
        string memory wrappedTokenSymbol
    ) external returns (address);
}

interface ITimelockFactory {
    function deployTimelock(address admin, uint256 executionDelay) external returns (address);
}

interface IDAOFactory {
    function deployDAO( 
        address tokenAddress,
        address timelockAddress,
        string memory name, // DAO Name
        uint[] memory daoSettingsArray 
    ) external returns (address);
}

contract WrapperContract_W {
    ITokenFactory tokenFactory;
    ITimelockFactory timelockFactory;
    IDAOFactory daoFactory;

    address[] public deployedDAOs_W; 
    address[] public deployedTokens_W; 
    address[] public deployedTimelocks_W;
    address[] public deployedRegistries_W;

    event DaoWrappedDeploymentInfo( 
        address indexed daoAddress,
        address indexed wrappedTokenAddress,
        address registryAddress,
        string daoName,         // Used for DAO and Wrapped Token Name
        string wrappedTokenSymbol, // Still need symbol for wrapped token
        string description,
        uint8 quorumFraction    // ADDED (DAO Setting)
        // Other DAO settings (voting delay, period, threshold) can be fetched
    );

    struct DaoParamsWrapped {
        string daoName;
        string wrappedTokenSymbol;      
        string description;             
        uint256 executionDelay;         
        address underlyingTokenAddress; 
        uint48 minsVotingDelay;         
        uint32 minsVotingPeriod;        
        uint256 proposalThreshold;      
        uint8 quorumFraction;           // Will be emitted
        string[] keys;                  
        string[] values;                
    }

    constructor(
        address _tokenFactory,
        address _timelockFactory,
        address _daoFactory
    ) {
        tokenFactory = ITokenFactory(_tokenFactory);
        timelockFactory = ITimelockFactory(_timelockFactory);
        daoFactory = IDAOFactory(_daoFactory);
    }

    function getNumberOfDAOs_W() public view returns (uint) {
        return deployedDAOs_W.length;
    }

    function deployDAOwithWrappedToken(DaoParamsWrapped memory params) public payable {
        // Use params.daoName for wrappedTokenName
        address wrappedToken = tokenFactory.deployWrappedToken(
            IERC20(params.underlyingTokenAddress), params.daoName, params.wrappedTokenSymbol
        );
        address timelock = timelockFactory.deployTimelock(address(this), params.executionDelay);

        uint256[] memory daoSettingsArray = new uint256[](4);
        daoSettingsArray[0] = params.minsVotingDelay;
        daoSettingsArray[1] = params.minsVotingPeriod;
        daoSettingsArray[2] = params.proposalThreshold;
        daoSettingsArray[3] = params.quorumFraction;

        // DAO is deployed with params.daoName
        address dao = daoFactory.deployDAO(wrappedToken, timelock, params.daoName, daoSettingsArray);
        
        Registry reg = new Registry(timelock, address(this)); 
        address payable registryAddress = payable(address(reg));

        _finalizeDeployment_W(dao, wrappedToken, timelock, registryAddress, params.keys, params.values);

        emit DaoWrappedDeploymentInfo(
            dao, 
            wrappedToken, 
            registryAddress,
            params.daoName, // Used for both DAO and (implicitly) wrapped token name
            params.wrappedTokenSymbol,
            params.description,
            params.quorumFraction // Emitting quorumFraction
        );
    }

    function _finalizeDeployment_W(
        address dao,
        address token, 
        address timelock,
        address payable registry,
        string[] memory keys,
        string[] memory values
    ) internal {
        deployedDAOs_W.push(dao);
        deployedTokens_W.push(token); 
        deployedTimelocks_W.push(timelock);
        deployedRegistries_W.push(registry);
        
        IAdminToken(token).setAdmin(timelock); 

        TimelockController timelockController = TimelockController(payable(timelock));
        timelockController.grantRole(timelockController.PROPOSER_ROLE(), dao);
        timelockController.grantRole(timelockController.EXECUTOR_ROLE(), dao); 
        if (keys.length > 0) { 
            Registry(registry).batchEditRegistry(keys, values);
        }
    }
}
// Factories_W.sol
```

### `contracts/HBEVM_Wrapped_Token.sol`
```sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {ERC20Wrapper} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Wrapper.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";
import {IAdminToken} from "./IAdminToken.sol"; 

contract HBEVM_Wrapped_Token is ERC20, ERC20Permit, ERC20Votes, ERC20Wrapper, IAdminToken {
    address public admin; 
    bool private adminSet;

    constructor(
        IERC20 underlyingToken,
        string memory name_, 
        string memory symbol_ 
    )
        ERC20(name_, symbol_)
        ERC20Permit(name_) 
        ERC20Wrapper(underlyingToken)
    {
        adminSet = false;
    }

    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp"; 
    }

    function clock() public view virtual override returns (uint48) {
        return uint48(block.timestamp); 
    }

    function decimals() public view override(ERC20, ERC20Wrapper) returns (uint8) {
        return super.decimals();
    }

    function _update(address from, address to, uint256 amount) 
        internal 
        override(ERC20, ERC20Votes) 
    {
        super._update(from, to, amount);
    }

    function nonces(address owner_) public view virtual override(ERC20Permit, Nonces) returns (uint256) { 
        return super.nonces(owner_);
    }

    function setAdmin(address newAdmin) public override { 
        require(!adminSet, "HBEVM_Wrapped_Token: admin has already been set"); 
        require(newAdmin != address(0), "HBEVM_Wrapped_Token: new admin address cannot be zero");
        admin = newAdmin;
        adminSet = true;
    }
}
// HBEVM_Wrapped_Token.sol
```

### `contracts/IAdminToken.sol`
```sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAdminToken {
    function setAdmin(address newAdmin) external;
}
// IAdminToken.sol
```

### `contracts/Jurisdiction.sol`
```sol
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

contract Jurisdiction is ERC20, ERC20Permit, ERC20Votes, IAdminToken {
    using Checkpoints for Checkpoints.Trace208;

    address public admin;
    bool private adminSet;
    bool public constant isTransferable = false;

    address payable public immutable registryAddress;
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

    function accrueReputation(address[] calldata members, uint256[] calldata amounts, address paymentToken) external {
        require(msg.sender == timelockAddress, "Jurisdiction: Only Timelock can accrue");
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

    function claimPassiveIncome() external {
        uint256 epochId = currentPassiveIncomeEpoch;
        RewardEpoch storage epoch = passiveIncomeEpochs[epochId];
        
        require(epochId > 0, "Jurisdiction: No active income epoch");
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

    function claimRepresentationReward() external {
        uint256 epochId = currentDelegateRewardEpoch;
        RewardEpoch storage epoch = delegateRewardEpochs[epochId];

        require(epochId > 0, "Jurisdiction: No active delegate epoch");
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

    function getPastBalance(address account, uint256 timepoint) public view returns (uint256) {
        return _getPastBalance(account, timepoint);
    }

    function _getPastBalance(address account, uint256 timepoint) internal view returns (uint256) {
        require(timepoint <= type(uint48).max, "Jurisdiction: timepoint exceeds uint48 range");
        return _balanceHistory[account].upperLookup(uint48(timepoint));
    }

    function delegate(address delegatee) public override {
        address oldDelegate = delegates(msg.sender);
        super.delegate(delegatee);
        uint48 timestamp = clock();
        
        _balanceHistory[msg.sender].push(timestamp, uint208(balanceOf(msg.sender)));
        if (oldDelegate != address(0)) {
            _balanceHistory[oldDelegate].push(timestamp, uint208(balanceOf(oldDelegate)));
        }
        if (delegatee != address(0)) {
            _balanceHistory[delegatee].push(timestamp, uint208(balanceOf(delegatee)));
        }
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
```

### `contracts/Registry.sol`
```sol
// contracts/Registry.sol
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

    address public jurisdictionAddress;
    mapping(bytes32 => uint256) public earmarkedFunds;

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
    
    event JurisdictionAddressSet(address indexed jurisdiction);
    event FundsEarmarked(bytes32 indexed purpose, uint256 amount);
    event EarmarkedFundsWithdrawn(bytes32 indexed purpose, uint256 amount);
    event EarmarkedFundsDisbursed(address indexed recipient, bytes32 indexed purpose, uint256 amount);


     receive() external payable {
        emit ReceivedETH(msg.sender, msg.value);
    }
     function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        operator; data;
        emit ReceivedERC721(from, msg.sender, tokenId);
        return this.onERC721Received.selector;
    }

    function transferETH(address payable to, uint256 amount) _treasuryOps external nonReentrant {
        require(address(this).balance >= amount, "Insufficient balance");
        to.transfer(amount);
        emit TransferredETH(to, amount);
    }

    function transferERC20(
        address token,
        address to,
        uint256 amount
    ) external _treasuryOps {
        bool success = IERC20(token).transfer(to, amount);
        require(success, "ERC20 transfer failed");
        emit TransferredERC20(token, to, amount);
    }

    function transferERC721(
        address token,
        address to,
        uint256 tokenId
    ) external _treasuryOps {
        IERC721(token).safeTransferFrom(address(this), to, tokenId);
        emit TransferredERC721(token, to, tokenId);
    }
    
    constructor(address _owner, address _wrapper) {
        require(_owner != address(0), "Owner address cannot be zero");
        owner = _owner;
        wrapper=_wrapper;
    }

    event RegistryUpdated(string  key, string  value);

    function editRegistry(string memory key, string memory value) public _regedit {
        if (bytes(reg[key]).length == 0) {
            keys.push(key);
        }
        reg[key] = value;
        emit RegistryUpdated(key, value);
    }
    
    function batchEditRegistry(string[] memory newKeys, string[] memory values) public _regedit {
        for (uint256 i = 0; i < newKeys.length; i++) {
            string memory key = newKeys[i];
            string memory value = values[i];
            if (bytes(reg[key]).length == 0) {
                keys.push(key);
            }
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

    function setJurisdictionAddress(address _jurisdictionAddress) external _regedit {
        require(_jurisdictionAddress != address(0), "Jurisdiction address cannot be zero");
        jurisdictionAddress = _jurisdictionAddress;
        emit JurisdictionAddressSet(_jurisdictionAddress);
    }

    function earmarkFunds(bytes32 purpose, uint256 amount, address tokenAddress) external _treasuryOps {
        uint256 currentBalance = IERC20(tokenAddress).balanceOf(address(this));
        require(currentBalance >= earmarkedFunds[purpose] + amount, "Cannot earmark more than available balance");
        earmarkedFunds[purpose] += amount;
        emit FundsEarmarked(purpose, amount);
    }

    function withdrawEarmarkedFunds(bytes32 purpose, uint256 amount) external _treasuryOps {
        require(earmarkedFunds[purpose] >= amount, "Registry: Cannot withdraw more than earmarked");
        earmarkedFunds[purpose] -= amount;
        emit EarmarkedFundsWithdrawn(purpose, amount);
    }

    function disburseEarmarked(address recipient, uint256 amount, bytes32 purpose, address tokenAddress) external nonReentrant {
        require(msg.sender == jurisdictionAddress, "Registry: Caller is not the Jurisdiction");
        require(earmarkedFunds[purpose] >= amount, "Registry: Insufficient earmarked funds");
        
        uint256 currentBalance = IERC20(tokenAddress).balanceOf(address(this));
        require(currentBalance >= amount, "Registry: Insufficient token balance for disbursement");

        earmarkedFunds[purpose] -= amount;
        bool success = IERC20(tokenAddress).transfer(recipient, amount);
        require(success, "ERC20 transfer failed during disbursement");
        emit EarmarkedFundsDisbursed(recipient, purpose, amount);
    }
}
// Registry.sol
```

### `contracts/RegistryFactory.sol`
```sol
// contracts/RegistryFactory.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Registry.sol";

contract RegistryFactory {
    address[] public deployedRegistries;

    function deployRegistry(address timelockAddress, address wrapperAddress) external returns (address) {
        Registry registry = new Registry(timelockAddress, wrapperAddress);
        deployedRegistries.push(address(registry));
        return address(registry);
    }
}
// RegistryFactory.sol
```

### `contracts/Settings.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (governance/extensions/GovernorSettings.sol)

pragma solidity ^0.8.20;
import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
/**
 * @dev Extension of {Governor} for settings updatable through governance.
 */
abstract contract GovernorSettings is Governor {
    // amount of token
    uint256 private _proposalThreshold;
    // timepoint: limited to uint48 in core (same as clock() type)
    uint48 private _votingDelay;
    // duration: limited to uint32 in core
    uint32 private _votingPeriod;

    event VotingDelaySet(uint256 oldVotingDelay, uint256 newVotingDelay);
    event VotingPeriodSet(uint256 oldVotingPeriod, uint256 newVotingPeriod);
    event ProposalThresholdSet(uint256 oldProposalThreshold, uint256 newProposalThreshold);

    /**
     * @dev Initialize the governance parameters.
     */
    constructor(uint48 initialVotingDelay, uint32 initialVotingPeriod, uint256 initialProposalThreshold) {
        _setVotingDelay(initialVotingDelay);
        _setVotingPeriod(initialVotingPeriod);
        _setProposalThreshold(initialProposalThreshold);
    }

    /**
     * @dev See {IGovernor-votingDelay}.
     */
    function votingDelay() public view virtual override returns (uint256) {
        return _votingDelay;
    }

    /**
     * @dev See {IGovernor-votingPeriod}.
     */
    function votingPeriod() public view virtual override returns (uint256) {
        return _votingPeriod;
    }

    /**
     * @dev See {Governor-proposalThreshold}.
     */
    function proposalThreshold() public view virtual override returns (uint256) {
        return _proposalThreshold;
    }

    /**
     * @dev Update the voting delay. This operation can only be performed through a governance proposal.
     *
     * Emits a {VotingDelaySet} event.
     */
    function setVotingDelay(uint48 newVotingDelay) public virtual onlyGovernance {
        _setVotingDelay(newVotingDelay);
    }

    /**
     * @dev Update the voting period. This operation can only be performed through a governance proposal.
     *
     * Emits a {VotingPeriodSet} event.
     */
    function setVotingPeriod(uint32 newVotingPeriod) public virtual onlyGovernance {
        _setVotingPeriod(newVotingPeriod);
    }

    /**
     * @dev Update the proposal threshold. This operation can only be performed through a governance proposal.
     *
     * Emits a {ProposalThresholdSet} event.
     */
    function setProposalThreshold(uint256 newProposalThreshold) public virtual onlyGovernance {
        _setProposalThreshold(newProposalThreshold);
    }

    /**
     * @dev Internal setter for the voting delay.
     *
     * Emits a {VotingDelaySet} event.
     */
    function _setVotingDelay(uint48 newVotingDelay) internal virtual {
        emit VotingDelaySet(_votingDelay, newVotingDelay);
        _votingDelay = newVotingDelay;
    }

    /**
     * @dev Internal setter for the voting period.
     *
     * Emits a {VotingPeriodSet} event.
     */
    function _setVotingPeriod(uint32 newVotingPeriod) internal virtual {
        if (newVotingPeriod == 0) {
            revert GovernorInvalidVotingPeriod(0);
        }
        emit VotingPeriodSet(_votingPeriod, newVotingPeriod);
        _votingPeriod = newVotingPeriod;
    }

    /**
     * @dev Internal setter for the proposal threshold.
     *
     * Emits a {ProposalThresholdSet} event.
     */
    function _setProposalThreshold(uint256 newProposalThreshold) internal virtual {
        emit ProposalThresholdSet(_proposalThreshold, newProposalThreshold);
        _proposalThreshold = newProposalThreshold;
    }
}
```

### `contracts/TimelockFactory.sol`
```sol
// contracts/TimelockFactory.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/governance/TimelockController.sol";

contract TimelockFactory {
    address[] public deployedTimelocks;

    function deployTimelock(address admin, uint256 executionDelay) external returns (address) {
        address[] memory proposers;
        address[] memory executors;
        TimelockController timelock = new TimelockController(uint32(executionDelay), proposers, executors, admin);
        deployedTimelocks.push(address(timelock));
        return address(timelock);
    }
}
// TimelockFactory.sol
```

### `contracts/Token.sol`
```sol
// contracts/Token.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20; // Assuming this is the pragma from your original file
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";
// import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol"; // From original, not used
// import "@openzeppelin/contracts/access/Ownable.sol"; // From original, not used by HBEVM_token
// import "@openzeppelin/contracts/utils/Strings.sol"; // From original, not used
import {IAdminToken} from "./IAdminToken.sol"; // Added import
    
contract HBEVM_token is ERC20, ERC20Permit, ERC20Votes, IAdminToken { // Added IAdminToken
    uint8 private _decimals;
    address public admin; // 'public' makes getter automatically
    bool public isTransferable;
    bool private adminSet; // Matches your original variable declaration style

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        address[] memory initialMembers,
        uint256[] memory initialAmounts, // Original: HBEVM_token constructor uses the prefix of this for minting
        bool transferrable
    ) 
        ERC20(name, symbol)
        ERC20Permit(name) 
    {   
        _decimals = decimals_;
        isTransferable = transferrable;
        adminSet = false; 

        for (uint32 i = 0; i < initialMembers.length; i++) {
            // This loop correctly only uses the portion of initialAmounts corresponding to initialMembers
             _mint(initialMembers[i], initialAmounts[i]);
        }
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }

    // onlyOwner modifier if you plan to add mint/burn callable by admin
    modifier onlyOwner {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    // Optional: mint and burn functions if needed, guarded by admin
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    function clock() public view override returns (uint48) { // Added override
        return uint48(block.timestamp);
    }

    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }

    // Function to set the admin, callable only once
    function setAdmin(address newAdmin) public override { // Added override for IAdminToken
        require(admin == address(0), "Admin has already been set"); // Original logic
        require(newAdmin != address(0), "New admin address cannot be zero");
        admin = newAdmin;
        adminSet = true; // Assuming you want to track this
    }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }

    // Original transfer function logic
    function transfer(address recipient, uint256 amount) public override returns (bool) {
        require(isTransferable, "Transfers are currently disabled");
        return super.transfer(recipient, amount);
    }

    // Original transferFrom function logic
    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        require(isTransferable, "Transfers are currently disabled");
        return super.transferFrom(sender, recipient, amount);
    }
}
// Token.sol
```

### `contracts/remix.config.json`
```json
{
  "solidity-compiler": {
    "language": "Solidity",
    "settings": {
      "optimizer": {
        "enabled": true,
        "runs": 200
      },
      "outputSelection": {
        "*": {
          "": [
            "ast"
          ],
          "*": [
            "abi",
            "metadata",
            "devdoc",
            "userdoc",
            "storageLayout",
            "evm.legacyAssembly",
            "evm.bytecode",
            "evm.deployedBytecode",
            "evm.methodIdentifiers",
            "evm.gasEstimates",
            "evm.assembly"
          ]
        }
      }
    }
  }
}
```

### `contracts/factories/DAOFactory.sol`
```sol
// contracts/factories/DAOFactory.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../Dao.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";

contract DAOFactory {
    address[] public deployedDAOs;

    function deployDAO(
        address tokenAddress,
        address timelockAddress,
        string memory name,
        uint[] memory daoSettings
    ) external returns (address) {
        require(daoSettings.length >= 4, "DAO settings requires 4 elements");
        uint48 minsDelay = uint48(daoSettings[0]);
        uint32 minsVoting = uint32(daoSettings[1]);
        uint256 pThreshold = daoSettings[2];
        uint8 qvrm = uint8(daoSettings[3]);
        
        HomebaseDAO dao = new HomebaseDAO(
            IVotes(tokenAddress),
            TimelockController(payable(timelockAddress)),
            name,
            minsDelay,
            minsVoting,
            pThreshold,
            qvrm
        );
        deployedDAOs.push(address(dao));
        return address(dao);
    }
}
// DAOFactory.sol
```

### `contracts/factories/InfrastructureFactory.sol`
```sol
// contracts/factories/InfrastructureFactory.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../Registry.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";

contract InfrastructureFactory {
    address[] public deployedTimelocks;
    address[] public deployedRegistries;

    function deployTimelock(address admin, uint256 executionDelay) external returns (address) {
        address[] memory proposers;
        address[] memory executors;
        TimelockController timelock = new TimelockController(uint32(executionDelay), proposers, executors, admin);
        deployedTimelocks.push(address(timelock));
        return address(timelock);
    }

    function deployRegistry(address timelockAddress, address wrapperAddress) external returns (address) {
        Registry registry = new Registry(timelockAddress, wrapperAddress);
        deployedRegistries.push(address(registry));
        return address(registry);
    }
}
// InfrastructureFactory.sol
```

### `contracts/factories/JurisdictionFactory.sol`
```sol
// contracts/factories/JurisdictionFactory.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../Jurisdiction.sol";

contract JurisdictionFactory {
    address[] public deployedJurisdictionTokens;
    
    function deployJurisdictionToken(
        string memory name,
        string memory symbol,
        address payable registryAddress,
        address timelockAddress,
        address[] memory initialMembers,
        uint256[] memory combinedInitialAmounts // <-- CHANGED to accept the full array
    ) external returns (address) {
        // --- NEW: Slicing logic is now inside the factory ---
        uint256[] memory memberAmounts = new uint256[](initialMembers.length);
        for(uint i = 0; i < initialMembers.length; i++) {
            // Assumes DAO settings are the first 4 elements, member amounts follow
            memberAmounts[i] = combinedInitialAmounts[4 + i]; 
        }

        Jurisdiction jurisdiction = new Jurisdiction(name, symbol, registryAddress, timelockAddress, initialMembers, memberAmounts);
        deployedJurisdictionTokens.push(address(jurisdiction));
        return address(jurisdiction);
    }
}
// JurisdictionFactory.sol
```

### `contracts/factories/TokenFactory.sol`
```sol
// contracts/factories/TokenFactory.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../Token.sol";

contract TokenFactory {
    address[] public deployedTokens;

    function deployToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        address[] memory initialMembers,
        uint256[] memory combinedInitialAmounts,
        bool transferrable
    ) external returns (address) {
        HBEVM_token token = new HBEVM_token(name, symbol, decimals, initialMembers, combinedInitialAmounts, transferrable);
        deployedTokens.push(address(token));
        return address(token);
    }
}
// TokenFactory.sol
```

### `contracts/mocks/MockERC20.sol`
```sol
// contracts/mocks/MockERC20.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// A basic ERC20 token for testing purposes.
contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
// MockERC20.sol
```

### `contracts/mocks/MockERC721.sol`
```sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24; // Or ^0.8.24 if that's what Factories_W uses

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockERC721 is ERC721 {
    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
}
```

### `contracts/mocks/MockFactories.sol`
```sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../HBEVM_Wrapped_Token.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "../Dao.sol"; // Imports HomebaseDAO which imports IVotes
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol"; // Explicit import for IVotes casting
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Interface ITokenFactory (copy from Factories_W.sol)
interface ITokenFactory {
    function deployWrappedToken(
        IERC20 underlyingToken,
        string memory wrappedTokenName,
        string memory wrappedTokenSymbol
    ) external returns (address);
}

// Interface ITimelockFactory (copy from Factories_W.sol)
interface ITimelockFactory {
    function deployTimelock(address admin, uint256 executionDelay) external returns (address);
}

// Interface IDAOFactory (copy from Factories_W.sol)
interface IDAOFactory {
    function deployDAO( 
        address tokenAddress,
        address timelockAddress,
        string memory name,
        uint[] memory daoSettingsArray 
    ) external returns (address);
}

contract MockTokenFactory is ITokenFactory {
    function deployWrappedToken(
        IERC20 underlyingToken,
        string memory wrappedTokenName,
        string memory wrappedTokenSymbol
    ) external override returns (address) {
        HBEVM_Wrapped_Token token = new HBEVM_Wrapped_Token(underlyingToken, wrappedTokenName, wrappedTokenSymbol);
        return address(token);
    }
}

contract MockTimelockFactory is ITimelockFactory {
    function deployTimelock(address admin, uint256 executionDelay) external override returns (address) {
        address[] memory proposers = new address[](0); // Empty, to be configured by Wrapper
        address[] memory executors = new address[](1);
        executors[0] = address(0); // Anyone can execute by default for OZ GovernorTimelockControl
        TimelockController timelock = new TimelockController(uint32(executionDelay), proposers, executors, admin);
        return address(timelock);
    }
}

contract MockDAOFactory is IDAOFactory {
    function deployDAO(
        address tokenAddress,
        address timelockAddress,
        string memory name,
        uint[] memory daoSettingsArray // [minsVotingDelay, minsVotingPeriod, proposalThreshold, quorumFraction]
    ) external override returns (address) {
        HomebaseDAO dao = new HomebaseDAO(
            IVotes(tokenAddress), // Cast to IVotes
            TimelockController(payable(timelockAddress)), // Cast to TimelockController
            name,
            uint48(daoSettingsArray[0]), // minsDelay for GovernorSettings
            uint32(daoSettingsArray[1]), // minsVoting for GovernorSettings
            daoSettingsArray[2],         // pThreshold
            uint8(daoSettingsArray[3])   // qvrm
        );
        return address(dao);
    }
}
```

### `contracts/mocks/ReentrantAttacker.sol`
```sol
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
```

### `contracts/mocks/TargetContract.sol`
```sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/access/Ownable.sol";

contract TargetContract is Ownable {
    uint256 public value;
    event ValueChanged(uint256 newValue);

    constructor() Ownable(msg.sender) {} // Initial owner is deployer

    function setValue(uint256 _newValue) public onlyOwner { // Only current owner (Timelock) can call
        value = _newValue;
        emit ValueChanged(_newValue);
    }
}
```
