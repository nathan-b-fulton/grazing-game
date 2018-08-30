# -*- coding: utf-8 -*-

import fractions
import random
import pandas as pd
# import numpy as np
import networkx as nx
import matplotlib.pyplot as plt

"""
Glens(nodes):
 [Dynamic]
	-Abundance (integer, resource state)
    -ID
 [Static]
	-Growth    (integer, rate of increase of resource state)
	-Paths	    (unordered list of Path objects, see below)
 [Methods]
   -Increase  (increase the Abundance)
   -Not Yet Linked (checked if the Glen still needs to internally record a Path that links it)
"""

class Glen:

    # Initializer
    def __init__(self, abundance:int=0, ID:str="", growth:int=10, toward_paths=[], away_paths=[]):
        self.abundance = abundance
        self.growth = growth
        self.toward_paths = toward_paths
        self.away_paths = away_paths
        self.ID = ID
        
    
    # Increase abundance of a Glen, either according to its growth rate or by some provided amount
    def increase(self, amount:int=None)->int:
        if amount is None:
            self.abundance += self.growth
        else:
            self.abundance += amount
            
        return self.abundance
    
    # Is this Glen unregistered as connected from another by some given Path?
    def not_yet_linked_to(self, path)->bool:
        return (path not in self.toward_paths)
    
    # Is this Glen unregistered as connected to another by some given Path?
    def not_yet_linked_from(self, path)->bool:
        return (path not in self.away_paths)
        
class HexGlen(Glen):

    # Initializer
    def __init__(self, x:int, y:int, abundance:int=0, ID:str="", scale:int=1, growth:int=10, toward_paths=[], away_paths=[]):
        self.x = x
        self.y = y
        self.abundance = abundance
        self.growth = growth
        self.toward_paths = toward_paths
        self.away_paths = away_paths
        self.ID = ID
        self.pos_y = y
        shift = 0
        if scale > y:
            shift = scale + .5 * y
        else:
            shift = 2 * scale - 1 - .5 * y
        self.pos_x = x - shift

class GridGlen(Glen):

    # Initializer
    def __init__(self, x:int, y:int, abundance:int=0, ID:str="", scale:int=1, growth:int=10, toward_paths=[], away_paths=[]):
        self.x = x
        self.y = y
        self.abundance = abundance
        self.growth = growth
        self.toward_paths = toward_paths
        self.away_paths = away_paths
        self.ID = ID
        self.pos_y = y - .5 * scale
        self.pos_x = x - .5 * scale
        
"""
Paths(edges):
 [Static]
	-Length	(integer, resources consumed to traverse edge)
	-Grade 	(fraction, turns consumed per Length)
	-Glens	(ordered pair of [startingGlen, endingGlen])
	-Symmetrical (boolean)
"""

class Path:
    
    # Initializer
    def __init__(self, to_glen:Glen, from_glen:Glen, symmetrical:bool=True, length:int=1, grade:int=[1,1]):
        self.length = length
        self.grade = fractions.Fraction(grade[0],grade[1])
        self.to_glen = to_glen
        self.from_glen = from_glen
        self.symmetrical = symmetrical
        if to_glen.not_yet_linked_to(self):
            to_glen.toward_paths.append(self)
            if symmetrical:
                from_glen.away_paths.append(self)      
        if from_glen.not_yet_linked_from(self):
            from_glen.away_paths.append(self)
            if symmetrical:
                to_glen.toward_paths.append(self)
                

"""
Sheep(agents):
 [Dynamic]
	-Prosperity (integer, state based on hunger and endurance)
	-Hunger 	  (integer, number of turns since last meal)
 [Static]
	-Endurance  (integer, degree of hunger required to decrease prosperity)
	-Greed 	  (integer, amount of resources consumed/prosperity gained when fed)
 [Methods]
   -Prosper    (increase Prosperity)
   -Hungrier   (note time since last fed and potentially decrease prosperity)
"""

