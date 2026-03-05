import { Module } from "@nestjs/common";
import { JobsService } from "./jobs.service";

@Module({
  providers: [JobsService],
})
export class JobsModule {}