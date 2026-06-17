import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      service: 'erp-club-backend',
      transport: 'http + tcp microservice',
      status: 'ok',
    };
  }
}
