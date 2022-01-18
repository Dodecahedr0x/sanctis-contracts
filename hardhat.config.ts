import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "hardhat-deploy";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";

dotenv.config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://rpc.fantom.network/",
        blockNumber: 19650000,
      },
    },
    mainnet: {
      url: "https://rpc.fantom.network/",
      gas: 8000000,
      gasPrice: 50000000000,
      accounts: [`0x${process.env.MNEMONIC}`],
    },
    testnet: {
      url: "https://rpc.testnet.fantom.network/",
      accounts: [`0x${process.env.MNEMONIC}`],
    },
  },
};

export default config;
