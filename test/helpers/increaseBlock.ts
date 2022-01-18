import { ethers } from 'hardhat';

export default async (blocks: number) => {
    ethers.provider.getBlockNumber()
    for(let i=0; i<blocks; i++) 
        await ethers.provider.send('evm_mine', []);
}