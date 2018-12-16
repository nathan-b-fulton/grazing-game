import React from 'react';
import ReactDOM from 'react-dom';
import {VictoryChart, VictoryLine, VictoryTheme, VictoryAxis, VictoryContainer, VictoryLegend} from 'victory';
import {connect} from 'react-zine';
import {issue} from 'zine';
import keymage from 'keymage';
import {initializeSimulation} from './simulation';
import {advanceSimulation} from './simulation';
import {abundanceStats} from './data';
import {sheepStats} from './data';
import html from '../README.md';

// State Containers & Constants

const parameters = {
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

const paramState = {valid: true, starting: true, show: true};

const simulationState = initializeSimulation(formatParameters());

const viewState = {show:"docs"};

const messiah = {isRisen: false, flock: false, holyGhosts: []};

const gospel = {message: ""}


// Helper Functions

function validate (id) {
  if (id === "strategy" || "manual") return true;
  let value = Number.parseFloat(parameters[id]);
  console.log(id);
  let {min, max, isFloat} = paramData[id];
  let isNumberType = isFloat ? !Number.isNaN(value) : Number.isInteger(value)

  return isNumberType && value >= min && value <= max;
}

function updateParameter (id, value) {
  parameters[id] = value;

  let valid = true;
  for (let key in parameters) {
    if (!validate(key)) {
      valid = false;
      break;
    }
  }
  if (paramState.starting===false) {
    issue(gospel, {message: "You have altered some parameters. If you want to add seasons to your simulation, click 'Continue Simulation'. "});
  }
  issue(paramState, {valid});
}

function initSim () {
  issue(paramState, {starting: false});
  let newCounty = updateSimulation(false);
  document.getElementById('root').scrollTop=0;
  toggleViewButtons(false);
  keymage('alt-m', function() { toggleManual() }, {preventDefault: true});
  keymage('left', function() {setTurn(Math.max(0, simulationState.turn - 1))});
  keymage('right', function() {setTurn(Math.min(simulationState.parameters.numTurns, simulationState.turn + 1))});
  issue(gospel, {message: "You have now run a simulation. Click the |◀ and ▶| buttons below the county display to adjust the view by season, or use the left and right arrow keys, or drag the slider."});
  return newCounty;
}

function contSim () {
  simulationState.parameters = Object.assign({}, parameters);
  simulationState.parameters.manual = null;
  issue(gospel, {message: "You have added seasons to the simulation. Click the |◀ and ▶| buttons below the county display to adjust the view by season, or use the left and right arrow keys, or drag the slider."});
  return updateSimulation(true);
}

function updateSimulation (cont) {
  if (paramState.valid) {
    issue(simulationState, (cont ? advanceSimulation(simulationState) : initializeSimulation(formatParameters())));
    let ctrls = document.getElementsByClassName('control');
    let i;
    for (i = 0; i < ctrls.length; i++) {
      ctrls[i].style.margin =  "0px";
      ctrls[i].style.maxHeight = "0px";
    }
    document.getElementById('countySize').disabled = true;
    document.getElementById('numFlocks').disabled = true;
    document.getElementById('initialFlockSize').disabled = true;
    if (viewState.show === "docs") issue(viewState, {show: "county"});
    issue(paramState, {show: false})
  }
}

function revealParams () {
  let ctrls = document.getElementsByClassName('control');
  let i;
  for (i = 0; i < ctrls.length; i++) {
    ctrls[i].style.margin = "0.25rem 0";
    ctrls[i].style.maxHeight = "25px";
  }
  issue(paramState, {show: true})
  issue(gospel, {message: "You have opened the parameters panel. You can adjust any parameters you'd like to alter, or just click 'Continue Simulation' to add more seasons. "});
}

function formatParameters () {
  let formattedParams = {};
  for (let key in parameters) {
    formattedParams[key] = key === "strategy" ? parameters[key] : parameters[key];
  }
  return formattedParams;
}

function setTurn (turn) {
  if (turn !== simulationState.turn) {
    issue(simulationState, {turn});
    issue(viewState, {show: "county"});
  }
}

function toggleViewButtons(disabled) {
  let vbs = document.getElementsByClassName('view-button');
  for (let vb of vbs) {
    vb.disabled = disabled;
  }
}

function blackSheepStatus () {
  let usRejoice = false;
  if (messiah.flock) {
    let allSheep = messiah.flock.sheep;
    for (let sheep in allSheep) {
      let hungers = allSheep[sheep].hunger;
      let hunger = hungers[hungers.length - 1];
      if (hunger <= parameters.sheepEndurance) {
        usRejoice = true;
        break;
      }
    }
  } else {
      let flocks = simulationState.flocks;
      for (let flock in flocks) {
        let allSheep = flocks[flock].sheep;
        for (let sheep in allSheep) {
          let hungers = allSheep[sheep].hunger;
          let hunger = hungers[hungers.length - 1];
          if (hunger <= parameters.sheepEndurance) {
            let blackFlock = flocks[flock];
            usRejoice = true;
            messiah.flock = blackFlock;
            blackFlock.manual = true;
            break;
          }
        }
        if (messiah.flock) {
          break;
        }
      }
  }
  return usRejoice;
}

function toggleManual () {
  let blackSheep = blackSheepStatus();
  let manCtrls = document.getElementsByClassName('manual');
  let messiahMessage;
  let i;
  if (messiah.isRisen) {
    for (i = 0; i < manCtrls.length; i++) {
      manCtrls[i].style.maxHeight = "0px";
      manCtrls[i].style.margin = "0px";
    }
    keymage.popScope();
    messiahMessage = "THE UR-SHEPHERD HAS RETURNED TO HER DIVINE BOWER.";
    issue(messiah, {isRisen: false});
  } else {
    for (i = 0; i < manCtrls.length; i++) {
      manCtrls[i].style.maxHeight = "50px";
      manCtrls[i].style.margin = "6px";
    }
    messiahMessage = blackSheep ? "THE UR-SHEPHERD IS RISEN. The Black Sheep are yours to command, O Great One. The w/a/s/d keys (or labeled buttons below) will guide them, with 'x' indicating the flock should stay in the same glen for one season." : "THE UR-SHEPHERD IS RISEN. But sadly, her flock is no more :(";
    keymage.pushScope('manual');
    issue(viewState, {show: "county"});
    issue(messiah, {isRisen: true});
    issue(paramState, {show: false})
    setTurn(simulationState.parameters.numTurns);
  }
  issue(gospel, {message: messiahMessage});
}

function manualMove (turns, glen) {
  if (messiah.isRisen) {
    simulationState.parameters = Object.assign({}, parameters);
    simulationState.parameters.numTurns = 1;
    simulationState.parameters.manual = glen;
    updateSimulation(true);
    turns++;
    setTurn(turns);
  }
}

function getManualMoves ({position: [column, row], links}) {
  let moves = [];
  for (let link of links) {
    let lcolumn = link.position[0];
    let lrow = link.position[1];
    if ( lcolumn === column) {
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

function tempMessage (id) {
  let message = (id === "restore") ? gospel.message : (id === "strategy") ? "This is the strategy each flock will use to decide where to move. See the documentation (click '?') for descriptions of currently available strategies." : paramData[id].message;
  let messageElt = document.getElementById('viz-message');
  if (messageElt !== null) {
    let messageText = messageElt.firstChild;
    messageText.textContent = message;
  }
}

function resizeControls () {
  let controlsDiv = document.getElementById('controls-wrapper');
    if (controlsDiv !== null) {
      let controlsHeight = controlsDiv.firstChild.scrollHeight + 12;
      if (controlsDiv.style.height !== controlsHeight) {
        let heightString = `${ controlsHeight }${"px"}`;
        controlsDiv.style.height = heightString;
      }
    }
}

function cn (base, isValid) {
  return `${base} ${isValid ? "valid" : "invalid"}`;
}


// React Components for controls

const MessageBox = connect(gospel, ({message}) => {
  let messageElt = document.getElementById('viz-message');
  let messageNewHeightString = "0pt";
  if (messageElt !== null) {
    let messageText = messageElt.firstChild;
    messageText.textContent = message;
    let messageNewHeight = messageText.clientHeight;
    messageNewHeightString = messageNewHeight + 'px';
    if (messageElt.style.height !== messageNewHeight) {
        messageElt.style.height = messageNewHeightString;
    }
  }
  return (
    <div id="viz-message" height={messageNewHeightString}>
      <p>{message}</p>
    </div>
    )
});

const TurnsLabel = connect(simulationState, ({turn, parameters: {numTurns}}) => {
  let label = (turn === 0) ? "Pre-season initial state." : `Season ${turn} of ${numTurns}.`;
  return (<p>{label}</p>)});

const Numeric = ({id}) => (
  <div className={cn("control numeric-input", validate(id))} onMouseEnter={() => tempMessage(id)} onMouseLeave={() => tempMessage("restore")}>
    <input id={id} type="text" value={parameters[id]} onChange={(event) => updateParameter(id, event.target.value)} required />
    <label htmlFor={id}>{paramData[id].label}</label>
  </div>
);

const runButton = () => {
  return (
    paramState.starting ? 
    ( <button className={cn("run", paramState.valid)} onClick={initSim}>Begin Simulation</button> )
    : ( <button className={cn("run", paramState.valid)} onClick={contSim}>Continue Simulation</button> )
  )
}

const paramButton = () => ( <button className={cn("run", paramState.valid)} onClick={revealParams}>Show Parameters</button> );

const GetButton = connect(paramState, ({show}) => {
  let mainButton = show ? runButton() : paramButton();
  return (
    <div className='core'>
      {mainButton}
    </div>)
});

const ParamControls = connect(paramState, () => (
  <>
    <Numeric id="countySize" />
    <Numeric id="numFlocks" />
    <Numeric id="initialFlockSize" />
    <Numeric id="numTurns" />
    <Numeric id="glenGrowthRate" />
    <Numeric id="sheepGreed" />
    <Numeric id="sheepEndurance" />
    <Numeric id="sheepReproductionRate" />
    <div className="control" onMouseEnter={() => tempMessage("strategy")} onMouseLeave={() => tempMessage("restore")}>
      <select id="strategy" onChange={(event) => updateParameter("strategy", event.target.value)}>
        <option value="random">Random</option>
        <option value="maxAbundance">Max Abundance</option>
        <option value="weighted">Weighted</option>
      </select>
      <label htmlFor="strategy">Strategy</label>
    </div>
  </>
));

const TurnManual = connect(simulationState, ({parameters: {numTurns}}) => {
  let glen = messiah.flock ? messiah.flock.glen[numTurns] : simulationState.glens[0];
  if (glen === undefined) {
    glen = simulationState.glens[0];
  }
  let moves = getManualMoves(glen);
  let dirStrings = ['x', 'a', 'w', 'd', 's'];
  if (messiah.flock) {
    for (let i=0; i<5; i++) {
      if (messiah.holyGhosts[i]) {
        messiah.holyGhosts[i]()
      }
      if (moves[i] !== undefined) {
        messiah.holyGhosts[i] = keymage('manual', dirStrings[i], function() { manualMove(numTurns, moves[i]) }, {preventDefault: true})
      }
    }
  }
  
  return (
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

const TurnSlider = connect(simulationState, ({turn, parameters: {numTurns}}) => (
  <div className="wrapper">
    <div className="play-controls">
      <button className={cn("icon", turn !== 0)} onClick={() => setTurn(Math.max(0, turn - 1))}>|◀</button>
      <button className={cn("icon", turn !== numTurns)} onClick={() => setTurn(Math.min(numTurns, turn + 1))}>▶|</button>
      <input 
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

const Controls = connect(gospel, () => {
  let controlsDivs = document.getElementsByClassName('controls');
  if (controlsDivs.length !== 0) {
    for (let eachDiv of controlsDivs) {
      eachDiv.addEventListener("transitionend", function() {
      resizeControls();
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

const ViewToggle = (target, label) => connect(viewState, ({show}) => ( 
    <button className={` view-button ${(show === target) ? "shown" : "hidden"}`} onClick={() => {if (viewState.show !== target) issue(viewState, {show: target}); document.getElementById('root').scrollTop=0; resizeControls()}}>{label}</button> )
);

const DocToggle = ViewToggle("docs", "?");

const CountyToggle = ViewToggle("county", "፨");

const ChartToggle = ViewToggle("charts", "🗠");

const VizControls = () => (
  <div id="displays-wrapper">
    <DocToggle />
    <CountyToggle />
    <ChartToggle />
  </div>
);

const Doc = () => ( <div className="markdown-body" dangerouslySetInnerHTML={{__html: html}} height="auto" /> );

const CountyCharts = connect(simulationState, ({parameters, glens, flocks}) => {
  let endurance = parameters.sheepEndurance;
  let aStats = abundanceStats(glens);
  let sStats = sheepStats(flocks, endurance);
  let maxX = aStats.means.length - 1;
  let domainX = [0, maxX];
  let domainAY = [0, 1.1];
  let domainSY = [0, sStats.totalSheep];
  let domainFY = [0, sStats.flockMax];

  return (
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
              data={aStats.medians}
          />
          <VictoryLine
              style={{data:
              {stroke: "green", strokeWidth: 3}
              }}
              data={aStats.means}
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
              data={sStats.medianFlocks}
          />
          <VictoryLine
              style={{data:
              {stroke: "grey", strokeWidth: 3}
              }}
              data={sStats.meanFlocks}
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
              data={sStats.populations}
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

const GraphView = connect(simulationState, ({turn, parameters, glens, flocks}) => {
  let gridSpacing = 1000 / parameters.countySize;
  let glenRadius = gridSpacing * 0.45;
  let sheepRadius = glenRadius * 0.075;
  let offset = gridSpacing / 2;
  return (
    <div className='charts'>
    <svg viewBox="0 0 1000 1000">
      <rect width="100%" height="100%" fill="rgb(167, 182, 198)" />
      <g>
        {glens.map(({position: [x, y], abundance}, index) => (
          <circle cx={x * gridSpacing + offset} cy={y * gridSpacing + offset} r={glenRadius} fill={`hsl(114, ${Math.round(100*abundance[turn])}%, 23%)`} key={index} />
        ))}
      </g>
      <g>
        {flocks.map(({glen, sheep, manual}, flockIndex) => (
          <g key={flockIndex}>
            {sheep.map(({hunger}, sheepIndex) => {
              let currentHunger = hunger[turn];
              let r = Math.random();
              let angle = Math.random() * 2 * Math.PI;
              let cx = (glen[turn].position[0] * gridSpacing) + (Math.cos(angle) * r * glenRadius * 0.9) + offset;
              let cy = (glen[turn].position[1] * gridSpacing) + (Math.sin(angle) * r * glenRadius * 0.9) + offset;
              let alpha = (currentHunger < 0 || currentHunger > parameters.sheepEndurance) ? 0 : 1 - currentHunger/(parameters.sheepEndurance + 1);
              let sheepFill = manual ? `rgba(0, 0, 0, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
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

const Viz = connect(viewState, ({show}) => {
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