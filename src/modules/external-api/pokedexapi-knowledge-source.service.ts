import { Injectable } from "@nestjs/common";
import axios, { AxiosInstance } from "axios";
import { AppConfigService } from "../../config/app-config.service";
import { IPokemonKnowledgeSource } from "../pokemon/interfaces/pokemon-knowledge-source.interface";
import { Logger } from "@nestjs/common";
import {
  PokemonDto,
  PokemonSpeciesDto,
  AbilityDto,
  MoveDto,
  TypeDto,
} from "../pokemon/dto/pokemon-data.dto";

/**
 * PokedexAPI Knowledge Source
 *
 * This is an equal partner to PokeAPI, providing alternative Pokemon data.
 * Returns null for endpoints not supported by PokedexAPI.
 */
@Injectable()
export class PokedexApiKnowledgeSource implements IPokemonKnowledgeSource {
  private readonly logger = new Logger(PokedexApiKnowledgeSource.name);

  private axiosInstance: AxiosInstance;

  constructor(private configService: AppConfigService) {
    this.axiosInstance = axios.create({
      baseURL: this.configService.pokedexApiBaseUrl,
      timeout: this.configService.api.timeout,
    });
  }

  getSourceName(): string {
    return "PokedexAPI";
  }

  getReliabilityWeight(): number {
    return 0.7; // Community API - good but less comprehensive than PokeAPI
  }

  async getPokemon(idOrName: string | number): Promise<PokemonDto | null> {
    try {
      this.logger.log(`📡 Fetching Pokemon: ${idOrName} from PokedexAPI`);

      const response = await this.axiosInstance.get(`/pokemon/${idOrName}`);
      const data = response.data;

      // PokedexAPI has limited data structure, we'll extract what's available
      // Note: PokedexAPI structure may differ from PokeAPI
      const dto: PokemonDto = {
        id: data.id || 0,
        name: data.name || String(idOrName),
        height: data.height || 0,
        weight: data.weight || 0,
        baseExperience: data.base_experience || 0,
        types: data.types || [],
        abilities: data.abilities || [],
        stats: data.stats || [],
        moves: data.moves ? data.moves.slice(0, 20) : [],
        sprites: {
          frontDefault: data.sprites?.front_default || null,
          frontShiny: data.sprites?.front_shiny || null,
          backDefault: data.sprites?.back_default || null,
          backShiny: data.sprites?.back_shiny || null,
        },
      };

      this.logger.log(
        `✅ Successfully fetched Pokemon from PokedexAPI: ${dto.name}`
      );

      return dto;
    } catch (error) {
      this.logger.warn(
        `⚠️ PokedexAPI doesn't have Pokemon ${idOrName}: ${error.message}`
      );
      return null;
    }
  }

  async getSpecies(
    idOrName: string | number
  ): Promise<PokemonSpeciesDto | null> {
    this.logger.log(`ℹ️ PokedexAPI doesn't support Species endpoint`);
    return null;
  }

  async getAbility(idOrName: string | number): Promise<AbilityDto | null> {
    this.logger.log(`ℹ️ PokedexAPI doesn't support Ability endpoint`);
    return null;
  }

  async getMove(idOrName: string | number): Promise<MoveDto | null> {
    this.logger.log(`ℹ️ PokedexAPI doesn't support Move endpoint`);
    return null;
  }

  async getType(idOrName: string | number): Promise<TypeDto | null> {
    this.logger.log(`ℹ️ PokedexAPI doesn't support Type endpoint`);
    return null;
  }

  async searchPokemon(
    limit: number = 20,
    offset: number = 0
  ): Promise<any | null> {
    try {
      this.logger.log(`📡 Searching Pokemon from PokedexAPI (limit: ${limit})`);

      // PokedexAPI may have different search/list structure
      const response = await this.axiosInstance.get(`/pokemon?limit=${limit}`);

      this.logger.log(`✅ Successfully searched Pokemon from PokedexAPI`);

      return response.data;
    } catch (error) {
      this.logger.warn(`⚠️ PokedexAPI search failed: ${error.message}`);
      return null;
    }
  }
}
