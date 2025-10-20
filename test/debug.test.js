const { expect } = require("chai");
const { ethers } = require("hardhat");
const { mine } = require("@nomicfoundation/hardhat-network-helpers");

describe("Minimal Debug Test for getPastVotes", function () {
    let jurisdiction, delegate, member1, deployer;

    it("should correctly report past and current votes after self-delegation", async function () {
        [deployer, delegate, member1] = await ethers.getSigners();

        // 1. Deploy the contract
        const JurisdictionFactory = await ethers.getContractFactory("Jurisdiction");
        // Using dummy addresses for registry and timelock as they aren't needed for this test
        const deployerAddress = await deployer.getAddress();
        jurisdiction = await JurisdictionFactory.deploy("Debug", "DBG", deployerAddress, deployerAddress, 
            [delegate.address, member1.address], 
            [ethers.parseEther("50"), ethers.parseEther("100")]
        );
        await jurisdiction.waitForDeployment();
        
        const txBlockNumBefore = await ethers.provider.getBlockNumber();
        console.log(`\nInitial State (Block: ${txBlockNumBefore}):`);
        console.log(`  - Delegate Balance: ${ethers.formatEther(await jurisdiction.balanceOf(delegate.address))}`);
        console.log(`  - Delegate CURRENT Votes (getVotes): ${ethers.formatEther(await jurisdiction.getVotes(delegate.address))}`);

        // 2. Perform delegations in separate transactions to be clear
        console.log("\n--- Performing Delegations ---");
        const tx1 = await jurisdiction.connect(member1).delegate(delegate.address);
        await tx1.wait();
        console.log("  - Member1 delegated to Delegate in block", tx1.blockNumber);

        const tx2 = await jurisdiction.connect(delegate).delegate(delegate.address);
        await tx2.wait();
        console.log("  - Delegate self-delegated in block", tx2.blockNumber);
        
        // Mine an empty block to clearly separate delegation from lookup
        await mine();
        const lookupBlockNum = await ethers.provider.getBlockNumber();
        
        // 3. Check the state AFTER delegations
        console.log(`\nFinal State (Current Block: ${lookupBlockNum}):`);
        const currentBalance = await jurisdiction.balanceOf(delegate.address);
        const currentVotes = await jurisdiction.getVotes(delegate.address);
        console.log(`  - Delegate Balance: ${ethers.formatEther(currentBalance)}`);
        console.log(`  - Delegate CURRENT Votes (getVotes): ${ethers.formatEther(currentVotes)}`);
        
        // 4. Perform the historical lookup for the block right after delegations
        // The last delegation happened in block (lookupBlockNum - 1), which is tx2.blockNumber
        const historicalLookupBlock = tx2.blockNumber;
        console.log(`\n--- Performing Historical Lookup for Block ${historicalLookupBlock} ---`);
        const pastVotes = await jurisdiction.getPastVotes(delegate.address, historicalLookupBlock);
        console.log(`  - Delegate HISTORICAL Votes (getPastVotes): ${ethers.formatEther(pastVotes)}`);

        // 5. Assert the final expectation
        console.log("\n--- Assertion ---");
        const expectedPastVotes = ethers.parseEther("150"); // 100 from member1 + 50 from self
        console.log(`  - Expected Past Votes: ${ethers.formatEther(expectedPastVotes)}`);
        console.log(`  - Actual Past Votes:   ${ethers.formatEther(pastVotes)}`);
        expect(pastVotes).to.equal(expectedPastVotes, "The historical votes should include the self-delegation.");
    });
});
// debug.test.js