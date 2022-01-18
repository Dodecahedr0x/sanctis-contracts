import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments } = hre;
  const { deploy, get } = deployments;
  const accounts = await hre.getUnnamedAccounts();

  console.log("Deploying to", hre.network.name, "from", accounts[0]);

  const sanctis = await get("Sanctis");

  const deployedRaceRegistry = await deploy("RaceRegistry", {
    from: accounts[0],
    args: [],
    log: true,
  });
  const deployedResourceRegistry = await deploy("ResourceRegistry", {
    from: accounts[0],
    args: [],
    log: true,
  });
  const deployedInfrastructureRegistry = await deploy(
    "InfrastructureRegistry",
    {
      from: accounts[0],
      args: [],
      log: true,
    }
  );

  await (
    await hre.ethers.getContractAt("Sanctis", sanctis.address)
  ).setRegistries(
    deployedRaceRegistry.address,
    deployedResourceRegistry.address,
    deployedInfrastructureRegistry.address
  );
};
export default deploy;
deploy.tags = ["Registries"];
