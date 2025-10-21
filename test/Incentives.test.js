const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, mine } = require("@nomicfoundation/hardhat-network-helpers");

describe("Incentive Mechanisms (Phase 2)", function () {
    let jurisdiction, registry, timelockSigner, paymentToken, member1, member2, delegate, otherAccount, deployer;

    beforeEach(async function () {
        [deployer, timelockAdmin, member1, member2, delegate, otherAccount] = await ethers.getSigners();

        const TimelockFactory = await ethers.getContractFactory("@openzeppelin/contracts/governance/TimelockController.sol:TimelockController");
        const timelock = await TimelockFactory.deploy(0, [], [], timelockAdmin.address);
        const timelockAddress = await timelock.getAddress();

        const RegistryFactory = await ethers.getContractFactory("Registry");
        registry = await RegistryFactory.deploy(timelockAddress, deployer.address);
        const registryAddress = await registry.getAddress();

        const MockERC20Factory = await ethers.getContractFactory("MockERC20");
        paymentToken = await MockERC20Factory.deploy("Reward Token", "RWT");
        await paymentToken.mint(registryAddress, ethers.parseEther("10000"));

        const initialMembers = [member1.address, member2.address, delegate.address];
        const initialAmounts = [ethers.parseEther("100"), ethers.parseEther("300"), ethers.parseEther("50")];
        
        const JurisdictionFactory = await ethers.getContractFactory("Jurisdiction");
        jurisdiction = await JurisdictionFactory.deploy("Test Jurisdiction", "TJ", registryAddress, timelockAddress, initialMembers, initialAmounts);
        const jurisdictionAddress = await jurisdiction.getAddress();
        
        await hre.network.provider.request({ method: "hardhat_impersonateAccount", params: [timelockAddress] });
        timelockSigner = await ethers.getSigner(timelockAddress);
        await deployer.sendTransaction({ to: timelockAddress, value: ethers.parseEther("1.0") });
        
        await registry.connect(timelockSigner).setJurisdictionAddress(jurisdictionAddress);

        await jurisdiction.connect(member1).delegate(delegate.address);
        await jurisdiction.connect(member2).delegate(delegate.address);
        await jurisdiction.connect(delegate).delegate(delegate.address);
        
        await mine();
    });

  describe("Registry: Earmark Management", function () {
    it("Should allow the DAO to withdraw earmarked funds", async function () {
      const purpose = ethers.keccak256(ethers.toUtf8Bytes("TEST_PURPOSE"));
      const earmarkAmount = ethers.parseEther("100");
      const withdrawAmount = ethers.parseEther("40");

      await registry.connect(timelockSigner).earmarkFunds(purpose, earmarkAmount, await paymentToken.getAddress());
      await expect(registry.connect(timelockSigner).withdrawEarmarkedFunds(purpose, withdrawAmount))
        .to.emit(registry, "EarmarkedFundsWithdrawn").withArgs(purpose, withdrawAmount);
      
      expect(await registry.earmarkedFunds(purpose)).to.equal(earmarkAmount - withdrawAmount);
    });
  });

  describe("Jurisdiction: Passive Income", function () {
    it("Should allow a member to claim their proportional share, even if delegated", async function () {
      const budget = ethers.parseEther("1000");

      await time.increase(60);
      await jurisdiction.connect(timelockSigner).startNewPassiveIncomeEpoch(budget, await paymentToken.getAddress());
      const epochId = await jurisdiction.currentPassiveIncomeEpoch();
      
      const purpose = ethers.solidityPackedKeccak256(["string", "uint256", "address"], ["PASSIVE_INCOME", epochId, await paymentToken.getAddress()]);
      await registry.connect(timelockSigner).earmarkFunds(purpose, budget, await paymentToken.getAddress());
      
      const totalSupply = ethers.parseEther("450");
      const member2Rep = ethers.parseEther("300");
      const expectedReward = (member2Rep * budget) / totalSupply;

      // --- FIX: Pass the epochId to the claim function ---
      await expect(jurisdiction.connect(member2).claimPassiveIncome(epochId))
        .to.emit(jurisdiction, "PassiveIncomeClaimed").withArgs(member2.address, epochId, expectedReward);
    });

    it("Should prevent a member from claiming twice in the same epoch", async function () {
        const budget = ethers.parseEther("1000");

        await time.increase(60);
        await jurisdiction.connect(timelockSigner).startNewPassiveIncomeEpoch(budget, await paymentToken.getAddress());
        const epochId = await jurisdiction.currentPassiveIncomeEpoch();
        const purpose = ethers.solidityPackedKeccak256(["string", "uint256", "address"],["PASSIVE_INCOME", epochId, await paymentToken.getAddress()]);
        await registry.connect(timelockSigner).earmarkFunds(purpose, budget, await paymentToken.getAddress());

        // --- FIX: Pass the epochId to the claim function ---
        await jurisdiction.connect(member1).claimPassiveIncome(epochId);
        await expect(jurisdiction.connect(member1).claimPassiveIncome(epochId))
            .to.be.revertedWith("Jurisdiction: Already claimed for this epoch");
    });
  });

  describe("Jurisdiction: Delegate Rewards", function (){
    it("Should allow a delegate to claim rewards based on delegated votes", async function() {
        const budget = ethers.parseEther("500");

        await time.increase(60);
        await jurisdiction.connect(timelockSigner).startNewDelegateRewardEpoch(budget, await paymentToken.getAddress());
        const epochId = await jurisdiction.currentDelegateRewardEpoch();

        const purpose = ethers.solidityPackedKeccak256(["string", "uint256", "address"], ["DELEGATE_REWARD", epochId, await paymentToken.getAddress()]);
        await registry.connect(timelockSigner).earmarkFunds(purpose, budget, await paymentToken.getAddress());
        
        const totalRepSnapshot = ethers.parseEther("450");
        const delegatedVotes = ethers.parseEther("400"); 
        const expectedReward = (delegatedVotes * budget) / totalRepSnapshot;

        // --- FIX: Pass the epochId to the claim function ---
        await expect(jurisdiction.connect(delegate).claimRepresentationReward(epochId))
          .to.emit(jurisdiction, "DelegateRewardClaimed").withArgs(delegate.address, epochId, expectedReward);
    });

     it("Should fail if a member has no delegated votes", async function() {
        const budget = ethers.parseEther("500");

        await time.increase(60);
        await jurisdiction.connect(timelockSigner).startNewDelegateRewardEpoch(budget, await paymentToken.getAddress());
        const epochId = await jurisdiction.currentDelegateRewardEpoch();
        const purpose = ethers.solidityPackedKeccak256( ["string", "uint256", "address"], ["DELEGATE_REWARD", epochId, await paymentToken.getAddress()]);
        await registry.connect(timelockSigner).earmarkFunds(purpose, budget, await paymentToken.getAddress());

        // --- FIX: Pass the epochId to the claim function ---
        await expect(jurisdiction.connect(member1).claimRepresentationReward(epochId))
          .to.be.revertedWith("Jurisdiction: No delegated votes at epoch start");
    });
  });
});