import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import { z } from 'zod';
import { SUPER_ADMIN_REQUIRED_MESSAGE } from '../shared/collectivite-access.service';
import { FindUserRepository, FoundUser } from './find-user.repository';

export const findUserInputSchema = z.object({
  email: z
    .string()
    .email()
    .describe("Adresse e-mail de l'utilisateur (insensible à la casse)"),
});
export type FindUserInput = z.infer<typeof findUserInputSchema>;

export const findUserOutputSchema = z.object({
  prenom: z.string(),
  nom: z.string(),
  compteActif: z.boolean(),
  cguAccepteesLe: z.string().nullable(),
  collectivites: z.array(
    z.object({
      collectiviteId: z.number(),
      nom: z.string(),
      type: z.string(),
      niveauAcces: z.string(),
      fonction: z.string().nullable(),
      estReferent: z.boolean(),
    })
  ),
  collectivitesMasquees: z
    .number()
    .describe("Collectivités de l'utilisateur que l'appelant ne peut pas lire"),
});
export type FindUserOutput = z.infer<typeof findUserOutputSchema>;

export type ReadableUser = {
  user: FoundUser;
  readable: FoundUser['collectivites'];
};

/**
 * Un utilisateur est lisible si l'appelant peut lire les membres d'au moins
 * une de ses collectivités ; seules celles-là sont renvoyées. Jamais d'e-mail,
 * de téléphone ni d'identifiant interne en sortie.
 */
@Injectable()
export class FindUserService {
  private readonly logger = new Logger(FindUserService.name);

  constructor(
    private readonly findUserRepository: FindUserRepository,
    private readonly permissionService: PermissionService
  ) {}

  async run(
    input: FindUserInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<FindUserOutput, 'NOT_FOUND' | 'UNAUTHORIZED'>> {
    const found = await this.findReadable(input.email, { user });
    if (!found.success) {
      return found;
    }
    const { user: target, readable } = found.data;
    return success({
      prenom: target.prenom,
      nom: target.nom,
      compteActif: target.compteActif,
      cguAccepteesLe: target.cguAccepteesLe,
      collectivites: readable,
      collectivitesMasquees: target.collectivites.length - readable.length,
    });
  }

  /** Partagé avec `list_recent_events` : même règle d'accès à une personne. */
  async findReadable(
    email: string,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<ReadableUser, 'NOT_FOUND' | 'UNAUTHORIZED'>> {
    const target = await this.findUserRepository.findByEmail(email);
    if (!target) {
      return failure(
        'NOT_FOUND',
        new Error('Aucun utilisateur avec cet e-mail')
      );
    }

    const readable: FoundUser['collectivites'] = [];
    for (const collectivite of target.collectivites) {
      const allowed = await this.permissionService.isAllowed(
        user,
        'collectivites.membres.read',
        ResourceType.COLLECTIVITE,
        { collectiviteId: collectivite.collectiviteId }
      );
      if (allowed.success) {
        readable.push(collectivite);
      }
    }

    const isPlatformAllowed =
      target.collectivites.length === 0 &&
      (
        await this.permissionService.isAllowed(
          user,
          'collectivites.mutate',
          ResourceType.PLATEFORME,
          null
        )
      ).success;

    if (readable.length === 0 && !isPlatformAllowed) {
      this.logger.warn('find_user refused: no readable collectivite');
      return failure('UNAUTHORIZED', new Error(SUPER_ADMIN_REQUIRED_MESSAGE));
    }
    return success({ user: target, readable });
  }
}
