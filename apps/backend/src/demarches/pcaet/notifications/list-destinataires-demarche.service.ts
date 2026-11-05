import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { collectiviteTypeEnum } from '@tet/domain/collectivites';
import { isDgec, PcaetPerimetreSaisineEnum } from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { CollectiviteContactsRepository } from '../shared/collectivite-contacts.repository';
import { DemarchePcaetPilotesRepository } from '../shared/demarche-pcaet-pilotes.repository';
import {
  PcaetInstructeursRepository,
  type DemandeAvisDestinataire,
} from '../shared/pcaet-instructeurs.repository';

export type DestinataireDemarche = {
  userId: string;
  email: string;
};

/** Un agent d'un service en copie, avec la saisine qui mène à son dossier. */
export type DestinataireEnCopie = DestinataireDemarche & {
  demandeAvisId: number;
};

/**
 * Les services que la collectivité met en copie de ses notifications :
 *
 * - `dreal` — la DREAL du siège, qui suit l'instruction pour le préfet. Une
 *   DREAL limitrophe ne lit le dossier que pour information : elle n'est pas en
 *   copie.
 * - `dgec` — la DGEC, seul service national à suivre les dossiers. L'ADEME
 *   nationale, saisie elle aussi, n'est jamais en copie.
 */
export type ServiceEnCopie = 'dreal' | 'dgec';

const estServiceEnCopie = (
  demande: DemandeAvisDestinataire,
  services: readonly ServiceEnCopie[]
): boolean =>
  (services.includes('dreal') &&
    demande.type === collectiviteTypeEnum.DREAL &&
    demande.perimetre === PcaetPerimetreSaisineEnum.PRINCIPAL) ||
  (services.includes('dgec') && isDgec(demande));

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
    private readonly collectiviteContactsRepository: CollectiviteContactsRepository,
    private readonly instructeursRepository: PcaetInstructeursRepository
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

  /**
   * Les agents des services en copie d'une notification adressée à la
   * collectivité, tous rôles confondus — comme à la transmission.
   *
   * `exclureCollectiviteId` écarte le service à l'origine de l'évènement : la
   * DREAL n'a pas à être prévenue de l'avis qu'elle vient de valider.
   */
  async listEnCopie(
    {
      demarcheId,
      services,
      exclureCollectiviteId,
    }: {
      demarcheId: number;
      services: readonly ServiceEnCopie[];
      exclureCollectiviteId?: number;
    },
    tx?: Transaction
  ): Promise<DestinataireEnCopie[]> {
    const demandes = (
      await this.instructeursRepository.listDemandesAvisDuDossier(
        demarcheId,
        tx
      )
    ).filter(
      (demande) =>
        demande.collectiviteId !== exclureCollectiviteId &&
        estServiceEnCopie(demande, services)
    );
    if (demandes.length === 0) {
      return [];
    }

    const contactsParService =
      await this.collectiviteContactsRepository.listContactsParCollectivite(
        demandes.map(({ collectiviteId }) => collectiviteId),
        { roles: Object.values(CollectiviteRole) },
        tx
      );

    const parUserId = new Map<string, DestinataireEnCopie>();
    for (const demande of demandes) {
      for (const { userId, email } of contactsParService.get(
        demande.collectiviteId
      ) ?? []) {
        if (!parUserId.has(userId)) {
          parUserId.set(userId, {
            userId,
            email,
            demandeAvisId: demande.demandeAvisId,
          });
        }
      }
    }
    return [...parUserId.values()];
  }
}
