/*
 *  Comparison code on different asynchronous JavaScript methods
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

// NOTE: this example is meant just to show
//       the usage of JSEN in an application
//       it can't be executed as it is

const JSEN = require("../src/JSEN");
const JSENVM = require("../src/JSENVM");

/*
	Article: "Asynchronous JavaScript: From Callback Hell to Async and Await"
	By: DEMIR SELMANOVIC
	Date: 2018
	URL: https://www.toptal.com/javascript/asynchronous-javascript-async-await-tutorial
*/

// Callback
const checkUser = function( username, password, callback ) {
	dataBase.verifyUser( username, password, ( error, userInfo ) => {
		if( error ) {
			callback( error );
		} else {
			dataBase.getRoles( userInfo, ( error, rolesInfo ) => {
				if( error ) {
					callback( error );
				} else {
					dataBase.logAccess( rolesInfo, ( error ) => {
						if( error ) {
							callback( error );
						} else {
							callback( null, userInfo, rolesInfo );
						}
					})
				}
			})
		}
	})
};

// Promises
const checkUser = function( username, password, callback ) {
	let userInfo = null;
  let rolesInfo = null;
	database.verifyUser( username, password )
		.then( ( ui ) => { userInfo = ui; dataBase.getRoles( userInfo ) } )
		.then( ( ri ) => { rolesInfo = ri; dataBase.logAccess( rolesInfo ) } )
		.then( ( finalResult ) => {
			callback( null, userInfo, rolesInfo );
		})
		.catch( ( error ) => {
			callback( error );
		});
};

// Async/Await
const checkUser = function( username, password, callback ) {
	try {
		const userInfo = await dataBase.verifyUser( username, password );
		const rolesInfo = await dataBase.getRoles( userInfo );
		const logStatus = await dataBase.logAccess( rolesInfo );
		callback( null, userInfo, rolesInfo );
	} catch ( error ) {
		callback( error );
	}
};

// JSEN
const checkUser = function( username, password, callback ) {
	let error = null;
	let userInfo = null;
	let rolesInfo = null;
	let finalResult = null;
	const checkUser = [
		[
			()=> dataBase.verifyUser( username, password, ( e, ui ) => { error = e; userInfo = ui; } ),
			JSEN.on( ()=> error != null || userInfo != null ),
			JSEN.if( ()=> error != null ),
				JSEN.break(),
			()=> database.getRoles( userInfo, ( e, ri ) => { error = e; rolesInfo = ri; } ),
			JSEN.on( ()=> error != null || rolesInfo != null ),
			JSEN.if( ()=> error != null ),
				JSEN.break(),
			()=> database.logAccess( rolesInfo, ( e ) => { error = e; finalResult = true; } ),
			JSEN.on( ()=> error != null || finalResult != null ),
		],
		JSEN.if( ()=> error != null ),
			()=> callback( error ),
		JSEN.else(),
			()=> callback( null, userInfo, rolesInfo ),
	];
	JSENVM.run( checkUser );
}

const checkUser = function( username, password, callback ) {
	let error = null;
	let userInfo = null;
	let rolesInfo = null;
	let finalResult = null;
	const checkUser = [
		[
			JSEN.setName( 'checkUser' ),
			()=> dataBase.verifyUser( username, password, ( e, ui ) => { error = e; userInfo = ui; } ),
			JSEN.on( ()=> userInfo != null ),
			()=> database.getRoles( userInfo, ( e, ri ) => { error = e; rolesInfo = ri; } ),
			JSEN.on( ()=> rolesInfo != null ),
			()=> database.logAccess( rolesInfo, ( e ) => { error = e; finalResult = true; } ),
			JSEN.on( ()=> finalResult != null ),
		],
		()=> callback( null, userInfo, rolesInfo ),
		JSEN.terminateAll(),
	];
	const checkError = [
		JSEN.setName( 'checkError' ),
		JSEN.on( ()=> error != null ),
			()=> callback( error ),
		JSEN.terminateAll(),
	];
	JSENVM.run( checkUser, checkError );
}

