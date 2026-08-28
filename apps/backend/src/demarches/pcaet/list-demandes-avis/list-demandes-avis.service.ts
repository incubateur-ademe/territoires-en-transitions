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
import {
  type DemandeAvisRow,
  ListDemandesAvisRepository,
} from './list-demandes-avis.repository';

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
    const stats = this.calculerStats(rowsResult.data);

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

  /**
   * Délai moyen d'instruction : le temps qu'il a fallu, de la transmission à
   * l'avis rendu, sur les demandes instruites du périmètre.
   *
   * Seules celles qui ont abouti comptent — une instruction en cours n'a pas
   * encore de durée. `null` quand aucune n'a abouti : il n'y a alors rien à
   * moyenner, et l'écran n'affiche pas un zéro qui se lirait comme « instruit
   * le jour même ».
   */
  private calculerStats(rows: DemandeAvisRow[]): DemandesAvisStats {
    const dureesInstruction = rows
      .filter(
        (row) => row.transmittedAt !== null && row.dernierAvisValideLe !== null
      )
      .map((row) =>
        Math.max(
          0,
          Math.round(
            (new Date(row.dernierAvisValideLe as string).getTime() -
              new Date(row.transmittedAt as string).getTime()) /
              MILLISECONDES_PAR_JOUR
          )
        )
      );

    return {
      delaiMoyenJours: dureesInstruction.length
        ? Math.round(
            dureesInstruction.reduce((total, jours) => total + jours, 0) /
              dureesInstruction.length
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
