/* This file contains all and only code that generates and advances the simulation itself. In a certain sense this is the "actual" Grazing Game, and everything else is UI.

The part of this file most ready for further development is the strategy library. The strategies we have now are few and pretty crude. But the simulation code is quite general and hopefully won't need much updating.

Two functions are exported: initializeSimulation and advanceSimulation. They pretty much do what they say.*/

// Helper functions

function randomInt (min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function shuffle (array) {
  for (let index = array.length - 1; index > 0; index -= 1) {
    let swap = randomInt(0, index + 1)
    let temp = array[index];
    array[index] = array[swap];
    array[swap] = temp;
  }
}

function byAbundance (a, b) {
  return b.currentAbundance - a.currentAbundance || Math.random() - 0.5;
}

// Strategy library, should be expanded in future

const strategies = {
  random: (glens) => glens[randomInt(0, glens.length)], // just pick a random adjacent glen 

  maxAbundance: (glens) => glens.sort(byAbundance)[0], // pick the most abundant adjacent glen

  weighted: (glens) => { // weight glens by abundance, but pick stochastically
    glens.sort(byAbundance);
    let total = 0;
    for (let glen of glens) {
      total += glen.currentAbundance;
    }
    let runningTotal = 0;
    let target = Math.random() * total;
    for (let glen of glens) {
      runningTotal += glen.currentAbundance;
      if (runningTotal >= target) {
        return glen;
      }
    }
    return glens[0];
  }
};

// Setup functions

function generateGrid (parameters) { // This creates all glens at their initial abundance, and links them back to previously created glens that they are positioned adjacent to.
  let countySize = parameters.countySize;
  let glens = [];

  for (let row = 0, index = 0; row < countySize; row++) {
    for (let column = 0; column < countySize; column++, index++) {

      let glen = {
        position: [column, row],
        abundance: [1],
        currentAbundance: 1,
        links: []
      };

      glen.links.push(glen);

      if (column !== 0) { // If we're not in the first column...
        let otherGlen = glens[index - 1]; // ...find the glen in this row in the preceding column...
        glen.links.push(otherGlen); // ...provide it as a link for the current glen...
        otherGlen.links.push(glen); // ...and provide the current glen as a link for it.
      }

      if (row !== 0) { // If we're not in the first row...
        let otherGlen = glens[index - countySize]; // ...find the glen in this column in the preceding row by assuming that column position is modulo row length...
        glen.links.push(otherGlen); // ...provide it as a link for the current glen...
        otherGlen.links.push(glen); // ...and provide the current glen as a link for it.
      }

      glens.push(glen);
    }
  }

  return glens;
}

function addSheep (flock, turnBorn) {
  let hunger = [];
  for (let i = 0; i < turnBorn; i++) { // For all the seasons that happened before this sheep was born...
    hunger.push(-1); // ...add a '-1' hunger entry indicating "unborn".
  }
  hunger.push(0);
  let sheep = {hunger, flock};
  flock.sheep.push(sheep); // First we add it to its flock...
  return sheep; // ...then return it, so that it can be added to the total sheep array.
}

// Exported initialization and advancement functions

export function initializeSimulation (parameters) {
  let glens = generateGrid(parameters); // Grid generation gets its own function (above).
  let allSheep = [];
  let flocks = [];

  for (let curFlock = 0; curFlock < parameters.numFlocks; curFlock++) {
    let flock = {glen: [glens[randomInt(0, glens.length)]], sheep: [], manual: false};
    flocks.push(flock); // Create flocks and place each in a randomly selected glen.

    for (let i = 0; i < parameters.initialFlockSize; i++) {
      allSheep.push(addSheep(flock, 0)); // New sheep generation gets its own function (above).
    }
  }

  let state = {turn: 0, parameters, glens, flocks, allSheep}; // Now we have the initial state, which includes the number of new turns to add as a parameter.
  state = advanceSimulation(state); // So we can just pass the whole thing into the function below.
  state.turn = 0;
  return state;
}

export function advanceSimulation ({turnShown, parameters, glens, flocks, allSheep}) {
  let currentTurns = glens[0].abundance.length - 1;
  let totalTurns = currentTurns + Number(parameters.numTurns);
  for (let turn = currentTurns; turn < totalTurns; turn++) {
    shuffle(allSheep); // We don't want the same sheep to eat first every time.
    let allNewSheep = [];

    for (let sheep of allSheep) {
      let hunger = sheep.hunger[turn];
      if (hunger <= parameters.sheepEndurance) { // If the sheep can survive its hunger level...
        let glen = sheep.flock.glen[turn];
        if (Math.random() < glen.currentAbundance) { // ...it has a chance of finding food equal to its current glen's abundance. If it finds food...
          glen.currentAbundance = Math.max(glen.currentAbundance - parameters.sheepGreed, 0);
          sheep.hunger.push(0); // ...it eats, reducing the glen's abundance, and is no longer hungry in the next season.
          if (Math.random() < parameters.sheepReproductionRate) {
            allNewSheep.push(addSheep(sheep.flock, turn + 1)); // Also, it may reproduce.
          }
          continue; // If it found food, we move on to the next sheep.
        }
      }
      sheep.hunger.push(hunger + 1); // If it died or failed to find food, we note a hunger increase. Dead sheep get hungrier for bookkeeping purposes.
    }

    allSheep = allSheep.concat(allNewSheep); // Add newborn sheep to total.

    for (let glen of glens) { // Glens grow (but not past 1).
      glen.currentAbundance = Math.min(glen.currentAbundance * parameters.glenGrowthRate, 1);
      glen.abundance.push(glen.currentAbundance);
    }

    for (let flock of flocks) { // Flocks moves according to manual direction if manual...
      let glen = flock.glen[turn];
      flock.glen.push(flock.manual & (parameters.manual !== null) ? parameters.manual : strategies[parameters.strategy](glen.links)); // ...or output of strategy if not.
    }
  }

  parameters.numTurns = glens[0].abundance.length - 1;
  return {turnShown, parameters, glens, flocks, allSheep}
}