class Sheep:
    
    # Initializer
    def __init__(self, prosperity:int=0, hunger:int=0, endurance:int=1, greed:int=1):
        self.prosperity = prosperity
        self.hunger = hunger
        self.endurance = endurance
        self.greed = greed
        
        
    # Feed the sheep, 1 unit by default or as specified
    def prosper(self, grass:int=None)->int:
        if grass is None:
            self.prosperity += self.greed
        else:
            self.prosperity += grass
        if grass is not 0:
            self.hunger = 0
        
        return self.prosperity

    # Note that the sheep has not been fed, for 1 turn by default or a specified number of turns
    def hungrier(self, famine:int=1)->int:
        self.hunger += famine
        if self.hunger >= self.endurance:
            self.prosperity -= 1
            
        return self.hunger
    
"""
Flock(agent collective):
 [Dynamic]
 	-Current Glen		(Glen currently occupied)
	-Laziness	(integer, Length of time so far in current Glen)
	-Members	(unordered list of Sheep objects, see above)
 [Static]
	-Strategy	(Strategy object employed, see below)
 [Methods]
    -Move (move the flock using whatever Stretegy is provided)
"""

class Flock:
    
    # Initializer
    def __init__(self, starting_glen:Glen, strategy, members=[]):
        self.current_glen = starting_glen
        self.members = members
        self.strategy = strategy
        self.laziness = 0
    
    # For each sheep in flock, increase its prosperity and decrease glen abundance.
    def feed(self):
        for sheep in self.members:
            available = self.current_glen.abundance
            greed = sheep.greed
            if available < greed:
                sheep.prosper(available)
                self.current_glen.abundance = 0
            else:
                sheep.prosper()
                self.current_glen.abundance -= greed

    # TODO: Determine conditions for invoking procreate within model, and for sheep death.    
    def procreate(self, number:int=1):
        for i in range(number):
            new_lamb = Sheep()
            self.members = self.members + [new_lamb]

        return self.members
    
    # TODO: Make grade actually do something.
    # Pick a Glen to move to
    def move(self)->Glen:
        strat = self.strategy
        self.current_glen = strat(self)
        
        return self.current_glen
            
# This is an example/default flock movement strategy.
def flee_low_grass(flock:Flock)->Glen:
    glen = flock.current_glen
    current_grass = glen.abundance
    if current_grass < 2:
        path = random.choice(glen.away_paths)
        glen = path.to_glen
        
    return glen
        

"""

County(game specification/state):
 [Dynamic]
    -Glens
    -Flocks
    -Season
    
 [Static]
    -Connectivity
    
	-Maximum Abundance
	-Maximum Growth
	-Maximum Paths
    
	-Maximum Length
	-Maximum Grade
    
	-Maximum Prosperity
	-Maximum Endurance
	-Maximum Greed

Regular County(A county with a regular shape, procedurally generated)
	-Width
	-Height
    
Hex County

Grid County
    
"""

class County:
    
    # Initializer
    def __init__(self, glens=[], flocks=[], paths=[], season:int=0):
        self.glens = glens
        self.flocks = flocks
        self.paths = paths
        self.season = season
        self.init_glen_limits()
        self.init_path_limits()
        self.init_sheep_limits()
        
    # Initialize limits on Glen attributes
    def init_glen_limits(self, max_abundance:int=128, max_growth:int=64, max_paths:int=8):
        self.max_abundance = max_abundance
        self.max_growth = max_growth
        self.max_paths = max_paths

    # Initialize limits on Path attributes        
    def init_path_limits(self, max_length:int=4, max_grade:int=4):
        self.max_length = max_length
        self.max_grade = max_grade

    # Initialize limits on Sheep attributes    
    def init_sheep_limits(self, max_prosperity:int=8, max_endurance:int=4, max_greed:int=4):
        self.max_prosperity = max_prosperity
        self.max_endurance = max_endurance
        self.max_greed = max_greed

    # Add a Glen to the county, either a specific one or default generated one    
    def add_glen(self, glen:Glen=None):
        new_glen = glen
        if glen is None:
            new_glen = Glen()
            
        self.glens.append(new_glen)    
        return new_glen

    # Add a whole set of Glens to the county        
    def add_glens(self, connectivity:float=1.0, number:int=16):
        for _ in range(number):
            index = len(self.glens)
            note = '{name}'.format(name=index)
            glen = Glen(64, note)
            self.add_glen(glen)
            
        self.connect_glens(connectivity)
            
        return self.glens

    # Connect a Glen to another, either provided or randomly selected (creates a new Path) 
    def connect_glen(self, glen:Glen, other_glen:Glen=None):
        connected_glen = other_glen
        path = None
        if other_glen is None:
            choices = self.glens
            blacklist = list(map(lambda path: path.to_glen, glen.away_paths))
            blacklist.append(glen)
            clean_list = list(set(choices) - set(blacklist))
            if clean_list:
                connected_glen = random.choice(clean_list)
                
        if connected_glen:
            path = Path(glen, connected_glen)
        
        return path
    
    # Connect Glens, more or less sparsely as dictated by the connectivity attribute
    def connect_glens(self, connectivity:float):
        for glen in self.glens:
            path = self.connect_glen(glen)
            if path:
                self.paths.append(path)
            chance = random.random()
            if chance < connectivity:
                path = self.connect_glen(glen)
                if path:
                    self.paths.append(path)
                
        return self.paths
    
    # Add flocks of sheep
    def add_flocks(self, number:int=16, sheep_per:int=8):
        for _ in range(number):
            glen = random.choice(self.glens)
            flock = Flock(glen, flee_low_grass)
            flock.procreate(sheep_per)
            self.flocks.append(flock)
