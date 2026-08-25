// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.36;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {DealTerms} from "./DealTerms.sol";
import {IEscrowFactoryView} from "./interfaces/IEscrowFactoryView.sol";
import {ExactTransfers} from "./libraries/ExactTransfers.sol";

contract Escrow is ReentrancyGuard {
    enum State {
        CREATED,
        OPEN,
        SETTLED,
        CANCELLED
    }

    address public immutable factory;
    address public immutable seller;
    address public immutable baseToken;
    address public immutable quoteToken;
    uint256 public immutable baseAmount;
    uint256 public immutable quoteAmount;
    address public immutable allowedPayer;
    uint256 public immutable expiry;
    uint256 public immutable feeRate;
    uint256 public immutable feeDenominator;
    address public immutable feeTreasury;
    uint256 public immutable feeAmount;

    State public state;
    uint256 private immutable _baseBalanceAtConstruct;

    error InvalidSeller();
    error InvalidBaseToken();
    error InvalidQuoteToken();
    error InvalidFeeTreasury();
    error InvalidFee();
    error ZeroAmount();
    error ExpiryInPast();
    error NativeValueNotAccepted();
    error FactoryPaused();
    error NotFactory();
    error InvalidState();
    error ExactAmountMismatch();
    error NotSeller();
    error NotPayer();
    error Expired();
    error InvalidTo();
    error WrongQuotePath();
    error InvalidQuoteValue();
    error NotFactoryOwner();
    error InvalidRescueDest();
    error ZeroRescueAmount();
    error UsdGRecipientMismatch();

    event Activated();
    event Settled(address indexed payer, address indexed to, uint256 baseOut, uint256 proceeds, uint256 fee);
    event Cancelled(address indexed seller, uint256 baseOut);
    event Rescued(address indexed token, address indexed to, uint256 amount);

    constructor(DealTerms memory terms) {
        address self = address(this);
        if (terms.seller == address(0) || terms.seller == self) {
            revert InvalidSeller();
        }
        if (terms.baseToken == address(0) || terms.baseToken == self || terms.baseToken.code.length == 0) {
            revert InvalidBaseToken();
        }
        if (terms.quoteToken != address(0) && terms.quoteToken.code.length == 0) {
            revert InvalidQuoteToken();
        }
        if (terms.baseToken == terms.quoteToken) {
            revert InvalidBaseToken();
        }
        try IEscrowFactoryView(msg.sender).usdg() returns (address pin) {
            if (pin != address(0) && terms.baseToken == pin) {
                revert InvalidBaseToken();
            }
        } catch {}
        if (terms.baseAmount == 0 || terms.quoteAmount == 0) {
            revert ZeroAmount();
        }
        if (terms.expiry <= block.timestamp) {
            revert ExpiryInPast();
        }
        if (terms.feeDenominator == 0 || terms.feeRate > terms.feeDenominator) {
            revert InvalidFee();
        }
        if (terms.feeTreasury == address(0) || terms.feeTreasury == self) {
            revert InvalidFeeTreasury();
        }

        factory = msg.sender;
        seller = terms.seller;
        baseToken = terms.baseToken;
        quoteToken = terms.quoteToken;
        baseAmount = terms.baseAmount;
        quoteAmount = terms.quoteAmount;
        allowedPayer = terms.allowedPayer;
        expiry = terms.expiry;
        feeRate = terms.feeRate;
        feeDenominator = terms.feeDenominator;
        feeTreasury = terms.feeTreasury;
        feeAmount = Math.mulDiv(terms.quoteAmount, terms.feeRate, terms.feeDenominator, Math.Rounding.Floor);
        _baseBalanceAtConstruct = IERC20(terms.baseToken).balanceOf(self);
        state = State.CREATED;
    }

    receive() external payable {
        revert NativeValueNotAccepted();
    }

    fallback() external payable {
        revert NativeValueNotAccepted();
    }

    function accountedBase() public view returns (uint256) {
        if (state == State.OPEN) {
            return baseAmount;
        }
        return 0;
    }

    function activate() external nonReentrant {
        _requireFactoryNotPaused();
        if (msg.sender != factory) {
            revert NotFactory();
        }
        if (state != State.CREATED) {
            revert InvalidState();
        }
        uint256 current = IERC20(baseToken).balanceOf(address(this));
        if (current - _baseBalanceAtConstruct != baseAmount) {
            revert ExactAmountMismatch();
        }
        state = State.OPEN;
        emit Activated();
    }

    function settleEth(address to) external payable nonReentrant {
        _prepareSettle(to);
        if (quoteToken != address(0)) {
            revert WrongQuotePath();
        }
        if (msg.value != quoteAmount) {
            revert InvalidQuoteValue();
        }
        uint256 fee = feeAmount;
        uint256 proceeds = quoteAmount - fee;
        state = State.SETTLED;
        ExactTransfers.transferExact(IERC20(baseToken), to, baseAmount);
        ExactTransfers.sendEth(seller, proceeds);
        ExactTransfers.sendEth(feeTreasury, fee);
        emit Settled(msg.sender, to, baseAmount, proceeds, fee);
    }

    function settleUsdg(address to) external nonReentrant {
        _prepareSettle(to);
        if (quoteToken == address(0)) {
            revert WrongQuotePath();
        }
        uint256 fee = feeAmount;
        uint256 proceeds = quoteAmount - fee;
        IERC20 usdg = IERC20(quoteToken);
        state = State.SETTLED;
        uint256 sellerBefore = usdg.balanceOf(seller);
        uint256 treasuryBefore = usdg.balanceOf(feeTreasury);
        ExactTransfers.transferFromExact(usdg, msg.sender, address(this), quoteAmount);
        ExactTransfers.transferExact(IERC20(baseToken), to, baseAmount);
        ExactTransfers.transferExact(usdg, seller, proceeds);
        ExactTransfers.transferExact(usdg, feeTreasury, fee);
        if (usdg.balanceOf(seller) - sellerBefore != proceeds) {
            revert UsdGRecipientMismatch();
        }
        if (usdg.balanceOf(feeTreasury) - treasuryBefore != fee) {
            revert UsdGRecipientMismatch();
        }
        emit Settled(msg.sender, to, baseAmount, proceeds, fee);
    }

    function cancel() external nonReentrant {
        _requireFactoryNotPaused();
        if (msg.sender != seller) {
            revert NotSeller();
        }
        if (state != State.OPEN) {
            revert InvalidState();
        }
        state = State.CANCELLED;
        ExactTransfers.transferExact(IERC20(baseToken), seller, baseAmount);
        emit Cancelled(seller, baseAmount);
    }

    function rescue(address token, address to) external nonReentrant {
        _requireFactoryNotPaused();
        if (msg.sender != IEscrowFactoryView(factory).owner()) {
            revert NotFactoryOwner();
        }
        if (state != State.SETTLED && state != State.CANCELLED) {
            revert InvalidState();
        }
        if (to == address(0) || to == address(this)) {
            revert InvalidRescueDest();
        }
        uint256 amount;
        if (token == address(0)) {
            amount = address(this).balance;
            if (amount == 0) {
                revert ZeroRescueAmount();
            }
            ExactTransfers.sendEth(to, amount);
        } else {
            amount = IERC20(token).balanceOf(address(this));
            if (amount == 0) {
                revert ZeroRescueAmount();
            }
            ExactTransfers.transferExact(IERC20(token), to, amount);
        }
        emit Rescued(token, to, amount);
    }

    function _prepareSettle(address to) private view {
        _requireFactoryNotPaused();
        if (state != State.OPEN) {
            revert InvalidState();
        }
        if (block.timestamp >= expiry) {
            revert Expired();
        }
        if (allowedPayer != address(0) && msg.sender != allowedPayer) {
            revert NotPayer();
        }
        if (to == address(0) || to == address(this)) {
            revert InvalidTo();
        }
    }

    function _requireFactoryNotPaused() private view {
        if (IEscrowFactoryView(factory).paused()) {
            revert FactoryPaused();
        }
    }
}
