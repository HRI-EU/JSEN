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

// ====================
// Global declarations
// ====================

/*
  URL Parameters
   - jsenSrc: source code with threads
   - isAutoStart: start threads on load
   - isAutoStop: stop debugger if all running treads are terminated

   URL? jsenSrc=../Code.js&isAutoStart=true&isAutoStop=false
*/

// Main layout
let myLayout;
// Record of past machine states
let stateRecordHistory = [];
let stateHistoryIndex = null;
let threadLineNumberList = {};

// Auto start mode
let isAutoStart = false;
const autoStartDelay =  3; // seconds
let autoStartTimer = null;
// Auto step mode
let repeatAutoStep = null;
let repeatAutoStepPeriod = 300;
let repeatAutoStepPreviousPeriod = 0;
// Auto stop mode
let isAutoStop = true;
// JSENStudio JSEN vm
let JSENS_jvm = null;
// Buffer for WinStat information
let winStatBuffer = '{}';
// Flag to update div heights one main() is over
let isMainOver = false;
// Plot library
const gp = new GPlot( document.body );
// Breakpoint on line and condition list
let breakpointConditionList = [];
let breakpointLineList = {};

// Colors representing each thread status
const threadStatusColorVector = {
  'ready': '#71A1C9',
  'running': '#8caa55',
  'suspended': '#eee957',
  'terminated': '#D57C7A'
};
// List of thread status
const threadStatusList = [ 'ready', 'running', 'suspended', 'terminated' ];

// Register the main to be executed onLoadDone
$(document).ready( main );

// Main Function
function main() {
  // Setup HTML User Interface
  _setupUI();

  // Get URL parameters
  const queryString = window.location.search;
  // Parse parameters
  const urlParams = new URLSearchParams( queryString );
  // Check if jsenSrc is specified
  let jsenSrc = urlParams.get( 'jsenSrc' );
  jsenSrc = ( jsenSrc? jsenSrc: '../examples/JSENStudio/JSENExample1.js' );
  const as = urlParams.get( 'isAutoStart' );
  if( as != undefined ) {
    isAutoStart = ( as == 'true'? true: false );
  }
  const at = urlParams.get( 'isAutoStop' );
  if( at != undefined ) {
    isAutoStop = ( at == 'true'? true: false );
  }

  const onScriptLoaded = function() {
    _setupJSENStudio( JSENS_jvm );

    // Restore window position if available
    _restoreAllThreadCodeDivPosition( winStatBuffer );

    if( isAutoStart ) {
      // Wait 5 seconds and then start
      autoStartTimer = setTimeout( ()=> {
        toggleRepeatStep();
        // Clear autostart timer
        autoStartTimer = null;
      }, autoStartDelay*1000 );
    }

    setLeftMenuOpen(true);
    // Give a bit of time and set the size of the divs
    setTimeout( ()=>{ isMainOver = true; _onResize(); }, 1*1000 );
  };

  // Load all JSEN source file and then setup the studio
  const srcList = jsenSrc.split( ',' );
  if( srcList.length ) {
    _processScrList( srcList );
    loadScriptList( srcList, onScriptLoaded, false );
  } else {
    onScriptLoaded();
  }
}
function JSENStudio_setJVM( jvm ) {
  JSENS_jvm = jvm;
}
function JSENStudio_getWinStat() {
  return( _saveAllThreadCodeDivPosition() );
}
function JSENStudio_setWinStat( winStat ) {
  winStatBuffer = winStat;
}
function JSENStudio_stopStepByStep() {
  stopRepeatStep();
}
/******************************************
 * Public Thread Functions
 ******************************************/
function stepMachine() {
  unhighlightHistoryIndex();
  JSENS_jvm.step('*');
  updateAllThreadsInfo( JSENS_jvm );
}
function getThreadStatus( threadId )
{
  const isSimulation = false;
  const threadStatus = ( isSimulation ) ?
                        _getThreadStatusSimulated() :
                        _getThreadStatus( threadId );
  return threadStatus;
}
function updateAllThreadsInfo( jvm ) {
  // By default the menu are all opened
  const status = _getAllThreadInfo( jvm );
  // Add status to machine state record
  if( status.length > 0 ) {
    stateRecordHistory.push( status );
  }
  _updateAllThreadsInfo( status );
}
function setHistory( index ) {
  if( index != null ) {
    unhighlightHistoryIndex();
    if( index >= stateRecordHistory.length ) {
      index = stateRecordHistory.length-1;
    }
    if( index < 0 ) {
      index = 0;
    }
    stateHistoryIndex = index;
    _updateAllThreadsInfo( stateRecordHistory[index], false );
  }
}
function forwardHistory() {
  const newIndex = ( stateHistoryIndex == null? 0: stateHistoryIndex+1 );
  setHistory( newIndex );
}
function backwardHistory() {
  const newIndex = ( stateHistoryIndex == null? stateRecordHistory.length-1: stateHistoryIndex-1 );
  setHistory( newIndex );
}
function highlightThreadExecutedLine( threadInfo ) {
  let toExecuteLineNumber = threadInfo.lineNumber+2; // +1 because we have '[' at beggining of source
  //console.log( threadInfo.name+'->toExecuteLineNumber: '+toExecuteLineNumber );

  if( threadLineNumberList[threadInfo.id].highlightedToExecuteLine >= 0 ) {
    const highlightedToExecuteLine = threadLineNumberList[threadInfo.id].highlightedToExecuteLine;
    _setCodeLineColor( threadInfo.id, highlightedToExecuteLine, '#363838' );
  }

  if( threadInfo.status != 'terminated' ) {
    _setCodeLineColor( threadInfo.id, toExecuteLineNumber, '#555858' );
  }
  threadLineNumberList[threadInfo.id].highlightedToExecuteLine = toExecuteLineNumber;
}
function isThreadWithDebugInfo( threadId ) {
  let result = false;
  if( stateRecordHistory.length > 0 ) {
    result = _getThreadInfoRecord( threadId ).isDebugInfo;
  }
  return result;
}
/******************************************
 * Public GUI Functions
 ******************************************/
