// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.36;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

library ExactTransfers {
    using SafeERC20 for IERC20;

    error ExactAmountMismatch();
    error EthTransferFailed();

    function transferExact(IERC20 token, address to, uint256 amount) internal {
        if (amount == 0) {
            return;
        }
        uint256 beforeBal = token.balanceOf(address(this));
        token.safeTransfer(to, amount);
        if (beforeBal - token.balanceOf(address(this)) != amount) {
            revert ExactAmountMismatch();
        }
    }

    function transferFromExact(IERC20 token, address from, address to, uint256 amount) internal {
        uint256 beforeBal = token.balanceOf(to);
        token.safeTransferFrom(from, to, amount);
        if (token.balanceOf(to) - beforeBal != amount) {
            revert ExactAmountMismatch();
        }
    }

    function sendEth(address to, uint256 amount) internal {
        if (amount == 0) {
            return;
        }
        (bool ok,) = to.call{value: amount}("");
        if (!ok) {
            revert EthTransferFailed();
        }
    }
}
