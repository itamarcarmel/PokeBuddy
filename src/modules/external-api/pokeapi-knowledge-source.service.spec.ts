import { Test, TestingModule } from '@nestjs/testing';
import { PokeApiKnowledgeSource } from './pokeapi-knowledge-source.service';
import { AppConfigService } from '../../config/app-config.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PokeApiKnowledgeSource', () => {
  let service: PokeApiKnowledgeSource;

  beforeEach(async () => {
    const mockConfig = {
      api: { timeout: 10000 },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PokeApiKnowledgeSource,
        { provide: AppConfigService, useValue: mockConfig },
      ],
    }).compile();
    service = module.get<PokeApiKnowledgeSource>(PokeApiKnowledgeSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fetch pokemon data', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        id: 25,
        name: 'pikachu',
        types: [{ type: { name: 'electric' } }],
        abilities: [{ ability: { name: 'static' } }],
        stats: [
          { stat: { name: 'hp' }, base_stat: 35 },
          { stat: { name: 'attack' }, base_stat: 55 },
          { stat: { name: 'defense' }, base_stat: 40 },
          { stat: { name: 'special-attack' }, base_stat: 50 },
          { stat: { name: 'special-defense' }, base_stat: 50 },
          { stat: { name: 'speed' }, base_stat: 90 },
        ],
        height: 4,
        weight: 60,
      },
    });
    const result = await service.getPokemon('pikachu');
    expect(result).toBeDefined();
  });
});
