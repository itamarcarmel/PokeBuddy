import { Test, TestingModule } from '@nestjs/testing';
import { ChatSessionService } from './chat-session.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChatSession } from '../../../database/entities/chat-session.entity';
import { Conversation } from '../../../database/entities/conversation.entity';

describe('ChatSessionService', () => {
  let service: ChatSessionService;

  beforeEach(async () => {
    const mockSessionRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockReturnValue({ id: 1 }),
      save: jest.fn().mockResolvedValue({ id: 1, isActive: true }),
    };
    const mockConvRepo = { create: jest.fn(), save: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatSessionService,
        { provide: getRepositoryToken(ChatSession), useValue: mockSessionRepo },
        { provide: getRepositoryToken(Conversation), useValue: mockConvRepo },
      ],
    }).compile();
    service = module.get<ChatSessionService>(ChatSessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create session', async () => {
    const result = await service.createChatSession();
    expect(result).toBeDefined();
  });
});
