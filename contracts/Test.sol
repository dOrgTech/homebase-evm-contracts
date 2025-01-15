    // SPDX-License-Identifier: MIT
    // Compatible with OpenZeppelin Contracts ^5.0.0
    pragma solidity ^0.8.22;

    contract ChangeMe{
        string thisthing="change me";

        function call_it(string memory newthing)public {
            thisthing=newthing;
        }
    }
