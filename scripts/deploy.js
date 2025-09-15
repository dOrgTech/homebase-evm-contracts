const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const tokenABI = require("../artifacts/contracts/Token.sol/HBEVM_token.json").abi;
const hre = require("hardhat");
const { saveAddresses, loadAddresses } = require("../utils/deployments");

async function writeDeploymentAddresses({ tokenAddress, timeLockAddress, daoAddress }) {
  const networkName = hre.network.name;
  const current = loadAddresses(networkName);
  const next = {
    ...current,
    TOKEN_ADDRESS: tokenAddress,
    TIMELOCK_ADDRESS: timeLockAddress,
    DAO_ADDRESS: daoAddress,
  };
  const file = saveAddresses(networkName, next);
  console.log(`Saved deployment addresses to ${file}`);
}

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
  const deployedToken = new ethers.Contract(token.target, tokenABI, deployer);
  const setDelegateTx = await deployedToken.delegate(deployer.address);
  await setDelegateTx.wait();
  console.log("Delegate set successfully.");
  
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

  // Persist deployed addresses per network (no secrets)
  await writeDeploymentAddresses({
    tokenAddress: token.target,
    timeLockAddress: timeLock.target,
    daoAddress: dao.target,
  });

  console.log("Deployment complete and addresses saved.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in deployment:", error);
    process.exit(1);
  });
