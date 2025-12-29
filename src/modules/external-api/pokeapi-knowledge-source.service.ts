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

@Injectable()
export class PokeApiKnowledgeSource implements IPokemonKnowledgeSource {
  private readonly logger = new Logger(PokeApiKnowledgeSource.name);

  private axiosInstance: AxiosInstance;

  constructor(private configService: AppConfigService) {
    this.axiosInstance = axios.create({
      baseURL: this.configService.pokeApiBaseUrl,
      timeout: this.configService.api.timeout,
    });
  }

  getSourceName(): string {
    return "PokeAPI";
  }

  getReliabilityWeight(): number {
    return 1.0; // Official Pokemon API - highest reliability
  }

  async getPokemon(idOrName: string | number): Promise<PokemonDto | null> {
    try {
      this.logger.log(`📡 Fetching Pokemon: ${idOrName} from PokeAPI`);

      const response = await this.axiosInstance.get(`/pokemon/${idOrName}`);
      const data = response.data;

      // Transform to DTO with important fields only
      const dto: PokemonDto = {
        id: data.id,
        name: data.name,
        height: data.height,
        weight: data.weight,
        baseExperience: data.base_experience,
        types: data.types.map((t: any) => ({
          slot: t.slot,
          type: {
            name: t.type.name,
            url: t.type.url,
          },
        })),
        abilities: data.abilities.map((a: any) => ({
          ability: {
            name: a.ability.name,
            url: a.ability.url,
          },
          isHidden: a.is_hidden,
          slot: a.slot,
        })),
        stats: data.stats.map((s: any) => ({
          stat: {
            name: s.stat.name,
          },
          baseStat: s.base_stat,
          effort: s.effort,
        })),
        moves: data.moves.map((m: any) => m.move.name).slice(0, 20), // Limit to first 20 moves
        sprites: {
          frontDefault: data.sprites.front_default,
          frontShiny: data.sprites.front_shiny,
          backDefault: data.sprites.back_default,
          backShiny: data.sprites.back_shiny,
        },
      };

      this.logger.log(`✅ Successfully fetched Pokemon: ${data.name}`);

      return dto;
    } catch (error) {
      this.logger.error(
        `❌ Failed to fetch Pokemon ${idOrName}: ${error.message}`
      );
      return null;
    }
  }

  async getSpecies(
    idOrName: string | number
  ): Promise<PokemonSpeciesDto | null> {
    try {
      this.logger.log(`📡 Fetching Pokemon Species: ${idOrName} from PokeAPI`);

      const response = await this.axiosInstance.get(
        `/pokemon-species/${idOrName}`
      );
      const data = response.data;

      // Transform to DTO with important fields only
      const dto: PokemonSpeciesDto = {
        id: data.id,
        name: data.name,
        order: data.order,
        genderRate: data.gender_rate,
        captureRate: data.capture_rate,
        baseHappiness: data.base_happiness,
        isBaby: data.is_baby,
        isLegendary: data.is_legendary,
        isMythical: data.is_mythical,
        hatchCounter: data.hatch_counter,
        hasGenderDifferences: data.has_gender_differences,
        growthRate: {
          name: data.growth_rate.name,
        },
        eggGroups: data.egg_groups.map((eg: any) => ({
          name: eg.name,
        })),
        color: {
          name: data.color.name,
        },
        shape: data.shape ? { name: data.shape.name } : null,
        evolvesFromSpecies: data.evolves_from_species
          ? { name: data.evolves_from_species.name }
          : null,
        evolutionChain: {
          url: data.evolution_chain.url,
        },
        habitat: data.habitat ? { name: data.habitat.name } : null,
        generation: {
          name: data.generation.name,
        },
        genera: data.genera.map((g: any) => ({
          genus: g.genus,
          language: {
            name: g.language.name,
          },
        })),
        flavorTextEntries: data.flavor_text_entries
          .filter((entry: any) => entry.language.name === "en")
          .slice(0, 5) // Limit to 5 most recent English entries
          .map((entry: any) => ({
            flavorText: entry.flavor_text
              .replace(/\f/g, " ")
              .replace(/\n/g, " "),
            language: {
              name: entry.language.name,
            },
            version: {
              name: entry.version.name,
            },
          })),
      };

      this.logger.log(`✅ Successfully fetched Species: ${data.name}`);

      return dto;
    } catch (error) {
      this.logger.error(
        `❌ Failed to fetch Species ${idOrName}: ${error.message}`
      );
      return null;
    }
  }

  async getAbility(idOrName: string | number): Promise<AbilityDto | null> {
    try {
      this.logger.log(`📡 Fetching Ability: ${idOrName} from PokeAPI`);

      const response = await this.axiosInstance.get(`/ability/${idOrName}`);
      const data = response.data;

      // Transform to DTO with important fields only
      const dto: AbilityDto = {
        id: data.id,
        name: data.name,
        isMainSeries: data.is_main_series,
        generation: {
          name: data.generation.name,
        },
        effectEntries: data.effect_entries
          .filter((entry: any) => entry.language.name === "en")
          .map((entry: any) => ({
            effect: entry.effect,
            shortEffect: entry.short_effect,
            language: {
              name: entry.language.name,
            },
          })),
        flavorTextEntries: data.flavor_text_entries
          .filter((entry: any) => entry.language.name === "en")
          .slice(0, 3)
          .map((entry: any) => ({
            flavorText: entry.flavor_text,
            language: {
              name: entry.language.name,
            },
            versionGroup: {
              name: entry.version_group.name,
            },
          })),
        pokemon: data.pokemon.slice(0, 10).map((p: any) => ({
          isHidden: p.is_hidden,
          slot: p.slot,
          pokemon: {
            name: p.pokemon.name,
          },
        })),
      };

      this.logger.log(`✅ Successfully fetched Ability: ${data.name}`);

      return dto;
    } catch (error) {
      this.logger.error(
        `❌ Failed to fetch Ability ${idOrName}: ${error.message}`
      );
      return null;
    }
  }

