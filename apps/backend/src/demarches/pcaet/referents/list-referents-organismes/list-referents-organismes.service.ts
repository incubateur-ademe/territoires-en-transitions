import { Injectable } from '@nestjs/common';
import { CollectiviteContactsRepository } from '@tet/backend/demarches/pcaet/shared/collectivite-contacts.repository';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { PcaetReferent } from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { ReferentsPcaetPermissionsService } from '../referents-pcaet-permissions.service';
import {
  ReferentsPcaetError,
  ReferentsPcaetErrorEnum,
} from '../referents-pcaet.errors';
import {
  OrganismeReferentPcaet,
  ReferentsPcaetRepository,
} from '../referents-pcaet.repository';
import { ListReferentsOrganismesInput } from './list-referents-organismes.input';

export type OrganismeAvecReferents = {
  organisme: OrganismeReferentPcaet;
  referents: PcaetReferent[];
  /** Les membres qu'on peut encore désigner : les référents en sont exclus. */
  membres: { userId: string; nom: string; email: string }[];
};

@Injectable()
export class ListReferentsOrganismesService {
  constructor(
    private readonly permissionsService: ReferentsPcaetPermissionsService,
    private readonly referentsRepository: ReferentsPcaetRepository,
    private readonly contactsRepository: CollectiviteContactsRepository
  ) {}

  async listOrganismes(
    { collectiviteId, regionCode }: ListReferentsOrganismesInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<OrganismeAvecReferents[], ReferentsPcaetError>> {
    const { canRead } = await this.permissionsService.getAccess(
      collectiviteId,
      { user, tx }
    );
    if (!canRead) {
      return failure(ReferentsPcaetErrorEnum.UNAUTHORIZED);
    }

    const organismes = await this.referentsRepository.listOrganismesDeLaRegion(
      regionCode,
      tx
    );
    const organismeIds = organismes.map(({ id }) => id);
    const [referents, membres] = await Promise.all([
      this.referentsRepository.listReferents(organismeIds, tx),
      this.contactsRepository.listContactsParCollectivite(
        organismeIds,
        { roles: Object.values(CollectiviteRole) },
        tx
      ),
    ]);

    return success(
      organismes.map((organisme) => {
        const referentsOrganisme = referents.filter(
          (referent) => referent.organismeId === organisme.id
        );
        const dejaReferents = new Set(
          referentsOrganisme.map(({ userId }) => userId)
        );
        return {
          organisme,
          referents: referentsOrganisme,
          membres: (membres.get(organisme.id) ?? [])
            .filter(({ userId }) => !dejaReferents.has(userId))
            .map(({ userId, prenom, nom, email }) => ({
              userId,
              nom: `${prenom} ${nom}`.trim(),
              email,
            })),
        };
      })
    );
  }
}
