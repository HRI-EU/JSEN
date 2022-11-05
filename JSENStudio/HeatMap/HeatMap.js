/* HeatMap */
class HeatMap {
  constructor( containerId ) {
    this.containerId = containerId;
    this.heatmapList = {};

    // Events
    this.onEvent = {
      'TimestepClick': null,
      'SignalClick': null,
    };
  }
  create( name, isNotesEnabled ) {
    isNotesEnabled = ( isNotesEnabled == undefined? true: isNotesEnabled );
    const hInfo = {
      id: name,                       /* HeatMap unique name */
      containerEl: null,              /* Container element */
      tableEl: null,                  /* Table element */
      tableBodyEl: null,              /* Table body element */
      timeRowEl: null,                /* Time row element */
      noteRowEl: null,                /* Note row element */
      isNotesEnabled: isNotesEnabled, /* Enable/disable notes */
      maxTimestepCount: 0,            /* Maximum number of timestamp, after that slide */
      signalList: {},                 /* List of signals */
      valueMap: {                     /* Map values to colors */
        'undefined': 'black',
      },
    };
    this.heatmapList[name] = hInfo;

    hInfo.containerEl = document.getElementById( this.containerId );
    hInfo.tableEl = document.createElement( 'table' );
    hInfo.tableEl.id = `${hInfo.id}Timeline`
    hInfo.tableEl.innerHTML = `<tr class="${hInfo.id}TimeRow">
                                  <th class="heatmapFixTh heatmapTimeCell">`+
            ( isNotesEnabled? `<tr class="heatmapRow ${hInfo.id}NRow_Notes">
                                  <td class="heatmapFixTh heatmapTimeNotes">Notes`: '' );
    hInfo.containerEl.appendChild( hInfo.tableEl );
    hInfo.tableBodyEl = hInfo.tableEl.getElementsByTagName( 'tbody' )[0];
    hInfo.timeRowEl = hInfo.tableEl.getElementsByClassName( hInfo.id+'TimeRow' )[0];
    hInfo.noteRowEl = hInfo.tableEl.getElementsByClassName( hInfo.id+'NRow_Notes' )[0];
  }
  setProperty( name, pName, pValue ) {
    const hInfo = this.heatmapList[name];
    if( hInfo ) {
      switch( pName.toLowerCase() ) {
        case 'maxtimestepcount':
          hInfo.maxTimestepCount = pValue;   
          break;
      }
    }
  }
  addEventListener( name, eventName, callback ) {
    const hInfo = this.heatmapList[name];
    if( hInfo ) {
      this.onEvent[eventName] = callback;
    }
  }
  getTimestepCount( name ) {
    const hInfo = this.heatmapList[name];
    if( hInfo ) {
      return( hInfo.timeRowEl.childElementCount-1 );
    } else {
      return( 0 );
    }
  }
  setValueMap( name, map ) {
    const hInfo = this.heatmapList[name];
    if( hInfo ) {
      hInfo.valueMap = map;
      if( typeof( map ) == 'object' ) {
        hInfo.valueMap['undefined'] = 'black';
      }
    }
  }
  setHighlightTimestep( name, index, status ) {
    const hInfo = this.heatmapList[name];
    if( hInfo ) {
      const signalEl = hInfo.timeRowEl.childNodes[index+2];
      if( signalEl ) {
        if( status ) {
          signalEl.childNodes[0].classList.add( 'heatmapTimeCellSelected' );
        } else {
          signalEl.childNodes[0].classList.remove( 'heatmapTimeCellSelected' );
        }
      }
    }
  }
  addSignalList( name, nameList ) {
    for( const sname of nameList ) {
      this.addSignal( name, sname );
    }
  }
  addSignal( name, sname ) {
    const hInfo = this.heatmapList[name];
    if( hInfo && !hInfo.signalList[sname] ) {
      // <tr id="${this.id}SRow_${sname}" class="heatmapRow">
      const signalRowEl = document.createElement( 'tr' );
      // Prepare signalId from name in element id
      const elname = sname.replaceAll( ' ', '_' ).replaceAll( '-', '_' );
      signalRowEl.id = `${this.id}SRow_${elname}`;

      signalRowEl.className = 'heatmapRow';
      const signalIndex = hInfo.tableBodyEl.childElementCount-2;
      // <td class="heatmapSignalName">${sname}`;
      const signalEl = document.createElement( 'td' );
      signalEl.className = 'heatmapSignalName';
      signalEl.onclick = ( event )=> this._onEvent( 'SignalClick', event, signalIndex, sname );
      signalEl.innerHTML = sname;
      // Append all
      signalRowEl.appendChild( signalEl );
      hInfo.tableBodyEl.appendChild( signalRowEl );

      // Update signal info
      hInfo.signalList[sname] = {
        element: signalRowEl,
      };

      // Allign signal values to current time
      const count = this.getTimestepCount( name );
      for( let i = 0; i < count ; ++i ) {
        this.addSignalValue( name, sname );
      }
    }
  }
  addTimestep( name, timeValue ) {
    const hInfo = this.heatmapList[name];
    if( hInfo ) {
      const timeIndex = hInfo.timeRowEl.childElementCount-1;
      // <th><p class="heatmapTimeRowValue">1421
      const timeEl = document.createElement( 'th' );
      timeEl.innerHTML = `<p class="heatmapTimeRowValue">${timeValue}`;
      timeEl.onclick = ( event )=> this._onEvent( 'TimestepClick', event, timeIndex, timeValue );
      hInfo.timeRowEl.appendChild( timeEl );
      if( hInfo.isNotesEnabled ) {
        // <td><div class="heatmapTimeNoteText" contenteditable>Start</div>
        const noteEl = document.createElement( 'td' );
        noteEl.innerHTML = `<div class="heatmapTimeNoteText" contenteditable>&nbsp;</div>`;
        hInfo.noteRowEl.appendChild( noteEl );
      }

      if( hInfo.maxTimestepCount ) {
        if( hInfo.timeRowEl.childElementCount-1 > hInfo.maxTimestepCount ) {
          hInfo.timeRowEl.childNodes[2].remove();
          if( hInfo.isNotesEnabled ) {
            hInfo.noteRowEl.childNodes[2].remove();
          }
        }
      }
    }
  }
  addSignalValue( name, sname, value, tip ) {
    const hInfo = this.heatmapList[name];
    if( hInfo ) {
      const signalInfo = hInfo.signalList[sname];
      if( signalInfo ) {
        const signalRowEl = signalInfo.element;
        // <td class="heatmamValueCell" style="background-color: rgb(207, 225, 143);">
        const valueEl = document.createElement( 'td' );
        valueEl.className = 'heatmamValueCell';
        // Get value mapped
        let cValue = ( typeof( hInfo.valueMap ) == 'object'? 
                        hInfo.valueMap[value]: hInfo.valueMap( value ) );
        if( !cValue ) {
          cValue = 'black';
        }
        // Set value
        valueEl.style['background-color'] = cValue;

        // Get tooltip value
        const tipValue = ( tip? tip: value );
        valueEl.innerHTML = `<div class="tooltip">&nbsp;
                                <pre class="tooltiptext">${tipValue}</pre>
                              </div>`;
        this.tooltip = true;
        signalRowEl.appendChild( valueEl );

        if( hInfo.maxTimestepCount ) {
          if( signalInfo.element.childElementCount-1 > hInfo.maxTimestepCount ) {
            signalInfo.element.childNodes[1].remove();
          }
        }
      }
    }
  }
  addSignalValueList( name, timeValue, nameList, valueList, tipList ) {
    const hInfo = this.heatmapList[name];
    if( hInfo ) {
      // Default value for timeValue is timestamp
      if( ( timeValue == undefined ) || ( timeValue == null ) ) {
        const d = new Date();
        timeValue = `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}.${d.getMilliseconds()}`;
      }
      // Add a new timeCell
      this.addTimestep( name, timeValue );

      // Add the new values
      nameList = ( nameList? nameList: Object.keys( hInfo.signalList ) );
      for( let i = 0; i < nameList.length; ++i ) {
        const sname = nameList[i];
        const value = valueList[i];
        const tip = ( tipList? tipList[i]: undefined )
        this.addSignalValue( name, sname, value, tip );
      }
    }
  }
  getColorMap( range, colorList ) {
    return( this.computeColorMap.bind( this, range, colorList ) );
  }
  computeColorMap( range, colorList, value ) {
    // Default range = [0, 1]
    range = ( range == undefined? [0, 1]: range );
    // Make sure value is in range
    value = Math.max( range[0], value );
    value = Math.min( range[1], value );
    // Function to map [min, max] => [0, 1]
    const line = ( z, min, max )=> (z-min)/(max-min);

    // Color selection info ( value can only be between 2 colors)
    const cInfo = {
      // 2 colors between to select the color
      c1: null,
      c2: null,
      // Value between c1 and c2
      cValue: 0,
    };

    // Compute range for each color
    const value01 = line( value, range[0], range[1] )
    const colorCount = colorList.length;
    // Check between which color value is
    for( let i = 1; i < colorCount; ++i ) {
      const minColor = (i-1)/(colorCount-1);
      const maxColor = i/(colorCount-1);
      if( ( minColor <= value01 ) && ( value01 <= maxColor ) ) {
        // Set colors
        cInfo.c1 = colorList[i-1];
        cInfo.c2 = colorList[i];
        // Recompute value in the range of the two colors
        cInfo.cValue = line( value01, minColor, maxColor );
        break;
      }
    }
    // Compute the target color
    if( cInfo.c1 && cInfo.c2 ) {
      // Compute target color
      var c0 = [ Math.round( cInfo.c1[0] * (1-cInfo.cValue) + cInfo.c2[0] * (cInfo.cValue) ),
                  Math.round( cInfo.c1[1] * (1-cInfo.cValue) + cInfo.c2[1] * (cInfo.cValue) ),
                  Math.round( cInfo.c1[2] * (1-cInfo.cValue) + cInfo.c2[2] * (cInfo.cValue) ) ];
      return( `rgb(${c0[0]},${c0[1]},${c0[2]})` );
    } else {
      return( 'rgb(0,0,0)' );
    }
  }
  _onEvent( eventName, event, index, value ) {
    if( this.onEvent[eventName] ) {
      this.onEvent[eventName]( event, index, value );
    }
  }
}

