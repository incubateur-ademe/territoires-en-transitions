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
    slug: 'card',
    titre: 'Carte fiche action',
    description:
      'Importé d’une maquette Claude Design avec /proto-import : carte d’une fiche action (statut, priorité, avancement, pilote, échéance, budget, indicateurs, étiquettes), composée uniquement avec @tet/ui.',
  },
];
