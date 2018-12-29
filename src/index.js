import React from 'react';
import ReactDOM from 'react-dom';
import {VictoryChart, VictoryLine, VictoryTheme, VictoryAxis, VictoryContainer, VictoryLegend} from 'victory';
import {connect} from 'react-zine';
import {issue} from 'zine';
import keymage from 'keymage';
import {initializeSimulation} from './simulation';
import {advanceSimulation} from './simulation';
import {chartStats} from './data';
import html from '../README.md';

/* 
This is the main file for the Grazing Game, containing pretty much all the layout and UI code. It uses React, Zine for responsive event handling, and Victory for data visualization, along with a few other things. 
*/

// State Containers & Constants

const parameters = { // See README.md for descriptions of these.
  numTurns: 25,
  countySize: 8,
  glenGrowthRate: 1.5,
  numFlocks: 32,
  initialFlockSize: 16,
  sheepGreed: 0.05,
  sheepEndurance: 3,
  sheepReproductionRate: 0.25,
  strategy: "random",
  manual: null
};

const paramData = {
  numTurns: {label:  "Number of New Seasons", min: 0, max: Infinity, isFloat: false, message: "This is the number of new seasons that will be added to the simulation."},
  countySize: {label:  "County Size", min: 1, max: Infinity, isFloat: false, message: "This is the length (in groves) of each side of the county. It cannot be changed after seasons have been added."},
  glenGrowthRate: {label:  "Glen Growth Rate", min: 1, max: Infinity, isFloat: true, message: "This is the amount that the abundance of each grove will be multiplied by in the middle of each season."},
  numFlocks: {label:  "Number of Flocks", min: 1, max: Infinity, isFloat: false, message: "This is the number of flocks that will be added to the county initially. It cannot be changed after seasons have been added."},
  initialFlockSize: {label:  "Initial Flock Size", min: 1, max: Infinity, isFloat: false, message: "This is the number of sheep in each flock that will be added to the county initially. It cannot be changed after seasons have been added."},
  sheepGreed: {label:  "Sheep Greed", min: 0, max: 1, isFloat: true, message: "This is the amount that each sheep will attempt to eat at the beginning of each season, reducing the abundance of the grove it occupies."},
  sheepEndurance: {label:  "Sheep Endurance", min: 0, max: Infinity, isFloat: false, message: "This is the number of consecutive seasons in which a sheep can fail to find anything to eat before it disappears."},
  sheepReproductionRate: {label:  "Sheep Reproduction Rate", min: 0, max: 1, isFloat: true, message: "This is the likelihood that each sheep, if it has eaten, will reproduce and add another sheep to its flock."}
};

const paramState = {valid: true, starting: true, show: true}; // Controls whether the parameters panel is in a valid state and should be shown.

const simulationState = initializeSimulation(formatParameters()); // Holds the entire state of the county across all seasons. Initialized with a function from simulation.js

const viewState = {show:"docs"}; // Holds a keyword for what should be displayed in the visualization panel (e.g. the county graph, documentation, data charts...) 

const messiah = {isRisen: false, flock: false, holyGhosts: []}; // State relating to the manual flock control mode.

const gospel = {message: ""} // A string to be shown in the help panel.


// Helper Functions

function validate (id) { // Is the current value of a given parameter a valid one?
  if (id === "strategy" || id === "manual") {
    return true; // Some parameters aren't checked this way.
  }
  let value = Number.parseFloat(parameters[id]);
  let {min, max, isFloat} = paramData[id]; // Others are checked against stored info about them,
  let isNumberType = isFloat ? !Number.isNaN(value) : Number.isInteger(value) // for type,

  return isNumberType && value >= min && value <= max; // and falling within a certain range.
}

function updateParameter (id, value) { // When a parameter is updated in the UI...
  parameters[id] = value; // ...get the new value...

  let valid = true; // ...initially trust that all parameters are valid...
  for (let key in parameters) {
    if (!validate(key)) { // ...but verify!
      valid = false;
      break;
    }
  }
  if (paramState.starting===false) { // If you do change one, and we didn't just start...
    issue(gospel, {message: "You have altered some parameters. If you want to add seasons to your simulation, click 'Continue Simulation'. "});
  } // ...provide the correct help message.
  issue(paramState, {valid});
}

