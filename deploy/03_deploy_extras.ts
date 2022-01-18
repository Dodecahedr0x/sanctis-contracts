import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ironExtractorConfig } from "./helpers";
import { BigNumber } from "ethers";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments } = hre;
  const { deploy, get } = deployments;
  const accounts = await hre.getUnnamedAccounts();

  console.log("Deploying to", hre.network.name, "from", accounts[0]);

  const deployedCitadel = await get("Sanctis");
  const sanctis = await hre.ethers.getContractAt(
    "Sanctis",
    deployedCitadel.address
  );

  const deployedHumans = await deploy("Humans", {
    from: accounts[0],
    args: [deployedCitadel.address],
    log: true,
  });
  const deployedIron = await deploy("Iron", {
    from: accounts[0],
    args: [deployedCitadel.address],
    log: true,
  });
  const deployedExtractors = await deploy("Extractors", {
    from: accounts[0],
    args: [
      deployedCitadel.address,
      1,
      ironExtractorConfig.rewards,
      ironExtractorConfig.level,
      ironExtractorConfig.delay,
      ironExtractorConfig.costs,
    ],
    log: true,
  });

  await sanctis.add(BigNumber.from(0), deployedHumans.address);
  await sanctis.add(BigNumber.from(1), deployedIron.address);
  await sanctis.add(BigNumber.from(2), deployedExtractors.address);
};
export default deploy;
deploy.tags = ["Extras"];
