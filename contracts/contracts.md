# Folder Structure

- contracts/
  - Dao.sol
  - Factories.sol
  - Registry.sol
  - Settings.sol
  - Test.sol
  - Token.sol
  - contracts.md
  - nft.sol

# File Contents

### `Dao.sol`
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

### `Factories.sol`
```sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Dao.sol";
import "./Registry.sol";
import "./Token.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol"; 

contract TokenFactory {
    address[] public deployedTokens;
    function deployToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        address[] memory initialMembers,
        uint256[] memory initialAmounts,
        bool transferrable
    ) public returns (address) {
        HBEVM_token token = new HBEVM_token(name, symbol, decimals,initialMembers, initialAmounts,transferrable);
        deployedTokens.push(address(token));
        return address(token);
    }
}


contract TimelockFactory {
    address[] public deployedTimelocks;
    function deployTimelock(address admin, uint256 executionDelay) public returns (address) {
        address[] memory proposers;
        address[] memory executors;

        TimelockController timelock = new TimelockController(
            executionDelay, // Minimum delay for execution, can be customized
            proposers,      // Empty proposers array
            executors,      // Empty executors array
            admin           // Admin role set to the provided admin
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
        // Read the last 4 values from initialAmounts for settings
        uint48 minsDelay = uint48(initialAmounts[initialAmounts.length - 4]);
        uint32 minsVoting = uint32(initialAmounts[initialAmounts.length - 3]);
        uint256 pThreshold = initialAmounts[initialAmounts.length - 2];
        uint8 qvrm = uint8(initialAmounts[initialAmounts.length - 1]);
        HomebaseDAO dao = new HomebaseDAO(
            HBEVM_token(tokenAddress),
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
    // Validate array lengths
    require(
        params.initialAmounts.length >= params.initialMembers.length + 4,
        "Insufficient settings data in initialAmounts array"
    );

    // Deploy token contract
    address token = tokenFactory.deployToken(
        params.name,
        params.symbol,
        params.decimals,
        params.initialMembers,
        params.initialAmounts,
        params.transferrable
    );

    // Deploy timelock contract
    address timelock = timelockFactory.deployTimelock(
        address(this),
        params.executionDelay
    );

    // Deploy DAO contract
    address dao = daoFactory.deployDAO(
        token,
        timelock,
        params.name,
        params.initialAmounts
    );

    // Deploy registry
    Registry reg = new Registry(timelock, address(this));

    // Continue deployment and grant roles
    _finalizeDeployment(dao, token, timelock, payable(address(reg)), params.keys, params.values);

    // Emit event for DAO creation
    emit NewDaoCreated(
        dao,
        token,
        params.initialMembers,
        params.initialAmounts,
        params.name,
        params.symbol,
        params.description,
        params.executionDelay,
        address(reg),
        params.keys,
        params.values
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
    
    // Store deployed addresses
    deployedDAOs.push(dao);
    deployedTokens.push(token);
    deployedTimelocks.push(timelock);
    deployedRegistries.push(registry);
    // Set admin for token contract
    HBEVM_token(token).setAdmin(timelock);
    // Grant roles to DAO
    TimelockController timelockController = TimelockController(payable(timelock));
    timelockController.grantRole(timelockController.PROPOSER_ROLE(), dao);
    timelockController.grantRole(timelockController.EXECUTOR_ROLE(), dao);

    // Batch-edit registry
    Registry(registry).batchEditRegistry(keys, values);
    }

}
```

### `Registry.sol`
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

### `Settings.sol`
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

### `Test.sol`
```sol
    // SPDX-License-Identifier: MIT
    // Compatible with OpenZeppelin Contracts ^5.0.0
    pragma solidity ^0.8.22;

    contract ChangeMe{
        string thisthing="change me";

        function call_it(string memory newthing)public {
            thisthing=newthing;
        }
    }

```

### `Token.sol`
```sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
    
contract HBEVM_token is ERC20, ERC20Permit, ERC20Votes {
    uint8 private _decimals;
    address public admin;
    bool public isTransferable;
    bool private adminSet;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        address[] memory initialMembers,
        uint256[] memory initialAmounts,
        bool transferrable
    ) 
        ERC20(name, symbol)
        ERC20Permit(name) 
    {   
        _decimals = decimals_;
        isTransferable = transferrable;
        adminSet = false;
        // require(initialMembers.length == initialAmounts.length, "Mismatched initial arrays");

        for (uint32 i = 0; i < initialMembers.length; i++) {
            _mint(initialMembers[i], initialAmounts[i]);
        }
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }

    modifier onlyOwner {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }

    // Function to set the admin, callable only once
    function setAdmin(address newAdmin) public {
        require(admin == address(0), "Admin has already been set");
        require(newAdmin != address(0), "New admin address cannot be zero");
        admin = newAdmin;
        adminSet = true;
    }

    // Explicitly override _update to resolve conflict between ERC20 and ERC20Votes
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    // Override the nonces function to resolve the conflict between ERC20Permit and Nonces
    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }

    // Override the transfer function to restrict based on isTransferable
    function transfer(address recipient, uint256 amount) public override returns (bool) {
        require(isTransferable, "Transfers are currently disabled");
        return super.transfer(recipient, amount);
    }

    // Override the transferFrom function to restrict based on isTransferable
    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        require(isTransferable, "Transfers are currently disabled");
        return super.transferFrom(sender, recipient, amount);
    }
}

```

### `contracts.md`
```md

```

### `nft.sol`
```sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.8.2/contracts/token/ERC721/ERC721.sol";
// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.8.2/contracts/access/Ownable.sol";
// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.8.2/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor() ERC20("CoreyToken", "CTK") {
        _mint(0x04a17B7caf38F718af5625AA00c22793a82A8050, 1000000 * 10 ** decimals());
    }
}


// contract MyNFT is ERC721, Ownable {
//     using Counters for Counters.Counter;
//     Counters.Counter private _tokenIdCounter;

//     constructor() ERC721("NotMyNFT", "NMNFT") {}
    
    

//     function safeMint(address to) public onlyOwner {
//         uint256 tokenId = _tokenIdCounter.current();
//         _tokenIdCounter.increment();
//         _safeMint(to, tokenId);
//     }
// }


```