function setLeftMenuOpen( isOpen ) {
  if( isOpen ) {
    $('.btnOpen-west').click()
  } else {
    $('.btnClose-west').click()
  }
}
function setRightEditorOpen( isOpen ) {
  if( isOpen ) {
    $('.btnOpen-east').click()
  } else {
    $('.btnClose-east').click()
  }
}
function showLeftMenu() {
  $('.ui-layout-resizer-west').click();
}
function showRightEditor() {
  $('.ui-layout-resizer-east').click();
}
function startRepeatStep() {
  if( !repeatAutoStep ) {
    repeatAutoStep = setTimeout( doRepeatStep, repeatAutoStepPeriod );
    stepMachine();
  }
}
function stopRepeatStep()
{
  // If we stop before the autoStart => clean the autostart timer
  if( autoStartTimer ) {
    clearTimeout( autoStartTimer );
    autoStartTimer = null;
  }
  // Clear the repeat timer
  clearTimeout( repeatAutoStep );
  repeatAutoStep = null;
}
function toggleRepeatStep() {
  if( !repeatAutoStep ) {
    startRepeatStep()
  } else {
    stopRepeatStep();
  }
}
function doRepeatStep() {
  if( repeatAutoStep ) {
    repeatAutoStep = setTimeout( doRepeatStep, repeatAutoStepPeriod );
    stepMachine();
  }
}
function highlightHistoryIndex() {
  // Un-highlight previous state history
  if( ( stateHistoryIndex != null ) && ( stateHistoryIndex >= 0 ) ) {
    $( `#timeRowValue${stateHistoryIndex}` ).addClass( 'timeCellSelected' );
  }
}
function unhighlightHistoryIndex() {
  // Un-highlight previous state history
  if( ( stateHistoryIndex != null ) && ( stateHistoryIndex >= 0 ) ) {
    $( `#timeRowValue${stateHistoryIndex}` ).removeClass( 'timeCellSelected' );
  }
}
/******************************************
 * Private GUI Functions
 ******************************************/
