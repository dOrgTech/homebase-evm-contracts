# Folder Structure

- homebase-evm-contracts/
  - contracts/
    - Dao.sol
    - Factories.sol
    - Factories_W.sol
    - HBEVM_Wrapped_Token.sol
    - IAdminToken.sol
    - Jurisdiction.sol
    - Registry.sol
    - Settings.sol
    - Token.sol
    - .deps/
      - npm/
        - @openzeppelin/
          - contracts/
            - access/
              - AccessControl.sol
              - IAccessControl.sol
            - governance/
              - Governor.sol
              - IGovernor.sol
              - TimelockController.sol
              - extensions/
                - GovernorCountingSimple.sol
                - GovernorSettings.sol
                - GovernorTimelockControl.sol
                - GovernorVotes.sol
                - GovernorVotesQuorumFraction.sol
              - utils/
                - IVotes.sol
                - Votes.sol
            - interfaces/
              - IERC1271.sol
              - IERC1363.sol
              - IERC165.sol
              - IERC20.sol
              - IERC5267.sol
              - IERC5805.sol
              - IERC6372.sol
              - IERC7913.sol
              - draft-IERC6093.sol
            - token/
              - ERC1155/
                - IERC1155Receiver.sol
                - utils/
                  - ERC1155Holder.sol
              - ERC20/
                - ERC20.sol
                - IERC20.sol
                - extensions/
                  - ERC20Permit.sol
                  - ERC20Votes.sol
                  - ERC20Wrapper.sol
                  - IERC20Metadata.sol
                  - IERC20Permit.sol
                - utils/
                  - SafeERC20.sol
              - ERC721/
                - IERC721.sol
                - IERC721Receiver.sol
                - utils/
                  - ERC721Holder.sol
            - utils/
              - Address.sol
              - Bytes.sol
              - Context.sol
              - Errors.sol
              - Nonces.sol
              - Panic.sol
              - ReentrancyGuard.sol
              - ShortStrings.sol
              - StorageSlot.sol
              - Strings.sol
              - cryptography/
                - ECDSA.sol
                - EIP712.sol
                - MessageHashUtils.sol
                - SignatureChecker.sol
              - introspection/
                - ERC165.sol
                - IERC165.sol
              - math/
                - Math.sol
                - SafeCast.sol
                - SignedMath.sol
              - structs/
                - Checkpoints.sol
                - DoubleEndedQueue.sol
              - types/
                - Time.sol
    - .states/
      - vm-prague/
        - state.json
    - mocks/
      - MockERC721.sol
      - MockFactories.sol
      - ReentrantAttacker.sol
      - TargetContract.sol

# File Contents

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
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24; // Matched to your working version

// Original imports from your working file
import "./Dao.sol";
import "./Registry.sol";
import "./Token.sol"; // This is your original HBEVM_token
import "@openzeppelin/contracts/governance/TimelockController.sol"; 

// New imports needed for WrapperContract_W
import "./HBEVM_Wrapped_Token.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol"; // For DAOFactory with wrapped tokens
import {IAdminToken} from "./IAdminToken.sol"; // For setting admin on wrapped token
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; // For IERC20 type


// --- FACTORIES (TokenFactory, TimelockFactory, DAOFactory as previously corrected) ---
contract TokenFactory {
    address[] public deployedTokens;
    address[] public deployedWrappedTokens; 

    function deployToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        address[] memory initialMembers,
        uint256[] memory combinedInitialAmounts, 
        bool transferrable
    ) public returns (address) {
        uint256 membersCount = initialMembers.length;
        uint256[] memory mintAmounts = new uint256[](membersCount);
        for (uint i = 0; i < membersCount; i++) {
            mintAmounts[i] = combinedInitialAmounts[i];
        }
        HBEVM_token token = new HBEVM_token(name, symbol, decimals, initialMembers, mintAmounts, transferrable);
        deployedTokens.push(address(token));
        return address(token);
    }

    function deployWrappedToken(
        IERC20 underlyingToken,
        string memory wrappedTokenName,
        string memory wrappedTokenSymbol
    ) public returns (address) {
        HBEVM_Wrapped_Token wrappedToken = new HBEVM_Wrapped_Token(underlyingToken, wrappedTokenName, wrappedTokenSymbol);
        deployedWrappedTokens.push(address(wrappedToken));
        return address(wrappedToken);
    }
}

contract TimelockFactory {
    address[] public deployedTimelocks;
    function deployTimelock(address admin, uint256 executionDelay) public returns (address) {
        address[] memory proposers;
        address[] memory executors;
        TimelockController timelock = new TimelockController(
            executionDelay, proposers, executors, admin
        );
        deployedTimelocks.push(address(timelock));
        return address(timelock);
    }
}

contract DAOFactory {
    address[] public deployedDAOs;
    function deployDAO(address tokenAddress, address timelockAddress,
    string memory name, uint[] memory initialAmounts 
    ) public returns (address) {
        require(initialAmounts.length >= 4, "DAOFactory: Insufficient settings in initialAmounts");
        uint48 minsDelay = uint48(initialAmounts[initialAmounts.length - 4]);
        uint32 minsVoting = uint32(initialAmounts[initialAmounts.length - 3]);
        uint256 pThreshold = initialAmounts[initialAmounts.length - 2];
        uint8 qvrm = uint8(initialAmounts[initialAmounts.length - 1]);
        
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

// --- ORIGINAL WrapperContract (UNCHANGED from your working version) ---
contract WrapperContract {
    TokenFactory tokenFactory;
    TimelockFactory timelockFactory;
    DAOFactory daoFactory;
    address[] public deployedDAOs;
    address[] public deployedTokens;
    address[] public deployedTimelocks;
    address[] public deployedRegistries;

    constructor(
        address _tokenFactory,
        address _timelockFactory,
        address _daoFactory
    ) {
        tokenFactory = TokenFactory(_tokenFactory);
        timelockFactory = TimelockFactory(_timelockFactory);
        daoFactory = DAOFactory(_daoFactory);
    }

    function getNumberOfDAOs() public view returns (uint) {
        return deployedDAOs.length;
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
    }

    function deployDAOwithToken(DaoParams memory params) public payable { 
        require(
            params.initialAmounts.length >= params.initialMembers.length + 4,
            "Insufficient settings data in initialAmounts array"
        );
        address token = tokenFactory.deployToken(
            params.name, params.symbol, params.decimals,
            params.initialMembers, params.initialAmounts, params.transferrable
        );
        address timelock = timelockFactory.deployTimelock(address(this), params.executionDelay);
        address dao = daoFactory.deployDAO(token, timelock, params.name, params.initialAmounts);
        Registry reg = new Registry(timelock, address(this));
        _finalizeDeployment(dao, token, timelock, payable(address(reg)), params.keys, params.values);

        emit NewDaoCreated(
            dao, token, params.initialMembers, params.initialAmounts,
            params.name, params.symbol, params.description,
            params.executionDelay, address(reg), params.keys, params.values
        );
    }

    function _finalizeDeployment( 
        address dao,
        address token,
        address timelock,
        address payable registry,
        string[] memory keys,
        string[] memory values
    ) internal {
        deployedDAOs.push(dao);
        deployedTokens.push(token);
        deployedTimelocks.push(timelock);
        deployedRegistries.push(registry);
        HBEVM_token(token).setAdmin(timelock); 
        TimelockController timelockController = TimelockController(payable(timelock));
        timelockController.grantRole(timelockController.PROPOSER_ROLE(), dao);
        timelockController.grantRole(timelockController.EXECUTOR_ROLE(), dao);
        if (keys.length > 0) { 
            Registry(registry).batchEditRegistry(keys, values);
        }
    }
}

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

```

### `contracts/Registry.sol`
```sol
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

### `contracts/.deps/npm/@openzeppelin/contracts/access/AccessControl.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (access/AccessControl.sol)

pragma solidity ^0.8.20;

import {IAccessControl} from "./IAccessControl.sol";
import {Context} from "../utils/Context.sol";
import {IERC165, ERC165} from "../utils/introspection/ERC165.sol";

/**
 * @dev Contract module that allows children to implement role-based access
 * control mechanisms. This is a lightweight version that doesn't allow enumerating role
 * members except through off-chain means by accessing the contract event logs. Some
 * applications may benefit from on-chain enumerability, for those cases see
 * {AccessControlEnumerable}.
 *
 * Roles are referred to by their `bytes32` identifier. These should be exposed
 * in the external API and be unique. The best way to achieve this is by
 * using `public constant` hash digests:
 *
 * ```solidity
 * bytes32 public constant MY_ROLE = keccak256("MY_ROLE");
 * ```
 *
 * Roles can be used to represent a set of permissions. To restrict access to a
 * function call, use {hasRole}:
 *
 * ```solidity
 * function foo() public {
 *     require(hasRole(MY_ROLE, msg.sender));
 *     ...
 * }
 * ```
 *
 * Roles can be granted and revoked dynamically via the {grantRole} and
 * {revokeRole} functions. Each role has an associated admin role, and only
 * accounts that have a role's admin role can call {grantRole} and {revokeRole}.
 *
 * By default, the admin role for all roles is `DEFAULT_ADMIN_ROLE`, which means
 * that only accounts with this role will be able to grant or revoke other
 * roles. More complex role relationships can be created by using
 * {_setRoleAdmin}.
 *
 * WARNING: The `DEFAULT_ADMIN_ROLE` is also its own admin: it has permission to
 * grant and revoke this role. Extra precautions should be taken to secure
 * accounts that have been granted it. We recommend using {AccessControlDefaultAdminRules}
 * to enforce additional security measures for this role.
 */
abstract contract AccessControl is Context, IAccessControl, ERC165 {
    struct RoleData {
        mapping(address account => bool) hasRole;
        bytes32 adminRole;
    }

    mapping(bytes32 role => RoleData) private _roles;

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    /**
     * @dev Modifier that checks that an account has a specific role. Reverts
     * with an {AccessControlUnauthorizedAccount} error including the required role.
     */
    modifier onlyRole(bytes32 role) {
        _checkRole(role);
        _;
    }

    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IAccessControl).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) public view virtual returns (bool) {
        return _roles[role].hasRole[account];
    }

    /**
     * @dev Reverts with an {AccessControlUnauthorizedAccount} error if `_msgSender()`
     * is missing `role`. Overriding this function changes the behavior of the {onlyRole} modifier.
     */
    function _checkRole(bytes32 role) internal view virtual {
        _checkRole(role, _msgSender());
    }

    /**
     * @dev Reverts with an {AccessControlUnauthorizedAccount} error if `account`
     * is missing `role`.
     */
    function _checkRole(bytes32 role, address account) internal view virtual {
        if (!hasRole(role, account)) {
            revert AccessControlUnauthorizedAccount(account, role);
        }
    }

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) public view virtual returns (bytes32) {
        return _roles[role].adminRole;
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleGranted} event.
     */
    function grantRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _grantRole(role, account);
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleRevoked} event.
     */
    function revokeRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _revokeRole(role, account);
    }

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been revoked `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `callerConfirmation`.
     *
     * May emit a {RoleRevoked} event.
     */
    function renounceRole(bytes32 role, address callerConfirmation) public virtual {
        if (callerConfirmation != _msgSender()) {
            revert AccessControlBadConfirmation();
        }

        _revokeRole(role, callerConfirmation);
    }

    /**
     * @dev Sets `adminRole` as ``role``'s admin role.
     *
     * Emits a {RoleAdminChanged} event.
     */
    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual {
        bytes32 previousAdminRole = getRoleAdmin(role);
        _roles[role].adminRole = adminRole;
        emit RoleAdminChanged(role, previousAdminRole, adminRole);
    }

    /**
     * @dev Attempts to grant `role` to `account` and returns a boolean indicating if `role` was granted.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleGranted} event.
     */
    function _grantRole(bytes32 role, address account) internal virtual returns (bool) {
        if (!hasRole(role, account)) {
            _roles[role].hasRole[account] = true;
            emit RoleGranted(role, account, _msgSender());
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Attempts to revoke `role` from `account` and returns a boolean indicating if `role` was revoked.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleRevoked} event.
     */
    function _revokeRole(bytes32 role, address account) internal virtual returns (bool) {
        if (hasRole(role, account)) {
            _roles[role].hasRole[account] = false;
            emit RoleRevoked(role, account, _msgSender());
            return true;
        } else {
            return false;
        }
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/access/IAccessControl.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (access/IAccessControl.sol)

pragma solidity >=0.8.4;

/**
 * @dev External interface of AccessControl declared to support ERC-165 detection.
 */
interface IAccessControl {
    /**
     * @dev The `account` is missing a role.
     */
    error AccessControlUnauthorizedAccount(address account, bytes32 neededRole);

    /**
     * @dev The caller of a function is not the expected one.
     *
     * NOTE: Don't confuse with {AccessControlUnauthorizedAccount}.
     */
    error AccessControlBadConfirmation();

    /**
     * @dev Emitted when `newAdminRole` is set as ``role``'s admin role, replacing `previousAdminRole`
     *
     * `DEFAULT_ADMIN_ROLE` is the starting admin for all roles, despite
     * {RoleAdminChanged} not being emitted to signal this.
     */
    event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);

    /**
     * @dev Emitted when `account` is granted `role`.
     *
     * `sender` is the account that originated the contract call. This account bears the admin role (for the granted role).
     * Expected in cases where the role was granted using the internal {AccessControl-_grantRole}.
     */
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Emitted when `account` is revoked `role`.
     *
     * `sender` is the account that originated the contract call:
     *   - if using `revokeRole`, it is the admin role bearer
     *   - if using `renounceRole`, it is the role bearer (i.e. `account`)
     */
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) external view returns (bool);

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {AccessControl-_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) external view returns (bytes32);

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function grantRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function revokeRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been granted `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `callerConfirmation`.
     */
    function renounceRole(bytes32 role, address callerConfirmation) external;
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/governance/Governor.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (governance/Governor.sol)

pragma solidity ^0.8.24;

import {IERC721Receiver} from "../token/ERC721/IERC721Receiver.sol";
import {IERC1155Receiver} from "../token/ERC1155/IERC1155Receiver.sol";
import {EIP712} from "../utils/cryptography/EIP712.sol";
import {SignatureChecker} from "../utils/cryptography/SignatureChecker.sol";
import {IERC165, ERC165} from "../utils/introspection/ERC165.sol";
import {SafeCast} from "../utils/math/SafeCast.sol";
import {DoubleEndedQueue} from "../utils/structs/DoubleEndedQueue.sol";
import {Address} from "../utils/Address.sol";
import {Context} from "../utils/Context.sol";
import {Nonces} from "../utils/Nonces.sol";
import {Strings} from "../utils/Strings.sol";
import {IGovernor, IERC6372} from "./IGovernor.sol";

/**
 * @dev Core of the governance system, designed to be extended through various modules.
 *
 * This contract is abstract and requires several functions to be implemented in various modules:
 *
 * - A counting module must implement {_quorumReached}, {_voteSucceeded} and {_countVote}
 * - A voting module must implement {_getVotes}
 * - Additionally, {votingPeriod}, {votingDelay}, and {quorum} must also be implemented
 */
abstract contract Governor is Context, ERC165, EIP712, Nonces, IGovernor, IERC721Receiver, IERC1155Receiver {
    using DoubleEndedQueue for DoubleEndedQueue.Bytes32Deque;

    bytes32 public constant BALLOT_TYPEHASH =
        keccak256("Ballot(uint256 proposalId,uint8 support,address voter,uint256 nonce)");
    bytes32 public constant EXTENDED_BALLOT_TYPEHASH =
        keccak256(
            "ExtendedBallot(uint256 proposalId,uint8 support,address voter,uint256 nonce,string reason,bytes params)"
        );

    struct ProposalCore {
        address proposer;
        uint48 voteStart;
        uint32 voteDuration;
        bool executed;
        bool canceled;
        uint48 etaSeconds;
    }

    bytes32 private constant ALL_PROPOSAL_STATES_BITMAP = bytes32((2 ** (uint8(type(ProposalState).max) + 1)) - 1);
    string private _name;

    mapping(uint256 proposalId => ProposalCore) private _proposals;

    // This queue keeps track of the governor operating on itself. Calls to functions protected by the {onlyGovernance}
    // modifier needs to be whitelisted in this queue. Whitelisting is set in {execute}, consumed by the
    // {onlyGovernance} modifier and eventually reset after {_executeOperations} completes. This ensures that the
    // execution of {onlyGovernance} protected calls can only be achieved through successful proposals.
    DoubleEndedQueue.Bytes32Deque private _governanceCall;

    /**
     * @dev Restricts a function so it can only be executed through governance proposals. For example, governance
     * parameter setters in {GovernorSettings} are protected using this modifier.
     *
     * The governance executing address may be different from the Governor's own address, for example it could be a
     * timelock. This can be customized by modules by overriding {_executor}. The executor is only able to invoke these
     * functions during the execution of the governor's {execute} function, and not under any other circumstances. Thus,
     * for example, additional timelock proposers are not able to change governance parameters without going through the
     * governance protocol (since v4.6).
     */
    modifier onlyGovernance() {
        _checkGovernance();
        _;
    }

    /**
     * @dev Sets the value for {name} and {version}
     */
    constructor(string memory name_) EIP712(name_, version()) {
        _name = name_;
    }

    /**
     * @dev Function to receive ETH that will be handled by the governor (disabled if executor is a third party contract)
     */
    receive() external payable virtual {
        if (_executor() != address(this)) {
            revert GovernorDisabledDeposit();
        }
    }

    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165, ERC165) returns (bool) {
        return
            interfaceId == type(IGovernor).interfaceId ||
            interfaceId == type(IGovernor).interfaceId ^ IGovernor.getProposalId.selector ||
            interfaceId == type(IERC1155Receiver).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /// @inheritdoc IGovernor
    function name() public view virtual returns (string memory) {
        return _name;
    }

    /// @inheritdoc IGovernor
    function version() public view virtual returns (string memory) {
        return "1";
    }

    /**
     * @dev See {IGovernor-hashProposal}.
     *
     * The proposal id is produced by hashing the ABI encoded `targets` array, the `values` array, the `calldatas` array
     * and the descriptionHash (bytes32 which itself is the keccak256 hash of the description string). This proposal id
     * can be produced from the proposal data which is part of the {ProposalCreated} event. It can even be computed in
     * advance, before the proposal is submitted.
     *
     * Note that the chainId and the governor address are not part of the proposal id computation. Consequently, the
     * same proposal (with same operation and same description) will have the same id if submitted on multiple governors
     * across multiple networks. This also means that in order to execute the same operation twice (on the same
     * governor) the proposer will have to change the description in order to avoid proposal id conflicts.
     */
    function hashProposal(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public pure virtual returns (uint256) {
        return uint256(keccak256(abi.encode(targets, values, calldatas, descriptionHash)));
    }

    /// @inheritdoc IGovernor
    function getProposalId(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public view virtual returns (uint256) {
        return hashProposal(targets, values, calldatas, descriptionHash);
    }

    /// @inheritdoc IGovernor
    function state(uint256 proposalId) public view virtual returns (ProposalState) {
        // We read the struct fields into the stack at once so Solidity emits a single SLOAD
        ProposalCore storage proposal = _proposals[proposalId];
        bool proposalExecuted = proposal.executed;
        bool proposalCanceled = proposal.canceled;

        if (proposalExecuted) {
            return ProposalState.Executed;
        }

        if (proposalCanceled) {
            return ProposalState.Canceled;
        }

        uint256 snapshot = proposalSnapshot(proposalId);

        if (snapshot == 0) {
            revert GovernorNonexistentProposal(proposalId);
        }

        uint256 currentTimepoint = clock();

        if (snapshot >= currentTimepoint) {
            return ProposalState.Pending;
        }

        uint256 deadline = proposalDeadline(proposalId);

        if (deadline >= currentTimepoint) {
            return ProposalState.Active;
        } else if (!_quorumReached(proposalId) || !_voteSucceeded(proposalId)) {
            return ProposalState.Defeated;
        } else if (proposalEta(proposalId) == 0) {
            return ProposalState.Succeeded;
        } else {
            return ProposalState.Queued;
        }
    }

    /// @inheritdoc IGovernor
    function proposalThreshold() public view virtual returns (uint256) {
        return 0;
    }

    /// @inheritdoc IGovernor
    function proposalSnapshot(uint256 proposalId) public view virtual returns (uint256) {
        return _proposals[proposalId].voteStart;
    }

    /// @inheritdoc IGovernor
    function proposalDeadline(uint256 proposalId) public view virtual returns (uint256) {
        return _proposals[proposalId].voteStart + _proposals[proposalId].voteDuration;
    }

    /// @inheritdoc IGovernor
    function proposalProposer(uint256 proposalId) public view virtual returns (address) {
        return _proposals[proposalId].proposer;
    }

    /// @inheritdoc IGovernor
    function proposalEta(uint256 proposalId) public view virtual returns (uint256) {
        return _proposals[proposalId].etaSeconds;
    }

    /// @inheritdoc IGovernor
    function proposalNeedsQueuing(uint256) public view virtual returns (bool) {
        return false;
    }

    /**
     * @dev Reverts if the `msg.sender` is not the executor. In case the executor is not this contract
     * itself, the function reverts if `msg.data` is not whitelisted as a result of an {execute}
     * operation. See {onlyGovernance}.
     */
    function _checkGovernance() internal virtual {
        if (_executor() != _msgSender()) {
            revert GovernorOnlyExecutor(_msgSender());
        }
        if (_executor() != address(this)) {
            bytes32 msgDataHash = keccak256(_msgData());
            // loop until popping the expected operation - throw if deque is empty (operation not authorized)
            while (_governanceCall.popFront() != msgDataHash) {}
        }
    }

    /**
     * @dev Amount of votes already cast passes the threshold limit.
     */
    function _quorumReached(uint256 proposalId) internal view virtual returns (bool);

    /**
     * @dev Is the proposal successful or not.
     */
    function _voteSucceeded(uint256 proposalId) internal view virtual returns (bool);

    /**
     * @dev Get the voting weight of `account` at a specific `timepoint`, for a vote as described by `params`.
     */
    function _getVotes(address account, uint256 timepoint, bytes memory params) internal view virtual returns (uint256);

    /**
     * @dev Register a vote for `proposalId` by `account` with a given `support`, voting `weight` and voting `params`.
     *
     * Note: Support is generic and can represent various things depending on the voting system used.
     */
    function _countVote(
        uint256 proposalId,
        address account,
        uint8 support,
        uint256 totalWeight,
        bytes memory params
    ) internal virtual returns (uint256);

    /**
     * @dev Hook that should be called every time the tally for a proposal is updated.
     *
     * Note: This function must run successfully. Reverts will result in the bricking of governance
     */
    function _tallyUpdated(uint256 proposalId) internal virtual {}

    /**
     * @dev Default additional encoded parameters used by castVote methods that don't include them
     *
     * Note: Should be overridden by specific implementations to use an appropriate value, the
     * meaning of the additional params, in the context of that implementation
     */
    function _defaultParams() internal view virtual returns (bytes memory) {
        return "";
    }

    /**
     * @dev See {IGovernor-propose}. This function has opt-in frontrunning protection, described in {_isValidDescriptionForProposer}.
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public virtual returns (uint256) {
        address proposer = _msgSender();

        // check description restriction
        if (!_isValidDescriptionForProposer(proposer, description)) {
            revert GovernorRestrictedProposer(proposer);
        }

        // check proposal threshold
        uint256 votesThreshold = proposalThreshold();
        if (votesThreshold > 0) {
            uint256 proposerVotes = getVotes(proposer, clock() - 1);
            if (proposerVotes < votesThreshold) {
                revert GovernorInsufficientProposerVotes(proposer, proposerVotes, votesThreshold);
            }
        }

        return _propose(targets, values, calldatas, description, proposer);
    }

    /**
     * @dev Internal propose mechanism. Can be overridden to add more logic on proposal creation.
     *
     * Emits a {IGovernor-ProposalCreated} event.
     */
    function _propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        address proposer
    ) internal virtual returns (uint256 proposalId) {
        proposalId = getProposalId(targets, values, calldatas, keccak256(bytes(description)));

        if (targets.length != values.length || targets.length != calldatas.length || targets.length == 0) {
            revert GovernorInvalidProposalLength(targets.length, calldatas.length, values.length);
        }
        if (_proposals[proposalId].voteStart != 0) {
            revert GovernorUnexpectedProposalState(proposalId, state(proposalId), bytes32(0));
        }

        uint256 snapshot = clock() + votingDelay();
        uint256 duration = votingPeriod();

        ProposalCore storage proposal = _proposals[proposalId];
        proposal.proposer = proposer;
        proposal.voteStart = SafeCast.toUint48(snapshot);
        proposal.voteDuration = SafeCast.toUint32(duration);

        emit ProposalCreated(
            proposalId,
            proposer,
            targets,
            values,
            new string[](targets.length),
            calldatas,
            snapshot,
            snapshot + duration,
            description
        );

        // Using a named return variable to avoid stack too deep errors
    }

    /// @inheritdoc IGovernor
    function queue(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public virtual returns (uint256) {
        uint256 proposalId = getProposalId(targets, values, calldatas, descriptionHash);

        _validateStateBitmap(proposalId, _encodeStateBitmap(ProposalState.Succeeded));

        uint48 etaSeconds = _queueOperations(proposalId, targets, values, calldatas, descriptionHash);

        if (etaSeconds != 0) {
            _proposals[proposalId].etaSeconds = etaSeconds;
            emit ProposalQueued(proposalId, etaSeconds);
        } else {
            revert GovernorQueueNotImplemented();
        }

        return proposalId;
    }

    /**
     * @dev Internal queuing mechanism. Can be overridden (without a super call) to modify the way queuing is
     * performed (for example adding a vault/timelock).
     *
     * This is empty by default, and must be overridden to implement queuing.
     *
     * This function returns a timestamp that describes the expected ETA for execution. If the returned value is 0
     * (which is the default value), the core will consider queueing did not succeed, and the public {queue} function
     * will revert.
     *
     * NOTE: Calling this function directly will NOT check the current state of the proposal, or emit the
     * `ProposalQueued` event. Queuing a proposal should be done using {queue}.
     */
    function _queueOperations(
        uint256 /*proposalId*/,
        address[] memory /*targets*/,
        uint256[] memory /*values*/,
        bytes[] memory /*calldatas*/,
        bytes32 /*descriptionHash*/
    ) internal virtual returns (uint48) {
        return 0;
    }

    /// @inheritdoc IGovernor
    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public payable virtual returns (uint256) {
        uint256 proposalId = getProposalId(targets, values, calldatas, descriptionHash);

        _validateStateBitmap(
            proposalId,
            _encodeStateBitmap(ProposalState.Succeeded) | _encodeStateBitmap(ProposalState.Queued)
        );

        // mark as executed before calls to avoid reentrancy
        _proposals[proposalId].executed = true;

        // before execute: register governance call in queue.
        if (_executor() != address(this)) {
            for (uint256 i = 0; i < targets.length; ++i) {
                if (targets[i] == address(this)) {
                    _governanceCall.pushBack(keccak256(calldatas[i]));
                }
            }
        }

        _executeOperations(proposalId, targets, values, calldatas, descriptionHash);

        // after execute: cleanup governance call queue.
        if (_executor() != address(this) && !_governanceCall.empty()) {
            _governanceCall.clear();
        }

        emit ProposalExecuted(proposalId);

        return proposalId;
    }

    /**
     * @dev Internal execution mechanism. Can be overridden (without a super call) to modify the way execution is
     * performed (for example adding a vault/timelock).
     *
     * NOTE: Calling this function directly will NOT check the current state of the proposal, set the executed flag to
     * true or emit the `ProposalExecuted` event. Executing a proposal should be done using {execute}.
     */
    function _executeOperations(
        uint256 /* proposalId */,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 /*descriptionHash*/
    ) internal virtual {
        for (uint256 i = 0; i < targets.length; ++i) {
            (bool success, bytes memory returndata) = targets[i].call{value: values[i]}(calldatas[i]);
            Address.verifyCallResult(success, returndata);
        }
    }

    /// @inheritdoc IGovernor
    function cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public virtual returns (uint256) {
        // The proposalId will be recomputed in the `_cancel` call further down. However we need the value before we
        // do the internal call, because we need to check the proposal state BEFORE the internal `_cancel` call
        // changes it. The `getProposalId` duplication has a cost that is limited, and that we accept.
        uint256 proposalId = getProposalId(targets, values, calldatas, descriptionHash);

        address caller = _msgSender();
        if (!_validateCancel(proposalId, caller)) revert GovernorUnableToCancel(proposalId, caller);

        return _cancel(targets, values, calldatas, descriptionHash);
    }

    /**
     * @dev Internal cancel mechanism with minimal restrictions. A proposal can be cancelled in any state other than
     * Canceled, Expired, or Executed. Once cancelled a proposal can't be re-submitted.
     *
     * Emits a {IGovernor-ProposalCanceled} event.
     */
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual returns (uint256) {
        uint256 proposalId = getProposalId(targets, values, calldatas, descriptionHash);

        _validateStateBitmap(
            proposalId,
            ALL_PROPOSAL_STATES_BITMAP ^
                _encodeStateBitmap(ProposalState.Canceled) ^
                _encodeStateBitmap(ProposalState.Expired) ^
                _encodeStateBitmap(ProposalState.Executed)
        );

        _proposals[proposalId].canceled = true;
        emit ProposalCanceled(proposalId);

        return proposalId;
    }

    /// @inheritdoc IGovernor
    function getVotes(address account, uint256 timepoint) public view virtual returns (uint256) {
        return _getVotes(account, timepoint, _defaultParams());
    }

    /// @inheritdoc IGovernor
    function getVotesWithParams(
        address account,
        uint256 timepoint,
        bytes memory params
    ) public view virtual returns (uint256) {
        return _getVotes(account, timepoint, params);
    }

    /// @inheritdoc IGovernor
    function castVote(uint256 proposalId, uint8 support) public virtual returns (uint256) {
        address voter = _msgSender();
        return _castVote(proposalId, voter, support, "");
    }

    /// @inheritdoc IGovernor
    function castVoteWithReason(
        uint256 proposalId,
        uint8 support,
        string calldata reason
    ) public virtual returns (uint256) {
        address voter = _msgSender();
        return _castVote(proposalId, voter, support, reason);
    }

    /// @inheritdoc IGovernor
    function castVoteWithReasonAndParams(
        uint256 proposalId,
        uint8 support,
        string calldata reason,
        bytes memory params
    ) public virtual returns (uint256) {
        address voter = _msgSender();
        return _castVote(proposalId, voter, support, reason, params);
    }

    /// @inheritdoc IGovernor
    function castVoteBySig(
        uint256 proposalId,
        uint8 support,
        address voter,
        bytes memory signature
    ) public virtual returns (uint256) {
        if (!_validateVoteSig(proposalId, support, voter, signature)) {
            revert GovernorInvalidSignature(voter);
        }
        return _castVote(proposalId, voter, support, "");
    }

    /// @inheritdoc IGovernor
    function castVoteWithReasonAndParamsBySig(
        uint256 proposalId,
        uint8 support,
        address voter,
        string calldata reason,
        bytes memory params,
        bytes memory signature
    ) public virtual returns (uint256) {
        if (!_validateExtendedVoteSig(proposalId, support, voter, reason, params, signature)) {
            revert GovernorInvalidSignature(voter);
        }
        return _castVote(proposalId, voter, support, reason, params);
    }

    /// @dev Validate the `signature` used in {castVoteBySig} function.
    function _validateVoteSig(
        uint256 proposalId,
        uint8 support,
        address voter,
        bytes memory signature
    ) internal virtual returns (bool) {
        return
            SignatureChecker.isValidSignatureNow(
                voter,
                _hashTypedDataV4(keccak256(abi.encode(BALLOT_TYPEHASH, proposalId, support, voter, _useNonce(voter)))),
                signature
            );
    }

    /// @dev Validate the `signature` used in {castVoteWithReasonAndParamsBySig} function.
    function _validateExtendedVoteSig(
        uint256 proposalId,
        uint8 support,
        address voter,
        string memory reason,
        bytes memory params,
        bytes memory signature
    ) internal virtual returns (bool) {
        return
            SignatureChecker.isValidSignatureNow(
                voter,
                _hashTypedDataV4(
                    keccak256(
                        abi.encode(
                            EXTENDED_BALLOT_TYPEHASH,
                            proposalId,
                            support,
                            voter,
                            _useNonce(voter),
                            keccak256(bytes(reason)),
                            keccak256(params)
                        )
                    )
                ),
                signature
            );
    }

    /**
     * @dev Internal vote casting mechanism: Check that the vote is pending, that it has not been cast yet, retrieve
     * voting weight using {IGovernor-getVotes} and call the {_countVote} internal function. Uses the _defaultParams().
     *
     * Emits a {IGovernor-VoteCast} event.
     */
    function _castVote(
        uint256 proposalId,
        address account,
        uint8 support,
        string memory reason
    ) internal virtual returns (uint256) {
        return _castVote(proposalId, account, support, reason, _defaultParams());
    }

    /**
     * @dev Internal vote casting mechanism: Check that the vote is pending, that it has not been cast yet, retrieve
     * voting weight using {IGovernor-getVotes} and call the {_countVote} internal function.
     *
     * Emits a {IGovernor-VoteCast} event.
     */
    function _castVote(
        uint256 proposalId,
        address account,
        uint8 support,
        string memory reason,
        bytes memory params
    ) internal virtual returns (uint256) {
        _validateStateBitmap(proposalId, _encodeStateBitmap(ProposalState.Active));

        uint256 totalWeight = _getVotes(account, proposalSnapshot(proposalId), params);
        uint256 votedWeight = _countVote(proposalId, account, support, totalWeight, params);

        if (params.length == 0) {
            emit VoteCast(account, proposalId, support, votedWeight, reason);
        } else {
            emit VoteCastWithParams(account, proposalId, support, votedWeight, reason, params);
        }

        _tallyUpdated(proposalId);

        return votedWeight;
    }

    /**
     * @dev Relays a transaction or function call to an arbitrary target. In cases where the governance executor
     * is some contract other than the governor itself, like when using a timelock, this function can be invoked
     * in a governance proposal to recover tokens or Ether that was sent to the governor contract by mistake.
     * Note that if the executor is simply the governor itself, use of `relay` is redundant.
     */
    function relay(address target, uint256 value, bytes calldata data) external payable virtual onlyGovernance {
        (bool success, bytes memory returndata) = target.call{value: value}(data);
        Address.verifyCallResult(success, returndata);
    }

    /**
     * @dev Address through which the governor executes action. Will be overloaded by module that execute actions
     * through another contract such as a timelock.
     */
    function _executor() internal view virtual returns (address) {
        return address(this);
    }

    /**
     * @dev See {IERC721Receiver-onERC721Received}.
     * Receiving tokens is disabled if the governance executor is other than the governor itself (eg. when using with a timelock).
     */
    function onERC721Received(address, address, uint256, bytes memory) public virtual returns (bytes4) {
        if (_executor() != address(this)) {
            revert GovernorDisabledDeposit();
        }
        return this.onERC721Received.selector;
    }

    /**
     * @dev See {IERC1155Receiver-onERC1155Received}.
     * Receiving tokens is disabled if the governance executor is other than the governor itself (eg. when using with a timelock).
     */
    function onERC1155Received(address, address, uint256, uint256, bytes memory) public virtual returns (bytes4) {
        if (_executor() != address(this)) {
            revert GovernorDisabledDeposit();
        }
        return this.onERC1155Received.selector;
    }

    /**
     * @dev See {IERC1155Receiver-onERC1155BatchReceived}.
     * Receiving tokens is disabled if the governance executor is other than the governor itself (eg. when using with a timelock).
     */
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public virtual returns (bytes4) {
        if (_executor() != address(this)) {
            revert GovernorDisabledDeposit();
        }
        return this.onERC1155BatchReceived.selector;
    }

    /**
     * @dev Encodes a `ProposalState` into a `bytes32` representation where each bit enabled corresponds to
     * the underlying position in the `ProposalState` enum. For example:
     *
     * 0x000...10000
     *   ^^^^^^------ ...
     *         ^----- Succeeded
     *          ^---- Defeated
     *           ^--- Canceled
     *            ^-- Active
     *             ^- Pending
     */
    function _encodeStateBitmap(ProposalState proposalState) internal pure returns (bytes32) {
        return bytes32(1 << uint8(proposalState));
    }

    /**
     * @dev Check that the current state of a proposal matches the requirements described by the `allowedStates` bitmap.
     * This bitmap should be built using `_encodeStateBitmap`.
     *
     * If requirements are not met, reverts with a {GovernorUnexpectedProposalState} error.
     */
    function _validateStateBitmap(uint256 proposalId, bytes32 allowedStates) internal view returns (ProposalState) {
        ProposalState currentState = state(proposalId);
        if (_encodeStateBitmap(currentState) & allowedStates == bytes32(0)) {
            revert GovernorUnexpectedProposalState(proposalId, currentState, allowedStates);
        }
        return currentState;
    }

    /*
     * @dev Check if the proposer is authorized to submit a proposal with the given description.
     *
     * If the proposal description ends with `#proposer=0x???`, where `0x???` is an address written as a hex string
     * (case insensitive), then the submission of this proposal will only be authorized to said address.
     *
     * This is used for frontrunning protection. By adding this pattern at the end of their proposal, one can ensure
     * that no other address can submit the same proposal. An attacker would have to either remove or change that part,
     * which would result in a different proposal id.
     *
     * If the description does not match this pattern, it is unrestricted and anyone can submit it. This includes:
     * - If the `0x???` part is not a valid hex string.
     * - If the `0x???` part is a valid hex string, but does not contain exactly 40 hex digits.
     * - If it ends with the expected suffix followed by newlines or other whitespace.
     * - If it ends with some other similar suffix, e.g. `#other=abc`.
     * - If it does not end with any such suffix.
     */
    function _isValidDescriptionForProposer(
        address proposer,
        string memory description
    ) internal view virtual returns (bool) {
        unchecked {
            uint256 length = bytes(description).length;

            // Length is too short to contain a valid proposer suffix
            if (length < 52) {
                return true;
            }

            // Extract what would be the `#proposer=` marker beginning the suffix
            bytes10 marker = bytes10(_unsafeReadBytesOffset(bytes(description), length - 52));

            // If the marker is not found, there is no proposer suffix to check
            if (marker != bytes10("#proposer=")) {
                return true;
            }

            // Check that the last 42 characters (after the marker) are a properly formatted address.
            (bool success, address recovered) = Strings.tryParseAddress(description, length - 42, length);
            return !success || recovered == proposer;
        }
    }

    /**
     * @dev Check if the `caller` can cancel the proposal with the given `proposalId`.
     *
     * The default implementation allows the proposal proposer to cancel the proposal during the pending state.
     */
    function _validateCancel(uint256 proposalId, address caller) internal view virtual returns (bool) {
        return (state(proposalId) == ProposalState.Pending) && caller == proposalProposer(proposalId);
    }

    /// @inheritdoc IERC6372
    function clock() public view virtual returns (uint48);

    /// @inheritdoc IERC6372
    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public view virtual returns (string memory);

    /// @inheritdoc IGovernor
    function votingDelay() public view virtual returns (uint256);

    /// @inheritdoc IGovernor
    function votingPeriod() public view virtual returns (uint256);

    /// @inheritdoc IGovernor
    function quorum(uint256 timepoint) public view virtual returns (uint256);

    /**
     * @dev Reads a bytes32 from a bytes array without bounds checking.
     *
     * NOTE: making this function internal would mean it could be used with memory unsafe offset, and marking the
     * assembly block as such would prevent some optimizations.
     */
    function _unsafeReadBytesOffset(bytes memory buffer, uint256 offset) private pure returns (bytes32 value) {
        // This is not memory safe in the general case, but all calls to this private function are within bounds.
        assembly ("memory-safe") {
            value := mload(add(add(buffer, 0x20), offset))
        }
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/governance/IGovernor.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (governance/IGovernor.sol)

pragma solidity >=0.8.4;

import {IERC165} from "../interfaces/IERC165.sol";
import {IERC6372} from "../interfaces/IERC6372.sol";

/**
 * @dev Interface of the {Governor} core.
 *
 * NOTE: Event parameters lack the `indexed` keyword for compatibility with GovernorBravo events.
 * Making event parameters `indexed` affects how events are decoded, potentially breaking existing indexers.
 */
interface IGovernor is IERC165, IERC6372 {
    enum ProposalState {
        Pending,
        Active,
        Canceled,
        Defeated,
        Succeeded,
        Queued,
        Expired,
        Executed
    }

    /**
     * @dev Empty proposal or a mismatch between the parameters length for a proposal call.
     */
    error GovernorInvalidProposalLength(uint256 targets, uint256 calldatas, uint256 values);

    /**
     * @dev The vote was already cast.
     */
    error GovernorAlreadyCastVote(address voter);

    /**
     * @dev Token deposits are disabled in this contract.
     */
    error GovernorDisabledDeposit();

    /**
     * @dev The `account` is not the governance executor.
     */
    error GovernorOnlyExecutor(address account);

    /**
     * @dev The `proposalId` doesn't exist.
     */
    error GovernorNonexistentProposal(uint256 proposalId);

    /**
     * @dev The current state of a proposal is not the required for performing an operation.
     * The `expectedStates` is a bitmap with the bits enabled for each ProposalState enum position
     * counting from right to left.
     *
     * NOTE: If `expectedState` is `bytes32(0)`, the proposal is expected to not be in any state (i.e. not exist).
     * This is the case when a proposal that is expected to be unset is already initiated (the proposal is duplicated).
     *
     * See {Governor-_encodeStateBitmap}.
     */
    error GovernorUnexpectedProposalState(uint256 proposalId, ProposalState current, bytes32 expectedStates);

    /**
     * @dev The voting period set is not a valid period.
     */
    error GovernorInvalidVotingPeriod(uint256 votingPeriod);

    /**
     * @dev The `proposer` does not have the required votes to create a proposal.
     */
    error GovernorInsufficientProposerVotes(address proposer, uint256 votes, uint256 threshold);

    /**
     * @dev The `proposer` is not allowed to create a proposal.
     */
    error GovernorRestrictedProposer(address proposer);

    /**
     * @dev The vote type used is not valid for the corresponding counting module.
     */
    error GovernorInvalidVoteType();

    /**
     * @dev The provided params buffer is not supported by the counting module.
     */
    error GovernorInvalidVoteParams();

    /**
     * @dev Queue operation is not implemented for this governor. Execute should be called directly.
     */
    error GovernorQueueNotImplemented();

    /**
     * @dev The proposal hasn't been queued yet.
     */
    error GovernorNotQueuedProposal(uint256 proposalId);

    /**
     * @dev The proposal has already been queued.
     */
    error GovernorAlreadyQueuedProposal(uint256 proposalId);

    /**
     * @dev The provided signature is not valid for the expected `voter`.
     * If the `voter` is a contract, the signature is not valid using {IERC1271-isValidSignature}.
     */
    error GovernorInvalidSignature(address voter);

    /**
     * @dev The given `account` is unable to cancel the proposal with given `proposalId`.
     */
    error GovernorUnableToCancel(uint256 proposalId, address account);

    /**
     * @dev Emitted when a proposal is created.
     */
    event ProposalCreated(
        uint256 proposalId,
        address proposer,
        address[] targets,
        uint256[] values,
        string[] signatures,
        bytes[] calldatas,
        uint256 voteStart,
        uint256 voteEnd,
        string description
    );

    /**
     * @dev Emitted when a proposal is queued.
     */
    event ProposalQueued(uint256 proposalId, uint256 etaSeconds);

    /**
     * @dev Emitted when a proposal is executed.
     */
    event ProposalExecuted(uint256 proposalId);

    /**
     * @dev Emitted when a proposal is canceled.
     */
    event ProposalCanceled(uint256 proposalId);

    /**
     * @dev Emitted when a vote is cast without params.
     *
     * Note: `support` values should be seen as buckets. Their interpretation depends on the voting module used.
     */
    event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason);

    /**
     * @dev Emitted when a vote is cast with params.
     *
     * Note: `support` values should be seen as buckets. Their interpretation depends on the voting module used.
     * `params` are additional encoded parameters. Their interpretation  also depends on the voting module used.
     */
    event VoteCastWithParams(
        address indexed voter,
        uint256 proposalId,
        uint8 support,
        uint256 weight,
        string reason,
        bytes params
    );

    /**
     * @notice module:core
     * @dev Name of the governor instance (used in building the EIP-712 domain separator).
     */
    function name() external view returns (string memory);

    /**
     * @notice module:core
     * @dev Version of the governor instance (used in building the EIP-712 domain separator). Default: "1"
     */
    function version() external view returns (string memory);

    /**
     * @notice module:voting
     * @dev A description of the possible `support` values for {castVote} and the way these votes are counted, meant to
     * be consumed by UIs to show correct vote options and interpret the results. The string is a URL-encoded sequence of
     * key-value pairs that each describe one aspect, for example `support=bravo&quorum=for,abstain`.
     *
     * There are 2 standard keys: `support` and `quorum`.
     *
     * - `support=bravo` refers to the vote options 0 = Against, 1 = For, 2 = Abstain, as in `GovernorBravo`.
     * - `quorum=bravo` means that only For votes are counted towards quorum.
     * - `quorum=for,abstain` means that both For and Abstain votes are counted towards quorum.
     *
     * If a counting module makes use of encoded `params`, it should  include this under a `params` key with a unique
     * name that describes the behavior. For example:
     *
     * - `params=fractional` might refer to a scheme where votes are divided fractionally between for/against/abstain.
     * - `params=erc721` might refer to a scheme where specific NFTs are delegated to vote.
     *
     * NOTE: The string can be decoded by the standard
     * https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams[`URLSearchParams`]
     * JavaScript class.
     */
    // solhint-disable-next-line func-name-mixedcase
    function COUNTING_MODE() external view returns (string memory);

    /**
     * @notice module:core
     * @dev Hashing function used to (re)build the proposal id from the proposal details.
     *
     * NOTE: For all off-chain and external calls, use {getProposalId}.
     */
    function hashProposal(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) external pure returns (uint256);

    /**
     * @notice module:core
     * @dev Function used to get the proposal id from the proposal details.
     */
    function getProposalId(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) external view returns (uint256);

    /**
     * @notice module:core
     * @dev Current state of a proposal, following Compound's convention
     */
    function state(uint256 proposalId) external view returns (ProposalState);

    /**
     * @notice module:core
     * @dev The number of votes required in order for a voter to become a proposer.
     */
    function proposalThreshold() external view returns (uint256);

    /**
     * @notice module:core
     * @dev Timepoint used to retrieve user's votes and quorum. If using block number (as per Compound's Comp), the
     * snapshot is performed at the end of this block. Hence, voting for this proposal starts at the beginning of the
     * following block.
     */
    function proposalSnapshot(uint256 proposalId) external view returns (uint256);

    /**
     * @notice module:core
     * @dev Timepoint at which votes close. If using block number, votes close at the end of this block, so it is
     * possible to cast a vote during this block.
     */
    function proposalDeadline(uint256 proposalId) external view returns (uint256);

    /**
     * @notice module:core
     * @dev The account that created a proposal.
     */
    function proposalProposer(uint256 proposalId) external view returns (address);

    /**
     * @notice module:core
     * @dev The time when a queued proposal becomes executable ("ETA"). Unlike {proposalSnapshot} and
     * {proposalDeadline}, this doesn't use the governor clock, and instead relies on the executor's clock which may be
     * different. In most cases this will be a timestamp.
     */
    function proposalEta(uint256 proposalId) external view returns (uint256);

    /**
     * @notice module:core
     * @dev Whether a proposal needs to be queued before execution.
     */
    function proposalNeedsQueuing(uint256 proposalId) external view returns (bool);

    /**
     * @notice module:user-config
     * @dev Delay, between the proposal is created and the vote starts. The unit this duration is expressed in depends
     * on the clock (see ERC-6372) this contract uses.
     *
     * This can be increased to leave time for users to buy voting power, or delegate it, before the voting of a
     * proposal starts.
     *
     * NOTE: While this interface returns a uint256, timepoints are stored as uint48 following the ERC-6372 clock type.
     * Consequently this value must fit in a uint48 (when added to the current clock). See {IERC6372-clock}.
     */
    function votingDelay() external view returns (uint256);

    /**
     * @notice module:user-config
     * @dev Delay between the vote start and vote end. The unit this duration is expressed in depends on the clock
     * (see ERC-6372) this contract uses.
     *
     * NOTE: The {votingDelay} can delay the start of the vote. This must be considered when setting the voting
     * duration compared to the voting delay.
     *
     * NOTE: This value is stored when the proposal is submitted so that possible changes to the value do not affect
     * proposals that have already been submitted. The type used to save it is a uint32. Consequently, while this
     * interface returns a uint256, the value it returns should fit in a uint32.
     */
    function votingPeriod() external view returns (uint256);

    /**
     * @notice module:user-config
     * @dev Minimum number of cast voted required for a proposal to be successful.
     *
     * NOTE: The `timepoint` parameter corresponds to the snapshot used for counting vote. This allows to scale the
     * quorum depending on values such as the totalSupply of a token at this timepoint (see {ERC20Votes}).
     */
    function quorum(uint256 timepoint) external view returns (uint256);

    /**
     * @notice module:reputation
     * @dev Voting power of an `account` at a specific `timepoint`.
     *
     * Note: this can be implemented in a number of ways, for example by reading the delegated balance from one (or
     * multiple), {ERC20Votes} tokens.
     */
    function getVotes(address account, uint256 timepoint) external view returns (uint256);

    /**
     * @notice module:reputation
     * @dev Voting power of an `account` at a specific `timepoint` given additional encoded parameters.
     */
    function getVotesWithParams(
        address account,
        uint256 timepoint,
        bytes memory params
    ) external view returns (uint256);

    /**
     * @notice module:voting
     * @dev Returns whether `account` has cast a vote on `proposalId`.
     */
    function hasVoted(uint256 proposalId, address account) external view returns (bool);

    /**
     * @dev Create a new proposal. Vote start after a delay specified by {IGovernor-votingDelay} and lasts for a
     * duration specified by {IGovernor-votingPeriod}.
     *
     * Emits a {ProposalCreated} event.
     *
     * NOTE: The state of the Governor and `targets` may change between the proposal creation and its execution.
     * This may be the result of third party actions on the targeted contracts, or other governor proposals.
     * For example, the balance of this contract could be updated or its access control permissions may be modified,
     * possibly compromising the proposal's ability to execute successfully (e.g. the governor doesn't have enough
     * value to cover a proposal with multiple transfers).
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external returns (uint256 proposalId);

    /**
     * @dev Queue a proposal. Some governors require this step to be performed before execution can happen. If queuing
     * is not necessary, this function may revert.
     * Queuing a proposal requires the quorum to be reached, the vote to be successful, and the deadline to be reached.
     *
     * Emits a {ProposalQueued} event.
     */
    function queue(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) external returns (uint256 proposalId);

    /**
     * @dev Execute a successful proposal. This requires the quorum to be reached, the vote to be successful, and the
     * deadline to be reached. Depending on the governor it might also be required that the proposal was queued and
     * that some delay passed.
     *
     * Emits a {ProposalExecuted} event.
     *
     * NOTE: Some modules can modify the requirements for execution, for example by adding an additional timelock.
     */
    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) external payable returns (uint256 proposalId);

    /**
     * @dev Cancel a proposal. A proposal is cancellable by the proposer, but only while it is Pending state, i.e.
     * before the vote starts.
     *
     * Emits a {ProposalCanceled} event.
     */
    function cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) external returns (uint256 proposalId);

    /**
     * @dev Cast a vote
     *
     * Emits a {VoteCast} event.
     */
    function castVote(uint256 proposalId, uint8 support) external returns (uint256 balance);

    /**
     * @dev Cast a vote with a reason
     *
     * Emits a {VoteCast} event.
     */
    function castVoteWithReason(
        uint256 proposalId,
        uint8 support,
        string calldata reason
    ) external returns (uint256 balance);

    /**
     * @dev Cast a vote with a reason and additional encoded parameters
     *
     * Emits a {VoteCast} or {VoteCastWithParams} event depending on the length of params.
     */
    function castVoteWithReasonAndParams(
        uint256 proposalId,
        uint8 support,
        string calldata reason,
        bytes memory params
    ) external returns (uint256 balance);

    /**
     * @dev Cast a vote using the voter's signature, including ERC-1271 signature support.
     *
     * Emits a {VoteCast} event.
     */
    function castVoteBySig(
        uint256 proposalId,
        uint8 support,
        address voter,
        bytes memory signature
    ) external returns (uint256 balance);

    /**
     * @dev Cast a vote with a reason and additional encoded parameters using the voter's signature,
     * including ERC-1271 signature support.
     *
     * Emits a {VoteCast} or {VoteCastWithParams} event depending on the length of params.
     */
    function castVoteWithReasonAndParamsBySig(
        uint256 proposalId,
        uint8 support,
        address voter,
        string calldata reason,
        bytes memory params,
        bytes memory signature
    ) external returns (uint256 balance);
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/governance/TimelockController.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (governance/TimelockController.sol)

pragma solidity ^0.8.20;

import {AccessControl} from "../access/AccessControl.sol";
import {ERC721Holder} from "../token/ERC721/utils/ERC721Holder.sol";
import {ERC1155Holder} from "../token/ERC1155/utils/ERC1155Holder.sol";
import {Address} from "../utils/Address.sol";
import {IERC165} from "../utils/introspection/ERC165.sol";

/**
 * @dev Contract module which acts as a timelocked controller. When set as the
 * owner of an `Ownable` smart contract, it enforces a timelock on all
 * `onlyOwner` maintenance operations. This gives time for users of the
 * controlled contract to exit before a potentially dangerous maintenance
 * operation is applied.
 *
 * By default, this contract is self administered, meaning administration tasks
 * have to go through the timelock process. The proposer (resp executor) role
 * is in charge of proposing (resp executing) operations. A common use case is
 * to position this {TimelockController} as the owner of a smart contract, with
 * a multisig or a DAO as the sole proposer.
 */
contract TimelockController is AccessControl, ERC721Holder, ERC1155Holder {
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 public constant CANCELLER_ROLE = keccak256("CANCELLER_ROLE");
    uint256 internal constant _DONE_TIMESTAMP = uint256(1);

    mapping(bytes32 id => uint256) private _timestamps;
    uint256 private _minDelay;

    enum OperationState {
        Unset,
        Waiting,
        Ready,
        Done
    }

    /**
     * @dev Mismatch between the parameters length for an operation call.
     */
    error TimelockInvalidOperationLength(uint256 targets, uint256 payloads, uint256 values);

    /**
     * @dev The schedule operation doesn't meet the minimum delay.
     */
    error TimelockInsufficientDelay(uint256 delay, uint256 minDelay);

    /**
     * @dev The current state of an operation is not as required.
     * The `expectedStates` is a bitmap with the bits enabled for each OperationState enum position
     * counting from right to left.
     *
     * See {_encodeStateBitmap}.
     */
    error TimelockUnexpectedOperationState(bytes32 operationId, bytes32 expectedStates);

    /**
     * @dev The predecessor to an operation not yet done.
     */
    error TimelockUnexecutedPredecessor(bytes32 predecessorId);

    /**
     * @dev The caller account is not authorized.
     */
    error TimelockUnauthorizedCaller(address caller);

    /**
     * @dev Emitted when a call is scheduled as part of operation `id`.
     */
    event CallScheduled(
        bytes32 indexed id,
        uint256 indexed index,
        address target,
        uint256 value,
        bytes data,
        bytes32 predecessor,
        uint256 delay
    );

    /**
     * @dev Emitted when a call is performed as part of operation `id`.
     */
    event CallExecuted(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data);

    /**
     * @dev Emitted when new proposal is scheduled with non-zero salt.
     */
    event CallSalt(bytes32 indexed id, bytes32 salt);

    /**
     * @dev Emitted when operation `id` is cancelled.
     */
    event Cancelled(bytes32 indexed id);

    /**
     * @dev Emitted when the minimum delay for future operations is modified.
     */
    event MinDelayChange(uint256 oldDuration, uint256 newDuration);

    /**
     * @dev Initializes the contract with the following parameters:
     *
     * - `minDelay`: initial minimum delay in seconds for operations
     * - `proposers`: accounts to be granted proposer and canceller roles
     * - `executors`: accounts to be granted executor role
     * - `admin`: optional account to be granted admin role; disable with zero address
     *
     * IMPORTANT: The optional admin can aid with initial configuration of roles after deployment
     * without being subject to delay, but this role should be subsequently renounced in favor of
     * administration through timelocked proposals. Previous versions of this contract would assign
     * this admin to the deployer automatically and should be renounced as well.
     */
    constructor(uint256 minDelay, address[] memory proposers, address[] memory executors, address admin) {
        // self administration
        _grantRole(DEFAULT_ADMIN_ROLE, address(this));

        // optional admin
        if (admin != address(0)) {
            _grantRole(DEFAULT_ADMIN_ROLE, admin);
        }

        // register proposers and cancellers
        for (uint256 i = 0; i < proposers.length; ++i) {
            _grantRole(PROPOSER_ROLE, proposers[i]);
            _grantRole(CANCELLER_ROLE, proposers[i]);
        }

        // register executors
        for (uint256 i = 0; i < executors.length; ++i) {
            _grantRole(EXECUTOR_ROLE, executors[i]);
        }

        _minDelay = minDelay;
        emit MinDelayChange(0, minDelay);
    }

    /**
     * @dev Modifier to make a function callable only by a certain role. In
     * addition to checking the sender's role, `address(0)` 's role is also
     * considered. Granting a role to `address(0)` is equivalent to enabling
     * this role for everyone.
     */
    modifier onlyRoleOrOpenRole(bytes32 role) {
        if (!hasRole(role, address(0))) {
            _checkRole(role, _msgSender());
        }
        _;
    }

    /**
     * @dev Contract might receive/hold ETH as part of the maintenance process.
     */
    receive() external payable virtual {}

    /// @inheritdoc IERC165
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(AccessControl, ERC1155Holder) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns whether an id corresponds to a registered operation. This
     * includes both Waiting, Ready, and Done operations.
     */
    function isOperation(bytes32 id) public view returns (bool) {
        return getOperationState(id) != OperationState.Unset;
    }

    /**
     * @dev Returns whether an operation is pending or not. Note that a "pending" operation may also be "ready".
     */
    function isOperationPending(bytes32 id) public view returns (bool) {
        OperationState state = getOperationState(id);
        return state == OperationState.Waiting || state == OperationState.Ready;
    }

    /**
     * @dev Returns whether an operation is ready for execution. Note that a "ready" operation is also "pending".
     */
    function isOperationReady(bytes32 id) public view returns (bool) {
        return getOperationState(id) == OperationState.Ready;
    }

    /**
     * @dev Returns whether an operation is done or not.
     */
    function isOperationDone(bytes32 id) public view returns (bool) {
        return getOperationState(id) == OperationState.Done;
    }

    /**
     * @dev Returns the timestamp at which an operation becomes ready (0 for
     * unset operations, 1 for done operations).
     */
    function getTimestamp(bytes32 id) public view virtual returns (uint256) {
        return _timestamps[id];
    }

    /**
     * @dev Returns operation state.
     */
    function getOperationState(bytes32 id) public view virtual returns (OperationState) {
        uint256 timestamp = getTimestamp(id);
        if (timestamp == 0) {
            return OperationState.Unset;
        } else if (timestamp == _DONE_TIMESTAMP) {
            return OperationState.Done;
        } else if (timestamp > block.timestamp) {
            return OperationState.Waiting;
        } else {
            return OperationState.Ready;
        }
    }

    /**
     * @dev Returns the minimum delay in seconds for an operation to become valid.
     *
     * This value can be changed by executing an operation that calls `updateDelay`.
     */
    function getMinDelay() public view virtual returns (uint256) {
        return _minDelay;
    }

    /**
     * @dev Returns the identifier of an operation containing a single
     * transaction.
     */
    function hashOperation(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) public pure virtual returns (bytes32) {
        return keccak256(abi.encode(target, value, data, predecessor, salt));
    }

    /**
     * @dev Returns the identifier of an operation containing a batch of
     * transactions.
     */
    function hashOperationBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata payloads,
        bytes32 predecessor,
        bytes32 salt
    ) public pure virtual returns (bytes32) {
        return keccak256(abi.encode(targets, values, payloads, predecessor, salt));
    }

    /**
     * @dev Schedule an operation containing a single transaction.
     *
     * Emits {CallSalt} if salt is nonzero, and {CallScheduled}.
     *
     * Requirements:
     *
     * - the caller must have the 'proposer' role.
     */
    function schedule(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt,
        uint256 delay
    ) public virtual onlyRole(PROPOSER_ROLE) {
        bytes32 id = hashOperation(target, value, data, predecessor, salt);
        _schedule(id, delay);
        emit CallScheduled(id, 0, target, value, data, predecessor, delay);
        if (salt != bytes32(0)) {
            emit CallSalt(id, salt);
        }
    }

    /**
     * @dev Schedule an operation containing a batch of transactions.
     *
     * Emits {CallSalt} if salt is nonzero, and one {CallScheduled} event per transaction in the batch.
     *
     * Requirements:
     *
     * - the caller must have the 'proposer' role.
     */
    function scheduleBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata payloads,
        bytes32 predecessor,
        bytes32 salt,
        uint256 delay
    ) public virtual onlyRole(PROPOSER_ROLE) {
        if (targets.length != values.length || targets.length != payloads.length) {
            revert TimelockInvalidOperationLength(targets.length, payloads.length, values.length);
        }

        bytes32 id = hashOperationBatch(targets, values, payloads, predecessor, salt);
        _schedule(id, delay);
        for (uint256 i = 0; i < targets.length; ++i) {
            emit CallScheduled(id, i, targets[i], values[i], payloads[i], predecessor, delay);
        }
        if (salt != bytes32(0)) {
            emit CallSalt(id, salt);
        }
    }

    /**
     * @dev Schedule an operation that is to become valid after a given delay.
     */
    function _schedule(bytes32 id, uint256 delay) private {
        if (isOperation(id)) {
            revert TimelockUnexpectedOperationState(id, _encodeStateBitmap(OperationState.Unset));
        }
        uint256 minDelay = getMinDelay();
        if (delay < minDelay) {
            revert TimelockInsufficientDelay(delay, minDelay);
        }
        _timestamps[id] = block.timestamp + delay;
    }

    /**
     * @dev Cancel an operation.
     *
     * Requirements:
     *
     * - the caller must have the 'canceller' role.
     */
    function cancel(bytes32 id) public virtual onlyRole(CANCELLER_ROLE) {
        if (!isOperationPending(id)) {
            revert TimelockUnexpectedOperationState(
                id,
                _encodeStateBitmap(OperationState.Waiting) | _encodeStateBitmap(OperationState.Ready)
            );
        }
        delete _timestamps[id];

        emit Cancelled(id);
    }

    /**
     * @dev Execute an (ready) operation containing a single transaction.
     *
     * Emits a {CallExecuted} event.
     *
     * Requirements:
     *
     * - the caller must have the 'executor' role.
     */
    // This function can reenter, but it doesn't pose a risk because _afterCall checks that the proposal is pending,
    // thus any modifications to the operation during reentrancy should be caught.
    // slither-disable-next-line reentrancy-eth
    function execute(
        address target,
        uint256 value,
        bytes calldata payload,
        bytes32 predecessor,
        bytes32 salt
    ) public payable virtual onlyRoleOrOpenRole(EXECUTOR_ROLE) {
        bytes32 id = hashOperation(target, value, payload, predecessor, salt);

        _beforeCall(id, predecessor);
        _execute(target, value, payload);
        emit CallExecuted(id, 0, target, value, payload);
        _afterCall(id);
    }

    /**
     * @dev Execute an (ready) operation containing a batch of transactions.
     *
     * Emits one {CallExecuted} event per transaction in the batch.
     *
     * Requirements:
     *
     * - the caller must have the 'executor' role.
     */
    // This function can reenter, but it doesn't pose a risk because _afterCall checks that the proposal is pending,
    // thus any modifications to the operation during reentrancy should be caught.
    // slither-disable-next-line reentrancy-eth
    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata payloads,
        bytes32 predecessor,
        bytes32 salt
    ) public payable virtual onlyRoleOrOpenRole(EXECUTOR_ROLE) {
        if (targets.length != values.length || targets.length != payloads.length) {
            revert TimelockInvalidOperationLength(targets.length, payloads.length, values.length);
        }

        bytes32 id = hashOperationBatch(targets, values, payloads, predecessor, salt);

        _beforeCall(id, predecessor);
        for (uint256 i = 0; i < targets.length; ++i) {
            address target = targets[i];
            uint256 value = values[i];
            bytes calldata payload = payloads[i];
            _execute(target, value, payload);
            emit CallExecuted(id, i, target, value, payload);
        }
        _afterCall(id);
    }

    /**
     * @dev Execute an operation's call.
     */
    function _execute(address target, uint256 value, bytes calldata data) internal virtual {
        (bool success, bytes memory returndata) = target.call{value: value}(data);
        Address.verifyCallResult(success, returndata);
    }

    /**
     * @dev Checks before execution of an operation's calls.
     */
    function _beforeCall(bytes32 id, bytes32 predecessor) private view {
        if (!isOperationReady(id)) {
            revert TimelockUnexpectedOperationState(id, _encodeStateBitmap(OperationState.Ready));
        }
        if (predecessor != bytes32(0) && !isOperationDone(predecessor)) {
            revert TimelockUnexecutedPredecessor(predecessor);
        }
    }

    /**
     * @dev Checks after execution of an operation's calls.
     */
    function _afterCall(bytes32 id) private {
        if (!isOperationReady(id)) {
            revert TimelockUnexpectedOperationState(id, _encodeStateBitmap(OperationState.Ready));
        }
        _timestamps[id] = _DONE_TIMESTAMP;
    }

    /**
     * @dev Changes the minimum timelock duration for future operations.
     *
     * Emits a {MinDelayChange} event.
     *
     * Requirements:
     *
     * - the caller must be the timelock itself. This can only be achieved by scheduling and later executing
     * an operation where the timelock is the target and the data is the ABI-encoded call to this function.
     */
    function updateDelay(uint256 newDelay) external virtual {
        address sender = _msgSender();
        if (sender != address(this)) {
            revert TimelockUnauthorizedCaller(sender);
        }
        emit MinDelayChange(_minDelay, newDelay);
        _minDelay = newDelay;
    }

    /**
     * @dev Encodes a `OperationState` into a `bytes32` representation where each bit enabled corresponds to
     * the underlying position in the `OperationState` enum. For example:
     *
     * 0x000...1000
     *   ^^^^^^----- ...
     *         ^---- Done
     *          ^--- Ready
     *           ^-- Waiting
     *            ^- Unset
     */
    function _encodeStateBitmap(OperationState operationState) internal pure returns (bytes32) {
        return bytes32(1 << uint8(operationState));
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (governance/extensions/GovernorCountingSimple.sol)

pragma solidity ^0.8.24;

import {IGovernor, Governor} from "../Governor.sol";

/**
 * @dev Extension of {Governor} for simple, 3 options, vote counting.
 */
abstract contract GovernorCountingSimple is Governor {
    /**
     * @dev Supported vote types. Matches Governor Bravo ordering.
     */
    enum VoteType {
        Against,
        For,
        Abstain
    }

    struct ProposalVote {
        uint256 againstVotes;
        uint256 forVotes;
        uint256 abstainVotes;
        mapping(address voter => bool) hasVoted;
    }

    mapping(uint256 proposalId => ProposalVote) private _proposalVotes;

    /// @inheritdoc IGovernor
    // solhint-disable-next-line func-name-mixedcase
    function COUNTING_MODE() public pure virtual override returns (string memory) {
        return "support=bravo&quorum=for,abstain";
    }

    /// @inheritdoc IGovernor
    function hasVoted(uint256 proposalId, address account) public view virtual override returns (bool) {
        return _proposalVotes[proposalId].hasVoted[account];
    }

    /**
     * @dev Accessor to the internal vote counts.
     */
    function proposalVotes(
        uint256 proposalId
    ) public view virtual returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) {
        ProposalVote storage proposalVote = _proposalVotes[proposalId];
        return (proposalVote.againstVotes, proposalVote.forVotes, proposalVote.abstainVotes);
    }

    /// @inheritdoc Governor
    function _quorumReached(uint256 proposalId) internal view virtual override returns (bool) {
        ProposalVote storage proposalVote = _proposalVotes[proposalId];

        return quorum(proposalSnapshot(proposalId)) <= proposalVote.forVotes + proposalVote.abstainVotes;
    }

    /**
     * @dev See {Governor-_voteSucceeded}. In this module, the forVotes must be strictly over the againstVotes.
     */
    function _voteSucceeded(uint256 proposalId) internal view virtual override returns (bool) {
        ProposalVote storage proposalVote = _proposalVotes[proposalId];

        return proposalVote.forVotes > proposalVote.againstVotes;
    }

    /**
     * @dev See {Governor-_countVote}. In this module, the support follows the `VoteType` enum (from Governor Bravo).
     */
    function _countVote(
        uint256 proposalId,
        address account,
        uint8 support,
        uint256 totalWeight,
        bytes memory // params
    ) internal virtual override returns (uint256) {
        ProposalVote storage proposalVote = _proposalVotes[proposalId];

        if (proposalVote.hasVoted[account]) {
            revert GovernorAlreadyCastVote(account);
        }
        proposalVote.hasVoted[account] = true;

        if (support == uint8(VoteType.Against)) {
            proposalVote.againstVotes += totalWeight;
        } else if (support == uint8(VoteType.For)) {
            proposalVote.forVotes += totalWeight;
        } else if (support == uint8(VoteType.Abstain)) {
            proposalVote.abstainVotes += totalWeight;
        } else {
            revert GovernorInvalidVoteType();
        }

        return totalWeight;
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/governance/extensions/GovernorSettings.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (governance/extensions/GovernorSettings.sol)

pragma solidity ^0.8.24;

import {IGovernor, Governor} from "../Governor.sol";

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

    /// @inheritdoc IGovernor
    function votingDelay() public view virtual override returns (uint256) {
        return _votingDelay;
    }

    /// @inheritdoc IGovernor
    function votingPeriod() public view virtual override returns (uint256) {
        return _votingPeriod;
    }

    /// @inheritdoc Governor
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

### `contracts/.deps/npm/@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (governance/extensions/GovernorTimelockControl.sol)

pragma solidity ^0.8.24;

import {IGovernor, Governor} from "../Governor.sol";
import {TimelockController} from "../TimelockController.sol";
import {SafeCast} from "../../utils/math/SafeCast.sol";

/**
 * @dev Extension of {Governor} that binds the execution process to an instance of {TimelockController}. This adds a
 * delay, enforced by the {TimelockController} to all successful proposal (in addition to the voting duration). The
 * {Governor} needs the proposer (and ideally the executor and canceller) roles for the {Governor} to work properly.
 *
 * Using this model means the proposal will be operated by the {TimelockController} and not by the {Governor}. Thus,
 * the assets and permissions must be attached to the {TimelockController}. Any asset sent to the {Governor} will be
 * inaccessible from a proposal, unless executed via {Governor-relay}.
 *
 * WARNING: Setting up the TimelockController to have additional proposers or cancelers besides the governor is very
 * risky, as it grants them the ability to: 1) execute operations as the timelock, and thus possibly performing
 * operations or accessing funds that are expected to only be accessible through a vote, and 2) block governance
 * proposals that have been approved by the voters, effectively executing a Denial of Service attack.
 */
abstract contract GovernorTimelockControl is Governor {
    TimelockController private _timelock;
    mapping(uint256 proposalId => bytes32) private _timelockIds;

    /**
     * @dev Emitted when the timelock controller used for proposal execution is modified.
     */
    event TimelockChange(address oldTimelock, address newTimelock);

    /**
     * @dev Set the timelock.
     */
    constructor(TimelockController timelockAddress) {
        _updateTimelock(timelockAddress);
    }

    /**
     * @dev Overridden version of the {Governor-state} function that considers the status reported by the timelock.
     */
    function state(uint256 proposalId) public view virtual override returns (ProposalState) {
        ProposalState currentState = super.state(proposalId);

        if (currentState != ProposalState.Queued) {
            return currentState;
        }

        bytes32 queueid = _timelockIds[proposalId];
        if (_timelock.isOperationPending(queueid)) {
            return ProposalState.Queued;
        } else if (_timelock.isOperationDone(queueid)) {
            // This can happen if the proposal is executed directly on the timelock.
            return ProposalState.Executed;
        } else {
            // This can happen if the proposal is canceled directly on the timelock.
            return ProposalState.Canceled;
        }
    }

    /**
     * @dev Public accessor to check the address of the timelock
     */
    function timelock() public view virtual returns (address) {
        return address(_timelock);
    }

    /// @inheritdoc IGovernor
    function proposalNeedsQueuing(uint256) public view virtual override returns (bool) {
        return true;
    }

    /**
     * @dev Function to queue a proposal to the timelock.
     */
    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual override returns (uint48) {
        uint256 delay = _timelock.getMinDelay();

        bytes32 salt = _timelockSalt(descriptionHash);
        _timelockIds[proposalId] = _timelock.hashOperationBatch(targets, values, calldatas, 0, salt);
        _timelock.scheduleBatch(targets, values, calldatas, 0, salt, delay);

        return SafeCast.toUint48(block.timestamp + delay);
    }

    /**
     * @dev Overridden version of the {Governor-_executeOperations} function that runs the already queued proposal
     * through the timelock.
     */
    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual override {
        // execute
        _timelock.executeBatch{value: msg.value}(targets, values, calldatas, 0, _timelockSalt(descriptionHash));
        // cleanup for refund
        delete _timelockIds[proposalId];
    }

    /**
     * @dev Overridden version of the {Governor-_cancel} function to cancel the timelocked proposal if it has already
     * been queued.
     */
    // This function can reenter through the external call to the timelock, but we assume the timelock is trusted and
    // well behaved (according to TimelockController) and this will not happen.
    // slither-disable-next-line reentrancy-no-eth
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual override returns (uint256) {
        uint256 proposalId = super._cancel(targets, values, calldatas, descriptionHash);

        bytes32 timelockId = _timelockIds[proposalId];
        if (timelockId != 0) {
            // cancel
            _timelock.cancel(timelockId);
            // cleanup
            delete _timelockIds[proposalId];
        }

        return proposalId;
    }

    /**
     * @dev Address through which the governor executes action. In this case, the timelock.
     */
    function _executor() internal view virtual override returns (address) {
        return address(_timelock);
    }

    /**
     * @dev Public endpoint to update the underlying timelock instance. Restricted to the timelock itself, so updates
     * must be proposed, scheduled, and executed through governance proposals.
     *
     * CAUTION: It is not recommended to change the timelock while there are other queued governance proposals.
     */
    function updateTimelock(TimelockController newTimelock) external virtual onlyGovernance {
        _updateTimelock(newTimelock);
    }

    function _updateTimelock(TimelockController newTimelock) private {
        emit TimelockChange(address(_timelock), address(newTimelock));
        _timelock = newTimelock;
    }

    /**
     * @dev Computes the {TimelockController} operation salt.
     *
     * It is computed with the governor address itself to avoid collisions across governor instances using the
     * same timelock.
     */
    function _timelockSalt(bytes32 descriptionHash) private view returns (bytes32) {
        return bytes20(address(this)) ^ descriptionHash;
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/governance/extensions/GovernorVotes.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (governance/extensions/GovernorVotes.sol)

pragma solidity ^0.8.24;

import {Governor} from "../Governor.sol";
import {IVotes} from "../utils/IVotes.sol";
import {IERC5805} from "../../interfaces/IERC5805.sol";
import {Time} from "../../utils/types/Time.sol";

/**
 * @dev Extension of {Governor} for voting weight extraction from an {ERC20Votes} token, or since v4.5 an {ERC721Votes}
 * token.
 */
abstract contract GovernorVotes is Governor {
    IERC5805 private immutable _token;

    constructor(IVotes tokenAddress) {
        _token = IERC5805(address(tokenAddress));
    }

    /**
     * @dev The token that voting power is sourced from.
     */
    function token() public view virtual returns (IERC5805) {
        return _token;
    }

    /**
     * @dev Clock (as specified in ERC-6372) is set to match the token's clock. Fallback to block numbers if the token
     * does not implement ERC-6372.
     */
    function clock() public view virtual override returns (uint48) {
        try token().clock() returns (uint48 timepoint) {
            return timepoint;
        } catch {
            return Time.blockNumber();
        }
    }

    /**
     * @dev Machine-readable description of the clock as specified in ERC-6372.
     */
    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public view virtual override returns (string memory) {
        try token().CLOCK_MODE() returns (string memory clockmode) {
            return clockmode;
        } catch {
            return "mode=blocknumber&from=default";
        }
    }

    /**
     * Read the voting weight from the token's built in snapshot mechanism (see {Governor-_getVotes}).
     */
    function _getVotes(
        address account,
        uint256 timepoint,
        bytes memory /*params*/
    ) internal view virtual override returns (uint256) {
        return token().getPastVotes(account, timepoint);
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (governance/extensions/GovernorVotesQuorumFraction.sol)

pragma solidity ^0.8.24;

import {GovernorVotes} from "./GovernorVotes.sol";
import {Math} from "../../utils/math/Math.sol";
import {SafeCast} from "../../utils/math/SafeCast.sol";
import {Checkpoints} from "../../utils/structs/Checkpoints.sol";

/**
 * @dev Extension of {Governor} for voting weight extraction from an {ERC20Votes} token and a quorum expressed as a
 * fraction of the total supply.
 */
abstract contract GovernorVotesQuorumFraction is GovernorVotes {
    using Checkpoints for Checkpoints.Trace208;

    Checkpoints.Trace208 private _quorumNumeratorHistory;

    event QuorumNumeratorUpdated(uint256 oldQuorumNumerator, uint256 newQuorumNumerator);

    /**
     * @dev The quorum set is not a valid fraction.
     */
    error GovernorInvalidQuorumFraction(uint256 quorumNumerator, uint256 quorumDenominator);

    /**
     * @dev Initialize quorum as a fraction of the token's total supply.
     *
     * The fraction is specified as `numerator / denominator`. By default the denominator is 100, so quorum is
     * specified as a percent: a numerator of 10 corresponds to quorum being 10% of total supply. The denominator can be
     * customized by overriding {quorumDenominator}.
     */
    constructor(uint256 quorumNumeratorValue) {
        _updateQuorumNumerator(quorumNumeratorValue);
    }

    /**
     * @dev Returns the current quorum numerator. See {quorumDenominator}.
     */
    function quorumNumerator() public view virtual returns (uint256) {
        return _quorumNumeratorHistory.latest();
    }

    /**
     * @dev Returns the quorum numerator at a specific timepoint. See {quorumDenominator}.
     */
    function quorumNumerator(uint256 timepoint) public view virtual returns (uint256) {
        return _optimisticUpperLookupRecent(_quorumNumeratorHistory, timepoint);
    }

    /**
     * @dev Returns the quorum denominator. Defaults to 100, but may be overridden.
     */
    function quorumDenominator() public view virtual returns (uint256) {
        return 100;
    }

    /**
     * @dev Returns the quorum for a timepoint, in terms of number of votes: `supply * numerator / denominator`.
     */
    function quorum(uint256 timepoint) public view virtual override returns (uint256) {
        return Math.mulDiv(token().getPastTotalSupply(timepoint), quorumNumerator(timepoint), quorumDenominator());
    }

    /**
     * @dev Changes the quorum numerator.
     *
     * Emits a {QuorumNumeratorUpdated} event.
     *
     * Requirements:
     *
     * - Must be called through a governance proposal.
     * - New numerator must be smaller or equal to the denominator.
     */
    function updateQuorumNumerator(uint256 newQuorumNumerator) external virtual onlyGovernance {
        _updateQuorumNumerator(newQuorumNumerator);
    }

    /**
     * @dev Changes the quorum numerator.
     *
     * Emits a {QuorumNumeratorUpdated} event.
     *
     * Requirements:
     *
     * - New numerator must be smaller or equal to the denominator.
     */
    function _updateQuorumNumerator(uint256 newQuorumNumerator) internal virtual {
        uint256 denominator = quorumDenominator();
        if (newQuorumNumerator > denominator) {
            revert GovernorInvalidQuorumFraction(newQuorumNumerator, denominator);
        }

        uint256 oldQuorumNumerator = quorumNumerator();
        _quorumNumeratorHistory.push(clock(), SafeCast.toUint208(newQuorumNumerator));

        emit QuorumNumeratorUpdated(oldQuorumNumerator, newQuorumNumerator);
    }

    /**
     * @dev Returns the numerator at a specific timepoint.
     */
    function _optimisticUpperLookupRecent(
        Checkpoints.Trace208 storage ckpts,
        uint256 timepoint
    ) internal view returns (uint256) {
        // If trace is empty, key and value are both equal to 0.
        // In that case `key <= timepoint` is true, and it is ok to return 0.
        (, uint48 key, uint208 value) = ckpts.latestCheckpoint();
        return key <= timepoint ? value : ckpts.upperLookupRecent(SafeCast.toUint48(timepoint));
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/governance/utils/IVotes.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (governance/utils/IVotes.sol)
pragma solidity >=0.8.4;

/**
 * @dev Common interface for {ERC20Votes}, {ERC721Votes}, and other {Votes}-enabled contracts.
 */
interface IVotes {
    /**
     * @dev The signature used has expired.
     */
    error VotesExpiredSignature(uint256 expiry);

    /**
     * @dev Emitted when an account changes their delegate.
     */
    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);

    /**
     * @dev Emitted when a token transfer or delegate change results in changes to a delegate's number of voting units.
     */
    event DelegateVotesChanged(address indexed delegate, uint256 previousVotes, uint256 newVotes);

    /**
     * @dev Returns the current amount of votes that `account` has.
     */
    function getVotes(address account) external view returns (uint256);

    /**
     * @dev Returns the amount of votes that `account` had at a specific moment in the past. If the `clock()` is
     * configured to use block numbers, this will return the value at the end of the corresponding block.
     */
    function getPastVotes(address account, uint256 timepoint) external view returns (uint256);

    /**
     * @dev Returns the total supply of votes available at a specific moment in the past. If the `clock()` is
     * configured to use block numbers, this will return the value at the end of the corresponding block.
     *
     * NOTE: This value is the sum of all available votes, which is not necessarily the sum of all delegated votes.
     * Votes that have not been delegated are still part of total supply, even though they would not participate in a
     * vote.
     */
    function getPastTotalSupply(uint256 timepoint) external view returns (uint256);

    /**
     * @dev Returns the delegate that `account` has chosen.
     */
    function delegates(address account) external view returns (address);

    /**
     * @dev Delegates votes from the sender to `delegatee`.
     */
    function delegate(address delegatee) external;

    /**
     * @dev Delegates votes from signer to `delegatee`.
     */
    function delegateBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s) external;
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/governance/utils/Votes.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.2.0) (governance/utils/Votes.sol)
pragma solidity ^0.8.20;

import {IERC5805} from "../../interfaces/IERC5805.sol";
import {Context} from "../../utils/Context.sol";
import {Nonces} from "../../utils/Nonces.sol";
import {EIP712} from "../../utils/cryptography/EIP712.sol";
import {Checkpoints} from "../../utils/structs/Checkpoints.sol";
import {SafeCast} from "../../utils/math/SafeCast.sol";
import {ECDSA} from "../../utils/cryptography/ECDSA.sol";
import {Time} from "../../utils/types/Time.sol";

/**
 * @dev This is a base abstract contract that tracks voting units, which are a measure of voting power that can be
 * transferred, and provides a system of vote delegation, where an account can delegate its voting units to a sort of
 * "representative" that will pool delegated voting units from different accounts and can then use it to vote in
 * decisions. In fact, voting units _must_ be delegated in order to count as actual votes, and an account has to
 * delegate those votes to itself if it wishes to participate in decisions and does not have a trusted representative.
 *
 * This contract is often combined with a token contract such that voting units correspond to token units. For an
 * example, see {ERC721Votes}.
 *
 * The full history of delegate votes is tracked on-chain so that governance protocols can consider votes as distributed
 * at a particular block number to protect against flash loans and double voting. The opt-in delegate system makes the
 * cost of this history tracking optional.
 *
 * When using this module the derived contract must implement {_getVotingUnits} (for example, make it return
 * {ERC721-balanceOf}), and can use {_transferVotingUnits} to track a change in the distribution of those units (in the
 * previous example, it would be included in {ERC721-_update}).
 */
abstract contract Votes is Context, EIP712, Nonces, IERC5805 {
    using Checkpoints for Checkpoints.Trace208;

    bytes32 private constant DELEGATION_TYPEHASH =
        keccak256("Delegation(address delegatee,uint256 nonce,uint256 expiry)");

    mapping(address account => address) private _delegatee;

    mapping(address delegatee => Checkpoints.Trace208) private _delegateCheckpoints;

    Checkpoints.Trace208 private _totalCheckpoints;

    /**
     * @dev The clock was incorrectly modified.
     */
    error ERC6372InconsistentClock();

    /**
     * @dev Lookup to future votes is not available.
     */
    error ERC5805FutureLookup(uint256 timepoint, uint48 clock);

    /**
     * @dev Clock used for flagging checkpoints. Can be overridden to implement timestamp based
     * checkpoints (and voting), in which case {CLOCK_MODE} should be overridden as well to match.
     */
    function clock() public view virtual returns (uint48) {
        return Time.blockNumber();
    }

    /**
     * @dev Machine-readable description of the clock as specified in ERC-6372.
     */
    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public view virtual returns (string memory) {
        // Check that the clock was not modified
        if (clock() != Time.blockNumber()) {
            revert ERC6372InconsistentClock();
        }
        return "mode=blocknumber&from=default";
    }

    /**
     * @dev Validate that a timepoint is in the past, and return it as a uint48.
     */
    function _validateTimepoint(uint256 timepoint) internal view returns (uint48) {
        uint48 currentTimepoint = clock();
        if (timepoint >= currentTimepoint) revert ERC5805FutureLookup(timepoint, currentTimepoint);
        return SafeCast.toUint48(timepoint);
    }

    /**
     * @dev Returns the current amount of votes that `account` has.
     */
    function getVotes(address account) public view virtual returns (uint256) {
        return _delegateCheckpoints[account].latest();
    }

    /**
     * @dev Returns the amount of votes that `account` had at a specific moment in the past. If the `clock()` is
     * configured to use block numbers, this will return the value at the end of the corresponding block.
     *
     * Requirements:
     *
     * - `timepoint` must be in the past. If operating using block numbers, the block must be already mined.
     */
    function getPastVotes(address account, uint256 timepoint) public view virtual returns (uint256) {
        return _delegateCheckpoints[account].upperLookupRecent(_validateTimepoint(timepoint));
    }

    /**
     * @dev Returns the total supply of votes available at a specific moment in the past. If the `clock()` is
     * configured to use block numbers, this will return the value at the end of the corresponding block.
     *
     * NOTE: This value is the sum of all available votes, which is not necessarily the sum of all delegated votes.
     * Votes that have not been delegated are still part of total supply, even though they would not participate in a
     * vote.
     *
     * Requirements:
     *
     * - `timepoint` must be in the past. If operating using block numbers, the block must be already mined.
     */
    function getPastTotalSupply(uint256 timepoint) public view virtual returns (uint256) {
        return _totalCheckpoints.upperLookupRecent(_validateTimepoint(timepoint));
    }

    /**
     * @dev Returns the current total supply of votes.
     */
    function _getTotalSupply() internal view virtual returns (uint256) {
        return _totalCheckpoints.latest();
    }

    /**
     * @dev Returns the delegate that `account` has chosen.
     */
    function delegates(address account) public view virtual returns (address) {
        return _delegatee[account];
    }

    /**
     * @dev Delegates votes from the sender to `delegatee`.
     */
    function delegate(address delegatee) public virtual {
        address account = _msgSender();
        _delegate(account, delegatee);
    }

    /**
     * @dev Delegates votes from signer to `delegatee`.
     */
    function delegateBySig(
        address delegatee,
        uint256 nonce,
        uint256 expiry,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual {
        if (block.timestamp > expiry) {
            revert VotesExpiredSignature(expiry);
        }
        address signer = ECDSA.recover(
            _hashTypedDataV4(keccak256(abi.encode(DELEGATION_TYPEHASH, delegatee, nonce, expiry))),
            v,
            r,
            s
        );
        _useCheckedNonce(signer, nonce);
        _delegate(signer, delegatee);
    }

    /**
     * @dev Delegate all of `account`'s voting units to `delegatee`.
     *
     * Emits events {IVotes-DelegateChanged} and {IVotes-DelegateVotesChanged}.
     */
    function _delegate(address account, address delegatee) internal virtual {
        address oldDelegate = delegates(account);
        _delegatee[account] = delegatee;

        emit DelegateChanged(account, oldDelegate, delegatee);
        _moveDelegateVotes(oldDelegate, delegatee, _getVotingUnits(account));
    }

    /**
     * @dev Transfers, mints, or burns voting units. To register a mint, `from` should be zero. To register a burn, `to`
     * should be zero. Total supply of voting units will be adjusted with mints and burns.
     */
    function _transferVotingUnits(address from, address to, uint256 amount) internal virtual {
        if (from == address(0)) {
            _push(_totalCheckpoints, _add, SafeCast.toUint208(amount));
        }
        if (to == address(0)) {
            _push(_totalCheckpoints, _subtract, SafeCast.toUint208(amount));
        }
        _moveDelegateVotes(delegates(from), delegates(to), amount);
    }

    /**
     * @dev Moves delegated votes from one delegate to another.
     */
    function _moveDelegateVotes(address from, address to, uint256 amount) internal virtual {
        if (from != to && amount > 0) {
            if (from != address(0)) {
                (uint256 oldValue, uint256 newValue) = _push(
                    _delegateCheckpoints[from],
                    _subtract,
                    SafeCast.toUint208(amount)
                );
                emit DelegateVotesChanged(from, oldValue, newValue);
            }
            if (to != address(0)) {
                (uint256 oldValue, uint256 newValue) = _push(
                    _delegateCheckpoints[to],
                    _add,
                    SafeCast.toUint208(amount)
                );
                emit DelegateVotesChanged(to, oldValue, newValue);
            }
        }
    }

    /**
     * @dev Get number of checkpoints for `account`.
     */
    function _numCheckpoints(address account) internal view virtual returns (uint32) {
        return SafeCast.toUint32(_delegateCheckpoints[account].length());
    }

    /**
     * @dev Get the `pos`-th checkpoint for `account`.
     */
    function _checkpoints(
        address account,
        uint32 pos
    ) internal view virtual returns (Checkpoints.Checkpoint208 memory) {
        return _delegateCheckpoints[account].at(pos);
    }

    function _push(
        Checkpoints.Trace208 storage store,
        function(uint208, uint208) view returns (uint208) op,
        uint208 delta
    ) private returns (uint208 oldValue, uint208 newValue) {
        return store.push(clock(), op(store.latest(), delta));
    }

    function _add(uint208 a, uint208 b) private pure returns (uint208) {
        return a + b;
    }

    function _subtract(uint208 a, uint208 b) private pure returns (uint208) {
        return a - b;
    }

    /**
     * @dev Must return the voting units held by an account.
     */
    function _getVotingUnits(address) internal view virtual returns (uint256);
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/interfaces/IERC1271.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC1271.sol)

pragma solidity >=0.5.0;

/**
 * @dev Interface of the ERC-1271 standard signature validation method for
 * contracts as defined in https://eips.ethereum.org/EIPS/eip-1271[ERC-1271].
 */
interface IERC1271 {
    /**
     * @dev Should return whether the signature provided is valid for the provided data
     * @param hash      Hash of the data to be signed
     * @param signature Signature byte array associated with `hash`
     */
    function isValidSignature(bytes32 hash, bytes calldata signature) external view returns (bytes4 magicValue);
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/interfaces/IERC1363.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC1363.sol)

pragma solidity >=0.6.2;

import {IERC20} from "./IERC20.sol";
import {IERC165} from "./IERC165.sol";

/**
 * @title IERC1363
 * @dev Interface of the ERC-1363 standard as defined in the https://eips.ethereum.org/EIPS/eip-1363[ERC-1363].
 *
 * Defines an extension interface for ERC-20 tokens that supports executing code on a recipient contract
 * after `transfer` or `transferFrom`, or code on a spender contract after `approve`, in a single transaction.
 */
interface IERC1363 is IERC20, IERC165 {
    /*
     * Note: the ERC-165 identifier for this interface is 0xb0202a11.
     * 0xb0202a11 ===
     *   bytes4(keccak256('transferAndCall(address,uint256)')) ^
     *   bytes4(keccak256('transferAndCall(address,uint256,bytes)')) ^
     *   bytes4(keccak256('transferFromAndCall(address,address,uint256)')) ^
     *   bytes4(keccak256('transferFromAndCall(address,address,uint256,bytes)')) ^
     *   bytes4(keccak256('approveAndCall(address,uint256)')) ^
     *   bytes4(keccak256('approveAndCall(address,uint256,bytes)'))
     */

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferAndCall(address to, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @param data Additional data with no specified format, sent in call to `to`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferAndCall(address to, uint256 value, bytes calldata data) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the allowance mechanism
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param from The address which you want to send tokens from.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferFromAndCall(address from, address to, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the allowance mechanism
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param from The address which you want to send tokens from.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @param data Additional data with no specified format, sent in call to `to`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferFromAndCall(address from, address to, uint256 value, bytes calldata data) external returns (bool);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens and then calls {IERC1363Spender-onApprovalReceived} on `spender`.
     * @param spender The address which will spend the funds.
     * @param value The amount of tokens to be spent.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function approveAndCall(address spender, uint256 value) external returns (bool);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens and then calls {IERC1363Spender-onApprovalReceived} on `spender`.
     * @param spender The address which will spend the funds.
     * @param value The amount of tokens to be spent.
     * @param data Additional data with no specified format, sent in call to `spender`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function approveAndCall(address spender, uint256 value, bytes calldata data) external returns (bool);
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/interfaces/IERC165.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC165.sol)

pragma solidity >=0.4.16;

import {IERC165} from "../utils/introspection/IERC165.sol";

```

### `contracts/.deps/npm/@openzeppelin/contracts/interfaces/IERC20.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC20.sol)

pragma solidity >=0.4.16;

import {IERC20} from "../token/ERC20/IERC20.sol";

```

### `contracts/.deps/npm/@openzeppelin/contracts/interfaces/IERC5267.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC5267.sol)

pragma solidity >=0.4.16;

interface IERC5267 {
    /**
     * @dev MAY be emitted to signal that the domain could have changed.
     */
    event EIP712DomainChanged();

    /**
     * @dev returns the fields and values that describe the domain separator used by this contract for EIP-712
     * signature.
     */
    function eip712Domain()
        external
        view
        returns (
            bytes1 fields,
            string memory name,
            string memory version,
            uint256 chainId,
            address verifyingContract,
            bytes32 salt,
            uint256[] memory extensions
        );
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/interfaces/IERC5805.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC5805.sol)

pragma solidity >=0.8.4;

import {IVotes} from "../governance/utils/IVotes.sol";
import {IERC6372} from "./IERC6372.sol";

interface IERC5805 is IERC6372, IVotes {}

```

### `contracts/.deps/npm/@openzeppelin/contracts/interfaces/IERC6372.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC6372.sol)

pragma solidity >=0.4.16;

interface IERC6372 {
    /**
     * @dev Clock used for flagging checkpoints. Can be overridden to implement timestamp based checkpoints (and voting).
     */
    function clock() external view returns (uint48);

    /**
     * @dev Description of the clock
     */
    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() external view returns (string memory);
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/interfaces/IERC7913.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC7913.sol)

pragma solidity >=0.5.0;

/**
 * @dev Signature verifier interface.
 */
interface IERC7913SignatureVerifier {
    /**
     * @dev Verifies `signature` as a valid signature of `hash` by `key`.
     *
     * MUST return the bytes4 magic value IERC7913SignatureVerifier.verify.selector if the signature is valid.
     * SHOULD return 0xffffffff or revert if the signature is not valid.
     * SHOULD return 0xffffffff or revert if the key is empty
     */
    function verify(bytes calldata key, bytes32 hash, bytes calldata signature) external view returns (bytes4);
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/interfaces/draft-IERC6093.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/draft-IERC6093.sol)
pragma solidity >=0.8.4;

/**
 * @dev Standard ERC-20 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-20 tokens.
 */
interface IERC20Errors {
    /**
     * @dev Indicates an error related to the current `balance` of a `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param balance Current balance for the interacting account.
     * @param needed Minimum amount required to perform a transfer.
     */
    error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed);

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC20InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC20InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `spender`’s `allowance`. Used in transfers.
     * @param spender Address that may be allowed to operate on tokens without being their owner.
     * @param allowance Amount of tokens a `spender` is allowed to operate with.
     * @param needed Minimum amount required to perform a transfer.
     */
    error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed);

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC20InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `spender` to be approved. Used in approvals.
     * @param spender Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC20InvalidSpender(address spender);
}

/**
 * @dev Standard ERC-721 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-721 tokens.
 */
interface IERC721Errors {
    /**
     * @dev Indicates that an address can't be an owner. For example, `address(0)` is a forbidden owner in ERC-20.
     * Used in balance queries.
     * @param owner Address of the current owner of a token.
     */
    error ERC721InvalidOwner(address owner);

    /**
     * @dev Indicates a `tokenId` whose `owner` is the zero address.
     * @param tokenId Identifier number of a token.
     */
    error ERC721NonexistentToken(uint256 tokenId);

    /**
     * @dev Indicates an error related to the ownership over a particular token. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param tokenId Identifier number of a token.
     * @param owner Address of the current owner of a token.
     */
    error ERC721IncorrectOwner(address sender, uint256 tokenId, address owner);

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC721InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC721InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `operator`’s approval. Used in transfers.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     * @param tokenId Identifier number of a token.
     */
    error ERC721InsufficientApproval(address operator, uint256 tokenId);

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC721InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `operator` to be approved. Used in approvals.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC721InvalidOperator(address operator);
}

/**
 * @dev Standard ERC-1155 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-1155 tokens.
 */
interface IERC1155Errors {
    /**
     * @dev Indicates an error related to the current `balance` of a `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param balance Current balance for the interacting account.
     * @param needed Minimum amount required to perform a transfer.
     * @param tokenId Identifier number of a token.
     */
    error ERC1155InsufficientBalance(address sender, uint256 balance, uint256 needed, uint256 tokenId);

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC1155InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC1155InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `operator`’s approval. Used in transfers.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     * @param owner Address of the current owner of a token.
     */
    error ERC1155MissingApprovalForAll(address operator, address owner);

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC1155InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `operator` to be approved. Used in approvals.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC1155InvalidOperator(address operator);

    /**
     * @dev Indicates an array length mismatch between ids and values in a safeBatchTransferFrom operation.
     * Used in batch transfers.
     * @param idsLength Length of the array of token identifiers
     * @param valuesLength Length of the array of token amounts
     */
    error ERC1155InvalidArrayLength(uint256 idsLength, uint256 valuesLength);
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC1155/IERC1155Receiver.sol)

pragma solidity >=0.6.2;

import {IERC165} from "../../utils/introspection/IERC165.sol";

/**
 * @dev Interface that must be implemented by smart contracts in order to receive
 * ERC-1155 token transfers.
 */
interface IERC1155Receiver is IERC165 {
    /**
     * @dev Handles the receipt of a single ERC-1155 token type. This function is
     * called at the end of a `safeTransferFrom` after the balance has been updated.
     *
     * NOTE: To accept the transfer, this must return
     * `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))`
     * (i.e. 0xf23a6e61, or its own function selector).
     *
     * @param operator The address which initiated the transfer (i.e. msg.sender)
     * @param from The address which previously owned the token
     * @param id The ID of the token being transferred
     * @param value The amount of tokens being transferred
     * @param data Additional data with no specified format
     * @return `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))` if transfer is allowed
     */
    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4);

    /**
     * @dev Handles the receipt of a multiple ERC-1155 token types. This function
     * is called at the end of a `safeBatchTransferFrom` after the balances have
     * been updated.
     *
     * NOTE: To accept the transfer(s), this must return
     * `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`
     * (i.e. 0xbc197c81, or its own function selector).
     *
     * @param operator The address which initiated the batch transfer (i.e. msg.sender)
     * @param from The address which previously owned the token
     * @param ids An array containing ids of each token being transferred (order and length must match values array)
     * @param values An array containing amounts of each token being transferred (order and length must match ids array)
     * @param data Additional data with no specified format
     * @return `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))` if transfer is allowed
     */
    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external returns (bytes4);
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC1155/utils/ERC1155Holder.sol)

pragma solidity ^0.8.20;

import {IERC165, ERC165} from "../../../utils/introspection/ERC165.sol";
import {IERC1155Receiver} from "../IERC1155Receiver.sol";

/**
 * @dev Simple implementation of `IERC1155Receiver` that will allow a contract to hold ERC-1155 tokens.
 *
 * IMPORTANT: When inheriting this contract, you must include a way to use the received tokens, otherwise they will be
 * stuck.
 */
abstract contract ERC1155Holder is ERC165, IERC1155Receiver {
    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId || super.supportsInterface(interfaceId);
    }

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/token/ERC20/ERC20.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/ERC20.sol)

pragma solidity ^0.8.20;

import {IERC20} from "./IERC20.sol";
import {IERC20Metadata} from "./extensions/IERC20Metadata.sol";
import {Context} from "../../utils/Context.sol";
import {IERC20Errors} from "../../interfaces/draft-IERC6093.sol";

/**
 * @dev Implementation of the {IERC20} interface.
 *
 * This implementation is agnostic to the way tokens are created. This means
 * that a supply mechanism has to be added in a derived contract using {_mint}.
 *
 * TIP: For a detailed writeup see our guide
 * https://forum.openzeppelin.com/t/how-to-implement-erc20-supply-mechanisms/226[How
 * to implement supply mechanisms].
 *
 * The default value of {decimals} is 18. To change this, you should override
 * this function so it returns a different value.
 *
 * We have followed general OpenZeppelin Contracts guidelines: functions revert
 * instead returning `false` on failure. This behavior is nonetheless
 * conventional and does not conflict with the expectations of ERC-20
 * applications.
 */
abstract contract ERC20 is Context, IERC20, IERC20Metadata, IERC20Errors {
    mapping(address account => uint256) private _balances;

    mapping(address account => mapping(address spender => uint256)) private _allowances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;

    /**
     * @dev Sets the values for {name} and {symbol}.
     *
     * Both values are immutable: they can only be set once during construction.
     */
    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view virtual returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the default value returned by this function, unless
     * it's overridden.
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view virtual returns (uint8) {
        return 18;
    }

    /// @inheritdoc IERC20
    function totalSupply() public view virtual returns (uint256) {
        return _totalSupply;
    }

    /// @inheritdoc IERC20
    function balanceOf(address account) public view virtual returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `value`.
     */
    function transfer(address to, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, value);
        return true;
    }

    /// @inheritdoc IERC20
    function allowance(address owner, address spender) public view virtual returns (uint256) {
        return _allowances[owner][spender];
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * NOTE: If `value` is the maximum `uint256`, the allowance is not updated on
     * `transferFrom`. This is semantically equivalent to an infinite approval.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(address spender, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, value);
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Skips emitting an {Approval} event indicating an allowance update. This is not
     * required by the ERC. See {xref-ERC20-_approve-address-address-uint256-bool-}[_approve].
     *
     * NOTE: Does not update the allowance if the current allowance
     * is the maximum `uint256`.
     *
     * Requirements:
     *
     * - `from` and `to` cannot be the zero address.
     * - `from` must have a balance of at least `value`.
     * - the caller must have allowance for ``from``'s tokens of at least
     * `value`.
     */
    function transferFrom(address from, address to, uint256 value) public virtual returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, value);
        _transfer(from, to, value);
        return true;
    }

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to`.
     *
     * This internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    function _transfer(address from, address to, uint256 value) internal {
        if (from == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        if (to == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(from, to, value);
    }

    /**
     * @dev Transfers a `value` amount of tokens from `from` to `to`, or alternatively mints (or burns) if `from`
     * (or `to`) is the zero address. All customizations to transfers, mints, and burns should be done by overriding
     * this function.
     *
     * Emits a {Transfer} event.
     */
    function _update(address from, address to, uint256 value) internal virtual {
        if (from == address(0)) {
            // Overflow check required: The rest of the code assumes that totalSupply never overflows
            _totalSupply += value;
        } else {
            uint256 fromBalance = _balances[from];
            if (fromBalance < value) {
                revert ERC20InsufficientBalance(from, fromBalance, value);
            }
            unchecked {
                // Overflow not possible: value <= fromBalance <= totalSupply.
                _balances[from] = fromBalance - value;
            }
        }

        if (to == address(0)) {
            unchecked {
                // Overflow not possible: value <= totalSupply or value <= fromBalance <= totalSupply.
                _totalSupply -= value;
            }
        } else {
            unchecked {
                // Overflow not possible: balance + value is at most totalSupply, which we know fits into a uint256.
                _balances[to] += value;
            }
        }

        emit Transfer(from, to, value);
    }

    /**
     * @dev Creates a `value` amount of tokens and assigns them to `account`, by transferring it from address(0).
     * Relies on the `_update` mechanism
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    function _mint(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(address(0), account, value);
    }

    /**
     * @dev Destroys a `value` amount of tokens from `account`, lowering the total supply.
     * Relies on the `_update` mechanism.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead
     */
    function _burn(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        _update(account, address(0), value);
    }

    /**
     * @dev Sets `value` as the allowance of `spender` over the `owner`'s tokens.
     *
     * This internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     *
     * Overrides to this logic should be done to the variant with an additional `bool emitEvent` argument.
     */
    function _approve(address owner, address spender, uint256 value) internal {
        _approve(owner, spender, value, true);
    }

    /**
     * @dev Variant of {_approve} with an optional flag to enable or disable the {Approval} event.
     *
     * By default (when calling {_approve}) the flag is set to true. On the other hand, approval changes made by
     * `_spendAllowance` during the `transferFrom` operation set the flag to false. This saves gas by not emitting any
     * `Approval` event during `transferFrom` operations.
     *
     * Anyone who wishes to continue emitting `Approval` events on the`transferFrom` operation can force the flag to
     * true using the following override:
     *
     * ```solidity
     * function _approve(address owner, address spender, uint256 value, bool) internal virtual override {
     *     super._approve(owner, spender, value, true);
     * }
     * ```
     *
     * Requirements are the same as {_approve}.
     */
    function _approve(address owner, address spender, uint256 value, bool emitEvent) internal virtual {
        if (owner == address(0)) {
            revert ERC20InvalidApprover(address(0));
        }
        if (spender == address(0)) {
            revert ERC20InvalidSpender(address(0));
        }
        _allowances[owner][spender] = value;
        if (emitEvent) {
            emit Approval(owner, spender, value);
        }
    }

    /**
     * @dev Updates `owner`'s allowance for `spender` based on spent `value`.
     *
     * Does not update the allowance value in case of infinite allowance.
     * Revert if not enough allowance is available.
     *
     * Does not emit an {Approval} event.
     */
    function _spendAllowance(address owner, address spender, uint256 value) internal virtual {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance < type(uint256).max) {
            if (currentAllowance < value) {
                revert ERC20InsufficientAllowance(spender, currentAllowance, value);
            }
            unchecked {
                _approve(owner, spender, currentAllowance - value, false);
            }
        }
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/token/ERC20/IERC20.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/IERC20.sol)

pragma solidity >=0.4.16;

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/extensions/ERC20Permit.sol)

pragma solidity ^0.8.20;

import {IERC20Permit} from "./IERC20Permit.sol";
import {ERC20} from "../ERC20.sol";
import {ECDSA} from "../../../utils/cryptography/ECDSA.sol";
import {EIP712} from "../../../utils/cryptography/EIP712.sol";
import {Nonces} from "../../../utils/Nonces.sol";

/**
 * @dev Implementation of the ERC-20 Permit extension allowing approvals to be made via signatures, as defined in
 * https://eips.ethereum.org/EIPS/eip-2612[ERC-2612].
 *
 * Adds the {permit} method, which can be used to change an account's ERC-20 allowance (see {IERC20-allowance}) by
 * presenting a message signed by the account. By not relying on `{IERC20-approve}`, the token holder account doesn't
 * need to send a transaction, and thus is not required to hold Ether at all.
 */
abstract contract ERC20Permit is ERC20, IERC20Permit, EIP712, Nonces {
    bytes32 private constant PERMIT_TYPEHASH =
        keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");

    /**
     * @dev Permit deadline has expired.
     */
    error ERC2612ExpiredSignature(uint256 deadline);

    /**
     * @dev Mismatched signature.
     */
    error ERC2612InvalidSigner(address signer, address owner);

    /**
     * @dev Initializes the {EIP712} domain separator using the `name` parameter, and setting `version` to `"1"`.
     *
     * It's a good idea to use the same `name` that is defined as the ERC-20 token name.
     */
    constructor(string memory name) EIP712(name, "1") {}

    /// @inheritdoc IERC20Permit
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual {
        if (block.timestamp > deadline) {
            revert ERC2612ExpiredSignature(deadline);
        }

        bytes32 structHash = keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, value, _useNonce(owner), deadline));

        bytes32 hash = _hashTypedDataV4(structHash);

        address signer = ECDSA.recover(hash, v, r, s);
        if (signer != owner) {
            revert ERC2612InvalidSigner(signer, owner);
        }

        _approve(owner, spender, value);
    }

    /// @inheritdoc IERC20Permit
    function nonces(address owner) public view virtual override(IERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }

    /// @inheritdoc IERC20Permit
    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view virtual returns (bytes32) {
        return _domainSeparatorV4();
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (token/ERC20/extensions/ERC20Votes.sol)

pragma solidity ^0.8.20;

import {ERC20} from "../ERC20.sol";
import {Votes} from "../../../governance/utils/Votes.sol";
import {Checkpoints} from "../../../utils/structs/Checkpoints.sol";

/**
 * @dev Extension of ERC-20 to support Compound-like voting and delegation. This version is more generic than Compound's,
 * and supports token supply up to 2^208^ - 1, while COMP is limited to 2^96^ - 1.
 *
 * NOTE: This contract does not provide interface compatibility with Compound's COMP token.
 *
 * This extension keeps a history (checkpoints) of each account's vote power. Vote power can be delegated either
 * by calling the {Votes-delegate} function directly, or by providing a signature to be used with {Votes-delegateBySig}. Voting
 * power can be queried through the public accessors {Votes-getVotes} and {Votes-getPastVotes}.
 *
 * By default, token balance does not account for voting power. This makes transfers cheaper. The downside is that it
 * requires users to delegate to themselves in order to activate checkpoints and have their voting power tracked.
 */
abstract contract ERC20Votes is ERC20, Votes {
    /**
     * @dev Total supply cap has been exceeded, introducing a risk of votes overflowing.
     */
    error ERC20ExceededSafeSupply(uint256 increasedSupply, uint256 cap);

    /**
     * @dev Maximum token supply. Defaults to `type(uint208).max` (2^208^ - 1).
     *
     * This maximum is enforced in {_update}. It limits the total supply of the token, which is otherwise a uint256,
     * so that checkpoints can be stored in the Trace208 structure used by {Votes}. Increasing this value will not
     * remove the underlying limitation, and will cause {_update} to fail because of a math overflow in
     * {Votes-_transferVotingUnits}. An override could be used to further restrict the total supply (to a lower value) if
     * additional logic requires it. When resolving override conflicts on this function, the minimum should be
     * returned.
     */
    function _maxSupply() internal view virtual returns (uint256) {
        return type(uint208).max;
    }

    /**
     * @dev Move voting power when tokens are transferred.
     *
     * Emits a {IVotes-DelegateVotesChanged} event.
     */
    function _update(address from, address to, uint256 value) internal virtual override {
        super._update(from, to, value);
        if (from == address(0)) {
            uint256 supply = totalSupply();
            uint256 cap = _maxSupply();
            if (supply > cap) {
                revert ERC20ExceededSafeSupply(supply, cap);
            }
        }
        _transferVotingUnits(from, to, value);
    }

    /**
     * @dev Returns the voting units of an `account`.
     *
     * WARNING: Overriding this function may compromise the internal vote accounting.
     * `ERC20Votes` assumes tokens map to voting units 1:1 and this is not easy to change.
     */
    function _getVotingUnits(address account) internal view virtual override returns (uint256) {
        return balanceOf(account);
    }

    /**
     * @dev Get number of checkpoints for `account`.
     */
    function numCheckpoints(address account) public view virtual returns (uint32) {
        return _numCheckpoints(account);
    }

    /**
     * @dev Get the `pos`-th checkpoint for `account`.
     */
    function checkpoints(address account, uint32 pos) public view virtual returns (Checkpoints.Checkpoint208 memory) {
        return _checkpoints(account, pos);
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/token/ERC20/extensions/ERC20Wrapper.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/extensions/ERC20Wrapper.sol)

pragma solidity ^0.8.20;

import {IERC20, IERC20Metadata, ERC20} from "../ERC20.sol";
import {SafeERC20} from "../utils/SafeERC20.sol";

/**
 * @dev Extension of the ERC-20 token contract to support token wrapping.
 *
 * Users can deposit and withdraw "underlying tokens" and receive a matching number of "wrapped tokens". This is useful
 * in conjunction with other modules. For example, combining this wrapping mechanism with {ERC20Votes} will allow the
 * wrapping of an existing "basic" ERC-20 into a governance token.
 *
 * WARNING: Any mechanism in which the underlying token changes the {balanceOf} of an account without an explicit transfer
 * may desynchronize this contract's supply and its underlying balance. Please exercise caution when wrapping tokens that
 * may undercollateralize the wrapper (i.e. wrapper's total supply is higher than its underlying balance). See {_recover}
 * for recovering value accrued to the wrapper.
 */
abstract contract ERC20Wrapper is ERC20 {
    IERC20 private immutable _underlying;

    /**
     * @dev The underlying token couldn't be wrapped.
     */
    error ERC20InvalidUnderlying(address token);

    constructor(IERC20 underlyingToken) {
        if (underlyingToken == this) {
            revert ERC20InvalidUnderlying(address(this));
        }
        _underlying = underlyingToken;
    }

    /// @inheritdoc IERC20Metadata
    function decimals() public view virtual override returns (uint8) {
        try IERC20Metadata(address(_underlying)).decimals() returns (uint8 value) {
            return value;
        } catch {
            return super.decimals();
        }
    }

    /**
     * @dev Returns the address of the underlying ERC-20 token that is being wrapped.
     */
    function underlying() public view returns (IERC20) {
        return _underlying;
    }

    /**
     * @dev Allow a user to deposit underlying tokens and mint the corresponding number of wrapped tokens.
     */
    function depositFor(address account, uint256 value) public virtual returns (bool) {
        address sender = _msgSender();
        if (sender == address(this)) {
            revert ERC20InvalidSender(address(this));
        }
        if (account == address(this)) {
            revert ERC20InvalidReceiver(account);
        }
        SafeERC20.safeTransferFrom(_underlying, sender, address(this), value);
        _mint(account, value);
        return true;
    }

    /**
     * @dev Allow a user to burn a number of wrapped tokens and withdraw the corresponding number of underlying tokens.
     */
    function withdrawTo(address account, uint256 value) public virtual returns (bool) {
        if (account == address(this)) {
            revert ERC20InvalidReceiver(account);
        }
        _burn(_msgSender(), value);
        SafeERC20.safeTransfer(_underlying, account, value);
        return true;
    }

    /**
     * @dev Mint wrapped token to cover any underlyingTokens that would have been transferred by mistake or acquired from
     * rebasing mechanisms. Internal function that can be exposed with access control if desired.
     */
    function _recover(address account) internal virtual returns (uint256) {
        uint256 value = _underlying.balanceOf(address(this)) - totalSupply();
        _mint(account, value);
        return value;
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/extensions/IERC20Metadata.sol)

pragma solidity >=0.6.2;

import {IERC20} from "../IERC20.sol";

/**
 * @dev Interface for the optional metadata functions from the ERC-20 standard.
 */
interface IERC20Metadata is IERC20 {
    /**
     * @dev Returns the name of the token.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the symbol of the token.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the decimals places of the token.
     */
    function decimals() external view returns (uint8);
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/extensions/IERC20Permit.sol)

pragma solidity >=0.4.16;

/**
 * @dev Interface of the ERC-20 Permit extension allowing approvals to be made via signatures, as defined in
 * https://eips.ethereum.org/EIPS/eip-2612[ERC-2612].
 *
 * Adds the {permit} method, which can be used to change an account's ERC-20 allowance (see {IERC20-allowance}) by
 * presenting a message signed by the account. By not relying on {IERC20-approve}, the token holder account doesn't
 * need to send a transaction, and thus is not required to hold Ether at all.
 *
 * ==== Security Considerations
 *
 * There are two important considerations concerning the use of `permit`. The first is that a valid permit signature
 * expresses an allowance, and it should not be assumed to convey additional meaning. In particular, it should not be
 * considered as an intention to spend the allowance in any specific way. The second is that because permits have
 * built-in replay protection and can be submitted by anyone, they can be frontrun. A protocol that uses permits should
 * take this into consideration and allow a `permit` call to fail. Combining these two aspects, a pattern that may be
 * generally recommended is:
 *
 * ```solidity
 * function doThingWithPermit(..., uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) public {
 *     try token.permit(msg.sender, address(this), value, deadline, v, r, s) {} catch {}
 *     doThing(..., value);
 * }
 *
 * function doThing(..., uint256 value) public {
 *     token.safeTransferFrom(msg.sender, address(this), value);
 *     ...
 * }
 * ```
 *
 * Observe that: 1) `msg.sender` is used as the owner, leaving no ambiguity as to the signer intent, and 2) the use of
 * `try/catch` allows the permit to fail and makes the code tolerant to frontrunning. (See also
 * {SafeERC20-safeTransferFrom}).
 *
 * Additionally, note that smart contract wallets (such as Argent or Safe) are not able to produce permit signatures, so
 * contracts should have entry points that don't rely on permit.
 */
interface IERC20Permit {
    /**
     * @dev Sets `value` as the allowance of `spender` over ``owner``'s tokens,
     * given ``owner``'s signed approval.
     *
     * IMPORTANT: The same issues {IERC20-approve} has related to transaction
     * ordering also apply here.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     * - `deadline` must be a timestamp in the future.
     * - `v`, `r` and `s` must be a valid `secp256k1` signature from `owner`
     * over the EIP712-formatted function arguments.
     * - the signature must use ``owner``'s current nonce (see {nonces}).
     *
     * For more information on the signature format, see the
     * https://eips.ethereum.org/EIPS/eip-2612#specification[relevant EIP
     * section].
     *
     * CAUTION: See Security Considerations above.
     */
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    /**
     * @dev Returns the current nonce for `owner`. This value must be
     * included whenever a signature is generated for {permit}.
     *
     * Every successful call to {permit} increases ``owner``'s nonce by one. This
     * prevents a signature from being used multiple times.
     */
    function nonces(address owner) external view returns (uint256);

    /**
     * @dev Returns the domain separator used in the encoding of the signature for {permit}, as defined by {EIP712}.
     */
    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32);
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (token/ERC20/utils/SafeERC20.sol)

pragma solidity ^0.8.20;

import {IERC20} from "../IERC20.sol";
import {IERC1363} from "../../../interfaces/IERC1363.sol";

/**
 * @title SafeERC20
 * @dev Wrappers around ERC-20 operations that throw on failure (when the token
 * contract returns false). Tokens that return no value (and instead revert or
 * throw on failure) are also supported, non-reverting calls are assumed to be
 * successful.
 * To use this library you can add a `using SafeERC20 for IERC20;` statement to your contract,
 * which allows you to call the safe operations as `token.safeTransfer(...)`, etc.
 */
library SafeERC20 {
    /**
     * @dev An operation with an ERC-20 token failed.
     */
    error SafeERC20FailedOperation(address token);

    /**
     * @dev Indicates a failed `decreaseAllowance` request.
     */
    error SafeERC20FailedDecreaseAllowance(address spender, uint256 currentAllowance, uint256 requestedDecrease);

    /**
     * @dev Transfer `value` amount of `token` from the calling contract to `to`. If `token` returns no value,
     * non-reverting calls are assumed to be successful.
     */
    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeCall(token.transfer, (to, value)));
    }

    /**
     * @dev Transfer `value` amount of `token` from `from` to `to`, spending the approval given by `from` to the
     * calling contract. If `token` returns no value, non-reverting calls are assumed to be successful.
     */
    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeCall(token.transferFrom, (from, to, value)));
    }

    /**
     * @dev Variant of {safeTransfer} that returns a bool instead of reverting if the operation is not successful.
     */
    function trySafeTransfer(IERC20 token, address to, uint256 value) internal returns (bool) {
        return _callOptionalReturnBool(token, abi.encodeCall(token.transfer, (to, value)));
    }

    /**
     * @dev Variant of {safeTransferFrom} that returns a bool instead of reverting if the operation is not successful.
     */
    function trySafeTransferFrom(IERC20 token, address from, address to, uint256 value) internal returns (bool) {
        return _callOptionalReturnBool(token, abi.encodeCall(token.transferFrom, (from, to, value)));
    }

    /**
     * @dev Increase the calling contract's allowance toward `spender` by `value`. If `token` returns no value,
     * non-reverting calls are assumed to be successful.
     *
     * IMPORTANT: If the token implements ERC-7674 (ERC-20 with temporary allowance), and if the "client"
     * smart contract uses ERC-7674 to set temporary allowances, then the "client" smart contract should avoid using
     * this function. Performing a {safeIncreaseAllowance} or {safeDecreaseAllowance} operation on a token contract
     * that has a non-zero temporary allowance (for that particular owner-spender) will result in unexpected behavior.
     */
    function safeIncreaseAllowance(IERC20 token, address spender, uint256 value) internal {
        uint256 oldAllowance = token.allowance(address(this), spender);
        forceApprove(token, spender, oldAllowance + value);
    }

    /**
     * @dev Decrease the calling contract's allowance toward `spender` by `requestedDecrease`. If `token` returns no
     * value, non-reverting calls are assumed to be successful.
     *
     * IMPORTANT: If the token implements ERC-7674 (ERC-20 with temporary allowance), and if the "client"
     * smart contract uses ERC-7674 to set temporary allowances, then the "client" smart contract should avoid using
     * this function. Performing a {safeIncreaseAllowance} or {safeDecreaseAllowance} operation on a token contract
     * that has a non-zero temporary allowance (for that particular owner-spender) will result in unexpected behavior.
     */
    function safeDecreaseAllowance(IERC20 token, address spender, uint256 requestedDecrease) internal {
        unchecked {
            uint256 currentAllowance = token.allowance(address(this), spender);
            if (currentAllowance < requestedDecrease) {
                revert SafeERC20FailedDecreaseAllowance(spender, currentAllowance, requestedDecrease);
            }
            forceApprove(token, spender, currentAllowance - requestedDecrease);
        }
    }

    /**
     * @dev Set the calling contract's allowance toward `spender` to `value`. If `token` returns no value,
     * non-reverting calls are assumed to be successful. Meant to be used with tokens that require the approval
     * to be set to zero before setting it to a non-zero value, such as USDT.
     *
     * NOTE: If the token implements ERC-7674, this function will not modify any temporary allowance. This function
     * only sets the "standard" allowance. Any temporary allowance will remain active, in addition to the value being
     * set here.
     */
    function forceApprove(IERC20 token, address spender, uint256 value) internal {
        bytes memory approvalCall = abi.encodeCall(token.approve, (spender, value));

        if (!_callOptionalReturnBool(token, approvalCall)) {
            _callOptionalReturn(token, abi.encodeCall(token.approve, (spender, 0)));
            _callOptionalReturn(token, approvalCall);
        }
    }

    /**
     * @dev Performs an {ERC1363} transferAndCall, with a fallback to the simple {ERC20} transfer if the target has no
     * code. This can be used to implement an {ERC721}-like safe transfer that rely on {ERC1363} checks when
     * targeting contracts.
     *
     * Reverts if the returned value is other than `true`.
     */
    function transferAndCallRelaxed(IERC1363 token, address to, uint256 value, bytes memory data) internal {
        if (to.code.length == 0) {
            safeTransfer(token, to, value);
        } else if (!token.transferAndCall(to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Performs an {ERC1363} transferFromAndCall, with a fallback to the simple {ERC20} transferFrom if the target
     * has no code. This can be used to implement an {ERC721}-like safe transfer that rely on {ERC1363} checks when
     * targeting contracts.
     *
     * Reverts if the returned value is other than `true`.
     */
    function transferFromAndCallRelaxed(
        IERC1363 token,
        address from,
        address to,
        uint256 value,
        bytes memory data
    ) internal {
        if (to.code.length == 0) {
            safeTransferFrom(token, from, to, value);
        } else if (!token.transferFromAndCall(from, to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Performs an {ERC1363} approveAndCall, with a fallback to the simple {ERC20} approve if the target has no
     * code. This can be used to implement an {ERC721}-like safe transfer that rely on {ERC1363} checks when
     * targeting contracts.
     *
     * NOTE: When the recipient address (`to`) has no code (i.e. is an EOA), this function behaves as {forceApprove}.
     * Opposedly, when the recipient address (`to`) has code, this function only attempts to call {ERC1363-approveAndCall}
     * once without retrying, and relies on the returned value to be true.
     *
     * Reverts if the returned value is other than `true`.
     */
    function approveAndCallRelaxed(IERC1363 token, address to, uint256 value, bytes memory data) internal {
        if (to.code.length == 0) {
            forceApprove(token, to, value);
        } else if (!token.approveAndCall(to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
     * on the return value: the return value is optional (but if data is returned, it must not be false).
     * @param token The token targeted by the call.
     * @param data The call data (encoded using abi.encode or one of its variants).
     *
     * This is a variant of {_callOptionalReturnBool} that reverts if call fails to meet the requirements.
     */
    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        uint256 returnSize;
        uint256 returnValue;
        assembly ("memory-safe") {
            let success := call(gas(), token, 0, add(data, 0x20), mload(data), 0, 0x20)
            // bubble errors
            if iszero(success) {
                let ptr := mload(0x40)
                returndatacopy(ptr, 0, returndatasize())
                revert(ptr, returndatasize())
            }
            returnSize := returndatasize()
            returnValue := mload(0)
        }

        if (returnSize == 0 ? address(token).code.length == 0 : returnValue != 1) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
     * on the return value: the return value is optional (but if data is returned, it must not be false).
     * @param token The token targeted by the call.
     * @param data The call data (encoded using abi.encode or one of its variants).
     *
     * This is a variant of {_callOptionalReturn} that silently catches all reverts and returns a bool instead.
     */
    function _callOptionalReturnBool(IERC20 token, bytes memory data) private returns (bool) {
        bool success;
        uint256 returnSize;
        uint256 returnValue;
        assembly ("memory-safe") {
            success := call(gas(), token, 0, add(data, 0x20), mload(data), 0, 0x20)
            returnSize := returndatasize()
            returnValue := mload(0)
        }
        return success && (returnSize == 0 ? address(token).code.length > 0 : returnValue == 1);
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/token/ERC721/IERC721.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC721/IERC721.sol)

pragma solidity >=0.6.2;

import {IERC165} from "../../utils/introspection/IERC165.sol";

/**
 * @dev Required interface of an ERC-721 compliant contract.
 */
interface IERC721 is IERC165 {
    /**
     * @dev Emitted when `tokenId` token is transferred from `from` to `to`.
     */
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    /**
     * @dev Emitted when `owner` enables `approved` to manage the `tokenId` token.
     */
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);

    /**
     * @dev Emitted when `owner` enables or disables (`approved`) `operator` to manage all of its assets.
     */
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    /**
     * @dev Returns the number of tokens in ``owner``'s account.
     */
    function balanceOf(address owner) external view returns (uint256 balance);

    /**
     * @dev Returns the owner of the `tokenId` token.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function ownerOf(uint256 tokenId) external view returns (address owner);

    /**
     * @dev Safely transfers `tokenId` token from `from` to `to`.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must exist and be owned by `from`.
     * - If the caller is not `from`, it must be approved to move this token by either {approve} or {setApprovalForAll}.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon
     *   a safe transfer.
     *
     * Emits a {Transfer} event.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;

    /**
     * @dev Safely transfers `tokenId` token from `from` to `to`, checking first that contract recipients
     * are aware of the ERC-721 protocol to prevent tokens from being forever locked.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must exist and be owned by `from`.
     * - If the caller is not `from`, it must have been allowed to move this token by either {approve} or
     *   {setApprovalForAll}.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon
     *   a safe transfer.
     *
     * Emits a {Transfer} event.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) external;

    /**
     * @dev Transfers `tokenId` token from `from` to `to`.
     *
     * WARNING: Note that the caller is responsible to confirm that the recipient is capable of receiving ERC-721
     * or else they may be permanently lost. Usage of {safeTransferFrom} prevents loss, though the caller must
     * understand this adds an external call which potentially creates a reentrancy vulnerability.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must be owned by `from`.
     * - If the caller is not `from`, it must be approved to move this token by either {approve} or {setApprovalForAll}.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 tokenId) external;

    /**
     * @dev Gives permission to `to` to transfer `tokenId` token to another account.
     * The approval is cleared when the token is transferred.
     *
     * Only a single account can be approved at a time, so approving the zero address clears previous approvals.
     *
     * Requirements:
     *
     * - The caller must own the token or be an approved operator.
     * - `tokenId` must exist.
     *
     * Emits an {Approval} event.
     */
    function approve(address to, uint256 tokenId) external;

    /**
     * @dev Approve or remove `operator` as an operator for the caller.
     * Operators can call {transferFrom} or {safeTransferFrom} for any token owned by the caller.
     *
     * Requirements:
     *
     * - The `operator` cannot be the address zero.
     *
     * Emits an {ApprovalForAll} event.
     */
    function setApprovalForAll(address operator, bool approved) external;

    /**
     * @dev Returns the account approved for `tokenId` token.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function getApproved(uint256 tokenId) external view returns (address operator);

    /**
     * @dev Returns if the `operator` is allowed to manage all of the assets of `owner`.
     *
     * See {setApprovalForAll}
     */
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC721/IERC721Receiver.sol)

pragma solidity >=0.5.0;

/**
 * @title ERC-721 token receiver interface
 * @dev Interface for any contract that wants to support safeTransfers
 * from ERC-721 asset contracts.
 */
interface IERC721Receiver {
    /**
     * @dev Whenever an {IERC721} `tokenId` token is transferred to this contract via {IERC721-safeTransferFrom}
     * by `operator` from `from`, this function is called.
     *
     * It must return its Solidity selector to confirm the token transfer.
     * If any other value is returned or the interface is not implemented by the recipient, the transfer will be
     * reverted.
     *
     * The selector can be obtained in Solidity with `IERC721Receiver.onERC721Received.selector`.
     */
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC721/utils/ERC721Holder.sol)

pragma solidity ^0.8.20;

import {IERC721Receiver} from "../IERC721Receiver.sol";

/**
 * @dev Implementation of the {IERC721Receiver} interface.
 *
 * Accepts all token transfers.
 * Make sure the contract is able to use its token with {IERC721-safeTransferFrom}, {IERC721-approve} or
 * {IERC721-setApprovalForAll}.
 */
abstract contract ERC721Holder is IERC721Receiver {
    /**
     * @dev See {IERC721Receiver-onERC721Received}.
     *
     * Always returns `IERC721Receiver.onERC721Received.selector`.
     */
    function onERC721Received(address, address, uint256, bytes memory) public virtual returns (bytes4) {
        return this.onERC721Received.selector;
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/utils/Address.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/Address.sol)

pragma solidity ^0.8.20;

import {Errors} from "./Errors.sol";

/**
 * @dev Collection of functions related to the address type
 */
library Address {
    /**
     * @dev There's no code at `target` (it is not a contract).
     */
    error AddressEmptyCode(address target);

    /**
     * @dev Replacement for Solidity's `transfer`: sends `amount` wei to
     * `recipient`, forwarding all available gas and reverting on errors.
     *
     * https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost
     * of certain opcodes, possibly making contracts go over the 2300 gas limit
     * imposed by `transfer`, making them unable to receive funds via
     * `transfer`. {sendValue} removes this limitation.
     *
     * https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now/[Learn more].
     *
     * IMPORTANT: because control is transferred to `recipient`, care must be
     * taken to not create reentrancy vulnerabilities. Consider using
     * {ReentrancyGuard} or the
     * https://solidity.readthedocs.io/en/v0.8.20/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern].
     */
    function sendValue(address payable recipient, uint256 amount) internal {
        if (address(this).balance < amount) {
            revert Errors.InsufficientBalance(address(this).balance, amount);
        }

        (bool success, bytes memory returndata) = recipient.call{value: amount}("");
        if (!success) {
            _revert(returndata);
        }
    }

    /**
     * @dev Performs a Solidity function call using a low level `call`. A
     * plain `call` is an unsafe replacement for a function call: use this
     * function instead.
     *
     * If `target` reverts with a revert reason or custom error, it is bubbled
     * up by this function (like regular Solidity function calls). However, if
     * the call reverted with no returned reason, this function reverts with a
     * {Errors.FailedCall} error.
     *
     * Returns the raw returned data. To convert to the expected return value,
     * use https://solidity.readthedocs.io/en/latest/units-and-global-variables.html?highlight=abi.decode#abi-encoding-and-decoding-functions[`abi.decode`].
     *
     * Requirements:
     *
     * - `target` must be a contract.
     * - calling `target` with `data` must not revert.
     */
    function functionCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but also transferring `value` wei to `target`.
     *
     * Requirements:
     *
     * - the calling contract must have an ETH balance of at least `value`.
     * - the called Solidity function must be `payable`.
     */
    function functionCallWithValue(address target, bytes memory data, uint256 value) internal returns (bytes memory) {
        if (address(this).balance < value) {
            revert Errors.InsufficientBalance(address(this).balance, value);
        }
        (bool success, bytes memory returndata) = target.call{value: value}(data);
        return verifyCallResultFromTarget(target, success, returndata);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a static call.
     */
    function functionStaticCall(address target, bytes memory data) internal view returns (bytes memory) {
        (bool success, bytes memory returndata) = target.staticcall(data);
        return verifyCallResultFromTarget(target, success, returndata);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a delegate call.
     */
    function functionDelegateCall(address target, bytes memory data) internal returns (bytes memory) {
        (bool success, bytes memory returndata) = target.delegatecall(data);
        return verifyCallResultFromTarget(target, success, returndata);
    }

    /**
     * @dev Tool to verify that a low level call to smart-contract was successful, and reverts if the target
     * was not a contract or bubbling up the revert reason (falling back to {Errors.FailedCall}) in case
     * of an unsuccessful call.
     */
    function verifyCallResultFromTarget(
        address target,
        bool success,
        bytes memory returndata
    ) internal view returns (bytes memory) {
        if (!success) {
            _revert(returndata);
        } else {
            // only check if target is a contract if the call was successful and the return data is empty
            // otherwise we already know that it was a contract
            if (returndata.length == 0 && target.code.length == 0) {
                revert AddressEmptyCode(target);
            }
            return returndata;
        }
    }

    /**
     * @dev Tool to verify that a low level call was successful, and reverts if it wasn't, either by bubbling the
     * revert reason or with a default {Errors.FailedCall} error.
     */
    function verifyCallResult(bool success, bytes memory returndata) internal pure returns (bytes memory) {
        if (!success) {
            _revert(returndata);
        } else {
            return returndata;
        }
    }

    /**
     * @dev Reverts with returndata if present. Otherwise reverts with {Errors.FailedCall}.
     */
    function _revert(bytes memory returndata) private pure {
        // Look for revert reason and bubble it up if present
        if (returndata.length > 0) {
            // The easiest way to bubble the revert reason is using memory via assembly
            assembly ("memory-safe") {
                revert(add(returndata, 0x20), mload(returndata))
            }
        } else {
            revert Errors.FailedCall();
        }
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/utils/Bytes.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/Bytes.sol)

pragma solidity ^0.8.24;

import {Math} from "./math/Math.sol";

/**
 * @dev Bytes operations.
 */
library Bytes {
    /**
     * @dev Forward search for `s` in `buffer`
     * * If `s` is present in the buffer, returns the index of the first instance
     * * If `s` is not present in the buffer, returns type(uint256).max
     *
     * NOTE: replicates the behavior of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf[Javascript's `Array.indexOf`]
     */
    function indexOf(bytes memory buffer, bytes1 s) internal pure returns (uint256) {
        return indexOf(buffer, s, 0);
    }

    /**
     * @dev Forward search for `s` in `buffer` starting at position `pos`
     * * If `s` is present in the buffer (at or after `pos`), returns the index of the next instance
     * * If `s` is not present in the buffer (at or after `pos`), returns type(uint256).max
     *
     * NOTE: replicates the behavior of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf[Javascript's `Array.indexOf`]
     */
    function indexOf(bytes memory buffer, bytes1 s, uint256 pos) internal pure returns (uint256) {
        uint256 length = buffer.length;
        for (uint256 i = pos; i < length; ++i) {
            if (bytes1(_unsafeReadBytesOffset(buffer, i)) == s) {
                return i;
            }
        }
        return type(uint256).max;
    }

    /**
     * @dev Backward search for `s` in `buffer`
     * * If `s` is present in the buffer, returns the index of the last instance
     * * If `s` is not present in the buffer, returns type(uint256).max
     *
     * NOTE: replicates the behavior of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/lastIndexOf[Javascript's `Array.lastIndexOf`]
     */
    function lastIndexOf(bytes memory buffer, bytes1 s) internal pure returns (uint256) {
        return lastIndexOf(buffer, s, type(uint256).max);
    }

    /**
     * @dev Backward search for `s` in `buffer` starting at position `pos`
     * * If `s` is present in the buffer (at or before `pos`), returns the index of the previous instance
     * * If `s` is not present in the buffer (at or before `pos`), returns type(uint256).max
     *
     * NOTE: replicates the behavior of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/lastIndexOf[Javascript's `Array.lastIndexOf`]
     */
    function lastIndexOf(bytes memory buffer, bytes1 s, uint256 pos) internal pure returns (uint256) {
        unchecked {
            uint256 length = buffer.length;
            for (uint256 i = Math.min(Math.saturatingAdd(pos, 1), length); i > 0; --i) {
                if (bytes1(_unsafeReadBytesOffset(buffer, i - 1)) == s) {
                    return i - 1;
                }
            }
            return type(uint256).max;
        }
    }

    /**
     * @dev Copies the content of `buffer`, from `start` (included) to the end of `buffer` into a new bytes object in
     * memory.
     *
     * NOTE: replicates the behavior of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice[Javascript's `Array.slice`]
     */
    function slice(bytes memory buffer, uint256 start) internal pure returns (bytes memory) {
        return slice(buffer, start, buffer.length);
    }

    /**
     * @dev Copies the content of `buffer`, from `start` (included) to `end` (excluded) into a new bytes object in
     * memory.
     *
     * NOTE: replicates the behavior of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice[Javascript's `Array.slice`]
     */
    function slice(bytes memory buffer, uint256 start, uint256 end) internal pure returns (bytes memory) {
        // sanitize
        uint256 length = buffer.length;
        end = Math.min(end, length);
        start = Math.min(start, end);

        // allocate and copy
        bytes memory result = new bytes(end - start);
        assembly ("memory-safe") {
            mcopy(add(result, 0x20), add(add(buffer, 0x20), start), sub(end, start))
        }

        return result;
    }

    /**
     * @dev Reads a bytes32 from a bytes array without bounds checking.
     *
     * NOTE: making this function internal would mean it could be used with memory unsafe offset, and marking the
     * assembly block as such would prevent some optimizations.
     */
    function _unsafeReadBytesOffset(bytes memory buffer, uint256 offset) private pure returns (bytes32 value) {
        // This is not memory safe in the general case, but all calls to this private function are within bounds.
        assembly ("memory-safe") {
            value := mload(add(add(buffer, 0x20), offset))
        }
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/utils/Context.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/utils/Errors.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/Errors.sol)

pragma solidity ^0.8.20;

/**
 * @dev Collection of common custom errors used in multiple contracts
 *
 * IMPORTANT: Backwards compatibility is not guaranteed in future versions of the library.
 * It is recommended to avoid relying on the error API for critical functionality.
 *
 * _Available since v5.1._
 */
library Errors {
    /**
     * @dev The ETH balance of the account is not enough to perform the operation.
     */
    error InsufficientBalance(uint256 balance, uint256 needed);

    /**
     * @dev A call to an address target failed. The target may have reverted.
     */
    error FailedCall();

    /**
     * @dev The deployment failed.
     */
    error FailedDeployment();

    /**
     * @dev A necessary precompile is missing.
     */
    error MissingPrecompile(address);
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/utils/Nonces.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (utils/Nonces.sol)
pragma solidity ^0.8.20;

/**
 * @dev Provides tracking nonces for addresses. Nonces will only increment.
 */
abstract contract Nonces {
    /**
     * @dev The nonce used for an `account` is not the expected current nonce.
     */
    error InvalidAccountNonce(address account, uint256 currentNonce);

    mapping(address account => uint256) private _nonces;

    /**
     * @dev Returns the next unused nonce for an address.
     */
    function nonces(address owner) public view virtual returns (uint256) {
        return _nonces[owner];
    }

    /**
     * @dev Consumes a nonce.
     *
     * Returns the current value and increments nonce.
     */
    function _useNonce(address owner) internal virtual returns (uint256) {
        // For each account, the nonce has an initial value of 0, can only be incremented by one, and cannot be
        // decremented or reset. This guarantees that the nonce never overflows.
        unchecked {
            // It is important to do x++ and not ++x here.
            return _nonces[owner]++;
        }
    }

    /**
     * @dev Same as {_useNonce} but checking that `nonce` is the next valid for `owner`.
     */
    function _useCheckedNonce(address owner, uint256 nonce) internal virtual {
        uint256 current = _useNonce(owner);
        if (nonce != current) {
            revert InvalidAccountNonce(owner, current);
        }
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/utils/Panic.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/Panic.sol)

pragma solidity ^0.8.20;

/**
 * @dev Helper library for emitting standardized panic codes.
 *
 * ```solidity
 * contract Example {
 *      using Panic for uint256;
 *
 *      // Use any of the declared internal constants
 *      function foo() { Panic.GENERIC.panic(); }
 *
 *      // Alternatively
 *      function foo() { Panic.panic(Panic.GENERIC); }
 * }
 * ```
 *
 * Follows the list from https://github.com/ethereum/solidity/blob/v0.8.24/libsolutil/ErrorCodes.h[libsolutil].
 *
 * _Available since v5.1._
 */
// slither-disable-next-line unused-state
library Panic {
    /// @dev generic / unspecified error
    uint256 internal constant GENERIC = 0x00;
    /// @dev used by the assert() builtin
    uint256 internal constant ASSERT = 0x01;
    /// @dev arithmetic underflow or overflow
    uint256 internal constant UNDER_OVERFLOW = 0x11;
    /// @dev division or modulo by zero
    uint256 internal constant DIVISION_BY_ZERO = 0x12;
    /// @dev enum conversion error
    uint256 internal constant ENUM_CONVERSION_ERROR = 0x21;
    /// @dev invalid encoding in storage
    uint256 internal constant STORAGE_ENCODING_ERROR = 0x22;
    /// @dev empty array pop
    uint256 internal constant EMPTY_ARRAY_POP = 0x31;
    /// @dev array out of bounds access
    uint256 internal constant ARRAY_OUT_OF_BOUNDS = 0x32;
    /// @dev resource error (too large allocation or too large array)
    uint256 internal constant RESOURCE_ERROR = 0x41;
    /// @dev calling invalid internal function
    uint256 internal constant INVALID_INTERNAL_FUNCTION = 0x51;

    /// @dev Reverts with a panic code. Recommended to use with
    /// the internal constants with predefined codes.
    function panic(uint256 code) internal pure {
        assembly ("memory-safe") {
            mstore(0x00, 0x4e487b71)
            mstore(0x20, code)
            revert(0x1c, 0x24)
        }
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/utils/ReentrancyGuard.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/ReentrancyGuard.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }

        // Any calls to nonReentrant after this point will fail
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/utils/ShortStrings.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (utils/ShortStrings.sol)

pragma solidity ^0.8.20;

import {StorageSlot} from "./StorageSlot.sol";

// | string  | 0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA   |
// | length  | 0x                                                              BB |
type ShortString is bytes32;

/**
 * @dev This library provides functions to convert short memory strings
 * into a `ShortString` type that can be used as an immutable variable.
 *
 * Strings of arbitrary length can be optimized using this library if
 * they are short enough (up to 31 bytes) by packing them with their
 * length (1 byte) in a single EVM word (32 bytes). Additionally, a
 * fallback mechanism can be used for every other case.
 *
 * Usage example:
 *
 * ```solidity
 * contract Named {
 *     using ShortStrings for *;
 *
 *     ShortString private immutable _name;
 *     string private _nameFallback;
 *
 *     constructor(string memory contractName) {
 *         _name = contractName.toShortStringWithFallback(_nameFallback);
 *     }
 *
 *     function name() external view returns (string memory) {
 *         return _name.toStringWithFallback(_nameFallback);
 *     }
 * }
 * ```
 */
library ShortStrings {
    // Used as an identifier for strings longer than 31 bytes.
    bytes32 private constant FALLBACK_SENTINEL = 0x00000000000000000000000000000000000000000000000000000000000000FF;

    error StringTooLong(string str);
    error InvalidShortString();

    /**
     * @dev Encode a string of at most 31 chars into a `ShortString`.
     *
     * This will trigger a `StringTooLong` error is the input string is too long.
     */
    function toShortString(string memory str) internal pure returns (ShortString) {
        bytes memory bstr = bytes(str);
        if (bstr.length > 31) {
            revert StringTooLong(str);
        }
        return ShortString.wrap(bytes32(uint256(bytes32(bstr)) | bstr.length));
    }

    /**
     * @dev Decode a `ShortString` back to a "normal" string.
     */
    function toString(ShortString sstr) internal pure returns (string memory) {
        uint256 len = byteLength(sstr);
        // using `new string(len)` would work locally but is not memory safe.
        string memory str = new string(32);
        assembly ("memory-safe") {
            mstore(str, len)
            mstore(add(str, 0x20), sstr)
        }
        return str;
    }

    /**
     * @dev Return the length of a `ShortString`.
     */
    function byteLength(ShortString sstr) internal pure returns (uint256) {
        uint256 result = uint256(ShortString.unwrap(sstr)) & 0xFF;
        if (result > 31) {
            revert InvalidShortString();
        }
        return result;
    }

    /**
     * @dev Encode a string into a `ShortString`, or write it to storage if it is too long.
     */
    function toShortStringWithFallback(string memory value, string storage store) internal returns (ShortString) {
        if (bytes(value).length < 32) {
            return toShortString(value);
        } else {
            StorageSlot.getStringSlot(store).value = value;
            return ShortString.wrap(FALLBACK_SENTINEL);
        }
    }

    /**
     * @dev Decode a string that was encoded to `ShortString` or written to storage using {toShortStringWithFallback}.
     */
    function toStringWithFallback(ShortString value, string storage store) internal pure returns (string memory) {
        if (ShortString.unwrap(value) != FALLBACK_SENTINEL) {
            return toString(value);
        } else {
            return store;
        }
    }

    /**
     * @dev Return the length of a string that was encoded to `ShortString` or written to storage using
     * {toShortStringWithFallback}.
     *
     * WARNING: This will return the "byte length" of the string. This may not reflect the actual length in terms of
     * actual characters as the UTF-8 encoding of a single character can span over multiple bytes.
     */
    function byteLengthWithFallback(ShortString value, string storage store) internal view returns (uint256) {
        if (ShortString.unwrap(value) != FALLBACK_SENTINEL) {
            return byteLength(value);
        } else {
            return bytes(store).length;
        }
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/utils/StorageSlot.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/StorageSlot.sol)
// This file was procedurally generated from scripts/generate/templates/StorageSlot.js.

pragma solidity ^0.8.20;

/**
 * @dev Library for reading and writing primitive types to specific storage slots.
 *
 * Storage slots are often used to avoid storage conflict when dealing with upgradeable contracts.
 * This library helps with reading and writing to such slots without the need for inline assembly.
 *
 * The functions in this library return Slot structs that contain a `value` member that can be used to read or write.
 *
 * Example usage to set ERC-1967 implementation slot:
 * ```solidity
 * contract ERC1967 {
 *     // Define the slot. Alternatively, use the SlotDerivation library to derive the slot.
 *     bytes32 internal constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
 *
 *     function _getImplementation() internal view returns (address) {
 *         return StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value;
 *     }
 *
 *     function _setImplementation(address newImplementation) internal {
 *         require(newImplementation.code.length > 0);
 *         StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value = newImplementation;
 *     }
 * }
 * ```
 *
 * TIP: Consider using this library along with {SlotDerivation}.
 */
library StorageSlot {
    struct AddressSlot {
        address value;
    }

    struct BooleanSlot {
        bool value;
    }

    struct Bytes32Slot {
        bytes32 value;
    }

    struct Uint256Slot {
        uint256 value;
    }

    struct Int256Slot {
        int256 value;
    }

    struct StringSlot {
        string value;
    }

    struct BytesSlot {
        bytes value;
    }

    /**
     * @dev Returns an `AddressSlot` with member `value` located at `slot`.
     */
    function getAddressSlot(bytes32 slot) internal pure returns (AddressSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `BooleanSlot` with member `value` located at `slot`.
     */
    function getBooleanSlot(bytes32 slot) internal pure returns (BooleanSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `Bytes32Slot` with member `value` located at `slot`.
     */
    function getBytes32Slot(bytes32 slot) internal pure returns (Bytes32Slot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `Uint256Slot` with member `value` located at `slot`.
     */
    function getUint256Slot(bytes32 slot) internal pure returns (Uint256Slot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `Int256Slot` with member `value` located at `slot`.
     */
    function getInt256Slot(bytes32 slot) internal pure returns (Int256Slot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `StringSlot` with member `value` located at `slot`.
     */
    function getStringSlot(bytes32 slot) internal pure returns (StringSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns an `StringSlot` representation of the string storage pointer `store`.
     */
    function getStringSlot(string storage store) internal pure returns (StringSlot storage r) {
        assembly ("memory-safe") {
            r.slot := store.slot
        }
    }

    /**
     * @dev Returns a `BytesSlot` with member `value` located at `slot`.
     */
    function getBytesSlot(bytes32 slot) internal pure returns (BytesSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns an `BytesSlot` representation of the bytes storage pointer `store`.
     */
    function getBytesSlot(bytes storage store) internal pure returns (BytesSlot storage r) {
        assembly ("memory-safe") {
            r.slot := store.slot
        }
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/utils/Strings.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/Strings.sol)

pragma solidity ^0.8.20;

import {Math} from "./math/Math.sol";
import {SafeCast} from "./math/SafeCast.sol";
import {SignedMath} from "./math/SignedMath.sol";

/**
 * @dev String operations.
 */
library Strings {
    using SafeCast for *;

    bytes16 private constant HEX_DIGITS = "0123456789abcdef";
    uint8 private constant ADDRESS_LENGTH = 20;
    uint256 private constant SPECIAL_CHARS_LOOKUP =
        (1 << 0x08) | // backspace
            (1 << 0x09) | // tab
            (1 << 0x0a) | // newline
            (1 << 0x0c) | // form feed
            (1 << 0x0d) | // carriage return
            (1 << 0x22) | // double quote
            (1 << 0x5c); // backslash

    /**
     * @dev The `value` string doesn't fit in the specified `length`.
     */
    error StringsInsufficientHexLength(uint256 value, uint256 length);

    /**
     * @dev The string being parsed contains characters that are not in scope of the given base.
     */
    error StringsInvalidChar();

    /**
     * @dev The string being parsed is not a properly formatted address.
     */
    error StringsInvalidAddressFormat();

    /**
     * @dev Converts a `uint256` to its ASCII `string` decimal representation.
     */
    function toString(uint256 value) internal pure returns (string memory) {
        unchecked {
            uint256 length = Math.log10(value) + 1;
            string memory buffer = new string(length);
            uint256 ptr;
            assembly ("memory-safe") {
                ptr := add(add(buffer, 0x20), length)
            }
            while (true) {
                ptr--;
                assembly ("memory-safe") {
                    mstore8(ptr, byte(mod(value, 10), HEX_DIGITS))
                }
                value /= 10;
                if (value == 0) break;
            }
            return buffer;
        }
    }

    /**
     * @dev Converts a `int256` to its ASCII `string` decimal representation.
     */
    function toStringSigned(int256 value) internal pure returns (string memory) {
        return string.concat(value < 0 ? "-" : "", toString(SignedMath.abs(value)));
    }

    /**
     * @dev Converts a `uint256` to its ASCII `string` hexadecimal representation.
     */
    function toHexString(uint256 value) internal pure returns (string memory) {
        unchecked {
            return toHexString(value, Math.log256(value) + 1);
        }
    }

    /**
     * @dev Converts a `uint256` to its ASCII `string` hexadecimal representation with fixed length.
     */
    function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        uint256 localValue = value;
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = HEX_DIGITS[localValue & 0xf];
            localValue >>= 4;
        }
        if (localValue != 0) {
            revert StringsInsufficientHexLength(value, length);
        }
        return string(buffer);
    }

    /**
     * @dev Converts an `address` with fixed length of 20 bytes to its not checksummed ASCII `string` hexadecimal
     * representation.
     */
    function toHexString(address addr) internal pure returns (string memory) {
        return toHexString(uint256(uint160(addr)), ADDRESS_LENGTH);
    }

    /**
     * @dev Converts an `address` with fixed length of 20 bytes to its checksummed ASCII `string` hexadecimal
     * representation, according to EIP-55.
     */
    function toChecksumHexString(address addr) internal pure returns (string memory) {
        bytes memory buffer = bytes(toHexString(addr));

        // hash the hex part of buffer (skip length + 2 bytes, length 40)
        uint256 hashValue;
        assembly ("memory-safe") {
            hashValue := shr(96, keccak256(add(buffer, 0x22), 40))
        }

        for (uint256 i = 41; i > 1; --i) {
            // possible values for buffer[i] are 48 (0) to 57 (9) and 97 (a) to 102 (f)
            if (hashValue & 0xf > 7 && uint8(buffer[i]) > 96) {
                // case shift by xoring with 0x20
                buffer[i] ^= 0x20;
            }
            hashValue >>= 4;
        }
        return string(buffer);
    }

    /**
     * @dev Returns true if the two strings are equal.
     */
    function equal(string memory a, string memory b) internal pure returns (bool) {
        return bytes(a).length == bytes(b).length && keccak256(bytes(a)) == keccak256(bytes(b));
    }

    /**
     * @dev Parse a decimal string and returns the value as a `uint256`.
     *
     * Requirements:
     * - The string must be formatted as `[0-9]*`
     * - The result must fit into an `uint256` type
     */
    function parseUint(string memory input) internal pure returns (uint256) {
        return parseUint(input, 0, bytes(input).length);
    }

    /**
     * @dev Variant of {parseUint-string} that parses a substring of `input` located between position `begin` (included) and
     * `end` (excluded).
     *
     * Requirements:
     * - The substring must be formatted as `[0-9]*`
     * - The result must fit into an `uint256` type
     */
    function parseUint(string memory input, uint256 begin, uint256 end) internal pure returns (uint256) {
        (bool success, uint256 value) = tryParseUint(input, begin, end);
        if (!success) revert StringsInvalidChar();
        return value;
    }

    /**
     * @dev Variant of {parseUint-string} that returns false if the parsing fails because of an invalid character.
     *
     * NOTE: This function will revert if the result does not fit in a `uint256`.
     */
    function tryParseUint(string memory input) internal pure returns (bool success, uint256 value) {
        return _tryParseUintUncheckedBounds(input, 0, bytes(input).length);
    }

    /**
     * @dev Variant of {parseUint-string-uint256-uint256} that returns false if the parsing fails because of an invalid
     * character.
     *
     * NOTE: This function will revert if the result does not fit in a `uint256`.
     */
    function tryParseUint(
        string memory input,
        uint256 begin,
        uint256 end
    ) internal pure returns (bool success, uint256 value) {
        if (end > bytes(input).length || begin > end) return (false, 0);
        return _tryParseUintUncheckedBounds(input, begin, end);
    }

    /**
     * @dev Implementation of {tryParseUint-string-uint256-uint256} that does not check bounds. Caller should make sure that
     * `begin <= end <= input.length`. Other inputs would result in undefined behavior.
     */
    function _tryParseUintUncheckedBounds(
        string memory input,
        uint256 begin,
        uint256 end
    ) private pure returns (bool success, uint256 value) {
        bytes memory buffer = bytes(input);

        uint256 result = 0;
        for (uint256 i = begin; i < end; ++i) {
            uint8 chr = _tryParseChr(bytes1(_unsafeReadBytesOffset(buffer, i)));
            if (chr > 9) return (false, 0);
            result *= 10;
            result += chr;
        }
        return (true, result);
    }

    /**
     * @dev Parse a decimal string and returns the value as a `int256`.
     *
     * Requirements:
     * - The string must be formatted as `[-+]?[0-9]*`
     * - The result must fit in an `int256` type.
     */
    function parseInt(string memory input) internal pure returns (int256) {
        return parseInt(input, 0, bytes(input).length);
    }

    /**
     * @dev Variant of {parseInt-string} that parses a substring of `input` located between position `begin` (included) and
     * `end` (excluded).
     *
     * Requirements:
     * - The substring must be formatted as `[-+]?[0-9]*`
     * - The result must fit in an `int256` type.
     */
    function parseInt(string memory input, uint256 begin, uint256 end) internal pure returns (int256) {
        (bool success, int256 value) = tryParseInt(input, begin, end);
        if (!success) revert StringsInvalidChar();
        return value;
    }

    /**
     * @dev Variant of {parseInt-string} that returns false if the parsing fails because of an invalid character or if
     * the result does not fit in a `int256`.
     *
     * NOTE: This function will revert if the absolute value of the result does not fit in a `uint256`.
     */
    function tryParseInt(string memory input) internal pure returns (bool success, int256 value) {
        return _tryParseIntUncheckedBounds(input, 0, bytes(input).length);
    }

    uint256 private constant ABS_MIN_INT256 = 2 ** 255;

    /**
     * @dev Variant of {parseInt-string-uint256-uint256} that returns false if the parsing fails because of an invalid
     * character or if the result does not fit in a `int256`.
     *
     * NOTE: This function will revert if the absolute value of the result does not fit in a `uint256`.
     */
    function tryParseInt(
        string memory input,
        uint256 begin,
        uint256 end
    ) internal pure returns (bool success, int256 value) {
        if (end > bytes(input).length || begin > end) return (false, 0);
        return _tryParseIntUncheckedBounds(input, begin, end);
    }

    /**
     * @dev Implementation of {tryParseInt-string-uint256-uint256} that does not check bounds. Caller should make sure that
     * `begin <= end <= input.length`. Other inputs would result in undefined behavior.
     */
    function _tryParseIntUncheckedBounds(
        string memory input,
        uint256 begin,
        uint256 end
    ) private pure returns (bool success, int256 value) {
        bytes memory buffer = bytes(input);

        // Check presence of a negative sign.
        bytes1 sign = begin == end ? bytes1(0) : bytes1(_unsafeReadBytesOffset(buffer, begin)); // don't do out-of-bound (possibly unsafe) read if sub-string is empty
        bool positiveSign = sign == bytes1("+");
        bool negativeSign = sign == bytes1("-");
        uint256 offset = (positiveSign || negativeSign).toUint();

        (bool absSuccess, uint256 absValue) = tryParseUint(input, begin + offset, end);

        if (absSuccess && absValue < ABS_MIN_INT256) {
            return (true, negativeSign ? -int256(absValue) : int256(absValue));
        } else if (absSuccess && negativeSign && absValue == ABS_MIN_INT256) {
            return (true, type(int256).min);
        } else return (false, 0);
    }

    /**
     * @dev Parse a hexadecimal string (with or without "0x" prefix), and returns the value as a `uint256`.
     *
     * Requirements:
     * - The string must be formatted as `(0x)?[0-9a-fA-F]*`
     * - The result must fit in an `uint256` type.
     */
    function parseHexUint(string memory input) internal pure returns (uint256) {
        return parseHexUint(input, 0, bytes(input).length);
    }

    /**
     * @dev Variant of {parseHexUint-string} that parses a substring of `input` located between position `begin` (included) and
     * `end` (excluded).
     *
     * Requirements:
     * - The substring must be formatted as `(0x)?[0-9a-fA-F]*`
     * - The result must fit in an `uint256` type.
     */
    function parseHexUint(string memory input, uint256 begin, uint256 end) internal pure returns (uint256) {
        (bool success, uint256 value) = tryParseHexUint(input, begin, end);
        if (!success) revert StringsInvalidChar();
        return value;
    }

    /**
     * @dev Variant of {parseHexUint-string} that returns false if the parsing fails because of an invalid character.
     *
     * NOTE: This function will revert if the result does not fit in a `uint256`.
     */
    function tryParseHexUint(string memory input) internal pure returns (bool success, uint256 value) {
        return _tryParseHexUintUncheckedBounds(input, 0, bytes(input).length);
    }

    /**
     * @dev Variant of {parseHexUint-string-uint256-uint256} that returns false if the parsing fails because of an
     * invalid character.
     *
     * NOTE: This function will revert if the result does not fit in a `uint256`.
     */
    function tryParseHexUint(
        string memory input,
        uint256 begin,
        uint256 end
    ) internal pure returns (bool success, uint256 value) {
        if (end > bytes(input).length || begin > end) return (false, 0);
        return _tryParseHexUintUncheckedBounds(input, begin, end);
    }

    /**
     * @dev Implementation of {tryParseHexUint-string-uint256-uint256} that does not check bounds. Caller should make sure that
     * `begin <= end <= input.length`. Other inputs would result in undefined behavior.
     */
    function _tryParseHexUintUncheckedBounds(
        string memory input,
        uint256 begin,
        uint256 end
    ) private pure returns (bool success, uint256 value) {
        bytes memory buffer = bytes(input);

        // skip 0x prefix if present
        bool hasPrefix = (end > begin + 1) && bytes2(_unsafeReadBytesOffset(buffer, begin)) == bytes2("0x"); // don't do out-of-bound (possibly unsafe) read if sub-string is empty
        uint256 offset = hasPrefix.toUint() * 2;

        uint256 result = 0;
        for (uint256 i = begin + offset; i < end; ++i) {
            uint8 chr = _tryParseChr(bytes1(_unsafeReadBytesOffset(buffer, i)));
            if (chr > 15) return (false, 0);
            result *= 16;
            unchecked {
                // Multiplying by 16 is equivalent to a shift of 4 bits (with additional overflow check).
                // This guarantees that adding a value < 16 will not cause an overflow, hence the unchecked.
                result += chr;
            }
        }
        return (true, result);
    }

    /**
     * @dev Parse a hexadecimal string (with or without "0x" prefix), and returns the value as an `address`.
     *
     * Requirements:
     * - The string must be formatted as `(0x)?[0-9a-fA-F]{40}`
     */
    function parseAddress(string memory input) internal pure returns (address) {
        return parseAddress(input, 0, bytes(input).length);
    }

    /**
     * @dev Variant of {parseAddress-string} that parses a substring of `input` located between position `begin` (included) and
     * `end` (excluded).
     *
     * Requirements:
     * - The substring must be formatted as `(0x)?[0-9a-fA-F]{40}`
     */
    function parseAddress(string memory input, uint256 begin, uint256 end) internal pure returns (address) {
        (bool success, address value) = tryParseAddress(input, begin, end);
        if (!success) revert StringsInvalidAddressFormat();
        return value;
    }

    /**
     * @dev Variant of {parseAddress-string} that returns false if the parsing fails because the input is not a properly
     * formatted address. See {parseAddress-string} requirements.
     */
    function tryParseAddress(string memory input) internal pure returns (bool success, address value) {
        return tryParseAddress(input, 0, bytes(input).length);
    }

    /**
     * @dev Variant of {parseAddress-string-uint256-uint256} that returns false if the parsing fails because input is not a properly
     * formatted address. See {parseAddress-string-uint256-uint256} requirements.
     */
    function tryParseAddress(
        string memory input,
        uint256 begin,
        uint256 end
    ) internal pure returns (bool success, address value) {
        if (end > bytes(input).length || begin > end) return (false, address(0));

        bool hasPrefix = (end > begin + 1) && bytes2(_unsafeReadBytesOffset(bytes(input), begin)) == bytes2("0x"); // don't do out-of-bound (possibly unsafe) read if sub-string is empty
        uint256 expectedLength = 40 + hasPrefix.toUint() * 2;

        // check that input is the correct length
        if (end - begin == expectedLength) {
            // length guarantees that this does not overflow, and value is at most type(uint160).max
            (bool s, uint256 v) = _tryParseHexUintUncheckedBounds(input, begin, end);
            return (s, address(uint160(v)));
        } else {
            return (false, address(0));
        }
    }

    function _tryParseChr(bytes1 chr) private pure returns (uint8) {
        uint8 value = uint8(chr);

        // Try to parse `chr`:
        // - Case 1: [0-9]
        // - Case 2: [a-f]
        // - Case 3: [A-F]
        // - otherwise not supported
        unchecked {
            if (value > 47 && value < 58) value -= 48;
            else if (value > 96 && value < 103) value -= 87;
            else if (value > 64 && value < 71) value -= 55;
            else return type(uint8).max;
        }

        return value;
    }

    /**
     * @dev Escape special characters in JSON strings. This can be useful to prevent JSON injection in NFT metadata.
     *
     * WARNING: This function should only be used in double quoted JSON strings. Single quotes are not escaped.
     *
     * NOTE: This function escapes all unicode characters, and not just the ones in ranges defined in section 2.5 of
     * RFC-4627 (U+0000 to U+001F, U+0022 and U+005C). ECMAScript's `JSON.parse` does recover escaped unicode
     * characters that are not in this range, but other tooling may provide different results.
     */
    function escapeJSON(string memory input) internal pure returns (string memory) {
        bytes memory buffer = bytes(input);
        bytes memory output = new bytes(2 * buffer.length); // worst case scenario
        uint256 outputLength = 0;

        for (uint256 i; i < buffer.length; ++i) {
            bytes1 char = bytes1(_unsafeReadBytesOffset(buffer, i));
            if (((SPECIAL_CHARS_LOOKUP & (1 << uint8(char))) != 0)) {
                output[outputLength++] = "\\";
                if (char == 0x08) output[outputLength++] = "b";
                else if (char == 0x09) output[outputLength++] = "t";
                else if (char == 0x0a) output[outputLength++] = "n";
                else if (char == 0x0c) output[outputLength++] = "f";
                else if (char == 0x0d) output[outputLength++] = "r";
                else if (char == 0x5c) output[outputLength++] = "\\";
                else if (char == 0x22) {
                    // solhint-disable-next-line quotes
                    output[outputLength++] = '"';
                }
            } else {
                output[outputLength++] = char;
            }
        }
        // write the actual length and deallocate unused memory
        assembly ("memory-safe") {
            mstore(output, outputLength)
            mstore(0x40, add(output, shl(5, shr(5, add(outputLength, 63)))))
        }

        return string(output);
    }

    /**
     * @dev Reads a bytes32 from a bytes array without bounds checking.
     *
     * NOTE: making this function internal would mean it could be used with memory unsafe offset, and marking the
     * assembly block as such would prevent some optimizations.
     */
    function _unsafeReadBytesOffset(bytes memory buffer, uint256 offset) private pure returns (bytes32 value) {
        // This is not memory safe in the general case, but all calls to this private function are within bounds.
        assembly ("memory-safe") {
            value := mload(add(add(buffer, 0x20), offset))
        }
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/utils/cryptography/ECDSA.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/cryptography/ECDSA.sol)

pragma solidity ^0.8.20;

/**
 * @dev Elliptic Curve Digital Signature Algorithm (ECDSA) operations.
 *
 * These functions can be used to verify that a message was signed by the holder
 * of the private keys of a given address.
 */
library ECDSA {
    enum RecoverError {
        NoError,
        InvalidSignature,
        InvalidSignatureLength,
        InvalidSignatureS
    }

    /**
     * @dev The signature derives the `address(0)`.
     */
    error ECDSAInvalidSignature();

    /**
     * @dev The signature has an invalid length.
     */
    error ECDSAInvalidSignatureLength(uint256 length);

    /**
     * @dev The signature has an S value that is in the upper half order.
     */
    error ECDSAInvalidSignatureS(bytes32 s);

    /**
     * @dev Returns the address that signed a hashed message (`hash`) with `signature` or an error. This will not
     * return address(0) without also returning an error description. Errors are documented using an enum (error type)
     * and a bytes32 providing additional information about the error.
     *
     * If no error is returned, then the address can be used for verification purposes.
     *
     * The `ecrecover` EVM precompile allows for malleable (non-unique) signatures:
     * this function rejects them by requiring the `s` value to be in the lower
     * half order, and the `v` value to be either 27 or 28.
     *
     * IMPORTANT: `hash` _must_ be the result of a hash operation for the
     * verification to be secure: it is possible to craft signatures that
     * recover to arbitrary addresses for non-hashed data. A safe way to ensure
     * this is by receiving a hash of the original message (which may otherwise
     * be too long), and then calling {MessageHashUtils-toEthSignedMessageHash} on it.
     *
     * Documentation for signature generation:
     * - with https://web3js.readthedocs.io/en/v1.3.4/web3-eth-accounts.html#sign[Web3.js]
     * - with https://docs.ethers.io/v5/api/signer/#Signer-signMessage[ethers]
     */
    function tryRecover(
        bytes32 hash,
        bytes memory signature
    ) internal pure returns (address recovered, RecoverError err, bytes32 errArg) {
        if (signature.length == 65) {
            bytes32 r;
            bytes32 s;
            uint8 v;
            // ecrecover takes the signature parameters, and the only way to get them
            // currently is to use assembly.
            assembly ("memory-safe") {
                r := mload(add(signature, 0x20))
                s := mload(add(signature, 0x40))
                v := byte(0, mload(add(signature, 0x60)))
            }
            return tryRecover(hash, v, r, s);
        } else {
            return (address(0), RecoverError.InvalidSignatureLength, bytes32(signature.length));
        }
    }

    /**
     * @dev Returns the address that signed a hashed message (`hash`) with
     * `signature`. This address can then be used for verification purposes.
     *
     * The `ecrecover` EVM precompile allows for malleable (non-unique) signatures:
     * this function rejects them by requiring the `s` value to be in the lower
     * half order, and the `v` value to be either 27 or 28.
     *
     * IMPORTANT: `hash` _must_ be the result of a hash operation for the
     * verification to be secure: it is possible to craft signatures that
     * recover to arbitrary addresses for non-hashed data. A safe way to ensure
     * this is by receiving a hash of the original message (which may otherwise
     * be too long), and then calling {MessageHashUtils-toEthSignedMessageHash} on it.
     */
    function recover(bytes32 hash, bytes memory signature) internal pure returns (address) {
        (address recovered, RecoverError error, bytes32 errorArg) = tryRecover(hash, signature);
        _throwError(error, errorArg);
        return recovered;
    }

    /**
     * @dev Overload of {ECDSA-tryRecover} that receives the `r` and `vs` short-signature fields separately.
     *
     * See https://eips.ethereum.org/EIPS/eip-2098[ERC-2098 short signatures]
     */
    function tryRecover(
        bytes32 hash,
        bytes32 r,
        bytes32 vs
    ) internal pure returns (address recovered, RecoverError err, bytes32 errArg) {
        unchecked {
            bytes32 s = vs & bytes32(0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);
            // We do not check for an overflow here since the shift operation results in 0 or 1.
            uint8 v = uint8((uint256(vs) >> 255) + 27);
            return tryRecover(hash, v, r, s);
        }
    }

    /**
     * @dev Overload of {ECDSA-recover} that receives the `r and `vs` short-signature fields separately.
     */
    function recover(bytes32 hash, bytes32 r, bytes32 vs) internal pure returns (address) {
        (address recovered, RecoverError error, bytes32 errorArg) = tryRecover(hash, r, vs);
        _throwError(error, errorArg);
        return recovered;
    }

    /**
     * @dev Overload of {ECDSA-tryRecover} that receives the `v`,
     * `r` and `s` signature fields separately.
     */
    function tryRecover(
        bytes32 hash,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal pure returns (address recovered, RecoverError err, bytes32 errArg) {
        // EIP-2 still allows signature malleability for ecrecover(). Remove this possibility and make the signature
        // unique. Appendix F in the Ethereum Yellow paper (https://ethereum.github.io/yellowpaper/paper.pdf), defines
        // the valid range for s in (301): 0 < s < secp256k1n ÷ 2 + 1, and for v in (302): v ∈ {27, 28}. Most
        // signatures from current libraries generate a unique signature with an s-value in the lower half order.
        //
        // If your library generates malleable signatures, such as s-values in the upper range, calculate a new s-value
        // with 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141 - s1 and flip v from 27 to 28 or
        // vice versa. If your library also generates signatures with 0/1 for v instead 27/28, add 27 to v to accept
        // these malleable signatures as well.
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) {
            return (address(0), RecoverError.InvalidSignatureS, s);
        }

        // If the signature is valid (and not malleable), return the signer address
        address signer = ecrecover(hash, v, r, s);
        if (signer == address(0)) {
            return (address(0), RecoverError.InvalidSignature, bytes32(0));
        }

        return (signer, RecoverError.NoError, bytes32(0));
    }

    /**
     * @dev Overload of {ECDSA-recover} that receives the `v`,
     * `r` and `s` signature fields separately.
     */
    function recover(bytes32 hash, uint8 v, bytes32 r, bytes32 s) internal pure returns (address) {
        (address recovered, RecoverError error, bytes32 errorArg) = tryRecover(hash, v, r, s);
        _throwError(error, errorArg);
        return recovered;
    }

    /**
     * @dev Optionally reverts with the corresponding custom error according to the `error` argument provided.
     */
    function _throwError(RecoverError error, bytes32 errorArg) private pure {
        if (error == RecoverError.NoError) {
            return; // no error: do nothing
        } else if (error == RecoverError.InvalidSignature) {
            revert ECDSAInvalidSignature();
        } else if (error == RecoverError.InvalidSignatureLength) {
            revert ECDSAInvalidSignatureLength(uint256(errorArg));
        } else if (error == RecoverError.InvalidSignatureS) {
            revert ECDSAInvalidSignatureS(errorArg);
        }
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/utils/cryptography/EIP712.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/cryptography/EIP712.sol)

pragma solidity ^0.8.20;

import {MessageHashUtils} from "./MessageHashUtils.sol";
import {ShortStrings, ShortString} from "../ShortStrings.sol";
import {IERC5267} from "../../interfaces/IERC5267.sol";

/**
 * @dev https://eips.ethereum.org/EIPS/eip-712[EIP-712] is a standard for hashing and signing of typed structured data.
 *
 * The encoding scheme specified in the EIP requires a domain separator and a hash of the typed structured data, whose
 * encoding is very generic and therefore its implementation in Solidity is not feasible, thus this contract
 * does not implement the encoding itself. Protocols need to implement the type-specific encoding they need in order to
 * produce the hash of their typed data using a combination of `abi.encode` and `keccak256`.
 *
 * This contract implements the EIP-712 domain separator ({_domainSeparatorV4}) that is used as part of the encoding
 * scheme, and the final step of the encoding to obtain the message digest that is then signed via ECDSA
 * ({_hashTypedDataV4}).
 *
 * The implementation of the domain separator was designed to be as efficient as possible while still properly updating
 * the chain id to protect against replay attacks on an eventual fork of the chain.
 *
 * NOTE: This contract implements the version of the encoding known as "v4", as implemented by the JSON RPC method
 * https://docs.metamask.io/guide/signing-data.html[`eth_signTypedDataV4` in MetaMask].
 *
 * NOTE: In the upgradeable version of this contract, the cached values will correspond to the address, and the domain
 * separator of the implementation contract. This will cause the {_domainSeparatorV4} function to always rebuild the
 * separator from the immutable values, which is cheaper than accessing a cached version in cold storage.
 *
 * @custom:oz-upgrades-unsafe-allow state-variable-immutable
 */
abstract contract EIP712 is IERC5267 {
    using ShortStrings for *;

    bytes32 private constant TYPE_HASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");

    // Cache the domain separator as an immutable value, but also store the chain id that it corresponds to, in order to
    // invalidate the cached domain separator if the chain id changes.
    bytes32 private immutable _cachedDomainSeparator;
    uint256 private immutable _cachedChainId;
    address private immutable _cachedThis;

    bytes32 private immutable _hashedName;
    bytes32 private immutable _hashedVersion;

    ShortString private immutable _name;
    ShortString private immutable _version;
    // slither-disable-next-line constable-states
    string private _nameFallback;
    // slither-disable-next-line constable-states
    string private _versionFallback;

    /**
     * @dev Initializes the domain separator and parameter caches.
     *
     * The meaning of `name` and `version` is specified in
     * https://eips.ethereum.org/EIPS/eip-712#definition-of-domainseparator[EIP-712]:
     *
     * - `name`: the user readable name of the signing domain, i.e. the name of the DApp or the protocol.
     * - `version`: the current major version of the signing domain.
     *
     * NOTE: These parameters cannot be changed except through a xref:learn::upgrading-smart-contracts.adoc[smart
     * contract upgrade].
     */
    constructor(string memory name, string memory version) {
        _name = name.toShortStringWithFallback(_nameFallback);
        _version = version.toShortStringWithFallback(_versionFallback);
        _hashedName = keccak256(bytes(name));
        _hashedVersion = keccak256(bytes(version));

        _cachedChainId = block.chainid;
        _cachedDomainSeparator = _buildDomainSeparator();
        _cachedThis = address(this);
    }

    /**
     * @dev Returns the domain separator for the current chain.
     */
    function _domainSeparatorV4() internal view returns (bytes32) {
        if (address(this) == _cachedThis && block.chainid == _cachedChainId) {
            return _cachedDomainSeparator;
        } else {
            return _buildDomainSeparator();
        }
    }

    function _buildDomainSeparator() private view returns (bytes32) {
        return keccak256(abi.encode(TYPE_HASH, _hashedName, _hashedVersion, block.chainid, address(this)));
    }

    /**
     * @dev Given an already https://eips.ethereum.org/EIPS/eip-712#definition-of-hashstruct[hashed struct], this
     * function returns the hash of the fully encoded EIP712 message for this domain.
     *
     * This hash can be used together with {ECDSA-recover} to obtain the signer of a message. For example:
     *
     * ```solidity
     * bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
     *     keccak256("Mail(address to,string contents)"),
     *     mailTo,
     *     keccak256(bytes(mailContents))
     * )));
     * address signer = ECDSA.recover(digest, signature);
     * ```
     */
    function _hashTypedDataV4(bytes32 structHash) internal view virtual returns (bytes32) {
        return MessageHashUtils.toTypedDataHash(_domainSeparatorV4(), structHash);
    }

    /// @inheritdoc IERC5267
    function eip712Domain()
        public
        view
        virtual
        returns (
            bytes1 fields,
            string memory name,
            string memory version,
            uint256 chainId,
            address verifyingContract,
            bytes32 salt,
            uint256[] memory extensions
        )
    {
        return (
            hex"0f", // 01111
            _EIP712Name(),
            _EIP712Version(),
            block.chainid,
            address(this),
            bytes32(0),
            new uint256[](0)
        );
    }

    /**
     * @dev The name parameter for the EIP712 domain.
     *
     * NOTE: By default this function reads _name which is an immutable value.
     * It only reads from storage if necessary (in case the value is too large to fit in a ShortString).
     */
    // solhint-disable-next-line func-name-mixedcase
    function _EIP712Name() internal view returns (string memory) {
        return _name.toStringWithFallback(_nameFallback);
    }

    /**
     * @dev The version parameter for the EIP712 domain.
     *
     * NOTE: By default this function reads _version which is an immutable value.
     * It only reads from storage if necessary (in case the value is too large to fit in a ShortString).
     */
    // solhint-disable-next-line func-name-mixedcase
    function _EIP712Version() internal view returns (string memory) {
        return _version.toStringWithFallback(_versionFallback);
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (utils/cryptography/MessageHashUtils.sol)

pragma solidity ^0.8.20;

import {Strings} from "../Strings.sol";

/**
 * @dev Signature message hash utilities for producing digests to be consumed by {ECDSA} recovery or signing.
 *
 * The library provides methods for generating a hash of a message that conforms to the
 * https://eips.ethereum.org/EIPS/eip-191[ERC-191] and https://eips.ethereum.org/EIPS/eip-712[EIP 712]
 * specifications.
 */
library MessageHashUtils {
    /**
     * @dev Returns the keccak256 digest of an ERC-191 signed data with version
     * `0x45` (`personal_sign` messages).
     *
     * The digest is calculated by prefixing a bytes32 `messageHash` with
     * `"\x19Ethereum Signed Message:\n32"` and hashing the result. It corresponds with the
     * hash signed when using the https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sign[`eth_sign`] JSON-RPC method.
     *
     * NOTE: The `messageHash` parameter is intended to be the result of hashing a raw message with
     * keccak256, although any bytes32 value can be safely used because the final digest will
     * be re-hashed.
     *
     * See {ECDSA-recover}.
     */
    function toEthSignedMessageHash(bytes32 messageHash) internal pure returns (bytes32 digest) {
        assembly ("memory-safe") {
            mstore(0x00, "\x19Ethereum Signed Message:\n32") // 32 is the bytes-length of messageHash
            mstore(0x1c, messageHash) // 0x1c (28) is the length of the prefix
            digest := keccak256(0x00, 0x3c) // 0x3c is the length of the prefix (0x1c) + messageHash (0x20)
        }
    }

    /**
     * @dev Returns the keccak256 digest of an ERC-191 signed data with version
     * `0x45` (`personal_sign` messages).
     *
     * The digest is calculated by prefixing an arbitrary `message` with
     * `"\x19Ethereum Signed Message:\n" + len(message)` and hashing the result. It corresponds with the
     * hash signed when using the https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sign[`eth_sign`] JSON-RPC method.
     *
     * See {ECDSA-recover}.
     */
    function toEthSignedMessageHash(bytes memory message) internal pure returns (bytes32) {
        return
            keccak256(bytes.concat("\x19Ethereum Signed Message:\n", bytes(Strings.toString(message.length)), message));
    }

    /**
     * @dev Returns the keccak256 digest of an ERC-191 signed data with version
     * `0x00` (data with intended validator).
     *
     * The digest is calculated by prefixing an arbitrary `data` with `"\x19\x00"` and the intended
     * `validator` address. Then hashing the result.
     *
     * See {ECDSA-recover}.
     */
    function toDataWithIntendedValidatorHash(address validator, bytes memory data) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(hex"19_00", validator, data));
    }

    /**
     * @dev Variant of {toDataWithIntendedValidatorHash-address-bytes} optimized for cases where `data` is a bytes32.
     */
    function toDataWithIntendedValidatorHash(
        address validator,
        bytes32 messageHash
    ) internal pure returns (bytes32 digest) {
        assembly ("memory-safe") {
            mstore(0x00, hex"19_00")
            mstore(0x02, shl(96, validator))
            mstore(0x16, messageHash)
            digest := keccak256(0x00, 0x36)
        }
    }

    /**
     * @dev Returns the keccak256 digest of an EIP-712 typed data (ERC-191 version `0x01`).
     *
     * The digest is calculated from a `domainSeparator` and a `structHash`, by prefixing them with
     * `\x19\x01` and hashing the result. It corresponds to the hash signed by the
     * https://eips.ethereum.org/EIPS/eip-712[`eth_signTypedData`] JSON-RPC method as part of EIP-712.
     *
     * See {ECDSA-recover}.
     */
    function toTypedDataHash(bytes32 domainSeparator, bytes32 structHash) internal pure returns (bytes32 digest) {
        assembly ("memory-safe") {
            let ptr := mload(0x40)
            mstore(ptr, hex"19_01")
            mstore(add(ptr, 0x02), domainSeparator)
            mstore(add(ptr, 0x22), structHash)
            digest := keccak256(ptr, 0x42)
        }
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/cryptography/SignatureChecker.sol)

pragma solidity ^0.8.24;

import {ECDSA} from "./ECDSA.sol";
import {IERC1271} from "../../interfaces/IERC1271.sol";
import {IERC7913SignatureVerifier} from "../../interfaces/IERC7913.sol";
import {Bytes} from "../../utils/Bytes.sol";

/**
 * @dev Signature verification helper that can be used instead of `ECDSA.recover` to seamlessly support:
 *
 * * ECDSA signatures from externally owned accounts (EOAs)
 * * ERC-1271 signatures from smart contract wallets like Argent and Safe Wallet (previously Gnosis Safe)
 * * ERC-7913 signatures from keys that do not have an Ethereum address of their own
 *
 * See https://eips.ethereum.org/EIPS/eip-1271[ERC-1271] and https://eips.ethereum.org/EIPS/eip-7913[ERC-7913].
 */
library SignatureChecker {
    using Bytes for bytes;

    /**
     * @dev Checks if a signature is valid for a given signer and data hash. If the signer has code, the
     * signature is validated against it using ERC-1271, otherwise it's validated using `ECDSA.recover`.
     *
     * NOTE: Unlike ECDSA signatures, contract signatures are revocable, and the outcome of this function can thus
     * change through time. It could return true at block N and false at block N+1 (or the opposite).
     *
     * NOTE: For an extended version of this function that supports ERC-7913 signatures, see {isValidSignatureNow-bytes-bytes32-bytes-}.
     */
    function isValidSignatureNow(address signer, bytes32 hash, bytes memory signature) internal view returns (bool) {
        if (signer.code.length == 0) {
            (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(hash, signature);
            return err == ECDSA.RecoverError.NoError && recovered == signer;
        } else {
            return isValidERC1271SignatureNow(signer, hash, signature);
        }
    }

    /**
     * @dev Checks if a signature is valid for a given signer and data hash. The signature is validated
     * against the signer smart contract using ERC-1271.
     *
     * NOTE: Unlike ECDSA signatures, contract signatures are revocable, and the outcome of this function can thus
     * change through time. It could return true at block N and false at block N+1 (or the opposite).
     */
    function isValidERC1271SignatureNow(
        address signer,
        bytes32 hash,
        bytes memory signature
    ) internal view returns (bool) {
        (bool success, bytes memory result) = signer.staticcall(
            abi.encodeCall(IERC1271.isValidSignature, (hash, signature))
        );
        return (success &&
            result.length >= 32 &&
            abi.decode(result, (bytes32)) == bytes32(IERC1271.isValidSignature.selector));
    }

    /**
     * @dev Verifies a signature for a given ERC-7913 signer and hash.
     *
     * The signer is a `bytes` object that is the concatenation of an address and optionally a key:
     * `verifier || key`. A signer must be at least 20 bytes long.
     *
     * Verification is done as follows:
     *
     * * If `signer.length < 20`: verification fails
     * * If `signer.length == 20`: verification is done using {isValidSignatureNow}
     * * Otherwise: verification is done using {IERC7913SignatureVerifier}
     *
     * NOTE: Unlike ECDSA signatures, contract signatures are revocable, and the outcome of this function can thus
     * change through time. It could return true at block N and false at block N+1 (or the opposite).
     */
    function isValidSignatureNow(
        bytes memory signer,
        bytes32 hash,
        bytes memory signature
    ) internal view returns (bool) {
        if (signer.length < 20) {
            return false;
        } else if (signer.length == 20) {
            return isValidSignatureNow(address(bytes20(signer)), hash, signature);
        } else {
            (bool success, bytes memory result) = address(bytes20(signer)).staticcall(
                abi.encodeCall(IERC7913SignatureVerifier.verify, (signer.slice(20), hash, signature))
            );
            return (success &&
                result.length >= 32 &&
                abi.decode(result, (bytes32)) == bytes32(IERC7913SignatureVerifier.verify.selector));
        }
    }

    /**
     * @dev Verifies multiple ERC-7913 `signatures` for a given `hash` using a set of `signers`.
     * Returns `false` if the number of signers and signatures is not the same.
     *
     * The signers should be ordered by their `keccak256` hash to ensure efficient duplication check. Unordered
     * signers are supported, but the uniqueness check will be more expensive.
     *
     * NOTE: Unlike ECDSA signatures, contract signatures are revocable, and the outcome of this function can thus
     * change through time. It could return true at block N and false at block N+1 (or the opposite).
     */
    function areValidSignaturesNow(
        bytes32 hash,
        bytes[] memory signers,
        bytes[] memory signatures
    ) internal view returns (bool) {
        if (signers.length != signatures.length) return false;

        bytes32 lastId = bytes32(0);

        for (uint256 i = 0; i < signers.length; ++i) {
            bytes memory signer = signers[i];

            // If one of the signatures is invalid, reject the batch
            if (!isValidSignatureNow(signer, hash, signatures[i])) return false;

            bytes32 id = keccak256(signer);
            // If the current signer ID is greater than all previous IDs, then this is a new signer.
            if (lastId < id) {
                lastId = id;
            } else {
                // If this signer id is not greater than all the previous ones, verify that it is not a duplicate of a previous one
                // This loop is never executed if the signers are ordered by id.
                for (uint256 j = 0; j < i; ++j) {
                    if (id == keccak256(signers[j])) return false;
                }
            }
        }

        return true;
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/utils/introspection/ERC165.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/introspection/ERC165.sol)

pragma solidity ^0.8.20;

import {IERC165} from "./IERC165.sol";

/**
 * @dev Implementation of the {IERC165} interface.
 *
 * Contracts that want to implement ERC-165 should inherit from this contract and override {supportsInterface} to check
 * for the additional interface id that will be supported. For example:
 *
 * ```solidity
 * function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
 *     return interfaceId == type(MyInterface).interfaceId || super.supportsInterface(interfaceId);
 * }
 * ```
 */
abstract contract ERC165 is IERC165 {
    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/utils/introspection/IERC165.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/introspection/IERC165.sol)

pragma solidity >=0.4.16;

/**
 * @dev Interface of the ERC-165 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-165[ERC].
 *
 * Implementers can declare support of contract interfaces, which can then be
 * queried by others ({ERC165Checker}).
 *
 * For an implementation, see {ERC165}.
 */
interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[ERC section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/utils/math/Math.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (utils/math/Math.sol)

pragma solidity ^0.8.20;

import {Panic} from "../Panic.sol";
import {SafeCast} from "./SafeCast.sol";

/**
 * @dev Standard math utilities missing in the Solidity language.
 */
library Math {
    enum Rounding {
        Floor, // Toward negative infinity
        Ceil, // Toward positive infinity
        Trunc, // Toward zero
        Expand // Away from zero
    }

    /**
     * @dev Return the 512-bit addition of two uint256.
     *
     * The result is stored in two 256 variables such that sum = high * 2²⁵⁶ + low.
     */
    function add512(uint256 a, uint256 b) internal pure returns (uint256 high, uint256 low) {
        assembly ("memory-safe") {
            low := add(a, b)
            high := lt(low, a)
        }
    }

    /**
     * @dev Return the 512-bit multiplication of two uint256.
     *
     * The result is stored in two 256 variables such that product = high * 2²⁵⁶ + low.
     */
    function mul512(uint256 a, uint256 b) internal pure returns (uint256 high, uint256 low) {
        // 512-bit multiply [high low] = x * y. Compute the product mod 2²⁵⁶ and mod 2²⁵⁶ - 1, then use
        // the Chinese Remainder Theorem to reconstruct the 512 bit result. The result is stored in two 256
        // variables such that product = high * 2²⁵⁶ + low.
        assembly ("memory-safe") {
            let mm := mulmod(a, b, not(0))
            low := mul(a, b)
            high := sub(sub(mm, low), lt(mm, low))
        }
    }

    /**
     * @dev Returns the addition of two unsigned integers, with a success flag (no overflow).
     */
    function tryAdd(uint256 a, uint256 b) internal pure returns (bool success, uint256 result) {
        unchecked {
            uint256 c = a + b;
            success = c >= a;
            result = c * SafeCast.toUint(success);
        }
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, with a success flag (no overflow).
     */
    function trySub(uint256 a, uint256 b) internal pure returns (bool success, uint256 result) {
        unchecked {
            uint256 c = a - b;
            success = c <= a;
            result = c * SafeCast.toUint(success);
        }
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, with a success flag (no overflow).
     */
    function tryMul(uint256 a, uint256 b) internal pure returns (bool success, uint256 result) {
        unchecked {
            uint256 c = a * b;
            assembly ("memory-safe") {
                // Only true when the multiplication doesn't overflow
                // (c / a == b) || (a == 0)
                success := or(eq(div(c, a), b), iszero(a))
            }
            // equivalent to: success ? c : 0
            result = c * SafeCast.toUint(success);
        }
    }

    /**
     * @dev Returns the division of two unsigned integers, with a success flag (no division by zero).
     */
    function tryDiv(uint256 a, uint256 b) internal pure returns (bool success, uint256 result) {
        unchecked {
            success = b > 0;
            assembly ("memory-safe") {
                // The `DIV` opcode returns zero when the denominator is 0.
                result := div(a, b)
            }
        }
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers, with a success flag (no division by zero).
     */
    function tryMod(uint256 a, uint256 b) internal pure returns (bool success, uint256 result) {
        unchecked {
            success = b > 0;
            assembly ("memory-safe") {
                // The `MOD` opcode returns zero when the denominator is 0.
                result := mod(a, b)
            }
        }
    }

    /**
     * @dev Unsigned saturating addition, bounds to `2²⁵⁶ - 1` instead of overflowing.
     */
    function saturatingAdd(uint256 a, uint256 b) internal pure returns (uint256) {
        (bool success, uint256 result) = tryAdd(a, b);
        return ternary(success, result, type(uint256).max);
    }

    /**
     * @dev Unsigned saturating subtraction, bounds to zero instead of overflowing.
     */
    function saturatingSub(uint256 a, uint256 b) internal pure returns (uint256) {
        (, uint256 result) = trySub(a, b);
        return result;
    }

    /**
     * @dev Unsigned saturating multiplication, bounds to `2²⁵⁶ - 1` instead of overflowing.
     */
    function saturatingMul(uint256 a, uint256 b) internal pure returns (uint256) {
        (bool success, uint256 result) = tryMul(a, b);
        return ternary(success, result, type(uint256).max);
    }

    /**
     * @dev Branchless ternary evaluation for `a ? b : c`. Gas costs are constant.
     *
     * IMPORTANT: This function may reduce bytecode size and consume less gas when used standalone.
     * However, the compiler may optimize Solidity ternary operations (i.e. `a ? b : c`) to only compute
     * one branch when needed, making this function more expensive.
     */
    function ternary(bool condition, uint256 a, uint256 b) internal pure returns (uint256) {
        unchecked {
            // branchless ternary works because:
            // b ^ (a ^ b) == a
            // b ^ 0 == b
            return b ^ ((a ^ b) * SafeCast.toUint(condition));
        }
    }

    /**
     * @dev Returns the largest of two numbers.
     */
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return ternary(a > b, a, b);
    }

    /**
     * @dev Returns the smallest of two numbers.
     */
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return ternary(a < b, a, b);
    }

    /**
     * @dev Returns the average of two numbers. The result is rounded towards
     * zero.
     */
    function average(uint256 a, uint256 b) internal pure returns (uint256) {
        // (a + b) / 2 can overflow.
        return (a & b) + (a ^ b) / 2;
    }

    /**
     * @dev Returns the ceiling of the division of two numbers.
     *
     * This differs from standard division with `/` in that it rounds towards infinity instead
     * of rounding towards zero.
     */
    function ceilDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        if (b == 0) {
            // Guarantee the same behavior as in a regular Solidity division.
            Panic.panic(Panic.DIVISION_BY_ZERO);
        }

        // The following calculation ensures accurate ceiling division without overflow.
        // Since a is non-zero, (a - 1) / b will not overflow.
        // The largest possible result occurs when (a - 1) / b is type(uint256).max,
        // but the largest value we can obtain is type(uint256).max - 1, which happens
        // when a = type(uint256).max and b = 1.
        unchecked {
            return SafeCast.toUint(a > 0) * ((a - 1) / b + 1);
        }
    }

    /**
     * @dev Calculates floor(x * y / denominator) with full precision. Throws if result overflows a uint256 or
     * denominator == 0.
     *
     * Original credit to Remco Bloemen under MIT license (https://xn--2-umb.com/21/muldiv) with further edits by
     * Uniswap Labs also under MIT license.
     */
    function mulDiv(uint256 x, uint256 y, uint256 denominator) internal pure returns (uint256 result) {
        unchecked {
            (uint256 high, uint256 low) = mul512(x, y);

            // Handle non-overflow cases, 256 by 256 division.
            if (high == 0) {
                // Solidity will revert if denominator == 0, unlike the div opcode on its own.
                // The surrounding unchecked block does not change this fact.
                // See https://docs.soliditylang.org/en/latest/control-structures.html#checked-or-unchecked-arithmetic.
                return low / denominator;
            }

            // Make sure the result is less than 2²⁵⁶. Also prevents denominator == 0.
            if (denominator <= high) {
                Panic.panic(ternary(denominator == 0, Panic.DIVISION_BY_ZERO, Panic.UNDER_OVERFLOW));
            }

            ///////////////////////////////////////////////
            // 512 by 256 division.
            ///////////////////////////////////////////////

            // Make division exact by subtracting the remainder from [high low].
            uint256 remainder;
            assembly ("memory-safe") {
                // Compute remainder using mulmod.
                remainder := mulmod(x, y, denominator)

                // Subtract 256 bit number from 512 bit number.
                high := sub(high, gt(remainder, low))
                low := sub(low, remainder)
            }

            // Factor powers of two out of denominator and compute largest power of two divisor of denominator.
            // Always >= 1. See https://cs.stackexchange.com/q/138556/92363.

            uint256 twos = denominator & (0 - denominator);
            assembly ("memory-safe") {
                // Divide denominator by twos.
                denominator := div(denominator, twos)

                // Divide [high low] by twos.
                low := div(low, twos)

                // Flip twos such that it is 2²⁵⁶ / twos. If twos is zero, then it becomes one.
                twos := add(div(sub(0, twos), twos), 1)
            }

            // Shift in bits from high into low.
            low |= high * twos;

            // Invert denominator mod 2²⁵⁶. Now that denominator is an odd number, it has an inverse modulo 2²⁵⁶ such
            // that denominator * inv ≡ 1 mod 2²⁵⁶. Compute the inverse by starting with a seed that is correct for
            // four bits. That is, denominator * inv ≡ 1 mod 2⁴.
            uint256 inverse = (3 * denominator) ^ 2;

            // Use the Newton-Raphson iteration to improve the precision. Thanks to Hensel's lifting lemma, this also
            // works in modular arithmetic, doubling the correct bits in each step.
            inverse *= 2 - denominator * inverse; // inverse mod 2⁸
            inverse *= 2 - denominator * inverse; // inverse mod 2¹⁶
            inverse *= 2 - denominator * inverse; // inverse mod 2³²
            inverse *= 2 - denominator * inverse; // inverse mod 2⁶⁴
            inverse *= 2 - denominator * inverse; // inverse mod 2¹²⁸
            inverse *= 2 - denominator * inverse; // inverse mod 2²⁵⁶

            // Because the division is now exact we can divide by multiplying with the modular inverse of denominator.
            // This will give us the correct result modulo 2²⁵⁶. Since the preconditions guarantee that the outcome is
            // less than 2²⁵⁶, this is the final result. We don't need to compute the high bits of the result and high
            // is no longer required.
            result = low * inverse;
            return result;
        }
    }

    /**
     * @dev Calculates x * y / denominator with full precision, following the selected rounding direction.
     */
    function mulDiv(uint256 x, uint256 y, uint256 denominator, Rounding rounding) internal pure returns (uint256) {
        return mulDiv(x, y, denominator) + SafeCast.toUint(unsignedRoundsUp(rounding) && mulmod(x, y, denominator) > 0);
    }

    /**
     * @dev Calculates floor(x * y >> n) with full precision. Throws if result overflows a uint256.
     */
    function mulShr(uint256 x, uint256 y, uint8 n) internal pure returns (uint256 result) {
        unchecked {
            (uint256 high, uint256 low) = mul512(x, y);
            if (high >= 1 << n) {
                Panic.panic(Panic.UNDER_OVERFLOW);
            }
            return (high << (256 - n)) | (low >> n);
        }
    }

    /**
     * @dev Calculates x * y >> n with full precision, following the selected rounding direction.
     */
    function mulShr(uint256 x, uint256 y, uint8 n, Rounding rounding) internal pure returns (uint256) {
        return mulShr(x, y, n) + SafeCast.toUint(unsignedRoundsUp(rounding) && mulmod(x, y, 1 << n) > 0);
    }

    /**
     * @dev Calculate the modular multiplicative inverse of a number in Z/nZ.
     *
     * If n is a prime, then Z/nZ is a field. In that case all elements are inversible, except 0.
     * If n is not a prime, then Z/nZ is not a field, and some elements might not be inversible.
     *
     * If the input value is not inversible, 0 is returned.
     *
     * NOTE: If you know for sure that n is (big) a prime, it may be cheaper to use Fermat's little theorem and get the
     * inverse using `Math.modExp(a, n - 2, n)`. See {invModPrime}.
     */
    function invMod(uint256 a, uint256 n) internal pure returns (uint256) {
        unchecked {
            if (n == 0) return 0;

            // The inverse modulo is calculated using the Extended Euclidean Algorithm (iterative version)
            // Used to compute integers x and y such that: ax + ny = gcd(a, n).
            // When the gcd is 1, then the inverse of a modulo n exists and it's x.
            // ax + ny = 1
            // ax = 1 + (-y)n
            // ax ≡ 1 (mod n) # x is the inverse of a modulo n

            // If the remainder is 0 the gcd is n right away.
            uint256 remainder = a % n;
            uint256 gcd = n;

            // Therefore the initial coefficients are:
            // ax + ny = gcd(a, n) = n
            // 0a + 1n = n
            int256 x = 0;
            int256 y = 1;

            while (remainder != 0) {
                uint256 quotient = gcd / remainder;

                (gcd, remainder) = (
                    // The old remainder is the next gcd to try.
                    remainder,
                    // Compute the next remainder.
                    // Can't overflow given that (a % gcd) * (gcd // (a % gcd)) <= gcd
                    // where gcd is at most n (capped to type(uint256).max)
                    gcd - remainder * quotient
                );

                (x, y) = (
                    // Increment the coefficient of a.
                    y,
                    // Decrement the coefficient of n.
                    // Can overflow, but the result is casted to uint256 so that the
                    // next value of y is "wrapped around" to a value between 0 and n - 1.
                    x - y * int256(quotient)
                );
            }

            if (gcd != 1) return 0; // No inverse exists.
            return ternary(x < 0, n - uint256(-x), uint256(x)); // Wrap the result if it's negative.
        }
    }

    /**
     * @dev Variant of {invMod}. More efficient, but only works if `p` is known to be a prime greater than `2`.
     *
     * From https://en.wikipedia.org/wiki/Fermat%27s_little_theorem[Fermat's little theorem], we know that if p is
     * prime, then `a**(p-1) ≡ 1 mod p`. As a consequence, we have `a * a**(p-2) ≡ 1 mod p`, which means that
     * `a**(p-2)` is the modular multiplicative inverse of a in Fp.
     *
     * NOTE: this function does NOT check that `p` is a prime greater than `2`.
     */
    function invModPrime(uint256 a, uint256 p) internal view returns (uint256) {
        unchecked {
            return Math.modExp(a, p - 2, p);
        }
    }

    /**
     * @dev Returns the modular exponentiation of the specified base, exponent and modulus (b ** e % m)
     *
     * Requirements:
     * - modulus can't be zero
     * - underlying staticcall to precompile must succeed
     *
     * IMPORTANT: The result is only valid if the underlying call succeeds. When using this function, make
     * sure the chain you're using it on supports the precompiled contract for modular exponentiation
     * at address 0x05 as specified in https://eips.ethereum.org/EIPS/eip-198[EIP-198]. Otherwise,
     * the underlying function will succeed given the lack of a revert, but the result may be incorrectly
     * interpreted as 0.
     */
    function modExp(uint256 b, uint256 e, uint256 m) internal view returns (uint256) {
        (bool success, uint256 result) = tryModExp(b, e, m);
        if (!success) {
            Panic.panic(Panic.DIVISION_BY_ZERO);
        }
        return result;
    }

    /**
     * @dev Returns the modular exponentiation of the specified base, exponent and modulus (b ** e % m).
     * It includes a success flag indicating if the operation succeeded. Operation will be marked as failed if trying
     * to operate modulo 0 or if the underlying precompile reverted.
     *
     * IMPORTANT: The result is only valid if the success flag is true. When using this function, make sure the chain
     * you're using it on supports the precompiled contract for modular exponentiation at address 0x05 as specified in
     * https://eips.ethereum.org/EIPS/eip-198[EIP-198]. Otherwise, the underlying function will succeed given the lack
     * of a revert, but the result may be incorrectly interpreted as 0.
     */
    function tryModExp(uint256 b, uint256 e, uint256 m) internal view returns (bool success, uint256 result) {
        if (m == 0) return (false, 0);
        assembly ("memory-safe") {
            let ptr := mload(0x40)
            // | Offset    | Content    | Content (Hex)                                                      |
            // |-----------|------------|--------------------------------------------------------------------|
            // | 0x00:0x1f | size of b  | 0x0000000000000000000000000000000000000000000000000000000000000020 |
            // | 0x20:0x3f | size of e  | 0x0000000000000000000000000000000000000000000000000000000000000020 |
            // | 0x40:0x5f | size of m  | 0x0000000000000000000000000000000000000000000000000000000000000020 |
            // | 0x60:0x7f | value of b | 0x<.............................................................b> |
            // | 0x80:0x9f | value of e | 0x<.............................................................e> |
            // | 0xa0:0xbf | value of m | 0x<.............................................................m> |
            mstore(ptr, 0x20)
            mstore(add(ptr, 0x20), 0x20)
            mstore(add(ptr, 0x40), 0x20)
            mstore(add(ptr, 0x60), b)
            mstore(add(ptr, 0x80), e)
            mstore(add(ptr, 0xa0), m)

            // Given the result < m, it's guaranteed to fit in 32 bytes,
            // so we can use the memory scratch space located at offset 0.
            success := staticcall(gas(), 0x05, ptr, 0xc0, 0x00, 0x20)
            result := mload(0x00)
        }
    }

    /**
     * @dev Variant of {modExp} that supports inputs of arbitrary length.
     */
    function modExp(bytes memory b, bytes memory e, bytes memory m) internal view returns (bytes memory) {
        (bool success, bytes memory result) = tryModExp(b, e, m);
        if (!success) {
            Panic.panic(Panic.DIVISION_BY_ZERO);
        }
        return result;
    }

    /**
     * @dev Variant of {tryModExp} that supports inputs of arbitrary length.
     */
    function tryModExp(
        bytes memory b,
        bytes memory e,
        bytes memory m
    ) internal view returns (bool success, bytes memory result) {
        if (_zeroBytes(m)) return (false, new bytes(0));

        uint256 mLen = m.length;

        // Encode call args in result and move the free memory pointer
        result = abi.encodePacked(b.length, e.length, mLen, b, e, m);

        assembly ("memory-safe") {
            let dataPtr := add(result, 0x20)
            // Write result on top of args to avoid allocating extra memory.
            success := staticcall(gas(), 0x05, dataPtr, mload(result), dataPtr, mLen)
            // Overwrite the length.
            // result.length > returndatasize() is guaranteed because returndatasize() == m.length
            mstore(result, mLen)
            // Set the memory pointer after the returned data.
            mstore(0x40, add(dataPtr, mLen))
        }
    }

    /**
     * @dev Returns whether the provided byte array is zero.
     */
    function _zeroBytes(bytes memory byteArray) private pure returns (bool) {
        for (uint256 i = 0; i < byteArray.length; ++i) {
            if (byteArray[i] != 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * @dev Returns the square root of a number. If the number is not a perfect square, the value is rounded
     * towards zero.
     *
     * This method is based on Newton's method for computing square roots; the algorithm is restricted to only
     * using integer operations.
     */
    function sqrt(uint256 a) internal pure returns (uint256) {
        unchecked {
            // Take care of easy edge cases when a == 0 or a == 1
            if (a <= 1) {
                return a;
            }

            // In this function, we use Newton's method to get a root of `f(x) := x² - a`. It involves building a
            // sequence x_n that converges toward sqrt(a). For each iteration x_n, we also define the error between
            // the current value as `ε_n = | x_n - sqrt(a) |`.
            //
            // For our first estimation, we consider `e` the smallest power of 2 which is bigger than the square root
            // of the target. (i.e. `2**(e-1) ≤ sqrt(a) < 2**e`). We know that `e ≤ 128` because `(2¹²⁸)² = 2²⁵⁶` is
            // bigger than any uint256.
            //
            // By noticing that
            // `2**(e-1) ≤ sqrt(a) < 2**e → (2**(e-1))² ≤ a < (2**e)² → 2**(2*e-2) ≤ a < 2**(2*e)`
            // we can deduce that `e - 1` is `log2(a) / 2`. We can thus compute `x_n = 2**(e-1)` using a method similar
            // to the msb function.
            uint256 aa = a;
            uint256 xn = 1;

            if (aa >= (1 << 128)) {
                aa >>= 128;
                xn <<= 64;
            }
            if (aa >= (1 << 64)) {
                aa >>= 64;
                xn <<= 32;
            }
            if (aa >= (1 << 32)) {
                aa >>= 32;
                xn <<= 16;
            }
            if (aa >= (1 << 16)) {
                aa >>= 16;
                xn <<= 8;
            }
            if (aa >= (1 << 8)) {
                aa >>= 8;
                xn <<= 4;
            }
            if (aa >= (1 << 4)) {
                aa >>= 4;
                xn <<= 2;
            }
            if (aa >= (1 << 2)) {
                xn <<= 1;
            }

            // We now have x_n such that `x_n = 2**(e-1) ≤ sqrt(a) < 2**e = 2 * x_n`. This implies ε_n ≤ 2**(e-1).
            //
            // We can refine our estimation by noticing that the middle of that interval minimizes the error.
            // If we move x_n to equal 2**(e-1) + 2**(e-2), then we reduce the error to ε_n ≤ 2**(e-2).
            // This is going to be our x_0 (and ε_0)
            xn = (3 * xn) >> 1; // ε_0 := | x_0 - sqrt(a) | ≤ 2**(e-2)

            // From here, Newton's method give us:
            // x_{n+1} = (x_n + a / x_n) / 2
            //
            // One should note that:
            // x_{n+1}² - a = ((x_n + a / x_n) / 2)² - a
            //              = ((x_n² + a) / (2 * x_n))² - a
            //              = (x_n⁴ + 2 * a * x_n² + a²) / (4 * x_n²) - a
            //              = (x_n⁴ + 2 * a * x_n² + a² - 4 * a * x_n²) / (4 * x_n²)
            //              = (x_n⁴ - 2 * a * x_n² + a²) / (4 * x_n²)
            //              = (x_n² - a)² / (2 * x_n)²
            //              = ((x_n² - a) / (2 * x_n))²
            //              ≥ 0
            // Which proves that for all n ≥ 1, sqrt(a) ≤ x_n
            //
            // This gives us the proof of quadratic convergence of the sequence:
            // ε_{n+1} = | x_{n+1} - sqrt(a) |
            //         = | (x_n + a / x_n) / 2 - sqrt(a) |
            //         = | (x_n² + a - 2*x_n*sqrt(a)) / (2 * x_n) |
            //         = | (x_n - sqrt(a))² / (2 * x_n) |
            //         = | ε_n² / (2 * x_n) |
            //         = ε_n² / | (2 * x_n) |
            //
            // For the first iteration, we have a special case where x_0 is known:
            // ε_1 = ε_0² / | (2 * x_0) |
            //     ≤ (2**(e-2))² / (2 * (2**(e-1) + 2**(e-2)))
            //     ≤ 2**(2*e-4) / (3 * 2**(e-1))
            //     ≤ 2**(e-3) / 3
            //     ≤ 2**(e-3-log2(3))
            //     ≤ 2**(e-4.5)
            //
            // For the following iterations, we use the fact that, 2**(e-1) ≤ sqrt(a) ≤ x_n:
            // ε_{n+1} = ε_n² / | (2 * x_n) |
            //         ≤ (2**(e-k))² / (2 * 2**(e-1))
            //         ≤ 2**(2*e-2*k) / 2**e
            //         ≤ 2**(e-2*k)
            xn = (xn + a / xn) >> 1; // ε_1 := | x_1 - sqrt(a) | ≤ 2**(e-4.5)  -- special case, see above
            xn = (xn + a / xn) >> 1; // ε_2 := | x_2 - sqrt(a) | ≤ 2**(e-9)    -- general case with k = 4.5
            xn = (xn + a / xn) >> 1; // ε_3 := | x_3 - sqrt(a) | ≤ 2**(e-18)   -- general case with k = 9
            xn = (xn + a / xn) >> 1; // ε_4 := | x_4 - sqrt(a) | ≤ 2**(e-36)   -- general case with k = 18
            xn = (xn + a / xn) >> 1; // ε_5 := | x_5 - sqrt(a) | ≤ 2**(e-72)   -- general case with k = 36
            xn = (xn + a / xn) >> 1; // ε_6 := | x_6 - sqrt(a) | ≤ 2**(e-144)  -- general case with k = 72

            // Because e ≤ 128 (as discussed during the first estimation phase), we know have reached a precision
            // ε_6 ≤ 2**(e-144) < 1. Given we're operating on integers, then we can ensure that xn is now either
            // sqrt(a) or sqrt(a) + 1.
            return xn - SafeCast.toUint(xn > a / xn);
        }
    }

    /**
     * @dev Calculates sqrt(a), following the selected rounding direction.
     */
    function sqrt(uint256 a, Rounding rounding) internal pure returns (uint256) {
        unchecked {
            uint256 result = sqrt(a);
            return result + SafeCast.toUint(unsignedRoundsUp(rounding) && result * result < a);
        }
    }

    /**
     * @dev Return the log in base 2 of a positive value rounded towards zero.
     * Returns 0 if given 0.
     */
    function log2(uint256 x) internal pure returns (uint256 r) {
        // If value has upper 128 bits set, log2 result is at least 128
        r = SafeCast.toUint(x > 0xffffffffffffffffffffffffffffffff) << 7;
        // If upper 64 bits of 128-bit half set, add 64 to result
        r |= SafeCast.toUint((x >> r) > 0xffffffffffffffff) << 6;
        // If upper 32 bits of 64-bit half set, add 32 to result
        r |= SafeCast.toUint((x >> r) > 0xffffffff) << 5;
        // If upper 16 bits of 32-bit half set, add 16 to result
        r |= SafeCast.toUint((x >> r) > 0xffff) << 4;
        // If upper 8 bits of 16-bit half set, add 8 to result
        r |= SafeCast.toUint((x >> r) > 0xff) << 3;
        // If upper 4 bits of 8-bit half set, add 4 to result
        r |= SafeCast.toUint((x >> r) > 0xf) << 2;

        // Shifts value right by the current result and use it as an index into this lookup table:
        //
        // | x (4 bits) |  index  | table[index] = MSB position |
        // |------------|---------|-----------------------------|
        // |    0000    |    0    |        table[0] = 0         |
        // |    0001    |    1    |        table[1] = 0         |
        // |    0010    |    2    |        table[2] = 1         |
        // |    0011    |    3    |        table[3] = 1         |
        // |    0100    |    4    |        table[4] = 2         |
        // |    0101    |    5    |        table[5] = 2         |
        // |    0110    |    6    |        table[6] = 2         |
        // |    0111    |    7    |        table[7] = 2         |
        // |    1000    |    8    |        table[8] = 3         |
        // |    1001    |    9    |        table[9] = 3         |
        // |    1010    |   10    |        table[10] = 3        |
        // |    1011    |   11    |        table[11] = 3        |
        // |    1100    |   12    |        table[12] = 3        |
        // |    1101    |   13    |        table[13] = 3        |
        // |    1110    |   14    |        table[14] = 3        |
        // |    1111    |   15    |        table[15] = 3        |
        //
        // The lookup table is represented as a 32-byte value with the MSB positions for 0-15 in the last 16 bytes.
        assembly ("memory-safe") {
            r := or(r, byte(shr(r, x), 0x0000010102020202030303030303030300000000000000000000000000000000))
        }
    }

    /**
     * @dev Return the log in base 2, following the selected rounding direction, of a positive value.
     * Returns 0 if given 0.
     */
    function log2(uint256 value, Rounding rounding) internal pure returns (uint256) {
        unchecked {
            uint256 result = log2(value);
            return result + SafeCast.toUint(unsignedRoundsUp(rounding) && 1 << result < value);
        }
    }

    /**
     * @dev Return the log in base 10 of a positive value rounded towards zero.
     * Returns 0 if given 0.
     */
    function log10(uint256 value) internal pure returns (uint256) {
        uint256 result = 0;
        unchecked {
            if (value >= 10 ** 64) {
                value /= 10 ** 64;
                result += 64;
            }
            if (value >= 10 ** 32) {
                value /= 10 ** 32;
                result += 32;
            }
            if (value >= 10 ** 16) {
                value /= 10 ** 16;
                result += 16;
            }
            if (value >= 10 ** 8) {
                value /= 10 ** 8;
                result += 8;
            }
            if (value >= 10 ** 4) {
                value /= 10 ** 4;
                result += 4;
            }
            if (value >= 10 ** 2) {
                value /= 10 ** 2;
                result += 2;
            }
            if (value >= 10 ** 1) {
                result += 1;
            }
        }
        return result;
    }

    /**
     * @dev Return the log in base 10, following the selected rounding direction, of a positive value.
     * Returns 0 if given 0.
     */
    function log10(uint256 value, Rounding rounding) internal pure returns (uint256) {
        unchecked {
            uint256 result = log10(value);
            return result + SafeCast.toUint(unsignedRoundsUp(rounding) && 10 ** result < value);
        }
    }

    /**
     * @dev Return the log in base 256 of a positive value rounded towards zero.
     * Returns 0 if given 0.
     *
     * Adding one to the result gives the number of pairs of hex symbols needed to represent `value` as a hex string.
     */
    function log256(uint256 x) internal pure returns (uint256 r) {
        // If value has upper 128 bits set, log2 result is at least 128
        r = SafeCast.toUint(x > 0xffffffffffffffffffffffffffffffff) << 7;
        // If upper 64 bits of 128-bit half set, add 64 to result
        r |= SafeCast.toUint((x >> r) > 0xffffffffffffffff) << 6;
        // If upper 32 bits of 64-bit half set, add 32 to result
        r |= SafeCast.toUint((x >> r) > 0xffffffff) << 5;
        // If upper 16 bits of 32-bit half set, add 16 to result
        r |= SafeCast.toUint((x >> r) > 0xffff) << 4;
        // Add 1 if upper 8 bits of 16-bit half set, and divide accumulated result by 8
        return (r >> 3) | SafeCast.toUint((x >> r) > 0xff);
    }

    /**
     * @dev Return the log in base 256, following the selected rounding direction, of a positive value.
     * Returns 0 if given 0.
     */
    function log256(uint256 value, Rounding rounding) internal pure returns (uint256) {
        unchecked {
            uint256 result = log256(value);
            return result + SafeCast.toUint(unsignedRoundsUp(rounding) && 1 << (result << 3) < value);
        }
    }

    /**
     * @dev Returns whether a provided rounding mode is considered rounding up for unsigned integers.
     */
    function unsignedRoundsUp(Rounding rounding) internal pure returns (bool) {
        return uint8(rounding) % 2 == 1;
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/utils/math/SafeCast.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/math/SafeCast.sol)
// This file was procedurally generated from scripts/generate/templates/SafeCast.js.

pragma solidity ^0.8.20;

/**
 * @dev Wrappers over Solidity's uintXX/intXX/bool casting operators with added overflow
 * checks.
 *
 * Downcasting from uint256/int256 in Solidity does not revert on overflow. This can
 * easily result in undesired exploitation or bugs, since developers usually
 * assume that overflows raise errors. `SafeCast` restores this intuition by
 * reverting the transaction when such an operation overflows.
 *
 * Using this library instead of the unchecked operations eliminates an entire
 * class of bugs, so it's recommended to use it always.
 */
library SafeCast {
    /**
     * @dev Value doesn't fit in an uint of `bits` size.
     */
    error SafeCastOverflowedUintDowncast(uint8 bits, uint256 value);

    /**
     * @dev An int value doesn't fit in an uint of `bits` size.
     */
    error SafeCastOverflowedIntToUint(int256 value);

    /**
     * @dev Value doesn't fit in an int of `bits` size.
     */
    error SafeCastOverflowedIntDowncast(uint8 bits, int256 value);

    /**
     * @dev An uint value doesn't fit in an int of `bits` size.
     */
    error SafeCastOverflowedUintToInt(uint256 value);

    /**
     * @dev Returns the downcasted uint248 from uint256, reverting on
     * overflow (when the input is greater than largest uint248).
     *
     * Counterpart to Solidity's `uint248` operator.
     *
     * Requirements:
     *
     * - input must fit into 248 bits
     */
    function toUint248(uint256 value) internal pure returns (uint248) {
        if (value > type(uint248).max) {
            revert SafeCastOverflowedUintDowncast(248, value);
        }
        return uint248(value);
    }

    /**
     * @dev Returns the downcasted uint240 from uint256, reverting on
     * overflow (when the input is greater than largest uint240).
     *
     * Counterpart to Solidity's `uint240` operator.
     *
     * Requirements:
     *
     * - input must fit into 240 bits
     */
    function toUint240(uint256 value) internal pure returns (uint240) {
        if (value > type(uint240).max) {
            revert SafeCastOverflowedUintDowncast(240, value);
        }
        return uint240(value);
    }

    /**
     * @dev Returns the downcasted uint232 from uint256, reverting on
     * overflow (when the input is greater than largest uint232).
     *
     * Counterpart to Solidity's `uint232` operator.
     *
     * Requirements:
     *
     * - input must fit into 232 bits
     */
    function toUint232(uint256 value) internal pure returns (uint232) {
        if (value > type(uint232).max) {
            revert SafeCastOverflowedUintDowncast(232, value);
        }
        return uint232(value);
    }

    /**
     * @dev Returns the downcasted uint224 from uint256, reverting on
     * overflow (when the input is greater than largest uint224).
     *
     * Counterpart to Solidity's `uint224` operator.
     *
     * Requirements:
     *
     * - input must fit into 224 bits
     */
    function toUint224(uint256 value) internal pure returns (uint224) {
        if (value > type(uint224).max) {
            revert SafeCastOverflowedUintDowncast(224, value);
        }
        return uint224(value);
    }

    /**
     * @dev Returns the downcasted uint216 from uint256, reverting on
     * overflow (when the input is greater than largest uint216).
     *
     * Counterpart to Solidity's `uint216` operator.
     *
     * Requirements:
     *
     * - input must fit into 216 bits
     */
    function toUint216(uint256 value) internal pure returns (uint216) {
        if (value > type(uint216).max) {
            revert SafeCastOverflowedUintDowncast(216, value);
        }
        return uint216(value);
    }

    /**
     * @dev Returns the downcasted uint208 from uint256, reverting on
     * overflow (when the input is greater than largest uint208).
     *
     * Counterpart to Solidity's `uint208` operator.
     *
     * Requirements:
     *
     * - input must fit into 208 bits
     */
    function toUint208(uint256 value) internal pure returns (uint208) {
        if (value > type(uint208).max) {
            revert SafeCastOverflowedUintDowncast(208, value);
        }
        return uint208(value);
    }

    /**
     * @dev Returns the downcasted uint200 from uint256, reverting on
     * overflow (when the input is greater than largest uint200).
     *
     * Counterpart to Solidity's `uint200` operator.
     *
     * Requirements:
     *
     * - input must fit into 200 bits
     */
    function toUint200(uint256 value) internal pure returns (uint200) {
        if (value > type(uint200).max) {
            revert SafeCastOverflowedUintDowncast(200, value);
        }
        return uint200(value);
    }

    /**
     * @dev Returns the downcasted uint192 from uint256, reverting on
     * overflow (when the input is greater than largest uint192).
     *
     * Counterpart to Solidity's `uint192` operator.
     *
     * Requirements:
     *
     * - input must fit into 192 bits
     */
    function toUint192(uint256 value) internal pure returns (uint192) {
        if (value > type(uint192).max) {
            revert SafeCastOverflowedUintDowncast(192, value);
        }
        return uint192(value);
    }

    /**
     * @dev Returns the downcasted uint184 from uint256, reverting on
     * overflow (when the input is greater than largest uint184).
     *
     * Counterpart to Solidity's `uint184` operator.
     *
     * Requirements:
     *
     * - input must fit into 184 bits
     */
    function toUint184(uint256 value) internal pure returns (uint184) {
        if (value > type(uint184).max) {
            revert SafeCastOverflowedUintDowncast(184, value);
        }
        return uint184(value);
    }

    /**
     * @dev Returns the downcasted uint176 from uint256, reverting on
     * overflow (when the input is greater than largest uint176).
     *
     * Counterpart to Solidity's `uint176` operator.
     *
     * Requirements:
     *
     * - input must fit into 176 bits
     */
    function toUint176(uint256 value) internal pure returns (uint176) {
        if (value > type(uint176).max) {
            revert SafeCastOverflowedUintDowncast(176, value);
        }
        return uint176(value);
    }

    /**
     * @dev Returns the downcasted uint168 from uint256, reverting on
     * overflow (when the input is greater than largest uint168).
     *
     * Counterpart to Solidity's `uint168` operator.
     *
     * Requirements:
     *
     * - input must fit into 168 bits
     */
    function toUint168(uint256 value) internal pure returns (uint168) {
        if (value > type(uint168).max) {
            revert SafeCastOverflowedUintDowncast(168, value);
        }
        return uint168(value);
    }

    /**
     * @dev Returns the downcasted uint160 from uint256, reverting on
     * overflow (when the input is greater than largest uint160).
     *
     * Counterpart to Solidity's `uint160` operator.
     *
     * Requirements:
     *
     * - input must fit into 160 bits
     */
    function toUint160(uint256 value) internal pure returns (uint160) {
        if (value > type(uint160).max) {
            revert SafeCastOverflowedUintDowncast(160, value);
        }
        return uint160(value);
    }

    /**
     * @dev Returns the downcasted uint152 from uint256, reverting on
     * overflow (when the input is greater than largest uint152).
     *
     * Counterpart to Solidity's `uint152` operator.
     *
     * Requirements:
     *
     * - input must fit into 152 bits
     */
    function toUint152(uint256 value) internal pure returns (uint152) {
        if (value > type(uint152).max) {
            revert SafeCastOverflowedUintDowncast(152, value);
        }
        return uint152(value);
    }

    /**
     * @dev Returns the downcasted uint144 from uint256, reverting on
     * overflow (when the input is greater than largest uint144).
     *
     * Counterpart to Solidity's `uint144` operator.
     *
     * Requirements:
     *
     * - input must fit into 144 bits
     */
    function toUint144(uint256 value) internal pure returns (uint144) {
        if (value > type(uint144).max) {
            revert SafeCastOverflowedUintDowncast(144, value);
        }
        return uint144(value);
    }

    /**
     * @dev Returns the downcasted uint136 from uint256, reverting on
     * overflow (when the input is greater than largest uint136).
     *
     * Counterpart to Solidity's `uint136` operator.
     *
     * Requirements:
     *
     * - input must fit into 136 bits
     */
    function toUint136(uint256 value) internal pure returns (uint136) {
        if (value > type(uint136).max) {
            revert SafeCastOverflowedUintDowncast(136, value);
        }
        return uint136(value);
    }

    /**
     * @dev Returns the downcasted uint128 from uint256, reverting on
     * overflow (when the input is greater than largest uint128).
     *
     * Counterpart to Solidity's `uint128` operator.
     *
     * Requirements:
     *
     * - input must fit into 128 bits
     */
    function toUint128(uint256 value) internal pure returns (uint128) {
        if (value > type(uint128).max) {
            revert SafeCastOverflowedUintDowncast(128, value);
        }
        return uint128(value);
    }

    /**
     * @dev Returns the downcasted uint120 from uint256, reverting on
     * overflow (when the input is greater than largest uint120).
     *
     * Counterpart to Solidity's `uint120` operator.
     *
     * Requirements:
     *
     * - input must fit into 120 bits
     */
    function toUint120(uint256 value) internal pure returns (uint120) {
        if (value > type(uint120).max) {
            revert SafeCastOverflowedUintDowncast(120, value);
        }
        return uint120(value);
    }

    /**
     * @dev Returns the downcasted uint112 from uint256, reverting on
     * overflow (when the input is greater than largest uint112).
     *
     * Counterpart to Solidity's `uint112` operator.
     *
     * Requirements:
     *
     * - input must fit into 112 bits
     */
    function toUint112(uint256 value) internal pure returns (uint112) {
        if (value > type(uint112).max) {
            revert SafeCastOverflowedUintDowncast(112, value);
        }
        return uint112(value);
    }

    /**
     * @dev Returns the downcasted uint104 from uint256, reverting on
     * overflow (when the input is greater than largest uint104).
     *
     * Counterpart to Solidity's `uint104` operator.
     *
     * Requirements:
     *
     * - input must fit into 104 bits
     */
    function toUint104(uint256 value) internal pure returns (uint104) {
        if (value > type(uint104).max) {
            revert SafeCastOverflowedUintDowncast(104, value);
        }
        return uint104(value);
    }

    /**
     * @dev Returns the downcasted uint96 from uint256, reverting on
     * overflow (when the input is greater than largest uint96).
     *
     * Counterpart to Solidity's `uint96` operator.
     *
     * Requirements:
     *
     * - input must fit into 96 bits
     */
    function toUint96(uint256 value) internal pure returns (uint96) {
        if (value > type(uint96).max) {
            revert SafeCastOverflowedUintDowncast(96, value);
        }
        return uint96(value);
    }

    /**
     * @dev Returns the downcasted uint88 from uint256, reverting on
     * overflow (when the input is greater than largest uint88).
     *
     * Counterpart to Solidity's `uint88` operator.
     *
     * Requirements:
     *
     * - input must fit into 88 bits
     */
    function toUint88(uint256 value) internal pure returns (uint88) {
        if (value > type(uint88).max) {
            revert SafeCastOverflowedUintDowncast(88, value);
        }
        return uint88(value);
    }

    /**
     * @dev Returns the downcasted uint80 from uint256, reverting on
     * overflow (when the input is greater than largest uint80).
     *
     * Counterpart to Solidity's `uint80` operator.
     *
     * Requirements:
     *
     * - input must fit into 80 bits
     */
    function toUint80(uint256 value) internal pure returns (uint80) {
        if (value > type(uint80).max) {
            revert SafeCastOverflowedUintDowncast(80, value);
        }
        return uint80(value);
    }

    /**
     * @dev Returns the downcasted uint72 from uint256, reverting on
     * overflow (when the input is greater than largest uint72).
     *
     * Counterpart to Solidity's `uint72` operator.
     *
     * Requirements:
     *
     * - input must fit into 72 bits
     */
    function toUint72(uint256 value) internal pure returns (uint72) {
        if (value > type(uint72).max) {
            revert SafeCastOverflowedUintDowncast(72, value);
        }
        return uint72(value);
    }

    /**
     * @dev Returns the downcasted uint64 from uint256, reverting on
     * overflow (when the input is greater than largest uint64).
     *
     * Counterpart to Solidity's `uint64` operator.
     *
     * Requirements:
     *
     * - input must fit into 64 bits
     */
    function toUint64(uint256 value) internal pure returns (uint64) {
        if (value > type(uint64).max) {
            revert SafeCastOverflowedUintDowncast(64, value);
        }
        return uint64(value);
    }

    /**
     * @dev Returns the downcasted uint56 from uint256, reverting on
     * overflow (when the input is greater than largest uint56).
     *
     * Counterpart to Solidity's `uint56` operator.
     *
     * Requirements:
     *
     * - input must fit into 56 bits
     */
    function toUint56(uint256 value) internal pure returns (uint56) {
        if (value > type(uint56).max) {
            revert SafeCastOverflowedUintDowncast(56, value);
        }
        return uint56(value);
    }

    /**
     * @dev Returns the downcasted uint48 from uint256, reverting on
     * overflow (when the input is greater than largest uint48).
     *
     * Counterpart to Solidity's `uint48` operator.
     *
     * Requirements:
     *
     * - input must fit into 48 bits
     */
    function toUint48(uint256 value) internal pure returns (uint48) {
        if (value > type(uint48).max) {
            revert SafeCastOverflowedUintDowncast(48, value);
        }
        return uint48(value);
    }

    /**
     * @dev Returns the downcasted uint40 from uint256, reverting on
     * overflow (when the input is greater than largest uint40).
     *
     * Counterpart to Solidity's `uint40` operator.
     *
     * Requirements:
     *
     * - input must fit into 40 bits
     */
    function toUint40(uint256 value) internal pure returns (uint40) {
        if (value > type(uint40).max) {
            revert SafeCastOverflowedUintDowncast(40, value);
        }
        return uint40(value);
    }

    /**
     * @dev Returns the downcasted uint32 from uint256, reverting on
     * overflow (when the input is greater than largest uint32).
     *
     * Counterpart to Solidity's `uint32` operator.
     *
     * Requirements:
     *
     * - input must fit into 32 bits
     */
    function toUint32(uint256 value) internal pure returns (uint32) {
        if (value > type(uint32).max) {
            revert SafeCastOverflowedUintDowncast(32, value);
        }
        return uint32(value);
    }

    /**
     * @dev Returns the downcasted uint24 from uint256, reverting on
     * overflow (when the input is greater than largest uint24).
     *
     * Counterpart to Solidity's `uint24` operator.
     *
     * Requirements:
     *
     * - input must fit into 24 bits
     */
    function toUint24(uint256 value) internal pure returns (uint24) {
        if (value > type(uint24).max) {
            revert SafeCastOverflowedUintDowncast(24, value);
        }
        return uint24(value);
    }

    /**
     * @dev Returns the downcasted uint16 from uint256, reverting on
     * overflow (when the input is greater than largest uint16).
     *
     * Counterpart to Solidity's `uint16` operator.
     *
     * Requirements:
     *
     * - input must fit into 16 bits
     */
    function toUint16(uint256 value) internal pure returns (uint16) {
        if (value > type(uint16).max) {
            revert SafeCastOverflowedUintDowncast(16, value);
        }
        return uint16(value);
    }

    /**
     * @dev Returns the downcasted uint8 from uint256, reverting on
     * overflow (when the input is greater than largest uint8).
     *
     * Counterpart to Solidity's `uint8` operator.
     *
     * Requirements:
     *
     * - input must fit into 8 bits
     */
    function toUint8(uint256 value) internal pure returns (uint8) {
        if (value > type(uint8).max) {
            revert SafeCastOverflowedUintDowncast(8, value);
        }
        return uint8(value);
    }

    /**
     * @dev Converts a signed int256 into an unsigned uint256.
     *
     * Requirements:
     *
     * - input must be greater than or equal to 0.
     */
    function toUint256(int256 value) internal pure returns (uint256) {
        if (value < 0) {
            revert SafeCastOverflowedIntToUint(value);
        }
        return uint256(value);
    }

    /**
     * @dev Returns the downcasted int248 from int256, reverting on
     * overflow (when the input is less than smallest int248 or
     * greater than largest int248).
     *
     * Counterpart to Solidity's `int248` operator.
     *
     * Requirements:
     *
     * - input must fit into 248 bits
     */
    function toInt248(int256 value) internal pure returns (int248 downcasted) {
        downcasted = int248(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(248, value);
        }
    }

    /**
     * @dev Returns the downcasted int240 from int256, reverting on
     * overflow (when the input is less than smallest int240 or
     * greater than largest int240).
     *
     * Counterpart to Solidity's `int240` operator.
     *
     * Requirements:
     *
     * - input must fit into 240 bits
     */
    function toInt240(int256 value) internal pure returns (int240 downcasted) {
        downcasted = int240(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(240, value);
        }
    }

    /**
     * @dev Returns the downcasted int232 from int256, reverting on
     * overflow (when the input is less than smallest int232 or
     * greater than largest int232).
     *
     * Counterpart to Solidity's `int232` operator.
     *
     * Requirements:
     *
     * - input must fit into 232 bits
     */
    function toInt232(int256 value) internal pure returns (int232 downcasted) {
        downcasted = int232(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(232, value);
        }
    }

    /**
     * @dev Returns the downcasted int224 from int256, reverting on
     * overflow (when the input is less than smallest int224 or
     * greater than largest int224).
     *
     * Counterpart to Solidity's `int224` operator.
     *
     * Requirements:
     *
     * - input must fit into 224 bits
     */
    function toInt224(int256 value) internal pure returns (int224 downcasted) {
        downcasted = int224(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(224, value);
        }
    }

    /**
     * @dev Returns the downcasted int216 from int256, reverting on
     * overflow (when the input is less than smallest int216 or
     * greater than largest int216).
     *
     * Counterpart to Solidity's `int216` operator.
     *
     * Requirements:
     *
     * - input must fit into 216 bits
     */
    function toInt216(int256 value) internal pure returns (int216 downcasted) {
        downcasted = int216(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(216, value);
        }
    }

    /**
     * @dev Returns the downcasted int208 from int256, reverting on
     * overflow (when the input is less than smallest int208 or
     * greater than largest int208).
     *
     * Counterpart to Solidity's `int208` operator.
     *
     * Requirements:
     *
     * - input must fit into 208 bits
     */
    function toInt208(int256 value) internal pure returns (int208 downcasted) {
        downcasted = int208(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(208, value);
        }
    }

    /**
     * @dev Returns the downcasted int200 from int256, reverting on
     * overflow (when the input is less than smallest int200 or
     * greater than largest int200).
     *
     * Counterpart to Solidity's `int200` operator.
     *
     * Requirements:
     *
     * - input must fit into 200 bits
     */
    function toInt200(int256 value) internal pure returns (int200 downcasted) {
        downcasted = int200(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(200, value);
        }
    }

    /**
     * @dev Returns the downcasted int192 from int256, reverting on
     * overflow (when the input is less than smallest int192 or
     * greater than largest int192).
     *
     * Counterpart to Solidity's `int192` operator.
     *
     * Requirements:
     *
     * - input must fit into 192 bits
     */
    function toInt192(int256 value) internal pure returns (int192 downcasted) {
        downcasted = int192(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(192, value);
        }
    }

    /**
     * @dev Returns the downcasted int184 from int256, reverting on
     * overflow (when the input is less than smallest int184 or
     * greater than largest int184).
     *
     * Counterpart to Solidity's `int184` operator.
     *
     * Requirements:
     *
     * - input must fit into 184 bits
     */
    function toInt184(int256 value) internal pure returns (int184 downcasted) {
        downcasted = int184(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(184, value);
        }
    }

    /**
     * @dev Returns the downcasted int176 from int256, reverting on
     * overflow (when the input is less than smallest int176 or
     * greater than largest int176).
     *
     * Counterpart to Solidity's `int176` operator.
     *
     * Requirements:
     *
     * - input must fit into 176 bits
     */
    function toInt176(int256 value) internal pure returns (int176 downcasted) {
        downcasted = int176(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(176, value);
        }
    }

    /**
     * @dev Returns the downcasted int168 from int256, reverting on
     * overflow (when the input is less than smallest int168 or
     * greater than largest int168).
     *
     * Counterpart to Solidity's `int168` operator.
     *
     * Requirements:
     *
     * - input must fit into 168 bits
     */
    function toInt168(int256 value) internal pure returns (int168 downcasted) {
        downcasted = int168(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(168, value);
        }
    }

    /**
     * @dev Returns the downcasted int160 from int256, reverting on
     * overflow (when the input is less than smallest int160 or
     * greater than largest int160).
     *
     * Counterpart to Solidity's `int160` operator.
     *
     * Requirements:
     *
     * - input must fit into 160 bits
     */
    function toInt160(int256 value) internal pure returns (int160 downcasted) {
        downcasted = int160(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(160, value);
        }
    }

    /**
     * @dev Returns the downcasted int152 from int256, reverting on
     * overflow (when the input is less than smallest int152 or
     * greater than largest int152).
     *
     * Counterpart to Solidity's `int152` operator.
     *
     * Requirements:
     *
     * - input must fit into 152 bits
     */
    function toInt152(int256 value) internal pure returns (int152 downcasted) {
        downcasted = int152(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(152, value);
        }
    }

    /**
     * @dev Returns the downcasted int144 from int256, reverting on
     * overflow (when the input is less than smallest int144 or
     * greater than largest int144).
     *
     * Counterpart to Solidity's `int144` operator.
     *
     * Requirements:
     *
     * - input must fit into 144 bits
     */
    function toInt144(int256 value) internal pure returns (int144 downcasted) {
        downcasted = int144(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(144, value);
        }
    }

    /**
     * @dev Returns the downcasted int136 from int256, reverting on
     * overflow (when the input is less than smallest int136 or
     * greater than largest int136).
     *
     * Counterpart to Solidity's `int136` operator.
     *
     * Requirements:
     *
     * - input must fit into 136 bits
     */
    function toInt136(int256 value) internal pure returns (int136 downcasted) {
        downcasted = int136(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(136, value);
        }
    }

    /**
     * @dev Returns the downcasted int128 from int256, reverting on
     * overflow (when the input is less than smallest int128 or
     * greater than largest int128).
     *
     * Counterpart to Solidity's `int128` operator.
     *
     * Requirements:
     *
     * - input must fit into 128 bits
     */
    function toInt128(int256 value) internal pure returns (int128 downcasted) {
        downcasted = int128(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(128, value);
        }
    }

    /**
     * @dev Returns the downcasted int120 from int256, reverting on
     * overflow (when the input is less than smallest int120 or
     * greater than largest int120).
     *
     * Counterpart to Solidity's `int120` operator.
     *
     * Requirements:
     *
     * - input must fit into 120 bits
     */
    function toInt120(int256 value) internal pure returns (int120 downcasted) {
        downcasted = int120(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(120, value);
        }
    }

    /**
     * @dev Returns the downcasted int112 from int256, reverting on
     * overflow (when the input is less than smallest int112 or
     * greater than largest int112).
     *
     * Counterpart to Solidity's `int112` operator.
     *
     * Requirements:
     *
     * - input must fit into 112 bits
     */
    function toInt112(int256 value) internal pure returns (int112 downcasted) {
        downcasted = int112(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(112, value);
        }
    }

    /**
     * @dev Returns the downcasted int104 from int256, reverting on
     * overflow (when the input is less than smallest int104 or
     * greater than largest int104).
     *
     * Counterpart to Solidity's `int104` operator.
     *
     * Requirements:
     *
     * - input must fit into 104 bits
     */
    function toInt104(int256 value) internal pure returns (int104 downcasted) {
        downcasted = int104(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(104, value);
        }
    }

    /**
     * @dev Returns the downcasted int96 from int256, reverting on
     * overflow (when the input is less than smallest int96 or
     * greater than largest int96).
     *
     * Counterpart to Solidity's `int96` operator.
     *
     * Requirements:
     *
     * - input must fit into 96 bits
     */
    function toInt96(int256 value) internal pure returns (int96 downcasted) {
        downcasted = int96(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(96, value);
        }
    }

    /**
     * @dev Returns the downcasted int88 from int256, reverting on
     * overflow (when the input is less than smallest int88 or
     * greater than largest int88).
     *
     * Counterpart to Solidity's `int88` operator.
     *
     * Requirements:
     *
     * - input must fit into 88 bits
     */
    function toInt88(int256 value) internal pure returns (int88 downcasted) {
        downcasted = int88(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(88, value);
        }
    }

    /**
     * @dev Returns the downcasted int80 from int256, reverting on
     * overflow (when the input is less than smallest int80 or
     * greater than largest int80).
     *
     * Counterpart to Solidity's `int80` operator.
     *
     * Requirements:
     *
     * - input must fit into 80 bits
     */
    function toInt80(int256 value) internal pure returns (int80 downcasted) {
        downcasted = int80(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(80, value);
        }
    }

    /**
     * @dev Returns the downcasted int72 from int256, reverting on
     * overflow (when the input is less than smallest int72 or
     * greater than largest int72).
     *
     * Counterpart to Solidity's `int72` operator.
     *
     * Requirements:
     *
     * - input must fit into 72 bits
     */
    function toInt72(int256 value) internal pure returns (int72 downcasted) {
        downcasted = int72(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(72, value);
        }
    }

    /**
     * @dev Returns the downcasted int64 from int256, reverting on
     * overflow (when the input is less than smallest int64 or
     * greater than largest int64).
     *
     * Counterpart to Solidity's `int64` operator.
     *
     * Requirements:
     *
     * - input must fit into 64 bits
     */
    function toInt64(int256 value) internal pure returns (int64 downcasted) {
        downcasted = int64(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(64, value);
        }
    }

    /**
     * @dev Returns the downcasted int56 from int256, reverting on
     * overflow (when the input is less than smallest int56 or
     * greater than largest int56).
     *
     * Counterpart to Solidity's `int56` operator.
     *
     * Requirements:
     *
     * - input must fit into 56 bits
     */
    function toInt56(int256 value) internal pure returns (int56 downcasted) {
        downcasted = int56(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(56, value);
        }
    }

    /**
     * @dev Returns the downcasted int48 from int256, reverting on
     * overflow (when the input is less than smallest int48 or
     * greater than largest int48).
     *
     * Counterpart to Solidity's `int48` operator.
     *
     * Requirements:
     *
     * - input must fit into 48 bits
     */
    function toInt48(int256 value) internal pure returns (int48 downcasted) {
        downcasted = int48(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(48, value);
        }
    }

    /**
     * @dev Returns the downcasted int40 from int256, reverting on
     * overflow (when the input is less than smallest int40 or
     * greater than largest int40).
     *
     * Counterpart to Solidity's `int40` operator.
     *
     * Requirements:
     *
     * - input must fit into 40 bits
     */
    function toInt40(int256 value) internal pure returns (int40 downcasted) {
        downcasted = int40(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(40, value);
        }
    }

    /**
     * @dev Returns the downcasted int32 from int256, reverting on
     * overflow (when the input is less than smallest int32 or
     * greater than largest int32).
     *
     * Counterpart to Solidity's `int32` operator.
     *
     * Requirements:
     *
     * - input must fit into 32 bits
     */
    function toInt32(int256 value) internal pure returns (int32 downcasted) {
        downcasted = int32(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(32, value);
        }
    }

    /**
     * @dev Returns the downcasted int24 from int256, reverting on
     * overflow (when the input is less than smallest int24 or
     * greater than largest int24).
     *
     * Counterpart to Solidity's `int24` operator.
     *
     * Requirements:
     *
     * - input must fit into 24 bits
     */
    function toInt24(int256 value) internal pure returns (int24 downcasted) {
        downcasted = int24(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(24, value);
        }
    }

    /**
     * @dev Returns the downcasted int16 from int256, reverting on
     * overflow (when the input is less than smallest int16 or
     * greater than largest int16).
     *
     * Counterpart to Solidity's `int16` operator.
     *
     * Requirements:
     *
     * - input must fit into 16 bits
     */
    function toInt16(int256 value) internal pure returns (int16 downcasted) {
        downcasted = int16(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(16, value);
        }
    }

    /**
     * @dev Returns the downcasted int8 from int256, reverting on
     * overflow (when the input is less than smallest int8 or
     * greater than largest int8).
     *
     * Counterpart to Solidity's `int8` operator.
     *
     * Requirements:
     *
     * - input must fit into 8 bits
     */
    function toInt8(int256 value) internal pure returns (int8 downcasted) {
        downcasted = int8(value);
        if (downcasted != value) {
            revert SafeCastOverflowedIntDowncast(8, value);
        }
    }

    /**
     * @dev Converts an unsigned uint256 into a signed int256.
     *
     * Requirements:
     *
     * - input must be less than or equal to maxInt256.
     */
    function toInt256(uint256 value) internal pure returns (int256) {
        // Note: Unsafe cast below is okay because `type(int256).max` is guaranteed to be positive
        if (value > uint256(type(int256).max)) {
            revert SafeCastOverflowedUintToInt(value);
        }
        return int256(value);
    }

    /**
     * @dev Cast a boolean (false or true) to a uint256 (0 or 1) with no jump.
     */
    function toUint(bool b) internal pure returns (uint256 u) {
        assembly ("memory-safe") {
            u := iszero(iszero(b))
        }
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/utils/math/SignedMath.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/math/SignedMath.sol)

pragma solidity ^0.8.20;

import {SafeCast} from "./SafeCast.sol";

/**
 * @dev Standard signed math utilities missing in the Solidity language.
 */
library SignedMath {
    /**
     * @dev Branchless ternary evaluation for `a ? b : c`. Gas costs are constant.
     *
     * IMPORTANT: This function may reduce bytecode size and consume less gas when used standalone.
     * However, the compiler may optimize Solidity ternary operations (i.e. `a ? b : c`) to only compute
     * one branch when needed, making this function more expensive.
     */
    function ternary(bool condition, int256 a, int256 b) internal pure returns (int256) {
        unchecked {
            // branchless ternary works because:
            // b ^ (a ^ b) == a
            // b ^ 0 == b
            return b ^ ((a ^ b) * int256(SafeCast.toUint(condition)));
        }
    }

    /**
     * @dev Returns the largest of two signed numbers.
     */
    function max(int256 a, int256 b) internal pure returns (int256) {
        return ternary(a > b, a, b);
    }

    /**
     * @dev Returns the smallest of two signed numbers.
     */
    function min(int256 a, int256 b) internal pure returns (int256) {
        return ternary(a < b, a, b);
    }

    /**
     * @dev Returns the average of two signed numbers without overflow.
     * The result is rounded towards zero.
     */
    function average(int256 a, int256 b) internal pure returns (int256) {
        // Formula from the book "Hacker's Delight"
        int256 x = (a & b) + ((a ^ b) >> 1);
        return x + (int256(uint256(x) >> 255) & (a ^ b));
    }

    /**
     * @dev Returns the absolute unsigned value of a signed value.
     */
    function abs(int256 n) internal pure returns (uint256) {
        unchecked {
            // Formula from the "Bit Twiddling Hacks" by Sean Eron Anderson.
            // Since `n` is a signed integer, the generated bytecode will use the SAR opcode to perform the right shift,
            // taking advantage of the most significant (or "sign" bit) in two's complement representation.
            // This opcode adds new most significant bits set to the value of the previous most significant bit. As a result,
            // the mask will either be `bytes32(0)` (if n is positive) or `~bytes32(0)` (if n is negative).
            int256 mask = n >> 255;

            // A `bytes32(0)` mask leaves the input unchanged, while a `~bytes32(0)` mask complements it.
            return uint256((n + mask) ^ mask);
        }
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/utils/structs/Checkpoints.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/structs/Checkpoints.sol)
// This file was procedurally generated from scripts/generate/templates/Checkpoints.js.

pragma solidity ^0.8.20;

import {Math} from "../math/Math.sol";

/**
 * @dev This library defines the `Trace*` struct, for checkpointing values as they change at different points in
 * time, and later looking up past values by block number. See {Votes} as an example.
 *
 * To create a history of checkpoints define a variable type `Checkpoints.Trace*` in your contract, and store a new
 * checkpoint for the current transaction block using the {push} function.
 */
library Checkpoints {
    /**
     * @dev A value was attempted to be inserted on a past checkpoint.
     */
    error CheckpointUnorderedInsertion();

    struct Trace224 {
        Checkpoint224[] _checkpoints;
    }

    struct Checkpoint224 {
        uint32 _key;
        uint224 _value;
    }

    /**
     * @dev Pushes a (`key`, `value`) pair into a Trace224 so that it is stored as the checkpoint.
     *
     * Returns previous value and new value.
     *
     * IMPORTANT: Never accept `key` as a user input, since an arbitrary `type(uint32).max` key set will disable the
     * library.
     */
    function push(
        Trace224 storage self,
        uint32 key,
        uint224 value
    ) internal returns (uint224 oldValue, uint224 newValue) {
        return _insert(self._checkpoints, key, value);
    }

    /**
     * @dev Returns the value in the first (oldest) checkpoint with key greater or equal than the search key, or zero if
     * there is none.
     */
    function lowerLookup(Trace224 storage self, uint32 key) internal view returns (uint224) {
        uint256 len = self._checkpoints.length;
        uint256 pos = _lowerBinaryLookup(self._checkpoints, key, 0, len);
        return pos == len ? 0 : _unsafeAccess(self._checkpoints, pos)._value;
    }

    /**
     * @dev Returns the value in the last (most recent) checkpoint with key lower or equal than the search key, or zero
     * if there is none.
     */
    function upperLookup(Trace224 storage self, uint32 key) internal view returns (uint224) {
        uint256 len = self._checkpoints.length;
        uint256 pos = _upperBinaryLookup(self._checkpoints, key, 0, len);
        return pos == 0 ? 0 : _unsafeAccess(self._checkpoints, pos - 1)._value;
    }

    /**
     * @dev Returns the value in the last (most recent) checkpoint with key lower or equal than the search key, or zero
     * if there is none.
     *
     * NOTE: This is a variant of {upperLookup} that is optimized to find "recent" checkpoint (checkpoints with high
     * keys).
     */
    function upperLookupRecent(Trace224 storage self, uint32 key) internal view returns (uint224) {
        uint256 len = self._checkpoints.length;

        uint256 low = 0;
        uint256 high = len;

        if (len > 5) {
            uint256 mid = len - Math.sqrt(len);
            if (key < _unsafeAccess(self._checkpoints, mid)._key) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }

        uint256 pos = _upperBinaryLookup(self._checkpoints, key, low, high);

        return pos == 0 ? 0 : _unsafeAccess(self._checkpoints, pos - 1)._value;
    }

    /**
     * @dev Returns the value in the most recent checkpoint, or zero if there are no checkpoints.
     */
    function latest(Trace224 storage self) internal view returns (uint224) {
        uint256 pos = self._checkpoints.length;
        return pos == 0 ? 0 : _unsafeAccess(self._checkpoints, pos - 1)._value;
    }

    /**
     * @dev Returns whether there is a checkpoint in the structure (i.e. it is not empty), and if so the key and value
     * in the most recent checkpoint.
     */
    function latestCheckpoint(Trace224 storage self) internal view returns (bool exists, uint32 _key, uint224 _value) {
        uint256 pos = self._checkpoints.length;
        if (pos == 0) {
            return (false, 0, 0);
        } else {
            Checkpoint224 storage ckpt = _unsafeAccess(self._checkpoints, pos - 1);
            return (true, ckpt._key, ckpt._value);
        }
    }

    /**
     * @dev Returns the number of checkpoints.
     */
    function length(Trace224 storage self) internal view returns (uint256) {
        return self._checkpoints.length;
    }

    /**
     * @dev Returns checkpoint at given position.
     */
    function at(Trace224 storage self, uint32 pos) internal view returns (Checkpoint224 memory) {
        return self._checkpoints[pos];
    }

    /**
     * @dev Pushes a (`key`, `value`) pair into an ordered list of checkpoints, either by inserting a new checkpoint,
     * or by updating the last one.
     */
    function _insert(
        Checkpoint224[] storage self,
        uint32 key,
        uint224 value
    ) private returns (uint224 oldValue, uint224 newValue) {
        uint256 pos = self.length;

        if (pos > 0) {
            Checkpoint224 storage last = _unsafeAccess(self, pos - 1);
            uint32 lastKey = last._key;
            uint224 lastValue = last._value;

            // Checkpoint keys must be non-decreasing.
            if (lastKey > key) {
                revert CheckpointUnorderedInsertion();
            }

            // Update or push new checkpoint
            if (lastKey == key) {
                last._value = value;
            } else {
                self.push(Checkpoint224({_key: key, _value: value}));
            }
            return (lastValue, value);
        } else {
            self.push(Checkpoint224({_key: key, _value: value}));
            return (0, value);
        }
    }

    /**
     * @dev Return the index of the first (oldest) checkpoint with key strictly bigger than the search key, or `high`
     * if there is none. `low` and `high` define a section where to do the search, with inclusive `low` and exclusive
     * `high`.
     *
     * WARNING: `high` should not be greater than the array's length.
     */
    function _upperBinaryLookup(
        Checkpoint224[] storage self,
        uint32 key,
        uint256 low,
        uint256 high
    ) private view returns (uint256) {
        while (low < high) {
            uint256 mid = Math.average(low, high);
            if (_unsafeAccess(self, mid)._key > key) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }
        return high;
    }

    /**
     * @dev Return the index of the first (oldest) checkpoint with key greater or equal than the search key, or `high`
     * if there is none. `low` and `high` define a section where to do the search, with inclusive `low` and exclusive
     * `high`.
     *
     * WARNING: `high` should not be greater than the array's length.
     */
    function _lowerBinaryLookup(
        Checkpoint224[] storage self,
        uint32 key,
        uint256 low,
        uint256 high
    ) private view returns (uint256) {
        while (low < high) {
            uint256 mid = Math.average(low, high);
            if (_unsafeAccess(self, mid)._key < key) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        return high;
    }

    /**
     * @dev Access an element of the array without performing bounds check. The position is assumed to be within bounds.
     */
    function _unsafeAccess(
        Checkpoint224[] storage self,
        uint256 pos
    ) private pure returns (Checkpoint224 storage result) {
        assembly {
            mstore(0, self.slot)
            result.slot := add(keccak256(0, 0x20), pos)
        }
    }

    struct Trace208 {
        Checkpoint208[] _checkpoints;
    }

    struct Checkpoint208 {
        uint48 _key;
        uint208 _value;
    }

    /**
     * @dev Pushes a (`key`, `value`) pair into a Trace208 so that it is stored as the checkpoint.
     *
     * Returns previous value and new value.
     *
     * IMPORTANT: Never accept `key` as a user input, since an arbitrary `type(uint48).max` key set will disable the
     * library.
     */
    function push(
        Trace208 storage self,
        uint48 key,
        uint208 value
    ) internal returns (uint208 oldValue, uint208 newValue) {
        return _insert(self._checkpoints, key, value);
    }

    /**
     * @dev Returns the value in the first (oldest) checkpoint with key greater or equal than the search key, or zero if
     * there is none.
     */
    function lowerLookup(Trace208 storage self, uint48 key) internal view returns (uint208) {
        uint256 len = self._checkpoints.length;
        uint256 pos = _lowerBinaryLookup(self._checkpoints, key, 0, len);
        return pos == len ? 0 : _unsafeAccess(self._checkpoints, pos)._value;
    }

    /**
     * @dev Returns the value in the last (most recent) checkpoint with key lower or equal than the search key, or zero
     * if there is none.
     */
    function upperLookup(Trace208 storage self, uint48 key) internal view returns (uint208) {
        uint256 len = self._checkpoints.length;
        uint256 pos = _upperBinaryLookup(self._checkpoints, key, 0, len);
        return pos == 0 ? 0 : _unsafeAccess(self._checkpoints, pos - 1)._value;
    }

    /**
     * @dev Returns the value in the last (most recent) checkpoint with key lower or equal than the search key, or zero
     * if there is none.
     *
     * NOTE: This is a variant of {upperLookup} that is optimized to find "recent" checkpoint (checkpoints with high
     * keys).
     */
    function upperLookupRecent(Trace208 storage self, uint48 key) internal view returns (uint208) {
        uint256 len = self._checkpoints.length;

        uint256 low = 0;
        uint256 high = len;

        if (len > 5) {
            uint256 mid = len - Math.sqrt(len);
            if (key < _unsafeAccess(self._checkpoints, mid)._key) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }

        uint256 pos = _upperBinaryLookup(self._checkpoints, key, low, high);

        return pos == 0 ? 0 : _unsafeAccess(self._checkpoints, pos - 1)._value;
    }

    /**
     * @dev Returns the value in the most recent checkpoint, or zero if there are no checkpoints.
     */
    function latest(Trace208 storage self) internal view returns (uint208) {
        uint256 pos = self._checkpoints.length;
        return pos == 0 ? 0 : _unsafeAccess(self._checkpoints, pos - 1)._value;
    }

    /**
     * @dev Returns whether there is a checkpoint in the structure (i.e. it is not empty), and if so the key and value
     * in the most recent checkpoint.
     */
    function latestCheckpoint(Trace208 storage self) internal view returns (bool exists, uint48 _key, uint208 _value) {
        uint256 pos = self._checkpoints.length;
        if (pos == 0) {
            return (false, 0, 0);
        } else {
            Checkpoint208 storage ckpt = _unsafeAccess(self._checkpoints, pos - 1);
            return (true, ckpt._key, ckpt._value);
        }
    }

    /**
     * @dev Returns the number of checkpoints.
     */
    function length(Trace208 storage self) internal view returns (uint256) {
        return self._checkpoints.length;
    }

    /**
     * @dev Returns checkpoint at given position.
     */
    function at(Trace208 storage self, uint32 pos) internal view returns (Checkpoint208 memory) {
        return self._checkpoints[pos];
    }

    /**
     * @dev Pushes a (`key`, `value`) pair into an ordered list of checkpoints, either by inserting a new checkpoint,
     * or by updating the last one.
     */
    function _insert(
        Checkpoint208[] storage self,
        uint48 key,
        uint208 value
    ) private returns (uint208 oldValue, uint208 newValue) {
        uint256 pos = self.length;

        if (pos > 0) {
            Checkpoint208 storage last = _unsafeAccess(self, pos - 1);
            uint48 lastKey = last._key;
            uint208 lastValue = last._value;

            // Checkpoint keys must be non-decreasing.
            if (lastKey > key) {
                revert CheckpointUnorderedInsertion();
            }

            // Update or push new checkpoint
            if (lastKey == key) {
                last._value = value;
            } else {
                self.push(Checkpoint208({_key: key, _value: value}));
            }
            return (lastValue, value);
        } else {
            self.push(Checkpoint208({_key: key, _value: value}));
            return (0, value);
        }
    }

    /**
     * @dev Return the index of the first (oldest) checkpoint with key strictly bigger than the search key, or `high`
     * if there is none. `low` and `high` define a section where to do the search, with inclusive `low` and exclusive
     * `high`.
     *
     * WARNING: `high` should not be greater than the array's length.
     */
    function _upperBinaryLookup(
        Checkpoint208[] storage self,
        uint48 key,
        uint256 low,
        uint256 high
    ) private view returns (uint256) {
        while (low < high) {
            uint256 mid = Math.average(low, high);
            if (_unsafeAccess(self, mid)._key > key) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }
        return high;
    }

    /**
     * @dev Return the index of the first (oldest) checkpoint with key greater or equal than the search key, or `high`
     * if there is none. `low` and `high` define a section where to do the search, with inclusive `low` and exclusive
     * `high`.
     *
     * WARNING: `high` should not be greater than the array's length.
     */
    function _lowerBinaryLookup(
        Checkpoint208[] storage self,
        uint48 key,
        uint256 low,
        uint256 high
    ) private view returns (uint256) {
        while (low < high) {
            uint256 mid = Math.average(low, high);
            if (_unsafeAccess(self, mid)._key < key) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        return high;
    }

    /**
     * @dev Access an element of the array without performing bounds check. The position is assumed to be within bounds.
     */
    function _unsafeAccess(
        Checkpoint208[] storage self,
        uint256 pos
    ) private pure returns (Checkpoint208 storage result) {
        assembly {
            mstore(0, self.slot)
            result.slot := add(keccak256(0, 0x20), pos)
        }
    }

    struct Trace160 {
        Checkpoint160[] _checkpoints;
    }

    struct Checkpoint160 {
        uint96 _key;
        uint160 _value;
    }

    /**
     * @dev Pushes a (`key`, `value`) pair into a Trace160 so that it is stored as the checkpoint.
     *
     * Returns previous value and new value.
     *
     * IMPORTANT: Never accept `key` as a user input, since an arbitrary `type(uint96).max` key set will disable the
     * library.
     */
    function push(
        Trace160 storage self,
        uint96 key,
        uint160 value
    ) internal returns (uint160 oldValue, uint160 newValue) {
        return _insert(self._checkpoints, key, value);
    }

    /**
     * @dev Returns the value in the first (oldest) checkpoint with key greater or equal than the search key, or zero if
     * there is none.
     */
    function lowerLookup(Trace160 storage self, uint96 key) internal view returns (uint160) {
        uint256 len = self._checkpoints.length;
        uint256 pos = _lowerBinaryLookup(self._checkpoints, key, 0, len);
        return pos == len ? 0 : _unsafeAccess(self._checkpoints, pos)._value;
    }

    /**
     * @dev Returns the value in the last (most recent) checkpoint with key lower or equal than the search key, or zero
     * if there is none.
     */
    function upperLookup(Trace160 storage self, uint96 key) internal view returns (uint160) {
        uint256 len = self._checkpoints.length;
        uint256 pos = _upperBinaryLookup(self._checkpoints, key, 0, len);
        return pos == 0 ? 0 : _unsafeAccess(self._checkpoints, pos - 1)._value;
    }

    /**
     * @dev Returns the value in the last (most recent) checkpoint with key lower or equal than the search key, or zero
     * if there is none.
     *
     * NOTE: This is a variant of {upperLookup} that is optimized to find "recent" checkpoint (checkpoints with high
     * keys).
     */
    function upperLookupRecent(Trace160 storage self, uint96 key) internal view returns (uint160) {
        uint256 len = self._checkpoints.length;

        uint256 low = 0;
        uint256 high = len;

        if (len > 5) {
            uint256 mid = len - Math.sqrt(len);
            if (key < _unsafeAccess(self._checkpoints, mid)._key) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }

        uint256 pos = _upperBinaryLookup(self._checkpoints, key, low, high);

        return pos == 0 ? 0 : _unsafeAccess(self._checkpoints, pos - 1)._value;
    }

    /**
     * @dev Returns the value in the most recent checkpoint, or zero if there are no checkpoints.
     */
    function latest(Trace160 storage self) internal view returns (uint160) {
        uint256 pos = self._checkpoints.length;
        return pos == 0 ? 0 : _unsafeAccess(self._checkpoints, pos - 1)._value;
    }

    /**
     * @dev Returns whether there is a checkpoint in the structure (i.e. it is not empty), and if so the key and value
     * in the most recent checkpoint.
     */
    function latestCheckpoint(Trace160 storage self) internal view returns (bool exists, uint96 _key, uint160 _value) {
        uint256 pos = self._checkpoints.length;
        if (pos == 0) {
            return (false, 0, 0);
        } else {
            Checkpoint160 storage ckpt = _unsafeAccess(self._checkpoints, pos - 1);
            return (true, ckpt._key, ckpt._value);
        }
    }

    /**
     * @dev Returns the number of checkpoints.
     */
    function length(Trace160 storage self) internal view returns (uint256) {
        return self._checkpoints.length;
    }

    /**
     * @dev Returns checkpoint at given position.
     */
    function at(Trace160 storage self, uint32 pos) internal view returns (Checkpoint160 memory) {
        return self._checkpoints[pos];
    }

    /**
     * @dev Pushes a (`key`, `value`) pair into an ordered list of checkpoints, either by inserting a new checkpoint,
     * or by updating the last one.
     */
    function _insert(
        Checkpoint160[] storage self,
        uint96 key,
        uint160 value
    ) private returns (uint160 oldValue, uint160 newValue) {
        uint256 pos = self.length;

        if (pos > 0) {
            Checkpoint160 storage last = _unsafeAccess(self, pos - 1);
            uint96 lastKey = last._key;
            uint160 lastValue = last._value;

            // Checkpoint keys must be non-decreasing.
            if (lastKey > key) {
                revert CheckpointUnorderedInsertion();
            }

            // Update or push new checkpoint
            if (lastKey == key) {
                last._value = value;
            } else {
                self.push(Checkpoint160({_key: key, _value: value}));
            }
            return (lastValue, value);
        } else {
            self.push(Checkpoint160({_key: key, _value: value}));
            return (0, value);
        }
    }

    /**
     * @dev Return the index of the first (oldest) checkpoint with key strictly bigger than the search key, or `high`
     * if there is none. `low` and `high` define a section where to do the search, with inclusive `low` and exclusive
     * `high`.
     *
     * WARNING: `high` should not be greater than the array's length.
     */
    function _upperBinaryLookup(
        Checkpoint160[] storage self,
        uint96 key,
        uint256 low,
        uint256 high
    ) private view returns (uint256) {
        while (low < high) {
            uint256 mid = Math.average(low, high);
            if (_unsafeAccess(self, mid)._key > key) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }
        return high;
    }

    /**
     * @dev Return the index of the first (oldest) checkpoint with key greater or equal than the search key, or `high`
     * if there is none. `low` and `high` define a section where to do the search, with inclusive `low` and exclusive
     * `high`.
     *
     * WARNING: `high` should not be greater than the array's length.
     */
    function _lowerBinaryLookup(
        Checkpoint160[] storage self,
        uint96 key,
        uint256 low,
        uint256 high
    ) private view returns (uint256) {
        while (low < high) {
            uint256 mid = Math.average(low, high);
            if (_unsafeAccess(self, mid)._key < key) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        return high;
    }

    /**
     * @dev Access an element of the array without performing bounds check. The position is assumed to be within bounds.
     */
    function _unsafeAccess(
        Checkpoint160[] storage self,
        uint256 pos
    ) private pure returns (Checkpoint160 storage result) {
        assembly {
            mstore(0, self.slot)
            result.slot := add(keccak256(0, 0x20), pos)
        }
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/utils/structs/DoubleEndedQueue.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/structs/DoubleEndedQueue.sol)
pragma solidity ^0.8.20;

import {Panic} from "../Panic.sol";

/**
 * @dev A sequence of items with the ability to efficiently push and pop items (i.e. insert and remove) on both ends of
 * the sequence (called front and back). Among other access patterns, it can be used to implement efficient LIFO and
 * FIFO queues. Storage use is optimized, and all operations are O(1) constant time. This includes {clear}, given that
 * the existing queue contents are left in storage.
 *
 * The struct is called `Bytes32Deque`. Other types can be cast to and from `bytes32`. This data structure can only be
 * used in storage, and not in memory.
 * ```solidity
 * DoubleEndedQueue.Bytes32Deque queue;
 * ```
 */
library DoubleEndedQueue {
    /**
     * @dev Indices are 128 bits so begin and end are packed in a single storage slot for efficient access.
     *
     * Struct members have an underscore prefix indicating that they are "private" and should not be read or written to
     * directly. Use the functions provided below instead. Modifying the struct manually may violate assumptions and
     * lead to unexpected behavior.
     *
     * The first item is at data[begin] and the last item is at data[end - 1]. This range can wrap around.
     */
    struct Bytes32Deque {
        uint128 _begin;
        uint128 _end;
        mapping(uint128 index => bytes32) _data;
    }

    /**
     * @dev Inserts an item at the end of the queue.
     *
     * Reverts with {Panic-RESOURCE_ERROR} if the queue is full.
     */
    function pushBack(Bytes32Deque storage deque, bytes32 value) internal {
        unchecked {
            uint128 backIndex = deque._end;
            if (backIndex + 1 == deque._begin) Panic.panic(Panic.RESOURCE_ERROR);
            deque._data[backIndex] = value;
            deque._end = backIndex + 1;
        }
    }

    /**
     * @dev Removes the item at the end of the queue and returns it.
     *
     * Reverts with {Panic-EMPTY_ARRAY_POP} if the queue is empty.
     */
    function popBack(Bytes32Deque storage deque) internal returns (bytes32 value) {
        unchecked {
            uint128 backIndex = deque._end;
            if (backIndex == deque._begin) Panic.panic(Panic.EMPTY_ARRAY_POP);
            --backIndex;
            value = deque._data[backIndex];
            delete deque._data[backIndex];
            deque._end = backIndex;
        }
    }

    /**
     * @dev Inserts an item at the beginning of the queue.
     *
     * Reverts with {Panic-RESOURCE_ERROR} if the queue is full.
     */
    function pushFront(Bytes32Deque storage deque, bytes32 value) internal {
        unchecked {
            uint128 frontIndex = deque._begin - 1;
            if (frontIndex == deque._end) Panic.panic(Panic.RESOURCE_ERROR);
            deque._data[frontIndex] = value;
            deque._begin = frontIndex;
        }
    }

    /**
     * @dev Removes the item at the beginning of the queue and returns it.
     *
     * Reverts with {Panic-EMPTY_ARRAY_POP} if the queue is empty.
     */
    function popFront(Bytes32Deque storage deque) internal returns (bytes32 value) {
        unchecked {
            uint128 frontIndex = deque._begin;
            if (frontIndex == deque._end) Panic.panic(Panic.EMPTY_ARRAY_POP);
            value = deque._data[frontIndex];
            delete deque._data[frontIndex];
            deque._begin = frontIndex + 1;
        }
    }

    /**
     * @dev Returns the item at the beginning of the queue.
     *
     * Reverts with {Panic-ARRAY_OUT_OF_BOUNDS} if the queue is empty.
     */
    function front(Bytes32Deque storage deque) internal view returns (bytes32 value) {
        if (empty(deque)) Panic.panic(Panic.ARRAY_OUT_OF_BOUNDS);
        return deque._data[deque._begin];
    }

    /**
     * @dev Returns the item at the end of the queue.
     *
     * Reverts with {Panic-ARRAY_OUT_OF_BOUNDS} if the queue is empty.
     */
    function back(Bytes32Deque storage deque) internal view returns (bytes32 value) {
        if (empty(deque)) Panic.panic(Panic.ARRAY_OUT_OF_BOUNDS);
        unchecked {
            return deque._data[deque._end - 1];
        }
    }

    /**
     * @dev Return the item at a position in the queue given by `index`, with the first item at 0 and last item at
     * `length(deque) - 1`.
     *
     * Reverts with {Panic-ARRAY_OUT_OF_BOUNDS} if the index is out of bounds.
     */
    function at(Bytes32Deque storage deque, uint256 index) internal view returns (bytes32 value) {
        if (index >= length(deque)) Panic.panic(Panic.ARRAY_OUT_OF_BOUNDS);
        // By construction, length is a uint128, so the check above ensures that index can be safely downcast to uint128
        unchecked {
            return deque._data[deque._begin + uint128(index)];
        }
    }

    /**
     * @dev Resets the queue back to being empty.
     *
     * NOTE: The current items are left behind in storage. This does not affect the functioning of the queue, but misses
     * out on potential gas refunds.
     */
    function clear(Bytes32Deque storage deque) internal {
        deque._begin = 0;
        deque._end = 0;
    }

    /**
     * @dev Returns the number of items in the queue.
     */
    function length(Bytes32Deque storage deque) internal view returns (uint256) {
        unchecked {
            return uint256(deque._end - deque._begin);
        }
    }

    /**
     * @dev Returns true if the queue is empty.
     */
    function empty(Bytes32Deque storage deque) internal view returns (bool) {
        return deque._end == deque._begin;
    }
}

```

### `contracts/.deps/npm/@openzeppelin/contracts/utils/types/Time.sol`
```sol
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/types/Time.sol)

pragma solidity ^0.8.20;

import {Math} from "../math/Math.sol";
import {SafeCast} from "../math/SafeCast.sol";

/**
 * @dev This library provides helpers for manipulating time-related objects.
 *
 * It uses the following types:
 * - `uint48` for timepoints
 * - `uint32` for durations
 *
 * While the library doesn't provide specific types for timepoints and duration, it does provide:
 * - a `Delay` type to represent duration that can be programmed to change value automatically at a given point
 * - additional helper functions
 */
library Time {
    using Time for *;

    /**
     * @dev Get the block timestamp as a Timepoint.
     */
    function timestamp() internal view returns (uint48) {
        return SafeCast.toUint48(block.timestamp);
    }

    /**
     * @dev Get the block number as a Timepoint.
     */
    function blockNumber() internal view returns (uint48) {
        return SafeCast.toUint48(block.number);
    }

    // ==================================================== Delay =====================================================
    /**
     * @dev A `Delay` is a uint32 duration that can be programmed to change value automatically at a given point in the
     * future. The "effect" timepoint describes when the transitions happens from the "old" value to the "new" value.
     * This allows updating the delay applied to some operation while keeping some guarantees.
     *
     * In particular, the {update} function guarantees that if the delay is reduced, the old delay still applies for
     * some time. For example if the delay is currently 7 days to do an upgrade, the admin should not be able to set
     * the delay to 0 and upgrade immediately. If the admin wants to reduce the delay, the old delay (7 days) should
     * still apply for some time.
     *
     *
     * The `Delay` type is 112 bits long, and packs the following:
     *
     * ```
     *   | [uint48]: effect date (timepoint)
     *   |           | [uint32]: value before (duration)
     *   ↓           ↓       ↓ [uint32]: value after (duration)
     * 0xAAAAAAAAAAAABBBBBBBBCCCCCCCC
     * ```
     *
     * NOTE: The {get} and {withUpdate} functions operate using timestamps. Block number based delays are not currently
     * supported.
     */
    type Delay is uint112;

    /**
     * @dev Wrap a duration into a Delay to add the one-step "update in the future" feature
     */
    function toDelay(uint32 duration) internal pure returns (Delay) {
        return Delay.wrap(duration);
    }

    /**
     * @dev Get the value at a given timepoint plus the pending value and effect timepoint if there is a scheduled
     * change after this timepoint. If the effect timepoint is 0, then the pending value should not be considered.
     */
    function _getFullAt(
        Delay self,
        uint48 timepoint
    ) private pure returns (uint32 valueBefore, uint32 valueAfter, uint48 effect) {
        (valueBefore, valueAfter, effect) = self.unpack();
        return effect <= timepoint ? (valueAfter, 0, 0) : (valueBefore, valueAfter, effect);
    }

    /**
     * @dev Get the current value plus the pending value and effect timepoint if there is a scheduled change. If the
     * effect timepoint is 0, then the pending value should not be considered.
     */
    function getFull(Delay self) internal view returns (uint32 valueBefore, uint32 valueAfter, uint48 effect) {
        return _getFullAt(self, timestamp());
    }

    /**
     * @dev Get the current value.
     */
    function get(Delay self) internal view returns (uint32) {
        (uint32 delay, , ) = self.getFull();
        return delay;
    }

    /**
     * @dev Update a Delay object so that it takes a new duration after a timepoint that is automatically computed to
     * enforce the old delay at the moment of the update. Returns the updated Delay object and the timestamp when the
     * new delay becomes effective.
     */
    function withUpdate(
        Delay self,
        uint32 newValue,
        uint32 minSetback
    ) internal view returns (Delay updatedDelay, uint48 effect) {
        uint32 value = self.get();
        uint32 setback = uint32(Math.max(minSetback, value > newValue ? value - newValue : 0));
        effect = timestamp() + setback;
        return (pack(value, newValue, effect), effect);
    }

    /**
     * @dev Split a delay into its components: valueBefore, valueAfter and effect (transition timepoint).
     */
    function unpack(Delay self) internal pure returns (uint32 valueBefore, uint32 valueAfter, uint48 effect) {
        uint112 raw = Delay.unwrap(self);

        valueAfter = uint32(raw);
        valueBefore = uint32(raw >> 32);
        effect = uint48(raw >> 64);

        return (valueBefore, valueAfter, effect);
    }

    /**
     * @dev pack the components into a Delay object.
     */
    function pack(uint32 valueBefore, uint32 valueAfter, uint48 effect) internal pure returns (Delay) {
        return Delay.wrap((uint112(effect) << 64) | (uint112(valueBefore) << 32) | uint112(valueAfter));
    }
}

```

### `contracts/.states/vm-prague/state.json`
```json
{
  "db": {
    "0490f0d98c06a6234cc374564f984580f33770d4605e5781451d4971d3235a2d": "0xf873a1205931b4ed56ace4c46b68524cb5bcbf4195f1bbaacbe5228fbd090546c88dd229b84ff84d8089056bc75e2d63100000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "937514b0e72ad8da6bb5e656f25334fb09e7018992ae794d5c237fbf27a5db15": "0x0126f6216f24971c886cc8ceaf68b04bac0fe25d7aaac4655653aec368359e9d",
    "ac59032c139346dba6925ea119f110bc037a945991f7349e218edbe12d6d43e9": "0xf872a03931b4ed56ace4c46b68524cb5bcbf4195f1bbaacbe5228fbd090546c88dd229b84ff84d8089056bc75e2d63100000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "b57eae55d1d898a1388d3065de9102d0f6ade3423b29be2482e1626394acd99f": "0xf872a0399bf57501565dbd2fdcea36efa2b9aef8340a8901e3459f4a4c926275d36cdbb84ff84d8089056bc75e2d63100000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "dac9f9238909bae6bedf62a95a3ac503b5e6927b8243b9b44e0e335869bef325": "0xf8518080808080a0ac59032c139346dba6925ea119f110bc037a945991f7349e218edbe12d6d43e9808080a0b57eae55d1d898a1388d3065de9102d0f6ade3423b29be2482e1626394acd99f80808080808080",
    "6e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2": "0xf872a034a10bfd00977f54cc3450c9b25c9b3a502a089eba0097ba35fc33c4ea5fcb54b84ff84d8089056bc75e2d63100000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "1db6a1394b96218e282fb52d559676dbecfba9a78146880e35ef38cc061dbf44": "0xf871a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e280808080a0ac59032c139346dba6925ea119f110bc037a945991f7349e218edbe12d6d43e9808080a0b57eae55d1d898a1388d3065de9102d0f6ade3423b29be2482e1626394acd99f80808080808080",
    "acc98ed24983a10e645870d5b47d42f6a1c47d94ac9165221722626a99b3660c": "0xf872a03fbe3e504ac4e35541bebad4d0e7574668e16fefa26cd4172f93e18b59ce9486b84ff84d8089056bc75e2d63100000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "de2548e2521504daf92524b329dbb037a000ed381a8f810b8607e2f8832ada7d": "0xf891a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e280808080a0ac59032c139346dba6925ea119f110bc037a945991f7349e218edbe12d6d43e9808080a0b57eae55d1d898a1388d3065de9102d0f6ade3423b29be2482e1626394acd99f808080a0acc98ed24983a10e645870d5b47d42f6a1c47d94ac9165221722626a99b3660c808080",
    "5f1ef1b2e89b5ed4e71249e76600493c718bc6c6030189bfab281c7b85389a2c": "0xf872a036d82c545c22b72034803633d3dda2b28e89fb704f3c111355ac43e10612aedcb84ff84d8089056bc75e2d63100000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "09cc43c2655ecf235e9ef7dbf5c6f27157eb9f6e2b53433a3f0f13301ca34450": "0xf8b1a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e280808080a0ac59032c139346dba6925ea119f110bc037a945991f7349e218edbe12d6d43e9808080a0b57eae55d1d898a1388d3065de9102d0f6ade3423b29be2482e1626394acd99f808080a0acc98ed24983a10e645870d5b47d42f6a1c47d94ac9165221722626a99b3660c80a05f1ef1b2e89b5ed4e71249e76600493c718bc6c6030189bfab281c7b85389a2c80",
    "69a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bd": "0xf872a0323d89d4ba0f8b56a459710de4b44820d73e93736cfc0667f35cdd5142b70f0db84ff84d8089056bc75e2d63100000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "7b184ca9e86ac8499d2cde865d80d191cbbeca4393fd2b74df5972f5426e0895": "0xf8d1a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e280808080a0ac59032c139346dba6925ea119f110bc037a945991f7349e218edbe12d6d43e9808080a0b57eae55d1d898a1388d3065de9102d0f6ade3423b29be2482e1626394acd99f8080a069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0acc98ed24983a10e645870d5b47d42f6a1c47d94ac9165221722626a99b3660c80a05f1ef1b2e89b5ed4e71249e76600493c718bc6c6030189bfab281c7b85389a2c80",
    "0968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da5315": "0xf872a03c22adb6b75b7a618594eacef369bc4f0ec06380e8630fd7580f9bf0ea413ca8b84ff84d8089056bc75e2d63100000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "b955e456c73a5460828b40c246ac4e09b60c899b969e7a9520783863649f104a": "0xf8f1a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da5315808080a0ac59032c139346dba6925ea119f110bc037a945991f7349e218edbe12d6d43e9808080a0b57eae55d1d898a1388d3065de9102d0f6ade3423b29be2482e1626394acd99f8080a069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0acc98ed24983a10e645870d5b47d42f6a1c47d94ac9165221722626a99b3660c80a05f1ef1b2e89b5ed4e71249e76600493c718bc6c6030189bfab281c7b85389a2c80",
    "70f09e0afc485ee4555a5c2bcb5380fe4745dfb619c97ce55ca368555f4c0358": "0xf872a03b9f0f05f155b5df3bbdd079fa47bedd6da0e32966c72f92264d98e80248858eb84ff84d8089056bc75e2d63100000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "e628eda7692102d1123972b085e483fb81586793e6e4bb395f356f319785b924": "0xf90111a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da5315808080a0ac59032c139346dba6925ea119f110bc037a945991f7349e218edbe12d6d43e9808080a0b57eae55d1d898a1388d3065de9102d0f6ade3423b29be2482e1626394acd99f80a070f09e0afc485ee4555a5c2bcb5380fe4745dfb619c97ce55ca368555f4c0358a069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0acc98ed24983a10e645870d5b47d42f6a1c47d94ac9165221722626a99b3660c80a05f1ef1b2e89b5ed4e71249e76600493c718bc6c6030189bfab281c7b85389a2c80",
    "021eda8d86f1724d84a155e5e0227744e3fb2f570089a70ae65750d24410fe10": "0xf872a0209bf57501565dbd2fdcea36efa2b9aef8340a8901e3459f4a4c926275d36cdbb84ff84d8089056bc75e2d63100000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "35196d12c07e2405a02d095f74880568965618e95b50e64e8690594aa6bb5ea2": "0xf872a0207839edeb5b3ee9a2dee69954b24aeb3f91b8ff4c608efd90618351fe77152fb84ff84d8089056bc75e2d63100000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "f4ae3d0d998ac3c8f5118c8ef3ce2ef3dc0440a900323177580df0f212f8b363": "0xf85180808080a035196d12c07e2405a02d095f74880568965618e95b50e64e8690594aa6bb5ea280808080a0021eda8d86f1724d84a155e5e0227744e3fb2f570089a70ae65750d24410fe1080808080808080",
    "4b7be564e069212c8c0dd694ce21c7051e5cb7bbb527e3af73faf7e61de082c0": "0xf90111a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da5315808080a0ac59032c139346dba6925ea119f110bc037a945991f7349e218edbe12d6d43e9808080a0f4ae3d0d998ac3c8f5118c8ef3ce2ef3dc0440a900323177580df0f212f8b36380a070f09e0afc485ee4555a5c2bcb5380fe4745dfb619c97ce55ca368555f4c0358a069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0acc98ed24983a10e645870d5b47d42f6a1c47d94ac9165221722626a99b3660c80a05f1ef1b2e89b5ed4e71249e76600493c718bc6c6030189bfab281c7b85389a2c80",
    "c3165ef5b21e80c163531f807c25789fef8810eda00ae7ca5ced381ff9a9515a": "0xf872a03aea7c8c479e9ff598fc761670d034e3eff2ebadb1e3769b349b2d1663d23913b84ff84d8089056bc75e2d63100000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "1b83601c6f891d16b1422e65ed3cd47bcbe1342010db6168a0508de8597ac327": "0xf90131a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da5315808080a0ac59032c139346dba6925ea119f110bc037a945991f7349e218edbe12d6d43e9808080a0f4ae3d0d998ac3c8f5118c8ef3ce2ef3dc0440a900323177580df0f212f8b363a0c3165ef5b21e80c163531f807c25789fef8810eda00ae7ca5ced381ff9a9515aa070f09e0afc485ee4555a5c2bcb5380fe4745dfb619c97ce55ca368555f4c0358a069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0acc98ed24983a10e645870d5b47d42f6a1c47d94ac9165221722626a99b3660c80a05f1ef1b2e89b5ed4e71249e76600493c718bc6c6030189bfab281c7b85389a2c80",
    "82f6e0ef9d3ec62e68c811432d52e6e0c907d604aed5a2a561d95e393f487d68": "0xf872a0209f0f05f155b5df3bbdd079fa47bedd6da0e32966c72f92264d98e80248858eb84ff84d8089056bc75e2d63100000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "cdeaf028a7a2894d4778d6c412bfb95e81b23c2e6044f4c5d6de2ed8a50f78f3": "0xf872a020591967aed668a4b27645ff40c444892d91bf5951b382995d4d4f6ee3a2ce03b84ff84d8089056bc75e2d63100000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "9d1b5f3c8944300dda9eec33376308282aa06c11d3fdc640669ce5e506edb797": "0xf85180a0cdeaf028a7a2894d4778d6c412bfb95e81b23c2e6044f4c5d6de2ed8a50f78f3808080808080808080a082f6e0ef9d3ec62e68c811432d52e6e0c907d604aed5a2a561d95e393f487d688080808080",
    "0733321bda3c83f42aeeb32f8dcad18bb4f4c2b80fa60dee4b6eb25f0952524c": "0xf90131a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da5315808080a0ac59032c139346dba6925ea119f110bc037a945991f7349e218edbe12d6d43e9808080a0f4ae3d0d998ac3c8f5118c8ef3ce2ef3dc0440a900323177580df0f212f8b363a0c3165ef5b21e80c163531f807c25789fef8810eda00ae7ca5ced381ff9a9515aa09d1b5f3c8944300dda9eec33376308282aa06c11d3fdc640669ce5e506edb797a069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0acc98ed24983a10e645870d5b47d42f6a1c47d94ac9165221722626a99b3660c80a05f1ef1b2e89b5ed4e71249e76600493c718bc6c6030189bfab281c7b85389a2c80",
    "0932e0165ad0cabdfe9d8fb6a70150033d789cd07caaf499c8a37141495499c3": "0xf872a020a258265696d227eef589fd6cd14671a82aa2963ec2214eb048fca5441c4a7eb84ff84d8089056bc75e2d63100000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8": "0xf87180808080a035196d12c07e2405a02d095f74880568965618e95b50e64e8690594aa6bb5ea280808080a0021eda8d86f1724d84a155e5e0227744e3fb2f570089a70ae65750d24410fe10808080a00932e0165ad0cabdfe9d8fb6a70150033d789cd07caaf499c8a37141495499c3808080",
    "a137d310a084b364dfbf0de1114f64e94253e42baa0297980c4a88db4e7d9aa8": "0xf90131a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da5315808080a0ac59032c139346dba6925ea119f110bc037a945991f7349e218edbe12d6d43e9808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0c3165ef5b21e80c163531f807c25789fef8810eda00ae7ca5ced381ff9a9515aa09d1b5f3c8944300dda9eec33376308282aa06c11d3fdc640669ce5e506edb797a069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0acc98ed24983a10e645870d5b47d42f6a1c47d94ac9165221722626a99b3660c80a05f1ef1b2e89b5ed4e71249e76600493c718bc6c6030189bfab281c7b85389a2c80",
    "9aceb391e41ce30a6ee2c0c568b850f9fde2e425b767f72e7f4d9cc76e8271ec": "0xf872a020be3e504ac4e35541bebad4d0e7574668e16fefa26cd4172f93e18b59ce9486b84ff84d8089056bc75e2d63100000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "090d9dec4c66aadc432a96de820eb6fb44489111b3b6f1f397cd9a44a0014882": "0xf872a0209ae219c4bbc2c5eaa1cd472f76bd0211bbf31053549dd7771cc573d3ed197fb84ff84d8089056bc75e2d63100000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "819c926feb18dee3be8e9daa7ab62abe91febb2caceac5e8038b048d7a4bed0d": "0xf851808080808080808080808080a0090d9dec4c66aadc432a96de820eb6fb44489111b3b6f1f397cd9a44a00148828080a09aceb391e41ce30a6ee2c0c568b850f9fde2e425b767f72e7f4d9cc76e8271ec80",
    "53ac286d5d31f0a7f768060b7f9f198956d75c903a698ae4fbb3dcc9f9d5e0b8": "0xf90131a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da5315808080a0ac59032c139346dba6925ea119f110bc037a945991f7349e218edbe12d6d43e9808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0c3165ef5b21e80c163531f807c25789fef8810eda00ae7ca5ced381ff9a9515aa09d1b5f3c8944300dda9eec33376308282aa06c11d3fdc640669ce5e506edb797a069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0819c926feb18dee3be8e9daa7ab62abe91febb2caceac5e8038b048d7a4bed0d80a05f1ef1b2e89b5ed4e71249e76600493c718bc6c6030189bfab281c7b85389a2c80",
    "1a0e275dfddaeead8d1fa18c665c7e19b15dc769d3ede56c4a85377edc877110": "0xf8719f20e219c4bbc2c5eaa1cd472f76bd0211bbf31053549dd7771cc573d3ed197fb84ff84d8089056bc75e2d63100000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "ff695f1ea854ce96ed9c761374f9cc42179fddef3c76a01c05f7f1bb19725ef8": "0xf8719f201e8c4eba798a431ca40726ca69bda8c7067f1690340e5b0a08d83d00d9cbb84ff84d8089056bc75e2d63100000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "f96f3afee8124cd65bfb12ead5b9bd737c7def4cb7f7c71b82b00d5da23cd77c": "0xf85180808080a0ff695f1ea854ce96ed9c761374f9cc42179fddef3c76a01c05f7f1bb19725ef88080808080a01a0e275dfddaeead8d1fa18c665c7e19b15dc769d3ede56c4a85377edc877110808080808080",
    "d8394fa4bbb65976fe11ee9de67bd6f0fb3fa3d7b36ee09f1421dae79b17b95f": "0xe219a0f96f3afee8124cd65bfb12ead5b9bd737c7def4cb7f7c71b82b00d5da23cd77c",
    "853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a": "0xf851808080808080808080808080a0d8394fa4bbb65976fe11ee9de67bd6f0fb3fa3d7b36ee09f1421dae79b17b95f8080a09aceb391e41ce30a6ee2c0c568b850f9fde2e425b767f72e7f4d9cc76e8271ec80",
    "29a7ea17591b34ca73ee13832a64db6d8565d9ab4dbafea03842fabe139016fa": "0xf90131a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da5315808080a0ac59032c139346dba6925ea119f110bc037a945991f7349e218edbe12d6d43e9808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0c3165ef5b21e80c163531f807c25789fef8810eda00ae7ca5ced381ff9a9515aa09d1b5f3c8944300dda9eec33376308282aa06c11d3fdc640669ce5e506edb797a069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a05f1ef1b2e89b5ed4e71249e76600493c718bc6c6030189bfab281c7b85389a2c80",
    "48e73baa24091198f9b69f9c7d27ba256fc19dddebf64448a7a0fd3df28d727d": "0xf872a020ea7c8c479e9ff598fc761670d034e3eff2ebadb1e3769b349b2d1663d23913b84ff84d8089056bc75e2d63100000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "dc3d58bdcff5ea646a823bebe53ec4ab457ca425e952485f0da477b44fd7bacd": "0xf872a020e7c546eb582218cf94b848c36f3b058e2518876240ae6100c4ef23d38f3e07b84ff84d8089056bc75e2d63100000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546bab": "0xf85180808080808080808080a048e73baa24091198f9b69f9c7d27ba256fc19dddebf64448a7a0fd3df28d727d80808080a0dc3d58bdcff5ea646a823bebe53ec4ab457ca425e952485f0da477b44fd7bacd80",
    "c87ee106e21de6f375b1424af09b5235d42f0524163ba739aa52ff49cf6e0fb9": "0xf90131a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da5315808080a0ac59032c139346dba6925ea119f110bc037a945991f7349e218edbe12d6d43e9808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba09d1b5f3c8944300dda9eec33376308282aa06c11d3fdc640669ce5e506edb797a069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a05f1ef1b2e89b5ed4e71249e76600493c718bc6c6030189bfab281c7b85389a2c80",
    "bf40a9d1703e12b6e9adbdd4b52bf85a3bbfaab8a48efdeb37183698aee5c470": "0xf872a03931b4ed56ace4c46b68524cb5bcbf4195f1bbaacbe5228fbd090546c88dd229b84ff84d8089056bc75e2d57243e00a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "1958a370471369a2e1d116023894797927853141dd11d84f7439422ac1886f11": "0xf90131a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da5315808080a0bf40a9d1703e12b6e9adbdd4b52bf85a3bbfaab8a48efdeb37183698aee5c470808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba09d1b5f3c8944300dda9eec33376308282aa06c11d3fdc640669ce5e506edb797a069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a05f1ef1b2e89b5ed4e71249e76600493c718bc6c6030189bfab281c7b85389a2c80",
    "5492888cc7c534f4fd1f9f803a9c0c9b14a3aa268d7aa1a226c0b5a2df295078": "0xf872a03931b4ed56ace4c46b68524cb5bcbf4195f1bbaacbe5228fbd090546c88dd229b84ff84d0189056bc75e2d57243e00a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "3385f209bb45a8787ae9ab5792cff76e64c0e643c5b2af01da3825e1418e5c22": "0xf90131a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da5315808080a05492888cc7c534f4fd1f9f803a9c0c9b14a3aa268d7aa1a226c0b5a2df295078808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba09d1b5f3c8944300dda9eec33376308282aa06c11d3fdc640669ce5e506edb797a069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a05f1ef1b2e89b5ed4e71249e76600493c718bc6c6030189bfab281c7b85389a2c80",
    "57ec08b8f040499409fb0220f538477790d4f010c4bb51a8dbae5da3537a86a4": "0xf872a020d82c545c22b72034803633d3dda2b28e89fb704f3c111355ac43e10612aedcb84ff84d8089056bc75e2d63100000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "9b5e595475007074a246b52a8b850b6a55a1ca47751ed6d715c290926ece7d10": "0xf869a0204b24eae4a02d3987ca887631704554f37941d36d88eba3861c6e365c7804a5b846f8448080a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "8ebfa1bb8d7f17c4c7b061298856df0d764d78874df9bbee0e2607b97a282e6f": "0xf851808080808080a057ec08b8f040499409fb0220f538477790d4f010c4bb51a8dbae5da3537a86a480a09b5e595475007074a246b52a8b850b6a55a1ca47751ed6d715c290926ece7d108080808080808080",
    "d4f7345b04cb4e371827c71c4dab83da5e48ebee74d977ff4d485b2fb8acccfe": "0xf90131a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da5315808080a05492888cc7c534f4fd1f9f803a9c0c9b14a3aa268d7aa1a226c0b5a2df295078808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba09d1b5f3c8944300dda9eec33376308282aa06c11d3fdc640669ce5e506edb797a069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a08ebfa1bb8d7f17c4c7b061298856df0d764d78874df9bbee0e2607b97a282e6f80",
    "bb6ee835518e56b6623af794f7aa4fc29ad48c4def725b8a2ff64b38bd22c789": "0xf869a0204b24eae4a02d3987ca887631704554f37941d36d88eba3861c6e365c7804a5b846f8440180a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "78411d2196a2e4c560372788d3e499d0b71f36204f1961a41ef216a7fd574e95": "0xf851808080808080a057ec08b8f040499409fb0220f538477790d4f010c4bb51a8dbae5da3537a86a480a0bb6ee835518e56b6623af794f7aa4fc29ad48c4def725b8a2ff64b38bd22c7898080808080808080",
    "66aedbb3dc39b3a989497ee17099845b4807ba47e50b82de95f0da0f6274d60c": "0xf90131a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da5315808080a05492888cc7c534f4fd1f9f803a9c0c9b14a3aa268d7aa1a226c0b5a2df295078808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba09d1b5f3c8944300dda9eec33376308282aa06c11d3fdc640669ce5e506edb797a069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a078411d2196a2e4c560372788d3e499d0b71f36204f1961a41ef216a7fd574e9580",
    "636b0bda6cb468cdf4552961026a3ef1430be262f66743b2369ff6c6b6176ea942": "0x608060405234801561000f575f80fd5b5060043610610034575f3560e01c80630961b7081461003857806319e0b28814610067575b5f80fd5b61004b610046366004610339565b61007a565b6040516001600160a01b03909116815260200160405180910390f35b61004b610075366004610409565b610228565b5f6004825110156100ed5760405162461bcd60e51b815260206004820152603360248201527f44414f466163746f72793a20496e73756666696369656e742073657474696e676044820152727320696e20696e697469616c416d6f756e747360681b606482015260840160405180910390fd5b5f82600484516100fd9190610420565b8151811061010d5761010d610445565b602002602001015190505f83600385516101279190610420565b8151811061013757610137610445565b602002602001015190505f84600286516101519190610420565b8151811061016157610161610445565b602002602001015190505f856001875161017b9190610420565b8151811061018b5761018b610445565b602002602001015190505f898989878787876040516101a99061024f565b6101b99796959493929190610459565b604051809103905ff0801580156101d2573d5f803e3d5ffd5b505f80546001810182559080527f290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e5630180546001600160a01b0319166001600160a01b0383161790559a9950505050505050505050565b5f8181548110610236575f80fd5b5f918252602090912001546001600160a01b0316905081565b614e9b806104d383390190565b80356001600160a01b0381168114610272575f80fd5b919050565b634e487b7160e01b5f52604160045260245ffd5b604051601f8201601f1916810167ffffffffffffffff811182821017156102b4576102b4610277565b604052919050565b5f82601f8301126102cb575f80fd5b8135602067ffffffffffffffff8211156102e7576102e7610277565b8160051b6102f682820161028b565b928352848101820192828101908785111561030f575f80fd5b83870192505b8483101561032e57823582529183019190830190610315565b979650505050505050565b5f805f806080858703121561034c575f80fd5b6103558561025c565b9350602061036481870161025c565b9350604086013567ffffffffffffffff80821115610380575f80fd5b818801915088601f830112610393575f80fd5b8135818111156103a5576103a5610277565b6103b7601f8201601f1916850161028b565b8181528a858386010111156103ca575f80fd5b81858501868301375f91810190940152919350606087013591808311156103ef575f80fd5b50506103fd878288016102bc565b91505092959194509250565b5f60208284031215610419575f80fd5b5035919050565b8181038181111561043f57634e487b7160e01b5f52601160045260245ffd5b92915050565b634e487b7160e01b5f52603260045260245ffd5b5f60018060a01b03808a16835280891660208401525060e0604083015286518060e08401526101008160208a018286015e5f84830182015265ffffffffffff97909716606084015263ffffffff9590951660808301525060a081019290925260ff1660c0820152601f909101601f19160101939250505056fe610180604052348015610010575f80fd5b50604051614e9b380380614e9b83398101604081905261002f91610753565b8560ff82168861004087603c610871565b61004b87603c61089b565b868a8061006c6040805180820190915260018152603160f81b602082015290565b610076825f610174565b61012052610085816001610174565b61014052815160208084019190912060e052815190820120610100524660a05261011160e05161010051604080517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60208201529081019290925260608201524660808201523060a08201525f9060c00160405160208183030381529060405280519060200120905090565b60805250503060c0526003610126828261093f565b506101329050836101a6565b61013b8261020c565b610144816102b0565b5050506001600160a01b03166101605261015d816102f1565b5061016781610386565b5050505050505050610a82565b5f60208351101561018f57610188836103ef565b90506101a0565b8161019a848261093f565b5060ff90505b92915050565b6008546040805165ffffffffffff928316815291831660208301527fc565b045403dc03c2eea82b81a0465edad9e2e7fc4d97e11421c209da93d7a93910160405180910390a16008805465ffffffffffff191665ffffffffffff92909216919091179055565b8063ffffffff165f036102395760405163f1cfbf0560e01b81525f60048201526024015b60405180910390fd5b6008546040805163ffffffff66010000000000009093048316815291831660208301527f7e3f7f0708a84de9203036abaa450dccc85ad5ff52f78c170f3edb55cf5e8828910160405180910390a16008805463ffffffff90921666010000000000000263ffffffff60301b19909216919091179055565b60075460408051918252602082018390527fccb45da8d5717e6c4544694297c4ba5cf151d455c9bb0ed4fc7a38411bc05461910160405180910390a1600755565b60648082111561031e5760405163243e544560e01b81526004810183905260248101829052604401610230565b5f61032761042c565b9050610346610334610445565b61033d856104bf565b600a91906104f6565b505060408051828152602081018590527f0553476bf02ef2726e8ce5ced78d63e26e602e4a2257b1f559418e24b4633997910160405180910390a1505050565b600b54604080516001600160a01b03928316815291831660208301527f08f74ea46ef7894f65eabfb5e6e695de773a000b47c529ab559178069b226401910160405180910390a1600b80546001600160a01b0319166001600160a01b0392909216919091179055565b5f80829050601f81511115610419578260405163305a27a960e01b815260040161023091906109fe565b805161042482610a33565b179392505050565b5f610437600a610510565b6001600160d01b0316905090565b5f6104506101605190565b6001600160a01b03166391ddadf46040518163ffffffff1660e01b8152600401602060405180830381865afa9250505080156104a9575060408051601f3d908101601f191682019092526104a691810190610a56565b60015b6104ba576104b5610558565b905090565b919050565b5f6001600160d01b038211156104f2576040516306dfcc6560e41b815260d0600482015260248101839052604401610230565b5090565b5f80610503858585610562565b915091505b935093915050565b80545f90801561054f5761053683610529600184610a6f565b5f91825260209091200190565b54660100000000000090046001600160d01b0316610551565b5f5b9392505050565b5f6104b5436106be565b82545f9081908015610661575f61057e87610529600185610a6f565b805490915065ffffffffffff80821691660100000000000090046001600160d01b03169088168211156105c457604051632520601d60e01b815260040160405180910390fd5b8765ffffffffffff168265ffffffffffff160361060057825465ffffffffffff1666010000000000006001600160d01b03891602178355610653565b6040805180820190915265ffffffffffff808a1682526001600160d01b03808a1660208085019182528d54600181018f555f8f815291909120945191519092166601000000000000029216919091179101555b945085935061050892505050565b50506040805180820190915265ffffffffffff80851682526001600160d01b0380851660208085019182528854600181018a555f8a8152918220955192519093166601000000000000029190931617920191909155905081610508565b5f65ffffffffffff8211156104f2576040516306dfcc6560e41b81526030600482015260248101839052604401610230565b6001600160a01b0381168114610704575f80fd5b50565b634e487b7160e01b5f52604160045260245ffd5b805165ffffffffffff811681146104ba575f80fd5b805163ffffffff811681146104ba575f80fd5b805160ff811681146104ba575f80fd5b5f805f805f805f60e0888a031215610769575f80fd5b8751610774816106f0565b6020890151909750610785816106f0565b60408901519096506001600160401b03808211156107a1575f80fd5b818a0191508a601f8301126107b4575f80fd5b8151818111156107c6576107c6610707565b604051601f8201601f19908116603f011681019083821181831017156107ee576107ee610707565b816040528281528d6020848701011115610806575f80fd5b8260208601602083015e5f60208483010152809950505050505061082c6060890161071b565b935061083a60808901610730565b925060a0880151915061084f60c08901610743565b905092959891949750929550565b634e487b7160e01b5f52601160045260245ffd5b65ffffffffffff8181168382160280821691908281146108935761089361085d565b505092915050565b63ffffffff8181168382160280821691908281146108935761089361085d565b600181811c908216806108cf57607f821691505b6020821081036108ed57634e487b7160e01b5f52602260045260245ffd5b50919050565b601f82111561093a57805f5260205f20601f840160051c810160208510156109185750805b601f840160051c820191505b81811015610937575f8155600101610924565b50505b505050565b81516001600160401b0381111561095857610958610707565b61096c8161096684546108bb565b846108f3565b602080601f83116001811461099f575f84156109885750858301515b5f19600386901b1c1916600185901b1785556109f6565b5f85815260208120601f198616915b828110156109cd578886015182559484019460019091019084016109ae565b50858210156109ea57878501515f19600388901b60f8161c191681555b505060018460011b0185555b505050505050565b602081525f82518060208401528060208501604085015e5f604082850101526040601f19601f83011684010191505092915050565b805160208083015191908110156108ed575f1960209190910360031b1b16919050565b5f60208284031215610a66575f80fd5b6105518261071b565b818103818111156101a0576101a061085d565b60805160a05160c05160e051610100516101205161014051610160516143a2610af95f395f81816109c101528181610e29015281816111f601528181611e28015261208201525f611d6c01525f611d4001525f612ddf01525f612db701525f612d1201525f612d3c01525f612d6601526143a25ff3fe6080604052600436106102a8575f3560e01c80637ecebe001161016f578063bc197c81116100d8578063deaaa7cc11610092578063ece40cc11161006d578063ece40cc114610956578063f23a6e6114610975578063f8ce560a14610994578063fc0c546a146109b3575f80fd5b8063deaaa7cc146108e5578063e540d01d14610918578063eb9019d414610937575f80fd5b8063bc197c8114610813578063c01f9e3714610832578063c28bc2fa14610851578063c59057e414610864578063d33219b414610883578063dd4e2ba5146108a0575f80fd5b8063a7713a7011610129578063a7713a7014610758578063a890c9101461076c578063a8f8a6681461078b578063a9a95294146107aa578063ab58fb8e146107c9578063b58131b0146107ff575f80fd5b80637ecebe001461068157806384b0196e146106b55780638ff262e3146106dc57806391ddadf4146106fb57806397c3d334146107265780639a802a6d14610739575f80fd5b806343859632116102115780635b8d0e0d116101cb5780635b8d0e0d146105c75780635f398a14146105e657806360c4247f1461060557806379051887146106245780637b3c71d3146106435780637d5e81e214610662575f80fd5b806343859632146104ca578063452115d6146105125780634bf5d7e914610531578063544ffc9c1461054557806354fd4d501461057f57806356781388146105a8575f80fd5b8063160cbed711610262578063160cbed7146104065780632656227d146104255780632d63f693146104385780632fe3e261146104575780633932abb11461048a5780633e4f49e61461049e575f80fd5b806301ffc9a7146102e357806302a251a31461031757806306f3f9e61461034257806306fdde0314610361578063143489d014610382578063150b7a02146103ce575f80fd5b366102df57306102b66109e5565b6001600160a01b0316146102dd57604051637485328f60e11b815260040160405180910390fd5b005b5f80fd5b3480156102ee575f80fd5b506103026102fd3660046133a0565b6109fd565b60405190151581526020015b60405180910390f35b348015610322575f80fd5b50600854600160301b900463ffffffff165b60405190815260200161030e565b34801561034d575f80fd5b506102dd61035c3660046133c7565b610a69565b34801561036c575f80fd5b50610375610a7d565b60405161030e919061340c565b34801561038d575f80fd5b506103b661039c3660046133c7565b5f908152600460205260409020546001600160a01b031690565b6040516001600160a01b03909116815260200161030e565b3480156103d9575f80fd5b506103ed6103e83660046134f5565b610b0d565b6040516001600160e01b0319909116815260200161030e565b348015610411575f80fd5b506103346104203660046136c4565b610b4f565b6103346104333660046136c4565b610c1b565b348015610443575f80fd5b506103346104523660046133c7565b610d83565b348015610462575f80fd5b506103347f3e83946653575f9a39005e1545185629e92736b7528ab20ca3816f315424a81181565b348015610495575f80fd5b50610334610da3565b3480156104a9575f80fd5b506104bd6104b83660046133c7565b610db5565b60405161030e9190613781565b3480156104d5575f80fd5b506103026104e436600461378f565b5f8281526009602090815260408083206001600160a01b038516845260030190915290205460ff1692915050565b34801561051d575f80fd5b5061033461052c3660046136c4565b610dbf565b34801561053c575f80fd5b50610375610e25565b348015610550575f80fd5b5061056461055f3660046133c7565b610ee5565b6040805193845260208401929092529082015260600161030e565b34801561058a575f80fd5b506040805180820190915260018152603160f81b6020820152610375565b3480156105b3575f80fd5b506103346105c23660046137cd565b610f0a565b3480156105d2575f80fd5b506103346105e136600461383b565b610f31565b3480156105f1575f80fd5b506103346106003660046138ed565b610fee565b348015610610575f80fd5b5061033461061f3660046133c7565b611036565b34801561062f575f80fd5b506102dd61063e36600461397d565b611042565b34801561064e575f80fd5b5061033461065d366004613998565b611053565b34801561066d575f80fd5b5061033461067c3660046139ed565b6110a3565b34801561068c575f80fd5b5061033461069b366004613a99565b6001600160a01b03165f9081526002602052604090205490565b3480156106c0575f80fd5b506106c9611159565b60405161030e9796959493929190613aee565b3480156106e7575f80fd5b506103346106f6366004613b5d565b61119b565b348015610706575f80fd5b5061070f6111f3565b60405165ffffffffffff909116815260200161030e565b348015610731575f80fd5b506064610334565b348015610744575f80fd5b50610334610753366004613baa565b61127a565b348015610763575f80fd5b50610334611290565b348015610777575f80fd5b506102dd610786366004613a99565b6112a9565b348015610796575f80fd5b506103346107a53660046136c4565b6112ba565b3480156107b5575f80fd5b506103026107c43660046133c7565b6112c7565b3480156107d4575f80fd5b506103346107e33660046133c7565b5f9081526004602052604090206001015465ffffffffffff1690565b34801561080a575f80fd5b506103346112cf565b34801561081e575f80fd5b506103ed61082d366004613bfe565b6112d9565b34801561083d575f80fd5b5061033461084c3660046133c7565b61131c565b6102dd61085f366004613c8a565b61135e565b34801561086f575f80fd5b5061033461087e3660046136c4565b6113da565b34801561088e575f80fd5b50600b546001600160a01b03166103b6565b3480156108ab575f80fd5b506040805180820190915260208082527f737570706f72743d627261766f2671756f72756d3d666f722c6162737461696e90820152610375565b3480156108f0575f80fd5b506103347ff2aad550cf55f045cb27e9c559f9889fdfb6e6cdaa032301d6ea397784ae51d781565b348015610923575f80fd5b506102dd610932366004613cc9565b611413565b348015610942575f80fd5b50610334610951366004613cec565b611424565b348015610961575f80fd5b506102dd6109703660046133c7565b611443565b348015610980575f80fd5b506103ed61098f366004613d16565b611454565b34801561099f575f80fd5b506103346109ae3660046133c7565b611497565b3480156109be575f80fd5b507f00000000000000000000000000000000000000000000000000000000000000006103b6565b5f6109f8600b546001600160a01b031690565b905090565b5f6001600160e01b031982166366defe7760e11b1480610a2d57506001600160e01b031982166332a2ad4360e11b145b80610a4857506001600160e01b03198216630271189760e51b145b80610a6357506301ffc9a760e01b6001600160e01b03198316145b92915050565b610a716114a1565b610a7a8161151a565b50565b606060038054610a8c90613d79565b80601f0160208091040260200160405190810160405280929190818152602001828054610ab890613d79565b8015610b035780601f10610ada57610100808354040283529160200191610b03565b820191905f5260205f20905b815481529060010190602001808311610ae657829003601f168201915b5050505050905090565b5f30610b176109e5565b6001600160a01b031614610b3e57604051637485328f60e11b815260040160405180910390fd5b50630a85bd0160e11b949350505050565b5f80610b5d868686866112ba565b9050610b7281610b6d60046115af565b6115d1565b505f610b81828888888861160e565b905065ffffffffffff811615610bf8575f82815260046020908152604091829020600101805465ffffffffffff191665ffffffffffff85169081179091558251858152918201527f9a2e42fd6722813d69113e7d0079d3d940171428df7373df9c7f7617cfda2892910160405180910390a1610c11565b604051634844252360e11b815260040160405180910390fd5b5095945050505050565b5f80610c29868686866112ba565b9050610c4981610c3960056115af565b610c4360046115af565b176115d1565b505f818152600460205260409020805460ff60f01b1916600160f01b17905530610c716109e5565b6001600160a01b031614610cfa575f5b8651811015610cf857306001600160a01b0316878281518110610ca657610ca6613db1565b60200260200101516001600160a01b031603610cf057610cf0858281518110610cd157610cd1613db1565b602002602001015180519060200120600561161c90919063ffffffff16565b600101610c81565b505b610d07818787878761167d565b30610d106109e5565b6001600160a01b031614158015610d3c57506005546001600160801b03808216600160801b9092041614155b15610d46575f6005555b6040518181527f712ae1383f79ac853f8d882153778e0260ef8f03b504e2866e0593e04d2b291f906020015b60405180910390a195945050505050565b5f90815260046020526040902054600160a01b900465ffffffffffff1690565b5f6109f860085465ffffffffffff1690565b5f610a6382611691565b5f80610dcd868686866112ba565b905033610dda82826117ca565b610e0e57604051638fe5d8a960e01b8152600481018390526001600160a01b03821660248201526044015b60405180910390fd5b610e1a8787878761180f565b979650505050505050565b60607f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316634bf5d7e96040518163ffffffff1660e01b81526004015f60405180830381865afa925050508015610ea457506040513d5f823e601f3d908101601f19168201604052610ea19190810190613dc5565b60015b610ee0575060408051808201909152601d81527f6d6f64653d626c6f636b6e756d6265722666726f6d3d64656661756c74000000602082015290565b919050565b5f818152600960205260409020805460018201546002909201549091905b9193909250565b5f80339050610f2984828560405180602001604052805f81525061181c565b949350505050565b5f610f7788888888888080601f0160208091040260200160405190810160405280939291908181526020018383808284375f920191909152508a925089915061183d9050565b610f9f576040516394ab6c0760e01b81526001600160a01b0387166004820152602401610e05565b610fe288878988888080601f0160208091040260200160405190810160405280939291908181526020018383808284375f920191909152508a925061190a915050565b98975050505050505050565b5f80339050610e1a87828888888080601f0160208091040260200160405190810160405280939291908181526020018383808284375f920191909152508a925061190a915050565b5f610a63600a836119e8565b61104a6114a1565b610a7a81611a35565b5f8033905061109986828787878080601f0160208091040260200160405190810160405280939291908181526020018383808284375f9201919091525061181c92505050565b9695505050505050565b5f336110af8184611a9b565b6110d75760405163d9b3955760e01b81526001600160a01b0382166004820152602401610e05565b5f6110e06112cf565b9050801561114c575f61110e8360016110f76111f3565b6111019190613e4d565b65ffffffffffff16611424565b90508181101561114a57604051636121770b60e11b81526001600160a01b03841660048201526024810182905260448101839052606401610e05565b505b610e1a8787878786611b1f565b5f6060805f805f606061116a611d39565b611172611d65565b604080515f80825260208201909252600f60f81b9b939a50919850469750309650945092509050565b5f6111a885858585611d92565b6111d0576040516394ab6c0760e01b81526001600160a01b0384166004820152602401610e05565b6111ea85848660405180602001604052805f81525061181c565b95945050505050565b5f7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166391ddadf46040518163ffffffff1660e01b8152600401602060405180830381865afa92505050801561126e575060408051601f3d908101601f1916820190925261126b91810190613e73565b60015b610ee0576109f8611e1b565b5f611286848484611e25565b90505b9392505050565b5f61129b600a611eb8565b6001600160d01b0316905090565b6112b16114a1565b610a7a81611efc565b5f6111ea858585856113da565b5f6001610a63565b5f6109f860075490565b5f306112e36109e5565b6001600160a01b03161461130a57604051637485328f60e11b815260040160405180910390fd5b5063bc197c8160e01b95945050505050565b5f8181526004602052604081205461135090600160d01b810463ffffffff1690600160a01b900465ffffffffffff16613e8e565b65ffffffffffff1692915050565b6113666114a1565b5f80856001600160a01b0316858585604051611383929190613ead565b5f6040518083038185875af1925050503d805f81146113bd576040519150601f19603f3d011682016040523d82523d5f602084013e6113c2565b606091505b50915091506113d18282611f65565b50505050505050565b5f848484846040516020016113f29493929190613f4c565b60408051601f19818403018152919052805160209091012095945050505050565b61141b6114a1565b610a7a81611f81565b5f611289838361143e60408051602081019091525f815290565b611e25565b61144b6114a1565b610a7a8161201d565b5f3061145e6109e5565b6001600160a01b03161461148557604051637485328f60e11b815260040160405180910390fd5b5063f23a6e6160e01b95945050505050565b5f610a638261205e565b336114aa6109e5565b6001600160a01b0316146114d3576040516347096e4760e01b8152336004820152602401610e05565b306114dc6109e5565b6001600160a01b031614611518575f80366040516114fb929190613ead565b604051809103902090505b8061151160056120fb565b0361150657505b565b6064808211156115475760405163243e544560e01b81526004810183905260248101829052604401610e05565b5f611550611290565b905061156f61155d6111f3565b61156685612168565b600a919061219f565b505060408051828152602081018590527f0553476bf02ef2726e8ce5ced78d63e26e602e4a2257b1f559418e24b4633997910160405180910390a1505050565b5f8160078111156115c2576115c261374d565b600160ff919091161b92915050565b5f806115dc84610db5565b90505f836115e9836115af565b1603611289578381846040516331b75e4d60e01b8152600401610e0593929190613f96565b5f61109986868686866121b9565b81546001600160801b03600160801b82048116918116600183019091160361164857611648604161234a565b6001600160801b038082165f90815260018086016020526040909120939093558354919092018216600160801b029116179055565b61168a858585858561235b565b5050505050565b5f8061169c836123eb565b905060058160078111156116b2576116b261374d565b146116bd5792915050565b5f838152600c60205260409081902054600b549151632c258a9f60e11b81526004810182905290916001600160a01b03169063584b153e90602401602060405180830381865afa158015611713573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906117379190613fb8565b15611746575060059392505050565b600b54604051632ab0f52960e01b8152600481018390526001600160a01b0390911690632ab0f52990602401602060405180830381865afa15801561178d573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906117b19190613fb8565b156117c0575060079392505050565b5060029392505050565b5f806117d584610db5565b60078111156117e6576117e661374d565b1480156112895750505f91825260046020526040909120546001600160a01b0391821691161490565b5f6111ea8585858561251c565b5f6111ea8585858561183860408051602081019091525f815290565b61190a565b5f610e1a856119047f3e83946653575f9a39005e1545185629e92736b7528ab20ca3816f315424a8118a8a8a61188f8c6001600160a01b03165f90815260026020526040902080546001810190915590565b8b516020808e01919091208c518d8301206040516118e998979695949301968752602087019590955260ff9390931660408601526001600160a01b03919091166060850152608084015260a083015260c082015260e00190565b604051602081830303815290604052805190602001206125b3565b846125df565b5f61191986610b6d60016115af565b505f61192e8661192889610d83565b85611e25565b90505f61193e888888858861264f565b905083515f0361199457866001600160a01b03167fb8e138887d0aa13bab447e82de9d5c1777041ecd21ca36ba824ff1e6c07ddda4898884896040516119879493929190613fd7565b60405180910390a2610e1a565b866001600160a01b03167fe2babfbac5889a709b63bb7f598b324e08bc5a4fb9ec647fb3cbc9ec07eb871289888489896040516119d5959493929190613ffe565b60405180910390a2979650505050505050565b5f805f6119f48561274b565b9250925050838265ffffffffffff161115611a2157611a1c611a15856127a3565b86906127d5565b611a23565b805b6001600160d01b031695945050505050565b6008546040805165ffffffffffff928316815291831660208301527fc565b045403dc03c2eea82b81a0465edad9e2e7fc4d97e11421c209da93d7a93910160405180910390a16008805465ffffffffffff191665ffffffffffff92909216919091179055565b80515f906034811015611ab2576001915050610a63565b60131981840101516001600160b01b03198116692370726f706f7365723d60b01b14611ae357600192505050610a63565b5f80611af386602a860386612877565b91509150811580610e1a5750866001600160a01b0316816001600160a01b031614979650505050505050565b5f611b3386868686805190602001206112ba565b905084518651141580611b4857508351865114155b80611b5257508551155b15611b8757855184518651604051630447b05d60e41b8152600481019390935260248301919091526044820152606401610e05565b5f81815260046020526040902054600160a01b900465ffffffffffff1615611bd05780611bb382610db5565b6040516331b75e4d60e01b8152610e059291905f90600401613f96565b5f611bd9610da3565b611be16111f3565b65ffffffffffff16611bf39190614037565b90505f611c0d60085463ffffffff600160301b9091041690565b5f84815260046020526040902080546001600160a01b0319166001600160a01b038716178155909150611c3f836127a3565b815465ffffffffffff91909116600160a01b0265ffffffffffff60a01b19909116178155611c6c82612920565b815463ffffffff91909116600160d01b0263ffffffff60d01b1990911617815588517f7d84a6263ae0d98d3329bd7b46bb4e8d6f98cd35a7adb45c274c8b7fd5ebd5e090859087908c908c906001600160401b03811115611ccf57611ccf613432565b604051908082528060200260200182016040528015611d0257816020015b6060815260200190600190039081611ced5790505b508c89611d0f8a82614037565b8e604051611d259998979695949392919061404a565b60405180910390a150505095945050505050565b60606109f87f00000000000000000000000000000000000000000000000000000000000000005f612950565b60606109f87f00000000000000000000000000000000000000000000000000000000000000006001612950565b5f6111ea836119047ff2aad550cf55f045cb27e9c559f9889fdfb6e6cdaa032301d6ea397784ae51d7888888611de48a6001600160a01b03165f90815260026020526040902080546001810190915590565b60408051602081019690965285019390935260ff90911660608401526001600160a01b0316608083015260a082015260c0016118e9565b5f6109f8436127a3565b5f7f0000000000000000000000000000000000000000000000000000000000000000604051630748d63560e31b81526001600160a01b038681166004830152602482018690529190911690633a46b1a890604401602060405180830381865afa158015611e94573d5f803e3d5ffd5b505050506040513d601f19601f82011682018060405250810190611286919061411f565b80545f908015611ef457611ede83611ed1600184614136565b5f91825260209091200190565b54600160301b90046001600160d01b0316611289565b5f9392505050565b600b54604080516001600160a01b03928316815291831660208301527f08f74ea46ef7894f65eabfb5e6e695de773a000b47c529ab559178069b226401910160405180910390a1600b80546001600160a01b0319166001600160a01b0392909216919091179055565b606082611f7a57611f75826129f9565b610a63565b5080610a63565b8063ffffffff165f03611fa95760405163f1cfbf0560e01b81525f6004820152602401610e05565b6008546040805163ffffffff600160301b9093048316815291831660208301527f7e3f7f0708a84de9203036abaa450dccc85ad5ff52f78c170f3edb55cf5e8828910160405180910390a16008805463ffffffff909216600160301b0269ffffffff00000000000019909216919091179055565b60075460408051918252602082018390527fccb45da8d5717e6c4544694297c4ba5cf151d455c9bb0ed4fc7a38411bc05461910160405180910390a1600755565b604051632394e7a360e21b8152600481018290525f90610a63906001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001690638e539e8c90602401602060405180830381865afa1580156120c7573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906120eb919061411f565b6120f484611036565b6064612a21565b80545f906001600160801b0380821691600160801b900416810361212357612123603161234a565b6001600160801b038181165f908152600185810160205260408220805492905585546fffffffffffffffffffffffffffffffff19169301909116919091179092555090565b5f6001600160d01b0382111561219b576040516306dfcc6560e41b815260d0600482015260248101839052604401610e05565b5090565b5f806121ac858585612ad1565b915091505b935093915050565b5f80600b5f9054906101000a90046001600160a01b03166001600160a01b031663f27a0c926040518163ffffffff1660e01b8152600401602060405180830381865afa15801561220b573d5f803e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061222f919061411f565b90505f3060601b6bffffffffffffffffffffffff19168418600b5460405163b1c5f42760e01b81529192506001600160a01b03169063b1c5f42790612280908a908a908a905f908890600401614149565b602060405180830381865afa15801561229b573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906122bf919061411f565b5f898152600c602052604080822092909255600b5491516308f2a0bb60e41b81526001600160a01b0390921691638f2a0bb091612309918b918b918b919088908a90600401614196565b5f604051808303815f87803b158015612320575f80fd5b505af1158015612332573d5f803e3d5ffd5b50505050610fe282426123459190614037565b6127a3565b634e487b715f52806020526024601cfd5b600b546001600160a01b031663e38335e5348686865f3060601b6bffffffffffffffffffffffff191688186040518763ffffffff1660e01b81526004016123a6959493929190614149565b5f604051808303818588803b1580156123bd575f80fd5b505af11580156123cf573d5f803e3d5ffd5b5050505f9687525050600c602052505060408320929092555050565b5f818152600460205260408120805460ff600160f01b8204811691600160f81b900416811561241f57506007949350505050565b801561243057506002949350505050565b5f61243a86610d83565b9050805f0361245f57604051636ad0607560e01b815260048101879052602401610e05565b5f6124686111f3565b65ffffffffffff16905080821061248557505f9695505050505050565b5f61248f8861131c565b90508181106124a657506001979650505050505050565b6124af88612c21565b15806124ce57505f888152600960205260409020805460019091015411155b156124e157506003979650505050505050565b5f8881526004602052604090206001015465ffffffffffff165f0361250e57506004979650505050505050565b506005979650505050505050565b5f8061252a86868686612c57565b5f818152600c60205260409020549091508015610c1157600b5460405163c4d252f560e01b8152600481018390526001600160a01b039091169063c4d252f5906024015f604051808303815f87803b158015612584575f80fd5b505af1158015612596573d5f803e3d5ffd5b5050505f838152600c602052604081205550509050949350505050565b5f610a636125bf612d06565b8360405161190160f01b8152600281019290925260228201526042902090565b5f836001600160a01b03163b5f0361263d575f806125fd8585612e2f565b5090925090505f8160038111156126165761261661374d565b1480156126345750856001600160a01b0316826001600160a01b0316145b92505050611289565b612648848484612e78565b9050611289565b5f8581526009602090815260408083206001600160a01b03881684526003810190925282205460ff16156126a1576040516371c6af4960e01b81526001600160a01b0387166004820152602401610e05565b6001600160a01b0386165f9081526003820160205260409020805460ff1916600117905560ff85166126ea5783815f015f8282546126df9190614037565b909155506127409050565b5f1960ff8616016127085783816001015f8282546126df9190614037565b60011960ff8616016127275783816002015f8282546126df9190614037565b6040516303599be160e11b815260040160405180910390fd5b509195945050505050565b80545f9081908190808203612769575f805f93509350935050610f03565b5f61277986611ed1600185614136565b546001955065ffffffffffff81169450600160301b90046001600160d01b03169250610f03915050565b5f65ffffffffffff82111561219b576040516306dfcc6560e41b81526030600482015260248101839052604401610e05565b81545f9081816005811115612831575f6127ee84612f4e565b6127f89085614136565b5f8881526020902090915081015465ffffffffffff90811690871610156128215780915061282f565b61282c816001614037565b92505b505b5f61283e878785856130a6565b9050801561286b5761285587611ed1600184614136565b54600160301b90046001600160d01b0316610e1a565b505f9695505050505050565b5f80845183118061288757508284115b1561289657505f9050806121b1565b5f6128a2856001614037565b841180156128ca575061060f60f31b6128be8787016020015190565b6001600160f01b031916145b90505f6128da82151560026141ed565b6128e5906028614037565b9050806128f28787614136565b03612913575f80612904898989613105565b90965094506121b19350505050565b5f809350935050506121b1565b5f63ffffffff82111561219b576040516306dfcc6560e41b81526020600482015260248101839052604401610e05565b606060ff831461296a57612963836131c6565b9050610a63565b81805461297690613d79565b80601f01602080910402602001604051908101604052809291908181526020018280546129a290613d79565b80156129ed5780601f106129c4576101008083540402835291602001916129ed565b820191905f5260205f20905b8154815290600101906020018083116129d057829003601f168201915b50505050509050610a63565b805115612a0857805160208201fd5b60405163d6bda27560e01b815260040160405180910390fd5b5f805f612a2e8686613203565b91509150815f03612a5257838181612a4857612a48614204565b0492505050611289565b818411612a6957612a69600385150260111861234a565b5f848688095f868103871696879004966002600389028118808a02820302808a02820302808a02820302808a02820302808a02820302808a02909103029181900381900460010185841190960395909502919093039390930492909217029150509392505050565b82545f9081908015612bc7575f612aed87611ed1600185614136565b805490915065ffffffffffff80821691600160301b90046001600160d01b0316908816821115612b3057604051632520601d60e01b815260040160405180910390fd5b8765ffffffffffff168265ffffffffffff1603612b6957825465ffffffffffff16600160301b6001600160d01b03891602178355612bb9565b6040805180820190915265ffffffffffff808a1682526001600160d01b03808a1660208085019182528d54600181018f555f8f81529190912094519151909216600160301b029216919091179101555b94508593506121b192505050565b50506040805180820190915265ffffffffffff80851682526001600160d01b0380851660208085019182528854600181018a555f8a815291822095519251909316600160301b0291909316179201919091559050816121b1565b5f81815260096020526040812060028101546001820154612c429190614037565b612c4e6109ae85610d83565b11159392505050565b5f80612c65868686866112ba565b9050612cb381612c7560076115af565b612c7f60066115af565b612c8960026115af565b6001612c96600782614218565b612ca1906002614311565b612cab9190614136565b1818186115d1565b505f818152600460205260409081902080546001600160f81b0316600160f81b179055517f789cf55be980739dad1d0699b93b58e806b51c9d96619bfa8fe0a28abaa7b30c90610d729083815260200190565b5f306001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016148015612d5e57507f000000000000000000000000000000000000000000000000000000000000000046145b15612d8857507f000000000000000000000000000000000000000000000000000000000000000090565b6109f8604080517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60208201527f0000000000000000000000000000000000000000000000000000000000000000918101919091527f000000000000000000000000000000000000000000000000000000000000000060608201524660808201523060a08201525f9060c00160405160208183030381529060405280519060200120905090565b5f805f8351604103612e66576020840151604085015160608601515f1a612e588882858561321f565b955095509550505050612e71565b505081515f91506002905b9250925092565b5f805f856001600160a01b03168585604051602401612e9892919061431f565b60408051601f198184030181529181526020820180516001600160e01b0316630b135d3f60e11b17905251612ecd9190614337565b5f60405180830381855afa9150503d805f8114612f05576040519150601f19603f3d011682016040523d82523d5f602084013e612f0a565b606091505b5091509150818015612f1e57506020815110155b801561109957508051630b135d3f60e11b90612f43908301602090810190840161411f565b149695505050505050565b5f60018211612f5b575090565b816001600160801b8210612f745760809190911c9060401b5b680100000000000000008210612f8f5760409190911c9060201b5b6401000000008210612fa65760209190911c9060101b5b620100008210612fbb5760109190911c9060081b5b6101008210612fcf5760089190911c9060041b5b60108210612fe25760049190911c9060021b5b60048210612fee5760011b5b600302600190811c9081858161300657613006614204565b048201901c9050600181858161301e5761301e614204565b048201901c9050600181858161303657613036614204565b048201901c9050600181858161304e5761304e614204565b048201901c9050600181858161306657613066614204565b048201901c9050600181858161307e5761307e614204565b048201901c905061309d81858161309757613097614204565b04821190565b90039392505050565b5f5b818310156130fd575f6130bb84846132e7565b5f8781526020902090915065ffffffffffff86169082015465ffffffffffff1611156130e9578092506130f7565b6130f4816001614037565b93505b506130a8565b509392505050565b5f808481613114866001614037565b8511801561313c575061060f60f31b6131308388016020015190565b6001600160f01b031916145b90505f61314c82151560026141ed565b90505f8061315a838a614037565b90505b878110156131b5575f61317b6131768784016020015190565b613301565b9050600f8160ff16111561319a575f80975097505050505050506121b1565b6131a56010846141ed565b60ff90911601915060010161315d565b506001999098509650505050505050565b60605f6131d283613379565b6040805160208082528183019092529192505f91906020820181803683375050509182525060208101929092525090565b5f805f1983850993909202808410938190039390930393915050565b5f80807f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a084111561325857505f915060039050826132dd565b604080515f808252602082018084528a905260ff891692820192909252606081018790526080810186905260019060a0016020604051602081039080840390855afa1580156132a9573d5f803e3d5ffd5b5050604051601f1901519150506001600160a01b0381166132d457505f9250600191508290506132dd565b92505f91508190505b9450945094915050565b5f6132f5600284841861434d565b61128990848416614037565b5f60f882901c602f8111801561331a5750603a8160ff16105b1561332857602f1901610a63565b60608160ff1611801561333e575060678160ff16105b1561334c5760561901610a63565b60408160ff16118015613362575060478160ff16105b156133705760361901610a63565b5060ff92915050565b5f60ff8216601f811115610a6357604051632cd44ac360e21b815260040160405180910390fd5b5f602082840312156133b0575f80fd5b81356001600160e01b031981168114611289575f80fd5b5f602082840312156133d7575f80fd5b5035919050565b5f81518084528060208401602086015e5f602082860101526020601f19601f83011685010191505092915050565b602081525f61128960208301846133de565b6001600160a01b0381168114610a7a575f80fd5b634e487b7160e01b5f52604160045260245ffd5b604051601f8201601f191681016001600160401b038111828210171561346e5761346e613432565b604052919050565b5f6001600160401b0382111561348e5761348e613432565b50601f01601f191660200190565b5f6134ae6134a984613476565b613446565b90508281528383830111156134c1575f80fd5b828260208301375f602084830101529392505050565b5f82601f8301126134e6575f80fd5b6112898383356020850161349c565b5f805f8060808587031215613508575f80fd5b84356135138161341e565b935060208501356135238161341e565b92506040850135915060608501356001600160401b03811115613544575f80fd5b613550878288016134d7565b91505092959194509250565b5f6001600160401b0382111561357457613574613432565b5060051b60200190565b5f82601f83011261358d575f80fd5b8135602061359d6134a98361355c565b8083825260208201915060208460051b8701019350868411156135be575f80fd5b602086015b848110156135e35780356135d68161341e565b83529183019183016135c3565b509695505050505050565b5f82601f8301126135fd575f80fd5b8135602061360d6134a98361355c565b8083825260208201915060208460051b87010193508684111561362e575f80fd5b602086015b848110156135e35780358352918301918301613633565b5f82601f830112613659575f80fd5b813560206136696134a98361355c565b82815260059290921b84018101918181019086841115613687575f80fd5b8286015b848110156135e35780356001600160401b038111156136a8575f80fd5b6136b68986838b01016134d7565b84525091830191830161368b565b5f805f80608085870312156136d7575f80fd5b84356001600160401b03808211156136ed575f80fd5b6136f98883890161357e565b9550602087013591508082111561370e575f80fd5b61371a888389016135ee565b9450604087013591508082111561372f575f80fd5b5061373c8782880161364a565b949793965093946060013593505050565b634e487b7160e01b5f52602160045260245ffd5b6008811061377d57634e487b7160e01b5f52602160045260245ffd5b9052565b60208101610a638284613761565b5f80604083850312156137a0575f80fd5b8235915060208301356137b28161341e565b809150509250929050565b803560ff81168114610ee0575f80fd5b5f80604083850312156137de575f80fd5b823591506137ee602084016137bd565b90509250929050565b5f8083601f840112613807575f80fd5b5081356001600160401b0381111561381d575f80fd5b602083019150836020828501011115613834575f80fd5b9250929050565b5f805f805f805f60c0888a031215613851575f80fd5b87359650613861602089016137bd565b955060408801356138718161341e565b945060608801356001600160401b038082111561388c575f80fd5b6138988b838c016137f7565b909650945060808a01359150808211156138b0575f80fd5b6138bc8b838c016134d7565b935060a08a01359150808211156138d1575f80fd5b506138de8a828b016134d7565b91505092959891949750929550565b5f805f805f60808688031215613901575f80fd5b85359450613911602087016137bd565b935060408601356001600160401b038082111561392c575f80fd5b61393889838a016137f7565b90955093506060880135915080821115613950575f80fd5b5061395d888289016134d7565b9150509295509295909350565b65ffffffffffff81168114610a7a575f80fd5b5f6020828403121561398d575f80fd5b81356112898161396a565b5f805f80606085870312156139ab575f80fd5b843593506139bb602086016137bd565b925060408501356001600160401b038111156139d5575f80fd5b6139e1878288016137f7565b95989497509550505050565b5f805f8060808587031215613a00575f80fd5b84356001600160401b0380821115613a16575f80fd5b613a228883890161357e565b95506020870135915080821115613a37575f80fd5b613a43888389016135ee565b94506040870135915080821115613a58575f80fd5b613a648883890161364a565b93506060870135915080821115613a79575f80fd5b508501601f81018713613a8a575f80fd5b6135508782356020840161349c565b5f60208284031215613aa9575f80fd5b81356112898161341e565b5f815180845260208085019450602084015f5b83811015613ae357815187529582019590820190600101613ac7565b509495945050505050565b60ff60f81b8816815260e060208201525f613b0c60e08301896133de565b8281036040840152613b1e81896133de565b606084018890526001600160a01b038716608085015260a0840186905283810360c08501529050613b4f8185613ab4565b9a9950505050505050505050565b5f805f8060808587031215613b70575f80fd5b84359350613b80602086016137bd565b92506040850135613b908161341e565b915060608501356001600160401b03811115613544575f80fd5b5f805f60608486031215613bbc575f80fd5b8335613bc78161341e565b92506020840135915060408401356001600160401b03811115613be8575f80fd5b613bf4868287016134d7565b9150509250925092565b5f805f805f60a08688031215613c12575f80fd5b8535613c1d8161341e565b94506020860135613c2d8161341e565b935060408601356001600160401b0380821115613c48575f80fd5b613c5489838a016135ee565b94506060880135915080821115613c69575f80fd5b613c7589838a016135ee565b93506080880135915080821115613950575f80fd5b5f805f8060608587031215613c9d575f80fd5b8435613ca88161341e565b93506020850135925060408501356001600160401b038111156139d5575f80fd5b5f60208284031215613cd9575f80fd5b813563ffffffff81168114611289575f80fd5b5f8060408385031215613cfd575f80fd5b8235613d088161341e565b946020939093013593505050565b5f805f805f60a08688031215613d2a575f80fd5b8535613d358161341e565b94506020860135613d458161341e565b9350604086013592506060860135915060808601356001600160401b03811115613d6d575f80fd5b61395d888289016134d7565b600181811c90821680613d8d57607f821691505b602082108103613dab57634e487b7160e01b5f52602260045260245ffd5b50919050565b634e487b7160e01b5f52603260045260245ffd5b5f60208284031215613dd5575f80fd5b81516001600160401b03811115613dea575f80fd5b8201601f81018413613dfa575f80fd5b8051613e086134a982613476565b818152856020838501011115613e1c575f80fd5b8160208401602083015e5f91810160200191909152949350505050565b634e487b7160e01b5f52601160045260245ffd5b65ffffffffffff828116828216039080821115613e6c57613e6c613e39565b5092915050565b5f60208284031215613e83575f80fd5b81516112898161396a565b65ffffffffffff818116838216019080821115613e6c57613e6c613e39565b818382375f9101908152919050565b5f815180845260208085019450602084015f5b83811015613ae35781516001600160a01b031687529582019590820190600101613ecf565b5f8282518085526020808601955060208260051b840101602086015f5b84811015613f3f57601f19868403018952613f2d8383516133de565b98840198925090830190600101613f11565b5090979650505050505050565b608081525f613f5e6080830187613ebc565b8281036020840152613f708187613ab4565b90508281036040840152613f848186613ef4565b91505082606083015295945050505050565b83815260608101613faa6020830185613761565b826040830152949350505050565b5f60208284031215613fc8575f80fd5b81518015158114611289575f80fd5b84815260ff84166020820152826040820152608060608201525f61109960808301846133de565b85815260ff8516602082015283604082015260a060608201525f61402560a08301856133de565b8281036080840152610fe281856133de565b80820180821115610a6357610a63613e39565b5f6101208b8352602060018060a01b038c16818501528160408501526140728285018c613ebc565b91508382036060850152614086828b613ab4565b915083820360808501528189518084528284019150828160051b850101838c015f5b838110156140d657601f198784030185526140c48383516133de565b948601949250908501906001016140a8565b505086810360a08801526140ea818c613ef4565b9450505050508560c08401528460e084015282810361010084015261410f81856133de565b9c9b505050505050505050505050565b5f6020828403121561412f575f80fd5b5051919050565b81810381811115610a6357610a63613e39565b60a081525f61415b60a0830188613ebc565b828103602084015261416d8188613ab4565b905082810360408401526141818187613ef4565b60608401959095525050608001529392505050565b60c081525f6141a860c0830189613ebc565b82810360208401526141ba8189613ab4565b905082810360408401526141ce8188613ef4565b60608401969096525050608081019290925260a0909101529392505050565b8082028115828204841417610a6357610a63613e39565b634e487b7160e01b5f52601260045260245ffd5b60ff8181168382160190811115610a6357610a63613e39565b600181815b8085111561426b57815f190482111561425157614251613e39565b8085161561425e57918102915b93841c9390800290614236565b509250929050565b5f8261428157506001610a63565b8161428d57505f610a63565b81600181146142a357600281146142ad576142c9565b6001915050610a63565b60ff8411156142be576142be613e39565b50506001821b610a63565b5060208310610133831016604e8410600b84101617156142ec575081810a610a63565b6142f68383614231565b805f190482111561430957614309613e39565b029392505050565b5f61128960ff841683614273565b828152604060208201525f61128660408301846133de565b5f82518060208501845e5f920191825250919050565b5f8261436757634e487b7160e01b5f52601260045260245ffd5b50049056fea26469706673582212200e577ee648bbab30fd24d7c050f642f510a880b79099615f0ddbf142568aedfa64736f6c63430008190033a2646970667358221220270332aaa61d60bb95dcc410c9204c4d502dffa3afec121e19ed111ab5fa3aee64736f6c63430008190033",
    "d570b3ba0334669d16e95c0652ccd20987e3c2353fd78304da4ed4b0a8c4c305": "0xf869a0204b24eae4a02d3987ca887631704554f37941d36d88eba3861c6e365c7804a5b846f8440180a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a06b0bda6cb468cdf4552961026a3ef1430be262f66743b2369ff6c6b6176ea942",
    "d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd547": "0xf851808080808080a057ec08b8f040499409fb0220f538477790d4f010c4bb51a8dbae5da3537a86a480a0d570b3ba0334669d16e95c0652ccd20987e3c2353fd78304da4ed4b0a8c4c3058080808080808080",
    "bdee09e5efab5a219c5b85debdfd48b9d96e45f00f67d35e60ca107020b8f816": "0xf90131a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da5315808080a05492888cc7c534f4fd1f9f803a9c0c9b14a3aa268d7aa1a226c0b5a2df295078808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba09d1b5f3c8944300dda9eec33376308282aa06c11d3fdc640669ce5e506edb797a069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "d40e700fcd3a8d929df50d704451eab3f356e9cf96cdcc3f218243fa84234828": "0xf872a03931b4ed56ace4c46b68524cb5bcbf4195f1bbaacbe5228fbd090546c88dd229b84ff84d0189056bc75e2d628138aea056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "334bab45a39924c9512454a5515cc57a2b6b5520bbdfb918c0e6cf71d0c95f6e": "0xf90131a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da5315808080a0d40e700fcd3a8d929df50d704451eab3f356e9cf96cdcc3f218243fa84234828808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba09d1b5f3c8944300dda9eec33376308282aa06c11d3fdc640669ce5e506edb797a069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "703b1f1cd03a5077a6c34c37ba334d461a06bb6f87615f61037694a5bfae82b0": "0xf86ca020a40a9004224e397238839b469142c546607ee7a8b114ded86182fceae00e35b849f84780834763a9a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "154516aeb9deaf97a2cf41454ced6e394d4fe70ca4ea748e0d5cdca2c789066c": "0xf87180a0cdeaf028a7a2894d4778d6c412bfb95e81b23c2e6044f4c5d6de2ed8a50f78f3808080808080808080a082f6e0ef9d3ec62e68c811432d52e6e0c907d604aed5a2a561d95e393f487d688080a0703b1f1cd03a5077a6c34c37ba334d461a06bb6f87615f61037694a5bfae82b08080",
    "dc069001577a1e4c96ff8343bcd284111eb28e10e8f7bf55c800031a76ba4ebc": "0xf90131a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da5315808080a0d40e700fcd3a8d929df50d704451eab3f356e9cf96cdcc3f218243fa84234828808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba0154516aeb9deaf97a2cf41454ced6e394d4fe70ca4ea748e0d5cdca2c789066ca069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "52228fb9c7e96542bb498e69fd37eabc8dd2bf94a2f1f6fb2a84eaf1826e9ec9": "0xf872a03931b4ed56ace4c46b68524cb5bcbf4195f1bbaacbe5228fbd090546c88dd229b84ff84d8089056bc75e2d626bcdfaa056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "33d9a3a1c124ddc1ea5b0ba400720f2315c1225c59116ce158e7ff601aae654c": "0xf90131a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da5315808080a052228fb9c7e96542bb498e69fd37eabc8dd2bf94a2f1f6fb2a84eaf1826e9ec9808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba09d1b5f3c8944300dda9eec33376308282aa06c11d3fdc640669ce5e506edb797a069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a05f1ef1b2e89b5ed4e71249e76600493c718bc6c6030189bfab281c7b85389a2c80",
    "3f21426de77b26462180cf634930e5e26e4c3074217482ee818ac25d108248da": "0xf872a03931b4ed56ace4c46b68524cb5bcbf4195f1bbaacbe5228fbd090546c88dd229b84ff84d0189056bc75e2d626bcdfaa056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "7ed4e2e4c64bd9f912565fd06f0454229c1851f4611fea1eaf10be3d3efa774f": "0xf90131a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da5315808080a03f21426de77b26462180cf634930e5e26e4c3074217482ee818ac25d108248da808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba09d1b5f3c8944300dda9eec33376308282aa06c11d3fdc640669ce5e506edb797a069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a05f1ef1b2e89b5ed4e71249e76600493c718bc6c6030189bfab281c7b85389a2c80",
    "3aede47941c7b71370d318b835c4a667eb72ee8e0b86955a13cd19da133d0063": "0xf90131a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da5315808080a03f21426de77b26462180cf634930e5e26e4c3074217482ee818ac25d108248da808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba09d1b5f3c8944300dda9eec33376308282aa06c11d3fdc640669ce5e506edb797a069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a08ebfa1bb8d7f17c4c7b061298856df0d764d78874df9bbee0e2607b97a282e6f80",
    "6889ceab6cb3247c99b019c4e820bfbc23e9decd4a75929651a040f4f9143f72": "0xf90131a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da5315808080a03f21426de77b26462180cf634930e5e26e4c3074217482ee818ac25d108248da808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba09d1b5f3c8944300dda9eec33376308282aa06c11d3fdc640669ce5e506edb797a069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a078411d2196a2e4c560372788d3e499d0b71f36204f1961a41ef216a7fd574e9580",
    "17c498a1aeb1d7232ffb197286c1eaa43931a623ebe427a09ad70ffc0c356018": "0xf90131a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da5315808080a03f21426de77b26462180cf634930e5e26e4c3074217482ee818ac25d108248da808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba09d1b5f3c8944300dda9eec33376308282aa06c11d3fdc640669ce5e506edb797a069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "588a295005c51b31519ee13ec361e42ca021000f24fd4f39385f48ff33a82d13": "0xf872a03931b4ed56ace4c46b68524cb5bcbf4195f1bbaacbe5228fbd090546c88dd229b84ff84d0189056bc75e2d569576aea056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "036c3bcbfe783f845e9ee743c69f4fae9b45fa770a827d37405d926363e3c52f": "0xf90131a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da5315808080a0588a295005c51b31519ee13ec361e42ca021000f24fd4f39385f48ff33a82d13808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba0154516aeb9deaf97a2cf41454ced6e394d4fe70ca4ea748e0d5cdca2c789066ca069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "f9ab5326485b883505d6c1ada540e260ea34a4e13264163e73ba6c403be8c749": "0xf872a03931b4ed56ace4c46b68524cb5bcbf4195f1bbaacbe5228fbd090546c88dd229b84ff84d0289056bc75e2d569576aea056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "6a9cb2478de61103161017dcad345a15ab593d395a26b316951f3d10bd793fea": "0xf90131a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da5315808080a0f9ab5326485b883505d6c1ada540e260ea34a4e13264163e73ba6c403be8c749808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba0154516aeb9deaf97a2cf41454ced6e394d4fe70ca4ea748e0d5cdca2c789066ca069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "9bc616838d2ecc05ecb41f663fdf836a41c06b664e7e396ca7070529929baa67": "0xf869a0316b506e84fe0b6653198cc90a371af0f67345338c9c7ebc83779f1ac00e1bedb846f8448080a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "a499a07a0f63546f1c0aa2324481fa1e3ca7d71a2317a2b7f405ca3df239967d": "0xf90151a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da531580a09bc616838d2ecc05ecb41f663fdf836a41c06b664e7e396ca7070529929baa6780a0f9ab5326485b883505d6c1ada540e260ea34a4e13264163e73ba6c403be8c749808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba0154516aeb9deaf97a2cf41454ced6e394d4fe70ca4ea748e0d5cdca2c789066ca069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "2fdd73e8bd59143b50c97a3b2170b4b708ce7cff7f321377e22f2025175cd4e0": "0xf869a0316b506e84fe0b6653198cc90a371af0f67345338c9c7ebc83779f1ac00e1bedb846f8440180a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "4c2aacf17e33413d40cd7b8197adbe72724c30b1016771a5b64fda86293d8222": "0xf90151a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da531580a02fdd73e8bd59143b50c97a3b2170b4b708ce7cff7f321377e22f2025175cd4e080a0f9ab5326485b883505d6c1ada540e260ea34a4e13264163e73ba6c403be8c749808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba0154516aeb9deaf97a2cf41454ced6e394d4fe70ca4ea748e0d5cdca2c789066ca069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "63d5a1b58982137f655cb119f773754d42eb90ae10bc12071e60d5b2906ec064d2": "0x608060405234801561000f575f80fd5b506004361061004a575f3560e01c80633e72891d1461004e578063473566621461007d57806371dccff214610090578063ec81aadb146100a3575b5f80fd5b61006161005c36600461037c565b6100b6565b6040516001600160a01b03909116815260200160405180910390f35b61006161008b366004610505565b61013f565b61006161009e3660046105ca565b610264565b6100616100b13660046105ca565b61028c565b5f808484846040516100c79061029a565b6100d39392919061060f565b604051809103905ff0801580156100ec573d5f803e3d5ffd5b506001805480820182555f919091527fb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf60180546001600160a01b0319166001600160a01b03831617905595945050505050565b82515f90818167ffffffffffffffff81111561015d5761015d6102cb565b604051908082528060200260200182016040528015610186578160200160208202803683370190505b5090505f5b828110156101d2578581815181106101a5576101a561064e565b60200260200101518282815181106101bf576101bf61064e565b602090810291909101015260010161018b565b505f8989898985896040516101e6906102a7565b6101f59695949392919061069c565b604051809103905ff08015801561020e573d5f803e3d5ffd5b505f80546001810182559080527f290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e5630180546001600160a01b0319166001600160a01b0383161790559a9950505050505050505050565b60018181548110610273575f80fd5b5f918252602090912001546001600160a01b0316905081565b5f8181548110610273575f80fd5b6126788061073d83390190565b612d7380612db583390190565b6001600160a01b03811681146102c8575f80fd5b50565b634e487b7160e01b5f52604160045260245ffd5b604051601f8201601f1916810167ffffffffffffffff81118282101715610308576103086102cb565b604052919050565b5f82601f83011261031f575f80fd5b813567ffffffffffffffff811115610339576103396102cb565b61034c601f8201601f19166020016102df565b818152846020838601011115610360575f80fd5b816020850160208301375f918101602001919091529392505050565b5f805f6060848603121561038e575f80fd5b8335610399816102b4565b9250602084013567ffffffffffffffff808211156103b5575f80fd5b6103c187838801610310565b935060408601359150808211156103d6575f80fd5b506103e386828701610310565b9150509250925092565b803560ff811681146103fd575f80fd5b919050565b5f67ffffffffffffffff82111561041b5761041b6102cb565b5060051b60200190565b5f82601f830112610434575f80fd5b8135602061044961044483610402565b6102df565b8083825260208201915060208460051b87010193508684111561046a575f80fd5b602086015b8481101561048f578035610482816102b4565b835291830191830161046f565b509695505050505050565b5f82601f8301126104a9575f80fd5b813560206104b961044483610402565b8083825260208201915060208460051b8701019350868411156104da575f80fd5b602086015b8481101561048f57803583529183019183016104df565b803580151581146103fd575f80fd5b5f805f805f8060c0878903121561051a575f80fd5b863567ffffffffffffffff80821115610531575f80fd5b61053d8a838b01610310565b97506020890135915080821115610552575f80fd5b61055e8a838b01610310565b965061056c60408a016103ed565b95506060890135915080821115610581575f80fd5b61058d8a838b01610425565b945060808901359150808211156105a2575f80fd5b506105af89828a0161049a565b9250506105be60a088016104f6565b90509295509295509295565b5f602082840312156105da575f80fd5b5035919050565b5f81518084528060208401602086015e5f602082860101526020601f19601f83011685010191505092915050565b6001600160a01b03841681526060602082018190525f90610632908301856105e1565b828103604084015261064481856105e1565b9695505050505050565b634e487b7160e01b5f52603260045260245ffd5b5f815180845260208085019450602084015f5b8381101561069157815187529582019590820190600101610675565b509495945050505050565b60c081525f6106ae60c08301896105e1565b602083820360208501526106c2828a6105e1565b60ff89166040860152848103606086015287518082526020808a019450909101905f5b8181101561070a5784516001600160a01b0316835293830193918301916001016106e5565b5050848103608086015261071e8188610662565b935050505061073160a083018415159052565b97965050505050505056fe610180604052348015610010575f80fd5b5060405161267838038061267883398101604081905261002f9161027e565b828280604051806040016040528060018152602001603160f81b8152508585816003908161005d919061037e565b50600461006a828261037e565b5061007a91508390506005610173565b61012052610089816006610173565b61014052815160208084019190912060e052815190820120610100524660a05261011560e05161010051604080517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60208201529081019290925260608201524660808201523060a08201525f9060c00160405160208183030381529060405280519060200120905090565b60805250503060c08190526001600160a01b0383160390506101515760405163438d6fe360e01b81523060048201526024015b60405180910390fd5b6001600160a01b0316610160525050600b805460ff60a01b1916905550610495565b5f60208351101561018e57610187836101a5565b905061019f565b81610199848261037e565b5060ff90505b92915050565b5f80829050601f815111156101cf578260405163305a27a960e01b8152600401610148919061043d565b80516101da82610472565b179392505050565b634e487b7160e01b5f52604160045260245ffd5b5f82601f830112610205575f80fd5b81516001600160401b038082111561021f5761021f6101e2565b604051601f8301601f19908116603f01168101908282118183101715610247576102476101e2565b8160405283815286602085880101111561025f575f80fd5b8360208701602083015e5f602085830101528094505050505092915050565b5f805f60608486031215610290575f80fd5b83516001600160a01b03811681146102a6575f80fd5b60208501519093506001600160401b03808211156102c2575f80fd5b6102ce878388016101f6565b935060408601519150808211156102e3575f80fd5b506102f0868287016101f6565b9150509250925092565b600181811c9082168061030e57607f821691505b60208210810361032c57634e487b7160e01b5f52602260045260245ffd5b50919050565b601f82111561037957805f5260205f20601f840160051c810160208510156103575750805b601f840160051c820191505b81811015610376575f8155600101610363565b50505b505050565b81516001600160401b03811115610397576103976101e2565b6103ab816103a584546102fa565b84610332565b602080601f8311600181146103de575f84156103c75750858301515b5f19600386901b1c1916600185901b178555610435565b5f85815260208120601f198616915b8281101561040c578886015182559484019460019091019084016103ed565b508582101561042957878501515f19600388901b60f8161c191681555b505060018460011b0185555b505050505050565b602081525f82518060208401528060208501604085015e5f604082850101526040601f19601f83011684010191505092915050565b8051602080830151919081101561032c575f1960209190910360031b1b16919050565b60805160a05160c05160e051610100516101205161014051610160516121736105055f395f8181610304015281816105b2015281816106610152610cb901525f61104001525f61101301525f610e1901525f610df101525f610d4c01525f610d7601525f610da001526121735ff3fe608060405234801561000f575f80fd5b50600436106101bb575f3560e01c8063704b6c02116100f35780639ab24eb011610093578063d505accf1161006e578063d505accf14610423578063dd62ed3e14610436578063f1127ed81461046e578063f851a440146104ad575f80fd5b80639ab24eb0146103ea578063a9059cbb146103fd578063c3cda52014610410575f80fd5b806384b0196e116100ce57806384b0196e1461039e5780638e539e8c146103b957806391ddadf4146103cc57806395d89b41146103e2575f80fd5b8063704b6c021461035057806370a08231146103635780637ecebe001461038b575f80fd5b80633644e5151161015e578063587cde1e11610139578063587cde1e146102aa5780635c19a95c146102ed5780636f307dc3146103025780636fcfff4514610328575f80fd5b80633644e515146102655780633a46b1a81461026d5780634bf5d7e914610280575f80fd5b8063205c287811610199578063205c28781461021257806323b872dd146102255780632f4f21e214610238578063313ce5671461024b575f80fd5b806306fdde03146101bf578063095ea7b3146101dd57806318160ddd14610200575b5f80fd5b6101c76104c0565b6040516101d49190611d81565b60405180910390f35b6101f06101eb366004611da9565b610550565b60405190151581526020016101d4565b6002545b6040519081526020016101d4565b6101f0610220366004611da9565b610569565b6101f0610233366004611dd1565b6105e1565b6101f0610246366004611da9565b610604565b610253610692565b60405160ff90911681526020016101d4565b6102046106a0565b61020461027b366004611da9565b6106a9565b60408051808201909152600e81526d06d6f64653d74696d657374616d760941b60208201526101c7565b6102d56102b8366004611e0a565b6001600160a01b039081165f908152600860205260409020541690565b6040516001600160a01b0390911681526020016101d4565b6103006102fb366004611e0a565b6106e3565b005b7f00000000000000000000000000000000000000000000000000000000000000006102d5565b61033b610336366004611e0a565b6106f2565b60405163ffffffff90911681526020016101d4565b61030061035e366004611e0a565b6106fc565b610204610371366004611e0a565b6001600160a01b03165f9081526020819052604090205490565b610204610399366004611e0a565b610809565b6103a6610813565b6040516101d49796959493929190611e23565b6102046103c7366004611eba565b610855565b60405165ffffffffffff421681526020016101d4565b6101c7610879565b6102046103f8366004611e0a565b610888565b6101f061040b366004611da9565b6108a8565b61030061041e366004611ee2565b6108b5565b610300610431366004611f38565b610971565b610204610444366004611fa0565b6001600160a01b039182165f90815260016020908152604080832093909416825291909152205490565b61048161047c366004611fd1565b610aa7565b60408051825165ffffffffffff1681526020928301516001600160d01b031692810192909252016101d4565b600b546102d5906001600160a01b031681565b6060600380546104cf9061200e565b80601f01602080910402602001604051908101604052809291908181526020018280546104fb9061200e565b80156105465780601f1061051d57610100808354040283529160200191610546565b820191905f5260205f20905b81548152906001019060200180831161052957829003601f168201915b5050505050905090565b5f3361055d818585610acb565b60019150505b92915050565b5f306001600160a01b038416036105a35760405163ec442f0560e01b81526001600160a01b03841660048201526024015b60405180910390fd5b6105ad3383610add565b6105d87f00000000000000000000000000000000000000000000000000000000000000008484610b11565b50600192915050565b5f336105ee858285610b70565b6105f9858585610bec565b506001949350505050565b5f3330810361062857604051634b637e8f60e11b815230600482015260240161059a565b306001600160a01b0385160361065c5760405163ec442f0560e01b81526001600160a01b038516600482015260240161059a565b6106887f0000000000000000000000000000000000000000000000000000000000000000823086610c49565b61055d8484610c82565b5f61069b610cb6565b905090565b5f61069b610d40565b5f6106d36106b683610e69565b6001600160a01b0385165f90815260096020526040902090610ead565b6001600160d01b03169392505050565b336106ee8183610f5d565b5050565b5f61056382610fce565b600b54600160a01b900460ff161561076e5760405162461bcd60e51b815260206004820152602f60248201527f484245564d5f577261707065645f546f6b656e3a2061646d696e20686173206160448201526e1b1c9958591e481899595b881cd95d608a1b606482015260840161059a565b6001600160a01b0381166107e25760405162461bcd60e51b815260206004820152603560248201527f484245564d5f577261707065645f546f6b656e3a206e65772061646d696e20616044820152746464726573732063616e6e6f74206265207a65726f60581b606482015260840161059a565b600b80546001600160a81b0319166001600160a01b0390921691909117600160a01b179055565b5f61056382610fef565b5f6060805f805f606061082461100c565b61082c611039565b604080515f80825260208201909252600f60f81b9b939a50919850469750309650945092509050565b5f61086a61086283610e69565b600a90610ead565b6001600160d01b031692915050565b6060600480546104cf9061200e565b6001600160a01b0381165f90815260096020526040812061086a90611066565b5f3361055d818585610bec565b834211156108d957604051632341d78760e11b81526004810185905260240161059a565b604080517fe48329057bfd03d55e49b547132e39cffd9c1820ad7b9d4c5307691425d15adf60208201526001600160a01b0388169181019190915260608101869052608081018590525f906109529061094a9060a0016040516020818303038152906040528051906020012061109d565b8585856110c9565b905061095e81876110f5565b6109688188610f5d565b50505050505050565b834211156109955760405163313c898160e11b81526004810185905260240161059a565b5f7f6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c98888886109e08c6001600160a01b03165f90815260076020526040902080546001810190915590565b6040805160208101969096526001600160a01b0394851690860152929091166060840152608083015260a082015260c0810186905260e0016040516020818303038152906040528051906020012090505f610a3a8261109d565b90505f610a49828787876110c9565b9050896001600160a01b0316816001600160a01b031614610a90576040516325c0072360e11b81526001600160a01b0380831660048301528b16602482015260440161059a565b610a9b8a8a8a610acb565b50505050505050505050565b604080518082019091525f8082526020820152610ac48383611147565b9392505050565b610ad8838383600161117b565b505050565b6001600160a01b038216610b0657604051634b637e8f60e11b81525f600482015260240161059a565b6106ee825f8361124d565b6040516001600160a01b03838116602483015260448201839052610ad891859182169063a9059cbb906064015b604051602081830303815290604052915060e01b6020820180516001600160e01b038381831617835250505050611258565b6001600160a01b038381165f908152600160209081526040808320938616835292905220545f19811015610be65781811015610bd857604051637dc7a0d960e11b81526001600160a01b0384166004820152602481018290526044810183905260640161059a565b610be684848484035f61117b565b50505050565b6001600160a01b038316610c1557604051634b637e8f60e11b81525f600482015260240161059a565b6001600160a01b038216610c3e5760405163ec442f0560e01b81525f600482015260240161059a565b610ad883838361124d565b6040516001600160a01b038481166024830152838116604483015260648201839052610be69186918216906323b872dd90608401610b3e565b6001600160a01b038216610cab5760405163ec442f0560e01b81525f600482015260240161059a565b6106ee5f838361124d565b5f7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663313ce5676040518163ffffffff1660e01b8152600401602060405180830381865afa925050508015610d31575060408051601f3d908101601f19168201909252610d2e91810190612046565b60015b610d3b5750601290565b919050565b5f306001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016148015610d9857507f000000000000000000000000000000000000000000000000000000000000000046145b15610dc257507f000000000000000000000000000000000000000000000000000000000000000090565b61069b604080517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60208201527f0000000000000000000000000000000000000000000000000000000000000000918101919091527f000000000000000000000000000000000000000000000000000000000000000060608201524660808201523060a08201525f9060c00160405160208183030381529060405280519060200120905090565b5f4265ffffffffffff81168310610ea457604051637669fc0f60e11b81526004810184905265ffffffffffff8216602482015260440161059a565b610ac4836112c4565b81545f9081816005811115610f09575f610ec6846112fa565b610ed09085612075565b5f8881526020902090915081015465ffffffffffff9081169087161015610ef957809150610f07565b610f04816001612088565b92505b505b5f610f1687878585611452565b90508015610f5057610f3a87610f2d600184612075565b5f91825260209091200190565b54600160301b90046001600160d01b0316610f52565b5f5b979650505050505050565b6001600160a01b038281165f8181526008602052604080822080548686166001600160a01b0319821681179092559151919094169392849290917f3134e8a2e6d97e929a7e54011ea5485d7d196dd5f0ba4d4ef95803e8e3fc257f9190a4610ad88183610fc9866114b1565b6114ce565b6001600160a01b0381165f9081526009602052604081205461056390611637565b6001600160a01b0381165f90815260076020526040812054610563565b606061069b7f00000000000000000000000000000000000000000000000000000000000000006005611667565b606061069b7f00000000000000000000000000000000000000000000000000000000000000006006611667565b80545f9080156110955761107f83610f2d600184612075565b54600160301b90046001600160d01b0316610ac4565b5f9392505050565b5f6105636110a9610d40565b8360405161190160f01b8152600281019290925260228201526042902090565b5f805f806110d988888888611710565b9250925092506110e982826117d8565b50909695505050505050565b6001600160a01b0382165f908152600760205260409020805460018101909155818114610ad8576040516301d4b62360e61b81526001600160a01b03841660048201526024810182905260440161059a565b604080518082019091525f80825260208201526001600160a01b0383165f908152600960205260409020610ac49083611890565b6001600160a01b0384166111a45760405163e602df0560e01b81525f600482015260240161059a565b6001600160a01b0383166111cd57604051634a1406b160e11b81525f600482015260240161059a565b6001600160a01b038085165f9081526001602090815260408083209387168352929052208290558015610be657826001600160a01b0316846001600160a01b03167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9258460405161123f91815260200190565b60405180910390a350505050565b610ad88383836118fd565b5f8060205f8451602086015f885af180611277576040513d5f823e3d81fd5b50505f513d9150811561128e57806001141561129b565b6001600160a01b0384163b155b15610be657604051635274afe760e01b81526001600160a01b038516600482015260240161059a565b5f65ffffffffffff8211156112f6576040516306dfcc6560e41b8152603060048201526024810183905260440161059a565b5090565b5f60018211611307575090565b816001600160801b82106113205760809190911c9060401b5b68010000000000000000821061133b5760409190911c9060201b5b64010000000082106113525760209190911c9060101b5b6201000082106113675760109190911c9060081b5b610100821061137b5760089190911c9060041b5b6010821061138e5760049190911c9060021b5b6004821061139a5760011b5b600302600190811c908185816113b2576113b261209b565b048201901c905060018185816113ca576113ca61209b565b048201901c905060018185816113e2576113e261209b565b048201901c905060018185816113fa576113fa61209b565b048201901c905060018185816114125761141261209b565b048201901c9050600181858161142a5761142a61209b565b048201901c90506114498185816114435761144361209b565b04821190565b90039392505050565b5f5b818310156114a9575f6114678484611963565b5f8781526020902090915065ffffffffffff86169082015465ffffffffffff161115611495578092506114a3565b6114a0816001612088565b93505b50611454565b509392505050565b6001600160a01b0381165f90815260208190526040812054610563565b816001600160a01b0316836001600160a01b0316141580156114ef57505f81115b15610ad8576001600160a01b03831615611596576001600160a01b0383165f90815260096020526040812081906115319061197d61152c86611988565b6119bb565b6001600160d01b031691506001600160d01b03169150846001600160a01b03167fdec2bacdd2f05b59de34da9b523dff8be42e5e38e818c82fdb0bae774387a724838360405161158b929190918252602082015260400190565b60405180910390a250505b6001600160a01b03821615610ad8576001600160a01b0382165f90815260096020526040812081906115ce906119ec61152c86611988565b6001600160d01b031691506001600160d01b03169150836001600160a01b03167fdec2bacdd2f05b59de34da9b523dff8be42e5e38e818c82fdb0bae774387a7248383604051611628929190918252602082015260400190565b60405180910390a25050505050565b5f63ffffffff8211156112f6576040516306dfcc6560e41b8152602060048201526024810183905260440161059a565b606060ff83146116815761167a836119f7565b9050610563565b81805461168d9061200e565b80601f01602080910402602001604051908101604052809291908181526020018280546116b99061200e565b80156117045780601f106116db57610100808354040283529160200191611704565b820191905f5260205f20905b8154815290600101906020018083116116e757829003601f168201915b50505050509050610563565b5f80807f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a084111561174957505f915060039050826117ce565b604080515f808252602082018084528a905260ff891692820192909252606081018790526080810186905260019060a0016020604051602081039080840390855afa15801561179a573d5f803e3d5ffd5b5050604051601f1901519150506001600160a01b0381166117c557505f9250600191508290506117ce565b92505f91508190505b9450945094915050565b5f8260038111156117eb576117eb6120af565b036117f4575050565b6001826003811115611808576118086120af565b036118265760405163f645eedf60e01b815260040160405180910390fd5b600282600381111561183a5761183a6120af565b0361185b5760405163fce698f760e01b81526004810182905260240161059a565b600382600381111561186f5761186f6120af565b036106ee576040516335e2f38360e21b81526004810182905260240161059a565b604080518082019091525f8082526020820152825f018263ffffffff16815481106118bd576118bd6120c3565b5f9182526020918290206040805180820190915291015465ffffffffffff81168252600160301b90046001600160d01b0316918101919091529392505050565b611908838383611a34565b6001600160a01b038316611958575f61192060025490565b90506001600160d01b038082111561195557604051630e58ae9360e11b8152600481018390526024810182905260440161059a565b50505b610ad8838383611b5a565b5f61197160028484186120d7565b610ac490848416612088565b5f610ac482846120f6565b5f6001600160d01b038211156112f6576040516306dfcc6560e41b815260d060048201526024810183905260440161059a565b5f806119df426119d76119cd88611066565b868863ffffffff16565b879190611bcf565b915091505b935093915050565b5f610ac4828461211d565b60605f611a0383611bdc565b6040805160208082528183019092529192505f91906020820181803683375050509182525060208101929092525090565b6001600160a01b038316611a5e578060025f828254611a539190612088565b90915550611ace9050565b6001600160a01b0383165f9081526020819052604090205481811015611ab05760405163391434e360e21b81526001600160a01b0385166004820152602481018290526044810183905260640161059a565b6001600160a01b0384165f9081526020819052604090209082900390555b6001600160a01b038216611aea57600280548290039055611b08565b6001600160a01b0382165f9081526020819052604090208054820190555b816001600160a01b0316836001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051611b4d91815260200190565b60405180910390a3505050565b6001600160a01b038316611b7c57611b79600a6119ec61152c84611988565b50505b6001600160a01b038216611b9e57611b9b600a61197d61152c84611988565b50505b6001600160a01b038381165f90815260086020526040808220548584168352912054610ad8929182169116836114ce565b5f806119df858585611c03565b5f60ff8216601f81111561056357604051632cd44ac360e21b815260040160405180910390fd5b82545f9081908015611cf9575f611c1f87610f2d600185612075565b805490915065ffffffffffff80821691600160301b90046001600160d01b0316908816821115611c6257604051632520601d60e01b815260040160405180910390fd5b8765ffffffffffff168265ffffffffffff1603611c9b57825465ffffffffffff16600160301b6001600160d01b03891602178355611ceb565b6040805180820190915265ffffffffffff808a1682526001600160d01b03808a1660208085019182528d54600181018f555f8f81529190912094519151909216600160301b029216919091179101555b94508593506119e492505050565b50506040805180820190915265ffffffffffff80851682526001600160d01b0380851660208085019182528854600181018a555f8a815291822095519251909316600160301b0291909316179201919091559050816119e4565b5f81518084528060208401602086015e5f602082860101526020601f19601f83011685010191505092915050565b602081525f610ac46020830184611d53565b80356001600160a01b0381168114610d3b575f80fd5b5f8060408385031215611dba575f80fd5b611dc383611d93565b946020939093013593505050565b5f805f60608486031215611de3575f80fd5b611dec84611d93565b9250611dfa60208501611d93565b9150604084013590509250925092565b5f60208284031215611e1a575f80fd5b610ac482611d93565b60ff60f81b881681525f602060e06020840152611e4360e084018a611d53565b8381036040850152611e55818a611d53565b606085018990526001600160a01b038816608086015260a0850187905284810360c0860152855180825260208088019350909101905f5b81811015611ea857835183529284019291840191600101611e8c565b50909c9b505050505050505050505050565b5f60208284031215611eca575f80fd5b5035919050565b60ff81168114611edf575f80fd5b50565b5f805f805f8060c08789031215611ef7575f80fd5b611f0087611d93565b955060208701359450604087013593506060870135611f1e81611ed1565b9598949750929560808101359460a0909101359350915050565b5f805f805f805f60e0888a031215611f4e575f80fd5b611f5788611d93565b9650611f6560208901611d93565b955060408801359450606088013593506080880135611f8381611ed1565b9699959850939692959460a0840135945060c09093013592915050565b5f8060408385031215611fb1575f80fd5b611fba83611d93565b9150611fc860208401611d93565b90509250929050565b5f8060408385031215611fe2575f80fd5b611feb83611d93565b9150602083013563ffffffff81168114612003575f80fd5b809150509250929050565b600181811c9082168061202257607f821691505b60208210810361204057634e487b7160e01b5f52602260045260245ffd5b50919050565b5f60208284031215612056575f80fd5b8151610ac481611ed1565b634e487b7160e01b5f52601160045260245ffd5b8181038181111561056357610563612061565b8082018082111561056357610563612061565b634e487b7160e01b5f52601260045260245ffd5b634e487b7160e01b5f52602160045260245ffd5b634e487b7160e01b5f52603260045260245ffd5b5f826120f157634e487b7160e01b5f52601260045260245ffd5b500490565b6001600160d01b0382811682821603908082111561211657612116612061565b5092915050565b6001600160d01b038181168382160190808211156121165761211661206156fea26469706673582212205b16e510b5cf32ab56362e7ad0a35bcf5162b6d036b142bcce44aa106905bb1f64736f6c63430008190033610160604052348015610010575f80fd5b50604051612d73380380612d7383398101604081905261002f916109de565b6040805180820190915260018152603160f81b602082015286908190818860036100598382610b25565b5060046100668282610b25565b50610076915083905060056101c0565b610120526100858160066101c0565b61014052815160208084019190912060e052815190820120610100524660a05261011160e05161010051604080517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60208201529081019290925260608201524660808201523060a08201525f9060c00160405160208183030381529060405280519060200120905090565b60805250503060c05250600b805460ff861660ff60ff60a81b011990911617600160a81b831515021760ff60b01b191690555f5b83518163ffffffff1610156101b4576101a2848263ffffffff168151811061016f5761016f610be4565b6020026020010151848363ffffffff168151811061018f5761018f610be4565b60200260200101516101f260201b60201c565b806101ac81610c0c565b915050610145565b50505050505050610cf3565b5f6020835110156101db576101d48361022f565b90506101ec565b816101e68482610b25565b5060ff90505b92915050565b6001600160a01b0382166102205760405163ec442f0560e01b81525f60048201526024015b60405180910390fd5b61022b5f838361026c565b5050565b5f80829050601f81511115610259578260405163305a27a960e01b81526004016102179190610c2e565b805161026482610c63565b179392505050565b61027783838361027c565b505050565b6102878383836102e2565b6001600160a01b0383166102d7575f61029f60025490565b90506001600160d01b03808211156102d457604051630e58ae9360e11b81526004810183905260248101829052604401610217565b50505b610277838383610408565b6001600160a01b03831661030c578060025f8282546103019190610c86565b9091555061037c9050565b6001600160a01b0383165f908152602081905260409020548181101561035e5760405163391434e360e21b81526001600160a01b03851660048201526024810182905260448101839052606401610217565b6001600160a01b0384165f9081526020819052604090209082900390555b6001600160a01b038216610398576002805482900390556103b6565b6001600160a01b0382165f9081526020819052604090208054820190555b816001600160a01b0316836001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040516103fb91815260200190565b60405180910390a3505050565b6001600160a01b03831661043657610433600a610aa461049060201b1761042e846104a2565b6104d9565b50505b6001600160a01b03821661045f5761045c600a610aaf61050760201b1761042e846104a2565b50505b6001600160a01b038381165f9081526008602052604080822054858416835291205461027792918216911683610512565b5f61049b8284610c99565b9392505050565b5f6001600160d01b038211156104d5576040516306dfcc6560e41b815260d0600482015260248101839052604401610217565b5090565b5f806104fa426104f26104eb88610662565b868860201c565b8791906106a9565b915091505b935093915050565b5f61049b8284610cc0565b816001600160a01b0316836001600160a01b03161415801561053357505f81115b15610277576001600160a01b038316156105cb576001600160a01b0383165f908152600960209081526040822082916105799190610507901b610aaf1761042e866104a2565b6001600160d01b031691506001600160d01b03169150846001600160a01b03165f80516020612d5383398151915283836040516105c0929190918252602082015260400190565b60405180910390a250505b6001600160a01b03821615610277576001600160a01b0382165f9081526009602090815260408220829161060c9190610490901b610aa41761042e866104a2565b6001600160d01b031691506001600160d01b03169150836001600160a01b03165f80516020612d538339815191528383604051610653929190918252602082015260400190565b60405180910390a25050505050565b80545f9080156106a1576106888361067b600184610ce0565b5f91825260209091200190565b54660100000000000090046001600160d01b031661049b565b5f9392505050565b5f806104fa85858582545f90819080156107b0575f6106cd8761067b600185610ce0565b805490915065ffffffffffff80821691660100000000000090046001600160d01b031690881682111561071357604051632520601d60e01b815260040160405180910390fd5b8765ffffffffffff168265ffffffffffff160361074f57825465ffffffffffff1666010000000000006001600160d01b038916021783556107a2565b6040805180820190915265ffffffffffff808a1682526001600160d01b03808a1660208085019182528d54600181018f555f8f815291909120945191519092166601000000000000029216919091179101555b94508593506104ff92505050565b50506040805180820190915265ffffffffffff80851682526001600160d01b0380851660208085019182528854600181018a555f8a81529182209551925190931666010000000000000291909316179201919091559050816104ff565b634e487b7160e01b5f52604160045260245ffd5b604051601f8201601f191681016001600160401b03811182821017156108495761084961080d565b604052919050565b5f82601f830112610860575f80fd5b81516001600160401b038111156108795761087961080d565b61088c601f8201601f1916602001610821565b8181528460208386010111156108a0575f80fd5b8160208501602083015e5f918101602001919091529392505050565b805160ff811681146108cc575f80fd5b919050565b5f6001600160401b038211156108e9576108e961080d565b5060051b60200190565b5f82601f830112610902575f80fd5b81516020610917610912836108d1565b610821565b8083825260208201915060208460051b870101935086841115610938575f80fd5b602086015b848110156109685780516001600160a01b038116811461095b575f80fd5b835291830191830161093d565b509695505050505050565b5f82601f830112610982575f80fd5b81516020610992610912836108d1565b8083825260208201915060208460051b8701019350868411156109b3575f80fd5b602086015b8481101561096857805183529183019183016109b8565b805180151581146108cc575f80fd5b5f805f805f8060c087890312156109f3575f80fd5b86516001600160401b0380821115610a09575f80fd5b610a158a838b01610851565b97506020890151915080821115610a2a575f80fd5b610a368a838b01610851565b9650610a4460408a016108bc565b95506060890151915080821115610a59575f80fd5b610a658a838b016108f3565b94506080890151915080821115610a7a575f80fd5b50610a8789828a01610973565b925050610a9660a088016109cf565b90509295509295509295565b600181811c90821680610ab657607f821691505b602082108103610ad457634e487b7160e01b5f52602260045260245ffd5b50919050565b601f82111561027757805f5260205f20601f840160051c81016020851015610aff5750805b601f840160051c820191505b81811015610b1e575f8155600101610b0b565b5050505050565b81516001600160401b03811115610b3e57610b3e61080d565b610b5281610b4c8454610aa2565b84610ada565b602080601f831160018114610b85575f8415610b6e5750858301515b5f19600386901b1c1916600185901b178555610bdc565b5f85815260208120601f198616915b82811015610bb357888601518255948401946001909101908401610b94565b5085821015610bd057878501515f19600388901b60f8161c191681555b505060018460011b0185555b505050505050565b634e487b7160e01b5f52603260045260245ffd5b634e487b7160e01b5f52601160045260245ffd5b5f63ffffffff808316818103610c2457610c24610bf8565b6001019392505050565b602081525f82518060208401528060208501604085015e5f604082850101526040601f19601f83011684010191505092915050565b80516020808301519190811015610ad4575f1960209190910360031b1b16919050565b808201808211156101ec576101ec610bf8565b6001600160d01b03818116838216019080821115610cb957610cb9610bf8565b5092915050565b6001600160d01b03828116828216039080821115610cb957610cb9610bf8565b818103818111156101ec576101ec610bf8565b60805160a05160c05160e05161010051610120516101405161200f610d445f395f610e2301525f610df601525f610bc801525f610ba001525f610afb01525f610b2501525f610b4f015261200f5ff3fe608060405234801561000f575f80fd5b50600436106101bb575f3560e01c806370a08231116100f35780639dc29fac11610093578063d505accf1161006e578063d505accf1461040c578063dd62ed3e1461041f578063f1127ed814610457578063f851a44014610496575f80fd5b80639dc29fac146103d3578063a9059cbb146103e6578063c3cda520146103f9575f80fd5b80638e539e8c116100ce5780638e539e8c1461038f57806391ddadf4146103a257806395d89b41146103b85780639ab24eb0146103c0575f80fd5b806370a08231146103395780637ecebe001461036157806384b0196e14610374575f80fd5b80633a46b1a81161015e578063587cde1e11610139578063587cde1e146102a85780635c19a95c146102eb5780636fcfff45146102fe578063704b6c0214610326575f80fd5b80633a46b1a81461025657806340c10f19146102695780634bf5d7e91461027e575f80fd5b80632121dc75116101995780632121dc751461021257806323b872dd14610226578063313ce567146102395780633644e5151461024e575f80fd5b806306fdde03146101bf578063095ea7b3146101dd57806318160ddd14610200575b5f80fd5b6101c76104ae565b6040516101d49190611bf7565b60405180910390f35b6101f06101eb366004611c24565b61053e565b60405190151581526020016101d4565b6002545b6040519081526020016101d4565b600b546101f090600160a81b900460ff1681565b6101f0610234366004611c4c565b610557565b600b5460405160ff90911681526020016101d4565b6102046105ca565b610204610264366004611c24565b6105d8565b61027c610277366004611c24565b610612565b005b60408051808201909152600e81526d06d6f64653d74696d657374616d760941b60208201526101c7565b6102d36102b6366004611c85565b6001600160a01b039081165f908152600860205260409020541690565b6040516001600160a01b0390911681526020016101d4565b61027c6102f9366004611c85565b61064f565b61031161030c366004611c85565b61065a565b60405163ffffffff90911681526020016101d4565b61027c610334366004611c85565b610664565b610204610347366004611c85565b6001600160a01b03165f9081526020819052604090205490565b61020461036f366004611c85565b610751565b61037c61075b565b6040516101d49796959493929190611c9e565b61020461039d366004611d35565b61079d565b60405165ffffffffffff421681526020016101d4565b6101c76107c1565b6102046103ce366004611c85565b6107d0565b61027c6103e1366004611c24565b6107f0565b6101f06103f4366004611c24565b610829565b61027c610407366004611d5c565b610895565b61027c61041a366004611db0565b610951565b61020461042d366004611e15565b6001600160a01b039182165f90815260016020908152604080832093909416825291909152205490565b61046a610465366004611e46565b610a87565b60408051825165ffffffffffff1681526020928301516001600160d01b031692810192909252016101d4565b600b546102d39061010090046001600160a01b031681565b6060600380546104bd90611e83565b80601f01602080910402602001604051908101604052809291908181526020018280546104e990611e83565b80156105345780601f1061050b57610100808354040283529160200191610534565b820191905f5260205f20905b81548152906001019060200180831161051757829003601f168201915b5050505050905090565b5f3361054b818585610aba565b60019150505b92915050565b600b545f90600160a81b900460ff166105b75760405162461bcd60e51b815260206004820181905260248201527f5472616e7366657273206172652063757272656e746c792064697361626c656460448201526064015b60405180910390fd5b6105c2848484610acc565b949350505050565b5f6105d3610aef565b905090565b5f6106026105e583610c18565b6001600160a01b0385165f90815260096020526040902090610c5c565b6001600160d01b03169392505050565b600b5461010090046001600160a01b031633146106415760405162461bcd60e51b81526004016105ae90611ebb565b61064b8282610d0c565b5050565b3361064b8183610d40565b5f61055182610db1565b600b5461010090046001600160a01b0316156106c25760405162461bcd60e51b815260206004820152601a60248201527f41646d696e2068617320616c7265616479206265656e2073657400000000000060448201526064016105ae565b6001600160a01b0381166107185760405162461bcd60e51b815260206004820181905260248201527f4e65772061646d696e20616464726573732063616e6e6f74206265207a65726f60448201526064016105ae565b600b805460ff60b01b196001600160a01b03909316610100029290921661010061ff0160a81b031990921691909117600160b01b179055565b5f61055182610dd2565b5f6060805f805f606061076c610def565b610774610e1c565b604080515f80825260208201909252600f60f81b9b939a50919850469750309650945092509050565b5f6107b26107aa83610c18565b600a90610c5c565b6001600160d01b031692915050565b6060600480546104bd90611e83565b6001600160a01b0381165f9081526009602052604081206107b290610e49565b600b5461010090046001600160a01b0316331461081f5760405162461bcd60e51b81526004016105ae90611ebb565b61064b8282610e80565b600b545f90600160a81b900460ff166108845760405162461bcd60e51b815260206004820181905260248201527f5472616e7366657273206172652063757272656e746c792064697361626c656460448201526064016105ae565b61088e8383610eb4565b9392505050565b834211156108b957604051632341d78760e11b8152600481018590526024016105ae565b604080517fe48329057bfd03d55e49b547132e39cffd9c1820ad7b9d4c5307691425d15adf60208201526001600160a01b0388169181019190915260608101869052608081018590525f906109329061092a9060a00160405160208183030381529060405280519060200120610ec1565b858585610eed565b905061093e8187610f19565b6109488188610d40565b50505050505050565b834211156109755760405163313c898160e11b8152600481018590526024016105ae565b5f7f6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c98888886109c08c6001600160a01b03165f90815260076020526040902080546001810190915590565b6040805160208101969096526001600160a01b0394851690860152929091166060840152608083015260a082015260c0810186905260e0016040516020818303038152906040528051906020012090505f610a1a82610ec1565b90505f610a2982878787610eed565b9050896001600160a01b0316816001600160a01b031614610a70576040516325c0072360e11b81526001600160a01b0380831660048301528b1660248201526044016105ae565b610a7b8a8a8a610aba565b50505050505050505050565b604080518082019091525f808252602082015261088e8383610f6b565b5f61088e8284611f11565b5f61088e8284611f38565b610ac78383836001610f9f565b505050565b5f33610ad9858285611072565b610ae48585856110e8565b506001949350505050565b5f306001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016148015610b4757507f000000000000000000000000000000000000000000000000000000000000000046145b15610b7157507f000000000000000000000000000000000000000000000000000000000000000090565b6105d3604080517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60208201527f0000000000000000000000000000000000000000000000000000000000000000918101919091527f000000000000000000000000000000000000000000000000000000000000000060608201524660808201523060a08201525f9060c00160405160208183030381529060405280519060200120905090565b5f4265ffffffffffff81168310610c5357604051637669fc0f60e11b81526004810184905265ffffffffffff821660248201526044016105ae565b61088e83611145565b81545f9081816005811115610cb8575f610c758461117b565b610c7f9085611f58565b5f8881526020902090915081015465ffffffffffff9081169087161015610ca857809150610cb6565b610cb3816001611f6b565b92505b505b5f610cc5878785856112d3565b90508015610cff57610ce987610cdc600184611f58565b5f91825260209091200190565b54600160301b90046001600160d01b0316610d01565b5f5b979650505050505050565b6001600160a01b038216610d355760405163ec442f0560e01b81525f60048201526024016105ae565b61064b5f8383611332565b6001600160a01b038281165f8181526008602052604080822080548686166001600160a01b0319821681179092559151919094169392849290917f3134e8a2e6d97e929a7e54011ea5485d7d196dd5f0ba4d4ef95803e8e3fc257f9190a4610ac78183610dac8661133d565b61135a565b6001600160a01b0381165f90815260096020526040812054610551906114c3565b6001600160a01b0381165f90815260076020526040812054610551565b60606105d37f000000000000000000000000000000000000000000000000000000000000000060056114f3565b60606105d37f000000000000000000000000000000000000000000000000000000000000000060066114f3565b80545f908015610e7857610e6283610cdc600184611f58565b54600160301b90046001600160d01b031661088e565b5f9392505050565b6001600160a01b038216610ea957604051634b637e8f60e11b81525f60048201526024016105ae565b61064b825f83611332565b5f3361054b8185856110e8565b5f610551610ecd610aef565b8360405161190160f01b8152600281019290925260228201526042902090565b5f805f80610efd8888888861159c565b925092509250610f0d8282611664565b50909695505050505050565b6001600160a01b0382165f908152600760205260409020805460018101909155818114610ac7576040516301d4b62360e61b81526001600160a01b0384166004820152602481018290526044016105ae565b604080518082019091525f80825260208201526001600160a01b0383165f90815260096020526040902061088e908361171c565b6001600160a01b038416610fc85760405163e602df0560e01b81525f60048201526024016105ae565b6001600160a01b038316610ff157604051634a1406b160e11b81525f60048201526024016105ae565b6001600160a01b038085165f908152600160209081526040808320938716835292905220829055801561106c57826001600160a01b0316846001600160a01b03167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9258460405161106391815260200190565b60405180910390a35b50505050565b6001600160a01b038381165f908152600160209081526040808320938616835292905220545f1981101561106c57818110156110da57604051637dc7a0d960e11b81526001600160a01b038416600482015260248101829052604481018390526064016105ae565b61106c84848484035f610f9f565b6001600160a01b03831661111157604051634b637e8f60e11b81525f60048201526024016105ae565b6001600160a01b03821661113a5760405163ec442f0560e01b81525f60048201526024016105ae565b610ac7838383611332565b5f65ffffffffffff821115611177576040516306dfcc6560e41b815260306004820152602481018390526044016105ae565b5090565b5f60018211611188575090565b816001600160801b82106111a15760809190911c9060401b5b6801000000000000000082106111bc5760409190911c9060201b5b64010000000082106111d35760209190911c9060101b5b6201000082106111e85760109190911c9060081b5b61010082106111fc5760089190911c9060041b5b6010821061120f5760049190911c9060021b5b6004821061121b5760011b5b600302600190811c9081858161123357611233611f7e565b048201901c9050600181858161124b5761124b611f7e565b048201901c9050600181858161126357611263611f7e565b048201901c9050600181858161127b5761127b611f7e565b048201901c9050600181858161129357611293611f7e565b048201901c905060018185816112ab576112ab611f7e565b048201901c90506112ca8185816112c4576112c4611f7e565b04821190565b90039392505050565b5f5b8183101561132a575f6112e88484611789565b5f8781526020902090915065ffffffffffff86169082015465ffffffffffff16111561131657809250611324565b611321816001611f6b565b93505b506112d5565b509392505050565b610ac78383836117a3565b6001600160a01b0381165f90815260208190526040812054610551565b816001600160a01b0316836001600160a01b03161415801561137b57505f81115b15610ac7576001600160a01b03831615611422576001600160a01b0383165f90815260096020526040812081906113bd90610aaf6113b886611809565b61183c565b6001600160d01b031691506001600160d01b03169150846001600160a01b03167fdec2bacdd2f05b59de34da9b523dff8be42e5e38e818c82fdb0bae774387a7248383604051611417929190918252602082015260400190565b60405180910390a250505b6001600160a01b03821615610ac7576001600160a01b0382165f908152600960205260408120819061145a90610aa46113b886611809565b6001600160d01b031691506001600160d01b03169150836001600160a01b03167fdec2bacdd2f05b59de34da9b523dff8be42e5e38e818c82fdb0bae774387a72483836040516114b4929190918252602082015260400190565b60405180910390a25050505050565b5f63ffffffff821115611177576040516306dfcc6560e41b815260206004820152602481018390526044016105ae565b606060ff831461150d576115068361186d565b9050610551565b81805461151990611e83565b80601f016020809104026020016040519081016040528092919081815260200182805461154590611e83565b80156115905780601f1061156757610100808354040283529160200191611590565b820191905f5260205f20905b81548152906001019060200180831161157357829003601f168201915b50505050509050610551565b5f80807f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a08411156115d557505f9150600390508261165a565b604080515f808252602082018084528a905260ff891692820192909252606081018790526080810186905260019060a0016020604051602081039080840390855afa158015611626573d5f803e3d5ffd5b5050604051601f1901519150506001600160a01b03811661165157505f92506001915082905061165a565b92505f91508190505b9450945094915050565b5f82600381111561167757611677611f92565b03611680575050565b600182600381111561169457611694611f92565b036116b25760405163f645eedf60e01b815260040160405180910390fd5b60028260038111156116c6576116c6611f92565b036116e75760405163fce698f760e01b8152600481018290526024016105ae565b60038260038111156116fb576116fb611f92565b0361064b576040516335e2f38360e21b8152600481018290526024016105ae565b604080518082019091525f8082526020820152825f018263ffffffff168154811061174957611749611fa6565b5f9182526020918290206040805180820190915291015465ffffffffffff81168252600160301b90046001600160d01b0316918101919091529392505050565b5f6117976002848418611fba565b61088e90848416611f6b565b6117ae8383836118aa565b6001600160a01b0383166117fe575f6117c660025490565b90506001600160d01b03808211156117fb57604051630e58ae9360e11b815260048101839052602481018290526044016105ae565b50505b610ac78383836119d0565b5f6001600160d01b03821115611177576040516306dfcc6560e41b815260d06004820152602481018390526044016105ae565b5f806118604261185861184e88610e49565b868863ffffffff16565b879190611a45565b915091505b935093915050565b60605f61187983611a52565b6040805160208082528183019092529192505f91906020820181803683375050509182525060208101929092525090565b6001600160a01b0383166118d4578060025f8282546118c99190611f6b565b909155506119449050565b6001600160a01b0383165f90815260208190526040902054818110156119265760405163391434e360e21b81526001600160a01b038516600482015260248101829052604481018390526064016105ae565b6001600160a01b0384165f9081526020819052604090209082900390555b6001600160a01b0382166119605760028054829003905561197e565b6001600160a01b0382165f9081526020819052604090208054820190555b816001600160a01b0316836001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040516119c391815260200190565b60405180910390a3505050565b6001600160a01b0383166119f2576119ef600a610aa46113b884611809565b50505b6001600160a01b038216611a1457611a11600a610aaf6113b884611809565b50505b6001600160a01b038381165f90815260086020526040808220548584168352912054610ac79291821691168361135a565b5f80611860858585611a79565b5f60ff8216601f81111561055157604051632cd44ac360e21b815260040160405180910390fd5b82545f9081908015611b6f575f611a9587610cdc600185611f58565b805490915065ffffffffffff80821691600160301b90046001600160d01b0316908816821115611ad857604051632520601d60e01b815260040160405180910390fd5b8765ffffffffffff168265ffffffffffff1603611b1157825465ffffffffffff16600160301b6001600160d01b03891602178355611b61565b6040805180820190915265ffffffffffff808a1682526001600160d01b03808a1660208085019182528d54600181018f555f8f81529190912094519151909216600160301b029216919091179101555b945085935061186592505050565b50506040805180820190915265ffffffffffff80851682526001600160d01b0380851660208085019182528854600181018a555f8a815291822095519251909316600160301b029190931617920191909155905081611865565b5f81518084528060208401602086015e5f602082860101526020601f19601f83011685010191505092915050565b602081525f61088e6020830184611bc9565b80356001600160a01b0381168114611c1f575f80fd5b919050565b5f8060408385031215611c35575f80fd5b611c3e83611c09565b946020939093013593505050565b5f805f60608486031215611c5e575f80fd5b611c6784611c09565b9250611c7560208501611c09565b9150604084013590509250925092565b5f60208284031215611c95575f80fd5b61088e82611c09565b60ff60f81b881681525f602060e06020840152611cbe60e084018a611bc9565b8381036040850152611cd0818a611bc9565b606085018990526001600160a01b038816608086015260a0850187905284810360c0860152855180825260208088019350909101905f5b81811015611d2357835183529284019291840191600101611d07565b50909c9b505050505050505050505050565b5f60208284031215611d45575f80fd5b5035919050565b803560ff81168114611c1f575f80fd5b5f805f805f8060c08789031215611d71575f80fd5b611d7a87611c09565b95506020870135945060408701359350611d9660608801611d4c565b92506080870135915060a087013590509295509295509295565b5f805f805f805f60e0888a031215611dc6575f80fd5b611dcf88611c09565b9650611ddd60208901611c09565b95506040880135945060608801359350611df960808901611d4c565b925060a0880135915060c0880135905092959891949750929550565b5f8060408385031215611e26575f80fd5b611e2f83611c09565b9150611e3d60208401611c09565b90509250929050565b5f8060408385031215611e57575f80fd5b611e6083611c09565b9150602083013563ffffffff81168114611e78575f80fd5b809150509250929050565b600181811c90821680611e9757607f821691505b602082108103611eb557634e487b7160e01b5f52602260045260245ffd5b50919050565b60208082526022908201527f4f6e6c792061646d696e2063616e20706572666f726d2074686973206163746960408201526137b760f11b606082015260800190565b634e487b7160e01b5f52601160045260245ffd5b6001600160d01b03818116838216019080821115611f3157611f31611efd565b5092915050565b6001600160d01b03828116828216039080821115611f3157611f31611efd565b8181038181111561055157610551611efd565b8082018082111561055157610551611efd565b634e487b7160e01b5f52601260045260245ffd5b634e487b7160e01b5f52602160045260245ffd5b634e487b7160e01b5f52603260045260245ffd5b5f82611fd457634e487b7160e01b5f52601260045260245ffd5b50049056fea2646970667358221220bf8bfe2f37b76032d62a6d3bca1fe66e8d4abceacbaa0049e84f01ea6022fea464736f6c63430008190033dec2bacdd2f05b59de34da9b523dff8be42e5e38e818c82fdb0bae774387a724a26469706673582212202de462aa27227925fa558ed6b8e2778f5aebf30e594f5d0a22ee4c058dfa2a7f64736f6c63430008190033",
    "b0a24945763df52e207129a7d59c282d8ecae27fe48dce4a4ac40d76dd63c5b7": "0xf869a0316b506e84fe0b6653198cc90a371af0f67345338c9c7ebc83779f1ac00e1bedb846f8440180a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0d5a1b58982137f655cb119f773754d42eb90ae10bc12071e60d5b2906ec064d2",
    "197b7655e5747c44b3719783707b2dbda16f8c69c526a49136da7d31405bb509": "0xf90151a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da531580a0b0a24945763df52e207129a7d59c282d8ecae27fe48dce4a4ac40d76dd63c5b780a0f9ab5326485b883505d6c1ada540e260ea34a4e13264163e73ba6c403be8c749808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba0154516aeb9deaf97a2cf41454ced6e394d4fe70ca4ea748e0d5cdca2c789066ca069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "72c7e48dae37a3a12d338667fd01492d6e0d0c4a1eba4d7bc23faed0f4faed60": "0xf872a03931b4ed56ace4c46b68524cb5bcbf4195f1bbaacbe5228fbd090546c88dd229b84ff84d0289056bc75e2d61e5772aa056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "cf043603ec1b2f0110b4971e3e92d72b391d64fd46b336fd321d4b58402ccaf0": "0xf90151a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da531580a0b0a24945763df52e207129a7d59c282d8ecae27fe48dce4a4ac40d76dd63c5b780a072c7e48dae37a3a12d338667fd01492d6e0d0c4a1eba4d7bc23faed0f4faed60808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba0154516aeb9deaf97a2cf41454ced6e394d4fe70ca4ea748e0d5cdca2c789066ca069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "f695402ef48f18f1a837971e0da29df5106d6e0ff9d4fd15ea8a2dc654dff062": "0xf86ca03af97556eedd035d0c1b80182155e5f5148b950fe7547a1253e2e74d703b365eb849f84780834de0c2a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "8c65ecd3888edb536587d60df48d336afcdb0bdd703f681ebb465542571e6304": "0xf90171a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da531580a0b0a24945763df52e207129a7d59c282d8ecae27fe48dce4a4ac40d76dd63c5b780a072c7e48dae37a3a12d338667fd01492d6e0d0c4a1eba4d7bc23faed0f4faed6080a0f695402ef48f18f1a837971e0da29df5106d6e0ff9d4fd15ea8a2dc654dff06280a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba0154516aeb9deaf97a2cf41454ced6e394d4fe70ca4ea748e0d5cdca2c789066ca069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "a61575fee744fcb864eb92780bc2fcf7b2793ca9053376adfd60c7c9df7d76bb": "0xf872a03931b4ed56ace4c46b68524cb5bcbf4195f1bbaacbe5228fbd090546c88dd229b84ff84d0189056bc75e2d61ce1a22a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "1ee323aa1ad3e0be8d43653a34947022c72b41f2ff05e22f10010dcf6362d64b": "0xf90131a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da5315808080a0a61575fee744fcb864eb92780bc2fcf7b2793ca9053376adfd60c7c9df7d76bb808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba0154516aeb9deaf97a2cf41454ced6e394d4fe70ca4ea748e0d5cdca2c789066ca069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "3730216dd54e0f573d49b047d75125cdf9df440db644dd43a29cab117ef75eed": "0xf872a03931b4ed56ace4c46b68524cb5bcbf4195f1bbaacbe5228fbd090546c88dd229b84ff84d0289056bc75e2d61ce1a22a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "69ccb7cc28d41933c244e29a1c456f9db42566fa9cddbcb6b622a97b5bf3ebb7": "0xf90131a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da5315808080a03730216dd54e0f573d49b047d75125cdf9df440db644dd43a29cab117ef75eed808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba0154516aeb9deaf97a2cf41454ced6e394d4fe70ca4ea748e0d5cdca2c789066ca069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "1fd88d5065f833d601380d89835b324af6bcf2bdcbb3ec742de30c1c44207eb4": "0xf90151a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da531580a09bc616838d2ecc05ecb41f663fdf836a41c06b664e7e396ca7070529929baa6780a03730216dd54e0f573d49b047d75125cdf9df440db644dd43a29cab117ef75eed808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba0154516aeb9deaf97a2cf41454ced6e394d4fe70ca4ea748e0d5cdca2c789066ca069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "13e37c40b85e0e3ef2e146101381c103cda158b59a93afed2211a4a4ebdee6d9": "0xf90151a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da531580a02fdd73e8bd59143b50c97a3b2170b4b708ce7cff7f321377e22f2025175cd4e080a03730216dd54e0f573d49b047d75125cdf9df440db644dd43a29cab117ef75eed808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba0154516aeb9deaf97a2cf41454ced6e394d4fe70ca4ea748e0d5cdca2c789066ca069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "95022440fecbf5fa46b96dcf476e135f0073fb690c113a9f6bdc6a9a414a5e56": "0xf90151a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da531580a0b0a24945763df52e207129a7d59c282d8ecae27fe48dce4a4ac40d76dd63c5b780a03730216dd54e0f573d49b047d75125cdf9df440db644dd43a29cab117ef75eed808080a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba0154516aeb9deaf97a2cf41454ced6e394d4fe70ca4ea748e0d5cdca2c789066ca069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "a1f8e14ce050d809eb069c37cebebbb2cc9a080cc5bdac8e25409e833a7d1fd3": "0xf872a03931b4ed56ace4c46b68524cb5bcbf4195f1bbaacbe5228fbd090546c88dd229b84ff84d0289056bc75e2d55f9b52aa056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "46208d83c024f0369dabcc5461775056465c2669ed52f1438898128f2fc13ef3": "0xf90171a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da531580a0b0a24945763df52e207129a7d59c282d8ecae27fe48dce4a4ac40d76dd63c5b780a0a1f8e14ce050d809eb069c37cebebbb2cc9a080cc5bdac8e25409e833a7d1fd380a0f695402ef48f18f1a837971e0da29df5106d6e0ff9d4fd15ea8a2dc654dff06280a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba0154516aeb9deaf97a2cf41454ced6e394d4fe70ca4ea748e0d5cdca2c789066ca069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "903d346820fa6c147ad457221fb0ae7d1e906852625712abdd04612e83e2e87c": "0xf872a03931b4ed56ace4c46b68524cb5bcbf4195f1bbaacbe5228fbd090546c88dd229b84ff84d0389056bc75e2d55f9b52aa056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "4a641e7072c29b8027602edb4993c5e490cc2c89ebb42cf4071b3a69851ceac4": "0xf90171a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da531580a0b0a24945763df52e207129a7d59c282d8ecae27fe48dce4a4ac40d76dd63c5b780a0903d346820fa6c147ad457221fb0ae7d1e906852625712abdd04612e83e2e87c80a0f695402ef48f18f1a837971e0da29df5106d6e0ff9d4fd15ea8a2dc654dff06280a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba0154516aeb9deaf97a2cf41454ced6e394d4fe70ca4ea748e0d5cdca2c789066ca069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "48b5c93cef7e804a4a7c29e33d72923827074cb41be332268e3b27444540b96d": "0xf869a0206b506e84fe0b6653198cc90a371af0f67345338c9c7ebc83779f1ac00e1bedb846f8440180a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0d5a1b58982137f655cb119f773754d42eb90ae10bc12071e60d5b2906ec064d2",
    "64ee74ebbdeb5df376b74292c21bfef9d7590ed6996adba10861af20a21eae7b": "0xf869a020917ec45fb432cc574ffa91e7e62572b07d3038ae75c419484ae6d72c6caa8eb846f8448080a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "a62176dac144e5568e02f4e23444552e5c11bbf00da72816f74906c51cca8463": "0xf85180a048b5c93cef7e804a4a7c29e33d72923827074cb41be332268e3b27444540b96da064ee74ebbdeb5df376b74292c21bfef9d7590ed6996adba10861af20a21eae7b8080808080808080808080808080",
    "a2860049bc10688f78245917164ca64e81dcbef10e0650151f9b1684d33cbb06": "0xf90171a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da531580a0a62176dac144e5568e02f4e23444552e5c11bbf00da72816f74906c51cca846380a0903d346820fa6c147ad457221fb0ae7d1e906852625712abdd04612e83e2e87c80a0f695402ef48f18f1a837971e0da29df5106d6e0ff9d4fd15ea8a2dc654dff06280a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba0154516aeb9deaf97a2cf41454ced6e394d4fe70ca4ea748e0d5cdca2c789066ca069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "f173ddeda0249f5b14ea295fc9820cdb1041c003eced9a419c3e4bea80fa7480": "0xf869a020917ec45fb432cc574ffa91e7e62572b07d3038ae75c419484ae6d72c6caa8eb846f8440180a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "abe2d34f6f3c19107d0d4ee444741a924335de00540865494926f96389235ec3": "0xf85180a048b5c93cef7e804a4a7c29e33d72923827074cb41be332268e3b27444540b96da0f173ddeda0249f5b14ea295fc9820cdb1041c003eced9a419c3e4bea80fa74808080808080808080808080808080",
    "86d09936c0267defab95216fc39840c5fb506fa3ce56176f850d8662514e7e2f": "0xf90171a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da531580a0abe2d34f6f3c19107d0d4ee444741a924335de00540865494926f96389235ec380a0903d346820fa6c147ad457221fb0ae7d1e906852625712abdd04612e83e2e87c80a0f695402ef48f18f1a837971e0da29df5106d6e0ff9d4fd15ea8a2dc654dff06280a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba0154516aeb9deaf97a2cf41454ced6e394d4fe70ca4ea748e0d5cdca2c789066ca069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "633bea6ab2fc8cb4ffe53274a4e94fd35da731cddd6bee214a79058d9d7d56da7d": "0x608060405234801561000f575f80fd5b5060043610610034575f3560e01c80631ecbdf63146100385780638c9513bb14610067575b5f80fd5b61004b61004636600461013b565b61007a565b6040516001600160a01b03909116815260200160405180910390f35b61004b610075366004610152565b6100a1565b5f8181548110610088575f80fd5b5f918252602090912001546001600160a01b0316905081565b5f6060805f848383886040516100b69061012e565b6100c394939291906101ca565b604051809103905ff0801580156100dc573d5f803e3d5ffd5b505f80546001810182559080527f290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e5630180546001600160a01b0319166001600160a01b0383161790559695505050505050565b611d158061020f83390190565b5f6020828403121561014b575f80fd5b5035919050565b5f8060408385031215610163575f80fd5b82356001600160a01b0381168114610179575f80fd5b946020939093013593505050565b5f815180845260208085019450602084015f5b838110156101bf5781516001600160a01b03168752958201959082019060010161019a565b509495945050505050565b848152608060208201525f6101e26080830186610187565b82810360408401526101f48186610187565b91505060018060a01b03831660608301529594505050505056fe608060405234801561000f575f80fd5b50604051611d15380380611d1583398101604081905261002e916102f4565b6100385f3061017b565b506001600160a01b03811615610054576100525f8261017b565b505b5f5b83518110156100e8576100a87fb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc18583815181106100955761009561036d565b602002602001015161017b60201b60201c565b506100df7ffd643c72710c63c0180259aba6b2d05451e3591a24e58b62239378085726f7838583815181106100955761009561036d565b50600101610056565b505f5b82518110156101335761012a7fd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e638483815181106100955761009561036d565b506001016100eb565b506002849055604080515f8152602081018690527f11c24f4ead16507c69ac467fbd5e4eed5fb5c699626d2cc6d66421df253886d5910160405180910390a150505050610381565b5f828152602081815260408083206001600160a01b038516845290915281205460ff1661021b575f838152602081815260408083206001600160a01b03861684529091529020805460ff191660011790556101d33390565b6001600160a01b0316826001600160a01b0316847f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a450600161021e565b505f5b92915050565b634e487b7160e01b5f52604160045260245ffd5b80516001600160a01b038116811461024e575f80fd5b919050565b5f82601f830112610262575f80fd5b815160206001600160401b038083111561027e5761027e610224565b8260051b604051601f19603f830116810181811084821117156102a3576102a3610224565b60405293845260208187018101949081019250878511156102c2575f80fd5b6020870191505b848210156102e9576102da82610238565b835291830191908301906102c9565b979650505050505050565b5f805f8060808587031215610307575f80fd5b845160208601519094506001600160401b0380821115610325575f80fd5b61033188838901610253565b94506040870151915080821115610346575f80fd5b5061035387828801610253565b92505061036260608601610238565b905092959194509250565b634e487b7160e01b5f52603260045260245ffd5b6119878061038e5f395ff3fe6080604052600436106101b2575f3560e01c80638065657f116100e7578063bc197c8111610087578063d547741f11610062578063d547741f14610546578063e38335e514610565578063f23a6e6114610578578063f27a0c92146105a3575f80fd5b8063bc197c81146104d1578063c4d252f5146104fc578063d45c44351461051b575f80fd5b806391d14854116100c257806391d148541461044d578063a217fddf1461046c578063b08e51c01461047f578063b1c5f427146104b2575f80fd5b80638065657f146103dc5780638f2a0bb0146103fb5780638f61f4f51461041a575f80fd5b80632ab0f5291161015257806336568abe1161012d57806336568abe14610353578063584b153e1461037257806364d62353146103915780637958004c146103b0575f80fd5b80632ab0f529146102f65780632f2ff15d1461031557806331d5075014610334575f80fd5b8063134008d31161018d578063134008d31461025357806313bc9f2014610266578063150b7a0214610285578063248a9ca3146102c8575f80fd5b806301d5062a146101bd57806301ffc9a7146101de57806307bd026514610212575f80fd5b366101b957005b5f80fd5b3480156101c8575f80fd5b506101dc6101d7366004611162565b6105b7565b005b3480156101e9575f80fd5b506101fd6101f83660046111d0565b61068b565b60405190151581526020015b60405180910390f35b34801561021d575f80fd5b506102457fd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e6381565b604051908152602001610209565b6101dc6102613660046111f7565b61069b565b348015610271575f80fd5b506101fd61028036600461125d565b61074d565b348015610290575f80fd5b506102af61029f366004611323565b630a85bd0160e11b949350505050565b6040516001600160e01b03199091168152602001610209565b3480156102d3575f80fd5b506102456102e236600461125d565b5f9081526020819052604090206001015490565b348015610301575f80fd5b506101fd61031036600461125d565b610772565b348015610320575f80fd5b506101dc61032f366004611386565b61077a565b34801561033f575f80fd5b506101fd61034e36600461125d565b6107a4565b34801561035e575f80fd5b506101dc61036d366004611386565b6107c8565b34801561037d575f80fd5b506101fd61038c36600461125d565b610800565b34801561039c575f80fd5b506101dc6103ab36600461125d565b610845565b3480156103bb575f80fd5b506103cf6103ca36600461125d565b6108b8565b60405161020991906113c4565b3480156103e7575f80fd5b506102456103f63660046111f7565b610900565b348015610406575f80fd5b506101dc61041536600461142a565b61093e565b348015610425575f80fd5b506102457fb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc181565b348015610458575f80fd5b506101fd610467366004611386565b610aca565b348015610477575f80fd5b506102455f81565b34801561048a575f80fd5b506102457ffd643c72710c63c0180259aba6b2d05451e3591a24e58b62239378085726f78381565b3480156104bd575f80fd5b506102456104cc3660046114d2565b610af2565b3480156104dc575f80fd5b506102af6104eb3660046115ee565b63bc197c8160e01b95945050505050565b348015610507575f80fd5b506101dc61051636600461125d565b610b36565b348015610526575f80fd5b5061024561053536600461125d565b5f9081526001602052604090205490565b348015610551575f80fd5b506101dc610560366004611386565b610be0565b6101dc6105733660046114d2565b610c04565b348015610583575f80fd5b506102af610592366004611690565b63f23a6e6160e01b95945050505050565b3480156105ae575f80fd5b50600254610245565b7fb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc16105e181610d85565b5f6105f0898989898989610900565b90506105fc8184610d92565b5f817f4cf4410cc57040e44862ef0f45f3dd5a5e02db8eb8add648d4b0e236f1d07dca8b8b8b8b8b8a60405161063796959493929190611717565b60405180910390a3831561068057807f20fda5fd27a1ea7bf5b9567f143ac5470bb059374a27e8f67cb44f946f6d03878560405161067791815260200190565b60405180910390a25b505050505050505050565b5f61069582610e23565b92915050565b7fd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e636106c6815f610aca565b6106d4576106d48133610e47565b5f6106e3888888888888610900565b90506106ef8185610e84565b6106fb88888888610ed2565b5f817fc2617efa69bab66782fa219543714338489c4e9e178271560a91b82c3f612b588a8a8a8a6040516107329493929190611753565b60405180910390a361074381610f46565b5050505050505050565b5f60025b61075a836108b8565b600381111561076b5761076b6113b0565b1492915050565b5f6003610751565b5f8281526020819052604090206001015461079481610d85565b61079e8383610f71565b50505050565b5f806107af836108b8565b60038111156107c0576107c06113b0565b141592915050565b6001600160a01b03811633146107f15760405163334bd91960e11b815260040160405180910390fd5b6107fb8282611000565b505050565b5f8061080b836108b8565b90506001816003811115610821576108216113b0565b148061083e5750600281600381111561083c5761083c6113b0565b145b9392505050565b333081146108765760405163e2850c5960e01b81526001600160a01b03821660048201526024015b60405180910390fd5b60025460408051918252602082018490527f11c24f4ead16507c69ac467fbd5e4eed5fb5c699626d2cc6d66421df253886d5910160405180910390a150600255565b5f81815260016020526040812054805f036108d557505f92915050565b600181036108e65750600392915050565b428111156108f75750600192915050565b50600292915050565b5f86868686868660405160200161091c96959493929190611717565b6040516020818303038152906040528051906020012090509695505050505050565b7fb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc161096881610d85565b88871415806109775750888514155b156109a9576040516001624fcdef60e01b03198152600481018a9052602481018690526044810188905260640161086d565b5f6109ba8b8b8b8b8b8b8b8b610af2565b90506109c68184610d92565b5f5b8a811015610a7b5780827f4cf4410cc57040e44862ef0f45f3dd5a5e02db8eb8add648d4b0e236f1d07dca8e8e85818110610a0557610a05611784565b9050602002016020810190610a1a9190611798565b8d8d86818110610a2c57610a2c611784565b905060200201358c8c87818110610a4557610a45611784565b9050602002810190610a5791906117b1565b8c8b604051610a6b96959493929190611717565b60405180910390a36001016109c8565b508315610abd57807f20fda5fd27a1ea7bf5b9567f143ac5470bb059374a27e8f67cb44f946f6d038785604051610ab491815260200190565b60405180910390a25b5050505050505050505050565b5f918252602082815260408084206001600160a01b0393909316845291905290205460ff1690565b5f8888888888888888604051602001610b12989796959493929190611884565b60405160208183030381529060405280519060200120905098975050505050505050565b7ffd643c72710c63c0180259aba6b2d05451e3591a24e58b62239378085726f783610b6081610d85565b610b6982610800565b610ba55781610b786002611069565b610b826001611069565b604051635ead8eb560e01b8152600481019390935217602482015260440161086d565b5f828152600160205260408082208290555183917fbaa1eb22f2a492ba1a5fea61b8df4d27c6c8b5f3971e63bb58fa14ff72eedb7091a25050565b5f82815260208190526040902060010154610bfa81610d85565b61079e8383611000565b7fd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63610c2f815f610aca565b610c3d57610c3d8133610e47565b8786141580610c4c5750878414155b15610c7e576040516001624fcdef60e01b0319815260048101899052602481018590526044810187905260640161086d565b5f610c8f8a8a8a8a8a8a8a8a610af2565b9050610c9b8185610e84565b5f5b89811015610d6f575f8b8b83818110610cb857610cb8611784565b9050602002016020810190610ccd9190611798565b90505f8a8a84818110610ce257610ce2611784565b905060200201359050365f8a8a86818110610cff57610cff611784565b9050602002810190610d1191906117b1565b91509150610d2184848484610ed2565b84867fc2617efa69bab66782fa219543714338489c4e9e178271560a91b82c3f612b5886868686604051610d589493929190611753565b60405180910390a350505050806001019050610c9d565b50610d7981610f46565b50505050505050505050565b610d8f8133610e47565b50565b610d9b826107a4565b15610dcc5781610daa5f611069565b604051635ead8eb560e01b81526004810192909252602482015260440161086d565b5f610dd660025490565b905080821015610e0357604051635433660960e01b8152600481018390526024810182905260440161086d565b610e0d8242611923565b5f93845260016020526040909320929092555050565b5f6001600160e01b03198216630271189760e51b148061069557506106958261108b565b610e518282610aca565b610e805760405163e2517d3f60e01b81526001600160a01b03821660048201526024810183905260440161086d565b5050565b610e8d8261074d565b610e9c5781610daa6002611069565b8015801590610eb15750610eaf81610772565b155b15610e805760405163121534c360e31b81526004810182905260240161086d565b5f80856001600160a01b0316858585604051610eef929190611942565b5f6040518083038185875af1925050503d805f8114610f29576040519150601f19603f3d011682016040523d82523d5f602084013e610f2e565b606091505b5091509150610f3d82826110bf565b50505050505050565b610f4f8161074d565b610f5e5780610daa6002611069565b5f90815260016020819052604090912055565b5f610f7c8383610aca565b610ff9575f838152602081815260408083206001600160a01b03861684529091529020805460ff19166001179055610fb13390565b6001600160a01b0316826001600160a01b0316847f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a4506001610695565b505f610695565b5f61100b8383610aca565b15610ff9575f838152602081815260408083206001600160a01b0386168085529252808320805460ff1916905551339286917ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b9190a4506001610695565b5f81600381111561107c5761107c6113b0565b600160ff919091161b92915050565b5f6001600160e01b03198216637965db0b60e01b148061069557506301ffc9a760e01b6001600160e01b0319831614610695565b6060826110d4576110cf826110db565b610695565b5080610695565b8051156110ea57805160208201fd5b60405163d6bda27560e01b815260040160405180910390fd5b80356001600160a01b0381168114611119575f80fd5b919050565b5f8083601f84011261112e575f80fd5b5081356001600160401b03811115611144575f80fd5b60208301915083602082850101111561115b575f80fd5b9250929050565b5f805f805f805f60c0888a031215611178575f80fd5b61118188611103565b96506020880135955060408801356001600160401b038111156111a2575f80fd5b6111ae8a828b0161111e565b989b979a50986060810135976080820135975060a09091013595509350505050565b5f602082840312156111e0575f80fd5b81356001600160e01b03198116811461083e575f80fd5b5f805f805f8060a0878903121561120c575f80fd5b61121587611103565b95506020870135945060408701356001600160401b03811115611236575f80fd5b61124289828a0161111e565b979a9699509760608101359660809091013595509350505050565b5f6020828403121561126d575f80fd5b5035919050565b634e487b7160e01b5f52604160045260245ffd5b604051601f8201601f191681016001600160401b03811182821017156112b0576112b0611274565b604052919050565b5f82601f8301126112c7575f80fd5b81356001600160401b038111156112e0576112e0611274565b6112f3601f8201601f1916602001611288565b818152846020838601011115611307575f80fd5b816020850160208301375f918101602001919091529392505050565b5f805f8060808587031215611336575f80fd5b61133f85611103565b935061134d60208601611103565b92506040850135915060608501356001600160401b0381111561136e575f80fd5b61137a878288016112b8565b91505092959194509250565b5f8060408385031215611397575f80fd5b823591506113a760208401611103565b90509250929050565b634e487b7160e01b5f52602160045260245ffd5b60208101600483106113e457634e487b7160e01b5f52602160045260245ffd5b91905290565b5f8083601f8401126113fa575f80fd5b5081356001600160401b03811115611410575f80fd5b6020830191508360208260051b850101111561115b575f80fd5b5f805f805f805f805f60c08a8c031215611442575f80fd5b89356001600160401b0380821115611458575f80fd5b6114648d838e016113ea565b909b50995060208c013591508082111561147c575f80fd5b6114888d838e016113ea565b909950975060408c01359150808211156114a0575f80fd5b506114ad8c828d016113ea565b9a9d999c50979a969997986060880135976080810135975060a0013595509350505050565b5f805f805f805f8060a0898b0312156114e9575f80fd5b88356001600160401b03808211156114ff575f80fd5b61150b8c838d016113ea565b909a50985060208b0135915080821115611523575f80fd5b61152f8c838d016113ea565b909850965060408b0135915080821115611547575f80fd5b506115548b828c016113ea565b999c989b509699959896976060870135966080013595509350505050565b5f82601f830112611581575f80fd5b813560206001600160401b0382111561159c5761159c611274565b8160051b6115ab828201611288565b92835284810182019282810190878511156115c4575f80fd5b83870192505b848310156115e3578235825291830191908301906115ca565b979650505050505050565b5f805f805f60a08688031215611602575f80fd5b61160b86611103565b945061161960208701611103565b935060408601356001600160401b0380821115611634575f80fd5b61164089838a01611572565b94506060880135915080821115611655575f80fd5b61166189838a01611572565b93506080880135915080821115611676575f80fd5b50611683888289016112b8565b9150509295509295909350565b5f805f805f60a086880312156116a4575f80fd5b6116ad86611103565b94506116bb60208701611103565b9350604086013592506060860135915060808601356001600160401b038111156116e3575f80fd5b611683888289016112b8565b81835281816020850137505f828201602090810191909152601f909101601f19169091010190565b60018060a01b038716815285602082015260a060408201525f61173e60a0830186886116ef565b60608301949094525060800152949350505050565b60018060a01b0385168152836020820152606060408201525f61177a6060830184866116ef565b9695505050505050565b634e487b7160e01b5f52603260045260245ffd5b5f602082840312156117a8575f80fd5b61083e82611103565b5f808335601e198436030181126117c6575f80fd5b8301803591506001600160401b038211156117df575f80fd5b60200191503681900382131561115b575f80fd5b5f838385526020808601955060208560051b830101845f5b8781101561187757848303601f19018952813536889003601e19018112611830575f80fd5b870184810190356001600160401b0381111561184a575f80fd5b803603821315611858575f80fd5b6118638582846116ef565b9a86019a945050509083019060010161180b565b5090979650505050505050565b60a080825281018890525f8960c08301825b8b8110156118c4576001600160a01b036118af84611103565b16825260209283019290910190600101611896565b5083810360208501528881526001600160fb1b038911156118e3575f80fd5b8860051b9150818a6020830137018281036020908101604085015261190b90820187896117f3565b60608401959095525050608001529695505050505050565b8082018082111561069557634e487b7160e01b5f52601160045260245ffd5b818382375f910190815291905056fea26469706673582212204ea5cd2c9a167f287e5a60205f4525efc8aa9d8c459f5e50c72c22f8d2b91b6664736f6c63430008190033a26469706673582212207a77eb0664c0db230f9bc59bf58e76fcb61a50b3f86b69397daf47607b79e85b64736f6c63430008190033",
    "5ee619cab2a83ed2bb8a7139ce907dfcb58c1c9dec188357fbbd4ce4ddc26066": "0xf869a020917ec45fb432cc574ffa91e7e62572b07d3038ae75c419484ae6d72c6caa8eb846f8440180a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a03bea6ab2fc8cb4ffe53274a4e94fd35da731cddd6bee214a79058d9d7d56da7d",
    "b4bf332b801811c1c3337b3705900448a873a91f20322790d2ff73d4d37b568c": "0xf85180a048b5c93cef7e804a4a7c29e33d72923827074cb41be332268e3b27444540b96da05ee619cab2a83ed2bb8a7139ce907dfcb58c1c9dec188357fbbd4ce4ddc260668080808080808080808080808080",
    "f74bfae81e5137170d002babf4b9b317b671b1c7588ecedfb8738cf46fb917cd": "0xf90171a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da531580a0b4bf332b801811c1c3337b3705900448a873a91f20322790d2ff73d4d37b568c80a0903d346820fa6c147ad457221fb0ae7d1e906852625712abdd04612e83e2e87c80a0f695402ef48f18f1a837971e0da29df5106d6e0ff9d4fd15ea8a2dc654dff06280a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba0154516aeb9deaf97a2cf41454ced6e394d4fe70ca4ea748e0d5cdca2c789066ca069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "9bdf6457b006d3bec2ddc6d8d1802a04df086c335e61a77bb3503de2c93f864a": "0xf872a03931b4ed56ace4c46b68524cb5bcbf4195f1bbaacbe5228fbd090546c88dd229b84ff84d0389056bc75e2d61aee2f6a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "1e8e017ecedb501ec82769579751c6ec1c670187ff8b2783fe68c85735a96600": "0xf90171a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da531580a0b4bf332b801811c1c3337b3705900448a873a91f20322790d2ff73d4d37b568c80a09bdf6457b006d3bec2ddc6d8d1802a04df086c335e61a77bb3503de2c93f864a80a0f695402ef48f18f1a837971e0da29df5106d6e0ff9d4fd15ea8a2dc654dff06280a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba0154516aeb9deaf97a2cf41454ced6e394d4fe70ca4ea748e0d5cdca2c789066ca069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "79b48bfbf876fffdcf743a159b4df3f64d3e6deeca437fa04d071e5e40d919a8": "0xf86ca03c76d49790cfa3f0c5e6fc28e31afd97efcab3ccef5b50ddc3276fdd9f50c730b849f84780831b4a1aa056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "0126f6216f24971c886cc8ceaf68b04bac0fe25d7aaac4655653aec368359e9d": "0xf90191a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da531580a0b4bf332b801811c1c3337b3705900448a873a91f20322790d2ff73d4d37b568c80a09bdf6457b006d3bec2ddc6d8d1802a04df086c335e61a77bb3503de2c93f864aa079b48bfbf876fffdcf743a159b4df3f64d3e6deeca437fa04d071e5e40d919a8a0f695402ef48f18f1a837971e0da29df5106d6e0ff9d4fd15ea8a2dc654dff06280a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba0154516aeb9deaf97a2cf41454ced6e394d4fe70ca4ea748e0d5cdca2c789066ca069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "4d7282bc7668b60cd0525f968b8eea5e01a22cb2999d1c33646a1f4123a620a1": "0xf872a03931b4ed56ace4c46b68524cb5bcbf4195f1bbaacbe5228fbd090546c88dd229b84ff84d0289056bc75e2d61a6b320a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "f510f11ae9bfbea2c936c03b31b2b65f85967b89a31a9c3d58097dade3ba567d": "0xf90171a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da531580a0b0a24945763df52e207129a7d59c282d8ecae27fe48dce4a4ac40d76dd63c5b780a04d7282bc7668b60cd0525f968b8eea5e01a22cb2999d1c33646a1f4123a620a180a0f695402ef48f18f1a837971e0da29df5106d6e0ff9d4fd15ea8a2dc654dff06280a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba0154516aeb9deaf97a2cf41454ced6e394d4fe70ca4ea748e0d5cdca2c789066ca069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "bf0f5d39c579838d8bbd4de7b015f614121dd2ea5c337e7d700ec81b356902db": "0xf872a03931b4ed56ace4c46b68524cb5bcbf4195f1bbaacbe5228fbd090546c88dd229b84ff84d0389056bc75e2d61a6b320a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "1b4a76fd90256990b6f2441360e5188cedb4b6a43692a0316de76f99505c04a0": "0xf90171a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da531580a0b0a24945763df52e207129a7d59c282d8ecae27fe48dce4a4ac40d76dd63c5b780a0bf0f5d39c579838d8bbd4de7b015f614121dd2ea5c337e7d700ec81b356902db80a0f695402ef48f18f1a837971e0da29df5106d6e0ff9d4fd15ea8a2dc654dff06280a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba0154516aeb9deaf97a2cf41454ced6e394d4fe70ca4ea748e0d5cdca2c789066ca069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "d7ab44accc0274c7dfb658c369f4e776e74de86eaa8b86a7df7fddb011917965": "0xf90171a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da531580a0a62176dac144e5568e02f4e23444552e5c11bbf00da72816f74906c51cca846380a0bf0f5d39c579838d8bbd4de7b015f614121dd2ea5c337e7d700ec81b356902db80a0f695402ef48f18f1a837971e0da29df5106d6e0ff9d4fd15ea8a2dc654dff06280a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba0154516aeb9deaf97a2cf41454ced6e394d4fe70ca4ea748e0d5cdca2c789066ca069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "9d418f537d3675c5b5c9830f1325055de50f016d0ba0c0f30464a96f9c02c2d3": "0xf90171a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da531580a0abe2d34f6f3c19107d0d4ee444741a924335de00540865494926f96389235ec380a0bf0f5d39c579838d8bbd4de7b015f614121dd2ea5c337e7d700ec81b356902db80a0f695402ef48f18f1a837971e0da29df5106d6e0ff9d4fd15ea8a2dc654dff06280a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba0154516aeb9deaf97a2cf41454ced6e394d4fe70ca4ea748e0d5cdca2c789066ca069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780",
    "7bf3c31712505d99a5520354f7d93393d3012dfd48df866146b304f60e630a42": "0xf90171a06e94ede82e8c381d422f010130a4c2ed35805be58e6783d800fbb37d000090e2a00968480c83b67f0eb2cafc1df82dbf6dcac0811f36fbd405f20c46f158da531580a0b4bf332b801811c1c3337b3705900448a873a91f20322790d2ff73d4d37b568c80a0bf0f5d39c579838d8bbd4de7b015f614121dd2ea5c337e7d700ec81b356902db80a0f695402ef48f18f1a837971e0da29df5106d6e0ff9d4fd15ea8a2dc654dff06280a0aff16a3ca0d6e3544a2d4deb40842cebaf9325e6a98f2d6edc4cdce5d853e5d8a0bff66d9133cff6e91fe1878473b09aee9458c323efa078340d914a82de546baba0154516aeb9deaf97a2cf41454ced6e394d4fe70ca4ea748e0d5cdca2c789066ca069a571829b9b6f89efb0b65e66e59e5a26b2eb72cdfce949e0aec5e0037357bda0853082590f798e998c021e6cf314a77c9a9fa6321048ad84cd12210b7aca706a80a0d4204163ecf6c8daf3225dfda4093932508ad086f92a7fc4aa9e081cec3fd54780"
  },
  "blocks": [
    "0xf90260f9025aa00000000000000000000000000000000000000000000000000000000000000000a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347940e9281e9c6a0808672eaba6bd1220e144c9bb07aa00000000000000000000000000000000000000000000000000000000000000000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421b90100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008080837a1200808468f3a12380a0000000000000000000000000000000000000000000000000000000000000000088000000000000000007a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b4218080a00000000000000000000000000000000000000000000000000000000000000000a0e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855c0c0c0",
    "0xf95679f9025aa041afc92d69bcb951e9ca48da463d47c5be7a1658c6cc12a3b33242367989b2aca01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948945a1288dc78a6d8952a92c77aee6730b414778a00000000000000000000000000000000000000000000000000000000000000000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421b9010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800183521903808468f3a12a80a0000000000000000000000000000000000000000000000000000000000000000088000000000000000001a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b4218080a00000000000000000000000000000000000000000000000000000000000000000a0e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855f95417b9541402f9541001800107835219038080b953bf6080604052348015600e575f80fd5b506153a38061001c5f395ff3fe608060405234801561000f575f80fd5b5060043610610034575f3560e01c80630961b7081461003857806319e0b28814610067575b5f80fd5b61004b610046366004610339565b61007a565b6040516001600160a01b03909116815260200160405180910390f35b61004b610075366004610409565b610228565b5f6004825110156100ed5760405162461bcd60e51b815260206004820152603360248201527f44414f466163746f72793a20496e73756666696369656e742073657474696e676044820152727320696e20696e697469616c416d6f756e747360681b606482015260840160405180910390fd5b5f82600484516100fd9190610420565b8151811061010d5761010d610445565b602002602001015190505f83600385516101279190610420565b8151811061013757610137610445565b602002602001015190505f84600286516101519190610420565b8151811061016157610161610445565b602002602001015190505f856001875161017b9190610420565b8151811061018b5761018b610445565b602002602001015190505f898989878787876040516101a99061024f565b6101b99796959493929190610459565b604051809103905ff0801580156101d2573d5f803e3d5ffd5b505f80546001810182559080527f290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e5630180546001600160a01b0319166001600160a01b0383161790559a9950505050505050505050565b5f8181548110610236575f80fd5b5f918252602090912001546001600160a01b0316905081565b614e9b806104d383390190565b80356001600160a01b0381168114610272575f80fd5b919050565b634e487b7160e01b5f52604160045260245ffd5b604051601f8201601f1916810167ffffffffffffffff811182821017156102b4576102b4610277565b604052919050565b5f82601f8301126102cb575f80fd5b8135602067ffffffffffffffff8211156102e7576102e7610277565b8160051b6102f682820161028b565b928352848101820192828101908785111561030f575f80fd5b83870192505b8483101561032e57823582529183019190830190610315565b979650505050505050565b5f805f806080858703121561034c575f80fd5b6103558561025c565b9350602061036481870161025c565b9350604086013567ffffffffffffffff80821115610380575f80fd5b818801915088601f830112610393575f80fd5b8135818111156103a5576103a5610277565b6103b7601f8201601f1916850161028b565b8181528a858386010111156103ca575f80fd5b81858501868301375f91810190940152919350606087013591808311156103ef575f80fd5b50506103fd878288016102bc565b91505092959194509250565b5f60208284031215610419575f80fd5b5035919050565b8181038181111561043f57634e487b7160e01b5f52601160045260245ffd5b92915050565b634e487b7160e01b5f52603260045260245ffd5b5f60018060a01b03808a16835280891660208401525060e0604083015286518060e08401526101008160208a018286015e5f84830182015265ffffffffffff97909716606084015263ffffffff9590951660808301525060a081019290925260ff1660c0820152601f909101601f19160101939250505056fe610180604052348015610010575f80fd5b50604051614e9b380380614e9b83398101604081905261002f91610753565b8560ff82168861004087603c610871565b61004b87603c61089b565b868a8061006c6040805180820190915260018152603160f81b602082015290565b610076825f610174565b61012052610085816001610174565b61014052815160208084019190912060e052815190820120610100524660a05261011160e05161010051604080517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60208201529081019290925260608201524660808201523060a08201525f9060c00160405160208183030381529060405280519060200120905090565b60805250503060c0526003610126828261093f565b506101329050836101a6565b61013b8261020c565b610144816102b0565b5050506001600160a01b03166101605261015d816102f1565b5061016781610386565b5050505050505050610a82565b5f60208351101561018f57610188836103ef565b90506101a0565b8161019a848261093f565b5060ff90505b92915050565b6008546040805165ffffffffffff928316815291831660208301527fc565b045403dc03c2eea82b81a0465edad9e2e7fc4d97e11421c209da93d7a93910160405180910390a16008805465ffffffffffff191665ffffffffffff92909216919091179055565b8063ffffffff165f036102395760405163f1cfbf0560e01b81525f60048201526024015b60405180910390fd5b6008546040805163ffffffff66010000000000009093048316815291831660208301527f7e3f7f0708a84de9203036abaa450dccc85ad5ff52f78c170f3edb55cf5e8828910160405180910390a16008805463ffffffff90921666010000000000000263ffffffff60301b19909216919091179055565b60075460408051918252602082018390527fccb45da8d5717e6c4544694297c4ba5cf151d455c9bb0ed4fc7a38411bc05461910160405180910390a1600755565b60648082111561031e5760405163243e544560e01b81526004810183905260248101829052604401610230565b5f61032761042c565b9050610346610334610445565b61033d856104bf565b600a91906104f6565b505060408051828152602081018590527f0553476bf02ef2726e8ce5ced78d63e26e602e4a2257b1f559418e24b4633997910160405180910390a1505050565b600b54604080516001600160a01b03928316815291831660208301527f08f74ea46ef7894f65eabfb5e6e695de773a000b47c529ab559178069b226401910160405180910390a1600b80546001600160a01b0319166001600160a01b0392909216919091179055565b5f80829050601f81511115610419578260405163305a27a960e01b815260040161023091906109fe565b805161042482610a33565b179392505050565b5f610437600a610510565b6001600160d01b0316905090565b5f6104506101605190565b6001600160a01b03166391ddadf46040518163ffffffff1660e01b8152600401602060405180830381865afa9250505080156104a9575060408051601f3d908101601f191682019092526104a691810190610a56565b60015b6104ba576104b5610558565b905090565b919050565b5f6001600160d01b038211156104f2576040516306dfcc6560e41b815260d0600482015260248101839052604401610230565b5090565b5f80610503858585610562565b915091505b935093915050565b80545f90801561054f5761053683610529600184610a6f565b5f91825260209091200190565b54660100000000000090046001600160d01b0316610551565b5f5b9392505050565b5f6104b5436106be565b82545f9081908015610661575f61057e87610529600185610a6f565b805490915065ffffffffffff80821691660100000000000090046001600160d01b03169088168211156105c457604051632520601d60e01b815260040160405180910390fd5b8765ffffffffffff168265ffffffffffff160361060057825465ffffffffffff1666010000000000006001600160d01b03891602178355610653565b6040805180820190915265ffffffffffff808a1682526001600160d01b03808a1660208085019182528d54600181018f555f8f815291909120945191519092166601000000000000029216919091179101555b945085935061050892505050565b50506040805180820190915265ffffffffffff80851682526001600160d01b0380851660208085019182528854600181018a555f8a8152918220955192519093166601000000000000029190931617920191909155905081610508565b5f65ffffffffffff8211156104f2576040516306dfcc6560e41b81526030600482015260248101839052604401610230565b6001600160a01b0381168114610704575f80fd5b50565b634e487b7160e01b5f52604160045260245ffd5b805165ffffffffffff811681146104ba575f80fd5b805163ffffffff811681146104ba575f80fd5b805160ff811681146104ba575f80fd5b5f805f805f805f60e0888a031215610769575f80fd5b8751610774816106f0565b6020890151909750610785816106f0565b60408901519096506001600160401b03808211156107a1575f80fd5b818a0191508a601f8301126107b4575f80fd5b8151818111156107c6576107c6610707565b604051601f8201601f19908116603f011681019083821181831017156107ee576107ee610707565b816040528281528d6020848701011115610806575f80fd5b8260208601602083015e5f60208483010152809950505050505061082c6060890161071b565b935061083a60808901610730565b925060a0880151915061084f60c08901610743565b905092959891949750929550565b634e487b7160e01b5f52601160045260245ffd5b65ffffffffffff8181168382160280821691908281146108935761089361085d565b505092915050565b63ffffffff8181168382160280821691908281146108935761089361085d565b600181811c908216806108cf57607f821691505b6020821081036108ed57634e487b7160e01b5f52602260045260245ffd5b50919050565b601f82111561093a57805f5260205f20601f840160051c810160208510156109185750805b601f840160051c820191505b81811015610937575f8155600101610924565b50505b505050565b81516001600160401b0381111561095857610958610707565b61096c8161096684546108bb565b846108f3565b602080601f83116001811461099f575f84156109885750858301515b5f19600386901b1c1916600185901b1785556109f6565b5f85815260208120601f198616915b828110156109cd578886015182559484019460019091019084016109ae565b50858210156109ea57878501515f19600388901b60f8161c191681555b505060018460011b0185555b505050505050565b602081525f82518060208401528060208501604085015e5f604082850101526040601f19601f83011684010191505092915050565b805160208083015191908110156108ed575f1960209190910360031b1b16919050565b5f60208284031215610a66575f80fd5b6105518261071b565b818103818111156101a0576101a061085d565b60805160a05160c05160e051610100516101205161014051610160516143a2610af95f395f81816109c101528181610e29015281816111f601528181611e28015261208201525f611d6c01525f611d4001525f612ddf01525f612db701525f612d1201525f612d3c01525f612d6601526143a25ff3fe6080604052600436106102a8575f3560e01c80637ecebe001161016f578063bc197c81116100d8578063deaaa7cc11610092578063ece40cc11161006d578063ece40cc114610956578063f23a6e6114610975578063f8ce560a14610994578063fc0c546a146109b3575f80fd5b8063deaaa7cc146108e5578063e540d01d14610918578063eb9019d414610937575f80fd5b8063bc197c8114610813578063c01f9e3714610832578063c28bc2fa14610851578063c59057e414610864578063d33219b414610883578063dd4e2ba5146108a0575f80fd5b8063a7713a7011610129578063a7713a7014610758578063a890c9101461076c578063a8f8a6681461078b578063a9a95294146107aa578063ab58fb8e146107c9578063b58131b0146107ff575f80fd5b80637ecebe001461068157806384b0196e146106b55780638ff262e3146106dc57806391ddadf4146106fb57806397c3d334146107265780639a802a6d14610739575f80fd5b806343859632116102115780635b8d0e0d116101cb5780635b8d0e0d146105c75780635f398a14146105e657806360c4247f1461060557806379051887146106245780637b3c71d3146106435780637d5e81e214610662575f80fd5b806343859632146104ca578063452115d6146105125780634bf5d7e914610531578063544ffc9c1461054557806354fd4d501461057f57806356781388146105a8575f80fd5b8063160cbed711610262578063160cbed7146104065780632656227d146104255780632d63f693146104385780632fe3e261146104575780633932abb11461048a5780633e4f49e61461049e575f80fd5b806301ffc9a7146102e357806302a251a31461031757806306f3f9e61461034257806306fdde0314610361578063143489d014610382578063150b7a02146103ce575f80fd5b366102df57306102b66109e5565b6001600160a01b0316146102dd57604051637485328f60e11b815260040160405180910390fd5b005b5f80fd5b3480156102ee575f80fd5b506103026102fd3660046133a0565b6109fd565b60405190151581526020015b60405180910390f35b348015610322575f80fd5b50600854600160301b900463ffffffff165b60405190815260200161030e565b34801561034d575f80fd5b506102dd61035c3660046133c7565b610a69565b34801561036c575f80fd5b50610375610a7d565b60405161030e919061340c565b34801561038d575f80fd5b506103b661039c3660046133c7565b5f908152600460205260409020546001600160a01b031690565b6040516001600160a01b03909116815260200161030e565b3480156103d9575f80fd5b506103ed6103e83660046134f5565b610b0d565b6040516001600160e01b0319909116815260200161030e565b348015610411575f80fd5b506103346104203660046136c4565b610b4f565b6103346104333660046136c4565b610c1b565b348015610443575f80fd5b506103346104523660046133c7565b610d83565b348015610462575f80fd5b506103347f3e83946653575f9a39005e1545185629e92736b7528ab20ca3816f315424a81181565b348015610495575f80fd5b50610334610da3565b3480156104a9575f80fd5b506104bd6104b83660046133c7565b610db5565b60405161030e9190613781565b3480156104d5575f80fd5b506103026104e436600461378f565b5f8281526009602090815260408083206001600160a01b038516845260030190915290205460ff1692915050565b34801561051d575f80fd5b5061033461052c3660046136c4565b610dbf565b34801561053c575f80fd5b50610375610e25565b348015610550575f80fd5b5061056461055f3660046133c7565b610ee5565b6040805193845260208401929092529082015260600161030e565b34801561058a575f80fd5b506040805180820190915260018152603160f81b6020820152610375565b3480156105b3575f80fd5b506103346105c23660046137cd565b610f0a565b3480156105d2575f80fd5b506103346105e136600461383b565b610f31565b3480156105f1575f80fd5b506103346106003660046138ed565b610fee565b348015610610575f80fd5b5061033461061f3660046133c7565b611036565b34801561062f575f80fd5b506102dd61063e36600461397d565b611042565b34801561064e575f80fd5b5061033461065d366004613998565b611053565b34801561066d575f80fd5b5061033461067c3660046139ed565b6110a3565b34801561068c575f80fd5b5061033461069b366004613a99565b6001600160a01b03165f9081526002602052604090205490565b3480156106c0575f80fd5b506106c9611159565b60405161030e9796959493929190613aee565b3480156106e7575f80fd5b506103346106f6366004613b5d565b61119b565b348015610706575f80fd5b5061070f6111f3565b60405165ffffffffffff909116815260200161030e565b348015610731575f80fd5b506064610334565b348015610744575f80fd5b50610334610753366004613baa565b61127a565b348015610763575f80fd5b50610334611290565b348015610777575f80fd5b506102dd610786366004613a99565b6112a9565b348015610796575f80fd5b506103346107a53660046136c4565b6112ba565b3480156107b5575f80fd5b506103026107c43660046133c7565b6112c7565b3480156107d4575f80fd5b506103346107e33660046133c7565b5f9081526004602052604090206001015465ffffffffffff1690565b34801561080a575f80fd5b506103346112cf565b34801561081e575f80fd5b506103ed61082d366004613bfe565b6112d9565b34801561083d575f80fd5b5061033461084c3660046133c7565b61131c565b6102dd61085f366004613c8a565b61135e565b34801561086f575f80fd5b5061033461087e3660046136c4565b6113da565b34801561088e575f80fd5b50600b546001600160a01b03166103b6565b3480156108ab575f80fd5b506040805180820190915260208082527f737570706f72743d627261766f2671756f72756d3d666f722c6162737461696e90820152610375565b3480156108f0575f80fd5b506103347ff2aad550cf55f045cb27e9c559f9889fdfb6e6cdaa032301d6ea397784ae51d781565b348015610923575f80fd5b506102dd610932366004613cc9565b611413565b348015610942575f80fd5b50610334610951366004613cec565b611424565b348015610961575f80fd5b506102dd6109703660046133c7565b611443565b348015610980575f80fd5b506103ed61098f366004613d16565b611454565b34801561099f575f80fd5b506103346109ae3660046133c7565b611497565b3480156109be575f80fd5b507f00000000000000000000000000000000000000000000000000000000000000006103b6565b5f6109f8600b546001600160a01b031690565b905090565b5f6001600160e01b031982166366defe7760e11b1480610a2d57506001600160e01b031982166332a2ad4360e11b145b80610a4857506001600160e01b03198216630271189760e51b145b80610a6357506301ffc9a760e01b6001600160e01b03198316145b92915050565b610a716114a1565b610a7a8161151a565b50565b606060038054610a8c90613d79565b80601f0160208091040260200160405190810160405280929190818152602001828054610ab890613d79565b8015610b035780601f10610ada57610100808354040283529160200191610b03565b820191905f5260205f20905b815481529060010190602001808311610ae657829003601f168201915b5050505050905090565b5f30610b176109e5565b6001600160a01b031614610b3e57604051637485328f60e11b815260040160405180910390fd5b50630a85bd0160e11b949350505050565b5f80610b5d868686866112ba565b9050610b7281610b6d60046115af565b6115d1565b505f610b81828888888861160e565b905065ffffffffffff811615610bf8575f82815260046020908152604091829020600101805465ffffffffffff191665ffffffffffff85169081179091558251858152918201527f9a2e42fd6722813d69113e7d0079d3d940171428df7373df9c7f7617cfda2892910160405180910390a1610c11565b604051634844252360e11b815260040160405180910390fd5b5095945050505050565b5f80610c29868686866112ba565b9050610c4981610c3960056115af565b610c4360046115af565b176115d1565b505f818152600460205260409020805460ff60f01b1916600160f01b17905530610c716109e5565b6001600160a01b031614610cfa575f5b8651811015610cf857306001600160a01b0316878281518110610ca657610ca6613db1565b60200260200101516001600160a01b031603610cf057610cf0858281518110610cd157610cd1613db1565b602002602001015180519060200120600561161c90919063ffffffff16565b600101610c81565b505b610d07818787878761167d565b30610d106109e5565b6001600160a01b031614158015610d3c57506005546001600160801b03808216600160801b9092041614155b15610d46575f6005555b6040518181527f712ae1383f79ac853f8d882153778e0260ef8f03b504e2866e0593e04d2b291f906020015b60405180910390a195945050505050565b5f90815260046020526040902054600160a01b900465ffffffffffff1690565b5f6109f860085465ffffffffffff1690565b5f610a6382611691565b5f80610dcd868686866112ba565b905033610dda82826117ca565b610e0e57604051638fe5d8a960e01b8152600481018390526001600160a01b03821660248201526044015b60405180910390fd5b610e1a8787878761180f565b979650505050505050565b60607f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316634bf5d7e96040518163ffffffff1660e01b81526004015f60405180830381865afa925050508015610ea457506040513d5f823e601f3d908101601f19168201604052610ea19190810190613dc5565b60015b610ee0575060408051808201909152601d81527f6d6f64653d626c6f636b6e756d6265722666726f6d3d64656661756c74000000602082015290565b919050565b5f818152600960205260409020805460018201546002909201549091905b9193909250565b5f80339050610f2984828560405180602001604052805f81525061181c565b949350505050565b5f610f7788888888888080601f0160208091040260200160405190810160405280939291908181526020018383808284375f920191909152508a925089915061183d9050565b610f9f576040516394ab6c0760e01b81526001600160a01b0387166004820152602401610e05565b610fe288878988888080601f0160208091040260200160405190810160405280939291908181526020018383808284375f920191909152508a925061190a915050565b98975050505050505050565b5f80339050610e1a87828888888080601f0160208091040260200160405190810160405280939291908181526020018383808284375f920191909152508a925061190a915050565b5f610a63600a836119e8565b61104a6114a1565b610a7a81611a35565b5f8033905061109986828787878080601f0160208091040260200160405190810160405280939291908181526020018383808284375f9201919091525061181c92505050565b9695505050505050565b5f336110af8184611a9b565b6110d75760405163d9b3955760e01b81526001600160a01b0382166004820152602401610e05565b5f6110e06112cf565b9050801561114c575f61110e8360016110f76111f3565b6111019190613e4d565b65ffffffffffff16611424565b90508181101561114a57604051636121770b60e11b81526001600160a01b03841660048201526024810182905260448101839052606401610e05565b505b610e1a8787878786611b1f565b5f6060805f805f606061116a611d39565b611172611d65565b604080515f80825260208201909252600f60f81b9b939a50919850469750309650945092509050565b5f6111a885858585611d92565b6111d0576040516394ab6c0760e01b81526001600160a01b0384166004820152602401610e05565b6111ea85848660405180602001604052805f81525061181c565b95945050505050565b5f7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166391ddadf46040518163ffffffff1660e01b8152600401602060405180830381865afa92505050801561126e575060408051601f3d908101601f1916820190925261126b91810190613e73565b60015b610ee0576109f8611e1b565b5f611286848484611e25565b90505b9392505050565b5f61129b600a611eb8565b6001600160d01b0316905090565b6112b16114a1565b610a7a81611efc565b5f6111ea858585856113da565b5f6001610a63565b5f6109f860075490565b5f306112e36109e5565b6001600160a01b03161461130a57604051637485328f60e11b815260040160405180910390fd5b5063bc197c8160e01b95945050505050565b5f8181526004602052604081205461135090600160d01b810463ffffffff1690600160a01b900465ffffffffffff16613e8e565b65ffffffffffff1692915050565b6113666114a1565b5f80856001600160a01b0316858585604051611383929190613ead565b5f6040518083038185875af1925050503d805f81146113bd576040519150601f19603f3d011682016040523d82523d5f602084013e6113c2565b606091505b50915091506113d18282611f65565b50505050505050565b5f848484846040516020016113f29493929190613f4c565b60408051601f19818403018152919052805160209091012095945050505050565b61141b6114a1565b610a7a81611f81565b5f611289838361143e60408051602081019091525f815290565b611e25565b61144b6114a1565b610a7a8161201d565b5f3061145e6109e5565b6001600160a01b03161461148557604051637485328f60e11b815260040160405180910390fd5b5063f23a6e6160e01b95945050505050565b5f610a638261205e565b336114aa6109e5565b6001600160a01b0316146114d3576040516347096e4760e01b8152336004820152602401610e05565b306114dc6109e5565b6001600160a01b031614611518575f80366040516114fb929190613ead565b604051809103902090505b8061151160056120fb565b0361150657505b565b6064808211156115475760405163243e544560e01b81526004810183905260248101829052604401610e05565b5f611550611290565b905061156f61155d6111f3565b61156685612168565b600a919061219f565b505060408051828152602081018590527f0553476bf02ef2726e8ce5ced78d63e26e602e4a2257b1f559418e24b4633997910160405180910390a1505050565b5f8160078111156115c2576115c261374d565b600160ff919091161b92915050565b5f806115dc84610db5565b90505f836115e9836115af565b1603611289578381846040516331b75e4d60e01b8152600401610e0593929190613f96565b5f61109986868686866121b9565b81546001600160801b03600160801b82048116918116600183019091160361164857611648604161234a565b6001600160801b038082165f90815260018086016020526040909120939093558354919092018216600160801b029116179055565b61168a858585858561235b565b5050505050565b5f8061169c836123eb565b905060058160078111156116b2576116b261374d565b146116bd5792915050565b5f838152600c60205260409081902054600b549151632c258a9f60e11b81526004810182905290916001600160a01b03169063584b153e90602401602060405180830381865afa158015611713573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906117379190613fb8565b15611746575060059392505050565b600b54604051632ab0f52960e01b8152600481018390526001600160a01b0390911690632ab0f52990602401602060405180830381865afa15801561178d573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906117b19190613fb8565b156117c0575060079392505050565b5060029392505050565b5f806117d584610db5565b60078111156117e6576117e661374d565b1480156112895750505f91825260046020526040909120546001600160a01b0391821691161490565b5f6111ea8585858561251c565b5f6111ea8585858561183860408051602081019091525f815290565b61190a565b5f610e1a856119047f3e83946653575f9a39005e1545185629e92736b7528ab20ca3816f315424a8118a8a8a61188f8c6001600160a01b03165f90815260026020526040902080546001810190915590565b8b516020808e01919091208c518d8301206040516118e998979695949301968752602087019590955260ff9390931660408601526001600160a01b03919091166060850152608084015260a083015260c082015260e00190565b604051602081830303815290604052805190602001206125b3565b846125df565b5f61191986610b6d60016115af565b505f61192e8661192889610d83565b85611e25565b90505f61193e888888858861264f565b905083515f0361199457866001600160a01b03167fb8e138887d0aa13bab447e82de9d5c1777041ecd21ca36ba824ff1e6c07ddda4898884896040516119879493929190613fd7565b60405180910390a2610e1a565b866001600160a01b03167fe2babfbac5889a709b63bb7f598b324e08bc5a4fb9ec647fb3cbc9ec07eb871289888489896040516119d5959493929190613ffe565b60405180910390a2979650505050505050565b5f805f6119f48561274b565b9250925050838265ffffffffffff161115611a2157611a1c611a15856127a3565b86906127d5565b611a23565b805b6001600160d01b031695945050505050565b6008546040805165ffffffffffff928316815291831660208301527fc565b045403dc03c2eea82b81a0465edad9e2e7fc4d97e11421c209da93d7a93910160405180910390a16008805465ffffffffffff191665ffffffffffff92909216919091179055565b80515f906034811015611ab2576001915050610a63565b60131981840101516001600160b01b03198116692370726f706f7365723d60b01b14611ae357600192505050610a63565b5f80611af386602a860386612877565b91509150811580610e1a5750866001600160a01b0316816001600160a01b031614979650505050505050565b5f611b3386868686805190602001206112ba565b905084518651141580611b4857508351865114155b80611b5257508551155b15611b8757855184518651604051630447b05d60e41b8152600481019390935260248301919091526044820152606401610e05565b5f81815260046020526040902054600160a01b900465ffffffffffff1615611bd05780611bb382610db5565b6040516331b75e4d60e01b8152610e059291905f90600401613f96565b5f611bd9610da3565b611be16111f3565b65ffffffffffff16611bf39190614037565b90505f611c0d60085463ffffffff600160301b9091041690565b5f84815260046020526040902080546001600160a01b0319166001600160a01b038716178155909150611c3f836127a3565b815465ffffffffffff91909116600160a01b0265ffffffffffff60a01b19909116178155611c6c82612920565b815463ffffffff91909116600160d01b0263ffffffff60d01b1990911617815588517f7d84a6263ae0d98d3329bd7b46bb4e8d6f98cd35a7adb45c274c8b7fd5ebd5e090859087908c908c906001600160401b03811115611ccf57611ccf613432565b604051908082528060200260200182016040528015611d0257816020015b6060815260200190600190039081611ced5790505b508c89611d0f8a82614037565b8e604051611d259998979695949392919061404a565b60405180910390a150505095945050505050565b60606109f87f00000000000000000000000000000000000000000000000000000000000000005f612950565b60606109f87f00000000000000000000000000000000000000000000000000000000000000006001612950565b5f6111ea836119047ff2aad550cf55f045cb27e9c559f9889fdfb6e6cdaa032301d6ea397784ae51d7888888611de48a6001600160a01b03165f90815260026020526040902080546001810190915590565b60408051602081019690965285019390935260ff90911660608401526001600160a01b0316608083015260a082015260c0016118e9565b5f6109f8436127a3565b5f7f0000000000000000000000000000000000000000000000000000000000000000604051630748d63560e31b81526001600160a01b038681166004830152602482018690529190911690633a46b1a890604401602060405180830381865afa158015611e94573d5f803e3d5ffd5b505050506040513d601f19601f82011682018060405250810190611286919061411f565b80545f908015611ef457611ede83611ed1600184614136565b5f91825260209091200190565b54600160301b90046001600160d01b0316611289565b5f9392505050565b600b54604080516001600160a01b03928316815291831660208301527f08f74ea46ef7894f65eabfb5e6e695de773a000b47c529ab559178069b226401910160405180910390a1600b80546001600160a01b0319166001600160a01b0392909216919091179055565b606082611f7a57611f75826129f9565b610a63565b5080610a63565b8063ffffffff165f03611fa95760405163f1cfbf0560e01b81525f6004820152602401610e05565b6008546040805163ffffffff600160301b9093048316815291831660208301527f7e3f7f0708a84de9203036abaa450dccc85ad5ff52f78c170f3edb55cf5e8828910160405180910390a16008805463ffffffff909216600160301b0269ffffffff00000000000019909216919091179055565b60075460408051918252602082018390527fccb45da8d5717e6c4544694297c4ba5cf151d455c9bb0ed4fc7a38411bc05461910160405180910390a1600755565b604051632394e7a360e21b8152600481018290525f90610a63906001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001690638e539e8c90602401602060405180830381865afa1580156120c7573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906120eb919061411f565b6120f484611036565b6064612a21565b80545f906001600160801b0380821691600160801b900416810361212357612123603161234a565b6001600160801b038181165f908152600185810160205260408220805492905585546fffffffffffffffffffffffffffffffff19169301909116919091179092555090565b5f6001600160d01b0382111561219b576040516306dfcc6560e41b815260d0600482015260248101839052604401610e05565b5090565b5f806121ac858585612ad1565b915091505b935093915050565b5f80600b5f9054906101000a90046001600160a01b03166001600160a01b031663f27a0c926040518163ffffffff1660e01b8152600401602060405180830381865afa15801561220b573d5f803e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061222f919061411f565b90505f3060601b6bffffffffffffffffffffffff19168418600b5460405163b1c5f42760e01b81529192506001600160a01b03169063b1c5f42790612280908a908a908a905f908890600401614149565b602060405180830381865afa15801561229b573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906122bf919061411f565b5f898152600c602052604080822092909255600b5491516308f2a0bb60e41b81526001600160a01b0390921691638f2a0bb091612309918b918b918b919088908a90600401614196565b5f604051808303815f87803b158015612320575f80fd5b505af1158015612332573d5f803e3d5ffd5b50505050610fe282426123459190614037565b6127a3565b634e487b715f52806020526024601cfd5b600b546001600160a01b031663e38335e5348686865f3060601b6bffffffffffffffffffffffff191688186040518763ffffffff1660e01b81526004016123a6959493929190614149565b5f604051808303818588803b1580156123bd575f80fd5b505af11580156123cf573d5f803e3d5ffd5b5050505f9687525050600c602052505060408320929092555050565b5f818152600460205260408120805460ff600160f01b8204811691600160f81b900416811561241f57506007949350505050565b801561243057506002949350505050565b5f61243a86610d83565b9050805f0361245f57604051636ad0607560e01b815260048101879052602401610e05565b5f6124686111f3565b65ffffffffffff16905080821061248557505f9695505050505050565b5f61248f8861131c565b90508181106124a657506001979650505050505050565b6124af88612c21565b15806124ce57505f888152600960205260409020805460019091015411155b156124e157506003979650505050505050565b5f8881526004602052604090206001015465ffffffffffff165f0361250e57506004979650505050505050565b506005979650505050505050565b5f8061252a86868686612c57565b5f818152600c60205260409020549091508015610c1157600b5460405163c4d252f560e01b8152600481018390526001600160a01b039091169063c4d252f5906024015f604051808303815f87803b158015612584575f80fd5b505af1158015612596573d5f803e3d5ffd5b5050505f838152600c602052604081205550509050949350505050565b5f610a636125bf612d06565b8360405161190160f01b8152600281019290925260228201526042902090565b5f836001600160a01b03163b5f0361263d575f806125fd8585612e2f565b5090925090505f8160038111156126165761261661374d565b1480156126345750856001600160a01b0316826001600160a01b0316145b92505050611289565b612648848484612e78565b9050611289565b5f8581526009602090815260408083206001600160a01b03881684526003810190925282205460ff16156126a1576040516371c6af4960e01b81526001600160a01b0387166004820152602401610e05565b6001600160a01b0386165f9081526003820160205260409020805460ff1916600117905560ff85166126ea5783815f015f8282546126df9190614037565b909155506127409050565b5f1960ff8616016127085783816001015f8282546126df9190614037565b60011960ff8616016127275783816002015f8282546126df9190614037565b6040516303599be160e11b815260040160405180910390fd5b509195945050505050565b80545f9081908190808203612769575f805f93509350935050610f03565b5f61277986611ed1600185614136565b546001955065ffffffffffff81169450600160301b90046001600160d01b03169250610f03915050565b5f65ffffffffffff82111561219b576040516306dfcc6560e41b81526030600482015260248101839052604401610e05565b81545f9081816005811115612831575f6127ee84612f4e565b6127f89085614136565b5f8881526020902090915081015465ffffffffffff90811690871610156128215780915061282f565b61282c816001614037565b92505b505b5f61283e878785856130a6565b9050801561286b5761285587611ed1600184614136565b54600160301b90046001600160d01b0316610e1a565b505f9695505050505050565b5f80845183118061288757508284115b1561289657505f9050806121b1565b5f6128a2856001614037565b841180156128ca575061060f60f31b6128be8787016020015190565b6001600160f01b031916145b90505f6128da82151560026141ed565b6128e5906028614037565b9050806128f28787614136565b03612913575f80612904898989613105565b90965094506121b19350505050565b5f809350935050506121b1565b5f63ffffffff82111561219b576040516306dfcc6560e41b81526020600482015260248101839052604401610e05565b606060ff831461296a57612963836131c6565b9050610a63565b81805461297690613d79565b80601f01602080910402602001604051908101604052809291908181526020018280546129a290613d79565b80156129ed5780601f106129c4576101008083540402835291602001916129ed565b820191905f5260205f20905b8154815290600101906020018083116129d057829003601f168201915b50505050509050610a63565b805115612a0857805160208201fd5b60405163d6bda27560e01b815260040160405180910390fd5b5f805f612a2e8686613203565b91509150815f03612a5257838181612a4857612a48614204565b0492505050611289565b818411612a6957612a69600385150260111861234a565b5f848688095f868103871696879004966002600389028118808a02820302808a02820302808a02820302808a02820302808a02820302808a02909103029181900381900460010185841190960395909502919093039390930492909217029150509392505050565b82545f9081908015612bc7575f612aed87611ed1600185614136565b805490915065ffffffffffff80821691600160301b90046001600160d01b0316908816821115612b3057604051632520601d60e01b815260040160405180910390fd5b8765ffffffffffff168265ffffffffffff1603612b6957825465ffffffffffff16600160301b6001600160d01b03891602178355612bb9565b6040805180820190915265ffffffffffff808a1682526001600160d01b03808a1660208085019182528d54600181018f555f8f81529190912094519151909216600160301b029216919091179101555b94508593506121b192505050565b50506040805180820190915265ffffffffffff80851682526001600160d01b0380851660208085019182528854600181018a555f8a815291822095519251909316600160301b0291909316179201919091559050816121b1565b5f81815260096020526040812060028101546001820154612c429190614037565b612c4e6109ae85610d83565b11159392505050565b5f80612c65868686866112ba565b9050612cb381612c7560076115af565b612c7f60066115af565b612c8960026115af565b6001612c96600782614218565b612ca1906002614311565b612cab9190614136565b1818186115d1565b505f818152600460205260409081902080546001600160f81b0316600160f81b179055517f789cf55be980739dad1d0699b93b58e806b51c9d96619bfa8fe0a28abaa7b30c90610d729083815260200190565b5f306001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016148015612d5e57507f000000000000000000000000000000000000000000000000000000000000000046145b15612d8857507f000000000000000000000000000000000000000000000000000000000000000090565b6109f8604080517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60208201527f0000000000000000000000000000000000000000000000000000000000000000918101919091527f000000000000000000000000000000000000000000000000000000000000000060608201524660808201523060a08201525f9060c00160405160208183030381529060405280519060200120905090565b5f805f8351604103612e66576020840151604085015160608601515f1a612e588882858561321f565b955095509550505050612e71565b505081515f91506002905b9250925092565b5f805f856001600160a01b03168585604051602401612e9892919061431f565b60408051601f198184030181529181526020820180516001600160e01b0316630b135d3f60e11b17905251612ecd9190614337565b5f60405180830381855afa9150503d805f8114612f05576040519150601f19603f3d011682016040523d82523d5f602084013e612f0a565b606091505b5091509150818015612f1e57506020815110155b801561109957508051630b135d3f60e11b90612f43908301602090810190840161411f565b149695505050505050565b5f60018211612f5b575090565b816001600160801b8210612f745760809190911c9060401b5b680100000000000000008210612f8f5760409190911c9060201b5b6401000000008210612fa65760209190911c9060101b5b620100008210612fbb5760109190911c9060081b5b6101008210612fcf5760089190911c9060041b5b60108210612fe25760049190911c9060021b5b60048210612fee5760011b5b600302600190811c9081858161300657613006614204565b048201901c9050600181858161301e5761301e614204565b048201901c9050600181858161303657613036614204565b048201901c9050600181858161304e5761304e614204565b048201901c9050600181858161306657613066614204565b048201901c9050600181858161307e5761307e614204565b048201901c905061309d81858161309757613097614204565b04821190565b90039392505050565b5f5b818310156130fd575f6130bb84846132e7565b5f8781526020902090915065ffffffffffff86169082015465ffffffffffff1611156130e9578092506130f7565b6130f4816001614037565b93505b506130a8565b509392505050565b5f808481613114866001614037565b8511801561313c575061060f60f31b6131308388016020015190565b6001600160f01b031916145b90505f61314c82151560026141ed565b90505f8061315a838a614037565b90505b878110156131b5575f61317b6131768784016020015190565b613301565b9050600f8160ff16111561319a575f80975097505050505050506121b1565b6131a56010846141ed565b60ff90911601915060010161315d565b506001999098509650505050505050565b60605f6131d283613379565b6040805160208082528183019092529192505f91906020820181803683375050509182525060208101929092525090565b5f805f1983850993909202808410938190039390930393915050565b5f80807f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a084111561325857505f915060039050826132dd565b604080515f808252602082018084528a905260ff891692820192909252606081018790526080810186905260019060a0016020604051602081039080840390855afa1580156132a9573d5f803e3d5ffd5b5050604051601f1901519150506001600160a01b0381166132d457505f9250600191508290506132dd565b92505f91508190505b9450945094915050565b5f6132f5600284841861434d565b61128990848416614037565b5f60f882901c602f8111801561331a5750603a8160ff16105b1561332857602f1901610a63565b60608160ff1611801561333e575060678160ff16105b1561334c5760561901610a63565b60408160ff16118015613362575060478160ff16105b156133705760361901610a63565b5060ff92915050565b5f60ff8216601f811115610a6357604051632cd44ac360e21b815260040160405180910390fd5b5f602082840312156133b0575f80fd5b81356001600160e01b031981168114611289575f80fd5b5f602082840312156133d7575f80fd5b5035919050565b5f81518084528060208401602086015e5f602082860101526020601f19601f83011685010191505092915050565b602081525f61128960208301846133de565b6001600160a01b0381168114610a7a575f80fd5b634e487b7160e01b5f52604160045260245ffd5b604051601f8201601f191681016001600160401b038111828210171561346e5761346e613432565b604052919050565b5f6001600160401b0382111561348e5761348e613432565b50601f01601f191660200190565b5f6134ae6134a984613476565b613446565b90508281528383830111156134c1575f80fd5b828260208301375f602084830101529392505050565b5f82601f8301126134e6575f80fd5b6112898383356020850161349c565b5f805f8060808587031215613508575f80fd5b84356135138161341e565b935060208501356135238161341e565b92506040850135915060608501356001600160401b03811115613544575f80fd5b613550878288016134d7565b91505092959194509250565b5f6001600160401b0382111561357457613574613432565b5060051b60200190565b5f82601f83011261358d575f80fd5b8135602061359d6134a98361355c565b8083825260208201915060208460051b8701019350868411156135be575f80fd5b602086015b848110156135e35780356135d68161341e565b83529183019183016135c3565b509695505050505050565b5f82601f8301126135fd575f80fd5b8135602061360d6134a98361355c565b8083825260208201915060208460051b87010193508684111561362e575f80fd5b602086015b848110156135e35780358352918301918301613633565b5f82601f830112613659575f80fd5b813560206136696134a98361355c565b82815260059290921b84018101918181019086841115613687575f80fd5b8286015b848110156135e35780356001600160401b038111156136a8575f80fd5b6136b68986838b01016134d7565b84525091830191830161368b565b5f805f80608085870312156136d7575f80fd5b84356001600160401b03808211156136ed575f80fd5b6136f98883890161357e565b9550602087013591508082111561370e575f80fd5b61371a888389016135ee565b9450604087013591508082111561372f575f80fd5b5061373c8782880161364a565b949793965093946060013593505050565b634e487b7160e01b5f52602160045260245ffd5b6008811061377d57634e487b7160e01b5f52602160045260245ffd5b9052565b60208101610a638284613761565b5f80604083850312156137a0575f80fd5b8235915060208301356137b28161341e565b809150509250929050565b803560ff81168114610ee0575f80fd5b5f80604083850312156137de575f80fd5b823591506137ee602084016137bd565b90509250929050565b5f8083601f840112613807575f80fd5b5081356001600160401b0381111561381d575f80fd5b602083019150836020828501011115613834575f80fd5b9250929050565b5f805f805f805f60c0888a031215613851575f80fd5b87359650613861602089016137bd565b955060408801356138718161341e565b945060608801356001600160401b038082111561388c575f80fd5b6138988b838c016137f7565b909650945060808a01359150808211156138b0575f80fd5b6138bc8b838c016134d7565b935060a08a01359150808211156138d1575f80fd5b506138de8a828b016134d7565b91505092959891949750929550565b5f805f805f60808688031215613901575f80fd5b85359450613911602087016137bd565b935060408601356001600160401b038082111561392c575f80fd5b61393889838a016137f7565b90955093506060880135915080821115613950575f80fd5b5061395d888289016134d7565b9150509295509295909350565b65ffffffffffff81168114610a7a575f80fd5b5f6020828403121561398d575f80fd5b81356112898161396a565b5f805f80606085870312156139ab575f80fd5b843593506139bb602086016137bd565b925060408501356001600160401b038111156139d5575f80fd5b6139e1878288016137f7565b95989497509550505050565b5f805f8060808587031215613a00575f80fd5b84356001600160401b0380821115613a16575f80fd5b613a228883890161357e565b95506020870135915080821115613a37575f80fd5b613a43888389016135ee565b94506040870135915080821115613a58575f80fd5b613a648883890161364a565b93506060870135915080821115613a79575f80fd5b508501601f81018713613a8a575f80fd5b6135508782356020840161349c565b5f60208284031215613aa9575f80fd5b81356112898161341e565b5f815180845260208085019450602084015f5b83811015613ae357815187529582019590820190600101613ac7565b509495945050505050565b60ff60f81b8816815260e060208201525f613b0c60e08301896133de565b8281036040840152613b1e81896133de565b606084018890526001600160a01b038716608085015260a0840186905283810360c08501529050613b4f8185613ab4565b9a9950505050505050505050565b5f805f8060808587031215613b70575f80fd5b84359350613b80602086016137bd565b92506040850135613b908161341e565b915060608501356001600160401b03811115613544575f80fd5b5f805f60608486031215613bbc575f80fd5b8335613bc78161341e565b92506020840135915060408401356001600160401b03811115613be8575f80fd5b613bf4868287016134d7565b9150509250925092565b5f805f805f60a08688031215613c12575f80fd5b8535613c1d8161341e565b94506020860135613c2d8161341e565b935060408601356001600160401b0380821115613c48575f80fd5b613c5489838a016135ee565b94506060880135915080821115613c69575f80fd5b613c7589838a016135ee565b93506080880135915080821115613950575f80fd5b5f805f8060608587031215613c9d575f80fd5b8435613ca88161341e565b93506020850135925060408501356001600160401b038111156139d5575f80fd5b5f60208284031215613cd9575f80fd5b813563ffffffff81168114611289575f80fd5b5f8060408385031215613cfd575f80fd5b8235613d088161341e565b946020939093013593505050565b5f805f805f60a08688031215613d2a575f80fd5b8535613d358161341e565b94506020860135613d458161341e565b9350604086013592506060860135915060808601356001600160401b03811115613d6d575f80fd5b61395d888289016134d7565b600181811c90821680613d8d57607f821691505b602082108103613dab57634e487b7160e01b5f52602260045260245ffd5b50919050565b634e487b7160e01b5f52603260045260245ffd5b5f60208284031215613dd5575f80fd5b81516001600160401b03811115613dea575f80fd5b8201601f81018413613dfa575f80fd5b8051613e086134a982613476565b818152856020838501011115613e1c575f80fd5b8160208401602083015e5f91810160200191909152949350505050565b634e487b7160e01b5f52601160045260245ffd5b65ffffffffffff828116828216039080821115613e6c57613e6c613e39565b5092915050565b5f60208284031215613e83575f80fd5b81516112898161396a565b65ffffffffffff818116838216019080821115613e6c57613e6c613e39565b818382375f9101908152919050565b5f815180845260208085019450602084015f5b83811015613ae35781516001600160a01b031687529582019590820190600101613ecf565b5f8282518085526020808601955060208260051b840101602086015f5b84811015613f3f57601f19868403018952613f2d8383516133de565b98840198925090830190600101613f11565b5090979650505050505050565b608081525f613f5e6080830187613ebc565b8281036020840152613f708187613ab4565b90508281036040840152613f848186613ef4565b91505082606083015295945050505050565b83815260608101613faa6020830185613761565b826040830152949350505050565b5f60208284031215613fc8575f80fd5b81518015158114611289575f80fd5b84815260ff84166020820152826040820152608060608201525f61109960808301846133de565b85815260ff8516602082015283604082015260a060608201525f61402560a08301856133de565b8281036080840152610fe281856133de565b80820180821115610a6357610a63613e39565b5f6101208b8352602060018060a01b038c16818501528160408501526140728285018c613ebc565b91508382036060850152614086828b613ab4565b915083820360808501528189518084528284019150828160051b850101838c015f5b838110156140d657601f198784030185526140c48383516133de565b948601949250908501906001016140a8565b505086810360a08801526140ea818c613ef4565b9450505050508560c08401528460e084015282810361010084015261410f81856133de565b9c9b505050505050505050505050565b5f6020828403121561412f575f80fd5b5051919050565b81810381811115610a6357610a63613e39565b60a081525f61415b60a0830188613ebc565b828103602084015261416d8188613ab4565b905082810360408401526141818187613ef4565b60608401959095525050608001529392505050565b60c081525f6141a860c0830189613ebc565b82810360208401526141ba8189613ab4565b905082810360408401526141ce8188613ef4565b60608401969096525050608081019290925260a0909101529392505050565b8082028115828204841417610a6357610a63613e39565b634e487b7160e01b5f52601260045260245ffd5b60ff8181168382160190811115610a6357610a63613e39565b600181815b8085111561426b57815f190482111561425157614251613e39565b8085161561425e57918102915b93841c9390800290614236565b509250929050565b5f8261428157506001610a63565b8161428d57505f610a63565b81600181146142a357600281146142ad576142c9565b6001915050610a63565b60ff8411156142be576142be613e39565b50506001821b610a63565b5060208310610133831016604e8410600b84101617156142ec575081810a610a63565b6142f68383614231565b805f190482111561430957614309613e39565b029392505050565b5f61128960ff841683614273565b828152604060208201525f61128660408301846133de565b5f82518060208501845e5f920191825250919050565b5f8261436757634e487b7160e01b5f52601260045260245ffd5b50049056fea26469706673582212200e577ee648bbab30fd24d7c050f642f510a880b79099615f0ddbf142568aedfa64736f6c63430008190033a2646970667358221220270332aaa61d60bb95dcc410c9204c4d502dffa3afec121e19ed111ab5fa3aee64736f6c63430008190033c001a0450c45027a8d84566ddc9685fd95ea173b0b296aed43649807472b9e22e12872a04a44a2a69931278b45da26c7887b5d3d18dc6b0ee87f7b81c392616119ab961fc0c0",
    "0xf95e33f9025aa049201980543a0ff5a9857cdd10ab82cac82f531bcf36eb5040aaab4fe5c0bbe6a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d493479494d76e24f818426ae84aa404140e8d5f60e10e7ea00000000000000000000000000000000000000000000000000000000000000000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421b9010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800283598f46808468f3a13280a0000000000000000000000000000000000000000000000000000000000000000088000000000000000001a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b4218080a00000000000000000000000000000000000000000000000000000000000000000a0e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855f95bd1b95bce02f95bca0101010783598f468080b95b796080604052348015600e575f80fd5b50615b5d8061001c5f395ff3fe608060405234801561000f575f80fd5b506004361061004a575f3560e01c80633e72891d1461004e578063473566621461007d57806371dccff214610090578063ec81aadb146100a3575b5f80fd5b61006161005c36600461037c565b6100b6565b6040516001600160a01b03909116815260200160405180910390f35b61006161008b366004610505565b61013f565b61006161009e3660046105ca565b610264565b6100616100b13660046105ca565b61028c565b5f808484846040516100c79061029a565b6100d39392919061060f565b604051809103905ff0801580156100ec573d5f803e3d5ffd5b506001805480820182555f919091527fb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf60180546001600160a01b0319166001600160a01b03831617905595945050505050565b82515f90818167ffffffffffffffff81111561015d5761015d6102cb565b604051908082528060200260200182016040528015610186578160200160208202803683370190505b5090505f5b828110156101d2578581815181106101a5576101a561064e565b60200260200101518282815181106101bf576101bf61064e565b602090810291909101015260010161018b565b505f8989898985896040516101e6906102a7565b6101f59695949392919061069c565b604051809103905ff08015801561020e573d5f803e3d5ffd5b505f80546001810182559080527f290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e5630180546001600160a01b0319166001600160a01b0383161790559a9950505050505050505050565b60018181548110610273575f80fd5b5f918252602090912001546001600160a01b0316905081565b5f8181548110610273575f80fd5b6126788061073d83390190565b612d7380612db583390190565b6001600160a01b03811681146102c8575f80fd5b50565b634e487b7160e01b5f52604160045260245ffd5b604051601f8201601f1916810167ffffffffffffffff81118282101715610308576103086102cb565b604052919050565b5f82601f83011261031f575f80fd5b813567ffffffffffffffff811115610339576103396102cb565b61034c601f8201601f19166020016102df565b818152846020838601011115610360575f80fd5b816020850160208301375f918101602001919091529392505050565b5f805f6060848603121561038e575f80fd5b8335610399816102b4565b9250602084013567ffffffffffffffff808211156103b5575f80fd5b6103c187838801610310565b935060408601359150808211156103d6575f80fd5b506103e386828701610310565b9150509250925092565b803560ff811681146103fd575f80fd5b919050565b5f67ffffffffffffffff82111561041b5761041b6102cb565b5060051b60200190565b5f82601f830112610434575f80fd5b8135602061044961044483610402565b6102df565b8083825260208201915060208460051b87010193508684111561046a575f80fd5b602086015b8481101561048f578035610482816102b4565b835291830191830161046f565b509695505050505050565b5f82601f8301126104a9575f80fd5b813560206104b961044483610402565b8083825260208201915060208460051b8701019350868411156104da575f80fd5b602086015b8481101561048f57803583529183019183016104df565b803580151581146103fd575f80fd5b5f805f805f8060c0878903121561051a575f80fd5b863567ffffffffffffffff80821115610531575f80fd5b61053d8a838b01610310565b97506020890135915080821115610552575f80fd5b61055e8a838b01610310565b965061056c60408a016103ed565b95506060890135915080821115610581575f80fd5b61058d8a838b01610425565b945060808901359150808211156105a2575f80fd5b506105af89828a0161049a565b9250506105be60a088016104f6565b90509295509295509295565b5f602082840312156105da575f80fd5b5035919050565b5f81518084528060208401602086015e5f602082860101526020601f19601f83011685010191505092915050565b6001600160a01b03841681526060602082018190525f90610632908301856105e1565b828103604084015261064481856105e1565b9695505050505050565b634e487b7160e01b5f52603260045260245ffd5b5f815180845260208085019450602084015f5b8381101561069157815187529582019590820190600101610675565b509495945050505050565b60c081525f6106ae60c08301896105e1565b602083820360208501526106c2828a6105e1565b60ff89166040860152848103606086015287518082526020808a019450909101905f5b8181101561070a5784516001600160a01b0316835293830193918301916001016106e5565b5050848103608086015261071e8188610662565b935050505061073160a083018415159052565b97965050505050505056fe610180604052348015610010575f80fd5b5060405161267838038061267883398101604081905261002f9161027e565b828280604051806040016040528060018152602001603160f81b8152508585816003908161005d919061037e565b50600461006a828261037e565b5061007a91508390506005610173565b61012052610089816006610173565b61014052815160208084019190912060e052815190820120610100524660a05261011560e05161010051604080517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60208201529081019290925260608201524660808201523060a08201525f9060c00160405160208183030381529060405280519060200120905090565b60805250503060c08190526001600160a01b0383160390506101515760405163438d6fe360e01b81523060048201526024015b60405180910390fd5b6001600160a01b0316610160525050600b805460ff60a01b1916905550610495565b5f60208351101561018e57610187836101a5565b905061019f565b81610199848261037e565b5060ff90505b92915050565b5f80829050601f815111156101cf578260405163305a27a960e01b8152600401610148919061043d565b80516101da82610472565b179392505050565b634e487b7160e01b5f52604160045260245ffd5b5f82601f830112610205575f80fd5b81516001600160401b038082111561021f5761021f6101e2565b604051601f8301601f19908116603f01168101908282118183101715610247576102476101e2565b8160405283815286602085880101111561025f575f80fd5b8360208701602083015e5f602085830101528094505050505092915050565b5f805f60608486031215610290575f80fd5b83516001600160a01b03811681146102a6575f80fd5b60208501519093506001600160401b03808211156102c2575f80fd5b6102ce878388016101f6565b935060408601519150808211156102e3575f80fd5b506102f0868287016101f6565b9150509250925092565b600181811c9082168061030e57607f821691505b60208210810361032c57634e487b7160e01b5f52602260045260245ffd5b50919050565b601f82111561037957805f5260205f20601f840160051c810160208510156103575750805b601f840160051c820191505b81811015610376575f8155600101610363565b50505b505050565b81516001600160401b03811115610397576103976101e2565b6103ab816103a584546102fa565b84610332565b602080601f8311600181146103de575f84156103c75750858301515b5f19600386901b1c1916600185901b178555610435565b5f85815260208120601f198616915b8281101561040c578886015182559484019460019091019084016103ed565b508582101561042957878501515f19600388901b60f8161c191681555b505060018460011b0185555b505050505050565b602081525f82518060208401528060208501604085015e5f604082850101526040601f19601f83011684010191505092915050565b8051602080830151919081101561032c575f1960209190910360031b1b16919050565b60805160a05160c05160e051610100516101205161014051610160516121736105055f395f8181610304015281816105b2015281816106610152610cb901525f61104001525f61101301525f610e1901525f610df101525f610d4c01525f610d7601525f610da001526121735ff3fe608060405234801561000f575f80fd5b50600436106101bb575f3560e01c8063704b6c02116100f35780639ab24eb011610093578063d505accf1161006e578063d505accf14610423578063dd62ed3e14610436578063f1127ed81461046e578063f851a440146104ad575f80fd5b80639ab24eb0146103ea578063a9059cbb146103fd578063c3cda52014610410575f80fd5b806384b0196e116100ce57806384b0196e1461039e5780638e539e8c146103b957806391ddadf4146103cc57806395d89b41146103e2575f80fd5b8063704b6c021461035057806370a08231146103635780637ecebe001461038b575f80fd5b80633644e5151161015e578063587cde1e11610139578063587cde1e146102aa5780635c19a95c146102ed5780636f307dc3146103025780636fcfff4514610328575f80fd5b80633644e515146102655780633a46b1a81461026d5780634bf5d7e914610280575f80fd5b8063205c287811610199578063205c28781461021257806323b872dd146102255780632f4f21e214610238578063313ce5671461024b575f80fd5b806306fdde03146101bf578063095ea7b3146101dd57806318160ddd14610200575b5f80fd5b6101c76104c0565b6040516101d49190611d81565b60405180910390f35b6101f06101eb366004611da9565b610550565b60405190151581526020016101d4565b6002545b6040519081526020016101d4565b6101f0610220366004611da9565b610569565b6101f0610233366004611dd1565b6105e1565b6101f0610246366004611da9565b610604565b610253610692565b60405160ff90911681526020016101d4565b6102046106a0565b61020461027b366004611da9565b6106a9565b60408051808201909152600e81526d06d6f64653d74696d657374616d760941b60208201526101c7565b6102d56102b8366004611e0a565b6001600160a01b039081165f908152600860205260409020541690565b6040516001600160a01b0390911681526020016101d4565b6103006102fb366004611e0a565b6106e3565b005b7f00000000000000000000000000000000000000000000000000000000000000006102d5565b61033b610336366004611e0a565b6106f2565b60405163ffffffff90911681526020016101d4565b61030061035e366004611e0a565b6106fc565b610204610371366004611e0a565b6001600160a01b03165f9081526020819052604090205490565b610204610399366004611e0a565b610809565b6103a6610813565b6040516101d49796959493929190611e23565b6102046103c7366004611eba565b610855565b60405165ffffffffffff421681526020016101d4565b6101c7610879565b6102046103f8366004611e0a565b610888565b6101f061040b366004611da9565b6108a8565b61030061041e366004611ee2565b6108b5565b610300610431366004611f38565b610971565b610204610444366004611fa0565b6001600160a01b039182165f90815260016020908152604080832093909416825291909152205490565b61048161047c366004611fd1565b610aa7565b60408051825165ffffffffffff1681526020928301516001600160d01b031692810192909252016101d4565b600b546102d5906001600160a01b031681565b6060600380546104cf9061200e565b80601f01602080910402602001604051908101604052809291908181526020018280546104fb9061200e565b80156105465780601f1061051d57610100808354040283529160200191610546565b820191905f5260205f20905b81548152906001019060200180831161052957829003601f168201915b5050505050905090565b5f3361055d818585610acb565b60019150505b92915050565b5f306001600160a01b038416036105a35760405163ec442f0560e01b81526001600160a01b03841660048201526024015b60405180910390fd5b6105ad3383610add565b6105d87f00000000000000000000000000000000000000000000000000000000000000008484610b11565b50600192915050565b5f336105ee858285610b70565b6105f9858585610bec565b506001949350505050565b5f3330810361062857604051634b637e8f60e11b815230600482015260240161059a565b306001600160a01b0385160361065c5760405163ec442f0560e01b81526001600160a01b038516600482015260240161059a565b6106887f0000000000000000000000000000000000000000000000000000000000000000823086610c49565b61055d8484610c82565b5f61069b610cb6565b905090565b5f61069b610d40565b5f6106d36106b683610e69565b6001600160a01b0385165f90815260096020526040902090610ead565b6001600160d01b03169392505050565b336106ee8183610f5d565b5050565b5f61056382610fce565b600b54600160a01b900460ff161561076e5760405162461bcd60e51b815260206004820152602f60248201527f484245564d5f577261707065645f546f6b656e3a2061646d696e20686173206160448201526e1b1c9958591e481899595b881cd95d608a1b606482015260840161059a565b6001600160a01b0381166107e25760405162461bcd60e51b815260206004820152603560248201527f484245564d5f577261707065645f546f6b656e3a206e65772061646d696e20616044820152746464726573732063616e6e6f74206265207a65726f60581b606482015260840161059a565b600b80546001600160a81b0319166001600160a01b0390921691909117600160a01b179055565b5f61056382610fef565b5f6060805f805f606061082461100c565b61082c611039565b604080515f80825260208201909252600f60f81b9b939a50919850469750309650945092509050565b5f61086a61086283610e69565b600a90610ead565b6001600160d01b031692915050565b6060600480546104cf9061200e565b6001600160a01b0381165f90815260096020526040812061086a90611066565b5f3361055d818585610bec565b834211156108d957604051632341d78760e11b81526004810185905260240161059a565b604080517fe48329057bfd03d55e49b547132e39cffd9c1820ad7b9d4c5307691425d15adf60208201526001600160a01b0388169181019190915260608101869052608081018590525f906109529061094a9060a0016040516020818303038152906040528051906020012061109d565b8585856110c9565b905061095e81876110f5565b6109688188610f5d565b50505050505050565b834211156109955760405163313c898160e11b81526004810185905260240161059a565b5f7f6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c98888886109e08c6001600160a01b03165f90815260076020526040902080546001810190915590565b6040805160208101969096526001600160a01b0394851690860152929091166060840152608083015260a082015260c0810186905260e0016040516020818303038152906040528051906020012090505f610a3a8261109d565b90505f610a49828787876110c9565b9050896001600160a01b0316816001600160a01b031614610a90576040516325c0072360e11b81526001600160a01b0380831660048301528b16602482015260440161059a565b610a9b8a8a8a610acb565b50505050505050505050565b604080518082019091525f8082526020820152610ac48383611147565b9392505050565b610ad8838383600161117b565b505050565b6001600160a01b038216610b0657604051634b637e8f60e11b81525f600482015260240161059a565b6106ee825f8361124d565b6040516001600160a01b03838116602483015260448201839052610ad891859182169063a9059cbb906064015b604051602081830303815290604052915060e01b6020820180516001600160e01b038381831617835250505050611258565b6001600160a01b038381165f908152600160209081526040808320938616835292905220545f19811015610be65781811015610bd857604051637dc7a0d960e11b81526001600160a01b0384166004820152602481018290526044810183905260640161059a565b610be684848484035f61117b565b50505050565b6001600160a01b038316610c1557604051634b637e8f60e11b81525f600482015260240161059a565b6001600160a01b038216610c3e5760405163ec442f0560e01b81525f600482015260240161059a565b610ad883838361124d565b6040516001600160a01b038481166024830152838116604483015260648201839052610be69186918216906323b872dd90608401610b3e565b6001600160a01b038216610cab5760405163ec442f0560e01b81525f600482015260240161059a565b6106ee5f838361124d565b5f7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663313ce5676040518163ffffffff1660e01b8152600401602060405180830381865afa925050508015610d31575060408051601f3d908101601f19168201909252610d2e91810190612046565b60015b610d3b5750601290565b919050565b5f306001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016148015610d9857507f000000000000000000000000000000000000000000000000000000000000000046145b15610dc257507f000000000000000000000000000000000000000000000000000000000000000090565b61069b604080517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60208201527f0000000000000000000000000000000000000000000000000000000000000000918101919091527f000000000000000000000000000000000000000000000000000000000000000060608201524660808201523060a08201525f9060c00160405160208183030381529060405280519060200120905090565b5f4265ffffffffffff81168310610ea457604051637669fc0f60e11b81526004810184905265ffffffffffff8216602482015260440161059a565b610ac4836112c4565b81545f9081816005811115610f09575f610ec6846112fa565b610ed09085612075565b5f8881526020902090915081015465ffffffffffff9081169087161015610ef957809150610f07565b610f04816001612088565b92505b505b5f610f1687878585611452565b90508015610f5057610f3a87610f2d600184612075565b5f91825260209091200190565b54600160301b90046001600160d01b0316610f52565b5f5b979650505050505050565b6001600160a01b038281165f8181526008602052604080822080548686166001600160a01b0319821681179092559151919094169392849290917f3134e8a2e6d97e929a7e54011ea5485d7d196dd5f0ba4d4ef95803e8e3fc257f9190a4610ad88183610fc9866114b1565b6114ce565b6001600160a01b0381165f9081526009602052604081205461056390611637565b6001600160a01b0381165f90815260076020526040812054610563565b606061069b7f00000000000000000000000000000000000000000000000000000000000000006005611667565b606061069b7f00000000000000000000000000000000000000000000000000000000000000006006611667565b80545f9080156110955761107f83610f2d600184612075565b54600160301b90046001600160d01b0316610ac4565b5f9392505050565b5f6105636110a9610d40565b8360405161190160f01b8152600281019290925260228201526042902090565b5f805f806110d988888888611710565b9250925092506110e982826117d8565b50909695505050505050565b6001600160a01b0382165f908152600760205260409020805460018101909155818114610ad8576040516301d4b62360e61b81526001600160a01b03841660048201526024810182905260440161059a565b604080518082019091525f80825260208201526001600160a01b0383165f908152600960205260409020610ac49083611890565b6001600160a01b0384166111a45760405163e602df0560e01b81525f600482015260240161059a565b6001600160a01b0383166111cd57604051634a1406b160e11b81525f600482015260240161059a565b6001600160a01b038085165f9081526001602090815260408083209387168352929052208290558015610be657826001600160a01b0316846001600160a01b03167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9258460405161123f91815260200190565b60405180910390a350505050565b610ad88383836118fd565b5f8060205f8451602086015f885af180611277576040513d5f823e3d81fd5b50505f513d9150811561128e57806001141561129b565b6001600160a01b0384163b155b15610be657604051635274afe760e01b81526001600160a01b038516600482015260240161059a565b5f65ffffffffffff8211156112f6576040516306dfcc6560e41b8152603060048201526024810183905260440161059a565b5090565b5f60018211611307575090565b816001600160801b82106113205760809190911c9060401b5b68010000000000000000821061133b5760409190911c9060201b5b64010000000082106113525760209190911c9060101b5b6201000082106113675760109190911c9060081b5b610100821061137b5760089190911c9060041b5b6010821061138e5760049190911c9060021b5b6004821061139a5760011b5b600302600190811c908185816113b2576113b261209b565b048201901c905060018185816113ca576113ca61209b565b048201901c905060018185816113e2576113e261209b565b048201901c905060018185816113fa576113fa61209b565b048201901c905060018185816114125761141261209b565b048201901c9050600181858161142a5761142a61209b565b048201901c90506114498185816114435761144361209b565b04821190565b90039392505050565b5f5b818310156114a9575f6114678484611963565b5f8781526020902090915065ffffffffffff86169082015465ffffffffffff161115611495578092506114a3565b6114a0816001612088565b93505b50611454565b509392505050565b6001600160a01b0381165f90815260208190526040812054610563565b816001600160a01b0316836001600160a01b0316141580156114ef57505f81115b15610ad8576001600160a01b03831615611596576001600160a01b0383165f90815260096020526040812081906115319061197d61152c86611988565b6119bb565b6001600160d01b031691506001600160d01b03169150846001600160a01b03167fdec2bacdd2f05b59de34da9b523dff8be42e5e38e818c82fdb0bae774387a724838360405161158b929190918252602082015260400190565b60405180910390a250505b6001600160a01b03821615610ad8576001600160a01b0382165f90815260096020526040812081906115ce906119ec61152c86611988565b6001600160d01b031691506001600160d01b03169150836001600160a01b03167fdec2bacdd2f05b59de34da9b523dff8be42e5e38e818c82fdb0bae774387a7248383604051611628929190918252602082015260400190565b60405180910390a25050505050565b5f63ffffffff8211156112f6576040516306dfcc6560e41b8152602060048201526024810183905260440161059a565b606060ff83146116815761167a836119f7565b9050610563565b81805461168d9061200e565b80601f01602080910402602001604051908101604052809291908181526020018280546116b99061200e565b80156117045780601f106116db57610100808354040283529160200191611704565b820191905f5260205f20905b8154815290600101906020018083116116e757829003601f168201915b50505050509050610563565b5f80807f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a084111561174957505f915060039050826117ce565b604080515f808252602082018084528a905260ff891692820192909252606081018790526080810186905260019060a0016020604051602081039080840390855afa15801561179a573d5f803e3d5ffd5b5050604051601f1901519150506001600160a01b0381166117c557505f9250600191508290506117ce565b92505f91508190505b9450945094915050565b5f8260038111156117eb576117eb6120af565b036117f4575050565b6001826003811115611808576118086120af565b036118265760405163f645eedf60e01b815260040160405180910390fd5b600282600381111561183a5761183a6120af565b0361185b5760405163fce698f760e01b81526004810182905260240161059a565b600382600381111561186f5761186f6120af565b036106ee576040516335e2f38360e21b81526004810182905260240161059a565b604080518082019091525f8082526020820152825f018263ffffffff16815481106118bd576118bd6120c3565b5f9182526020918290206040805180820190915291015465ffffffffffff81168252600160301b90046001600160d01b0316918101919091529392505050565b611908838383611a34565b6001600160a01b038316611958575f61192060025490565b90506001600160d01b038082111561195557604051630e58ae9360e11b8152600481018390526024810182905260440161059a565b50505b610ad8838383611b5a565b5f61197160028484186120d7565b610ac490848416612088565b5f610ac482846120f6565b5f6001600160d01b038211156112f6576040516306dfcc6560e41b815260d060048201526024810183905260440161059a565b5f806119df426119d76119cd88611066565b868863ffffffff16565b879190611bcf565b915091505b935093915050565b5f610ac4828461211d565b60605f611a0383611bdc565b6040805160208082528183019092529192505f91906020820181803683375050509182525060208101929092525090565b6001600160a01b038316611a5e578060025f828254611a539190612088565b90915550611ace9050565b6001600160a01b0383165f9081526020819052604090205481811015611ab05760405163391434e360e21b81526001600160a01b0385166004820152602481018290526044810183905260640161059a565b6001600160a01b0384165f9081526020819052604090209082900390555b6001600160a01b038216611aea57600280548290039055611b08565b6001600160a01b0382165f9081526020819052604090208054820190555b816001600160a01b0316836001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051611b4d91815260200190565b60405180910390a3505050565b6001600160a01b038316611b7c57611b79600a6119ec61152c84611988565b50505b6001600160a01b038216611b9e57611b9b600a61197d61152c84611988565b50505b6001600160a01b038381165f90815260086020526040808220548584168352912054610ad8929182169116836114ce565b5f806119df858585611c03565b5f60ff8216601f81111561056357604051632cd44ac360e21b815260040160405180910390fd5b82545f9081908015611cf9575f611c1f87610f2d600185612075565b805490915065ffffffffffff80821691600160301b90046001600160d01b0316908816821115611c6257604051632520601d60e01b815260040160405180910390fd5b8765ffffffffffff168265ffffffffffff1603611c9b57825465ffffffffffff16600160301b6001600160d01b03891602178355611ceb565b6040805180820190915265ffffffffffff808a1682526001600160d01b03808a1660208085019182528d54600181018f555f8f81529190912094519151909216600160301b029216919091179101555b94508593506119e492505050565b50506040805180820190915265ffffffffffff80851682526001600160d01b0380851660208085019182528854600181018a555f8a815291822095519251909316600160301b0291909316179201919091559050816119e4565b5f81518084528060208401602086015e5f602082860101526020601f19601f83011685010191505092915050565b602081525f610ac46020830184611d53565b80356001600160a01b0381168114610d3b575f80fd5b5f8060408385031215611dba575f80fd5b611dc383611d93565b946020939093013593505050565b5f805f60608486031215611de3575f80fd5b611dec84611d93565b9250611dfa60208501611d93565b9150604084013590509250925092565b5f60208284031215611e1a575f80fd5b610ac482611d93565b60ff60f81b881681525f602060e06020840152611e4360e084018a611d53565b8381036040850152611e55818a611d53565b606085018990526001600160a01b038816608086015260a0850187905284810360c0860152855180825260208088019350909101905f5b81811015611ea857835183529284019291840191600101611e8c565b50909c9b505050505050505050505050565b5f60208284031215611eca575f80fd5b5035919050565b60ff81168114611edf575f80fd5b50565b5f805f805f8060c08789031215611ef7575f80fd5b611f0087611d93565b955060208701359450604087013593506060870135611f1e81611ed1565b9598949750929560808101359460a0909101359350915050565b5f805f805f805f60e0888a031215611f4e575f80fd5b611f5788611d93565b9650611f6560208901611d93565b955060408801359450606088013593506080880135611f8381611ed1565b9699959850939692959460a0840135945060c09093013592915050565b5f8060408385031215611fb1575f80fd5b611fba83611d93565b9150611fc860208401611d93565b90509250929050565b5f8060408385031215611fe2575f80fd5b611feb83611d93565b9150602083013563ffffffff81168114612003575f80fd5b809150509250929050565b600181811c9082168061202257607f821691505b60208210810361204057634e487b7160e01b5f52602260045260245ffd5b50919050565b5f60208284031215612056575f80fd5b8151610ac481611ed1565b634e487b7160e01b5f52601160045260245ffd5b8181038181111561056357610563612061565b8082018082111561056357610563612061565b634e487b7160e01b5f52601260045260245ffd5b634e487b7160e01b5f52602160045260245ffd5b634e487b7160e01b5f52603260045260245ffd5b5f826120f157634e487b7160e01b5f52601260045260245ffd5b500490565b6001600160d01b0382811682821603908082111561211657612116612061565b5092915050565b6001600160d01b038181168382160190808211156121165761211661206156fea26469706673582212205b16e510b5cf32ab56362e7ad0a35bcf5162b6d036b142bcce44aa106905bb1f64736f6c63430008190033610160604052348015610010575f80fd5b50604051612d73380380612d7383398101604081905261002f916109de565b6040805180820190915260018152603160f81b602082015286908190818860036100598382610b25565b5060046100668282610b25565b50610076915083905060056101c0565b610120526100858160066101c0565b61014052815160208084019190912060e052815190820120610100524660a05261011160e05161010051604080517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60208201529081019290925260608201524660808201523060a08201525f9060c00160405160208183030381529060405280519060200120905090565b60805250503060c05250600b805460ff861660ff60ff60a81b011990911617600160a81b831515021760ff60b01b191690555f5b83518163ffffffff1610156101b4576101a2848263ffffffff168151811061016f5761016f610be4565b6020026020010151848363ffffffff168151811061018f5761018f610be4565b60200260200101516101f260201b60201c565b806101ac81610c0c565b915050610145565b50505050505050610cf3565b5f6020835110156101db576101d48361022f565b90506101ec565b816101e68482610b25565b5060ff90505b92915050565b6001600160a01b0382166102205760405163ec442f0560e01b81525f60048201526024015b60405180910390fd5b61022b5f838361026c565b5050565b5f80829050601f81511115610259578260405163305a27a960e01b81526004016102179190610c2e565b805161026482610c63565b179392505050565b61027783838361027c565b505050565b6102878383836102e2565b6001600160a01b0383166102d7575f61029f60025490565b90506001600160d01b03808211156102d457604051630e58ae9360e11b81526004810183905260248101829052604401610217565b50505b610277838383610408565b6001600160a01b03831661030c578060025f8282546103019190610c86565b9091555061037c9050565b6001600160a01b0383165f908152602081905260409020548181101561035e5760405163391434e360e21b81526001600160a01b03851660048201526024810182905260448101839052606401610217565b6001600160a01b0384165f9081526020819052604090209082900390555b6001600160a01b038216610398576002805482900390556103b6565b6001600160a01b0382165f9081526020819052604090208054820190555b816001600160a01b0316836001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040516103fb91815260200190565b60405180910390a3505050565b6001600160a01b03831661043657610433600a610aa461049060201b1761042e846104a2565b6104d9565b50505b6001600160a01b03821661045f5761045c600a610aaf61050760201b1761042e846104a2565b50505b6001600160a01b038381165f9081526008602052604080822054858416835291205461027792918216911683610512565b5f61049b8284610c99565b9392505050565b5f6001600160d01b038211156104d5576040516306dfcc6560e41b815260d0600482015260248101839052604401610217565b5090565b5f806104fa426104f26104eb88610662565b868860201c565b8791906106a9565b915091505b935093915050565b5f61049b8284610cc0565b816001600160a01b0316836001600160a01b03161415801561053357505f81115b15610277576001600160a01b038316156105cb576001600160a01b0383165f908152600960209081526040822082916105799190610507901b610aaf1761042e866104a2565b6001600160d01b031691506001600160d01b03169150846001600160a01b03165f80516020612d5383398151915283836040516105c0929190918252602082015260400190565b60405180910390a250505b6001600160a01b03821615610277576001600160a01b0382165f9081526009602090815260408220829161060c9190610490901b610aa41761042e866104a2565b6001600160d01b031691506001600160d01b03169150836001600160a01b03165f80516020612d538339815191528383604051610653929190918252602082015260400190565b60405180910390a25050505050565b80545f9080156106a1576106888361067b600184610ce0565b5f91825260209091200190565b54660100000000000090046001600160d01b031661049b565b5f9392505050565b5f806104fa85858582545f90819080156107b0575f6106cd8761067b600185610ce0565b805490915065ffffffffffff80821691660100000000000090046001600160d01b031690881682111561071357604051632520601d60e01b815260040160405180910390fd5b8765ffffffffffff168265ffffffffffff160361074f57825465ffffffffffff1666010000000000006001600160d01b038916021783556107a2565b6040805180820190915265ffffffffffff808a1682526001600160d01b03808a1660208085019182528d54600181018f555f8f815291909120945191519092166601000000000000029216919091179101555b94508593506104ff92505050565b50506040805180820190915265ffffffffffff80851682526001600160d01b0380851660208085019182528854600181018a555f8a81529182209551925190931666010000000000000291909316179201919091559050816104ff565b634e487b7160e01b5f52604160045260245ffd5b604051601f8201601f191681016001600160401b03811182821017156108495761084961080d565b604052919050565b5f82601f830112610860575f80fd5b81516001600160401b038111156108795761087961080d565b61088c601f8201601f1916602001610821565b8181528460208386010111156108a0575f80fd5b8160208501602083015e5f918101602001919091529392505050565b805160ff811681146108cc575f80fd5b919050565b5f6001600160401b038211156108e9576108e961080d565b5060051b60200190565b5f82601f830112610902575f80fd5b81516020610917610912836108d1565b610821565b8083825260208201915060208460051b870101935086841115610938575f80fd5b602086015b848110156109685780516001600160a01b038116811461095b575f80fd5b835291830191830161093d565b509695505050505050565b5f82601f830112610982575f80fd5b81516020610992610912836108d1565b8083825260208201915060208460051b8701019350868411156109b3575f80fd5b602086015b8481101561096857805183529183019183016109b8565b805180151581146108cc575f80fd5b5f805f805f8060c087890312156109f3575f80fd5b86516001600160401b0380821115610a09575f80fd5b610a158a838b01610851565b97506020890151915080821115610a2a575f80fd5b610a368a838b01610851565b9650610a4460408a016108bc565b95506060890151915080821115610a59575f80fd5b610a658a838b016108f3565b94506080890151915080821115610a7a575f80fd5b50610a8789828a01610973565b925050610a9660a088016109cf565b90509295509295509295565b600181811c90821680610ab657607f821691505b602082108103610ad457634e487b7160e01b5f52602260045260245ffd5b50919050565b601f82111561027757805f5260205f20601f840160051c81016020851015610aff5750805b601f840160051c820191505b81811015610b1e575f8155600101610b0b565b5050505050565b81516001600160401b03811115610b3e57610b3e61080d565b610b5281610b4c8454610aa2565b84610ada565b602080601f831160018114610b85575f8415610b6e5750858301515b5f19600386901b1c1916600185901b178555610bdc565b5f85815260208120601f198616915b82811015610bb357888601518255948401946001909101908401610b94565b5085821015610bd057878501515f19600388901b60f8161c191681555b505060018460011b0185555b505050505050565b634e487b7160e01b5f52603260045260245ffd5b634e487b7160e01b5f52601160045260245ffd5b5f63ffffffff808316818103610c2457610c24610bf8565b6001019392505050565b602081525f82518060208401528060208501604085015e5f604082850101526040601f19601f83011684010191505092915050565b80516020808301519190811015610ad4575f1960209190910360031b1b16919050565b808201808211156101ec576101ec610bf8565b6001600160d01b03818116838216019080821115610cb957610cb9610bf8565b5092915050565b6001600160d01b03828116828216039080821115610cb957610cb9610bf8565b818103818111156101ec576101ec610bf8565b60805160a05160c05160e05161010051610120516101405161200f610d445f395f610e2301525f610df601525f610bc801525f610ba001525f610afb01525f610b2501525f610b4f015261200f5ff3fe608060405234801561000f575f80fd5b50600436106101bb575f3560e01c806370a08231116100f35780639dc29fac11610093578063d505accf1161006e578063d505accf1461040c578063dd62ed3e1461041f578063f1127ed814610457578063f851a44014610496575f80fd5b80639dc29fac146103d3578063a9059cbb146103e6578063c3cda520146103f9575f80fd5b80638e539e8c116100ce5780638e539e8c1461038f57806391ddadf4146103a257806395d89b41146103b85780639ab24eb0146103c0575f80fd5b806370a08231146103395780637ecebe001461036157806384b0196e14610374575f80fd5b80633a46b1a81161015e578063587cde1e11610139578063587cde1e146102a85780635c19a95c146102eb5780636fcfff45146102fe578063704b6c0214610326575f80fd5b80633a46b1a81461025657806340c10f19146102695780634bf5d7e91461027e575f80fd5b80632121dc75116101995780632121dc751461021257806323b872dd14610226578063313ce567146102395780633644e5151461024e575f80fd5b806306fdde03146101bf578063095ea7b3146101dd57806318160ddd14610200575b5f80fd5b6101c76104ae565b6040516101d49190611bf7565b60405180910390f35b6101f06101eb366004611c24565b61053e565b60405190151581526020016101d4565b6002545b6040519081526020016101d4565b600b546101f090600160a81b900460ff1681565b6101f0610234366004611c4c565b610557565b600b5460405160ff90911681526020016101d4565b6102046105ca565b610204610264366004611c24565b6105d8565b61027c610277366004611c24565b610612565b005b60408051808201909152600e81526d06d6f64653d74696d657374616d760941b60208201526101c7565b6102d36102b6366004611c85565b6001600160a01b039081165f908152600860205260409020541690565b6040516001600160a01b0390911681526020016101d4565b61027c6102f9366004611c85565b61064f565b61031161030c366004611c85565b61065a565b60405163ffffffff90911681526020016101d4565b61027c610334366004611c85565b610664565b610204610347366004611c85565b6001600160a01b03165f9081526020819052604090205490565b61020461036f366004611c85565b610751565b61037c61075b565b6040516101d49796959493929190611c9e565b61020461039d366004611d35565b61079d565b60405165ffffffffffff421681526020016101d4565b6101c76107c1565b6102046103ce366004611c85565b6107d0565b61027c6103e1366004611c24565b6107f0565b6101f06103f4366004611c24565b610829565b61027c610407366004611d5c565b610895565b61027c61041a366004611db0565b610951565b61020461042d366004611e15565b6001600160a01b039182165f90815260016020908152604080832093909416825291909152205490565b61046a610465366004611e46565b610a87565b60408051825165ffffffffffff1681526020928301516001600160d01b031692810192909252016101d4565b600b546102d39061010090046001600160a01b031681565b6060600380546104bd90611e83565b80601f01602080910402602001604051908101604052809291908181526020018280546104e990611e83565b80156105345780601f1061050b57610100808354040283529160200191610534565b820191905f5260205f20905b81548152906001019060200180831161051757829003601f168201915b5050505050905090565b5f3361054b818585610aba565b60019150505b92915050565b600b545f90600160a81b900460ff166105b75760405162461bcd60e51b815260206004820181905260248201527f5472616e7366657273206172652063757272656e746c792064697361626c656460448201526064015b60405180910390fd5b6105c2848484610acc565b949350505050565b5f6105d3610aef565b905090565b5f6106026105e583610c18565b6001600160a01b0385165f90815260096020526040902090610c5c565b6001600160d01b03169392505050565b600b5461010090046001600160a01b031633146106415760405162461bcd60e51b81526004016105ae90611ebb565b61064b8282610d0c565b5050565b3361064b8183610d40565b5f61055182610db1565b600b5461010090046001600160a01b0316156106c25760405162461bcd60e51b815260206004820152601a60248201527f41646d696e2068617320616c7265616479206265656e2073657400000000000060448201526064016105ae565b6001600160a01b0381166107185760405162461bcd60e51b815260206004820181905260248201527f4e65772061646d696e20616464726573732063616e6e6f74206265207a65726f60448201526064016105ae565b600b805460ff60b01b196001600160a01b03909316610100029290921661010061ff0160a81b031990921691909117600160b01b179055565b5f61055182610dd2565b5f6060805f805f606061076c610def565b610774610e1c565b604080515f80825260208201909252600f60f81b9b939a50919850469750309650945092509050565b5f6107b26107aa83610c18565b600a90610c5c565b6001600160d01b031692915050565b6060600480546104bd90611e83565b6001600160a01b0381165f9081526009602052604081206107b290610e49565b600b5461010090046001600160a01b0316331461081f5760405162461bcd60e51b81526004016105ae90611ebb565b61064b8282610e80565b600b545f90600160a81b900460ff166108845760405162461bcd60e51b815260206004820181905260248201527f5472616e7366657273206172652063757272656e746c792064697361626c656460448201526064016105ae565b61088e8383610eb4565b9392505050565b834211156108b957604051632341d78760e11b8152600481018590526024016105ae565b604080517fe48329057bfd03d55e49b547132e39cffd9c1820ad7b9d4c5307691425d15adf60208201526001600160a01b0388169181019190915260608101869052608081018590525f906109329061092a9060a00160405160208183030381529060405280519060200120610ec1565b858585610eed565b905061093e8187610f19565b6109488188610d40565b50505050505050565b834211156109755760405163313c898160e11b8152600481018590526024016105ae565b5f7f6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c98888886109c08c6001600160a01b03165f90815260076020526040902080546001810190915590565b6040805160208101969096526001600160a01b0394851690860152929091166060840152608083015260a082015260c0810186905260e0016040516020818303038152906040528051906020012090505f610a1a82610ec1565b90505f610a2982878787610eed565b9050896001600160a01b0316816001600160a01b031614610a70576040516325c0072360e11b81526001600160a01b0380831660048301528b1660248201526044016105ae565b610a7b8a8a8a610aba565b50505050505050505050565b604080518082019091525f808252602082015261088e8383610f6b565b5f61088e8284611f11565b5f61088e8284611f38565b610ac78383836001610f9f565b505050565b5f33610ad9858285611072565b610ae48585856110e8565b506001949350505050565b5f306001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016148015610b4757507f000000000000000000000000000000000000000000000000000000000000000046145b15610b7157507f000000000000000000000000000000000000000000000000000000000000000090565b6105d3604080517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60208201527f0000000000000000000000000000000000000000000000000000000000000000918101919091527f000000000000000000000000000000000000000000000000000000000000000060608201524660808201523060a08201525f9060c00160405160208183030381529060405280519060200120905090565b5f4265ffffffffffff81168310610c5357604051637669fc0f60e11b81526004810184905265ffffffffffff821660248201526044016105ae565b61088e83611145565b81545f9081816005811115610cb8575f610c758461117b565b610c7f9085611f58565b5f8881526020902090915081015465ffffffffffff9081169087161015610ca857809150610cb6565b610cb3816001611f6b565b92505b505b5f610cc5878785856112d3565b90508015610cff57610ce987610cdc600184611f58565b5f91825260209091200190565b54600160301b90046001600160d01b0316610d01565b5f5b979650505050505050565b6001600160a01b038216610d355760405163ec442f0560e01b81525f60048201526024016105ae565b61064b5f8383611332565b6001600160a01b038281165f8181526008602052604080822080548686166001600160a01b0319821681179092559151919094169392849290917f3134e8a2e6d97e929a7e54011ea5485d7d196dd5f0ba4d4ef95803e8e3fc257f9190a4610ac78183610dac8661133d565b61135a565b6001600160a01b0381165f90815260096020526040812054610551906114c3565b6001600160a01b0381165f90815260076020526040812054610551565b60606105d37f000000000000000000000000000000000000000000000000000000000000000060056114f3565b60606105d37f000000000000000000000000000000000000000000000000000000000000000060066114f3565b80545f908015610e7857610e6283610cdc600184611f58565b54600160301b90046001600160d01b031661088e565b5f9392505050565b6001600160a01b038216610ea957604051634b637e8f60e11b81525f60048201526024016105ae565b61064b825f83611332565b5f3361054b8185856110e8565b5f610551610ecd610aef565b8360405161190160f01b8152600281019290925260228201526042902090565b5f805f80610efd8888888861159c565b925092509250610f0d8282611664565b50909695505050505050565b6001600160a01b0382165f908152600760205260409020805460018101909155818114610ac7576040516301d4b62360e61b81526001600160a01b0384166004820152602481018290526044016105ae565b604080518082019091525f80825260208201526001600160a01b0383165f90815260096020526040902061088e908361171c565b6001600160a01b038416610fc85760405163e602df0560e01b81525f60048201526024016105ae565b6001600160a01b038316610ff157604051634a1406b160e11b81525f60048201526024016105ae565b6001600160a01b038085165f908152600160209081526040808320938716835292905220829055801561106c57826001600160a01b0316846001600160a01b03167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9258460405161106391815260200190565b60405180910390a35b50505050565b6001600160a01b038381165f908152600160209081526040808320938616835292905220545f1981101561106c57818110156110da57604051637dc7a0d960e11b81526001600160a01b038416600482015260248101829052604481018390526064016105ae565b61106c84848484035f610f9f565b6001600160a01b03831661111157604051634b637e8f60e11b81525f60048201526024016105ae565b6001600160a01b03821661113a5760405163ec442f0560e01b81525f60048201526024016105ae565b610ac7838383611332565b5f65ffffffffffff821115611177576040516306dfcc6560e41b815260306004820152602481018390526044016105ae565b5090565b5f60018211611188575090565b816001600160801b82106111a15760809190911c9060401b5b6801000000000000000082106111bc5760409190911c9060201b5b64010000000082106111d35760209190911c9060101b5b6201000082106111e85760109190911c9060081b5b61010082106111fc5760089190911c9060041b5b6010821061120f5760049190911c9060021b5b6004821061121b5760011b5b600302600190811c9081858161123357611233611f7e565b048201901c9050600181858161124b5761124b611f7e565b048201901c9050600181858161126357611263611f7e565b048201901c9050600181858161127b5761127b611f7e565b048201901c9050600181858161129357611293611f7e565b048201901c905060018185816112ab576112ab611f7e565b048201901c90506112ca8185816112c4576112c4611f7e565b04821190565b90039392505050565b5f5b8183101561132a575f6112e88484611789565b5f8781526020902090915065ffffffffffff86169082015465ffffffffffff16111561131657809250611324565b611321816001611f6b565b93505b506112d5565b509392505050565b610ac78383836117a3565b6001600160a01b0381165f90815260208190526040812054610551565b816001600160a01b0316836001600160a01b03161415801561137b57505f81115b15610ac7576001600160a01b03831615611422576001600160a01b0383165f90815260096020526040812081906113bd90610aaf6113b886611809565b61183c565b6001600160d01b031691506001600160d01b03169150846001600160a01b03167fdec2bacdd2f05b59de34da9b523dff8be42e5e38e818c82fdb0bae774387a7248383604051611417929190918252602082015260400190565b60405180910390a250505b6001600160a01b03821615610ac7576001600160a01b0382165f908152600960205260408120819061145a90610aa46113b886611809565b6001600160d01b031691506001600160d01b03169150836001600160a01b03167fdec2bacdd2f05b59de34da9b523dff8be42e5e38e818c82fdb0bae774387a72483836040516114b4929190918252602082015260400190565b60405180910390a25050505050565b5f63ffffffff821115611177576040516306dfcc6560e41b815260206004820152602481018390526044016105ae565b606060ff831461150d576115068361186d565b9050610551565b81805461151990611e83565b80601f016020809104026020016040519081016040528092919081815260200182805461154590611e83565b80156115905780601f1061156757610100808354040283529160200191611590565b820191905f5260205f20905b81548152906001019060200180831161157357829003601f168201915b50505050509050610551565b5f80807f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a08411156115d557505f9150600390508261165a565b604080515f808252602082018084528a905260ff891692820192909252606081018790526080810186905260019060a0016020604051602081039080840390855afa158015611626573d5f803e3d5ffd5b5050604051601f1901519150506001600160a01b03811661165157505f92506001915082905061165a565b92505f91508190505b9450945094915050565b5f82600381111561167757611677611f92565b03611680575050565b600182600381111561169457611694611f92565b036116b25760405163f645eedf60e01b815260040160405180910390fd5b60028260038111156116c6576116c6611f92565b036116e75760405163fce698f760e01b8152600481018290526024016105ae565b60038260038111156116fb576116fb611f92565b0361064b576040516335e2f38360e21b8152600481018290526024016105ae565b604080518082019091525f8082526020820152825f018263ffffffff168154811061174957611749611fa6565b5f9182526020918290206040805180820190915291015465ffffffffffff81168252600160301b90046001600160d01b0316918101919091529392505050565b5f6117976002848418611fba565b61088e90848416611f6b565b6117ae8383836118aa565b6001600160a01b0383166117fe575f6117c660025490565b90506001600160d01b03808211156117fb57604051630e58ae9360e11b815260048101839052602481018290526044016105ae565b50505b610ac78383836119d0565b5f6001600160d01b03821115611177576040516306dfcc6560e41b815260d06004820152602481018390526044016105ae565b5f806118604261185861184e88610e49565b868863ffffffff16565b879190611a45565b915091505b935093915050565b60605f61187983611a52565b6040805160208082528183019092529192505f91906020820181803683375050509182525060208101929092525090565b6001600160a01b0383166118d4578060025f8282546118c99190611f6b565b909155506119449050565b6001600160a01b0383165f90815260208190526040902054818110156119265760405163391434e360e21b81526001600160a01b038516600482015260248101829052604481018390526064016105ae565b6001600160a01b0384165f9081526020819052604090209082900390555b6001600160a01b0382166119605760028054829003905561197e565b6001600160a01b0382165f9081526020819052604090208054820190555b816001600160a01b0316836001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040516119c391815260200190565b60405180910390a3505050565b6001600160a01b0383166119f2576119ef600a610aa46113b884611809565b50505b6001600160a01b038216611a1457611a11600a610aaf6113b884611809565b50505b6001600160a01b038381165f90815260086020526040808220548584168352912054610ac79291821691168361135a565b5f80611860858585611a79565b5f60ff8216601f81111561055157604051632cd44ac360e21b815260040160405180910390fd5b82545f9081908015611b6f575f611a9587610cdc600185611f58565b805490915065ffffffffffff80821691600160301b90046001600160d01b0316908816821115611ad857604051632520601d60e01b815260040160405180910390fd5b8765ffffffffffff168265ffffffffffff1603611b1157825465ffffffffffff16600160301b6001600160d01b03891602178355611b61565b6040805180820190915265ffffffffffff808a1682526001600160d01b03808a1660208085019182528d54600181018f555f8f81529190912094519151909216600160301b029216919091179101555b945085935061186592505050565b50506040805180820190915265ffffffffffff80851682526001600160d01b0380851660208085019182528854600181018a555f8a815291822095519251909316600160301b029190931617920191909155905081611865565b5f81518084528060208401602086015e5f602082860101526020601f19601f83011685010191505092915050565b602081525f61088e6020830184611bc9565b80356001600160a01b0381168114611c1f575f80fd5b919050565b5f8060408385031215611c35575f80fd5b611c3e83611c09565b946020939093013593505050565b5f805f60608486031215611c5e575f80fd5b611c6784611c09565b9250611c7560208501611c09565b9150604084013590509250925092565b5f60208284031215611c95575f80fd5b61088e82611c09565b60ff60f81b881681525f602060e06020840152611cbe60e084018a611bc9565b8381036040850152611cd0818a611bc9565b606085018990526001600160a01b038816608086015260a0850187905284810360c0860152855180825260208088019350909101905f5b81811015611d2357835183529284019291840191600101611d07565b50909c9b505050505050505050505050565b5f60208284031215611d45575f80fd5b5035919050565b803560ff81168114611c1f575f80fd5b5f805f805f8060c08789031215611d71575f80fd5b611d7a87611c09565b95506020870135945060408701359350611d9660608801611d4c565b92506080870135915060a087013590509295509295509295565b5f805f805f805f60e0888a031215611dc6575f80fd5b611dcf88611c09565b9650611ddd60208901611c09565b95506040880135945060608801359350611df960808901611d4c565b925060a0880135915060c0880135905092959891949750929550565b5f8060408385031215611e26575f80fd5b611e2f83611c09565b9150611e3d60208401611c09565b90509250929050565b5f8060408385031215611e57575f80fd5b611e6083611c09565b9150602083013563ffffffff81168114611e78575f80fd5b809150509250929050565b600181811c90821680611e9757607f821691505b602082108103611eb557634e487b7160e01b5f52602260045260245ffd5b50919050565b60208082526022908201527f4f6e6c792061646d696e2063616e20706572666f726d2074686973206163746960408201526137b760f11b606082015260800190565b634e487b7160e01b5f52601160045260245ffd5b6001600160d01b03818116838216019080821115611f3157611f31611efd565b5092915050565b6001600160d01b03828116828216039080821115611f3157611f31611efd565b8181038181111561055157610551611efd565b8082018082111561055157610551611efd565b634e487b7160e01b5f52601260045260245ffd5b634e487b7160e01b5f52602160045260245ffd5b634e487b7160e01b5f52603260045260245ffd5b5f82611fd457634e487b7160e01b5f52601260045260245ffd5b50049056fea2646970667358221220bf8bfe2f37b76032d62a6d3bca1fe66e8d4abceacbaa0049e84f01ea6022fea464736f6c63430008190033dec2bacdd2f05b59de34da9b523dff8be42e5e38e818c82fdb0bae774387a724a26469706673582212202de462aa27227925fa558ed6b8e2778f5aebf30e594f5d0a22ee4c058dfa2a7f64736f6c63430008190033c080a0ce0bc8df94e54c97dfd70daf1391b5973d868c74f6ca35d1d9bcbd89c8c8deada0237e0b0c4b7b619a4b252494ed0f5751d5153bc3bd696b9ee7a9b3010d2db1fac0c0",
    "0xf9222ff9025aa0a9a9721b9c7acc6750e89da30f970242dab2d2943864d52c8c624d1631b34410a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347940e9281e9c6a0808672eaba6bd1220e144c9bb07aa00000000000000000000000000000000000000000000000000000000000000000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421b90100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008003831f6205808468f3a13680a0000000000000000000000000000000000000000000000000000000000000000088000000000000000001a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b4218080a00000000000000000000000000000000000000000000000000000000000000000a0e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855f91fcdb91fca02f91fc601020107831f62058080b91f756080604052348015600e575f80fd5b50611f598061001c5f395ff3fe608060405234801561000f575f80fd5b5060043610610034575f3560e01c80631ecbdf63146100385780638c9513bb14610067575b5f80fd5b61004b61004636600461013b565b61007a565b6040516001600160a01b03909116815260200160405180910390f35b61004b610075366004610152565b6100a1565b5f8181548110610088575f80fd5b5f918252602090912001546001600160a01b0316905081565b5f6060805f848383886040516100b69061012e565b6100c394939291906101ca565b604051809103905ff0801580156100dc573d5f803e3d5ffd5b505f80546001810182559080527f290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e5630180546001600160a01b0319166001600160a01b0383161790559695505050505050565b611d158061020f83390190565b5f6020828403121561014b575f80fd5b5035919050565b5f8060408385031215610163575f80fd5b82356001600160a01b0381168114610179575f80fd5b946020939093013593505050565b5f815180845260208085019450602084015f5b838110156101bf5781516001600160a01b03168752958201959082019060010161019a565b509495945050505050565b848152608060208201525f6101e26080830186610187565b82810360408401526101f48186610187565b91505060018060a01b03831660608301529594505050505056fe608060405234801561000f575f80fd5b50604051611d15380380611d1583398101604081905261002e916102f4565b6100385f3061017b565b506001600160a01b03811615610054576100525f8261017b565b505b5f5b83518110156100e8576100a87fb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc18583815181106100955761009561036d565b602002602001015161017b60201b60201c565b506100df7ffd643c72710c63c0180259aba6b2d05451e3591a24e58b62239378085726f7838583815181106100955761009561036d565b50600101610056565b505f5b82518110156101335761012a7fd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e638483815181106100955761009561036d565b506001016100eb565b506002849055604080515f8152602081018690527f11c24f4ead16507c69ac467fbd5e4eed5fb5c699626d2cc6d66421df253886d5910160405180910390a150505050610381565b5f828152602081815260408083206001600160a01b038516845290915281205460ff1661021b575f838152602081815260408083206001600160a01b03861684529091529020805460ff191660011790556101d33390565b6001600160a01b0316826001600160a01b0316847f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a450600161021e565b505f5b92915050565b634e487b7160e01b5f52604160045260245ffd5b80516001600160a01b038116811461024e575f80fd5b919050565b5f82601f830112610262575f80fd5b815160206001600160401b038083111561027e5761027e610224565b8260051b604051601f19603f830116810181811084821117156102a3576102a3610224565b60405293845260208187018101949081019250878511156102c2575f80fd5b6020870191505b848210156102e9576102da82610238565b835291830191908301906102c9565b979650505050505050565b5f805f8060808587031215610307575f80fd5b845160208601519094506001600160401b0380821115610325575f80fd5b61033188838901610253565b94506040870151915080821115610346575f80fd5b5061035387828801610253565b92505061036260608601610238565b905092959194509250565b634e487b7160e01b5f52603260045260245ffd5b6119878061038e5f395ff3fe6080604052600436106101b2575f3560e01c80638065657f116100e7578063bc197c8111610087578063d547741f11610062578063d547741f14610546578063e38335e514610565578063f23a6e6114610578578063f27a0c92146105a3575f80fd5b8063bc197c81146104d1578063c4d252f5146104fc578063d45c44351461051b575f80fd5b806391d14854116100c257806391d148541461044d578063a217fddf1461046c578063b08e51c01461047f578063b1c5f427146104b2575f80fd5b80638065657f146103dc5780638f2a0bb0146103fb5780638f61f4f51461041a575f80fd5b80632ab0f5291161015257806336568abe1161012d57806336568abe14610353578063584b153e1461037257806364d62353146103915780637958004c146103b0575f80fd5b80632ab0f529146102f65780632f2ff15d1461031557806331d5075014610334575f80fd5b8063134008d31161018d578063134008d31461025357806313bc9f2014610266578063150b7a0214610285578063248a9ca3146102c8575f80fd5b806301d5062a146101bd57806301ffc9a7146101de57806307bd026514610212575f80fd5b366101b957005b5f80fd5b3480156101c8575f80fd5b506101dc6101d7366004611162565b6105b7565b005b3480156101e9575f80fd5b506101fd6101f83660046111d0565b61068b565b60405190151581526020015b60405180910390f35b34801561021d575f80fd5b506102457fd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e6381565b604051908152602001610209565b6101dc6102613660046111f7565b61069b565b348015610271575f80fd5b506101fd61028036600461125d565b61074d565b348015610290575f80fd5b506102af61029f366004611323565b630a85bd0160e11b949350505050565b6040516001600160e01b03199091168152602001610209565b3480156102d3575f80fd5b506102456102e236600461125d565b5f9081526020819052604090206001015490565b348015610301575f80fd5b506101fd61031036600461125d565b610772565b348015610320575f80fd5b506101dc61032f366004611386565b61077a565b34801561033f575f80fd5b506101fd61034e36600461125d565b6107a4565b34801561035e575f80fd5b506101dc61036d366004611386565b6107c8565b34801561037d575f80fd5b506101fd61038c36600461125d565b610800565b34801561039c575f80fd5b506101dc6103ab36600461125d565b610845565b3480156103bb575f80fd5b506103cf6103ca36600461125d565b6108b8565b60405161020991906113c4565b3480156103e7575f80fd5b506102456103f63660046111f7565b610900565b348015610406575f80fd5b506101dc61041536600461142a565b61093e565b348015610425575f80fd5b506102457fb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc181565b348015610458575f80fd5b506101fd610467366004611386565b610aca565b348015610477575f80fd5b506102455f81565b34801561048a575f80fd5b506102457ffd643c72710c63c0180259aba6b2d05451e3591a24e58b62239378085726f78381565b3480156104bd575f80fd5b506102456104cc3660046114d2565b610af2565b3480156104dc575f80fd5b506102af6104eb3660046115ee565b63bc197c8160e01b95945050505050565b348015610507575f80fd5b506101dc61051636600461125d565b610b36565b348015610526575f80fd5b5061024561053536600461125d565b5f9081526001602052604090205490565b348015610551575f80fd5b506101dc610560366004611386565b610be0565b6101dc6105733660046114d2565b610c04565b348015610583575f80fd5b506102af610592366004611690565b63f23a6e6160e01b95945050505050565b3480156105ae575f80fd5b50600254610245565b7fb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc16105e181610d85565b5f6105f0898989898989610900565b90506105fc8184610d92565b5f817f4cf4410cc57040e44862ef0f45f3dd5a5e02db8eb8add648d4b0e236f1d07dca8b8b8b8b8b8a60405161063796959493929190611717565b60405180910390a3831561068057807f20fda5fd27a1ea7bf5b9567f143ac5470bb059374a27e8f67cb44f946f6d03878560405161067791815260200190565b60405180910390a25b505050505050505050565b5f61069582610e23565b92915050565b7fd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e636106c6815f610aca565b6106d4576106d48133610e47565b5f6106e3888888888888610900565b90506106ef8185610e84565b6106fb88888888610ed2565b5f817fc2617efa69bab66782fa219543714338489c4e9e178271560a91b82c3f612b588a8a8a8a6040516107329493929190611753565b60405180910390a361074381610f46565b5050505050505050565b5f60025b61075a836108b8565b600381111561076b5761076b6113b0565b1492915050565b5f6003610751565b5f8281526020819052604090206001015461079481610d85565b61079e8383610f71565b50505050565b5f806107af836108b8565b60038111156107c0576107c06113b0565b141592915050565b6001600160a01b03811633146107f15760405163334bd91960e11b815260040160405180910390fd5b6107fb8282611000565b505050565b5f8061080b836108b8565b90506001816003811115610821576108216113b0565b148061083e5750600281600381111561083c5761083c6113b0565b145b9392505050565b333081146108765760405163e2850c5960e01b81526001600160a01b03821660048201526024015b60405180910390fd5b60025460408051918252602082018490527f11c24f4ead16507c69ac467fbd5e4eed5fb5c699626d2cc6d66421df253886d5910160405180910390a150600255565b5f81815260016020526040812054805f036108d557505f92915050565b600181036108e65750600392915050565b428111156108f75750600192915050565b50600292915050565b5f86868686868660405160200161091c96959493929190611717565b6040516020818303038152906040528051906020012090509695505050505050565b7fb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc161096881610d85565b88871415806109775750888514155b156109a9576040516001624fcdef60e01b03198152600481018a9052602481018690526044810188905260640161086d565b5f6109ba8b8b8b8b8b8b8b8b610af2565b90506109c68184610d92565b5f5b8a811015610a7b5780827f4cf4410cc57040e44862ef0f45f3dd5a5e02db8eb8add648d4b0e236f1d07dca8e8e85818110610a0557610a05611784565b9050602002016020810190610a1a9190611798565b8d8d86818110610a2c57610a2c611784565b905060200201358c8c87818110610a4557610a45611784565b9050602002810190610a5791906117b1565b8c8b604051610a6b96959493929190611717565b60405180910390a36001016109c8565b508315610abd57807f20fda5fd27a1ea7bf5b9567f143ac5470bb059374a27e8f67cb44f946f6d038785604051610ab491815260200190565b60405180910390a25b5050505050505050505050565b5f918252602082815260408084206001600160a01b0393909316845291905290205460ff1690565b5f8888888888888888604051602001610b12989796959493929190611884565b60405160208183030381529060405280519060200120905098975050505050505050565b7ffd643c72710c63c0180259aba6b2d05451e3591a24e58b62239378085726f783610b6081610d85565b610b6982610800565b610ba55781610b786002611069565b610b826001611069565b604051635ead8eb560e01b8152600481019390935217602482015260440161086d565b5f828152600160205260408082208290555183917fbaa1eb22f2a492ba1a5fea61b8df4d27c6c8b5f3971e63bb58fa14ff72eedb7091a25050565b5f82815260208190526040902060010154610bfa81610d85565b61079e8383611000565b7fd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63610c2f815f610aca565b610c3d57610c3d8133610e47565b8786141580610c4c5750878414155b15610c7e576040516001624fcdef60e01b0319815260048101899052602481018590526044810187905260640161086d565b5f610c8f8a8a8a8a8a8a8a8a610af2565b9050610c9b8185610e84565b5f5b89811015610d6f575f8b8b83818110610cb857610cb8611784565b9050602002016020810190610ccd9190611798565b90505f8a8a84818110610ce257610ce2611784565b905060200201359050365f8a8a86818110610cff57610cff611784565b9050602002810190610d1191906117b1565b91509150610d2184848484610ed2565b84867fc2617efa69bab66782fa219543714338489c4e9e178271560a91b82c3f612b5886868686604051610d589493929190611753565b60405180910390a350505050806001019050610c9d565b50610d7981610f46565b50505050505050505050565b610d8f8133610e47565b50565b610d9b826107a4565b15610dcc5781610daa5f611069565b604051635ead8eb560e01b81526004810192909252602482015260440161086d565b5f610dd660025490565b905080821015610e0357604051635433660960e01b8152600481018390526024810182905260440161086d565b610e0d8242611923565b5f93845260016020526040909320929092555050565b5f6001600160e01b03198216630271189760e51b148061069557506106958261108b565b610e518282610aca565b610e805760405163e2517d3f60e01b81526001600160a01b03821660048201526024810183905260440161086d565b5050565b610e8d8261074d565b610e9c5781610daa6002611069565b8015801590610eb15750610eaf81610772565b155b15610e805760405163121534c360e31b81526004810182905260240161086d565b5f80856001600160a01b0316858585604051610eef929190611942565b5f6040518083038185875af1925050503d805f8114610f29576040519150601f19603f3d011682016040523d82523d5f602084013e610f2e565b606091505b5091509150610f3d82826110bf565b50505050505050565b610f4f8161074d565b610f5e5780610daa6002611069565b5f90815260016020819052604090912055565b5f610f7c8383610aca565b610ff9575f838152602081815260408083206001600160a01b03861684529091529020805460ff19166001179055610fb13390565b6001600160a01b0316826001600160a01b0316847f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a4506001610695565b505f610695565b5f61100b8383610aca565b15610ff9575f838152602081815260408083206001600160a01b0386168085529252808320805460ff1916905551339286917ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b9190a4506001610695565b5f81600381111561107c5761107c6113b0565b600160ff919091161b92915050565b5f6001600160e01b03198216637965db0b60e01b148061069557506301ffc9a760e01b6001600160e01b0319831614610695565b6060826110d4576110cf826110db565b610695565b5080610695565b8051156110ea57805160208201fd5b60405163d6bda27560e01b815260040160405180910390fd5b80356001600160a01b0381168114611119575f80fd5b919050565b5f8083601f84011261112e575f80fd5b5081356001600160401b03811115611144575f80fd5b60208301915083602082850101111561115b575f80fd5b9250929050565b5f805f805f805f60c0888a031215611178575f80fd5b61118188611103565b96506020880135955060408801356001600160401b038111156111a2575f80fd5b6111ae8a828b0161111e565b989b979a50986060810135976080820135975060a09091013595509350505050565b5f602082840312156111e0575f80fd5b81356001600160e01b03198116811461083e575f80fd5b5f805f805f8060a0878903121561120c575f80fd5b61121587611103565b95506020870135945060408701356001600160401b03811115611236575f80fd5b61124289828a0161111e565b979a9699509760608101359660809091013595509350505050565b5f6020828403121561126d575f80fd5b5035919050565b634e487b7160e01b5f52604160045260245ffd5b604051601f8201601f191681016001600160401b03811182821017156112b0576112b0611274565b604052919050565b5f82601f8301126112c7575f80fd5b81356001600160401b038111156112e0576112e0611274565b6112f3601f8201601f1916602001611288565b818152846020838601011115611307575f80fd5b816020850160208301375f918101602001919091529392505050565b5f805f8060808587031215611336575f80fd5b61133f85611103565b935061134d60208601611103565b92506040850135915060608501356001600160401b0381111561136e575f80fd5b61137a878288016112b8565b91505092959194509250565b5f8060408385031215611397575f80fd5b823591506113a760208401611103565b90509250929050565b634e487b7160e01b5f52602160045260245ffd5b60208101600483106113e457634e487b7160e01b5f52602160045260245ffd5b91905290565b5f8083601f8401126113fa575f80fd5b5081356001600160401b03811115611410575f80fd5b6020830191508360208260051b850101111561115b575f80fd5b5f805f805f805f805f60c08a8c031215611442575f80fd5b89356001600160401b0380821115611458575f80fd5b6114648d838e016113ea565b909b50995060208c013591508082111561147c575f80fd5b6114888d838e016113ea565b909950975060408c01359150808211156114a0575f80fd5b506114ad8c828d016113ea565b9a9d999c50979a969997986060880135976080810135975060a0013595509350505050565b5f805f805f805f8060a0898b0312156114e9575f80fd5b88356001600160401b03808211156114ff575f80fd5b61150b8c838d016113ea565b909a50985060208b0135915080821115611523575f80fd5b61152f8c838d016113ea565b909850965060408b0135915080821115611547575f80fd5b506115548b828c016113ea565b999c989b509699959896976060870135966080013595509350505050565b5f82601f830112611581575f80fd5b813560206001600160401b0382111561159c5761159c611274565b8160051b6115ab828201611288565b92835284810182019282810190878511156115c4575f80fd5b83870192505b848310156115e3578235825291830191908301906115ca565b979650505050505050565b5f805f805f60a08688031215611602575f80fd5b61160b86611103565b945061161960208701611103565b935060408601356001600160401b0380821115611634575f80fd5b61164089838a01611572565b94506060880135915080821115611655575f80fd5b61166189838a01611572565b93506080880135915080821115611676575f80fd5b50611683888289016112b8565b9150509295509295909350565b5f805f805f60a086880312156116a4575f80fd5b6116ad86611103565b94506116bb60208701611103565b9350604086013592506060860135915060808601356001600160401b038111156116e3575f80fd5b611683888289016112b8565b81835281816020850137505f828201602090810191909152601f909101601f19169091010190565b60018060a01b038716815285602082015260a060408201525f61173e60a0830186886116ef565b60608301949094525060800152949350505050565b60018060a01b0385168152836020820152606060408201525f61177a6060830184866116ef565b9695505050505050565b634e487b7160e01b5f52603260045260245ffd5b5f602082840312156117a8575f80fd5b61083e82611103565b5f808335601e198436030181126117c6575f80fd5b8301803591506001600160401b038211156117df575f80fd5b60200191503681900382131561115b575f80fd5b5f838385526020808601955060208560051b830101845f5b8781101561187757848303601f19018952813536889003601e19018112611830575f80fd5b870184810190356001600160401b0381111561184a575f80fd5b803603821315611858575f80fd5b6118638582846116ef565b9a86019a945050509083019060010161180b565b5090979650505050505050565b60a080825281018890525f8960c08301825b8b8110156118c4576001600160a01b036118af84611103565b16825260209283019290910190600101611896565b5083810360208501528881526001600160fb1b038911156118e3575f80fd5b8860051b9150818a6020830137018281036020908101604085015261190b90820187896117f3565b60608401959095525050608001529695505050505050565b8082018082111561069557634e487b7160e01b5f52601160045260245ffd5b818382375f910190815291905056fea26469706673582212204ea5cd2c9a167f287e5a60205f4525efc8aa9d8c459f5e50c72c22f8d2b91b6664736f6c63430008190033a26469706673582212207a77eb0664c0db230f9bc59bf58e76fcb61a50b3f86b69397daf47607b79e85b64736f6c63430008190033c080a0eb147cafc9fdca20a64009921167a7b3234725630dc7b3804b2df9ce0df58b04a0116e53e7bb946101f8ba03f73b452eb0984d2b6bd7dc56ccdc3fa441eaf1262bc0c0"
  ],
  "latestBlockNumber": "0x3",
  "baseBlockNumber": "0x0"
}
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
