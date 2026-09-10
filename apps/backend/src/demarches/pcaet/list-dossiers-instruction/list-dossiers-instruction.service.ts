import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  peutDeposerAvisInstructeur,
  peutDeposerAvisSaisine,
  type DemandeAvisAchevement,
} from '@tet/domain/demarches';
import { CollectiviteContactsRepository } from '../shared/collectivite-contacts.repository';
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
  estRetenue,
  trierDossiers,
  trieSurLesContacts,
} from './list-dossiers-instruction.rules';

@Injectable()
export class ListDossiersInstructionService {
  constructor(
    private readonly depotPermissionsService: DepotPermissionsService,
    private readonly listDossiersInstructionRepository: ListDossiersInstructionRepository,
    private readonly collectiviteContactsRepository: CollectiviteContactsRepository,
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
      await this.listDossiersInstructionRepository.listDossiersCouverts(
        input.collectiviteId,
        tx
      );
    if (!rowsResult.success) {
      return rowsResult;
    }
    const { instructeurType, rows, perimetreRegions } = rowsResult.data;

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

    const filtrees = lignes.filter((ligne) => estRetenue(ligne, input));

    // Trier par contact demande de les connaître avant de paginer. Le coût est
    // assumé — il ne se paie que sur ce tri, et l'agent l'a demandé.
    const avantTri = trieSurLesContacts(input.sort)
      ? await this.avecContacts(filtrees, tx)
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
      // Les contacts ne se chargent que pour la page affichée : sur un
      // périmètre national, les demander pour tout le territoire serait une
      // requête d'un millier de collectivités pour vingt-cinq lignes.
      items: trieSurLesContacts(input.sort)
        ? affichees
        : await this.avecContacts(affichees, tx),
      total: triees.length,
      totalPerimetre: lignes.length,
      page,
      limit: input.limit,
      countByStatut,
      perimetreRegions,
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

  private async avecContacts(
    lignes: DossierInstructionLigne[],
    tx: ServiceSecondArg['tx']
  ): Promise<DossierInstructionLigne[]> {
    const contacts =
      await this.collectiviteContactsRepository.listContactsParCollectivite(
        [...new Set(lignes.map((ligne) => ligne.collectivite.id))],
        tx
      );
    return lignes.map((ligne) => ({
      ...ligne,
      contacts: contacts.get(ligne.collectivite.id) ?? [],
    }));
  }
}
