import { ethers } from "hardhat";
import { expect } from "chai";
import { BigNumber, Contract, ContractFactory, Signer } from "ethers";
import { assertRevert } from "./helpers";
import increaseBlock from "./helpers/increaseBlock";

describe("Integration", async function () {
  let Commanders: ContractFactory,
    Sanctis: ContractFactory,
    Planets: ContractFactory,
    Fleets: ContractFactory,
    SpaceCredits: ContractFactory,
    Humans: ContractFactory,
    Iron: ContractFactory,
    Extractors: ContractFactory,
    Spatioports: ContractFactory,
    Transporters: ContractFactory,
    Parliament: ContractFactory,
    Standards: ContractFactory,
    RaceRegistry: ContractFactory,
    ResourceRegistry: ContractFactory,
    InfrastructureRegistry: ContractFactory,
    ShipRegistry: ContractFactory;
  let sanctis: Contract,
    commanders: Contract,
    planets: Contract,
    fleets: Contract,
    credits: Contract,
    parliament: Contract,
    standards: Contract,
    humans: Contract,
    iron: Contract,
    extractors: Contract,
    spatioports: Contract,
    transporters: Contract,
    raceRegistry: Contract,
    resourceRegistry: Contract,
    infrastructureRegistry: Contract,
    shipRegistry: Contract;
  let accounts: Signer[];

  const citizenCapacity = BigNumber.from(10);
  const colonizationCost = BigNumber.from(10);
  const extractorBaseRewards = BigNumber.from(100);
  const extractorRewardRates = BigNumber.from(250);
  const extractorDelay = BigNumber.from(10);

  beforeEach(async function () {
    Standards = await ethers.getContractFactory("GalacticStandards");
    Parliament = await ethers.getContractFactory("Parliament");
    SpaceCredits = await ethers.getContractFactory("SpaceCredits");
    Commanders = await ethers.getContractFactory("Commanders");
    Planets = await ethers.getContractFactory("Planets");
    Fleets = await ethers.getContractFactory("Fleets");
    Sanctis = await ethers.getContractFactory("Sanctis");
    Humans = await ethers.getContractFactory("Humans");
    Iron = await ethers.getContractFactory("Iron");
    Extractors = await ethers.getContractFactory("Extractors");
    Spatioports = await ethers.getContractFactory("Spatioports");
    Transporters = await ethers.getContractFactory("Transporters");
    InfrastructureRegistry = await ethers.getContractFactory(
      "InfrastructureRegistry"
    );
    ShipRegistry = await ethers.getContractFactory("ShipRegistry");
    ResourceRegistry = await ethers.getContractFactory("ResourceRegistry");
    RaceRegistry = await ethers.getContractFactory("RaceRegistry");

    accounts = await ethers.getSigners();
  });

  describe("Initialize contracts", async function () {
    beforeEach(async function () {
      // Initialize 0 shares, to avoid minting some to the owner
      sanctis = await Sanctis.deploy();

      credits = await SpaceCredits.deploy();
      parliament = await Parliament.deploy(
        credits.address,
        await accounts[0].getAddress()
      );

      await sanctis.setGovernance(
        parliament.address,
        await accounts[0].getAddress(),
        credits.address
      );

      await credits.transferOwnership(await sanctis.parliamentExecutor());

      commanders = await Commanders.deploy(sanctis.address);
      standards = await Standards.deploy(sanctis.address);
      planets = await Planets.deploy(
        sanctis.address,
        credits.address,
        colonizationCost
      );
      fleets = await Fleets.deploy(sanctis.address);

      await sanctis.setWorld(
        planets.address,
        commanders.address,
        fleets.address,
        standards.address,
        citizenCapacity
      );

      raceRegistry = await RaceRegistry.deploy();
      resourceRegistry = await ResourceRegistry.deploy();
      infrastructureRegistry = await InfrastructureRegistry.deploy();
      shipRegistry = await ShipRegistry.deploy();

      await sanctis.setRegistries(
        raceRegistry.address,
        resourceRegistry.address,
        infrastructureRegistry.address,
        shipRegistry.address
      );

      humans = await Humans.deploy(sanctis.address);
      iron = await Iron.deploy(sanctis.address);

      let costs = Array(10).fill([0, 0]);
      costs[0] = [1, 0];
      let rates = Array(10).fill([0, 0]);
      rates[0] = [1, 100];
      extractors = await Extractors.deploy(
        sanctis.address,
        1,
        extractorBaseRewards,
        extractorRewardRates,
        extractorDelay,
        costs,
        rates
      );

      costs = Array(10).fill([0, 0]);
      costs[0] = [1, 100];
      rates = Array(10).fill([0, 0]);
      rates[0] = [1, 100];
      spatioports = await Spatioports.deploy(
        sanctis.address,
        extractorDelay,
        costs,
        rates
      );

      let transporterCosts = Array(10).fill([0, 0]);
      let speed = 100;
      let capacity = 10;
      transporterCosts[0] = [1, 100];
      transporters = await Transporters.deploy(
        sanctis.address,
        capacity,
        speed,
        transporterCosts
      );

      await sanctis.add(0, await humans.id());
      await sanctis.add(1, await iron.id());
      await sanctis.add(2, await extractors.id());
      await sanctis.add(2, await spatioports.id());
      await sanctis.add(3, await transporters.id());
    });

    it("Create a citizen and an Iron extractor, then harvest it", async function () {
      const homeworld = BigNumber.from("0xFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFF");
      await commanders.create("Tester", await humans.id());
      await sanctis.onboard(await iron.id());
      await planets.create(homeworld);

      await credits.approve(planets.address, colonizationCost);
      await planets.colonize(await iron.id(), homeworld);

      // Create an iron extractor
      await extractors.create(homeworld);

      expect(await iron.reserve(homeworld)).to.equal(BigNumber.from(0));

      const elapsedBlock = 1;
      await increaseBlock(elapsedBlock);
      await extractors.harvest(homeworld);

      // The resources extracted depends on the time spent between harvests
      expect(await iron.reserve(homeworld)).to.equal(
        extractorBaseRewards.add(extractorRewardRates).mul(elapsedBlock + 1)
      );

      // Upgrade the extractor
      await increaseBlock(extractorDelay.toNumber());
      await extractors.upgrade(homeworld);

      const ironReserve = await iron.reserve(homeworld);

      // It should yield more than before
      await increaseBlock(elapsedBlock);
      await extractors.harvest(homeworld);

      let ironBalance = await iron.reserve(homeworld);
      expect(ironBalance).to.equal(
        extractorBaseRewards
          .add(extractorRewardRates.mul(2))
          .mul(elapsedBlock + 1)
          .add(ironReserve)
      );

      // Create a spatioport
      await spatioports.create(homeworld);

      // The spatioport has been paid
      expect(await iron.reserve(homeworld)).to.equal(ironBalance.sub(100));

      // Building a few transporters
      ironBalance = await iron.reserve(homeworld);
      const transportersCount = 5;
      await spatioports.build(
        homeworld,
        transporters.address,
        transportersCount
      );

      expect(await iron.reserve(homeworld)).to.equal(
        ironBalance.sub(100 * transportersCount)
      );
      expect(await transporters.reserve(homeworld)).to.equal(
        transportersCount
      );
    });
  });
});
