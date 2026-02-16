import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { eq } from 'drizzle-orm';
import z from 'zod';
import { AuthenticatedUser } from '../../models/auth.models';
import { dcpTable } from '../../models/dcp.table';

export const updateUserInputSchema = z
  .object({
    telephone: z.string(),
    prenom: z.string(),
    nom: z.string(),
    hasAcceptedCGU: z.boolean(),
  })
  .partial();

@Injectable()
export class UpdateUserService {
  private db = this.database.db;

  constructor(private readonly database: DatabaseService) {}

  async updateUser(
    {
      prenom,
      nom,
      telephone,
      hasAcceptedCGU,
    }: z.infer<typeof updateUserInputSchema>,
    user: AuthenticatedUser
  ) {
    const userAttributes: Partial<{
      prenom: string;
      nom: string;
      telephone: string;
      cguAccepteesLe: string;
    }> = {
      ...(prenom !== undefined && { prenom }),
      ...(nom !== undefined && { nom }),
      ...(telephone !== undefined && { telephone }),
      ...(hasAcceptedCGU ? { cguAccepteesLe: new Date().toISOString() } : {}),
    };

    if (Object.keys(userAttributes).length > 0) {
      await this.db
        .update(dcpTable)
        .set(userAttributes)
        .where(eq(dcpTable.id, user.id));
    }
  }
}
