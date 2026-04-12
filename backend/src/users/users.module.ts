import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [SupabaseModule, SubscriptionModule, ConfigModule],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule { }
