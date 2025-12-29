import { Injectable } from "@nestjs/common";
import { IPokemonKnowledgeSource } from "./interfaces/pokemon-knowledge-source.interface";
import { PokeApiKnowledgeSource } from "../external-api/pokeapi-knowledge-source.service";
import { PokedexApiKnowledgeSource } from "../external-api/pokedexapi-knowledge-source.service";
import { Logger } from "@nestjs/common";
import {
  PokemonDto,
  PokemonSpeciesDto,
  AbilityDto,
  MoveDto,
  TypeDto,
} from "./dto/pokemon-data.dto";

/**
 * Aggregated API Response
 * Contains data from all knowledge sources with reliability weights
 */
export interface AggregatedResponse {
  pokemon?: PokemonDto[];
  species?: PokemonSpeciesDto[];
  abilities?: AbilityDto[];
  moves?: MoveDto[];
  types?: TypeDto[];
  searchResults?: Array<{ name: string; url: string }>; // For search/list operations
  sources: string[]; // Which APIs provided data
  sourceWeights?: Record<string, number>; // Reliability weight for each source
}

/**
 * Pokemon Data Aggregator Service
 *
 * Calls multiple Pokemon knowledge sources (PokeAPI, PokedexAPI, etc.) in parallel
 * and aggregates their responses. Uses a generic aggregation method to avoid code duplication.
 */
@Injectable()
export class PokemonDataAggregatorService {
  private readonly logger = new Logger(PokemonDataAggregatorService.name);

  private knowledgeSources: IPokemonKnowledgeSource[] = [];

  constructor(
    private pokeApiSource: PokeApiKnowledgeSource,
    private pokedexApiSource: PokedexApiKnowledgeSource
  ) {
    // Register all knowledge sources automatically
    this.registerSource(this.pokeApiSource);
    this.registerSource(this.pokedexApiSource);

    this.logger.log(
      `✅ PokemonDataAggregatorService initialized with ${this.knowledgeSources.length} knowledge sources`
    );
  }

  /**
   * Register a knowledge source
   */
  registerSource(source: IPokemonKnowledgeSource): void {
    this.knowledgeSources.push(source);
    this.logger.log(
      `📚 Registered knowledge source: ${source.getSourceName()}`
    );
  }

  /**
   * Get all registered knowledge sources
   */
  getSources(): IPokemonKnowledgeSource[] {
    return this.knowledgeSources;
  }

  /**
   * Generic method to aggregate data from all sources
   * Eliminates code duplication across all data fetching methods
   *
   * @param dataType The type of data being fetched (for logging)
   * @param fetchFn The function to call on each source
   * @param resultKey The key to store results in the response
   * @param parameter The parameter to pass to the fetch function
   */
  private async aggregateData<T>(
    dataType: string,
    fetchFn: (source: IPokemonKnowledgeSource, param: any) => Promise<T | null>,
    resultKey: keyof AggregatedResponse,
    parameter: string | number
  ): Promise<AggregatedResponse> {
    this.logger.log(`🔄 Aggregating ${dataType} data for: ${parameter}`);

    const promises = this.knowledgeSources.map(async (source) => {
      try {
        const data = await fetchFn(source, parameter);
        return {
          source: source.getSourceName(),
          data,
          weight: source.getReliabilityWeight(),
        };
      } catch (error) {
        this.logger.warn(
          `⚠️ ${source.getSourceName()} failed to fetch ${dataType} ${parameter}: ${
            error.message
          }`
        );
        return {
          source: source.getSourceName(),
          data: null,
          weight: 0,
        };
      }
    });

    const results = await Promise.all(promises);

    const dataArray = results
      .filter((r) => r.data !== null)
      .map((r) => r.data as T);

    const sources = results.filter((r) => r.data !== null).map((r) => r.source);

    const sourceWeights: Record<string, number> = {};
    results
      .filter((r) => r.data !== null)
      .forEach((r) => {
        sourceWeights[r.source] = r.weight;
      });

    this.logger.log(
      `✅ ${dataType} data aggregated from ${sources.length}/${this.knowledgeSources.length} sources`
    );

    return {
      [resultKey]: dataArray,
      sources,
      sourceWeights,
    } as AggregatedResponse;
  }

  /**
   * Fetch Pokemon data from all sources
   */
  async getPokemon(idOrName: string | number): Promise<AggregatedResponse> {
    return this.aggregateData<PokemonDto>(
      "Pokemon",
      (source, param) => source.getPokemon(param),
      "pokemon",
      idOrName
    );
  }

  /**
   * Fetch Species data from all sources
   */
  async getSpecies(idOrName: string | number): Promise<AggregatedResponse> {
    return this.aggregateData<PokemonSpeciesDto>(
      "Species",
      (source, param) => source.getSpecies(param),
      "species",
      idOrName
    );
  }

  /**
   * Fetch Ability data from all sources
   */
  async getAbility(idOrName: string | number): Promise<AggregatedResponse> {
    return this.aggregateData<AbilityDto>(
      "Ability",
      (source, param) => source.getAbility(param),
      "abilities",
      idOrName
    );
  }

  /**
   * Fetch Move data from all sources
   */
  async getMove(idOrName: string | number): Promise<AggregatedResponse> {
    return this.aggregateData<MoveDto>(
      "Move",
      (source, param) => source.getMove(param),
      "moves",
      idOrName
    );
  }

  /**
   * Fetch Type data from all sources
   */
  async getType(idOrName: string | number): Promise<AggregatedResponse> {
    return this.aggregateData<TypeDto>(
      "Type",
      (source, param) => source.getType(param),
      "types",
      idOrName
    );
  }

  /**
   * Search Pokemon across all sources
   */
  async searchPokemon(
    limit: number = 20,
    offset: number = 0
  ): Promise<AggregatedResponse> {
    this.logger.log(
      `🔄 Searching Pokemon (limit: ${limit}, offset: ${offset})`
    );

    const promises = this.knowledgeSources.map(async (source) => {
      try {
        const data = await source.searchPokemon(limit, offset);
        return { source: source.getSourceName(), data };
      } catch (error) {
        this.logger.warn(
          `⚠️ ${source.getSourceName()} failed to search Pokemon: ${
            error.message
          }`
        );
        return { source: source.getSourceName(), data: null };
      }
    });

    const results = await Promise.all(promises);

    const sources = results.filter((r) => r.data !== null).map((r) => r.source);

    this.logger.log(
      `✅ Pokemon search aggregated from ${sources.length}/${this.knowledgeSources.length} sources`
    );

    // Search results are name/url pairs, not full Pokemon data
    return {
      searchResults: results
        .filter((r) => r.data !== null)
        .flatMap((r) => r.data?.results || []),
      sources,
    };
  }
}
