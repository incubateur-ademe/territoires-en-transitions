import { Injectable } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import {
  instructeurCouvreCollectivite,
  type ContexteInstruction,
} from '@tet/domain/demarches';
import { and, desc, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';
import { GetContexteInstructionInput } from './get-contexte-instruction.input';

/**
 * « Est-ce que je consulte cette collectivité au titre d'un service qui
 * l'instruit ? »
 *
 * C'est ce qui autorise la bascule de contexte : l'agent d'un service n'est pas
 * membre de la collectivité qu'il instruit, son droit d'y entrer découle de la
 * saisine. Même esprit que les auditeurs, qui interviennent sur une collectivité
 * dont ils ne sont pas membres — la source du droit est ailleurs que
 * l'appartenance, et elle est vérifiée ici, côté serveur.
 *
 * Ce service ne donne accès à rien par lui-même : il dit seulement dans quel
 * contexte l'écran doit se présenter. Le contenu du dossier reste servi par
 * `getDossierInstruction`, sous son propre contrôle — dont il reprend, ici, les
 * mêmes conditions (membre actif du service saisi, périmètre couvrant).
 *
 * Aucun mode d'échec, donc aucun `Result` : « cette collectivité n'est pas
 * instruite par toi » est une réponse, `null`.
 */
@Injectable()
export class GetContexteInstructionService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getContexteInstruction(
    { collectiviteId, demandeAvisId }: GetContexteInstructionInput,
    { user, tx }: ServiceSecondArg
  ): Promise<ContexteInstruction | null> {
    const deposante = alias(collectiviteTable, 'deposante');
    const instructrice = alias(collectiviteTable, 'instructrice');

    const saisines = await (tx ?? this.databaseService.db)
      .select({
        demandeAvisId: pcaetDemandeAvisTable.id,
        instructeurCollectiviteId: instructrice.id,
        instructeurNom: instructrice.nom,
        instructeurType: instructrice.type,
        instructeurRegionCode: instructrice.regionCode,
        instructeurDepartementCode: instructrice.departementCode,
        collectiviteRegionCode: deposante.regionCode,
        collectiviteDepartementCode: deposante.departementCode,
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
            : eq(pcaetDemandeAvisTable.id, demandeAvisId)
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
      instructeur: {
        collectiviteId: saisine.instructeurCollectiviteId,
        nom: saisine.instructeurNom,
      },
    };
  }
}
