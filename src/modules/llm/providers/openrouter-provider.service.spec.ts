import { Test, TestingModule } from "@nestjs/testing";
import { OpenRouterProvider } from "./openrouter-provider.service";
import { AppConfigService } from "../../../config/app-config.service";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("OpenRouterProvider", () => {
  let provider: OpenRouterProvider;
  let mockConfigService: any;

  beforeEach(async () => {
    mockConfigService = {
      getOpenRouterApiKey: jest.fn().mockReturnValue("test-api-key"),
      getOpenRouterApiUrl: jest.fn().mockReturnValue("https://openrouter.ai/api/v1"),
      getOpenRouterModel: jest
        .fn()
        .mockReturnValue("mistralai/mistral-7b-instruct:free"),
      getOpenRouterAppName: jest.fn().mockReturnValue("PokeBuddy"),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenRouterProvider,
        {
          provide: AppConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    provider = module.get<OpenRouterProvider>(OpenRouterProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(provider).toBeDefined();
  });

  describe("getProviderName", () => {
    it('should return "OpenRouter"', () => {
      expect(provider.getProviderName()).toBe("OpenRouter");
    });
  });

  describe("generate", () => {
    it("should generate text successfully", async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: "Generated text" } }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        },
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await provider.generate("Test prompt");

      expect(result.text).toBe("Generated text");
      expect(result.usage.promptTokens).toBe(10);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "https://openrouter.ai/api/v1/chat/completions",
        expect.objectContaining({
          model: "mistralai/mistral-7b-instruct:free",
          messages: [{ role: "user", content: "Test prompt" }],
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "PokeBuddy",
          }),
        })
      );
    });

    it("should throw error on 402 payment required", async () => {
      mockedAxios.post.mockRejectedValue({
        response: { status: 402, data: { error: { message: "Credits required" } } },
      });

      await expect(provider.generate("Test prompt")).rejects.toThrow(
        "OpenRouter requires credits"
      );
    });
  });

  describe("checkConnection", () => {
    it("should return true on successful connection", async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: "test" } }],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        },
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await provider.checkConnection();
      expect(result).toBe(true);
    });

    it("should return false on connection failure", async () => {
      mockedAxios.post.mockRejectedValue(new Error("Connection failed"));

      const result = await provider.checkConnection();
      expect(result).toBe(false);
    });
  });
});
