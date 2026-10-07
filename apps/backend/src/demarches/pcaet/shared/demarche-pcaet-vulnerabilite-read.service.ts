import { Injectable } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type { DemarchePcaetVulnerabilite } from '@tet/domain/demarches';
import { DemarchePcaetVulnerabiliteRepository } from './demarche-pcaet-vulnerabilite.repository';

/**
 * Service de lecture pour le volet vulnérabilité : charge les thématiques de la
 * démarche — le socle plus ceux qu'elle rattache — chacun avec sa ligne.
 */
@Injectable()
export class DemarchePcaetVulnerabiliteReadService {
  constructor(
    private readonly vulnerabiliteRepository: DemarchePcaetVulnerabiliteRepository
  ) {}

  /**
   * Le volet vulnérabilité tel qu'il est servi : les thématiques de la démarche —
   * le socle plus ceux qu'elle rattache — chacun avec sa ligne, même vierge,
   * pour que le front n'ait pas deux formes à gérer. Une thématique du socle
   * apparaît même sans rattachement : il s'impose à tous les dépôts.
   */
  async loadVulnerabilite(
    {
      demarcheId,
      collectiviteId,
    }: { demarcheId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<DemarchePcaetVulnerabilite> {
    const [thematiques, saisies] = await Promise.all([
      this.vulnerabiliteRepository.listThematiquesDeLaDemarche(
        { demarcheId, collectiviteId },
        tx
      ),
      this.vulnerabiliteRepository.listLignes(demarcheId, tx),
    ]);
    const parThematique = new Map(
      saisies.map((ligne) => [ligne.thematiqueId, ligne])
    );

    return {
      thematiques,
      lignes: thematiques.map(
        ({ id }) =>
          parThematique.get(id) ?? {
            thematiqueId: id,
            niveauMaintenant: null,
            niveau2050: null,
            niveau2100: null,
            objectifs2050: null,
            objectifs2100: null,
          }
      ),
    };
  }
}
