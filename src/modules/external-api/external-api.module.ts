import { Module } from "@nestjs/common";
import { PokeApiKnowledgeSource } from "./pokeapi-knowledge-source.service";
import { PokedexApiKnowledgeSource } from "./pokedexapi-knowledge-source.service";

@Module({
  providers: [PokeApiKnowledgeSource, PokedexApiKnowledgeSource],
  exports: [PokeApiKnowledgeSource, PokedexApiKnowledgeSource],
})
export class ExternalApiModule {}
