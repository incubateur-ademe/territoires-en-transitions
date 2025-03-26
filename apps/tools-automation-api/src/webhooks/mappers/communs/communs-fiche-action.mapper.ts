import { CollectiviteNatureType } from '@/domain/collectivites';
import {
  FicheActionWithRelationsAndCollectiviteType,
  Statut,
} from '@/domain/plans/fiches';
import {
  ApplicationSousScopesEnum,
  WebhookPayloadFormatEnum,
} from '@/domain/utils';
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

  private readonly FICHE_STATUT_TO_PROJECT_PHASE_STATUT: Record<
    Statut,
    CreateProjetRequest['phaseStatut']
  > = {
    'A discuter': 'En cours',
    'En cours': 'En cours',
    'En pause': 'En pause',
    'En retard': 'En retard',
    Abandonné: 'Abandonné',
    Bloqué: 'Bloqué',
    Réalisé: 'Terminé',
    'À venir': 'En cours',
  };

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
    return {
      phase: data.statut ? 'Opération' : undefined,
      phaseStatut: data.statut
        ? this.FICHE_STATUT_TO_PROJECT_PHASE_STATUT[data.statut]
        : undefined,
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
