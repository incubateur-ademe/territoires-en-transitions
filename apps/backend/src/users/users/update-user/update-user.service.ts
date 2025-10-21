import { DatabaseService } from '@/backend/utils/database/database.service';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import z from 'zod';
import { AuthenticatedUser } from '../../models/auth.models';
import { dcpTable } from '../../models/dcp.table';

export const updateUserInputSchema = z
  .object({
    telephone: z.string(),
    prenom: z.string(),
    nom: z.string(),
  })
  .partial();

@Injectable()
export class UpdateUserService {
  private db = this.database.db;

  constructor(private readonly database: DatabaseService) {}

  async updateUser(
    { prenom, nom, telephone }: z.infer<typeof updateUserInputSchema>,
    user: AuthenticatedUser
  ) {
    if (prenom || nom || telephone) {
      const userAttributes = {
        ...(prenom && { prenom }),
        ...(nom && { nom }),
        ...(telephone && { telephone }),
      };

      await this.db
        .update(dcpTable)
        .set(userAttributes)
        .where(eq(dcpTable.userId, user.id));
    }
  }
}
