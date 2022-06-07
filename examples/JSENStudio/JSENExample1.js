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

const jvm = new JSENVM();
JSENStudio_setJVM( jvm );

const jsenTest = [
  ()=> console.log( 'start' ),
  JSEN.if( ()=> 10 > 1 ),
    ()=> console.log( 'condition true' ),
  ()=> console.log( 'Before sleep...' ),
  JSEN.sleep( 10 ),
  ()=> console.log( 'After sleep...' ),
  ()=> console.log( 'End code' ),
];

let number ;
const printNumbers = [
  JSEN.for( 'i', 0, 20 ),
  [
    JSEN.get( 'i', (value)=> number = value ),
    ()=> console.log( number ),
  ],
];

let upLetter = 'A'.charCodeAt( 0 );
const printUpLetters = [
  JSEN.for( 'i', 0, 26 ),
  [
    ()=> console.log( String.fromCharCode( upLetter ) ),
    ()=> ++upLetter,
  ],
];

let lowLetter = 'a'.charCodeAt( 0 );
const printLowLetters = [
  JSEN.for( 'i', 0, 26 ),
  [
    ()=> console.log( String.fromCharCode( lowLetter ) ),
    ()=> ++lowLetter,
  ],
];

jvm.newThread( 'test', jsenTest );
jvm.pauseThread( 'test' );
jvm.newThread( 'printNumbers', printNumbers );
jvm.pauseThread( 'printNumbers' );
jvm.newThread( 'printUpLetters', printUpLetters );
jvm.pauseThread( 'printUpLetters' );
jvm.newThread( 'printLowLetters', printLowLetters );
jvm.pauseThread( 'printLowLetters' );