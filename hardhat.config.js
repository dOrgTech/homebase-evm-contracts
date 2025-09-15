require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version:"0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200, // Same as the value used in Remix
      },
  }
},
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      chainId: 31337,
    },
    ganache: {
      url: "http://127.0.0.1:7545",  
      chainId: 1337,                // Your Ganache Chain ID
      accounts: {                   // (Optional) Add Ganache account private keys if needed
        mnemonic: "fruit insect love learn tower opera divide link intact always garment foam", 
      }
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      chainId: 11155111,
      accounts: SEPOLIA_PRIVATE_KEY ? [`0x${SEPOLIA_PRIVATE_KEY}`] : [], // Ensure 0x is added here
    },
    et: {
      url: `https://node.ghostnet.etherlink.com`,
      chainId: 128123,
      accounts: SEPOLIA_PRIVATE_KEY ? [`0x${SEPOLIA_PRIVATE_KEY}`] : [], // Ensure 0x is added here
    },
  }
};
