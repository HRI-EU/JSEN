/*
 * DragElement - Event manager for dragging HTML elements
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

function setDragElement( htmlElement, onCloseDrag ) {
  let positionX1 = 0;
  let positionY1 = 0;
  let positionX2 = 0;
  let positionY2 = 0;
  htmlElement.onmousedown = __dragMouseDown;

  function __dragMouseDown( event ) {
    event = event || window.event;
    event.preventDefault();

    // get mouse cursor position at startup:
    positionX2 = event.clientX;
    positionY2 = event.clientY;

    document.onmouseup = __closeDrag;
    // call drag function whenever cursor moves:
    document.onmousemove = __mouseDrag;
  }
  function __mouseDrag( event ) {
    event = event || window.event;
    event.preventDefault();
    // calculate new cursor position:
    positionX1 = positionX2 - event.clientX;
    positionY1 = positionY2 - event.clientY;
    positionX2 = event.clientX;
    positionY2 = event.clientY;
    // set element's new position:
    htmlElement.style.top = (htmlElement.offsetTop - positionY1) + "px";
    htmlElement.style.left = (htmlElement.offsetLeft - positionX1) + "px";
  }
  function __closeDrag() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
    if( onCloseDrag ) {
      onCloseDrag();
    }
  }
}

function createFloatingDiv( id, x, y, width, height, zIndex ) {
  const div = document.createElement( 'div' );
  div.id = id;
  div.style['position'] = 'absolute';
  div.style['top'] = ( y? `${y}px`: '100px' );
  div.style['left'] = ( x? `${x}px`: '400px' );
  div.style['width'] = ( width? `${width}px`: '800px' );
  div.style['height'] = ( height? `${height}px`: '400px');
  div.style['border-style'] = 'inset';
  div.style['border-color'] = 'lightgray';
  div.style['background'] = '#363838';
  div.style['overflow-x'] = 'scroll';
  div.style['overflow-y'] = 'scroll';
  div.style['z-index'] = ( zIndex? zIndex: '1000' );
  document.body.append( div );
  setDragElement( div );
  return( div );
}
