const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Jurisdiction: DAO Inheritance Security", function () {

    async function deploySingleDAOStack() {
        const [owner, member1] = await ethers.getSigners();
        
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
            "Test Token", "TJT", registry.getAddress(), timelock.getAddress(), [member1.address], [ethers.parseEther("100")]
        ));
        await jurisdictionFactory.deployJurisdictionToken("Test Token", "TJT", registry.getAddress(), timelock.getAddress(), [member1.address], [ethers.parseEther("100")]);

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
        const paymentToken = await MockERC20.deploy("Payment Token", "PAY");

        return { dao, jurisdiction, timelock, registry, paymentToken, owner, member1 };
    }

    async function deployAndLinkDAOsFixture() {
        const parent = await deploySingleDAOStack();
        const child = await deploySingleDAOStack();

        const childRegistryKey = `child.registry.${(await child.registry.getAddress()).toLowerCase()}`;
        await parent.registry.connect(parent.owner).editRegistry(childRegistryKey, "1");

        const parentRegistryAddress = await parent.registry.getAddress();
        const parentRegistryAsDecimal = BigInt(parentRegistryAddress).toString();
        await child.registry.connect(child.owner).editRegistry("parent.registry", parentRegistryAsDecimal);

        return { parent, child };
    }

    it("Should REJECT reputation accrual from an unrecognized (unlinked) child DAO", async function () {
        const { jurisdiction: parentJurisdiction, member1 } = await loadFixture(deploySingleDAOStack);
        const paymentAmount = ethers.parseEther("10");

        // Deploy the dedicated attacker contract
        const Attacker = await ethers.getContractFactory("Attacker");
        const attacker = await Attacker.deploy();

        // The attacker contract does not implement `registryAddress()`, so the callback will fail.
        // This correctly simulates an unrecognized contract trying to interact.
        await expect(
            attacker.attack(
                await parentJurisdiction.getAddress(),
                [member1.address],
                [paymentAmount],
                ethers.ZeroAddress
            )
        ).to.be.reverted; // Reverts with a low-level error as expected.
    });

    it("Should ALLOW claiming owed reputation even after the child DAO is unlinked", async function() {
        const { parent, child } = await loadFixture(deployAndLinkDAOsFixture);
        const { jurisdiction: parentJurisdiction, registry: parentRegistry, owner: parentOwner, member1: parentMember } = parent;
        const { jurisdiction: childJurisdiction, timelock: childTimelock, paymentToken, owner: childOwner } = child;
        
        const paymentAmount = ethers.parseEther("10");
        const childTimelockSigner = await ethers.getImpersonatedSigner(await childTimelock.getAddress());
        await parentOwner.sendTransaction({ to: childTimelockSigner.address, value: ethers.parseEther("1.0") });

        const parityKey = `jurisdiction.parity.${(await paymentToken.getAddress()).toLowerCase()}`;
        await parent.registry.connect(parentOwner).editRegistry(parityKey, "1");
        await child.registry.connect(childOwner).editRegistry(parityKey, "1");

        await childJurisdiction.connect(childTimelockSigner).accrueAndForwardReputation(
            [parentMember.address], [paymentAmount], await paymentToken.getAddress()
        );
        expect(await parentJurisdiction.reputationOwed(parentMember.address)).to.equal(paymentAmount);

        const initialParentBalance = await parentJurisdiction.balanceOf(parentMember.address);

        const childRegistryKey = `child.registry.${(await child.registry.getAddress()).toLowerCase()}`;
        await parentRegistry.connect(parentOwner).editRegistry(childRegistryKey, "");

        await parentJurisdiction.connect(parentMember).claimOwedReputation();

        expect(await parentJurisdiction.balanceOf(parentMember.address)).to.equal(initialParentBalance + paymentAmount);
    });

    it("Should NOT accrue parent reputation if the parent has not set a parity for the payment token", async function() {
        const { parent, child } = await loadFixture(deployAndLinkDAOsFixture);
        const { jurisdiction: parentJurisdiction, owner: parentOwner } = parent;
        const { jurisdiction: childJurisdiction, registry: childRegistry, timelock: childTimelock, paymentToken, member1: childMember, owner: childOwner } = child;
        
        const paymentAmount = ethers.parseEther("10");
        const childTimelockSigner = await ethers.getImpersonatedSigner(await childTimelock.getAddress());
        await parentOwner.sendTransaction({ to: childTimelockSigner.address, value: ethers.parseEther("1.0") });

        const parityKey = `jurisdiction.parity.${(await paymentToken.getAddress()).toLowerCase()}`;
        await childRegistry.connect(childOwner).editRegistry(parityKey, "1");

        await expect(
            childJurisdiction.connect(childTimelockSigner).accrueAndForwardReputation(
                [childMember.address], [paymentAmount], await paymentToken.getAddress()
            )
        ).to.not.be.reverted;

        expect(await childJurisdiction.reputationOwed(childMember.address)).to.equal(paymentAmount);
        expect(await parentJurisdiction.reputationOwed(childMember.address)).to.equal(0);
    });
});
// test/Jurisdiction.inheritance.test.js