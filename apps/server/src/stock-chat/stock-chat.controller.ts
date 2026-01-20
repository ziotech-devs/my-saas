import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { AnalyzeStockDto, AnalyzeStockResponseDto } from "./dto/analyze-stock.dto";
import { StockChatService } from "./stock-chat.service";

@ApiTags("Stock Chat")
@Controller("stock-chat")
export class StockChatController {
  constructor(private readonly stockChatService: StockChatService) {}

  @Get("/data")
  getStockData() {
    return this.stockChatService.getStockData();
  }

  @Post("/analyze")
  @HttpCode(HttpStatus.OK)
  async analyzeStock(@Body() dto: AnalyzeStockDto): Promise<AnalyzeStockResponseDto> {
    const result = await this.stockChatService.invokeGraph(dto.query);
    return result;
  }
}
