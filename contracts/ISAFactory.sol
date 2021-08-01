//SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import {ISA, ISuperfluid, IConstantFlowAgreementV1, ISuperToken} from "./ISA.sol";

contract ISAFactory {
    address[] public deployedISAs;

    function createISA(
        ISuperfluid host,
        IConstantFlowAgreementV1 cfa,
        ISuperToken acceptedToken,
        address payable student,
        address payable lender,
        address payable institute,
        int96 thresholdSalary,
        uint256 totalTime,
        int96 rate
    ) public {
        assert(address(host) != address(0));
        assert(address(cfa) != address(0));
        assert(address(acceptedToken) != address(0));
        assert(address(student) != address(0));
        assert(address(lender) != address(0));
        // Rate to lender can be between (10-80)%
        assert(rate > 10 && rate < 80);
        //assert(!_host.isApp(ISuperApp(student)));
        assert(totalTime > 0 && totalTime <= 63072000);

        address newISA = address(
            new ISA(
                host,
                cfa,
                acceptedToken,
                student,
                lender,
                institute,
                thresholdSalary,
                totalTime,
                rate
            )
        );

        deployedISAs.push(newISA);
    }

    function getDeployedISAs() public view returns (address[] memory) {
        return deployedISAs;
    }
}
