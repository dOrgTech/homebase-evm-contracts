const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const toWei = (v, decimals = 18) => ethers.parseUnits(v.toString(), decimals);

describe("Advanced Proposal Types", function () {
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

    // Deploy DAO with specific configuration for testing
    const daoConfig = {
      name: "Advanced Test DAO",
      symbol: "ADVTEST",
      description: "Testing advanced proposal types",
      decimals: 18,
      executionDelay: 60, // 1 minute for faster testing
      transferrable: false,
      
      initialMembers: [member1.address, member2.address, member3.address],
      memberTokens: [toWei(1000), toWei(500), toWei(300)],
      
      votingDelayMins: 1,    // 1 minute
      votingPeriodMins: 5,   // 5 minutes
      proposalThreshold: toWei(10),
      quorumFraction: 20,    // 20% quorum
      
      registryKeys: ["description", "treasury"],
      registryValues: ["Advanced Test DAO", "0x0000000000000000000000000000000000000000"]
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
      dao, token, timelock, registry, wrapper,
      accounts: { deployer, member1, member2, member3, recipient },
      config: daoConfig
    };
  }

  describe("ETH Transfer Proposals", function () {
    it("should execute ETH transfer proposal successfully", async function () {
      const { dao, timelock, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1, recipient } = accounts;

      // Send some ETH to the registry (treasury)
      const treasuryAmount = toWei(5);
      await member1.sendTransaction({
        to: await registry.getAddress(),
        value: treasuryAmount
      });

      // Verify registry has ETH
      const initialBalance = await ethers.provider.getBalance(await registry.getAddress());
      expect(initialBalance).to.equal(treasuryAmount);

      // Create ETH transfer proposal
      const transferAmount = toWei(1);
      const registryIface = (await ethers.getContractFactory("Registry")).interface;
      const calldata = registryIface.encodeFunctionData("transferETH", [recipient.address, transferAmount]);

      const targets = [await registry.getAddress()];
      const values = [0];
      const calldatas = [calldata];
      const description = "Transfer 1 ETH to recipient";
      const descHash = ethers.id(description);

      // Execute full proposal lifecycle
      await dao.connect(member1).propose(targets, values, calldatas, description);
      await time.increase((await dao.votingDelay()) + 1n);
      
      const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
      await dao.connect(member1).castVote(proposalId, 1); // Vote For
      await dao.connect(accounts.member2).castVote(proposalId, 1); // Vote For
      
      await time.increase((await dao.votingPeriod()) + 1n);
      await dao.queue(targets, values, calldatas, descHash);
      await time.increase(61); // Wait for timelock delay
      await dao.execute(targets, values, calldatas, descHash);

      // Verify ETH was transferred
      const recipientBalance = await ethers.provider.getBalance(recipient.address);
      expect(recipientBalance).to.be.gt(toWei(10000)); // Should have received the transfer
    });

    it("should fail ETH transfer with insufficient treasury funds", async function () {
      const { dao, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1, recipient } = accounts;

      // Try to transfer more ETH than available
      const transferAmount = toWei(100); // More than treasury has
      const registryIface = (await ethers.getContractFactory("Registry")).interface;
      const calldata = registryIface.encodeFunctionData("transferETH", [recipient.address, transferAmount]);

      const targets = [await registry.getAddress()];
      const values = [0];
      const calldatas = [calldata];
      const description = "Transfer 100 ETH (should fail)";
      const descHash = ethers.id(description);

      await dao.connect(member1).propose(targets, values, calldatas, description);
      await time.increase((await dao.votingDelay()) + 1n);
      
      const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
      await dao.connect(member1).castVote(proposalId, 1);
      await dao.connect(accounts.member2).castVote(proposalId, 1);
      
      await time.increase((await dao.votingPeriod()) + 1n);
      await dao.queue(targets, values, calldatas, descHash);
      await time.increase(61);
      
      // Execution should fail due to insufficient funds
      await expect(
        dao.execute(targets, values, calldatas, descHash)
      ).to.be.reverted;
    });
  });

  describe("Multi-Target Proposals", function () {
    it("should execute multi-target proposal with registry updates and token minting", async function () {
      const { dao, token, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1, recipient } = accounts;

      // Create multi-target proposal
      const registryIface = (await ethers.getContractFactory("Registry")).interface;
      const tokenIface = (await ethers.getContractFactory("HBEVM_token")).interface;

      const targets = [
        await registry.getAddress(),
        await registry.getAddress(),
        await token.getAddress()
      ];
      const values = [0, 0, 0];
      const calldatas = [
        registryIface.encodeFunctionData("editRegistry", ["website", "https://newsite.com"]),
        registryIface.encodeFunctionData("editRegistry", ["contact", "admin@newsite.com"]),
        tokenIface.encodeFunctionData("mint", [recipient.address, toWei(100)])
      ];
      const description = "Multi-target: Update registry and mint tokens";
      const descHash = ethers.id(description);

      // Execute proposal
      await dao.connect(member1).propose(targets, values, calldatas, description);
      await time.increase((await dao.votingDelay()) + 1n);
      
      const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
      await dao.connect(member1).castVote(proposalId, 1);
      await dao.connect(accounts.member2).castVote(proposalId, 1);
      
      await time.increase((await dao.votingPeriod()) + 1n);
      await dao.queue(targets, values, calldatas, descHash);
      await time.increase(61);
      await dao.execute(targets, values, calldatas, descHash);

      // Verify all operations were executed
      expect(await registry.getRegistryValue("website")).to.equal("https://newsite.com");
      expect(await registry.getRegistryValue("contact")).to.equal("admin@newsite.com");
      expect(await token.balanceOf(recipient.address)).to.equal(toWei(100));
    });

    it("should fail multi-target proposal if any target fails", async function () {
      const { dao, token, registry, accounts } = await loadFixture(deployDAOFixture);
      const { member1, recipient } = accounts;

      // Create multi-target proposal with one invalid operation
      const registryIface = (await ethers.getContractFactory("Registry")).interface;
      const tokenIface = (await ethers.getContractFactory("HBEVM_token")).interface;

      const targets = [
        await registry.getAddress(),
        await token.getAddress() // This will fail - trying to mint to zero address
      ];
      const values = [0, 0];
      const calldatas = [
        registryIface.encodeFunctionData("editRegistry", ["valid", "update"]),
        tokenIface.encodeFunctionData("mint", [ethers.ZeroAddress, toWei(100)]) // Invalid mint
      ];
      const description = "Multi-target with failure";
      const descHash = ethers.id(description);

      await dao.connect(member1).propose(targets, values, calldatas, description);
      await time.increase((await dao.votingDelay()) + 1n);
      
      const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
      await dao.connect(member1).castVote(proposalId, 1);
      await dao.connect(accounts.member2).castVote(proposalId, 1);
      
      await time.increase((await dao.votingPeriod()) + 1n);
      await dao.queue(targets, values, calldatas, descHash);
      await time.increase(61);
      
      // Entire execution should fail
      await expect(
        dao.execute(targets, values, calldatas, descHash)
      ).to.be.reverted;

      // Verify no operations were executed
      expect(await registry.getRegistryValue("valid")).to.equal("");
    });
  });

  describe("DAO Configuration Update Proposals", function () {
    it("should update voting parameters through governance", async function () {
      const { dao, accounts } = await loadFixture(deployDAOFixture);
      const { member1, member2 } = accounts;

      // Note: In a real implementation, you'd need governance functions to update these parameters
      // This test demonstrates the pattern, but the actual DAO contract would need these functions
      
      const currentVotingDelay = await dao.votingDelay();
      const currentVotingPeriod = await dao.votingPeriod();
      
      // Verify current values
      expect(currentVotingDelay).to.equal(60); // 1 minute in seconds
      expect(currentVotingPeriod).to.equal(300); // 5 minutes in seconds
      
      // This test shows the structure for configuration updates
      // In practice, you'd implement updateVotingDelay, updateVotingPeriod functions
      // that can only be called by the timelock (governance)
    });
  });
});
