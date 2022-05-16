
// ====================
// Global declarations
// ====================

var myLayout;
// CK Editor Global Variables
var ckEditor;
// ACE Editor Global Variables
var aceEditor;
// Gobal flag for editor change
var global_userCodeChanged = false;
var isSaveSourceCodeRequired = false;
var saveSourceCodeRequestID = 0;

// Thread Log Buffers
let threadLogBuffer = {};
const maxLenLogBuffer = 100;
const maxLenDivLogLines = 20;

/******************************************
 * Pubblic Functions
 ******************************************/
newLogTimer = null;
function newLog() {
  if( !newLogTimer ) {
    simulateNewLog();
  } else {
    clearTimeout( newLogTimer );
    newLogTimer = null;
  }
}
function simulateNewLog() {
  const threadId = parseInt( _getRandomChoice( Object.keys( threadLogBuffer ) ) );
  const threadLogLine = _getThreadLogSimulation( threadId );

  appendNewLog( threadId, threadLogLine );

  newLogTimer = setTimeout( simulateNewLog, 100 );
}
function appendNewLog( threadId, threadLogLine ) {
  _appendThreadLogBuffer( threadId, threadLogLine );
  _appendThreadLogDiv( threadId, threadLogLine )
}
function setLeftMenuOpen( isOpen ) {
  if( isOpen ) {
    $('.btnOpen-west').click()
  } else {
    $('.btnClose-west').click()
  }
}
function showLeftMenu() {
  $('.ui-layout-resizer-west').click();
}
function seRightEditorOpen( isOpen ) {
  if( isOpen ) {
    $('.btnOpen-east').click()
  } else {
    $('.btnClose-east').click()
  }
}
function showRightEditor() {
  $('.ui-layout-resizer-east').click();
}
// function highlightThreadLogLine( threadId, lineNumber ) {
//   const threadHTMLIdDiv = 'codeDiv_'+threadName.replace( '.', '_' );
//   const lineHTMLId = 'codeRow_'+threadHTMLIdDiv+'_'+lineNumber;
//   $( '#'+lineHTMLId ).css( 'background-color', 'darkcyan' )
// }
/******************************************
 * Private Functions
 ******************************************/
