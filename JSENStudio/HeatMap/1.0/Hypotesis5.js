<html>
  <head>
    <link type="text/css" rel="stylesheet" href="HeatMap.css">
    <script src="HeatMap.js"></script>
    <style>
      body { 
        font: 14px helvetica neue, helvetica, arial, sans-serif;
        background: #363838;;
      }
    </style>
  </head>
  <body>
    <div id="heatmap">
      <!--table id="heatmapTimeline">
        <tr id="heatmapTimeRow">
          <th class="heatmapFixTh heatmapTimeCell">
          <th><p class="heatmapTimeRowValue">1420
          <th><p class="heatmapTimeRowValue">1421
          <th><p class="heatmapTimeRowValue">1422
          <th><p class="heatmapTimeRowValue heatmapTimeCellSelected">1423
          <th><p class="heatmapTimeRowValue">1424
          <th><p class="heatmapTimeRowValue">1425</th>
        <tr id="heatmapNRow_Notes" class="heatmapRow">
          <td class="heatmapFixTh heatmapTimeNotes">Notes
            <td><div class="heatmapTimeNoteText" contenteditable>Start</div>
            <td><div class="heatmapTimeNoteText" contenteditable>&nbsp;</div>
            <td><div class="heatmapTimeNoteText" contenteditable>Check</div>
            <td><div class="heatmapTimeNoteText" contenteditable>&nbsp;</div>
            <td><div class="heatmapTimeNoteText" contenteditable>&nbsp;</div>
            <td><div class="heatmapTimeNoteText" contenteditable>&nbsp;</div>
        <tr id="heatmapSRow_Tom_loadingCheck" class="heatmapRow">
          <td class="heatmapSignalName">Tom.loadingCheck
            <td class="heatmamValueCell" style="background-color: rgb(207, 225, 143);">
            <td class="heatmamValueCell" style="background-color: rgb(154, 181, 154);">
            <td class="heatmamValueCell" style="background-color: rgb(144, 173, 181);">
            <td class="heatmamValueCell" style="background-color: rgb(207, 225, 143);">
            <td class="heatmamValueCell" style="background-color: rgb(154, 181, 154);">
            <td class="heatmamValueCell" style="background-color: rgb(144, 173, 181);">
        <tr id="heatmapSRow_Alex_loadingCheck" class="heatmapRow">
          <td class="heatmapSignalName">Alex.loadingCheck
            <td class="heatmamValueCell" style="background-color: rgb(199, 166, 166);">
            <td class="heatmamValueCell" style="background-color: rgb(236, 133, 133);">
            <td class="heatmamValueCell" style="background-color: rgb(151, 151, 183);">
            <td class="heatmamValueCell" style="background-color: rgb(207, 225, 143);">
            <td class="heatmamValueCell" style="background-color: rgb(154, 181, 154);">
            <td class="heatmamValueCell" style="background-color: rgb(144, 173, 181);">
        <tr id="heatmapSRow_Meisy_loadingCheck" class="heatmapRow">
          <td class="heatmapSignalName">Meisy.loadingCheck
            <td class="heatmamValueCell" style="background-color: rgb(223, 190, 147);">
            <td class="heatmamValueCell" style="background-color: rgb(220, 186, 235);">
            <td class="heatmamValueCell" style="background-color: rgb(176, 208, 165);">
            <td class="heatmamValueCell" style="background-color: rgb(223, 190, 147);">
            <td class="heatmamValueCell" style="background-color: rgb(220, 186, 235);">
            <td class="heatmamValueCell" style="background-color: rgb(176, 208, 165);">
        <tr id="heatmapSRow_Tom_loadingCheck" class="heatmapRow">
          <td class="heatmapSignalName">Tom.loadingCheck
            <td class="heatmamValueCell" style="background-color: rgb(207, 225, 143);">
            <td class="heatmamValueCell" style="background-color: rgb(154, 181, 154);">
            <td class="heatmamValueCell" style="background-color: rgb(144, 173, 181);">
            <td class="heatmamValueCell" style="background-color: rgb(199, 166, 166);">
            <td class="heatmamValueCell" style="background-color: rgb(236, 133, 133);">
            <td class="heatmamValueCell" style="background-color: rgb(151, 151, 183);">
      </table-->
    </div>
    <script>
      const hm = new HeatMap( 'heatmap' );
      // { 
      //   const name = 'M1';
      //   hm.create( name );
      //   hm.setValueMap( name, {
      //     'ready': '#71A1C9',
      //     'running': '#8caa55',
      //     'suspended': '#eee957',
      //     'terminated': '#D57C7A'
      //   });
      //   hm.addEventListener( 'TimestepClick', (e,i,v)=> console.log( 'Click on timeInded '+i ));
      //   hm.addEventListener( 'SignalClick', (e,i,v)=> console.log( 'Click on signal '+v ));
      //   hm.addSignalList( name, [ 'Signal1 test', 'Signal2 prova', 'Signal3 probe', 'Signal4 new one' ] );
      //   const dataList = [
      //     [ 'running', 'ready', 'terminated', 'ready' ],
      //     [ 'running', 'suspended', 'terminated', 'running' ],
      //     [ 'running', 'ready', 'terminated', 'running' ],
      //     [ 'running', 'suspended', 'terminated', 'running' ],
      //     [ 'running', 'suspended', 'ready', 'running' ],
      //     [ 'running', 'suspended', 'terminated', 'running' ],
      //   ];
      //   for( const data of dataList ) {
      //     hm.addSignalValueList( name, null, null, data );
      //   }
      //   hm.setHighlightTimestep( 'M1', 2, true );
      // }
      // {
      //   const name = 'M2';
      //   hm.create( name, false );
      //   hm.setValueMap( name, {
      //     'ready': '#71A1C9',
      //     'running': '#8caa55',
      //     'suspended': '#eee957',
      //     'terminated': '#D57C7A'
      //   });
      //   hm.addSignalList( name, [ 'Signal1 test', 'Signal2 prova', 'Signal3 probe', 'Signal4 new one' ] );
      //   const dataList = [
      //     [ 'running', 'suspended', 'ready', 'running' ],
      //     [ 'running', 'suspended', 'terminated', 'running' ],
      //     [ 'running', 'ready', 'terminated', 'running' ],
      //     [ 'running', 'ready', 'terminated', 'ready' ],
      //     [ 'running', 'suspended', 'terminated', 'running' ],
      //     [ 'running', 'suspended', 'terminated', 'running' ],
      //   ];
      //   for( const data of dataList ) {
      //     hm.addSignalValueList( name, '', null, data );
      //   }
      // }
      // {
      //   const name = 'CODETest';
      //   hm.create( name, false );
      //   const cRedGreenBlue = [ [255,0,0], [0,255,0], [0,0,255] ];
      //   hm.setValueMap( name, hm.getColorMap( [-1,1], cRedGreenBlue ) );
      //   hm.addSignalList( name, [ '1', '2', '3', '4', '5' ] );
      //   for( let t = 0; t < 100; ++t ) {
      //     const data = [ 
      //       Math.cos( t*0.1 ), 
      //       Math.sin( t*0.02 ),
      //       Math.cos( t*0.2 ),
      //       Math.sin( t*0.05 ),
      //       Math.cos( t*0.5 ),
      //     ];
      //     hm.addSignalValueList( name, '', null, data );
      //   }
      // }
      // {
      //   const name = 'CODETest';
      //   hm.create( name, false );
      //   const cWhiteYellowRedBlack = [ [255,255,255], [223,255,0], [255,0,0], [0,0,0] ];
      //   hm.setValueMap( name, hm.getColorMap( [-1,1], cWhiteYellowRedBlack ) );
      //   hm.addSignalList( name, [ '1', '2', '3', '4', '5' ] );
      //   for( let t = 0; t < 100; ++t ) {
      //     const data = [ 
      //       Math.cos( t*0.1 ), 
      //       Math.sin( t*0.02 ),
      //       Math.cos( t*0.2 ),
      //       Math.sin( t*0.05 ),
      //       Math.cos( t*0.5 ),
      //     ];
      //     hm.addSignalValueList( name, t, null, data );
      //   }
      // }
      // {
      //   const name = 'CODETest1';
      //   hm.create( name );
      //   hm.setProperty( name, 'MaxTimestepCount', 30 );
      //   const cWhiteYellowRedBlack = [ [255,255,255], [223,255,0], [255,0,0], [0,0,0] ];
      //   hm.setValueMap( name, hm.getColorMap( [-1,1], cWhiteYellowRedBlack ) );
      //   hm.addSignalList( name, [ '1', '2', '3', '4', '5' ] );
      //   let t = 0;
      //   const dataStream = ()=> {
      //     if( t < 100 ) {
      //       const data = [ 
      //         Math.cos( t*0.1 ), 
      //         Math.sin( t*0.02 ),
      //         Math.cos( t*0.2 ),
      //         Math.sin( t*0.05 ),
      //         Math.cos( t*0.5 ),
      //       ];
      //       const tip = [
      //         new String( data[0] ).substring( 0, 4 )+' ['+t+']',
      //         new String( data[1] ).substring( 0, 4 )+' ['+t+']',
      //         new String( data[2] ).substring( 0, 4 )+' ['+t+']',
      //         new String( data[3] ).substring( 0, 4 )+' ['+t+']',
      //         new String( data[4] ).substring( 0, 4 )+' ['+t+']',
      //       ];
      //       hm.addSignalValueList( name, t++, null, data, tip );
      //       setTimeout( dataStream, 200 );
      //     }
      //   };
      //   dataStream();
      // }
      // {
      //   const name = 'SpeedTest';
      //   hm.create( name );
      //   const cWhiteYellowRedBlack = [ [255,255,255], [223,255,0], [255,0,0], [0,0,0] ];
      //   hm.setValueMap( name, hm.getColorMap( [-1,1], cWhiteYellowRedBlack ) );
      //   hm.addSignalList( name, [ '1', '2', '3', '4', '5' ] );
      //   let data = [];
      //   let dataLen = 10;
      //   for( let t = 0; t < dataLen; ++t ) {
      //     data.push([ 
      //       Math.cos( t*0.1 ), 
      //       Math.sin( t*0.02 ),
      //       Math.cos( t*0.2 ),
      //       Math.sin( t*0.05 ),
      //       Math.cos( t*0.5 ),
      //     ]);
      //   }
      //   console.log( 'Start speed test' );
      //   console.time( 'Drawing Time' );
      //   for( let t = 0; t < 100; ++t ) {
      //     const ddata = data[t % dataLen];
      //     hm.addSignalValueList( name, t, null, ddata );
      //   }
      //   console.timeEnd( 'Drawing Time' );
      //   console.log( 'End speed test' );
      // }
      function addText( text ) {
        const styleEl = document.createElement( 'h1' );
        const textEl = document.createTextNode( text );
        styleEl.appendChild( textEl );
        const divEl = document.getElementById( 'heatmap' );
        divEl.appendChild( styleEl );
      }
      let graphList = [];
      function addGraph( name ) {
        addText( name );
        hm.create( name, false );
        const cWhiteYellowRedBlack = [ [0,0,0], [255,0,0], [223,255,0], [255,255,255] ];
        hm.setValueMap( name, hm.getColorMap( [0,1], cWhiteYellowRedBlack ) );
        hm.addSignalList( name, [ '0', '1', '2', '3', '4' ] );
        graphList.push( name );
      }
      function clearAllGraph() {
        for( const name of graphList ) {
          hm.clear( name );
        }
      }
      function display( dataInfo, t ) {
        const asTip = ( v )=> ( v? new String(v).substring( 0, 4 ): 0 );
        const tip = [];
        dataInfo.data.forEach( ( d, i ) => { if( d ) tip[i] = asTip( d ) });
        hm.addSignalValueList( dataInfo.name, t, null, dataInfo.data, tip );
      }
      function displayUpdate( dataInfo, t ) {
        const asTip = ( v )=> ( v? new String(v).substring( 0, 4 ): 0 );
        const tip = [];
        dataInfo.data.forEach( ( d, i ) => { if( d ) tip[i] = asTip( d ) });
        hm.updateSignalValueList( dataInfo.name, t, null, dataInfo.data, tip );
      }
      
      class AreaData {
        constructor( name, historyLen ) {
          this.name = name;
          this.dataLen = 5;
          this.data = new Array( this.dataLen ).fill( 0 );
          this.historyLen = historyLen;
          this.history = [];
        }
        isValidIndex( eventIndex ) {
          return( !isNaN( eventIndex ) &&
              ( eventIndex!= null ) &&
              ( eventIndex >= 0 ) && 
              ( eventIndex < this.dataLen ) );
        }
        setEvent( eventIndex, value ) {
          if( this.isValidIndex( eventIndex ) ) {
            this.data[eventIndex] = ( value? value: 1 );
          }
        }
        setData( data ) {
          this._updateHistory();
          if( data ) {
            this.data = [ ...data ];
          }
        }
        getData() {
          return( this.data );
        }
        merge( dataObj ) {
          if( dataObj ) {
            for( let i = 0; i < this.dataLen; ++i ) {
              this.data[i] = dataObj.data[i];
            }
          }
        }
        getHistoryData( time ) {
          let result = [];

          if( this.historyLen ) {
            if( time == 't' ) {
              result = [ ...this.data ];
            } else {
              const [ t, index ] = time.split( '-' );
              if( index <= this.historyLen ) {
                const idx = this.history.length-index;
                result = [ ...this.history[idx] ];
              }
            }
          }
          return( result );
        }
        createDataFromIndex( eventIndex, value ) {
          let data = new Array( this.dataLen ).fill( 0 );
          if( this.isValidIndex( eventIndex ) ) {
            data[eventIndex] = ( value? value: 1 );
          }
          return( data );
        }
        isEmpty() {
          return( this.isEmptyData( this.data ) );
        }
        isEmptyData( data ) {
          let result = true;
          data.forEach( d => { if( d ) result = false; });
          return( result );
        }
        clear() {
          this.data.fill( 0 );
        }
        _updateHistory() {
          if( this.historyLen ) {
            this.history.push( [ ...this.data ] );
            if( this.history.length > this.historyLen ) {
              this.history.shift();
            }
          }
        }
      }
      class Area extends AreaData {
        constructor( name, historyLen ) {
          super( name, historyLen );
          this.decay = 0.08;
          this.weightList = [];
          this.simW = 0.05;
        }
        inputEvent( event ) {
          if( event ) {
            for( let i = 0; i < this.dataLen; ++i ) {
              this.data[i] = Math.min( 1, this.data[i]+event.data[i] );
            }
          }
        }
        inputData( inData ) {
          if( data ) {
            for( let i = 0; i < this.dataLen; ++i ) {
              this.data[i] = Math.min( 1, this.data[i]+inData[i] );
            }
          }
        }
        merge( dataObj ) {
          if( dataObj ) {
            for( let i = 0; i < this.dataLen; ++i ) {
              this.data[i] = Math.min( 1, this.data[i]+dataObj.data[i] );
            }
          }
        }
        getPrediction( eventIndex, context ) {
          if( this.isValidIndex( eventIndex ) ) {
            const weightSet = this.weightList[eventIndex];
            if( weightSet ) {
              return( this._checkPrediction( eventIndex, weightSet, context ) );
            }
          } else {
            let predIndex = null;
            for( let k = 0; k < this.dataLen; ++k ) {
              const weightSet = this.weightList[k];
              if( weightSet ) {
                predIndex = this._checkPrediction( k, weightSet, context );
              }
              if( this.isValidIndex( predIndex ) ) {
                return( predIndex );
              }
            }
          }
          return( null );
        }
        updatePredction( eventIndex, context ) {
        }
        doLearn( eventIndex, context ) {
          if( !this.weightList[eventIndex] ) {
            this.weightList[eventIndex] = [];
          }
          this.weightList[eventIndex].push( [ ...context.data ] );
        }
        update() {
          this._updateHistory();
          for( let i = 0; i < this.dataLen; ++i ) {
            if( this.data[i] ) {
              this.data[i] = Math.max( 0, this.data[i]-this.decay );
            }
          }
        }
        _checkPrediction( eventIndex, weightSet, context ) {
          const isSimilar = ( c, w )=> ( ( w-this.simW < c ) && ( c < w+this.simW ) );
          //const isSimilar = ( c, w )=> ( ( w <= c ) && ( c < w+this.simW ) );

          for( let j = 0; j < weightSet.length; ++j ) {
            let isMatch = true;
            const weight = weightSet[j];
            for( let i = 0; i < this.dataLen; ++i ) {
              if( !isSimilar( context.data[i], weight[i] ) ) {
                isMatch = false;
                break;
              }
            }
            if( isMatch ) {
              return( eventIndex );
            }
          }
          return( null );
        }
      }

      const input = new AreaData( 'input' );
      addGraph( 'input' );
      const mem = new Area( 'mem', 5 );
      addGraph( 'mem' );
      let context = new AreaData( 'context');
      addGraph( 'context' );
      let wcontext = new AreaData( 'wcontext');
      addGraph( 'wcontext' );
      let pred = new AreaData( 'pred', 1 );
      addGraph( 'pred' );
      const learn = new AreaData( 'learn' );
      addGraph( 'learn' );

      function test() {
        // Input definition
        const inputStream = 
         '  0  4   2   1   3                  '+
         '  0 4     2   1   3                   '+
         '  0 4   2  1   3                  '+
         '  0  4                          ';
        const inLen = inputStream.length;

        // Clear all visualization before the loop
        clearAllGraph();

        // Give a first empty input for mem, just to get some history
        mem.inputEvent(); // Add history t-1
        mem.inputEvent(); // Add history t-2

        let isPredWentUp = false;
        let isPredWentDown = false;
        let isPredictionHappened = false;
        let isPredictionInjected = false;

        // Input loop/Volumes/ANTO-FD4/HeatMap.html
        for( let t = 0; t < inLen; ++t ) {
          // On Events
          const event = inputStream[t];
          const eventIndex = parseInt( event );

          // Propagate event
          input.clear();
          input.setEvent( eventIndex );
          display( input, t );

          // Update dynamics
          mem.update();
          // Propagate input to Area1
          mem.inputEvent( input );
          display( mem, t );

          if( t == 116 ) debugger;

          if( !input.isEmpty() ) {
            const contextData = mem.getHistoryData( 't-1' );
            wcontext.setData( contextData );
          }
          display( wcontext, t );

          // Capture the context
          const contextData = mem.getHistoryData( 't-1' );
          context.setData( contextData );
          display( context, t );

          // If context is not empty, check if we have a prediction
          const predEventIndex = mem.getPrediction( eventIndex, context );
          const predData = pred.createDataFromIndex( predEventIndex );
          pred.setData( predData );
          display( pred, t );

          if( isPredWentUp && isPredWentDown ) {
            isPredWentUp = false;
            isPredWentDown = false;
          }
          const predDataT_1 = pred.getHistoryData( 't-1' );
          if( pred.isEmptyData( predDataT_1 ) && !pred.isEmpty() ) {
            isPredWentUp = true;
            //predStatus.setData( mem.getData() );
          }
          if( isPredWentUp && !input.isEmpty() ) {
            isPredictionHappened = true;
          }
          if( !pred.isEmptyData( predDataT_1 ) && pred.isEmpty() ) {
            isPredWentDown = true;
          }

          if( isPredWentUp && !isPredWentDown ) {
            if( !isPredictionHappened ) {
              // This should inject the prediction as it would have been an 
              // input from the stream
              input.merge( pred );
              displayUpdate( input, t );
              mem.merge( pred );
              displayUpdate( mem, t );
              isPredictionInjected = true;
            }
            isPredictionHappened = false;
          }

          if( !isPredictionInjected ) {
            if( !input.isEmpty() ) {
              if( !pred.isEmpty() ) {
                // If we have prediction we update it
                mem.updatePredction( pred, wcontext );
                learn.setEvent( eventIndex, 0.5 );
              } else {
                // If we have a non 0 context
                if( !wcontext.isEmpty() ) {
                  mem.doLearn( eventIndex, wcontext );
                  learn.setEvent( eventIndex );
                }
              }
            }
          }
          display( learn, t );

          // Final cleaning actions
          isPredictionHappened = false;
          learn.clear();
          wcontext.clear();
        }
      }
      test();
    </script>
  </body>
</html>