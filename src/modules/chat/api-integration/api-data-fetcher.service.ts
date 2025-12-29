import { Injectable } from "@nestjs/common";
import {
  PokemonDataAggregatorService,
  AggregatedResponse,
} from "../../pokemon/pokemon-data-aggregator.service";
import { Logger } from "@nestjs/common";
import { EndpointRequest } from "../llm-integration/message-intent-classifier.service";

/**
 * Structured API data organized by endpoint type
 * Each type can contain multiple results (e.g., multiple abilities)
 */
export interface FetchedApiData {
  pokemon?: AggregatedResponse[];
  species?: AggregatedResponse[];
  ability?: AggregatedResponse[];
  move?: AggregatedResponse[];
  type?: AggregatedResponse[];
}

/**
 * ApiDataFetcherService
 *
 * Handles fetching data from multiple API endpoints in parallel
 * Tracks which sources were used for debugging
 */
@Injectable()
export class ApiDataFetcherService {
  private readonly logger = new Logger(ApiDataFetcherService.name);

  // Endpoint fetcher mapping - cleaner than switch statement
  private readonly endpointFetchers = {
    pokemon: async (param: string | number) => ({
      type: "pokemon" as const,
      data: await this.dataAggregator.getPokemon(param),
    }),
    species: async (param: string | number) => ({
      type: "species" as const,
      data: await this.dataAggregator.getSpecies(param),
    }),
    ability: async (param: string | number) => ({
      type: "ability" as const,
      data: await this.dataAggregator.getAbility(param),
    }),
    move: async (param: string | number) => ({
      type: "move" as const,
      data: await this.dataAggregator.getMove(param),
    }),
    type: async (param: string | number) => ({
      type: "type" as const,
      data: await this.dataAggregator.getType(param),
    }),
  };

  constructor(private readonly dataAggregator: PokemonDataAggregatorService) {}

  /**
   * Fetch data from all required endpoints in parallel
   * Returns organized data and list of resources used with timing
   */
  async fetchEndpointData(
    endpoints: EndpointRequest[],
    resourcesUsed: Array<{ source: string; parameter: string; responseTime: number }>
  ): Promise<FetchedApiData> {
    if (!endpoints || endpoints.length === 0) {
      return {};
    }

    this.logger.log(`📡 Fetching data from ${endpoints.length} endpoints`);

    // Fetch data for each required endpoint using mapping
    const fetchPromises = endpoints.map(async (endpoint) => {
      const startTime = Date.now();
      try {
        // Type guard to ensure endpoint is valid
        const validEndpoint = endpoint.endpoint as keyof typeof this.endpointFetchers;
        const fetcher = this.endpointFetchers[validEndpoint];

        if (!fetcher) {
          this.logger.warn(`Unknown endpoint type: ${endpoint.endpoint}`);
          return null;
        }

        const result = await fetcher(endpoint.parameter);
        const responseTime = Date.now() - startTime;

        // Track which sources were used with timing
        if (result.data.sources) {
          result.data.sources.forEach((s: string) => {
            resourcesUsed.push({
              source: `${s}-${this.capitalize(result.type)}`,
              parameter: String(endpoint.parameter),
              responseTime,
            });
          });
        }

        return result;
      } catch (error) {
        this.logger.error(
          `❌ Failed to fetch ${endpoint.endpoint} (${endpoint.parameter}): ${error.message}`
        );
        // Re-throw critical errors, but allow partial data fetching to continue
        if (
          error.message.includes("ECONNREFUSED") ||
          error.message.includes("ENOTFOUND")
        ) {
          throw new Error(`Unable to connect to Pokemon API: ${error.message}`);
        }
        return null;
      }
    });

    const results = await Promise.all(fetchPromises);

    // Organize data by type
    const apiData: FetchedApiData = {};
    results.forEach(
      (result: { type: keyof FetchedApiData; data: AggregatedResponse } | null) => {
        if (result) {
          if (!apiData[result.type]) {
            apiData[result.type] = [];
          }
          // Add null check for array access
          const dataArray = apiData[result.type];
          if (dataArray) {
            dataArray.push(result.data);
          }
        }
      }
    );

    this.logger.log(`✅ Data fetched successfully from APIs`);
    return apiData;
  }

  /**
   * Helper to capitalize first letter of a string
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
