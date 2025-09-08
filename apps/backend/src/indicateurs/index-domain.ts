// `index-domain.ts` file must only contain exports that are shareable with client-side apps.
// Exports from this file can be imported with `@/domain/*` alias path.

export * from './definitions/handle-definition-services/indicateur-service-tag.table';
export * from './definitions/indicateur-definition.table';
export * from './definitions/list-definitions/list-definitions.input';
export * from './definitions/list-definitions/list-definitions.output';
export * from './shared/models/indicateur-source-metadonnee.table';
export * from './shared/models/indicateur-source.table';
export * from './trajectoires/calcul-trajectoire.request';
export * from './trajectoires/calcul-trajectoire.response';
export * from './trajectoires/trajectoire-secteurs.enum';
export * from './trajectoires/verification-trajectoire.request';
export * from './trajectoires/verification-trajectoire.response';
export * from './valeurs/indicateur-valeur.table';
export * from './valeurs/valeurs.constants';
