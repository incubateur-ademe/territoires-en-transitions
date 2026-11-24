type SurfaceColumn = { readonly output: string; readonly source: string }

type SurfaceOutput =
  | 'cropland_ha'
  | 'wooded_grassland_ha'
  | 'herbaceous_grassland_ha'
  | 'shrub_grassland_ha'
  | 'wetland_ha'
  | 'artificial_shrub_ha'
  | 'artificial_impervious_ha'
  | 'artificial_wooded_ha'
  | 'forest_mixed_ha'
  | 'forest_broadleaf_ha'
  | 'forest_conifer_ha'
  | 'forest_poplar_ha'

type FactorColumn = {
  readonly output: string
  readonly sources: readonly string[]
  readonly weight: SurfaceOutput
}

// Source : ALDO, jeu « stocks de carbone - communes » (data.ademe.fr/datasets/aldo-stocks-de-carbone) ; PlanET V1, onglet FC_COS : surfaces des types de sol de l'équation 27 ; « sols artificialisé enherbé » est lu comme « sols artificiels arbustifs » d'ALDO (choix de conception, non validé)
const SURFACE_COLUMNS: readonly (SurfaceColumn & { readonly output: SurfaceOutput })[] = [
  { output: 'cropland_ha', source: 'cultures_surface_ha' },
  { output: 'wooded_grassland_ha', source: 'prairies zones arborées_surface_ha' },
  { output: 'herbaceous_grassland_ha', source: 'prairies zones herbacées_surface_ha' },
  { output: 'shrub_grassland_ha', source: 'prairies zones arbustives_surface_ha' },
  { output: 'wetland_ha', source: 'zones humides_surface_ha' },
  { output: 'artificial_shrub_ha', source: 'sols artificiels arbustifs_surface_ha' },
  { output: 'artificial_impervious_ha', source: 'sols artificiels imperméabilisés_surface_ha' },
  { output: 'artificial_wooded_ha', source: 'sols artificiels arborés et buissonants_surface_ha' },
  { output: 'forest_mixed_ha', source: 'forêt mixte_surface_ha' },
  { output: 'forest_broadleaf_ha', source: 'forêt feuillu_surface_ha' },
  { output: 'forest_conifer_ha', source: 'forêt conifere_surface_ha' },
  { output: 'forest_poplar_ha', source: 'forêt peupleraie_surface_ha' },
]

// Source : ALDO Flux 2 : les trois types de prairie « zones arborées », « zones herbacées » et « zones arbustives » ; la documentation fonctionnelle (p. 74) n'en nomme qu'une, « prairie » : choix de conception, non validé, de les prendre toutes au prorata de leur surface (PlanET V1, onglet COS, B15 : « au prorata des surfaces existantes »)
const GRASSLANDS = [
  { output: 'wooded_grassland', label: 'prairies zones arborées' },
  { output: 'herbaceous_grassland', label: 'prairies zones herbacées' },
  { output: 'shrub_grassland', label: 'prairies zones arbustives' },
] as const

// Source : documentation fonctionnelle PlanET (juin 2026), p. 74 : forêt mixte, peupleraie, feuillue et conifère ; noms des colonnes ALDO Flux 2
const FORESTS = [
  { output: 'forest_mixed', label: 'forêt mixte' },
  { output: 'forest_broadleaf', label: 'forêt feuillu' },
  { output: 'forest_conifer', label: 'forêt conifere' },
  { output: 'forest_poplar', label: 'forêt peupleraie' },
] as const

// Source : ALDO Flux 2, suffixe des colonnes de flux : tCO2e par hectare
const FLUX_UNIT = 'tCO2e_ha-1'

function fluxColumn({
  from,
  to,
  reservoir,
}: {
  from: string
  to: string
  reservoir: string
}): string {
  return `${from}_vers_${to}_${reservoir}_${FLUX_UNIT}`
}

// Source : ALDO Flux 2 (data.ademe.fr/datasets/flux2-epci) ; PlanET V1, onglet FC_COS : les réservoirs sol, biomasse et litière (forêt) s'additionnent ; une colonne absente du jeu (cultures et prairies herbacées vers zones humides, biomasse) n'a pas de flux
const FACTOR_COLUMNS: readonly FactorColumn[] = [
  ...GRASSLANDS.flatMap((grassland) =>
    FORESTS.map((forest) => ({
      output: `${grassland.output}_to_${forest.output}`,
      sources: ['sol', 'litiere'].map((reservoir) =>
        fluxColumn({ from: grassland.label, to: forest.label, reservoir }),
      ),
      weight: `${grassland.output}_ha` as const,
    })),
  ),
  {
    output: 'cropland_to_wetland',
    sources: [fluxColumn({ from: 'cultures', to: 'zones humides', reservoir: 'sol' })],
    weight: 'cropland_ha',
  },
  {
    output: 'wooded_grassland_to_wetland',
    sources: ['sol', 'biomasse'].map((reservoir) =>
      fluxColumn({ from: 'prairies zones arborées', to: 'zones humides', reservoir }),
    ),
    weight: 'wooded_grassland_ha',
  },
  {
    output: 'herbaceous_grassland_to_wetland',
    sources: [fluxColumn({ from: 'prairies zones herbacées', to: 'zones humides', reservoir: 'sol' })],
    weight: 'herbaceous_grassland_ha',
  },
  {
    output: 'shrub_grassland_to_wetland',
    sources: ['sol', 'biomasse'].map((reservoir) =>
      fluxColumn({ from: 'prairies zones arbustives', to: 'zones humides', reservoir }),
    ),
    weight: 'shrub_grassland_ha',
  },
  {
    output: 'impervious_to_artificial_shrub',
    sources: ['sol', 'biomasse'].map((reservoir) =>
      fluxColumn({
        from: 'sols artificiels imperméabilisés',
        to: 'sols artificiels arbustifs',
        reservoir,
      }),
    ),
    weight: 'artificial_impervious_ha',
  },
  {
    output: 'impervious_to_artificial_wooded',
    sources: ['sol', 'biomasse'].map((reservoir) =>
      fluxColumn({
        from: 'sols artificiels imperméabilisés',
        to: 'sols artificiels arborés et buissonants',
        reservoir,
      }),
    ),
    weight: 'artificial_impervious_ha',
  },
]

export { FACTOR_COLUMNS, SURFACE_COLUMNS }
export type { FactorColumn, SurfaceColumn, SurfaceOutput }
