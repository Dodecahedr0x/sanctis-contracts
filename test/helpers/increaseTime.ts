import { ethers } from 'hardhat';

export default async (seconds: number) => {
    ethers.provider.getBlockNumber()
    await ethers.provider.send('evm_increaseTime', [seconds]); 
    await ethers.provider.send('evm_mine', []);
}