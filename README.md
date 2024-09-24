# Homebase EVM contracts

This repository contains the EVM on-chain backend of the Homebase DAO application. The platform leverages OpenZeppelin's Governor framework for decentralized governance, allowing token holders to propose, vote, and execute changes in the DAO.

## Flow Overview

\```mermaid
sequenceDiagram
    participant User
    participant GovToken
    participant DAOContract as DAO Contract
    participant Timelock as TimelockController (Treasury)
    participant TargetContract

    User ->> GovToken: Delegate votes
    User ->> DAOContract: propose(targets, values, calldatas, description)
    DAOContract ->> DAOContract: Proposal Created
    Note over DAOContract: Voting Delay
    User ->> DAOContract: castVote(proposalId)
    Note over DAOContract: Voting Period
    DAOContract ->> DAOContract: Proposal Succeeded
    DAOContract ->> Timelock: queue(proposal)
    Note over Timelock: Timelock Delay
    DAOContract ->> Timelock: execute(proposal)
    Timelock ->> TargetContract: Executes callData
\```

### Key Contracts

1. **Governance Token (GovToken)**: ERC20 token with delegated voting functionality. Token holders can delegate their voting power to themselves or others in order to participate in governance.
   
2. **Governor Contract (DAOContract)**: This contract manages the DAO's proposal and voting mechanisms. It allows users to propose changes, vote, and monitor the lifecycle of proposals (voting delay, voting period, etc.).

3. **TimelockController**: Acts as the DAO's treasury and enforces a delay on the execution of successful proposals. This ensures that executed actions are queued and not immediately enforceable, providing a buffer period for any last-minute interventions.

4. **Target Contracts**: These are the contracts whose functionality the DAO can modify or control via governance proposals.

### Proposal Lifecycle

1. **Vote Delegation**: 
   - Users must first delegate their votes to participate in governance. This can be done through the governance token contract by calling `delegate()`.

2. **Proposal Creation**:
   - Users submit a proposal via the `propose()` function on the DAO contract. The proposal includes the `targets`, `values`, `calldatas`, and a `description` of the actions to be executed on the target contracts.

3. **Voting**:
   - Once the proposal is submitted, there is an initial voting delay. After this period, users can vote on the proposal using the `castVote()` function. The voting period lasts until a majority decision is reached, after which the proposal can either succeed or fail.

4. **Queueing in Timelock**:
   - If a proposal succeeds, it is queued in the TimelockController via the `queue()` function. This initiates a delay period before the proposal can be executed.

5. **Execution**:
   - After the timelock delay, the proposal can be executed by calling `execute()` on the TimelockController. This triggers the actions described in the proposal on the target contracts.

## Requirements

- **Node.js**: Ensure you have Node.js installed to interact with the repository.
- **Hardhat**: The project uses Hardhat for local development, testing, and deployment.
  
## Installation

1. Clone the repository:
    \```bash
    git clone https://github.com/dOrgTech/homebase-evm-contracts
    \```

2. Install dependencies:
    \```bash
    cd homebase-evm-contracts
    npm install
    \```

## Deployment

Use the following Hardhat tasks to deploy the contracts:

1. Deploy the governance token, DAO contract, and timelock:
    \```bash
    npx hardhat run scripts/deploy.js
    \```

## License

This project is licensed under the MIT License.
