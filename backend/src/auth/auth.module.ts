import { ApikeysController } from '@/backend/auth/apikeys/apikeys.controller';
import { ApikeysRouter } from '@/backend/auth/apikeys/apikeys.router';
import { ApikeysService } from '@/backend/auth/apikeys/apikeys.service';
import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import { RoleUpdateService } from '@/backend/auth/authorizations/roles/role-update.service';
import { RoleService } from '@/backend/auth/authorizations/roles/role.service';
import { UsersController } from '@/backend/auth/users/users.controller';
import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { ConvertJwtToAuthUserService } from './convert-jwt-to-auth-user.service';
import { AuthGuard } from './guards/auth.guard';
import { UsersRouter } from './users/users.router';
import { UsersService } from './users/users.service';

@Global()
@Module({
  imports: [
    NestjsFormDataModule,
    JwtModule.register({
      global: true,
      secret: process.env.SUPABASE_JWT_SECRET,
      signOptions: {
        expiresIn: '6h',
      },
    }),
    CollectivitesModule,
  ],
  controllers: [ApikeysController, UsersController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    PermissionService,
    RoleService,
    RoleUpdateService,
    UsersService,
    UsersRouter,
    ConvertJwtToAuthUserService,
    ApikeysService,
    ApikeysRouter,
  ],
  exports: [
    PermissionService,
    RoleUpdateService,
    UsersService,
    UsersRouter,
    ConvertJwtToAuthUserService,
    ApikeysRouter,
  ],
})
export class AuthModule {}
