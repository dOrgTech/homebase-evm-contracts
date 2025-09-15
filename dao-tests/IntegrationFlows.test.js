const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const toWei = (v, decimals = 18) => ethers.parseUnits(v.toString(), decimals);

describe("Integration Flows - End-to-End User Journeys", function () {
  async function deployCompleteEcosystemFixture() {
    const [deployer, founder, member1, member2, member3, community1, community2, outsider] = await ethers.getSigners();
    
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

    return { 
      wrapper, tokenFactory, timelockFactory, daoFactory,
      accounts: { deployer, founder, member1, member2, member3, community1, community2, outsider }
    };
  }

  describe("Complete DAO Lifecycle", function () {
    it("should handle full DAO creation to treasury management workflow", async function () {
      const { wrapper, accounts } = await loadFixture(deployCompleteEcosystemFixture);
      const { founder, member1, member2, member3, community1 } = accounts;

      // Step 1: Founder creates DAO
      const daoConfig = {
        name: "Community Impact DAO",
        symbol: "IMPACT",
        description: "A DAO focused on community impact projects",
        decimals: 18,
        executionDelay: 300, // 5 minutes
        transferrable: false,
        
        initialMembers: [founder.address, member1.address, member2.address, member3.address],
        memberTokens: [toWei(1000), toWei(500), toWei(300), toWei(200)], // Total: 2000
        
        votingDelayMins: 2,
        votingPeriodMins: 10,
        proposalThreshold: toWei(50), // 2.5% of total supply
        quorumFraction: 20, // 20% quorum (400 tokens needed)
        
        registryKeys: [
          "description", 
          "website", 
          "mission", 
          "treasury_purpose"
        ],
        registryValues: [
          "Community Impact DAO",
          "https://impact-dao.org",
          "Fund community impact projects",
          "Grant funding for verified community projects"
        ]
      };

      const initialAmounts = [
        ...daoConfig.memberTokens,
        daoConfig.votingDelayMins,
        daoConfig.votingPeriodMins,
        daoConfig.proposalThreshold,
        daoConfig.quorumFraction
      ];

      await (await wrapper.connect(founder).deployDAOwithToken({
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

      // Step 2: Members delegate their voting power
      await token.connect(founder).delegate(founder.address);
      await token.connect(member1).delegate(member1.address);
      await token.connect(member2).delegate(member2.address);
      await token.connect(member3).delegate(member3.address);

      // Verify initial setup
      expect(await token.totalSupply()).to.equal(toWei(2000));
      expect(await dao.quorumNumerator()).to.equal(20);
      expect(await registry.getRegistryValue("mission")).to.equal("Fund community impact projects");

      // Step 3: Fund the treasury (Registry needs ETH for transfers)
      const treasuryFunding = toWei(10); // 10 ETH
      await founder.sendTransaction({
        to: await registry.getAddress(),
        value: treasuryFunding
      });

      expect(await ethers.provider.getBalance(await registry.getAddress())).to.equal(treasuryFunding);

      // Step 4: Create first proposal - Update mission statement
      const registryIface = (await ethers.getContractFactory("Registry")).interface;
      const newMission = "Fund verified community impact projects with measurable outcomes";
      
      const targets1 = [await registry.getAddress()];
      const values1 = [0];
      const calldatas1 = [registryIface.encodeFunctionData("editRegistry", ["mission", newMission])];
      const description1 = "Update mission statement for clarity";
      const descHash1 = ethers.id(description1);

      await dao.connect(founder).propose(targets1, values1, calldatas1, description1);
      await time.increase((await dao.votingDelay()) + 1n);
      
      const proposalId1 = await dao.hashProposal(targets1, values1, calldatas1, descHash1);
      
      // Step 5: Community voting on mission update
      await dao.connect(founder).castVote(proposalId1, 1); // For (1000 tokens)
      await dao.connect(member1).castVote(proposalId1, 1); // For (500 tokens)
      // Total: 1500 tokens > 400 needed for quorum
      
      await time.increase((await dao.votingPeriod()) + 1n);
      
      expect(await dao.state(proposalId1)).to.equal(4); // Succeeded
      
      // Step 6: Execute mission update
      await dao.queue(targets1, values1, calldatas1, descHash1);
      await time.increase(301); // Wait for timelock
      await dao.execute(targets1, values1, calldatas1, descHash1);
      
      expect(await registry.getRegistryValue("mission")).to.equal(newMission);

      // Step 7: Create funding proposal
      const grantAmount = toWei(2); // 2 ETH grant
      const targets2 = [await registry.getAddress()];
      const values2 = [0];
      const calldatas2 = [registryIface.encodeFunctionData("transferETH", [community1.address, grantAmount])];
      const description2 = "Grant 2 ETH to Community Project Alpha for verified impact initiative";
      const descHash2 = ethers.id(description2);

      await dao.connect(member1).propose(targets2, values2, calldatas2, description2);
      await time.increase((await dao.votingDelay()) + 1n);
      
      const proposalId2 = await dao.hashProposal(targets2, values2, calldatas2, descHash2);

      // Step 8: Diverse voting on funding proposal
      await dao.connect(founder).castVote(proposalId2, 1);  // For (1000 tokens)
      await dao.connect(member1).castVote(proposalId2, 1);  // For (500 tokens)
      await dao.connect(member2).castVote(proposalId2, 0);  // Against (300 tokens)
      await dao.connect(member3).castVote(proposalId2, 2);  // Abstain (200 tokens)
      
      // Total votes: 2000 tokens (100% participation)
      // For: 1500, Against: 300, Abstain: 200
      // Quorum: 2000 > 400 ✓, Majority: 1500 > 300 ✓
      
      await time.increase((await dao.votingPeriod()) + 1n);
      expect(await dao.state(proposalId2)).to.equal(4); // Succeeded

      // Step 9: Execute funding proposal
      const initialCommunityBalance = await ethers.provider.getBalance(community1.address);
      
      await dao.queue(targets2, values2, calldatas2, descHash2);
      await time.increase(301);
      await dao.execute(targets2, values2, calldatas2, descHash2);

      // Verify grant was transferred
      const finalCommunityBalance = await ethers.provider.getBalance(community1.address);
      expect(finalCommunityBalance - initialCommunityBalance).to.equal(grantAmount);
      
      // Verify treasury balance decreased
      const finalTreasuryBalance = await ethers.provider.getBalance(await registry.getAddress());
      expect(finalTreasuryBalance).to.equal(treasuryFunding - grantAmount);

      // Step 10: Verify final state
      expect(await dao.state(proposalId2)).to.equal(7); // Executed
      
      // Check vote tallies
      const finalVotes = await dao.proposalVotes(proposalId2);
      expect(finalVotes.forVotes).to.equal(toWei(1500));
      expect(finalVotes.againstVotes).to.equal(toWei(300));
      expect(finalVotes.abstainVotes).to.equal(toWei(200));
    });
  });

  describe("Multi-DAO Ecosystem", function () {
    it("should handle multiple DAOs with different configurations", async function () {
      const { wrapper, accounts } = await loadFixture(deployCompleteEcosystemFixture);
      const { founder, member1, member2, community1, community2 } = accounts;

      // Create first DAO - Conservative governance
      const conservativeConfig = {
        name: "Conservative DAO",
        symbol: "CONS",
        description: "Conservative governance with high thresholds",
        decimals: 18,
        executionDelay: 3600, // 1 hour
        transferrable: false,
        
        initialMembers: [founder.address, member1.address],
        memberTokens: [toWei(700), toWei(300)],
        
        votingDelayMins: 60,   // 1 hour delay
        votingPeriodMins: 1440, // 24 hours voting
        proposalThreshold: toWei(200), // 20% threshold
        quorumFraction: 60,    // 60% quorum
        
        registryKeys: ["type"],
        registryValues: ["conservative"]
      };

      // Create second DAO - Progressive governance
      const progressiveConfig = {
        name: "Progressive DAO",
        symbol: "PROG",
        description: "Progressive governance with low thresholds",
        decimals: 18,
        executionDelay: 60,    // 1 minute
        transferrable: true,   // Transferable tokens
        
        initialMembers: [member1.address, member2.address, community1.address, community2.address],
        memberTokens: [toWei(250), toWei(250), toWei(250), toWei(250)],
        
        votingDelayMins: 5,    // 5 minutes delay
        votingPeriodMins: 60,  // 1 hour voting
        proposalThreshold: toWei(25), // 2.5% threshold
        quorumFraction: 15,    // 15% quorum
        
        registryKeys: ["type"],
        registryValues: ["progressive"]
      };

      // Deploy both DAOs
      const conservativeAmounts = [
        ...conservativeConfig.memberTokens,
        conservativeConfig.votingDelayMins,
        conservativeConfig.votingPeriodMins,
        conservativeConfig.proposalThreshold,
        conservativeConfig.quorumFraction
      ];

      const progressiveAmounts = [
        ...progressiveConfig.memberTokens,
        progressiveConfig.votingDelayMins,
        progressiveConfig.votingPeriodMins,
        progressiveConfig.proposalThreshold,
        progressiveConfig.quorumFraction
      ];

      await wrapper.deployDAOwithToken({
        name: conservativeConfig.name,
        symbol: conservativeConfig.symbol,
        description: conservativeConfig.description,
        decimals: conservativeConfig.decimals,
        executionDelay: conservativeConfig.executionDelay,
        initialMembers: conservativeConfig.initialMembers,
        initialAmounts: conservativeAmounts,
        keys: conservativeConfig.registryKeys,
        values: conservativeConfig.registryValues,
        transferrable: conservativeConfig.transferrable
      });

      await wrapper.deployDAOwithToken({
        name: progressiveConfig.name,
        symbol: progressiveConfig.symbol,
        description: progressiveConfig.description,
        decimals: progressiveConfig.decimals,
        executionDelay: progressiveConfig.executionDelay,
        initialMembers: progressiveConfig.initialMembers,
        initialAmounts: progressiveAmounts,
        keys: progressiveConfig.registryKeys,
        values: progressiveConfig.registryValues,
        transferrable: progressiveConfig.transferrable
      });

      // Verify both DAOs were created
      expect(await wrapper.getNumberOfDAOs()).to.equal(2);

      // Get DAO contracts
      const conservativeDaoAddr = await wrapper.deployedDAOs(0);
      const progressiveDaoAddr = await wrapper.deployedDAOs(1);
      
      const conservativeDao = await ethers.getContractAt("HomebaseDAO", conservativeDaoAddr);
      const progressiveDao = await ethers.getContractAt("HomebaseDAO", progressiveDaoAddr);

      // Verify different configurations
      expect(await conservativeDao.quorumNumerator()).to.equal(60);
      expect(await progressiveDao.quorumNumerator()).to.equal(15);
      
      expect(await conservativeDao.votingDelay()).to.equal(3600); // 1 hour in seconds
      expect(await progressiveDao.votingDelay()).to.equal(300);   // 5 minutes in seconds

      // Verify token transferability
      const conservativeTokenAddr = await wrapper.deployedTokens(0);
      const progressiveTokenAddr = await wrapper.deployedTokens(1);
      
      const conservativeToken = await ethers.getContractAt("HBEVM_token", conservativeTokenAddr);
      const progressiveToken = await ethers.getContractAt("HBEVM_token", progressiveTokenAddr);

      expect(await conservativeToken.isTransferable()).to.equal(false);
      expect(await progressiveToken.isTransferable()).to.equal(true);

      // Test token transfer on progressive DAO
      await progressiveToken.connect(member1).delegate(member1.address);
      await progressiveToken.connect(member1).transfer(community2.address, toWei(50));
      
      expect(await progressiveToken.balanceOf(community2.address)).to.equal(toWei(300)); // 250 + 50
      expect(await progressiveToken.balanceOf(member1.address)).to.equal(toWei(200)); // 250 - 50
    });
  });

  describe("Wrapped Token Integration", function () {
    it("should handle complete wrapped token DAO workflow", async function () {
      const { wrapper, accounts } = await loadFixture(deployCompleteEcosystemFixture);
      const { founder, member1, member2, community1 } = accounts;

      // Step 1: Deploy underlying token
      const UnderlyingToken = await ethers.getContractFactory("HBEVM_token");
      const underlying = await UnderlyingToken.deploy(
        "Underlying Token",
        "UND",
        6, // USDC-like decimals
        [founder.address, member1.address, member2.address],
        [toWei(100000, 6), toWei(50000, 6), toWei(25000, 6)], // Large amounts
        true // transferable
      );
      await underlying.waitForDeployment();

      // Step 2: Create wrapped token DAO
      const wrappedConfig = {
        daoName: "Wrapped Token DAO",
        wrappedTokenName: "Wrapped UND",
        wrappedTokenSymbol: "wUND",
        description: "DAO for wrapped token holders",
        executionDelay: 300,
        underlyingTokenAddress: await underlying.getAddress(),
        
        minsVotingDelay: 10,
        minsVotingPeriod: 120,
        proposalThreshold: toWei(1000, 6), // 1000 tokens
        quorumFraction: 25,
        
        keys: ["description", "underlying"],
        values: ["Wrapped Token DAO", await underlying.getAddress()]
      };

      await wrapper.deployDAOwithWrappedToken(wrappedConfig);

      const idx = (await wrapper.getNumberOfDAOs()) - 1n;
      const daoAddr = await wrapper.deployedDAOs(idx);
      const wTokenAddr = await wrapper.deployedTokens(idx);
      const registryAddr = await wrapper.deployedRegistries(idx);

      const dao = await ethers.getContractAt("HomebaseDAO", daoAddr);
      const wToken = await ethers.getContractAt("HBEVM_Wrapped_Token", wTokenAddr);
      const registry = await ethers.getContractAt("Registry", registryAddr);

      // Step 3: Members wrap their tokens
      const wrapAmount1 = toWei(10000, 6);
      const wrapAmount2 = toWei(5000, 6);

      await underlying.connect(founder).approve(await wToken.getAddress(), wrapAmount1);
      await wToken.connect(founder).depositFor(founder.address, wrapAmount1);
      
      await underlying.connect(member1).approve(await wToken.getAddress(), wrapAmount2);
      await wToken.connect(member1).depositFor(member1.address, wrapAmount2);

      // Step 4: Delegate wrapped tokens
      await wToken.connect(founder).delegate(founder.address);
      await wToken.connect(member1).delegate(member1.address);

      // Verify wrapped token balances and voting power
      expect(await wToken.balanceOf(founder.address)).to.equal(wrapAmount1);
      expect(await wToken.getVotes(founder.address)).to.equal(wrapAmount1);

      // Step 5: Create and execute proposal
      const registryIface = (await ethers.getContractFactory("Registry")).interface;
      const targets = [await registry.getAddress()];
      const values = [0];
      const calldatas = [registryIface.encodeFunctionData("editRegistry", ["status", "active"])];
      const description = "Activate wrapped token DAO";
      const descHash = ethers.id(description);

      await dao.connect(founder).propose(targets, values, calldatas, description);
      await time.increase((await dao.votingDelay()) + 1n);
      
      const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
      await dao.connect(founder).castVote(proposalId, 1);
      await dao.connect(member1).castVote(proposalId, 1);
      
      await time.increase((await dao.votingPeriod()) + 1n);
      await dao.queue(targets, values, calldatas, descHash);
      await time.increase(301);
      await dao.execute(targets, values, calldatas, descHash);

      expect(await registry.getRegistryValue("status")).to.equal("active");

      // Step 6: Test unwrapping
      const unwrapAmount = toWei(2000, 6);
      await wToken.connect(founder).withdrawTo(founder.address, unwrapAmount);
      
      expect(await wToken.balanceOf(founder.address)).to.equal(wrapAmount1 - unwrapAmount);
      expect(await underlying.balanceOf(founder.address)).to.equal(toWei(92000, 6)); // 100000 - 10000 + 2000
    });
  });
});
