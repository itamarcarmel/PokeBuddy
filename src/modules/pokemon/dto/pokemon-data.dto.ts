/**
 * Data Transfer Objects for Pokemon Data
 *
 * These DTOs contain only the important fields from API responses,
 * excluding niche or overly technical details.
 */

// ============================================
// POKEMON BASIC DATA
// ============================================

export interface PokemonDto {
  id: number;
  name: string;
  height: number; // in decimeters
  weight: number; // in hectograms
  baseExperience: number;
  types: PokemonTypeDto[];
  abilities: PokemonAbilityDto[];
  stats: PokemonStatDto[];
  moves: string[]; // Just the names, not full details
  sprites: PokemonSpritesDto;
}

export interface PokemonTypeDto {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

export interface PokemonAbilityDto {
  ability: {
    name: string;
    url: string;
  };
  isHidden: boolean;
  slot: number;
}

export interface PokemonStatDto {
  stat: {
    name: string; // hp, attack, defense, special-attack, special-defense, speed
  };
  baseStat: number;
  effort: number; // EV yield
}

export interface PokemonSpritesDto {
  frontDefault: string | null;
  frontShiny: string | null;
  backDefault: string | null;
  backShiny: string | null;
}

// ============================================
// POKEMON SPECIES DATA
// ============================================

export interface PokemonSpeciesDto {
  id: number;
  name: string;
  order: number;
  genderRate: number; // -1 for genderless, otherwise eighths female
  captureRate: number;
  baseHappiness: number;
  isBaby: boolean;
  isLegendary: boolean;
  isMythical: boolean;
  hatchCounter: number; // egg cycles
  hasGenderDifferences: boolean;
  growthRate: {
    name: string; // slow, medium, fast, etc.
  };
  eggGroups: Array<{
    name: string;
  }>;
  color: {
    name: string; // red, blue, yellow, etc.
  };
  shape: {
    name: string; // ball, squiggle, fish, etc.
  } | null;
  evolvesFromSpecies: {
    name: string;
  } | null;
  evolutionChain: {
    url: string; // URL to fetch full evolution chain
  };
  habitat: {
    name: string;
  } | null;
  generation: {
    name: string;
  };
  genera: Array<{
    genus: string; // "Seed Pokemon", "Mouse Pokemon", etc.
    language: {
      name: string;
    };
  }>;
  flavorTextEntries: Array<{
    flavorText: string; // Pokedex entry
    language: {
      name: string;
    };
    version: {
      name: string;
    };
  }>;
}

// ============================================
// ABILITIES
// ============================================

export interface AbilityDto {
  id: number;
  name: string;
  isMainSeries: boolean;
  generation: {
    name: string;
  };
  effectEntries: Array<{
    effect: string;
    shortEffect: string;
    language: {
      name: string;
    };
  }>;
  flavorTextEntries: Array<{
    flavorText: string;
    language: {
      name: string;
    };
    versionGroup: {
      name: string;
    };
  }>;
  pokemon: Array<{
    isHidden: boolean;
    slot: number;
    pokemon: {
      name: string;
    };
  }>;
}

// ============================================
// MOVES
// ============================================

export interface MoveDto {
  id: number;
  name: string;
  accuracy: number | null;
  effectChance: number | null;
  pp: number;
  priority: number;
  power: number | null;
  damageClass: {
    name: string; // physical, special, status
  };
  type: {
    name: string;
  };
  target: {
    name: string; // selected-pokemon, all-opponents, user, etc.
  };
  effectEntries: Array<{
    effect: string;
    shortEffect: string;
    language: {
      name: string;
    };
  }>;
  flavorTextEntries: Array<{
    flavorText: string;
    language: {
      name: string;
    };
    versionGroup: {
      name: string;
    };
  }>;
  generation: {
    name: string;
  };
  meta: {
    ailment: {
      name: string; // none, paralysis, burn, freeze, etc.
    };
    category: {
      name: string; // damage, ailment, net-good-stats, etc.
    };
    minHits: number | null;
    maxHits: number | null;
    minTurns: number | null;
    maxTurns: number | null;
    drain: number; // HP drain percentage
    healing: number; // HP healing percentage
    critRate: number; // critical hit rate bonus
    ailmentChance: number;
    flinchChance: number;
    statChance: number;
  };
  learnedByPokemon: string[]; // Just names, not full data
}

// ============================================
// TYPES
// ============================================

export interface TypeDto {
  id: number;
  name: string;
  damageRelations: {
    noDamageTo: Array<{ name: string }>;
    halfDamageTo: Array<{ name: string }>;
    doubleDamageTo: Array<{ name: string }>;
    noDamageFrom: Array<{ name: string }>;
    halfDamageFrom: Array<{ name: string }>;
    doubleDamageFrom: Array<{ name: string }>;
  };
  generation: {
    name: string;
  };
  moveDamageClass: {
    name: string; // physical, special, or null for type-independent
  } | null;
  pokemon: Array<{
    slot: number;
    pokemon: {
      name: string;
    };
  }>;
  moves: Array<{
    name: string;
  }>;
}

// ============================================
// EVOLUTION CHAIN
// ============================================

export interface EvolutionChainDto {
  id: number;
  babyTriggerItem: {
    name: string;
  } | null;
  chain: ChainLinkDto;
}

export interface ChainLinkDto {
  isBaby: boolean;
  species: {
    name: string;
    url: string;
  };
  evolutionDetails: EvolutionDetailDto[];
  evolvesTo: ChainLinkDto[];
}

export interface EvolutionDetailDto {
  item: {
    name: string;
  } | null;
  trigger: {
    name: string; // level-up, trade, use-item, shed, etc.
  };
  gender: number | null; // 1 = female, 2 = male, null = either
  heldItem: {
    name: string;
  } | null;
  knownMove: {
    name: string;
  } | null;
  knownMoveType: {
    name: string;
  } | null;
  location: {
    name: string;
  } | null;
  minLevel: number | null;
  minHappiness: number | null;
  minBeauty: number | null;
  minAffection: number | null;
  needsOverworldRain: boolean;
  partySpecies: {
    name: string;
  } | null;
  partyType: {
    name: string;
  } | null;
  relativePhysicalStats: number | null; // 1 = Atk > Def, 0 = Atk = Def, -1 = Atk < Def
  timeOfDay: string; // "day", "night", or ""
  tradeSpecies: {
    name: string;
  } | null;
  turnUpsideDown: boolean;
}
