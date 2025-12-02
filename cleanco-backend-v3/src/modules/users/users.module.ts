import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { MsgOwlModule } from '../../integrations/msgowl/msgowl.module';

@Module({
  imports: [PrismaModule, MsgOwlModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