function _getThredIdFromDivId( threadHTMLIdDiv ) {
  const idx = 'codeDiv_'.length;
  return( threadHTMLIdDiv.substring( idx ) );
}
function _getDivIdFromThreadId( threadId ) {
  return( 'codeDiv_'+ threadId );
}
function _toogleLineBreakpoint( el, threadId, lineNumber ) {
  const key = `${threadId}_${lineNumber}`;
  // Get breakpoint info if exisist
  let bpInfo = breakpointLineList[key];
  // Check if breakpoint do not exists
  const isNewKey = ( bpInfo == null );
  // If not exist create new info
  if( isNewKey ) {
    bpInfo = { el, checked: true };
    breakpointLineList[key] = bpInfo;
  }
  // Get class name 
  const className = bpInfo.el.className;
  // Toogle class name
  if( className.endsWith( 'Off' ) ) {
    bpInfo.el.className = 'lineBreakpointOn';
    JSENS_jvm.setBreakpoint( threadId, lineNumber, stopRepeatStep );
    bpInfo.checked = true;
  } else {
    bpInfo.el.className = 'lineBreakpointOff';
    JSENS_jvm.clearBreakpoint( threadId, lineNumber, stopRepeatStep );
    bpInfo.checked = false;
  }
  if( isNewKey ) {
    const threadName = JSENS_jvm.getThreadName( threadId );
    // Make breakpoint visible
    html = '<tr onclick="_addThreadCodeDiv(\''+threadId+'\')">'+
              '<td><input class="conditionBreakpoint'+key+'"'+
                         'type="checkbox" '+
                         'onclick="_toogleLineBreakpoint(this,'+threadId+','+lineNumber+')" '+
                         'name="Line_'+key+'" checked>'+
                threadName+'</input></td>'+
              '<td>('+threadId+')</td>'+
              '<td>'+lineNumber+'</td>'+
            '</tr>';
    $('#breakCondtionTable tbody').append( html );
  } else {
    const el = $('.conditionBreakpoint'+key)[0];
    if( el ) {
      el.checked = bpInfo.checked;
    }
  }
}
function _addConditionBreakpoint( el, threadId ) {
  const condition = prompt( 'Add condition breakpoint' );
  if( condition ) {
    // Create breakpoint
    const key = threadId;
    const condFn = ()=> eval( condition );
    const bId = JSENS_jvm.setBreakpoint( threadId, condFn, stopRepeatStep );

    // Store breakpoint
    const bpIdx = breakpointConditionList.length;
    breakpointConditionList.push( { threadId, condition, breakpointId: bId } );
    const threadName = JSENS_jvm.getThreadName( threadId );
    // Make breakpoint visible
    html = '<tr onclick="_addThreadCodeDiv(\''+threadId+'\')">'+
              '<td><input class="conditionBreakpoint"'+
                         'type="checkbox" '+
                         'onclick="_toogleConditionBreakpoint(this,'+bpIdx+')" '+
                         'name="Cond_'+bpIdx+'" checked>'+
                threadName+'</input></td>'+
              '<td>('+threadId+')</td>'+
              '<td>'+condition+'</td>'+
            '</tr>';
    $('#breakCondtionTable tbody').append( html );
  }
}
function _toogleConditionBreakpoint( el, bpIdx ) {
  bpInfo = breakpointConditionList[bpIdx];
  if( bpInfo ) {
    if( el.checked ) {
      const condFn = ()=> eval( bpImfo.condition );
      const bId = JSENS_jvm.setBreakpoint( bpInfo.threadId, condFn, stopRepeatStep );
      bpIdx.breakpointId = bId;
    } else {
      JSENS_jvm.clearBreakpointById( bpInfo.threadId, bpInfo.breakpointId );
    }
  }
}
function _removeAllBreakpoints() {
  let elList = $('#breakCondtionTable input');
  // Remove all breackpoints still enabled
  for( let i = 0; i < elList.length; ++i ) {
    const el = elList[i];
    if( el.checked ) {
      el.click(); // Trigger click to unckeck and remove condition
    }
  }
  // Remove all breakpoint from UI
  elList = $('#breakCondtionTable tr');
  for( let i = 2; i < elList.length; ++ i ) {
    elList[i].remove();
  }
  // Clear breakpoint list
  breakpointConditionList = [];
  breakpointLineList = {};
}
function _setSourceWindowMaxHeight( div ) {
  const dn = $('.ui-layout-north')[0];
  const dc = document.body;
  const ds = $('.ui-layout-south')[0];
  const maxHeight = Math.max( 300, dc.clientHeight - ds.clientHeight - dn.clientHeight );
  if( div.clientHeight > maxHeight ) {
    div.style['height'] = `${maxHeight-50}px`;
  }
}
function _setupJSENStudio( jvm )
{
  // Call this to update threads
  updateAllThreadsInfo( jvm );

  _setupCollapsibleThreadsMenu();
  _setupSpeedSlider( jvm );
  _setupTimelineButton( jvm );
  $('.collapsible').click();
}
function _setupTimelineButton( jvm ) {
  $('.cleanTimelineButton')[0].onclick = function() {
    stateHistoryIndex = null;
    $('#statusTimeline tbody').empty();
    //$('#statusTimeline tbody').append( '<th id="timeRow"><td>' );
    $('#statusTimeline tbody').append( '<tr id="timeRow"><th id="timeCell" class="fixTh">' );
    //TODO: move the next call (restoring code divs in a decent place)
    updateAllThreadsInfo( jvm );
  }
}
function _setupSpeedSlider( jvm ) {
  $('#sliderSpeedSlowThread')[0].oninput = function() {
    const sliderValue = this.value;
    const period = Math.floor((sliderValue < 90? sliderValue/90: sliderValue-89)*100)/100;
    $('#sliderSpeedSlowThreadValue').text( period );
    _setSlowPeriod( period, jvm );
  }
  $('#sliderSpeedStep')[0].oninput = function() {
    const period = this.value;
    $('#sliderSpeedStepValue').text( period );
    repeatAutoStepPeriod = period;
    if( ( repeatAutoStepPreviousPeriod = 1000 ) &&
        ( period < repeatAutoStepPreviousPeriod ) ) {
      startRepeatStep();
    }
    if( period == 1000 ) {
      stopRepeatStep();
    }
    repeatAutoStepPreviousPeriod = period;
  }
}
function _setupDragElement( htmlElement ) {
  setDragElement( htmlElement, _saveAllThreadCodeDivPosition );
}
function _setupCollapsibleThreadsMenu()
{
  const coll = document.getElementsByClassName("collapsible");

  for ( const menuEntry of coll ) {
    menuEntry.addEventListener("click", function() {
      this.classList.toggle("active");
      let content = this.nextElementSibling;
      if (content.style.maxHeight){
        content.style.maxHeight = null;
      } else {
        content.style.maxHeight = (content.scrollHeight+100) + "px";
      }
    });
  }
}
function _setCodeLineColor( threadId, lineNumber, color ) {
  const getLine = ( id, n )=> {
    const threadHTMLIdDiv = _getDivIdFromThreadId( id );
    const lineHTMLId = 'codeRow_'+threadHTMLIdDiv+'_'+n;
    const line = $( '#'+lineHTMLId );
    return( line );
  };
  const line = getLine( threadId, lineNumber );
  line.css( 'background-color', color );
  let lineToScroll = line;
  const nextLine = getLine( threadId, lineNumber+1 );
  if( nextLine ) {
    lineToScroll = nextLine[0];
  }
  lineToScroll.scrollIntoView( false );
}
function _setThreadToQueue( newQueue, threadList, jvm ) {
  if( !jvm )
    _setThreadToQueueSimulated( newQueue, threadList );
  else
    jvm.setThreadToQueue( newQueue, threadList );
}
function _addThreadCodeDiv( threadId ) {
  const threadIdNr = parseInt(threadId, 10);
  // Only StepByStep threads can be visualized
  if( isThreadWithDebugInfo( threadIdNr ) ) {
    const status = _getThreadStatus( threadIdNr );
    const threadHTMLIdDiv = _getDivIdFromThreadId( threadIdNr );
    if( $('#'+threadHTMLIdDiv).length == 0 ) {
      const threadHTMLIdHead = 'codeHead_'+threadIdNr;
      // The next function uses the threadLineNumberList for calculating the line number;
      const threadCode = _getFormattedThreadCode( threadIdNr );
      const threadInfo = _getThreadInfoRecord( threadIdNr );
      const threadCodeDivHTML = '<div class="threadCode" id="'+threadHTMLIdDiv+'" draggable="true">'+
                                  '<table class="treadCodeTable">'+
                                    '<tr class="threadCodeRowHeader">'+
                                      '<th colspan="2" class="threadCodeHeader" id="'+threadHTMLIdHead+'"'+
                                        'ondblclick="_removeThreadCodeDiv(\''+threadHTMLIdDiv+'\')"'+
                                        'style="background-color: '+threadStatusColorVector[status]+';">'+
                                        threadInfo.name+
                                      '</th>'+
                                    '</tr>'+
                                    threadCode+
                                  '</table>'+
                                '</div>';
      $('#diagram').append( threadCodeDivHTML );
      const threadCodeDiv = $('#'+threadHTMLIdDiv)[0];
      _setupDragElement( threadCodeDiv );
      _restoreThreadCodeDivPosition( threadHTMLIdDiv );
      // Init the struct that will keep track of selected lines in the code
      _initThreadLineNumberList( threadIdNr );
      // Set max height
      _setSourceWindowMaxHeight( threadCodeDiv );
      // Select current line
      highlightThreadExecutedLine( threadInfo );
      // Run Lightweight JS Syntax Highlighter
      highlightAll();
    }
  }
}
function _updateThreadCodeDiv( threadInfo ) {
  const threadHTMLIdHead = 'codeHead_'+threadInfo.id;
  const codeHead = $('#'+threadHTMLIdHead);
  if( codeHead.length != 0 ) {
    codeHead.css( 'background-color', threadStatusColorVector[ threadInfo.status ] );
    highlightThreadExecutedLine( threadInfo );
  }
}
function _removeThreadCodeDiv( threadHTMLIdDiv ) {
  $( '#'+threadHTMLIdDiv ).remove();
}
function _saveAllThreadCodeDivPosition() {
  let data = {};
  const threadDivList = $( '.threadCode' );
  if( threadDivList ) {
    const threadDivListLength = threadDivList.length;
    for( let i = 0; i < threadDivListLength; ++i ) {
      //TODO: save the thread name in this place
      // hint: $('#codeHead_AlexBM_mainLoop')[0].innerText
      const codeDivId = threadDivList[i].id;
      data[codeDivId] = {
        offsetTop: threadDivList[i].offsetTop,
        offsetLeft: threadDivList[i].offsetLeft,
      };
    }
  }
  const strData = JSON.stringify( data );
  document.cookie = strData;
  return( strData );
}
function _restoreAllThreadCodeDivPosition( strData ) {
  strData = ( strData? strData: document.cookie );
  if( strData ) {
    let data = JSON.parse( strData );
    for( const threadDivId in data ) {
      //TODO: make a serious way to get the thread name: maybe thanks to the prev func?
      const threadId = _getThredIdFromDivId( threadDivId );
      _addThreadCodeDiv( threadId );
      _restoreThreadCodeDivPosition( threadDivId, strData );
    }
  }
}
function _restoreThreadCodeDivPosition( threadDivId, strData ) {
  strData = ( strData? strData: document.cookie );
  if( strData ) {
    let data = JSON.parse( strData );
    if( data[threadDivId] ) {
      if( $( '#'+threadDivId ).length > 0 ) {
        $( '#'+threadDivId )[0].style.top = data[threadDivId].offsetTop+'px';
        $( '#'+threadDivId )[0].style.left = data[threadDivId].offsetLeft+'px';
      }
    }
  }
}
function _showCodeInEditor( threadId ) {
  const threadInfo = _getThreadInfoRecord( threadId );
  $( '#editorCodeFileName' ).text( threadInfo.name );
  const threadCode = _getThreadSourceCode( threadId, JSENS_jvm );
  let source = threadCode.join('\n');
}
function _selectThreadToQueue( newQueue ) {
  const threadDivList = $('#threadQueueList');
  let threadList = [];
  const len = threadDivList[0].getElementsByTagName('input').length;
  for( let index = 0; index < len; ++index ) {
    const checkInfo = threadDivList[0].getElementsByTagName('input')[index];
    const labelInfo = threadDivList[0].getElementsByTagName('label')[index];
    if( checkInfo.checked ) {
      threadList.push( checkInfo.name );
      checkInfo.checked = false;
      labelInfo.innerText = '['+newQueue+'] '+checkInfo.name;
    }
  }
  if( threadList.length > 0 ) {
    _setThreadToQueue( newQueue, threadList, JSENS_jvm );
    unhighlightHistoryIndex();
  }
  // Update info (for debug messages)
  updateAllThreadsInfo( JSENS_jvm );
}
function _padNumber( value, len, char ) {
  char = ( char != undefined? char: '&nbsp;' );
  let s = String(value);
  while ( s.length < len ) { s = char + s; }
  return s;
}
/******************************************
 * High-Level Private Functions
 ******************************************/
