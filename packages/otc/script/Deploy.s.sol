// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.36;

import {Script} from "forge-std/Script.sol";

import {EscrowFactory} from "../src/EscrowFactory.sol";
import {FeeTreasury} from "../src/FeeTreasury.sol";

contract Deploy is Script {
    error WrongChain(uint256 actual, uint256 expected);
    error ZeroOwner();
    error UnapprovedFee();

    uint256 internal constant APPROVED_FEE_RATE = 100;
    uint256 internal constant APPROVED_FEE_DENOMINATOR = 10_000;

    function run() external {
        deploy(
            vm.envUint("CHAIN_ID"),
            vm.envAddress("FACTORY_OWNER"),
            vm.envAddress("TREASURY_OWNER"),
            vm.envAddress("PAYOUT"),
            vm.envAddress("USDG"),
            vm.envUint("FEE_RATE"),
            vm.envUint("FEE_DENOMINATOR")
        );
    }

    function deploy(
        uint256 expectedChainId,
        address factoryOwner,
        address treasuryOwner,
        address payout,
        address usdg,
        uint256 feeRate,
        uint256 feeDenominator
    ) public returns (address treasuryAddr, address factoryAddr) {
        if (block.chainid != expectedChainId) {
            revert WrongChain(block.chainid, expectedChainId);
        }
        if (factoryOwner == address(0) || treasuryOwner == address(0)) {
            revert ZeroOwner();
        }
        if (feeRate != APPROVED_FEE_RATE || feeDenominator != APPROVED_FEE_DENOMINATOR) {
            revert UnapprovedFee();
        }

        vm.startBroadcast();
        FeeTreasury treasury = new FeeTreasury(treasuryOwner, payout, usdg);
        EscrowFactory factory = new EscrowFactory(factoryOwner, feeRate, feeDenominator, address(treasury), usdg);
        vm.stopBroadcast();
        return (address(treasury), address(factory));
    }
}
