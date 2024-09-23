const { ethers } = require("hardhat");
const governorABI = require("../artifacts/contracts/Dao.sol/HomebaseDAO.json").abi;
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../config.js");

async function main() {
  let config;
  try {
    config = require(configPath);
  } catch (err) {
    // If config.js doesn't exist or has issues, start with an empty object
    config = {};
  }

  // Get the proposer account
  const [proposer] = await ethers.getSigners();

  console.log("Making proposal with account:", proposer.address);

  const governorAddress = config.DAO_ADDRESS;
  const timelockAddress = config.TIMELOCK_ADDRESS;
  const recipient = "0x51667815f2E5aA9C269EcA4507E5e6A26943Aa9b";

  const timelockABI = [
    // Add TimelockController ABI here
  ];

  const governor = new ethers.Contract(governorAddress, governorABI, proposer);
  const timelock = new ethers.Contract(timelockAddress, timelockABI, proposer);

  // Function to send native currency to the TimeLockController
  async function fundTimeLockController() {
    const amountToSend = 100; // 1 ETH (or native token)
    console.log(`Sending ${amountToSend.toString()} to TimelockController...`);

    const fundTx = await proposer.sendTransaction({
      to: timelockAddress,
      value: amountToSend,
    });
    await fundTx.wait();

    console.log(`${amountToSend.toString()} sent to TimelockController.`);
  }


  // await fundTimeLockController();

  // Proposal details
  const amountToSend = 0; // 1 ETH (or native token)
  const targets = [recipient];
  const values = [0];
  const calldatas = ["0x"]; // Empty calldata since we're just transferring ETH
  const description = "A proposal to transfer 1 ETH to the designated recipient.";

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
