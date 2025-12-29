import { IsString, IsOptional, IsNumber, Min } from "class-validator";

export class SearchPokemonDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  id?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}

export class GetPokemonDto {
  @IsString()
  idOrName: string;
}
