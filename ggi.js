/* A sample parameters object of the kind that the UI might pass to createCounty. */

testParameters = {
            county: {
                topology: "hex",
                size: 32,
                topologyOptions: {
                    connectivity: null
                }
            },
            flocks: {
                numFlocks: 5,
                minSheepPerFlock: 5,
                maxSheepPerFlock: 25,
                defaultShepherd: "fleeLowGrass"
            },
            sheep: {
                greed: 1,
                endurance: 1,
                maxProsperity: 10
            },
            glen: {
                growth: 10,
                maxAbundance: 100
            }  
    }

// */


/* API Functions

The Grazing Game really only requires two API functions for the UI code to call: createCounty and iterateCounty.

-createCounty takes a "parameters" JavaScript object(see above for example) and returns a "county" JavaScript object.

-iterateCounty takes a "county" JavaScript object and returns another "county" JavaScript object with an additional member added to the "iterations" array.

*/


function createCounty (parameters) {
    let graph = newCounty(parameters.county);
    let topology = parameters.county.topology;
    let iterations = [];
    iterations.push(freshState(graph, parameters.glen, parameters.flocks, parameters.sheep));

    for (i=0; i < iterations[0].length; i++) {
//        console.log(i);
//        console.log(iterations[0][i]);
//        console.log(iterations[0][i].sheep);
    }

    return {output: {graph: graph, topology: topology, iterations: iterations}}
}


function iterateCounty (county) {
    let graph = county.graph;
    let topology = county.topology;
    let iterations = county.iterations;
    let relevantIteration = iterations[iterations.length - 1];
    let nextCounty = {
        graph: graph,
        topology: topology,
        iterations: iterations
    }
    nextIteration = generateIteration(relevantIteration, graph);
    nextCounty.iterations.push(nextIteration);

    for (i=0; i < relevantIteration.length; i++) {
        console.log(i);
        console.log(relevantIteration[i]);
        console.log(relevantIteration[i].sheep);
        console.log(nextIteration[i]);
        console.log(nextIteration[i].sheep);
    }
    return {output: nextCounty}
}


// internals for createCounty: graph builders

function newCounty (parameters) {
    let number = parameters.size;
    let topology = parameters.topology;
    let graph = [];
    switch (topology) {
        case "grid":
            graph = connectGrids(number);
            break;
        case "hex":
            graph = connectHexes(number);
            break;
        default:
            graph = connectAny(number);
            break;
    }

    return graph
}


function connectGrid (max) {
    let graph = [[]];
    let currentIndex = 0;
    let ringBase = 0;
    let ringMax = 0;
    let prevRing = [];
    let currentRing = [0, 0, 0, 0];
    let vertices = [0, 0, 0, 0];
    while (currentIndex < max) {
        ringBase++;
        ringMax = 8 * ringBase;
        prevRing = currentRing;
        currentRing = [];
        vertices = [ 6 * ringBase - 1, 8 * ringBase -1, 2 * ringBase - 1, 4 * ringBase - 1];
        let nextSpot = 1;
        let nextInnerConnectorIndex = -1;
        for (i = 0; i < ringMax; i++) {
            currentIndex++;
            currentRing.push(currentIndex);
            let maybeNewVertex = vertices.indexOf(i);
            if (maybeNewVertex != -1){
                nextSpot = maybeNewVertex;
            }
            if (currentIndex < max) {
                let currentNodeArray = [];
                if (graph[currentIndex] != undefined) {
                    currentNodeArray = graph[currentIndex]
                }
                if (i < ringMax - 1) {
                    let nextNode = currentIndex + 1;
                    if (nextNode < max) { 
                        if (graph[nextNode] == undefined) {
                            graph[nextNode] = []
                        }
                        graph[nextNode][(nextSpot + 2) % 4] = currentIndex
                        currentNodeArray[nextSpot] = nextNode
                    }
                } else {
                    currentNodeArray[1] = currentRing[0];
                    graph[currentRing[0]][3] = currentIndex
                }
                if (i == 0) {
                        let oldLast = prevRing[prevRing.length - 1];
                        currentNodeArray[2] = oldLast;
                        graph[oldLast][0] = currentIndex;
                    } else if (maybeNewVertex == -1) {
                        if (i % 4 > 0) {
                            nextInnerConnectorIndex++;
                        }
                        let nextInnerConnector = prevRing[nextInnerConnectorIndex];
                        currentNodeArray[(nextSpot + 1) % 4] = nextInnerConnector;
                        graph[nextInnerConnector][(nextSpot + 3) % 4] = currentIndex;
                    }
            graph[currentIndex] = currentNodeArray;
            }
        }
    }

    return graph
}


