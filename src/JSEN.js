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

/**
 * JSEN Main Reference Object
 * This object implements the basic features of JSEN and the 
 * introduced the basic JSEN Virtual Languages statements
 */
class JSEN {
  /**
   * Parse a string JSEN data structure and return an instance of it
   * @param jsenStr a string encoded according to JSEN syntax
   * 
   * @return a JSEN data structure (JavaScript array)
   * 
   * @see JSEN.stringify
   */
  static parse( jsenStr ) {
    return JSON.parse( jsenStr );
  }
  /**
   * Encode a JSEN data structure into a string
   * 
   * @param jsenCode a JSEN data structure (JavaScript array)
   * @param replacer parameter not used
   * @param space an indentation string or a number representing the number of speced for indentation (see JSON.stringify)
   * 
   * @returns a string representing a JSEN data structure
   * @see JSEN.parse, JSON.strngify
   */
  static stringify( jsenCode, replacer, space, asArray, prevSpace ) {
    asArray = ( asArray? asArray: false );
    prevSpace = ( prevSpace? prevSpace: '' );

    let result = '';

    let codeLines = [ prevSpace+'[' ];
    space = prevSpace+( space? (typeof(space) == 'number'? ' '.repeat(space) :space): '' ); // Default value: no indentation
    let isControlNextStatement = false;

    // Loop on all code statement
    for( const codeStatement of jsenCode ) {
      // Get code statement type
      let codeStatementType = typeof( codeStatement );
      if( ( codeStatementType == 'object' ) && ( Array.isArray( codeStatement ) ) ) {
        codeStatementType = 'block';
      }

      // Init sting line with indentation
      let stringLine = space;
      // Introduce indentation after statements that controls the next statement (indent)
      if( isControlNextStatement ) {
        if( codeStatementType != 'block' ) {
          stringLine = space+stringLine;
        }
        isControlNextStatement = false;
      }

      // Generate statement
      switch( codeStatementType ) {
        case 'function':
          stringLine += codeStatement.toString();
          break;
        case 'string':
          stringLine += '\''+codeStatement+'\'';
        case 'undefined':
          break;
        case 'block':
          const blockLines = JSEN.stringify( codeStatement, replacer, space, asArray, space );
          codeLines = codeLines.concat( blockLines );
          break;
        case 'object':
          stringLine += codeStatement.toString( codeStatement );
          isControlNextStatement = ( codeStatement.isControlNextStatement? true: false );
          break;
      }
      if( codeStatementType != 'block' ) {
        codeLines.push( stringLine+',' );
      }
    }

    if( codeLines.length > 1 ) {
      codeLines.push( prevSpace+'],' );
    } else {
      codeLines[0] = '[]';
    }
    if( asArray ) {
      result = codeLines;
    } else {
      result = codeLines.join( '\n' );
    }
    return( result );
  }