function _getThreadStatus( threadId ) {
  let status = '';
  if( stateRecordHistory.length == 0 )
    status = 'unknown';
  else {
    status = _getThreadInfoRecord( threadId ).status;
  }
  return status;
}
function _updateAllThreadsInfo( status, isOnLine ) {
  // isOnline == true ==> status coming from JSEN execution
  // isOnline == false ==> status coming from click on time in timetable
  isOnLine = ( isOnLine == undefined? true: isOnLine );
  const queueVector = {
    'fast': 'F',
    'slow': 'S',
    'stepByStep': 'B',
    'terminated': 'T',
    'ready': 'R',
  };

  // Maps used to insert each thread only one time
  let inputNewQueue = {};
  let isTimeLineTimeSet = false;
  let runningThreadCount = 0;

  // Reset containers
  $('#checkOnConditionTable tbody').empty();
  $('#readyTable tbody').empty();
  $('#runningTable tbody').empty();
  $('#suspendedTable tbody').empty();
  $('#terminatedTable tbody').empty();
  $('#threadQueueList').empty();

  // loop over data
  for( const threadInfo of status ) {
    // Compute status color
    const statusColor = threadStatusColorVector[threadInfo.status];
    const threadHTMLId = threadInfo.id;
    let html = '';

    // Add thread in the menu
    switch( threadInfo.status ) {
      case 'ready':
        html = '<tr onclick="_addThreadCodeDiv(\''+threadInfo.id+'\')">'+
             '<td>['+queueVector[threadInfo.queue]+']</td>'+
             '<td>'+threadInfo.name+'</td>'+
             '<td>('+threadInfo.id+')</td></tr>';
        $('#readyTable tbody').append( html );
        break;
      case 'running':
        html = '<tr onclick="_addThreadCodeDiv(\''+threadInfo.id+'\')">'+
             '<td>['+queueVector[threadInfo.queue]+']</td>'+
             '<td>'+threadInfo.name+'</td>'+
             '<td>('+threadInfo.id+')</td></tr>';
        $('#runningTable tbody').append( html );
        ++runningThreadCount;
        break;
      case 'suspended':
        if( ( threadInfo.suspendedOn == 'on' ) || ( threadInfo.suspendedOn == 'signalWait' )  ) {
          html = '<tr onclick="_addThreadCodeDiv(\''+threadInfo.id+'\')">'+
                      '<td>['+queueVector[threadInfo.queue]+']</td>'+
                      '<td>'+threadInfo.name+'</td>'+
                      '<td>('+threadInfo.id+')</td>'+
                      '<td>'+threadInfo.condition+'</td></tr>';
          $('#checkOnConditionTable tbody').append( html );
        }
        html = '<tr onclick="_addThreadCodeDiv(\''+threadInfo.id+'\')">'+
             '<td>['+queueVector[threadInfo.queue]+']</td>'+
             '<td>'+threadInfo.name+'</td>'+
             '<td>('+threadInfo.id+')</td>'+
             '<td>'+threadInfo.suspendedOn+'</td></tr>';
        $('#suspendedTable tbody').append( html );
        ++runningThreadCount;
        break;
      case 'terminated':
        html = '<tr onclick="_addThreadCodeDiv(\''+threadInfo.id+'\')">'+
             '<td>['+queueVector[threadInfo.queue]+']</td>'+
             '<td>'+threadInfo.name+'</td>'+
             '<td>('+threadInfo.id+')</td></tr>';
        $('#terminatedTable tbody').append( html );
        break;
    }

    // Update threadCode Div
    _updateThreadCodeDiv( threadInfo );

    // Update only if data is onLine with JSEN execution
    // instead if update is executed by onclick of timetable, then its off-line
    // and therefore we don't update the timeline
    if( isOnLine ) {
      // Update Threads Switching
      if( !inputNewQueue[threadInfo.name] ) {
        inputNewQueue[threadInfo.name] = true;
        //Example line: <input type="checkbox" name="Tom.loadingCheck">[fast] Tom.loadingCheck</input><br>
        html = '<input type="checkbox" name="'+threadInfo.name+'"><label>['+threadInfo.queue+'] '+threadInfo.name+'</label></input><br>'
        $('#threadQueueList').append( html );
      }

      // Update timeline
      if( $('#timeRow_'+threadHTMLId+' td').length == 0 ) {
        html = '<tr id="timeRow_'+threadHTMLId+'" onclick="_addThreadCodeDiv(\''+threadInfo.id+'\')">'+
              '<th class="fixTh">'+threadInfo.name+'</th>';
        const numbOfTd = $('#timeRow td').length;
        for( let i = 1; i < numbOfTd; ++i ) {
          html += '<td>&nbsp;&nbsp;</td>'
        }
        html += '</tr>';
        $('#statusTimeline tbody').append( html );
      }
      $('#timeRow_'+threadHTMLId)
        .append($('<td>',{'style': 'background-color:'+statusColor, 'title': threadInfo.name})
        .append('&nbsp;'));
    }

    // Make sure that the menu are updated with content
    $('.collapsible').click();
    $('.collapsible').click();
  }

  if( isOnLine ) {
    // Add note cell
    $('#timeRow_notes')
        .append($('<td>',{'style': 'color: aqua'})
        .append('<div class="timeNoteText" contenteditable>&nbsp;</div>'));

    // Add timestamp in timeline
    if( status.length > 0 ) {
      isTimeLineTimeSet = true;
      stateHistoryIndex = stateRecordHistory.length-1;
      const timeStr = _padNumber( status[0].timeStamp.getHours(), 2, '0' )+':'+
                      _padNumber( status[0].timeStamp.getMinutes(), 2, '0' )+':'+
                      _padNumber( status[0].timeStamp.getSeconds(), 2, '0' )+'.'+
                      _padNumber( status[0].timeStamp.getMilliseconds(), 4, '0' );
      $('#timeRow').append( '<td id="timeCell"><p style="margin:0px" class="timeRowValue" id="timeRowValue'+stateHistoryIndex+'"'+
                            ' onclick="setHistory( '+stateHistoryIndex+' )">'+timeStr );
    }
  }

  // Highlight current state history
  highlightHistoryIndex();

  // Stop autoStep if no thread running
  if( ( runningThreadCount == 0 ) && isAutoStop ) {
    stopRepeatStep();
  }
}
/******************************************
 * Low-Level Private Functions
 ******************************************/
