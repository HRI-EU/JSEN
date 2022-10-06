/*
 * GPlot - Wrapper with stip-down API on google plot library
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

/*
    Example usage:

    const gp = new GPlot( document.body );
    // NOTE: Now wait that all is loaded or use onLoaded constructor parameter

    gp.plot( 'Test1', [
                        ['Saliency'],
                        [0],
                      ])

    gp.plot( 1.2 )
    gp.plot( 1.5 )
    gp.plot( 1.8 )
    //---------------------------------
    gp.plot( 'Test2', [
                        ['Year', 'Sales', 'Expenses'],
                        ['2001',  1000,      400],
                      ])
    gp.plot( [['2002', 20, 400]])

    gp.plot( 'Test3', [
                        ['Year', 'Sales', 'Expenses'],
                        ['2001',  0,      0],
                      ])

    gp.plot( 'Test2' )
    gp.plot( [['2002', 20, 400]])
    gp.plot( [['2003', 25, 450]])

    gp.plot( 'Test3' )
    gp.plot( [['2003', 25, 450]])

    gp.plot( 'Test2', [['2004', 26, 50]])
    //---------------------------------
    gp.plot( 'Test4', 'Saliency' )

    gp.plot( 1.2 )
    gp.plot( 1.5 )
    gp.plot( 1.8 )
    //---------------------------------
    // NOTE: if the first row has more than 1 signal, then
    //       you have to put at first the x axes name (Year)
    gp.plot( 'Test4', [ 'Year', 'Sales', 'Expenses' ] )

    gp.plot( [ 12, 304 ] )
    gp.addRows( [ 15, 207 ] )
    gp.addRows( [ 18, 103 ] )
    //---------------------------------
    // NOTE: if the first row has more than 1 signal, then
    //       you have to put at first the x axes name (Year)
    gp.plot( 'Test4', [ 'Year', 'Sales', 'Expenses' ] )

    gp.plot( [ '2001', 12, 304 ] )
    gp.plot( [ '2002', 15, 207 ] )
    gp.plot( [ '2003', 18, 103 ] )
 */

