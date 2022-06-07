/*
 *  Simple JSEN exec example
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

let threadId;
const jsenTest = [
  // Begin thread
  JSEN.print( 'Start code' ),
  // The both statements do the same
  JSEN.print( 'This is just a print' ),
  ()=> JSENVM.exec( JSEN.print( 'This is just a print' ) ),
  // The both couple of statements do the same
  JSEN.sleep( 2 ),
  JSEN.print( 'After sleep' ),
  ()=> JSENVM.exec( [ JSEN.sleep( 2 ),
                      JSEN.print( 'After sleep' ) ] ),
  // End thread
  JSEN.print( 'End code' ),
];

// Here we will wakeup the thread after 10 seconds
setTimeout( ()=> JSENVM.jvm.wakeupThreadId( threadId ), 10*1000 );

// We start the thread here
console.log( 'JSENVM.run output' );
JSENVM.run( jsenTest );
