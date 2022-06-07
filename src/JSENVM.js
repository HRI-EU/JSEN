/*
 * JSENVM - JSEN Virtual Machine with threading and debugging
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

var module;
if( module ) {
  globalThis.JSEN = require( './JSEN.js' );
}

/**
 * JSEN Virtual Machine
 */
class JSENVM {
  // Define static variable for jsen statements
  static switchStackVariable = '$$switchStackVariable$$';
  static wasOnConditionMetVariable = '$$wasOnConditionMetVariable$$';

  // Execute all (each argument is a jsen code)
  static run( /* var args, each a jsen code */ ) {
    // Create a new JSENVM
    let jvm = new JSENVM();
    // For each parameter (each jsenCode)
    for ( const jsenCode of arguments ) {
      jvm.newThread( '', jsenCode );
    }
    jvm.startThread( '*' );
  }
  /**
   * JSENVM Virtual Machine constructor
   */
  constructor( checkOnTimeout ) {
    // Timeout for checking json_on() conditions
    checkOnTimeout = ( checkOnTimeout? checkOnTimeout: 0.1 );

    // Information about created threads
    this.thread = {
      // List of threads by id (start from 0, id equal to array position)
      byId: [],
      // List of threads by name (thread.name => thread.id)
      byName: {},
      // List of threads by status (thread.id stored in the relative status)
      byStatus: {
        // Ready threads (from newThread())
        ready: [],
        // Running threads (from start*Thread())
        fast: {
          running: [],
          suspended: [],
        },
        slow: {
          running: [],
          suspended: [],
        },
        stepByStep: {
          running: [],
          suspended: [],
        },
        // Terminated threads (from stopThread())
        terminated: [],
      }
    };

    // List of join functions waiting for termitation of a list of threads
    this.threadJoinList = []; // { threadList:[], joinCallback:<func> }

    // Execution status flag for _runAllFastThreads()
    this.isRunAllFastThreadsRunning = false;
    // Execution status flag for _runAllSlowThreads()
    this.isRunAllSlowThreadsRunning = false;
    // Debug level for logging
    this.debugLevel = 0;
    // Artificial delay (in seconds) between execution of consecutive atomic operations
    // for threads in the slow queue (slowThread() function)
    // 0 = no delay
    this.slowThreadPeriod = 1;
    // Id of last stepped thread, for threads in step by step mode
    this.currentStepByStepIndex = 0;
    // List of registered conditions for "on()" statements
    this.checkOnConditionList = []; // { 'context': jsenContext, 'condition': condition, 'timeout': timeout }
    // CheckOn periodic thread period
    this.checkOnPeriod = { timeout: checkOnTimeout };
    // CheckOn periodic thread JSEN code
    this.checkOnPeriodicThread = [
      //JSEN.print("jsen------------------ before checkOn --------------------------"),
      ()=> this._doCheckOn(),
      //JSEN.print("jsen------------------ after checkOn --------------------------"),
    ];
    // threadId of the checkOn thread
    this.checkOnThreadId = -1;
    // Possible exit status for a "on"
    this.jsenOnStatusCondition = 'condition';
    this.jsenOnStatusTimeout = 'timeout';

    // Signal table (JSEN.signalInit/Notify/Wait)
    this.signalNameList = {};

    // List of registered breakpoints
    this.breakpointList = {};
    // Faster way to know how many breakpoint we have
    this.breakpointListCounter = 0;

    // List of user variables managed via set()/get() or JSEN.set()/JSEN.get()
    this.globalVariableList = {};
    // Register the map for jsen statements and their implementation
    this._setupStatementMap();
    // Start the checkOn threas (put in fast.suspended queue)
    this._startCheckOn();
  }
  /* -----------------------------------------------------------------
   * JSENVM Public High-Level API functions
   *-----------------------------------------------------------------*/
  // static getSingleton(checkOnTimeout) {
  //   if (!JSENVM._singletonInstance) {
  //     JSENVM._singletonInstance = new JSENVM(checkOnTimeout);
  //   }

