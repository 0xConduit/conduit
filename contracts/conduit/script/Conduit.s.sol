// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.13;

import { Script, console } from "forge-std/Script.sol";
import { Conduit } from "../src/Conduit.sol";

contract ConduitScript is Script {
    Conduit public conduit;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        conduit = new Conduit();

        vm.stopBroadcast();

        console.log("===========================================");
        console.log("Conduit:  ", address(conduit));
        console.log("AgentNFT: ", address(conduit.agentNFT()));
        console.log("===========================================");
        console.log("Add to backend/.env:");
        console.log("AGENT_NFT_ADDRESS=", address(conduit.agentNFT()));
    }
}
