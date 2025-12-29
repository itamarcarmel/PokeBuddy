/**
 * Pokemon Knowledge Source Interface
 *
 * This interface defines a contract for Pokemon data providers.
 * Any API that can provide Pokemon information should implement this interface.
 *
 * Methods return null when the specific API doesn't support that endpoint,
 * and throw errors for actual failures (network issues, etc.)
 *
 * Focused on core Pokemon data: Basic info, Species, Abilities, Moves, Types
 */

import {
  PokemonDto,
  PokemonSpeciesDto,
  AbilityDto,
  MoveDto,
  TypeDto,
} from "../dto/pokemon-data.dto";

export interface IPokemonKnowledgeSource {
  /**
   * Get the name/identifier of this knowledge source (e.g., "PokeAPI", "PokedexAPI")
   */
  getSourceName(): string;

  /**
   * Get reliability weight for this source (0.0 to 1.0)
   * Higher weight = more reliable/authoritative
   * Used by LLM to prioritize information when aggregating responses
   *
   * Suggested weights:
   * - 1.0: Official/canonical source (e.g., PokeAPI)
   * - 0.8: Very reliable community source
   * - 0.6: Reliable but less comprehensive
   * - 0.4: Experimental or less tested
   */
  getReliabilityWeight(): number;

  /**
   * Basic Pokemon data (stats, types, abilities, moves, sprites, height, weight)
   */
  getPokemon(idOrName: string | number): Promise<PokemonDto | null>;

  /**
   * Species-level data (evolution chain URL, egg groups, growth rates, Pokedex entries, genus)
   */
  getSpecies(idOrName: string | number): Promise<PokemonSpeciesDto | null>;

  /**
   * Ability details and effects
   */
  getAbility(idOrName: string | number): Promise<AbilityDto | null>;

  /**
   * Move data (damage, accuracy, PP, power, type, damage class, effects)
   */
  getMove(idOrName: string | number): Promise<MoveDto | null>;

  /**
   * Type data (effectiveness, damage relations)
   */
  getType(idOrName: string | number): Promise<TypeDto | null>;

  /**
   * Search/list Pokemon with pagination (for general queries)
   */
  searchPokemon(
    limit?: number,
    offset?: number
  ): Promise<{
    results: Array<{ name: string; url: string }>;
    count: number;
  } | null>;
}
