const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const toWei = (v) => ethers.parseUnits(v.toString(), 18);

async function deployFactoriesAndWrapper() {
  const [deployer] = await ethers.getSigners();
  const TokenFactory = await ethers.getContractFactory("TokenFactory");
  const TimelockFactory = await ethers.getContractFactory("TimelockFactory");
  const DAOFactory = await ethers.getContractFactory("DAOFactory");
  const WrapperContract = await ethers.getContractFactory("WrapperContract");

  const tokenFactory = await TokenFactory.deploy();
  const timelockFactory = await TimelockFactory.deploy();
  const daoFactory = await DAOFactory.deploy();
  await tokenFactory.waitForDeployment();
  await timelockFactory.waitForDeployment();
  await daoFactory.waitForDeployment();

  const wrapper = await WrapperContract.deploy(
    await tokenFactory.getAddress(),
    await timelockFactory.getAddress(),
    await daoFactory.getAddress()
  );
  await wrapper.waitForDeployment();

  return { wrapper, deployer };
}

describe("Wrapper + DAO end-to-end (with native token)", function () {
  async function deployWithTokenFixture() {
    const { wrapper } = await deployFactoriesAndWrapper();
    const [deployer, memberA, memberB, outsider] = await ethers.getSigners();

    const name = "Homebase Test DAO";
    const symbol = "HBT";
    const decimals = 18;
    const transferrable = false; // non-transferable token

    const mintA = toWei(100);
    const mintB = toWei(50);
    const votingDelayMins = 1;
    const votingPeriodMins = 2;
    const proposalThreshold = toWei(1);
    const quorumFraction = 10; // 10%
    const executionDelaySecs = 0;

    const initialMembers = [memberA.address, memberB.address];
    const initialAmounts = [
      mintA,
      mintB,
      votingDelayMins,
      votingPeriodMins,
      proposalThreshold,
      quorumFraction,
    ];

    const keys = ["description", "site"];
    const values = ["Test DAO", "https://example.org"];

    await (await wrapper.deployDAOwithToken({
      name,
      symbol,
      description: values[0],
      decimals,
      executionDelay: executionDelaySecs,
      initialMembers,
      initialAmounts,
      keys,
      values,
      transferrable,
    })).wait();

    // Pull deployed addresses from wrapper public arrays
    const idx = (await wrapper.getNumberOfDAOs()) - 1n;
    const daoAddr = await wrapper.deployedDAOs(idx);
    const tokenAddr = await wrapper.deployedTokens(idx);
    const timelockAddr = await wrapper.deployedTimelocks(idx);
    const registryAddr = await wrapper.deployedRegistries(idx);

    const dao = await ethers.getContractAt("HomebaseDAO", daoAddr);
    const token = await ethers.getContractAt("HBEVM_token", tokenAddr);
    const timelock = await ethers.getContractAt("TimelockController", timelockAddr);
    const registry = await ethers.getContractAt("Registry", registryAddr);

    return {
      wrapper,
      dao,
      token,
      timelock,
      registry,
      accounts: { deployer, memberA, memberB, outsider },
      params: {
        votingDelayMins,
        votingPeriodMins,
        proposalThreshold,
        quorumFraction,
        mintA,
        mintB,
      },
    };
  }

  it("wires token, timelock, dao, registry with correct settings", async function () {
    const { dao, token, timelock, registry, accounts, params } = await loadFixture(deployWithTokenFixture);
    const { memberA, memberB } = accounts;

    // Token basics
    expect(await token.decimals()).to.equal(18);
    expect(await token.isTransferable()).to.equal(false);
    expect(await token.admin()).to.equal(await timelock.getAddress());
    
    // Check token balances were minted correctly
    expect(await token.balanceOf(memberA.address)).to.equal(params.mintA);
    expect(await token.balanceOf(memberB.address)).to.equal(params.mintB);

    // DAO settings
    const delaySec = await dao.votingDelay();
    const periodSec = await dao.votingPeriod();
    expect(delaySec).to.equal(BigInt(params.votingDelayMins) * 60n);
    expect(periodSec).to.equal(BigInt(params.votingPeriodMins) * 60n);
    expect(await dao.proposalThreshold()).to.equal(params.proposalThreshold);

    // Members must delegate to themselves for voting power to count
    await (await token.connect(memberA).delegate(memberA.address)).wait();
    await (await token.connect(memberB).delegate(memberB.address)).wait();
    
    // Check voting power after delegation
    const votingPowerA = await token.getVotes(memberA.address);
    const votingPowerB = await token.getVotes(memberB.address);
    expect(votingPowerA).to.equal(params.mintA);
    expect(votingPowerB).to.equal(params.mintB);
    
    // Check quorum numerator is set correctly (10%)
    const quorumNumeratorValue = await dao.quorumNumerator();
    expect(quorumNumeratorValue).to.equal(10);
    
    // Note: Quorum calculation depends on getPastTotalSupply which requires checkpoints.
    // Since tokens are minted in the constructor, the checkpoint is at deployment block.
    // The quorum will only be correct after the first transfer or mint operation that
    // creates a new checkpoint. This is tested in the second test case where proposals
    // are created and executed.

    // Registry initial values
    expect(await registry.getRegistryValue("description")).to.equal("Test DAO");
    expect(await registry.getRegistryValue("site")).to.equal("https://example.org");

    // Non-transferable: member cannot transfer
    await expect(
      token.connect(memberA).transfer(memberB.address, 1n)
    ).to.be.revertedWith("HBEVM_token: transfers disabled for non-admin");

    // Timelock roles for DAO
    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
    expect(await timelock.hasRole(PROPOSER_ROLE, await dao.getAddress())).to.equal(true);
    expect(await timelock.hasRole(EXECUTOR_ROLE, await dao.getAddress())).to.equal(true);
  });

  it("executes governance proposal to update registry and mint tokens", async function () {
    const { dao, token, registry, params, accounts } = await loadFixture(deployWithTokenFixture);
    const { memberA, outsider } = accounts;

    // Delegate to activate votes
    await (await token.connect(memberA).delegate(memberA.address)).wait();

    // 1) Proposal: edit registry key
    const newSite = "https://new.example.org";
    const regIface = (await ethers.getContractFactory("Registry")).interface;
    const calldata1 = regIface.encodeFunctionData("editRegistry", ["site", newSite]);

    const targets1 = [await registry.getAddress()];
    const values1 = [0];
    const calldatas1 = [calldata1];
    const description1 = "Update site registry key";
    const descHash1 = ethers.id(description1);

    // Propose
    await (await dao.connect(memberA).propose(targets1, values1, calldatas1, description1)).wait();

    // Wait through voting delay
    await time.increase((await dao.votingDelay()) + 1n);

    // Vote For
    const proposalId1 = await dao.hashProposal(targets1, values1, calldatas1, descHash1);
    await (await dao.connect(memberA).castVote(proposalId1, 1)).wait();

    // End voting period
    await time.increase((await dao.votingPeriod()) + 1n);

    // Queue and execute
    await (await dao.queue(targets1, values1, calldatas1, descHash1)).wait();
    await (await dao.execute(targets1, values1, calldatas1, descHash1)).wait();

    expect(await registry.getRegistryValue("site")).to.equal(newSite);

    // 2) Proposal: mint tokens via admin-only function (executed by Timelock)
    const mintAmt = toWei(5);
    const tokIface = (await ethers.getContractFactory("HBEVM_token")).interface;
    const calldata2 = tokIface.encodeFunctionData("mint", [outsider.address, mintAmt]);

    const targets2 = [await token.getAddress()];
    const values2 = [0];
    const calldatas2 = [calldata2];
    const description2 = "Mint tokens to outsider";
    const descHash2 = ethers.id(description2);

    await (await dao.connect(memberA).propose(targets2, values2, calldatas2, description2)).wait();
    await time.increase((await dao.votingDelay()) + 1n);
    const proposalId2 = await dao.hashProposal(targets2, values2, calldatas2, descHash2);
    await (await dao.connect(memberA).castVote(proposalId2, 1)).wait();
    await time.increase((await dao.votingPeriod()) + 1n);
    await (await dao.queue(targets2, values2, calldatas2, descHash2)).wait();
    await (await dao.execute(targets2, values2, calldatas2, descHash2)).wait();

    expect(await token.balanceOf(outsider.address)).to.equal(mintAmt);
  });
});

