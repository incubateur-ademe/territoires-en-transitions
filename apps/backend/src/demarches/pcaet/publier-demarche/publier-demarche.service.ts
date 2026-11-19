import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  DemarchePcaetTransitionEnum,
  getDateCivileFrance,
  isDateAdoptionPcaetRecevable,
  type DemarchePcaet,
} from '@tet/domain/demarches';
import { GenerateDemarchePcaetExportsService } from '../exports/generate-exports/generate-demarche-pcaet-exports.service';
import { ArchiverDemarchePcaetService } from '../archiver-demarche/archiver-demarche.service';
import { DemarchePcaetSuivantRepository } from '../shared/demarche-pcaet-suivant.repository';
import { DemarchePcaetTransitionService } from '../shared/demarche-pcaet-transition.service';
import {
  DemarchePcaetActeurEnum,
  DemarchePcaetEventEnum,
} from '../shared/tracking/demarche-pcaet-tracking.constants';
import { daysBetween } from '../shared/tracking/demarche-pcaet-tracking.rules';
import { DemarchePcaetTrackingService } from '../shared/tracking/demarche-pcaet-tracking.service';
import {
  PublierDemarchePcaetError,
  PublierDemarchePcaetErrorEnum,
} from './publier-demarche.errors';
import { PublierDemarchePcaetInput } from './publier-demarche.input';

@Injectable()
export class PublierDemarchePcaetService {
  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly transitionService: DemarchePcaetTransitionService,
    private readonly archiverService: ArchiverDemarchePcaetService,
    private readonly suivantRepository: DemarchePcaetSuivantRepository,
    private readonly generateExportsService: GenerateDemarchePcaetExportsService,
    private readonly trackingService: DemarchePcaetTrackingService
  ) {}

  /**
   * Met le dossier à disposition du public.
   *
   * Effets propres : la date de mise en ligne, que l'interface affiche, et la
   * date de la délibération d'adoption saisie par la collectivité — les deux ne
   * tombent pas le même jour, et c'est l'adoption qui fait foi pour la validité
   * du PCAET. Les classeurs du dossier (plan, indicateurs) sont figés une
   * seconde fois : le diagnostic se rouvre après les avis, l'export figé de la
   * transmission ne vaut plus pour ce qui est publié. Le PCAET précédent,
   * remplacé, est archivé dans la même transaction.
   */
  async publier(
    input: PublierDemarchePcaetInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaet, PublierDemarchePcaetError>> {
    // Une délibération est un acte déjà pris : la dater du futur avancerait le
    // départ des six ans de validité, donc l'échéance de renouvellement que la
    // plateforme surveille. Le `max` de la modale ne défend pas cette
    // invariante — un appel direct à la mutation la contournerait.
    if (
      !isDateAdoptionPcaetRecevable(
        input.dateAdoption,
        getDateCivileFrance(new Date())
      )
    ) {
      return failure(PublierDemarchePcaetErrorEnum.DATE_ADOPTION_FUTURE);
    }

    let nbPrecedentesArchivees = 0;
    // Écrits hors de la base : à retirer si la transaction est annulée, par
    // exemple quand l'archivage du PCAET remplacé échoue après l'export figé.
    let storedPaths: string[] = [];
    const result = await this.transactionManager.executeSingle(
      async (transaction) => {
        await this.suivantRepository.lockSuccession(
          { collectiviteId: input.collectiviteId },
          transaction
        );

        const publication = await this.transitionService.apply(
          input,
          DemarchePcaetTransitionEnum.PUBLIER,
          { user, tx: transaction },
          async ({ demarche, transaction: effectsTransaction }) => {
            // Sans export figé, pas de publication : son échec refuse la
            // transition et annule la transaction.
            const exports = await this.generateExportsService.generate(
              {
                demarche,
                transition: DemarchePcaetTransitionEnum.PUBLIER,
                userId: user.id,
              },
              effectsTransaction
            );
            if (!exports.success) {
              return failure(exports.error, exports.cause);
            }
            storedPaths = exports.data.storedPaths;
            return success({
              publishedAt: new Date().toISOString(),
              adoptedAt: input.dateAdoption,
            });
          }
        );
        if (!publication.success) {
          return publication;
        }

        const archivage = await this.archiverService.archiverRemplacees(
          { collectiviteId: publication.data.collectiviteId },
          { tx: transaction }
        );
        if (!archivage.success) {
          return archivage;
        }

        // Une date d'adoption antérieure à celle d'un PCAET déjà publié fait de
        // ce dépôt le précédent : c'est lui que la passe vient d'archiver.
        const publiee = archivage.data.find(
          (demarche) => demarche.id === publication.data.id
        );
        nbPrecedentesArchivees = archivage.data.filter(
          (demarche) => demarche.id !== publication.data.id
        ).length;
        return success(publiee ?? publication.data);
      },
      tx
    );

    // Le stockage n'est nettoyé qu'une fois la transaction de ce service
    // terminée : il ne doit pas recevoir de `tx` englobant, dont l'échec
    // remonterait en exception (pas de nettoyage) ou dont le rollback
    // surviendrait après coup.
    if (!result.success) {
      await this.generateExportsService.discard(storedPaths);
    } else {
      const demarche = result.data;
      this.trackingService.track(DemarchePcaetEventEnum.PUBLIEE, demarche, {
        userId: user.id,
        acteur: DemarchePcaetActeurEnum.COLLECTIVITE,
        properties: {
          adoptedYear: demarche.adoptedAt
            ? Number(demarche.adoptedAt.slice(0, 4))
            : null,
          joursDepuisCreation: daysBetween(demarche.createdAt),
          joursDepuisTransmission: daysBetween(demarche.transmittedAt),
          joursEntreAdoptionEtPublication: daysBetween(
            demarche.adoptedAt,
            demarche.publishedAt ?? new Date()
          ),
          nbPlans: demarche.planActionIds.length,
          nbPrecedentesArchivees,
          publieeArchivee: demarche.status === 'archive',
        },
      });
    }
    return result;
  }
}
