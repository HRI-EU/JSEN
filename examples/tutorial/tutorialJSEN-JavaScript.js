/*
 * Basic JSEN tutorial (JavaScript part)
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
// This file is meant to be read together with tutorialJSEN-JSEN.js
// The both files should be browsed side-by-side
// Each section here have the equivalent in the other file

// -------------------------------------------------
// JS: Run a function ------------------------------

// Define a JavaScript
function test() {
  // this is a comment
  console.log( 'Ciao a tutti' );
}

// Run function
test();

/* OUTPUT:
/   Ciao a tutti
/*/

// -------------------------------------------------
// JS: Get function source -------------------------

// Define a JavaScript
function test() {
  // this is a comment
  console.log( 'Ciao a tutti' );
}

// Show function source
console.log( test.toSource() );

/* OUTPUT:
/   function test() {
/     // this is a comment
/     console.log( 'Ciao a tutti' );
/   }
/*/

// -------------------------------------------------
// JS: Access function statements ------------------

// Define a JavaScript
function test() {
  // this is a comment
  console.log( 'Ciao a tutti' );
}

// Not possible to access individual statement with JavaScript


// -------------------------------------------------
// JS: Modify function statements ------------------

// Define a JavaScript
function test() {
  // this is a comment
  console.log( 'Ciao a tutti' );
}

// Not possible to modify individual statement with JavaScript










// -------------------------------------------------
// JS: Modify function statements at runtime -------

function aFunction() {
  console.log( 'ciao ciao' );
}

function test() {
  aFunction();
  console.log( 'Ciao a tutti' );
}

// Run function
test();

/* OUTPUT:
/   ciao ciao
/   Ciao a tutti
/*/

// -------------------------------------------------
// JS: Call external function at compile time ------

function aFunction() {
  console.log( 'ciao ciao' );
}

function test() {
  // not possible in JavaScript
  console.log( 'Ciao a tutti' );
}

/* Its not possible in JavaScript to preprocess
   the definition of a function and change its content
   at compile time
  */














// -------------------------------------------------
// JS: Use of variables 1 --------------------------

let v = 1;
function test() {
  console.log( 'Saluti '+v );
  v = 5;
  console.log( 'Saluti '+v );
}












// Run function
test();

/* OUTPUT:
/   Saluti 1
/   Saluti 5
/*/

// -------------------------------------------------
// JS: Useing variables 2 --------------------------

v = 1;
function test() {
  console.log( 'Saluti '+v );
  v = 5;
  console.log( 'Saluti '+v );
}

// Run function
test();

/* OUTPUT:
/   Saluti 1
/   Saluti 5
/*/

// ---------------------------------------------------
// ---------------------------------------------------
