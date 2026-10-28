// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IJuryRegistry {
    event JurorRegistered(address indexed juror, string name);
    event JurorRevoked(address indexed juror);

    function isRegisteredJuror(address juror) external view returns (bool);
    function jurorCount() external view returns (uint256);
    function getJurors() external view returns (address[] memory);
    function registerJuror(address juror, string calldata name) external;
    function revokeJuror(address juror) external;
}
