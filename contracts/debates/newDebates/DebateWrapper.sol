// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./Debate.sol";

/**
 * @title DebateWrapper
 * @dev This contract deploys new Debate contracts and emits events for indexing.
 *      The user calls `createDebate` to start a new debate (passing the root argument text),
 *      then we deploy a new Debate contract which internally does the hashing.
 */
contract DebateWrapper {

    event NewDebate(
        address indexed debateAddress,
        address indexed author,
        string title,
        bool isBinary,
        bytes32 rootArgHash,
        string rootArgText,       // full text for indexer
        uint256 rootWeight
    );

    /**
     * @notice Deploy a new Debate contract with the given parameters.
     * @param _title The human-readable title of the debate
     * @param _rootArgText The FULL text of the root argument
     * @param _isBinary True => standard pro/con root, false => free-for-all (top-level is always pro)
     * @param _token The address of the iVotes-compatible ERC20 (OpenZeppelin ERC20Votes)
     * @param _rootWeight The user-assigned weight for the root argument
     */
    function createDebate(
        string memory _title,
        string memory _rootArgText,
        bool _isBinary,
        address _token,
        uint256 _rootWeight
    )
        external
    {
        // Deploy a new Debate contract
        Debate debate = new Debate(
            _title,
            _rootArgText,
            _isBinary,
            _token,
            _rootWeight
        );

        // Retrieve the root arg hash from the newly created contract
        bytes32 rootHash = debate.getRootArgHash();

        // Emitting event for indexer, includes the full text
        emit NewDebate(
            address(debate),
            msg.sender,
            _title,
            _isBinary,
            rootHash,
            _rootArgText,
            _rootWeight
        );
    }
}