function _setupJSENStreamer()
{
  const jvm = null;
  _setupCollapsableThreadsMenu();
  const status = _getAllThreadInfoSimulated( jvm );
  _updateAllThreasInfo( status );
}
/*
function _selectThreadToQueue( newQueue ) {
  const inputList = $('#threadQueueList input');
  var threadList = [];
  for( var index = 0; index < inputList.length; ++index ) {
    const checkInfo = inputList[index];
    if( checkInfo.checked ) {
      threadList.push( checkInfo.name );
      inputList[index].checked = false;
    }
  }
  if( threadList.length > 0 ) {
    _setThreadToQueue( newQueue, threadList );
  }
}*/
function _addThreadLogDiv( threadId, threadName ) {
  if( threadLogBuffer[threadId] !== undefined ) {
    const threadHTMLIdDiv = 'logDiv_'+threadName.replace( '.', '_' );
    if( $('#'+threadHTMLIdDiv).length == 0 ) {
      const threadHTMLIdHead = 'logHead_'+threadName.replace( '.', '_' );
      const threadLogTableId = 'threadLogTable_'+threadId;
      const threadLogDivHTML = '<div class="threadLog" id="'+threadHTMLIdDiv+'" draggable="true">'+
                                '<div class="threadLogHeader" id="'+threadHTMLIdHead+'" '+
                                  'style="background-color: burlywood" '+
                                  'ondblclick="_removeLogDiv(\''+threadHTMLIdDiv+'\')"'+
                                  '>'+threadName+'</div>'+
                                '<table id="'+threadLogTableId+'" onclick="_showCodeInEditor(\''+threadId+'\')">'+
                                '</table>'+
                                '</div>';
      $('#LogPanel').append( threadLogDivHTML );
      const threadLogDiv = $('#'+threadHTMLIdDiv)[0];
      _setupDragElement( threadLogDiv );
      const threadLogLineList = threadLogBuffer[threadId].logLineList;
      if( threadLogLineList.length > 0 ) {
        for( const threadLogLine of threadLogLineList ) {
          _appendThreadLogDiv( threadId, threadLogLine );
        }
      }
      //TODO: set currently executed line
      //const line = Math.floor(Math.random()*2)+1;
      //highlightThreadLogLine( threadName, line );
    }
  }
}
function _removeLogDiv( threadHTMLIdDiv ) {
  $( '#'+threadHTMLIdDiv ).remove();
}
function _getRandomChoice( choiceList ) {
  const index = Math.floor( Math.random()*choiceList.length );
  return choiceList[index];
}
function _getAllThreadInfoSimulated( jvm ) {
  var resultList = [];
  // { id: 0, name: 'checkOnThread', pc: 1, timestamp: 000, status: 'ready',     queue: 'stepbystep' },
  // { id: 0, name: 'checkOnThread', pc: 2, timestamp: 000, status: 'suspended', queue: 'slow', suspendedOn: 'jsen_sleep' },
  // { id: 0, name: 'checkOnThread', pc: 3, timestamp: 000, status: 'suspended', queue: 'fast', suspendedOn: 'jsen_on', condition:'()=> isAlive' },
  const threadStatusList = [
    { id: 0, name: 'checkOnThread' },
    { id: 1, name: 'Meisy.sensorLoop' },
    { id: 2, name: 'Alex.sensorLoop' },
    { id: 3, name: 'Meisy.testingLoop' },
    { id: 4, name: 'Alex.testingLoop' },
    { id: 5, name: 'Alex.inputCheck' },
    { id: 6, name: 'Meisy.mainLoop' },
    { id: 7, name: 'Alex.mainLoop' },
    { id: 8, name: 'Tom.mainLoop' },
    { id: 9, name: 'Tom.inputCheck' },
    { id: 10, name: 'Tom.sensorCheck' },
    { id: 11, name: 'Tom.loadingCheck' },
  ];
  const queueList = [ 'fast', 'slow', 'stepbystep' ];
  const suspendedCondList = [ '()=> isActive', '()=> isSetConstraints == true', '()=> isInputRead && isAlexVisible' ];
  const suspendedOn = [ 'jsen_on', 'jsen_sleep' ];

  
  for( const threadInfo of threadStatusList ) {
    var result = threadInfo;
    result['pc'] = _getRandomChoice( [0, 1, 2, 3] );
    result['timeStamp'] = new Date();
    result['status'] = 'running';
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
function _getThreadLog( threadId ) {
  var result = [];
  const numLines = Math.floor( Math.random()*30 );
  for( let i = 0; i < numLines; ++i )
    result.push( _getThreadLogSimulation( threadId ) );
  return result;
}
function _getThreadLogSimulation( threadId ) {
  const code = [ 
  '03/2208:51:01 INFO   :.main: *************** RSVP Agent started *************** 02 ',
  '03/2208:51:01 INFO   :...locate_configFile: Specified configuration file: /u/user10/rsvpd1.conf ',
  '03/2208:51:01 INFO   :.main: Using log level 511 ',
  '03/2208:51:01 INFO   :..settcpimage: Get TCP images rc - EDC8112I Operation not supported on socket. 03  ',
  '03/2208:51:01 INFO   :..settcpimage: Associate with TCP/IP image name = TCPCS ',
  '03/2208:51:02 INFO   :..reg_process: registering process with the system ',
  '03/2208:51:02 INFO   :..reg_process: attempt OS/390 registration ',
  '03/2208:51:02 INFO   :..reg_process: return from registration rc=0 ',
  '03/2208:51:06 TRACE  :...read_physical_netif: Home list entries returned = 7 ',
  '03/2208:51:06 INFO   :...read_physical_netif: index #0, interface VLINK1 has address 129.1.1.1, ifidx 0 ',
  '03/2208:51:06 INFO   :...read_physical_netif: index #1, interface TR1 has address 9.37.65.139, ifidx 1 ',
  '03/2208:51:06 INFO   :...read_physical_netif: index #2, interface LINK11 has address 9.67.100.1, ifidx 2 ',
  '03/2208:51:06 INFO   :...read_physical_netif: index #3, interface LINK12 has address 9.67.101.1, ifidx 3 ',
  '03/2208:51:06 INFO   :...read_physical_netif: index #4, interface CTCD0 has address 9.67.116.98, ifidx 4 ',
  '03/2208:51:06 INFO   :...read_physical_netif: index #5, interface CTCD2 has address 9.67.117.98, ifidx 5 ',
  '03/2208:51:06 INFO   :...read_physical_netif: index #6, interface LOOPBACK has address 127.0.0.1, ifidx 0 ',
  '03/2208:51:06 INFO   :....mailslot_create: creating mailslot for timer ',
  '03/2208:51:06 INFO   :...mailbox_register: mailbox allocated for timer ',
  '03/2208:51:06 INFO   :.....mailslot_create: creating mailslot for RSVP ',
  '03/2208:51:06 INFO   :....mailbox_register: mailbox allocated for rsvp ',
  '03/2208:51:06 INFO   :.....mailslot_create: creating mailslot for RSVP via UDP ',
  '03/2208:51:06 WARNING:.....mailslot_create: setsockopt(MCAST_ADD) failed - EDC8116I Address not available. ',
  '03/2208:51:06 INFO   :....mailbox_register: mailbox allocated for rsvp-udp ',
  '03/2208:51:06 TRACE  :..entity_initialize: interface 129.1.1.1, entity for rsvp allocated and initialized ',
  '03/2208:51:06 INFO   :.....mailslot_create: creating mailslot for RSVP ',
  '03/2208:51:06 INFO   :....mailbox_register: mailbox allocated for rsvp ',
  '03/2208:51:06 INFO   :.....mailslot_create: creating mailslot for RSVP via UDP ',
  '03/2208:51:06 WARNING:.....mailslot_create: setsockopt(MCAST_ADD) failed - EDC8116I Address not available. ',
  '03/2208:51:06 INFO   :....mailbox_register: mailbox allocated for rsvp-udp ',
  '03/2208:51:06 TRACE  :..entity_initialize: interface 9.37.65.139, entity for rsvp allocated and initialized ',
  '03/2208:51:06 INFO   :.....mailslot_create: creating mailslot for RSVP ',
  '03/2208:51:06 INFO   :....mailbox_register: mailbox allocated for rsvpv ',
  '03/2208:51:06 INFO   :.....mailslot_create: creating mailslot for RSVP via UDP ',
  '03/2208:51:06 WARNING:.....mailslot_create: setsockopt(MCAST_ADD) failed - EDC8116I Address not available. ',
  '03/2208:51:06 INFO   :....mailbox_register: mailbox allocated for rsvp-udp ',
  '03/2208:51:06 TRACE  :..entity_initialize: interface 9.67.100.1, entity for rsvp allocated and initialized ',
  '03/2208:51:06 INFO   :.....mailslot_create: creating mailslot for RSVP ',
  '03/2208:51:06 INFO   :....mailbox_register: mailbox allocated for rsvp ',
  '03/2208:51:06 INFO   :.....mailslot_create: creating mailslot for RSVP via UDP ',
  '03/2208:51:06 WARNING:.....mailslot_create: setsockopt(MCAST_ADD) failed - EDC8116I Address not available. ',
  '03/2208:51:06 INFO   :....mailbox_register: mailbox allocated for rsvp-udp ',
  '03/2208:51:06 TRACE  :..entity_initialize: interface 9.67.101.1, entity for rsvp allocated and initialized ',
  '03/2208:51:06 INFO   :.....mailslot_create: creating mailslot for RSVP ',
  '03/2208:51:06 INFO   :....mailbox_register: mailbox allocated for rsvp ',
  '03/2208:51:06 INFO   :.....mailslot_create: creating mailslot for RSVP via UDP ',
  '03/2208:51:06 INFO   :....mailbox_register: mailbox allocated for rsvp-udp ',
  '03/2208:51:06 TRACE  :..entity_initialize: interface 9.67.116.98, entity for rsvp allocated and initialized ',
  '03/2208:51:06 INFO   :.....mailslot_create: creating mailslot for RSVP ',
  '03/2208:51:06 INFO   :....mailbox_register: mailbox allocated for rsvp ',
  '03/2208:51:06 INFO   :.....mailslot_create: creating mailslot for RSVP via UDP ',
  '03/2208:51:06 INFO   :....mailbox_register: mailbox allocated for rsvp-udp ',
  '03/2208:51:06 TRACE  :..entity_initialize: interface 9.67.117.98, entity for rsvp allocated and initialized ',
  ];
  
  return _getRandomChoice( code );
}
function _updateAllThreasInfo( status ) {  
  // Reset containers
  $('#threadList tbody').empty();
  
  // loop over data
  for( const threadInfo of status ) {
    // Compute status color
    //const threadHTMLId = threadInfo.name.replace( '.', '_' );    
    // Add thread in the menu
    const html = '<tr onclick="_addThreadLogDiv('+threadInfo.id+', \''+threadInfo.name+'\')">'+
          '<td>'+threadInfo.name+'</td>'+
          '<td>('+threadInfo.id+')</td></tr>';
    $('#threadList').append( html );

    // Add threadInfo in threadLogBuffer
    threadLogBuffer[threadInfo.id] = {
      name: threadInfo.name,
      logCounter: -1,
      logLineList: [],
      isLogEnabled: true,
      logLevel: 5,
      isShowErrors: true,
      isShowWarning: true,
      isShowInfo: true,
      isHighlightPattern: false,
      highlightPattern: '',
    };

    // Initialize log with available log (if there is one)
    const threadLogLineList = _getThreadLog( threadInfo.id );
    for( const threadLogLine of threadLogLineList ) {
      _appendThreadLogBuffer( threadInfo.id, threadLogLine )
    }
    
    // Make sure that the menu are fully open
    $('.collapsible').click();
    $('.collapsible').click();
  }
}
function _appendThreadLogBuffer( threadId, threadLogLine ) {
  if( threadLogBuffer[threadId].logLineList.length > maxLenLogBuffer ) {
    // Remove log line from buffer
    threadLogBuffer[threadId].logLineList.shift();
  }
  ++threadLogBuffer[threadId].logCounter;
  threadLogBuffer[threadId].logLineList.push( threadLogLine );
}
function _appendThreadLogDiv( threadId, threadLogLine ) {
  const threadLogTableId = 'threadLogTable_'+threadId;
  const divLogLines = $('#'+threadLogTableId+' tr');
  const numDivLines = divLogLines.length;
  if( numDivLines > 0 ) {
    if( numDivLines > maxLenDivLogLines ) {
      const numLinesToDelete = numDivLines-maxLenDivLogLines;
      for( let i = 0; i < numLinesToDelete; ++i ) {
        // Remove log line from div
        divLogLines[0].remove();
      }
    }
  }
  const logCounter = ++threadLogBuffer[threadId].logCounter;
  const html = '<tr id="threadLogLine_'+threadId+'_'+logCounter+'"><td>'+threadLogLine;
  $('#'+threadLogTableId).append(html);
}
function _setupDragElement(elmnt) {
  let positionX1 = 0;
  let positionY1 = 0;
  let positionX2 = 0;
  let positionY2 = 0;
  elmnt.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    positionX2 = e.clientX;
    positionY2 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    positionX1 = positionX2 - e.clientX;
    positionY1 = positionY2 - e.clientY;
    positionX2 = e.clientX;
    positionY2 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - positionY1) + "px";
    elmnt.style.left = (elmnt.offsetLeft - positionX1) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
function _setupCollapsableThreadsMenu()
{
  const coll = document.getElementsByClassName("collapsible");

  for ( const menuEntry of coll ) {
    menuEntry.addEventListener("click", function() {
      this.classList.toggle("active");
      var content = this.nextElementSibling;
      if (content.style.maxHeight){
        content.style.maxHeight = null;
      } else {
        content.style.maxHeight = content.scrollHeight + "px";
      } 
    });
  }
}

// =============================
// Behavior when Document Ready
// =============================

// Excecute after DOM is loaded
$(document).ready(function()
{
  // Toggler customization setting
  var toggleButtonsWest	= '<div class="btnClose-west"></div>'
                        + '<div class="btnOpen-west"></div>';
  var toggleButtonsEast	= '<div class="btnClose-east"></div>'
                        + '<div class="btnOpen-east"></div>';
	
	// Define parameters
	var northRegionHeight = 30+'';
	var westRegionWidth = 250+'px';
	var eastRegionWidth = 30+'%';
	var southRegionHeight = 200+'';
  
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
    ,	west__spacing_closed:         8
    ,	west__spacing_open:           8
    ,	west__togglerLength_closed:   70
    ,	west__togglerLength_open:     70
    ,	west__togglerContent_closed:	toggleButtonsWest
    ,	west__togglerContent_open:		toggleButtonsWest
    ,	east__spacing_closed:         8
    ,	east__spacing_open:           8
    ,	east__togglerLength_closed:   70
    ,	east__togglerLength_open:     70
    ,	east__togglerContent_closed:	toggleButtonsEast
    ,	east__togglerContent_open:		toggleButtonsEast
    , onresize: function () 
        {
          ckEditor.resize( $('#ckEditor').parent().width(),
                           $('#ckEditor').parent().height(), false );
          aceEditor.resize();
        }
    }
  );

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
	//myLayout.close("west");
  // The instanceReady event is fired, when an instance of CKEditor has finished
  // its initialization.
  CKEDITOR.on( 'instanceReady', function( ev ) 
                {
                  ckEditor = ev.editor;
                  $("#cke_ckEditor").hide();
                }
              );
  // Create editor
  aceEditor = ace.edit("aceEditor");
  
  // Set editor theme
  aceEditor.setTheme('ace/theme/tomorrow_night');
  
  // Set default mode to text
  aceEditor.getSession().setMode("ace/mode/javascript");
  
  // Set soft tab to 2 spaces
  aceEditor.getSession().setUseSoftTabs(true);
  aceEditor.getSession().setTabSize(2);
  aceEditor.getSession().on('change', aceEditorChanged );
  //$("#aceEditor").hide();
  // Open left menu
  _setupJSENStreamer();
  $('.collapsible').click();
});


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
// Set star in title
function setStarInTitle( isDocumentModified )
{
  // Get position of star in document title
  var idx = document.title.indexOf('*');
  
  if ( isDocumentModified ) {
    // If star is not present ==> we add one
    if ( idx < 0 ) {
      document.title += '*';
    }
  }
  else {
    // If star is present ==> we remove it
    if ( idx >= 0 ) {
      document.title = document.title.substr( 0, idx );
    }
  }
}

