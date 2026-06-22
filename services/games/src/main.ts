import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { MikroORM } from "@mikro-orm/core";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: (process.env.CORS_ORIGIN ?? "").split(",").filter(Boolean) });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Crash Game — Games API")
    .setDescription("Ciclo de vida de rodadas, apostas e provably fair")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, swaggerConfig));

  const orm = app.get(MikroORM);
  await orm.getMigrator().up();

  const port = process.env.PORT;
  await app.listen(port, "0.0.0.0");
  console.log(`Games service running on port ${port}`);
}

bootstrap();
