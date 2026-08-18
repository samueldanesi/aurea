import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmbedService } from './embed.service';
import { EmbedController } from './embed.controller';

@Module({
  imports: [AuthModule],
  providers: [EmbedService],
  controllers: [EmbedController],
})
export class EmbedModule {}
