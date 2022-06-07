/*
 *  Browser example with JSEN
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

// ACE Editor Global Variables
let aceEditor1 = ace.edit( "aceEditor1" );
let aceEditor2 = ace.edit( "aceEditor2" );
let aceEditor3 = ace.edit( "aceEditor3" );

// Set editors theme and language
let editorList = [ aceEditor1, aceEditor2, aceEditor3 ];
for ( const editor of editorList ) {
	// Set editor theme (twilight tomorrow_night_eighties tomorrow_night)
	editor.setTheme('ace/theme/monokai'); 
	// Set default mode to text
	editor.getSession().setMode("ace/mode/javascript");
}

// Function for selecting a line in an editor
let selectEditorLine = ( editor, line, lastLine )=> {
	editor.selection.moveCursorToPosition( { row: line, column: 0 } );
	editor.selection.selectLine();
	editor.session.clearBreakpoint( lastLine );
	editor.session.setBreakpoint( line );
}

// Instantiate JSEN Virtual Machine
let jvm = new JSENVM();

// First thread
let i1 = 0;
let len1 = 3;
let lastLine1 = -1;
let selectionRunner1 = [
	'This example make Ace line selection',
	'from top to bottom',
	jsen_loop(),
	[
		()=> selectEditorLine( aceEditor1, i1, lastLine1 ),
		()=> lastLine1 = i1,
		()=> ++i1,
		jsen_if( ()=> i1 == len1 ),
			()=> i1 = 0,
		jsen_sleep( 0.5 ),
	],
];
// Second thread
let i2 = 0;
let len2 = 3;
let lastLine2 = -1;
let selectionRunner2 = [
	'This example make Ace line selection',
	'from bottom to top',
	jsen_loop(),
	[
		()=> selectEditorLine( aceEditor2, i2, lastLine2 ),
		()=> lastLine2 = i2,
		()=> --i2,
		jsen_if( ()=> i2 < 0 ),
			()=> i2 = len2-1,
		jsen_sleep( 1 ),
	],
];
// Third thread
let i3 = 0;
let len3 = 3;
let lastLine3 = 0;
let selectionRunner3 = [
	'This example randomly select',
	'Ace editor lines',
	jsen_loop(),
	[
		()=> i3 = Math.floor( Math.random()*len3 ),
		()=> selectEditorLine( aceEditor3, i3, lastLine3 ),
		()=> lastLine3 = i3,
		jsen_sleep( 1.5 ),
	],
];

// Create thread1 and get source code
let threadId1 = jvm.newThread( 'runner1', selectionRunner1 );
let source1 = getThreadFullSource( threadId1, 1 );
len1 = source1.length;
// Create thread2 and get source code
let threadId2 = jvm.newThread( 'runner2', selectionRunner2 );
let source2 = getThreadFullSource( threadId2, 2 );
len2 = source2.length;
// Create thread3 and get source code
let threadId3 = jvm.newThread( 'runner3', selectionRunner3 );
let source3 = getThreadFullSource( threadId3, 3 );
len3 = source3.length;

// Set editor sources
aceEditor1.setValue( source1.join( '\n' ), -1 );
aceEditor2.setValue( source2.join( '\n' ), -1 );
aceEditor3.setValue( source3.join( '\n' ), -1 );

// Set editor lines to first line
selectEditorLine( aceEditor1, 0 );
selectEditorLine( aceEditor2, 0);
selectEditorLine( aceEditor3, 0 );

// Start threads
jvm.startThread( threadId1 );
jvm.startThread( threadId2 );
jvm.startThread( threadId3 );

// Function to get full source code (JSEN + context)
function getThreadFullSource( threadId, index ) {
	// Get thread source code
	let source = jvm.getThreadSourceCode( threadId );
	// Indent code
	for( const i in source ) {
		source[i] = '  '+source[i];
	}
	// Embed code with context
	const len = source.length;
	const result = [
		'let i'+index+' = 0;',
		'let len'+index+' = '+(len+5)+';',
		'let lastLine'+index+' = -1;',
		'let selectionRunner'+index+' = [',
		...source,
		'];',
	];
	// Return code
	return result;
}