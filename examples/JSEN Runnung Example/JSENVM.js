/*
 *  JSEN Virtual Machine (local copy)
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


/* TODO:
   - Its now possible to create two threads with the same name.
     Effect is that the first will not be anymore accessible by name,
     only by Id
 */

class JSENVM {
  /**
   * JSEN Virtual Machine constractor
   */
  constructor() {

    // Information about created threads
    this.thread = {
      // List of threads by id (start from 0, id equal to array position)
      byId: [],   //jsen_threadList
      // List of threads by name (thread.name => thread.id)
      byName: {}, // jsen_threadByName
      // List of threads by status (thread.id stored in the relative status)
      byStatus: { // jsen_threadByStatus
        ready: [],
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
        terminated: [],
      }
    };

    //
    this.isRunAllFastThreadsRunning = false;

    //
    this.isRunAllSlowThreadsRunning = false;

    // List of registered conditions for "on()" statements
    this.conditionList = [];

    // Debug level for logging
    this.debugLevel = 0;

    // Artificial delay (in seconds) between execution of consecutive atomic operations.
    // 0 = no delay
    this.threadPeriod = 0;

    // Index of last stepped thread, when in step by step mode
    this.stepIndex = 0;

    // CheckOn periodic thread period
    this.checkOnPeriod = { timeout: 1 }; //0.3

    // CheckOn periodic thread code
    this.checkOnPeriodicThread = [
      //jsen_print("jsen------------------ before checkOn --------------------------"),
      () => this._checkOn(),
      //jsen_print("jsen------------------ after checkOn --------------------------"),
    ];

    this.checkOnThreadId = -1;

    this.breakpoints = [];

    this.switchStackVariable = 'switchStackVariable';
    this.wasOnConditionMetVariable = 'wasOnConditionMetVariable';

    this.userVariableList = {};
    this.userVariableList[ this.switchStackVariable ] = { value: [] };
    this.userVariableList[ this.wasOnConditionMetVariable ] = { value: undefined };

    this._setupAsmFuncMap();
  }
  /* -----------------------------------------------------------------
   * JSEN Public High-Level API functions
   *-----------------------------------------------------------------*/
  newThread( name, jsenCode, debugLevel ) {
    // Default value for debugLevel
    debugLevel = ( ( debugLevel === undefined ) ? 0: debugLevel );
    // We abort if a thread by that name already exists
    if( this.getThreadNameId( name ).id !== -1 ) {
      this._log('Error: A thread named \'' + name + '\' already exists' );
      return -1;
    }

    //NOTE: This function must be atomic from now till the end
    // Get next free id
    const threadId = this.getNextThreadId();
    // Get thread context
    const threadContext = this._getNewThreadContext( threadId, name, jsenCode, debugLevel, null );

    // Add thread in id list
    this.thread.byId.push( threadContext );
    // Add thread in ready list
    this.thread.byStatus.ready.push( threadId );
    // Add thread in name list
    this.thread.byName[name] = threadId;

    return threadId;
  }
  removeThread( nameOrIdOrList ) {
    const eligibleQueueList = [ 'ready', 'terminated' ];
    const threadList = this._getThreadIds( eligibleQueueList, nameOrIdOrList );
    for( const threadId of threadList ) {
      const threadContext = this.thread.byId[ threadId ];

      for( const queueName of eligibleQueueList ) {
        const queue = this.thread.byStatus[ queueName ];
        if( queue.includes( threadId ) ) {
          queue.splice( queue.indexOf( threadId ), 1 );
        }
      }

      delete this.thread.byId[ threadId ];
      delete this.thread.byName[ threadContext.name ];
    }
  }
  isThreadExist( nameOrId ) {
    // Get thread id
    const threadId = this.getThreadNameId( nameOrId ).id;
    return( threadId !== undefined );
  }
  startThread( nameOrId ) {
    // Get thread id
    const threadId = this.getThreadNameId( nameOrId ).id;
    if( threadId !== undefined ) {
      // Start thread as normal thread
      this.startThreadId( threadId, false );
    }
  }
  startLoopThread( nameOrId ) {
    // Get thread id
    const threadId = this.getThreadNameId( nameOrId ).id;
    if( threadId !== undefined ) {
      // Start thread as loop thread
      this.startThreadId( threadId, true );
    }
  }
  startPeriodicThread( nameOrId, period ) {
    // Default value for period
    period = ( period === undefined ? 1: period );

    // Get thread id
    const threadId = this.getThreadNameId( nameOrId ).id;
    if( threadId !== undefined ) {
      // Start thread as loop thread
      this.startThreadId( threadId, true, period );
    }
  }
  stopThread( nameOrId ) {
    // Get thread id
    const threadId = this.getThreadNameId( nameOrId ).id;
    if( threadId !== undefined ) {
      // Start thread as loop thread
      this.stopThreadId( threadId );
    }
  }
  stopAllThreads() {
    // Get thread id of all thread
    //TODO: note that for loop with "for in" may return a string as index.
    //      check any other case
    const threadIdLen =  this.thread.byId.length;
    for( let threadId = 0; threadId < threadIdLen; ++threadId ) {
      // Terminate each thread
      if( this.thread.byId[ threadId ] )
        this.stopThreadId( threadId );
    }
  }
  suspendThread( nameOrId ) {
    // Get thread id
    const threadId = this.getThreadNameId( nameOrId ).id;
    if( threadId !== undefined ) {
      // Start thread as loop thread
      this.suspendThreadId( threadId );
    }
  }
  getNextThreadId() {
    return this.thread.byId.length;
  }
  isThreadTerminated( nameOrId ) {
    // Get thread index in terminated list
    const threadId = this.getThreadNameId( nameOrId ).id;
    const threadIndex = this.thread.byStatus.terminated.indexOf( threadId );
    return( threadIndex != -1 );
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
  wakeupThread( nameOrId ) {
    // Get thread id
    const threadId = this.getThreadNameId( nameOrId ).id;
    if( threadId !== undefined ) {
      // Start thread as loop thread
      this.wakeupThreadId( threadId );
    }
  }
  renewThread( nameOrId ) {
    // Get thread id
    const threadId = this.getThreadNameId( nameOrId ).id;
    if( threadId !== undefined ) {
      // Start thread as loop thread
      this.renewThreadId( threadId );
    }
  }
  renewAllThread() {
    // Duplicate initial list of terminated threads
    const tempThreadList =  this.thread.byStatus.terminated.slice();
    for( const threadId of tempThreadList ) {
      // Renew each thread
      this.renewThreadId( threadId );
    }
  }
  startAllThread() {
    // Duplicate initial list of ready threads
    const tempThreadList =  this.thread.byStatus.ready.slice();
    for( const threadId of tempThreadList ) {
      // Start each thread
      this.startThreadId( threadId );
    }
  }
  startCheckOn( period ) {
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
    }
  }
  stopCheckOn() {
    this.stopThread( 'checkOnPeriodicThread' );
    this.checkOnThreadId = -1;
  }
  setThreadPeriod( period ) {
    // We set the period, which applies to all slow threads
    this.threadPeriod = period;
  }
  setThreadToQueue( newQueue, threadList ) {
    // Destination list
    const toList = this.thread.byStatus[ newQueue ].running;
    // All eligible source lists
    const allLists = [ this.thread.byStatus.ready,
      this.thread.byStatus.fast.running,
      this.thread.byStatus.fast.suspended,
      this.thread.byStatus.slow.running,
      this.thread.byStatus.slow.suspended,
      this.thread.byStatus.stepByStep.running,
      this.thread.byStatus.stepByStep.suspended,
      this.thread.byStatus.terminated ];
    for( const threadName of threadList ) {
      const threadData = this.getThreadNameId( threadName );
      for( const threadList of allLists) {
        if( threadList.includes( threadData.id ) )
          this._moveThread( threadData.id, threadList, toList );
      }
    }
  }
  slowThread( nameOrIdOrList ) {
    const threadIdList = this._getThreadIds( [ 'ready', 'fast', 'stepByStep' ], nameOrIdOrList );
    // We move threads between running lists as necessary
    for( const threadId of threadIdList ) {
      const threadContext = this.thread.byId[threadId];
      this._insertDebugInfo( threadContext, threadContext.code );

      if( this.thread.byStatus.ready.includes( threadId ) ) {
        this._moveThread( threadId, this.thread.byStatus.ready, this.thread.byStatus.slow.running );
      }
      else if( this.thread.byStatus.fast.running.includes( threadId ) ) {
        this._moveThread( threadId, this.thread.byStatus.fast.running, this.thread.byStatus.slow.running );
      }
      else if( this.thread.byStatus.fast.suspended.includes( threadId ) ) {
        this._moveThread( threadId, this.thread.byStatus.fast.suspended, this.thread.byStatus.slow.suspended );
      }
      else if( this.thread.byStatus.stepByStep.running.includes( threadId ) ) {
        this._moveThread( threadId, this.thread.byStatus.stepByStep.running, this.thread.byStatus.slow.running );
      }
      else if( this.thread.byStatus.stepByStep.suspended.includes( threadId ) ) {
        this._moveThread( threadId, this.thread.byStatus.stepByStep.suspended, this.thread.byStatus.slow.suspended );
      }
    }
  }
  fastThread( nameOrIdOrList ) {
    const threads = this._getThreadIds( [ 'ready', 'slow' ], nameOrIdOrList );
    // We move threads between running lists as necessary
    for( const threadId of threads ) {
      const threadContext = this.thread.byId[threadId];
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
    const threadList = this._getThreadIds( [ 'ready', 'fast', 'slow' ], nameOrIdOrList );
    // We move threads between running lists as necessary
    for( const threadId of threadList ) {
      const threadContext = this.thread.byId[ threadId ];
      this._insertDebugInfo( threadContext, threadContext.code );

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
    const threadList = this._getThreadIds( [ 'stepByStep' ], nameOrIdOrList );
    // We move threads between running lists as necessary
    for( const threadId of threadList ) {
      const threadContext = this.thread.byId[ threadId ];
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

  /* -----------------------------------------------------------------
   * JSEN Public Low-Level API functions
   *-----------------------------------------------------------------*/
  getThreadNameId( nameOrId ) {
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
    if( typeof threadIdList === 'object' )  {
      // If threadId is an array of id numbers
      let result = [];
      for( const id of threadIdList ) {
        const threadData = this.getThreadNameId( id );
        if( threadData.id >= 0)
          result.push( threadData.name );
      }
      return result;
    } else {
      // Otherwise generate a warning
      this._logWarning( 'Thread id: '+threadIdList+' must be an id or an array of ids' );
      //TODO: what is the best value to return
      return null;
    }
  }
  startThreadId( threadId, isLoopThread, period ) {
    // Default value for period
    period = ( period === undefined ? 0: period );
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
          threadContext.code.push( jsen_sleep( period ) );
          ++threadContext.labelList.threadEnd;
        }
        threadContext.code.push( jsen_goto( 'threadBegin' ) );
        ++threadContext.labelList.threadEnd;
      }
      // Remove thread from ready list and put in running list
      this._moveThread( threadId, this.thread.byStatus.ready, this.thread.byStatus.fast.running);
      // If there were no running threads ==> start the running processes
      if( wasFastRunningListEmpty ) {
        this._spawnRunAllFastThreads();
      }
      if( wasSlowRunningListEmpty ) {
        this._spawnRunAllSlowThreads();
      }
    } else {
      this._logWarning( 'Thread id: '+threadId+' not found in ready list' );
    }
  }
  stopThreadId( threadId ) {
    // Search thread index from ready, running or suspended list
    let threadIndex = -1;
    const threadStatusList = [ 'ready', 'fast', 'slow', 'stepByStep' ];
    const threadStatusSubList = [ 'running', 'suspended' ];
    // Search an all
    for( const status of threadStatusList ) {
      let found = false;
      for( const subStatus of threadStatusSubList ) {
        let list = this.thread.byStatus[ status ][ subStatus ];
        if( !list )
          list = this.thread.byStatus[ status ]
        // Get thead index from list
        threadIndex = list.indexOf( threadId );
        // If thread found
        if( threadIndex != -1 ) {
          // Move thread from the list to the terminated list
          this._moveThread( threadId, list, this.thread.byStatus.terminated );
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
  suspendThreadId( threadId ) {
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
  wakeupThreadId( threadId ) {
    // Check if there are running threads
    const wasFastRunningListEmpty = ( this.thread.byStatus.fast.running.length == 0 );
    const wasSlowRunningListEmpty = ( this.thread.byStatus.slow.running.length == 0 );
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
  renewThreadId( threadId ) {
    // Get thread index in ready list
    const threadIndex = this.thread.byStatus.terminated.indexOf( threadId );
    if( threadIndex != -1 ) {
      this._moveThread( threadId, this.thread.byStatus.terminated, this.thread.byStatus.ready );
      this.thread.byId[ threadId ].pc = 0;
    } else {
      this._logWarning( 'Thread id: '+threadId+' not found in terminated list' );
    }
  }
  stepPreview( nameOrId ) {
    this._stepWrapper( ( !nameOrId ) ? undefined : nameOrId, true );
  }
  step( nameOrId ) {
    this._stepWrapper( nameOrId, false );
  }
  breakOnCondition( condition, action, threadNameOrId ) {
    const breakpoint = {
      condition: condition,
      actions: [ () => this.pauseThread( '*' ) ]
    }
    if( action )
      breakpoint.actions.push( action );

    this.breakpoints.push( breakpoint );
  }
  getAllThreadInfo() {
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

    // sorting data by thread name
    resultList.sort(this._compareThreadName);

    return resultList;
  }
  getThreadStatus( nameOrId ) {
    const threadId = this.getThreadNameId( nameOrId ).id;
    let status = '';
    if( this.thread.byStatus.ready.includes( threadId ) )
      status = 'ready';
    else if( this.thread.byStatus.slow.running.includes( threadId )
            || this.thread.byStatus.fast.running.includes( threadId )
            || this.thread.byStatus.stepByStep.running.includes( threadId ) )
      status = 'running';
    else if( this.thread.byStatus.slow.suspended.includes( threadId )
            || this.thread.byStatus.fast.suspended.includes( threadId )
            || this.thread.byStatus.stepByStep.suspended.includes( threadId ) )
      status = 'suspended';
    else if( this.thread.byStatus.terminated.includes( threadId ) )
      status = 'terminated';
    return status;
  }
  getThreadSourceCode( nameOrId ) {
    const threadId =  this.getThreadNameId( nameOrId ).id;
    if( threadId != -1 ) {
      const threadContext = this.thread.byId[ threadId ];
      const threadName = threadContext.name;
      const threadCode = this._getTopLevelCode( threadContext );
      const indentStr = '';
      return this._getFormattedCodeBlock( threadName, threadCode, indentStr );
    }
    return '';
  }
  getCurrentThreadLine( nameOrId, overridePc ) {
    const threadId =  this.getThreadNameId( nameOrId ).id;
    if( threadId != -1 ) {
      const threadContext = this.thread.byId[ threadId ];
      overridePc = ( overridePc === undefined ) ? threadContext.pc : overridePc;
      return threadContext.code[ overridePc ];
    }
    return null;
  }
  getDebugMessage() {
    // TODO Discuss if this is necessary and decide how it should work
    return '';
  }
  getFormattedStatement( statement ) {
    return this._logStatement( statement );
  }

  /* -----------------------------------------------------------------
   * JSEN Private functions
   *-----------------------------------------------------------------*/
  _getThreadName( threadId ) {
    // Get thread id from name
    const name = this.thread.byId[ threadId ].name;

    // Check existance of thread
    if( !name ) {
      this._logWarning( 'Thread "'+threadId+'" not found!' );
    }

    return name;
  }
  _getTopLevelCode( threadContext ) {
    if( threadContext.callerContext != null )
      return this._getTopLevelCode( threadContext.callerContext );
    else
      return threadContext.code;
  }
  _getNewThreadContext( threadId, name, jsenCode, debugLevel, callerContext ) {
    // Just return a new context
    const threadContext = {
      id: threadId,
      name: name,
      pc: 0, // Program counter
      accumulatedPc: 0, // Accumulated program counter (for nested blocks)
      debugLevel: debugLevel, // DebugLevel, // Debug level 0,1 for now
      isDebugInfo: false,
      isLoopThread: false,
      isAtomicSequence: false,
      code: jsenCode, // JSEN code (array)
      codeSource: [],
      codeLinesMap: [],
      callerContext: callerContext, // Caller context, empty for root
      labelList: {
        threadBegin: 0,
        threadEnd: jsenCode.length,
      }, // Buffer for jsenCode labels {'labelName1':lineNumber1, ...}
    };
    return threadContext;
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
          if( Array.isArray(codeStatement ) ) {
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
    delete threadContext.codeLinesMap;
    delete threadContext.codeSource;
    delete threadContext.lineNumber;
  }
  _getAllThreadInfoFromList( listName, sublistName ) {
    let resultList = [];
    const threadIdList = ( ( sublistName ) ?
                           this.thread.byStatus[ listName ][ sublistName ]:
                           this.thread.byStatus[ listName ] );

    for( const threadId of threadIdList ) {
      const threadContext = this.thread.byId[ threadId ];
      let result = {
        id: threadContext.id,
        name: threadContext.name,
        pc: threadContext.pc,
        isDebugInfo: threadContext.isDebugInfo,
        timeStamp: new Date(),
        status: ( ( sublistName )? sublistName:  listName ),
        queue: listName,
      }
      if( threadContext.isDebugInfo ) {
        result['lineNumber'] = threadContext.lineNumber;
      }
      if( sublistName == 'suspended' ) {
        const suspendedStatement = threadContext.code[ threadContext.pc-1 ];
        const suspendOn = suspendedStatement.callName;
        result[ 'suspendedOn' ] = suspendOn;
        if( suspendOn == 'jsen_on' )  {
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
  _checkOn() {
    // List of condition evaluated as false
    const falseConditionList = [];
    // Check each registered condition
    for( const onInfo of this.conditionList ) {
      const conditionEval = onInfo.condition();
      // { 'context': jsenContext, 'condition': condition, 'timeout': timeout } );
      if( conditionEval || this._evaluateParam( onInfo.timeout, Infinity ) <= 0 ) {
        // If condition is true ==> wakeup the thread
        this.wakeupThreadId( onInfo.context.id );
        // NOTE: the jsen_on, when true, execute atomically the next statement
        // If we're in step by step mode, we wait for the explicit step
        if( !this.isStepByStep ) {
          this._step( onInfo.context );
        }
        // We store whether the condition was met, or the timout expired
        this.userVariableList[ this.wasOnConditionMetVariable ].value = conditionEval;
      } else {
        // We decrease the timeout with the interval that has already elapsed since the last evaluation
        onInfo.timeout -= this.checkOnPeriod.timeout;
        // If condition is false ==> keep it in the list
        falseConditionList.push( onInfo );
      }
    }
    // Update the list with all condition evaluated as false
    this.conditionList = falseConditionList;
  }
  _spawnRunAllFastThreads() {
    // TODO: think about this function
    // This function should make sure that if the jsen_runAllThreads()
    // is running, then the timer should not be set
    if( this.isRunAllFastThreadsRunning == false ) {
      // Call the runAllTreads out of this function
      setTimeout( ()=> this._runAllFastThreads(), 0 );
    }
  }
  _spawnRunAllSlowThreads() {
    // TODO: think about this function
    // This function should make sure that if the jsen_runAllThreads()
    // is running, then the timer should not be set
    if( this.isRunAllSlowThreadsRunning == false ) {
      // Call the runAllTreads out of this function
      setTimeout( ()=> this._runAllSlowThreads(), 0 );
    }
  }
  _runAllFastThreads( isDryRun ) {
    // We check if we want to really execute, or just give a preview
    isDryRun = (isDryRun === undefined ? false : isDryRun);
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
    isDryRun = (isDryRun === undefined ? false : isDryRun);
    // Set the flag that this function is running
    this.isRunAllSlowThreadsRunning = true;
    // Run all threads in the running list
    while( !this._isSlowRunningListEmpty() ) {
      this._stepAllSlowThreads( isDryRun );
      if( this.threadPeriod > 0 ) {
        setTimeout( ()=> this._runAllSlowThreads( isDryRun ), this.threadPeriod * 1000 );
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
    this._stepAllThreads( this.thread.byStatus.fast )
  }
  _stepAllSlowThreads( isDryRun ) {
    this._stepAllThreads( this.thread.byStatus.slow )
  }
  _stepAllStepByStepThreads( isDryRun ) {
    this._stepAllThreads( this.thread.byStatus.stepByStep )
  }
  _stepAllThreads( list, isDryRun ) {
    // Loop over all threads in the running list
    for( const threadId of list.running ) {
      // Get thread context
      const threadContext = this.thread.byId[ threadId ];
      if( !isDryRun ) {
        // Run one step for the thread
        this._step( threadContext );
      }
    }
  }
  // Called only in a step by step context
  _stepWrapper( threadNameOrId, isDryRun) {
    // We check if we want to really execute, or just give a preview
    isDryRun = (isDryRun === undefined ? false : isDryRun);
    // We explicitly "check on" because if we're in step by step mode, the check-on thread is not running
    this._checkOn();

    switch(threadNameOrId) {
      // No parameter: we step the next thread in line
      // '*' parameter: we step all running threads
      case '*':
        this._stepAllStepByStepThreads( isDryRun );
        break;
      case undefined:
        // If the target index is no longer available, we reset it to 0
        if(Number.isNaN(this.stepIndex) || this.stepIndex >= this.thread.byStatus.stepByStep.running.length) {
          this._logWarning( 'Next thread no longer available, stepping first thread in line!' );
          this.stepIndex = 0;
          // If we don't have any more threads running, we simply do nothing
          if(this.thread.byStatus.stepByStep.running.length == 0) {
            this._logWarning( 'No running threads to step!' );
            return;
          }
        }
        // Determine the next thread in line
        const threadContext = this.thread.byId[this.thread.byStatus.stepByStep.running[ this.stepIndex ]];
        threadNameOrId = threadContext.id;
        // We increment the step index, or return it to 0 if we've reached the end of the thread list
        this.stepIndex = (this.stepIndex + 1) % (this.thread.byStatus.stepByStep.running.length + this.thread.byStatus.stepByStep.suspended.length);
        // If the current thread is the checkOn thread, we skip its turn
        if( this.checkOnThreadId != -1 && threadContext.id == this.checkOnThreadId) {
          // If the checkOn thread is the only one left running, we halt execution;
          if( this.thread.byStatus.stepByStep.running.length == 1 ) {
            this._logDebugger();
          }
          else {
            this._stepWrapper();
          }
        }
      default:
        const threadData = this.getThreadNameId(threadNameOrId);
        if( threadData ) {
          // Get thread context
          const threadContext = this.thread.byId[ threadData.id ];
          // We skip the checkOn thread
          if( threadData.id == this.checkOnThreadId) {
            this._logDebugger( threadContext, 'Given thread is checkOn thread. Cannot step.')
            break;
          }
          // If the thread is not running, we should not step, even if we have a valid context and program counter
          if( !isDryRun ) {
            if( this.thread.byStatus.stepByStep.running.includes(threadData.id) ) {
              // Run one step for the thread
              this._step( threadContext );
            }
          }
          // Show next line
          this._logStatementWrapped( this.thread.byId[ threadContext.id ] );
        } else {
          this._logWarning( 'Thread not found!' );
        }
        break;
    }
  }
  _step( threadContext ) {
    if( !threadContext ) {
      return;
    }

    // Define the length of the code to be executed
    const codeLen = ( !threadContext.code ? 0: threadContext.code.length );

    // If there are still code statement to be executed ==> Run the next statement or block
    if( threadContext.pc < codeLen ) {
      // Get next statement to be executed
      const codeStatement = threadContext.code[ threadContext.pc ];

      if( this.isThreadStepByStep( threadContext.id ) ) {
        const lineIndex = threadContext.codeLinesMap.indexOf(codeStatement);
        threadContext['lineNumber'] = lineIndex+1;
        if( threadContext.debugLevel > 1 ) {
          this._log( 'JVM-Step['+threadContext.name+']('+threadContext.pc+'): '+
                     ' lineNum('+threadContext['lineNumber']+') '+
                     threadContext.codeSource[lineIndex] );
        }
      }
      // Execution result of a listatementne
      let execStatus = null;
      if( threadContext.debugLevel > 1 ) {
        // Log program counter
        this._log( 'pc: ' + threadContext.pc, threadContext );
      }

      // Execution of each statement
      switch( typeof( codeStatement ) ) {
        case 'function':  // Case of javascript code like: ()=> console.log( 'message' ),
          execStatus = this._executeCodeFunction( codeStatement, threadContext );
          break;
        case 'string': // Case of comment like: "This is a comment",
        case "undefined": // Case of comment like: ,
          break;
        case 'object':
          // If I find a code block, I treat it as a sub-context (for now, not the best way)
          if( Array.isArray( codeStatement ) ) {  // Case of block like: [ ... ],
            execStatus = this._executeCodeBlock( codeStatement, threadContext );
          } else {  // Case of jzen statement like: jsen_print( 'message' ),
            // In this case we have an assembly instruction into an object (JSON data with call and params)
            execStatus = this._executeAssembly( codeStatement, threadContext );
          }
          break;
      }

      // Move to next statement
      ++threadContext.pc;
      ++threadContext.accumulatedPc;
    } else {
      // If the current context have been executed by another context ==> restore it
      if( threadContext.callerContext != null ) {
        if( this.isThreadStepByStep( threadContext.id ) ) {
          threadContext.callerContext['lineNumber'] = threadContext.lineNumber;
        }
        // Restore caller context
        this.thread.byId[ threadContext.id ] = threadContext.callerContext;
        // Update accumulated pc
        this.thread.byId[ threadContext.id ].accumulatedPc = threadContext.accumulatedPc + 1;
      } else {
        // Otherwise the thread is terminated
        this.stopThreadId( threadContext.id );
      }
    }

    // We check all breakpoint conditions
    for( const condition of this.breakpoints) {
      if( condition.condition() ) {
        this._logDebugger( threadContext, 'Breakpoint condition \'' + condition.condition.toString() + '\' has been met. Pausing the VM and executing breakpoint actions');
        for( const action of condition.actions) {
          action();
        }
        // Once the breakpoint condition is met and the execution is paused, we clear the breakpoint
        this.breakpoints.splice( this.breakpoints.indexOf( condition ), 1 );
      }
    }
  }
  _getFormattedCodeBlock( threadName, threadCode, indentStr ) {
    let result = [];
    const indentIncrement = '  ';
    let stringLine = '';
    let isPreviousStatementAnIf = false;

    for( const codeStatement of threadCode ) {
      let codeStatementType = typeof( codeStatement );
      if( ( codeStatementType == 'object' ) && ( Array.isArray( codeStatement ) ) ) {
        codeStatementType = 'block';
      }

      stringLine = '';
      if( isPreviousStatementAnIf ) {
        if( codeStatementType != 'block' ) {
          stringLine = indentIncrement+stringLine;
        }
        isPreviousStatementAnIf = false;
      }

      Function.prototype.toJSON = function() { return this.toString(); };
      switch( codeStatementType ) {
        case 'function':
          stringLine += indentStr+codeStatement.toString();
          break;
        case 'string':
            stringLine += indentStr+'"'+codeStatement+'"';
        case 'undefined':
          break;
        case 'block':
          result.push( indentStr+'[' );
          result = result.concat( this._getFormattedCodeBlock( threadName, codeStatement, indentStr+indentIncrement ) );
          stringLine += indentStr+']';
          break;
        case 'object':
          stringLine += indentStr+codeStatement.callName+'( ';
          switch( codeStatement.callName ) {
            case 'jsen_on':
              stringLine += codeStatement.params['condition'].toString();
              stringLine += this._getParamsToString( ', ', codeStatement.params['timeout'] );
              break;
            case 'jsen_sleep':
              stringLine += this._getParamsToString( '', codeStatement.params );
              break;
            case 'jsen_if':
              isPreviousStatementAnIf = true;
            case 'jsen_print':
            case 'jsen_label':
            case 'jsen_goto':
            case 'jsen_while':
            case 'jsen_until':
            case 'jsen_switch':
            case 'jsen_case':
              stringLine += this._getParamsToString( '', codeStatement.params );
              break;
            case 'jsen_foreach':
              stringLine += this._getParamsToString( '', codeStatement.params[ 'array' ] );
              break;
            case 'jsen_get':
              stringLine += this._getParamsToString( '', codeStatement.params[ 'callback' ] );
              break;
            case 'jsen_for':
              stringLine += this._getParamsToString( '', codeStatement.params[ 'lower' ] );
              stringLine += ' to ';
              stringLine += this._getParamsToString( '', codeStatement.params[ 'upper' ] );
              break;
            }
          stringLine += ' )';
          break;
      }
      result.push( stringLine+',' );
    }
    return result;
  }
  _getParamsToString( prefix, params ) {
    let result = '';
    if( params !== undefined ) {
      switch( typeof( params ) ) {
        case 'object':
          result = prefix+JSON.stringify( params );
          break;
        case 'string':
          result = prefix+'"'+params+'"';
          break;
        default:
          result = prefix+params.toString();
          break;
      }
    }
    return result;
  }
  _logStatus() {
    // Log the thread context
    this._log( '----[ JSEN VM Thread Status ] ----------------' );
    this._log( 'threads byId: '+this.getThreadNameList( this.thread.byId.keys() ) );
    this._log( 'threads byName: '+this.thread.byName );
    this._log( 'threads byStatus: ' );
    this._log( '        ready                  : '+this.getThreadNameList( this.thread.byStatus.ready ) );
    this._log( '        fast running           : '+this.getThreadNameList( this.thread.byStatus.fast.running ) );
    this._log( '        fast suspended         : '+this.getThreadNameList( this.thread.byStatus.fast.suspended ) );
    this._log( '        slow running           : '+this.getThreadNameList( this.thread.byStatus.slow.running ) );
    this._log( '        slow suspended         : '+this.getThreadNameList( this.thread.byStatus.slow.suspended ) );
    this._log( '        step by step running   : '+this.getThreadNameList( this.thread.byStatus.stepByStep.running ) );
    this._log( '        step by step suspended : '+this.getThreadNameList( this.thread.byStatus.stepByStep.suspended ) );
    this._log( '        terminated: '+this.getThreadNameList( this.thread.byStatus.terminated ) );
    this._log( '----[ END ] ----------------------------' );
  }
  _log( message, jsenContext ) {
    // If no context, just log, otherwise use debug level
    if( !jsenContext ) {
      console.log( message );
    } else if( jsenContext.debugLevel > 0 ) {
      console.log( message );
    }
    return null; //TODO: Why do I have a return here?
  }
  _logWarning( message ) {
    // Just log for now
    console.warn( 'WARNING: '+message );
    return null; //TODO: Why do I have a return here?
  }
  _logStatementWrapped( threadContext ) {
    // We exit if there's no context
    if( threadContext === undefined ) {
      return;
    }

    // We exit if thread has no more statements, even if still running
    var codeStatementNext = threadContext.code[ threadContext.pc ];
    if( codeStatementNext === undefined ) {
      if( threadContext.callerContext !== null) {
        codeStatementNext = 'End of block';
      }
      else {
        this._logDebugger();
        return;
      }
    }

    // We should not step if the thread is currently suspended,
    // and we also show the statement blocking the thread
    if( !this.thread.byStatus.stepByStep.running.includes(threadContext.id) ) {
      console.log('Cannot perform step, thread \'' + threadContext.name + '\' is not running at the moment');
      var codeStatementPrevious = threadContext.code[threadContext.accumulatedPc - 3];
      if( typeof( codeStatementPrevious ) == 'object' ) {
        codeStatementPrevious = this._logStatement( codeStatementPrevious );
      }
      this._logDebugger( threadContext, codeStatementPrevious, threadContext.accumulatedPc - 1 );
    }

    // If we have a jsen_ function, we need to manually serialize it for printing
    if( typeof( codeStatementNext ) == 'object' ) {
      codeStatementNext = this._logStatement( codeStatementNext );
    }

    this._logDebugger( threadContext, codeStatementNext );
  }
  _logStatement( codeStatement ) {
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

      result = codeStatement.callName + '(' + paramsString + ')  ';
    }

    return result;
  }
  _logDebugger( threadContext, codeStatement, lineNr ) {
    if( codeStatement === undefined ) {
      if( threadContext !== undefined && threadContext.callerContext === null )
        console.log( 'Debugger : End of current block' );
      else
        console.log( 'Debugger : No more thread context to step through!' );
    }
    else {
      // If we have a parent context, we show the big picture line number
      var line = ( lineNr === undefined ) ? threadContext.accumulatedPc : lineNr;
      console.log( 'Debugger ' + threadContext.name + ':' + line + ' : ' + codeStatement );
    }
  }
  _getThreadIds( fromList, nameOrIdOrList ) {
    let threadList = [];
    if( nameOrIdOrList === undefined )
      return threadList;

    if( nameOrIdOrList == '*') {
      // If we have '*', we set the step by step status of all running threads as required
      for( const listName of fromList ) {
        if( Array.isArray( this.thread.byStatus[ listName ] ) ) {
          for( const id of this.thread.byStatus[ listName ] ) {
            threadList.push( id );
          }
        } else {
          for( const id of this.thread.byStatus[ listName ].running) {
            threadList.push( id );
          }
          for( const id of this.thread.byStatus[ listName ].suspended) {
            threadList.push( id );
          }
        }
      }
    }
    else {
      if( Array.isArray( nameOrIdOrList ) ) {
        // We can also have an array of ids and/or names as second param
        for( const id of nameOrIdOrList) {
          threadList.push( id );
        }
      }
      else {
        // If we have a thread specified, we set its step by step status as required
        threadList.push( nameOrIdOrList );
      }
      // We validate the ids and or names in the array of targeted threads
      for( let threadIndex in threadList ) {
        const thread = threadList[threadIndex];
        const threadData = this.getThreadNameId( thread );
        if( threadData ) {
          threadList[threadIndex] = threadData.id;
        }
      }
    }

    return threadList;
  }
  _moveThread( threadId, fromList, toList ) {
    // We add the thread to the new list
    toList.push( threadId );
    // We remove the thread from the old list
    const threadIndex = fromList.indexOf( threadId );
    if( threadIndex != -1 ) {
      fromList.splice( threadIndex, 1 );
    }
  }
  _evaluateParam( param, defaultParam ) {
    let result;
    switch( typeof( param ) ) {
      case 'function':
        result = param();
        break;
      case 'object':
        result = param.value;
        break;
      case 'undefined':
        result = defaultParam;
        break;
      default:
        result = param;
    }

    return result;
  }
  _get( variableName ) {
    return this.userVariableList[ variableName ].value;
  }
  _set( variableName, value ) {
    this.userVariableList[ variableName ] = { value: value };
  }
  _compareThreadName( a, b ) {
    // Use toUpperCase() to ignore character casing
    const nameA = a.name.toUpperCase();
    const nameB = b.name.toUpperCase();

    let comparison = ( nameA < nameB ) ?
      -1 :
      ( ( nameA > nameB ) ? 1 : 0 );

    return comparison;
  }
    /* -----------------------------------------------------------------
  * JSEN Firmware functions
  *-----------------------------------------------------------------*/
  _executeCodeFunction( codeStatement, threadContext ) {
    // Execute the line as function
    return codeStatement();
  }
  _executeCodeBlock( codeStatement, threadContext ) {
    // Create a new thread context
    const subThreadContext = this._getNewThreadContext( threadContext.id,
                                                        threadContext.name,
                                                        codeStatement,
                                                        threadContext.debugLevel,
                                                        threadContext );
    if( this.isThreadStepByStep( threadContext.id ) ) {
      const lineIndex = threadContext.codeLinesMap.indexOf(codeStatement);
      subThreadContext['isDebugInfo'] = threadContext.isDebugInfo;
      subThreadContext['codeLinesMap'] = threadContext.codeLinesMap;
      subThreadContext['codeSource'] = threadContext.codeSource;
      subThreadContext['lineNumber'] = lineIndex+1;
    }
    // Replace current thread context with sub-context
    this.thread.byId[ threadContext.id ] = subThreadContext;
    // We use the accumulated pc in the caller context to note our overall place in the full code
    // this.thread.byId[ threadContext.id ].accumulatedPc = ++threadContext.accumulatedPc;
    return null;
  }
  _executeAssembly( codeStatement, threadContext ) {
    // Extract codeStatement fields
    const callName = codeStatement.callName;
    const params = codeStatement.params;

    // Call assembler function
    this.asmFuncMap[callName]( threadContext, params );
  }
  _setupAsmFuncMap() {
    this.asmFuncMap = {
      "jsen_on": this.asmOn.bind(this),
      "jsen_sleep": this.asmSleep.bind(this),
      "jsen_print": this.asmPrint.bind(this),
      "jsen_if": this.asmIf.bind(this),
      "jsen_else": this.asmElse.bind(this),
      "jsen_label": this.asmLabel.bind(this),
      "jsen_goto": this.asmGoto.bind(this),
      "jsen_loop": this.asmLoop.bind(this),
      "jsen_break": this.asmBreak.bind(this),
      "jsen_continue": this.asmContinue.bind(this),
      "jsen_while": this.asmWhile.bind(this),
      "jsen_for": this.asmFor.bind(this),
      "jsen_foreach": this.asmForeach.bind(this),
      "jsen_get": this.asmGet.bind(this),
      "jsen_set": this.asmSet.bind(this),
      "jsen_until": this.asmUntil.bind(this),
      "jsen_switch": this.asmSwitch.bind(this),
      "jsen_case": this.asmCase.bind(this),
      "jsen_forceCheckOn": this.asmForceCheckOn.bind(this),
    }
  }
/* -----------------------------------------------------------------
  * JSEN Assembler functions
  *-----------------------------------------------------------------*/
  // On: register a guard condition that suspend the thread if not satisfied
  asmOn( threadContext, params ) {
    // Get the condition
    const condition = params.condition;
    const conditionEval = params.condition();
    const timeout = params.timeout;
    let timeoutEval = this._evaluateParam( timeout, Infinity );

    // If the condition is not met and the timeout hasn't expired yet ==> suspend the thread
    if( !conditionEval && timeoutEval > 0) {
      // Suspend the thread
      this.suspendThreadId( threadContext.id );
      this._log( threadContext, 'suspending at: '+threadContext.pc );

      // Store condition information
      const conditionInfo = {
        context: threadContext,
        condition: condition,
        timeout: timeout,
      };
      // Add the condition in the condition list
      this.conditionList.push( conditionInfo );
    } else {
      // NOTE: the jsen_on, when true, execute atomically the next statement
      ++threadContext.pc;
      this._step( threadContext );
      --threadContext.pc;
      // Store whether the condition was met, or the timeout expired
      this.userVariableList[ this.wasOnConditionMetVariable ].value = conditionEval;
    }
    return null;
  }
  // Sleep: suspend the thread for a specific timeout
  asmSleep( threadContext, params ) {
    let timeoutEval = this._evaluateParam( params, Infinity );

    // Suspend the thread
    this.suspendThreadId( threadContext.id );
    this._log( threadContext, 'suspending at: '+threadContext.pc );

    // Register the wakeup function
    setTimeout( ()=> this.wakeupThreadId( threadContext.id ), timeoutEval*1000 );

    return null;
  }
  // Print: print to console function
  asmPrint( threadContext, params ) {
    const threadName = ( threadContext === 'undefined'? '': '['+threadContext.name+']: ' );
    const result = ( typeof( params ) == 'function' )? params(): params;
    // Print the params value
    console.log( threadName + result );

    return null;
  }
  // If: conditional statement
  asmIf( threadContext, params ) {
    // Get the condition
    const condition = params;
    const conditionEval = ( typeof( condition ) == 'function' )?
      condition():
      condition;

    if( threadContext !== undefined ) {
      let statementAfterThen = threadContext.code[ threadContext.pc + 2 ];
      if( statementAfterThen !== undefined && statementAfterThen.callName === "jsen_else" ) {
        statementAfterThen.params = conditionEval;
      }
    }

    if( !conditionEval ) {
      ++threadContext.pc; // skip the next statement
    }

    return null;
  }
  // Else: else statement
  asmElse( threadContext, ifResult ) {
    if( ifResult ) { // if we've already executed the 'then'
      ++threadContext.pc; // skip the next statement
    }

    return null;
  }
  // Label: registration of new label
  asmLabel( threadContext, params ) {
    // Get label
    const label = params;
    // Associate the label name to the next statement
    //TODO: if label not found I have to do something
    threadContext.labelList[ label ] = threadContext.pc+1;

    return null;
  }
  // Goto: goto satement
  asmGoto( threadContext, params ) {
    // Get label
    const label = params;
    // Jump to pc associated to label
    //-------------------------------------------------------
    // NOTE: I have to decrement the pc of 1 since there is
    //       an auto increment of pc in the _stepThread()
    //-------------------------------------------------------
    threadContext.pc = threadContext.labelList[ label ]-1;

    return null;
  }
  // Loop: basic loop statement
  asmLoop( threadContext, params ) {
    const loopContent = threadContext.code[ threadContext.pc + 1 ];
    // We only allow block content
    if( !Array.isArray( loopContent ) || loopContent.length <= 1 ) {
      this._logWarning('Cannot perform basic loops over non-block statements or blocks with less than two statements')
      return null;
    }

    params = true;
    this.asmWhile( threadContext, params );
    return null;
  }
  // Break: break from loop statement
  asmBreak( threadContext, params ) {
    if( threadContext.callerContext ) {
      // If we have a caller context, we switch to it and skip the block we were previously in
      this.asmGoto( threadContext, 'endThread' );
      threadContext = threadContext.callerContext;
      threadContext.pc += 2;
    } else {
      // If there is no caller context, we end the thread
      this.asmGoto( threadContext, 'endThread' );
    }
    return null;
  }
  // Continue: continue loop statement or go to start of block
  asmContinue( threadContext, params ) {
    // If we have a caller context, we switch to it and skip the block we were previously in
    this.asmGoto( threadContext, 'threadBegin' );
    return null;
  }
    // While: conditional loop statement (while)
  asmWhile( threadContext, params ) {
    // Get the condition
    const condition = params;
    const evalCondition = ( typeof( condition ) == 'function' )?
      condition(): condition;

    if( !evalCondition ) { // If condition is false
      ++threadContext.pc; // skip the next statement, which is a block
    } else {
      ++threadContext.pc;
      this._step( threadContext );
      // move pc back to while condition, to be evaluated again;
      // 3 times: statement after block, beginning of block, beginning of while
      threadContext.pc -= 3;
    }

    return null;
  }
  // Foreach: foreach loop statement
  asmForeach( threadContext, params ) {
    const iterator = params.iterator;
    const array = params.array;

    if( this.userVariableList[ iterator ] === undefined ) {
      this.userVariableList[ iterator ] = {
        array: array,
        value: 0,
      }
    } else {
      ++this.userVariableList[ iterator ].value;
    }

    // If we've reached the end of the array
    if( this.userVariableList[ iterator ].value >= this.userVariableList[ iterator ].array.length ) {
      delete this.userVariableList[ iterator ]; // we clear the iterator
      ++threadContext.pc; // skip the next statement, which is a block
    } else {
      ++threadContext.pc;
      this._step( threadContext );
      // move pc back to foreach condition, to be evaluated again;
      // 3 times: statement after block, beginning of block, beginning of foreach
      threadContext.pc -= 3;
    }
    return null;
  }
  // For: for loop statement
  asmFor( threadContext, params ) {
    const iterator = params.iterator;
    const lower = params.lower;
    const upper = params.upper;
    const increment = params.increment;
    if( this.userVariableList[ iterator ] === undefined ) {
      this.userVariableList[ iterator ] = {
        lower: lower,
        upper: upper,
        value: lower,
        increment: increment,
      }
    } else {
      this.userVariableList[ iterator ].value += this.userVariableList[ iterator ].increment;
    }
    // If we've surpassed the upper limit
    if( this.userVariableList[ iterator ].value > this.userVariableList[ iterator ].upper ) {
      delete this.userVariableList[ iterator ]; // we clear the iterator
      ++threadContext.pc; // skip the next statement, which is a block
    } else {
      ++threadContext.pc;
      this._step( threadContext );
      // move pc back to for condition, to be evaluated again;
      // 3 times: statement after block, beginning of block, beginning of for
      threadContext.pc -= 3;
    }

    return null;
  }
  // Get: outputs the value of a user variable
  asmGet( threadContext, params ) {
    const variable = this.userVariableList[ params.variable ];
    params.callback( variable );

    return null;
  }
  // Set: sets the value of a user variable
  asmSet( threadContext, params ) {
    this.userVariableList[ params.variable ] = params.value;

    return null;
  }
  // Repeat until: conditional loop statement (repeat - until)
  asmUntil( threadContext, params ) {
    // Get the condition
    const condition = params;
    const conditionEval = ( typeof( condition ) == 'function' )?
      condition():
      condition;

    if( !conditionEval ) {
      threadContext.pc -= 2; // re-execute the previous block or statement
    }

    return null;
  }
  // Switch: switch conditional statement
  asmSwitch( threadContext, params ) {
    this.userVariableList[ this.switchStackVariable ].value.push( params );
  }
  // Case: case statement for a previous switch;
  asmCase( threadContext, params ) {
    const valueEval = this._evaluateParam( params );
    const switchStack = this._get( this.switchStackVariable );
    const variableEval = this._evaluateParam( switchStack[ switchStack.length - 1 ] );

    // If this is the last case block, we pop the switch condition from the switch stack
    const statementAfterCase = threadContext.code[ threadContext.pc + 2 ];
    if( statementAfterCase === undefined || 
      ( statementAfterCase !== undefined && statementAfterCase.callName !== 'jsen_case' ) ) {
      switchStack.pop();
    }

    if( valueEval !== variableEval )
      ++threadContext.pc;
  }
  // forceCheckOn: force the execution of checkOn conditions
  asmForceCheckOn() {
    this._checkOn();
  }
  // This is only to be called by users; internally, _get should be used
  get( variableName ) {
    return this._get( '$' + variableName );
  }
  // This is only to be called by users; internally, _set should be used
  set( variableName, value ) {
    const prefixedVariableName = '$' + variableName;
    this._set( prefixedVariableName, value );
  }
}
/* -----------------------------------------------------------------
 * JSEN Statements
 *-----------------------------------------------------------------*/
function jsen_on( condition, timeout ) {
  return {
    callName: "jsen_on",
    params: {
      condition: condition,
      timeout: timeout,
    },
  };
}
// Function to define a sleep interval between jsen calls
// @params it can be a number (float number of seconds) or a class (with field timeout as float number of seconds)
function jsen_sleep( params ) {
  return {
    //TODO: find a better way to have the indirect parameter by class.field
    callName: "jsen_sleep",
    params: params,
  };
}
// Function to log a message in jsen calls
function jsen_print( msg ) {
  return {
    callName: "jsen_print",
    params: msg,
  };
}
// Function to implement if statement in jsen calls
function jsen_if( condition ) {
  return {
    callName: "jsen_if",
    params: condition,
  };
}
// Function to implement else statement in jsen calls
function jsen_else( ifResult ) {
  return {
    callName: "jsen_else",
    params: ifResult,
  }
}
// Function to implement a label in jsen code
function jsen_label( labelName ) {
  // TODO: fill now the label list of the context (so, all label will be available at run time)
  return {
    callName: "jsen_label",
    params: labelName,
  };
}
// Function to log a message in jsen calls
//TODO: limitations, currently goto can only jump backwards and it can not cross JSEN blocks
function jsen_goto( labelName ) {
  return {
    callName: "jsen_goto",
    params: labelName,
  };
}
// Function to implement a simple loop over the following block, until break is called
function jsen_loop() {
  return {
    callName: "jsen_loop",
  };
}
// Function to break from the currently running block or loop
function jsen_break() {
  return {
    callName: "jsen_break",
  }
}
// Function to go to beginning of the currently running block or loop
function jsen_continue() {
  return {
    callName: "jsen_continue",
  }
}
// Function to implement a while loop over the following block
function jsen_while( condition ) {
  return {
    callName: "jsen_while",
    params: condition,
  };
}
// Function to implement a for loop between the two limit values (inclusively)
function jsen_for( iterator, lower, upper, increment ) {
  return {
    callName: "jsen_for",
    params: {
      iterator: iterator,
      lower: ( upper? lower: 0 ),
      upper: ( upper? upper: lower ),
      increment: ( increment? increment: ( lower < upper? 1: -1 ) ),
    },
  };
}
// Function to implement a foreach loop over the following block
function jsen_foreach( iterator, array ) {
  return {
    callName: "jsen_foreach",
    params: {
      iterator: iterator,
      array: array,
    },
  };
}
// Function to get the value of a user variable
function jsen_get( variable, callback ) {
  return {
    callName: "jsen_get",
    params: {
      variable: variable,
      callback: callback,
    },
  };
}
// Function to set the value of a user variable
function jsen_set( variable, value ) {
  return {
    callName: "jsen_set",
    params: {
      variable: variable,
      value: value,
    },
  };
}
// Function to implement a repeat - until loop over the previous statement/block
function jsen_until( condition ) {
  return {
    callName: "jsen_until",
    params: condition,
  }
}
// Function to implement a switch
function jsen_switch( value ) {
  return {
    callName: "jsen_switch",
    params: value,
  }
}
// Function to add a case to a previous switch
function jsen_case( value ) {
  return {
    callName: "jsen_case",
    params: value,
  }
}
// Function to force the execution of checkOn conditions
function jsen_forceCheckOn() {
  return {
    callName: "jsen_forceCheckOn",
    params: 0,
  };
}

/**
 * JZENVM Example usage
 *-/

const code = [
  ()=> console.log( 'Start' ),
  jsen_if( ()=> 10 > 1 ),
    ()=> console.log( 'condition true' ),
  ()=> console.log( 'line...' ),
  jsen_sleep( 1 ),
  ()=> console.log( 'End' ),
];

const maxIteration = 100*1000;
const code1 = [
  ()=> console.time( 'codeJSEN' ),
  ()=> console.log( 'JSEN Start' ),
  jsen_for( 'i', 0, maxIteration ),
    ()=> console.log( 'iteration' ),
  ()=> console.log( 'JSEN End' ),
  ()=> console.timeEnd( 'codeJSEN' ),
];

const jvm = new JSENVM();
const threadId = jvm.newThread( 'code1', code1 );

jvm.startThread( threadId );

console.time( 'codeJS' );
console.log( 'JS Start' );
for( let i = 0; i < maxIteration; ++i ) {
  console.log( 'iteration' );
}
console.log( 'JS End' );
console.timeEnd( 'codeJS' );

/-* Output
[Log] JS Start
[Log] iteration
[Log] JS End
[Debug] codeJS: 1720.008ms
[Log] JSEN Start
[Log] iteration
[Log] JSEN End
[Debug] codeJSEN: 2847.404ms
*-/

 /-*
 */

console.log( 'JSENVM ready' );