function initSim () { // initializing the simulation
  issue(paramState, {starting: false}); // Note that we have started.
  let newCounty = updateSimulation(false); // Iterate the simulation noting that we are not continuing a previous one.
  document.getElementById('root').scrollTop=0; // Scroll the UI up in preparation for showing the county.
  toggleViewButtons(false); // Indicate that the view switch buttons are no longer disabled.
  keymage('alt-m', function() { toggleManual() }, {preventDefault: true}); // Enable keystrokes for manual mode...
  keymage('left', function() {setTurn(Math.max(0, simulationState.turn - 1))}); // ...turn back county view...
  keymage('right', function() {setTurn(Math.min(simulationState.parameters.numTurns, simulationState.turn + 1))}); // ...and advance county view.
  issue(gospel, {message: "You have now run a simulation. Click the |◀ and ▶| buttons below the county display to adjust the view by season, or use the left and right arrow keys, or drag the slider."}); // Give a help message.
  return newCounty; // Return this, the state it provides gets used.
}

function contSim () {
  simulationState.parameters = Object.assign({}, parameters); // MAKE A COPY OF THE PARAMETERS FROM THE UI. Otherwise the simulation will mutate them, which is unwanted.
  simulationState.parameters.manual = null; // Erase the last manual move so it won't get re-used.
  issue(gospel, {message: "You have added seasons to the simulation. Click the |◀ and ▶| buttons below the county display to adjust the view by season, or use the left and right arrow keys, or drag the slider."}); // Appropraite help message.
  return updateSimulation(true); // Iterate the simulation, noting that we are continuing an existing one.
}

function updateSimulation (cont) {
  if (paramState.valid) { // None of this happens unless all of the parameters are valid.
    issue(simulationState, (cont ? advanceSimulation(simulationState) : initializeSimulation(formatParameters())));
    let ctrls = document.getElementsByClassName('control'); // After updating, contract the parameter controls...
    for (let i = 0; i < ctrls.length; i++) {
      ctrls[i].style.margin =  "0px";
      ctrls[i].style.maxHeight = "0px";
    }
    issue(paramState, {show: false}) // ...and notify subscribers that the parameters aren't showing.
    document.getElementById('countySize').disabled = true; // If we've run anything, this can't be modified anymore,
    document.getElementById('numFlocks').disabled = true; // or this,
    document.getElementById('initialFlockSize').disabled = true; // or this.
    if (viewState.show === "docs") issue(viewState, {show: "county"}); // If we're on the documentation view, switch to county.
  }
}

function revealParams () { // Expand parameter UI elements...
  issue(paramState, {show: true}) // ...notify subscribers that parameters should be showing...
  issue(gospel, {message: "You have opened the parameters panel. You can adjust any parameters you'd like to alter, or just click 'Continue Simulation' to add more seasons. "}); // ...and update the help message.
}

function formatParameters () {
  let formattedParams = {};
  for (let key in parameters) { // This is a bit of a placeholder for some special casing on the strategy parameter we may do later.
    formattedParams[key] = key === "strategy" ? parameters[key] : parameters[key];
  }
  return formattedParams;
}

function setTurn (turn) { // Turns are the same as seasons.
  if (turn !== simulationState.turn) { // If the turn passed in is different from the one in maintained state...
    issue(simulationState, {turn}); // ...change the state and notify subscribers...
    issue(viewState, {show: "county"}); // ...and change the view to county.
  }
}

function toggleViewButtons(disabled) { // Disable or enable all the view buttons.
  let vbs = document.getElementsByClassName('view-button');
  for (let vb of vbs) {
    vb.disabled = disabled;
  }
}

function liveSheep (allSheep) {
  let gotALiveOne = false; // Initially assume all sheep are dead.
  for (let sheep of allSheep) { // Look for one not dead of hunger in latest season...
    gotALiveOne = sheep.hunger[sheep.hunger.length - 1] <= parameters.sheepEndurance;
    if (gotALiveOne) break; // ...as soon as you find one, break.
  }
  return gotALiveOne; // Return whether you found one.
}

