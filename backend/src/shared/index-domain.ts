// `index-domain.ts` file must only contain exports that are shareable with client-side apps.
// Exports from this file can be imported with `@/domain/*` alias path.

export * from './models/banatic-competence.table';
export * from './models/categorie-fnv.table';
export * from '@/backend/shared/effet-attendu/effet-attendu.table';
export * from './thematiques/sous-thematique.table';
export * from './models/temps-de-mise-en-oeuvre.table';
export * from './thematiques/thematique.table';
