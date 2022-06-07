/*
 *  JZENVM porting to Java
 *  Limitation: currently blocks [] are not supported
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

import java.util.*;
import java.util.concurrent.TimeUnit;

class JSENCommand implements JSENCode {
  String callName;
  Object params;
  public JSENCommand( String callName, Object params ) {
    this.callName = callName;
    this.params = params;
  }
  public void exec() {};
}

//JZENCode c = ()-> System.out.println( "Test" );
//c.exec();
interface JSENCode {
  JSENCommand command = null;
  void exec();
}

interface JSENCondition {
  boolean eval();
}

class JZENContext {
  JSENCode[] code;
  int pc;
  Map<String, Integer> labelList;
  Map<String, String> varList;
  
  public JZENContext( JSENCode[] jzenCode ) {
    this.code = jzenCode;
    this.pc = 0;
    this.labelList = new HashMap<String, Integer>();
    this.labelList.put( "beginThread", 0 );
    this.labelList.put( "endThread", jzenCode.length );
    
    this.varList = new HashMap<String, String>();
    this.varList.put( "vm", "" );
  }
}

class JZEN {
  JZENContext threadContext = null;
  
  public static void main(String[] args) {
    TestSuit.runTest();
    /**-/
    Timer t = new Timer();
    JZEN j = new JZEN();
    System.out.println( "Before schedule" );
    t.schedule( new TimerTask() {
      @Override
      public void run() {
        j.print();
        //System.out.println( "This the first test" );
      }
    }, 2000 );
    System.out.println( "After schedule" );
    /-**/
  }
  
  public void print() {
    System.out.println( "This is a second test" );
  }
  
  // Main function to run jzen code
  public void run( JSENCode[] jzenCode ) {
    this.threadContext = new JZENContext( jzenCode );
    this.stepRun();
  }
  
  // Function to execute a jzen context in steps
  private void stepRun() {
    // While we are not at the end of the code
    JSENCode[] jzenCode = this.threadContext.code;
    int jzenCodeLen = jzenCode.length;
    while( this.threadContext.pc < jzenCodeLen ) {
      // Get next statement
      JSENCode codeStatement = jzenCode[this.threadContext.pc];
      if( !(codeStatement instanceof JSENCommand) ) { // Case of code like: ()-> System.out.println( "msg" ),
        codeStatement.exec();
      } else if( codeStatement instanceof JSENCommand ) {  // Case of jzen statement like: jsen_print( "message" ),
        JSENCommand command = (JSENCommand)codeStatement;
        switch ( command.callName ) {
          case "jsen_comment":  // Case of comment like: jsen_comment( "This is a comment" ),
            break;
          case "jsen_sleep":  // Suspend execution for sleep timeout
            Timer timer = new Timer();
            float timeout = ((Float)(command.params)).floatValue();
            long timeoutMs = (long)(timeout*1000);
            timer.schedule( new TimerTask() {
                              @Override
                              public void run() {
                                JZEN.this.stepRun();
                              }
                            }, timeoutMs );
            return;
          case "jsen_print":  // Print a message in console
            Object message = command.params;
            System.out.println( message );
            break;
          case "jsen_if":  // Evaluate condition
            JSENCondition condition = (JSENCondition)command.params;
            this.threadContext.pc = ( condition.eval()? this.threadContext.pc:
                          this.threadContext.pc+1 );
            break;
          case "jsen_label":  // Store label position
            String newLabelName = (String)command.params;
            this.threadContext.labelList.put( newLabelName, this.threadContext.pc );
            break;
          case "jsen_goto":  // Jump to label
            String labelName = (String)command.params;
            int labelPc = this.threadContext.labelList.get( labelName );
            if( labelPc >= 0 )
              this.threadContext.pc = labelPc;
            break;
          default:
            break;
        }
      }
      ++this.threadContext.pc;
    }
  }
}

