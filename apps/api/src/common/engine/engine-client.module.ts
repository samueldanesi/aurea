import { Global, Module } from '@nestjs/common';
import { EngineClientService } from './engine-client.service';

@Global()
@Module({
  providers: [EngineClientService],
  exports: [EngineClientService],
})
export class EngineClientModule {}
