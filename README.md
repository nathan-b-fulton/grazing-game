# Hello!

Welcome to _The Grazing Game_, a simple model of how mobile populations might share a finite (but regenerating) resource distributed across a fixed topology. This documentation covers the basic rules for updating the state of the resource and each population, as well as how to adjust different parameters of the model in the user interface, and run simulations under the parameters you have chosen.

## How to use this application

(_n.b.: If you are viewing this document on the GitHub source page, you may just want to go straight to http://grazing.games/ to play with the actual simulation application._)

1. Read the full explanation of The Grazing Game below to make sure you understand the parameters.
1. Set the parameters to the left according to what kind of scenario you are interested in modeling.
1. Press the "Run Simulation" button.
1. To view the iterations of the simulation, click the arrow keys next to the slider at the bottom. You can also drag the slider however far you would like, including all the way to the end if you just want to see how things turn out.
1. If you want to review or change the parameters, click the "Show Parameters" button. You can then edit the parameters and click "Run Simulation" again in order to see the effect of different parameterizations.

## Basic Concept

The Grazing Game is intended to demonstrate a number of principles to students and researchers who are interested in what modeling might reveal about shared resource management, population dynamics, and environmental sustainability. The metaphor driving the model is fairly simple: flocks of sheep wander between connected glens, eating the grass and multiplying, unless/until they begin to exhaust the carrying capacity of accessible glens, at which point they will (tragically) starve. The _glens_ are nodes in a graph, each of which has a resource attribute (_abundance_), which regenerates at a _growth rate_. The _sheep_ are agents that travel between nodes, each reducing abundance by their _greed_. Groups of sheep called _flocks_ share the same movement strategies and randomization seeds, so they move together as an emergent property. The complete graph is called a _county_, and may vary in size from one simulation to the next. Each iteration of a simulation is called a _season_.

## What happens during set-up

The parameters listed to the left are set at the beginning of a simulation. Some are used in setting up the county graph, while some are used in iterating the state of the graph throughout the simulation.

First, the graph is created. The length of one side of the graph is determined by the _County Size_ parameter. Then, a number of flocks of sheep given by _Number of Flocks_ are distributed to randomly selected glens. It is possible for multiple flocks to be placed in the same glen, appearing as one large flock until they move. The initial size of each flock is given by _Initial Flock Size_.

## What happens in each iteration

1. First, the sheep eat in a randomly determined order. Each sheep tries to each a certain proportion of the glen's resources according to _Sheep Greed_, reducing the glen's abundance by that amount. If there is nothing left in the glen, the sheep becomes hungry. If a sheep has been hungry for longer than _Sheep Endurance_, it "dies", ceasing to consume resources or be displayed in the visualization. If a sheep does eat, there is a chance (given by _Sheep Reproduction Rate_) that it will generate another sheep in the same flock.
1. After the sheep have eaten, each glen's abundance is multiplied by the _Glen Growth Rate_. If the glen has nothing left, the growth rate is irrelevant.
1. Finally, the sheep move according to _Strategy_. Three strategies are presently available:
   * Random: The sheep are equally likely to end on any of five glens, including their current one and any of the four ordinally proximal ones (up, down, left, right).
   * Max Abundance: The sheep will move to one of five glens, either their current one or any of the four ordinally proximal ones (up, down, left, right). They will choose according to which one has the greatest current abundance.
   * Weighted: The sheep will move to one of five glens, either their current one or any of the four ordinally proximal ones (up, down, left, right). They will weight the likelihood of each according to its current abundance relative to the others, but have some chance of moving to any of them.

These three steps are repeated for a number of iterations equal to _Number of Seasons_.

<br>

## Further Information

This application is open source, and the JavaScript may be viewed at https://github.com/nathan-b-fulton/grazing-game/tree/master/src. Questions may be directed to Nathan: nathan.bartholomew.fulton@gmail.com.

<br>