function connectHexes (max) {
    let graph = [[]];
    let currentIndex = 0;
    let ringBase = 0;
    let ringMax = 0;
    let prevRing = [];
    let currentRing = [0];
    let vertices = [0, 0, 0, 0, 0, 0];
    let oldVertexNodes = [0, 0, 0, 0, 0, 0];
    while (currentIndex < max) {
        ringBase++;
        ringMax = 6 * ringBase;
        prevRing = currentRing;
        currentRing = [];
        vertices = [ 5 * ringBase - 1, 6 * ringBase -1, ringBase - 1, 2 * ringBase - 1, 3 * ringBase - 1, 4 * ringBase - 1];
        let nextSpot = 1;
        let nextDoubleConnectorIndex = 0;
        for (i = 0; i < ringMax; i++) {
            currentIndex++;
            currentRing.push(currentIndex);
            let maybeNewVertex = vertices.indexOf(i);
            let matchingOldVertex = 0;
            if (maybeNewVertex != -1){
                nextSpot = maybeNewVertex;
                matchingOldVertex = oldVertexNodes[maybeNewVertex];
                oldVertexNodes[maybeNewVertex] = currentIndex;
            }
            if (currentIndex < max) {
                let currentNodeArray = [];
                if (graph[currentIndex] != undefined) {
                    currentNodeArray = graph[currentIndex]
                }
                if (i < ringMax - 1) {
                    let nextNode = currentIndex + 1;
                    if (nextNode < max) { 
                        if (graph[nextNode] == undefined) {
                            graph[nextNode] = []
                        }
                        graph[nextNode][(nextSpot + 3) % 6] = currentIndex
                        currentNodeArray[nextSpot] = nextNode
                    }
                } else {
                    currentNodeArray[1] = currentRing[0];
                    graph[currentRing[0]][4] = currentIndex
                }
                if (ringBase == 1) {
                    graph[0].push(currentIndex);
                    currentNodeArray[(i + 3) % 6] = 0
                } else {
                    if (i == 0) {
                        let oldFirst = prevRing[0];
                        let oldLast = prevRing[prevRing.length - 1];
                        currentNodeArray[2] = oldFirst;
                        graph[oldFirst][5] = currentIndex;
                        currentNodeArray[3] = oldLast;
                        graph[oldLast][0] = currentIndex;
                    } else if (maybeNewVertex == -1) {
                        let lastDoubleConnectorIndex = nextDoubleConnectorIndex;
                        nextDoubleConnectorIndex++;
                        let lastDoubleConnector = prevRing[lastDoubleConnectorIndex];
                        let nextDoubleConnector = prevRing[nextDoubleConnectorIndex];
                        currentNodeArray[(nextSpot + 2) % 6] = lastDoubleConnector;
                        currentNodeArray[(nextSpot + 1) % 6] = nextDoubleConnector;
                        graph[lastDoubleConnector][(nextSpot + 5) % 6] = currentIndex;
                        graph[nextDoubleConnector][(nextSpot + 4) % 6] = currentIndex;
                    } else {
                        graph[matchingOldVertex][(nextSpot + 4) % 6] = currentIndex;
                        currentNodeArray[(nextSpot + 1) % 6] = matchingOldVertex
                    }
                }
            graph[currentIndex] = currentNodeArray;
            }
        }
    }

    return graph
}


function connectAny (max) {
    let graph = [[null]];
    for (i = 1; i < max; i++) {
        let parent = i - 1;
        graph[i] = [parent];
        graph[parent].push(i)
    }
    for (i = 0; i < max; i++) {
        let bff = Math.floor(Math.random() * graph.length);
        if (graph[i].indexOf(bff) == -1) {
            graph[bff].push(i);
            graph[i].push(bff)
        }
    }

    return graph
}


// internals for createCounty: state initializer

