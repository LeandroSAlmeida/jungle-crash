import { Module } from "@nestjs/common";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import mikroOrmConfig from "./infrastructure/persistence/mikro-orm.config";
import { WalletsModule } from "./wallets.module";

@Module({
  imports: [MikroOrmModule.forRoot(mikroOrmConfig), WalletsModule],
})
export class AppModule {}