function _processScrList( srcList ) {
  if( srcList.length ) {
    const getPath = function( filePathName ) {
      let path = '';
      const idx = filePathName.lastIndexOf( '/' );
      if( idx != -1 ) {
        path = filePathName.substring( 0, idx+1 );
      }
      return( path );
    }
    let prevPath = null;
    for( let i = 0; i < srcList.length; ++i ) {
      const src = srcList[i];
      const path = getPath( src );
      if( !prevPath && path ) {
        prevPath = path;
      } else {
        if( !path && prevPath ) {
          srcList[i] = prevPath+src;
        }
        if( path ) {
          prevPath = path;
        }
      }
    }
  }
}
function _initThreadLineNumberList( threadId ) {
  threadLineNumberList[threadId] = {
    highlightedToExecuteLine: -1,
    highlightedExecutedLine: -1,
    currentLine: 0,
    linePointers: [],
  };
}
function _getAllThreadInfo( jvm ) {
  const resultList = ( !jvm ) ?
                    _getAllThreadInfoSimulated() :
                    jvm.getAllThreadInfo();
  return( resultList );
}
function _getThreadInfoRecord( threadId, index ) {
  index = ( ( index )? index: -1 );
  const minLen = ( ( index >= 0 )? index+1: Math.abs( index ) );
  if( stateRecordHistory.length >= minLen ){
    const actualIndex = ( ( index >= 0 )? index: stateRecordHistory.length+index );
    const lastState = stateRecordHistory[ actualIndex ];
    for( const threadInfo of lastState ) {
      if( threadInfo.id === threadId )
        return threadInfo;
    }
  }
  console.log( 'Warning: could not find record for thread ID: '+threadId+' at index: '+index );
  return {};
}
function _getThreadNameAsHTMLId( threadName ) {
  return threadName.replace( '.', '_' ).replace( ' ', '_' );
}
function _getInnerCode( threadCode ) {
  let innerCode = []
  for( const statement of threadCode ) {
    if( !Array.isArray( statement ) )
      innerCode.push( statement );
    else {
      innerCode.push(statement);
      innerCode = innerCode.concat( _getInnerCode( statement ) );
      innerCode.push(']');
    }
  }
  return innerCode;
}
function _getFormattedThreadCode( threadId ) {
  const threadHTMLIdDiv = _getDivIdFromThreadId( threadId );
  const threadSourceCode = _getThreadSourceCode( threadId, JSENS_jvm );

  let source = '';
  const sourceCodeMaxLine = threadSourceCode.length;
  for( let lineNumber = 1; lineNumber <= sourceCodeMaxLine; ++lineNumber ) {
    const sourceLine = threadSourceCode[lineNumber-1];
    source += _getHTMLFormattedCodeLine( threadHTMLIdDiv, lineNumber, sourceLine );
  }

  return source;
}
function _getThreadSourceCode( threadId, jvm ) {
  if( jvm ) {
    //return jvm.getThreadSourceCode( threadId );
    const threadCode = jvm.getThreadCode( threadId );
    const threadSourceCode = JSEN.stringify( threadCode, null, 2, true );
    return( threadSourceCode );
  } else {
    return _getThreadCodeSimulation();
  }
}
function _getHTMLFormattedCodeLine( threadHTMLIdDiv, lineNumber, stringLine ) {
  const lineId = 'codeRow_'+threadHTMLIdDiv+'_'+lineNumber;
  const threadId = _getThredIdFromDivId( threadHTMLIdDiv );
  return '<tr id="'+lineId+'">'+
         '<td class="lineBreakpointOff" '+
            'ondblclick="_toogleLineBreakpoint(this,'+threadId+','+lineNumber+')"'+
            '>&nbsp'+
         '<td '+
            '>'+_padNumber( lineNumber, 2 )+': '+
         '<code '+
            'ondblclick="_addConditionBreakpoint(this,'+threadId+')"'+
            '>'+stringLine+'</code>';
}
function _setSlowPeriod( period, jvm ) {
  if( !jvm )
    _setSlowPeriodSimulated( period );
  else
    jvm.setSlowThreadPeriod( period );
}
/******************************************
 * Simulated Private Functions
 ******************************************/