function blackSheepStatus () {
  let usRejoice = false; // This excessively coyly named variable is just about whether there are sheep left to shepherd in manual mode.
  if (messiah.flock) { // If the black sheep flock has already been chosen...
    usRejoice = liveSheep(messiah.flock.sheep); // ...look through it for at least one living sheep.
  } else { // If the black sheep flock hasn't been chosen yet...
      let flocks = simulationState.flocks;
      for (let flock of flocks) { // ...look through every flock.
        usRejoice = liveSheep(flock.sheep);
        if (usRejoice) { // As soon as you find one with a living sheep,
          messiah.flock = flock; // make that the black sheep flock,
          flock.manual = true; // and set it to use manual controls.
          break; // (and stop looking)
        }
      }
    }
  return usRejoice; // Return whether we have a black sheep flock.
}

function toggleManual () {
  let blackSheep = blackSheepStatus(); // Find out if the black sheep flock has any survivors.
  let manCtrls = document.getElementsByClassName('manual'); // Get the manual controls...
  let messiahMessage;
  if (messiah.isRisen) { // ...if manual mode is on...
    for (let ctrl of manCtrls) { // ...collapse the controls...
      ctrl.style.maxHeight = "0px";
      ctrl.style.margin = "0px";
    }
    keymage.popScope(); // ...release the keybindings...
    messiahMessage = "THE UR-SHEPHERD HAS RETURNED TO HER DIVINE BOWER."; // ...set the close message...
    issue(messiah, {isRisen: false}); // ...and turn manual mode off. 
  } else {
    for (let ctrl of manCtrls) { // Otherwise, expand the controls...
      ctrl.style.maxHeight = "50px";
      ctrl.style.margin = "6px";
    }
    messiahMessage = blackSheep ? "THE UR-SHEPHERD IS RISEN. The Black Sheep are yours to command, O Great One. The w/a/s/d keys (or labeled buttons below) will guide them, with 'x' indicating the flock should stay in the same glen for one season." : "THE UR-SHEPHERD IS RISEN. But sadly, her flock is no more :("; // ...set the manual mode help message...
    keymage.pushScope('manual'); // ...activate the keybindings...
    issue(viewState, {show: "county"}); // ...and the county view...
    issue(messiah, {isRisen: true}); // ...turn manual mode on...
    issue(paramState, {show: false}) // ...close the parameters panel...
    setTurn(simulationState.parameters.numTurns); // ...and make sure the most recent turn is showing.
  }
  issue(gospel, {message: messiahMessage}); // Display the selected help string.
}

function manualMove (turns, glen) {
  if (messiah.isRisen) { // If manual mode is actually on...
    simulationState.parameters = Object.assign({}, parameters); // ...COPY PARAMETERS OR YOU'LL CORRUPT THEM.
    simulationState.parameters.numTurns = 1; // And we'll only advance one season at a time.
    simulationState.parameters.manual = glen; // Put the manual move in the right place.
    updateSimulation(true); // Update, noting that we are continuing.
    turns++; // Increment turns,
    setTurn(turns); // and set them for the UI.
  }
}

function getManualMoves ({position: [column, row], links}) { // This gets the possible move targets for the black sheep flock.
  let moves = [];
  for (let link of links) {
    let lcolumn = link.position[0];
    let lrow = link.position[1];
    if ( lcolumn === column) { // The manual mode functions expect the move options in a consistent [stay, left, up, right, down] order.
      if ( lrow === row) {
        moves[0] = link
      } else if ( lrow === row - 1 ) {
        moves[2] = link
      } else if ( lrow === row + 1 ) {
        moves[4] = link
      }
    } else if (lrow === row) {
      if ( lcolumn === column - 1) {
        moves[1] = link
      } else if ( lcolumn === column + 1) {
        moves[3] = link
      }
    }
  }
  return moves;
}

