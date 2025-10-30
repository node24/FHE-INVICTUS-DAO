import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedInvictusDAO = await deploy("InvictusDAO", {
    from: deployer,
    log: true,
  });

  console.log(`InvictusDAO contract: `, deployedInvictusDAO.address);
};
export default func;
func.id = "deploy_invictusDAO_v1"; // INVICTUS DAO deployment
func.tags = ["InvictusDAO"];
