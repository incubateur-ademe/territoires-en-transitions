/** Un prototype publié : une route de `app/`, listée sur la page d'accueil. */
export type Prototype = Readonly<{
  slug: string;
  titre: string;
  description: string;
}>;

export const prototypes: ReadonlyArray<Prototype> = [
  {
    slug: 'exemple-liste-plans',
    titre: 'Exemple — liste des plans',
    description:
      'Prototype de référence : une page composée uniquement de composants et de primitives de layout de @tet/ui.',
  },
  {
    slug: 'fiches-budget',
    titre: 'Budget des fiches action',
    description:
      'Importé d’une maquette Claude Design avec /proto-import : chiffres clés et budget consommé par fiche, avec trois propositions.',
  },
  {
    slug: 'fiches-plan',
    titre: 'Fiches d’un plan',
    description:
      'Importé d’une maquette Claude Design avec /proto-import : liste filtrable des fiches d’un plan avec budget, ligne de total et bandeau d’environnement proposés.',
  },
];
