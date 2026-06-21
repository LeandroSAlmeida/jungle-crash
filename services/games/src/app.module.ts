import { Module } from "@nestjs/common";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { RabbitMQModule } from "@golevelup/nestjs-rabbitmq";
import { BETTING_EXCHANGE } from "@crash/contracts";
import mikroOrmConfig from "./infrastructure/persistence/mikro-orm.config";
import { GamesModule } from "./games.module";

@Module({
  imports: [
    MikroOrmModule.forRoot(mikroOrmConfig),
    RabbitMQModule.forRoot({
      exchanges: [{ name: BETTING_EXCHANGE, type: "topic" }],
      uri: process.env.RABBITMQ_URL ?? "",
    }),
    GamesModule,
  ],
})
export class AppModule {}