function _getRandomChoice( choiceList ) {
  const index = Math.floor( Math.random()*choiceList.length );
  return choiceList[index];
}
function _getAllThreadInfoSimulated() {
  let resultList = [];
  // [
  // { id: 0, name: 'checkOnThread', pc: 1, timestamp: 000, status: 'ready',     queue: 'stepByStep' },
  // { id: 0, name: 'checkOnThread', pc: 2, timestamp: 000, status: 'suspended', queue: 'slow', suspendedOn: 'JSEN.sleep' },
  // { id: 0, name: 'checkOnThread', pc: 3, timestamp: 000, status: 'suspended', queue: 'fast', suspendedOn: 'JSEN.on', condition:'()=> isAlive' },
  // ]
  const jvmthreadStatusList = [
    { id: 0, name: 'checkOnThread' },
    { id: 1, name: 'Bob.sensorLoop' },
    { id: 2, name: 'Alex.sensorLoop' },
    { id: 3, name: 'Bob.testingLoop' },
    { id: 4, name: 'Alex.testingLoop' },
    { id: 5, name: 'Alex.inputCheck' },
    { id: 6, name: 'Bob.mainLoop' },
    { id: 7, name: 'Alex.mainLoop' },
    { id: 8, name: 'Tom.mainLoop' },
    { id: 8, name: 'Tom.inputCheck' },
    { id: 8, name: 'Tom.sensorCheck' },
    { id: 8, name: 'Tom.loadingCheck' },
  ];
  const queueList = [ 'fast', 'slow', 'stepbystep' ];
  const suspendedCondList = [ '()=> isActive', '()=> isSetConstraints == true', '()=> isInputRead && isAlexVisible' ];
  const suspendedOn = [ 'on', 'sleep' ];


  for( const threadInfo of jvmthreadStatusList ) {
    let result = threadInfo;
    result['pc'] = _getRandomChoice( [0, 1, 2, 3] );
    result['timeStamp'] = new Date();
    result['status'] = _getRandomChoice( threadStatusList );
    result['queue'] = _getRandomChoice( queueList );
    if( result['status'] == 'suspended' ) {
      result['suspendedOn'] = _getRandomChoice( suspendedOn );
      if( result['suspendedOn'] == suspendedOn[0] ) {
        result['condition'] = _getRandomChoice( suspendedCondList );
      }
    }
    resultList.push( result );
  }

  return( resultList );
}
function _getThreadStatusSimulated()
{
  return _getRandomChoice( threadStatusList )
}
function _getThreadCodeSimulation() {
  const code = [
    '()=> console.log( "ciao" ),<br>()=> thisVar = 1,',
    'JSEN.print("test thread"),<br>JSEN.sleep(5),<br>()=> thisVar = 100,<br>JSEN.on( ()=> isActive == true ),',
    'JSEN.label( "label1" ),<br>JSEN.sleep(1),<br>JSEN.if( ()=> this.var > 5 ),<br>JSEN.goto( "label1" ),',
    'JSEN.on( ()=> isStatus == false ),<br>()=> this.triggerStep(),<br>JSEN.sleep(2),',
    'JSEN.on( ()=> isStatus == false ),<br>()=> this.triggerStep(),<br>JSEN.sleep(2),<br>JSEN.label( "label1" ),<br>JSEN.sleep(1),<br>JSEN.if( ()=> this.var > 5 ),<br>JSEN.goto( "label1" ),',
  ];

  return _getRandomChoice( code );
}
function _getDebugMessageSimulated() {
  return 'JSEN.on( ()=> isActionReady == false ),<br>JSEN.sleep( 50 ),';
}
function _setSlowPeriodSimulated( period ) {
  console.log( period );
}
function _setThreadToQueueSimulated( newQueue, threadList ) {
  console.log( "to <"+newQueue+">: "+threadList );
}

