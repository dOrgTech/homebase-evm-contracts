// test/HBEVM_Wrapped_Token.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("HBEVM_Wrapped_Token", function () {
    async function deployWrappedTokenFixture() {
        const [owner, addr1, adminUser] = await ethers.getSigners();

        const UnderlyingToken = await ethers.getContractFactory("HBEVM_token");
        const underlyingToken = await UnderlyingToken.deploy(
            "Underlying Test Token", "UTT", 18,
            [owner.address], [ethers.parseUnits("1000", 18)], true
        );
        await underlyingToken.waitForDeployment();
        const underlyingTokenAddress = await underlyingToken.getAddress();

        const WrappedToken = await ethers.getContractFactory("HBEVM_Wrapped_Token");
        const name = "Wrapped Test Token";
        const symbol = "WTT";
        
        const wrappedToken = await WrappedToken.deploy(underlyingTokenAddress, name, symbol);
        await wrappedToken.waitForDeployment();

        return { wrappedToken, underlyingToken, owner, addr1, adminUser, name, symbol };
    }

    describe("Deployment", function () {
        it("Should set the right name and symbol", async function () {
            const { wrappedToken, name, symbol } = await loadFixture(deployWrappedTokenFixture);
            expect(await wrappedToken.name()).to.equal(name);
            expect(await wrappedToken.symbol()).to.equal(symbol);
        });

        it("Should set the underlying token correctly", async function () {
            const { wrappedToken, underlyingToken } = await loadFixture(deployWrappedTokenFixture);
            expect(await wrappedToken.underlying()).to.equal(await underlyingToken.getAddress());
        });

        it("Should have admin as address(0) and adminSet as false initially", async function () {
            const { wrappedToken } = await loadFixture(deployWrappedTokenFixture);
            expect(await wrappedToken.admin()).to.equal(ethers.ZeroAddress);
        });

        it("Should have decimals matching the underlying token", async function () {
            const { wrappedToken, underlyingToken } = await loadFixture(deployWrappedTokenFixture);
            expect(await wrappedToken.decimals()).to.equal(await underlyingToken.decimals());
        });

        it("Should return correct CLOCK_MODE", async function () {
            const { wrappedToken } = await loadFixture(deployWrappedTokenFixture);
            expect(await wrappedToken.CLOCK_MODE()).to.equal("mode=timestamp");
        });
    });

    describe("Admin Management", function () {
        it("Should allow setting admin once", async function () {
            const { wrappedToken, adminUser } = await loadFixture(deployWrappedTokenFixture);
            await wrappedToken.setAdmin(adminUser.address);
            expect(await wrappedToken.admin()).to.equal(adminUser.address);

            await expect(wrappedToken.setAdmin(adminUser.address))
                .to.be.revertedWith("HBEVM_Wrapped_Token: admin has already been set");
        });

        it("Should not allow setting admin to address(0)", async function () {
            const { wrappedToken } = await loadFixture(deployWrappedTokenFixture);
            await expect(wrappedToken.setAdmin(ethers.ZeroAddress))
                .to.be.revertedWith("HBEVM_Wrapped_Token: new admin address cannot be zero");
        });
    });

    describe("Wrapping (depositFor) and Unwrapping (withdrawTo)", function () {
        it("Should allow depositing underlying tokens to mint wrapped tokens", async function () {
            const { wrappedToken, underlyingToken, owner, addr1 } = await loadFixture(deployWrappedTokenFixture);
            const depositAmount = ethers.parseUnits("100", 18);

            await underlyingToken.connect(owner).approve(await wrappedToken.getAddress(), depositAmount);

            await expect(wrappedToken.connect(owner).depositFor(addr1.address, depositAmount))
                .to.emit(wrappedToken, "Transfer")
                .withArgs(ethers.ZeroAddress, addr1.address, depositAmount);

            expect(await wrappedToken.balanceOf(addr1.address)).to.equal(depositAmount);
            expect(await underlyingToken.balanceOf(await wrappedToken.getAddress())).to.equal(depositAmount);
            expect(await underlyingToken.balanceOf(owner.address)).to.equal(ethers.parseUnits("900", 18));
        });

        it("Should allow withdrawing (burning) wrapped tokens to receive underlying tokens", async function () {
            const { wrappedToken, underlyingToken, owner, addr1 } = await loadFixture(deployWrappedTokenFixture);
            const depositAmount = ethers.parseUnits("100", 18);
            const withdrawAmount = ethers.parseUnits("50", 18);

            await underlyingToken.connect(owner).approve(await wrappedToken.getAddress(), depositAmount);
            await wrappedToken.connect(owner).depositFor(addr1.address, depositAmount);
            
            const initialUnderlyingBalanceAddr1 = await underlyingToken.balanceOf(addr1.address);

            await expect(wrappedToken.connect(addr1).withdrawTo(addr1.address, withdrawAmount))
                .to.emit(wrappedToken, "Transfer")
                .withArgs(addr1.address, ethers.ZeroAddress, withdrawAmount);

            expect(await wrappedToken.balanceOf(addr1.address)).to.equal(depositAmount - withdrawAmount);
            expect(await underlyingToken.balanceOf(await wrappedToken.getAddress())).to.equal(depositAmount - withdrawAmount);
            expect(await underlyingToken.balanceOf(addr1.address)).to.equal(initialUnderlyingBalanceAddr1 + withdrawAmount);
        });

        it("Should fail deposit if insufficient allowance for underlying token", async function () {
            const { wrappedToken, underlyingToken, owner, addr1 } = await loadFixture(deployWrappedTokenFixture); // Ensure underlyingToken is destructured
            const depositAmount = ethers.parseUnits("100", 18);
            await expect(wrappedToken.connect(owner).depositFor(addr1.address, depositAmount))
                 .to.be.revertedWithCustomError(underlyingToken, "ERC20InsufficientAllowance")
                 .withArgs(await wrappedToken.getAddress(), 0, depositAmount);
        });

        it("Should fail withdraw if insufficient wrapped token balance", async function () {
            const { wrappedToken, addr1 } = await loadFixture(deployWrappedTokenFixture);
            const withdrawAmount = ethers.parseUnits("100", 18); 
            await expect(wrappedToken.connect(addr1).withdrawTo(addr1.address, withdrawAmount))
                .to.be.revertedWithCustomError(wrappedToken, "ERC20InsufficientBalance")
                .withArgs(addr1.address, 0, withdrawAmount);
        });
    });

    describe("ERC20Votes Functionality", function () {
        it("Should allow delegation and reflect votes", async function () {
            const { wrappedToken, underlyingToken, owner, addr1 } = await loadFixture(deployWrappedTokenFixture);
            const depositAmount = ethers.parseUnits("100", 18);

            await underlyingToken.connect(owner).approve(await wrappedToken.getAddress(), depositAmount);
            await wrappedToken.connect(owner).depositFor(addr1.address, depositAmount);
            await time.advanceBlock(); // Ensure deposit is processed for vote snapshot

            await wrappedToken.connect(addr1).delegate(addr1.address);
            await time.advanceBlock(); // Ensure delegation is processed
            expect(await wrappedToken.getVotes(addr1.address)).to.equal(depositAmount);
        });
    });

    describe("ERC20Permit Functionality", function () {
        it("Should allow spending with a permit", async function () {
            const { wrappedToken, underlyingToken, owner, addr1 } = await loadFixture(deployWrappedTokenFixture);
            
            let tempWalletSigner = ethers.Wallet.createRandom();
            const wallet = tempWalletSigner.connect(ethers.provider); 

            // Fund the 'wallet' so it can pay for gas on its transactions
            await owner.sendTransaction({
                to: wallet.address,
                value: ethers.parseEther("1.0") 
            });

            const spender = owner.address; 
            const valueToPermit = ethers.parseUnits("50", 18);
            const deadline = (await time.latest()) + 3600;

            const underlyingAmountForWallet = ethers.parseUnits("100", 18);
            await underlyingToken.connect(owner).transfer(wallet.address, underlyingAmountForWallet);
            await underlyingToken.connect(wallet).approve(await wrappedToken.getAddress(), underlyingAmountForWallet);
            await wrappedToken.connect(wallet).depositFor(wallet.address, underlyingAmountForWallet);
            expect(await wrappedToken.balanceOf(wallet.address)).to.equal(underlyingAmountForWallet);

            const nonce = await wrappedToken.nonces(wallet.address);
            const domain = {
                name: await wrappedToken.name(),
                version: "1", // ERC20Permit typically uses "1" for this field in domain object
                chainId: (await ethers.provider.getNetwork()).chainId,
                verifyingContract: await wrappedToken.getAddress()
            };
            const types = {
                Permit: [
                    { name: "owner", type: "address" },
                    { name: "spender", type: "address" },
                    { name: "value", type: "uint256" },
                    { name: "nonce", type: "uint256" },
                    { name: "deadline", type: "uint256" }
                ]
            };
            const message = {
                owner: wallet.address,
                spender: spender,
                value: valueToPermit,
                nonce: nonce,
                deadline: deadline
            };

            const signature = await wallet.signTypedData(domain, types, message);
            const { r, s, v } = ethers.Signature.from(signature);

            await wrappedToken.connect(owner).permit(wallet.address, spender, valueToPermit, deadline, v, r, s);
            expect(await wrappedToken.allowance(wallet.address, spender)).to.equal(valueToPermit);

            await wrappedToken.connect(owner).transferFrom(wallet.address, addr1.address, valueToPermit);
            expect(await wrappedToken.balanceOf(addr1.address)).to.equal(valueToPermit);
            expect(await wrappedToken.balanceOf(wallet.address)).to.equal(underlyingAmountForWallet - valueToPermit);
        });
    });
});
// test/HBEVM_Wrapped_Token.test.js