function tempMessage (id) { // This places a temporary mouseover message in the help window.
  let message = (id === "restore") ? gospel.message : (id === "strategy") ? "This is the strategy each flock will use to decide where to move. See the documentation (click '?') for descriptions of currently available strategies." : paramData[id].message; // Set the message.
  let messageElt = document.getElementById('viz-message'); // Get the message window.
  if (messageElt !== null) {
    let messageText = messageElt.firstChild;
    messageText.textContent = message; // Set text content of window to message. 
  }
}

function resizeControls () { // We sometimes need to correct the height of the control panel.
  let controlsDiv = document.getElementById('controls-wrapper');
    if (controlsDiv !== null) {
      let controlsHeight = controlsDiv.firstChild.scrollHeight + 12; // There's an intermediate div.
      if (controlsDiv.style.height !== controlsHeight) {
        let heightString = `${ controlsHeight }${"px"}`;
        controlsDiv.style.height = heightString; // Match its height.
      }
    }
}

function cn (base, isValid) { // This is just a little formatting utility.
  return `${base} ${isValid ? "valid" : "invalid"}`;
}


// React Components for controls

const MessageBox = connect(gospel, ({message}) => { // The help message window subscribes to a content string.
  let messageElt = document.getElementById('viz-message');
  let messageNewHeightString = "0pt";
  if (messageElt !== null) { // If the message box has been rendered...
    let messageText = messageElt.firstChild; // ...its first child is where we put our message.
    messageText.textContent = message;
    let messageNewHeight = messageText.clientHeight; // Resize the enclosing box to match content.
    messageNewHeightString = messageNewHeight + 'px';
    if (messageElt.style.height !== messageNewHeight) {
        messageElt.style.height = messageNewHeightString;
    }
  }
  return ( // This is the actual React element.
    <div id="viz-message" height={messageNewHeightString}>
      <p>{message}</p>
    </div>
    )
});

const TurnsLabel = connect(simulationState, ({turn, parameters: {numTurns}}) => {
  let label = (turn === 0) ? "Pre-season initial state." : `Season ${turn} of ${numTurns}.`;
  return (<p>{label}</p>)}); // Label for what season we're in, subscribes to global state.

const Numeric = ({id}) => ( // Numeric control panel elements have a common design pattern.
  <div
    className={cn("control numeric-input", validate(id))}
    onMouseEnter={() => tempMessage(id)} 
    onMouseLeave={() => tempMessage("restore")} // mouseover help message functions
  >
    <input 
      id={id}
      type="text" 
      value={parameters[id]} 
      onChange={(event) => updateParameter(id, event.target.value)} // Event handler for changes in value
      required 
    />
    <label htmlFor={id}>{paramData[id].label}</label>
  </div>
);

const runButton = () => { // Get the correct simulation advancing button.
  return (
    paramState.starting ? 
    ( <button className={cn("run", paramState.valid)} onClick={initSim}>Begin Simulation</button> ) // For intitializing
    : ( <button className={cn("run", paramState.valid)} onClick={contSim}>Continue Simulation</button> ) // For continuing
  )
}

const paramButton = () => ( <button className={cn("run", paramState.valid)} onClick={revealParams}>Show Parameters</button> ); // Button to unfold parameter controls

const GetButton = connect(paramState, ({show}) => { // Get the correct main simulation UI button.
  let mainButton = show ? runButton() : paramButton();
  return ( 
    <div className='core'>
      {mainButton}
    </div>)
});

const ParamControls = connect(paramState, ({show}) => { // This subscribes to the parameter controls display state...
  let marginString = show ? "0.25rem 0" : "0"; // ...and expands or contracts the margins...
  let heightString = show ? "25px" : "0"; // ...and height of the parameters panel.
  let ctrls = document.getElementsByClassName('control');
  for (let ctrl of ctrls) {
    ctrl.style.margin = marginString;
    ctrl.style.maxHeight = heightString;
  }
  return ( // Then returns the React element for the entire panel.
    <>
      <Numeric id="countySize" />
      <Numeric id="numFlocks" />
      <Numeric id="initialFlockSize" />
      <Numeric id="numTurns" />
      <Numeric id="glenGrowthRate" />
      <Numeric id="sheepGreed" />
      <Numeric id="sheepEndurance" />
      <Numeric id="sheepReproductionRate" />
      <div 
        className="control" 
        onMouseEnter={() => tempMessage("strategy")} // mouseover help message functions
        onMouseLeave={() => tempMessage("restore")}>
        <select // This is the strategy select menu 
          id="strategy" 
          onChange={(event) => updateParameter("strategy", event.target.value)} // Event handler for changes in value
          >
          <option value="random">Random</option>
          <option value="maxAbundance">Max Abundance</option>
          <option value="weighted">Weighted</option>
        </select>
        <label htmlFor="strategy">Strategy</label>
      </div>
    </>
)});

