/*
 * Basic JSEN tutorial (JSEN part)
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

// JSEN Lesson 1 --------------------------------------------

const test = [
  'this is a comment',
  ()=> console.log( 'Ciao a tutti' ),
];

console.log( test[0] );  // Print 'this is....' on console
test[1]();               // Execute line 2 of JSEN test
JSEN.run( test );

// Lesson 2 --------------------------------------------

function a() {
  console.log( 'ciao ciao' );
}

const test2 = [
  ()=> a(),
  ()=> console.log( 'Ciao a tutti' ),
];







JSEN.run( test2 );
// prints: ciao ciao
//         Ciao a tutti

// Lesson 3 --------------------------------------------
let v = 1;
const test3 = [
  jsen_print( 'Saluti'+v ),
  ()=> console.log( 'Ciao a tutti' ),
];

// const test2 = [
//   { callName: 'jsen_print', params: 'Saluti 1' },
//   ()=> console.log( 'Ciao a tutti' ),
// ];

JSEN.run( test3 );

// Lesson 4 --------------------------------------------

/*
signalInit( name ) --> (optional) initialize a signal
signalWait( name ) --> makes a jsen program suspend until signalNotify is called
signalNotify( name ) --> make a signalWait continue
*/