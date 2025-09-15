const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const toWei = (v, decimals = 18) => ethers.parseUnits(v.toString(), decimals);

describe("Missing Proposal Flows - Complete Coverage", function () {
  async function deployCompleteEcosystemFixture() {
    const [deployer, member1, member2, member3, recipient, tokenHolder] = await ethers.getSigners();
    
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

    // Deploy DAO
    const daoConfig = {
      name: "Complete Test DAO",
      symbol: "COMPLETE",
      description: "Testing all proposal flows",
      decimals: 18,
      executionDelay: 60,
      transferrable: false,
      
      initialMembers: [member1.address, member2.address, member3.address],
      memberTokens: [toWei(1000), toWei(500), toWei(300)],
      
      votingDelayMins: 1,
      votingPeriodMins: 5,
      proposalThreshold: toWei(50),
      quorumFraction: 25, // 25% quorum
      
      registryKeys: ["description"],
      registryValues: ["Complete Test DAO"]
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

    // Deploy external ERC20 token for testing transfers
    const ExternalToken = await ethers.getContractFactory("HBEVM_token");
    const externalToken = await ExternalToken.deploy(
      "External Token",
      "EXT",
      18,
      [tokenHolder.address, await registry.getAddress()], // Give some to registry for transfers
      [toWei(1000), toWei(500)],
      true // transferable
    );
    await externalToken.waitForDeployment();

    // Deploy mock NFT contract for testing
    const MockNFT = await ethers.getContractFactory("MockERC721");
    const mockNFT = await MockNFT.deploy("Test NFT", "TNFT");
    await mockNFT.waitForDeployment();

    // Mint some NFTs to the registry for testing transfers
    // Mint token ID 0 first for Registry validation to work
    await mockNFT.mint(await registry.getAddress(), 0);
    await mockNFT.mint(await registry.getAddress(), 1);
    await mockNFT.mint(await registry.getAddress(), 2);

    return { 
      dao, token, timelock, registry, wrapper, externalToken, mockNFT,
      accounts: { deployer, member1, member2, member3, recipient, tokenHolder },
      config: daoConfig
    };
  }

  async function executeProposalLifecycle(dao, targets, values, calldatas, description, voters) {
    const descHash = ethers.id(description);
    
    await dao.connect(voters[0]).propose(targets, values, calldatas, description);
    await time.increase((await dao.votingDelay()) + 1n);
    
    const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
    
    // Vote with multiple members
    for (const voter of voters) {
      await dao.connect(voter).castVote(proposalId, 1); // Vote For
    }
    
    await time.increase((await dao.votingPeriod()) + 1n);
    await dao.queue(targets, values, calldatas, descHash);
    await time.increase(61); // Wait for timelock
    await dao.execute(targets, values, calldatas, descHash);
    
    return proposalId;
  }

  describe("ERC20 Token Transfer Proposals", function () {
    it("should execute ERC20 token transfer proposal successfully", async function () {
      const { dao, registry, externalToken, accounts } = await loadFixture(deployCompleteEcosystemFixture);
      const { member1, member2, recipient } = accounts;

      // Verify registry has external tokens
      const initialBalance = await externalToken.balanceOf(await registry.getAddress());
      expect(initialBalance).to.equal(toWei(500));

      // Create ERC20 transfer proposal
      const transferAmount = toWei(100);
      const registryIface = (await ethers.getContractFactory("Registry")).interface;
      const calldata = registryIface.encodeFunctionData("transferERC20", [
        await externalToken.getAddress(),
        recipient.address,
        transferAmount
      ]);

      const targets = [await registry.getAddress()];
      const values = [0];
      const calldatas = [calldata];
      const description = "Transfer 100 EXT tokens to recipient";

      await executeProposalLifecycle(dao, targets, values, calldatas, description, [member1, member2]);

      // Verify transfer was successful
      const finalRegistryBalance = await externalToken.balanceOf(await registry.getAddress());
      const recipientBalance = await externalToken.balanceOf(recipient.address);
      
      expect(finalRegistryBalance).to.equal(toWei(400)); // 500 - 100
      expect(recipientBalance).to.equal(transferAmount);
    });

    it("should fail ERC20 transfer with insufficient balance", async function () {
      const { dao, registry, externalToken, accounts } = await loadFixture(deployCompleteEcosystemFixture);
      const { member1, member2, recipient } = accounts;

      // Try to transfer more than available
      const transferAmount = toWei(1000); // More than the 500 available
      const registryIface = (await ethers.getContractFactory("Registry")).interface;
      const calldata = registryIface.encodeFunctionData("transferERC20", [
        await externalToken.getAddress(),
        recipient.address,
        transferAmount
      ]);

      const targets = [await registry.getAddress()];
      const values = [0];
      const calldatas = [calldata];
      const description = "Transfer 1000 EXT tokens (should fail)";
      const descHash = ethers.id(description);

      await dao.connect(member1).propose(targets, values, calldatas, description);
      await time.increase((await dao.votingDelay()) + 1n);
      
      const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
      await dao.connect(member1).castVote(proposalId, 1);
      await dao.connect(member2).castVote(proposalId, 1);
      
      await time.increase((await dao.votingPeriod()) + 1n);
      await dao.queue(targets, values, calldatas, descHash);
      await time.increase(61);
      
      // Execution should fail due to insufficient balance
      await expect(
        dao.execute(targets, values, calldatas, descHash)
      ).to.be.reverted;
    });
  });

  describe("NFT Transfer Proposals", function () {
    it("should execute NFT transfer proposal successfully", async function () {
      const { dao, registry, mockNFT, accounts } = await loadFixture(deployCompleteEcosystemFixture);
      const { member1, member2, recipient } = accounts;

      // Verify registry owns the NFT
      expect(await mockNFT.ownerOf(1)).to.equal(await registry.getAddress());

      // Create NFT transfer proposal
      const registryIface = (await ethers.getContractFactory("Registry")).interface;
      const calldata = registryIface.encodeFunctionData("transferERC721", [
        await mockNFT.getAddress(),
        recipient.address,
        1 // tokenId
      ]);

      const targets = [await registry.getAddress()];
      const values = [0];
      const calldatas = [calldata];
      const description = "Transfer NFT #1 to recipient";

      await executeProposalLifecycle(dao, targets, values, calldatas, description, [member1, member2]);

      // Verify NFT was transferred
      expect(await mockNFT.ownerOf(1)).to.equal(recipient.address);
    });

    it("should fail NFT transfer for non-owned token", async function () {
      const { dao, registry, mockNFT, accounts } = await loadFixture(deployCompleteEcosystemFixture);
      const { member1, member2, recipient } = accounts;

      // Try to transfer NFT that registry doesn't own
      const registryIface = (await ethers.getContractFactory("Registry")).interface;
      const calldata = registryIface.encodeFunctionData("transferERC721", [
        await mockNFT.getAddress(),
        recipient.address,
        999 // Non-existent tokenId
      ]);

      const targets = [await registry.getAddress()];
      const values = [0];
      const calldatas = [calldata];
      const description = "Transfer non-existent NFT (should fail)";
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

  describe("Multiple Token Transfer Proposals", function () {
    it("should execute multiple transfers in single proposal", async function () {
      const { dao, registry, externalToken, mockNFT, accounts } = await loadFixture(deployCompleteEcosystemFixture);
      const { member1, member2, recipient } = accounts;

      // Fund registry with ETH for the test
      await member1.sendTransaction({
        to: await registry.getAddress(),
        value: toWei(2)
      });

      // Create multi-transfer proposal: ETH + ERC20 + NFT
      const registryIface = (await ethers.getContractFactory("Registry")).interface;
      
      const targets = [
        await registry.getAddress(), // ETH transfer
        await registry.getAddress(), // ERC20 transfer
        await registry.getAddress()  // NFT transfer
      ];
      const values = [0, 0, 0];
      const calldatas = [
        registryIface.encodeFunctionData("transferETH", [recipient.address, toWei(1)]),
        registryIface.encodeFunctionData("transferERC20", [
          await externalToken.getAddress(),
          recipient.address,
          toWei(50)
        ]),
        registryIface.encodeFunctionData("transferERC721", [
          await mockNFT.getAddress(),
          recipient.address,
          2
        ])
      ];
      const description = "Multi-transfer: ETH + ERC20 + NFT";

      const initialETHBalance = await ethers.provider.getBalance(recipient.address);
      
      await executeProposalLifecycle(dao, targets, values, calldatas, description, [member1, member2]);

      // Verify all transfers were successful
      const finalETHBalance = await ethers.provider.getBalance(recipient.address);
      expect(finalETHBalance - initialETHBalance).to.equal(toWei(1));
      
      expect(await externalToken.balanceOf(recipient.address)).to.equal(toWei(50));
      expect(await mockNFT.ownerOf(2)).to.equal(recipient.address);
    });
  });
});
