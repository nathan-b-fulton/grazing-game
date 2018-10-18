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

const strategies = {
  random: (glens) => glens[randomInt(0, glens.length)],

  maxAbundance: (glens) => glens.sort(byAbundance)[0],

  weighted: (glens) => {
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


function generateGrid (parameters) {
  let countySize = parameters.countySize;
  let glens = [];

  for (let row = 0, index = 0; row < countySize; row++) {
    for (let column = 0; column < countySize; column++, index++) {

      let glen = {
        position: [column, row],
        abundance: [1],
        currentAbundance: 1,
        links: [],
        sheepCount: []
      };

      glen.links.push(glen);

      if (column !== 0) {
        let otherGlen = glens[index - 1];
        glen.links.push(otherGlen);
        otherGlen.links.push(glen);
      }

      if (row !== 0) {
        let otherGlen = glens[index - countySize];
        glen.links.push(otherGlen);
        otherGlen.links.push(glen);
      }

      glens.push(glen);
    }
  }

  return glens;
}

function addSheep (flock, turnBorn) {
  let hunger = [];
  for (let i = 0; i < turnBorn; i++) {
    hunger.push(-1);
  }
  hunger.push(0);
  let sheep = {hunger, flock};
  flock.sheep.push(sheep);
  return sheep;
}

export function runSimulation (parameters) {
  let glens = generateGrid(parameters);
  let allSheep = [];
  let flocks = [];

  for (let curFlock = 0; curFlock < parameters.numFlocks; curFlock++) {
    let flock = {glen: [glens[randomInt(0, glens.length)]], sheep: []};
    flocks.push(flock);

    for (let i = 0; i < parameters.initialFlockSize; i++) {
      allSheep.push(addSheep(flock, 0));
    }
  }

  for (let turn = 0; turn < parameters.numTurns; turn++) {
    shuffle(allSheep);

    let allNewSheep = [];
    for (let sheep of allSheep) {
      let hunger = sheep.hunger[turn];
      if (hunger <= parameters.sheepEndurance) {
        let glen = sheep.flock.glen[turn];

        if (Math.random() < glen.currentAbundance) {
          glen.currentAbundance = Math.max(glen.currentAbundance - parameters.sheepGreed, 0);
          sheep.hunger.push(0);
          if (Math.random() < parameters.sheepReproductionRate) {
            allNewSheep.push(addSheep(sheep.flock, turn + 1));
          }
          continue;
        }
      }
      sheep.hunger.push(hunger + 1);
    }

    allSheep = allSheep.concat(allNewSheep);

    for (let glen of glens) {
      glen.currentAbundance = Math.min(glen.currentAbundance * parameters.glenGrowthRate, 1);
      glen.abundance.push(glen.currentAbundance);
    }

    for (let flock of flocks) {
      let glen = flock.glen[turn];
      //flock.glen.push(glen.links[randomInt(0, glen.links.length)]);
      flock.glen.push(strategies[parameters.strategy](glen.links));
    }
  }

  return {turn: 0, parameters, glens, flocks};
}
