export * from './fiche-resumes.list/data-access/fiche-action.save';

// Les schémas/typages des modules du tableau de bord personnel vivent désormais
// dans `@tet/domain` (partagés avec le backend tRPC). On les ré-exporte ici pour
// conserver la compatibilité des imports `@tet/api/plan-actions` existants.
export * from '@tet/domain/metrics';
