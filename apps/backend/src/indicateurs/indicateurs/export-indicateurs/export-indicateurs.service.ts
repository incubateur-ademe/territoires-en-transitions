import {
  Injectable,
  Logger,
  PayloadTooLargeException,
} from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import {
  IndicateurDefinition,
  IndicateurDefinitionAvecEnfants,
  IndicateurSourceMetadonnee,
  ListDefinitionsInputFilters,
} from '@tet/domain/indicateurs';
import { ResourceType } from '@tet/domain/users';
import { format } from 'date-fns';
import { uniq } from 'es-toolkit';
import { Workbook } from 'exceljs';
import CollectivitesService from '../../../collectivites/services/collectivites.service';
import { AuthenticatedUser } from '../../../users/models/auth.models';
import {
  adjustColumnWidth,
  BOLD,
  normalizeWorksheetName,
} from '../../../utils/excel/export-excel.utils';
import { ListCollectiviteDefinitionsRepository } from '../../definitions/list-collectivite-definitions/list-collectivite-definitions.repository';
import CrudValeursService from '../../valeurs/crud-valeurs.service';
import { IndicateurValeurAvecMetadonnesDefinition } from '../../valeurs/indicateur-valeur.table';
import { ListIndicateursService } from '../list-indicateurs/list-indicateurs.service';
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
    private readonly listCollectiviteDefinitionsRepository: ListCollectiviteDefinitionsRepository,
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

    // Sans droit sur les confidentiels, on les exclut — sauf si le filtre
    // `estConfidentiel` a été explicitement posé (pas de modification
    // silencieuse du périmètre demandé).
    if (!canReadConfidentiel && filters.estConfidentiel === undefined) {
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

    // charge les définitions (avec enfants) des indicateurs résolus
    const definitions =
      await this.listCollectiviteDefinitionsRepository.listCollectiviteDefinitionsAvecEnfants(
        {
          collectiviteId: options.collectiviteId,
          indicateurIds: resolvedIds,
        }
      );

    // ordonne les définitions selon l'ordre résolu (tri liste en mode `all`,
    // ordre des identifiants fournis en mode `selection`)
    const orderById = new Map(resolvedIds.map((id, index) => [id, index]));
    definitions.sort(
      (a, b) => (orderById.get(a.id) ?? 0) - (orderById.get(b.id) ?? 0)
    );

    // charge la collectivité
    const collectivite = await this.collectiviteService.getCollectivite(
      options.collectiviteId
    );

    // génère le nom du fichier
    const filename = this.getFilename(
      definitions,
      collectivite.collectivite.nom || ''
    );
    if (!filename) return null;

    // extrait les id de tous les indicateurs dont il faut charger les valeurs
    const valeurIndicateurIds = definitions.flatMap((def) => [
      def.id,
      ...(def.enfants?.map((e) => e.id) ?? []),
    ]);

    // charge toutes les valeurs
    const indicateursValeurs = await this.valeursService.getIndicateursValeurs({
      collectiviteId: options.collectiviteId,
      indicateurIds: valeurIndicateurIds,
    });

    // crée le classeur
    const workbook = new Workbook();

    // ajoute dans le classeur chaque indicateur
    definitions.forEach((def) =>
      this.addIndicateurToWorkbook(workbook, def, indicateursValeurs)
    );

    // et renvoi le résultat
    const buffer = await workbook.xlsx.writeBuffer();
    return { buffer, filename };
  }

  getFilename(
    definitions: IndicateurDefinitionAvecEnfants[],
    nomCollectivite: string
  ) {
    // aucun indicateur
    if (!definitions?.length) {
      return null;
    }

    const exportedAt = format(new Date(), 'yyyy-MM-dd');
    const segments = [];

    if (nomCollectivite) {
      segments.push(nomCollectivite);
    }

    // 1 seul
    if (definitions.length === 1) {
      const definition = definitions[0];
      if (definition.identifiantReferentiel) {
        segments.push(definition.identifiantReferentiel);
      }
      segments.push(definition.titre ?? 'Sans titre', exportedAt);
    } else {
      // plusieurs
      segments.push('Indicateurs', exportedAt);
    }

    return `${segments.join(' - ')}.xlsx`;
  }

  async addIndicateurToWorkbook(
    workbook: Workbook,
    definition: IndicateurDefinitionAvecEnfants,
    indicateursValeurs: IndicateurValeurAvecMetadonnesDefinition[]
  ) {
    const worksheet = workbook.addWorksheet(
      normalizeWorksheetName(
        `${definition.identifiantReferentiel ?? definition.id}-${
          definition.titre
        }`
      )
    );

    // extrait les ids des définitions
    const definitions = [
      definition,
      ...(definition.enfants?.sort(this.sortByDefinitionId) || []),
    ];
    const indicateurIds = definitions.map((d) => d.id);

    // filtre les données
    const subset = indicateursValeurs.filter(
      (ind) =>
        ind.indicateur_definition &&
        indicateurIds.includes(ind.indicateur_definition.id)
    );

    // extrait les années (pour créer les colonnes)
    const annees = uniq(
      subset.map((ind) =>
        new Date(ind.indicateur_valeur.dateValeur).getFullYear()
      )
    ).sort();

    // utilisé ensuite pour remplir les colonnes par années
    const valeurParAnnee = new Map();
    annees.forEach((annee) => valeurParAnnee.set(annee, ''));

    // indexe les données par id d'indicateur et par type de données
    // (objectif/résultat/commentaire/source)
    const indexedRows = new Map();
    definitions.forEach((definition) => {
      const { id, identifiantReferentiel, titre, unite } = definition;
      const identifiant = identifiantReferentiel ?? id;

      const entries = subset.filter((s) => s.indicateur_definition?.id === id);

      // ajoute quand même une ligne si il n'y a pas de valeur pour cet indicateur
      if (!entries?.length) {
        indexedRows.set(identifiant, {
          identifiant,
          titre,
          unite,
          annees: new Map(),
        });
        return;
      }

      // sinon ajoute/complète une ligne pour chaque valeur
      entries.forEach((entry) => {
        const {
          indicateur_valeur: valeur,
          indicateur_source_metadonnee: source,
        } = entry;
        const annee = new Date(valeur.dateValeur).getFullYear();
        if (valeur.objectif !== null) {
          const typeDonnee = source
            ? `Objectifs ${this.getSourceName(source)}`
            : 'Mes objectifs';
          const rowKey = `${identifiant}${typeDonnee}`;
          const row = indexedRows.get(rowKey) || {
            identifiant,
            titre,
            typeDonnee,
            unite,
            annees: new Map(valeurParAnnee),
          };
          row.annees.set(annee, valeur.objectif);
          indexedRows.set(rowKey, row);

          if (valeur.objectifCommentaire && !source) {
            const rowKeyComment = `${rowKey}-comment`;
            const rowComment = indexedRows.get(rowKeyComment) || {
              identifiant,
              titre,
              typeDonnee: `${typeDonnee} / Commentaire`,
              unite,
              annees: new Map(valeurParAnnee),
            };
            rowComment.annees.set(annee, valeur.objectifCommentaire);
            indexedRows.set(rowKeyComment, rowComment);
          }
        }

        if (valeur.resultat !== null) {
          const typeDonnee = source
            ? this.getSourceName(source)
            : 'Mes resultats';
          const rowKey = `${identifiant}${typeDonnee}`;
          const row = indexedRows.get(rowKey) || {
            identifiant,
            titre,
            typeDonnee,
            unite,
            annees: new Map(valeurParAnnee),
          };
          row.annees.set(annee, valeur.resultat);
          indexedRows.set(rowKey, row);

          if (valeur.resultatCommentaire && !source) {
            const rowKeyComment = `${rowKey}-comment`;
            const rowComment = indexedRows.get(rowKeyComment) || {
              identifiant,
              titre,
              typeDonnee: `${typeDonnee} / Commentaire`,
              unite,
              annees: new Map(valeurParAnnee),
            };
            rowComment.annees.set(annee, valeur.resultatCommentaire);
            indexedRows.set(rowKeyComment, rowComment);
          }
        }
      });
    });

    // transforme les Map en Array
    const rows = [...indexedRows.values()].map((row) => [
      row.identifiant,
      row.titre,
      row.typeDonnee,
      row.unite,
      ...row.annees.values(),
    ]);

    // ajoute les lignes
    worksheet.addRows([
      ['Identifiant', 'Nom', 'Type de données', 'Unité', ...annees],
      ...rows,
    ]);

    // applique les styles
    worksheet.getRow(1).font = BOLD;
    adjustColumnWidth(worksheet);
  }

  private getSourceName(source: IndicateurSourceMetadonnee) {
    return source.nomDonnees || source.diffuseur || source.producteur;
  }

  private sortByDefinitionId(a: IndicateurDefinition, b: IndicateurDefinition) {
    return `${a.identifiantReferentiel ?? a.id}`.localeCompare(
      `${b.identifiantReferentiel ?? b.id}`,
      undefined,
      { numeric: true, sensitivity: 'base' }
    );
  }
}