  async getMove(idOrName: string | number): Promise<MoveDto | null> {
    try {
      this.logger.log(`📡 Fetching Move: ${idOrName} from PokeAPI`);

      const response = await this.axiosInstance.get(`/move/${idOrName}`);
      const data = response.data;

      // Transform to DTO with important fields only
      const dto: MoveDto = {
        id: data.id,
        name: data.name,
        accuracy: data.accuracy,
        effectChance: data.effect_chance,
        pp: data.pp,
        priority: data.priority,
        power: data.power,
        damageClass: {
          name: data.damage_class.name,
        },
        type: {
          name: data.type.name,
        },
        target: {
          name: data.target.name,
        },
        effectEntries: data.effect_entries
          .filter((entry: any) => entry.language.name === "en")
          .map((entry: any) => ({
            effect: entry.effect,
            shortEffect: entry.short_effect,
            language: {
              name: entry.language.name,
            },
          })),
        flavorTextEntries: data.flavor_text_entries
          .filter((entry: any) => entry.language.name === "en")
          .slice(0, 3)
          .map((entry: any) => ({
            flavorText: entry.flavor_text,
            language: {
              name: entry.language.name,
            },
            versionGroup: {
              name: entry.version_group.name,
            },
          })),
        generation: {
          name: data.generation.name,
        },
        meta: {
          ailment: {
            name: data.meta.ailment.name,
          },
          category: {
            name: data.meta.category.name,
          },
          minHits: data.meta.min_hits,
          maxHits: data.meta.max_hits,
          minTurns: data.meta.min_turns,
          maxTurns: data.meta.max_turns,
          drain: data.meta.drain,
          healing: data.meta.healing,
          critRate: data.meta.crit_rate,
          ailmentChance: data.meta.ailment_chance,
          flinchChance: data.meta.flinch_chance,
          statChance: data.meta.stat_chance,
        },
        learnedByPokemon: data.learned_by_pokemon
          .slice(0, 15)
          .map((p: any) => p.name),
      };

      this.logger.log(`✅ Successfully fetched Move: ${data.name}`);

      return dto;
    } catch (error) {
      this.logger.error(
        `❌ Failed to fetch Move ${idOrName}: ${error.message}`
      );
      return null;
    }
  }

  async getType(idOrName: string | number): Promise<TypeDto | null> {
    try {
      this.logger.log(`📡 Fetching Type: ${idOrName} from PokeAPI`);

      const response = await this.axiosInstance.get(`/type/${idOrName}`);
      const data = response.data;

      // Transform to DTO with important fields only
      const dto: TypeDto = {
        id: data.id,
        name: data.name,
        damageRelations: {
          noDamageTo: data.damage_relations.no_damage_to.map((t: any) => ({
            name: t.name,
          })),
          halfDamageTo: data.damage_relations.half_damage_to.map((t: any) => ({
            name: t.name,
          })),
          doubleDamageTo: data.damage_relations.double_damage_to.map(
            (t: any) => ({
              name: t.name,
            })
          ),
          noDamageFrom: data.damage_relations.no_damage_from.map((t: any) => ({
            name: t.name,
          })),
          halfDamageFrom: data.damage_relations.half_damage_from.map(
            (t: any) => ({
              name: t.name,
            })
          ),
          doubleDamageFrom: data.damage_relations.double_damage_from.map(
            (t: any) => ({
              name: t.name,
            })
          ),
        },
        generation: {
          name: data.generation.name,
        },
        moveDamageClass: data.move_damage_class
          ? { name: data.move_damage_class.name }
          : null,
        pokemon: data.pokemon.slice(0, 20).map((p: any) => ({
          slot: p.slot,
          pokemon: {
            name: p.pokemon.name,
          },
        })),
        moves: data.moves.slice(0, 20).map((m: any) => ({
          name: m.name,
        })),
      };

      this.logger.log(`✅ Successfully fetched Type: ${data.name}`);

      return dto;
    } catch (error) {
      this.logger.error(
        `❌ Failed to fetch Type ${idOrName}: ${error.message}`
      );
      return null;
    }
  }

  async searchPokemon(
    limit: number = 20,
    offset: number = 0
  ): Promise<any | null> {
    try {
      this.logger.log(
        `📡 Searching Pokemon (limit: ${limit}, offset: ${offset})`
      );

      const response = await this.axiosInstance.get(
        `/pokemon?limit=${limit}&offset=${offset}`
      );

      this.logger.log(`✅ Successfully searched Pokemon`);

      return response.data;
    } catch (error) {
      this.logger.error(`❌ Failed to search Pokemon: ${error.message}`);
      return null;
    }
  }
}
