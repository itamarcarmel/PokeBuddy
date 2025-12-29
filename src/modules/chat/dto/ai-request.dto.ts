import { IsNumber, IsOptional, IsString } from "class-validator";

export class TeamAnalysisDto {
  @IsNumber()
  teamId: number;

  @IsOptional()
  @IsString()
  additionalContext?: string;
}

export class BattleStrategyDto {
  @IsNumber()
  teamId: number;

  @IsString()
  opponentType: string;

  @IsOptional()
  @IsString()
  additionalContext?: string;
}

export class PokemonRecommendationDto {
  @IsNumber()
  userId: number;

  @IsOptional()
  @IsNumber()
  teamId?: number;

  @IsString()
  request: string;
}
