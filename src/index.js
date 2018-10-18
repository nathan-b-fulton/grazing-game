import React from 'react';
import ReactDOM from 'react-dom';
import {connect} from 'react-zine';
import {issue} from 'zine';
import {runSimulation} from './simulation';

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
  strategy: "random"
};

const paramData = {
  numTurns: {label:  "Number of Seasons", min: 1, max: Infinity, isFloat: false},
  countySize: {label:  "County Size", min: 1, max: Infinity, isFloat: false},
  glenGrowthRate: {label:  "Glen Growth Rate", min: 1, max: Infinity, isFloat: true},
  numFlocks: {label:  "Number of Flocks", min: 1, max: Infinity, isFloat: false},
  initialFlockSize: {label:  "Initial Flock Size", min: 1, max: Infinity, isFloat: false},
  sheepGreed: {label:  "Sheep Greed", min: 0, max: 1, isFloat: true},
  sheepEndurance: {label:  "Sheep Endurance", min: 0, max: Infinity, isFloat: false},
  sheepReproductionRate: {label:  "Sheep Reproduction Rate", min: 0, max: 1, isFloat: true}
};

const paramState = {valid: true};

const simulationState = runSimulation(formatParameters());


// Helper Functions


function validate (id) {
  if (id === "strategy") return true;
  let value = Number.parseFloat(parameters[id]);
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

  issue(paramState, {valid});
}

function updateSimulation () {
  if (paramState.valid) {
    issue(simulationState, runSimulation(formatParameters()));
  }
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
  }
}

function cn (base, isValid) {
  return `${base} ${isValid ? "valid" : "invalid"}`;
}

// React Components

const Numeric = ({id}) => (
  <div className={cn("control numeric-input", validate(id))}>
    <input id={id} type="text" value={parameters[id]} onChange={(event) => updateParameter(id, event.target.value)} required />
    <label htmlFor={id}>{paramData[id].label}</label>
  </div>
);

const ParamControls = connect(paramState, () => (
  <>
    <Numeric id="numTurns" />
    <Numeric id="countySize" />
    <Numeric id="glenGrowthRate" />
    <Numeric id="numFlocks" />
    <Numeric id="initialFlockSize" />
    <Numeric id="sheepGreed" />
    <Numeric id="sheepEndurance" />
    <Numeric id="sheepReproductionRate" />
    <div className="control">
      <select id="strategy" onChange={(event) => updateParameter("strategy", event.target.value)}>
        <option value="random">Random</option>
        <option value="maxAbundance">Max Abundance</option>
        <option value="weighted">Weighted</option>
      </select>
      <label htmlFor="strategy">Strategy</label>
    </div>
    <button className={cn("run", paramState.valid)} onClick={updateSimulation}>Run Simulation</button>
  </>
));

const TurnSlider = connect(simulationState, ({turn, parameters: {numTurns}}) => (
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
));

const GraphView = connect(simulationState, ({turn, parameters, glens, flocks}) => {
  let gridSpacing = 1000 / parameters.countySize;
  let glenRadius = gridSpacing * 0.45;
  let sheepRadius = glenRadius * 0.075;
  let offset = gridSpacing / 2;
  return (
    <svg viewBox="0 0 1000 1000">
      <rect width="100%" height="100%" fill="rgb(167, 182, 198)" />
      <g>
        {glens.map(({position: [x, y], abundance}, index) => (
          <circle cx={x * gridSpacing + offset} cy={y * gridSpacing + offset} r={glenRadius} fill={`hsl(114, ${Math.round(100*abundance[turn])}%, 23%)`} key={index} />
        ))}
      </g>
      <g>
        {flocks.map(({glen, sheep}, index) => (
          <g key={index}>
            {sheep.map(({hunger}, index) => {
              let currentHunger = hunger[turn];
              let r = Math.random();
              let angle = Math.random() * 2 * Math.PI;
              let cx = (glen[turn].position[0] * gridSpacing) + (Math.cos(angle) * r * glenRadius * 0.9) + offset;
              let cy = (glen[turn].position[1] * gridSpacing) + (Math.sin(angle) * r * glenRadius * 0.9) + offset;
              let alpha = (currentHunger < 0 || currentHunger > parameters.sheepEndurance) ? 0 : 1 - currentHunger/(parameters.sheepEndurance + 1);

              return <circle r={sheepRadius} style={{transform: `translate(${cx}px, ${cy}px)`}} fill={`rgba(255, 255, 255, ${alpha})`} key={index} />;
            })}
          </g>
        ))}
      </g>
    </svg>
  );
});

// Render to DOM

ReactDOM.render((
  <>
    <div className="controls">
      <h1>The Grazing Game</h1>
      <ParamControls />
      <TurnSlider />
    </div>
    <GraphView />
  </>
), document.getElementById('root'));