# TODO: make this into a test
#            if len(self.flocks) > 1: 
#                if flock.members[0] in self.flocks[0].members:
#                    print('A sheep is in more than one flock, all right!')  
        
        return self.flocks
    
    def progress(self, times:int=1):
        for _ in range(times):
            for flock in self.flocks:
                flock.move()
                flock.feed()
        for glen in self.glens:
            glen.increase()
                    
    def draw_county(self):
        from_nodes = list(map(lambda path: path.from_glen.ID, self.paths))
        to_nodes = list(map(lambda path: path.to_glen.ID, self.paths))
        data_frame = pd.DataFrame({ 'from':from_nodes, 'to':to_nodes})
        names = list(map(lambda glen: glen.ID, self.glens))
        abundance_figures = list(map(lambda glen: glen.abundance, self.glens))
        abundances = pd.DataFrame({ 'name':names, 'abundance':abundance_figures})

        G=nx.from_pandas_edgelist(data_frame, 'from', 'to', True, nx.Graph() )

        G.nodes()

        abundances= abundances.set_index('name')
        abundances=abundances.reindex(G.nodes())
        print(abundances)
        pos = nx.spring_layout(G, scale=5, k=.5)
        fig = plt.figure()

        # Plot it, providing a continuous color scale with cmap:
        nx.draw(G, pos=pos, with_labels=True, node_color=abundances['abundance'], edge_color='tan', cmap=plt.cm.Greens)
        fig.set_facecolor("#00000F")

class RegCounty(County):
    
    # Initializer
    def __init__(self, width:int=3, glens=[], flocks=[], paths=[], season:int=0):
        self.glens = glens
        self.flocks = flocks
        self.paths = paths
        self.width = width
        self.season = season
        self.init_glen_limits()
        self.init_path_limits()
        self.init_sheep_limits()
    
    # Add flocks of sheep
    def add_flocks(self, number:int=32, sheep_per:int=16):
        for _ in range(number):
            glen_row = random.choice(self.glens)
            glen = random.choice(glen_row)
            flock = Flock(glen, flee_low_grass)
            flock.procreate(sheep_per)
            self.flocks.append(flock)
            
        return self.flocks
    
    def progress(self, times:int=1):
        for _ in range(times):
            for flock in self.flocks:
                flock.move()
                flock.feed()
            for glen_row in self.glens:
                for glen in glen_row:
                    glen.increase()
    
    def draw_county(self):
        from_nodes = list(map(lambda path: path.from_glen.ID, self.paths))
        to_nodes = list(map(lambda path: path.to_glen.ID, self.paths))
        data_frame = pd.DataFrame({ 'from':from_nodes, 'to':to_nodes})
        glen_list = []
        for glens in self.glens:
            glen_list.extend(glens)
        names = list(map(lambda glen: glen.ID, glen_list))
        abundance_figures = list(map(lambda glen: glen.abundance, glen_list))
        abundances = pd.DataFrame({ 'name':names, 'abundance':abundance_figures})
        pos = {}
        for glen in glen_list:
            pos[glen.ID] = ([glen.pos_x, glen.pos_y])

        G=nx.from_pandas_edgelist(data_frame, 'from', 'to', True, nx.Graph() )

        G.nodes()

        abundances= abundances.set_index('name')
        abundances=abundances.reindex(G.nodes())
        print(abundances)

        fig = plt.figure()

        # Plot it, providing a continuous color scale with cmap:
        nx.draw(G, pos=pos, with_labels=True, node_color=abundances['abundance'], node_size=900, edge_color='tan', cmap=plt.cm.Greens)
        fig.set_facecolor("#00000F")        
    
