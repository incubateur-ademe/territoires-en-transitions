import { Injectable, Logger } from '@nestjs/common';
import { ListPlatformDefinitionsRepository } from '@tet/backend/indicateurs/definitions/list-platform-definitions/list-platform-definitions.repository';
import CrudValeursService from '@tet/backend/indicateurs/valeurs/crud-valeurs.service';
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
import {
  DemarchePcaetSourceMetadonneeRepository,
  PCAET_COLLECTIVITE_SOURCE_ID,
} from './demarche-pcaet-source-metadonnee.repository';
import { DemarchePcaetVulnerabiliteReadService } from './demarche-pcaet-vulnerabilite-read.service';

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
    private readonly sourceMetadonneeRepository: DemarchePcaetSourceMetadonneeRepository
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
    const metadonneeId = await this.sourceMetadonneeRepository.findMetadonneeId(
      { demarcheId, collectiviteId },
      tx
    );

    if (metadonneeId === null) {
      return [];
    }

    return this.crudValeursService.getIndicateursValeurs(
      {
        collectiviteId,
        identifiantsReferentiel: ALL_PCAET_DIAGNOSTIC_INDICATEUR_IDS,
        sources: [PCAET_COLLECTIVITE_SOURCE_ID],
        metadonneeId,
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