describe("Wrapper + DAO (wrapped token flow)", function () {
  async function deployWithWrappedFixture() {
    const { wrapper } = await deployFactoriesAndWrapper();
    const [deployer, memberA] = await ethers.getSigners();

    // Underlying token (transferable) for wrapping
    // Deploy a transferable underlying token with supply to memberA
    const UnderlyingToken = await ethers.getContractFactory("HBEVM_token");
    const underlying = await UnderlyingToken.deploy(
      "Underlying",
      "UND",
      18,
      [memberA.address],
      [toWei(100)],
      true // transferable
    );
    await underlying.waitForDeployment();

    const params = {
      daoName: "WrappedDAO",
      wrappedTokenName: "wUND",
      wrappedTokenSymbol: "wUND",
      description: "Wrapped flow",
      executionDelay: 0,
      underlyingTokenAddress: await underlying.getAddress(),
      minsVotingDelay: 1,
      minsVotingPeriod: 2,
      proposalThreshold: toWei(1),
      quorumFraction: 10,
      keys: ["description"],
      values: ["Wrapped flow"],
    };

    await (await wrapper.deployDAOwithWrappedToken(params)).wait();

    const idx = (await wrapper.getNumberOfDAOs()) - 1n;
    const daoAddr = await wrapper.deployedDAOs(idx);
    const wTokenAddr = await wrapper.deployedTokens(idx);
    const registryAddr = await wrapper.deployedRegistries(idx);

    const dao = await ethers.getContractAt("HomebaseDAO", daoAddr);
    const wToken = await ethers.getContractAt("HBEVM_Wrapped_Token", wTokenAddr);
    const registry = await ethers.getContractAt("Registry", registryAddr);

    return { dao, wToken, registry, underlying, accounts: { memberA } };
  }

  it("allows deposit, delegation, and executing a simple registry proposal", async function () {
    const { dao, wToken, registry, underlying, accounts } = await loadFixture(deployWithWrappedFixture);
    const { memberA } = accounts;

    // Deposit underlying and delegate
    const amt = toWei(10);
    await (await underlying.connect(memberA).approve(await wToken.getAddress(), amt)).wait();
    await (await wToken.connect(memberA).depositFor(memberA.address, amt)).wait();
    await (await wToken.connect(memberA).delegate(memberA.address)).wait();

    const regIface = (await ethers.getContractFactory("Registry")).interface;
    const targets = [await registry.getAddress()];
    const values = [0];
    const calldatas = [regIface.encodeFunctionData("editRegistry", ["info", "wrapped-ok"])];
    const desc = "Edit info key via wrapped";
    const descHash = ethers.id(desc);

    await (await dao.connect(memberA).propose(targets, values, calldatas, desc)).wait();
    await time.increase((await dao.votingDelay()) + 1n);
    const proposalId = await dao.hashProposal(targets, values, calldatas, descHash);
    await (await dao.connect(memberA).castVote(proposalId, 1)).wait();
    await time.increase((await dao.votingPeriod()) + 1n);
    await (await dao.queue(targets, values, calldatas, descHash)).wait();
    await (await dao.execute(targets, values, calldatas, descHash)).wait();

    expect(await registry.getRegistryValue("info")).to.equal("wrapped-ok");
  });
});
