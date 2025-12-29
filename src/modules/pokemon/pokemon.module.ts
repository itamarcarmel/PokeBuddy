import { Module } from "@nestjs/common";
import { PokemonDataAggregatorService } from "./pokemon-data-aggregator.service";
import { ExternalApiModule } from "../external-api/external-api.module";

@Module({
  imports: [ExternalApiModule],
  controllers: [],
  providers: [PokemonDataAggregatorService],
  exports: [PokemonDataAggregatorService],
})
export class PokemonModule {}
