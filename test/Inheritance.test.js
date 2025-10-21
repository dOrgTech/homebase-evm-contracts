const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DAO Inheritance (Fractal Architecture)", function () {
    // ... (setup code remains the same) ...
    let parentJurisdiction, parentRegistry, parentTimelockSigner;
    let childJurisdiction, childRegistry, childTimelockSigner;
    let paymentToken, member1, member2, deployer;

    async function setupTimelockSigner(timelockAddress, adminSigner) {
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [timelockAddress],
        });
        const signer = await ethers.getSigner(timelockAddress);
        await adminSigner.sendTransaction({ to: timelockAddress, value: ethers.parseEther("1.0") });
        return signer;
    }

    beforeEach(async function () {
        [deployer, member1, member2] = await ethers.getSigners();
        const MockERC20Factory = await ethers.getContractFactory("MockERC20");
        paymentToken = await MockERC20Factory.deploy("Payment Token", "PAY");
        const TimelockFactory = await ethers.getContractFactory("@openzeppelin/contracts/governance/TimelockController.sol:TimelockController");
        const parentTimelock = await TimelockFactory.deploy(0, [], [], deployer.address);
        const parentTimelockAddress = await parentTimelock.getAddress();
        const RegistryFactory = await ethers.getContractFactory("Registry");
        parentRegistry = await RegistryFactory.deploy(parentTimelockAddress, deployer.address);
        const parentRegistryAddress = await parentRegistry.getAddress();
        const JurisdictionFactory = await ethers.getContractFactory("Jurisdiction");
        parentJurisdiction = await JurisdictionFactory.deploy("Parent DAO", "PARENT", parentRegistryAddress, parentTimelockAddress, [], []);
        const parentJurisdictionAddress = await parentJurisdiction.getAddress();
        parentTimelockSigner = await setupTimelockSigner(parentTimelockAddress, deployer);
        await parentRegistry.connect(parentTimelockSigner).setJurisdictionAddress(parentJurisdictionAddress);
        const childTimelock = await TimelockFactory.deploy(0, [], [], deployer.address);
        const childTimelockAddress = await childTimelock.getAddress();
        childRegistry = await RegistryFactory.deploy(childTimelockAddress, deployer.address);
        const childRegistryAddress = await childRegistry.getAddress();
        childJurisdiction = await JurisdictionFactory.deploy("Child DAO", "CHILD", childRegistryAddress, childTimelockAddress, [member1.address, member2.address], [ethers.parseEther("100"), ethers.parseEther("100")]);
        const childJurisdictionAddress = await childJurisdiction.getAddress();
        childTimelockSigner = await setupTimelockSigner(childTimelockAddress, deployer);
        await childRegistry.connect(childTimelockSigner).setJurisdictionAddress(childJurisdictionAddress);
    });


    describe("Reputation Accrual Scenarios", function () {

        it("Should only accrue reputation in the child if the DAOs are unlinked", async function () {
            const paymentAmount = ethers.parseEther("10");
            const childParity = "1";
            const paymentTokenAddress = await paymentToken.getAddress();
            
            const parityKey = `jurisdiction.parity.${paymentTokenAddress.toLowerCase()}`;
            await childRegistry.connect(childTimelockSigner).editRegistry(parityKey, childParity);

            await childJurisdiction.connect(childTimelockSigner).accrueAndForwardReputation([member1.address], [paymentAmount], paymentTokenAddress);

            const expectedChildRep = paymentAmount * BigInt(childParity);
            expect(await childJurisdiction.reputationOwed(member1.address)).to.equal(expectedChildRep);
            expect(await parentJurisdiction.reputationOwed(member1.address)).to.equal(0);
        });

        it("Should fail to accrue in parent if only the child recognizes the parent", async function () {
            const paymentAmount = ethers.parseEther("20");
            const childParity = "1";
            const paymentTokenAddress = await paymentToken.getAddress();
            const parentRegistryAddress = await parentRegistry.getAddress();

            const parityKey = `jurisdiction.parity.${paymentTokenAddress.toLowerCase()}`;
            await childRegistry.connect(childTimelockSigner).editRegistry(parityKey, childParity);
            
            // --- THE FIX: Store the address as a decimal string ---
            const parentAddrAsDecimalString = BigInt(parentRegistryAddress).toString();
            await childRegistry.connect(childTimelockSigner).editRegistry("parent.registry", parentAddrAsDecimalString);

            await childJurisdiction.connect(childTimelockSigner).accrueAndForwardReputation([member1.address], [paymentAmount], paymentTokenAddress);

            const expectedChildRep = paymentAmount * BigInt(childParity);
            expect(await childJurisdiction.reputationOwed(member1.address)).to.equal(expectedChildRep);
            expect(await parentJurisdiction.reputationOwed(member1.address)).to.equal(0);
        });

        it("Should accrue reputation in BOTH DAOs when the link is fully established", async function () {
            const paymentAmount = ethers.parseEther("50");
            const childParity = "2";
            const parentParity = "1";
            const paymentTokenAddress = await paymentToken.getAddress();
            const parentRegistryAddress = await parentRegistry.getAddress();
            const childRegistryAddress = await childRegistry.getAddress();

            const childRecognitionKey = `child.registry.${childRegistryAddress.toLowerCase()}`;
            const parityKey = `jurisdiction.parity.${paymentTokenAddress.toLowerCase()}`;

            // --- THE FIX: Store the address as a decimal string ---
            const parentAddrAsDecimalString = BigInt(parentRegistryAddress).toString();
            await childRegistry.connect(childTimelockSigner).editRegistry("parent.registry", parentAddrAsDecimalString);
            
            await parentRegistry.connect(parentTimelockSigner).editRegistry(childRecognitionKey, "true");
            await childRegistry.connect(childTimelockSigner).editRegistry(parityKey, childParity);
            await parentRegistry.connect(parentTimelockSigner).editRegistry(parityKey, parentParity);

            await childJurisdiction.connect(childTimelockSigner).accrueAndForwardReputation([member2.address], [paymentAmount], paymentTokenAddress);

            const expectedChildRep = paymentAmount * BigInt(childParity);
            expect(await childJurisdiction.reputationOwed(member2.address)).to.equal(expectedChildRep);

            const expectedParentRep = paymentAmount * BigInt(parentParity);
            expect(await parentJurisdiction.reputationOwed(member2.address)).to.equal(expectedParentRep);

            await childJurisdiction.connect(member2).claimOwedReputation();
            await parentJurisdiction.connect(member2).claimOwedReputation();
            expect(await childJurisdiction.balanceOf(member2.address)).to.equal(ethers.parseEther("100") + expectedChildRep);
            expect(await parentJurisdiction.balanceOf(member2.address)).to.equal(expectedParentRep);
        });

        it("Should stop forwarding reputation after the parent severs the link", async function() {
            const paymentAmount = ethers.parseEther("10");
            const paymentTokenAddress = await paymentToken.getAddress();
            const parentRegistryAddress = await parentRegistry.getAddress();
            const childRegistryAddress = await childRegistry.getAddress();
            
            const childRecognitionKey = `child.registry.${childRegistryAddress.toLowerCase()}`;
            const parityKey = `jurisdiction.parity.${paymentTokenAddress.toLowerCase()}`;

            // --- THE FIX: Store the address as a decimal string ---
            const parentAddrAsDecimalString = BigInt(parentRegistryAddress).toString();
            await childRegistry.connect(childTimelockSigner).editRegistry("parent.registry", parentAddrAsDecimalString);

            await parentRegistry.connect(parentTimelockSigner).editRegistry(childRecognitionKey, "true");
            await childRegistry.connect(childTimelockSigner).editRegistry(parityKey, "1");
            await parentRegistry.connect(parentTimelockSigner).editRegistry(parityKey, "1");
            
            await childJurisdiction.connect(childTimelockSigner).accrueAndForwardReputation([member1.address], [paymentAmount], paymentTokenAddress);
            
            expect(await childJurisdiction.reputationOwed(member1.address)).to.equal(paymentAmount);
            expect(await parentJurisdiction.reputationOwed(member1.address)).to.equal(paymentAmount);

            await parentRegistry.connect(parentTimelockSigner).editRegistry(childRecognitionKey, "");

            await childJurisdiction.connect(childTimelockSigner).accrueAndForwardReputation([member1.address], [paymentAmount], paymentTokenAddress);

            expect(await childJurisdiction.reputationOwed(member1.address)).to.equal(paymentAmount * 2n); 
            expect(await parentJurisdiction.reputationOwed(member1.address)).to.equal(paymentAmount);
        });
    });
});