import { AuthenticatedUser, dcpTable } from '@/backend/auth/index-domain';
import { DatabaseService } from '@/backend/utils';
import SupabaseService from '@/backend/utils/database/supabase.service';
import { TetError } from '@/backend/utils/tet-error.class';
import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import z from 'zod';

export const updateUserInputSchema = z
  .object({
    email: z.string(),
    telephone: z.string(),
    prenom: z.string(),
    nom: z.string(),
  })
  .partial();

@Injectable()
export class UpdateUserService {
  private logger = new Logger(UpdateUserService.name);
  private db = this.database.db;

  constructor(
    private readonly database: DatabaseService,
    private readonly supabase: SupabaseService
  ) {}

  async updateUser(
    { email, prenom, nom, telephone }: z.infer<typeof updateUserInputSchema>,
    user: AuthenticatedUser
  ) {
    if (email) {
      await this.updateUserEmail(email, user);
    }

    if (prenom || nom || telephone) {
      const userAttributes = {
        ...(prenom && { prenom }),
        ...(nom && { nom }),
        ...(telephone && { telephone }),
      };

      this.logger.log(
        `Updating user ${user.id} with attributes: ${JSON.stringify(
          userAttributes
        )}`
      );

      await this.db
        .update(dcpTable)
        .set(userAttributes)
        .where(eq(dcpTable.userId, user.id));
    }
  }

  private async updateUserEmail(email: string, user: AuthenticatedUser) {
    const existingUserWithSameEmail = await this.db
      .select()
      .from(dcpTable)
      .where(eq(dcpTable.email, email))
      .limit(1);

    if (existingUserWithSameEmail.length > 0) {
      const existingUser = existingUserWithSameEmail[0];

      if (existingUser.userId !== user.id) {
        throw new EmailAlreadyUsedError();
      }

      // si l'utilisateur existe déjà avec le même email, on ne fait rien
      return;
    }

    const supabaseClient = this.supabase.getServiceRoleClient();
    const { error } = await supabaseClient.auth.admin.updateUserById(user.id, {
      email,
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}

export class EmailAlreadyUsedError extends TetError {
  constructor() {
    super(`Cet email est déjà utilisé par un autre utilisateur`);
  }
}