// =============================
// Behavior when Document Ready
// =============================
let southDivTop = 0;

// Excecute after DOM is loaded
function _setupUI()
{
  const southDiv = $('.ui-layout-south');
  const centerDiv = $('.ui-layout-center');
  const westDiv = $('.ui-layout-west');
  // Toggler customization setting
  const toggleButtonsWest	= '<div class="btnClose-west"></div>'
                        + '<div class="btnOpen-west"></div>';
  const toggleButtonsEast	= '<div class="btnClose-east"></div>'
                        + '<div class="btnOpen-east"></div>';

	// Define parameters
	const northRegionHeight = 30+'px';
	const westRegionWidth = 800+'px';
	const eastRegionWidth = 40+'%';
	const southRegionHeight = 30+'%';

	// Create Layout
	myLayout = $('body').layout(
    {
      resizeWhileDragging:          true
    ,	sizable:                      false
    ,	animatePaneSizing:            true
    ,	fxSpeed:                      'normal'
    , fxName:                       'slide'
    , north__size:                  northRegionHeight
    , south__size:                  southRegionHeight
    ,	west__size:                   westRegionWidth
  //, east__maxSize:                "30%"
    ,	east__size:                   eastRegionWidth
    ,	spacing_open:                 0
    ,	spacing_closed:               0
    ,	west__spacing_closed:         12
    ,	west__spacing_open:           12
    ,	west__togglerLength_closed:   70
    ,	west__togglerLength_open:     70
    ,	west__togglerContent_closed:	toggleButtonsWest
    ,	west__togglerContent_open:		toggleButtonsWest
    ,	east__spacing_closed:         12
    ,	east__spacing_open:           12
    ,	east__togglerLength_closed:   70
    ,	east__togglerLength_open:     70
    ,	east__togglerContent_closed:	toggleButtonsEast
    ,	east__togglerContent_open:		toggleButtonsEast
    , onresize: ()=> _onResize()
    }
  );

  // Set z-index so to have code div bellow
  $('.ui-layout-north')[0].style['z-index'] = 100;
  $('.ui-layout-west')[0].style['z-index'] = 100;

	// customize the west-toggler events
	myLayout.togglers.west
		// Unbind default toggler functionality
		.unbind("click")
		// Bind custom west method
		.find(".btnClose-west")	.click( maximizeCenterWest ).attr("title", "Close")	.end()
		.find(".btnOpen-west")	.click( {width:westRegionWidth}, maximizeWest )	.attr("title", "Open").end();

	// customize the west-toggler events
	myLayout.togglers.east
		// Unbind default toggler functionality
		.unbind("click")
		// Bind custom west method
		.find(".btnClose-east")	.click( maximizeCenterEast ).attr("title", "Close")	.end()
		.find(".btnOpen-east")	.click( {width:eastRegionWidth}, maximizeEast  ).attr("title", "Open").end();

	myLayout.close("east");

  // Allow mouse drag to scroll control center horizontally
  
  southDiv[0].style['z-index'] = 200;
  _onResize();
  
  const slideDiv = $( '.button_slide' );
  slideDiv.bind( 'mousedown', function (event) {
    $(document).bind( 'mousemove', function (event) {
      // Move south div
      const divTop = southDiv.offset().top
      const d = event.pageY-divTop;
      const newTop = d+divTop;
      if( newTop >= southDivTop ) {
        southDiv.css( 'top', newTop+'px' );
      }
    });
  });
  $(window).bind( 'mouseup', function (e) {
    $(document).unbind( 'mousemove' );
  });
}
// OnResize function
function _onResize() {
  const southDiv = $('.ui-layout-south');
  const centerDiv = $('.ui-layout-center');
  const westDiv = $('.ui-layout-west');
  const browserHeight = window.innerHeight;
  if( isMainOver ) {
    // Resize here any other object
    centerDiv[0].style['height'] = '100%';
    westDiv[0].style['height'] = '100%';
  }
  const southDivHeight = parseInt( southDiv[0].style['height'] );
  southDivTop = browserHeight-southDivHeight;
  southDiv[0].style['top'] = southDivTop+'px';
};

// ===============================
// Behavior function declarations
// ===============================

// Custom west (left) methods
function maximizeCenterWest(evt)
{
  myLayout.close("west");
  evt.stopPropagation();
}
function maximizeWest	(evt)
{
  myLayout.sizePane("west", evt.data.width);
  myLayout.open("west" );
  evt.stopPropagation();
}

// Custom east (right) methods
function maximizeCenterEast	(evt)
{
  myLayout.close("east");
  evt.stopPropagation();
}
function maximizeEast(evt)
{
  myLayout.sizePane("east",  evt.data.width);
  myLayout.open("east" );
  evt.stopPropagation();
}
// Custom resize methods
function sizePane (pane, size)
{
	myLayout.sizePane(pane, size);
	myLayout.open(pane); // open pane if not already
}

