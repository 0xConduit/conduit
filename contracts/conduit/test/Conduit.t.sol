// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.13;

import { Test, console } from "forge-std/Test.sol";
import { Conduit } from "../src/Conduit.sol";

contract ConduitTest is Test {
    Conduit public conduit;

    function setUp() public {
        conduit = new Conduit();
    }
}
