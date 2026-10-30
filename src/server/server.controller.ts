import { Controller, Get } from '@nestjs/common';

@Controller('server')
export class ServerController {

    @Get('start')
    async startServer() {
        return await { message: 'Server is stared!' }
    }
}
