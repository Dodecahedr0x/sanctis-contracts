// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

interface ISpaceCredits is IERC20Metadata {
    function mint(address to, uint256 amount) external;
}
