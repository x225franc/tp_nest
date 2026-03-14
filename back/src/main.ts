import './config/env';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRequiredNumberEnv } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(getRequiredNumberEnv('PORT'));
}
bootstrap();
