import { Module } from '@nestjs/common';
import { ImgbbService } from './imgbb.service';

@Module({
  providers: [ImgbbService],
  exports: [ImgbbService],
})
export class ImgbbModule {}
