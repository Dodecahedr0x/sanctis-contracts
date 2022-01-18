import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { colonizationCost, initialCitadelCapacity } from "./helpers";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments } = hre;
  const { deploy, get } = deployments;
  const accounts = await hre.getUnnamedAccounts();

  console.log("Deploying to", hre.network.name, "from", accounts[0]);

  const sanctis = await get("Sanctis");
  const credits = await get("SpaceCredits");

  const deployedCitizens = await deploy("Commanders", {
    from: accounts[0],
    args: [sanctis.address],
    log: true,
  });
  const deployedPlanets = await deploy("Planets", {
    from: accounts[0],
    args: [sanctis.address, credits.address, colonizationCost],
    log: true,
  });
  const deployedStandards = await deploy("GalacticStandards", {
    from: accounts[0],
    args: [sanctis.address],
    log: true,
  });

  await (
    await hre.ethers.getContractAt("Sanctis", sanctis.address)
  ).setWorld(
    deployedCitizens.address,
    deployedPlanets.address,
    deployedStandards.address,
    initialCitadelCapacity
  );
};
export default deploy;
deploy.tags = ["World"];
