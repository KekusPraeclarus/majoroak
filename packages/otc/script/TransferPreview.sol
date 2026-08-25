// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.36;

// The official UI injects this runtime with an eth_call state override. Do not deploy it.
interface IERC20Lite {
    function balanceOf(address account) external view returns (uint256);
}

interface IFactoryLite {
    function create(
        address baseToken,
        address quoteToken,
        uint256 baseAmount,
        uint256 quoteAmount,
        address allowedPayer,
        uint256 expiry
    ) external returns (address escrow);
}

interface IEscrowLite {
    function cancel() external;

    function settleEth(address to) external payable;

    function settleUsdg(address to) external;
}

contract TransferPreview {
    receive() external payable {}

    function previewCreateReturn(
        address factory,
        address baseToken,
        address quoteToken,
        uint256 baseAmount,
        uint256 quoteAmount,
        address allowedPayer,
        uint256 expiry
    ) external returns (uint256 returned) {
        address escrow = IFactoryLite(factory)
            .create(baseToken, quoteToken, baseAmount, quoteAmount, allowedPayer, expiry);
        uint256 beforeBal = IERC20Lite(baseToken).balanceOf(msg.sender);
        IEscrowLite(escrow).cancel();
        return _delta(IERC20Lite(baseToken).balanceOf(msg.sender), beforeBal);
    }

    function previewSettleEth(address escrow, address to, address baseToken)
        external
        payable
        returns (uint256 received)
    {
        uint256 beforeBal = IERC20Lite(baseToken).balanceOf(to);
        IEscrowLite(escrow).settleEth{value: msg.value}(to);
        return _delta(IERC20Lite(baseToken).balanceOf(to), beforeBal);
    }

    function previewSettleUsdg(address escrow, address to, address baseToken) external returns (uint256 received) {
        uint256 beforeBal = IERC20Lite(baseToken).balanceOf(to);
        IEscrowLite(escrow).settleUsdg(to);
        return _delta(IERC20Lite(baseToken).balanceOf(to), beforeBal);
    }

    function previewCancel(address escrow, address recipient, address baseToken) external returns (uint256 received) {
        uint256 beforeBal = IERC20Lite(baseToken).balanceOf(recipient);
        IEscrowLite(escrow).cancel();
        return _delta(IERC20Lite(baseToken).balanceOf(recipient), beforeBal);
    }

    function _delta(uint256 afterBal, uint256 beforeBal) private pure returns (uint256) {
        return afterBal > beforeBal ? afterBal - beforeBal : 0;
    }
}
