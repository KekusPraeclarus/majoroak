// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.36;

struct DealTerms {
    address seller;
    address baseToken;
    address quoteToken;
    uint256 baseAmount;
    uint256 quoteAmount;
    address allowedPayer;
    uint256 expiry;
    uint256 feeRate;
    uint256 feeDenominator;
    address feeTreasury;
}
