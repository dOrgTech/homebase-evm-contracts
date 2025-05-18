# Folder Structure

- homebase-evm-contracts/
  - contracts/
    - Dao.sol
    - Factories.sol
    - Factories_W.sol
    - HBEVM_Wrapped_Token.sol
    - IAdminToken.sol
    - Registry.sol
    - Settings.sol
    - Token.sol

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
        string daoName;                 // Will also be used as wrappedTokenName
        // string wrappedTokenName;     // REMOVED
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
        string memory wrappedTokenName,
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
        string memory name,
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

    // Revised Minimal Event - Swapped underlyingTokenAddress for description
    event DaoWrappedDeploymentInfo( // Renamed slightly for clarity of this version
        address indexed daoAddress,
        address indexed wrappedTokenAddress,
        // address indexed underlyingTokenAddress, // REMOVED - can be read from wrappedTokenAddress
        address registryAddress,
        string daoName, 
        string description // ADDED
    );

    struct DaoParamsWrapped {
        string daoName;                 
        string wrappedTokenName;        
        string wrappedTokenSymbol;      
        string description;             // This will be emitted
        uint256 executionDelay;         
        address underlyingTokenAddress; 
        uint48 minsVotingDelay;         
        uint32 minsVotingPeriod;        
        uint256 proposalThreshold;      
        uint8 quorumFraction;           
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
        address wrappedToken = tokenFactory.deployWrappedToken(
            IERC20(params.underlyingTokenAddress), params.wrappedTokenName, params.wrappedTokenSymbol
        );
        address timelock = timelockFactory.deployTimelock(address(this), params.executionDelay);

        uint256[] memory daoSettingsArray = new uint256[](4);
        daoSettingsArray[0] = params.minsVotingDelay;
        daoSettingsArray[1] = params.minsVotingPeriod;
        daoSettingsArray[2] = params.proposalThreshold;
        daoSettingsArray[3] = params.quorumFraction;

        address dao = daoFactory.deployDAO(wrappedToken, timelock, params.daoName, daoSettingsArray);
        
        Registry reg = new Registry(timelock, address(this)); 
        address payable registryAddress = payable(address(reg));

        _finalizeDeployment_W(dao, wrappedToken, timelock, registryAddress, params.keys, params.values);

        // Emit the revised minimal event
        emit DaoWrappedDeploymentInfo(
            dao, 
            wrappedToken, 
            // params.underlyingTokenAddress, // REMOVED from emit
            registryAddress,
            params.daoName,
            params.description // ADDED to emit
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
