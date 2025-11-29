import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return { message: 'SenoPost API is running', version: '1.0.0' };
  }
}
