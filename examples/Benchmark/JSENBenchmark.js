/*
 *  JSEN benchmark comparing execution performance relative to pure js
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
 
const JSEN = require( '../../src/JSEN.js' );
const JSENVM = require( '../../src/JSENVM.js' );

// Total number of iteration for each benchmark
let nbIteration = 1000;
const verbose = false;

/* ---------------------BENCHMARK 1-------------------------- */

/** Data for benchmark **/

// Main data
let b1_m1 = [ 
  [1,2,3,4,5, 6, 7, 8, 9,10,11,12,13,14,15,16,17,18,19,20],
  [3,4,5,6,7, 8, 9,10,11,12,13,14,15,16,17,18,19,20,21,22],
  [1,2,3,4,5, 6, 7, 8, 9,10,11,12,13,14,15,16,17,18,19,20],
  [3,4,5,6,7, 8, 9,10,11,12,13,14,15,16,17,18,19,20,21,22],
  [1,2,3,4,5, 6, 7, 8, 9,10,11,12,13,14,15,16,17,18,19,20],
  [3,4,5,6,7, 8, 9,10,11,12,13,14,15,16,17,18,19,20,21,22],
  [1,2,3,4,5, 6, 7, 8, 9,10,11,12,13,14,15,16,17,18,19,20],
  [3,4,5,6,7, 8, 9,10,11,12,13,14,15,16,17,18,19,20,21,22],
  [1,2,3,4,5, 6, 7, 8, 9,10,11,12,13,14,15,16,17,18,19,20],
  [3,4,5,6,7, 8, 9,10,11,12,13,14,15,16,17,18,19,20,21,22],
  [1,2,3,4,5, 6, 7, 8, 9,10,11,12,13,14,15,16,17,18,19,20],
  [3,4,5,6,7, 8, 9,10,11,12,13,14,15,16,17,18,19,20,21,22],
  [1,2,3,4,5, 6, 7, 8, 9,10,11,12,13,14,15,16,17,18,19,20],
  [3,4,5,6,7, 8, 9,10,11,12,13,14,15,16,17,18,19,20,21,22],
  [1,2,3,4,5, 6, 7, 8, 9,10,11,12,13,14,15,16,17,18,19,20],
  [3,4,5,6,7, 8, 9,10,11,12,13,14,15,16,17,18,19,20,21,22],
  [1,2,3,4,5, 6, 7, 8, 9,10,11,12,13,14,15,16,17,18,19,20],
  [3,4,5,6,7, 8, 9,10,11,12,13,14,15,16,17,18,19,20,21,22],
  [1,2,3,4,5, 6, 7, 8, 9,10,11,12,13,14,15,16,17,18,19,20],
  [3,4,5,6,7, 8, 9,10,11,12,13,14,15,16,17,18,19,20,21,22]
];
let b1_m2 = [
  [5,6,7, 8, 9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26],
  [7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28],
  [5,6,7, 8, 9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26],
  [7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28],
  [5,6,7, 8, 9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26],
  [7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28],
  [5,6,7, 8, 9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26],
  [7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28],
  [5,6,7, 8, 9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26],
  [7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28],
  [5,6,7, 8, 9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26],
  [7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28],
  [5,6,7, 8, 9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26],
  [7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28],
  [5,6,7, 8, 9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26],
  [7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28],
  [5,6,7, 8, 9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26],
  [7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28],
  [5,6,7, 8, 9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26],
  [7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28],
];
let b1_result;
let b1_jsIterationCounter = 0;

/** Code for benchmark **/

// Pure js function for benchmark
function multiplyMatrices() {
  let result = [];
  for( let i = 0; i < b1_m1.length; ++i ) {
      result[i] = [];
      for( let j = 0; j < b1_m2[0].length; ++j ) {
        let acc = 0;
          for( let k = 0; k < b1_m1[0].length; ++k ) {
              acc += b1_m1[i][k] * b1_m2[k][j];
              ++b1_jsIterationCounter;
          }
          result[i][j] = acc;
      }
  }
  b1_result = result;
}

// Pure js call of benchmark
function jsBenchmark1() {
  console.log( '* [JS] Multiply', nbIteration, 'times two 20x20 Matrices.' );
  console.time( 'multiplyMatrices' );
  for( let i = 0; i < nbIteration; ++i ) {
    multiplyMatrices();
  }
  console.timeEnd( 'multiplyMatrices' );
  // Print last result
  if( verbose ) {
    console.table( b1_result );
  }
  console.log( ' ITERATION JS: '+b1_jsIterationCounter );
}

