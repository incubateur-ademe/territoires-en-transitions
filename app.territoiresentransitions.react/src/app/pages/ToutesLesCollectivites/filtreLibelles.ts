import {
  TNiveauLabellisationFiltreOption,
  TPopulationFiltreOption,
  TRealiseCourantFiltreOption,
  TReferentielFiltreOption,
  TTauxRemplissageFiltreOption,
  TTrierParFiltreOption,
} from 'app/pages/ToutesLesCollectivites/types';
import {TypeCollectiviteCarteRead} from 'generated/dataLayer/collectivite_carte_read';

export type TCollectivitesFilters = {
  types: TypeCollectiviteCarteRead[];
  regions: string[];
  departments: string[];
  population: TPopulationFiltreOption[];
  referentiel: TReferentielFiltreOption[];
  niveauDeLabellisation: TNiveauLabellisationFiltreOption[];
  realiseCourant: TRealiseCourantFiltreOption[];
  tauxDeRemplissage: TTauxRemplissageFiltreOption[];
  trierPar?: TTrierParFiltreOption;
};

export const populationCollectiviteFilterLibelleRecord: Record<
  TPopulationFiltreOption,
  string
> = {
  '0-20000': '0 - 20 000',
  '20000-50000': '20 000 - 50 000',
  '50000-100000': '50 000 - 100 000',
  '100000-200000': '10 0000 - 200 000',
  'plus-de-200000': 'Plus de 200 000',
};

export const realiseCourantCollectiviteFilterLibelleRecord: Record<
  TRealiseCourantFiltreOption,
  string
> = {
  '0-34': '0 à 34 %',
  '35-49': '35 à 49 %',
  '50-64': '50 à 64 %',
  '65-74': '65 à 74 %',
  '75-100': '75 à 100 %',
};

export const tauxRempolissageCollectiviteFilterLibelleRecord: Record<
  TTauxRemplissageFiltreOption,
  string
> = {
  '0': '0 %',
  '1-49': '1 à 49 %',
  '50-79': '50 à 79 %',
  '80-99': '80 à 99 %',
  '100': '100 %',
};

export const niveauLabellisationCollectiviteFilterLibelleRecord: Record<
  TNiveauLabellisationFiltreOption,
  string
> = {
  NL: 'Non labellisé',
  '1': 'Première étoile',
  '2': 'Deuxième étoile',
  '3': 'Troisième étoile',
  '4': 'Quatrième étoile',
  '5': 'Cinquième étoile',
};

export const referentielCollectiviteFilterLibelleRecord: Record<
  TReferentielFiltreOption,
  string
> = {
  eci: 'Économie Circulaire',
  cae: 'Climat Air Énergie',
};

export const trierParFilterLibelleRecord: Record<
  TTrierParFiltreOption,
  string
> = {
  score: '% Réalisé courant',
  completude: 'Taux de remplissage',
  nom: 'Ordre alphabétique',
};

export const libelleRecordToOptions = <T extends string>(
  libelleRecord: Record<T, string>
): {libelle: string; id: T}[] =>
  Object.entries(libelleRecord).map(entry => ({
    id: entry[0] as T,
    libelle: entry[1] as string,
  }));

export const typeCollectiviteFilterLibelleRecord: Record<
  TypeCollectiviteCarteRead,
  string
> = {
  CA: "Communauté d'agglomération",
  CC: 'Communauté de communes',
  CU: 'Communauté urbaine',
  commune: 'Commune',
  EPT: 'Établissement public territorial',
  METRO: 'Métropole',
  PETR: 'Pôle d’équilibre territorial rural',
  syndicat: 'Syndicat',
};
