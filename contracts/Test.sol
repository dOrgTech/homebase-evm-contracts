// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleDAO {
    address public owner;
    mapping(address => uint256) public shares;
    uint256 public totalShares;
    uint256 public proposalCount;
    uint256 votes=0;
    string latestProposalHash;
    struct Proposal {
        string description;
        uint256 voteCount;
        bool executed;
    }

    Proposal[] public proposals;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Function to receive Ether directly
    receive() external payable {
        shares[msg.sender] += msg.value;
        totalShares += msg.value;
    }

    // Alternative payable fallback function (optional)
    fallback() external payable {
        shares[msg.sender] += msg.value;
        totalShares += msg.value;
    }

    function execute(address payable towhom, uint256 howMuch) public payable{
        payable(towhom).transfer(howMuch);
    }

    function vote()public{
        votes=votes+1;
    }

    function deposit() public payable {
        require(msg.value > 0, "Must send ETH");
        shares[msg.sender] += msg.value;
        totalShares += msg.value;
    }

    function createProposal(string memory description) public {
        proposals.push(Proposal({
            description: description,
            voteCount: 0,
            executed: false
        }));
        proposalCount++;
    }

    function queueProposal(string memory proposalHash)public {
        votes=votes+1;
       latestProposalHash = proposalHash;
    }

    function executeProposal(uint256 proposalIndex) public onlyOwner {
        Proposal storage proposal = proposals[proposalIndex];
        require(!proposal.executed, "Already executed");
        require(proposal.voteCount > totalShares / 2, "Not enough votes");

        proposal.executed = true;
    }


    function withdraw() public {
        uint256 share = shares[msg.sender];
        require(share > 0, "No shares to withdraw");

        shares[msg.sender] = 0;
        totalShares -= share;
        payable(msg.sender).transfer(share);
    }
}
