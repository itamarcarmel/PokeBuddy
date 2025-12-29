import { Module, Global } from "@nestjs/common";

/**
 * Common module for shared utilities
 */
@Global()
@Module({
  providers: [],
  exports: [],
})
export class CommonModule {}
