import { Module } from '@nestjs/common';
import { MsgOwlService } from './msgowl.service';

@Module({
  providers: [MsgOwlService],
  exports: [MsgOwlService],
})
export class MsgOwlModule {}
