import { Test, TestingModule } from '@nestjs/testing';
import { MessageIntentClassifierService } from './message-intent-classifier.service';
import { LlmService } from '../../llm/llm.service';

describe('MessageIntentClassifierService', () => {
  let service: MessageIntentClassifierService;

  beforeEach(async () => {
    const mockLlm = {
      generate: jest.fn().mockResolvedValue(JSON.stringify({
        isPokemonRelated: true,
        isBattleSimulation: false,
        endpoints: ['pokemon'],
        confidence: 0.95,
      })),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessageIntentClassifierService, { provide: LlmService, useValue: mockLlm }],
    }).compile();
    service = module.get<MessageIntentClassifierService>(MessageIntentClassifierService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should classify message', async () => {
    const result = await service.classifyMessage('Pikachu');
    expect(result.isPokemonRelated).toBe(true);
  });
});
