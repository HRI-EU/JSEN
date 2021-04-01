/*
 *  nJZENVM - Nano JZEN Virtual Machine, very basic implementation
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
  // Main function: execute JSEN code
  static run( jsenCode ) {
    const threadContext = {
      code: jsenCode,
      pc: 0,
      labelList: {
        blockBegin: 0,
        blockEnd: jsenCode.length,
      },
    };
    JZENVM._runContext( threadContext );
  }
  // Executes a jzen context
  static _runContext( threadContext ) {
    // While we are not at the end of the code
    const jsenCode = threadContext.code;
    const jsenCodeLen = jsenCode.length;
    while( threadContext.pc < jsenCodeLen ) {
      // Get next statement
      const codeStatement = jsenCode[threadContext.pc];
      switch ( typeof( codeStatement ) ) {
        case 'function':  // Case of code like: ()=> console.log( 'message' ),
          codeStatement();
          break;
        case 'string':    // Case of comment like: 'This is a comment',
        case 'undefined': // Case of comment like: ,
          break;
        case 'object':    // Case of block like: [ ... ],
          if( Array.isArray( codeStatement ) ) {
            JZENVM.run( codeStatement );
          } else {        // Case of jsen statement like: JSEN.print( 'message' ),
            switch( codeStatement.name ) {
              case 'sleep': // Suspend execution for sleep timeout
                const timeout = codeStatement.params*1000;
                ++threadContext.pc;
                setTimeout( ()=> JZENVM._runContext( threadContext ), timeout );
                return;
              case 'print': // Print a message in console
                const message = codeStatement.params;
                console.log(message);
                break;
              case 'if': // Evaluate condition
                const condition = codeStatement.params;
                threadContext.pc = ( condition()? threadContext.pc: threadContext.pc+1 );
                break;
              case 'label': // Store label position
                const newLabelName = codeStatement.params;
                threadContext.labelList[newLabelName] = threadContext.pc;
                break;
              case 'goto': // Jump to label
                const labelName = codeStatement.params;
                const labelPc = threadContext.labelList[labelName]
                if( labelPc !== undefined )
                  threadContext.pc = labelPc;
                break;
              default: 
                console.log( 'Error: statement not supported '+codeStatement.name );
                return;
            }
          }
          break;
      }
      ++threadContext.pc;
    }
  }
}

if( module ) {
  module.exports = JZENVM;
}
