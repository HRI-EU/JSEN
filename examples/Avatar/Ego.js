/*
 *  Real project example: Controller for Avatar, BehaviorMachine and Miron
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

class Ego extends JSENThreadClass {
  constructor( name, avatar, debugLevel ) {
    super( name+'Ego' );

    if( debugLevel !== undefined ) {
      this.setLogLevel( debugLevel );
    }

    this.bm = new BehaviorMachine( name, this.logLevel );
    this.avatar = avatar;
    this.bm.onSerialAction( this._doSerialAction.bind(this) );
    this.bm.onParallelAction( this._doParallelAction.bind(this) );
    this.bm.onInternalAction( this._doInternalAction.bind(this) );
    this.serialActionCallback = null;
    this.parallelActionCallback = null;
    this.internalActionCallback = null;
    // We inhibit action for umans, since action are button/speech triggered
    this.inhibitActions = (avatar instanceof Human);

    this.flag ={
      isSomethingToDo: false,
      isSomethingDone: false,
      isSomethingRecognized: false,
      // Control execution of threads: toDoLoop, doneLoop, recognizedLoop
      isPerceptionAllowed: false,
      isActionAllowed: false,
      // Thread running status
      isTodoLoopRunning: false,
      isDoneLoopRunning: false,
      isRecognizedLoopRunning: false,
      // Internal Actions Flags
      isListeningRequired: false,
    };
    this.cmd = {
      // --- TODO ---
        // Avatar Control
        isSpeechToDo: null,
        isMotionToDo: null,
        isEmotionToDo: null,
        isGazeToDo: null,
        isShowingFaceToDo: null,
        // Button Control
        isDisplayButtonToDo: null,
        isButtonClickToDo: null,
        // Screen Control
        isDisplaySlideToDo: null,
      // --- DONE ---
        // Avatar Control
        isSpeechDone: null,
        isMotionDone: null,
        isEmotionDone: null,
        isGazeDone: null,
        isShowingFaceDone: null,
        // Button Control
        isDisplayButtonDone: null,
        isButtonClickDone: null,
        // Screen Control
        isDisplaySlideDone: null,
      // --- RECOGNIZED ---
        // Avatar Control
        isSpeechRecognized: null,
        isMotionRecognized: null,
        isEmotionRecognized: null,
        isGazeRecognized: null,
        isShowingFaceRecognized: null,
        // Button Control
        isDisplayButtonRecognized: null,
        isButtonClickRecognized: null,
        // Screen Control
        isDisplaySlideRecognized: null,
    }
    /*
    this.isShowExpectations = false;
    this.expectationButton = null;
    this.expectationButtonList = [];

    this.isShowGoals = false;
    this.isGoalShown = false;
    this.goalButton = null;
    this.goalButtonList = [];

    this.sentenceToSay = null;
    this.isListenRequiredT = false;
    this.isSomethingHeardT = false;
    this.mironHeard = '';
    */
    this.threadList = {
      toDoLoop_isEnabled: false,
      toDoLoop_isStepByStep: true,
      toDoLoop: [
        ()=> this.flag.isTodoLoopRunning = false,
        //jsen_on( ()=> this.isSomethingToDo() ),
        jsen_if( ()=> this.isSomethingToDo() ),
        [
          ()=> this.flag.isTodoLoopRunning = true,
          [ "Avatar Control",
            jsen_if( ()=> this.cmd.isSpeechToDo ),
            [
              ()=> this._saySentence( true ),
            ],
            jsen_if( ()=> this.cmd.isMotionToDo ),
            [

            ],
            jsen_if( ()=> this.cmd.isEmotionToDo ),
            [

            ],
            jsen_if( ()=> this.cmd.isGazeToDo ),
            [

            ],
            jsen_if( ()=> this.cmd.isShowingFaceToDo ),
            [

            ],
          ],
          [ "Button Control",
            jsen_if( ()=> this.cmd.isDisplayButtonToDo ),
            [
            ],
            jsen_if( ()=> this.cmd.isButtonClickToDo ),
            [

            ],
          ],
          [ "Screen Control",
            jsen_if( ()=> this.cmd.isDisplaySlideToDo ),
            [

            ],
          ],
        ],
      ],
      doneLoop_isEnabled: false,
      doneLoop_isStepByStep: true,
      doneLoop: [
        ()=> this.flag.isDoneLoopRunning = false,
        //jsen_on( ()=> this.isSomethingDone() ),
        jsen_if( ()=> this.isSomethingDone() ),
        [
          ()=> this.flag.isDoneLoopRunning = true,
          [ "Avatar Control",
            jsen_if( ()=> this.cmd.isSpeechDone ),
            [
              ()=> this.bm.doSerialActionDone( this.cmd.isSpeechDone.mironName,
                                              this.cmd.isSpeechDone.mironType,
                                              1 ),
              ()=> this.cmd.isSpeechDone = null,
            ],
            jsen_if( ()=> this.cmd.isMotionDone ),
            [

            ],
            jsen_if( ()=> this.cmd.isEmotionDone ),
            [

            ],
            jsen_if( ()=> this.cmd.isGazeDone ),
            [

            ],
            jsen_if( ()=> this.cmd.isShowingFaceDone ),
            [

            ],
          ],
          [ "Button Control",
            jsen_if( ()=> this.cmd.isDisplayButtonDone ),
            [

            ],
            jsen_if( ()=> this.cmd.isButtonClickDone ),
            [

            ],
          ],
          [ "Screen Control",
            jsen_if( ()=> this.cmd.isDisplaySlideDone ),
            [

            ],
          ],
        ],
      ],
      recognizedLoop_isEnabled: true,
      recognizedLoop_isStepByStep: true,
      recognizedLoop: [
        ()=> this.flag.isRecognizedLoopRunning = false,
        jsen_on( ()=> this.isSomethingRecognized() && this.flag.isPerceptionAllowed ),
        ()=> this.flag.isRecognizedLoopRunning = true,
        [ "Avatar Control",
          jsen_if( ()=> this.cmd.isSpeechRecognized ),
          [
            ()=> this._recognizeSentence(),
          ],
          jsen_if( ()=> this.cmd.isMotionRecognized ),
          [

          ],
          jsen_if( ()=> this.cmd.isEmotionRecognized ),
          [

          ],
          jsen_if( ()=> this.cmd.isGazeRecognized ),
          [

          ],
          jsen_if( ()=> this.cmd.isShowingFaceRecognized ),
          [

          ],
        ],
        [ "Button Control",
          jsen_if( ()=> this.cmd.isDisplayButtonRecognized ),
          [

          ],
          jsen_if( ()=> this.cmd.isButtonClickRecognized ),
          [

          ],
        ],
        [ "Screen Control",
          jsen_if( ()=> this.cmd.isDisplaySlideRecognized ),
          [

          ],
        ],
      ],
    }
    this.threadList['mainLoop_isEnabled'] = true;
    //mainLoop_isEnabled: true,
    this.threadList['mainLoop_isStepByStep'] = true;
    //  mainLoop_isStepByStep: true,
    this.threadList['mainLoop'] = [
      //mainLoop: [
        jsen_on( ()=> this.bm.isRunOneStepDone() ),
        [
          jsen_print( 'Ego - New Iteration' ),
          //jsen_if( ()=> this.flag.isListeningRequired ),
          //[
          //  jsen_on( ()=> this.isSomethingRecognized() ),
          //  ()=> this.flag.isListeningRequired = false,
          //],
          //jsen_print( 'Ego - Allow Perception' ),
          //()=> this.flag.isPerceptionAllowed = true,
          //jsen_forceCheckOn(),
          //jsen_on( ()=> ( !this.flag.isDoneLoopRunning ) &&
          //              ( !this.flag.isRecognizedLoopRunning ) ),
          jsen_forceCheckOn(),
          jsen_on( ()=> ( !this.flag.isTodoLoopRunning ) &&
                        ( !this.flag.isDoneLoopRunning ) &&
                        ( !this.flag.isRecognizedLoopRunning ||
                          !this.flag.isListeningRequired ) ),
          ()=> this.flag.isListeningRequired = false,
          jsen_print( 'Ego - Make New Step' ),
          ()=> this.bm.runOneStep(),
          this.threadList.toDoLoop,
          this.threadList.doneLoop,
          jsen_if( ()=> this.flag.isListeningRequired ),
          [
            ()=> this.flag.isPerceptionAllowed = true,
            jsen_forceCheckOn(),
            jsen_on( ()=> this.isSomethingRecognized() ),
            ()=> this.flag.isListeningRequired = false,
          ],
          //jsen_print( 'Ego - Allow Action' ),
          //()=> this.flag.isActionAllowed = true,
          //jsen_forceCheckOn(),
          //jsen_on( ()=> !this.flag.isTodoLoopRunning ),
        ],
      ];
  }
  setup( rules ) {
    // Loading of Behavioural Model
    this.bm.addMironRefList( rules.mironRefList );
    this.bm.addRuleList( rules.ruleList );
    this.bm['knowledge'] = rules.knowledge;
  }
  start() {
    super.start();
    this.bm.start();
  }
  stop() {
    this.bm.stop();
    super.stop();
  }
  setRole( role ) {
    switch( role ) {
      case 'receptionist':
        this.bm.setWMSelf( 'isReceptionist', 1 );
        this.bm.setWMSelf( 'isVisitor', -1 );
        this.bm.setWMOther( 'isVisitor', 1 );
        this.bm.setWMOther( 'isReceptionist', -1 );
        this.bm.setWMSelf( 'isInit', 1 );
        this.bm.setWMOther( 'isInit', 1 );
        break;
      case 'visitor':
        this.bm.setWMSelf( 'isVisitor', 1 );
        this.bm.setWMSelf( 'isReceptionist', -1 );
        this.bm.setWMOther( 'isReceptionist', 1 );
        this.bm.setWMOther( 'isVisitor', -1 );
        this.bm.setWMSelf( 'isInit', 1 );
        this.bm.setWMOther( 'isInit', 1 );
        break;
    }
  }
  isSomethingToDo() {
    const result = this.flag.isSomethingToDo;
    if( this.flag.isSomethingToDo ) {
      this.flag.isSomethingToDo = false;
    }
    return result;
  }
  isSomethingDone() {
    const result = this.flag.isSomethingDone;
    if( this.flag.isSomethingDone ) {
      this.flag.isSomethingDone = false;
    }
    return result;
  }
  isSomethingRecognized() {
    if( this.avatar.isSomethingHeard() ) {
      this.cmd.isSpeechRecognized = true;
    }
    this.flag.isSomethingRecognized = this.cmd.isSpeechRecognized ||
                                      this.cmd.isMotionRecognized ||
                                      this.cmd.isEmotionRecognized ||
                                      this.cmd.isGazeRecognized ||
                                      this.cmd.isShowingFaceRecognized ||
                                      this.cmd.isDisplaySlideRecognized;

    const result = this.flag.isSomethingRecognized;
    if( this.flag.isSomethingRecognized ) {
      this.flag.isSomethingRecognized = false;
    }
    return result;
  }
  /*
  showExpectations( status ) {
    this.isShowExpectations = status;
    if( status ) {
      if( this.expectationButton == null ) {
        // green button #82e0aa red #f1948a
        this.expectationButton = $L().newInstanceOf( UserInput );
      }
    } else {
      this.expectationButton = null;
    }
  }
  showGoal( status ) {
    this.isShowGoals = status;
    if( status ) {
      if( this.goalButton == null ) {
        // green button #82e0aa red #f1948a
        this.goalButton = $L().newInstanceOf( UserInput );
      }
    } else {
      this.goalButton = null;
    }
  }
  isListenRequired() {
    this.isSomethingHeardT = false;
    return this.isListenRequiredT;
  }
  isSomethingHeard() {
    this.isListenRequiredT = false;
    return( ( this.isSomethingHeardT ) || ( this.avatar.isSomethingHeard() ) );
  }
  getSomethingHeard() {
    // This is the case we ear from another avatar from the world
    if( this.avatar.isSomethingHeard() ) {
      let text = '';
      const heardTextInfo = this.avatar.getEar();
      for( const speakerName of Object.keys( heardTextInfo ) ) {
        text = heardTextInfo[speakerName].sentence;
        break;
      }
      this.mironHeard = this._recognizeSentence( text );
      this.avatar.cleanEar();
      this.isSomethingHeardT = false;
    }
    // Otherwise we will have heard something from a button
    return this.mironHeard;
  }
  isSentenceToSayAvailable() {
    return( this.sentenceToSay != null );
  }
  getSentenceToSay() {
    return( this.sentenceToSay );
  }
  clearSentenceToSay() {
    this.sentenceToSay = null;
  }
  showExpectationButtons() {
    if( ( this.isShowExpectations ) && ( this.expectationButtonList.length > 0 ) ) {
      this.expectationButton.setOptions( { position: 'left', options: this.expectationButtonList, callbackFct: this._buttonExpactationCallback.bind(this) } );
    }
  }
  showGoalButtons() {
    this.isGoalShown = ( this.isShowGoals ) && ( this.goalButtonList.length > 0 );
    if( this.isGoalShown ) {
      this.goalButton.setOptions( { position: 'right', options: this.goalButtonList, callbackFct: this._buttonGoalCallback.bind(this) } );
    }
  }
  runOneStep() {
    this.bm.runOneStep();
  }
  */
  ///////////////////////////////////
  // Communication Functions
  ///////////////////////////////////
  onSerialAction( callback ) {
    this.serialActionCallback = callback;
  }
  onParallelAction( callback ) {
    this.parallelActionCallback = callback;
  }
  onInternalAction( callback ) {
    this.internalCallback = callback;
  }
  /*
  doPerceive( type, name, activity ) {
    //TODO transform the perception from sentence to miron
    switch( type ) {
      case 'miron':
        this.bm.doPerceive( name, activity );
        break;
      case 'speech':
        //TODO: move the ams global into Ego as an instance
        ams.recognizeMiron( type, name );
        //...
        this.bm.doPerceive( '...', activity );
    }
  }
  */
  ///////////////////////////////////
  // Private Functions
  ///////////////////////////////////

  _saySentence( isSubtitleVisible ) {
    const subtitle = ( isSubtitleVisible? this.cmd.isSpeechToDo.sentence: '' );
    this.cmd.isSpeechDone = false;

    this.avatar.saySentence( { targetSentence: this.cmd.isSpeechToDo.sentence,
      //TODO: check with Andrei if it is ok to access params in this way :-)
      voice: (this.avatar.params.voice? this.avatar.params.voice: 'lisa22k'),
      subtitles: subtitle,
      callbackFct: ( avatar, elapsedTime, progress )=>{
          //$L().log( 'EgoA-SAY progress: '+ progress);
          if( progress >= 99 ) {
            this.cmd.isSpeechDone = this.cmd.isSpeechToDo;
            this.cmd.isSpeechToDo = null;
            this.flag.isSomethingDone = true;
            $L().log( 'EgoA-SAY progress: '+ progress);
          }
        }
      }
    );
  }
  _setListenRequired() {
    this.isListenRequiredT = true;
  }
  _doSerialAction( mironName, mironType, activity ) {
    this._log( 3, 'call Ego.doSerialAction()');
    if( !this.inhibitActions ) {
      if( ams.existMiron( mironName ) ) {
        const mironAct = ams.generateMiron( mironType, mironName, {}, 0 );
        switch( mironType ) {
          case 'speech':
            this._log( 1, 'SAY: '+mironAct.sentence );
            this.cmd.isSpeechToDo = {
              sentence: mironAct.sentence,
              mironName: mironName,
              mironType: mironType,
            }
            this.flag.isSomethingToDo = true;
            break;
          case 'click':
              this._log( 1, 'CLICK: '+mironAct.sentence );
              this.cmd.isButtonClickToDo = mironAct.sentence;
              this.flag.isSomethingToDo = true;
            break;
        }
      }
      if( this.serialActionCallback != null ) {
        const type = 'miron';
        //TODO transform the action from sentence to miron
        this.serialActionCallback( type, mironName, activity );
      }
    }
  }
  _doParallelAction( mironName, mironType, activity ) {
    this._log( 3, 'call Ego.doParallelAction()');
  }
  _doInternalAction( mironName, mironType, activity ) {
    this._log( 3, 'call Ego.doInternalAction()');
    if( mironName == 'listen' ) {
      this.flag.isListeningRequired = true;
    }
  }
  _showExpectation() {
    if( this.isShowExpectations ) {
      //TODO: hide previous buttons
      const expectationList = this.bm.getExpectationList();
      this.expectationButtonList = [];
      for( const mironName of expectationList ) {
        switch( mironName ) {
          case 'answerName':
            for( const name of this.knowledge.visitorList ) {
              const result = ams.generateMiron( 'speech', mironName, { 'title': 'Mr.', 'name': name }, 0 );
              const buttonLabel = (result.sentence? result.sentence: mironName );
              // Translate mironName into sentence
              this._addButton( buttonLabel, this.expectationButtonList );
            }
            break;
          case 'confirmName':
            this._addButton( '*Input your full name...', this.expectationButtonList );
            break;
          default:
            const result = ams.generateMiron( 'speech', mironName, {}, 0 );
            const buttonLabel = (result.sentence? result.sentence: mironName );
            // Translate mironName into sentence
            this._addButton( buttonLabel, this.expectationButtonList );
            break;
        }
      }
    }
  }
  _showPossibleGoals() {
    if( this.isShowGoals ) {
      //TODO: hide previous buttons
      const goalList = this.bm.getGoalList();
      this.expectationButtonList = [];
      let buttonLabel = '';
      for( const mironName of goalList ) {
        switch( mironName ) {
          case 'answerName':
            buttonLabel = this.avatar.name;
            // Translate mironName into sentence
            this._addButton( buttonLabel, this.goalButtonList );
            break;
          case 'confirmName':
            this._addButton( '*Input your full name...', this.expectationButtonList );
            break;
          default:
            const result = ams.generateMiron( 'speech', mironName, {}, 0 );
            buttonLabel = (result.sentence? result.sentence: mironName );
            // Translate mironName into sentence
            this._addButton( buttonLabel, this.goalButtonList );
            break;
        }
      }
    }
  }
  _addButton( buttonName, buttonList ) {
    buttonList.push( buttonName );
    $L().log( '*****      BUTTONS: '+buttonName );
  }
  _hideExpectation() {
    if( this.showExpectations ) {
      this.expectationButton.setOptions( { options: [] } );
      this.expectationButtonList = [];
    }
  }
  _hideGoal() {
    if( this.showGoal ) {
      this.goalButton.setOptions( { options: [] } );
      this.goalButtonList = [];
    }
  }
  _buttonExpactationCallback( buttonText ) {
    $L().log( 'UUUTTTONNNN Pressed!!!!!!!!!!!!!! -> '+ buttonText );
    let mironName = '';
    if( buttonText.startsWith( 'Input your full name...:' ) ) {
      this.knowledge['visitorName'] = buttonText.substring('Input your full name...:'.length);
      $L().log( 'Knowledge visitor name: '+this.knowledge['visitorName'] );
      mironName = 'confirmName';
    } else {
      // Here we recognize the visitor answer
      mironName = this._recognizeSentence( buttonText );
    }
    this.mironHeard = mironName;
    this.isSomethingHeardT = true;
    this._hideExpectation();
  }
  _buttonGoalCallback( buttonText ) {
    $L().log( 'UUUTTTONNNN Pressed!!!!!!!!!!!!!! -> '+ buttonText );
    if( buttonText.startsWith( 'My name is not' ) ) {
      this.knowledge['visitorName'] = buttonText.substring('Input your full name...:'.length);
      $L().log( 'Knowledge visitor name: '+this.knowledge['visitorName'] );
      this.sentenceToSay = this.knowledge['visitorName'];
    } else {
      this.sentenceToSay = buttonText;
    }
    this._hideGoal();
  }
  _recognizeSentence() {
    this.cmd.isSpeechRecognized = null;

    const textHeardList = this.avatar.getAudition();
    const speakerList = Object.keys( textHeardList );
    //TODO: we should set attention from somewhere, and it would
    // actualy be the name of the source and not just an index
    const attention = (speakerList.length > 0? speakerList[0]: '');

    if( textHeardList[attention] ) {
      const text = textHeardList[attention].message;
      let mironName = '';
      const mironType = 'speech';

      const result = ams.recognizeMiron( mironType, text );
      const expectationList = this.bm.getExpectationList();
      // Loop on both expected and recognized miron
      //TODO: we are currently taking only the first recognized miron. Mabye
      //      we should consider the other ones too!!!!!!!
      for( const recognizedMiron of result ) {
        if( expectationList.length == 0 ) {
          mironName = recognizedMiron.mironName;
          if( recognizedMiron.slot['name'] !== undefined ) {
            // In this case we have recognized the miron 'answerName' then we capture name
            $L().log( 'Button recognized mironName: '+mironName );
            this.knowledge['visitorName'] = recognizedMiron.slot['name'];
            $L().log( 'Knowledge visitor name: '+this.knowledge['visitorName'] );
          }
          break;
        } else {
          for( const expectedMironName of expectationList ) {
            // Stop on first expected miron recognized
            if( expectedMironName == recognizedMiron.mironName ) {
              mironName = recognizedMiron.mironName;

              if( recognizedMiron.slot['name'] !== undefined ) {
                // In this case we have recognized the miron 'answerName' then we capture name
                $L().log( 'Button recognized mironName: '+mironName );
                this.knowledge['visitorName'] = recognizedMiron.slot['name'];
                $L().log( 'Knowledge visitor name: '+this.knowledge['visitorName'] );
              }
              break;
            }
          }
          // If recognized then exit loop
          if( mironName.length > 0 ) {
            break;
          }
        }
      }
      // If nothing has been recognized
      if( mironName.length == 0 ) {
        $L().log( 'Error: not recognized by any miron the mironName: '+mironName );
      }
      this.bm.doSerialPerception( mironName, mironType , 1 );
    }
  }
  _sendNameToROS() {
    hregLobby.sendNameToROS( this.knowledge['visitorName'] );
  }
  _loadVisitorNames() {
    this.knowledge['visitorList'] =
    [
      'Ceravola',
      'Joublin',
      'Fuchs',
    ];
  }
}

