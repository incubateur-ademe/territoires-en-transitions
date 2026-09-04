import { Injectable, Logger } from '@nestjs/common';
import { ListPlatformDefinitionsRepository } from '@tet/backend/indicateurs/definitions/list-platform-definitions/list-platform-definitions.repository';
import CrudValeursService from '@tet/backend/indicateurs/valeurs/crud-valeurs.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  ALL_PCAET_DIAGNOSTIC_INDICATEUR_IDS,
  isDemarchePcaetDiagnosticComplet,
  PCAET_DIAGNOSTIC_INDICATEURS,
  PCAET_DIAGNOSTIC_VULNERABILITE,
  type DemarchePcaetVulnerabilite,
  type PcaetDiagnostic,
  type PcaetDiagnosticVulnerabilite,
  type PcaetDiagnosticVulnerabiliteConfig,
} from '@tet/domain/demarches';
import type { IndicateurValeurAvecMetadonnesDefinition } from '@tet/domain/indicateurs';
import { and, eq } from 'drizzle-orm';
import { demarchePcaetSourceMetadonneeTable } from './models/demarche-pcaet-source-metadonnee.table';
import { DemarchePcaetVulnerabiliteReadService } from './demarche-pcaet-vulnerabilite-read.service';

/**
 * Source interne dédiée au dépôt PCAET : les valeurs portent une metadonnée,
 * mais dans la payload du diagnostic elles doivent être traitées comme des
 * saisies (donc publiées dans `resultat` / `objectif`, pas dans `references`).
 *
 * Chaque couple (démarche, collectivité) a sa propre `indicateur_source_metadonnee`
 * via `demarche_pcaet_source_metadonnee` : on ne doit jamais mélanger les
 * valeurs de deux PCAET, même s'ils partagent le même `source_id`.
 */
const PCAET_COLLECTIVITE_SOURCE_ID = 'pcaet-collectivite';

/**
 * Assemble le diagnostic d'une démarche : indicateurs (grille CAE) et
 * vulnérabilité, servis séparément pour que le front et le guard
 * `dossierComplet` appliquent la même règle au même objet.
 */
@Injectable()
export class DemarchePcaetDiagnosticService {
  private readonly logger = new Logger(DemarchePcaetDiagnosticService.name);

  constructor(
    private readonly vulnerabiliteReadService: DemarchePcaetVulnerabiliteReadService,
    private readonly crudValeursService: CrudValeursService,
    private readonly listPlatformDefinitionsRepository: ListPlatformDefinitionsRepository,
    private readonly databaseService: DatabaseService
  ) {}

  async loadPayload(
    {
      demarcheId,
      collectiviteId,
    }: { demarcheId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<PcaetDiagnostic> {
    const [indicateurDefinitions, indicateurValeurs, vulnerabilite] =
      await Promise.all([
        this.listPlatformDefinitionsRepository.listPlatformDefinitions({
          identifiantsReferentiel: ALL_PCAET_DIAGNOSTIC_INDICATEUR_IDS,
        }),
        this.loadIndicateurValeursForDemarche(
          { demarcheId, collectiviteId },
          tx
        ),
        this.vulnerabiliteReadService.loadVulnerabilite(
          { demarcheId, collectiviteId },
          tx
        ),
      ]);

    return {
      indicateurParentConfigs: PCAET_DIAGNOSTIC_INDICATEURS,
      indicateurDefinitions,
      indicateurValeurs,
      vulnerabilite: this.toVulnerabilite(
        PCAET_DIAGNOSTIC_VULNERABILITE,
        vulnerabilite
      ),
    };
  }

  /**
   * Lit uniquement les valeurs rattachées à la métadonnée de *cette* démarche.
   * Sans lien `demarche_pcaet_source_metadonnee`, aucune valeur PCAET n'existe
   * encore pour ce dépôt — on ne retombe pas sur d'autres versions `pcaet-collectivite`.
   */
  private async loadIndicateurValeursForDemarche(
    {
      demarcheId,
      collectiviteId,
    }: { demarcheId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<IndicateurValeurAvecMetadonnesDefinition[]> {
    const [link] = await (tx ?? this.databaseService.db)
      .select({ metadonneeId: demarchePcaetSourceMetadonneeTable.metadonneeId })
      .from(demarchePcaetSourceMetadonneeTable)
      .where(
        and(
          eq(demarchePcaetSourceMetadonneeTable.demarcheId, demarcheId),
          eq(demarchePcaetSourceMetadonneeTable.collectiviteId, collectiviteId)
        )
      )
      .limit(1);

    if (link?.metadonneeId === undefined) {
      return [];
    }

    return this.crudValeursService.getIndicateursValeurs(
      {
        collectiviteId,
        identifiantsReferentiel: ALL_PCAET_DIAGNOSTIC_INDICATEUR_IDS,
        sources: [PCAET_COLLECTIVITE_SOURCE_ID],
        metadonneeId: link.metadonneeId,
      },
      undefined,
      tx
    );
  }

  /** Complétude de l'étape diagnostic, telle que la voit le guard du workflow. */
  async isDiagnosticComplet(
    input: { demarcheId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<boolean> {
    return isDemarchePcaetDiagnosticComplet(await this.loadPayload(input, tx));
  }

  private toVulnerabilite(
    topic: PcaetDiagnosticVulnerabiliteConfig,
    vulnerabilite: DemarchePcaetVulnerabilite
  ): PcaetDiagnosticVulnerabilite {
    return {
      code: topic.code,
      label: topic.label,
      icon: topic.icon,
      horizons: [...topic.horizons],
      thematiques: vulnerabilite.thematiques,
      lignes: vulnerabilite.lignes,
    };
  }
}
