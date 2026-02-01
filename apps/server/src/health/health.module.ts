import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";

import { StorageModule } from "../storage/storage.module";
import { DatabaseHealthIndicator } from "./database.health";
import { HealthController } from "./health.controller";
import { StorageHealthIndicator } from "./storage.health";

@Module({
  imports: [TerminusModule, StorageModule],
  controllers: [HealthController],
  providers: [DatabaseHealthIndicator, StorageHealthIndicator],
})
export class HealthModule {}
