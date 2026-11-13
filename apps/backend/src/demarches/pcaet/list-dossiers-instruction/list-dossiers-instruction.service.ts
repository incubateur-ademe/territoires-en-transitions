import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  peutDeposerAvisInstructeur,
  peutDeposerAvisSaisine,
  type DemandeAvisAchevement,
} from '@tet/domain/demarches';
import { DepotPermissionsService } from '../shared/depot-permissions.service';
import { PcaetAvisRepository } from '../shared/pcaet-avis.repository';
import { toDossierInstructionLigne } from './list-dossiers-instruction.adapter';
import { compterCharge } from './list-dossiers-instruction.counters';
import {
  ListDossiersInstructionError,
  ListDossiersInstructionErrorEnum,
} from './list-dossiers-instruction.errors';
import { ListDossiersInstructionInput } from './list-dossiers-instruction.input';
import {
  DossierInstructionLigne,
  ListDossiersInstructionOutput,
} from './list-dossiers-instruction.output';
import {
  type DossierInstructionRow,
  ListDossiersInstructionRepository,
} from './list-dossiers-instruction.repository';
import {
  filtrerLigne,
  hasExactNameMatch,
  listerDepartements,
  trierDossiers,
  trieSurLesPilotes,
} from './list-dossiers-instruction.rules';

@Injectable()
export class ListDossiersInstructionService {
  constructor(
    private readonly depotPermissionsService: DepotPermissionsService,
    private readonly listDossiersInstructionRepository: ListDossiersInstructionRepository,
    private readonly pcaetAvisRepository: PcaetAvisRepository
  ) {}

