import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env.schema.js';
import { PrismaModule } from './shared/prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { ExampleItemModule } from './modules/example-item/example-item.module.js';
import { ExampleDomainModule } from './modules/example-domain/example-domain.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL') || 60,
          limit: config.get<number>('THROTTLE_LIMIT') || 120,
        },
      ],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ExampleItemModule,
    ExampleDomainModule,
  ],
})
export class AppModule {}
