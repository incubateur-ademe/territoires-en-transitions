import { Logger } from '@nestjs/common';
import { CollectiviteNatureType } from '@tet/backend/collectivites/shared/models/collectivite-banatic-type.table';
import { FicheWithRelationsAndCollectivite, Statut } from '@tet/domain/plans';
import {
  ApplicationSousScopesEnum,
  WebhookPayloadFormatEnum,
} from '@tet/domain/utils';
import { DateTime } from 'luxon';
import { AbstractEntityMapper } from '../AbstractEntityMapper';
import { CreateFicheActionRequest } from './client/types.gen';

export class CommunsFicheActionMapper extends AbstractEntityMapper<
  FicheWithRelationsAndCollectivite,
  CreateFicheActionRequest
> {
  private readonly logger = new Logger(CommunsFicheActionMapper.name);

  private readonly SUPPORTED_EPCI_NATURE: CollectiviteNatureType[] = [
    'METRO',
    'CU',
    'CA',
    'CC',
  ];

  private readonly FICHE_STATUT_TO_PHASE_STATUT: Record<
    Statut,
    CreateFicheActionRequest['phaseStatut']
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

  getPhaseAndStatut(data: FicheWithRelationsAndCollectivite): {
    phase: CreateFicheActionRequest['phase'] | undefined;
    phaseStatut: CreateFicheActionRequest['phaseStatut'] | undefined;
  } {
    return {
      phase: data.statut ? 'Opération' : undefined,
      phaseStatut: data.statut
        ? this.FICHE_STATUT_TO_PHASE_STATUT[data.statut]
        : undefined,
    };
  }

  map(data: FicheWithRelationsAndCollectivite): CreateFicheActionRequest | null {
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
      const createFicheActionRequest: CreateFicheActionRequest = {
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
        budgetPrevisionnel: bugetPrevisionnel ?? undefined,
        dateDebutPrevisionnelle: data.dateDebut
          ? DateTime.fromISO(data.dateDebut.replace(' ', 'T')).toISO() ??
            undefined
          : undefined,
        parentExternalId: data.parentId ? String(data.parentId) : undefined,
        plans: data.plans?.length
          ? data.plans.map((plan) => ({
              externalId: String(plan.id),
              nom: plan.nom,
              type: plan.type ?? undefined,
            }))
          : undefined,
        ...this.getPhaseAndStatut(data),
      };

      if (data.referents?.length) {
        // Take the first one. Enough for now.
        createFicheActionRequest.porteur = {
          referentNom: data.referents[0].nom,
          referentTelephone: data.referents[0].telephone,
          referentEmail: data.referents[0].email,
        };
      }

      return createFicheActionRequest;
    } else {
      this.logger.log(
        `Ignoring FicheAction with id ${data.id}: type ${data.collectivite?.type} with nature ${data.collectivite?.natureInsee} not supported`
      );

      return null;
    }
  }
}
