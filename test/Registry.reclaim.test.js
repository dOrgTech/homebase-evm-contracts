const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Registry: Fund Reclaiming Mechanism", function () {

    // A base fixture to deploy a standard DAO stack.
    async function deployDAOFixture() {
        const [owner, member1, member2] = await ethers.getSigners();
        
        // Factories
        const DAOFactory = await ethers.getContractFactory("DAOFactory");
        const daoFactory = await DAOFactory.deploy();
        const InfrastructureFactory = await ethers.getContractFactory("InfrastructureFactory");
        const infraFactory = await InfrastructureFactory.deploy();
        const JurisdictionFactory = await ethers.getContractFactory("JurisdictionFactory");
        const jurisdictionFactory = await JurisdictionFactory.deploy();

        // Deployment
        const timelock = await ethers.getContractAt("TimelockController", await infraFactory.deployTimelock.staticCall(owner.address, 0));
        await infraFactory.deployTimelock(owner.address, 0);

        const registry = await ethers.getContractAt("Registry", await infraFactory.deployRegistry.staticCall(timelock.getAddress(), owner.address));
        await infraFactory.deployRegistry(timelock.getAddress(), owner.address);

        const jurisdiction = await ethers.getContractAt("Jurisdiction", await jurisdictionFactory.deployJurisdictionToken.staticCall(
            "Test Token", "TJT", registry.getAddress(), timelock.getAddress(), [member1.address, member2.address], [ethers.parseEther("100"), ethers.parseEther("50")]
        ));
        await jurisdictionFactory.deployJurisdictionToken("Test Token", "TJT", registry.getAddress(), timelock.getAddress(), [member1.address, member2.address], [ethers.parseEther("100"), ethers.parseEther("50")]);

        const dao = await ethers.getContractAt("HomebaseDAO", await daoFactory.deployDAO.staticCall(
            jurisdiction.getAddress(), timelock.getAddress(), "Test DAO", [1, 100, ethers.parseEther("1"), 4]
        ));
        await daoFactory.deployDAO(jurisdiction.getAddress(), timelock.getAddress(), "Test DAO", [1, 100, ethers.parseEther("1"), 4]);

        // Configuration
        await timelock.grantRole(ethers.id("PROPOSER_ROLE"), dao.getAddress());
        await timelock.grantRole(ethers.id("EXECUTOR_ROLE"), ethers.ZeroAddress);
        await timelock.renounceRole(ethers.id("TIMELOCK_ADMIN_ROLE"), owner.address);
        await jurisdiction.setAdmin(timelock.getAddress());
        await registry.setJurisdictionAddress(jurisdiction.getAddress());

        const MockERC20 = await ethers.getContractFactory("MockERC20");
        const rewardToken = await MockERC20.deploy("Reward Token", "RWT");

        return { dao, jurisdiction, timelock, registry, rewardToken, owner, member1, member2 };
    }

    // A fixture to set up the specific state for reclaim tests: two epochs have passed.
    async function setupReclaimTestFixture() {
        const { registry, jurisdiction, timelock, rewardToken, owner } = await loadFixture(deployDAOFixture);

        const gracePeriod = 30 * 24 * 60 * 60; // 30 days in seconds
        const budget = ethers.parseEther("1000");
        const epoch1 = 1;

        // 1. Set the grace period in the Registry
        await registry.connect(owner).editRegistry("benefits.claim.gracePeriod", gracePeriod.toString());
        
        // 2. Fund the Registry
        await rewardToken.mint(registry.getAddress(), budget * BigInt(2)); // Fund for two epochs

        // 3. Earmark and start Epoch 1
        const purposeEpoch1 = ethers.solidityPackedKeccak256(["string", "uint256", "address"], ["PASSIVE_INCOME", epoch1, await rewardToken.getAddress()]);
        const timelockSigner = await ethers.getImpersonatedSigner(await timelock.getAddress());
        await owner.sendTransaction({ to: timelockSigner.address, value: ethers.parseEther("1.0") });
        await registry.connect(timelockSigner).earmarkFunds(purposeEpoch1, budget, rewardToken.getAddress());
        await jurisdiction.connect(timelockSigner).startNewPassiveIncomeEpoch(budget, rewardToken.getAddress());

        await time.increase(24 * 60 * 60); // Advance time by 1 day

        // 4. Earmark and start Epoch 2 (this starts the grace period for Epoch 1)
        const epoch2 = 2;
        const purposeEpoch2 = ethers.solidityPackedKeccak256(["string", "uint256", "address"], ["PASSIVE_INCOME", epoch2, await rewardToken.getAddress()]);
        await registry.connect(timelockSigner).earmarkFunds(purposeEpoch2, budget, rewardToken.getAddress());
        await jurisdiction.connect(timelockSigner).startNewPassiveIncomeEpoch(budget, rewardToken.getAddress());

        return { registry, rewardToken, timelockSigner, epoch1, gracePeriod, purposeEpoch1, budget };
    }

    it("Should FAIL to reclaim funds from an epoch that is still within its grace period", async function () {
        const { registry, rewardToken, timelockSigner, epoch1 } = await loadFixture(setupReclaimTestFixture);

        // Attempt to reclaim immediately after epoch 2 starts (well within the 30-day grace period)
        await expect(
            registry.connect(timelockSigner).reclaimEarmarkedFunds(epoch1, await rewardToken.getAddress(), false)
        ).to.be.revertedWith("Registry: Claim grace period has not passed");
    });

    it("Should ALLOW the DAO to reclaim funds from an epoch after its grace period has passed", async function () {
        const { registry, rewardToken, timelockSigner, epoch1, gracePeriod, purposeEpoch1, budget } = await loadFixture(setupReclaimTestFixture);

        // Advance time past the grace period (30 days + 1 extra day to be safe)
        await time.increase(gracePeriod + (24 * 60 * 60));

        // Check the earmarked amount before reclaiming
        expect(await registry.earmarkedFunds(purposeEpoch1)).to.equal(budget);
        
        // Reclaim the funds
        await expect(
            registry.connect(timelockSigner).reclaimEarmarkedFunds(epoch1, await rewardToken.getAddress(), false)
        ).to.emit(registry, "EarmarkedFundsWithdrawn").withArgs(purposeEpoch1, budget);

        // Check that the earmarked amount is now zero
        expect(await registry.earmarkedFunds(purposeEpoch1)).to.equal(0);
    });
});
// test/Registry.reclaim.test.js