// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Token.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "./Dao.sol";

contract TokenFactory {
    address[] public deployedTokens;

    function deployToken(
        string memory name,
        string memory symbol,
        address[] memory initialMembers,
        uint256[] memory initialAmounts
    ) public returns (address) {
        HBEVM_token token = new HBEVM_token(name, symbol, initialMembers, initialAmounts);
        deployedTokens.push(address(token));
        return address(token);
    }
}


contract TimelockFactory {
    address[] public deployedTimelocks;

    function deployTimelock(address admin) public returns (address) {
        address[] memory proposers;
        address[] memory executors;

        TimelockController timelock = new TimelockController(
            0,              // Minimum delay for execution, can be customized
            proposers,      // Empty proposers array
            executors,      // Empty executors array
            admin           // Admin role set to the provided admin
        );
        deployedTimelocks.push(address(timelock));
        return address(timelock);
    }
}

contract DAOFactory {
    address[] public deployedDAOs;

    function deployDAO(address tokenAddress, address timelockAddress,
    string memory name, uint48 minsDelay, uint32 minsVoting
    ) public returns (address) {
        HomebaseDAO dao = new HomebaseDAO(
            HBEVM_token(tokenAddress),
            TimelockController(payable(timelockAddress)),
            name,
            minsDelay,
            minsVoting
            );
        deployedDAOs.push(address(dao));
        return address(dao);
    }
}



contract WrapperContract {
    TokenFactory tokenFactory;
    TimelockFactory timelockFactory;
    DAOFactory daoFactory;
    address[] public deployedDAOs;
    address[] public deployedTokens;
    address[] public deployedTimelocks;

    constructor(
        address _tokenFactory,
        address _timelockFactory,
        address _daoFactory
    ) {
        tokenFactory = TokenFactory(_tokenFactory);
        timelockFactory = TimelockFactory(_timelockFactory);
        daoFactory = DAOFactory(_daoFactory);
    }

    function deployDAOwithToken(
        string memory name,
        string memory symbol,
        address[] memory initialMembers,
        uint256[] memory initialAmounts,
        uint48 minsDelay,
        uint32 minsVoting
    ) public {
        address token = tokenFactory.deployToken(name, symbol, initialMembers, initialAmounts);
        address timelock = timelockFactory.deployTimelock(msg.sender);
        address dao = daoFactory.deployDAO(token, timelock, name, minsDelay, minsVoting);
        deployedDAOs.push(dao);
        deployedTokens.push(address(token));
        deployedTimelocks.push(address(timelock));
        // Logic to store addresses can be handled by individual factories if needed
    }
}
