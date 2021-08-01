// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import {
    ISuperfluid,
    ISuperToken,
    ISuperApp,
    ISuperAgreement,
    SuperAppDefinitions
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";//"@superfluid-finance/ethereum-monorepo/packages/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

import {
    IConstantFlowAgreementV1
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";

import {
    SuperAppBase
} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";
contract ISA is SuperAppBase {

    ISuperfluid private _host; // host
    IConstantFlowAgreementV1 private _cfa; // the stored constant flow agreement class address
    ISuperToken private _acceptedToken; // accepted token
    address payable _student;
    address payable _lender;
    address payable _institute;
    int96 private _rate;
    int96 private _lenderRate;
    int96 private _studentRate;

    int96 private _threholdSalaryFlowRate;
    
    bool _isTradeable;
    uint _tradePrice;
    
    // The below vars are used in context of lender
    uint _totalTime;
    uint _timeUnitPaid;
   
    
    mapping (address => bool) _approval;
    

    constructor(
        ISuperfluid host,
        IConstantFlowAgreementV1 cfa,
        ISuperToken acceptedToken,
        address payable student, 
        address payable lender, 
        address payable institute,
        int96 thresholdSalary,
        uint totalTime,
        int96 rate) {
        assert(address(host) != address(0));
        assert(address(cfa) != address(0));
        assert(address(acceptedToken) != address(0));
        assert(address(student) != address(0));
        assert(address(lender) != address(0));
        // Rate to lender can be between (10-80)%
        assert(rate > 10 && rate < 80);
        //assert(!_host.isApp(ISuperApp(student)));
       assert(totalTime > 0 && totalTime <= 63072000);

        _host = host;
        _cfa = cfa;
        _acceptedToken = acceptedToken;
        _student = student;
        _lender = lender;
        _rate = rate;
        _institute = institute;
        _threholdSalaryFlowRate = thresholdSalary;
        _isTradeable = false;
        _timeUnitPaid = 0;
        // @dev ttotalTime is in seconds
        _totalTime = totalTime;
        
      

        uint256 configWord =
            SuperAppDefinitions.APP_LEVEL_FINAL |
            SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_UPDATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_TERMINATED_NOOP;

        _host.registerApp(configWord);
    }


    /**************************************************************************
     * Redirect Logic
     *************************************************************************/
     
    function contractParties() external view 
        returns (
            address student,
            address lender,
            address institute
        )
    {
        student = _student;
        lender = _lender;
        institute = _institute;
    }
    
    function contractRates() external view
        returns (
            int96 distributionRate,
            int96 thresholdSalary,
            ISuperToken acceptedToken,
            bool isTradeable,
            uint tradePrice
        )
    {
        distributionRate = _rate;
        thresholdSalary = _threholdSalaryFlowRate;
        acceptedToken = _acceptedToken;
        isTradeable = _isTradeable;
        tradePrice = _tradePrice;
    }
    
    function contractFlows() external view 
        returns (
            int96 studentflowRate,
            int96 lenderflowRate,
            int96 netFlowISA
        )
    {
        (, studentflowRate,,) = _cfa.getFlow(_acceptedToken, address(this), _student);
        (, lenderflowRate,,) = _cfa.getFlow(_acceptedToken, address(this), _lender);
        netFlowISA = _cfa.getNetFlow(_acceptedToken, address(this));
    }
    
    function contractBalances() external view
        returns (
            uint totalTime,
            uint timeUnitPaid,
            int96 currentStudentRate,
            int96 currentLenderRate
        )
    {
        totalTime = _totalTime;
        timeUnitPaid = _timeUnitPaid;
        // These below are flowrate in wei per sec.
        currentStudentRate = _studentRate;
        currentLenderRate = _lenderRate;
    }

    function currentState()
        external view
        returns (
            uint256 startTimeStudent,
            uint256 startTimeLender,
            address student,
            address lender,
            int96 studentflowRate,
            int96 lenderflowRate,
            int96 netFlowISA,
            int96 distributionRate,
            int96 thresholdSalary,
            address institute,
            uint256 balance,
            bool isTradeable,
            uint totalTime,
            uint timeUnitPaid
        )
    {
        if (_student != address(0)) {
            (startTimeStudent, studentflowRate,,) = _cfa.getFlow(_acceptedToken, address(this), _student);
            (startTimeLender, lenderflowRate,,) = _cfa.getFlow(_acceptedToken, address(this), _lender);
            netFlowISA = _cfa.getNetFlow(_acceptedToken, address(this));
            student = _student;
            lender = _lender;
            distributionRate = _rate;
            thresholdSalary = _threholdSalaryFlowRate;
            institute = _institute;
            balance = address(this).balance;
            isTradeable = _isTradeable;
            totalTime = _totalTime;
            timeUnitPaid = _timeUnitPaid;
        }
    }
    
    receive() external payable { 
        if(msg.sender != _lender){
            require(_isTradeable, "This contract is not Tradeable yet.");
       
            require(msg.value == _tradePrice, "Not Exact moeny Provided");
            _lender.transfer(_tradePrice);
            _lender = msg.sender;
        } else {
            require(msg.value == 1 ether, "Only 1 ether can be sent to this contract");
        }
    }
    
    
    function approve() external {
        require(msg.sender == _student, "Only Student can approve Institute.");
        _approval[_institute] = true;
    }
    
    function withdraw() payable external {
        require(msg.sender == _institute, "Only Institute can withdraw money!!");
        require(_approval[msg.sender], "withdraw yet not approved by student");
        _institute.transfer(1 ether);
    }
    
    // Function to set Tradeable Flags
    function setTradeable(bool isTradeable) external {
        require(msg.sender == _lender, "Only lender can make it tradeable");
        
        _isTradeable = isTradeable;
    }
    
    function setTradePrice(uint price) external {
         require(msg.sender == _lender, "Only lender can make it tradeable");
        if(_tradePrice == price) return;
        _tradePrice = price;
    }
    

    function _lenderFlowExists() internal view returns (bool) {
        (uint timestamp, int96 flow, , ) = _cfa.getFlow(
            _acceptedToken,
            address(this),
            _lender
          );
        if(timestamp > 0){
            return true;
        }
        if(flow > 0) {
            return true;
        }
        return false;
    }

    /// @dev If a new stream is opened, or an existing one is opened
    function _updateOutflow(bytes calldata ctx) 
        private
        returns (bytes memory newCtx)
    {
      newCtx = ctx;
      // @dev This will give me the new flowRate, as it is called in after callbacks
      // Get here the net flow into this contract
      int96 netFlowRate = _cfa.getNetFlow(_acceptedToken, address(this));
      (,int96 outFlowRateStudent,,) = _cfa.getFlow(_acceptedToken, address(this), _student);
      (uint lenderStartTime, int96 outFlowRateLender,,) = _cfa.getFlow(_acceptedToken, address(this), _lender);
      
      int96 outflowRate = outFlowRateStudent + outFlowRateLender;
      int96 inFlowRate = netFlowRate + outFlowRateStudent + outFlowRateLender;
      if (inFlowRate < 0 ) inFlowRate = -inFlowRate; // Fixes issue when inFlowRate is negative
      
      // @dev add thresholdSalary logic in this function
      
      if(inFlowRate < _threholdSalaryFlowRate) {
          _lenderRate = int96(0);
          _studentRate = inFlowRate;
      } else {
        _lenderRate = (inFlowRate/int96(100))*_rate;
        _studentRate = inFlowRate - _lenderRate;
      }

      // @dev If inFlowRate === 0, then delete existing flow.
      if (inFlowRate <= int96(0)) {
        // If inflow goes to zero delete CFAs
        // @dev if inFlowRate is zero or negative, delete outflow.
          (newCtx, ) = _host.callAgreementWithContext(
              _cfa,
              abi.encodeWithSelector(
                  _cfa.deleteFlow.selector,
                  _acceptedToken,
                  address(this),
                  _student,
                  new bytes(0) // placeholder
              ),
              "0x",
              newCtx
          );
          
          // @dev update the time unit paid
          if(_lenderFlowExists()){
            _timeUnitPaid = _timeUnitPaid + uint(block.timestamp - lenderStartTime);
          }
          
          // @dev check if already have a flow to lender
          if(_lenderFlowExists()){
              (newCtx, ) = _host.callAgreementWithContext(
                  _cfa,
                  abi.encodeWithSelector(
                      _cfa.deleteFlow.selector,
                      _acceptedToken,
                      address(this),
                      _lender,
                      new bytes(0) // placeholder
                  ),
                  "0x",
                  newCtx
              );
          }
          
          
          
      } else if (outflowRate != int96(0)){
        (newCtx, ) = _host.callAgreementWithContext(
            _cfa,
            abi.encodeWithSelector(
                _cfa.updateFlow.selector,
                _acceptedToken,
                _student,
                _studentRate,
                new bytes(0) // placeholder
            ),
            "0x",
            newCtx
        );
        if(inFlowRate > _threholdSalaryFlowRate){
            if(_lenderFlowExists()) {
                (newCtx, ) = _host.callAgreementWithContext(
                    _cfa,
                    abi.encodeWithSelector(
                        _cfa.updateFlow.selector,
                        _acceptedToken,
                        _lender,
                       _lenderRate,
                        new bytes(0) // placeholder
                    ),
                    "0x",
                    newCtx
                );
            } else {
                (newCtx, ) = _host.callAgreementWithContext(
                      _cfa,
                      abi.encodeWithSelector(
                          _cfa.createFlow.selector,
                          _acceptedToken,
                          _lender,
                          _lenderRate,
                          new bytes(0) // placeholder
                      ),
                      "0x",
                      newCtx
                  );
            }
        } else {
            if(_lenderFlowExists()) {
                 // Update Time for which it is paid
                 _timeUnitPaid = _timeUnitPaid + uint(block.timestamp - lenderStartTime);
                 
                (newCtx, ) = _host.callAgreementWithContext(
                  _cfa,
                  abi.encodeWithSelector(
                      _cfa.deleteFlow.selector,
                      _acceptedToken,
                      address(this),
                      _lender,
                      new bytes(0) // placeholder
                  ),
                  "0x",
                  newCtx
              );
            }
        }
        
      } else {
      // @dev If there is no existing outflow, then create new flow to equal inflow
          (newCtx, ) = _host.callAgreementWithContext(
              _cfa,
              abi.encodeWithSelector(
                  _cfa.createFlow.selector,
                  _acceptedToken,
                  _student,
                  _studentRate,
                  new bytes(0) // placeholder
              ),
              "0x",
              newCtx
          );
          if(inFlowRate > _threholdSalaryFlowRate){
              
               (newCtx, ) = _host.callAgreementWithContext(
                      _cfa,
                      abi.encodeWithSelector(
                          _cfa.createFlow.selector,
                          _acceptedToken,
                          _lender,
                          _lenderRate,
                          new bytes(0) // placeholder
                      ),
                      "0x",
                      newCtx
                  );
             
          }
          
      }
    }
    
    // Make bottom logic to be tradable from lender perspective (Lender can transfer stream to someone else)
    
    event lenderChanged(address lender); //what is this?

    // @dev Change the student of the total flow
    function changeReciever( address payable newLender ) public {
        // @dev When Changing Reciever only lender needs to be changes. 
        require(msg.sender == _lender, "Only lender can sell this ISA");
        require(_lender != _student, "Student can't be lender");
        require(newLender != address(0), "New lender is zero address");
        // @dev because our app is registered as final, we can't take downstream apps
        require(!_host.isApp(ISuperApp(newLender)), "New lender can not be a superApp");
        if (newLender == _lender) return ;
        
       
        
        // If Lender flow already exists then only need to change CFA Agreement from ISA -> lender
        if(_lenderFlowExists()){
            (uint lenderStartTime, int96 outFlowRateLender,,) = _cfa.getFlow(_acceptedToken, address(this), _lender);
            
             // If lender already exists then count it as paid by student
            _timeUnitPaid = _timeUnitPaid + uint(block.timestamp - lenderStartTime);
            
            // Delete Old flow
            _host.callAgreement(
                _cfa,
                abi.encodeWithSelector(
                    _cfa.deleteFlow.selector,
                    _acceptedToken,
                    address(this),
                    _lender,
                    new bytes(0)
                ),
                "0x"
            );
            
            // Create New Lender's flow
            _host.callAgreement(
                _cfa,
                abi.encodeWithSelector(
                    _cfa.createFlow.selector,
                    _acceptedToken,
                    newLender,
                    outFlowRateLender,
                    new bytes(0)
                ),
                "0x"
            );
        }
      
       
        // @dev set global lender to new lender
        _lender = newLender;

        emit lenderChanged(_lender);
    }

    /**************************************************************************
     * SuperApp callbacks
     *************************************************************************/

    function afterAgreementCreated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32, // _agreementId,
        bytes calldata /*_agreementData*/,
        bytes calldata ,// _cbdata,
        bytes calldata _ctx
    )
        external override
        onlyExpected(_superToken, _agreementClass)
        onlyHost
        returns (bytes memory newCtx)
    {
        return _updateOutflow(_ctx);
    }

    function afterAgreementUpdated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32 ,//_agreementId,
        bytes calldata /*_agreementData*/,
        bytes calldata ,//_cbdata,
        bytes calldata _ctx
    )
        external override
        onlyExpected(_superToken, _agreementClass)
        onlyHost
        returns (bytes memory newCtx)
    {
        return _updateOutflow(_ctx);
    }

    function afterAgreementTerminated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32 ,//_agreementId,
        bytes calldata /*_agreementData*/,
        bytes calldata ,//_cbdata,
        bytes calldata _ctx
    )
        external override
        onlyHost
        returns (bytes memory newCtx)
    {
        // According to the app basic law, we should never revert in a termination callback
        if (!_isSameToken(_superToken) || !_isCFAv1(_agreementClass)) return _ctx;
        return _updateOutflow(_ctx);
    }

    function _isSameToken(ISuperToken superToken) private view returns (bool) {
        return address(superToken) == address(_acceptedToken);
    }

    function _isCFAv1(address agreementClass) private view returns (bool) {
        return ISuperAgreement(agreementClass).agreementType()
            == keccak256("org.superfluid-finance.agreements.ConstantFlowAgreement.v1");
    }

    modifier onlyHost() {
        require(msg.sender == address(_host), "ISA: support only one host");
        _;
    }

    modifier onlyExpected(ISuperToken superToken, address agreementClass) {
        require(_isSameToken(superToken), "ISA: not accepted token");
        require(_isCFAv1(agreementClass), "ISA: only CFAv1 supported");
        _;
    }

}