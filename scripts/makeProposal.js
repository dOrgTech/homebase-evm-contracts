// scripts/makeProposal.js

const { ethers } = require("hardhat");

async function main() {
  // Get the proposer account
  const [proposer] = await ethers.getSigners();

  console.log("Making proposal with account:", proposer.address);

  // Addresses of deployed contracts (replace with your actual addresses)
  const governorAddress = "0x047fC471f107B52286BE2556de95a7D779A1B744";
  const timelockAddress = "0xDc3736A265b04c4EE63789B964f25D38F1A0368d";

  // Designated recipient address (replace with the desired recipient)
  const recipient = "0x8ff40431599b9472c748b5011DEDB8cd5403bAfA";

  // Get contract instances
  const governor = await ethers.getContractAt("HomebaseDAO", governorAddress);
  const timelock = await ethers.getContractAt("TimelockController", timelockAddress);

  // Ensure the TimelockController has enough ETH to transfer
  const amountToSend = ethers.parseEther("1"); // 1 ETH

  console.log("Sending 1 ETH to TimelockController...");

  const fundTx = await proposer.sendTransaction({
    to: timelockAddress,
    value: amountToSend,
  });
  await fundTx.wait();

  console.log("1 ETH sent to TimelockController.");

  // Proposal details
  const targets = [recipient];
  const values = [amountToSend];
  const calldatas = ["0x"]; // Empty calldata since we're just transferring ETH
  const description = "Proposal to transfer 1 ETH to the designated recipient.";

  console.log("Creating proposal...");

  const proposeTx = await governor.propose(targets, values, calldatas, description);
  const proposeReceipt = await proposeTx.wait();

  // Extract the proposal ID from the event logs
  const proposalId = proposeReceipt.events.find((event) => event.event === "ProposalCreated").args.proposalId;

  console.log("Proposal created with ID:", proposalId.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error making proposal:", error);
    process.exit(1);
  });
