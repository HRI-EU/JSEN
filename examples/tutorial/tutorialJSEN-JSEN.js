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

// NOTE:
// This file is meant to be read together with tutorialJSEN-JavaScript.js
// The both files should be browsed side-by-side
// Each section here have the equivalent in the other file

// ---------------------------------------------------
// JSEN: Run a function ------------------------------

// Define a jsen function
let test = [
  'this is a comment',
  ()=> console.log( 'Ciao a tutti' ),
];

// Run function
JSEN.run( test );

/* OUTPUT:
/   Ciao a tutti
/*/

// ---------------------------------------------------
// JSEN: Get function source -------------------------

// Define a jsen function
test = [
  'this is a comment',
  ()=> console.log( 'Ciao a tutti' ),
];

// Show function source
console.log( JSEN.stringify( test, null, 2 ) );

/* OUTPUT:
/   [
/     'this is a comment',
/     ()=> console.log( 'Ciao a tutti' ),
/   ],
/*/

// ---------------------------------------------------
// JSEN: Access function statements ------------------

// Define a jsen function
test = [
  'this is a comment',
  ()=> console.log( 'Ciao a tutti' ),
];

console.log( test[0] );  // Print 'this is a comment' on console
test[1]();               // Print 'Ciao a tutti' on console

// ---------------------------------------------------
// JSEN: Modify function statements ------------------

// Define a jsen function
test = [
  'this is a comment',
  ()=> console.log( 'Ciao a tutti' ),
];

// Change second line of test function
test[1] = ()=> console.log( new Date().toDateString() );

// Run function
JSEN.run( test );

/* OUTPUT:
/   Ciao a tutti
/   Sat May 14 2022
/*/

// ---------------------------------------------------
// JSEN: Call external function at runtime -----------

function aFunction() {
  console.log( 'ciao ciao' );
}

 test = [
  ()=> aFunction(),
  ()=> console.log( 'Ciao a tutti' ),
];

// Run function
JSEN.run( test );

/* OUTPUT:
/   ciao ciao
/   Ciao a tutti
/*/

// ---------------------------------------------------
// JSEN: Call external function at compile time ------

function aFunction() {
  return( ()=> console.log( 'This is like a preprocessor' ) );
}

test = [
  aFunction(),
  ()=> console.log( 'Ciao a tutti' ),
];

/* NOTE: this is a way to use JavaScript as preprocessor,
/  test after its definition looks like this:
/
/    test = [
/     ()=> console.log( 'This is like a preprocessor' )
/     ()=> console.log( 'Ciao a tutti' ),
/   ];
/
/*/

// Run function
JSEN.run( test );

/* OUTPUT:
/   This is like a preprocessor
/   Ciao a tutti
/*/

// ---------------------------------------------------
// JSEN: Use of variables 1 ---------------------------

let v = 1;
test = [
  JSEN.print( 'Saluti '+v ),
  ()=> v = 5,
  JSEN.print( 'Saluti '+v ),
];

/* NOTE: JSEN.print resolve all its parameters at compile time,
/  test after its definition is equivalent to this:
/
/   test = [
/     JSEN.print( 'Saluti 1' ),
/     ()=> v = 5,
/     JSEN.print( 'Saluti 1' ),
/   ];
/
/*/

// Run function
JSEN.run( test );

/* OUTPUT:
/   Saluti 1
/   Saluti 1
/*/

// ---------------------------------------------------
// JSEN: Useing variables 2 --------------------------

v = 1;
test = [
  ()=> console.log( 'Saluti '+v ),
  ()=> v = 5,
  ()=> console.log( 'Saluti '+v ),
];

// Run function
JSEN.run( test );

/* OUTPUT:
/   Saluti 1
/   Saluti 5
/*/

// ---------------------------------------------------
// JSEN: Execute threads -----------------------------

let thread1 = [
  JSEN.sleep( 3 ),
  ()=> console.log( '[1] This is' ),
  JSEN.sleep( 1 ),
  ()=> console.log( '[1] a JSEN' ),
  JSEN.sleep( 2 ),
  ()=> console.log( '[1] thread' ),
];

let thread2 = [
  JSEN.sleep( 1 ),
  ()=> console.log( '[2] This is' ),
  JSEN.sleep( 1 ),
  ()=> console.log( '[2] a JSEN' ),
  JSEN.sleep( 1 ),
  ()=> console.log( '[2] thread' ),
];

// Instantiate the threads
jvm.newThread( 'thread1', thread1 );
jvm.newThread( 'thread2', thread2 );

// Start the threads
jvm.startThread( 'thread1' );
jvm.startThread( 'thread2' );

/* OUTPUT
/   [2] This is
/   [2] a JSEN
/   [1] This is
/   [2] thread
/   [1] a JSEN
/   [1] thread
/*/

// ---------------------------------------------------
// JSEN: Execute thread objects ---------------------

class ThreadObj extends JSENThreadClass {
  constructor( instanceName ) {
    super( instanceName );

    this.threadList = {
     'basic': [
       JSEN.print( 'Basic thread' ),
       JSEN.sleep( 1 ),
       JSEN.print( 'Defined in a class' ),
     ],
    };
  }
}

let to = new ThreadObj( 't1' );
to.start();