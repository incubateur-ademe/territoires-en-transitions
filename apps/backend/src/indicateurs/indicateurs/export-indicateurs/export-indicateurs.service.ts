import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import {
  catchDatabaseFailure,
  toDatabaseFailure,
} from '@tet/backend/utils/database/catch-database-failure';
import { Result, success } from '@tet/backend/utils/result.type';
import { ListIndicateursInputFilters } from '@tet/domain/indicateurs';
import { ResourceType } from '@tet/domain/users';
import { format } from 'date-fns';
import { uniq } from 'es-toolkit';
import { Workbook } from 'exceljs';
import CollectivitesService from '../../../collectivites/services/collectivites.service';
import { AuthenticatedUser } from '../../../users/models/auth.models';
import IndicateurSourcesService from '../../sources/indicateur-sources.service';
import { TrajectoireSnbc3FeatureFlagService } from '../../trajectoires/trajectoire-snbc3-feature-flag.service';
import ManageIndicateurValeursService from '../../valeurs/manage-indicateur-valeurs/manage-indicateur-valeurs.service';
import { ListIndicateursService } from '../list-indicateurs/list-indicateurs.service';
import {
  buildConsolidatedSheet,
  type EnfantRow,
} from './export-indicateurs.builder';
import {
  ExportIndicateursError,
  toExportTooLargeFailure,
} from './export-indicateurs.errors';
import { ExportIndicateursRequestType } from './export-indicateurs.request';

type XlsxBuffer = Awaited<ReturnType<Workbook['xlsx']['writeBuffer']>>;

type ExportedChildRef = Pick<
  EnfantRow,
  'id' | 'identifiantReferentiel' | 'titre'
>;

type ExportedLevelNode = ExportedChildRef & {
  enfants?: readonly ExportedChildRef[];
};

type ExportedChild = ExportedChildRef & { enfants: ExportedChild[] };

type ExportedParent<TParent extends ExportedLevelNode> = Omit<
  TParent,
  'enfants'
> & {
  enfants: ExportedChild[];
};

const toConfidentialityFilters = (
  canReadConfidentiel: boolean
): ListIndicateursInputFilters =>
  canReadConfidentiel
    ? {}
    : { estConfidentiel: false, sansAncetreConfidentiel: true };

const listDescendantIds = (enfants: readonly ExportedChild[]): number[] =>
  enfants.flatMap((enfant) => [
    enfant.id,
    ...listDescendantIds(enfant.enfants),
  ]);

