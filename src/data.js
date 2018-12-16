import {statistic} from 'numbers';
import {basic} from 'numbers';

export function abundanceStats (glens) {
    let seasons = glens[0].abundance.length;
    let medians = [];
    let means = [];
    let modes =[];
    let maxes = [];
    for (let i=0;i<seasons;i++) {
        let abundanceData =[];
        let x = i;
        for (let glen in glens) {
            abundanceData.push(glens[glen].abundance[i])
        }
        medians.push({ x, y: statistic.median(abundanceData)});
        means.push({ x, y: statistic.mean(abundanceData)});
        modes.push({ x, y: statistic.mode(abundanceData)});
        maxes.push({ x, y: basic.max(abundanceData)});
    }
    return {medians, means, modes, maxes};
};

export function sheepStats (flocks, endurance) {
    let seasons = flocks[0].sheep[0].hunger.length;
    let totalSheep = 0;
    let populations = [];
    let meanFlocks = [];
    let medianFlocks = [];
    let flockMaxes = [];
    for (let season=0; season<seasons; season++) {
        let x = season;
        let population = 0;
        let flockPops = [];
        for (let eachFlock of flocks) {
            let sheep = eachFlock.sheep;
            let flockPop = 0;
            if (season === 0) totalSheep += sheep.length;
            for (let eachSheep of sheep) {
                let hunger = eachSheep.hunger[season];
                if ( hunger <= endurance && -1 < hunger ) {
                    flockPop++;
                }
            }
            if (flockPop > 0) flockPops.push(flockPop);
            population += flockPop;
        }
        populations.push({ x, y: population });
        medianFlocks.push({ x, y: statistic.median(flockPops)});
        meanFlocks.push({ x, y: statistic.mean(flockPops)});
        flockMaxes.push(basic.max(flockPops));
    }
    let flockMax = basic.max(flockMaxes);
    return {populations, medianFlocks, meanFlocks, flockMax, totalSheep}
}