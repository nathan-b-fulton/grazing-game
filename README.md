# Hello!

Welcome to _The Grazing Game_, a simple model of how mobile populations might share a finite (but regenerating) resource distributed across a fixed topology. This documentation covers the basic rules for updating the state of the resource and each population, as well as how to adjust different parameters of the model in the user interface, and run simulations under the parameters you have chosen.

## How to use this application

(_n.b.: If you are viewing this document on the GitHub source page, you may just want to go straight to http://arbiter.games/ to play with the actual simulation application._)

1. Please view this application on a full-size screen and in a maximized (or at least fairly fully expanded, landscape oriented) window. It is not optimized for mobile devices, vertically oriented tablets, or the like at this time.
1. Read the full explanation of The Grazing Game below to make sure you understand the parameters.
1. Set the parameters to the left according to what kind of scenario you are interested in modeling.
1. Press the "Begin Simulation" button.
1. To view the iterations of the simulation, click the arrow buttons next to the slider at the bottom, or use the left and right arrow keys. You can also drag the slider however far you would like, including all the way to the end if you just want to see how things turn out.
1. If you want to review or change the parameters, click the "Show Parameters" button. 
    * You can then edit the parameters and click "Continue Simulation" in order to add seasons under the new parameters.
    * You can also add more seasons without changing any parameters; "Number of New Seasons" will determine how many seasons are _added_, not how many there are in total.
    * If you want to start over, rather than adding seasons, simply refresh the page.
    * Note that parameters that affect the initial set-up of the county (_County Size_, _Number of Flocks_, _Initial Flock Size_) cannot be altered after initial set-up.
1. You can return to this documentation at any time by pressing the __?__ button. You can also see several charts of basic statistical aspects of the simulation by pressing the 🗠 button, or return to the county display via ፨.
1. Once you are very familiar with how the automatic simulation works, you may want to try manual (AKA _Ur-Shepherd_) mode, described at the end of this document.

## Basic Concept

The Grazing Game is intended to demonstrate a number of principles to students and researchers who are interested in what modeling might reveal about shared resource management, population dynamics, and environmental sustainability. The metaphor driving the model is fairly simple: flocks of sheep wander between connected glens, eating the grass and multiplying, unless/until they begin to exhaust the carrying capacity of accessible glens, at which point they will (tragically) starve. The _glens_ are nodes in a graph, each of which has a resource attribute (_abundance_), which regenerates at a _growth rate_. The _sheep_ are agents that travel between nodes, each reducing abundance by their _greed_. Groups of sheep called _flocks_ share the same movement strategies and randomization seeds, so they move together as an emergent property. The complete graph is called a _county_, and may vary in size from one simulation to the next. Each iteration of a simulation is called a _season_.

## What happens during set-up

The parameters listed to the left are set at the beginning of a simulation. Some are used in setting up the county graph, while some are used in iterating the state of the graph throughout the simulation.

First, the graph is created. The length of one side of the graph is determined by the _County Size_ parameter. Then, a number of flocks of sheep given by _Number of Flocks_ are distributed to randomly selected glens. It is possible for multiple flocks to be placed in the same glen, appearing as one large flock until they move. The initial size of each flock is given by _Initial Flock Size_.

## What happens in each iteration

1. First, the sheep eat in a randomly determined order. Each sheep tries (with a chance of success equal to the glen's abundance) to eat a certain proportion of the glen's resources, set by _Sheep Greed_, reducing the glen's abundance by that amount. If the sheep fails to find food in the glen, it becomes hungry. If a sheep has been hungry for longer than _Sheep Endurance_, it "dies", ceasing to consume resources or be displayed in the visualization. If a sheep does eat, there is a chance (given by _Sheep Reproduction Rate_) that it will generate another sheep in the same flock.
1. After the sheep have eaten, each glen's abundance is multiplied by the _Glen Growth Rate_. If the glen has nothing left, the growth rate is irrelevant.
1. Finally, the sheep move according to _Strategy_. Three strategies are presently available:
   * Random: The sheep are equally likely to end on any of five glens, including their current one and any of the four ordinally proximal ones (up, down, left, right).
   * Max Abundance: The sheep will move to one of five glens, either their current one or any of the four ordinally proximal ones (up, down, left, right). They will choose according to which one has the greatest current abundance.
   * Weighted: The sheep will move to one of five glens, either their current one or any of the four ordinally proximal ones (up, down, left, right). They will weight the likelihood of each according to its current abundance relative to the others, but have some chance of moving to any of them.

These three steps are repeated for a number of iterations equal to _Number of New Seasons_.

## How to read the county display (፨)

* Each glen will be brighter or darker depending on its abundance (metaphorically, how much grass it has left). Bright green indicates an abundance close to 1, the maximum, while a dark, dull brown indicates 0, devastation that precludes recovery.

* Flocks move together, with each dot representing one sheep. Sometimes more than one flock will arrive at the same glen, in which case the aggregate will look like one big flock until they move on to different glens.

* Each sheep will be solid white if it was just able to eat, and somewhat translucent if it has gone for one or more turns without food. Sheep that have gone too long without eating and starved are still tracked in the data set, but do not appear on the display or affect abundance.

## Manual Mode ("The Ur-Shepherd")

Once you have set up the initial simulation, if you are interested in guiding a flock by hand, you can activate manual mode by holding down the 'ALT' key and pressing 'm'. The following things will happen:
* One flock, with at least one surviving sheep in the latest iteration known at the time manual mode is activated, will turn black and become your flock. You are now the Ur-Shepherd, directing them personally.
* A panel will open with buttons for guiding the flock up, down, left, right, or staying in the same glen for one season.
* The w, a, s, d and x keys will become active as an alternative means of guiding the sheep.
* Whenever you move your flock, one season will be added to the simulation. All flocks other than yours will continue to employ the strategy selected for automatic movement.

You can deactivate manual mode at any time by once again holding down the 'ALT' key and pressing 'm'. You can also add more fully automatic seasons even after the Ur-Shepherd has been activated. Keep in mind that adding automatic seasons doesn't move the visualization to the last season, but manual instructions are always applied to the last season. You will probably want to move the slider all the way to the right before any time you give your flock manual direction, so that you can see where they are currently located.

## Further Information

This application is open source, and the JavaScript may be viewed at https://github.com/nathan-b-fulton/grazing-game/tree/master/src. Questions may be directed to Nathan: nathan.bartholomew.fulton@gmail.com.

<br>
