require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version:"0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200, // Same as the value used in Remix
      },
  }},
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545",  
      chainId: 1337,                // Your Ganache Chain ID
      accounts: {                   // (Optional) Add Ganache account private keys if needed
        mnemonic: "fruit insect love learn tower opera divide link intact always garment foam", 
      }
    }
  }
};
