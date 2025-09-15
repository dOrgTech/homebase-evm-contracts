# DAO Tests

This directory contains comprehensive test cases that cover advanced scenarios and edge cases not covered in the original test suite. These tests were created to ensure complete coverage of all flows implemented in the homebase-app frontend.

## Test Structure

### 1. AdvancedProposalTypes.test.js
Tests advanced proposal types that mirror the homebase-app implementation:

- **ETH Transfer Proposals**: Tests treasury ETH transfers with success and failure scenarios
- **Multi-Target Proposals**: Tests proposals that execute multiple operations atomically
- **DAO Configuration Updates**: Framework for testing governance parameter updates

**Key Scenarios:**
- Successful ETH transfers from treasury
- Failed transfers due to insufficient funds
- Multi-target proposals with registry updates and token minting
- Atomic failure handling (all-or-nothing execution)

### 2. VotingMechanisms.test.js
Comprehensive testing of all voting mechanisms and edge cases:

- **Vote Types**: For, Against, and Abstain votes
- **Quorum Requirements**: Exact boundary testing and failure scenarios
- **Proposal Thresholds**: Testing minimum token requirements
- **Vote Delegation**: Complex delegation scenarios and edge cases
- **Voting Period Edge Cases**: Timing restrictions and boundaries

**Key Scenarios:**
- Mixed voting patterns (For/Against/Abstain)
- Quorum boundary conditions (exactly met vs. failed)
- Delegation before and after proposal creation
- Double voting prevention
- Voting outside allowed periods

### 3. ExecutionFlows.test.js
Tests the complete proposal execution lifecycle and timelock interactions:

- **Queue to Execution Flow**: Complete lifecycle from proposal to execution
- **Timelock Delays**: Various delay configurations and enforcement
- **Execution Failures**: Graceful handling of failed executions
- **Access Control**: Who can execute and when

**Key Scenarios:**
- Successful queue → wait → execute flow
- Execution before timelock delay (should fail)
- Failed execution with proposal remaining queued
- Zero delay vs. long delay configurations
- Anyone can execute after timelock delay

### 4. ErrorHandling.test.js
Comprehensive error handling and edge case testing:

- **Proposal Creation Errors**: Invalid parameters, insufficient voting power
- **Voting Errors**: Double voting, invalid vote types, non-existent proposals
- **Execution Errors**: Wrong parameters, non-existent proposals
- **Access Control**: Token transfers, registry edits
- **Quorum Edge Cases**: Boundary conditions and exact calculations

**Key Scenarios:**
- All possible error conditions with proper error messages
- Edge cases around quorum calculations
- Access control enforcement
- Parameter validation

### 5. IntegrationFlows.test.js
End-to-end integration tests that mirror real user workflows:

- **Complete DAO Lifecycle**: From creation to treasury management
- **Multi-DAO Ecosystem**: Different governance configurations
- **Wrapped Token Integration**: Complete wrapped token workflow

**Key Scenarios:**
- Full user journey: Create DAO → Fund treasury → Propose → Vote → Execute
- Multiple DAOs with different configurations (conservative vs. progressive)
- Wrapped token: Deploy → Wrap → Delegate → Govern → Unwrap

## Running the Tests

### Run All Tests
```bash
npm test
```

### Run Only Original Tests
```bash
npm run test:original
```

### Run Only DAO Tests
```bash
npx hardhat test dao-tests/*.test.js
```

### Run Specific Test File
```bash
npx hardhat test dao-tests/AdvancedProposalTypes.test.js
```

## Test Coverage

These tests provide coverage for scenarios that were identified as missing from the original test suite:

### ✅ Now Covered
- **Advanced Proposal Types**: ETH transfers, multi-target operations
- **All Vote Types**: For, Against, Abstain with proper tallying
- **Quorum Edge Cases**: Boundary conditions and failure modes
- **Execution Failures**: Graceful error handling
- **Complex Delegation**: Before/after proposal creation scenarios
- **Access Control**: Comprehensive permission testing
- **Integration Workflows**: End-to-end user journeys
- **Multi-DAO Scenarios**: Different governance configurations
- **Wrapped Token Flows**: Complete wrapping/unwrapping lifecycle

### 🎯 Test Philosophy
- **Real-world Scenarios**: Tests mirror actual homebase-app usage patterns
- **Edge Case Coverage**: Boundary conditions and error states
- **Integration Focus**: End-to-end workflows over isolated unit tests
- **Error Handling**: Comprehensive failure mode testing
- **User Journey Validation**: Tests follow actual user workflows

## Configuration

Tests use realistic configurations that mirror production scenarios:

- **Token Amounts**: Varied distributions to test different voting scenarios
- **Timelock Delays**: Range from 0 seconds to hours for comprehensive testing
- **Quorum Thresholds**: Various percentages to test boundary conditions
- **Proposal Thresholds**: Different levels to test access control

## Maintenance

When adding new features to homebase-app:

1. **Identify New Flows**: Check if new frontend flows need test coverage
2. **Add Test Scenarios**: Create tests that mirror the new user workflows
3. **Update Integration Tests**: Ensure end-to-end scenarios include new features
4. **Validate Error Handling**: Test all new error conditions

## Dependencies

These tests use the same dependencies as the original test suite:
- Hardhat testing framework
- Chai assertions
- Hardhat network helpers for time manipulation
- OpenZeppelin test utilities

All tests are designed to be independent and can run in any order.
