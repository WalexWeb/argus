import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { logger } from './middlewares/logger.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    cors: {
      credentials: true,
    },
  });

  app.setGlobalPrefix('api/v1');

  app.use(logger);

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