const TurnManual = connect(simulationState, ({parameters: {numTurns}}) => { // This is the control panel for manually guiding flocks. It subscribes to the global state, specifically to how many seasons have been modeled.
  let glen = messiah.flock ? messiah.flock.glen[numTurns] : simulationState.glens[0]; // Look for the glen the black sheep flock is in, but if there isn't one yet use a placeholder.
  if (glen === undefined) { // Also use placeholder for corner case where the black sheep flock exists but isn't assigned a glen.
    glen = simulationState.glens[0];
  }
  let moves = getManualMoves(glen); // This returns an array of glens the black sheep flock could move to.
  let dirStrings = ['x', 'a', 'w', 'd', 's']; // These are the labels for keys to bind below.
  if (messiah.flock) {
    for (let i=0; i<5; i++) { // This manages keymage key binding listeners.
      if (messiah.holyGhosts[i]) { // Release any that exist...
        messiah.holyGhosts[i]()
      }
      if (moves[i] !== undefined) { // Create new ones for all defined moves.
        messiah.holyGhosts[i] = keymage('manual', dirStrings[i], function() { 
          manualMove(numTurns, moves[i]) }, {preventDefault: true})
      }
    }
  }
  
  return ( // A React UI element for buttons that do the same thing as above keybindings.
  <div className="wrapper">
    <div className="manual">
      <button className={cn("move", moves[1] !== null)} onClick={() => manualMove(numTurns, moves[2])}>w</button>
    </div>
    <div className="manual">
      <button className={cn("move", moves[1] !== null)} onClick={() => manualMove(numTurns, moves[1])}>a</button>
      <button className={cn("move", moves[0] !== null)} onClick={() => manualMove(numTurns, moves[0])}>x</button>
      <button className={cn("move", moves[3] !== null)} onClick={() => manualMove(numTurns, moves[3])}>d</button>
    </div>
    <div className="manual">
      <button className={cn("move", moves[1] !== null)} onClick={() => manualMove(numTurns, moves[4])}>s</button>
    </div>
  </div>
)});

const TurnSlider = connect(simulationState, ({turn, parameters: {numTurns}}) => ( // This subscribes to the global state and builds a panel for advancing/turning back the county display.
  <div className="wrapper">
    <div className="play-controls">
      <button 
        className={cn("icon", turn !== 0)} 
        onClick={() => setTurn(Math.max(0, turn - 1))} // Set the season shown to previous, unless already at first
      >|◀</button>
      <button 
        className={cn("icon", turn !== numTurns)} 
        onClick={() => setTurn(Math.min(numTurns, turn + 1))} // Set the season shown to next, unless already at last
      >▶|</button>
      <input // Season slider
        type="range"
        value={turn}
        min="0"
        max={numTurns}
        step="1"
        onChange={(event) => setTurn(event.target.valueAsNumber)} />
    </div>
    <div className="play-controls">
      <TurnsLabel />
    </div>
  </div>
));

const Controls = connect(gospel, () => { // This builds the overall controls panel React element.
  let controlsDivs = document.getElementsByClassName('controls');
  if (controlsDivs.length !== 0) {
    for (let eachDiv of controlsDivs) {
      eachDiv.addEventListener("transitionend", function() {
      resizeControls(); // Whenever its internals finish a transition, the control panel resizes to the correct height.
      }, false);
    }
  }
return (
  <div id="controls-wrapper">
    <div className="controls">
      <h1>The Grazing Game</h1>
      <MessageBox />
      <TurnManual />
      <GetButton />
      <ParamControls />
    </div>
  </div>
)
});


