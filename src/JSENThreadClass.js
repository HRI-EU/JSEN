/*
 *  Class for modeling JSEN Active-Objects
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

class JSENThreadClass {
  constructor( instanceName ) {
    instanceName = ( instanceName? instanceName: 'NoName' );
    this.instanceName = instanceName;

    if( !JSENThreadClass.jvm ) {
      JSENThreadClass.jvm = JSENVM.getSingleton();
    }

    // // TODO: move this signalNameList table to JSENVM
    // this.signalNameList = {};

    this.logLevel = 0;
  }
  start() {
    if( this.threadList ) {
      this._startAll( this.threadList );
    } else {
      console.log( 'Warning: could not find threadList attribute' );
    }
  }
  stop() {
    if( this.threadList ) {
      this._stopAll( this.threadList );
    } else {
      console.log( 'Warning: could not find threadList attribute' );
    }
  }
  setLogLevel( level ) {
    this.logLevel = level;
  }
  /* -----------------------------------------------------------------
   * Private functions
   *-----------------------------------------------------------------*/
  _log( level, message ) {
    if( this.logLevel >= level ) {
      console.log( '['+this.instanceName+']: '+message );
    }
  }
  _startAll( threadList, threadName, period, isStepByStep ) {
    if( ( threadList ) && ( typeof( threadList ) === 'object' ) ) {
      // If the thread is a JSEN thread
      if( Array.isArray( threadList ) ) {
        // Add class instance name with thread name
        const jsenThreadName = this.instanceName+'.'+threadName;
        // Check if thread already exists
        if( JSENThreadClass.jvm.isThreadExist( jsenThreadName ) ) {
          JSENThreadClass.jvm.renewThread( jsenThreadName );
          JSENThreadClass.jvm.startThread( jsenThreadName );
        } else {
          // If the thread do not exists, create and start it
          this._startThread( threadList, jsenThreadName, period, isStepByStep );
        }
      } else {
        // It is a group or an array ==> traverse it
        for( const threadName in threadList ) {
          const thread = threadList[threadName];
          if( typeof( thread ) === 'object' ) {
            // Check if the thread is enabled (default: true)
            if( threadList[threadName+'_isEnabled'] === false ) {
              console.log( '-[ Skip: '+threadName+' ]-----------------');
              continue;
            }
            const isStepByStep = ( threadList[threadName+'_isStepByStep'] === true );
            // Chekc if thread has a period
            var period = 1;
            if( threadList[threadName+'_period'] ) {
              period = threadList[threadName+'_period'];
            }
            // Start the thread
            this._startAll( thread, threadName, period, isStepByStep );
          }
        }
      }
    }
  }
  _startThread( code, name, period, isStepByStep ) {
    // Set threadName (if undefined -> use id)
    name = (name? name: JSENThreadClass.jvm.getNextThreadId());
    // Log starting thread
    console.log( '+[ Start: '+name+' ]+++++++++++++++++' );
    // Create a new thread
    const threadId = JSENThreadClass.jvm.newThread( name, code );
    this.threadsCreated = true;

    if( name.endsWith( 'Loop') ) {
      // Start thejsen thread
      JSENThreadClass.jvm.startLoopThread( threadId );
    } else if( name.endsWith( 'Periodic') ) {
      JSENThreadClass.jvm.startPeriodicThread( threadId, period );
    } else {
      JSENThreadClass.jvm.startThread( threadId );
    }
    if( isStepByStep ) {
      // If thread should run on step by step
      JSENThreadClass.jvm.pauseThread( threadId );
    }
  }
  _stopAll() {
    for( const threadName in this.threadList ) {
      const thread = this.threadList[threadName];
      if( typeof( thread ) === 'object' ) {
        const jsenThreadName = this.instanceName+'.'+threadName;
        JSENThreadClass.jvm.stopThread( jsenThreadName );
      }
    }
  }
}
JSENThreadClass.jvm = null;