  /* -----------------------------------------------------------------
   * Basic JSEN Statements
   *-----------------------------------------------------------------*/
  /**
   * Sleeps, suspending the execution for an interval of time
   * During sleep, a JSEN thread is moved in the suspended thread queue
   * @param {*} params number of seconds to sleep (1 = 1s, 0.5 = 500ms)
   * 
   * The parameter params can be:
   * - a float number: 1.2 // 1s and 200ms
   * - an object: { value: 1 } // 1s
   * - a function: ()=> 1 // 1s
   * 
   * @example
   *   JSEN.sleep( ()=> timeout ),
   * 
   * @see JSEN.on
   */
  static sleep = ( params )=> {
    return {
      //TODO: find a better way to have the indirect parameter by class.field
      name: 'sleep',
      params: params,
      toString: JSEN._toStringOneParams,
    };
  }
  /**
   * Log a message in jsen calls (log startd with thread name)
   * @param {*} msg a message to be printed to the console
   * 
   * The parameter msg can be:
   * - a function: ()=> 'ciao' // the message printed is 'ciao'
   * - an object: { value: 'ciao' } // the message printed is 'ciao'
   * - any other JavaScript data structure: it will be printed as it is
   * 
   * @example
   *   JSEN.print( 'Ciao' ),
   *   JSEN.print( ()=> variableValue ),
   */
  static print = ( msg )=> {
    return {
      name: 'print',
      params: msg,
      toString: JSEN._toStringOneParams,
    };
  }
  /**
   * Control statement if
   * @param {*} condition a boolean condition evaluated in the if statement
   *  
   * The parameter condition can be:
   * - a function: ()=> 1 > 10 // the function returns the validity of the condition
   * - an object: { value: true } // the value atrribute returns the validity of the condition
   * - any other JavaScript data structure: it will be evalutated as a condition
   * 
   * @example
   *   JSEN.if( ()=> i > 5 ),
   *     JSEN.print( 'Condition true' ),
   *   JSEN.else(),
   *     JSEN.print( 'Condition false' ),
   * 
   * @see JSEN.else
   */
  static if = ( condition )=> {
    return {
      name: 'if',
      params: condition,
      toString: JSEN._toStringOneParams,
      isControlNextStatement: true,
    };
  }
  /**
   * Define a lablel in a JSEN data structure. Label are local in JSEN blocks.
   * There are 2 labels available by default in every JSEN block: 'blockBegin', 'blockEnd'
   * @param {*} labelName name of the label as a string
   * 
   * The parameter labelName can be:
   * - a function: ()=> 'start' // the label is 'start'
   * - an object: { value: 'start' } // the label is 'start'
   * - a constant string: 'start' // the label is 'start'
   * 
   * @example
   *   JSEN.label( 'start' ),
   * 
   * @see JSEN.goto
   */
  static label = ( labelName )=> {
    // TODO: fill now the label list of the context (so, all label will be available at run time)
    return {
      name: 'label',
      params: labelName,
      toString: JSEN._toStringOneParams,
    };
  }
  /**
   * Jump to a lablel in a JSEN data structure. The goto have a limitations. A godo can
   * only jump into a local JSEN blocks. A jump between JSEN blocks is not supported.
   * A goto can only jump backwards, to a previously defined label.
   * @param {*} labelName name of the label as a string
   * 
   * The parameter labelName can be:
   * - a function: ()=> 'start' // the label is 'start'
   * - an object: { value: 'start' } // the label is 'start'
   * - a constant string: 'start' // the label is 'start'
   * 
   * @example
   *   JSEN.goto( 'start' ),
   * 
   * @see JSEN.goto
   */
  static goto = ( labelName )=> {
    return {
      name: 'goto',
      params: labelName,
      toString: JSEN._toStringOneParams,
    };
  }
  /* -----------------------------------------------------------------
   * Advanced JSEN Statements
   *-----------------------------------------------------------------*/
  /**
   * Suspends the exectuion of the JSEN thread until the condition becames true or the 
   * timeout is over (if specified). The JSEN thread is moved in the suspended thread queue
   * until the condition is true or until timeout is over
   * @param {*} condition condition to let the JSEN execution continue
   * @param {*} timeout max timeout to sleep while the condition is false
   * @param {*} onSatisfied function to execute once on become satisfied (executed athomically with on())
   * 
   * The exit status of a JSEN.on can be captured by JSEN.getOnStatus
   * 
   * @example
   *   JSEN.on( ()=> userName == 'guest', 1.2 ),
   *   JSEN.on( ()=> userName == 'guest' ),
   *   JSEN.on( ()=> userName == 'guest', null, ()=> console.log( 'User guest found' ) ),
   * 
   * @see JSEN.sleep, JSEN.getOnStatus
   */
  static on = ( condition, timeout, onSatisfied )=> {
    return {
      name: 'on',
      params: {
        condition: condition,
        timeout: timeout,
        onSatisfied: onSatisfied,
      },
      toString: (self)=> {
        const timeoutStr = ( self.params.timeout? ', '+JSEN._paramsToString( self.params.timeout ): '' );
        const onSatisfiedStr = ( self.params.onSatisfied? ', '+JSEN._paramsToString( self.params.onSatisfied ): '' );
        return 'JSEN.'+self.name+'( '+JSEN._paramsToString( self.params.condition )+timeoutStr+onSatisfiedStr+' )';
      },
    };
  }
  /**
   * Returns the exist status of a JSEN.on. It informs if the JSEN.on continued because
   * the condition became true (value: 'çondition') or the timeout is over (value: 'timeout')
   * @param {*} callback a function that contains as only parameter the value of the on status
   * 
   * @example
   *   JSEN.on( ()=> userName == 'guest', 10 ),
   *   JSEN.getOnStatus( (value)=> exitStatus = value ),
   *   JSEN.print( ()=> 'ON condition continued because of '+exitStatus ),
   * 
   * In this example the variable exitStatus can get the value 'condition' or 'timetout'
   * 
   * @see JSEN.on
   */
  static getOnStatus = ( callback )=> {
    return {
      name: 'getOnStatus',
      params: {
        variableName: '', // Set by virtual machine
        callback: callback,
      },
      toString: JSEN._toStringOneParams,
    };
  }
  /**
   * Control statement else, used in combination with a JSEN.if statement.
   * It executes the associated block in case the if condition is not true
   * 
   * @example
   *   JSEN.if( ()=> i > 5 ),
   *     JSEN.print( 'Condition true' ),
   *   JSEN.else(),
   *     JSEN.print( 'Condition false' ),
   * 
   * @see JSEN.if
   */
  static else = ( ifResult )=> {
    return {
      name: 'else',
      params: ifResult,
      toString: JSEN._toStringNoParams,
      isControlNextStatement: true,
    }
  }
  /**
   * Infinite loop on the associated JSEN block.
   * Such a loop can be terminated using JSEN.break
   * 
   * @example
   *   JSEN.loop(),
   *   [
   *     JSEN.print( 'We are in the loop' ),
   *     JSEN.if( ()=> i > 5 ),
   *       JSEN.break(),
   *     ()=> ++i,
   *   ],
   * 
   * @see JSEN.break
   */
  static loop = ()=> {
    return {
      name: 'loop',
      toString: JSEN._toStringNoParams,
      isControlNextStatement: true,
    };
  }
  /**
   * Interrupt the execution of a JSEN block, continuing execution after it.
   * In case there is no other continuation, the JSEN tread will be terminated.
   * JSEN.break can be used in conbination of a control statement or just into a 
   * simple JSEN block not controlled by any control statement
   * 
   * @see JSEN.continue, JSEN.loop, JSEN.for, JSEN.foreach, JSEN.while, JSEN.until
   */
  static break = ()=> {
    return {
      name: 'break',
      toString: JSEN._toStringNoParams,
    }
  }
  // Function to go to beginning of the currently running block or loop
  /**
   * Continue the execution of a JSEN block from the beginning of it.
   * JSEN.continue can be used in conbination of a control statement or just into a 
   * simple JSEN block not controlled by any control statement
   * 
   * @see JSEN.break, JSEN.loop, JSEN.for, JSEN.foreach, JSEN.while, JSEN.until
   */
  static continue = ()=> {
    return {
      name: 'continue',
      toString: JSEN._toStringNoParams,
    }
  }
  /**
   * Loop on the associated JSEN block while the condition is true.
   * Such a loop can be terminated using JSEN.break
   * 
   * @example
   *   JSEN.while( ()=> i > 5 ),
   *   [
   *     JSEN.print( 'We are in the loop' ),
   *   ],
   * 
   * @see JSEN.continue, JSEN.break, JSEN.loop, JSEN.for, JSEN.foreach, JSEN.until
   */
  static while = ( condition )=> {
    return {
      name: 'while',
      params: condition,
      toString: JSEN._toStringOneParams,
      isControlNextStatement: true,
    };
  }
  /**
   * Iterate on the associated JSEN block moving the iterator from lower to upper values.
   * Such a loop can be terminated using JSEN.break
   * 
   * 
   * @example
   *   JSEN.for( 'i', 10 ), // i => [0, 10[, increment 1
   *   [
   *     JSEN.print( 'We print this line 10 times' ),
   *   ],
   *   JSEN.for( 'i', 5, 10 ), // i => [5, 10[, increment 1
   *   [
   *     JSEN.print( 'We print this line 5 times' ),
   *   ],
   *   JSEN.for( 'i', 5, 10, 2 ), // i => [5, 7, 9], increment 2
   *   [
   *     JSEN.print( 'We print this line 3 times' ),
   *   ],
   *   JSEN.for( 'i', 10, 5 ), // i => [10, 5[, increment -1
   *   [
   *     JSEN.print( 'We print this line 5 times' ),
   *   ],
   *   JSEN.for( 'i', 10, 5, -2 ), // i => [-10, -8, -6], increment -2
   *   [
   *     JSEN.print( 'We print this line 3 times' ),
   *   ],
   *   JSEN.for( 'i', ()=> beginIndex, ()=> endIndex ), // i => [beginIndex, endIndex[, increment -1
   *   [
   *     JSEN.print( 'We print this line several times' ),
   *   ],
   * 
   * @see JSEN.continue, JSEN.break, JSEN.loop, JSEN.foreach, JSEN.while, JSEN.until
   */
  static for = ( iterator, lower, upper, increment )=> {
    // If upper is not defined, then the lower represents the upper bound
    // Note: lower and upper may represent opposite values if increment is negative
    if( upper === undefined ) {
      upper = lower;
      lower = 0;
    }
    return {
      name: 'for',
      params: {
        iterator: iterator,
        lower: lower,
        upper: upper,
        increment: increment,
      },
      toString: (self)=> {
        return 'JSEN.'+self.name+'( '+JSEN._paramsToString( self.params.iterator )+', '+
                                      JSEN._paramsToString( self.params.lower )+', '+
                                      JSEN._paramsToString( self.params.upper )+', '+
                                      JSEN._paramsToString( self.params.increment )+' )';
      },
      isControlNextStatement: true,
    };
  }
  /**
   * Iterate on the associated JSEN block moving the iterator along the elements of an iteralbe object.
   * Such a loop can be terminated using JSEN.break
   * 
   * 
   * @example
   *   JSEN.foreach( 'i', [1, 2, 3] ), // i => [1, 2, 3]
   *   [
   *     JSEN.print( 'We print this line 3 times' ),
   *   ],
   *   JSEN.foreach( 'i', ['a', 'b'] ), // i => ['a', 'b']
   *   [
   *     JSEN.print( 'We print this line 2 times' ),
   *   ],
   *   JSEN.foreach( 'i', arrayValue ), // Statically assigned
   *   [
   *     JSEN.print( 'We print this line several times' ),
   *   ],
   *   JSEN.foreach( 'i', ()=> arrayValue ), // Dynamically evaluated
   *   [
   *     JSEN.print( 'We print this line several times' ),
   *   ],
   * 
   * @see JSEN.continue, JSEN.break, JSEN.loop, JSEN.for, JSEN.while, JSEN.until
   */
  static foreach = ( iterator, array )=> {
    return {
      name: 'foreach',
      params: {
        iterator: iterator,
        array: array,
      },
      toString: (self)=> {
        return 'JSEN.'+self.name+'( '+JSEN._paramsToString( self.params.iterator )+', '+
                                      JSEN._paramsToString( self.params.array )+' )';
      },
      isControlNextStatement: true,
    };
  }
  /**
   * Get the value of a user variable
   * @param {*} variableName name of the variable
   * @param {*} callback function with a single parameter with the value of the variable
   * 
   * @example
   *   JSEN.get( 'i', (value)=> console.log( 'i =', value ) );
   * 
   * @see JSEN.set
   */
  static get = ( variableName, callback )=> {
    return {
      name: 'get',
      params: {
        variableName: variableName,
        callback: callback,
      },
      toString: (self)=> {
        return 'JSEN.'+self.name+'( '+JSEN._paramsToString( self.params.variableName )+', '+
                                      JSEN._paramsToString( self.params.callback )+' )';
      },
    };
  }
  /**
   * Set the value of a user variable
   * @param {*} variableName name of the variable
   * @param {*} value  value to be associated to the variable
   * 
   * @example
   *   JSEN.set( 'i', 5 );
   *   JSEN.set( 'i', ()=> a+b );
   * 
   * @see JSEN.get
   */
  static set = ( variableName, value )=> {
    return {
      name: 'set',
      params: {
        variableName: variableName,
        value: value,
      },
      toString: (self)=> {
        return 'JSEN.'+self.name+'( '+JSEN._paramsToString( self.params.variableName )+', '+
                                      JSEN._paramsToString( self.params.value )+' )';
      },
    };
  }
  /**
   * Loop on the associated JSEN block until the condition becomes false.
   * Such a loop can be terminated using JSEN.break
   * 
   * @example
   *   [
   *     JSEN.print( 'We are in the loop' ),
   *   ],
   *   JSEN.until( ()=> i < 5 ),
   * 
   * @see JSEN.continue, JSEN.break, JSEN.loop, JSEN.for, JSEN.foreach, JSEN.while
   */
  static until = ( condition )=> {
    return {
      name: 'until',
      params: condition,
      toString: JSEN._toStringOneParams,
      //NOTE: Do not set 'isIterative: true' here
    }
  }
  /**
   * Multi value control statement, switching on different cases
   * @param {*} value value on which to switch
   * 
   * @example
   *   JSEN.switch( ()=> testVar ),
   *   JSEN.case( 0 ),
   *   [
   *     ()=> console.log( 'testVar 0' ),
   *   ],
   *   JSEN.case( 1 ),
   *   [
   *     ()=> console.log( 'testVar 1' ),
   *   ],
   *   JSEN.case( 2 ),
   *   [
   *     ()=> console.log( 'testVar 2' ),
   *   ],
   * 
   * @see JSEN.case, JSEN.break, JSEN.if, JSEN.else
   */
  static switch = ( value )=> {
    return {
      name: 'switch',
      params: value,
      toString: JSEN._toStringOneParams,
    }
  }
  /**
   * Case for multi value control statement, switching on different cases
   * @param {*} value value of the specific case
   * 
   * @example
   *   JSEN.switch( ()=> testVar ),
   *   JSEN.case( 0 ),
   *   [
   *     ()=> console.log( 'testVar 0' ),
   *   ],
   *   JSEN.case( 1 ),
   *   [
   *     ()=> console.log( 'testVar 1' ),
   *   ],
   *   JSEN.case( 2 ),
   *   [
   *     ()=> console.log( 'testVar 2' ),
   *   ],
   * 
   * @see JSEN.switch, JSEN.break, JSEN.if, JSEN.else
   */
  static case = ( value )=> {
    return {
      name: 'case',
      params: value,
      toString: JSEN._toStringOneParams,
      isControlNextStatement: true,
    }
  }
  // Function to force the execution of checkOn conditions
  /**
   * Force the execution of the threat that test all condition for suspended thread on JSEN.on()
   * 
   * @example
   *   JSEN.forceCheckOn(),
   * 
   * @see JSEN.on
   */
  static forceCheckOn = ()=> {
    return {
      name: 'forceCheckOn',
      params: 0,
      toString: JSEN._toStringNoParams,
    };
  }
  /**
   * Initialize a synchronization signal
   * @param {*} signalName name of the signal
   * 
   * @example
   *   JSEN.signalInit( 'actionDone' ),
   * 
   * @see JSEN.signalNotify, JSEN.signalWait, JSEN.on
   */
   static signalInit = ( signalName )=> {
    return {
      name: 'signalInit',
      params: signalName,
      toString: JSEN._toStringOneParams,
    };
  }
  /**
   * Notify happening of a synchronization signal
   * @param {*} signalName name of the signal
   * 
   * @example
   *   JSEN.signalNotify( 'actionDone' ),
   * 
   * @see JSEN.signalInit, JSEN.signalWait, JSEN.on
   */
   static signalNotify = ( signalName )=> {
    return {
      name: 'signalNotify',
      params: signalName,
      toString: JSEN._toStringOneParams,
    };
  }
  /**
   * Wait for the happening of a synchronization signal
   * @param {*} signalName name of the signal
   * 
   * @example
   *   JSEN.signalWait( 'actionDone', 2.5 ),
   * 
   * @see JSEN.signalInit, JSEN.signalNotify, JSEN.on
   */
   static signalWait = ( signalName, timeout )=> {
    return {
      name: 'signalWait',
      params: {
        signalName: signalName,
        timeout: timeout,
      },
      toString: (self)=> {
        const timeoutStr = ( self.params.timeout? ', '+JSEN._paramsToString( self.params.timeout ): '' );
        return 'JSEN.'+self.name+'( '+JSEN._paramsToString( self.params.signalName )+timeoutStr+' )';
      },
    };
  }
  /**
   * Set a broadcasting synchronization signal
   * @param {*} signalName name of the signal
   * 
   * @example
   *   JSEN.setBroadcastSignal( 'actionDone' ),
   * 
   * @see <jsenvm>.isBroadcastSignal, JSEN.resetBroadcastSignal, JSEN.signalNotify, JSEN.signalInit, JSEN.signalWait, JSEN.on
   */
   static setBroadcastSignal = ( signalName )=> {
    return {
      name: 'setBroadcastSignal',
      params: signalName,
      toString: JSEN._toStringOneParams,
    };
  }
  /**
   * Reset a broadcasting synchronization signal
   * @param {*} signalName name of the signal
   * 
   * @example
   *   JSEN.resetBroadcastSignal( 'actionDone' ),
   * 
   * @see <jsenvm>.isBroadcastSignal, JSEN.setBroadcastSignal, JSEN.signalNotify, JSEN.signalInit, JSEN.signalWait, JSEN.on
   */
   static resetBroadcastSignal = ( signalName )=> {
    return {
      name: 'resetBroadcastSignal',
      params: signalName,
      toString: JSEN._toStringOneParams,
    };
  }
  /* -----------------------------------------------------------------
   * Private JSEN functions
   *-----------------------------------------------------------------*/
  static _toStringNoParams = (self)=> {
    return 'JSEN.'+self.name+'()';
  }
  static _toStringOneParams = (self)=> { 
    return 'JSEN.'+self.name+'( '+JSEN._paramsToString( self.params )+' )'; 
  }
  static _paramsToString( params ) {
    let result = '';
    if( params !== undefined ) {
      switch( typeof( params ) ) {
        case 'object':
          result = JSON.stringify( params );
          break;
        case 'string':
          result = '\''+params+'\'';
          break;
        default:
          result = params.toString();
          break;
      }
    }
    return result;
  }
}

var module;
if( module ) {
  module.exports = JSEN;
}
