/*
 *  Test for JSEN Virtual Machine
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
const JSENVM = require( '../src/JSENVM.js' );
const JZENVM = require( '../src/JZENVM.js' );

// List of general-purpose variables
var test_jvm = null;
var test_var1 = false;

testJSENVM  = {
  // List of tests
  jsenBasic: {
    newInstance: ()=> {
      console.log( 'Just instantiate JSEN Virtual Machine and show status' );
      console.log( 'OUT: thread status dump - only suspended checkOn' );

      test_jvm = new JSENVM();

      test_jvm._logStatus();
    },
    newThreads: ()=> {
      console.log( 'Instantiate empty threads and see that they are in the ready queue' );
      console.log( 'OUT: thread status dump, note 3 threads in ready queue' );

      test_jvm = new JSENVM();

      test_jvm.newThread( 'thread1', [] );
      test_jvm.newThread( 'thread2', [] );
      test_jvm.newThread( 'thread3', [] );

      test_jvm._logStatus();
    },
    startEmptyThread: ()=> {
      console.log( 'Instantiate empty threads and see that they go to terminate' );
      console.log( 'OUT: ' );

      test_jvm = new JSENVM();

      test_jvm.newThread( 'thread1', [] );
      test_jvm.startThread( 'thread1' );

      var code = [
        ()=> console.log( 'One thread should be in running' ),
        ()=> test_jvm._logStatus(),
        JSEN.sleep( 1 ),
        ()=> test_jvm._logStatus(),
        ()=> console.log( 'Now in terminated threads' ),
      ];
      JZENVM.run( code );
    },
    removeThreads: ()=> {
      console.log( 'Instantiate empty threads, then remove some of them and check status' );
      console.log( 'OUT: threads 1 and 5 should be removed, while 3 and 4 could not be removed since they were running' );

      test_jvm = new JSENVM();

      test_jvm.newThread( 'thread1', [] );
      test_jvm.newThread( 'thread2', [] );
      test_jvm.newThread( 'thread3', [] );
      test_jvm.newThread( 'thread4', [] );
      test_jvm.newThread( 'thread5', [] );
      test_jvm.newThread( 'thread6', [] );

      test_jvm.startThread( 'thread3' );
      test_jvm.startThread( 'thread4' );

      test_jvm._logStatus();
      test_jvm.removeThread( [ 'thread1', 'thread3', 'thread4', 'thread5' ] );
      test_jvm._logStatus();
    }
  },
  statementsBasic: {
    threadWithCodeAndLabel: ()=> {
      console.log( 'Start a thread with a few lines of code and some labels' );
      console.log( 'OUT: thread prints line execution' );

      test_jvm = new JSENVM();

      const thread1 =  [
        ()=> console.log( 'Start code' ),
        ()=> console.log( 'Exec line one' ),
        JSEN.label( 'label1' ),
        ()=> console.log( 'Exec line two' ),
        ()=> console.log( 'Exec line three' ),
        [
          ()=> console.log( 'Exec line three.1' ),
          ()=> console.log( 'Exec line three.2' ),
          JSEN.label( 'label1.1' ),
        ],
        JSEN.label( 'label2' ),
        ()=> console.log( 'End code' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.startThread( 'thread1' );

      test_jvm._logStatus();
    },
    threadWithCodeAndGoto: ()=> {
      console.log( 'Start a thread with a few lines of code and a goto' );
      console.log( 'OUT: thread prints line execution - print only start, one end four' );

      test_jvm = new JSENVM();

      const thread1 =  [
        ()=> console.log( 'Start code' ),
        ()=> console.log( 'Exec one' ),
        JSEN.goto( 'label1' ),
        ()=> console.log( 'Exec two -> this line should not be shown' ),
        ()=> console.log( 'Exec three -> this line should not be shown' ),
        JSEN.label( 'label1' ),
        ()=> console.log( 'Exec four' ),
        JSEN.goto( 'blockEnd' ),
        ()=> console.log( 'Exec five -> this line should not be shown' ),
        ()=> console.log( 'End code' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.startThread( 'thread1' );

      test_jvm._logStatus();
    },
    threadWithCodeAndPrint: ()=> {
      console.log( 'Start a thread with a few lines of code and some print' );
      console.log( 'OUT: thread prints line execution - note print with JSEN.print' );

      test_jvm = new JSENVM();

      const thread1 =  [
        ()=> console.log( 'Start code' ),
        ()=> console.log( 'Exec line one' ),
        JSEN.print( 'This is a first print' ),
        ()=> console.log( 'Exec line two' ),
        ()=> console.log( 'Exec line three' ),
        JSEN.print( 'This is a last print' ),
        ()=> console.log( 'End code' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.startThread( 'thread1' );

      test_jvm._logStatus();
    },
    threadWithCodeAndSleep: ()=> {
      console.log( 'Start a thread with a few lines of code and some sleep' );
      console.log( 'OUT: thread prints line execution - note the sleep periods' );

      test_jvm = new JSENVM();

      var sleepObj = { value: 1 };
      var thread1 =  [
        ()=> console.log( 'Start code' ),
        ()=> console.log( 'Going to sleep for 2 seconds' ),
        JSEN.sleep( 2 ),
        ()=> console.log( 'Exec line' ),
        ()=> console.log( 'Going to sleep for 1 second' ),
        JSEN.sleep( sleepObj ),
        ()=> console.log( 'Exec line' ),
        ()=> console.log( 'Going to sleep for 3 seconds' ),
        JSEN.sleep( ()=> ( sleepObj.value + 2 ) ),
        ()=> console.log( 'End code' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.startThread( 'thread1' );

      test_jvm._logStatus();
    },
    threadWithCodeAndJsenGetSet1: ()=> {
      console.log( 'Start a thread with a few lines of code and a JSEN.set/get pair on a user variable' );
      console.log( 'OUT: thread prints line execution' );

      test_jvm = new JSENVM();

      test_var1 = 'BBBB';
      const thread1 =  [
        ()=> console.log( 'Start code' ),
        ()=> console.log( 'Variable is now: \'' + test_var1 + '\'' ),
        ()=> console.log( 'Setting variable to \'Hello, world!\'' ),
        JSEN.set( 'test_var1', 'Hello, world!' ),
        ()=> console.log( 'Getting variable back' ),
        JSEN.get( 'test_var1', (data)=> test_var1 = data ),
        ()=> console.log( 'Variable is now: \'' + test_var1 + '\'' ),
        ()=> console.log( 'End code' ),
      ]

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.startThread( 'thread1' );

      test_jvm._logStatus();
    },
    threadWithCodeAndJsenGetSet2: ()=> {
      console.log( 'Start a thread with a few lines of code and a JSEN.set/get pair on a user variable' );
      console.log( 'OUT: thread prints line execution' );

      test_jvm = new JSENVM();

      test_var1 = 'BBBB';
      const thread1 =  [
        ()=> console.log( 'Start code' ),
        ()=> console.log( 'Variable is now: \'' + test_var1 + '\'' ),
        ()=> console.log( 'Setting variable 1 to \'Hello, world!\'' ),
        JSEN.set( 'test_var1', 'Hello, world!' ),
        [
          ()=> console.log( 'Now in a block' ),
          ()=> console.log( 'Getting variable 1 back' ),
          JSEN.get( 'test_var1', (data)=> test_var1 = data ),
          ()=> console.log( 'Variable 1 is now: \'' + test_var1 + '\'' ),
          ()=> console.log( 'Setting variable 1 to \'Salve, mondo 1\'' ),
          JSEN.set( 'test_var1', 'Salve, mondo 1' ),
          'Now I create a new local variable test_var2',
          ()=> console.log( 'Setting variable 2 to \'Salve, mondo 2\'' ),
          JSEN.set( 'test_var2', 'Salve, mondo 2' ),
          ()=> console.log( 'Getting variable 2 back in a block' ),
          JSEN.get( 'test_var2', (data)=> test_var1 = data ),
          ()=> console.log( 'Variable 2 is now: \'' + test_var1 + '\'' ),
        ],
        ()=> console.log( 'Getting variable 1 back' ),
        JSEN.get( 'test_var1', (data)=> test_var1 = data ),
        ()=> console.log( 'Variable 1 is now: \'' + test_var1 + '\'' ),
        ()=> console.log( 'Getting variable 2 back (should be undefined)' ),
        JSEN.get( 'test_var2', (data)=> test_var1 = data ),
        ()=> console.log( 'Variable 2 is now: \'' + test_var1 + '\'' ),
        ()=> console.log( 'End code' ),
      ]

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.startThread( 'thread1' );

      test_jvm._logStatus();
    },
    threadWithCodeAndGlobalGetSet: ()=> {
      console.log( 'Start a thread with a few lines of code and a set/get pair on a user variable' );
      console.log( 'OUT: thread prints line execution' );

      test_jvm = new JSENVM();

      test_var1 = 'AAAA';
      const thread1 =  [
        ()=> console.log( 'Start code' ),
        ()=> console.log( 'Variable is now: \'' + test_var1 + '\'' ),
        ()=> console.log( 'Setting variable to \'Hello, world!\'' ),
        ()=> test_jvm.set( 'test_var1', 'Hello, world!' ),
        ()=> console.log( 'Getting variable back' ),
        ()=> test_var1 = test_jvm.get( 'test_var1' ),
        ()=> console.log( 'Variable is now: \'' + test_var1 + '\'' ),
        ()=> console.log( 'End code' ),
      ]

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.startThread( 'thread1' );

      test_jvm._logStatus();
    },
    threadWithCodeAndJsenGetSetGlobal: ()=> {
      console.log( 'Start a thread with a few lines of code and a JSEN.set/get pair on a user variable' );
      console.log( 'OUT: thread prints line execution' );

      test_jvm = new JSENVM();

      test_var1 = 'BBBB';
      test_jvm.set( 'test_var1', 'Hello, world!' );
      const thread1 =  [
        ()=> console.log( 'Start code' ),
        ()=> console.log( 'Variable is now: \'' + test_var1 + '\'' ),
        [
          ()=> console.log( 'Now in a block' ),
          ()=> console.log( 'Getting variable back' ),
          JSEN.get( 'test_var1', (data)=> test_var1 = data ),
          ()=> console.log( 'Variable is now: \'' + test_var1 + '\'' ),
        ],
        ()=> console.log( 'End code' ),
      ]

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.startThread( 'thread1' );

      test_jvm._logStatus();
    },
  },
  controlStatements: {
    threadWithCodeAndIfElse: ()=> {
      console.log( 'Start a thread with a few lines of code and an "if - else" statement' );
      console.log( 'OUT: thread prints value of test_var1' );

      test_jvm = new JSENVM();

      test_var1 = false;
      const thread1 =  [
        ()=> console.log( 'Start code' ),
        ()=> console.log( 'Before the if' ),
        JSEN.if( ()=> test_var1 == true ),
        [
          ()=> console.log( 'test_var1 true' ),
        ],
        JSEN.else(),
        [
          ()=> console.log( 'test_var1 false' ),
        ],
        ()=> console.log( 'After if' ),
        ()=> console.log( 'End code' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.startThread( 'thread1' );

      test_jvm._logStatus();

      var code = [
        ()=> console.log( 'Control thread: variable test_var1 is now ' + test_var1 ),
        JSEN.sleep(3),
        ()=> test_var1 = true,
        ()=> console.log( 'Control thread: variable test_var1 is now ' + test_var1 ),
        ()=> test_jvm.renewThread('thread1'),
        ()=> test_jvm.startThread( 'thread1' ),
      ];
      JZENVM.run( code );
    },
    threadWithCodeAndSwitch: ()=> {
      console.log( 'Start a thread with a few lines of code and a switch statement' );
      console.log( 'OUT: thread prints value of test_var1' );

      test_jvm = new JSENVM();

      test_var1 = 0;
      const thread1 =  [
        ()=> console.log( 'Start code' ),
        ()=> console.log( 'Before the switch' ),
        JSEN.switch( ()=> test_var1 ),
        JSEN.case( 0 ),
        [
          ()=> console.log( 'test_var1 0' ),
        ],
        JSEN.case( 1 ),
        [
          ()=> console.log( 'test_var1 1' ),
        ],
        JSEN.case( 2 ),
        [
          ()=> console.log( 'test_var1 2' ),
        ],
        ()=> console.log( 'After switch' ),
        ()=> console.log( 'End code' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );

      test_jvm._logStatus();

      var code = [
        ()=> console.log( 'Control thread: variable test_var1 is now ' + test_var1 ),
        ()=> test_jvm.startThread( 'thread1' ),
        JSEN.sleep(1),
        ()=> test_var1 = 1,
        ()=> console.log( 'Control thread: variable test_var1 is now ' + test_var1 ),
        ()=> test_jvm.renewThread('thread1'),
        ()=> test_jvm.startThread( 'thread1' ),
        JSEN.sleep(1),
        ()=> test_var1 = 2,
        ()=> console.log( 'Control thread: variable test_var1 is now ' + test_var1 ),
        ()=> test_jvm.renewThread('thread1'),
        ()=> test_jvm.startThread( 'thread1' ),
      ];
      JZENVM.run( code );
    },
    threadWithCodeAndOn: ()=> {
      console.log( 'Start a thread with a few lines of code and "on" condition statement' );
      console.log( 'OUT: thread wakeup after setting the variable' );

      test_jvm = new JSENVM();

      test_var1 = false;
      let test_checkOnResult = undefined;
      const thread1 =  [
        ()=> console.log( 'Start code' ),
        ()=> console.log( 'Going to sleep until var1 will be true' ),
        JSEN.on( ()=> test_var1 == true ),
        JSEN.getOnStatus( (status)=> test_checkOnResult = status ),
        ()=> console.log( 'Variable var1 became true' ),
        ()=> console.log( '\'JSEN.on\' reported as terminated due to condition becoming true: '+test_checkOnResult ),
        ()=> console.log( 'End code' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.startThread( 'thread1' );

      test_jvm._logStatus();

      var code = [
        ()=> console.log( 'Control thread: variable test_var1 is now ' + test_var1 ),
        JSEN.sleep(4),
        ()=> test_var1 = true,
        ()=> console.log( 'Control thread: variable test_var1 is now ' + test_var1 ),
      ];
      JZENVM.run( code );
    },
    threadWithCodeAndOnTimeout: ()=> {
      console.log( 'Start a thread with a few lines of code and "on" condition statement' );
      console.log( 'OUT: thread wakeup after setting the variable' );

      test_jvm = new JSENVM();

      test_var1 = false;
      let test_checkOnResult = undefined;
      const thread1 =  [
        ()=> console.log( 'Start code' ),
        ()=> console.log( 'Going to sleep until var1 will be true' ),
        JSEN.on( ()=> test_var1 == true, 2 ),
        JSEN.getOnStatus( (status)=> test_checkOnResult = status ),
        ()=> console.log( 'Variable var1 became true' ),
        ()=> console.log( '\'JSEN.on\' reported as terminated due to condition becoming true: '+test_checkOnResult ),
        ()=> console.log( 'End code' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.startThread( 'thread1' );

      test_jvm._logStatus();

      var code = [
        ()=> console.log( 'Control thread: variable test_var1 is now ' + test_var1 ),
        JSEN.sleep(4),
        ()=> test_var1 = true,
        ()=> console.log( 'Control thread: variable test_var1 is now ' + test_var1 ),
      ];
      JZENVM.run( code );
    },
    threadWithCodeAndOnWithComplexTimeout: ()=> {
      console.log( 'Start a thread with a few lines of code and "on" condition statement, with a 7 second timeout' );
      console.log( 'TODO: set test_var1 to "true" to test the condition before the timeout' );
      console.log( 'OUT: thread wakeup after setting the variable' );

      test_jvm = new JSENVM();

      test_var1 = false;
      let timeout = 0;
      const timeoutObj = { value: 1 };
      let test_checkOnResult = undefined;
      var thread1 =  [
        ()=> console.log( 'Start code' ),
        ()=> console.log( 'Going to sleep until timeout has expired' ),
        JSEN.on( ()=> test_var1 == true, ()=> timeout ),
        JSEN.getOnStatus( (status)=> test_checkOnResult = status ),
        ()=> console.log( '\'On\' reported as terminated due to: '+test_checkOnResult ),
        ()=> console.log( 'Going to sleep until timeout has expired' ),
        JSEN.on( ()=> test_var1 == true, timeoutObj ),
        JSEN.getOnStatus( (status)=> test_checkOnResult = status ),
        ()=> console.log( '\'On\' reported as terminated due to: '+test_checkOnResult ),
        ()=> console.log( 'End code' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.startThread( 'thread1' );

      test_jvm._logStatus();
    },
  },
  loopStatements: {
    threadWithCodeAndLoop: ()=> {
      console.log( 'Start a thread with a few lines of code and a basic loop' );
      console.log( 'OUT: thread prints line execution and 3 iteration of the loop' );

      test_jvm = new JSENVM();

      test_var1 = 0;
      const thread1 =  [
        ()=> console.log( 'T1: Start code' ),
        ()=> console.log( 'T1: Exec line one' ),
        JSEN.loop(),
        [
          ()=> console.log( 'T1: Inside loop, iteration = '+test_var1 ),
          ()=> console.log( 'T1: Exec loop line one' ),
          JSEN.if( ()=> test_var1 > 2 ),
            JSEN.break(),
          ()=> console.log( 'T1: Exec loop line two' ),
          ()=> console.log( 'T1: Exec loop line three' ),
          ()=> ++test_var1,
          JSEN.sleep( 1 ),
        ],
        ()=> console.log( 'T1: Exec line two outside loop' ),
        ()=> console.log( 'T1: End code, resetting testVar' ),
        ()=> test_var1 = 0,
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.startThread( 'thread1' );

      test_jvm._logStatus();
    },
    threadWithCodeAndWhile: ()=> {
      console.log( 'Start a thread with a few lines of code and a while loop' );
      console.log( 'OUT: thread prints line execution and 3 iteration of the loop' );

      test_jvm = new JSENVM();

      test_var1 = 0;
      var thread1 =  [
        ()=> console.log( 'T1: Start code' ),
        ()=> console.log( 'T1: Exec line one' ),
        JSEN.while( ()=> test_var1 < 3 ),
        [
          ()=> console.log( 'T1: Inside loop, iteration = '+test_var1 ),
          ()=> console.log( 'T1: Exec while line two' ),
          ()=> console.log( 'T1: Exec while line three' ),
          ()=> console.log( 'T1: Exec while line four' ),
          ()=> ++test_var1,
          JSEN.sleep( 1 ),
        ],
        ()=> console.log( 'T1: Exec line two outside while' ),
        ()=> console.log( 'T1: End code, resetting testVar' ),
        ()=> test_var1 = 0,
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.startThread( 'thread1' );

      test_jvm._logStatus();
    },
    threadWithCodeAndFor1Param: ()=> {
      console.log( 'Start a thread with a few lines of code and a for loop' );
      console.log( 'OUT: thread prints line execution' );

      test_jvm = new JSENVM();

      test_var1 = 0;
      const thread1 =  [
        ()=> console.log( 'T1: Start code' ),
        JSEN.for( 'iterator1', 5 ),
        [
          ()=> console.log( 'T1: Inside for block ----------' ),
          JSEN.get( 'iterator1', (iterator)=> test_var1 = iterator ),
          ()=> console.log( 'T1: Current iterator value: '+test_var1 ),
          JSEN.sleep( 1 ),
        ],
        ()=> console.log( 'T1: Outside for' ),
        ()=> console.log( 'T1: End code' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.startThread( 'thread1' );

      test_jvm._logStatus();
    },
    threadWithCodeAndFor2Param: ()=> {
      console.log( 'Start a thread with a few lines of code and a for loop' );
      console.log( 'OUT: thread prints line execution' );

      test_jvm = new JSENVM();

      test_var1 = 0;
      const thread1 =  [
        ()=> console.log( 'T1: Start code' ),
        JSEN.for( 'iterator1', 2, 8 ),
        [
          ()=> console.log( 'T1: Inside for block ----------' ),
          JSEN.get( 'iterator1', (iterator)=> test_var1 = iterator ),
          ()=> console.log( 'T1: Current iterator value: '+test_var1 ),
          JSEN.sleep( 1 ),
        ],
        ()=> console.log( 'T1: Outside for' ),
        ()=> console.log( 'T1: End code' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.startThread( 'thread1' );

      test_jvm._logStatus();
    },
    threadWithCodeAndFor3Param: ()=> {
      console.log( 'Start a thread with a few lines of code and a for loop' );
      console.log( 'OUT: thread prints line execution' );

      test_jvm = new JSENVM();

      test_var1 = 0;
      const thread1 =  [
        ()=> console.log( 'T1: Start code' ),
        JSEN.for( 'iterator1', 2, 8, 2 ),
        [
          ()=> console.log( 'T1: Inside for block ----------' ),
          JSEN.get( 'iterator1', (iterator)=> test_var1 = iterator ),
          ()=> console.log( 'T1: Current iterator value: '+test_var1 ),
          JSEN.sleep( 1 ),
        ],
        ()=> console.log( 'T1: Outside for' ),
        ()=> console.log( 'T1: End code' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.startThread( 'thread1' );

      test_jvm._logStatus();
    },
    threadWithCodeAndForReverse2Param: ()=> {
      console.log( 'Start a thread with a few lines of code and a for loop' );
      console.log( 'OUT: thread prints line execution' );

      test_jvm = new JSENVM();

      test_var1 = 0;
      const thread1 =  [
        ()=> console.log( 'T1: Start code' ),
        JSEN.for( 'iterator1', 8, 2 ),
        [
          ()=> console.log( 'T1: Inside for block ----------' ),
          JSEN.get( 'iterator1', (iterator)=> test_var1 = iterator ),
          ()=> console.log( 'T1: Current iterator value: '+test_var1 ),
          JSEN.sleep( 1 ),
        ],
        ()=> console.log( 'T1: Outside for' ),
        ()=> console.log( 'T1: End code' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.startThread( 'thread1' );

      test_jvm._logStatus();
    },
    threadWithCodeAndForReverse3Param: ()=> {
      console.log( 'Start a thread with a few lines of code and a for loop' );
      console.log( 'OUT: thread prints line execution' );

      test_jvm = new JSENVM();

      test_var1 = 0;
      const thread1 =  [
        ()=> console.log( 'T1: Start code' ),
        JSEN.for( 'iterator1', 8, 2, -2 ),
        [
          ()=> console.log( 'T1: Inside for block ----------' ),
          JSEN.get( 'iterator1', (iterator)=> test_var1 = iterator ),
          ()=> console.log( 'T1: Current iterator value: '+test_var1 ),
          JSEN.sleep( 1 ),
        ],
        ()=> console.log( 'T1: Outside for' ),
        ()=> console.log( 'T1: End code' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.startThread( 'thread1' );

      test_jvm._logStatus();
    },
    threadWithCodeAndForeach: ()=> {
      console.log( 'Start a thread with a few lines of code and a foreach loop' );
      console.log( 'OUT: thread prints line execution' );

      test_jvm = new JSENVM();

      test_var1 = 0;
      const test_array = [ 1, 'a', true, ()=> console.log('Hello world!') ];
      var thread1 =  [
        ()=> console.log( 'T1: Start code' ),
        ()=> console.log( 'T1: Exec line one' ),
        JSEN.foreach( 'iterator1', ()=> test_array ),
        [
          ()=> console.log( 'T1: Inside foreach block ----------' ),
          ()=> console.log( 'T1: Exec foreach line one' ),
          JSEN.get( 'iterator1', (iterator)=> test_var1 = iterator ),
          ()=> console.log( 'T1: Current iterator value: '+test_var1 ),
          ()=> console.log( 'T1: Current iterator item: '+test_array[ test_var1 ] ),
          JSEN.sleep( 1 ),
        ],
        ()=> console.log( 'T1: Exec line two outside while' ),
        ()=> console.log( 'T1: End code' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.startThread( 'thread1' );

      test_jvm._logStatus();
    },
    threadWithCodeAndRepeatUntil: ()=> {
      console.log( 'Start a thread with a few lines of code and a repeat - until loop' );
      console.log( 'OUT: thread prints line execution' );

      test_jvm = new JSENVM();

      test_var1 = 0;
      const thread1 =  [
        ()=> console.log( 'T1: Start code' ),
        [
          ()=> console.log( 'T1: Inside repeat block, index = '+test_var1 ),
          ()=> console.log( 'T1: Exec repeat line one' ),
          ()=> ++test_var1,
          JSEN.sleep( 1 ),
        ],
        JSEN.until( ()=> test_var1 > 2),
        ()=> console.log( 'T1: Outside repeat' ),
        ()=> console.log( 'T1: End code, resetting test_var1' ),
        ()=> test_var1 = 0,
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.startThread( 'thread1' );

      test_jvm._logStatus();
    },
    threadWithCodeAndContinue: ()=> {
      console.log( 'Start a thread with a few lines of code and a continue statement' );
      console.log( 'OUT: thread prints line execution' );

      test_jvm = new JSENVM();

      test_var1 = 0;
      const thread1 =  [
        ()=> console.log( 'T1: Start code' ),
        [
          ()=> console.log( 'T1: Inside block, index = '+test_var1 ),
          ()=> console.log( 'T1: Exec block line one' ),
          ()=> ++test_var1,
          JSEN.sleep( 1 ),
          JSEN.if( ()=> test_var1 <= 3 ),
            JSEN.continue(),
          ()=> console.log( 'T1: Exec block line two' ),
          ()=> console.log( 'T1: Exec block line three' ),
        ],
        ()=> console.log( 'T1: Exec line two outside block' ),
        ()=> console.log( 'T1: End code, resetting testVar' ),
        ()=> test_var1 = 0,
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.startThread( 'thread1' );

      test_jvm._logStatus();
    },
  },
  threadingBasic: {
    threadWithCode: ()=> {
      console.log( 'Start a thread with a few lines of code' );
      console.log( 'OUT: thread prints line execution' );

      test_jvm = new JSENVM();

      const thread1 =  [
        ()=> console.log( 'Start code' ),
        ()=> console.log( 'Exec line one' ),
        ()=> console.log( 'Exec line two' ),
        ()=> console.log( 'Exec line three' ),
        ()=> console.log( 'End code' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.startThread( 'thread1' );

      test_jvm._logStatus();
    },
    threadWithCodeAndBlock: ()=> {
      console.log( 'Start a thread with a few lines of code and a block inside' );
      console.log( 'OUT: thread prints line execution - note lines with three.1/2' );

      test_jvm = new JSENVM();

      const thread1 =  [
        ()=> console.log( 'Start code' ),
        ()=> console.log( 'Exec line one' ),
        ()=> console.log( 'Exec line two' ),
        ()=> console.log( 'Exec line three' ),
        [
          ()=> console.log( 'Exec line three.1' ),
          ()=> console.log( 'Exec line three.2' ),
        ],
        ()=> console.log( 'End code' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.startThread( 'thread1' );

      test_jvm._logStatus();
    },
    threadsWithCodeStepByStepAll: ()=> {
      console.log( 'Start two threads with a few lines of code and run them both step by step' );
      console.log( 'OUT: threads print line execution' );

      test_jvm = new JSENVM();

      const thread1 =  [
        ()=> console.log( 'T1: Start code' ),
        ()=> console.log( 'T1: Exec line one' ),
        ()=> console.log( 'T1: Exec line two' ),
        ()=> console.log( 'T1: Exec line three' ),
        ()=> console.log( 'T1: End code' ),
      ];

      var thread2 =  [
        ()=> console.log( 'T2: Start code' ),
        ()=> console.log( 'T2: Exec line one' ),
        ()=> console.log( 'T2: Exec line two' ),
        ()=> console.log( 'T2: Exec line three' ),
        ()=> console.log( 'T2: End code' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.newThread( 'thread2', thread2 );
      test_jvm.startThread( 'thread1' );
      test_jvm.startThread( 'thread2' );
      test_jvm.pauseThread( '*' );

      var loopIndex = 0;
      var code = [
        JSEN.label( 'loop' ),
          ()=> console.log( 'Run: test_jvm.step( \'*\' )' ),
          ()=> test_jvm.step( '*' ),
          JSEN.sleep( 1 ),
          ()=> ++loopIndex,
          JSEN.if( ()=> loopIndex < 5 ),
            JSEN.print( 'continue loop' ),
          JSEN.if( ()=> loopIndex < 5 ),
            JSEN.goto( 'loop' ),
      ];
      JZENVM.run( code );

      test_jvm._logStatus();
    },
    threadsWithCodeStepByStepNext: ()=> {
      console.log( 'Start two threads with a few lines of code and repeatedly step next thread' );
      console.log( 'OUT: threads print line execution' );

      test_jvm = new JSENVM();

      const thread1 =  [
        ()=> console.log( 'T1: Start code' ),
        ()=> console.log( 'T1: Exec line one' ),
        ()=> console.log( 'T1: Exec line two' ),
        ()=> console.log( 'T1: Exec line three' ),
        ()=> console.log( 'T1: End code' ),
      ];

      var thread2 =  [
        ()=> console.log( 'T2: Start code' ),
        ()=> console.log( 'T2: Exec line one' ),
        ()=> console.log( 'T2: Exec line two' ),
        ()=> console.log( 'T2: Exec line three' ),
        ()=> console.log( 'T2: End code' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.newThread( 'thread2', thread2 );
      test_jvm.startThread( 'thread1' );
      test_jvm.startThread( 'thread2' );
      test_jvm.pauseThread( '*' );

      var loopIndex = 0;
      var code = [
        JSEN.label( 'loop' ),
          ()=> console.log( 'Run: test_jvm.step()' ),
          ()=> test_jvm.step(),
          JSEN.sleep( 1 ),
          ()=> ++loopIndex,
          JSEN.if( ()=> loopIndex < 10 ),
            JSEN.goto( 'loop' ),
      ];
      JZENVM.run( code );

      test_jvm._logStatus();
    },
    threadsWithCodeStepByStepSpecific: ()=> {
      console.log( 'Start two threads with a few lines of code and step one or the other in particular' );
      console.log( 'OUT: threads print line execution' );

      test_jvm = new JSENVM();

      const thread1 =  [
        ()=> console.log( 'T1: Start code' ),
        ()=> console.log( 'T1: Exec line one' ),
        ()=> console.log( 'T1: Exec line two' ),
        ()=> console.log( 'T1: Exec line three' ),
        ()=> console.log( 'T1: End code' ),
      ];

      var thread2 =  [
        ()=> console.log( 'T2: Start code' ),
        ()=> console.log( 'T2: Exec line one' ),
        ()=> console.log( 'T2: Exec line two' ),
        ()=> console.log( 'T2: Exec line three' ),
        ()=> console.log( 'T2: End code' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.newThread( 'thread2', thread2 );
      test_jvm.startThread( 'thread1' );
      test_jvm.startThread( 'thread2' );
      test_jvm.pauseThread( '*' );

      test_jvm._logStatus();

      var params = [0, 'thread2', 'thread2', 1, 0, 'thread1', 1, 'thread1', 0, 'thread2'];
      var paramIndex = 0;
      var loopIndex = 0;
      var code = [
        JSEN.label( 'loop' ),
          ()=> console.log( 'Control thread: Stepping thread by param: ' + params[paramIndex] ),
          ()=> test_jvm.step( params[paramIndex++] ),
          JSEN.sleep( 1 ),
          ()=> ++loopIndex,
          JSEN.if( ()=> loopIndex < 10 ),
            JSEN.goto( 'loop' ),
      ];
      JZENVM.run( code );
    },
    threadsWithCodeStepByStepPrintLine: ()=> {
      console.log( 'Start a thread with a few different lines of code, start it step by step, and check printing of current line' );
      console.log( 'OUT: threads print line execution' );

      test_jvm = new JSENVM();

      var test_var1 = true;
      const thread1 =  [
        ()=> console.log( 'T1: Start code' ),
        [
          ()=> console.log( 'T1: Exec line 1' ),
          JSEN.on( ()=> test_var1 == false, 2 ),
          ()=> console.log( 'T1: Exec line 3' ),
          ()=> console.log( 'T1: Exec line 4' ),
          JSEN.sleep( 2 ),
          JSEN.print( 'T1: Exec line 6' ),
          ()=> console.log( 'T1: Exec line 7' ),
          [
            ()=> console.log( 'T1: Exec line 9' ),
            [
              ()=> console.log( 'T1: Exec line 11' ),
            ],
            ()=> console.log( 'T1: Exec line 13' ),
          ],
          ()=> console.log( 'T1: Exec line 15' ),
        ],
        ()=> console.log( 'T1: Exec line 17' ),
        [
          ()=> console.log( 'T1: Exec line 19' ),
        ],
        ()=> console.log( 'T1: Exec line 21' ),
        [
          ()=> console.log( 'T1: Exec line 23' ),
        ],
        JSEN.if( ()=> test_var1 == false ),
          ()=> console.log( 'T1: Exec line 26 -> this line should be shown' ),
        JSEN.label( 'label_name' ),
        JSEN.goto( 'blockEnd' ),
        ()=> console.log( 'T1: End code -> this line should not be shown' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.startThread( 'thread1' );
      test_jvm.pauseThread( '*' );

      test_jvm._logStatus();

      var loopIndex = 0;
      var code = [
        JSEN.label( 'loop' ),
          ()=> console.log( 'Run: test_jvm.step( \'thread1\' )' ),
          ()=> test_jvm.step( 'thread1' ),
          JSEN.sleep( 1 ),
          ()=> ++loopIndex,
          JSEN.if( ()=> loopIndex < 33 ),
            JSEN.goto( 'loop' ),
      ];
      JZENVM.run( code );
    },
    threadWithCodeAndThreadPeriod: ()=> {
      console.log( 'Start a thread with a few lines of code and run with no thread period, then with 1 second thread period' );
      console.log( 'OUT: thread prints line execution' );

      test_jvm = new JSENVM();

      const thread1 =  [
        ()=> console.log( 'T1: Start code' ),
        ()=> console.log( 'T1: Exec line one' ),
        ()=> console.log( 'T1: Exec line two' ),
        ()=> console.log( 'T1: Exec line three' ),
        ()=> console.log( 'T1: End code' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm._logStatus();

      var code = [
        ()=> console.log( 'Control thread: running thread as fast thread' ),
        ()=> test_jvm.startThread( 'thread1' ),
        JSEN.sleep( 2 ),
        ()=> console.log( 'Control thread: running thread as slow thread (period 1s)' ),
        ()=> test_jvm.setSlowThreadPeriod( 1 ),
        ()=> test_jvm.renewThread( 'thread1' ),
        ()=> test_jvm.startThread( 'thread1' ),
        ()=> test_jvm.slowThread( 'thread1'),
      ];
      JZENVM.run( code );
    },
    threadWithCodeAndThreadPeriodTwoThreads: ()=> {
      console.log( 'Start two threads with a few lines of code and run with no thread period, then one of them with 1 second thread period' );
      console.log( 'OUT: threads print line execution' );

      test_jvm = new JSENVM();

      const thread1 =  [
        ()=> console.log( 'T1: Start code' ),
        ()=> console.log( 'T1: Exec line one' ),
        ()=> console.log( 'T1: Exec line two' ),
        ()=> console.log( 'T1: Exec line three' ),
        ()=> console.log( 'T1: End code' ),
      ];

      var thread2 =  [
        ()=> console.log( 'T2: Start code' ),
        ()=> console.log( 'T2: Exec line one' ),
        ()=> console.log( 'T2: Exec line two' ),
        ()=> console.log( 'T2: Exec line three' ),
        ()=> console.log( 'T2: End code' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.newThread( 'thread2', thread2 );

      test_jvm._logStatus();

      var code = [
        ()=> console.log( 'Control thread: running threads with no thread period' ),
        ()=> test_jvm.startThread( 'thread1' ),
        JSEN.sleep( 0.2 ),
        ()=> test_jvm.startThread( 'thread2' ),
        JSEN.sleep( 2 ),
        ()=> console.log( 'Control thread: running \'thread1\' with 1 second thread period' ),
        ()=> test_jvm.setSlowThreadPeriod( 1 ),
        ()=> test_jvm.renewThread( 'thread1' ),
        ()=> test_jvm.renewThread( 'thread2' ),
        ()=> test_jvm.startThread( 'thread1' ),
        ()=> test_jvm.slowThread( 'thread1'),
        JSEN.sleep( 0.2 ),
        ()=> test_jvm.startThread( 'thread2' ),
      ];
      JZENVM.run( code );
    },
    threadWithCodeStepByStepPauseContinue: ()=> {
      console.log( 'Start a thread with infinite loop, then pause it and continue execution, then stop' );
      console.log( 'OUT: thread prints line execution as loop' );

      test_jvm = new JSENVM();

      var loopIndex = 0;
      const thread1 =  [
        ()=> console.log( 'T1: Start code' ),
        JSEN.label( 'loop' ),
          ()=> console.log( 'T1: Running iteration '+loopIndex ),
          JSEN.sleep( 0.1 ),
          ()=> ++loopIndex,
          JSEN.goto( 'loop' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );

      test_jvm._logStatus();

      var loopIndex = 0;
      var code = [
        ()=> console.log( 'Control thread: Starting thread' ),
        ()=> test_jvm.startThread( 'thread1' ),
        ()=> console.log( 'Let it run for 3 seconds' ),
        JSEN.sleep( 2 ),
        ()=> console.log( 'Control thread: Pausing thread (in step by step mode)' ),
        ()=> test_jvm.pauseThread( 'thread1' ),
        ()=> console.log( 'Wait for 3 seconds' ),
        JSEN.sleep( 3 ),
        ()=> console.log( 'Control thread: Continuing thread' ),
        ()=> test_jvm.continueThread( 'thread1' ),
        ()=> console.log( 'Let it run for 3 seconds' ),
        JSEN.sleep( 2 ),
        ()=> console.log( 'Control thread: Stopping thread' ),
        ()=> test_jvm.stopThread( 'thread1' ),
      ];
      JZENVM.run( code );
    },
    threadWithBreakpoints: ()=> {
      console.log( 'Start a thread with a few lines of code in a loop, set a breakpoint, then trigger it' );
      console.log( 'OUT: thread prints line execution' );

      test_jvm = new JSENVM();

      var index = 0;
      var test_var1 = false;
      const thread1 =  [
        ()=> console.log( 'Start code' ),
        JSEN.label('loop'),
          ()=> ++index,
          ()=> console.log( 'Loop index = '+index ),
          JSEN.if( ()=> index == 5 ),
            ()=> test_var1 = true,
          'Seting test_var1 again to false to make sure',
          'the breakpoint is generated on previous line',
          ()=> test_var1 = false,
          JSEN.sleep( 0.5 ),
          JSEN.if( ()=> index < 100 ),
            JSEN.goto( 'loop' ),
        ()=> console.log( 'End code' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm._logStatus();

      var code = [
        ()=> console.log( 'Control thread: Setting breakpoint condition \'()=> test_var1 == true\'' ),
        ()=> test_jvm.setBreakpoint( 'thread1', ()=> test_var1 == true ),
        ()=> console.log( 'Control thread: Starting thread' ),
        ()=> test_jvm.startThread( 'thread1' ),
        ()=> console.log( 'Control thread: Waiting 5 seconds' ),
        JSEN.sleep( 5 ),
        ()=> console.log( 'Control thread: continuing execution for 3 seconds' ),
        ()=> test_jvm.continueThread( '*' ),
        JSEN.sleep( 3 ),
        ()=> console.log( 'Control thread: Stopping thread' ),
        ()=> test_jvm.stopThread( 'thread1' ),
      ];
      JZENVM.run( code );
    },
    threadWithBreakpointsAndAction: ()=> {
      console.log( 'Start a thread with a few lines of code in a loop, set a breakpoint, then trigger it' );
      console.log( 'OUT: thread prints line execution' );

      test_jvm = new JSENVM();

      var index = 0;
      var test_var1 = false;
      const thread1 =  [
        ()=> console.log( 'Start code' ),
        JSEN.label('loop'),
          ()=> ++index,
          ()=> console.log( 'Loop index = '+index ),
          JSEN.if( ()=> index == 5 ),
            ()=> test_var1 = true,
          'Seting test_var1 again to false to make sure',
          'the breakpoint is generated on previous line',
          ()=> test_var1 = false,
          JSEN.sleep( 0.5 ),
          JSEN.if( ()=> index < 100 ),
            JSEN.goto( 'loop' ),
        ()=> console.log( 'End code' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm._logStatus();

      var code = [
        ()=> console.log( 'Control thread: Setting breakpoint condition \'()=> test_var1 == true\' action \'()=> console.log(...)\'' ),
        ()=> test_jvm.setBreakpoint( 'thread1', ()=> test_var1 == true, ()=> console.log( '--> breakpoint action <--' ) ),
        ()=> console.log( 'Control thread: Starting thread' ),
        ()=> test_jvm.startThread( 'thread1' ),
        ()=> console.log( 'Control thread: Waiting 5 seconds' ),
        JSEN.sleep( 5 ),
        ()=> console.log( 'Control thread: continuing execution for 3 seconds' ),
        ()=> test_jvm.continueThread( '*' ),
        JSEN.sleep( 3 ),
        ()=> console.log( 'Control thread: Stopping thread' ),
        ()=> test_jvm.stopThread( 'thread1' ),
      ];
      JZENVM.run( code );
    },
    threadsRenewStartAll: ()=> {
      console.log( 'Start and end two threads with a few lines of code, then renew both' );
      console.log( 'OUT: threads print line execution' );

      test_jvm = new JSENVM();

      const thread1 =  [
        ()=> console.log( 'T1: Start code' ),
        ()=> console.log( 'T1: Exec line one' ),
        ()=> console.log( 'T1: Exec line two' ),
        ()=> console.log( 'T1: Exec line three' ),
        ()=> console.log( 'T1: End code' ),
      ];

      var thread2 =  [
        ()=> console.log( 'T2: Start code' ),
        ()=> console.log( 'T2: Exec line one' ),
        JSEN.loop(),
        [
          ()=> console.log( 'T2: Exec loop' ),
          JSEN.sleep( 1 ),
        ],
        ()=> console.log( 'T2: End code' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.newThread( 'thread2', thread2 );
      test_jvm.startThread( 'thread1' );
      test_jvm.startThread( 'thread2' );

      test_jvm._logStatus();

      var code = [
        ()=> console.log( 'Wait 3 seconds' ),
        JSEN.sleep( 3 ),
        ()=> console.log( 'Control thread: Stop all threads' ),
        ()=> test_jvm.stopThread( '*' ),
        ()=> console.log( 'Control thread: Renewing all threads' ),
        ()=> test_jvm.renewThread( '*' ),
        ()=> console.log( 'Wait 3 seconds' ),
        JSEN.sleep( 3 ),
        ()=> console.log( 'Control thread: Starting all threads' ),
        ()=> test_jvm.startThread( '*' ),
        JSEN.sleep( 3 ),
        ()=> console.log( 'Control thread: Stop all threads' ),
        ()=> test_jvm.stopThread( '*' ),
      ];
      JZENVM.run( code );
    },
  },
  threadAdvanced: {
    threadWithCodeAndPeriodicThread: ()=> {
      console.log( 'Start a thread with a few lines of code as periodic thread' );
      console.log( 'OUT: thread runs in a periodic thread with 1 second' );

      test_jvm = new JSENVM();

      test_var1 = false;
      const thread1 =  [
        ()=> console.log( 'Start code' ),
        ()=> console.log( 'Run a period' ),
        ()=> console.log( 'test_var1 = '+test_var1 ),
        JSEN.if( ()=> test_var1 == true ),
          JSEN.break(),
        ()=> console.log( 'End current period' ),
      ];

      test_jvm.newThread( 'thread1', thread1 );
      test_jvm.startPeriodicThread( 'thread1', 1 );

      var code = [
        ()=> test_var1 = false,
        ()=> console.log( 'Control thread: variable test_var1 is now ' + test_var1 ),
        JSEN.sleep(4),
        ()=> test_var1 = true,
        ()=> console.log( 'Control thread: variable test_var1 is set to ' + test_var1 ),
      ];
      JZENVM.run( code );

      test_jvm._logStatus();
    },
    threadJoin: ()=> {
      console.log( 'Start several threads and add a join for some of them' );
      console.log( 'OUT: thread get join executed at termination of last thread' );

      test_jvm = new JSENVM();

      const getRandomInRange = ( min, max )=> Math.ceil( (max-min)*Math.random()+min );

      const thread = [
        JSEN.print( 'Start' ),
        JSEN.for( 'i', 10 ),
        [
          JSEN.print( 'Rurrning for now' ),
          JSEN.sleep( ()=> getRandomInRange( 2, 4 ) ),
        ],
        JSEN.print( 'End' ),
      ];

      test_jvm.newThread( 'thread0', thread );
      test_jvm.newThread( 'thread1', thread );
      test_jvm.newThread( 'thread2', thread );
      test_jvm.newThread( 'thread3', thread );
      test_jvm.newThread( 'thread4', thread );

      const joinCallback = ()=> console.log( 'thread 0,2,3 joined!!!' );
      test_jvm.addThreadJoin( [ 'thread0' ,'thread2', 'thread3' ], joinCallback );

      test_jvm.startAllThread();
    }
  },
  serialization: {
    serializeThread: ()=> {
      console.log( 'Serialization of thread code' );
      console.log( 'OUT: print thread source code' );

      test_jvm = new JSENVM();

      test_var1 = true;
      const test_array = [ 1, 'a', true, ()=> console.log('Hello world!') ];
      const thread = [
        ()=> console.log( 'Start code' ),
        JSEN.foreach( 'iterator1', ()=> test_array ),
        [
          ()=> console.log( 'T1: Exec foreach line one' ),
          JSEN.get( 'iterator1', (iterator)=> test_var1 = iterator ),
          ()=> console.log( 'T1: Current iterator value: '+test_var1 ),
          ()=> console.log( 'T1: Current iterator item: '+test_array[ test_var1 ] ),
          JSEN.sleep( 0.5 ),
        ],
        ()=> console.log( 'Before a JSEN.on' ),
        JSEN.on( ()=> test_var1 == true ),
        ()=> console.log( 'Before the if' ),
        JSEN.if( ()=> test_var1 == true ),
        [
          'We are in a if statement',
          ()=> console.log( 'test_var1 true' ),
        ],
        JSEN.else(),
        [
          'We are in a else statement',
          ()=> console.log( 'test_var1 false' ),
          ()=> test_var1 = true,
        ],
        ()=> console.log( 'After if' ),
        JSEN.for( 'iterator1', 2, 8 ),
        [
          ()=> console.log( 'T1: Inside for block ----------' ),
          JSEN.get( 'iterator1', (iterator)=> test_var1 = iterator ),
          ()=> console.log( 'T1: Current iterator value: '+test_var1 ),
          JSEN.sleep( 1 ),
        ],
        ()=> console.log( 'End code' ),
      ];

      test_jvm.newThread( 'thread', thread );

      test_jvm._logStatus();
      console.log( test_jvm.toSource( 'thread' ) );
    },
  },
}

function JSENVM_runTest( testItem, directTestName, showTestNames, indentation ) {
  // Default value for testItem
  testItem = ( testItem? testItem: testJSENVM);
  // Default value for showTestNames
  showTestNames = ( showTestNames? showTestNames: false );
  indentation = ( indentation? indentation: '' );
  // Result of test call (usefull when calling a single test)
  var result = null;

  // Check if test is a group or a function
  switch( typeof( testItem ) ) {
    case 'function':
      // Test is a function ==> execute it
      if( !showTestNames ) {
        // If direct test name specified then filter all test out
        if( directTestName &&
            directTestName != testItem.name ) {
          break;
        }
        console.log( '*[ Run test:'+testItem.name+' ]***************' );
        result = testItem();
        console.log( '*[ Run END ]*******************************' );
      }
      break;
    case 'object':
      // Test is a group or an array ==> traverse it
      for( const testName of Object.keys( testItem )) {
        if( showTestNames ) {
          if( typeof( testItem[testName] ) == 'function') {
            console.log( indentation+'Test: '+testName );
          } else {
            console.log( indentation+'Group: '+testName );
          }
        }
        result = JSENVM_runTest( testItem[testName],
                                 directTestName,
                                 showTestNames,
                                 indentation+ '  ' );
      }
      break;
  }
  return result;
}

