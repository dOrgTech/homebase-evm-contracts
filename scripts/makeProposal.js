// scripts/makeProposal.js

const { ethers } = require("hardhat");
const governorABI = require("../artifacts/contracts/Dao.sol/HomebaseDAO.json").abi;
// const timelockABI = require("../artifacts/contracts/Dao.sol/HomebaseDAO.json").abi;


async function main() {
  // Get the proposer account
  const [proposer] = await ethers.getSigners();

  console.log("Making proposal with account:", proposer.address);

  const governorAddress = "0x61B52bc383B623DC42C2a244C83b23E1d7eeDfdc";
  const timelockAddress = "0x936F8487648157CBfBeD7070eC0aca23a1BA291E";

  const recipient = "0x8ff40431599b9472c748b5011DEDB8cd5403bAfA";


  const timelockABI = [
    // Add TimelockController ABI here
  ];

  const governor = new ethers.Contract(governorAddress, governorABI, proposer);
  const timelock = new ethers.Contract(timelockAddress, timelockABI, proposer);

  // Ensure the TimelockController has enough ETH to transfer
  const amountToSend = 1; // Corrected this line
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

  // Parse the logs to find the ProposalCreated event
  const proposalCreatedEvent = proposeReceipt.logs
    .map((log) => {
      try {
        return governor.interface.parseLog(log);
      } catch (e) {
        return null;
      }
    })
    .find((event) => event && event.name === "ProposalCreated");

  if (!proposalCreatedEvent) {
    throw new Error("ProposalCreated event not found");
  }

  const proposalId = proposalCreatedEvent.args.proposalId;

  console.log("Proposal created with ID:", proposalId.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error making proposal:", error);
    process.exit(1);
  });
