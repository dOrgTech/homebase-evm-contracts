// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IVotes {
    // A minimal interface to the iVotes (ERC20Votes) contract
    // that we need to call for "getPastVotes" to check voting power.
    function getPastVotes(address account, uint256 blockNumber) external view returns (uint256);
    function getVotes(address account) external view returns (uint256);
    function clock() external view returns (uint256);
}

/**
 * @title Debate
 * @dev Stores arguments by hashing their text in the contract, but also
 *      emits an event with the full text for off-chain indexing.
 *      Enforces "no more than your voting power" usage at creation block.
 */
contract Debate {

    enum OptionType { PRO, CON }

    struct ArgumentData {
        address author;
        bytes32 parentHash;
        uint256 weight;
        OptionType option;
        bool exists;
    }

    // Emitted whenever a new argument is added, including the full text
    event ArgumentAdded(
        address indexed author,
        bytes32 indexed argHash,
        bytes32 parentHash,
        OptionType option,
        uint256 weight,
        string fullText
    );

    string public title;
    bool public isBinary;
    address public token; // iVotes-compatible token
    uint256 public referenceBlock; // snapshot block for getPastVotes

    // The user’s used weight in this debate
    mapping(address => uint256) public usedWeight;

    // Stores all arguments, keyed by their argHash
    mapping(bytes32 => ArgumentData) public arguments;

    bytes32 private rootArgHash; // store the hash of the root argument

    /**
     * @dev Deploy a new Debate.
     * @param _title The title of the debate
     * @param _rootArgText The full text of the root argument
     * @param _isBinary If true => top-level can be pro/con, else => top-level is effectively pro
     * @param _token The iVotes-compatible token
     * @param _rootWeight Weight assigned to the root argument
     */
    constructor(
        string memory _title,
        string memory _rootArgText,
        bool _isBinary,
        address _token,
        uint256 _rootWeight
    )
    {
        title = _title;
        isBinary = _isBinary;
        token = _token;

        // We use current block number as reference block
        referenceBlock = IVotes(token).clock();

        uint256 available = IVotes(token).getVotes(tx.origin);
        require(_rootWeight <= available, "Not enough voting power for root arg");

        usedWeight[tx.origin] = _rootWeight;

        bytes32 hashVal = keccak256(abi.encodePacked(_rootArgText, tx.origin, block.timestamp));
        rootArgHash = hashVal;

        // Store the root argument as "pro"
        arguments[hashVal] = ArgumentData({
            author: msg.sender,
            parentHash: bytes32(0),
            weight: _rootWeight,
            option: OptionType.PRO,
            exists: true
        });

        // Fire an event so indexer can store the text
        emit ArgumentAdded(
            msg.sender,
            hashVal,
            bytes32(0),   // no parent
            OptionType.PRO,
            _rootWeight,
            _rootArgText
        );
    }

    /**
     * @dev Return the hash of the root argument for reference
     */
    function getRootArgHash() external view returns (bytes32) {
        return rootArgHash;
    }

    /**
     * @dev Add a new argument to the debate
     * @param _argText The full text of the argument
     * @param _parentHash The hash of the parent argument
     * @param _option 0=PRO,1=CON
     * @param _weight The user-assigned weight
     */
    function addArgument(
        string memory _argText,
        bytes32 _parentHash,
        OptionType _option,
        uint256 _weight
    )
        external
    {
        // The parent must exist
        require(arguments[_parentHash].exists, "Parent does not exist");

        // If debate is not binary, then top-level children of the root cannot be CON
        // meaning if parentHash == rootArgHash or parent's parentHash==0 => top-level
        ArgumentData memory parentArg = arguments[_parentHash];
        if (!isBinary && parentArg.parentHash == bytes32(0)) {
            // top-level child => must be PRO
            require(_option == OptionType.PRO, "Free-for-all debate has no con at top level");
        }

        // Check user voting power
        uint256 used = usedWeight[msg.sender];
        uint256 available = IVotes(token).getPastVotes(msg.sender, referenceBlock);
        require(used + _weight <= available, "Not enough voting power left");

        usedWeight[msg.sender] = used + _weight;

        // Compute argHash from text + msg.sender + current block timestamp
        bytes32 newArgHash = keccak256(abi.encodePacked(_argText, msg.sender, block.timestamp));

        arguments[newArgHash] = ArgumentData({
            author: msg.sender,
            parentHash: _parentHash,
            weight: _weight,
            option: _option,
            exists: true
        });

        emit ArgumentAdded(
            msg.sender,
            newArgHash,
            _parentHash,
            _option,
            _weight,
            _argText
        );
    }
}
