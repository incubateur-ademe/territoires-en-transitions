import { Injectable } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type { DemarchePcaetVulnerabilite } from '@tet/domain/demarches';
import { DemarchePcaetVulnerabiliteRepository } from './demarche-pcaet-vulnerabilite.repository';

/**
 * Service de lecture pour le volet vulnérabilité : charge les domaines de la
 * démarche — le socle plus ceux qu'elle rattache — chacun avec sa ligne.
 */
@Injectable()
export class DemarchePcaetVulnerabiliteReadService {
  constructor(
    private readonly vulnerabiliteRepository: DemarchePcaetVulnerabiliteRepository
  ) {}

  /**
   * Le volet vulnérabilité tel qu'il est servi : les domaines de la démarche —
   * le socle plus ceux qu'elle rattache — chacun avec sa ligne, même vierge,
   * pour que le front n'ait pas deux formes à gérer. Un domaine du socle
   * apparaît même sans rattachement : il s'impose à tous les dépôts.
   */
  async loadVulnerabilite(
    {
      demarcheId,
      collectiviteId,
    }: { demarcheId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<DemarchePcaetVulnerabilite> {
    const [domaines, saisies] = await Promise.all([
      this.vulnerabiliteRepository.listDomainesDeLaDemarche(
        { demarcheId, collectiviteId },
        tx
      ),
      this.vulnerabiliteRepository.listLignes(demarcheId, tx),
    ]);
    const parDomaine = new Map(
      saisies.map((ligne) => [ligne.domaineId, ligne])
    );

    return {
      domaines,
      lignes: domaines.map(
        ({ id }) =>
          parDomaine.get(id) ?? {
            domaineId: id,
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