// JSEN call of benchmark
// Buffer variables
let i, j, k, sum;
let b1_jsenIterationCounter = 0;
// Benchmark code
let jsenBenchmark1 = [
  ()=> console.log( '* [JSEN] Multiply', nbIteration, 'times two 20x20 Matrices.' ),
  ()=> console.time( 'multiplyMatrices' ),
  JSEN.for( 'iter', 0, nbIteration ),
  [
    ()=> b1_result = [],
    JSEN.for( 'i', 0, ()=> b1_m1.length ),
    [
      JSEN.get( 'i', (value)=> i = value ),
      ()=> b1_result[i] = [],
      JSEN.for( 'j', 0, ()=> b1_m2[0].length ),
      [
        JSEN.get( 'j', (value)=> j = value ),
        ()=> sum = 0,
        JSEN.for( 'k', 0, ()=> b1_m1[0].length ),
        [
          JSEN.get( 'k', (value)=> k = value ),
          ()=> sum += b1_m1[i][k] * b1_m2[k][j],
          ()=> ++b1_jsenIterationCounter,
        ],
        ()=> b1_result[i][j] = sum,
      ],
    ],
  ],
  ()=> console.timeEnd( 'multiplyMatrices' ),
  ' Print last result',
  ()=> {
    if( verbose ) {
      console.table( b1_result );
    }
    console.log( ' ITERATION JSEN: '+b1_jsenIterationCounter );
  },
];

/* ---------------------BENCHMARK 2-------------------------- */

/** Data for benchmark **/

// Main data
let b2_arraySize = 60;
let b2_input = Array.from( Array( b2_arraySize ) )
                    .map( x => Math.floor( Math.random()*b2_arraySize ) );
let b2_result;
let b2_jsIterationCounter = 0;

/** Code for benchmark **/

// Pure js function for benchmark
function bubbleSort() {
  let numElements = b2_input.length-1;
  let vector = [...b2_input];
  let isSwapDone = false;
  do {
      isSwapDone = false;
      for( let j = 0; j < numElements; ++j ) {
        if( vector[j] < vector[j+1] ) {
          let tmp = vector[j];
          vector[j] = vector[j+1];
          vector[j+1] = tmp;
          isSwapDone = true;
        }
        ++b2_jsIterationCounter;
      }
      --numElements;
  } while( isSwapDone );
  b2_result = vector; 
}

// Pure js call of benchmark
function jsBenchmark2() {
  console.log( '* [JS] Bubble Sort', nbIteration ,'times an array of', 
               b2_arraySize, 'random integers in [0...'+b3_arraySize+']' );
  console.time( 'bubbleSort' );
  for( let i = 0; i < nbIteration; ++i ) {
    bubbleSort();
  }
  console.timeEnd( 'bubbleSort' );
  // Print last result
  if( verbose ) {
    console.log( b2_result );
  }
  console.log( ' ITERATION JS: '+b2_jsIterationCounter );
}

// JSEN call of benchmark
// Buffer variables
let vector, isSwapDone, numElements, tmp;
i = 0;
let b2_jsenIterationCounter = 0;
// Benchmark code
let jsenBenchmark2 = [
  ()=> console.log( '* [JSEN] Bubble Sort', nbIteration ,'times an array of', 
                    b2_arraySize, 'random integers in [0...'+b3_arraySize+']' ),
  ()=> console.time( 'bubbleSort' ),
  JSEN.for( 'iter', 0, nbIteration ),
  [
    ()=> numElements = b2_input.length-1,
    ()=> vector = [...b2_input],
    [
      ()=> isSwapDone = false,
      JSEN.for( 'i', 0, ()=> numElements ),
      [
        JSEN.get( 'i', (value)=> i = value ),
        JSEN.if( ()=> vector[i] < vector[i+1] ),
        [
          ()=> tmp = vector[i],
          ()=> vector[i] = vector[i+1],
          ()=> vector[i+1] = tmp,
          ()=> isSwapDone = true,
        ],
        ()=> ++b2_jsenIterationCounter,
      ],
      ()=> --numElements,
    ],
    JSEN.until( ()=> !isSwapDone ),
    ()=> b2_result = vector,
  ],
  ()=> console.timeEnd( 'bubbleSort' ),
  ' Print last result',
  ()=> {
    if( verbose ) {
      console.log( b2_result );
    }
    console.log( ' ITERATION JSEN: '+b2_jsenIterationCounter );
  },
];

