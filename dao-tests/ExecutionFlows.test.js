const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const toWei = (v, decimals = 18) => ethers.parseUnits(v.toString(), decimals);

describe("Execution Flows and Timelock Interactions", function () {
  async function deployDAOFixture() {
    const [deployer, member1, member2, member3, recipient] = await ethers.getSigners();
    
    // Deploy factories
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

    // Deploy DAO with different timelock delays for testing
    const daoConfig = {
      name: "Execution Test DAO",
      symbol: "EXEC",
      description: "Testing execution flows",
      decimals: 18,
      executionDelay: 300, // 5 minutes for testing
      transferrable: false,
      
      initialMembers: [member1.address, member2.address, member3.address],
      memberTokens: [toWei(500), toWei(300), toWei(200)],
      
      votingDelayMins: 1,
      votingPeriodMins: 3,
      proposalThreshold: toWei(10),
      quorumFraction: 30, // 30% quorum
      
      registryKeys: ["description"],
      registryValues: ["Execution Test DAO"]
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
    const daoAddr = await wrapper.deployedDAOs(idx);
    const tokenAddr = await wrapper.deployedTokens(idx);
    const timelockAddr = await wrapper.deployedTimelocks(idx);
    const registryAddr = await wrapper.deployedRegistries(idx);

    const dao = await ethers.getContractAt("HomebaseDAO", daoAddr);
    const token = await ethers.getContractAt("HBEVM_token", tokenAddr);
    const timelock = await ethers.getContractAt("TimelockController", timelockAddr);
    const registry = await ethers.getContractAt("Registry", registryAddr);

    // Delegate voting power
    await token.connect(member1).delegate(member1.address);
    await token.connect(member2).delegate(member2.address);
    await token.connect(member3).delegate(member3.address);

    return { 
      dao, token, timelock, registry,
      accounts: { deployer, member1, member2, member3, recipient },
      config: daoConfig
    };
  }

  async function createAndPassProposal(dao, registry, member1, member2, description = "Test proposal") {
    const registryIface = (await ethers.getContractFactory("Registry")).interface;
    const targets = [await registry.getAddress()];
    const values = [0];
    const calldatas = [registryIface.encodeFunctionData("editRegistry", ["test", "executed"])];
    const descHash = ethers.id(description);

    // Create and pass proposal
    await dao.connect(member1).propose(targets, values, calldatas, description);
    await time.increase((await dao.votingDelay()) + 1n);
    
    const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
    await dao.connect(member1).castVote(proposalId, 1);
    await dao.connect(member2).castVote(proposalId, 1);
    
    await time.increase((await dao.votingPeriod()) + 1n);

    return { targets, values, calldatas, description, descHash, proposalId };
  }

  describe("Queue to Execution Flow", function () {
    it("should queue proposal successfully after passing", async function () {
      const { dao, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2 } = accounts;

      const { targets, values, calldatas, descHash, proposalId } = 
        await createAndPassProposal(dao, registry, member1, member2);

      // Proposal should be in Succeeded state
      expect(await dao.state(proposalId)).to.equal(4); // Succeeded

      // Queue the proposal
      await dao.queue(targets, values, calldatas, descHash);

      // Proposal should now be Queued
      expect(await dao.state(proposalId)).to.equal(5); // Queued
    });

    it("should prevent execution before timelock delay", async function () {
      const { dao, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2 } = accounts;

      const { targets, values, calldatas, descHash, proposalId } = 
        await createAndPassProposal(dao, registry, member1, member2);

      await dao.queue(targets, values, calldatas, descHash);

      // Try to execute immediately (should fail)
      await expect(
        dao.execute(targets, values, calldatas, descHash)
      ).to.be.reverted;
    });

    it("should execute proposal after timelock delay", async function () {
      const { dao, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2 } = accounts;

      const { targets, values, calldatas, descHash, proposalId } = 
        await createAndPassProposal(dao, registry, member1, member2);

      await dao.queue(targets, values, calldatas, descHash);
      
      // Wait for timelock delay (5 minutes + buffer)
      await time.increase(301);

      // Execute the proposal
      await dao.execute(targets, values, calldatas, descHash);

      // Proposal should be Executed
      expect(await dao.state(proposalId)).to.equal(7); // Executed

      // Verify the execution result
      expect(await registry.getRegistryValue("test")).to.equal("executed");
    });

    it("should allow anyone to execute after timelock delay", async function () {
      const { dao, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2, member3 } = accounts;

      const { targets, values, calldatas, descHash, proposalId } = 
        await createAndPassProposal(dao, registry, member1, member2);

      await dao.queue(targets, values, calldatas, descHash);
      await time.increase(301);

      // member3 (who didn't vote) can execute
      await dao.connect(member3).execute(targets, values, calldatas, descHash);

      expect(await dao.state(proposalId)).to.equal(7); // Executed
      expect(await registry.getRegistryValue("test")).to.equal("executed");
    });
  });

  describe("Execution Failures", function () {
    it("should handle execution failure gracefully", async function () {
      const { dao, token, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2 } = accounts;

      // Create proposal that will fail during execution
      const tokenIface = (await ethers.getContractFactory("HBEVM_token")).interface;
      const targets = [await token.getAddress()];
      const values = [0];
      // Try to mint to zero address (will fail)
      const calldatas = [tokenIface.encodeFunctionData("mint", [ethers.ZeroAddress, toWei(100)])];
      const description = "Failing proposal";
      const descHash = ethers.id(description);

      await dao.connect(member1).propose(targets, values, calldatas, description);
      await time.increase((await dao.votingDelay()) + 1n);
      
      const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
      await dao.connect(member1).castVote(proposalId, 1);
      await dao.connect(member2).castVote(proposalId, 1);
      
      await time.increase((await dao.votingPeriod()) + 1n);
      await dao.queue(targets, values, calldatas, descHash);
      await time.increase(301);

      // Execution should fail
      await expect(
        dao.execute(targets, values, calldatas, descHash)
      ).to.be.reverted;

      // Proposal should remain in Queued state
      expect(await dao.state(proposalId)).to.equal(5); // Queued
    });

    it("should prevent execution of non-queued proposals", async function () {
      const { dao, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2 } = accounts;

      const { targets, values, calldatas, descHash } = 
        await createAndPassProposal(dao, registry, member1, member2);

      // Try to execute without queueing
      await expect(
        dao.execute(targets, values, calldatas, descHash)
      ).to.be.reverted;
    });

    it("should prevent execution of defeated proposals", async function () {
      const { dao, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2, member3 } = accounts;

      const registryIface = (await ethers.getContractFactory("Registry")).interface;
      const targets = [await registry.getAddress()];
      const values = [0];
      const calldatas = [registryIface.encodeFunctionData("editRegistry", ["test", "defeated"])];
      const description = "Defeated proposal";
      const descHash = ethers.id(description);

      await dao.connect(member1).propose(targets, values, calldatas, description);
      await time.increase((await dao.votingDelay()) + 1n);
      
      const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
      
      // Vote against (member2 + member3 > member1)
      await dao.connect(member1).castVote(proposalId, 1); // For (500)
      await dao.connect(member2).castVote(proposalId, 0); // Against (300)
      await dao.connect(member3).castVote(proposalId, 0); // Against (200)
      // Total: 500 For, 500 Against - Against wins
      
      await time.increase((await dao.votingPeriod()) + 1n);

      // Proposal should be defeated
      expect(await dao.state(proposalId)).to.equal(3); // Defeated

      // Cannot queue defeated proposal
      await expect(
        dao.queue(targets, values, calldatas, descHash)
      ).to.be.reverted;
    });
  });

  describe("Timelock Delay Variations", function () {
    async function deployDAOWithDelay(delaySeconds) {
      const [deployer, member1, member2] = await ethers.getSigners();
      
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

      const daoConfig = {
        name: "Delay Test DAO",
        symbol: "DELAY",
        description: "Testing timelock delays",
        decimals: 18,
        executionDelay: delaySeconds,
        transferrable: false,
        
        initialMembers: [member1.address, member2.address],
        memberTokens: [toWei(600), toWei(400)],
        
        votingDelayMins: 1,
        votingPeriodMins: 2,
        proposalThreshold: toWei(10),
        quorumFraction: 30,
        
        registryKeys: ["description"],
        registryValues: ["Delay Test DAO"]
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
      const daoAddr = await wrapper.deployedDAOs(idx);
      const tokenAddr = await wrapper.deployedTokens(idx);
      const timelockAddr = await wrapper.deployedTimelocks(idx);
      const registryAddr = await wrapper.deployedRegistries(idx);

      const dao = await ethers.getContractAt("HomebaseDAO", daoAddr);
      const token = await ethers.getContractAt("HBEVM_token", tokenAddr);
      const timelock = await ethers.getContractAt("TimelockController", timelockAddr);
      const registry = await ethers.getContractAt("Registry", registryAddr);

      await token.connect(member1).delegate(member1.address);
      await token.connect(member2).delegate(member2.address);

      return { dao, token, timelock, registry, member1, member2 };
    }

    it("should handle zero timelock delay", async function () {
      const { dao, registry, member1, member2 } = await deployDAOWithDelay(0);

      const { targets, values, calldatas, descHash, proposalId } = 
        await createAndPassProposal(dao, registry, member1, member2);

      await dao.queue(targets, values, calldatas, descHash);
      
      // Should be able to execute immediately with zero delay
      await dao.execute(targets, values, calldatas, descHash);

      expect(await dao.state(proposalId)).to.equal(7); // Executed
      expect(await registry.getRegistryValue("test")).to.equal("executed");
    });

    it("should enforce long timelock delays", async function () {
      const { dao, registry, member1, member2 } = await deployDAOWithDelay(3600); // 1 hour

      const { targets, values, calldatas, descHash } = 
        await createAndPassProposal(dao, registry, member1, member2);

      await dao.queue(targets, values, calldatas, descHash);
      
      // Should fail before delay
      await expect(
        dao.execute(targets, values, calldatas, descHash)
      ).to.be.reverted;

      // Should succeed after delay
      await time.increase(3601);
      await dao.execute(targets, values, calldatas, descHash);

      expect(await registry.getRegistryValue("test")).to.equal("executed");
    });
  });
});
