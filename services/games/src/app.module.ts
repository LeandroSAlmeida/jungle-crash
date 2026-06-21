import { Module } from "@nestjs/common";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { EventEmitterModule } from "@nestjs/event-emitter";
import mikroOrmConfig from "./infrastructure/persistence/mikro-orm.config";
import { GamesModule } from "./games.module";

@Module({
  imports: [MikroOrmModule.forRoot(mikroOrmConfig), EventEmitterModule.forRoot(), GamesModule],
})
export class AppModule {}
