// scripts/deploy.js

const { ethers } = require("hardhat");

async function main() {
  // Retrieve the deployer's account
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);

  // Deploy the Token contract with a total supply of 1000 minted to the deployer
  const Token = await ethers.getContractFactory("HBEVM_token");
  const initialSupply = ethers.parseUnits("1000", 18); // Adjust decimals if needed
  const initialMembers = [deployer.address];
  const initialAmounts = [initialSupply];

  console.log("Deploying Token contract...");
  const token = await Token.deploy("MyToken", "MTK", initialMembers, initialAmounts);
  await token.waitForDeployment();
  console.log("Token deployed at:", token.target);

  // Deploy the TimeLockController with the admin as the deployer
  const minDelay = 0; // For testing purposes
  const proposers = [];
  const executors = [];
  const TimeLock = await ethers.getContractFactory("TimelockController");

  console.log("Deploying TimeLockController contract...");
  const timeLock = await TimeLock.deploy(minDelay, proposers, executors, deployer.address);
  await timeLock.waitForDeployment();
  console.log("TimeLockController deployed at:", timeLock.target);

  // Deploy the HomebaseDAO contract
  const HomebaseDAO = await ethers.getContractFactory("HomebaseDAO");

  console.log("Deploying HomebaseDAO contract...");
  const dao = await HomebaseDAO.deploy(token.target, timeLock.target);
  await dao.waitForDeployment();
  console.log("HomebaseDAO deployed at:", dao.target);

  // Grant PROPOSER_ROLE and EXECUTOR_ROLE to the DAO contract
  const PROPOSER_ROLE = await timeLock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timeLock.EXECUTOR_ROLE();

  console.log("Granting PROPOSER_ROLE to HomebaseDAO...");
  const grantProposerTx = await timeLock.grantRole(PROPOSER_ROLE, dao.target);
  await grantProposerTx.wait();
  console.log("PROPOSER_ROLE granted to HomebaseDAO");

  console.log("Granting EXECUTOR_ROLE to HomebaseDAO...");
  const grantExecutorTx = await timeLock.grantRole(EXECUTOR_ROLE, dao.target);
  await grantExecutorTx.wait();
  console.log("EXECUTOR_ROLE granted to HomebaseDAO");

  console.log("Deployment complete.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in deployment:", error);
    process.exit(1);
  });