  //   return JSENVM._singletonInstance;
  // }
  getNextThreadId() {
    return this.thread.byId.length;
  }
  newThread( name, jsenCode, debugLevel ) {
    // Default value for debugLevel
    debugLevel = ( debugLevel === undefined ? 0: debugLevel );
    name = ( name? name: 'noname'+this.thread.byId.length );
    // We abort if a thread by that name already exists
    if( this.getThreadNameId( name ).id !== -1 ) {
      this._log( 'Error: A thread named \'' + name + '\' already exists' );
      return -1;
    }

    //NOTE: This function must be atomic from now till the end
    // Get next free id
    const threadId = this.getNextThreadId();
    // Get thread context
    const threadContext = this._getNewThreadContext( threadId, name, jsenCode, debugLevel, null );

    // Initialize the "on" status variable, one per thread on top context
    this._setVariable( threadContext, JSENVM.wasOnConditionMetVariable, undefined );

    // Add thread in id list
    this.thread.byId.push( threadContext );
    // Add thread in ready list
    this.thread.byStatus.ready.push( threadId );
    // Add thread in name list
    this.thread.byName[name] = threadId;

    return threadId;
  }
  startThread( nameOrIdOrList ) {
    // List of thread to start
    const fromQueueList = [ 'ready' ];
    let threadIdList = this._getThreadIdList( fromQueueList, nameOrIdOrList );
    // Start all
    for( const threadId of threadIdList ) {
      this.startThreadId( threadId, false );
    }
  }
  startLoopThread( nameOrIdOrList ) {
    // List of thread to start
    const fromQueueList = [ 'ready' ];
    let threadIdList = this._getThreadIdList( fromQueueList, nameOrIdOrList );
    // Start all as loop thread
    for( const threadId of threadIdList ) {
      this.startThreadId( threadId, true );
    }
  }
  startPeriodicThread( nameOrIdOrList, period ) {
    // Default value for period
    period = ( period === undefined ? 1: period );

    // List of thread to start
    const fromQueueList = [ 'ready' ];
    let threadIdList = this._getThreadIdList( fromQueueList, nameOrIdOrList );
    // Start all
    for( const threadId of threadIdList ) {
      // Start thread as loop thread with period
      this.startThreadId( threadId, true, period );
    }
  }
  stopThread( nameOrIdOrList ) {
    // List of thread to stop
    const fromQueueList = [ 'fast', 'slow', 'stepByStep' ];
    let threadIdList = this._getThreadIdList( fromQueueList, nameOrIdOrList );
    // Stop all
    for( const threadId of threadIdList ) {
      this.stopThreadId( threadId );
    }
  }
  suspendThread( nameOrIdOrList ) {
    // List of thread to suspend
    const fromQueueList = [ 'fast', 'slow', 'stepByStep' ];
    let threadIdList = this._getThreadIdList( fromQueueList, nameOrIdOrList );
    // Suspend all
    for( const threadId of threadIdList ) {
      this.suspendThreadId( threadId );
    }
  }
  wakeupThread( nameOrIdOrList ) {
    // List of thread to wakeup
    const fromQueueList = [ 'fast', 'slow', 'stepByStep' ];
    let threadIdList = this._getThreadIdList( fromQueueList, nameOrIdOrList );
    // Wakeup all
    for( const threadId of threadIdList ) {
      this.wakeupThreadId( threadId );
    }
  }
  renewThread( nameOrIdOrList ) {
    // List of thread to renew
    const fromQueueList = [ 'terminated' ];
    let threadIdList = this._getThreadIdList( fromQueueList, nameOrIdOrList );
    // Renew all
    for( const threadId of threadIdList ) {
      this.renewThreadId( threadId );
    }
  }
  removeThread( nameOrIdOrList ) {
    // List of thread to remove
    const fromQueueList = [ 'ready', 'terminated' ];
    const threadList = this._getThreadIdList( fromQueueList, nameOrIdOrList );
    // Remove all
    for( const threadId of threadList ) {
      removeThreadId( threadId );
    }
  }
  isThreadExist( nameOrId ) {
    // Get thread id
    const threadId = this.getThreadNameId( nameOrId ).id;
    return( ( threadId != -1 ) && ( threadId !== undefined ) );
  }
  isThreadReady( nameOrId ) {
    // Get thread index in ready list
    const threadId = this.getThreadNameId( nameOrId ).id;
    const threadIndex = this.thread.byStatus.ready.indexOf( threadId );
    return( threadIndex != -1 );
  }
  isThreadFast( nameOrId ) {
    // Get thread index in fast list
    const threadId = this.getThreadNameId( nameOrId ).id;
    const threadIndex = Math.max( this.thread.byStatus.fast.running.indexOf( threadId ),
                                  this.thread.byStatus.fast.suspended.indexOf( threadId ) );
    return( threadIndex != -1 );
  }
  isThreadSlow( nameOrId ) {
    // Get thread index in slow list
    const threadId = this.getThreadNameId( nameOrId ).id;
    const threadIndex = Math.max( this.thread.byStatus.slow.running.indexOf( threadId ),
                                  this.thread.byStatus.slow.suspended.indexOf( threadId ) );
    return( threadIndex != -1 );
  }
  isThreadStepByStep( nameOrId ) {
    // Get thread index in step by step list
    const threadId = this.getThreadNameId( nameOrId ).id;
    const threadIndex = Math.max( this.thread.byStatus.stepByStep.running.indexOf( threadId ),
                                  this.thread.byStatus.stepByStep.suspended.indexOf( threadId ) );
    return( threadIndex != -1 );
  }
  isThreadSuspended( nameOrId ) {
    // Get thread index in terminated list
    const threadId = this.getThreadNameId( nameOrId ).id;
    return ( ( this.thread.byStatus.fast.suspended.indexOf( threadId ) != -1 ) ||
             ( this.thread.byStatus.slow.suspended.indexOf( threadId ) != -1 ) ||
             ( this.thread.byStatus.stepByStep.suspended.indexOf( threadId ) != -1 ) );
  }
  isThreadTerminated( nameOrId ) {
    // Get thread index in terminated list
    const threadId = this.getThreadNameId( nameOrId ).id;
    const threadIndex = this.thread.byStatus.terminated.indexOf( threadId );
    return( threadIndex != -1 );
  }
  setSlowThreadPeriod( period ) {
    // We set the period, which applies to all slow threads
    this.slowThreadPeriod = period;
  }
  setThreadToQueue( newQueue, threadList ) {
    // TODO: This function must be rewritten from ground
    /*
       if move from ready -> running -> startThread
       if move from ready -> suspended -> suspendThread
       if move from ready -> terminate -> terminateThread
       if move from fast -> slow -> check status (running/suspended) and do the right thing
       ....
       if( this.isThreadReady( threadId ) {
        switch( newQueue ) {
          case 'fast':
            this.startThreadId( threadId );
            break;
          case 'slow':
            this.startThreadId( threadId );
            this.slowThread( threadId );
            break;
          case 'stepByStep':
          case 'terminated':
        }
      }
    */

    // All eligible source lists
    const allLists = [
      this.thread.byStatus.ready,
      this.thread.byStatus.fast.running,
      this.thread.byStatus.fast.suspended,
      this.thread.byStatus.slow.running,
      this.thread.byStatus.slow.suspended,
      this.thread.byStatus.stepByStep.running,
      this.thread.byStatus.stepByStep.suspended,
      this.thread.byStatus.terminated
    ];
    // Perform moving
    for( const threadNameOrId of threadList ) {
      // Get thread info
      const threadData = this.getThreadNameId( threadNameOrId );
      const threadId = threadData.id;
      const threadContext = this.thread.byId[threadId];

      // If thread terminated and new quest is not terminated  -> renew it
      if( this.isThreadTerminated( threadId ) && newQueue != 'terminated' ) {
        this.renewThreadId( threadId );
      }

      // Get thread status
      const isThreadReady = this.isThreadReady( threadId );

      // Move thread to new queue
      if( isThreadReady && ( newQueue == 'fast' ) ) {
        this.startThreadId( threadId );
        this._removeDebugInfo( threadContext );
      } if( isThreadReady && ( newQueue == 'slow' ) ) {
        this.startThreadId( threadId );
        this.slowThread( threadId );
        this._removeDebugInfo( threadContext );
      } else {
        // Destination list
        const toList = this.thread.byStatus[ newQueue ].running;

        for( const threadList of allLists) {
          if( threadList.includes( threadId ) ) {
            this._moveThread( threadId, threadList, toList );
  
            /*
               TODO: here we should start/suspend threads depending on destination
            if( ( toList == this.thread.byStatus.fast.running ) ||
                ( toList == this.thread.byStatus.slow.running ) ) {
              this.startThread( threadId ); // We can not start in this way...to check full process
            } else if( ( toList == this.thread.byStatus.fast.suspended ) ||
                       ( toList == this.thread.byStatus.slow.suspended ) ||
                       ( toList == this.thread.byStatus.stepByStep.suspended ) ) {
              this.suspendThread( threadId ); // We can not suspend in this way...to check full process
            }
            */
  
            const threadContext = this.thread.byId[threadId];
            if( newQueue == 'stepByStep' ) {
              // Insert debug info
              this._insertDebugInfo( threadContext, threadContext.blockContext.code );
            } else {
              // Remove debug info
              this._removeDebugInfo( threadContext );
            }
          }
        }
      }
    }
  }
  slowThread( nameOrIdOrList ) {
    const fromQueueList = [ 'ready', 'fast' ]; //, 'stepByStep' ];
    const threadIdList = this._getThreadIdList( fromQueueList, nameOrIdOrList );
    // We move threads between running lists as necessary
    for( const threadId of threadIdList ) {
      const threadContext = this.thread.byId[threadId];

      // Skip checkOn thread
      if( threadId == this.checkOnThreadId ) {
        continue;
      }

      // Insert debug info
      this._insertDebugInfo( threadContext, threadContext.blockContext.code );

      if( this.thread.byStatus.ready.includes( threadId ) ) {
        this._moveThread( threadId, this.thread.byStatus.ready, this.thread.byStatus.slow.running );
      }
      else if( this.thread.byStatus.fast.running.includes( threadId ) ) {
        this._moveThread( threadId, this.thread.byStatus.fast.running, this.thread.byStatus.slow.running );
      }
      else if( this.thread.byStatus.fast.suspended.includes( threadId ) ) {
        this._moveThread( threadId, this.thread.byStatus.fast.suspended, this.thread.byStatus.slow.suspended );
      }
      /* NOTE: for simmetry to fastThread(), stepByStep are not considered
      else if( this.thread.byStatus.stepByStep.running.includes( threadId ) ) {
        this._moveThread( threadId, this.thread.byStatus.stepByStep.running, this.thread.byStatus.slow.running );
      }
      else if( this.thread.byStatus.stepByStep.suspended.includes( threadId ) ) {
        this._moveThread( threadId, this.thread.byStatus.stepByStep.suspended, this.thread.byStatus.slow.suspended );
      }
      */
    }
  }
  fastThread( nameOrIdOrList ) {
    const fromQueueList = [ 'ready', 'slow' ];
    const threads = this._getThreadIdList( fromQueueList, nameOrIdOrList );
    // We move threads between running lists as necessary
    for( const threadId of threads ) {
      const threadContext = this.thread.byId[threadId];

      // Skip checkOn thread
      if( threadId == this.checkOnThreadId ) {
        continue;
      }

      // Remove debug info
      this._removeDebugInfo( threadContext );

      if( this.thread.byStatus.ready.includes( threadId ) ) {
        this._moveThread( threadId, this.thread.byStatus.ready, this.thread.byStatus.fast.running );
      }
      else if( this.thread.byStatus.slow.running.includes( threadId ) ) {
        this._moveThread( threadId, this.thread.byStatus.slow.running, this.thread.byStatus.fast.running );
      }
      else if( this.thread.byStatus.slow.suspended.includes( threadId ) ) {
        this._moveThread( threadId, this.thread.byStatus.slow.suspended, this.thread.byStatus.fast.suspended );
      }
    }
    this._spawnRunAllFastThreads();
  }
  pauseThread( nameOrIdOrList ) {
    const fromQueueList = [ 'ready', 'fast', 'slow' ];
    const threadList = this._getThreadIdList( fromQueueList, nameOrIdOrList );
    // We move threads between running lists as necessary
    for( const threadId of threadList ) {
      const threadContext = this.thread.byId[ threadId ];

      // Skip checkOn thread
      if( threadId == this.checkOnThreadId ) {
        continue;
      }

      // Insert debug info
      this._insertDebugInfo( threadContext, threadContext.blockContext.code );

      if( this.thread.byStatus.ready.includes( threadId ) ) {
        this._moveThread( threadId, this.thread.byStatus.ready, this.thread.byStatus.stepByStep.running );
      }
      else if( this.thread.byStatus.fast.running.includes( threadId ) ) {
        this._moveThread( threadId, this.thread.byStatus.fast.running, this.thread.byStatus.stepByStep.running );
      }
      else if( this.thread.byStatus.fast.suspended.includes( threadId ) ) {
        this._moveThread( threadId, this.thread.byStatus.fast.suspended, this.thread.byStatus.stepByStep.suspended );
      }
      else if( this.thread.byStatus.slow.running.includes( threadId ) ) {
        this._moveThread( threadId, this.thread.byStatus.slow.running, this.thread.byStatus.stepByStep.running );
      }
      else if( this.thread.byStatus.slow.suspended.includes( threadId ) ) {
        this._moveThread( threadId, this.thread.byStatus.slow.suspended, this.thread.byStatus.stepByStep.suspended );
      }
    }
  }
  continueThread( nameOrIdOrList ) {
    const fromQueueList = [ 'stepByStep' ];
    const threadList = this._getThreadIdList( fromQueueList, nameOrIdOrList );
    // We move threads between running lists as necessary
    for( const threadId of threadList ) {
      const threadContext = this.thread.byId[ threadId ];

      // Skip checkOn thread
      if( threadId == this.checkOnThreadId ) {
        continue;
      }

      // Remove debug info
      this._removeDebugInfo( threadContext );

      if( this.thread.byStatus.stepByStep.running.includes( threadId ) ) {
        this._moveThread( threadId, this.thread.byStatus.stepByStep.running, this.thread.byStatus.fast.running );
      }
      else if( this.thread.byStatus.stepByStep.suspended.includes( threadId ) ) {
        this._moveThread( threadId, this.thread.byStatus.stepByStep.suspended, this.thread.byStatus.fast.suspended );
      }
    }
    this._spawnRunAllFastThreads();
  }
  stepPreview( nameOrId ) {
    this._stepWrapper( nameOrId, true );
  }
  step( nameOrId ) {
    this._stepWrapper( nameOrId, false );
  }
  setBreakpoint( nameOrId, condition, action ) {
    // Id of the break point (together with nameOrId)
    let breakpointId = -1;
    // Default thread is the full virtual machine
    let threadId = '*';
    // If a specific thread id is provided
    if( nameOrId != '*' ) {
      // Get thread id
      const threadData = this.getThreadNameId( nameOrId );
      if( threadData.id !== -1 ) {
        threadId = threadData.id;
      } else {
        threadId = undefined;
      }
    }
    // If thread id is defined
    if( threadId !== undefined ) {
      // Create breakpoint info
      const bpInfo = {
        condition: condition,
        action: action,
      };
      // If there are no breakpoint for the thread id, create the list
      if( this.breakpointList[ threadId ] === undefined ) {
        this.breakpointList[ threadId ] = [];
      }
      // Add break point to the list
      breakpointId = this.breakpointList[ threadId ].length;
      this.breakpointList[ threadId ].push( bpInfo );
      ++this.breakpointListCounter;
    } else {
      this._logWarning( 'No thread found: '+nameOrId );
    }
    // Return breakpoint id (unique per threadId)
    return breakpointId;
  }
  get( variableName ) {
    // The null represent the global context (JSENVM instance)
    return this._get( null, variableName );
  }
  set( variableName, value ) {
    // The null represent the global context (JSENVM instance)
    this._set( null, variableName, value );
  }
  addThreadJoin( nameOrIdOrList, joinCallback ) {
    const fromQueueList = [ 'ready', 'fast', 'slow', 'stepByStep' ];
    const threadList = this._getThreadIdList( fromQueueList, nameOrIdOrList );

    // Create join info
    const joinInfo = {
      'threadList': threadList,
      'joinCallback': joinCallback,
    }
    // Add join in the list
    this.threadJoinList.push( joinInfo );
  }
  removeThreadJoin( joinCallback ) {
    // Remove callback from the list
    for( var index in this.threadJoinList ) {
      if( this.threadJoinList[index].joinCallback != joinCallback ) {
        this.threadJoinList.splice( index, 1 );
        break;
      }
    }
  }
  signalInit( signalName ) {
    this.statementMap['signalInit']( null, signalName );
  }
  signalNotify( signalName ) {
    this.statementMap['signalNotify']( null, signalName );
  }
  /* -----------------------------------------------------------------
   * JSENVM Public Low-Level API functions
   *-----------------------------------------------------------------*/
  getThreadNameId( nameOrId ) {
    // Intitialize result
    let threadData = { id: -1, name: '' };

    // Get thread id and name
    if( typeof( nameOrId ) == 'number' && this.thread.byId[ nameOrId ] !== undefined ) {
      threadData.id = nameOrId;
      threadData.name = this.thread.byId[ threadData.id ].name;
    } else if( this.thread.byName.hasOwnProperty( nameOrId ) ) {
      threadData.name = nameOrId;
      threadData.id = this.thread.byName[ threadData.name ];
    }

    return threadData;
  }
  getThreadNameList( threadIdList ) {
    let result = [];
    if( typeof( threadIdList ) === 'object' )  {
      // If threadId is an array of id numbers
      for( const id of threadIdList ) {
        const threadData = this.getThreadNameId( id );
        if( threadData.id >= 0 )
          result.push( threadData.name );
      }
    } else {
      // Otherwise generate a warning
      this._logWarning( 'Thread id: '+threadIdList+' must be an id or an array of ids' );
    }
    return result;
  }
  startThreadId( threadId, isLoopThread, period ) {
    if( threadId !== undefined ) {
      // Default value for period
      period = ( period === undefined? 0: period );
      // Default value for isLoopThread
      isLoopThread = ( isLoopThread === undefined? false: isLoopThread );

      // Get thread index in ready list
      const threadIndex = this.thread.byStatus.ready.indexOf( threadId );
      if( threadIndex != -1 ) {
        // Check if there are running threads
        const wasFastRunningListEmpty = ( this.thread.byStatus.fast.running.length == 0 );
        const wasSlowRunningListEmpty = ( this.thread.byStatus.slow.running.length == 0 );
        // Get thread context
        const threadContext = this.thread.byId[ threadId ];
        // Set running properties
        threadContext.isLoopThread = isLoopThread;
        // If the thread should run in a loop ==> insert goto to begenning at the end of the code
        if( isLoopThread ) {
          // If the thread should be periodig ==> insert pause
          if( period != 0 ) {
            threadContext.blockContext.code.push( JSEN.sleep( period ) );
            ++threadContext.blockContext.labelList.blockEnd;
          }
          threadContext.blockContext.code.push( JSEN.goto( 'blockBegin' ) );
          ++threadContext.blockContext.labelList.blockEnd;
        }
        // Remove thread from ready list and put in running list
        this._moveThread( threadId, this.thread.byStatus.ready, this.thread.byStatus.fast.running );
        // If there were no running threads ==> start the running processes
        if( wasFastRunningListEmpty ) {
          this._spawnRunAllFastThreads();
        }
        // TODO: Check why we start the slow list if the thread is in fast here above
        if( wasSlowRunningListEmpty ) {
          this._spawnRunAllSlowThreads();
        }
      } else {
        this._logWarning( 'Thread id: '+threadId+' not found in ready list' );
      }
    }
  }
  stopThreadId( threadId ) {
    if( threadId !== undefined ) {
      // Search thread index from running or suspended list
      let threadIndex = -1;
      const threadStatusList = [ 'fast', 'slow', 'stepByStep' ];
      const threadStatusSubList = [ 'running', 'suspended' ];
      // Search an all
      for( const status of threadStatusList ) {
        let found = false;
        for( const subStatus of threadStatusSubList ) {
          let threadIdList = this.thread.byStatus[ status ][ subStatus ];
          // Get thead index from list
          threadIndex = threadIdList.indexOf( threadId );
          // If thread found
          if( threadIndex != -1 ) {
            // Move thread from the list to the terminated list
            this._moveThread( threadId, threadIdList, this.thread.byStatus.terminated );
            // If there are join callback registered
            if( this.threadJoinList.length ) {
              this._checkAndCallThreadJoinCallback();
            }
            found = true;
            break;
          }
        }
        if( found )
          break;
      }
      // If thread not found ==> generate a warning
      if( threadIndex == -1 ) {
        this._logWarning( 'Thread id: '+threadId+' not found in ready,running,suspended list' );
      }
    }
  }
  suspendThreadId( threadId ) {
    if( threadId !== undefined ) {
      if( this.thread.byStatus.fast.running.includes( threadId ) ) {
        this._moveThread( threadId, this.thread.byStatus.fast.running, this.thread.byStatus.fast.suspended )
      } else if( this.thread.byStatus.slow.running.includes( threadId ) ) {
        this._moveThread( threadId, this.thread.byStatus.slow.running, this.thread.byStatus.slow.suspended )
      } else if( this.thread.byStatus.stepByStep.running.includes( threadId ) ) {
        this._moveThread( threadId, this.thread.byStatus.stepByStep.running, this.thread.byStatus.stepByStep.suspended )
      } else {
        this._logWarning( 'Thread id: ' + threadId + ' not found in any running list' );
      }
    }
  }
  wakeupThreadId( threadId ) {
    if( threadId !== undefined ) {
      // Check if there are running threads
      const wasFastRunningListEmpty = ( this.thread.byStatus.fast.running.length == 0 );
      const wasSlowRunningListEmpty = ( this.thread.byStatus.slow.running.length == 0 );
      // Perform the move
      if( this.thread.byStatus.fast.suspended.includes( threadId ) ) {
        this._moveThread( threadId, this.thread.byStatus.fast.suspended, this.thread.byStatus.fast.running )
      } else if( this.thread.byStatus.slow.suspended.includes( threadId ) ) {
        this._moveThread( threadId, this.thread.byStatus.slow.suspended, this.thread.byStatus.slow.running )
      } else if( this.thread.byStatus.stepByStep.suspended.includes( threadId ) ) {
        this._moveThread( threadId, this.thread.byStatus.stepByStep.suspended, this.thread.byStatus.stepByStep.running )
      } else {
        // Nothing to say, since before wakeup it may be
        // that the thread has been terminated, therefore no Warning!!!
      }
      if ( wasFastRunningListEmpty ) {
        this._spawnRunAllFastThreads();
      }
      if ( wasSlowRunningListEmpty ) {
        this._spawnRunAllSlowThreads();
      }
    }
  }
  renewThreadId( threadId ) {
    if( threadId !== undefined ){
      // Get thread index in ready list
      const threadIndex = this.thread.byStatus.terminated.indexOf( threadId );
      if( threadIndex != -1 ) {
        // Revew thread
        this._moveThread( threadId, this.thread.byStatus.terminated, this.thread.byStatus.ready );
        this._renewThreadContext( threadId );
      } else {
        // We actually don't need to send a warning here
        //this._logWarning( 'Thread id: '+threadId+' not found in terminated list' );
      }
    }
  }
  removeThreadId( threadId ) {
    if( threadId !== undefined ) {
      const threadContext = this.thread.byId[ threadId ];
      const threadName = threadContext.name;

      // Search for the thread
      for( const queueName of fromQueueList ) {
        const queue = this.thread.byStatus[ queueName ];
        const threadIndex = queue.includes( threadId );
        if( threadIndex ) {
          // Remove the thread
          queue.splice( threadIndex, 1 );
          delete this.thread.byId[ threadId ];
          delete this.thread.byName[ threadName ];
        }
      }
    }
  }
  getAllThreadInfo() {
    // Initialize result
    let resultList = [];

    // Ready threads
    resultList = resultList.concat( this._getAllThreadInfoFromList( 'ready' ) );
    // Fast running threads
    resultList = resultList.concat( this._getAllThreadInfoFromList( 'fast', 'running' ) );
    // Fast suspended threads
    resultList = resultList.concat( this._getAllThreadInfoFromList( 'fast', 'suspended' ) );
    // Slow running threads
    resultList = resultList.concat( this._getAllThreadInfoFromList( 'slow', 'running' ) );
    // Slow suspended threads
    resultList = resultList.concat( this._getAllThreadInfoFromList( 'slow', 'suspended' ) );
    // Step by step running threads
    resultList = resultList.concat( this._getAllThreadInfoFromList( 'stepByStep', 'running' ) );
    // Step by step suspended threads
    resultList = resultList.concat( this._getAllThreadInfoFromList( 'stepByStep', 'suspended' ) );
    // Terminated threads
    resultList = resultList.concat( this._getAllThreadInfoFromList( 'terminated' ) );

    // Inner function for comparing thread names
    const _compareThreadName = ( a, b ) => {
      // Use toUpperCase() to ignore character casing
      const nameA = a.name.toUpperCase();
      const nameB = b.name.toUpperCase();
      // Return comparison
      return ( ( nameA < nameB )? -1 :( ( nameA > nameB ) ? 1 : 0 ) );
    };
    // Sorting data by thread name
    resultList.sort( _compareThreadName );

    return resultList;
  }
  getThreadStatus( nameOrId ) {
    let status = '';
    if( nameOrId !== undefined ) {
      const threadId = this.getThreadNameId( nameOrId ).id;

      if( threadId != -1 ) {
        if( this.thread.byStatus.ready.includes( threadId ) )
          status = 'ready';
        else if( this.thread.byStatus.slow.running.includes( threadId ) ||
                this.thread.byStatus.fast.running.includes( threadId ) ||
                this.thread.byStatus.stepByStep.running.includes( threadId ) )
          status = 'running';
        else if( this.thread.byStatus.slow.suspended.includes( threadId ) ||
                this.thread.byStatus.fast.suspended.includes( threadId ) ||
                this.thread.byStatus.stepByStep.suspended.includes( threadId ) )
          status = 'suspended';
        else if( this.thread.byStatus.terminated.includes( threadId ) )
          status = 'terminated';
      }
    }
    return status;
  }
  getThreadCode( nameOrId ) {
    let result = [];

    // Get thread id
    const threadId =  this.getThreadNameId( nameOrId ).id;
    if( threadId != -1 ) {
      // Get thread context
      const threadContext = this.thread.byId[ threadId ];
      // Get thread main code
      result = this._getTopLevelCode( threadContext );
    }
    return result;
  }
  getCurrentThreadLine( nameOrId, overridePc ) {
    let codeLine = null;
    // Get thread id
    const threadId =  this.getThreadNameId( nameOrId ).id;
    if( threadId != -1 ) {
      // Get thread context
      const threadContext = this.thread.byId[ threadId ];
      // In case overridePc is defined, use it
      overridePc = ( overridePc === undefined? threadContext.blockContext.pc : overridePc );
      // Return line
      const codeStatement = threadContext.blockContext.code[ overridePc ];
      if( codeStatement ) {
        codeLine = codeStatement;
      }
    }
    return codeLine;
  }
  isBroadcastSignal( name ) {
    return( JSENVM.boradcastSignal && JSENVM.boradcastSignal[name] );
  }
  getDebugMessage() {
    // TODO Discuss if this is necessary and decide how it should work
    return '';
  }
  getFormattedStatement( statement ) {
    return this._logStatement( statement );
  }
  /* -----------------------------------------------------------------
   * JSENVM Private functions
   *-----------------------------------------------------------------*/
  _startCheckOn( period ) {
    if( period === undefined ) {
      period = this.checkOnPeriod.timeout;
    } else {
      this.checkOnPeriod.timeout = period;
    }

    if( this.checkOnThreadId == -1 ) {
      this.checkOnThreadId = this.newThread( 'checkOnPeriodicThread', this.checkOnPeriodicThread );
    } else if( this.isThreadTerminated( this.checkOnThreadId ) ) {
      this.renewThreadId( this.checkOnThreadId );
    }

    // If thread is in ready queue -> start it, otherwise it is already running
    if( this.isThreadReady( this.checkOnThreadId ) ) {
      const isLoopThread = true;
      this.startThreadId( this.checkOnThreadId, isLoopThread, period );
      if( this.checkOnConditionList.length == 0 ) {
        this.suspendThreadId( this.checkOnThreadId );
      }
    }
  }
  _stopCheckOn() {
    this.stopThread( this.checkOnThreadId );
  }
  _getThreadName( threadId ) {
    // Get thread id from name
    const name = '';
    
    const threadContext = this.thread.byId[ threadId ];
    if( threadContext ) {
      name = threadContext.name;
    }

    // Check existance of thread
    if( !name ) {
      this._logWarning( 'Thread "'+threadId+'" not found!' );
    }

    return name;
  }
  // NOTE: this function avoid to return checkOn thread id
  //       except if nomeOrIdOrList is == checkOn thread id/name
  _getThreadIdList( fromQueueList, nameOrIdOrList ) {
    // Initialize result as empty
    let threadIdList = [];

    // If nameOrIdOrList has been passed as parameter
    if( nameOrIdOrList !== undefined ) {
      // If we have '*', we get all threads from fromList as required
      if( nameOrIdOrList == '*' ) {
        for( const queueName of fromQueueList ) {
          // Get the queue
          const queue = this.thread.byStatus[ queueName ];
          // Case when the queue directly contains an array of id
          if( Array.isArray( queue ) ) {
            for( const id of queue ) {
              if( id != this.checkOnThreadId ) { // Skip checkOn thread
                threadIdList.push( id );
              }
            }
          } else {
            // Case when the queue has running and suspended sub-queue
            for( const id of queue.running ) {
              if( id != this.checkOnThreadId ) { // Skip checkOn thread
                threadIdList.push( id );
              }
            }
            for( const id of queue.suspended ) {
              if( id != this.checkOnThreadId ) { // Skip checkOn thread
                threadIdList.push( id );
              }
            }
          }
        }
      } else {
        if( Array.isArray( nameOrIdOrList ) ) {
          // We can also have an array of ids and/or names as second param
          for( const nameOrId of nameOrIdOrList ) {
            const threadInfo = this.getThreadNameId( nameOrId );
            threadIdList.push( threadInfo.id );
          }
        } else {
          // If we have a thread specified, we set its step by step status as required
          const threadInfo = this.getThreadNameId( nameOrIdOrList );
          threadIdList.push( threadInfo.id );
        }
      }
    }
    // Return list of threads
    return threadIdList;
  }
  _renewThreadContext( threadId ) {
    // Get current thread context
    let threadContext = this.thread.byId[ threadId ];
    if( threadContext ) {
      // Reasign root context and pc to 0
      threadContext.blockContext = threadContext.rootBlockContext;
      threadContext.blockContext.pc = 0;
    }
  }
  _getTopLevelCode( threadContext ) {
    // No need of next lines
    //if( threadContext.callerContext != null )
    //  return this._getTopLevelCode( threadContext.callerContext );
    //else
    return threadContext.rootBlockContext.code;
  }
  _getNewThreadContext( threadId, name, jsenCode, debugLevel, callerContext ) {
    // New block context instance
    const blockContext = this._getNewBlockContext( jsenCode, callerContext );
    // New thread context instance
    const threadContext = {           // Thread Context Info
      id: threadId,                   // Unique thread identifier (number)
      name: name,                     // Unique thread name (string)
      isLoopThread: false,            // True if thread never end
      debugLevel: debugLevel,         // DebugLevel, // Debug level 0,1 for now
      isDebugInfo: false,             // True if thread has debug info (codeSource and lines)
      codeSource: [],                 // Source code of the thread (string serialization)
      //lineNumber: -1, Inserted dynamically when debug info enabled
      codeLinesMap: [],               // Map of lines statements (array position is source line number)
      blockContext: blockContext,     // Current Block Info (points to current running nested block)
      rootBlockContext: blockContext, // Root Block of the top JSEN code
    };
    // Return context
    return( threadContext );
  }
  _getNewBlockContext( jsenCode, callerContext ) {
    // New block context instance
    const blockContext = {            // Code Context Info
      pc: 0,                          // Program counter (current statement)
      code: jsenCode,                 // JSENVM code (array)
      isIterative: false,             // True if last statement is 'for/while..' statement
      labelList: {                    // List of label() local to the block
        'blockBegin': 0,              // Value of pc at beginning of block
        'blockEnd': jsenCode.length,  // Value of pc at end of block
      }, // Buffer for jsenCode labels {'labelName1':pc1, ...}
      variableList: {},               // List of local block's variables
      callerContext: callerContext,   // Caller context, null for root
    };
    // Return context
    return( blockContext );
  }
  _insertDebugInfo( threadContext, threadCode ) {
    // Compile the current block
    threadContext.isDebugInfo = true;
    for( const codeStatement of threadCode ) {
      // Check each statement
      switch( typeof( codeStatement ) ) {
        case 'function':
          threadContext.codeSource.push( codeStatement.toString() );
          threadContext.codeLinesMap.push( codeStatement );
          break;
        case 'string':
            threadContext.codeSource.push( '"'+codeStatement+'"' );
            threadContext.codeLinesMap.push( codeStatement );
        case 'undefined':
          break;
        case 'object':
          if( Array.isArray( codeStatement ) ) {
            threadContext.codeSource.push( '[' );
            threadContext.codeLinesMap.push( codeStatement );
            // If I find a code block --> this is a sub-block
            this._insertDebugInfo( threadContext, codeStatement );
            threadContext.codeSource.push( ']' );
            threadContext.codeLinesMap.push( ']' );
          } else {
            threadContext.codeSource.push( JSON.stringify( codeStatement ) );
            threadContext.codeLinesMap.push( codeStatement );
          }
          break;
      }
    }
  }
  _removeDebugInfo( threadContext ) {
    threadContext.isDebugInfo = false;
    threadContext.codeSource = [];
    threadContext.codeLinesMap = [];
    delete threadContext.lineNumber;
  }
  _getAllThreadInfoFromList( listName, sublistName ) {
    let resultList = [];
    const threadIdList = ( ( sublistName ) ?
                           this.thread.byStatus[ listName ][ sublistName ]:
                           this.thread.byStatus[ listName ] );

    for( const threadId of threadIdList ) {

      // Skip checkOn thread
      if( threadId == this.checkOnThreadId ) {
        continue;
      }

      const threadContext = this.thread.byId[ threadId ];
      let result = {
        id: threadContext.id,
        name: threadContext.name,
        pc: threadContext.blockContext.pc,
        isDebugInfo: threadContext.isDebugInfo,
        timeStamp: new Date(),
        status: ( ( sublistName )? sublistName:  listName ),
        queue: listName,
      }
      if( threadContext.isDebugInfo ) {
        let defaultLineNumber = 0;
        if( result.status == 'ready' ) {
          defaultLineNumber = -1;
        }
        result['lineNumber'] = ( threadContext.lineNumber? 
                                 threadContext.lineNumber:
                                 defaultLineNumber );
      }
      if( sublistName == 'suspended' ) {
        const suspendedStatement = threadContext.blockContext.code[ threadContext.blockContext.pc-1 ];
        const suspendOn = suspendedStatement.name;
        result[ 'suspendedOn' ] = suspendOn;
        if( suspendOn == 'on' || suspendOn == 'signalWait' )  {
          result[ 'condition' ] = suspendedStatement.params.condition.toString();
          if( suspendedStatement.params.timeout ) {
            result[ 'condition' ] += ', timeout = '+suspendedStatement.params.timeout;
          }
        }
      }
      resultList.push( result );
    }
    return resultList;
  }
  _doCheckOn() {
    if( this.checkOnConditionList.length > 0 ) {
      // List of condition evaluated as false
      const newConditionList = [];
      // Check each registered condition
      for( const onInfo of this.checkOnConditionList ) {
        const conditionEval = this._evaluateParam( onInfo.condition, true );
        // We get the timeout, but if it is not defined we set it to infinity
        const timeoutEval = this._evaluateParam( onInfo.timeout, Infinity );
        // { 'context': jsenContext, 'condition': condition, 'timeout': timeout } );
        if( conditionEval || timeoutEval <= 0 ) {
          // We store whether the condition was met or timout expired
          const jsenOnStatus = ( conditionEval? this.jsenOnStatusCondition: this.jsenOnStatusTimeout );
          this._set( onInfo.context, JSENVM.wasOnConditionMetVariable, jsenOnStatus );
          // Execute post-condition since on is satisfied
          if( typeof( onInfo.onSatisfied ) == 'function' ) {
            onInfo.onSatisfied();
          }
          // If condition is true ==> wakeup the thread
          this.wakeupThreadId( onInfo.context.id );
        } else {
          // We decrease the timeout with the interval that has already elapsed since the last evaluation
          onInfo.timeout -= this.checkOnPeriod.timeout;
          // If condition is false ==> keep it in the list
          newConditionList.push( onInfo );
        }
      }
      // Update the list with all condition evaluated as false
      this.checkOnConditionList = newConditionList;

      // If there are no more conditions ==> suspend checkOn thread
      if( ( this.checkOnConditionList.length == 0 ) &&
          ( !this.isThreadSuspended( this.checkOnThreadId ) ) ) {
        this.suspendThreadId( this.checkOnThreadId );
      }
    }
  }
  _checkAndCallThreadJoinCallback() {
    // Since we remove called joinCallback, we use a new list for that
    // reassigning the list at end of the function
    let newThreadJoinkList = [];
    // Check all registered join callback
    for( const joinInfo of this.threadJoinList ) {
      if( joinInfo.joinCallback ) {
        // Assume all thread are terminated
        let isAllTerminated = true;
        // Check if all required threads are terminated
        for( const threadId of joinInfo.threadList ) {
          if( !this.isThreadTerminated( threadId ) ) {
            // If at least one thread is still running ->
            // then we can not call the join
            isAllTerminated = false;
            break;
          }
        }
        if( isAllTerminated ) {
          // If all threads are terminated ->
          // - we call the joinCallback
          // - we remove this callback from the list (we don't save in the new list)
          joinInfo.joinCallback();
        } else {
          // If there are still thread running ->
          // - we keep the callback in the new list
          newThreadJoinkList.push( joinInfo );
        }
      }
    }
    // Replace old list with new list (where called join are removed)
    this.threadJoinList = newThreadJoinkList;
  }
  _spawnRunAllFastThreads() {
    // TODO: think about this function
    // This function should make sure that if the runAllThreads()
    // is running, then the timer should not be set
    if( this.isRunAllFastThreadsRunning == false ) {
      // Call the runAllTreads out of this function
      setTimeout( ()=> this._runAllFastThreads(), 0 );
    }
  }
  _spawnRunAllSlowThreads() {
    // TODO: think about this function
    // This function should make sure that if the runAllThreads()
    // is running, then the timer should not be set
    if( this.isRunAllSlowThreadsRunning == false ) {
      // Call the runAllTreads out of this function
      setTimeout( ()=> this._runAllSlowThreads(), 0 );
    }
  }
  _runAllFastThreads( isDryRun ) {
    // We check if we want to really execute, or just give a preview
    isDryRun = ( isDryRun === undefined? false: isDryRun );
    // Set the flag that this function is running
    this.isRunAllFastThreadsRunning = true;
    // Run all threads in the running list
    while( !this._isFastRunningListEmpty() ) {
      this._stepAllFastThreads( isDryRun );
    }
    // Reset the flag, since this function is not running anymore
    this.isRunAllFastThreadsRunning = false;
  }
  _runAllSlowThreads( isDryRun ) {
    // We check if we want to really execute, or just give a preview
    isDryRun = ( isDryRun === undefined? false: isDryRun );
    // Set the flag that this function is running
    this.isRunAllSlowThreadsRunning = true;
    // Run all threads in the running list
    while( !this._isSlowRunningListEmpty() ) {
      this._stepAllSlowThreads( isDryRun );
      if( this.slowThreadPeriod > 0 ) {
        setTimeout( ()=> this._runAllSlowThreads( isDryRun ), this.slowThreadPeriod * 1000 );
        return;
      }
    }
    // Reset the flag, since this function is not running anymore
    this.isRunAllSlowThreadsRunning = false;
  }
  _isFastRunningListEmpty() {
    return ( this.thread.byStatus.fast.running.length == 0 );
  }
  _isSlowRunningListEmpty() {
    return ( this.thread.byStatus.slow.running.length == 0 );
  }
  _stepAllFastThreads( isDryRun ) {
    this._stepAllThreads( this.thread.byStatus.fast, isDryRun )
  }
  _stepAllSlowThreads( isDryRun ) {
    this._stepAllThreads( this.thread.byStatus.slow, isDryRun )
  }
  _stepAllStepByStepThreads( isDryRun ) {
    this._stepAllThreads( this.thread.byStatus.stepByStep, isDryRun )
  }
  _stepAllThreads( threadList, isDryRun ) {
    // Loop over all threads in the running list
    for( const threadId of threadList.running ) {
      // Get thread context
      const threadContext = this.thread.byId[ threadId ];
      if( !isDryRun ) {
        // Run one step for the thread
        this._step( threadContext );
      } else {
        // Just log thread name
        this._log( 'DryRun thread: '+threadContext.name, threadContext );
      }
    }
  }
  // TODO: we should clean the handiling when skipping checkOn
  // Called only for threads in step by step mode
  _stepWrapper( nameOrId, isDryRun ) {
    // We check if we want to really execute, or just give a preview
    isDryRun = ( isDryRun === undefined? false: isDryRun );

    // TODO: verify if we could put the checkOn thread in stepByStep
    //       or we may check if it is in stepByStep here
    // We explicitly "check on" because if we're in step by step mode, the check-on thread is not running
    this._doCheckOn();
    // List of threads in step by step mode
    const runningThreadList = this.thread.byStatus.stepByStep.running;
    const suspendedThreadList = this.thread.byStatus.stepByStep.suspended;

    // If we have threads in the list
    if( runningThreadList.length > 0 ) {
      switch( nameOrId ) {
        // In this case we step all running threads
        case '*':
          this._stepAllStepByStepThreads( isDryRun );
          break;
        // In this case we step only the next thread from this.currentStepByStepIndex
        case undefined:
          // If the target index is no longer available, we reset it to 0
          if( Number.isNaN( this.currentStepByStepIndex ) ||
              ( this.currentStepByStepIndex >= runningThreadList.length ) ) {
            this.currentStepByStepIndex = 0;
          }
          // Determine the next thread in line
          const threadContext = this.thread.byId[ runningThreadList[ this.currentStepByStepIndex ] ];
          // Set nameOrId used in default switch-case
          nameOrId = threadContext.id;
          // We increment the step index, or return it to 0 if we've reached the end of the thread list
          this.currentStepByStepIndex = (this.currentStepByStepIndex + 1) % (runningThreadList.length + suspendedThreadList.length);
          // If the current thread is the checkOn thread, we skip its turn
          if( ( this.checkOnThreadId != -1 ) && ( threadContext.id == this.checkOnThreadId ) ) {
            // If the checkOn thread is the only one left running, we halt execution;
            if( runningThreadList.length == 1 ) {
              this._logDebugger( threadContext, 'Given thread is checkOn thread. Cannot step.' );
            } else {
              // Call stepWrapper again so to take the next stepByStep thread
              this._stepWrapper( undefined, isDryRun );
            }
          }
          // no break! We need to run default switch-case
        default:
          // Get thread name and id
          const threadData = this.getThreadNameId( nameOrId );
          if( threadData ) {
            // Get thread context
            const threadContext = this.thread.byId[ threadData.id ];
            // We skip the checkOn thread
            if( threadData.id == this.checkOnThreadId ) {
              this._logDebugger( threadContext, 'Given thread is checkOn thread. Cannot step.' );
            } else {
              // If the thread is not running, we should not step, even if we have a valid context and program counter
              if( !isDryRun ) {
                if( runningThreadList.includes( threadData.id ) ) {
                  // Run one step for the thread
                  this._step( threadContext );
                }
              }
              // Show next line
              this._logStatementWrapped( this.thread.byId[ threadContext.id ] );
            }
          } else {
            this._logWarning( 'Thread not found!' );
          }
          break;
      }
    }
  }
  _step( threadContext ) {
    // Can't step on undefined threadContext
    if( !threadContext || !threadContext.blockContext ) {
      return;
    }
    // Get thread block context
    let blockContext = threadContext.blockContext;
    // Define the length of the code to be executed
    const codeLen = ( !blockContext.code ? 0: blockContext.code.length );

    // If there are still code statement to be executed ==> run the next statement or block
    if( blockContext.pc < codeLen ) {
      // Get next statement to be executed
      const codeStatement = blockContext.code[ blockContext.pc ];

      // If current thread is in step by step mode ==> compute line number and log some info
      if( this.isThreadStepByStep( threadContext.id ) ) {
        // Compute line idex from line map
        const lineIndex = threadContext.codeLinesMap.indexOf( codeStatement );
        threadContext['lineNumber'] = lineIndex;
        // Print debug info if debug level > 1
        if( threadContext.debugLevel > 1 ) {
          this._log( 'JVM-Step['+threadContext.name+']( '+blockContext.pc+' ): '+
                     ' lineNum( '+threadContext['lineNumber']+' ) '+
                     threadContext.codeSource[lineIndex] );
        }
      }
      // Execution result of a last statement
      let execStatus = null;
      if( threadContext.debugLevel > 1 ) {
        // Log program counter
        this._log( 'pc: '+blockContext.pc, threadContext );
      }

      // Execution of current thread statement
      switch( typeof( codeStatement ) ) {
        case 'function':  // Case of javascript code like: ()=> console.log( 'message' ),
          execStatus = this._executeCodeFunction( codeStatement, threadContext );
          break;
        case 'string':    // Case of comment like: "This is a comment",
        case 'undefined': // Case of comment like: ,
          break;
        case 'object':    // Case of block or JSEN.* function
          // If I find a code block, I treat it as a sub-context (for now, not the best way)
          if( Array.isArray( codeStatement ) ) {  // Case of block like: [ ... ],
            execStatus = this._executeCodeBlock( codeStatement, threadContext );
          } else {  // Case of jsen statement like: JSEN.print( 'message' ),
            // In this case we have an assembly instruction into an object (JSON data with call and params)
            execStatus = this._executeJSENStatement( codeStatement, threadContext );
          }
          break;
      }

      // Move pc to next statement in context of codeStatement
      ++blockContext.pc;
    } else {
      // If the current context have been executed by another context ==> restore it
      if( blockContext.callerContext ) {
        blockContext = this._switchToCallerContext( threadContext );
      } else {
        // Otherwise the thread is terminated
        this.stopThreadId( threadContext.id );
      }
    }

    // Check all breakpoint conditions
    if( this.breakpointListCounter > 0 ) {
      this._checkAllBreakpoint( threadContext );
    }
  }
  _switchToCallerContext( threadContext ) {
    // If we are not in root context ==> we change block context
    if( threadContext.blockContext.callerContext ) {
      // Restore caller context
      threadContext.blockContext = threadContext.blockContext.callerContext;
    }
    // Return context
    return( threadContext.blockContext );
  }
  _checkAllBreakpoint( threadContext ) {
    // Check first virtual machine breakpoint (thread independent)
    const vmBreakpoint = this.breakpointList[ '*' ];
    if( vmBreakpoint && ( vmBreakpoint.length > 0 ) ) {
      this._checkBreakpointList( vmBreakpoint, '*', threadContext );
    }
    // Check for thread specific breakpoints
    const threadBreakpoint = this.breakpointList[ threadContext.id ];
    if( threadBreakpoint && ( threadBreakpoint.length > 0 ) ) {
      this._checkBreakpointList( threadBreakpoint, threadContext.id, threadContext );
    }
  }
  _checkBreakpointList( bpList, threadId, threadContext ) {
    // Get threadId
    for( const bpInfo of bpList ) {
      const condition = ( bpInfo.condition? bpInfo.condition: true );
      if( condition() ) {
        this._logDebugger( threadContext, 'Breakpoint condition \''+condition.toString()+'\' met' );
        if( bpInfo.action ) {
          bpInfo.action();
        }
        this.pauseThread( threadId );
        // Once the breakpoint condition is met and the execution is paused,
        // and we remove the breakpoint
        const breakpointIndex = bpList.indexOf( bpInfo );
        bpList.splice( breakpointIndex, 1 );
        --this.breakpointListCounter;
      }
    }
  }
  _moveThread( threadId, fromThreadList, toThreadList ) {
    // We add the thread to the new list
    toThreadList.push( threadId );
    // We remove the thread from the old list
    const threadIndex = fromThreadList.indexOf( threadId );
    if( threadIndex != -1 ) {
      fromThreadList.splice( threadIndex, 1 );
    }
  }
  _evaluateParam( param, defaultParam ) {
    let result;
    switch( typeof( param ) ) {
      case 'function':
        result = param();
        break;
      case 'object':
        result = ( param.value? param.value: param );
        break;
      case 'undefined':
        result = defaultParam;
        break;
      default:
        result = param;
    }
    return result;
  }
  // Get variable value from ".value" property
  _get( threadContext, variableName ) {
    // Get variable
    const variable = this._getVariable( threadContext, variableName );
    // Return variable value
    if( variable ) {
      return variable.value;
    } else {
      return undefined;
    }
  }
  // Set variable value to ".value" property
  _set( threadContext, variableName, value ) {
    // Get variable
    const variable = this._getVariable( threadContext, variableName );
    // Set variable value
    if( variable ) {
      variable.value = value;
    } else {
      this._setVariable( threadContext, variableName, { 'value': value } );
    }
  }
  // Get variable object
  _getVariable( threadContext, variableName ) {
    let variable = undefined;
    let blockContext = undefined;
    
    if( threadContext ) {
      blockContext = threadContext.blockContext;
    }
    // Search the variable first in local threadContext, up to top context
    while( blockContext ) {
      if( blockContext.variableList[ variableName ] ) {
        variable = blockContext.variableList[ variableName ];
        break;
      } else {
        blockContext = blockContext.callerContext;
      }
    }
    // If not in threadContext, then look in global context
    if( !blockContext ) {
      if( this.globalVariableList[ variableName ] ) {
        variable = this.globalVariableList[ variableName ];
      }
    }
    return variable;
  }
  // Set variable object
  _setVariable( threadContext, variableName, valueObj ) {
    if( threadContext ) {
      threadContext.blockContext.variableList[ variableName ] = valueObj;
    } else {
      this.globalVariableList[ variableName ] = valueObj;
    }
  }
  _logStatus() {
    // Create a string with all thread id
    let threadIdList = '';
    for( const threadId in this.thread.byId ) {
      threadIdList += threadId+',';
    }
    // Log the thread context
    this._log( '----[ JSENVM Thread Status ] ----------------' );
    //this._log( 'threads byId: '+this.getThreadNameList( this.thread.byId.keys() ) );
    this._log( 'threads byId: '+threadIdList );
    this._log( 'threads byName: '+JSON.stringify( this.thread.byName ) );
    this._log( 'threads byStatus: ' );
    this._log( '        ready         : '+this.getThreadNameList( this.thread.byStatus.ready ) );
    this._log( '        fast' );
    this._log( '          running     : '+this.getThreadNameList( this.thread.byStatus.fast.running ) );
    this._log( '          suspended   : '+this.getThreadNameList( this.thread.byStatus.fast.suspended ) );
    this._log( '        slow' );
    this._log( '          running     : '+this.getThreadNameList( this.thread.byStatus.slow.running ) );
    this._log( '          suspended   : '+this.getThreadNameList( this.thread.byStatus.slow.suspended ) );
    this._log( '        step by step' );
    this._log( '          running    : '+this.getThreadNameList( this.thread.byStatus.stepByStep.running ) );
    this._log( '          suspended  : '+this.getThreadNameList( this.thread.byStatus.stepByStep.suspended ) );
    this._log( '        terminated   : '+this.getThreadNameList( this.thread.byStatus.terminated ) );
    this._log( '----[ END ] ----------------------------' );
  }
  _log( message, jsenContext ) {
    // If no context, just log, otherwise use debug level
    if( !jsenContext ) {
      console.log( message );
    } else if( jsenContext.debugLevel > 0 ) {
      console.log( message );
    }
  }
  _logWarning( message ) {
    // Just log for now
    console.log( 'WARNING: '+message );
  }
  _logStatementWrapped( threadContext ) {
    // We exit if there's no context
    if( !threadContext ) {
      return;
    }

    // We exit if thread has no more statements, even if still running
    var codeStatementNext = threadContext.blockContext.code[ threadContext.blockContext.pc ];
    if( codeStatementNext === undefined ) {
      if( threadContext.blockContext.callerContext ) {
        codeStatementNext = 'End of block';
      }
      else {
        this._logDebugger();
        return;
      }
    }

    // We should not step if the thread is currently suspended,
    // and we also show the statement blocking the thread
    if( !this.thread.byStatus.stepByStep.running.includes( threadContext.id ) ) {
      console.log( 'Cannot perform step, thread \'' + threadContext.name + '\' is not running at the moment' );
    }

    // If we have a JSEN. function, we need to manually serialize it for printing
    if( typeof( codeStatementNext ) == 'object' ) {
      codeStatementNext = this._logStatement( codeStatementNext );
    }

    this._logDebugger( threadContext, codeStatementNext );
  }
  _logStatement( codeStatement ) {
    // TODO: check if we need this function ==> we may delete it
    let result = '';
    var paramsString = '';
    if( codeStatement instanceof Array && codeStatement.length > 0 ) {
      // If statement is a block, we just state so, and handle inner statements once we're inside the block itself
      result = '[';
    } else if( typeof( codeStatement ) == 'object' ) {
      // If statement is a jsen function, we need to explicitly serialize it
      switch( typeof( codeStatement.params ) ) {
        case 'object':
          if( codeStatement.params['condition'] ) {
            paramsString += codeStatement.params['condition'].toString();
          }
          if( codeStatement.params['timeout'] ) {
            paramsString += ', { timeout: '+codeStatement.params['timeout']+' }';
          }
          break;
        case 'function':
          paramsString += this._getParamsToString( '', codeStatement.params );
          break;
        default:
          paramsString = new String( codeStatement.params );
          break;
      }

      result = codeStatement.name + '(' + paramsString + ')  ';
    }

    return result;
  }
  // TODO: review this function!!!
  _logDebugger( threadContext, codeStatement, lineNr ) {
    if( codeStatement === undefined ) {
      if( threadContext && !threadContext.blockContext.callerContext )
        console.log( 'Debugger: end of current block' );
      else
        console.log( 'Debugger: no threads in running status' );
    } else {
      // If we have a parent context, we show the big picture line number
      var line = ( lineNr === undefined ) ? "###" : lineNr;
      console.log( 'Debugger ' + threadContext.name + ':' + line + ' : ' + codeStatement );
    }
  }
  /* -----------------------------------------------------------------
  * JSENVM Firmware functions
  *-----------------------------------------------------------------*/
  _executeCodeFunction( codeStatement, threadContext ) {
    // Execute the line as function
    return codeStatement();
  }
  _executeCodeBlock( codeStatement, threadContext ) {
    // Create a new block context
    const subBlockContext = this._getNewBlockContext( codeStatement, threadContext.blockContext );
    // If thread is in step by step ==> propagate debug info
    if( this.isThreadStepByStep( threadContext.id ) ) {
      const lineIndex = threadContext.codeLinesMap.indexOf( codeStatement );
      threadContext['lineNumber'] = lineIndex+1;
    }
    // Replace current block context with sub-context
    threadContext.blockContext = subBlockContext;

    return null;
  }
  _executeJSENStatement( codeStatement, threadContext ) {
    // Extract codeStatement fields
    const name = codeStatement.name;
    const params = codeStatement.params;

    // Call assembler function
    this.statementMap[name]( threadContext, params );
  }
  /* -----------------------------------------------------------------
   * JSENVM Assembler functions
   *-----------------------------------------------------------------*/
  _setupStatementMap() {
    // Register all asm implementation of JSEN.* statements
    this.statementMap = {
      // Register a guard condition that suspend the thread if not satisfied or timeout passed
      on: ( threadContext, params )=> {
        // Get the condition
        const condition = params.condition;
        const conditionEval = this._evaluateParam( params.condition, true );
        const timeout = params.timeout;
        const onSatisfied = params.onSatisfied;
        // We get the timeout, but if it is not defined we set it to infinity
        let timeoutEval = this._evaluateParam( timeout, Infinity );

        // If the condition is not met and the timeout hasn't expired yet ==> suspend the thread
        if( !conditionEval && timeoutEval > 0 ) {
          // Suspend the thread
          this.suspendThreadId( threadContext.id );
          this._log( threadContext, 'suspending at: '+threadContext.blockContext.pc );

          // Store condition information
          const conditionInfo = {
            context: threadContext,
            condition: condition,
            timeout: timeoutEval,
            onSatisfied: onSatisfied,
          };
          // Add the condition in the condition list
          this.checkOnConditionList.push( conditionInfo );

          // Wakeup checkOn thread in case it is suspended
          if( this.isThreadSuspended( this.checkOnThreadId ) ) {
            this.wakeupThreadId( this.checkOnThreadId );
          }
        } else {
          // Store whether the condition was met, or the timeout expired
          const jsenOnStatus = ( conditionEval? this.jsenOnStatusCondition: this.jsenOnStatusTimeout );
          this._set( threadContext, JSENVM.wasOnConditionMetVariable, jsenOnStatus );
          // Increment pc one more if we are suspended at the end of a block
          if( threadContext.blockContext.pc == threadContext.blockContext.code.length-1 ) {
            ++threadContext.blockContext.pc;
          }
        }
        return null;
      },
      // Access the reason for the "on" to continue (condition or timeout)
      getOnStatus: ( threadContext, params )=> {
        params.variableName = JSENVM.wasOnConditionMetVariable;
        this.statementMap.get( threadContext, params );
      },
      // Suspend the thread for a specific timeout
      sleep: ( threadContext, params )=> {
        // Evaluate timeout
        let timeoutEval = this._evaluateParam( params, Infinity );

        // Suspend the thread if timeout is non zero
        if( timeoutEval > 0 ) {
          this.suspendThreadId( threadContext.id );
          this._log( threadContext, 'suspending at: '+threadContext.blockContext.pc );
      
          if( isFinite( timeoutEval ) ) {
            // Register the wakeup function
            setTimeout( ()=> this.wakeupThreadId( threadContext.id ), timeoutEval*1000 );
          }
        }
        return null;
      },
      // Print to console a message (with thread info)
      print: ( threadContext, params )=> {
        // Get thread name
        const messagePrefix = ( threadContext === 'undefined'? '': '['+threadContext.name+']: ' );
        const messageEval = this._evaluateParam( params, true );
        // Print the params value
        console.log( messagePrefix+messageEval );

        return null;
      },
      // If conditional statement
      if: ( threadContext, params )=> {
        // Get the condition
        const conditionEval = this._evaluateParam( params );

        // If the else exists ==> copy condition evaluation to the else statement
        if( threadContext !== undefined ) {
          let statementAfterThen = threadContext.blockContext.code[ threadContext.blockContext.pc + 2 ];
          if( statementAfterThen !== undefined ) {
            if( typeof( statementAfterThen ) == 'object' &&  statementAfterThen.name === "else" ) {
              statementAfterThen.params = conditionEval;
            }
          }
        }

        // Test if condition
        if( !conditionEval ) {
          ++threadContext.blockContext.pc; // skip the next statement if condition is false
        }

        return null;
      },
      // Else conditional statement
      else: ( threadContext, params )=> {
        const ifConditionResult = params;
        // We skip the else block if if-condition is true
        if( ifConditionResult ) {
          ++threadContext.blockContext.pc; // skip the next statement
        }

        return null;
      },
      // Register a new label
      label: ( threadContext, params )=> {
        // Get label
        const label = this._evaluateParam( params, '' );
        // Associate the label name to the next statement
        //TODO: if label not found I have to do something
        threadContext.blockContext.labelList[ label ] = threadContext.blockContext.pc+1;

        return null;
      },
      // Goto a label
      goto: ( threadContext, params )=> {
        // Get label
        const label = this._evaluateParam( params, '' );

        // If label is defined
        if( threadContext.blockContext.labelList[ label ] !== undefined ) {
          // Jump to pc associated to label
          //-------------------------------------------------------
          // NOTE: I have to decrement the pc of 1 since there is
          //       an auto increment of pc in the _step()
          //-------------------------------------------------------
          threadContext.blockContext.pc = threadContext.blockContext.labelList[ label ]-1;
        } else {
          this._logWarning( 'Label not found: '+label );
        }

        return null;
      },
      // Basic unconditional loop statement
      loop: ( threadContext, params )=> {
        // Implement the loop as a while true
        params = true;
        this.statementMap.while( threadContext, params );

        return null;
      },
      // Break from current loop or block statement
      break: ( threadContext, params )=> {
        // Go to block end
        this.statementMap.goto( threadContext, 'blockEnd' );
        // Get Caller Context
        const cc = threadContext.blockContext.callerContext;
        // If we are not in the root context & we are iterating (for, loop, ...)
        if( cc && cc.isIterative ) {
          // Stop iteration
          cc.isIterative = false;
          cc.pc += 2;
        }
        return null;
      },
      // Continue loop statement or go to start of block
      continue: ( threadContext, params )=> {
        // Get Caller Context
        const cc = threadContext.blockContext.callerContext;
        // If we are not in the root context & we are iterating (for, loop, ...)
        if( cc && cc.isIterative ) {
          // Go to end of block
          this.statementMap.goto( threadContext, 'blockEnd' );
          // Caller contex switch will then check iteration condition
        } else {
          // If there is not caller context, just go to beginning of block
          this.statementMap.goto( threadContext, 'blockBegin' );
        }
        return null;
      },
      // While conditional loop statement
      while: ( threadContext, params )=> {
        // Get the block that follows the loop (single statement or sub-block)
        const loopBlock = threadContext.blockContext.code[ threadContext.blockContext.pc + 1 ];
        // TODO: We only allow block content, check if this restriction is that important!!!
        if( !Array.isArray( loopBlock ) ) {
          this._logWarning( 'Cannot perform basic loops over non-block statements' );
          return null;
        }
        // Get the condition
        const evalCondition = this._evaluateParam( params );

        // If condition is false ==> skip next statement
        if( !evalCondition ) {
          threadContext.blockContext.isIterative = false;
          ++threadContext.blockContext.pc;
        } else {
          threadContext.blockContext.isIterative = true;
          // Use contex where statement is defined in
          const blockContext = threadContext.blockContext;
          blockContext.isIterative = true;
          ++blockContext.pc;
          this._step( threadContext );
          // Move pc back to iterative statement
          // 2 position back to reach the current statement
          // 1 more position back since current step will increment pc
          blockContext.pc -= 3;
        }

        return null;
      },
      // For loop statement
      for: ( threadContext, params )=> {
        // Get the block that follows the loop (single statement or sub-block)
        const loopBlock = threadContext.blockContext.code[ threadContext.blockContext.pc + 1 ];
        // TODO: We only allow block content, check if this restriction is that important!!!
        if( !Array.isArray( loopBlock ) ) {
          this._logWarning( 'Cannot perform basic loops over non-block statements' );
          return null;
        }
        // Get for info
        const iterator = this._evaluateParam( params.iterator, '_' );
        const lower = this._evaluateParam( params.lower, 0 );
        const upper = this._evaluateParam( params.upper, 0 );
        let increment = this._evaluateParam( params.increment, undefined );

        // Get iterator info
        let iteratorInfo = this._getVariable( threadContext, iterator );

        // If it is the first iteration
        if( iteratorInfo === undefined ) {
          // Then we can compute increament
          increment = ( increment? increment: ( lower < upper? 1: -1 ) );
          // Initialize iterator
          iteratorInfo = {
            lower: lower,
            upper: upper,
            value: lower,
            increment: increment,
          };
          // Create iterator variable
          this._setVariable( threadContext, iterator, iteratorInfo );
        } else {
          // Otherwise continue the loop to next index
          iteratorInfo.value += iteratorInfo.increment;
        }
        // If we've surpassed the upper limit
        let isForTerminated = ( iteratorInfo.increment > 0?
                                iteratorInfo.value >= iteratorInfo.upper:
                                iteratorInfo.value <= iteratorInfo.upper );
        if( isForTerminated ) {
          threadContext.blockContext.isIterative = false;
          ++threadContext.blockContext.pc; // skip the next statement, which is a block
        } else {
          threadContext.blockContext.isIterative = true;
          // Use contex where statement is defined in
          const blockContext = threadContext.blockContext;
          blockContext.isIterative = true;
          ++blockContext.pc;
          this._step( threadContext );
          // Move pc back to iterative statement
          // 2 position back to reach the current statement
          // 1 more position back since current step will increment pc
          blockContext.pc -= 3;
        }

        return null;
      },
      // Foreach loop statement
      foreach: ( threadContext, params )=> {
        // Get the block that follows the loop (single statement or sub-block)
        const loopBlock = threadContext.blockContext.code[ threadContext.blockContext.pc + 1 ];
        // TODO: We only allow block content, check if this restriction is that important!!!
        if( !Array.isArray( loopBlock ) ) {
          this._logWarning( 'Cannot perform basic loops over non-block statements' );
          return null;
        }
        // Get foreach info
        const iterator = this._evaluateParam( params.iterator, '_' );
        const array = this._evaluateParam( params.array, [] );

        // Get iterator info
        let iteratorInfo = this._getVariable( threadContext, iterator );

        // If it is the first iteration
        if( iteratorInfo === undefined ) {
          iteratorInfo = {
            array: array,
            value: ( array? array[0]: undefined ),
            index: 0,
          };
          // Create iterator variable
          this._setVariable( threadContext, iterator, iteratorInfo );
        } else {
          // Otherwise continue the loop to next index
          ++iteratorInfo.index;
          iteratorInfo.value = ( iteratorInfo.array?
                                 iteratorInfo.array[iteratorInfo.index]:
                                 undefined );
        }

        // Check if we've reached the end of the array
        const iteratorIndex = iteratorInfo.index;
        const iteratorMax = iteratorInfo.array.length;
        if( iteratorIndex >= iteratorMax ) {
          threadContext.blockContext.isIterative = false;
          ++threadContext.blockContext.pc; // skip the next statement, which is a block
        } else {
          threadContext.blockContext.isIterative = true;
          // Use contex where statement is defined in
          const blockContext = threadContext.blockContext;
          blockContext.isIterative = true;
          ++blockContext.pc;
          this._step( threadContext );
          // Move pc back to iterative statement
          // 2 position back to reach the current statement
          // 1 more position back since current step will increment pc
          blockContext.pc -= 3;
        }
        return null;
      },
      // Get the value of a user variable
      get: ( threadContext, params )=> {
        // Get variable object
        const variableName = this._evaluateParam( params.variableName, '_' );
        const variableValue = this._get( threadContext, variableName );
        // Execute callback with variable value
        params.callback( variableValue );

        return null;
      },
      // Set the value of a user variable
      set: ( threadContext, params )=> {
        // Get variable object
        const variableName = this._evaluateParam( params.variableName, '_' );
        const variableValue = this._evaluateParam( params.value );
        // Set variable value
        this._set( threadContext, variableName, variableValue );

        return null;
      },
      // Repeat until conditional loop statement
      until: ( threadContext, params )=> {
        // Get the condition
        const conditionEval = this._evaluateParam( params );

        // If condition is not yet true ==> loop
        if( !conditionEval ) {
          threadContext.blockContext.pc -= 2; // re-execute the previous block or statement
        }

        return null;
      },
      // Switch conditional statement
      switch: ( threadContext, params )=> {
        // If switch stack is not yet defined
        const switchVariableValue = this._evaluateParam( params );
        if( !threadContext.blockContext.variableList[ JSENVM.switchStackVariable ] ) {
          threadContext.blockContext.variableList[ JSENVM.switchStackVariable ] = { value: [] }
        }
        // Push switch variable to the stack
        threadContext.blockContext.variableList[ JSENVM.switchStackVariable ].value.push( switchVariableValue );
      },
      // Case statement for a previous switch;
      case: ( threadContext, params )=> {
        // Get case info
        const caseValueEval = this._evaluateParam( params );
        const switchStack = this._get( threadContext, JSENVM.switchStackVariable );
        const switchValue = switchStack[ switchStack.length - 1 ];
        const variableEval = this._evaluateParam( switchValue );

        // If this is the last case block, we pop the switch condition from the switch stack
        const statementAfterCase = threadContext.blockContext.code[ threadContext.blockContext.pc + 2 ];
        if( ( statementAfterCase === undefined ) ||
            ( ( statementAfterCase !== undefined ) &&
              ( statementAfterCase.name !== 'case' ) ) ) {
          switchStack.pop();
        }

        // If case is not meet ==> skip case block
        if( caseValueEval !== variableEval ) {
          ++threadContext.blockContext.pc;
        }
      },
      // Force the execution of checkOn conditions
      forceCheckOn: ( threadContext, params )=> {
        this._doCheckOn();
      },
      // Initialize a synchronization signal
      signalInit: ( threadContext, params )=> {
        this.signalNameList[params] = false;
      },
      // Notify happening of a synchronization signal
      signalNotify: ( threadContext, params )=> {
        this.signalNameList[params] = true;
      },
      // Wait for the happening of a synchronization signal
      signalWait: ( threadContext, params )=> {
        params.condition = ()=> this.signalNameList[params.signalName] === true;
        params.onSatisfied = ()=> this.signalNameList[params.signalName] = false;
        this.statementMap['on']( threadContext, params );
      },
      setBroadcastSignal: ( threadContext, params )=> {
        if( !JSENVM.boradcastSignal ) {
          JSENVM.boradcastSignal = {};
        }
        JSENVM.boradcastSignal[params] = true;
      },
      resetBroadcastSignal: ( threadContext, params )=> {
        if( !JSENVM.boradcastSignal ) {
          JSENVM.boradcastSignal = {};
        }
        JSENVM.boradcastSignal[params] = false;
      }
    };
  }
}

JSENVM.getSingleton = function(checkOnTimeout) {
  if (!JSENVM._singletonInstance) {
    JSENVM._singletonInstance = new JSENVM(checkOnTimeout);
  }

  return JSENVM._singletonInstance;
}

if( module ) {
  module.exports = JSENVM;
}