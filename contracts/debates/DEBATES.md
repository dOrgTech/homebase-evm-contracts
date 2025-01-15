# README: Debate Smart Contract

## Introduction

This repository contains the **Debate** smart contract. The broader purpose of this web3 product is to enable a tokenized “binary debate tree” mechanism for constructive community engagement. By allowing participants to post arguments with assigned weight derived from their token balances, it provides a systematic approach to discussing proposals (in this case, a single debate question) in a structured tree format. The approach leverages blockchain snapshots to ensure that voting power is capped at a user’s recorded balance at the time of debate creation.

Using this model can encourage more **fact-oriented** and **orderly** discourse since users assign stakes to arguments, and arguments become invalid if they’re outweighed by “con” children. In addition, the debate remains open only if enough unexpressed votes can still flip the overall sign (sentiment) of the debate.

## Overview

The contract manages:

1. A **Root Argument** (the main statement / debate topic) and its top-level child arguments (split into “pro” and “con”).  
2. An **unbounded** set of nested arguments, each either pro or con relative to its parent.  
3. A **snapshot** of users’ voting balances at the debate’s creation (queried via the token contract’s `getPastVotes` and `getPastTotalSupply` methods). This ensures each user cannot exceed their historic voting weight during the entire debate lifecycle.  
4. A method to recalculate net scores of each argument (and thus the entire debate’s “sentiment”). Invalid (net \(\le 0\)) arguments do not count towards their parent’s net.  
5. A check for whether the debate is “open” based on the possibility that remaining unexpressed voting power could still alter the sign of the debate’s net result.

## Contract Mechanics

### 1. Debate Creation and Snapshots

When the contract is deployed (or instantiated), it receives:
- A **title**: for descriptive reference.
- A **rootArgumentHash**: an identifier (string or other format) referencing the main statement (stored off-chain or hashed).
- The **ERC20Votes**-compliant token address.

It saves the **creation timestamp** as:

`creationTimestamp = block.timestamp`

This allows the contract to query:

`getPastVotes(user, creationTimestamp) getPastTotalSupply(creationTimestamp)`