import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  getDemandeAvisEtat,
  pcaetDemandeAvisEtatValues,
} from '@tet/domain/demarches';
import { DepotPermissionsService } from '../shared/depot-permissions.service';
import {
  ListDemandesAvisError,
  ListDemandesAvisErrorEnum,
} from './list-demandes-avis.errors';
import { ListDemandesAvisInput } from './list-demandes-avis.input';
import {
  DemandeAvisLigne,
  DemandesAvisStats,
  emptyCountByEtat,
  ListDemandesAvisOutput,
} from './list-demandes-avis.output';
import { ListDemandesAvisRepository } from './list-demandes-avis.repository';

const MILLISECONDES_PAR_JOUR = 24 * 60 * 60 * 1000;

@Injectable()
export class ListDemandesAvisService {
  constructor(
    private readonly depotPermissionsService: DepotPermissionsService,
    private readonly listDemandesAvisRepository: ListDemandesAvisRepository
  ) {}

  async listDemandesAvis(
    input: ListDemandesAvisInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<ListDemandesAvisOutput, ListDemandesAvisError>> {
    const permissionResult =
      await this.depotPermissionsService.canListerDemandes(
        input.collectiviteId,
        { user, tx }
      );
    if (!permissionResult.success) {
      return failure(ListDemandesAvisErrorEnum.UNAUTHORIZED);
    }

    const rowsResult =
      await this.listDemandesAvisRepository.listDemandesCouvertes(
        input.collectiviteId,
        tx
      );
    if (!rowsResult.success) {
      return rowsResult;
    }

    const contactsParCollectivite =
      await this.listDemandesAvisRepository.listContactsParCollectivite(
        [...new Set(rowsResult.data.map((row) => row.collectiviteId))],
        tx
      );

    const now = new Date();
    const lignes: DemandeAvisLigne[] = rowsResult.data.map((row) => ({
      demandeAvisId: row.demandeAvisId,
      demarcheId: row.demarcheId,
      demarcheTitre: row.demarcheTitre,
      demarcheStatus: row.demarcheStatus,
      avisDeadlineAt: row.avisDeadlineAt,
      transmittedAt: row.transmittedAt,
      collectivite: {
        id: row.collectiviteId,
        nom: row.collectiviteNom,
        departementCode: row.collectiviteDepartementCode,
      },
      contacts: contactsParCollectivite.get(row.collectiviteId) ?? [],
      etat: getDemandeAvisEtat(row, now),
      nbAvisValides: row.nbAvisValides,
      nbAvisBrouillons: row.nbAvisBrouillons,
    }));

    const countByEtat = emptyCountByEtat();
    for (const ligne of lignes) {
      countByEtat[ligne.etat] += 1;
    }
    const stats = this.calculerStats(lignes, now);

    const filtrees = lignes.filter((ligne) => {
      if (input.etats && !input.etats.includes(ligne.etat)) {
        return false;
      }
      if (
        input.departementCodes &&
        (ligne.collectivite.departementCode === null ||
          !input.departementCodes.includes(ligne.collectivite.departementCode))
      ) {
        return false;
      }
      if (
        input.recherche &&
        !ligne.collectivite.nom
          .toLocaleLowerCase('fr')
          .includes(input.recherche.toLocaleLowerCase('fr'))
      ) {
        return false;
      }
      return true;
    });

    const triees = this.trier(filtrees, input.sort, input.direction);
    const debut = (input.page - 1) * input.limit;

    return success({
      items: triees.slice(debut, debut + input.limit),
      total: triees.length,
      page: input.page,
      limit: input.limit,
      countByEtat,
      stats,
    });
  }

  private calculerStats(
    lignes: DemandeAvisLigne[],
    now: Date
  ): DemandesAvisStats {
    const joursRestants = lignes
      .filter(
        (ligne) =>
          ligne.avisDeadlineAt !== null &&
          new Date(ligne.avisDeadlineAt).getTime() > now.getTime() &&
          ligne.nbAvisValides === 0
      )
      .map((ligne) =>
        Math.ceil(
          (new Date(ligne.avisDeadlineAt as string).getTime() - now.getTime()) /
            MILLISECONDES_PAR_JOUR
        )
      );

    return {
      nbCollectivites: new Set(lignes.map((ligne) => ligne.collectivite.id))
        .size,
      delaiMoyenJours: joursRestants.length
        ? Math.round(
            joursRestants.reduce((total, jours) => total + jours, 0) /
              joursRestants.length
          )
        : null,
    };
  }

  private trier(
    lignes: DemandeAvisLigne[],
    sort: ListDemandesAvisInput['sort'],
    direction: ListDemandesAvisInput['direction']
  ): DemandeAvisLigne[] {
    const sens = direction === 'asc' ? 1 : -1;
    const parCollectivite = (a: DemandeAvisLigne, b: DemandeAvisLigne) =>
      a.collectivite.nom.localeCompare(b.collectivite.nom, 'fr');
    const nomContact = (ligne: DemandeAvisLigne) => {
      const contact = ligne.contacts[0];
      return contact ? `${contact.prenom} ${contact.nom}` : null;
    };

    return [...lignes].sort((a, b) => {
      if (sort === 'collectivite') {
        return sens * parCollectivite(a, b);
      }
      if (sort === 'statut') {
        const ecart =
          pcaetDemandeAvisEtatValues.indexOf(a.etat) -
          pcaetDemandeAvisEtatValues.indexOf(b.etat);
        return ecart === 0 ? parCollectivite(a, b) : sens * ecart;
      }
      if (sort === 'contact') {
        const nomA = nomContact(a);
        const nomB = nomContact(b);
        if (nomA === nomB) {
          return parCollectivite(a, b);
        }
        if (nomA === null) {
          return 1;
        }
        if (nomB === null) {
          return -1;
        }
        return sens * nomA.localeCompare(nomB, 'fr');
      }
      if (a.avisDeadlineAt === b.avisDeadlineAt) {
        return parCollectivite(a, b);
      }
      if (a.avisDeadlineAt === null) {
        return 1;
      }
      if (b.avisDeadlineAt === null) {
        return -1;
      }
      return (
        sens *
        (new Date(a.avisDeadlineAt).getTime() -
          new Date(b.avisDeadlineAt).getTime())
      );
    });
  }
}
