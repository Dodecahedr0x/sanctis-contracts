import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments } = hre;
  const { deploy } = deployments;
  const accounts = await hre.getUnnamedAccounts();

  console.log("Deploying to", hre.network.name, "from", accounts[0]);

  const council = accounts[0];
  const executor = accounts[0]

  const deployedCitadel = await deploy("Sanctis", {
    from: accounts[0],
    args: [],
    log: true,
  });
  const deployedCredits = await deploy("SpaceCredits", {
    from: accounts[0],
    args: [],
    log: true,
  });

  const deployedParliament = await deploy("Parliament", {
    from: accounts[0],
    args: [deployedCredits.address, executor],
    log: true,
  });

  const sanctis = await hre.ethers.getContractAt(
    "Sanctis",
    deployedCitadel.address
  );
  await sanctis.setGovernance(
    deployedParliament.address,
    accounts[0],
    deployedCredits.address
  );

  const credits = await hre.ethers.getContractAt(
    "SpaceCredits",
    deployedCredits.address
  );
  await credits.transferOwnership(await sanctis.parliamentExecutor());
};
export default deploy;
deploy.tags = ["Governance"];
