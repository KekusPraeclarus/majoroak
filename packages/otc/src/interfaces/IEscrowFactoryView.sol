// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.36;

interface IEscrowFactoryView {
    function paused() external view returns (bool);

    function owner() external view returns (address);

    function usdg() external view returns (address);
}
