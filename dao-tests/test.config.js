const { ethers } = require("hardhat");

// Common test configuration
const TEST_CONFIG = {
  // Default timeouts for various operations (in seconds)
  TIMEOUTS: {
    VOTING_DELAY: 60,      // 1 minute
    VOTING_PERIOD: 300,    // 5 minutes
    TIMELOCK_DELAY: 300,   // 5 minutes
    LONG_DELAY: 3600,      // 1 hour
  },

  // Default token amounts for testing
  TOKEN_AMOUNTS: {
    LARGE_HOLDER: ethers.parseUnits("1000", 18),
    MEDIUM_HOLDER: ethers.parseUnits("500", 18),
    SMALL_HOLDER: ethers.parseUnits("100", 18),
    MINIMAL_HOLDER: ethers.parseUnits("10", 18),
  },

  // Default governance parameters
  GOVERNANCE: {
    QUORUM_PERCENTAGE: 20,        // 20% quorum
    PROPOSAL_THRESHOLD: ethers.parseUnits("50", 18), // 50 tokens to propose
    VOTING_DELAY_MINUTES: 1,      // 1 minute delay
    VOTING_PERIOD_MINUTES: 5,     // 5 minute voting period
    EXECUTION_DELAY_SECONDS: 300, // 5 minute execution delay
  },

  // Test account roles
  ROLES: {
    DEPLOYER: 0,
    FOUNDER: 1,
    MEMBER_1: 2,
    MEMBER_2: 3,
    MEMBER_3: 4,
    COMMUNITY_1: 5,
    COMMUNITY_2: 6,
    OUTSIDER: 7,
  }
};

