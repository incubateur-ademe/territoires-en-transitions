import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { CloreInstructionService } from '../clore-instruction/clore-instruction.service';
import { NotifyAvisRecuService } from '../notifications/notify-avis-recu/notify-avis-recu.service';
import { DepotPermissionsService } from '../shared/depot-permissions.service';
import { PcaetAvis } from '../shared/models/pcaet-avis.dto';
import { PcaetAvisRepository } from '../shared/pcaet-avis.repository';
import { ValiderAvisError, ValiderAvisErrorEnum } from './valider-avis.errors';
import { ValiderAvisInput } from './valider-avis.input';
import { DemarchePcaetEventEnum } from '../shared/tracking/demarche-pcaet-tracking.constants';
import { DemarchePcaetTrackingService } from '../shared/tracking/demarche-pcaet-tracking.service';

@Injectable()
export class ValiderAvisService {
  private readonly logger = new Logger(ValiderAvisService.name);

  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly depotPermissionsService: DepotPermissionsService,
    private readonly pcaetAvisRepository: PcaetAvisRepository,
    private readonly cloreInstructionService: CloreInstructionService,
    private readonly notifyAvisRecuService: NotifyAvisRecuService,
    private readonly trackingService: DemarchePcaetTrackingService
  ) {}

  /**
   * Valide un avis, et clôt l'instruction si c'était le dernier attendu.
   *
   * La clôture est dans la même transaction que la validation : sinon un
   * dossier pourrait rester « transmis pour avis » alors que tous ses avis sont
   * rendus, jusqu'au passage du planificateur.
   */
  async validerAvis(
    input: ValiderAvisInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<PcaetAvis[], ValiderAvisError>> {
    let onSuccess: (() => void) | undefined;
    const result = await this.transactionManager.executeSingle(
      (transaction) =>
        this.valider(input, {
          user,
          tx: transaction,
          onValidated: (track) => {
            onSuccess = track;
          },
        }),
      tx
    );
    if (result.success) {
      onSuccess?.();
    }
    return result;
  }

  private async valider(
    { demandeAvisId, avisId }: ValiderAvisInput,
    {
      user,
      tx,
      onValidated,
    }: {
      user: ServiceSecondArg['user'];
      tx: Transaction;
      /** Reçoit la capture à émettre, une fois la transaction validée. */
      onValidated: (track: () => void) => void;
    }
  ): Promise<Result<PcaetAvis[], ValiderAvisError>> {
    const permissionResult = await this.depotPermissionsService.canDeposerAvis(
      demandeAvisId,
      { user, tx }
    );
    if (!permissionResult.success) {
      return failure(permissionResult.error);
    }

    const avis = await this.pcaetAvisRepository.findById(
      { demandeAvisId, avisId },
      tx
    );
    if (!avis) {
      return failure(ValiderAvisErrorEnum.AVIS_NOT_FOUND);
    }

    if (avis.fichierRefs.length === 0) {
      return failure(ValiderAvisErrorEnum.AVIS_SANS_PIECE_JOINTE);
    }

    if (avis.valideLe === null) {
      await this.pcaetAvisRepository.valider({ demandeAvisId, avisId }, tx);
      // Sous la garde : une seconde validation ne doit pas renotifier.
      await this.notifyAvisRecuService.creerNotifications(
        { demandeAvisId, avisId, createdBy: user.id },
        tx
      );
      const instructionClose = await this.cloreInstructionSiAchevee(
        demandeAvisId,
        tx
      );
      const contexte = permissionResult.data;
      onValidated(() =>
        this.trackingService.trackInstructeur(
          DemarchePcaetEventEnum.AVIS_VALIDE,
          contexte,
          {
            userId: user.id,
            properties: {
              auTitreDe: avis.auTitreDe,
              nbPieces: avis.fichierRefs.length,
              instructionClose,
            },
          }
        )
      );
    }

    return success(
      await this.pcaetAvisRepository.listByDemande(demandeAvisId, tx)
    );
  }

  /**
   * Le service de clôture décide seul s'il y a lieu de basculer : on l'appelle
   * sans condition plutôt que de dupliquer ici la règle d'achèvement.
   *
   * Un échec n'annule pas la validation de l'avis — l'avis est rendu, c'est un
   * fait ; le planificateur rattrapera la bascule.
   */
  private async cloreInstructionSiAchevee(
    demandeAvisId: number,
    tx: Transaction
  ): Promise<boolean> {
    const cible = await this.pcaetAvisRepository.getDemarcheCible(
      demandeAvisId,
      tx
    );
    if (!cible) {
      return false;
    }

    const result = await this.cloreInstructionService.clore(cible, { tx });
    if (!result.success) {
      this.logger.warn(
        `Avis validé sur la demande ${demandeAvisId}, mais clôture de l'instruction en échec sur la démarche ${cible.demarcheId} : ${result.error}`
      );
      return false;
    }
    if (result.data) {
      this.logger.log(
        `Instruction close sur la démarche PCAET ${cible.demarcheId} : tous les avis attendus sont rendus`
      );
    }
    return result.data !== null;
  }
}