/* ---------------------BENCHMARK 3-------------------------- */

/** Data for benchmark **/

// Main data
let b3_arraySize = 100;
let b3_input = Array.from( Array( b3_arraySize ) )
                .map( x => Math.ceil( Math.random()*100 )+1 );
let b3_result;
let b3_jsIterationCounter = 0;

/** Code for benchmark **/

// Pure js function for benchmark
function primeFactors() {
  for( let n of b3_input ) {
    const factors = [];
    let divisor = 2;
    while( n >= 2 ) {
      if( n % divisor == 0 ) {
        factors.push( divisor );
        n = n / divisor;
      } else {
        ++divisor;
      }
      ++b3_jsIterationCounter;
    }
    b3_result = factors;
  }
}

// Pure js call of benchmark
function jsBenchmark3() {
  console.log( '* [JS] Prime Factors', nbIteration ,'times of an array of', 
               b3_arraySize, 'random integers in [0...'+b3_arraySize+']' );
  console.time( 'primeFactors' );
  for( let i = 0; i < nbIteration; ++i ) {
    primeFactors();
  }
  console.timeEnd( 'primeFactors' );
  // Print last result
  if( verbose ) {
    console.log( 'Prime factors of '+b3_input[b3_input.length-1]+' : '+b3_result );
  }
  console.log( ' ITERATION JS: '+b3_jsIterationCounter );
}

// JSEN call of benchmark
// Buffer variables
let divisor, factors;
numElements = 0;
let b3_jsenIterationCounter = 0;
// Benchmark code
let jsenBenchmark3 = [
  ()=> console.log( '* [JSEN] Prime Factors', nbIteration ,'times of an array of', 
                    b3_arraySize, 'random integers in [0...'+b3_arraySize+']' ),
  ()=> console.time( 'primeFactors' ),
  JSEN.for( 'iter', 0, nbIteration ),
  [
    JSEN.foreach( 'n', b3_input ),
    [
      JSEN.get( 'n', (value)=> numElements = value ),
      ()=> {
        factors = [];
        divisor = 2;
      },
      JSEN.while( ()=> numElements >= 2 ),
      [
        JSEN.if( ()=> numElements % divisor == 0 ),
        [
          ()=> factors.push( divisor ),
          ()=> numElements = numElements / divisor,
        ],
        JSEN.else(),
        [
          ()=> ++divisor,
        ],
        ()=> ++b3_jsenIterationCounter,
      ],
      ()=> b3_result = factors,
    ],
  ],
  ()=> console.timeEnd( 'primeFactors' ),
  ' Print last result',
  ()=> {
    if( verbose ) {
      console.log( 'Prime factors of '+b3_input[b3_input.length-1]+' : '+b3_result );
    }
    console.log( ' ITERATION JSEN: '+b3_jsenIterationCounter );
  },
];

/* ---------------------BENCHMARK 4-------------------------- */

/** Data for benchmark **/

// Main data
let b4_inputString = "this is a long string  which we should try to find "+
                     "other strings that may be better to other string";
let b4_substring = "other string";
let b4_result;
let b4_jsIterationCounter = 0;

/** Code for benchmark **/

// The naive search of a string was taken from https://medium.com/
// Pure js function for benchmark
function naiveSearch() {
  let count = 0;
  for( let i = 0; i < b4_inputString.length; ++i ) {
      for( let j = 0; j < b4_substring.length; ++j ) {
          if ( b4_substring[j] !== b4_inputString[i+j] )
            break;
          if ( j === b4_substring.length - 1 ) 
            ++count;
          ++b4_jsIterationCounter;
      }
  }
  b4_result = count;
}

// Pure js call of benchmark
function jsBenchmark4() {
  console.log( '* [JS] Search', nbIteration, 'times strings of length', 
               b4_inputString.length, 'for a', b4_substring.length, 'char substring' );
  console.time( 'stringSearch' );
  for( let i = 0; i < nbIteration; ++i ) {
    naiveSearch();
  }
  console.timeEnd( 'stringSearch' );
  // Print last result
  if( verbose ) {
    console.log( 'Search ', b4_substring + ' in ', b4_inputString, '-->', 
                 b4_result, 'times found' );
  }
  console.log( ' ITERATION JS: '+b4_jsIterationCounter );
}

