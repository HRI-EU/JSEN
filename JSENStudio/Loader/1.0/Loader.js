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

function loadScriptList( urlList, onLoad, isAvoidCache ) {
  if( !Array.isArray( urlList ) ) {
    if( onLoad ) {
      onLoad();
    }
  } else {
    const urlListCopy = [...urlList];
    const url = urlListCopy.shift();

    if ( url ) {
      loadScript( url, ()=> {
        loadScriptList( urlListCopy, onLoad, isAvoidCache );
      }, isAvoidCache );
    } else {
      if( onLoad ) {
        onLoad();
      }
    }
  }
}
function loadScript( url, onLoad, isAvoidCache ) {
  isAvoidCache = ( isAvoidCache == undefined? true: isAvoidCache );
  const prevScript = document.getElementById( url );
  if( !prevScript || isAvoidCache ) {

    if( prevScript ) {
      document.head.removeChild( prevScript );
    }
  
    const script = document.createElement( 'script' );
    script.id = url;
    script.type = 'text/javascript';
    script.onload = ()=> {
      console.log( `Script ${url} loaded` );
      if( onLoad ) {
        onLoad( true );
      }
    };
    script.onerror = ()=> {
      console.log( `Error loading script ${url}` );
      onLoad( false );
    };
    let uniqueURL = '';
    if( isAvoidCache ) {
      // Avoid server cache with timestamp
      const timestamp = new Date().getTime();
      uniqueURL = '?_='+timestamp;
    }
    script.src = url+uniqueURL;
    document.head.append( script )
  } else {
    if( onLoad ) {
      onLoad( true );
    }
  }
}