import { Injectable, Logger } from '@nestjs/common';
import { BibliothequeFichierRepository } from '@tet/backend/collectivites/documents/bibliotheque-fichier.repository';
import { calculateDocumentHash } from '@tet/backend/collectivites/documents/store-document/calculate-document-hash.utils';
import { StoreDocumentService } from '@tet/backend/collectivites/documents/store-document/store-document.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { BibliothequeFichier } from '@tet/domain/collectivites';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export type DemoFichier = {
  /** Fichier de `assets/`, embarqué au build. */
  asset: string;
  /** Nom affiché dans la bibliothèque de la collectivité. */
  filename: string;
};

/** Pièces du catalogue PCAET que le remplissage de démo dépose. */
export const DEMO_DOCUMENTS: Record<string, DemoFichier> = {
  pcaet_bilan_pcaet_precedent: {
    asset: 'bilan-pcaet-precedent.pdf',
    filename: 'Bilan du PCAET précédent (démo).pdf',
  },
  pcaet_bilan_mi_parcours_precedent: {
    asset: 'bilan-pcaet-precedent.pdf',
    filename: 'Bilan du PCAET précédent (démo).pdf',
  },
  pcaet_deliberation_engagement: {
    asset: 'deliberation-engagement.pdf',
    filename: "Délibération d'engagement (démo).pdf",
  },
  pcaet_diagnostic: {
    asset: 'diagnostic.pdf',
    filename: 'Diagnostic (démo).pdf',
  },
  pcaet_strategie_territoriale: {
    asset: 'strategie-territoriale.pdf',
    filename: 'Stratégie territoriale (démo).pdf',
  },
  pcaet_plan_actions: {
    asset: 'programme-actions.pdf',
    filename: "Programme d'actions (démo).pdf",
  },
  pcaet_dispositif_suivi_evaluation: {
    asset: 'dispositif-suivi-evaluation.pdf',
    filename: "Dispositif de suivi et d'évaluation (démo).pdf",
  },
  pcaet_ees: { asset: 'ees.pdf', filename: 'EES (démo).pdf' },
  pcaet_deliberation_arret: {
    asset: 'deliberation-arret.pdf',
    filename: "Délibération d'arrêt (démo).pdf",
  },
  pcaet_memoire_reponse_avis: {
    asset: 'memoire-reponse-avis.pdf',
    filename: 'Mémoire de réponse aux avis (démo).pdf',
  },
  pcaet_synthese_consultation_publique: {
    asset: 'synthese-consultation-publique.pdf',
    filename: 'Synthèse de la consultation publique (démo).pdf',
  },
  pcaet_deliberation_adoption: {
    asset: 'deliberation-adoption.pdf',
    filename: "Délibération d'adoption (démo).pdf",
  },
};

export const DEMO_RAPPORT_INSTRUCTION: DemoFichier = {
  asset: 'rapport-instruction.pdf',
  filename: "Rapport d'instruction (démo).pdf",
};

@Injectable()
export class DemarchePcaetDemoFichiersService {
  private readonly logger = new Logger(DemarchePcaetDemoFichiersService.name);

  constructor(
    private readonly bibliothequeFichierRepository: BibliothequeFichierRepository,
    private readonly storeDocumentService: StoreDocumentService
  ) {}

  /**
   * Le fichier de démo dans la bibliothèque de la collectivité : retrouvé par
   * son empreinte, téléversé la première fois seulement. Les remplissages
   * suivants rattachent le même fichier, la bibliothèque ne grossit pas.
   *
   * Hors transaction : le stockage n'en fait pas partie, et l'écriture en
   * bibliothèque passe par sa propre connexion.
   */
  async ensureFichier(
    collectiviteId: number,
    fichier: DemoFichier
  ): Promise<Result<BibliothequeFichier, 'DEMO_FICHIER_ERROR'>> {
    let buffer: Buffer;
    try {
      buffer = await readFile(path.join(__dirname, 'assets', fichier.asset));
    } catch (error) {
      // Un build sans la copie des PDF (assets de nest-cli.json).
      this.logger.error(
        `Fichier de démo ${fichier.asset} illisible : ${String(error)}`
      );
      return failure('DEMO_FICHIER_ERROR');
    }
    const hash = calculateDocumentHash(buffer);

    const existant = await this.bibliothequeFichierRepository.findByHash({
      collectiviteId,
      hash,
    });
    if (existant) {
      return success(existant);
    }

    const stored = await this.storeDocumentService.uploadBuffer(
      collectiviteId,
      {
        buffer,
        originalname: fichier.filename,
        mimetype: 'application/pdf',
      },
      false
    );
    if (!stored.success) {
      this.logger.error(
        `Fichier de démo ${fichier.asset} non déposé pour la collectivité ${collectiviteId} : ${stored.error}`
      );
      return failure('DEMO_FICHIER_ERROR');
    }
    return success(stored.data);
  }
}
