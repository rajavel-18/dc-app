import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from './database/drizzle.module';
import { CampaignsModule } from './src/campaigns/campaigns.module';
import { JwtModule } from '@nestjs/jwt';
import * as dotenv from "dotenv";
dotenv.config();

JwtModule.register({
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
})


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DrizzleModule,
    CampaignsModule,
  ],
})
export class AppModule {}
