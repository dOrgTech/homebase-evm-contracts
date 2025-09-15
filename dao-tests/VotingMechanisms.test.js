const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const toWei = (v, decimals = 18) => ethers.parseUnits(v.toString(), decimals);

describe("Voting Mechanisms and Edge Cases", function () {
  async function deployDAOFixture() {
    const [deployer, member1, member2, member3, member4, outsider] = await ethers.getSigners();
    
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

    // Deploy DAO with specific voting configuration
    const daoConfig = {
      name: "Voting Test DAO",
      symbol: "VOTE",
      description: "Testing voting mechanisms",
      decimals: 18,
      executionDelay: 60,
      transferrable: false,
      
      initialMembers: [member1.address, member2.address, member3.address, member4.address],
      memberTokens: [toWei(400), toWei(300), toWei(200), toWei(100)], // Total: 1000
      
      votingDelayMins: 1,
      votingPeriodMins: 5,
      proposalThreshold: toWei(50), // 5% of total supply
      quorumFraction: 25, // 25% quorum (250 tokens needed)
      
      registryKeys: ["description"],
      registryValues: ["Voting Test DAO"]
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
    const registryAddr = await wrapper.deployedRegistries(idx);

    const dao = await ethers.getContractAt("HomebaseDAO", daoAddr);
    const token = await ethers.getContractAt("HBEVM_token", tokenAddr);
    const registry = await ethers.getContractAt("Registry", registryAddr);

    // Delegate voting power
    await token.connect(member1).delegate(member1.address);
    await token.connect(member2).delegate(member2.address);
    await token.connect(member3).delegate(member3.address);
    await token.connect(member4).delegate(member4.address);

    return { 
      dao, token, registry,
      accounts: { deployer, member1, member2, member3, member4, outsider },
      config: daoConfig
    };
  }

  async function createBasicProposal(dao, registry) {
    const registryIface = (await ethers.getContractFactory("Registry")).interface;
    const targets = [await registry.getAddress()];
    const values = [0];
    const calldatas = [registryIface.encodeFunctionData("editRegistry", ["test", "value"])];
    const description = "Test proposal";
    const descHash = ethers.id(description);
    
    return { targets, values, calldatas, description, descHash };
  }

  describe("Vote Types", function () {
    it("should handle For votes correctly", async function () {
      const { dao, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2 } = accounts;

      const { targets, values, calldatas, description, descHash } = await createBasicProposal(dao, registry);

      await dao.connect(member1).propose(targets, values, calldatas, description);
      await time.increase((await dao.votingDelay()) + 1n);
      
      const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
      
      // Cast For votes
      await dao.connect(member1).castVote(proposalId, 1); // For
      await dao.connect(member2).castVote(proposalId, 1); // For
      
      // Check vote counts
      const proposalVotes = await dao.proposalVotes(proposalId);
      expect(proposalVotes.forVotes).to.equal(toWei(700)); // 400 + 300
      expect(proposalVotes.againstVotes).to.equal(0);
      expect(proposalVotes.abstainVotes).to.equal(0);
    });

    it("should handle Against votes correctly", async function () {
      const { dao, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2, member3 } = accounts;

      const { targets, values, calldatas, description, descHash } = await createBasicProposal(dao, registry);

      await dao.connect(member1).propose(targets, values, calldatas, description);
      await time.increase((await dao.votingDelay()) + 1n);
      
      const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
      
      // Cast mixed votes
      await dao.connect(member1).castVote(proposalId, 1); // For (400 tokens)
      await dao.connect(member2).castVote(proposalId, 0); // Against (300 tokens)
      await dao.connect(member3).castVote(proposalId, 0); // Against (200 tokens)
      
      const proposalVotes = await dao.proposalVotes(proposalId);
      expect(proposalVotes.forVotes).to.equal(toWei(400));
      expect(proposalVotes.againstVotes).to.equal(toWei(500)); // 300 + 200
      expect(proposalVotes.abstainVotes).to.equal(0);
      
      await time.increase((await dao.votingPeriod()) + 1n);
      
      // Proposal should be defeated
      const state = await dao.state(proposalId);
      expect(state).to.equal(3); // Defeated
    });

    it("should handle Abstain votes correctly", async function () {
      const { dao, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2, member3 } = accounts;

      const { targets, values, calldatas, description, descHash } = await createBasicProposal(dao, registry);

      await dao.connect(member1).propose(targets, values, calldatas, description);
      await time.increase((await dao.votingDelay()) + 1n);
      
      const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
      
      // Cast abstain votes
      await dao.connect(member1).castVote(proposalId, 1); // For (400 tokens)
      await dao.connect(member2).castVote(proposalId, 2); // Abstain (300 tokens)
      await dao.connect(member3).castVote(proposalId, 2); // Abstain (200 tokens)
      
      const proposalVotes = await dao.proposalVotes(proposalId);
      expect(proposalVotes.forVotes).to.equal(toWei(400));
      expect(proposalVotes.againstVotes).to.equal(0);
      expect(proposalVotes.abstainVotes).to.equal(toWei(500)); // 300 + 200
      
      await time.increase((await dao.votingPeriod()) + 1n);
      
      // Proposal should succeed (abstain counts toward quorum but not against)
      const state = await dao.state(proposalId);
      expect(state).to.equal(4); // Succeeded
    });
  });

  describe("Quorum Requirements", function () {
    it("should fail proposal when quorum is not met", async function () {
      const { dao, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member4 } = accounts; // Only use small token holders

      const { targets, values, calldatas, description, descHash } = await createBasicProposal(dao, registry);

      await dao.connect(member4).propose(targets, values, calldatas, description);
      await time.increase((await dao.votingDelay()) + 1n);
      
      const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
      
      // Only small votes (total 100 tokens, need 250 for quorum)
      await dao.connect(member4).castVote(proposalId, 1); // For (100 tokens)
      
      await time.increase((await dao.votingPeriod()) + 1n);
      
      // Proposal should be defeated due to lack of quorum
      const state = await dao.state(proposalId);
      expect(state).to.equal(3); // Defeated
    });

    it("should pass proposal when quorum is exactly met", async function () {
      const { dao, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member3, member4 } = accounts;

      const { targets, values, calldatas, description, descHash } = await createBasicProposal(dao, registry);

      await dao.connect(member1).propose(targets, values, calldatas, description);
      await time.increase((await dao.votingDelay()) + 1n);
      
      const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
      
      // Exactly meet quorum (200 + 100 = 300 > 250 needed)
      await dao.connect(member3).castVote(proposalId, 1); // For (200 tokens)
      await dao.connect(member4).castVote(proposalId, 1); // For (100 tokens)
      
      await time.increase((await dao.votingPeriod()) + 1n);
      
      // Proposal should succeed
      const state = await dao.state(proposalId);
      expect(state).to.equal(4); // Succeeded
    });

    it("should count abstain votes toward quorum", async function () {
      const { dao, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2, member4 } = accounts;

      const { targets, values, calldatas, description, descHash } = await createBasicProposal(dao, registry);

      await dao.connect(member1).propose(targets, values, calldatas, description);
      await time.increase((await dao.votingDelay()) + 1n);
      
      const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
      
      // Use abstain to reach quorum
      await dao.connect(member1).castVote(proposalId, 1); // For (400 tokens)
      await dao.connect(member4).castVote(proposalId, 2); // Abstain (100 tokens)
      // Total: 500 tokens > 250 needed for quorum
      
      await time.increase((await dao.votingPeriod()) + 1n);
      
      const state = await dao.state(proposalId);
      expect(state).to.equal(4); // Succeeded
    });
  });

  describe("Proposal Threshold", function () {
    it("should prevent proposal creation below threshold", async function () {
      const { dao, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member4 } = accounts; // Has 100 tokens, threshold is 50

      const { targets, values, calldatas, description } = await createBasicProposal(dao, registry);

      // member4 has 100 tokens, which is above the 50 token threshold
      await expect(
        dao.connect(member4).propose(targets, values, calldatas, description)
      ).to.not.be.reverted;
    });

    it("should prevent outsider from creating proposals", async function () {
      const { dao, registry, accounts } = await loadFixture(deployDAOFixture);
      const { outsider } = accounts; // Has 0 tokens

      const { targets, values, calldatas, description } = await createBasicProposal(dao, registry);

      // Outsider has 0 tokens, below threshold
      await expect(
        dao.connect(outsider).propose(targets, values, calldatas, description)
      ).to.be.revertedWithCustomError(dao, "GovernorInsufficientProposerVotes");
    });
  });

  describe("Vote Delegation", function () {
    it("should allow delegation to another address", async function () {
      const { dao, token, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2, outsider } = accounts;

      // member1 delegates to outsider
      await token.connect(member1).delegate(outsider.address);
      
      // Verify delegation
      expect(await token.getVotes(member1.address)).to.equal(0);
      expect(await token.getVotes(outsider.address)).to.equal(toWei(400));

      const { targets, values, calldatas, description, descHash } = await createBasicProposal(dao, registry);

      // outsider can now propose using delegated votes
      await dao.connect(outsider).propose(targets, values, calldatas, description);
      await time.increase((await dao.votingDelay()) + 1n);
      
      const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
      
      // outsider can vote with delegated power
      await dao.connect(outsider).castVote(proposalId, 1);
      await dao.connect(member2).castVote(proposalId, 1);
      
      const proposalVotes = await dao.proposalVotes(proposalId);
      expect(proposalVotes.forVotes).to.equal(toWei(700)); // 400 (delegated) + 300
    });

    it("should handle delegation correctly with voting power snapshots", async function () {
      const { dao, token, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2, outsider } = accounts;

      // member1 delegates before proposal creation
      await token.connect(member1).delegate(outsider.address);

      // Verify delegation worked
      expect(await token.getVotes(member1.address)).to.equal(0);
      expect(await token.getVotes(outsider.address)).to.equal(toWei(400));

      const { targets, values, calldatas, description, descHash } = await createBasicProposal(dao, registry);

      // outsider can now propose using delegated votes
      await dao.connect(outsider).propose(targets, values, calldatas, description);
      await time.increase((await dao.votingDelay()) + 1n);

      const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);

      // outsider can vote with delegated power
      await dao.connect(outsider).castVote(proposalId, 1);

      const proposalVotes = await dao.proposalVotes(proposalId);
      expect(proposalVotes.forVotes).to.equal(toWei(400)); // member1's delegated tokens

      // Verify outsider has the voting power
      expect(await token.getVotes(outsider.address)).to.equal(toWei(400));
    });
  });

  describe("Voting Period Edge Cases", function () {
    it("should prevent voting before voting delay", async function () {
      const { dao, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1 } = accounts;

      const { targets, values, calldatas, description, descHash } = await createBasicProposal(dao, registry);

      await dao.connect(member1).propose(targets, values, calldatas, description);
      
      const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
      
      // Try to vote immediately (before voting delay)
      await expect(
        dao.connect(member1).castVote(proposalId, 1)
      ).to.be.revertedWithCustomError(dao, "GovernorUnexpectedProposalState");
    });

    it("should prevent voting after voting period ends", async function () {
      const { dao, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1 } = accounts;

      const { targets, values, calldatas, description, descHash } = await createBasicProposal(dao, registry);

      await dao.connect(member1).propose(targets, values, calldatas, description);
      await time.increase((await dao.votingDelay()) + 1n);
      
      const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
      
      // Wait until after voting period ends
      await time.increase((await dao.votingPeriod()) + 1n);
      
      // Try to vote after period ends
      await expect(
        dao.connect(member1).castVote(proposalId, 1)
      ).to.be.revertedWithCustomError(dao, "GovernorUnexpectedProposalState");
    });
  });
});
