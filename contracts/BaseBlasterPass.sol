// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC1155 } from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract BaseBlasterPass is ERC1155, Ownable {
    uint256 public constant PASS = 1;
    mapping(address => bool) public minted;

    constructor(string memory _uri, address _owner) ERC1155(_uri) Ownable(_owner) {}

    function mint() external {
        require(!minted[msg.sender], "already minted");
        minted[msg.sender] = true;
        _mint(msg.sender, PASS, 1, "");
    }
}


