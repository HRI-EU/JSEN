/*
 *  JSEN Main Object
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

// NOTE: Output is generated in JavaScript console
// NOTE: Setup of JSENStudio in this sript is done in JSENExample2Setup.js

// Basic class for all Agents
class Agent extends JSENThreadClass {
  constructor( instanceName ) {
    super( instanceName );

    jvm.signalInit( 'start1' );
    jvm.signalInit( 'start2' );

    this.threadList = {
     'basic_isStepByStep': true,
     'basic': [
       JSEN.print( 'Basic thread' ),
     ],
    };
  }
  sendMessage( message ) {
    console.log( this.instanceName, message );
  }
}

// Example jsen class for Bob
class Bob extends Agent {
  constructor( instanceName ) {
    super( instanceName );

    this.threadList['main_isStepByStep'] = true;
    this.threadList['main'] = [
      ()=> _testGPlot( 900, 500 ),
      ()=> console.log( 'Bob start' ),
      ()=> this.sendMessage( 'load setup1' ),
      JSEN.signalNotify( 'start1' ),
      JSEN.signalNotify( 'start2' ),
    ];
  }
}

// Example jsen class for Agent1
class Agent1 extends Agent {
  constructor( instanceName ) {
    super( instanceName );

    this.threadList['main_isStepByStep'] = true;
    this.threadList['main'] = [
      JSEN.signalWait( 'start1' ),
      ()=> console.log( 'Agent1 start' ),

      ()=> this.sendMessage( 'say hi' ),
      JSEN.sleep( 3 ),

      ()=> console.log( 'Agent1 stop' ),
    ];
  }
}

// Example jsen class for Agent2
class Agent2 extends Agent {
  constructor( instanceName ) {
    super( instanceName );

    this.threadList['main_isStepByStep'] = true;
    this.threadList['main'] = [
      JSEN.signalWait( 'start2' ),
      ()=> console.log( 'Agent2 start' ),

      ()=> this.sendMessage( 'say hallo' ),
      JSEN.sleep( 1 ),

      ()=> this.sendMessage( 'say goodbye' ),
      JSEN.sleep( 5 ),

      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
      ()=> console.log( 'Agent2 stop' ),
    ];
  }
}

// Active object list
const actObjList = {
  'B': new Bob( 'Bob' ),
  'S': new Agent1( 'Steven' ),
  'A': new Agent2( 'Alex' ),
};

// Start all active objects
for( const a in actObjList ) {
  actObjList[a].start();
}
