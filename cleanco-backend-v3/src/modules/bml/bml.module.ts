import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BmlService } from './bml.service';

@Module({
  imports: [ConfigModule],
  providers: [BmlService],
  exports: [BmlService],
})
export class BmlModule {}