function freshState (graph, glen, flocks, sheep) {
    let glenCount = graph.length;
    let firstIteration = [];
    let maxAbundance = glen.maxAbundance;
    let freshFlock = [];
    for (i = 0; i < glenCount; i++) {
        firstIteration[i] = {
            paths: graph[i],
            abundance: maxAbundance,
            maxAbundance: maxAbundance,
            growth: glen.growth,
            sheep: freshFlock
        }
    }
    let sheepIndex = 0;
    let maxFlocks = flocks.numFlocks;
    for (j = 0; j < maxFlocks; j++) {
        let flock = makeFlock(flocks, sheep, sheepIndex);
        let glen = Math.floor(firstIteration.length * Math.random());
        let oldSheep = firstIteration[glen].sheep;
        flock.concat(oldSheep);
        firstIteration[glen].sheep = flock;
        sheepIndex += flock.length
    }

    return firstIteration
}


function makeFlock(flocks, sheep, startingSheepIndex) {
    let flock = [];
    let min = flocks.minSheepPerFlock;
    let max = flocks.maxSheepPerFlock;
    let sheepCount = min + Math.floor((max - min) * Math.random());
    for (i = 0; i < sheepCount; i++) {
        flock[i] = {
            sheepID: startingSheepIndex + i,
            prosperity: 0,
            maxProsperity: sheep.maxProsperity,
            hunger: 0,
            greed: sheep.greed,
            endurance: sheep.endurance,
            shepherd: flocks.defaultShepherd
        }
    }

    return flock
}


// internals for iterateCounty

function generateIteration (prevIteration) {
    let nextIteration = [];
    let currentSheep = [];
    let length = prevIteration.length;
    for (i = 0; i < length; i++) {
        let glen = prevIteration[i];
        let abundance = glen.abundance + glen.growth;
        if (abundance > glen.maxAbundance) {
            abundance = glen.maxAbundance
        }
        let newGlen = {
            paths: glen.paths,
            abundance: abundance,
            maxAbundance: glen.maxAbundance,
            growth: glen.growth,
            sheep: []
        }
        let sheepLength = glen.sheep.length;
        if (sheepLength > 0) {
            for (j = 0; j < sheepLength; j++) {
                let oldSheep = glen.sheep[j];
                if (oldSheep != undefined) {
                    let newSheep = iterateSheep(i, newGlen, oldSheep);
                    currentSheep.push(newSheep);
                    newGlen.abundance -= newSheep[2];
                }
            }
        }
        nextIteration.push(newGlen)
    }
    let totalNewSheep = currentSheep.length;
    for (k = 0; k < totalNewSheep; k++) {
        let sheep = currentSheep[k][1];
        let glen = currentSheep[k][0];
        nextIteration[glen].sheep.push(sheep)
    }
    
    return nextIteration
}


function iterateSheep (glenIndex, glen, sheep) {
    
    let hunger = sheep.hunger;
    let dinner = sheep.greed;
    if (dinner < glen.abundance) {
        dinner = glen.abundance
    }
    if (glen.abundance = 0) {
        hunger++;
    } else {
        hunger = 0;
    }
    let nextGlen = findGrazing(glenIndex, glen, sheep.shepherd);
    let aSheep = {
        index: sheep.index,
        prosperity: sheep.prosperity + dinner,
        maxProsperity: sheep.maxProsperity,
        hunger: hunger,
        greed: sheep.greed,
        endurance: sheep.endurance,
        shepherd: sheep.shepherd
    }

    return [nextGlen, aSheep, dinner]
}


function findGrazing (glenIndex, glen, shepherd) {
    let destination = glenIndex;
    switch (shepherd) {
        case "fleeLowGrass":
            destination = fleeLowGrass(glenIndex, glen);
            break;
        default:
            options = [glenIndex] + glen.paths;
            i = Math.floor(options.length * Math.random());
            destination = options[i];
            break;
    }
    return destination
}

// This is an example flock movement strategy.

function fleeLowGrass(glenIndex, glen) {
    let nextGlenIndex = glenIndex;
    if (glen.abundance < 2) {
        let options = glen.paths.filter(e => e !== undefined);
        let choice = Math.floor(options.length * Math.random());
        nextGlenIndex = options[choice]
    }
    return nextGlenIndex
}

function st() {
    let myCounty = createCounty(testParameters);
    let iteratedCounty = iterateCounty(myCounty.output);

    return iteratedCounty
}

st()