type ExportedXlsx = {
  buffer: XlsxBuffer;
  filename: string;
};

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
    private readonly valeursService: ManageIndicateurValeursService,
    private readonly collectiviteService: CollectivitesService,
    private readonly listIndicateursService: ListIndicateursService,
    private readonly sourcesService: IndicateurSourcesService,
    private readonly trajectoireSnbc3FeatureFlag: TrajectoireSnbc3FeatureFlagService
  ) {}

  exportXLSX(
    options: ExportIndicateursRequestType,
    tokenInfo: AuthenticatedUser
  ): Promise<Result<ExportedXlsx | null, ExportIndicateursError>> {
    return catchDatabaseFailure(() => this.buildExport(options, tokenInfo));
  }

  private async buildExport(
    options: ExportIndicateursRequestType,
    tokenInfo: AuthenticatedUser
  ): Promise<Result<ExportedXlsx | null, ExportIndicateursError>> {
    this.logger.log("Vérification des droits avant l'export xlsx");

    // Gate confidentiel appliqué aux deux modes : on ne bloque pas l'export
    // entier, on détermine seulement si les indicateurs confidentiels peuvent y
    // figurer.
    const canReadConfidentielResult = await this.permissionService.isAllowed(
      tokenInfo,
      'indicateurs.indicateurs.read_confidentiel',
      ResourceType.COLLECTIVITE,
      { collectiviteId: options.collectiviteId }
    );
    const canReadConfidentiel = canReadConfidentielResult.success;

    // Filtres de résolution selon le mode.
    const filters: ListIndicateursInputFilters =
      options.mode === 'all'
        ? { ...options.filters }
        : { indicateurIds: options.indicateurIds };

    // Sans droit sur les confidentiels, on les exclut toujours, quelle que
    // soit la valeur éventuellement fournie par le client — un utilisateur non
    // autorisé ne peut pas forcer l'inclusion des indicateurs confidentiels.
    if (!canReadConfidentiel) {
      filters.estConfidentiel = false;
      filters.sansAncetreConfidentiel = true;
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
    if (!listResult.success) return listResult;
    const { count, data: listedIndicateurs } = listResult.data;

    // Garde-fou technique invisible : au-delà du plafond, on renvoie une erreur
    // plutôt qu'une troncature silencieuse (qui réintroduirait le bug d'origine).
    if (count > this.MAX_EXPORT_COUNT) {
      return toExportTooLargeFailure(this.MAX_EXPORT_COUNT);
    }

    let resolvedIds = listedIndicateurs.map((d) => d.id);

    // En mode selection, on conserve l'ordre des identifiants fournis (et on
    // ignore ceux qui n'appartiennent pas à la collectivité / aux droits).
    if (options.mode === 'selection') {
      const allowed = new Set(resolvedIds);
      resolvedIds = options.indicateurIds.filter((id) => allowed.has(id));
    }

    if (!resolvedIds.length) return success(null);

    this.logger.log(
      `Export de ${resolvedIds.length} indicateur(s) de la collectivité ${options.collectiviteId}`
    );

    // Ordonne les parents selon resolvedIds (cohérence avec le tri de la liste
    // en mode `all`, et avec l'ordre fourni par l'appelant en mode `selection`).
    const orderById = new Map(resolvedIds.map((id, idx) => [id, idx]));
    const parents = [...listedIndicateurs].sort(
      (a, b) => (orderById.get(a.id) ?? 0) - (orderById.get(b.id) ?? 0)
    );

    // Le filtre de participation renvoie déjà chaque enfant correspondant.
    // Les développer à nouveau ajouterait des doublons et des enfants hors filtre.
    if (filters.participationScore !== undefined) {
      for (const parent of parents) {
        parent.enfants = [];
      }
    }

    const descendantsResult = await this.listDescendants({
      parents,
      collectiviteId: options.collectiviteId,
      canReadConfidentiel,
      tokenInfo,
    });
    if (!descendantsResult.success) return descendantsResult;
    const exportedParents = descendantsResult.data;

    // Charge la collectivité
    const collectiviteResult = await this.collectiviteService.getCollectivite(
      options.collectiviteId
    );
    if (!collectiviteResult.success) return collectiviteResult;
    const { collectivite } = collectiviteResult.data;

    const filename = this.getFilename(exportedParents, collectivite.nom ?? '');
    if (!filename) return success(null);

    const allIndicateurIds = exportedParents.flatMap((parent) => [
      parent.id,
      ...listDescendantIds(parent.enfants),
    ]);

    // Lecture interne non filtrée : la SNBC 3 en est retirée sans le flag,
    // comme sur les fiches indicateurs.
    const valeursResult = await this.valeursService.getIndicateursValeurs({
      collectiviteId: options.collectiviteId,
      indicateurIds: allIndicateurIds,
    });
    if (!valeursResult.success) {
      return toDatabaseFailure(valeursResult);
    }

    const indicateursValeurs =
      await this.trajectoireSnbc3FeatureFlag.filterSourcesSnbc3(
        valeursResult.data,
        (v) => v.indicateurSourceMetadonnee?.sourceId,
        tokenInfo,
        options.collectiviteId
      );

    // Libellés des sources open-data (identifiant technique → libellé lisible)
    // pour nommer les lignes open-data dans l'export.
    const sources = await this.sourcesService.getAllSources();
    const sourceLabels = new Map(sources.map((s) => [s.id, s.libelle]));

    // Génère le classeur consolidé (1 onglet, 1 ligne par indicateur + 1 ligne
    // par source open-data disposant de valeurs).
    const workbook = new Workbook();
    buildConsolidatedSheet(
      workbook,
      exportedParents,
      indicateursValeurs,
      sourceLabels
    );

    const buffer = await workbook.xlsx.writeBuffer();
    return success({ buffer, filename });
  }

  private async listAllowedChildren({
    candidateIds,
    collectiviteId,
    canReadConfidentiel,
    tokenInfo,
  }: {
    candidateIds: readonly number[];
    collectiviteId: number;
    canReadConfidentiel: boolean;
    tokenInfo: AuthenticatedUser;
  }): Promise<Result<ExportedLevelNode[], ExportIndicateursError>> {
    const childrenResult = await this.listIndicateursService.listIndicateurs(
      {
        collectiviteId,
        filters: {
          indicateurIds: [...candidateIds],
          ...toConfidentialityFilters(canReadConfidentiel),
        },
        queryOptions: { page: 1, limit: this.MAX_EXPORT_COUNT },
      },
      tokenInfo
    );
    if (!childrenResult.success) return childrenResult;
    if (childrenResult.data.count > this.MAX_EXPORT_COUNT) {
      return toExportTooLargeFailure(this.MAX_EXPORT_COUNT);
    }
    return success(childrenResult.data.data);
  }

  private async listDescendants<TParent extends ExportedLevelNode>({
    parents,
    collectiviteId,
    canReadConfidentiel,
    tokenInfo,
  }: {
    parents: readonly TParent[];
    collectiviteId: number;
    canReadConfidentiel: boolean;
    tokenInfo: AuthenticatedUser;
  }): Promise<Result<ExportedParent<TParent>[], ExportIndicateursError>> {
    const childrenByParentId = new Map<number, ExportedChildRef[]>();
    const visitedIds = new Set(parents.map(({ id }) => id));
    let currentLevelNodes: readonly ExportedLevelNode[] = parents;

    while (currentLevelNodes.length > 0) {
      const candidateIds = uniq(
        currentLevelNodes
          .flatMap(({ enfants }) => enfants ?? [])
          .map(({ id }) => id)
          .filter((id) => !visitedIds.has(id))
      );
      if (candidateIds.length === 0) break;

      const allowedResult = await this.listAllowedChildren({
        candidateIds,
        collectiviteId,
        canReadConfidentiel,
        tokenInfo,
      });
      if (!allowedResult.success) return allowedResult;
      const allowedById = new Map(
        allowedResult.data.map((child) => [child.id, child])
      );

      currentLevelNodes = currentLevelNodes.flatMap((levelNode) => {
        const allowedChildren = (levelNode.enfants ?? []).filter(
          ({ id }) => allowedById.has(id) && !visitedIds.has(id)
        );
        allowedChildren.forEach(({ id }) => visitedIds.add(id));
        childrenByParentId.set(levelNode.id, allowedChildren);
        return allowedChildren.flatMap(({ id }) => allowedById.get(id) ?? []);
      });
    }

    const toExportedChild = (child: ExportedChildRef): ExportedChild => ({
      id: child.id,
      identifiantReferentiel: child.identifiantReferentiel,
      titre: child.titre,
      enfants: (childrenByParentId.get(child.id) ?? []).map(toExportedChild),
    });

    return success(
      parents.map((parent) => ({
        ...parent,
        enfants: (childrenByParentId.get(parent.id) ?? []).map(toExportedChild),
      }))
    );
  }

  getFilename(
    indicateurs: { identifiantReferentiel: string | null; titre: string }[],
    nomCollectivite: string
  ) {
    if (!indicateurs?.length) return null;

    const exportedAt = format(new Date(), 'yyyy-MM-dd');
    const segments: string[] = [];

    if (nomCollectivite) {
      segments.push(nomCollectivite);
    }

    if (indicateurs.length === 1) {
      const indicateur = indicateurs[0];
      if (indicateur.identifiantReferentiel) {
        segments.push(indicateur.identifiantReferentiel);
      }
      segments.push(indicateur.titre ?? 'Sans titre', exportedAt);
    } else {
      segments.push('Indicateurs', exportedAt);
    }

    return `${segments.join(' - ')}.xlsx`;
  }
}
