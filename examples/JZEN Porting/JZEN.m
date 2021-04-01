%{
 *  JZEN Virtual Machine in Matlab
 *  Limitation: assignment to variables needs to be done via jsen_assign()
 *
 *  Copyright (c) Honda Research Institute Europe GmbH
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are
 *  met:
 *
 *  1. Redistributions of source code must retain the above copyright notice,
 *     this list of conditions and the following disclaimer.
 *
 *  2. Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 *  3. Neither the name of the copyright holder nor the names of its
 *     contributors may be used to endorse or promote products derived from
 *     this software without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 *  IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 *  THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 *  PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
 *  CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 *  PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 *  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 *  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
%}


function JZEN()
  global i;
  
  i = 1;
  testCode = {
    @() disp( 'Start' ),
    jsen_if( @() i == 1 ),
      jsen_print( 'Condition true' ),
    jsen_assign( 'i', @() i+1 ),
    jsen_if( @() i == 0 ),
      jsen_print( 'i is still 0' ),
    jsen_if( @() i == 1 ),
      jsen_print( 'i is now 1' ),
    @() disp( 'End' ),
  };
  
  testComment = {
    @() disp( 'Start' ),
    @() disp( 'Line 1' ),
    'this is a comment',
    @() disp( 'Line 2' ),
    @() disp( 'End' ),
  };
  
  testBlock = {
    jsen_print( 'Start' ),
    jsen_print( 'first line' ),
    {
      jsen_print( 'inside block 1' ),
      jsen_print( 'inside block 2' ),
      jsen_print( 'inside block 3' ),
    },
    jsen_print( 'second line' ),
    jsen_print( 'End' ),
  };

  testPrint = {
    jsen_print( 'Start' ),
    jsen_print( 'Line 1' ),
    jsen_print( 'Line 2' ),
    jsen_print( 'Line 3' ),
    jsen_print( 'End' ),
  };
  
  testIf = {
    @() disp( 'Start' ),
    jsen_if( @() i == 0 ),
      jsen_print( 'i is still 0' ),
    jsen_if( @() i == 1 ),
      jsen_print( 'i is now 1' ),
    @() disp( 'End' ),
  };

  testLabel = {
    jsen_print( 'Start' ),
    jsen_print( 'Before label' ),
    jsen_label( 'loop' ),
    jsen_print( 'After label' ),
    jsen_print( 'End' ),
  };

  testAssignment = {
    @() disp( 'Start' ),
    @() disp( [ 'Value of i = ', num2str( i ) ] ),
    jsen_assign( 'i', @() 5 ),
    @() disp( [ 'Value of i = ', num2str( i ) ] ),
    @() disp( 'End' ),
  };

  testGoto = {
    jsen_print( 'Start' ),
    jsen_print( 'Before loop' ),
    jsen_label( 'loop' ),
      jsen_assign( 'i', @() i+1 ),
      @() disp( [ 'i = ', num2str( i ) ] ),
      jsen_if( @() i < 10 ),
        jsen_goto( 'loop' ),
    jsen_print( 'After loop' ),
    jsen_print( 'End' ),
  };

  testSleep = {
    jsen_print( 'Start' ),
    jsen_print( 'Now sleep for 2 seconds' ),
    jsen_sleep( 2 ),
    jsen_print( 'Woken up' ),
    jsen_print( 'End' ),
  };
  
  JZEN_run( testSleep );
end

function JZEN_run( jzenCode )
  threadContext = struct;
  threadContext.code = jzenCode;
  threadContext.pc = 1;
  threadContext.labelList = struct;
  threadContext.labelList.beginThread = 1;
  threadContext.labelList.endThread = size( jzenCode, 1 )+1;
  threadContext.varList = struct;
  threadContext.varList.vm = threadContext;
  JZEN_stepRun( threadContext );
end

function JZEN_stepRun( threadContext )
  jzenCode = threadContext.code;
  jzenCodeLen = size( jzenCode, 1 );
  while threadContext.pc <= jzenCodeLen
      codeStatement = jzenCode{ threadContext.pc, 1 };
      if isa( codeStatement, 'function_handle' )
        codeStatement();
      elseif ischar( codeStatement )
        disp( [ 'comment: ', codeStatement ] );
      elseif iscell( codeStatement )
        JZEN_run( codeStatement );
      elseif isstruct( codeStatement )
        switch( codeStatement.callName )
        case 'jsen_sleep'
          threadContext.pc = threadContext.pc+1;
          timeout = codeStatement.params;
          t = timer( 'TimerFcn',...
                     @() JZEN_stepRun( threadContext ),... 
                     'StartDelay', timeout );
          start(t);
          return;
        case 'jsen_print'
          message = codeStatement.params;
          disp( message );
        case 'jsen_if'
          condition = codeStatement.params;
          if ~condition()
            threadContext.pc = threadContext.pc+1;
          end
        case 'jsen_label'
          newLabelName = codeStatement.params;
          threadContext.labelList.(newLabelName) = threadContext.pc
        case 'jsen_goto'
          labelName = codeStatement.params;
          labelPc = threadContext.labelList.(labelName)
          if labelPc > 0
            threadContext.pc = labelPc;
          end
        case 'jsen_assign'
          variableName = codeStatement.params;
          variableValueFunc = codeStatement.valueFunc;
          assignmentExpr = [ 'global ', variableName, '; ',
                             variableName, ' = variableValueFunc()' ];
          disp( assignmentExpr );
          eval( assignmentExpr );
        end
      end
      
      threadContext.pc = threadContext.pc+1;
  end
end

function result = jsen_sleep( params )
  result = struct;
  result.callName = 'jsen_sleep';
  result.params = params;
end

function result = jsen_print( msg )
  result = struct;
  result.callName = 'jsen_print';
  result.params = msg;
end

function result = jsen_if( condition )
  result = struct;
  result.callName = 'jsen_if';
  result.params = condition;
end

function result = jsen_label( labelName )
  result = struct;
  result.callName = 'jsen_label';
  result.params = labelName;
end

function result = jsen_goto( labelName )
  result = struct;
  result.callName = 'jsen_goto';
  result.params = labelName;
end

function result = jsen_assign( variableName, value )
  result = struct;
  result.callName = 'jsen_assign';
  result.params = variableName;
  result.valueFunc = value;
end
