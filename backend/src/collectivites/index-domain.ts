// `index-domain.ts` file must only contain exports that are shareable with client-side apps.
// Exports from this file can be imported with `@/domain/*` alias path.

export * from './shared/models/categorie-tag.table';
export * from './shared/models/collectivite-test.table';
export * from './shared/models/collectivite.table';
export * from './shared/models/commune.table';
export * from './shared/models/epci.table';
export * from './shared/models/financeur-tag.table';
export * from './shared/models/libre-tag.table';
export * from './shared/models/partenaire-tag.table';
export * from './shared/models/personne-tag.table';
export * from './shared/models/service-tag.table';
export * from './shared/models/structure-tag.table';
export * from './shared/models/tag.table-base';
export * from './tableau-de-bord/collectivite-default-module-keys.schema';
export * from './tableau-de-bord/collectivite-module-type.schema';
export * from './tableau-de-bord/collectivite-module.schema';
export * from './tableau-de-bord/module-fiche-action-count-by.schema';
export * from './tableau-de-bord/module-plan-action-list.schema';
export * from './tableau-de-bord/tableau-de-bord-module.table';
