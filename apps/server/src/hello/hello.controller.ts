import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("Hello")
@Controller("hello")
export class HelloController {
  @Get()
  @ApiOkResponse({ description: "Returns hello world message" })
  getHello(): string {
    return "hello world";
  }
}
