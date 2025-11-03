const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time, mine } = require("@nomicfoundation/hardhat-network-helpers");

describe("Jurisdiction Custom Functionality", function () {

    async function deploySingleDAOStack() {
        const [owner, member1, member2, member3] = await ethers.getSigners();
        const initialAmounts = [ethers.parseEther("100"), ethers.parseEther("50"), ethers.parseEther("25")];
        
        const DAOFactory = await ethers.getContractFactory("DAOFactory");
        const daoFactory = await DAOFactory.deploy();
        const InfrastructureFactory = await ethers.getContractFactory("InfrastructureFactory");
        const infraFactory = await InfrastructureFactory.deploy();
        const JurisdictionFactory = await ethers.getContractFactory("JurisdictionFactory");
        const jurisdictionFactory = await JurisdictionFactory.deploy();

        const timelock = await ethers.getContractAt("TimelockController", await infraFactory.deployTimelock.staticCall(owner.address, 0));
        await infraFactory.deployTimelock(owner.address, 0);

        const registry = await ethers.getContractAt("Registry", await infraFactory.deployRegistry.staticCall(timelock.getAddress(), owner.address));
        await infraFactory.deployRegistry(timelock.getAddress(), owner.address);

        const jurisdiction = await ethers.getContractAt("Jurisdiction", await jurisdictionFactory.deployJurisdictionToken.staticCall(
            "Test Token", "TJT", registry.getAddress(), timelock.getAddress(), [member1.address, member2.address, member3.address], initialAmounts
        ));
        await jurisdictionFactory.deployJurisdictionToken("Test Token", "TJT", registry.getAddress(), timelock.getAddress(), [member1.address, member2.address, member3.address], initialAmounts);

        const dao = await ethers.getContractAt("HomebaseDAO", await daoFactory.deployDAO.staticCall(
            jurisdiction.getAddress(), timelock.getAddress(), "Test DAO", [1, 100, ethers.parseEther("1"), 4]
        ));
        await daoFactory.deployDAO(jurisdiction.getAddress(), timelock.getAddress(), "Test DAO", [1, 100, ethers.parseEther("1"), 4]);

        await timelock.grantRole(ethers.id("PROPOSER_ROLE"), dao.getAddress());
        await timelock.grantRole(ethers.id("EXECUTOR_ROLE"), ethers.ZeroAddress);
        await timelock.renounceRole(ethers.id("TIMELOCK_ADMIN_ROLE"), owner.address);
        await jurisdiction.setAdmin(timelock.getAddress());
        await registry.setJurisdictionAddress(jurisdiction.getAddress());

        const MockERC20 = await ethers.getContractFactory("MockERC20");
        const rewardToken = await MockERC20.deploy("Reward Token", "RWT");

        return { dao, jurisdiction, timelock, registry, rewardToken, owner, member1, member2, member3, initialAmounts };
    }

    describe("Passive Income Mechanism", function () {
        it("Should allow a member to claim their proportional share of passive income", async function () {
            const { jurisdiction, registry, timelock, rewardToken, owner, member1 } = await loadFixture(deploySingleDAOStack);
            const budget = ethers.parseEther("1000");
            const epochId = 1;
            await rewardToken.mint(registry.getAddress(), budget);
            const purpose = ethers.solidityPackedKeccak256(["string", "uint256", "address"], ["PASSIVE_INCOME", epochId, await rewardToken.getAddress()]);
            const timelockSigner = await ethers.getImpersonatedSigner(await timelock.getAddress());
            await owner.sendTransaction({ to: timelockSigner.address, value: ethers.parseEther("1.0") });
            await registry.connect(timelockSigner).earmarkFunds(purpose, budget, rewardToken.getAddress());
            await jurisdiction.connect(timelockSigner).startNewPassiveIncomeEpoch(budget, rewardToken.getAddress());
            const totalSupplyBefore = await jurisdiction.totalSupply();
            const member1BalanceBefore = await jurisdiction.balanceOf(member1.address);
            const expectedReward = (member1BalanceBefore * budget) / totalSupplyBefore;
            await expect(jurisdiction.connect(member1).claimPassiveIncome(epochId))
                .to.emit(rewardToken, "Transfer").withArgs(registry.getAddress(), member1.address, expectedReward);
        });
    });

    describe("Incentivized Representation (Delegation Rewards)", function () {
        it("Should allow a delegate to claim rewards based on delegated votes", async function () {
            const { jurisdiction, registry, timelock, rewardToken, owner, member1, member2 } = await loadFixture(deploySingleDAOStack);

            await jurisdiction.connect(member1).delegate(member1.address);
            await jurisdiction.connect(member2).delegate(member1.address);
            
            await time.increase(10); 

            const budget = ethers.parseEther("1000");
            const epochId = 1;

            await rewardToken.mint(registry.getAddress(), budget);
            // CORRECTED: Typo is fixed here.
            const purpose = ethers.solidityPackedKeccak256(["string", "uint256", "address"], ["DELEGATE_REWARD", epochId, await rewardToken.getAddress()]);
            
            const timelockSigner = await ethers.getImpersonatedSigner(await timelock.getAddress());
            await owner.sendTransaction({ to: timelockSigner.address, value: ethers.parseEther("1.0") });
            await registry.connect(timelockSigner).earmarkFunds(purpose, budget, rewardToken.getAddress());

            await jurisdiction.connect(timelockSigner).startNewDelegateRewardEpoch(budget, rewardToken.getAddress());

            const totalSupply = await jurisdiction.totalSupply();
            const delegatedVotes = await jurisdiction.balanceOf(member2.address);
            const expectedReward = (delegatedVotes * budget) / totalSupply;

            await expect(jurisdiction.connect(member1).claimRepresentationReward(epochId))
                .to.emit(rewardToken, "Transfer").withArgs(registry.getAddress(), member1.address, expectedReward);
        });
    });

    describe("DAO Inheritance (Parent-Child Reputation Accrual)", function () {
        async function deployParentChildFixture() {
            const parent = await deploySingleDAOStack();
            const child = await deploySingleDAOStack();
            const childRegistryKey = `child.registry.${(await child.registry.getAddress()).toLowerCase()}`;
            await parent.registry.connect(parent.owner).editRegistry(childRegistryKey, "1");
            const parentRegistryAddress = await parent.registry.getAddress();
            const parentRegistryAsDecimal = BigInt(parentRegistryAddress).toString();
            await child.registry.connect(child.owner).editRegistry("parent.registry", parentRegistryAsDecimal);
            return { ...parent, child };
        }
        it("Should accrue reputation in the parent DAO when the child calls accrueAndForwardReputation", async function() {
            const { jurisdiction: parentJurisdiction, registry: parentRegistry, child, owner } = await loadFixture(deployParentChildFixture);
            const { jurisdiction: childJurisdiction, registry: childRegistry, timelock: childTimelock, member1: childMember1 } = child;
            const MockERC20 = await ethers.getContractFactory("MockERC20");
            const paymentToken = await MockERC20.deploy("Payment Token", "PAY");
            const paymentAmount = ethers.parseEther("10");
            const childTimelockSigner = await ethers.getImpersonatedSigner(await childTimelock.getAddress());
            await owner.sendTransaction({ to: childTimelockSigner.address, value: ethers.parseEther("1.0") });
            const paymentTokenAddress = await paymentToken.getAddress();
            const parityKey = `jurisdiction.parity.${paymentTokenAddress.toLowerCase()}`;
            await childRegistry.connect(owner).editRegistry(parityKey, "1");
            await parentRegistry.connect(owner).editRegistry(parityKey, "1");
            await childJurisdiction.connect(childTimelockSigner).accrueAndForwardReputation(
                [childMember1.address], [paymentAmount], paymentTokenAddress
            );
            expect(await childJurisdiction.reputationOwed(childMember1.address)).to.equal(paymentAmount);
            expect(await parentJurisdiction.reputationOwed(childMember1.address)).to.equal(paymentAmount);
        });
    });
});
// test/Jurisdiction.functionality.test.js