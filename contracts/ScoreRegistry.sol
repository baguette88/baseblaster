// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ScoreRegistry {
    event Submitted(address indexed player, uint32 score, bytes32 runId);

    mapping(address => uint32) public best;

    function submitScore(uint32 score, bytes32 runId) external {
        if (score > best[msg.sender]) best[msg.sender] = score;
        emit Submitted(msg.sender, score, runId);
    }
}


