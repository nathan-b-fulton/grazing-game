import {statistic} from 'numbers';
import {basic} from 'numbers';

/*
This file contains all and only functions for serializing data from the simulation state into arrays that will be useful with the Victory data visualization library. At present it is a bit ad hoc, but it provides data sets tracking abundance as well as sheep population, total and by flock.

Generally speaking, the independent axis for each of these charts should be an index of seasons.
*/

// Helper functions

function abundanceData (season, glens) {
    let abundances = [];
    for (let glen of glens) { // Here we just reshuffle glen arrays of seasonal abundance into season arrays of glen abundance.
        abundances.push(glen.abundance[season])
    }
    return abundances;
};

function populationData (season, flocks, endurance) {
    let population = 0; // This will be the aggregate surviving sheep population.
    let flockPops = []; // This will be an array of the populations of each surviving flock during the current season.
    for (let eachFlock of flocks) {
        let sheep = eachFlock.sheep;
        let flockPop = 0;
        for (let eachSheep of sheep) {
            let hunger = eachSheep.hunger[season];
            if ( hunger <= endurance && -1 < hunger ) { // For a sheep to count, they can't be dead from hunger or unborn (see simulation.js)
                flockPop++;
            }
        }
        if (flockPop > 0) flockPops.push(flockPop); // We only do analysis on the surviving flocks...
            population += flockPop;
        }
    if (flockPops.length === 0) flockPops = [0]; // ...but when there are no surviving flocks, we put a zero population placeholder in, because it's easier for working with Victory.
    return {population, flockPops};
}

function statSet (season, statArray) { // Abstract out a simple statistical features object.
    let stats = {
            x: season, 
            median: statistic.median(statArray),
            mean: statistic.mean(statArray),
            mode: statistic.mode(statArray)
    };
    return stats;
}

// Exported function, currently provides all chart data in one go.

export function chartStats ({parameters, glens, flocks}) {
    let seasons = flocks[0].sheep[0].hunger.length; // Many of the arrays we store are indexed by season, so we could get this from several places; arbitrarily, I chose hunger.
    let aStats = []; // abundance stats
    let fStats = []; // flock population stats
    let fMaxes = []; // Population of largest flock in each season, used for scaling the graph
    let populations = []; // Total surviving sheep population in each season
    for (let season=0; season<seasons; season++) { // In each season...
        let abundances = abundanceData(season, glens); // ...get the array of abundance figures...
        let popData = populationData(season, flocks, parameters.sheepEndurance); // ...and the array of population figures...
        let abundanceStats = statSet(season, abundances); // ...turn each into simple statistical properties objects...
        let flockPops = popData.flockPops;
        let flockStats = statSet(season, flockPops);
        populations.push({x: season, y: popData.population}); // ...and push them onto the correct array.
        aStats.push(abundanceStats);
        fStats.push(flockStats);
        fMaxes.push(basic.max(flockPops)); // Also push the max population from that dataset onto our max pop tracking array.
    }
    let flockMax = basic.max(fMaxes); // Get the final max pop from the max pop tracking array.
    return {populations, aStats, fStats, flockMax}; // Return three arrays of stats objects and one max flock size integer.
}