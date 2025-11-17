import { CollectiviteNatureType } from '@/backend/collectivites/shared/models/collectivite-banatic-type.table';
import { FicheWithRelationsAndCollectivite, Statut } from '@/domain/plans';
import {
  ApplicationSousScopesEnum,
  WebhookPayloadFormatEnum,
} from '@/domain/utils';
import { Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { AbstractEntityMapper } from '../AbstractEntityMapper';
import { CreateProjetRequest } from './client/types.gen';

type CompetenceType = NonNullable<CreateProjetRequest['competences']>[number];

export class CommunsFicheActionMapper extends AbstractEntityMapper<
  FicheWithRelationsAndCollectivite,
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

  getCompetenceFromThematique(_thematique: {
    id: number;
    nom: string;
  }): CompetenceType | null {
    // TODO

    return null;
  }

  getPhaseAndStatut(data: FicheWithRelationsAndCollectivite): {
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

  map(data: FicheWithRelationsAndCollectivite): CreateProjetRequest | null {
    if (data.restreint) {
      this.logger.log(`Do not send restricted fiche action ${data.id}`);
      return null;
    }

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
        nom: data.titre || 'Sans titre', // TODO: to be checked, otherwise do not send it
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
