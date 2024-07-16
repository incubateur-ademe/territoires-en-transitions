import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const port = process.env.PORT || 8080;
console.log(`Launching NestJS app on port ${port}`);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(port);
}
bootstrap();
