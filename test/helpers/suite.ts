import { ethers } from "hardhat";
import {
  ContractFactory,
  Contract,
  Signer,
  BigNumber,
  BigNumberish,
} from "ethers";
import { router1Address } from "./constants";
import { ParameterType } from "./types";
import { increaseTime } from ".";

export default class Suite {
  factories: {
    core?: ContractFactory;
    shares?: ContractFactory;
    vestedShares?: ContractFactory;
    parameters?: ContractFactory;
    investments?: ContractFactory;
    missions?: ContractFactory;
  };
  contracts: {
    core?: Contract;
    shares?: Contract;
    vestedShares?: Contract;
    parameters?: Contract;
    investments?: Contract;
    missions?: Contract;
  };
  defaultOwner?: Signer;
  defaultRouter: string;
  initialSupply: BigNumber;
  initialPrice: BigNumber;
  baseUnit: BigNumber = ethers.utils.parseEther("1");
  halflife: number = 7 * 24 * 60 * 60;
  liquidityFee = ethers.BigNumber.from(9500);
  liquidityFeeDenom = ethers.BigNumber.from(10000);

  constructor(
    initialSupply: BigNumberish = ethers.utils.parseEther("100"),
    initialPrice: BigNumberish = ethers.utils.parseEther("0.01"),
    defaultRouter: string = router1Address
  ) {
    this.factories = {};
    this.contracts = {};
    this.defaultRouter = defaultRouter;
    this.initialSupply = BigNumber.from(initialSupply);
    this.initialPrice = BigNumber.from(initialPrice);
  }

  async setup() {
    this.factories = {
      core: await ethers.getContractFactory("Core"),
      shares: await ethers.getContractFactory("Shares"),
      vestedShares: await ethers.getContractFactory("VestedShares"),
      parameters: await ethers.getContractFactory("ParametersGovernor"),
      investments: await ethers.getContractFactory("InvestmentsGovernor"),
      missions: await ethers.getContractFactory("MissionsGovernor"),
    };
  }

  async deploy(
    owner: Signer,
    governors: {
      parameters?: boolean;
      investments?: boolean;
      missions?: boolean;
    } = {},
    options: { mint?: boolean } = {}
  ) {
    const ownerAddress = await owner?.getAddress();

    this.contracts = {
      core: await this.factories.core?.deploy(
        ownerAddress,
        options.mint ? this.initialSupply : 0,
        this.initialPrice,
        this.defaultRouter
      ),
    };

    this.contracts.shares = await this.factories.shares?.deploy(
      this.contracts.core?.address
    );
    this.contracts.vestedShares = await this.factories.vestedShares?.deploy(
      this.contracts.core?.address
    );
    await this.contracts.core?.initialize(
      this.contracts.shares?.address,
      this.contracts.vestedShares?.address
    );
    await this.contracts.core?.setParameter(
      ParameterType.Cap,
      this.initialSupply
    );

    let parameters: string | undefined = ownerAddress,
      investments: string | undefined = ownerAddress,
      missions: string | undefined = ownerAddress;
    if (governors.parameters) {
      this.contracts.parameters = await this.factories.parameters?.deploy(
        this.contracts.core?.address
      );
      parameters = this.contracts.parameters?.address;
    }
    if (governors.investments) {
      this.contracts.investments = await this.factories.investments?.deploy(
        this.contracts.core?.address
      );
      investments = this.contracts.investments?.address;
    }
    if (governors.missions) {
      this.contracts.missions = await this.factories.missions?.deploy(
        this.contracts.core?.address
      );
      missions = this.contracts.missions?.address;
    }
    await this.contracts.core?.activateGovernors(
      parameters,
      investments,
      missions
    );
  }

  async fund(
    shareAmount: BigNumber,
    options: { signer?: Signer; vest?: boolean; taxed?: boolean } = {}
  ) {
    const { signer, vest } = options;

    const core = signer
      ? this.contracts.core?.connect(signer)
      : this.contracts.core;

    const value = options.taxed
      ? this.initialPrice
          .mul(shareAmount)
          .mul(this.liquidityFeeDenom)
          .div(this.liquidityFee)
          .div(this.baseUnit)
      : this.initialPrice.mul(shareAmount).div(this.baseUnit);
    await core?.fund({
      value,
    });

    if (vest) {
      const shares = signer
        ? this.contracts.shares?.connect(signer)
        : this.contracts.shares;
      const halflife = await core?.halflife();
      await increaseTime(halflife.toNumber());
      await shares?.transfer(this.contracts.core?.address, 0);
    }
  }

  taxed(amount: BigNumber) {
    return amount.mul(this.liquidityFee).div(this.liquidityFeeDenom);
  }

  untaxed(amount: BigNumber) {
    return amount.mul(this.liquidityFeeDenom).div(this.liquidityFee);
  }

  valueIsBetween(
    value: BigNumber,
    middle: BigNumber,
    deviation: number = 5,
    scale = 10000
  ) {
    return (
      value.lt(middle.mul(scale + deviation).div(scale)) &&
      value.gt(middle.mul(scale - deviation).div(scale))
    );
  }
}
