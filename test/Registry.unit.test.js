const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Registry (unit)", function () {
  it("allows owner and wrapper to edit; rejects others; treasury ops only owner", async function () {
    const [owner, wrapper, outsider, recipient] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("Registry");
    const reg = await Registry.deploy(owner.address, wrapper.address);
    await reg.waitForDeployment();

    // Owner edit
    await (await reg.connect(owner).editRegistry("k1", "v1")).wait();
    expect(await reg.getRegistryValue("k1")).to.equal("v1");

    // Wrapper edit
    await (await reg.connect(wrapper).editRegistry("k1", "v2")).wait();
    expect(await reg.getRegistryValue("k1")).to.equal("v2");

    // Outsider edit should revert
    await expect(reg.connect(outsider).editRegistry("k1", "no")).to.be.revertedWith("Only the DAO can edit registry");

    // Fund registry with ETH
    await owner.sendTransaction({ to: await reg.getAddress(), value: 1000n });
    // Outsider cannot transfer ETH
    await expect(reg.connect(outsider).transferETH(recipient.address, 1n)).to.be.revertedWith("Only the DAO can make transfers");
  });
});

