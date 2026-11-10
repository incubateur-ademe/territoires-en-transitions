import { Injectable, Logger } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  DemarchePcaetStatusEnum,
  getTitresAvisInstructeur,
  PcaetPerimetreSaisineEnum,
} from '@tet/domain/demarches';
import { CloreInstructionService } from '../clore-instruction/clore-instruction.service';
import { DemarchePcaetRefRepository } from '../shared/demarche-pcaet-ref.repository';
import { PcaetAvisRepository } from '../shared/pcaet-avis.repository';
import { PcaetInstructeursRepository } from '../shared/pcaet-instructeurs.repository';
import {
  DEMO_RAPPORT_INSTRUCTION,
  DemarchePcaetDemoFichiersService,
} from './demarche-pcaet-demo-fichiers.service';
import { DemarchePcaetDemoRepository } from './demarche-pcaet-demo.repository';
import { DemarchePcaetDemoService } from './demarche-pcaet-demo.service';
import {
  DemarchePcaetDemoErrorEnum,
  type DemarchePcaetDemoError,
} from './demo.errors';
import type { SimulerInstructionDemoInput } from './demo.input';

/**
 * Raccourcis d'instruction du mode démo, sur un dossier transmis : les avis
 * arrivent, ou le délai tombe. La bascule vers la finalisation reste celle du
 * vrai workflow (`CloreInstructionService`), seuls ses déclencheurs sont
 * simulés.
 */
@Injectable()
export class SimulerInstructionDemoService {
  private readonly logger = new Logger(SimulerInstructionDemoService.name);

  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly demoService: DemarchePcaetDemoService,
    private readonly fichiersService: DemarchePcaetDemoFichiersService,
    private readonly refRepository: DemarchePcaetRefRepository,
    private readonly instructeursRepository: PcaetInstructeursRepository,
    private readonly avisRepository: PcaetAvisRepository,
    private readonly demoRepository: DemarchePcaetDemoRepository,
    private readonly cloreInstructionService: CloreInstructionService
  ) {}

  /**
   * Chaque service saisi qui se prononce rend un avis validé, au titre dont il
   * répond, avec le rapport d'instruction de démo pour pièce. La dernière
   * validation clôt l'instruction, comme en vrai.
   */
  async simulerAvis(
    input: SimulerInstructionDemoInput,
    { user }: ServiceSecondArg
  ): Promise<Result<undefined, DemarchePcaetDemoError>> {
    const check = await this.checkTransmis(input, user);
    if (!check.success) {
      return check;
    }

    const demandes = (
      await this.instructeursRepository.listDemandesAvisDuDossier(
        input.demarcheId
      )
    ).filter(
      (demande) =>
        demande.perimetre === PcaetPerimetreSaisineEnum.PRINCIPAL &&
        getTitresAvisInstructeur(demande.type).length > 0
    );

    // Le rapport est un fichier de l'émetteur : il est rangé dans la
    // bibliothèque du service, hors transaction.
    const rapports = new Map<number, string>();
    for (const demande of demandes) {
      const fichier = await this.fichiersService.ensureFichier(
        demande.collectiviteId,
        DEMO_RAPPORT_INSTRUCTION
      );
      if (!fichier.success) {
        return failure(DemarchePcaetDemoErrorEnum.DEMO_FICHIER_ERROR);
      }
      rapports.set(demande.demandeAvisId, fichier.data.hash);
    }

    return this.transactionManager.executeSingle(async (tx) => {
      for (const demande of demandes) {
        const hash = rapports.get(demande.demandeAvisId);
        if (hash === undefined) {
          continue;
        }
        for (const auTitreDe of getTitresAvisInstructeur(demande.type)) {
          const existant = await this.avisRepository.findByTitre(
            demande.demandeAvisId,
            auTitreDe,
            tx
          );
          if (existant?.valideLe) {
            continue;
          }
          const fichierRefs = [hash] as Parameters<
            PcaetAvisRepository['upsert']
          >[0]['fichierRefs'];
          await this.avisRepository.upsert(
            {
              demandeAvisId: demande.demandeAvisId,
              emetteurCollectiviteId: demande.collectiviteId,
              auTitreDe,
              fichierRefs,
              deposePar: user.id,
            },
            tx
          );
          await this.avisRepository.marquerPiecesConfidentielles(
            { emetteurCollectiviteId: demande.collectiviteId, fichierRefs },
            tx
          );
          const avis = await this.avisRepository.findByTitre(
            demande.demandeAvisId,
            auTitreDe,
            tx
          );
          if (avis) {
            await this.avisRepository.valider(
              { demandeAvisId: demande.demandeAvisId, avisId: avis.id },
              tx
            );
          }
        }
      }

      return this.clore(input, user, tx);
    });
  }

  /**
   * « Réputé favorable » : faute d'avis dans le délai légal, l'avis est réputé
   * rendu. On fait tomber l'échéance à maintenant et la clôture constate le
   * délai échu.
   */
  async reputerFavorable(
    input: SimulerInstructionDemoInput,
    { user }: ServiceSecondArg
  ): Promise<Result<undefined, DemarchePcaetDemoError>> {
    const check = await this.checkTransmis(input, user);
    if (!check.success) {
      return check;
    }

    return this.transactionManager.executeSingle(async (tx) => {
      await this.demoRepository.echoirDelaiAvis(input, tx);
      return this.clore(input, user, tx);
    });
  }

  private async checkTransmis(
    input: SimulerInstructionDemoInput,
    user: AuthenticatedUser
  ): Promise<Result<undefined, DemarchePcaetDemoError>> {
    if (!(await this.demoService.isDemo(user, input.collectiviteId))) {
      return failure(DemarchePcaetDemoErrorEnum.DEMO_NON_ACTIVE);
    }
    const demarche = await this.refRepository.findRef(input);
    if (!demarche) {
      return failure(DemarchePcaetDemoErrorEnum.DEMARCHE_PCAET_NOT_FOUND);
    }
    if (demarche.status !== DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS) {
      return failure(DemarchePcaetDemoErrorEnum.STATUT_INCOMPATIBLE);
    }
    return success(undefined);
  }

  private async clore(
    input: SimulerInstructionDemoInput,
    user: AuthenticatedUser,
    tx: Transaction
  ): Promise<Result<undefined, DemarchePcaetDemoError>> {
    const result = await this.cloreInstructionService.clore(input, { tx });
    if (!result.success || result.data === null) {
      this.logger.error(
        `Mode démo : l'instruction de la démarche PCAET ${
          input.demarcheId
        } ne s'est pas close (${
          result.success ? 'aucune transition armée' : result.error
        })`
      );
      return failure(DemarchePcaetDemoErrorEnum.DEMO_ECRITURE_ERROR);
    }
    this.logger.log(
      `Mode démo : instruction close sur la démarche PCAET ${input.demarcheId} par ${user.id}`
    );
    return success(undefined);
  }
}