// Display MarkDown documentation or graph visualization

const ViewToggle = (target, label) => connect(viewState, ({show}) => ( // Common constructor pattern for the display switches, subscribes to viewState to know what to show.
    <button 
      className={` view-button ${(show === target) ? "shown" : "hidden"}`} 
      onClick={() => {
        if (viewState.show !== target) issue(viewState, {show: target}); // Update what is to be shown 
        document.getElementById('root').scrollTop=0; // Reset view to top of root element 
        resizeControls()
        }}
    >{label}</button> )
);

const DocToggle = ViewToggle("docs", "?"); // Markdown documentation

const CountyToggle = ViewToggle("county", "፨"); // Graphical display of individual glens and sheep for one season at a time.

const ChartToggle = ViewToggle("charts", "🗠"); // Charts of statistical profiles of county across seasons.

const VizControls = () => ( // Complete display switch panel
  <div id="displays-wrapper">
    <DocToggle />
    <CountyToggle />
    <ChartToggle />
  </div>
);

const Doc = () => ( <div className="markdown-body" dangerouslySetInnerHTML={{__html: html}} height="auto" /> ); // Documentation element created from README.md

const CountyCharts = connect(simulationState, (state) => { // Statistical charts made using Victory libraries and data serialized in data.js, subscribes to global state changes.
  let {populations, aStats, fStats, flockMax} = chartStats(state); // See data.js
  let domainX = [0, populations.length - 1]; // These are for formatting axes.
  let domainAY = [0, 1.1];
  let domainSY = [0, state.allSheep.length];
  let domainFY = [0, flockMax];

  return ( // See Victory documentation: https://formidable.com/open-source/victory/docs/
    <div className="charts">
      <VictoryChart
      theme={VictoryTheme.material}
      width={1000} height={500}
      animate={{duration: 500}}
      containerComponent={
        <VictoryContainer 
        width={1000} height={600} 
        style={{ parent: { maxWidth: "80%" } }}
        className="vchart" />
      }>
          <VictoryLegend x={125} y={500}
            title="Average Abundance by Season"
            centerTitle
            orientation="horizontal"
            gutter={20}
            style={{ border: { stroke: "black" }, title: {fontSize: 20 } }}
            data={[
              { name: "Mean", symbol: { fill: "green" } },
              { name: "Median", symbol: { fill: "brown" } }
            ]}
          />
          <VictoryLine
              style={{data:
              {stroke: "brown", strokeWidth: 3}
              }}
              data={aStats}
              y="median"
          />
          <VictoryLine
              style={{data:
              {stroke: "green", strokeWidth: 3}
              }}
              data={aStats}
              y="mean"
          />
          <VictoryAxis 
            domain={domainX}
            theme={VictoryTheme.material} />
          <VictoryAxis 
            dependentAxis
            domain={domainAY}
            theme={VictoryTheme.material}
          />
      </VictoryChart>
      <VictoryChart
      theme={VictoryTheme.material}
      width={1000} height={500}
      animate={{duration: 500}}
      containerComponent={
        <VictoryContainer 
        width={1000} height={600} 
        style={{ parent: { maxWidth: "80%" } }}
        className="vchart" />
      }>
          <VictoryLegend x={125} y={500}
            title="Average (Surviving) Flock Size by Season"
            centerTitle
            orientation="horizontal"
            gutter={20}
            style={{ border: { stroke: "black" }, title: {fontSize: 20 } }}
            data={[
              { name: "Mean", symbol: { fill: "grey" } },
              { name: "Median", symbol: { fill: "black" } }
            ]}
          />
          <VictoryLine
              style={{data:
              {stroke: "black", strokeWidth: 3}
              }}
              data={fStats}
              y="median"
          />
          <VictoryLine
              style={{data:
              {stroke: "grey", strokeWidth: 3}
              }}
              data={fStats}
              y="mean"
          />
          <VictoryAxis 
            domain={domainX}
            theme={VictoryTheme.material} />
          <VictoryAxis 
            dependentAxis
            domain={domainFY}
            theme={VictoryTheme.material}
          />
      </VictoryChart>
      <VictoryChart
      theme={VictoryTheme.material}
      width={1000} height={500}
      animate={{duration: 500}}
      containerComponent={
        <VictoryContainer 
        width={1000} height={600} 
        style={{ parent: { maxWidth: "80%" } }}
        className="vchart" />
      }>
          <VictoryLegend x={125} y={500}
            title="Total Sheep Population by Season"
            centerTitle
            orientation="horizontal"
            gutter={20}
            style={{ border: { stroke: "black" }, title: {fontSize: 20 } }}
            data={[
              { name: "Population", symbol: { fill: "black" } }
            ]}
          />
          <VictoryLine
              style={{data:
              {stroke: "black", strokeWidth: 3}
              }}
              data={populations}
          />
          <VictoryAxis 
            domain={domainX}
            theme={VictoryTheme.material} />
          <VictoryAxis 
            dependentAxis
            domain={domainSY}
            theme={VictoryTheme.material}
            />
      </VictoryChart>
    </div>
  )
});

