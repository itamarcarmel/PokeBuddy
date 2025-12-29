import { Test, TestingModule } from "@nestjs/testing";
import { ApiDataFetcherService } from "./api-data-fetcher.service";
import { PokemonDataAggregatorService } from "../../../pokemon/pokemon-data-aggregator.service";

describe("ApiDataFetcherService", () => {
  let service: ApiDataFetcherService;
  let mockAggregatorService: any;

  beforeEach(async () => {
    mockAggregatorService = {
      getPokemonData: jest.fn().mockResolvedValue({
        name: "Pikachu",
        id: 25,
        types: ["Electric"],
        abilities: ["Static", "Lightning Rod"],
        stats: {
          hp: 35,
          attack: 55,
          defense: 40,
          specialAttack: 50,
          specialDefense: 50,
          speed: 90,
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiDataFetcherService,
        {
          provide: PokemonDataAggregatorService,
          useValue: mockAggregatorService,
        },
      ],
    }).compile();

    service = module.get<ApiDataFetcherService>(ApiDataFetcherService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("fetchData", () => {
    it("should fetch pokemon data", async () => {
      const resourcesUsed: any[] = [];
      const result = await service.fetchData(["pokemon"], "Pikachu", resourcesUsed);

      expect(result).toBeDefined();
      expect(result.name).toBe("Pikachu");
      expect(result.id).toBe(25);
      expect(mockAggregatorService.getPokemonData).toHaveBeenCalledWith("Pikachu");
      expect(resourcesUsed.length).toBeGreaterThan(0);
    });

    it("should track response time in resourcesUsed", async () => {
      const resourcesUsed: any[] = [];
      await service.fetchData(["pokemon"], "Pikachu", resourcesUsed);

      expect(resourcesUsed.length).toBeGreaterThan(0);
      expect(resourcesUsed[0]).toHaveProperty("source");
      expect(resourcesUsed[0]).toHaveProperty("parameter");
      expect(resourcesUsed[0]).toHaveProperty("responseTime");
      expect(typeof resourcesUsed[0].responseTime).toBe("number");
    });

    it("should handle aggregator errors", async () => {
      mockAggregatorService.getPokemonData.mockRejectedValue(
        new Error("Pokemon not found")
      );

      const resourcesUsed: any[] = [];
      await expect(
        service.fetchData(["pokemon"], "Missingno", resourcesUsed)
      ).rejects.toThrow("Pokemon not found");
    });

    it("should handle empty endpoints", async () => {
      const resourcesUsed: any[] = [];
      const result = await service.fetchData([], "Pikachu", resourcesUsed);

      expect(result).toEqual({});
      expect(mockAggregatorService.getPokemonData).not.toHaveBeenCalled();
    });
  });
});