class GPlot {
  constructor( element, onLoaded ) {
    // Container element for all plot
    this.element = ( typeof(element) == 'string'? document.querySelector( element ): element );
    // List of instantiated plot
    this.plotList = {};
    this.lastPlotName = null;

    // Setup google charts once loaded
    const _onLoaded = ()=> {
      google.charts.load( 'current', { 'packages':['corechart'] } );
      google.charts.setOnLoadCallback( onLoaded );
    };
    // Load google charts
    loadScript( 'https://www.gstatic.com/charts/loader.js', _onLoaded );
  }
  plot( name, data ) {
    // If both param available or only one parameter provided
    //    and it is not a plot name ==> use last name
    if( ( name && data )  || 
        ( !data && typeof( name ) != 'string' ) ) {
      
      if( !data ) {
        data = name;
        name = this.lastPlotName;
      }

      if( this.plotList[name] ) {
        this.addRows( name, data );
      } else {
        this._newPlot( name, data );
      }
    }
    // Save last name
    this.lastPlotName = name;
  }
  addRows( name, newData ) {
    // If only one parameter provided => use last plot name
    if( !newData ) {
      newData = name;
      name = this.lastPlotName;
    }
    // Get plot instance
    const p = this.plotList[name];
    if( p ) {
      const adjustedData = this._reshapeUserData( newData );
      p.data.addRows( adjustedData );
      p.chart.draw( p.data )
    }
    // Save last name
    this.lastPlotName = name;
  }
  plotPosition( name, x, y ) {
    // If called like plotPosition( 10, 5 ) => use last plot name
    if( ( typeof( name ) == 'number' ) && ( y == undefined ) ) {
      y = x;
      x = name;
      name = this.lastPlotName;
    }
    const p = this.plotList[name];
    if( p ) {
      p.div.style['left'] = `${x}px`;
      p.div.style['top'] = `${y}px`;
    }
  }
  plotSize( name, width, height ) {
    // If called like plotPosition( 10, 5 ) => use last plot name
    if( ( typeof( name ) == 'number' ) && ( height == undefined ) ) {
      height = width;
      width = name;
      name = this.lastPlotName;
    }
    const p = this.plotList[name];
    if( p ) {
      p.div.style['width'] = `${width}px`;
      p.div.style['height'] = `${height}px`;
    }
  }
  _newPlot( name, newData ) {
    // Create plot container div
    const div = document.createElement( 'div' );
    div.id = 'plotArea';
    div.style['position'] = 'absolute';
    div.style['top'] = '100px';
    div.style['left'] = '400px';
    div.style['width'] = '800px';
    div.style['height'] = '400px';
    div.style['background'] = 'white';
    this.element.appendChild( div );
    setDragElement( div );
    // Create data object
    const adjustedData = this._reshapeUserData( newData, true );
    const data = google.visualization.arrayToDataTable( adjustedData );
    // Create options object
    var options = {
      title: name,
      curveType: 'function',
      legend: { position: 'bottom' },
    };
    // Set div
    const chart = new google.visualization.LineChart( div );
    // Drap data
    chart.draw( data, options );

    const p = { name, div, data, options, chart };
    this.plotList[name] = p;
  }
  _reshapeUserData( data, isNewPlot ) {
    // Data should be:
    //   [ [ <xNameStr>, <label1Str>, <lable2Str>, ... ] // axis row
    //     [ <xLabelStr> <value1>,    <value2>, ... ] ]  // data row
    let result = data;
    if( !Array.isArray( data ) ) { // could be number or string
      // If we get just a string or number => create a dara or axis row
      result = [ [ '', data ] ];
    } else {
      if( Array.isArray( data ) ) {
        // If its an array we make sure to have each row as an array too
        let isJustARow = false;
        for( let i = 0; i < data.length; ++i ) {
          const row = data[i];
          if( !Array.isArray( row ) ) {  // could be number or string
            isJustARow = true;
            // If we miss the row label => add it
            if( typeof( row[0] ) != 'string' ) {
              data.splice( 0, 0, '' );
            }
            break;
          } else if( Array.isArray( row ) ) {
            // Make sure that the first element of a row is a label
            // and in case we have no value, we put 0
            switch( row.length ) {
              case 0:
                data[i] = [ '', 0 ];
                break;
              case 1:
                data[i] = [ '', row[0] ];
                break;
              default:
                // Make sure that the first element of a row is a label
                if( typeof( row[0] ) != 'string' ) {
                  row.splice( 0, 0, '' );
                }
                break;
            }
          }
        }
        if( isJustARow ) {
          // Put the row in an array
          result = [ data ];
        }
      }
    }
    // If its the first data of a new plot
    // if we don't have a first value we add it
    if( isNewPlot && ( result.length == 1 ) ) {
      let newRow = [];
      for( let i = 0; i < result[0].length; ++i ) {
        switch( i ) {
          case 0:
            newRow.push( '' );
            break;
          default:
            newRow.push( 0 );
            break;
        }
      }
      result.push( newRow );
    }
    return( result );
  }
}

function _testGPlot() {
  function onLoaded() {
    const data = [
      ['Year', 'Sales', 'Expenses'],
      ['2004',  1000,      400],
    ];
    gp.plot( 'Test', data );
    gp.plotPosition( 400, 600 );
  
    const moreData = [
      ['2005',  100,      200],
      ['2006',  300,      100],
      ['2007',  150,      240],
      ['2008',  500,      100],
      ['2009',  900,      2000],
      ['2010',  10,       20],
    ];
    const plotMore = ( i )=> {
      if( i < moreData.length ) {
        // NOTE: we just provide data => plotted in previous plot name
        gp.addRows( [ moreData[i] ] );
        setTimeout( ()=> plotMore( ++i ), 2*1000 );
      }
    }
    plotMore( 0 );
  }
  const gp = new GPlot( document.body, onLoaded );
}
