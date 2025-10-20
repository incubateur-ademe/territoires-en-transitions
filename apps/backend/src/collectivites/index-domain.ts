// `index-domain.ts` file must only contain exports that are shareable with client-side apps.
// Exports from this file can be imported with `@/domain/*` alias path.

export * from './collectivites/collectivites.fixture';
export * from './membres/export-connect.table';
export * from './shared/models/collectivite-banatic-type.table';
export * from './shared/models/collectivite-bucket.table';
export * from './shared/models/collectivite.table';
export * from './shared/models/id-name.schema';
export * from './shared/models/personne-tag-or-user.dto';
export * from './tableau-de-bord/collectivite-default-module-keys.schema';
export * from './tableau-de-bord/collectivite-module-type.schema';
export * from './tableau-de-bord/collectivite-module.schema';
export * from './tableau-de-bord/module-fiche-action-count-by.schema';
export * from './tableau-de-bord/module-plan-action-list.schema';
export * from './tableau-de-bord/tableau-de-bord-module.table';
export * from './tags/categorie-tag.table';
export * from './tags/financeur-tag.table';
export * from './tags/libre-tag.table';
export * from './tags/partenaire-tag.table';
export * from './tags/personnes/personne-tag.table';
export * from './tags/service-tag.table';
export * from './tags/structure-tag.table';
export * from './tags/tag.table-base';
