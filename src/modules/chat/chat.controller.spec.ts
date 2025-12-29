import { Test, TestingModule } from "@nestjs/testing";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { SendMessageDto } from "./dto/chat.dto";

describe("ChatController", () => {
  let controller: ChatController;
  let mockChatService: any;

  beforeEach(async () => {
    mockChatService = {
      processMessage: jest.fn().mockResolvedValue({
        message: "Test response",
        pokemonData: null,
        resourcesUsed: [],
        timestamp: new Date(),
        debug: undefined,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: mockChatService,
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("sendMessage", () => {
    it("should process message and return response", async () => {
      const dto: SendMessageDto = {
        message: "Tell me about Pikachu",
        sessionId: "test-session",
      };

      const result = await controller.sendMessage(dto);

      expect(result).toBeDefined();
      expect(result.message).toBe("Test response");
      expect(mockChatService.processMessage).toHaveBeenCalledWith(
        dto.message,
        dto.sessionId,
        undefined
      );
    });

    it("should handle debug mode", async () => {
      const dto: SendMessageDto = {
        message: "Tell me about Pikachu",
        sessionId: "test-session",
        debug: true,
      };

      await controller.sendMessage(dto);

      expect(mockChatService.processMessage).toHaveBeenCalledWith(
        dto.message,
        dto.sessionId,
        true
      );
    });

    it("should handle errors from service", async () => {
      mockChatService.processMessage.mockRejectedValue(new Error("Service error"));

      const dto: SendMessageDto = {
        message: "Test",
        sessionId: "test-session",
      };

      await expect(controller.sendMessage(dto)).rejects.toThrow("Service error");
    });
  });
});
