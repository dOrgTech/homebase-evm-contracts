const { expect } = require("chai");
const { ethers } = require("hardhat");

const toWei = (v) => ethers.parseUnits(v.toString(), 18);

describe("HBEVM_token (unit)", function () {
  it("mints to members and enforces decimals", async function () {
    const [a, b] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("HBEVM_token");
    const token = await Token.deploy("Tkn", "TKN", 18, [a.address, b.address], [toWei(1), toWei(2)], true);
    await token.waitForDeployment();

    expect(await token.decimals()).to.equal(18);
    expect(await token.balanceOf(a.address)).to.equal(toWei(1));
    expect(await token.balanceOf(b.address)).to.equal(toWei(2));
  });

  it("setAdmin only once", async function () {
    const [owner, other] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("HBEVM_token");
    const token = await Token.deploy("Tkn", "TKN", 18, [owner.address], [toWei(1)], true);
    await token.waitForDeployment();

    await (await token.setAdmin(owner.address)).wait();
    await expect(token.setAdmin(other.address)).to.be.revertedWith("HBEVM_token: admin has already been set");
  });

  it("restricts transfers when non-transferable", async function () {
    const [a, b, admin] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("HBEVM_token");
    const token = await Token.deploy("Tkn", "TKN", 18, [a.address], [toWei(1)], false);
    await token.waitForDeployment();

    // Before admin set, transfers should revert for everyone
    await expect(token.connect(a).transfer(b.address, 1n)).to.be.revertedWith("HBEVM_token: transfers disabled for non-admin");

    // After admin set (to admin), only admin can transfer own tokens
    await (await token.setAdmin(admin.address)).wait();
    await expect(token.connect(a).transfer(b.address, 1n)).to.be.revertedWith("HBEVM_token: transfers disabled for non-admin");
  });
});