  async listDossiersInstruction(
    input: ListDossiersInstructionInput,
    { user, tx }: ServiceSecondArg
  ): Promise<
    Result<ListDossiersInstructionOutput, ListDossiersInstructionError>
  > {
    const permissionResult =
      await this.depotPermissionsService.canListerDemandes(
        input.collectiviteId,
        { user, tx }
      );
    if (!permissionResult.success) {
      return failure(ListDossiersInstructionErrorEnum.UNAUTHORIZED);
    }

    const rowsResult =
      await this.listDossiersInstructionRepository.listDossiersCouvertsWithCollectivitesCouvertes(
        input.collectiviteId,
        tx
      );
    if (!rowsResult.success) {
      return rowsResult;
    }
    const { instructeurType, rows, perimetreRegions, couvertesParDemarche } =
      rowsResult.data;

    // Un service qui dépose un avis lit où *il* en est, ligne par ligne. Un
    // destinataire en lecture — DDT, DR ADEME, service national — lit où en est
    // *le dossier* : sa propre demande restera vide par nature.
    //
    // Le droit se lit par **ligne** et non pour la page, pour deux raisons :
    // depuis les périmètres secondaires, une même DREAL dépose sur le dossier de
    // sa région et se contente de lire celui de l'EPCI voisin qui déborde chez
    // elle ; et sans saisine, il n'y a rien à déposer — un dossier parti avant
    // que le service n'entre dans le dispositif se suit comme celui d'un
    // destinataire, plutôt que de lui compter une charge qu'il n'a pas la main
    // pour solder. C'est ce que `rattraper-saisines-pcaet` répare.
    const deposeAvis = (row: DossierInstructionRow): boolean =>
      row.demandeAvisId !== null &&
      peutDeposerAvisSaisine(instructeurType, row.perimetre);

    /**
     * Ce service répond-il de cette ligne ? C'est ce que comptent les compteurs,
     * et cela ne se confond pas avec `deposeAvis` : une collectivité qui n'a
     * rien déposé relève bien de lui — c'est celle qu'il doit relancer — alors
     * qu'il n'a aucun avis à y déposer.
     */
    const relveDeSaCharge = (row: DossierInstructionRow): boolean =>
      peutDeposerAvisSaisine(instructeurType, row.perimetre) &&
      // Instruit hors plateforme : le service a été saisi ailleurs, par
      // courrier ou par mail. Il n'a rien à y faire ici, et rien à relancer —
      // le compter lui prêterait une charge déjà soldée en dehors.
      !row.transmittedOffPlatform &&
      // Transmis sans l'avoir saisi : il suit le dossier sans avoir la main
      // pour le solder, et le compter lui réclamerait un travail qu'il ne peut
      // pas faire.
      (row.transmittedAt === null || row.demandeAvisId !== null);

    const achevementParDemarche = await this.listAchevements(
      rows.filter((row) => row.demarcheId !== null && !deposeAvis(row)),
      tx
    );

    const now = new Date();
    const dossiers = rows.map((row) => ({
      row,
      ligne: toDossierInstructionLigne(row, {
        deposeAvis: deposeAvis(row),
        achevement:
          row.demarcheId === null
            ? []
            : achevementParDemarche.get(row.demarcheId) ?? [],
        couvertes:
          row.demarcheId === null
            ? []
            : couvertesParDemarche.get(row.demarcheId) ?? [],
        now,
      }),
    }));
    const lignes = dossiers.map(({ ligne }) => ligne);

    const { countByStatut, stats } = compterCharge(
      dossiers.map(({ row, ligne }) => ({
        statut: ligne.statut,
        relveDeSaCharge: relveDeSaCharge(row),
        transmittedAt: row.transmittedAt,
        dernierAvisValideLe: row.dernierAvisValideLe,
      })),
      { serviceSePrononce: peutDeposerAvisInstructeur(instructeurType) }
    );

    // Les fautes de frappe ne sont tolérées que si aucun nom du territoire ne
    // contient la recherche telle quelle — les autres filtres n'y sont pour
    // rien : un nom exact écarté par le filtre de statut n'est pas une faute.
    const { recherche } = input;
    const allowTypos =
      recherche !== undefined &&
      !lignes.some((ligne) => hasExactNameMatch(ligne, recherche));

    // Un groupe — un Supra et ses EPCI couverts — compte pour une ligne : il se
    // pagine d'un bloc, ses sous-lignes viennent avec lui.
    const filtrees = lignes.flatMap((ligne) => {
      const retenue = filtrerLigne(ligne, input, { allowTypos });
      return retenue === null ? [] : [retenue];
    });
    const isRechercheApprochee = allowTypos && filtrees.length > 0;

    // Trier par pilote demande de les connaître avant de paginer. Le coût est
    // assumé — il ne se paie que sur ce tri, et l'agent l'a demandé.
    const avantTri = trieSurLesPilotes(input.sort)
      ? await this.avecPilotes(filtrees, tx)
      : filtrees;

    const triees = trierDossiers(avantTri, input.sort, input.direction);

    // Une page hors plage rend la dernière page garnie, et non un tableau vide
    // que l'écran expliquerait par « aucun dossier ne correspond à ces filtres »
    // pendant que la pagination en annonce deux. Cela arrive sans rien faire de
    // travers : un lien partagé, ou un filtre resserré depuis la page 4.
    const nbPages = Math.max(1, Math.ceil(triees.length / input.limit));
    const page = Math.min(input.page, nbPages);
    const debut = (page - 1) * input.limit;
    const affichees = triees.slice(debut, debut + input.limit);

    return success({
      // Les pilotes ne se chargent que pour la page affichée : sur un
      // périmètre national, les demander pour tout le territoire serait une
      // requête d'un millier de démarches pour vingt-cinq lignes.
      items: trieSurLesPilotes(input.sort)
        ? affichees
        : await this.avecPilotes(affichees, tx),
      total: triees.length,
      isRechercheApprochee,
      totalPerimetre: lignes.length,
      page,
      limit: input.limit,
      countByStatut,
      perimetreRegions,
      perimetreDepartements: listerDepartements(lignes),
      stats,
    });
  }

  /** Les avis validés des dossiers que ce service ne fait que lire. */
  private async listAchevements(
    rowsEnLecture: DossierInstructionRow[],
    tx: ServiceSecondArg['tx']
  ): Promise<Map<number, DemandeAvisAchevement[]>> {
    const demarcheIds = [
      ...new Set(rowsEnLecture.map((row) => row.demarcheId as number)),
    ];
    if (demarcheIds.length === 0) {
      return new Map();
    }
    return this.pcaetAvisRepository.listAchevementParDemarche(demarcheIds, tx);
  }

  /**
   * Les pilotes désignés sur la démarche, et non les administrateurs de la
   * collectivité : ce sont eux qui portent le PCAET, et que l'instructeur doit
   * pouvoir joindre. Une collectivité sans démarche n'en a donc aucun.
   */
  private async avecPilotes(
    lignes: DossierInstructionLigne[],
    tx: ServiceSecondArg['tx']
  ): Promise<DossierInstructionLigne[]> {
    const pilotes =
      await this.listDossiersInstructionRepository.listPilotesParDemarche(
        lignes.flatMap((ligne) =>
          ligne.demarcheId === null ? [] : [ligne.demarcheId]
        ),
        tx
      );
    return lignes.map((ligne) => ({
      ...ligne,
      pilotes:
        ligne.demarcheId === null ? [] : pilotes.get(ligne.demarcheId) ?? [],
    }));
  }
}
