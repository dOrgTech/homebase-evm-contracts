# Homebase EVM Contracts

This repository contains the EVM on-chain backend for deploying and managing Homebase DAOs. The platform leverages OpenZeppelin's Governor and TimelockController framework for robust and decentralized governance, allowing token holders to propose, vote on, and execute changes within their DAOs.

The system is designed around a factory model, enabling the easy creation of new, fully-configured DAOs, each with its own governance token (either newly created or wrapped from an existing ERC20), timelock, and registry.

## Core Architecture & Deployment Flow

![](https://i.ibb.co/2Wq98jt/schematic.png)
*(The diagram provides a high-level overview. The deployment process described below utilizes a factory pattern.)*

The `WrapperContract` serves as the main entry point for creating new DAOs. It utilizes a set of specialized factory contracts:
1.  **`TokenFactory`**: Deploys new governance tokens (`HBEVM_token`) or wrapped token contracts (`HBEVM_Wrapped_Token`).
2.  **`TimelockFactory`**: Deploys `TimelockController` contracts.
3.  **`DAOFactory`**: Deploys `HomebaseDAO` (Governor) contracts.

### DAO Deployment Options:

The `WrapperContract` offers two primary methods for DAO creation:

1.  **`deployDAOwithToken(...)`**:
    *   Creates a brand new, native governance token (`HBEVM_token`) specific to the DAO.
    *   Mints initial tokens to specified members.
    *   Sets up the `HomebaseDAO`, `TimelockController`, and `Registry`.

2.  **`deployDAOwithWrappedToken(...)`**:
    *   Wraps an existing ERC20 token using `HBEVM_Wrapped_Token` to make it suitable for governance.
    *   Holders of the underlying ERC20 token must then `approve` the `HBEVM_Wrapped_Token` contract and `depositFor` (or `deposit`) their tokens into it to receive the wrapped (governance-active) tokens.
    *   Sets up the `HomebaseDAO` (using the wrapped token for voting), `TimelockController`, and `Registry`.

### Key Contracts in a Deployed DAO Ecosystem

1.  **Governance Token (`HBEVM_token` or `HBEVM_Wrapped_Token`)**:
    *   **`HBEVM_token`**: An ERC20Votes-compliant token created for the DAO. Features include minting, burning (controlled by the DAO via Timelock), and optional transferability.
    *   **`HBEVM_Wrapped_Token`**: An ERC20Wrapper and ERC20Votes-compliant token. It wraps an existing ERC20 token, allowing holders to deposit their underlying tokens to mint wrapped tokens for governance participation.
    *   Both token types allow holders to delegate their voting power to participate in governance. The `IAdminToken` interface ensures consistent admin control transfer to the Timelock.

2.  **DAO Contract (`HomebaseDAO`)**: This is the Governor contract, built on OpenZeppelin's `Governor.sol` and its extensions. It manages the DAO's proposal and voting mechanisms (voting delay, voting period, proposal thresholds, quorum, etc.).

3.  **Timelock (`TimelockController`)**: Acts as the DAO's primary executor and often as its treasury. It enforces a mandatory delay on the execution of successful proposals, providing a crucial window for review and potential emergency intervention. It becomes the admin of the Governance Token and the owner of the Registry after setup.

4.  **Registry (`Registry.sol`)**: A versatile contract associated with each DAO.
    *   **Treasury Functionality**: Can receive and hold ETH, ERC20 tokens, and ERC721 NFTs. Transfers out are controlled by the DAO via the Timelock.
    *   **Key-Value Store**: Allows the DAO to store and manage arbitrary on-chain metadata (e.g., descriptions, links, configuration parameters).

5.  **Target Contracts**: These are any other contracts whose functionality the DAO can modify or control via governance proposals passed through the Timelock.

### Proposal Lifecycle (Standard OpenZeppelin Governor Flow)

1.  **Vote Delegation**:
    *   Users must first delegate their votes (from `HBEVM_token` or `HBEVM_Wrapped_Token`) to an address (often themselves) to activate their voting power. This is done by calling `delegate(address delegatee)` on the respective token contract.

2.  **Proposal Creation**:
    *   Eligible token holders (those meeting the `proposalThreshold`) submit proposals via the `propose(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description)` function on the `HomebaseDAO` contract.

3.  **Voting**:
    *   After an initial `votingDelay`, the `votingPeriod` begins. Delegated token holders can cast their votes (`castVote`, `castVoteWithReason`, `castVoteBySig`) on the proposal.

4.  **Queueing in Timelock**:
    *   If a proposal receives enough votes to meet the quorum and passes, it can be queued in the `TimelockController` by anyone calling the `queue(...)` function on the `HomebaseDAO` contract. This initiates the timelock's execution delay.

5.  **Execution**:
    *   After the timelock delay has passed, the proposal can be executed by anyone calling the `execute(...)` function on the `HomebaseDAO` contract. This triggers the Timelock to perform the actions defined in the proposal on the target contracts.

## Requirements

-   **Node.js**: Ensure you have Node.js installed (v16+ recommended).
-   **Hardhat**: The project uses Hardhat for local development, testing, and deployment.

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/dOrgTech/homebase-evm-contracts # Or your repo URL
    ```

2.  Install dependencies:
    ```bash
    cd homebase-evm-contracts
    npm install
    ```

## NPM Scripts

- build: `npx hardhat compile` — compile contracts
- clean: `npx hardhat clean` — clear cache/artifacts
- test: `npx hardhat test` — run all tests
- node: `npx hardhat node` — start local Hardhat node
- deploy: `npx hardhat run scripts/deploy.js` (use with `--network`)
  - deploy:localhost: `--network localhost`
  - deploy:sepolia: `--network sepolia`
- proposal: `npx hardhat run scripts/makeProposal.js` (use with `--network`)
  - proposal:localhost / proposal:sepolia
- verify:sepolia: `npx hardhat verify --network sepolia <address> [ctor-args...]`
- addresses: Show saved deployments per network:
  - localhost: `node -e "console.log(require('./deployments/localhost.json'))"`
  - sepolia: `node -e "console.log(require('./deployments/sepolia.json'))"`

Quick examples
- Local dev: `npm run node` (in another shell) then `npm run deploy:localhost`
- Sepolia deploy: `npm run deploy:sepolia` (saves to `deployments/sepolia.json`)
- Run tests: `npm test`

## Python (ABIs for Indexers)

Install curated ABIs directly from this repo via pip:

```bash
pip install git+GITREPOLINK
```

Usage in Python:

```python
from homebase_evm_contracts import get_abi

wrapper_abi = get_abi("wrapper")          # current Wrapper (v2)
wrapper_legacy_abi = get_abi("wrapper", "legacy")
governor_abi = get_abi("governor")        # minimal events: ProposalCreated/Queued/Executed/VoteCast
token_abi = get_abi("token")              # decimals, totalSupply, balanceOf + events
```

Notes:
- The shipped ABIs are minimal and tailored for indexers (events and common reads).
- If you need the full Hardhat artifacts, use the JSONs under `contracts/artifacts/`.

## Deployment

### 1. Deploying Core Factories

The factory contracts (`TokenFactory`, `TimelockFactory`, `DAOFactory`) and the `WrapperContract` need to be deployed once. You will likely have a Hardhat script for this (e.g., `scripts/deployFactories.js` - you might need to create or update this).

Example (conceptual script content):
```javascript
// scripts/deployFactories.js
async function main() {
  const TokenFactory = await ethers.getContractFactory("TokenFactory");
  const tokenFactory = await TokenFactory.deploy();
  await tokenFactory.waitForDeployment();
  console.log("TokenFactory deployed to:", await tokenFactory.getAddress());

  const TimelockFactory = await ethers.getContractFactory("TimelockFactory");
  const timelockFactory = await TimelockFactory.deploy();
  await timelockFactory.waitForDeployment();
  console.log("TimelockFactory deployed to:", await timelockFactory.getAddress());

  const DAOFactory = await ethers.getContractFactory("DAOFactory");
  const daoFactory = await DAOFactory.deploy();
  await daoFactory.waitForDeployment();
  console.log("DAOFactory deployed to:", await daoFactory.getAddress());

  const WrapperContract = await ethers.getContractFactory("WrapperContract");
  const wrapperContract = await WrapperContract.deploy(
    await tokenFactory.getAddress(),
    await timelockFactory.getAddress(),
    await daoFactory.getAddress()
  );
  await wrapperContract.waitForDeployment();
  console.log("WrapperContract deployed to:", await wrapperContract.getAddress());
}

main().catch(console.error);
