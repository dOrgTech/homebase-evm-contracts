const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const toWei = (v, decimals = 18) => ethers.parseUnits(v.toString(), decimals);

describe("Governance Parameter Changes and Token Operations", function () {
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

    // Deploy DAO with specific parameters for testing changes
    const daoConfig = {
      name: "Governance Test DAO",
      symbol: "GOVTEST",
      description: "Testing governance parameter changes",
      decimals: 18,
      executionDelay: 60,
      transferrable: false,
      
      initialMembers: [member1.address, member2.address, member3.address],
      memberTokens: [toWei(1000), toWei(500), toWei(300)],
      
      votingDelayMins: 2,    // 2 minutes initial
      votingPeriodMins: 10,  // 10 minutes initial
      proposalThreshold: toWei(100), // 100 tokens initial
      quorumFraction: 20,    // 20% initial
      
      registryKeys: ["description"],
      registryValues: ["Governance Test DAO"]
    };

    const initialAmounts = [
      ...daoConfig.memberTokens,
      daoConfig.votingDelayMins,
      daoConfig.votingPeriodMins,
      daoConfig.proposalThreshold,
      daoConfig.quorumFraction
    ];

    await wrapper.deployDAOwithToken({
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

  async function executeProposalLifecycle(dao, targets, values, calldatas, description, voters) {
    const descHash = ethers.id(description);
    
    await dao.connect(voters[0]).propose(targets, values, calldatas, description);
    await time.increase((await dao.votingDelay()) + 1n);
    
    const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
    
    for (const voter of voters) {
      await dao.connect(voter).castVote(proposalId, 1);
    }
    
    await time.increase((await dao.votingPeriod()) + 1n);
    await dao.queue(targets, values, calldatas, descHash);
    await time.increase(61);
    await dao.execute(targets, values, calldatas, descHash);
    
    return proposalId;
  }

  describe("Quorum Changes", function () {
    it("should update quorum numerator through governance", async function () {
      const { dao, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2 } = accounts;

      // Verify initial quorum
      const initialQuorum = await dao.quorumNumerator();
      expect(initialQuorum).to.equal(20);

      // Create quorum change proposal
      const daoIface = (await ethers.getContractFactory("HomebaseDAO")).interface;
      const newQuorum = 30; // Change to 30%
      const calldata = daoIface.encodeFunctionData("updateQuorumNumerator", [newQuorum]);

      const targets = [await dao.getAddress()];
      const values = [0];
      const calldatas = [calldata];
      const description = "Update quorum to 30%";

      await executeProposalLifecycle(dao, targets, values, calldatas, description, [member1, member2]);

      // Verify quorum was updated
      const finalQuorum = await dao.quorumNumerator();
      expect(finalQuorum).to.equal(newQuorum);
    });

    it("should allow setting quorum to 0 (edge case)", async function () {
      const { dao, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2 } = accounts;

      // Set quorum to 0 (this is actually allowed in OpenZeppelin Governor)
      const daoIface = (await ethers.getContractFactory("HomebaseDAO")).interface;
      const zeroQuorum = 0;
      const calldata = daoIface.encodeFunctionData("updateQuorumNumerator", [zeroQuorum]);

      const targets = [await dao.getAddress()];
      const values = [0];
      const calldatas = [calldata];
      const description = "Set quorum to 0% (edge case)";

      await executeProposalLifecycle(dao, targets, values, calldatas, description, [member1, member2]);

      // Verify quorum was set to 0
      const finalQuorum = await dao.quorumNumerator();
      expect(finalQuorum).to.equal(zeroQuorum);

      // Note: With 0% quorum, any proposal with any votes will meet quorum
    });
  });

  describe("Voting Timing Changes", function () {
    it("should update voting delay through governance", async function () {
      const { dao, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2 } = accounts;

      // Verify initial voting delay (2 minutes = 120 seconds)
      const initialDelay = await dao.votingDelay();
      expect(initialDelay).to.equal(120);

      // Create voting delay change proposal
      const daoIface = (await ethers.getContractFactory("HomebaseDAO")).interface;
      const newDelay = 300; // 5 minutes
      const calldata = daoIface.encodeFunctionData("setVotingDelay", [newDelay]);

      const targets = [await dao.getAddress()];
      const values = [0];
      const calldatas = [calldata];
      const description = "Update voting delay to 5 minutes";

      await executeProposalLifecycle(dao, targets, values, calldatas, description, [member1, member2]);

      // Verify voting delay was updated
      const finalDelay = await dao.votingDelay();
      expect(finalDelay).to.equal(newDelay);
    });

    it("should update voting period through governance", async function () {
      const { dao, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2 } = accounts;

      // Verify initial voting period (10 minutes = 600 seconds)
      const initialPeriod = await dao.votingPeriod();
      expect(initialPeriod).to.equal(600);

      // Create voting period change proposal
      const daoIface = (await ethers.getContractFactory("HomebaseDAO")).interface;
      const newPeriod = 1200; // 20 minutes
      const calldata = daoIface.encodeFunctionData("setVotingPeriod", [newPeriod]);

      const targets = [await dao.getAddress()];
      const values = [0];
      const calldatas = [calldata];
      const description = "Update voting period to 20 minutes";

      await executeProposalLifecycle(dao, targets, values, calldatas, description, [member1, member2]);

      // Verify voting period was updated
      const finalPeriod = await dao.votingPeriod();
      expect(finalPeriod).to.equal(newPeriod);
    });
  });

  describe("Proposal Threshold Changes", function () {
    it("should update proposal threshold through governance", async function () {
      const { dao, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2 } = accounts;

      // Verify initial proposal threshold
      const initialThreshold = await dao.proposalThreshold();
      expect(initialThreshold).to.equal(toWei(100));

      // Create proposal threshold change proposal
      const daoIface = (await ethers.getContractFactory("HomebaseDAO")).interface;
      const newThreshold = toWei(200); // Increase to 200 tokens
      const calldata = daoIface.encodeFunctionData("setProposalThreshold", [newThreshold]);

      const targets = [await dao.getAddress()];
      const values = [0];
      const calldatas = [calldata];
      const description = "Update proposal threshold to 200 tokens";

      await executeProposalLifecycle(dao, targets, values, calldatas, description, [member1, member2]);

      // Verify proposal threshold was updated
      const finalThreshold = await dao.proposalThreshold();
      expect(finalThreshold).to.equal(newThreshold);
    });

    it("should prevent proposals below new threshold", async function () {
      const { dao, token, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2, member3 } = accounts;

      // First, increase the proposal threshold to 600 tokens
      const daoIface = (await ethers.getContractFactory("HomebaseDAO")).interface;
      const newThreshold = toWei(600);
      const calldata = daoIface.encodeFunctionData("setProposalThreshold", [newThreshold]);

      const targets = [await dao.getAddress()];
      const values = [0];
      const calldatas = [calldata];
      const description = "Increase proposal threshold to 600 tokens";

      await executeProposalLifecycle(dao, targets, values, calldatas, description, [member1, member2]);

      // Now try to create a proposal with member3 (only has 300 tokens)
      const registryIface = (await ethers.getContractFactory("Registry")).interface;
      const testCalldata = registryIface.encodeFunctionData("editRegistry", ["test", "value"]);

      await expect(
        dao.connect(member3).propose([await registry.getAddress()], [0], [testCalldata], "Should fail")
      ).to.be.reverted; // Should fail due to insufficient tokens
    });
  });

  describe("Token Burn Operations", function () {
    it("should burn tokens through governance", async function () {
      const { dao, token, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2, member3 } = accounts;

      // Verify initial balance
      const initialBalance = await token.balanceOf(member3.address);
      expect(initialBalance).to.equal(toWei(300));

      const initialTotalSupply = await token.totalSupply();

      // Create token burn proposal
      const tokenIface = (await ethers.getContractFactory("HBEVM_token")).interface;
      const burnAmount = toWei(100);
      const calldata = tokenIface.encodeFunctionData("burn", [member3.address, burnAmount]);

      const targets = [await token.getAddress()];
      const values = [0];
      const calldatas = [calldata];
      const description = "Burn 100 tokens from member3";

      await executeProposalLifecycle(dao, targets, values, calldatas, description, [member1, member2]);

      // Verify tokens were burned
      const finalBalance = await token.balanceOf(member3.address);
      const finalTotalSupply = await token.totalSupply();
      
      expect(finalBalance).to.equal(toWei(200)); // 300 - 100
      expect(finalTotalSupply).to.equal(initialTotalSupply - burnAmount);
    });

    it("should fail to burn more tokens than available", async function () {
      const { dao, token, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2, member3 } = accounts;

      // Try to burn more tokens than member3 has
      const tokenIface = (await ethers.getContractFactory("HBEVM_token")).interface;
      const burnAmount = toWei(500); // More than member3's 300 tokens
      const calldata = tokenIface.encodeFunctionData("burn", [member3.address, burnAmount]);

      const targets = [await token.getAddress()];
      const values = [0];
      const calldatas = [calldata];
      const description = "Burn 500 tokens from member3 (should fail)";
      const descHash = ethers.id(description);

      await dao.connect(member1).propose(targets, values, calldatas, description);
      await time.increase((await dao.votingDelay()) + 1n);
      
      const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
      await dao.connect(member1).castVote(proposalId, 1);
      await dao.connect(member2).castVote(proposalId, 1);
      
      await time.increase((await dao.votingPeriod()) + 1n);
      await dao.queue(targets, values, calldatas, descHash);
      await time.increase(61);
      
      // Execution should fail
      await expect(
        dao.execute(targets, values, calldatas, descHash)
      ).to.be.reverted;
    });
  });

  describe("Combined Parameter Changes", function () {
    it("should update multiple governance parameters in single proposal", async function () {
      const { dao, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2 } = accounts;

      // Create multi-parameter change proposal
      const daoIface = (await ethers.getContractFactory("HomebaseDAO")).interface;
      
      const targets = [
        await dao.getAddress(), // Quorum change
        await dao.getAddress(), // Voting delay change
        await dao.getAddress()  // Proposal threshold change
      ];
      const values = [0, 0, 0];
      const calldatas = [
        daoIface.encodeFunctionData("updateQuorumNumerator", [25]), // 25%
        daoIface.encodeFunctionData("setVotingDelay", [180]),       // 3 minutes
        daoIface.encodeFunctionData("setProposalThreshold", [toWei(150)]) // 150 tokens
      ];
      const description = "Update multiple governance parameters";

      await executeProposalLifecycle(dao, targets, values, calldatas, description, [member1, member2]);

      // Verify all parameters were updated
      expect(await dao.quorumNumerator()).to.equal(25);
      expect(await dao.votingDelay()).to.equal(180);
      expect(await dao.proposalThreshold()).to.equal(toWei(150));
    });
  });
});