// Utility functions for tests
const TEST_UTILS = {
  /**
   * Convert value to wei with specified decimals
   */
  toWei: (value, decimals = 18) => {
    return ethers.parseUnits(value.toString(), decimals);
  },

  /**
   * Create a basic registry proposal
   */
  createRegistryProposal: async (registry, key, value, description = "Test proposal") => {
    const registryIface = (await ethers.getContractFactory("Registry")).interface;
    const targets = [await registry.getAddress()];
    const values = [0];
    const calldatas = [registryIface.encodeFunctionData("editRegistry", [key, value])];
    const descHash = ethers.id(description);
    
    return { targets, values, calldatas, description, descHash };
  },

  /**
   * Create a token mint proposal
   */
  createMintProposal: async (token, recipient, amount, description = "Mint tokens") => {
    const tokenIface = (await ethers.getContractFactory("HBEVM_token")).interface;
    const targets = [await token.getAddress()];
    const values = [0];
    const calldatas = [tokenIface.encodeFunctionData("mint", [recipient, amount])];
    const descHash = ethers.id(description);
    
    return { targets, values, calldatas, description, descHash };
  },

  /**
   * Create an ETH transfer proposal
   */
  createETHTransferProposal: async (registry, recipient, amount, description = "Transfer ETH") => {
    const registryIface = (await ethers.getContractFactory("Registry")).interface;
    const targets = [await registry.getAddress()];
    const values = [0];
    const calldatas = [registryIface.encodeFunctionData("transferETH", [recipient, amount])];
    const descHash = ethers.id(description);
    
    return { targets, values, calldatas, description, descHash };
  },

  /**
   * Execute a complete proposal lifecycle (propose → vote → queue → execute)
   */
  executeProposalLifecycle: async (dao, proposalData, voters, timelock = null) => {
    const { targets, values, calldatas, description, descHash } = proposalData;
    
    // Propose
    await dao.connect(voters[0]).propose(targets, values, calldatas, description);
    
    // Wait for voting delay
    const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
    await time.increase((await dao.votingDelay()) + 1n);
    
    // Vote
    const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
    for (const voter of voters) {
      await dao.connect(voter).castVote(proposalId, 1); // Vote For
    }
    
    // Wait for voting period
    await time.increase((await dao.votingPeriod()) + 1n);
    
    // Queue
    await dao.queue(targets, values, calldatas, descHash);
    
    // Wait for timelock delay if specified
    if (timelock) {
      const delay = await timelock.getMinDelay();
      await time.increase(Number(delay) + 1);
    } else {
      await time.increase(301); // Default 5 minutes + buffer
    }
    
    // Execute
    await dao.execute(targets, values, calldatas, descHash);
    
    return proposalId;
  },

  /**
   * Deploy a standard DAO for testing
   */
  deployStandardDAO: async (wrapper, config = {}) => {
    const [deployer, founder, member1, member2, member3] = await ethers.getSigners();
    
    const defaultConfig = {
      name: "Test DAO",
      symbol: "TEST",
      description: "Test DAO for Advanced tests",
      decimals: 18,
      executionDelay: TEST_CONFIG.GOVERNANCE.EXECUTION_DELAY_SECONDS,
      transferrable: false,
      
      initialMembers: [founder.address, member1.address, member2.address, member3.address],
      memberTokens: [
        TEST_CONFIG.TOKEN_AMOUNTS.LARGE_HOLDER,
        TEST_CONFIG.TOKEN_AMOUNTS.MEDIUM_HOLDER,
        TEST_CONFIG.TOKEN_AMOUNTS.SMALL_HOLDER,
        TEST_CONFIG.TOKEN_AMOUNTS.MINIMAL_HOLDER
      ],
      
      votingDelayMins: TEST_CONFIG.GOVERNANCE.VOTING_DELAY_MINUTES,
      votingPeriodMins: TEST_CONFIG.GOVERNANCE.VOTING_PERIOD_MINUTES,
      proposalThreshold: TEST_CONFIG.GOVERNANCE.PROPOSAL_THRESHOLD,
      quorumFraction: TEST_CONFIG.GOVERNANCE.QUORUM_PERCENTAGE,
      
      registryKeys: ["description"],
      registryValues: ["Test DAO"]
    };

    const finalConfig = { ...defaultConfig, ...config };
    
    const initialAmounts = [
      ...finalConfig.memberTokens,
      finalConfig.votingDelayMins,
      finalConfig.votingPeriodMins,
      finalConfig.proposalThreshold,
      finalConfig.quorumFraction
    ];

    await wrapper.deployDAOwithToken({
      name: finalConfig.name,
      symbol: finalConfig.symbol,
      description: finalConfig.description,
      decimals: finalConfig.decimals,
      executionDelay: finalConfig.executionDelay,
      initialMembers: finalConfig.initialMembers,
      initialAmounts: initialAmounts,
      keys: finalConfig.registryKeys,
      values: finalConfig.registryValues,
      transferrable: finalConfig.transferrable
    });

    const idx = (await wrapper.getNumberOfDAOs()) - 1n;
    const daoAddr = await wrapper.deployedDAOs(idx);
    const tokenAddr = await wrapper.deployedTokens(idx);
    const timelockAddr = await wrapper.deployedTimelocks(idx);
    const registryAddr = await wrapper.deployedRegistries(idx);

    const dao = await ethers.getContractAt("HomebaseDAO", daoAddr);
    const token = await ethers.getContractAt("HBEVM_token", tokenAddr);
    const timelock = await ethers.getContractAt("TimelockController", timelockAddr);
    const registry = await ethers.getContractAt("Registry", registryAddr);

    // Auto-delegate for convenience
    await token.connect(founder).delegate(founder.address);
    await token.connect(member1).delegate(member1.address);
    await token.connect(member2).delegate(member2.address);
    await token.connect(member3).delegate(member3.address);

    return {
      dao,
      token,
      timelock,
      registry,
      accounts: { deployer, founder, member1, member2, member3 },
      config: finalConfig
    };
  },

  /**
   * Get proposal state as human-readable string
   */
  getProposalStateString: (state) => {
    const states = [
      "Pending",     // 0
      "Active",      // 1
      "Canceled",    // 2
      "Defeated",    // 3
      "Succeeded",   // 4
      "Queued",      // 5
      "Expired",     // 6
      "Executed"     // 7
    ];
    return states[state] || "Unknown";
  }
};

module.exports = {
  TEST_CONFIG,
  TEST_UTILS
};
