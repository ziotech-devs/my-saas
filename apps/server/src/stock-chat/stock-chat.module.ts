import { Module } from "@nestjs/common";

import { StockChatController } from "./stock-chat.controller";
import { StockChatService } from "./stock-chat.service";

@Module({
  providers: [StockChatService],
  controllers: [StockChatController],
  exports: [StockChatService],
})
export class StockChatModule {}
