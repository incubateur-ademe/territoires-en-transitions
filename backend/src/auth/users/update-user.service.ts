import { AuthenticatedUser, dcpTable } from '@/backend/auth/index-domain';
import { DatabaseService } from '@/backend/utils';
import SupabaseService from '@/backend/utils/database/supabase.service';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import z from 'zod';

export const updateUserInputSchema = z
  .object({
    email: z.string(),
    phone: z.string(),
    firstName: z.string(),
    lastName: z.string(),
  })
  .partial();

@Injectable()
export class UpdateUserService {
  private db = this.database.db;

  constructor(
    private readonly database: DatabaseService,
    private readonly supabase: SupabaseService
  ) {}

  async updateUser(
    {
      email,
      firstName,
      lastName,
      phone,
    }: z.infer<typeof updateUserInputSchema>,
    user: AuthenticatedUser
  ) {
    if (email) {
      const userAttributes = {
        ...(email && { email }),
      };

      const { error } = await this.supabase
        .getClient(user)
        .auth.updateUser(userAttributes);

      if (error) {
        throw new Error(error.message);
      }
    }

    if (firstName || lastName || phone) {
      const userAttributes = {
        ...(firstName && { prenom: firstName }),
        ...(lastName && { nom: lastName }),
        ...(phone && { telephone: phone }),
      };

      await this.db
        .update(dcpTable)
        .set(userAttributes)
        .where(eq(dcpTable.userId, user.id));
    }
  }
}
