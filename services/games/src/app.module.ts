import { Module } from "@nestjs/common";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import mikroOrmConfig from "./infrastructure/persistence/mikro-orm.config";
import { GamesModule } from "./games.module";

@Module({
  imports: [MikroOrmModule.forRoot(mikroOrmConfig), GamesModule],
})
export class AppModule {}
