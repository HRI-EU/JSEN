/*
 *  JZENVM - JZEN Virtual Machine (basic implementation) with threading
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

class JZENVM {
  // Main function: execute all (each argument is a jsen code)
  static run( /* var args, each a jsen code */ ) {
    // Create context for all threads
    let context = {
      threadList: [],     // Threads are stored here
      isRunning: false,   // Flag for JZEN execution
    };
    // For each parameter (each jsenCode)
    for ( const jsenCode of arguments ) {
      // Push a thread context in threadList
      context.threadList.push({
        isRunning: true,         // Flag for thread execution
        code: jsenCode,          // Thread code
        pc: 0,                   // Program counter
        callerBlock: null,       // Pointer to the caller block
        labelList: {             // List of lables found during execution
          blockBegin: 0,
          blockEnd: jsenCode.length,
        },
      });
    }
    // Run all threads
    JZENVM._runContext( context );
  }

  // Function to execute a jzen context in steps
  static _runContext( context ) {
    // Flag that JZEN_stepRun() is running
    context.isRunning = true;
    // Flag used to detect if all threads are still running vs terminated/onSleep
    let isStatementExecuted = true;
    // Execute steps of threads while jzen is running 
    while( isStatementExecuted == true ) {
      // Reset execution flag (if in the for no threads execute a step --> we go out of the while)
      isStatementExecuted = false;
      // Execute one step for each thread
      for( const thread of context.threadList ) {
        if( thread.isRunning && ( thread.pc < thread.code.length ) ) {
          isStatementExecuted = true;
          // Get next statement
          const codeStatement = thread.code[thread.pc];
          // Execute the next statement
          switch ( typeof( codeStatement ) ) {
            case 'function':  // Case of code like: ()=> console.log( 'message' ),
              codeStatement();
              break;
            case 'string':    // Case of comment like: 'This is a comment',
            case 'undefined': // Case of comment like: ,
              break;
            case 'object':    // Case of block like: [ ... ],
              if( Array.isArray( codeStatement ) ) {
                const thisThread = Object.assign( {}, thread );
                thread.code = codeStatement;
                thread.pc = -1; // Set to -1 since it will be incremented after the switch
                thread.callerBlock = thisThread;
              } else {        // Case of jzen statement like: jsen_print( 'message' ),
                switch( codeStatement.name ) {
                case 'sleep': // Suspend execution for sleep timeout
                  const timeout = codeStatement.params*1000;
                  thread.isRunning = false;
                  setTimeout( ()=>{ thread.isRunning = true; if( !context.isRunning ) JZENVM._runContext( context ); }, timeout );
                  break;
                case 'print': // Print a message in console
                  const message = codeStatement.params;
                  console.log(message);
                  break;
                case 'if': // Evaluate condition
                  const condition = codeStatement.params;
                  thread.pc = ( condition()? thread.pc: thread.pc+1 );
                  break;
                case 'label': // Store label position
                  const newLabelName = codeStatement.params;
                  thread.labelList[newLabelName] = thread.pc;
                  break;
                case 'goto': // Jump to label
                  const labelName = codeStatement.params;
                  const labelPc = thread.labelList[labelName]
                  if( labelPc !== undefined )
                    thread.pc = labelPc;
                  break;
                }
              }
              break;
          }
          // Incremente thread's program counter
          ++thread.pc;
        } else {
          // If current thread reached end of code and has a caller block
          if( ( thread.pc >= thread.code.length ) && ( thread.callerBlock ) ) {
            isStatementExecuted = true;
            // Switch code to caller block
            thread.code = thread.callerBlock.code;
            thread.pc = thread.callerBlock.pc+1;
            thread.callerBlock = thread.callerBlock.callerBlock;
          }
        }
      }
    }
    // Flag that JZENVM._runContext() is not running
    context.isRunning = false;
  }
}

if( module ) {
  module.exports = JZENVM;
}
