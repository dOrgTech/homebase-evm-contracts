const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const toWei = (v, decimals = 18) => ethers.parseUnits(v.toString(), decimals);

async function deployFactoriesAndWrapper() {
  const [deployer] = await ethers.getSigners();
  const TokenFactory = await ethers.getContractFactory("TokenFactory");
  const TimelockFactory = await ethers.getContractFactory("TimelockFactory");
  const DAOFactory = await ethers.getContractFactory("DAOFactory");
  const WrapperContract = await ethers.getContractFactory("WrapperContract");

  const tokenFactory = await TokenFactory.deploy();
  const timelockFactory = await TimelockFactory.deploy();
  const daoFactory = await DAOFactory.deploy();
  await tokenFactory.waitForDeployment();
  await timelockFactory.waitForDeployment();
  await daoFactory.waitForDeployment();

  const wrapper = await WrapperContract.deploy(
    await tokenFactory.getAddress(),
    await timelockFactory.getAddress(),
    await daoFactory.getAddress()
  );
  await wrapper.waitForDeployment();

  return { wrapper, deployer };
}

describe("Comprehensive DAO Parameter Validation", function () {
  describe("Scenario 1: DAO with Non-Transferable Token", function () {
    it("validates all parameters for non-transferable token DAO", async function () {
      const { wrapper } = await deployFactoriesAndWrapper();
      const [deployer, member1, member2, member3, member4, outsider] = await ethers.getSigners();

      // DAO Configuration
      const daoConfig = {
        name: "Climate Action DAO",
        symbol: "CLIMATE",
        description: "A DAO focused on funding climate action initiatives",
        decimals: 8, // Testing non-standard decimals
        executionDelay: 3600, // 1 hour in seconds
        transferrable: false, // Non-transferable
        
        // Members with varied token amounts
        initialMembers: [
          member1.address,
          member2.address,
          member3.address,
          member4.address
        ],
        
        // Testing with decimals = 8
        memberTokens: [
          toWei(1000, 8),  // 1000 tokens
          toWei(500, 8),   // 500 tokens
          toWei(250, 8),   // 250 tokens
          toWei(250, 8)    // 250 tokens
        ],
        
        // Voting parameters
        votingDelayMins: 5,      // 5 minutes
        votingPeriodMins: 60,    // 1 hour
        proposalThreshold: toWei(10, 8), // 10 tokens needed to propose
        quorumFraction: 25,      // 25% quorum
        
        // Multiple registry entries
        registryKeys: ["description", "website", "twitter", "mission", "rules"],
        registryValues: [
          "Climate Action DAO",
          "https://climate-dao.org",
          "@climatedao",
          "Fund and coordinate climate action initiatives",
          "1. All proposals must relate to climate action. 2. Minimum 25% quorum required."
        ]
      };

      // Construct initialAmounts array
      const initialAmounts = [
        ...daoConfig.memberTokens,
        daoConfig.votingDelayMins,
        daoConfig.votingPeriodMins,
        daoConfig.proposalThreshold,
        daoConfig.quorumFraction
      ];

      // Deploy DAO
      const tx = await wrapper.deployDAOwithToken({
        name: daoConfig.name,
        symbol: daoConfig.symbol,
        description: daoConfig.description,
        decimals: daoConfig.decimals,
        executionDelay: daoConfig.executionDelay,
        initialMembers: daoConfig.initialMembers,
        initialAmounts: initialAmounts,
        keys: daoConfig.registryKeys,
        values: daoConfig.registryValues,
        transferrable: daoConfig.transferrable
      });
      await tx.wait();

      // Get deployed contracts
      const idx = (await wrapper.getNumberOfDAOs()) - 1n;
      const daoAddr = await wrapper.deployedDAOs(idx);
      const tokenAddr = await wrapper.deployedTokens(idx);
      const timelockAddr = await wrapper.deployedTimelocks(idx);
      const registryAddr = await wrapper.deployedRegistries(idx);

      const dao = await ethers.getContractAt("HomebaseDAO", daoAddr);
      const token = await ethers.getContractAt("HBEVM_token", tokenAddr);
      const timelock = await ethers.getContractAt("TimelockController", timelockAddr);
      const registry = await ethers.getContractAt("Registry", registryAddr);

      // Validate Token Configuration
      expect(await token.name()).to.equal(daoConfig.name);
      expect(await token.symbol()).to.equal(daoConfig.symbol);
      expect(await token.decimals()).to.equal(daoConfig.decimals);
      expect(await token.isTransferable()).to.equal(false);
      
      // Validate Token Distribution
      expect(await token.balanceOf(member1.address)).to.equal(daoConfig.memberTokens[0]);
      expect(await token.balanceOf(member2.address)).to.equal(daoConfig.memberTokens[1]);
      expect(await token.balanceOf(member3.address)).to.equal(daoConfig.memberTokens[2]);
      expect(await token.balanceOf(member4.address)).to.equal(daoConfig.memberTokens[3]);
      
      const totalSupply = await token.totalSupply();
      const expectedTotal = daoConfig.memberTokens.reduce((a, b) => a + b, 0n);
      expect(totalSupply).to.equal(expectedTotal);

      // Validate DAO Voting Parameters
      expect(await dao.votingDelay()).to.equal(BigInt(daoConfig.votingDelayMins * 60));
      expect(await dao.votingPeriod()).to.equal(BigInt(daoConfig.votingPeriodMins * 60));
      expect(await dao.proposalThreshold()).to.equal(daoConfig.proposalThreshold);
      expect(await dao.quorumNumerator()).to.equal(daoConfig.quorumFraction);

      // Validate Timelock Configuration
      const timelockDelay = await timelock.getMinDelay();
      expect(timelockDelay).to.equal(BigInt(daoConfig.executionDelay));

      // Validate All Registry Values
      for (let i = 0; i < daoConfig.registryKeys.length; i++) {
        const value = await registry.getRegistryValue(daoConfig.registryKeys[i]);
        expect(value).to.equal(daoConfig.registryValues[i]);
      }

      // Test Non-Transferability
      await expect(
        token.connect(member1).transfer(outsider.address, toWei(1, 8))
      ).to.be.revertedWith("HBEVM_token: transfers disabled for non-admin");

      // Test Voting Power Setup
      await token.connect(member1).delegate(member1.address);
      await token.connect(member2).delegate(member2.address);
      
      const votingPower1 = await token.getVotes(member1.address);
      const votingPower2 = await token.getVotes(member2.address);
      
      expect(votingPower1).to.equal(daoConfig.memberTokens[0]);
      expect(votingPower2).to.equal(daoConfig.memberTokens[1]);
    });
  });

  describe("Scenario 2: DAO with Transferable Token", function () {
    it("validates transferable token with standard decimals", async function () {
      const { wrapper } = await deployFactoriesAndWrapper();
      const [deployer, member1, member2, recipient] = await ethers.getSigners();

      const daoConfig = {
        name: "DeFi Governance DAO",
        symbol: "DEFI",
        description: "Decentralized Finance Protocol Governance",
        decimals: 18, // Standard decimals
        executionDelay: 0, // No execution delay
        transferrable: true, // TRANSFERABLE
        
        initialMembers: [member1.address, member2.address],
        memberTokens: [toWei(10000), toWei(5000)],
        
        votingDelayMins: 0,     // No delay
        votingPeriodMins: 10,   // 10 minutes
        proposalThreshold: toWei(100),
        quorumFraction: 10,     // 10% quorum
        
        registryKeys: ["description", "protocol"],
        registryValues: ["DeFi Governance", "v2.0"]
      };

      const initialAmounts = [
        ...daoConfig.memberTokens,
        daoConfig.votingDelayMins,
        daoConfig.votingPeriodMins,
        daoConfig.proposalThreshold,
        daoConfig.quorumFraction
      ];

      await (await wrapper.deployDAOwithToken({
        name: daoConfig.name,
        symbol: daoConfig.symbol,
        description: daoConfig.description,
        decimals: daoConfig.decimals,
        executionDelay: daoConfig.executionDelay,
        initialMembers: daoConfig.initialMembers,
        initialAmounts: initialAmounts,
        keys: daoConfig.registryKeys,
        values: daoConfig.registryValues,
        transferrable: daoConfig.transferrable
      })).wait();

      const idx = (await wrapper.getNumberOfDAOs()) - 1n;
      const tokenAddr = await wrapper.deployedTokens(idx);
      const token = await ethers.getContractAt("HBEVM_token", tokenAddr);

      // Validate Transferability
      expect(await token.isTransferable()).to.equal(true);
      
      // Test Successful Transfer
      const transferAmount = toWei(100);
      const initialBalance = await token.balanceOf(recipient.address);
      expect(initialBalance).to.equal(0);
      
      await token.connect(member1).transfer(recipient.address, transferAmount);
      
      expect(await token.balanceOf(recipient.address)).to.equal(transferAmount);
      expect(await token.balanceOf(member1.address)).to.equal(
        daoConfig.memberTokens[0] - transferAmount
      );
    });
  });

  describe("Scenario 3: DAO with Wrapped Token", function () {
    it("validates wrapped token deployment with all parameters", async function () {
      const { wrapper } = await deployFactoriesAndWrapper();
      const [deployer, tokenHolder1, tokenHolder2] = await ethers.getSigners();

      // First, deploy an underlying ERC20 token
      const UnderlyingToken = await ethers.getContractFactory("HBEVM_token");
      const underlying = await UnderlyingToken.deploy(
        "Original Token",
        "ORIG",
        6, // 6 decimals like USDC
        [tokenHolder1.address, tokenHolder2.address],
        [toWei(1000000, 6), toWei(500000, 6)],
        true // transferable
      );
      await underlying.waitForDeployment();

      const wrappedConfig = {
        daoName: "Wrapped Token Governance",
        wrappedTokenName: "Wrapped ORIG",
        wrappedTokenSymbol: "wORIG",
        description: "Governance for wrapped token holders",
        executionDelay: 7200, // 2 hours
        underlyingTokenAddress: await underlying.getAddress(),
        
        minsVotingDelay: 30,    // 30 minutes
        minsVotingPeriod: 1440, // 24 hours
        proposalThreshold: toWei(1000, 6),
        quorumFraction: 15,     // 15% quorum
        
        keys: ["description", "underlyingToken", "governance"],
        values: [
          "Wrapped Token Governance",
          await underlying.getAddress(),
          "OpenZeppelin Governor"
        ]
      };

      await (await wrapper.deployDAOwithWrappedToken(wrappedConfig)).wait();

      const idx = (await wrapper.getNumberOfDAOs()) - 1n;
      const daoAddr = await wrapper.deployedDAOs(idx);
      const wTokenAddr = await wrapper.deployedTokens(idx);
      const timelockAddr = await wrapper.deployedTimelocks(idx);
      const registryAddr = await wrapper.deployedRegistries(idx);

      const dao = await ethers.getContractAt("HomebaseDAO", daoAddr);
      const wToken = await ethers.getContractAt("HBEVM_Wrapped_Token", wTokenAddr);
      const timelock = await ethers.getContractAt("TimelockController", timelockAddr);
      const registry = await ethers.getContractAt("Registry", registryAddr);

      // Validate Wrapped Token Configuration
      expect(await wToken.name()).to.equal(wrappedConfig.wrappedTokenName);
      expect(await wToken.symbol()).to.equal(wrappedConfig.wrappedTokenSymbol);
      expect(await wToken.decimals()).to.equal(6); // Should match underlying
      
      // Initial supply should be 0
      expect(await wToken.totalSupply()).to.equal(0);

      // Validate DAO Configuration
      expect(await dao.votingDelay()).to.equal(BigInt(wrappedConfig.minsVotingDelay * 60));
      expect(await dao.votingPeriod()).to.equal(BigInt(wrappedConfig.minsVotingPeriod * 60));
      expect(await dao.proposalThreshold()).to.equal(wrappedConfig.proposalThreshold);
      expect(await dao.quorumNumerator()).to.equal(wrappedConfig.quorumFraction);

      // Validate Timelock
      expect(await timelock.getMinDelay()).to.equal(BigInt(wrappedConfig.executionDelay));

      // Validate Registry
      for (let i = 0; i < wrappedConfig.keys.length; i++) {
        const value = await registry.getRegistryValue(wrappedConfig.keys[i]);
        expect(value).to.equal(wrappedConfig.values[i]);
      }

      // Test Wrapping Functionality
      const wrapAmount = toWei(10000, 6);
      await underlying.connect(tokenHolder1).approve(await wToken.getAddress(), wrapAmount);
      await wToken.connect(tokenHolder1).depositFor(tokenHolder1.address, wrapAmount);
      
      expect(await wToken.balanceOf(tokenHolder1.address)).to.equal(wrapAmount);
      expect(await wToken.totalSupply()).to.equal(wrapAmount);
      
      // Test Unwrapping
      const unwrapAmount = toWei(5000, 6);
      await wToken.connect(tokenHolder1).withdrawTo(tokenHolder1.address, unwrapAmount);
      
      expect(await wToken.balanceOf(tokenHolder1.address)).to.equal(wrapAmount - unwrapAmount);
      expect(await wToken.totalSupply()).to.equal(wrapAmount - unwrapAmount);
    });
  });

  describe("Scenario 4: Edge Cases and Validation", function () {
    it("validates extreme parameter values", async function () {
      const { wrapper } = await deployFactoriesAndWrapper();
      const [deployer, member] = await ethers.getSigners();

      const extremeConfig = {
        name: "Edge Case DAO",
        symbol: "EDGE",
        description: "Testing extreme parameter values",
        decimals: 1, // Minimum practical decimals
        executionDelay: 604800, // 7 days maximum reasonable delay
        transferrable: false,
        
        initialMembers: [member.address],
        memberTokens: [toWei(1, 1)], // Just 1 token with 1 decimal
        
        votingDelayMins: 10080,  // 7 days
        votingPeriodMins: 43200, // 30 days
        proposalThreshold: toWei(0.1, 1), // 0.1 token (minimum with 1 decimal)
        quorumFraction: 51,      // 51% majority quorum
        
        registryKeys: ["single"],
        registryValues: ["value"]
      };

      const initialAmounts = [
        ...extremeConfig.memberTokens,
        extremeConfig.votingDelayMins,
        extremeConfig.votingPeriodMins,
        extremeConfig.proposalThreshold,
        extremeConfig.quorumFraction
      ];

      await (await wrapper.deployDAOwithToken({
        name: extremeConfig.name,
        symbol: extremeConfig.symbol,
        description: extremeConfig.description,
        decimals: extremeConfig.decimals,
        executionDelay: extremeConfig.executionDelay,
        initialMembers: extremeConfig.initialMembers,
        initialAmounts: initialAmounts,
        keys: extremeConfig.registryKeys,
        values: extremeConfig.registryValues,
        transferrable: extremeConfig.transferrable
      })).wait();

      const idx = (await wrapper.getNumberOfDAOs()) - 1n;
      const daoAddr = await wrapper.deployedDAOs(idx);
      const dao = await ethers.getContractAt("HomebaseDAO", daoAddr);
      
      // Validate extreme values are correctly set
      expect(await dao.votingDelay()).to.equal(BigInt(extremeConfig.votingDelayMins * 60));
      expect(await dao.votingPeriod()).to.equal(BigInt(extremeConfig.votingPeriodMins * 60));
      expect(await dao.quorumNumerator()).to.equal(extremeConfig.quorumFraction);
    });

    it("validates empty registry and zero execution delay", async function () {
      const { wrapper } = await deployFactoriesAndWrapper();
      const [deployer, member] = await ethers.getSigners();

      const minimalConfig = {
        name: "Minimal DAO",
        symbol: "MIN",
        description: "Minimal configuration",
        decimals: 18,
        executionDelay: 0, // Zero delay
        transferrable: true,
        
        initialMembers: [member.address],
        memberTokens: [toWei(100)],
        
        votingDelayMins: 1,
        votingPeriodMins: 1,
        proposalThreshold: toWei(1),
        quorumFraction: 1, // 1% minimum quorum
        
        registryKeys: [], // Empty registry
        registryValues: []
      };

      const initialAmounts = [
        ...minimalConfig.memberTokens,
        minimalConfig.votingDelayMins,
        minimalConfig.votingPeriodMins,
        minimalConfig.proposalThreshold,
        minimalConfig.quorumFraction
      ];

      await (await wrapper.deployDAOwithToken({
        name: minimalConfig.name,
        symbol: minimalConfig.symbol,
        description: minimalConfig.description,
        decimals: minimalConfig.decimals,
        executionDelay: minimalConfig.executionDelay,
        initialMembers: minimalConfig.initialMembers,
        initialAmounts: initialAmounts,
        keys: minimalConfig.registryKeys,
        values: minimalConfig.registryValues,
        transferrable: minimalConfig.transferrable
      })).wait();

      const idx = (await wrapper.getNumberOfDAOs()) - 1n;
      const timelockAddr = await wrapper.deployedTimelocks(idx);
      const timelock = await ethers.getContractAt("TimelockController", timelockAddr);
      
      // Validate zero execution delay
      expect(await timelock.getMinDelay()).to.equal(0);
    });
  });
});