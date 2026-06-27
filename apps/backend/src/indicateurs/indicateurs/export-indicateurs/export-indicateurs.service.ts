import {
  Injectable,
  Logger,
  PayloadTooLargeException,
} from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ListDefinitionsInputFilters } from '@tet/domain/indicateurs';
import { ResourceType } from '@tet/domain/users';
import { format } from 'date-fns';
import { Workbook } from 'exceljs';
import CollectivitesService from '../../../collectivites/services/collectivites.service';
import { AuthenticatedUser } from '../../../users/models/auth.models';
import CrudValeursService from '../../valeurs/crud-valeurs.service';
import { ListIndicateursService } from '../list-indicateurs/list-indicateurs.service';
import { buildConsolidatedSheet } from './export-indicateurs.builder';
import { ExportIndicateursRequestType } from './export-indicateurs.request';

@Injectable()
export default class ExportIndicateursService {
  private readonly logger = new Logger(ExportIndicateursService.name);

  /**
   * Garde-fou technique invisible : plafond haut, très au-dessus de l'usage réel,
   * servant uniquement de soupape de sécurité contre un export qui ferait exploser
   * mémoire/timeout. Au-delà, on renvoie une erreur (jamais de troncature).
   */
  private readonly MAX_EXPORT_COUNT = 5000;

  constructor(
    private readonly permissionService: PermissionService,
    private readonly valeursService: CrudValeursService,
    private readonly collectiviteService: CollectivitesService,
    private readonly listIndicateursService: ListIndicateursService
  ) {}

  async exportXLSX(
    options: ExportIndicateursRequestType,
    tokenInfo: AuthenticatedUser
  ) {
    this.logger.log("Vérification des droits avant l'export xlsx");

    // Gate confidentiel appliqué aux deux modes : on ne bloque pas l'export
    // entier, on détermine seulement si les indicateurs confidentiels peuvent y
    // figurer.
    const canReadConfidentiel = await this.permissionService.isAllowed(
      tokenInfo,
      'indicateurs.indicateurs.read_confidentiel',
      ResourceType.COLLECTIVITE,
      options.collectiviteId,
      true // doNotThrow
    );

    // Filtres de résolution selon le mode.
    const filters: ListDefinitionsInputFilters =
      options.mode === 'all'
        ? { ...options.filters }
        : { indicateurIds: options.indicateurIds };

    // Sans droit sur les confidentiels, on les exclut toujours, quelle que
    // soit la valeur éventuellement fournie par le client — un utilisateur non
    // autorisé ne peut pas forcer l'inclusion des indicateurs confidentiels.
    if (!canReadConfidentiel) {
      filters.estConfidentiel = false;
    }

    // Résout l'ensemble des indicateurs via ListIndicateursService : source
    // unique du filtrage et du tri, qui vérifie aussi les droits de lecture de
    // l'utilisateur et borne la résolution à sa collectivité (protection IDOR).
    const sort = options.mode === 'all' ? options.sort : undefined;
    const listResult = await this.listIndicateursService.listIndicateurs(
      {
        collectiviteId: options.collectiviteId,
        filters,
        queryOptions: { page: 1, limit: this.MAX_EXPORT_COUNT, sort },
      },
      tokenInfo
    );

    // Garde-fou technique invisible : au-delà du plafond, on renvoie une erreur
    // plutôt qu'une troncature silencieuse (qui réintroduirait le bug d'origine).
    if (listResult.count > this.MAX_EXPORT_COUNT) {
      throw new PayloadTooLargeException(
        `L'export dépasse la limite technique de ${this.MAX_EXPORT_COUNT} indicateurs`
      );
    }

    let resolvedIds = listResult.data.map((d) => d.id);

    // En mode selection, on conserve l'ordre des identifiants fournis (et on
    // ignore ceux qui n'appartiennent pas à la collectivité / aux droits).
    if (options.mode === 'selection') {
      const allowed = new Set(resolvedIds);
      resolvedIds = options.indicateurIds.filter((id) => allowed.has(id));
    }

    if (!resolvedIds.length) return null;

    this.logger.log(
      `Export de ${resolvedIds.length} indicateur(s) de la collectivité ${options.collectiviteId}`
    );

    // Ordonne les parents selon resolvedIds (cohérence avec le tri de la liste
    // en mode `all`, et avec l'ordre fourni par l'appelant en mode `selection`).
    const orderById = new Map(resolvedIds.map((id, idx) => [id, idx]));
    const parents = [...listResult.data].sort(
      (a, b) => (orderById.get(a.id) ?? 0) - (orderById.get(b.id) ?? 0)
    );

    // Charge la collectivité pour nommer le fichier.
    const collectivite = await this.collectiviteService.getCollectivite(
      options.collectiviteId
    );

    const filename = this.getFilename(
      parents,
      collectivite.collectivite.nom ?? ''
    );
    if (!filename) return null;

    // Charge les valeurs pour tous les indicateurs (parents + enfants).
    const allIndicateurIds = parents.flatMap((p) => [
      p.id,
      ...(p.enfants?.map((e) => e.id) ?? []),
    ]);

    const indicateursValeurs = await this.valeursService.getIndicateursValeurs({
      collectiviteId: options.collectiviteId,
      indicateurIds: allIndicateurIds,
    });

    // Génère le classeur consolidé (1 onglet, 1 ligne par indicateur).
    const workbook = new Workbook();
    buildConsolidatedSheet(workbook, parents, indicateursValeurs);

    const buffer = await workbook.xlsx.writeBuffer();
    return { buffer, filename };
  }

  getFilename(
    definitions: { identifiantReferentiel: string | null; titre: string }[],
    nomCollectivite: string
  ) {
    if (!definitions?.length) return null;

    const exportedAt = format(new Date(), 'yyyy-MM-dd');
    const segments: string[] = [];

    if (nomCollectivite) {
      segments.push(nomCollectivite);
    }

    if (definitions.length === 1) {
      const definition = definitions[0];
      if (definition.identifiantReferentiel) {
        segments.push(definition.identifiantReferentiel);
      }
      segments.push(definition.titre ?? 'Sans titre', exportedAt);
    } else {
      segments.push('Indicateurs', exportedAt);
    }

    return `${segments.join(' - ')}.xlsx`;
  }
}
