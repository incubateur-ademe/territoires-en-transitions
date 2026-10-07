import { Injectable } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { Result, success } from '@tet/backend/utils/result.type';
import {
  DemarchePcaetStatusEnum,
  DemarcheTypeEnum,
  instructeurCouvreCollectivite,
  type ContexteInstruction,
} from '@tet/domain/demarches';
import { and, desc, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { DepotPermissionsService } from '../shared/depot-permissions.service';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';
import { perimetreInstructeurColumns } from '../shared/perimetre-instructeur.columns';
import { GetContexteInstructionError } from './get-contexte-instruction.errors';
import { GetContexteInstructionInput } from './get-contexte-instruction.input';

/**
 * « Est-ce que je consulte cette collectivité au titre d'un service qui
 * l'instruit ? »
 *
 * L'agent d'un service n'est pas membre de la collectivité qu'il instruit : son
 * droit d'y entrer découle de la saisine, comme celui d'un auditeur. Ce service
 * ne donne accès à rien, il dit seulement dans quel contexte l'écran se
 * présente ; le dossier reste servi par `getDossierInstruction`, dont il reprend
 * les conditions (membre actif du service saisi, périmètre couvrant).
 *
 * La condition est la saisine, jamais le statut du dossier — `canConsulterDepot`
 * ne le regarde pas non plus, et fermer ici ferait dire « non » à la bannière là
 * où le dossier répond « oui ».
 *
 * Une porte de plus, avant la saisine : un dépôt **en élaboration** n'a saisi
 * personne, et le service qui couvre la collectivité le lit déjà, au titre de
 * son périmètre — aux conditions de `canConsulterDemarche`, reprises ici.
 */
@Injectable()
export class GetContexteInstructionService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly depotPermissionsService: DepotPermissionsService
  ) {}

  async getContexteInstruction(
    input: GetContexteInstructionInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<ContexteInstruction | null, GetContexteInstructionError>> {
    const saisine = await this.findSaisine(input, { user, tx });
    if (saisine) {
      return success(saisine);
    }

    // Une saisine visée qui ne répond pas n'a pas de repli : l'URL désigne un
    // dossier transmis, et le périmètre ne doit pas rouvrir ce que la saisine
    // ferme.
    if (input.demandeAvisId !== undefined) {
      return success(null);
    }

    return success(await this.findElaboration(input, { user, tx }));
  }

  private async findSaisine(
    { collectiviteId, demandeAvisId, demarcheId }: GetContexteInstructionInput,
    { user, tx }: ServiceSecondArg
  ): Promise<ContexteInstruction | null> {
    const deposante = alias(collectiviteTable, 'deposante');
    const instructrice = alias(collectiviteTable, 'instructrice');

    const saisines = await (tx ?? this.databaseService.db)
      .select({
        demandeAvisId: pcaetDemandeAvisTable.id,
        demarcheId: pcaetDemandeAvisTable.demarcheId,
        instructeurCollectiviteId: instructrice.id,
        instructeurNom: instructrice.nom,
        perimetre: pcaetDemandeAvisTable.perimetre,
        // Fournit `instructeurType`, dont dépend la famille du service.
        ...perimetreInstructeurColumns(deposante, instructrice),
      })
      .from(pcaetDemandeAvisTable)
      .innerJoin(
        demarcheTable,
        eq(demarcheTable.id, pcaetDemandeAvisTable.demarcheId)
      )
      .innerJoin(deposante, eq(deposante.id, demarcheTable.collectiviteId))
      .innerJoin(
        instructrice,
        eq(instructrice.id, pcaetDemandeAvisTable.instructeurCollectiviteId)
      )
      // Membre actif du service saisi : c'est l'appartenance au *service* qui
      // vaut, pas celle à la collectivité consultée.
      .innerJoin(
        utilisateurCollectiviteAccessTable,
        and(
          eq(
            utilisateurCollectiviteAccessTable.collectiviteId,
            pcaetDemandeAvisTable.instructeurCollectiviteId
          ),
          eq(utilisateurCollectiviteAccessTable.userId, user.id),
          eq(utilisateurCollectiviteAccessTable.isActive, true)
        )
      )
      .where(
        and(
          eq(demarcheTable.collectiviteId, collectiviteId),
          demandeAvisId === undefined
            ? undefined
            : eq(pcaetDemandeAvisTable.id, demandeAvisId),
          demarcheId === undefined
            ? undefined
            : eq(demarcheTable.id, demarcheId)
        )
      )
      // Plusieurs saisines peuvent répondre — un agent membre de la DREAL et de
      // la DDT, ou une collectivité qui a plusieurs dossiers transmis. Le
      // dossier le plus récemment transmis fait le contexte par défaut, et
      // l'identifiant tranche les ex æquo pour que la réponse ne dépende pas de
      // l'ordre de lecture.
      //
      // Pas de `limit` : le filtre de couverture ci-dessous s'applique en
      // mémoire, et tronquer avant lui rendrait invisible une saisine valide
      // qu'une poignée de saisines hors périmètre auraient précédée. Le nombre
      // de lignes est de toute façon borné par les services dont l'utilisateur
      // est membre, multiplié par les dossiers de cette collectivité.
      .orderBy(
        sql`${demarcheTable.transmittedAt} desc nulls last`,
        desc(pcaetDemandeAvisTable.id)
      );

    // La couverture géographique est rejouée ici plutôt qu'en SQL : la règle est
    // la même que celle qui garde le dossier, et elle se lit dans le domaine.
    // Une saisine posée à la main, ou devenue hors périmètre, ne doit pas
    // ouvrir un contexte que `canConsulterDepot` refuserait ensuite.
    const saisine = saisines.find(instructeurCouvreCollectivite);

    if (!saisine) {
      return null;
    }

    return {
      demandeAvisId: saisine.demandeAvisId,
      demarcheId: saisine.demarcheId,
      instructeur: {
        collectiviteId: saisine.instructeurCollectiviteId,
        nom: saisine.instructeurNom,
        type: saisine.instructeurType,
      },
      // Le périmètre de *cette* saisine, pas une propriété du service : le même
      // agent, sur un autre dossier, obtiendrait l'autre réponse.
      perimetre: saisine.perimetre,
    };
  }

  /**
   * Le dépôt en élaboration de la collectivité, lu au titre du périmètre.
   *
   * Un seul au plus : `demarche_active_unique` interdit deux dossiers actifs par
   * collectivité. Le filtre sur la démarche visée reste, pour la même raison que
   * sur la saisine — l'URL ne doit pas afficher une démarche sous le nom d'une
   * autre collectivité.
   */
  private async findElaboration(
    { collectiviteId, demarcheId }: GetContexteInstructionInput,
    { user, tx }: ServiceSecondArg
  ): Promise<ContexteInstruction | null> {
    const demarches = await (tx ?? this.databaseService.db)
      .select({ id: demarcheTable.id })
      .from(demarcheTable)
      .where(
        and(
          eq(demarcheTable.collectiviteId, collectiviteId),
          eq(demarcheTable.type, DemarcheTypeEnum.PCAET),
          eq(demarcheTable.status, DemarchePcaetStatusEnum.EN_ELABORATION),
          demarcheId === undefined ? undefined : eq(demarcheTable.id, demarcheId)
        )
      )
      .orderBy(desc(demarcheTable.id))
      .limit(1);

    const demarche = demarches[0];
    if (!demarche) {
      return null;
    }

    const [service] = await this.depotPermissionsService.listServicesCouvrants(
      user.id,
      collectiviteId,
      tx
    );
    if (!service) {
      return null;
    }

    return {
      demandeAvisId: null,
      demarcheId: demarche.id,
      instructeur: {
        collectiviteId: service.collectiviteId,
        nom: service.nom,
        type: service.type,
      },
      perimetre: service.perimetre,
    };
  }
}
