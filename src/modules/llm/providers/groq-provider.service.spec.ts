import { Test, TestingModule } from '@nestjs/testing';
import { GroqProvider } from './groq-provider.service';
import { AppConfigService } from '../../../config/app-config.service';

describe('GroqProvider', () => {
  let provider: GroqProvider;

  beforeEach(async () => {
    const mockConfig = {
      groqApiKey: 'test-key',
      groqApiUrl: 'https://api.groq.com/openai/v1',
      groqModel: 'llama-3.1-8b-instant',
      llm: {
        systemPrompt: 'You are a helpful assistant',
        temperature: 0.7,
        maxTokens: 1000,
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroqProvider, { provide: AppConfigService, useValue: mockConfig }],
    }).compile();
    provider = module.get<GroqProvider>(GroqProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should return provider name', () => {
    expect(provider.getProviderName()).toBe('Groq');
  });

  it('should check connection', async () => {
    const result = await provider.checkConnection();
    expect(typeof result).toBe('boolean');
  });
});
