#!/usr/bin/python
"""
 *  JZEN Virtual Machine in Python
 *  Limitation: assignment to variables need to be done by jsen_assign()
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
"""

import threading

# Main function to run jzen code
def JZEN_run( jzenCode ):
    threadContext = {
        'code': jzenCode,
        'pc': 0,
        'labelList': {
            'beginThread': 0,
            'endThread': len(jzenCode),
        },
        'varList': {
            'vm': None,
        },
    }
    threadContext['varList']['vm'] = threadContext
    JZEN_stepRun( threadContext )

# Function to execute a jzen context in steps
def JZEN_stepRun( threadContext ):
    # While we are not at the end of the code
    jzenCode = threadContext['code']
    jzenCodeLen = len( jzenCode )
    while( threadContext['pc'] < jzenCodeLen ):
        # Get next statement
        codeStatement = jzenCode[ threadContext['pc'] ]
        if callable( codeStatement ): # Case of code like: lambda: print( 'message' )
            codeStatement()
        elif isinstance( codeStatement, str ) or \
                 codeStatement is None:                        # Case of comment like: "This is a comment",
                                                                                    # Case of comment like: ,
            pass # nothing to do
        elif type( codeStatement ) is list:  # Case of block like: [ ... ],
            JZEN_run( codeStatement )
        elif isinstance( codeStatement, dict ):  # Case of jzen statement like: jsen_print( 'message' ),
            if codeStatement['callName'] == 'jsen_sleep': # Suspend execution for sleep timeout
                timeout = codeStatement['params']
                threadContext['pc'] += 1
                timer = threading.Timer( timeout, JZEN_stepRun, args=[ threadContext ] ) 
                timer.start() 
                return
            elif codeStatement['callName'] == 'jsen_print': # Print a message in console
                message = codeStatement['params']
                print( message )
            elif codeStatement['callName'] == 'jsen_if': # Evaluate condition
                condition = codeStatement['params']
                threadContext['pc'] = threadContext['pc'] if condition() else threadContext['pc']+1
            elif codeStatement['callName'] == 'jsen_label': # Store label position
                newLabelName = codeStatement['params']
                threadContext['labelList'][newLabelName] = threadContext['pc']
            elif codeStatement['callName'] == 'jsen_goto': # Jump to label
                labelName = codeStatement['params']
                labelPc = threadContext['labelList'][labelName]
                if( labelPc is not None ):
                    threadContext['pc'] = labelPc
            elif codeStatement['callName'] == 'jsen_assign': # Assign a variable to a value
                variableName = codeStatement['params']
                variableValue = codeStatement['valueFunc']()
                assignmentExpr = 'global '+variableName+'\n'+variableName+' = '+str( variableValue )
                exec( assignmentExpr )
        threadContext['pc'] += 1

def jsen_sleep( params ):
    return {
        'callName': 'jsen_sleep',
        'params': params,
    }

def jsen_print( msg ):
    return {
        'callName': 'jsen_print',
        'params': msg,
    }

def jsen_if( params ):
    return {
        'callName': 'jsen_if',
        'params': params,
    }

def jsen_label( params ):
    return {
        'callName': 'jsen_label',
        'params': params,
    }

def jsen_goto( params ):
    return {
        'callName': 'jsen_goto',
        'params': params,
    }

def jsen_assign( variableName, value ):
    return {
        'callName': 'jsen_assign',
        'params': variableName,
        'valueFunc': value,
    }


## Test Example

i = 0;
testCode = [
    lambda: print( 'Start' ),
    jsen_if( lambda: i == 0 ),
        jsen_print( 'Condition true' ),
    jsen_assign( 'i', lambda: 1 ),
    jsen_if( lambda: i == 0 ),
            jsen_print( 'i is still 0' ),
    jsen_if( lambda: i == 1 ),
            jsen_print( 'i is now 1' ),
    lambda: print( 'End' ),
]

testComment = [
    lambda: print( 'Start' ),
    lambda: print( 'first line' ),
    'this is a comment',
    lambda: print( 'second line' ),
    'this is another comment',
    lambda: print( 'End' ),
]

testBlock = [
    lambda: print( 'Start' ),
    lambda: print( 'first line' ),
    [
        lambda: print( 'inside block 1' ),
        lambda: print( 'inside block 2' ),
        lambda: print( 'inside block 3' ),
    ],
    lambda: print( 'second line' ),
    lambda: print( 'End' ),
]

testPrint = [
    jsen_print( 'Start' ),
    jsen_print( 'Line 2' ),
    jsen_print( 'Line 3' ),
    jsen_print( 'Line 4' ),
    jsen_print( 'End' ),
]

testIfVar = 0
testIf = [
    lambda: print( 'Start' ),
    jsen_assign( 'testIfVar', 1 ),
    jsen_if( lambda: testIfVar == 0 ),
            jsen_print( 'testIfVar is still 0' ),
    jsen_if( lambda: testIfVar == 1 ),
            jsen_print( 'testIfVar is now 1' ),
    lambda: print( 'End' ),
]

testLabel = [
    lambda: print( 'Start' ),
    lambda: print( 'Before label' ),
    jsen_label( 'loop' ),
    lambda: print( 'After label' ),
    lambda: print( 'End' ),
]

testAssignVar = 0
testAssign = [
    lambda: print( 'Start' ),
    lambda: print( 'testAssignVar is '+str( testAssignVar ) ),
    jsen_assign( 'testAssignVar', lambda: testAssignVar+1 ),
    lambda: print( 'testAssignVar is now '+str( testAssignVar ) ),
    lambda: print( 'End' ),
]

testGotoVar = 0
testGoto = [
    lambda: print( 'Start' ),
    lambda: print( 'Before loop' ),
    jsen_label( 'loop' ),
        jsen_assign( 'testGotoVar', lambda: testGotoVar+1 ),
        lambda: print( 'testGotoVar = '+str( testGotoVar ) ),
        jsen_if( lambda: testGotoVar < 10 ),
            jsen_goto( 'loop' ),
    lambda: print( 'After loop' ),
    lambda: print( 'End' ),
]

testSleep = [
    jsen_print( 'Start' ),
    jsen_print( 'Now sleep for 2 seconds' ),
    jsen_sleep( 2.0 ),
    jsen_print( 'Woken up' ),
    jsen_print( 'End' ),
]

JZEN_run( testBlock )
