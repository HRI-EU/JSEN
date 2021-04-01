/*
 *  Test for the JZEN Virtual Machine
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
 */

const JSEN = require( '../src/JSEN.js' );
const JZENVM = require( '../src/JZENVM.js' );

let i = 0;
let a = 0;
let loopZeroIndex = 0;

const testJZENVM = {
  testCode1:  [
    ()=> console.log( 'Start code' ),
    ()=> console.log( 'Exec line one' ),
    ()=> console.log( 'Exec line two' ),
    ()=> console.log( 'Exec line three' ),
    ()=> console.log( 'End code' ),
  ],
  testCode2: [
    ()=> console.log( 'Start' ),
    JSEN.if( ()=> i == 0 ),
      JSEN.print( 'Condition true' ),
    ()=> i = 1,
    JSEN.if( ()=> i == 0 ),
        JSEN.print( 'i is still 0' ),
    JSEN.if( ()=> i == 1 ),
        JSEN.print( 'i is now 1' ),
    ()=> console.log( 'End' ),
  ],
  testLabel:  [
    ()=> console.log( 'Start code' ),
    ()=> console.log( 'Exec line one' ),
    JSEN.label( 'label1' ),
    ()=> console.log( 'Exec line two' ),
    ()=> console.log( 'Exec line three' ),
    JSEN.label( 'label2' ),
    ()=> console.log( 'End code' ),
  ],
  testComment: [
    ()=> console.log( 'Start code' ),
    ()=> console.log( 'Exec one' ),
    , // this is a blank line
    ()=> console.log( 'Exec three' ),
    'The next instruction will terminate the thread',
    JSEN.goto( 'blockEnd' ),
    ()=> console.log( 'Exec five -> this line should not be shown' ),
    ()=> console.log( 'End code' ),
  ],
  testPrint: [
    JSEN.print( 'Start' ),
    JSEN.print( 'Line 1' ),
    JSEN.print( 'Line 2' ),
    JSEN.print( 'Line 3' ),
    JSEN.print( 'End' ),
  ],
  testBlock: [
    JSEN.print( 'Start' ),
    JSEN.print( 'first line' ),
    [
      JSEN.print( 'inside block 1' ),
      JSEN.print( 'inside block 2' ),
      JSEN.print( 'inside block 3' ),
    ],
    JSEN.print( 'second line' ),
    JSEN.print( 'End' ),
  ],
  testAssignment: [
    ()=> i = 0,
    ()=> console.log( 'Start' ),
    ()=> console.log( 'Value of i = '+i ),
    ()=> i = 5,
    ()=> console.log( 'Value of i = '+i ),
    ()=> console.log( 'End' ),
  ],
  testGoto: [
    ()=> console.log( 'Start code' ),
    ()=> console.log( 'Exec one' ),
    JSEN.label( 'loop' ),
      ()=> ++a,
      ()=> console.log( 'Show this line 4 times' ),
      JSEN.if( ()=> a < 4 ),
        JSEN.goto( 'loop' ),
    ()=> console.log( 'End code' ),
  ],
  testGotoToLineZero: [
    JSEN.label( 'loop' ),
    ()=> console.log( 'Loop iteration' ),
    ()=> ++loopZeroIndex,
    ()=> console.log( 'Show this line 4 times' ),
    JSEN.if( ()=> loopZeroIndex < 4 ),
      JSEN.goto( 'loop' ),
    ()=> console.log( 'End code' ),
  ],
  testIf: [
    ()=> console.log( 'Start code' ),
    ()=> console.log( 'Exec one' ),
    ()=> console.log( 'Will print (true condition)' ),
    JSEN.if( ()=> true ),
    [
      ()=> console.log( 'If true 1' ),
      ()=> console.log( 'If true 2' ),
    ],
    ()=> console.log( 'Will not print (false condition)' ),
    JSEN.if( ()=> false ),
    [
      ()=> console.log( 'If false 1' ),
      ()=> console.log( 'If false 2' ),
    ],
    ()=> console.log( 'End code' ),
  ],
  testSleep: [
    ()=> console.log( 'Start code' ),
    ()=> console.log( 'Exec line one' ),
    JSEN.sleep(4),
    ()=> console.log( 'Exec line two' ),
    ()=> console.log( 'Exec line three' ),
    ()=> console.log( 'End code' ),
  ],
}

const testNameList = Object.keys( testJZENVM );
let testIndex = 0;
// This function execute all test, one after the other with 2 seconds delay
function runTest() {
  if( testIndex < testNameList.length ) {
    const testName = testNameList[testIndex++];
    const testCode = testJZENVM[testName];
    console.log( '\n\nRunning test: '+testName+' --------------------------------' );
    JZENVM.run( testCode );
    setTimeout( runTest, 5*1000 );
  }
}

runTest();
