import Pokemon from '../model/pokemon.js';
import Hunter from '../model/hunter.js';
import Police from '../model/police.js';
import { pokemonTypes } from './PokemonTypes.js';

export const rows = 30;
export const cols = 30;

export const generateFirstGeneration = () => {
  const pokemons = [];
  const hunters = [];
  const police = [];

  for (let i = 0; i < 40; i++) {
    pokemons.push( generateRandomPokemon(pokemons, hunters, police) ); 
  }

  for (let i = 0; i < 10; i++) {
    const coordinates = generateValidCoordinates(pokemons, hunters, police);
    hunters.push( new Hunter("HUNTER-" + uuid(),coordinates[0], coordinates[1], 100, 0, {}, rows, 2) );
  }

  for (let i = 0; i < 0; i++) {
    const coordinates = generateValidCoordinates(pokemons, hunters, police);
    police.push( new Police(coordinates[0], coordinates[1], 3) );
  }

  return {
    pokemons,
    hunters,
    police,
    finished: false,
    count: 0
  };
}

export const simulationTick = (simulationState) => {
  const { count, pokemons, hunters, police } = simulationState;

  if (count === 30 || pokemons.length === 0) {
    return { 
      ...simulationState, 
      finished: true
    };
  }

  hunters.forEach(hunter => {
    takeAStep(hunter, pokemons, hunters, police);
  });

  police.forEach(policeman => {
    takeAStep(policeman, pokemons, hunters, police);
  });

  return { 
    ...simulationState, 
    hunters, 
    police, 
    pokemons, 
    count: count + 1 
  };
}

const generateRandomPokemon = (pokemons, hunters, police) => {
  const randomChoice = Math.floor(Math.random() * pokemonTypes.length);
  const coordinates = generateValidCoordinates(pokemons, hunters, police);

  return new Pokemon("POKE-" + uuid(), coordinates[0], coordinates[1], pokemonTypes[randomChoice].type, pokemonTypes[randomChoice].url, 100, null, null)
}

const generateValidCoordinates = (pokemons, hunters, police) => {
  let randomX, randomY;

  let someoneThere = true;
  while (someoneThere) {
    randomX = Math.floor(Math.random() * (rows - 1));
    randomY = Math.floor(Math.random() * (cols - 1));

    someoneThere = isSomeoneThere(randomX, randomY, pokemons, hunters, police);
  }

  return [ randomX, randomY ];
}

/* Utils */
export const copySimulationState = (state) => {
  return {
    ...state,
    hunters: copyArrayOfObjects(state.hunters),
    police: copyArrayOfObjects(state.police),
    pokemons: copyArrayOfObjects(state.pokemons),
  };
}

const uuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const copyArrayOfObjects = (array) => {
  array = [...array];
  for(let i = 0; i < array.length; i++) {
    array[i] = {...array[i]};
  }

  return array;
}

const isOutOfBounds = (x, y) => {
  return x < 0 || x >= rows || y < 0 || y >= cols;
}

const isSomeoneThere = (x, y, pokemons, hunters, police) => {
  let someoneThere = false;
  pokemons.forEach( pokemon => {
    someoneThere = someoneThere || (pokemon.x === x && pokemon.y === y);
  });
  if (someoneThere) return someoneThere;

  hunters.forEach( hunter => {
    someoneThere = someoneThere || (hunter.x === x && hunter.y === y);
  });
  if (someoneThere) return someoneThere;

  police.forEach( policeman => {
    someoneThere = someoneThere || (policeman.x === x && policeman.y === y);
  });
  
  return someoneThere;
}

const getDistanceSq = (x1, y1, x2, y2) => {
  return (x1 - x2) *
  (x1 - x2) +
  (y1 - y2) *
  (y1 - y2);
}

const isInSight = (x1, y1, x2, y2, sightDistance) => {
  const distanceSq = getDistanceSq(x1, y1, x2, y2);
  const sightDistanceSq = sightDistance * sightDistance;
  return distanceSq <= sightDistanceSq;
}

const getNearestInSightPokemon = (x, y, sightDistance, pokemons) => {
  let nearestPokemon = null;

  pokemons.forEach( pokemon => {
    if ( isInSight(x, y, pokemon.x, pokemon.y, sightDistance) ) {
      if (!nearestPokemon) {
        nearestPokemon = pokemon;

      } else {
        const distanceSq = getDistanceSq(x, y, pokemon.x, pokemon.y);
        const nearestPokemonDistanceSq = getDistanceSq(x, y, nearestPokemon.x, nearestPokemon.y);

        if ( distanceSq < nearestPokemonDistanceSq) {
          nearestPokemon = pokemon;
        }
      } 
    }
  });

  return nearestPokemon;
}

const getMoveToGetCloseTo = (x1, y1, x2, y2) => {
  const xDiff = x2 - x1;
  const yDiff = y2 - y1;

  if (xDiff < 0 && yDiff < 0) {
    return [-1, -1];

  } else if (xDiff === 0 && yDiff < 0) {
    return [0, -1];
  
  } else if (xDiff > 0 && yDiff < 0) {
    return [1, -1];

  } else if(xDiff > 0 && yDiff === 0) {
    return [1, 0];

  } else if (xDiff > 0 && yDiff > 0) {
    return [1, 1];

  } else if (xDiff === 0 && yDiff > 0) {
    return [0, 1];

  } else if (xDiff < 0 && yDiff > 0) {
    return [-1, 1];

  } else if (xDiff < 0 && yDiff === 0) {
    return [-1, 0];
  }

  return [0, 0];
}

const catchPokemon = (hunter, pokemonToCatch, pokemons, hunters, police) => {
  hunter.pokemonCounter += 1;
  for (let i = 0; i < pokemons.length; i++) {
    if (pokemons[i].id === pokemonToCatch.id) pokemons.splice(i, 1);
  }
  pokemons.push(generateRandomPokemon(pokemons, hunters, police));
}

const takeAStep = (entity, pokemons, hunters, police) => {
  const moveOptions = [1, 0, -1];
  let newX, newY;
  
  const pokemonToCatch = getNearestInSightPokemon(entity.x, entity.y, 1, pokemons);
  if (pokemonToCatch) {
    catchPokemon(entity, pokemonToCatch, pokemons, hunters, police);
    return;
  }

  let invalidCoordinates = true;
  while (invalidCoordinates) {

      const nearestPokemon = getNearestInSightPokemon(entity.x, entity.y, entity.sightDistance, pokemons);
      let move;
      let randomMove = true;
      if (nearestPokemon) {
        move = getMoveToGetCloseTo(entity.x, entity.y, nearestPokemon.x, nearestPokemon.y);
        randomMove = isSomeoneThere(newX, newY, pokemons, hunters, police) ? randomMove : false;

      } 
      
      if (randomMove) {
        move = [ moveOptions[Math.floor(Math.random() * moveOptions.length)], 
                moveOptions[Math.floor(Math.random() * moveOptions.length)] ];
      }

      newX = entity.x + move[0];
      newY = entity.y + move[1];
      
      invalidCoordinates = isOutOfBounds(newX, newY)
        || isSomeoneThere(newX, newY, pokemons, hunters, police);
  }

  entity.x = newX;
  entity.y = newY;
}
