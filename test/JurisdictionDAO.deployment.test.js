const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Jurisdiction DAO Deployment", function () {
    // We define a fixture to reuse the same setup in every test.
    // This fixture deploys the entire DAO stack using the new factories.
    async function deployJurisdictionDAOFixture() {
        const [owner, member1, member2] = await ethers.getSigners();

        // 1. Deploy Factories
        const DAOFactory = await ethers.getContractFactory("DAOFactory");
        const daoFactory = await DAOFactory.deploy();
        const InfrastructureFactory = await ethers.getContractFactory("InfrastructureFactory");
        const infraFactory = await InfrastructureFactory.deploy();
        const JurisdictionFactory = await ethers.getContractFactory("JurisdictionFactory");
        const jurisdictionFactory = await JurisdictionFactory.deploy();

        // 2. Define DAO & Token Parameters
        const daoName = "Test DAO";
        const tokenName = "Test Jurisdiction Token";
        const tokenSymbol = "TJT";
        const initialMembers = [member1.address, member2.address];
        const initialAmounts = [ethers.parseEther("100"), ethers.parseEther("50")];
        const executionDelay = 0; // 0 seconds for easy testing

        // DAO Settings Array: [votingDelay, votingPeriod, proposalThreshold, quorumFraction]
        // Using block numbers for delay/period for simplicity in Hardhat tests.
        const daoSettings = [
            1, // 1 block voting delay
            100, // 100 blocks voting period
            ethers.parseEther("1"), // 1 TJT required to create a proposal
            4, // 4% quorum
        ];

        // 3. Deploy Core Components using Factories
        // The deployer (`owner`) is the initial admin of the Timelock for setup.
        const timelockAddress = await infraFactory.deployTimelock.staticCall(owner.address, executionDelay);
        await infraFactory.deployTimelock(owner.address, executionDelay);
        const timelock = await ethers.getContractAt("TimelockController", timelockAddress);

        // The Registry's owner is the Timelock, but the deployer (`owner`) is set as the `wrapper` to finalize setup.
        const registryAddress = await infraFactory.deployRegistry.staticCall(timelock.getAddress(), owner.address);
        await infraFactory.deployRegistry(timelock.getAddress(), owner.address);
        const registry = await ethers.getContractAt("Registry", registryAddress);

        // Deploy the Jurisdiction token, linking it to the Registry and Timelock.
        const jurisdictionAddress = await jurisdictionFactory.deployJurisdictionToken.staticCall(
            tokenName, tokenSymbol, registry.getAddress(), timelock.getAddress(), initialMembers, initialAmounts
        );
        await jurisdictionFactory.deployJurisdictionToken(
            tokenName, tokenSymbol, registry.getAddress(), timelock.getAddress(), initialMembers, initialAmounts
        );
        const jurisdiction = await ethers.getContractAt("Jurisdiction", jurisdictionAddress);

        // Deploy the DAO, linking it to the token and Timelock.
        const daoAddress = await daoFactory.deployDAO.staticCall(
            jurisdiction.getAddress(), timelock.getAddress(), daoName, daoSettings
        );
        await daoFactory.deployDAO(
            jurisdiction.getAddress(), timelock.getAddress(), daoName, daoSettings
        );
        const dao = await ethers.getContractAt("HomebaseDAO", daoAddress);

        // 4. Final Configuration & Role Transfer
        // Define roles using the robust ethers.id() method
        const PROPOSER_ROLE = ethers.id("PROPOSER_ROLE");
        const EXECUTOR_ROLE = ethers.id("EXECUTOR_ROLE");
        const TIMELOCK_ADMIN_ROLE = ethers.id("TIMELOCK_ADMIN_ROLE");

        // Grant the DAO contract the PROPOSER_ROLE on the Timelock.
        await timelock.grantRole(PROPOSER_ROLE, dao.getAddress());
        
        // Grant a public role for executing proposals for simplicity.
        await timelock.grantRole(EXECUTOR_ROLE, ethers.ZeroAddress);

        // The deployer (`owner`) renounces its admin role on the Timelock, leaving the Timelock itself as the sole admin, governed by the DAO.
        await timelock.renounceRole(TIMELOCK_ADMIN_ROLE, owner.address);

        // Set the admin of the Jurisdiction token to be the Timelock.
        await jurisdiction.setAdmin(timelock.getAddress());
        
        // The deployer (`owner`) uses its 'wrapper' permission to set the Jurisdiction address in the Registry.
        await registry.setJurisdictionAddress(jurisdiction.getAddress());

        return { dao, jurisdiction, timelock, registry, owner, member1, member2, initialAmounts, daoSettings, PROPOSER_ROLE };
    }

    it("Should deploy all components and set their relationships correctly", async function () {
        const { dao, jurisdiction, timelock, registry, member1, member2, initialAmounts, PROPOSER_ROLE } = await loadFixture(deployJurisdictionDAOFixture);

        // Verify DAO parameters
        expect(await dao.name()).to.equal("Test DAO");
        expect(await dao.token()).to.equal(await jurisdiction.getAddress());
        expect(await dao.timelock()).to.equal(await timelock.getAddress());

        // Verify Jurisdiction Token parameters
        expect(await jurisdiction.name()).to.equal("Test Jurisdiction Token");
        expect(await jurisdiction.balanceOf(member1.address)).to.equal(initialAmounts[0]);
        expect(await jurisdiction.balanceOf(member2.address)).to.equal(initialAmounts[1]);
        expect(await jurisdiction.admin()).to.equal(await timelock.getAddress());
        expect(await jurisdiction.registryAddress()).to.equal(await registry.getAddress());

        // Verify Timelock roles
        expect(await timelock.hasRole(PROPOSER_ROLE, await dao.getAddress())).to.be.true;
        
        // Verify Registry parameters
        expect(await registry.owner()).to.equal(await timelock.getAddress());
        expect(await registry.jurisdictionAddress()).to.equal(await jurisdiction.getAddress());
    });
});
// test/JurisdictionDAO.deployment.test.js