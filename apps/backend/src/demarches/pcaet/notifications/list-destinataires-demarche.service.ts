import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { CollectiviteContactsRepository } from '../shared/collectivite-contacts.repository';
import { DemarchePcaetPilotesRepository } from '../shared/demarche-pcaet-pilotes.repository';

export type DestinataireDemarche = {
  userId: string;
  email: string;
};

/**
 * À qui la plateforme écrit quand il se passe quelque chose sur une démarche :
 * ses pilotes, et les administrateurs de la collectivité.
 *
 * Les deux, et pas seulement les pilotes : une démarche pilotée par des
 * personnes en tag seul — sans compte, donc injoignables — ne notifierait
 * personne, et l'information se perdrait sans que rien ne le signale.
 */
@Injectable()
export class ListDestinatairesDemarcheService {
  private readonly logger = new Logger(ListDestinatairesDemarcheService.name);

  constructor(
    private readonly pilotesRepository: DemarchePcaetPilotesRepository,
    private readonly collectiviteContactsRepository: CollectiviteContactsRepository
  ) {}

  async list(
    {
      demarcheId,
      collectiviteId,
    }: { demarcheId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<DestinataireDemarche[]> {
    const [pilotes, adminsParCollectivite] = await Promise.all([
      this.pilotesRepository.listPilotesNotifiables(demarcheId, tx),
      this.collectiviteContactsRepository.listContactsParCollectivite(
        [collectiviteId],
        {},
        tx
      ),
    ]);

    const parUserId = new Map<string, DestinataireDemarche>();
    for (const { userId, email } of [
      ...pilotes,
      ...(adminsParCollectivite.get(collectiviteId) ?? []),
    ]) {
      parUserId.set(userId, { userId, email });
    }

    const destinataires = [...parUserId.values()];
    if (destinataires.length === 0) {
      this.logger.warn(
        `Démarche ${demarcheId} : aucun pilote ni administrateur joignable dans la collectivité ${collectiviteId}, personne ne sera notifié`
      );
    }
    return destinataires;
  }
}