class JSENCl {
  public static JSENCommand jsen_sleep( float timeout ) {
    return new JSENCommand( "jsen_sleep", new Float( timeout ) );
  }
  public static JSENCommand jsen_print( Object msg ) {
    return new JSENCommand( "jsen_print", msg );
  }
  public static JSENCommand jsen_if( JSENCondition condition ) {
    return new JSENCommand( "jsen_if", condition );
  }
  public static JSENCommand jsen_label( String label ) {
    return new JSENCommand( "jsen_label", label );
  }
  public static JSENCommand jsen_goto( String label ) {
    return new JSENCommand( "jsen_goto", label );
  }
  public static JSENCommand jsen_comment( String comment ) {
    return new JSENCommand( "jsen_comment", comment );
  }
}

class TestSuit extends JSENCl {
  static int i;
  public static void runTest() {
    String testName = "testSleep";
    JZEN jvm = new JZEN();
    
    i = 0;
    switch ( testName ) {
      case "testCode": {
        JSENCode[] code = {
          ()-> System.out.println( "Start" ),
          jsen_if( ()-> i == 0 ),
            jsen_print( "Condition true" ),
          ()-> i = 1,
          jsen_if( ()-> i == 0 ),
              jsen_print( "i is still 0" ),
          jsen_if( ()-> i == 1 ),
              jsen_print( "i is now 1" ),
          ()-> System.out.println( "End" ),
        };
        jvm.run( code );
        break;
      }
      case "testComment": {
        JSENCode[] code = {
          ()-> System.out.println( "Start" ),
          ()-> System.out.println( "Line 1" ),
          jsen_comment( "This is a comment" ),
          ()-> System.out.println( "Line 2" ),
          ()-> System.out.println( "End" ),
        };
        jvm.run( code );
        break;
      }
      /*case "testBlock": {
        JSENCode[] code = {
          jsen_print( "Start" ),
          jsen_print( "first line" ),
          [
            jsen_print( "inside block 1" ),
            jsen_print( "inside block 2" ),
            jsen_print( "inside block 3" ),
          ],
          jsen_print( "second line" ),
          jsen_print( "End" ),
        };
        jvm.run( code );
        break;
      }*/
      case "testPrint": {
        JSENCode[] code = {
          jsen_print( "Start" ),
          jsen_print( "Line 1" ),
          jsen_print( "Line 2" ),
          jsen_print( "Line 3" ),
          jsen_print( "End" ),
        };
        jvm.run( code );
        break;
      }
      case "testIf": {
        JSENCode[] code = {
          ()-> System.out.println( "Start" ),
          jsen_if( ()-> i == 0 ),
            jsen_print( "i is still 0" ),
          jsen_if( ()-> i == 1 ),
              jsen_print( "i is now 1" ),
          ()-> System.out.println( "End" ),
        };
        jvm.run( code );
        break;
      }
      case "testLabel": {
        JSENCode[] code = {
          jsen_print( "Start" ),
          jsen_print( "Before label" ),
          jsen_label( "loop" ),
          jsen_print( "After label" ),
          jsen_print( "End" ),
        };
        jvm.run( code );
        break;
      }
      case "testAssignment": {
        JSENCode[] code = {
          ()-> System.out.println( "Start" ),
          ()-> System.out.println( "Value of i = "+i ),
          ()-> i = 5,
          ()-> System.out.println( "Value of i = "+i ),
          ()-> System.out.println( "End" ),
        };
        jvm.run( code );
        break;
      }
      case "testGoto": {
        JSENCode[] code = {
          jsen_print( "Start" ),
          jsen_print( "Before loop" ),
          jsen_label( "loop" ),
            ()-> ++i,
            ()-> System.out.println( "i = "+i ),
            jsen_if( ()-> i < 10 ),
              jsen_goto( "loop" ),
          jsen_print( "After loop" ),
          jsen_print( "End" ),
        };
        jvm.run( code );
        break;
      }
      case "testSleep": {
        JSENCode[] code = {
          jsen_print( "Start" ),
          jsen_print( "Now sleep for 2 seconds" ),
          jsen_sleep( 2 ),
          jsen_print( "Woken up" ),
          jsen_print( "End" ),
        };
        jvm.run( code );
        break;
      }
      default: {
        JSENCode[] code = {
          jsen_print( "testName not found: "+testName ),
        };
        jvm.run( code );
        break;
      }
    }
  }
}