/*
  NOTE: here some function for editor events
  
  ckEditor.removeListener( 'change', ckEditorChanged );
  // Hide editor
  $("#cke_ckEditor").hide();

  // Unegister change event on ace editor
  aceEditor.getSession().removeListener( 'change', aceEditorChanged );
  
  
  // Register change event
  ckEditor.on( 'change', ckEditorChanged );
  // Show editor
  $("#cke_ckEditor").show();

  // Register change event on ace editor
  aceEditor.getSession().on('change', aceEditorChanged );
  // Show ace editor
  $("#aceEditor").show();
*/
  
// Editor change function
function ckEditorChanged(e)
{ 
  global_userCodeChanged = true;
  
  // Editor changed
  //setSaveSourceCodeTimer();
}
// Editor change function
function aceEditorChanged(e)
{ 
  global_userCodeChanged = true;
  
  // Editor changed
  setSaveSourceCodeTimer();
}
function setSaveSourceCodeTimer()
{
  var savingTimeout = 5000;
  
  if ( isSaveSourceCodeRequired ) {
    clearTimeout( saveSourceCodeRequestID );
  }
  else {
    setSaveSourceCodeRequired( true );
  }
  
  // Register timer for saving action
  saveSourceCodeRequestID = setTimeout( scheduleSaveSourceCodeAction, savingTimeout );
}
function scheduleSaveSourceCodeAction()
{
  setSaveSourceCodeRequired( false );
  
  // Save editor source
  //saveLBUserCode();
}
function setSaveSourceCodeRequired( status )
{
  // Global variable
  isSaveSourceCodeRequired = status;
  
  // Set star in window title
  setStarInTitle( status )
}
function setStarInTitle( isDocumentModified )
{
  // Get position of star in document title
  var codeFileName = $( '#editorCodeFileName' ).text();
  var idx = codeFileName.indexOf('*');
  
  if ( isDocumentModified ) {
    // If star is not present ==> we add one
    if ( idx < 0 ) {
      codeFileName += '*';
      $( '#editorCodeFileName' ).text( codeFileName );
    }
  } else {
    // If star is present ==> we remove it
    if ( idx >= 0 ) {
      codeFileName = codeFileName.substr( 0, idx );
      $( '#editorCodeFileName' ).text( codeFileName );
    }
  }
}
function getEditorMode( codeType )
{
  switch( codeType.toLowerCase() ) {
    case 'undefined':
    case 'text':
      return 'ace/mode/text';
    //  break;
    case 'html':
      return 'ace/mode/html';
    //  break;
    case 'scss':
      return 'ace/mode/scss';
    //  break;
    case 'js':
      return 'ace/mode/javascript';
    //  break;
    case 'php':
      return 'ace/mode/php';
    //  break;
    case 'py':
      return 'ace/mode/python';
    //  break;
    case 'c':
      return 'ace/mode/c_cpp';
    //  break;
    case 'h':
      return 'ace/mode/c_cpp';
    //  break;
    case 'hpp':
      return 'ace/mode/c_cpp';
    //  break;
    case 'cpp':
      return 'ace/mode/c_cpp';
    //  break;
    case 'java':
      return 'ace/mode/java';
    //  break;
    default:
      return 'ace/mode/'+codeType;
  }
}
function callServerFunction( functionName, data, isAsync, resultFunction )
{
	// Prepare server request in synchronous mode
	var request = {
                  'type': 'POST',
                  'url': '../php/'+functionName+'.php',
                  'dataType': 'json',    // Format of result of Ajax request
                  'data': data,          // Server function parameters
                  'async': isAsync
                };
  
  // Contact the server
  if( isAsync ) {
    $.ajax( request ).done( function( response ) 
                            { 
                              processServerResponse( response, functionName, isAsync, resultFunction );
                            }
                          );
    return '';
  }
  else {
    var requestResult = $.ajax( request );
    return processServerResponse( requestResult.responseJSON, functionName, isAsync, resultFunction );
  }
}
function processServerResponse( requestResult, functionName, isAsync, resultFunction )
{
  var result = null;
  
  // If server send error message in data field
  if ( requestResult.status == 'ko' )   {
    alert( 'Error in calling server.'+functionName+'\n'+requestResult.data );
  }
  else { // Return and make asynchronous call
    result = requestResult.data;
    
    if( isAsync && resultFunction ) {
      resultFunction( result );
    }
  }
  
	return result;
}


