// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.36;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {ExactTransfers} from "./libraries/ExactTransfers.sol";

contract FeeTreasury is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public immutable usdg;

    address public payout;

    error InvalidPayout();
    error InvalidUsdg();
    error NotUsdg();
    error ZeroBalance();

    event PayoutSet(address indexed payout);
    event Released(address indexed token, address indexed to, uint256 amount);
    event ReleasedEth(address indexed to, uint256 amount);

    constructor(address initialOwner, address payout_, address usdg_) Ownable(initialOwner) {
        if (usdg_ == address(0) || usdg_.code.length == 0) {
            revert InvalidUsdg();
        }
        _setPayout(payout_);
        usdg = usdg_;
    }

    receive() external payable {}

    function setPayout(address payout_) external onlyOwner {
        _setPayout(payout_);
    }

    function release(IERC20 token) external nonReentrant {
        if (address(token) != usdg) {
            revert NotUsdg();
        }
        _releaseUsdg();
    }

    function releaseEth() external nonReentrant {
        _releaseEth();
    }

    function releaseBoth() external nonReentrant {
        _releaseUsdg();
        _releaseEth();
    }

    function _releaseUsdg() private {
        IERC20 token = IERC20(usdg);
        uint256 amount = token.balanceOf(address(this));
        if (amount == 0) {
            revert ZeroBalance();
        }
        address to = payout;
        token.safeTransfer(to, amount);
        emit Released(address(token), to, amount);
    }

    function _releaseEth() private {
        uint256 amount = address(this).balance;
        if (amount == 0) {
            revert ZeroBalance();
        }
        address to = payout;
        ExactTransfers.sendEth(to, amount);
        emit ReleasedEth(to, amount);
    }

    function _setPayout(address payout_) private {
        if (payout_ == address(0) || payout_ == address(this)) {
            revert InvalidPayout();
        }
        payout = payout_;
        emit PayoutSet(payout_);
    }
}
