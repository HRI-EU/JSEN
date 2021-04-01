/*
 *  Second browser example with JSEN
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

// Instantiate JSEN Virtual Machine
let jvm = new JSENVM();

// Get ball object
let ball = document.getElementById( 'ball' );

// Size thread
let size = 40;
let incrementSize = 1;
let startSize = 40;
let endSize = 80;
let changeSize = [
	jsen_loop(),
	[
		()=> size += incrementSize,
		()=> ball.style.width = size+'px',
		()=> ball.style.height = size+'px',
		jsen_if( ()=> size >= endSize ||
		          size <= startSize  ),
		[
			()=> incrementSize = -incrementSize,
		],
		jsen_sleep( 0.1 ),
	],
];
// Horizontal thread
let positionX = 4;
let incrementX = 3;
let startX = 4;
let endX = 840;
let moveHorizontal= [
	jsen_loop(),
	[
	    ()=> positionX += incrementX,
		()=> ball.style.left = positionX+'px',
		jsen_if( ()=> ( ( positionX >= endX-size ) &&
                    ( incrementX > 0 ) ) ||
		          ( ( positionX <= startX  ) &&
				    ( incrementX < 0 ) ) ),
		[
			()=> incrementX = -incrementX,
		],
		jsen_sleep( 0.05),
	],
];
// Vertical thread
let positionY = 0;
let incrementY = 3;
let startY = 0;
let endY = 200;
let moveVertical = [
	jsen_loop(),
	[
		()=> positionY += incrementY,
		()=> ball.style.top = positionY+'px',
		jsen_if( ()=> ( ( positionY >= endY-size ) &&
		            ( incrementY > 0 ) ) ||
		          ( ( positionY <= startY  ) &&
				    ( incrementY < 0 ) ) ),
		[
			()=> incrementY = -incrementY,
		],
		jsen_sleep( 0.05 ),
	],
];

// Create thread1 and get source code
let threadId1 = jvm.newThread( 'moveHorizontal', moveHorizontal );
let source1 = getThreadFullSource( threadId1, 'moveHorizontal', 1 );
len1 = source1.length;
// Create thread2 and get source code
let threadId2 = jvm.newThread( 'moveVertical', moveVertical );
let source2 = getThreadFullSource( threadId2, 'moveVertical', 2 );
len2 = source2.length;
// Create thread3 and get source code
let threadId3 = jvm.newThread( 'changeSize', changeSize );
let source3 = getThreadFullSource( threadId3, 'changeSize', 3 );
len3 = source3.length;

// Set editor sources
aceEditor1.setValue( source1.join( '\n' ), -1 );
aceEditor2.setValue( source2.join( '\n' ), -1 );
aceEditor3.setValue( source3.join( '\n' ), -1 );

// Start threads
//jvm.startThread( threadId1 );
//jvm.startThread( threadId2 );
//jvm.startThread( threadId3 );

// Function to get full source code (JSEN + context)
function getThreadFullSource( threadId, threadName, index ) {
	// Get thread source code
	let source = jvm.getThreadSourceCode( threadId );
	// Indent code
	for( const i in source ) {
		source[i] = '  '+source[i];
	}
	// Embed code with context
	const len = source.length;
	const result = [
		'let '+threadName+' = [',
		...source,
		'];',
	];
	// Return code
	return result;
}