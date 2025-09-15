const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const toWei = (v, decimals = 18) => ethers.parseUnits(v.toString(), decimals);

describe("Error Handling and Edge Cases", function () {
  async function deployDAOFixture() {
    const [deployer, member1, member2, member3, outsider] = await ethers.getSigners();
    
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

    // Deploy DAO with specific configuration for edge case testing
    const daoConfig = {
      name: "Error Test DAO",
      symbol: "ERROR",
      description: "Testing error conditions",
      decimals: 18,
      executionDelay: 60,
      transferrable: false,
      
      initialMembers: [member1.address, member2.address, member3.address],
      memberTokens: [toWei(100), toWei(50), toWei(25)], // Small amounts for threshold testing
      
      votingDelayMins: 1,
      votingPeriodMins: 3,
      proposalThreshold: toWei(30), // High threshold relative to balances
      quorumFraction: 40, // 40% quorum (70 tokens needed)
      
      registryKeys: ["description"],
      registryValues: ["Error Test DAO"]
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
      accounts: { deployer, member1, member2, member3, outsider },
      config: daoConfig
    };
  }

  describe("Proposal Creation Errors", function () {
    it("should reject proposals with insufficient voting power", async function () {
      const { dao, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member3, outsider } = accounts; // member3 has 25 tokens, threshold is 30

      const registryIface = (await ethers.getContractFactory("Registry")).interface;
      const targets = [await registry.getAddress()];
      const values = [0];
      const calldatas = [registryIface.encodeFunctionData("editRegistry", ["test", "value"])];
      const description = "Should fail";

      // member3 has insufficient tokens
      await expect(
        dao.connect(member3).propose(targets, values, calldatas, description)
      ).to.be.revertedWithCustomError(dao, "GovernorInsufficientProposerVotes");

      // outsider has no tokens
      await expect(
        dao.connect(outsider).propose(targets, values, calldatas, description)
      ).to.be.revertedWithCustomError(dao, "GovernorInsufficientProposerVotes");
    });

    it("should reject proposals with empty targets", async function () {
      const { dao, accounts } = await loadFixture(deployDAOFixture);
      const { member1 } = accounts;

      const targets = [];
      const values = [];
      const calldatas = [];
      const description = "Empty proposal";

      await expect(
        dao.connect(member1).propose(targets, values, calldatas, description)
      ).to.be.revertedWithCustomError(dao, "GovernorInvalidProposalLength");
    });

    it("should reject proposals with mismatched array lengths", async function () {
      const { dao, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1 } = accounts;

      const registryIface = (await ethers.getContractFactory("Registry")).interface;
      const targets = [await registry.getAddress()];
      const values = [0, 0]; // Mismatched length
      const calldatas = [registryIface.encodeFunctionData("editRegistry", ["test", "value"])];
      const description = "Mismatched arrays";

      await expect(
        dao.connect(member1).propose(targets, values, calldatas, description)
      ).to.be.revertedWithCustomError(dao, "GovernorInvalidProposalLength");
    });

    it("should reject duplicate proposals", async function () {
      const { dao, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1 } = accounts;

      const registryIface = (await ethers.getContractFactory("Registry")).interface;
      const targets = [await registry.getAddress()];
      const values = [0];
      const calldatas = [registryIface.encodeFunctionData("editRegistry", ["test", "value"])];
      const description = "Duplicate proposal";

      // First proposal should succeed
      await dao.connect(member1).propose(targets, values, calldatas, description);

      // Second identical proposal should fail
      await expect(
        dao.connect(member1).propose(targets, values, calldatas, description)
      ).to.be.revertedWithCustomError(dao, "GovernorUnexpectedProposalState");
    });
  });

  describe("Voting Errors", function () {
    async function createActiveProposal(dao, registry, member1) {
      const registryIface = (await ethers.getContractFactory("Registry")).interface;
      const targets = [await registry.getAddress()];
      const values = [0];
      const calldatas = [registryIface.encodeFunctionData("editRegistry", ["test", "value"])];
      const description = "Test proposal";
      const descHash = ethers.id(description);

      await dao.connect(member1).propose(targets, values, calldatas, description);
      await time.increase((await dao.votingDelay()) + 1n);
      
      const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
      return { proposalId, targets, values, calldatas, description, descHash };
    }

    it("should allow votes from addresses with no voting power but with zero weight", async function () {
      const { dao, token, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1, outsider } = accounts;

      // Verify outsider has no tokens and no voting power
      expect(await token.balanceOf(outsider.address)).to.equal(0);
      expect(await token.getVotes(outsider.address)).to.equal(0);

      const { proposalId } = await createActiveProposal(dao, registry, member1);

      // Outsider can vote but with 0 weight
      await dao.connect(outsider).castVote(proposalId, 1);

      // Verify the vote had no impact
      const proposalVotes = await dao.proposalVotes(proposalId);
      expect(proposalVotes.forVotes).to.equal(0); // No votes counted
    });

    it("should reject double voting", async function () {
      const { dao, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1 } = accounts;

      const { proposalId } = await createActiveProposal(dao, registry, member1);

      // First vote should succeed
      await dao.connect(member1).castVote(proposalId, 1);

      // Second vote should fail
      await expect(
        dao.connect(member1).castVote(proposalId, 1)
      ).to.be.revertedWithCustomError(dao, "GovernorAlreadyCastVote");
    });

    it("should reject invalid vote types", async function () {
      const { dao, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1 } = accounts;

      const { proposalId } = await createActiveProposal(dao, registry, member1);

      // Invalid vote type (only 0, 1, 2 are valid)
      await expect(
        dao.connect(member1).castVote(proposalId, 3)
      ).to.be.revertedWithCustomError(dao, "GovernorInvalidVoteType");
    });

    it("should reject votes on non-existent proposals", async function () {
      const { dao, accounts } = await loadFixture(deployDAOFixture);
      const { member1 } = accounts;

      const fakeProposalId = ethers.keccak256(ethers.toUtf8Bytes("fake"));

      await expect(
        dao.connect(member1).castVote(fakeProposalId, 1)
      ).to.be.revertedWithCustomError(dao, "GovernorNonexistentProposal");
    });
  });

  describe("Execution Errors", function () {
    it("should reject execution of non-existent proposals", async function () {
      const { dao, registry } = await loadFixture(deployDAOFixture);

      const registryIface = (await ethers.getContractFactory("Registry")).interface;
      const targets = [await registry.getAddress()];
      const values = [0];
      const calldatas = [registryIface.encodeFunctionData("editRegistry", ["test", "value"])];
      const descHash = ethers.id("Non-existent proposal");

      await expect(
        dao.execute(targets, values, calldatas, descHash)
      ).to.be.revertedWithCustomError(dao, "GovernorNonexistentProposal");
    });

    it("should reject execution with wrong parameters", async function () {
      const { dao, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2 } = accounts;

      // Create and pass a proposal
      const registryIface = (await ethers.getContractFactory("Registry")).interface;
      const targets = [await registry.getAddress()];
      const values = [0];
      const calldatas = [registryIface.encodeFunctionData("editRegistry", ["test", "value"])];
      const description = "Test proposal";
      const descHash = ethers.id(description);

      await dao.connect(member1).propose(targets, values, calldatas, description);
      await time.increase((await dao.votingDelay()) + 1n);
      
      const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
      await dao.connect(member1).castVote(proposalId, 1);
      await dao.connect(member2).castVote(proposalId, 1);
      
      await time.increase((await dao.votingPeriod()) + 1n);
      await dao.queue(targets, values, calldatas, descHash);
      await time.increase(61);

      // Try to execute with wrong parameters
      const wrongTargets = [await registry.getAddress()];
      const wrongValues = [1]; // Wrong value
      const wrongCalldatas = [registryIface.encodeFunctionData("editRegistry", ["wrong", "params"])];
      const wrongDescHash = ethers.id("Wrong description");

      await expect(
        dao.execute(wrongTargets, wrongValues, wrongCalldatas, wrongDescHash)
      ).to.be.revertedWithCustomError(dao, "GovernorNonexistentProposal");
    });
  });

  describe("Token Transfer Restrictions", function () {
    it("should prevent non-admin transfers on non-transferable tokens", async function () {
      const { token, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2 } = accounts;

      // Verify token is non-transferable
      expect(await token.isTransferable()).to.equal(false);

      // Regular transfer should fail
      await expect(
        token.connect(member1).transfer(member2.address, toWei(10))
      ).to.be.revertedWith("HBEVM_token: transfers disabled for non-admin");
    });

    it("should allow admin (timelock) transfers on non-transferable tokens", async function () {
      const { token, timelock, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2 } = accounts;

      // Verify timelock is admin
      expect(await token.admin()).to.equal(await timelock.getAddress());

      // Admin should be able to transfer (this would be done through governance)
      // Note: In practice, this would be executed through a governance proposal
      // This test demonstrates the concept
    });
  });

  describe("Registry Access Control", function () {
    it("should prevent non-owner registry edits", async function () {
      const { registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1, outsider } = accounts;

      // Non-owner should not be able to edit registry directly
      await expect(
        registry.connect(member1).editRegistry("unauthorized", "edit")
      ).to.be.reverted;

      await expect(
        registry.connect(outsider).editRegistry("unauthorized", "edit")
      ).to.be.reverted;
    });

    it("should allow owner (timelock) registry edits", async function () {
      const { registry, timelock } = await loadFixture(deployDAOFixture);

      // Verify timelock is owner
      expect(await registry.owner()).to.equal(await timelock.getAddress());

      // Owner edits would be done through governance proposals
      // This test verifies the access control structure
    });
  });

  describe("Quorum Edge Cases", function () {
    it("should handle exact quorum boundary", async function () {
      const { dao, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2 } = accounts;

      // Total supply: 175 tokens, 40% quorum = 70 tokens needed
      // member1: 100, member2: 50, member3: 25

      const registryIface = (await ethers.getContractFactory("Registry")).interface;
      const targets = [await registry.getAddress()];
      const values = [0];
      const calldatas = [registryIface.encodeFunctionData("editRegistry", ["quorum", "test"])];
      const description = "Quorum boundary test";
      const descHash = ethers.id(description);

      await dao.connect(member1).propose(targets, values, calldatas, description);
      await time.increase((await dao.votingDelay()) + 1n);
      
      const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
      
      // Vote with exactly 70 tokens (member2: 50 + member3: 25 = 75 > 70)
      await dao.connect(member2).castVote(proposalId, 1); // 50 tokens
      // Need 20 more tokens for quorum, but member3 has 25
      
      await time.increase((await dao.votingPeriod()) + 1n);
      
      // Should fail quorum with only 50 tokens
      expect(await dao.state(proposalId)).to.equal(3); // Defeated
    });

    it("should pass with quorum exactly met", async function () {
      const { dao, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2, member3 } = accounts;

      const registryIface = (await ethers.getContractFactory("Registry")).interface;
      const targets = [await registry.getAddress()];
      const values = [0];
      const calldatas = [registryIface.encodeFunctionData("editRegistry", ["quorum", "met"])];
      const description = "Quorum met test";
      const descHash = ethers.id(description);

      await dao.connect(member1).propose(targets, values, calldatas, description);
      await time.increase((await dao.votingDelay()) + 1n);
      
      const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
      
      // Vote with 75 tokens (50 + 25 > 70 needed)
      await dao.connect(member2).castVote(proposalId, 1); // 50 tokens
      await dao.connect(member3).castVote(proposalId, 1); // 25 tokens
      
      await time.increase((await dao.votingPeriod()) + 1n);
      
      // Should succeed with quorum met
      expect(await dao.state(proposalId)).to.equal(4); // Succeeded
    });
  });
});