const GraphView = connect(simulationState, ({turn, parameters, glens, flocks}) => { // This generates the single-season graphical county view.
  let gridSpacing = 1000 / parameters.countySize; // Divide the space up based on number of glens
  let glenRadius = gridSpacing * 0.45; // Glens don't quite fill their spaces 
  let sheepRadius = glenRadius * 0.075; // Sheep are tiny compared to glens
  let offset = gridSpacing / 2; // Vertices are the centers of glens, and need to be offset for edge glens to be fully in view
  return (
    <div className='charts'>
    <svg viewBox="0 0 1000 1000">
      <rect width="100%" height="100%" fill="rgb(167, 182, 198)" />
      <g>
        {glens.map(({position: [x, y], abundance}, index) => ( // Green circles for the glens
          <circle cx={x * gridSpacing + offset} cy={y * gridSpacing + offset} r={glenRadius} fill={`hsl(114, ${Math.round(100*abundance[turn])}%, 23%)`} key={index} />
        ))}
      </g>
      <g>
        {flocks.map(({glen, sheep, manual}, flockIndex) => (
          <g key={flockIndex}>
            {sheep.map(({hunger}, sheepIndex) => { // White circles, scattered radially within the grove, for sheep.
              let currentHunger = hunger[turn];
              let r = Math.random();
              let angle = Math.random() * 2 * Math.PI;
              let cx = (glen[turn].position[0] * gridSpacing) + (Math.cos(angle) * r * glenRadius * 0.9) + offset;
              let cy = (glen[turn].position[1] * gridSpacing) + (Math.sin(angle) * r * glenRadius * 0.9) + offset;
              let alpha = (currentHunger < 0 || currentHunger > parameters.sheepEndurance) ? 0 : 1 - currentHunger/(parameters.sheepEndurance + 1);
              let sheepFill = manual ? `rgba(0, 0, 0, ${alpha})` : `rgba(255, 255, 255, ${alpha})`; // Sheep are white (or black for manual), increasingly translucent when hungry
              return <circle r={sheepRadius} style={{transform: `translate(${cx}px, ${cy}px)`}} fill={sheepFill} key={sheepIndex} />;
            })}
          </g>
        ))}
      </g>
    </svg>
    <TurnSlider />
    </div>
  );
});

const Viz = connect(viewState, ({show}) => { // Subscribe to know what is to be shown
  let viz;
  switch(show) {
    case "docs":
        viz = Doc();
        break;
    case "charts":
        viz = CountyCharts();
        break;
    default:
        viz = GraphView();
  }
  return viz;
  });


// Render to DOM

ReactDOM.render((
  <>
    <Controls />
    <VizControls />
    <div id="view-wrapper">
      <Viz />
    </div>
  </>
), document.getElementById('root'));

// Post-render initializations

function ggInitialize () {
  toggleViewButtons(true);
  issue(gospel, {message: "Welcome to The Grazing Game. Please customize your parameters using the fields below, and then click on the 'Begin Simulation' button."});
}

ggInitialize();