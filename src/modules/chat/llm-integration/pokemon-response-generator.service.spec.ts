import { Test, TestingModule } from "@nestjs/testing";
import { PokemonResponseGeneratorService } from "./pokemon-response-generator.service";
import { LlmService } from "../../../llm/llm.service";

describe("PokemonResponseGeneratorService", () => {
  let service: PokemonResponseGeneratorService;
  let mockLlmService: any;

  beforeEach(async () => {
    mockLlmService = {
      generate: jest.fn().mockResolvedValue("Generated Pokemon response"),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PokemonResponseGeneratorService,
        {
          provide: LlmService,
          useValue: mockLlmService,
        },
      ],
    }).compile();

    service = module.get<PokemonResponseGeneratorService>(
      PokemonResponseGeneratorService
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("generateResponse", () => {
    it("should generate response with pokemon data", async () => {
      const userMessage = "Tell me about Pikachu";
      const pokemonData = {
        name: "Pikachu",
        type: ["Electric"],
        abilities: ["Static", "Lightning Rod"],
      };

      const result = await service.generateResponse(userMessage, pokemonData);

      expect(result).toBe("Generated Pokemon response");
      expect(mockLlmService.generate).toHaveBeenCalled();
      const callArgs = mockLlmService.generate.mock.calls[0];
      expect(callArgs[0]).toContain("Pikachu");
      expect(callArgs[0]).toContain("Electric");
    });

    it("should handle empty pokemon data", async () => {
      const result = await service.generateResponse("Tell me about Missingno", {});

      expect(result).toBe("Generated Pokemon response");
      expect(mockLlmService.generate).toHaveBeenCalled();
    });

    it("should handle LLM errors", async () => {
      mockLlmService.generate.mockRejectedValue(new Error("Generation failed"));

      await expect(service.generateResponse("Test", {})).rejects.toThrow(
        "Generation failed"
      );
    });
  });
});
