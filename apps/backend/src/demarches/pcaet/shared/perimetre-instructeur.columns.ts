import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import type { alias } from 'drizzle-orm/pg-core';

/**
 * Un alias de `collectivite`. Le type ne se réduit pas à celui de la table :
 * `alias()` en rend une version enveloppée, d'où la lecture par `ReturnType`.
 */
type CollectiviteAlias = ReturnType<
  typeof alias<typeof collectiviteTable, string>
>;

/**
 * Projection SQL de `PerimetreInstructeurEntree`, la forme que
 * `instructeurCouvreCollectivite` attend pour juger si un service couvre le
 * territoire d'une déposante.
 *
 * Trois requêtes la rejouent : la garde du dossier, celle du rapport rendu par
 * un autre destinataire, et le contexte que la bannière affiche. La sortir ici
 * les tient d'accord avec le type du domaine — y ajouter un code géographique
 * ne doit pas se faire à trois endroits, dont deux qu'on oublierait.
 */
export const perimetreInstructeurColumns = (
  deposante: CollectiviteAlias,
  instructrice: CollectiviteAlias
) => ({
  instructeurType: instructrice.type,
  instructeurRegionCode: instructrice.regionCode,
  instructeurDepartementCode: instructrice.departementCode,
  collectiviteRegionCode: deposante.regionCode,
  collectiviteDepartementCode: deposante.departementCode,
});
