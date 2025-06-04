import { ApikeysController } from '@/backend/users/apikeys/apikeys.controller';
import { ApikeysRouter } from '@/backend/users/apikeys/apikeys.router';
import { ApikeysService } from '@/backend/users/apikeys/apikeys.service';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { RoleUpdateService } from '@/backend/users/authorizations/roles/role-update.service';
import { RoleService } from '@/backend/users/authorizations/roles/role.service';
import { InvitationRouter } from '@/backend/users/invitations/invitation.router';
import { InvitationService } from '@/backend/users/invitations/invitation.service';
import { UsersController } from '@/backend/users/users/users.controller';
import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { ConvertJwtToAuthUserService } from './convert-jwt-to-auth-user.service';
import { AuthGuard } from './guards/auth.guard';
import { UsersRouter } from './users.router';
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
    InvitationService,
    InvitationRouter,
  ],
  exports: [
    PermissionService,
    RoleUpdateService,
    UsersService,
    UsersRouter,
    ConvertJwtToAuthUserService,
  ],
})
export class AuthModule {}
