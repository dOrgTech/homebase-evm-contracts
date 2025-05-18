// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../HBEVM_Wrapped_Token.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "../Dao.sol"; // Imports HomebaseDAO which imports IVotes
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol"; // Explicit import for IVotes casting
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Interface ITokenFactory (copy from Factories_W.sol)
interface ITokenFactory {
    function deployWrappedToken(
        IERC20 underlyingToken,
        string memory wrappedTokenName,
        string memory wrappedTokenSymbol
    ) external returns (address);
}

// Interface ITimelockFactory (copy from Factories_W.sol)
interface ITimelockFactory {
    function deployTimelock(address admin, uint256 executionDelay) external returns (address);
}

// Interface IDAOFactory (copy from Factories_W.sol)
interface IDAOFactory {
    function deployDAO( 
        address tokenAddress,
        address timelockAddress,
        string memory name,
        uint[] memory daoSettingsArray 
    ) external returns (address);
}

contract MockTokenFactory is ITokenFactory {
    function deployWrappedToken(
        IERC20 underlyingToken,
        string memory wrappedTokenName,
        string memory wrappedTokenSymbol
    ) external override returns (address) {
        HBEVM_Wrapped_Token token = new HBEVM_Wrapped_Token(underlyingToken, wrappedTokenName, wrappedTokenSymbol);
        return address(token);
    }
}

contract MockTimelockFactory is ITimelockFactory {
    function deployTimelock(address admin, uint256 executionDelay) external override returns (address) {
        address[] memory proposers = new address[](0); // Empty, to be configured by Wrapper
        address[] memory executors = new address[](1);
        executors[0] = address(0); // Anyone can execute by default for OZ GovernorTimelockControl
        TimelockController timelock = new TimelockController(uint32(executionDelay), proposers, executors, admin);
        return address(timelock);
    }
}

contract MockDAOFactory is IDAOFactory {
    function deployDAO(
        address tokenAddress,
        address timelockAddress,
        string memory name,
        uint[] memory daoSettingsArray // [minsVotingDelay, minsVotingPeriod, proposalThreshold, quorumFraction]
    ) external override returns (address) {
        HomebaseDAO dao = new HomebaseDAO(
            IVotes(tokenAddress), // Cast to IVotes
            TimelockController(payable(timelockAddress)), // Cast to TimelockController
            name,
            uint48(daoSettingsArray[0]), // minsDelay for GovernorSettings
            uint32(daoSettingsArray[1]), // minsVoting for GovernorSettings
            daoSettingsArray[2],         // pThreshold
            uint8(daoSettingsArray[3])   // qvrm
        );
        return address(dao);
    }
}