// JSEN call of benchmark
// Buffer variables
let count;
i = 0;
j = 0;
let b4_jsenIterationCounter = 0;
// Benchmark code
let jsenBenchmark4 = [
  ()=> console.log( '* [JSEN] Search', nbIteration, 'times strings of length', 
                    b4_inputString.length, 'for a', b4_substring.length, 'char substring' ),
  ()=> console.time( 'stringSearch' ),
  JSEN.for( 'iter', 0, nbIteration ),
  [
    ()=> count = 0,
    JSEN.for( 'i', 0, ()=> b4_inputString.length ),
    [
      JSEN.get( 'i', (value)=> i = value ),
      JSEN.for( 'j', 0, ()=> b4_substring.length ),
      [
        JSEN.get( 'j', (value)=> j = value ),
        JSEN.if( ()=> b4_substring[j] !== b4_inputString[i+j] ),
          JSEN.break(),
        JSEN.if( ()=> j === b4_substring.length - 1 ),
          ()=> ++count,
      ],
    ],
    ()=> b4_result = count,
  ],
  ()=> console.timeEnd( 'stringSearch' ),
  ' Print last result',
  ()=> {
    if( verbose ) {
      console.log( 'Search ', b4_substring + ' in ', b4_inputString, '-->', 
                   b4_result, 'times found' );
    }
    console.log( ' ITERATION JSEN: '+b4_jsenIterationCounter );
  },
];

/* ---------------------BENCHMARK 5-------------------------- */

/** Data for benchmark **/

// Main data
let totCount = 100;
let b5_a = 10;
let b5_b = 53;
let b5_result;
let b5_jsIterationCounter = 0;

/** Code for benchmark **/

// Pure js function for benchmark
function multiplyScalar() {
  for( let i = 0; i < totCount; ++i ) {
    b5_result = b5_a*b5_b;
    ++b5_jsIterationCounter;
  }
}

// Pure js call of benchmark
function jsBenchmark5() {
  console.log( '* [JS] Multiplication', nbIteration ,'times the numbers', b5_a, '*', b5_b );
  console.time( 'multiplyScalar' );
  for( let i = 0; i < nbIteration; ++i ) {
    multiplyScalar();
  }
  console.timeEnd( 'multiplyScalar' );
  if( verbose ) {
    console.log( 'Multiplication of', b5_a, '*', b5_b, '=', b5_result );
  }
  console.log( ' ITERATION JS: '+b5_jsIterationCounter );
}

// JSEN call of benchmark
// Buffer variables
i = 0;
let b5_jsenIterationCounter = 0;
// Benchmark code
let jsenBenchmark5 = [
  ()=> console.log( '* [JSEN] Multiplication', nbIteration ,'times the numbers', b5_a, '*', b5_b ),
  ()=> console.time( 'multiplyScalar' ),
  JSEN.for( 'iter', nbIteration ),
  [
    JSEN.for( 'i', 0, totCount ),
    [
      JSEN.get( 'i', (value)=> i = value ),
      ()=> b5_result = b5_a*b5_b,
      ()=> ++b5_jsenIterationCounter,
    ],
  ],
  ()=> console.timeEnd( 'multiplyScalar' ),
  ()=> {
    if( verbose ) {
      console.log( 'Multiplication of', b5_a, '*', b5_b, '=', b5_result );
    }
    console.log( ' ITERATION JSEN: '+b5_jsenIterationCounter );
  },
];

/* -------------------Benchmarks Execution-------------------------*/

const runAllBenchmark = [
  JSEN.print( '<Start>' ),
  JSEN.print( '----------------Benchmark 1' ),
  ' Execute pure JavaScript code',
  ()=> jsBenchmark1(),
  ' Execute JSEN code',
  jsenBenchmark1,
  JSEN.print( '----------------Benchmark 2' ),
  ' Execute pure JavaScript code',
  ()=> jsBenchmark2(),
  ' Execute JSEN code',
  jsenBenchmark2,
  JSEN.print( '----------------Benchmark 3' ),
  ' Execute pure JavaScript code',
  ()=> jsBenchmark3(),
  ' Execute JSEN code',
  jsenBenchmark3,
  JSEN.print( '----------------Benchmark 4' ),
  ' Execute pure JavaScript code',
  ()=> jsBenchmark4(),
  ' Execute JSEN code',
  jsenBenchmark4,
  JSEN.print( '----------------Benchmark 5' ),
  ' Execute pure JavaScript code',
  ()=> jsBenchmark5(),
  ' Execute JSEN code',
  jsenBenchmark5,
  JSEN.print( '<End>' ),
];
JSENVM.run( runAllBenchmark );
