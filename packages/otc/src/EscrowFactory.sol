// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.36;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {DealTerms} from "./DealTerms.sol";
import {Escrow} from "./Escrow.sol";
import {FeeTreasury} from "./FeeTreasury.sol";
import {ExactTransfers} from "./libraries/ExactTransfers.sol";

contract EscrowFactory is Ownable, Pausable, ReentrancyGuard {
    address public immutable usdg;
    address public immutable feeTreasury;
    uint256 public immutable feeRate;
    uint256 public immutable feeDenominator;

    error InvalidFee();
    error InvalidFeeTreasury();
    error InvalidUsdg();
    error InvalidBaseToken();
    error InvalidQuoteToken();
    error ZeroAmount();
    error ExpiryInPast();
    error NativeValueNotAccepted();
    error UsdgMismatch();

    event EscrowCreated(
        address indexed seller,
        address indexed escrow,
        address baseToken,
        address quoteToken,
        uint256 baseAmount,
        uint256 quoteAmount,
        uint256 expiry,
        bool open,
        uint256 feeRate,
        uint256 feeDenominator,
        uint256 feeAmount,
        address allowedPayer
    );

    constructor(address initialOwner, uint256 feeRate_, uint256 feeDenominator_, address feeTreasury_, address usdg_)
        Ownable(initialOwner)
    {
        if (feeDenominator_ == 0 || feeRate_ > feeDenominator_) {
            revert InvalidFee();
        }
        if (feeTreasury_ == address(0) || feeTreasury_ == address(this)) {
            revert InvalidFeeTreasury();
        }
        if (feeTreasury_.code.length == 0) {
            revert InvalidFeeTreasury();
        }
        if (usdg_ == address(0) || usdg_.code.length == 0) {
            revert InvalidUsdg();
        }
        if (FeeTreasury(payable(feeTreasury_)).usdg() != usdg_) {
            revert UsdgMismatch();
        }
        feeRate = feeRate_;
        feeDenominator = feeDenominator_;
        feeTreasury = feeTreasury_;
        usdg = usdg_;
    }

    receive() external payable {
        revert NativeValueNotAccepted();
    }

    fallback() external payable {
        revert NativeValueNotAccepted();
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function create(
        address baseToken,
        address quoteToken,
        uint256 baseAmount,
        uint256 quoteAmount,
        address allowedPayer,
        uint256 expiry
    ) external nonReentrant whenNotPaused returns (address escrow) {
        if (baseToken == address(0) || baseToken.code.length == 0) {
            revert InvalidBaseToken();
        }
        if (baseToken == usdg || baseToken == quoteToken) {
            revert InvalidBaseToken();
        }
        if (quoteToken != address(0) && quoteToken != usdg) {
            revert InvalidQuoteToken();
        }
        if (baseAmount == 0 || quoteAmount == 0) {
            revert ZeroAmount();
        }
        if (expiry <= block.timestamp) {
            revert ExpiryInPast();
        }

        uint256 feeAmount = Math.mulDiv(quoteAmount, feeRate, feeDenominator, Math.Rounding.Floor);
        DealTerms memory terms = DealTerms({
            seller: msg.sender,
            baseToken: baseToken,
            quoteToken: quoteToken,
            baseAmount: baseAmount,
            quoteAmount: quoteAmount,
            allowedPayer: allowedPayer,
            expiry: expiry,
            feeRate: feeRate,
            feeDenominator: feeDenominator,
            feeTreasury: feeTreasury
        });
        Escrow instance = new Escrow(terms);
        escrow = address(instance);
        ExactTransfers.transferFromExact(IERC20(baseToken), msg.sender, escrow, baseAmount);
        instance.activate();
        emit EscrowCreated(
            msg.sender,
            escrow,
            baseToken,
            quoteToken,
            baseAmount,
            quoteAmount,
            expiry,
            allowedPayer == address(0),
            feeRate,
            feeDenominator,
            feeAmount,
            allowedPayer
        );
    }
}
