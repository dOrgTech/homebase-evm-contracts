const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const tokenABI = require("../artifacts/contracts/Token.sol/HBEVM_token.json").abi;
// Path to the config.js file
const configPath = path.join(__dirname, "../config.js");

async function updateConfigFile(newData) {
  // Safely require the config.js file
  let config;
  try {
    config = require(configPath);
  } catch (err) {
    // If config.js doesn't exist or has issues, start with an empty object
    config = {};
  }

  // Update or add the contract addresses in the config object
  config.TOKEN_ADDRESS = newData.tokenAddress || config.TOKEN_ADDRESS;
  config.TIMELOCK_ADDRESS = newData.timeLockAddress || config.TIMELOCK_ADDRESS;
  config.DAO_ADDRESS = newData.daoAddress || config.DAO_ADDRESS;

  // Generate the new content for config.js by preserving existing keys
  const newConfigContent = `
    module.exports = {
      AUTHOR: '0xc5C77EC5A79340f0240D6eE8224099F664A08EEb',
      CONTRACTOR: '0xA6A40E0b6DB5a6f808703DBe91DbE50B7FC1fa3E',
      ARBITER: '0x6EF597F8155BC561421800de48852c46e73d9D19',
      BLOKE: '0x548f66A1063A79E4F291Ebeb721C718DCc7965c5',
      EIGHT_RICE:'0xa9F8F9C0bf3188cEDdb9684ae28655187552bAE9',
      INFURA_API_KEY: \`${config.INFURA_API_KEY}\`,
      SEPOLIA_PRIVATE_KEY: \`${config.SEPOLIA_PRIVATE_KEY}\`,
      TOKEN_ADDRESS: \`${config.TOKEN_ADDRESS}\`,
      TIMELOCK_ADDRESS: \`${config.TIMELOCK_ADDRESS}\`,
      DAO_ADDRESS: \`${config.DAO_ADDRESS}\`
    };
  `;

  // Write the updated content back to config.js
  fs.writeFileSync(configPath, newConfigContent.trim());
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

  // Update the config.js file with the new contract addresses
  await updateConfigFile({
    tokenAddress: token.target,
    timeLockAddress: timeLock.target,
    daoAddress: dao.target,
  });

  console.log("Deployment complete and config.js updated.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in deployment:", error);
    process.exit(1);
  });