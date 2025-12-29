import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { ChatOrchestrationService } from './core/chat-orchestration.service';
import { ChatSessionService } from './session/chat-session.service';
import { ConversationManagerService } from './conversation/conversation-manager.service';
import { DataSource } from 'typeorm';

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(async () => {
    const mockOrch = {
      processChat: jest.fn().mockResolvedValue({ message: 'Test', pokemonData: null, resourcesUsed: [], timestamp: new Date() }),
    };
    const mockSession = {
      getChatSession: jest.fn().mockResolvedValue({ id: 1, isActive: true }),
    };
    const mockConv = {
      getContext: jest.fn().mockReturnValue([]),
      getRecentMessages: jest.fn().mockResolvedValue([]),
      addMessage: jest.fn(),
    };
    const mockEntityManager = {
      increment: jest.fn().mockResolvedValue(undefined),
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue({}),
    };
    const mockDataSource = {
      transaction: jest.fn((callback) => callback(mockEntityManager)),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: ChatOrchestrationService, useValue: mockOrch },
        { provide: ChatSessionService, useValue: mockSession },
        { provide: ConversationManagerService, useValue: mockConv },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();
    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process chat', async () => {
    const result = await service.chat({ chatSessionId: 1, message: 'Test' });
    expect(result).toBeDefined();
    expect(result.message).toBe('Test');
  });
});
