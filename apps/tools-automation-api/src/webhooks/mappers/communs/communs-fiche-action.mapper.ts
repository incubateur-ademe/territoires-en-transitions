import { CollectiviteNatureType } from '@/backend/collectivites/index-domain';
import { FicheActionWithRelationsAndCollectiviteType } from '@/backend/plans/fiches/shared/models/fiche-action-with-relations.dto';
import { ApplicationSousScopesEnum } from '@/backend/utils/application-domains.enum';
import { WebhookPayloadFormatEnum } from '@/backend/utils/index-domain';
import { AbstractEntityMapper } from '@/tools-automation-api/webhooks/mappers/AbstractEntityMapper';
import { Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { CreateProjetRequest } from './client/types.gen';

type CompetenceType = NonNullable<CreateProjetRequest['competences']>[number];

export class CommunsFicheActionMapper extends AbstractEntityMapper<
  FicheActionWithRelationsAndCollectiviteType,
  CreateProjetRequest
> {
  private readonly logger = new Logger(CommunsFicheActionMapper.name);

  private readonly SUPPORTED_EPCI_NATURE: CollectiviteNatureType[] = [
    'METRO',
    'CU',
    'CA',
    'CC',
  ];

  constructor() {
    super(ApplicationSousScopesEnum.FICHES, WebhookPayloadFormatEnum.COMMUNS);
  }

  getCompetenceFromThematique(thematique: {
    id: number;
    nom: string;
  }): CompetenceType | null {
    // TODO

    return null;
  }

  getPhaseAndStatut(data: FicheActionWithRelationsAndCollectiviteType): {
    phase: CreateProjetRequest['phase'] | undefined;
    phaseStatut: CreateProjetRequest['phaseStatut'] | undefined;
  } {
    let phaseStatut: CreateProjetRequest['phaseStatut'] | undefined = undefined;
    switch (data.statut) {
      case 'A discuter':
        phaseStatut = 'En cours';
        break;
      case 'En cours':
        phaseStatut = 'En cours';
        break;
      case 'En pause':
        phaseStatut = 'En pause';
        break;
      case 'En retard':
        phaseStatut = 'En retard';
        break;
      case 'Abandonné':
        phaseStatut = 'Abandonné';
        break;
      case 'Bloqué':
        phaseStatut = 'Bloqué';
        break;
      case 'Réalisé':
        phaseStatut = 'Terminé';
        break;
      case 'À venir':
        phaseStatut = 'En cours';
        break;
      default:
        phaseStatut = undefined;
    }

    return {
      phase: data.statut ? 'Opération' : undefined,
      phaseStatut,
    };
  }

  map(
    data: FicheActionWithRelationsAndCollectiviteType
  ): CreateProjetRequest | null {
    let bugetPrevisionnel = data.budgetPrevisionnel
      ? parseFloat(data.budgetPrevisionnel)
      : null;
    if (bugetPrevisionnel && isNaN(bugetPrevisionnel)) {
      bugetPrevisionnel = null;
    }

    if (
      data.collectivite?.type === 'commune' ||
      (data.collectivite?.type === 'epci' &&
        data.collectivite.natureInsee &&
        this.SUPPORTED_EPCI_NATURE.includes(data.collectivite.natureInsee))
    ) {
      // Implement the mapping logic here
      const createProjectRequest: CreateProjetRequest = {
        nom: data.titre || '',
        externalId: `${data.id}`,
        description: data.description || '',
        collectivites: [
          {
            type: data.collectivite.type === 'commune' ? 'Commune' : 'EPCI',
            code:
              (data.collectivite.type === 'commune'
                ? data.collectivite.communeCode
                : data.collectivite.siren) || '',
          },
        ],
        budgetPrevisionnel: bugetPrevisionnel,
        dateDebutPrevisionnelle: data.dateDebut
          ? DateTime.fromISO(data.dateDebut.replace(' ', 'T')).toISO()
          : null,
        ...this.getPhaseAndStatut(data),
      };

      if (data.referents?.length) {
        // Take the first one. Enough for now.
        createProjectRequest.porteur = {
          referentNom: data.referents[0].nom,
          referentPrenom: data.referents[0].prenom,
          referentTelephone: data.referents[0].telephone,
          referentEmail: data.referents[0].email,
        };
      }

      if (data.thematiques) {
        createProjectRequest.competences = data.thematiques
          .map((thematique) => this.getCompetenceFromThematique(thematique))
          .filter((theme) => theme) as CompetenceType[];
      }

      return createProjectRequest;
    } else {
      this.logger.log(
        `Ignoring FicheAction with id ${data.id}: type ${data.collectivite?.type} with nature ${data.collectivite?.natureInsee} not supported`
      );

      return null;
    }
  }
}