class HexCounty(RegCounty):
    
    # Initializer
    def __init__(self, width:int=3, glens=[], flocks=[], paths=[], connectivity:float=1.0, season:int=0):
        if glens:
            self.glens = glens
        else:
            self.glens = [[] for i in range(2 * width - 1)]
        self.flocks = flocks
        self.paths = paths
        self.width = width
        self.connectivity = connectivity
        self.season = season
        self.init_glen_limits()
        self.init_path_limits()
        self.init_sheep_limits()
    
    # Add a HexGlen to the county    
    def add_glen(self, x, y, name):
        new_glen = HexGlen(x, y, 64, name, self.width)
        self.glens[y].append(new_glen)
            
        return new_glen
    
    # Add a whole set of HexGlens to the county, connecting them in a hex pattern.     
    def add_glens(self, connectivity:float=1.0):
        rows = 2 * self.width - 1
        for y in range(rows):
            this_width = self.width
            if y < self.width:
                this_width += y
            else:
                this_width += 2 * self.width - y - 2
            for x in range(this_width):
                name = '{x}, {y}'.format(x=x, y=y)
                glen = self.add_glen(x, y, name)
                other_glens = []
                if x > 0:
                    other_glens.append(self.glens[y][x-1])
                if self.width > y > 0:
                    if x > 0:
                        other_glens.append(self.glens[y-1][x-1])
                    if this_width > x + 1:
                        other_glens.append(self.glens[y-1][x])
                elif y > 0:
                    other_glens.append(self.glens[y-1][x+1])
                    other_glens.append(self.glens[y-1][x])
                for other_glen in other_glens:
                    chance = random.random()
                    if chance < connectivity:
                        path = self.connect_glen(glen, other_glen)
                        self.paths.append(path)
            
        return self.glens
    
class GridCounty(RegCounty):
    
    # Initializer
    def __init__(self, width:int=5, glens=[], flocks=[], paths=[], season:int=0):
        if glens:
            self.glens = glens
        else:
            self.glens = [[] for i in range(width)]
        self.flocks = flocks
        self.paths = paths
        self.width = width
        self.season = season
        self.init_glen_limits()
        self.init_path_limits()
        self.init_sheep_limits()

    # Add a GridGlen to the county    
    def add_glen(self, x, y, name):
        new_glen = GridGlen(x, y, 64, name, self.width)
        self.glens[y].append(new_glen)
            
        return new_glen

    # Add a whole set of GridGlens to the county, connecting them in a grid pattern.     
    def add_glens(self, connectivity:float=1.0):
        rows = self.width
        for y in range(rows):
            for x in range(self.width):
                name = '{x}, {y}'.format(x=x, y=y)
                glen = self.add_glen(x, y, name)
                other_glens = []
                if x > 0:
                    other_glens.append(self.glens[y][x-1])
                if y > 0:
                    other_glens.append(self.glens[y-1][x])
                for other_glen in other_glens:
                    chance = random.random()
                    if chance < connectivity:
                        path = self.connect_glen(glen, other_glen)
                        self.paths.append(path)
            
        return self.glens

def demo(turns):
    my_county = County()
    my_county.add_glens()
    my_county.add_flocks()
    for _ in range(turns):
        my_county.progress(3)
        my_county.draw_county()