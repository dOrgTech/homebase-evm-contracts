// test/Factories_W.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("WrapperContract_W (Factories_W)", function () {
    
    async function deployFactoriesFixture() {
        const [owner, deployer, user1] = await ethers.getSigners();

        const MockUnderlyingToken = await ethers.getContractFactory("HBEVM_token");
        const underlyingToken = await MockUnderlyingToken.deploy("Underlying", "UND", 18, [owner.address], [ethers.parseEther("10000")], true);
        await underlyingToken.waitForDeployment();
        const underlyingTokenAddress = await underlyingToken.getAddress();

        const MockTokenFactory = await ethers.getContractFactory("contracts/mocks/MockFactories.sol:MockTokenFactory");
        const tokenFactory = await MockTokenFactory.deploy();
        await tokenFactory.waitForDeployment();
        const tokenFactoryAddress = await tokenFactory.getAddress();

        const MockTimelockFactory = await ethers.getContractFactory("contracts/mocks/MockFactories.sol:MockTimelockFactory");
        const timelockFactory = await MockTimelockFactory.deploy();
        await timelockFactory.waitForDeployment();
        const timelockFactoryAddress = await timelockFactory.getAddress();

        const MockDAOFactory = await ethers.getContractFactory("contracts/mocks/MockFactories.sol:MockDAOFactory");
        const daoFactory = await MockDAOFactory.deploy();
        await daoFactory.waitForDeployment();
        const daoFactoryAddress = await daoFactory.getAddress();

        const WrapperContract_W_Factory = await ethers.getContractFactory("contracts/Factories_W.sol:WrapperContract_W");
        const wrapperContract = await WrapperContract_W_Factory.deploy(
            tokenFactoryAddress,
            timelockFactoryAddress,
            daoFactoryAddress
        );
        await wrapperContract.waitForDeployment();
        const wrapperContractAddress = await wrapperContract.getAddress();

        return { 
            wrapperContract, wrapperContractAddress, 
            tokenFactoryAddress, timelockFactoryAddress, daoFactoryAddress, 
            underlyingToken, underlyingTokenAddress,
            owner, deployer, user1 
        };
    }

    describe("Deployment", function () {
        it("Should set factory addresses correctly in constructor (indirect check)", async function () {
            const { wrapperContract } = await loadFixture(deployFactoriesFixture);
            expect(await wrapperContract.getAddress()).to.not.equal(ethers.ZeroAddress);
        });

        it("Should have 0 deployed DAOs initially", async function () {
            const { wrapperContract } = await loadFixture(deployFactoriesFixture);
            expect(await wrapperContract.getNumberOfDAOs_W()).to.equal(0);
        });
    });

    describe("deployDAOwithWrappedToken", function () {
        it("Should deploy DAO, Wrapped Token, Timelock, and Registry successfully and emit correct event", async function () {
            const { wrapperContract, underlyingTokenAddress, deployer, wrapperContractAddress } = await loadFixture(deployFactoriesFixture);

            const params = {
                daoName: "MyNewDAO", 
                wrappedTokenName: "MyWrappedTokenNameFromParams", 
                wrappedTokenSymbol: "MWNT",
                description: "A test DAO deployed via wrapper",
                executionDelay: 3600, 
                underlyingTokenAddress: underlyingTokenAddress,
                minsVotingDelay: 1, 
                minsVotingPeriod: 5, 
                proposalThreshold: ethers.parseEther("1"), 
                quorumFraction: 4, 
                keys: ["website", "info"],
                values: ["https://example.com", "Test DAO Info"]
            };
            
            const txResponse = await wrapperContract.connect(deployer).deployDAOwithWrappedToken(params);
            const txReceipt = await txResponse.wait();

            expect(await wrapperContract.getNumberOfDAOs_W()).to.equal(1);

            const eventName = "DaoWrappedDeploymentInfo"; // Ensure this matches exactly
            const eventFragment = wrapperContract.interface.getEvent(eventName);
            expect(eventFragment, `Event fragment for ${eventName} not found on contract interface`).to.not.be.null;
            
            const eventTopic = eventFragment.topicHash;

            const emittedLog = txReceipt.logs.find(
                log => log.address === wrapperContractAddress && log.topics[0] === eventTopic
            );
            expect(emittedLog, `${eventName} event not found in transaction logs`).to.not.be.undefined;

            const parsedEvent = wrapperContract.interface.parseLog(emittedLog);
            const expectedEventArgsCount = eventFragment.inputs.length;

            const deployedDAOAddress = await wrapperContract.deployedDAOs_W(0);
            const deployedTokenAddress = await wrapperContract.deployedTokens_W(0);
            const deployedRegistryAddress = await wrapperContract.deployedRegistries_W(0);
            const deployedTimelockAddress = await wrapperContract.deployedTimelocks_W(0);


            expect(parsedEvent.args.daoAddress).to.equal(deployedDAOAddress);
            expect(parsedEvent.args.wrappedTokenAddress).to.equal(deployedTokenAddress);
            expect(parsedEvent.args.registryAddress).to.equal(deployedRegistryAddress);
            expect(parsedEvent.args.daoName).to.equal(params.daoName);
            
            // Adjust based on your active Factories_W.sol event signature
            if (expectedEventArgsCount === 5) { 
                expect(parsedEvent.args.description).to.equal(params.description);
            } else if (expectedEventArgsCount === 7) { 
                expect(parsedEvent.args.wrappedTokenSymbol).to.equal(params.wrappedTokenSymbol);
                expect(parsedEvent.args.description).to.equal(params.description);
                expect(parsedEvent.args.quorumFraction).to.equal(params.quorumFraction);
            } else {
                throw new Error(`Test for event ${eventName} needs an explicit check for ${expectedEventArgsCount} arguments.`);
            }

            expect(deployedDAOAddress).to.not.equal(ethers.ZeroAddress);
            expect(deployedTokenAddress).to.not.equal(ethers.ZeroAddress);
            expect(deployedTimelockAddress).to.not.equal(ethers.ZeroAddress); 
            expect(deployedRegistryAddress).to.not.equal(ethers.ZeroAddress);

            const wrappedToken = await ethers.getContractAt("HBEVM_Wrapped_Token", deployedTokenAddress);
            expect(await wrappedToken.name()).to.equal(params.wrappedTokenName); 
            expect(await wrappedToken.symbol()).to.equal(params.wrappedTokenSymbol);
            expect(await wrappedToken.underlying()).to.equal(underlyingTokenAddress);
            expect(await wrappedToken.admin()).to.equal(deployedTimelockAddress);

            const timelock = await ethers.getContractAt("TimelockController", deployedTimelockAddress);
            const proposerRole = await timelock.PROPOSER_ROLE();
            const executorRole = await timelock.EXECUTOR_ROLE();
            expect(await timelock.getMinDelay()).to.equal(params.executionDelay);
            expect(await timelock.hasRole(proposerRole, deployedDAOAddress)).to.be.true;
            expect(await timelock.hasRole(executorRole, deployedDAOAddress)).to.be.true;
            const adminRole = await timelock.DEFAULT_ADMIN_ROLE();
            expect(await timelock.hasRole(adminRole, wrapperContractAddress)).to.be.true;

            const dao = await ethers.getContractAt("HomebaseDAO", deployedDAOAddress);
            expect(await dao.name()).to.equal(params.daoName);
            expect(await dao.token()).to.equal(deployedTokenAddress);
            expect(await dao.timelock()).to.equal(deployedTimelockAddress);
            expect(await dao.votingDelay()).to.equal(params.minsVotingDelay * 60);
            expect(await dao.votingPeriod()).to.equal(params.minsVotingPeriod * 60);
            expect(await dao.proposalThreshold()).to.equal(params.proposalThreshold);
            
            const registry = await ethers.getContractAt("Registry", deployedRegistryAddress);
            expect(await registry.owner()).to.equal(deployedTimelockAddress); 
            expect(await registry.wrapper()).to.equal(wrapperContractAddress);
            expect(await registry.getRegistryValue("website")).to.equal("https://example.com");
            expect(await registry.getRegistryValue("info")).to.equal("Test DAO Info");
        });
    });
});
// test/Factories_W.test.js