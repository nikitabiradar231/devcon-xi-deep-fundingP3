// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IJuryRegistry.sol";

contract JuryRegistry is Ownable, IJuryRegistry {
    struct JurorInfo {
        string name;
        bool active;
        uint256 registeredAt;
    }

    mapping(address => JurorInfo) public jurors;
    address[] public jurorList;
    uint256 public activeJurorCount;

    error InvalidJurorAddress();
    error EmptyJurorName();
    error JurorAlreadyRegistered();
    error JurorNotRegistered();

    constructor(address initialOwner) Ownable(initialOwner) {}

    function registerJuror(address juror, string calldata name) external override onlyOwner {
        if (juror == address(0)) revert InvalidJurorAddress();
        if (bytes(name).length == 0) revert EmptyJurorName();
        if (jurors[juror].active) revert JurorAlreadyRegistered();

        if (jurors[juror].registeredAt == 0) {
            jurorList.push(juror);
        }

        jurors[juror] = JurorInfo({
            name: name,
            active: true,
            registeredAt: block.timestamp
        });
        activeJurorCount++;

        emit JurorRegistered(juror, name);
    }

    function registerJurorsBatch(
        address[] calldata jurorAddresses,
        string[] calldata names
    ) external onlyOwner {
        require(jurorAddresses.length == names.length, "Mismatched arrays");
        for (uint256 i = 0; i < jurorAddresses.length; i++) {
            address juror = jurorAddresses[i];
            string calldata name = names[i];

            if (juror == address(0)) revert InvalidJurorAddress();
            if (bytes(name).length == 0) revert EmptyJurorName();
            if (!jurors[juror].active) {
                if (jurors[juror].registeredAt == 0) {
                    jurorList.push(juror);
                }
                jurors[juror] = JurorInfo({
                    name: name,
                    active: true,
                    registeredAt: block.timestamp
                });
                activeJurorCount++;
                emit JurorRegistered(juror, name);
            }
        }
    }

    function revokeJuror(address juror) external override onlyOwner {
        if (!jurors[juror].active) revert JurorNotRegistered();

        jurors[juror].active = false;
        activeJurorCount--;

        emit JurorRevoked(juror);
    }

    function isRegisteredJuror(address juror) external view override returns (bool) {
        return jurors[juror].active;
    }

    function jurorCount() external view override returns (uint256) {
        return activeJurorCount;
    }

    function totalRegisteredHistorical() external view returns (uint256) {
        return jurorList.length;
    }

    function getJurors() external view override returns (address[] memory) {
        return jurorList;
    }
}
