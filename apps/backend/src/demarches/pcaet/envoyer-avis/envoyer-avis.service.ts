import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '@tet/backend/utils/email/email.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { render } from '@react-email/components';
import { ListDemandesAvisRepository } from '../list-demandes-avis/list-demandes-avis.repository';
import { DepotPermissionsService } from '../shared/depot-permissions.service';
import { PcaetAvis } from '../shared/models/pcaet-avis.dto';
import { PcaetAvisRepository } from '../shared/pcaet-avis.repository';
import { EnvoyerAvisEmail } from './envoyer-avis.email';
import {
  EnvoyerAvisError,
  EnvoyerAvisErrorEnum,
} from './envoyer-avis.errors';
import { EnvoyerAvisInput } from './envoyer-avis.input';

@Injectable()
export class EnvoyerAvisService {
  private readonly logger = new Logger(EnvoyerAvisService.name);

  constructor(
    private readonly depotPermissionsService: DepotPermissionsService,
    private readonly pcaetAvisRepository: PcaetAvisRepository,
    private readonly listDemandesAvisRepository: ListDemandesAvisRepository,
    private readonly emailService: EmailService
  ) {}

  async envoyerAvis(
    { demandeAvisId, avisId, objet, message }: EnvoyerAvisInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<PcaetAvis[], EnvoyerAvisError>> {
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
      return failure(EnvoyerAvisErrorEnum.AVIS_NOT_FOUND);
    }

    if (avis.valideLe === null) {
      return failure(EnvoyerAvisErrorEnum.AVIS_NON_VALIDE);
    }

    const deposanteCollectiviteId =
      await this.pcaetAvisRepository.getDeposanteCollectiviteId(
        demandeAvisId,
        tx
      );
    if (deposanteCollectiviteId === null) {
      return failure(EnvoyerAvisErrorEnum.DEMANDE_AVIS_NOT_FOUND);
    }

    const contacts =
      (
        await this.listDemandesAvisRepository.listContactsParCollectivite(
          [deposanteCollectiviteId],
          tx
        )
      ).get(deposanteCollectiviteId) ?? [];
    if (contacts.length === 0) {
      return failure(EnvoyerAvisErrorEnum.REFERENT_INTROUVABLE);
    }

    const html = await render(EnvoyerAvisEmail({ message }));

    for (const contact of contacts) {
      const sendResult = await this.emailService.sendEmail({
        to: contact.email,
        subject: objet,
        html,
      });
      if (!sendResult.success) {
        this.logger.error(
          `Échec envoi de l'avis ${avisId} à ${contact.email}: ${sendResult.error.errorMessage}`
        );
        return failure(EnvoyerAvisErrorEnum.ENVOI_ECHEC);
      }
    }

    await this.pcaetAvisRepository.marquerEnvoye({ demandeAvisId, avisId }, tx);

    return success(
      await this.pcaetAvisRepository.listByDemande(demandeAvisId, tx)
    );
  }
}
