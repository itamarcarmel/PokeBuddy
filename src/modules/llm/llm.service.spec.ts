import { Test, TestingModule } from '@nestjs/testing';
import { LlmService } from './llm.service';
import { LlmProviderFactory } from './llm-provider.factory';

describe('LlmService', () => {
  let service: LlmService;

  beforeEach(async () => {
    const mockProvider = {
      generate: jest.fn().mockResolvedValue('Generated response'),
      checkConnection: jest.fn().mockResolvedValue(true),
      getProviderName: jest.fn().mockReturnValue('Groq'),
    };
    const mockFactory = { createProvider: jest.fn().mockReturnValue(mockProvider) };
    const module: TestingModule = await Test.createTestingModule({
      providers: [LlmService, { provide: LlmProviderFactory, useValue: mockFactory }],
    }).compile();
    service = module.get<LlmService>(LlmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate text', async () => {
    const result = await service.generate('Test');
    expect(result).toBe('Generated response');
  });
});
