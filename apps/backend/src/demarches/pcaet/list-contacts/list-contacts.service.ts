import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { CollectiviteType } from '@tet/domain/collectivites';
import {
  isOrganismeReferentPcaet,
  PcaetPerimetreSaisineEnum,
  typesOrganismeReferentPcaet,
} from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { ReferentsPcaetRepository } from '../referents/referents-pcaet.repository';
import { PcaetInstructeursRepository } from '../shared/pcaet-instructeurs.repository';
import {
  ListContactsError,
  ListContactsErrorEnum,
} from './list-contacts.errors';
import { ListContactsInput } from './list-contacts.input';

export type OrganismeContacts = {
  organisme: { id: number; nom: string; type: CollectiviteType };
  contacts: { nom: string; email: string }[];
};

/**
 * Les interlocuteurs de la collectivité déposante : les référents désignés par
 * la DGEC dans chaque DREAL, conseil régional et DDT qui la couvre. Un organisme
 * sans référent reste listé, pour que la collectivité sache qu'il existe.
 */
@Injectable()
export class ListContactsService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly instructeursRepository: PcaetInstructeursRepository,
    private readonly referentsRepository: ReferentsPcaetRepository
  ) {}

  async listContacts(
    { collectiviteId }: ListContactsInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<OrganismeContacts[], ListContactsError>> {
    // Confidentiel et non `demarches.pcaet.read`, ouvert à tout compte
    // vérifié : les référents sont des agents de services à accès restreint.
    const permission = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['COLLECTIVITES.READ_CONFIDENTIEL'],
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );
    if (!permission.success) {
      return failure(ListContactsErrorEnum.UNAUTHORIZED);
    }

    const organismes = (
      await this.instructeursRepository.listInstructeursCouvrants(
        collectiviteId,
        tx
      )
    ).filter(({ type }) => isOrganismeReferentPcaet(type));

    const referents = await this.referentsRepository.listReferents(
      organismes.map(({ collectiviteId: id }) => id),
      tx
    );

    // Ceux du siège d'abord, ceux d'un périmètre secondaire ensuite.
    const rang = (organisme: (typeof organismes)[number]) =>
      typesOrganismeReferentPcaet.indexOf(organisme.type) * 2 +
      (organisme.perimetre === PcaetPerimetreSaisineEnum.PRINCIPAL ? 0 : 1);

    return success(
      [...organismes]
        .sort((a, b) => rang(a) - rang(b) || a.nom.localeCompare(b.nom))
        .map(({ collectiviteId: id, nom, type }) => ({
          organisme: { id, nom, type },
          contacts: referents
            .filter(({ organismeId }) => organismeId === id)
            .map(({ nom, email }) => ({ nom, email })),
        }))
    );
  }
}
