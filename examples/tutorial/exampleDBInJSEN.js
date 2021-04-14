/*
 * Example of DataBase access in both pure JavaScript and JSEN
 * NOTE: This example is not meant to be executable, but just
 *       a demonstration on the usage of JSEN
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

class ExecuteDBActionsInJSEN extends JSENThreadClass {
  constructor( instanceName ) {
    super( instanceName );

    // Instantiate the Receptionist Database
    $L().registerNewInstanceOf(ReceptionistDB, {name: 'db'});

    // Init dbDone signal
    this.signalInit( 'dbDone' );
    // onEnd event handler for database functions
    const onEnd = ()=> this.signalNotify( 'dbDone' );

    // List of JSEN threads in the class
    this.threadList = {
      main: [
        // Start of the script
        JSEN.print( 'Start ExecuteDBActionsInJSEN' ),
        
        // Create all tables
        ()=> $L('db').createAllTables( {onEnd} ),
        this.signalWait( 'dbDone' ),
        ()=> console.log( 'Tables created' ),

        // Populate Persons Table from XLSX
        ()=> $L('db').populatePersonsTableFromXlsx( {onEnd} ),
        this.signalWait( 'dbDone' ),
        ()=> console.log( 'Employees added' ),

        // Populate Visits Table from XLSX
        ()=> $L('db').populateVisitsTableFromXlsx( {onEnd} ),
        this.signalWait( 'dbDone' ),
        ()=> console.log( 'Visits added' ),

        // End of script
        JSEN.print( 'End ExecuteDBActionsInJSEN' ),
      ],
    };
  }
}

function executeDBActionsInJS() {
  // Start of the script
  // Instantiate the Receptionist Database
  $L().registerNewInstanceOf(ReceptionistDB, {name: 'db'});
    // Create all tables
    $L('db').createAllTables({onEnd: () => {
      console.log('Tables created');
      // Populate Persons Table from XLSX
      $L('db').populatePersonsTableFromXlsx({onEnd: () => {
        console.log('Employees added');
        // Populate Visits Table from XLSX
        $L('db').populateVisitsTableFromXlsx({onEnd: () => {
          console.log('Visits added');
        }});
      }});
    }
  });
  // End of script
}

// Execute pure JavaScript version
executeDBActionsInJS();

// Execute JSEN version
new ExecuteDBActionsInJSEN( 'testDB' ).start();
