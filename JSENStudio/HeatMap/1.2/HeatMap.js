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

    const styleEl = document.createElement( 'style' );
    styleEl.innerText = HeatMapStyle;
    document.head.appendChild( styleEl );
  }
  create( name, isNotesEnabled ) {
    isNotesEnabled = ( isNotesEnabled == undefined? true: isNotesEnabled );
    const hInfo = {
      id: name,                       /* HeatMap unique name */
      containerEl: null,              /* Container element */
      canvasEl: null,                  /* Table element */
      contextEl: null,
      isNotesEnabled: isNotesEnabled, /* Enable/disable notes */
      maxTimestepCount: 0,            /* Maximum number of timestamp, after that slide */
      timeIndex: -1,
      dataX0: 1,
      dataY0: 7,
      selectedTimestepIndex: -1,      /* Index of currently selected timestep */
      signalList: {},                 /* List of signals */
      signalCount: 0,
      valueMap: {                     /* Map values to colors */
        'undefined': 'black',
      },
      scaleX: 15,
      scaleY: 15,
    };
    this.heatmapList[name] = hInfo;

    hInfo.containerEl = document.getElementById( this.containerId );
    hInfo.containerEl.style['display'] = 'grid';
    hInfo.canvasEl = document.createElement( 'canvas' );
    hInfo.canvasEl.id = `${hInfo.id}Timeline`
    hInfo.contextEl = hInfo.canvasEl.getContext( '2d' );
    hInfo.contextEl.scale( hInfo.scaleX, hInfo.scaleY );
    hInfo.containerEl.appendChild( hInfo.canvasEl );
  }
  setProperty( name, pName, pValue ) {
    const hInfo = this.heatmapList[name];
    if( hInfo ) {
      switch( pName.toLowerCase() ) {
        case 'maxtimestepcount':
          hInfo.maxTimestepCount = pValue;   
          break;
        case 'numtimestep':
          hInfo.canvasEl.width = pValue*hInfo.scaleX+hInfo.dataX0*hInfo.scaleX;
          hInfo.contextEl.scale( hInfo.scaleX, hInfo.scaleY );
          break;
        case 'numsignal':
          hInfo.canvasEl.height = pValue*hInfo.scaleY+hInfo.dataY0*hInfo.scaleY;
          hInfo.contextEl.scale( hInfo.scaleX, hInfo.scaleY );
          break;
        case 'timestepheight':
          hInfo.dataY0 = pValue;
          hInfo.canvasEl.height = pValue*hInfo.scaleY+hInfo.dataY0*hInfo.scaleY;
          hInfo.contextEl.scale( hInfo.scaleX, hInfo.scaleY );
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
      return( hInfo.timeIndex );
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
    if( hInfo && index >= 0 ) {
      // const timeEl = hInfo.timeRowEl.childNodes[index+2];
      // if( timeEl ) {
      //   const timeLabelEl = timeEl.childNodes[0];
      //   if( status ) {
      //     if( hInfo.selectedTimestepIndex != -1 ) {
      //       this.setHighlightTimestep( name, hInfo.selectedTimestepIndex, false )
      //     }
      //     timeLabelEl.classList.add( 'heatmapTimeCellSelected' );
      //     hInfo.selectedTimestepIndex = index;
      //     timeLabelEl.scrollIntoView( false );
      //   } else {
      //     hInfo.selectedTimestepIndex = -1;
      //     timeLabelEl.classList.remove( 'heatmapTimeCellSelected' );
      //   }
      // }
    }
  }
  addSignalList( name, nameList ) {
    this._setup( name, nameList );
    for( const sname of nameList ) {
      this._addSignal( name, sname );
    }
  }
  addTimestep( name, timeValue ) {
    const hInfo = this.heatmapList[name];
    if( hInfo ) {
      // Default value for timeValue is timestamp
      if( ( timeValue == undefined ) || ( timeValue == null ) ) {
        const d = new Date();
        const h = ('0'+d.getHours()).slice( -2 );
        const m = ('0'+d.getMinutes()).slice( -2 );
        const s = ('0'+d.getSeconds()).slice( -2 );
        const ms = ('000'+d.getMilliseconds()).slice( -4 );
        timeValue = `${h}:${m}:${s}.${ms}`;
      }

      ++hInfo.timeIndex;

      const x = hInfo.timeIndex+hInfo.dataX0;
      const y = hInfo.dataY0-1;
      hInfo.contextEl.save();
      hInfo.contextEl.translate( x, y );
      hInfo.contextEl.rotate( -Math.PI/2 );
      hInfo.contextEl.font = '1px serif';
      hInfo.contextEl.fillStyle = 'lightGray';
      hInfo.contextEl.fillText( timeValue, 0, 1 );
      hInfo.contextEl.restore();

      //timeEl.innerHTML = `<p class="heatmapTimeRowValue">${timeValue}`;
      //timeEl.onclick = ( event )=> this._onEvent( 'TimestepClick', event, timeIndex, timeValue );

      this.setHighlightTimestep( name, this.timeIndex, true );

      // if( hInfo.isNotesEnabled ) {
      //   // <td><div class="heatmapTimeNoteText" contenteditable>Start</div>
      //   const noteEl = document.createElement( 'td' );
      //   noteEl.innerHTML = `<div class="heatmapTimeNoteText" contenteditable>&nbsp;</div>`;
      //   hInfo.noteRowEl.appendChild( noteEl );
      // }

      if( hInfo.maxTimestepCount ) {
        // if( hInfo.timeRowEl.childElementCount-1 > hInfo.maxTimestepCount ) {
        //   hInfo.timeRowEl.childNodes[2].remove();
        //   if( hInfo.isNotesEnabled ) {
        //     hInfo.noteRowEl.childNodes[2].remove();
        //   }
        //   if( hInfo.selectedTimestepIndex != -1 ) {
        //     --hInfo.selectedTimestepIndex;
        //   }
        // }
      }
    }
  }
  addSignalValue( name, sname, value, tip ) {
    const hInfo = this.heatmapList[name];
    if( hInfo ) {
      const signalIndex = hInfo.signalList[sname];
      if( signalIndex != undefined ) {
        // Get value mapped
        let cValue = null;
        if( ( value != undefined ) && ( value != null ) ) {
          cValue = ( typeof( hInfo.valueMap ) == 'object'? 
                     hInfo.valueMap[value]: hInfo.valueMap( value ) );
        }
        if( !cValue ) {
          cValue = 'black';
        }
        // Set value
        //valueEl.style['background-color'] = cValue;
        hInfo.contextEl.fillStyle = cValue;
        hInfo.contextEl.strokeStyle = 'black';
        const x = hInfo.timeIndex+hInfo.dataX0;
        const y = signalIndex+hInfo.dataY0;
        hInfo.contextEl.fillRect( x, y, 1, 1 );
        // Get tooltip value
        // const tipValue = ( tip? tip: value );
        // valueEl.innerHTML = `<div class="tooltip">&nbsp;
        //                         <pre class="tooltiptext">${tipValue}</pre>
        //                       </div>`;
        //this.tooltip = true;


        if( hInfo.maxTimestepCount ) {
          // if( signalInfo.element.childElementCount-1 > hInfo.maxTimestepCount ) {
          //   signalInfo.element.childNodes[1].remove();
          // }
        }
      }
    }
  }
  addSignalValueList( name, timeValue, nameList, valueList, tipList ) {
    const hInfo = this.heatmapList[name];
    if( hInfo ) {
      // Add a new timeCell
      this.addTimestep( name, timeValue );

      // Get signal names from parameters or signalList
      nameList = this._getSignalNameList( hInfo, nameList, valueList );
      // Add the new values
      for( let i = 0; i < nameList.length; ++i ) {
        const sname = nameList[i];
        const value = valueList[i];
        const tip = ( tipList? tipList[i]: undefined )
        this.addSignalValue( name, sname, value, tip );
      }
    }
  }
  updateSignalValue( name, sname, value, tip ) {
    const hInfo = this.heatmapList[name];
    if( hInfo ) {
      const signalInfo = hInfo.signalList[sname];
      if( signalInfo ) {
        const signalRowEl = signalInfo.element;
        const valueEl = signalRowEl.lastChild;
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
        //this.tooltip = true;
      }
    }
  }
  updateSignalValueList( name, timeValue, nameList, valueList, tipList ) {
    const hInfo = this.heatmapList[name];
    if( hInfo ) {
      // Get signal names from parameters or signalList
      nameList = this._getSignalNameList( hInfo, nameList, valueList );
      // Add the new values
      for( let i = 0; i < nameList.length; ++i ) {
        const sname = nameList[i];
        const value = valueList[i];
        const tip = ( tipList? tipList[i]: undefined )
        this.updateSignalValue( name, sname, value, tip );
      }
    }
  }
  clear( name ) {
    const hInfo = this.heatmapList[name];
    if( hInfo ) {
      // const clearEl = ( el, startIdx )=> {
      //   if( el ) {
      //     const tElCount = el.childElementCount;
      //     for( let i = startIdx; i <= tElCount; ++i ) {
      //       const child = el.childNodes[startIdx];
      //       if( child ) {
      //         child.remove();
      //       }
      //     }
      //   }
      // };
      // clearEl( hInfo.timeRowEl, 2 );
      // clearEl( hInfo.noteRowEl, 2 );

      hInfo.timeIndex = -1;
      hInfo.selectedTimestepIndex = -1;
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
  _setup( name, nameList ) {
    const hInfo = this.heatmapList[name];
    if( hInfo ) {
      this.setProperty( name, 'numSignal', nameList.length );
      let signalNameMaxLen = 0;
      for( const sname of nameList ) {
        const len = `${sname}`.length;
        if( len > signalNameMaxLen ) {
          signalNameMaxLen = len;
        }
      }
      hInfo.dataX0 = Math.round( signalNameMaxLen/2 );
    }
  }
  _addSignal( name, sname ) {
    const hInfo = this.heatmapList[name];
    if( hInfo && !hInfo.signalList[sname] ) {
      const signalIndex = hInfo.signalCount++;
      // Update signal info
      hInfo.signalList[sname] = signalIndex;

      // Resize canvas for signals
      // hInfo.canvasEl.height = hInfo.signalCount*hInfo.scaleY;
      // hInfo.contextEl.scale( hInfo.scaleX, hInfo.scaleY );

      hInfo.contextEl.font = '1px serif';
      hInfo.contextEl.fillStyle = 'lightGray';
      const x = 0;
      const y = signalIndex+1+hInfo.dataY0;
      hInfo.contextEl.fillText( sname, x, y );

      // Allign signal values to current time
      const count = this.getTimestepCount( name );
      for( let i = 0; i < count ; ++i ) {
        this.addSignalValue( name, sname );
      }
    }
  }
  _onEvent( eventName, event, index, value ) {
    if( this.onEvent[eventName] ) {
      this.onEvent[eventName]( event, index, value );
    }
  }
  _getSignalNameList( hInfo, nameList, valueList ) {
    // Get signal names from parameters or signalList
    nameList = ( nameList? nameList: Object.keys( hInfo.signalList ) );
    // If still empty, get signal names from index of values
    nameList = ( nameList && nameList.length? nameList: Array.from(valueList.keys()) );
    return( nameList );
  }
}

const HeatMapStyle = `
/* HeatMap Style */
#heatmap {
  width: 100%;
}
.heatmapTimeCell {
  font-weight: lighter;
}
.heatmapSignalName {
  color: lightgray;           /* font color for signal names */
  padding-right: 5px;        /* distance between signal names and start of heatmap */
  text-align: right;
}
.heatmapRow {
  height: 10px;                 /* height for valueCell */
}
.heatmamValueCell {
  width: 3px;                  /* width for valueCell */
  padding: 0px;
}
.heatmapFixTh {
  position: sticky;
  left: 0;
  background: black;
}
.heatmapTimeRowValue {
  color: lightskyblue;        /* font color for time in timeline */
  writing-mode: vertical-lr;
  text-orientation: sideways;
  margin: 0px;
  padding-top: 10px;            /* distance between top and first digit of times */
  padding-bottom: 10px;         /* distance between heatmap and last digit of times */
}
.heatmapTimeNotes {
  color: yellow;
}
.heatmapTimeNoteText {
  background-color: rgba(119, 119, 119, 0.25);
  color: yellow;
  writing-mode: vertical-lr;
  text-orientation: sideways;
}
/* Set this class to show selected/current time */
.heatmapTimeCellSelected {
  color: white;
  font-weight: normal;
}
/* tooltip from: https://www.w3schools.com/css/css_tooltip.asp */
.tooltip {
  position: relative;
  display: inline-block;
}
.tooltip .tooltiptext {
  visibility: hidden;
  width: 120px;
  background-color: rgba(0,0,0,0.7);
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px 0;

  /* Position the tooltip */
  position: absolute;
  z-index: 1;
  top: -50px;  /* top position of the hint. Bigger negative brings it to top */
  left: 105%;
  margin-left: -20px;
  padding: 5px;

  /* Effects */
  transition: opacity 1s;
}
.tooltip .tooltiptext::after {
  content: " ";
  position: absolute;
  top: 100%; /* At the bottom of the tooltip */
  left: 15%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: rgba(0,0,0,0.7) transparent transparent transparent;
}
.tooltip:hover .tooltiptext {
  visibility: visible;
  opacity: 1;
}
`;
