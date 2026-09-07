import { collectivitePerimetreSecondaireTable } from '@tet/backend/collectivites/shared/models/collectivite-perimetre-secondaire.table';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { getTableName, inArray, SQL, sql } from 'drizzle-orm';
import type { alias, PgColumn } from 'drizzle-orm/pg-core';

/**
 * Un alias de `collectivite`. Le type ne se réduit pas à celui de la table :
 * `alias()` en rend une version enveloppée, d'où la lecture par `ReturnType`.
 */
type CollectiviteAlias = ReturnType<
  typeof alias<typeof collectiviteTable, string>
>;

/**
 * La table elle-même ou l'un de ses alias : `perimetreCodesSql` se lit aussi
 * bien dans une requête à une seule collectivité que dans une jointure
 * déposante/instructrice.
 */
type CollectiviteSource = typeof collectiviteTable | CollectiviteAlias;

type MaillePerimetre = 'region' | 'departement';

/**
 * `table.colonne`, écrit en entier.
 *
 * Drizzle rend une colonne **sans** son préfixe de table dans un template
 * `sql`. Inoffensif sur une requête à une table, piégeux dès qu'une autre entre
 * en scène : `where "collectivite_id" = "id"` se lit alors entièrement dans
 * `collectivite_perimetre_secondaire`, qui a justement les deux colonnes — la
 * jointure devient une comparaison d'une table avec elle-même, toujours fausse,
 * et les périmètres secondaires disparaissent sans une ligne d'erreur.
 */
const qualifie = (colonne: PgColumn): SQL =>
  sql`${sql.identifier(getTableName(colonne.table))}.${sql.identifier(
    colonne.name
  )}`;

/**
 * Tous les codes géographiques d'une collectivité à une maille donnée : le
 * principal, porté par `collectivite`, et les secondaires, portés par
 * `collectivite_perimetre_secondaire`.
 *
 * Une DR ADEME peut piloter deux régions, un EPCI chevaucher plusieurs
 * départements : comparer les seuls codes de `collectivite` laisserait de côté
 * une partie du territoire réellement couvert.
 *
 * Le `where code is not null` rend une liste vide plutôt qu'une liste d'un
 * `null` : `instructeurCouvreCollectivite` lit une liste vide comme « aucun
 * territoire », qui ne croise jamais rien.
 */
export const perimetreCodesSql = (
  collectivite: CollectiviteSource,
  maille: MaillePerimetre
): SQL<string[]> => {
  const principal = qualifie(
    maille === 'region' ? collectivite.regionCode : collectivite.departementCode
  );
  const secondaire = qualifie(
    maille === 'region'
      ? collectivitePerimetreSecondaireTable.regionCode
      : collectivitePerimetreSecondaireTable.departementCode
  );

  return sql<string[]>`coalesce((
    select array_agg(codes.code)
    from (
      select ${principal} as code
      union all
      select ${secondaire}
      from ${collectivitePerimetreSecondaireTable}
      where ${qualifie(
        collectivitePerimetreSecondaireTable.collectiviteId
      )} = ${qualifie(collectivite.id)}
    ) as codes
    where codes.code is not null
  ), '{}')`;
};

/**
 * « Cette collectivité couvre-t-elle l'un de ces territoires ? », en SQL.
 *
 * Le pendant filtrant de `perimetreCodesSql` : là où celui-ci ramène les codes
 * pour que le domaine tranche, celui-ci tranche dans la requête, quand il faut
 * écarter des lignes plutôt que les qualifier.
 *
 * Les deux orientations s'écrivent avec : dire quels services couvrent une
 * déposante (`cible` = le service, `codes` = ceux de la déposante), et dire
 * quelles déposantes un service couvre (l'inverse). Le `exists` est ce qui
 * empêche d'oublier un périmètre secondaire — sans lui, la DR ADEME Océan
 * Indien, qui n'a qu'une ligne pour La Réunion et Mayotte, ne verrait jamais la
 * seconde.
 *
 * Une liste de codes vide n'a pas de sens ici : l'appelant doit avoir renoncé
 * avant, un territoire absent ne se compare à rien.
 */
export const couvreLesCodesSql = (
  cible: CollectiviteSource,
  maille: MaillePerimetre,
  codes: readonly string[]
): SQL => {
  const principal = qualifie(
    maille === 'region' ? cible.regionCode : cible.departementCode
  );
  const secondaire = qualifie(
    maille === 'region'
      ? collectivitePerimetreSecondaireTable.regionCode
      : collectivitePerimetreSecondaireTable.departementCode
  );

  return sql`(
    ${inArray(principal, codes as string[])}
    or exists (
      select 1
      from ${collectivitePerimetreSecondaireTable}
      where ${qualifie(
        collectivitePerimetreSecondaireTable.collectiviteId
      )} = ${qualifie(cible.id)}
        and ${inArray(secondaire, codes as string[])}
    )
  )`;
};

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
  instructeurRegionCodes: perimetreCodesSql(instructrice, 'region'),
  instructeurDepartementCodes: perimetreCodesSql(instructrice, 'departement'),
  collectiviteRegionCodes: perimetreCodesSql(deposante, 'region'),
  collectiviteDepartementCodes: perimetreCodesSql(deposante, 'departement'),
});
