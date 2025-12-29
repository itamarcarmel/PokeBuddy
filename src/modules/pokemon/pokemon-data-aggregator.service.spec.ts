import { Test, TestingModule } from '@nestjs/testing';
import { PokemonDataAggregatorService } from './pokemon-data-aggregator.service';
import { PokeApiKnowledgeSource } from '../external-api/pokeapi-knowledge-source.service';
import { PokedexApiKnowledgeSource } from '../external-api/pokedexapi-knowledge-source.service';

describe('PokemonDataAggregatorService', () => {
  let service: PokemonDataAggregatorService;

  beforeEach(async () => {
    const mockPokeApi = {
      fetchPokemonData: jest.fn().mockResolvedValue({ name: 'Pikachu', id: 25 }),
      getSourceName: jest.fn().mockReturnValue('PokeAPI'),
      getWeight: jest.fn().mockReturnValue(1.0),
    };
    const mockPokedexApi = {
      fetchPokemonData: jest.fn().mockResolvedValue({ name: 'Pikachu', id: 25 }),
      getSourceName: jest.fn().mockReturnValue('PokedexAPI'),
      getWeight: jest.fn().mockReturnValue(0.8),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PokemonDataAggregatorService,
        { provide: PokeApiKnowledgeSource, useValue: mockPokeApi },
        { provide: PokedexApiKnowledgeSource, useValue: mockPokedexApi },
      ],
    }).compile();
    service = module.get<PokemonDataAggregatorService>(PokemonDataAggregatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get pokemon', async () => {
    const result = await service.getPokemon('Pikachu');
    expect(result).toBeDefined();
  });
});
