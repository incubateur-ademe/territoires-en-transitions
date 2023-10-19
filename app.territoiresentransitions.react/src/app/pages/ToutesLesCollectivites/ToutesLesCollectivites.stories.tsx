import { Meta} from '@storybook/react';
import {
  RenderToutesLesCollectivites,
  TRenderToutesCollectivitesProps,
} from './ToutesLesCollectivites';
import fixture from './fixture.json';
import type {TCollectivitesFilters} from './filtreLibelles';
import type {RegionRead} from 'generated/dataLayer/region_read';
import type {DepartementRead} from 'generated/dataLayer/departement_read';

export default {
  component: RenderToutesLesCollectivites,
} as Meta;

const emptyFilters: TCollectivitesFilters = {
  types: [],
  regions: [],
  departments: [],
  population: [],
  referentiel: [],
  niveauDeLabellisation: [],
  realiseCourant: [],
  tauxDeRemplissage: [],
};

const fakeRegions: RegionRead[] = [
  {code: '69', libelle: 'Auvergne-Rhône-Alpes'},
  {code: '29', libelle: 'Bretagne'},
  {code: '94', libelle: 'Corse'},
  {code: '11', libelle: 'Île de France'},
  {code: '28', libelle: 'Normandie'},
];

const fakeDepartements: DepartementRead[] = [
  {code: '69', region_code: '69', libelle: 'Auvergne-Rhône-Alpes'},
  {code: '29', region_code: '29', libelle: 'Bretagne'},
  {code: '29', region_code: '29', libelle: 'Corse'},
  {code: '11', region_code: '11', libelle: 'Île de France'},
  {code: '28', region_code: '28', libelle: 'Normandie'},
];

export const AvecDesRésultatsSansFiltres = {
  args: avecDesRésultatsSansFiltresArgs,
};

const avecDesRésultatsSansFiltresArgs: TRenderToutesCollectivitesProps = {
  collectivites: fixture.collectivites,
  collectivitesCount: fixture.collectivites.length,
  filters: emptyFilters,
  setFilters: filters => {
    console.log(filters);
  },
  regions: fakeRegions,
  departements: fakeRegions,
};

const activeFilters: TCollectivitesFilters = {
  types: ['CC', 'CU'],
  regions: ['69'],
  departments: [],
  population: ['100000-200000', 'plus-de-200000'],
  referentiel: ['eci'],
  niveauDeLabellisation: [],
  realiseCourant: ['75-100'],
  tauxDeRemplissage: ['80-99', '100'],
  trierPar: 'score',
};

export const AvecDesRésultatsEtDesFiltres = {
  args: avecDesRésultatsEtDesArgs,
};

const avecDesRésultatsEtDesArgs: TRenderToutesCollectivitesProps = {
  collectivites: fixture.collectivites,
  collectivitesCount: fixture.collectivites.length,
  filters: activeFilters,
  setFilters: filters => {
    console.log(filters);
  },
  regions: fakeRegions,
  departements: fakeRegions,
};

export const SansRésultats = {
  args: sansRésultatsArgs,
};

const sansRésultatsArgs: TRenderToutesCollectivitesProps = {
  collectivites: [],
  collectivitesCount: 0,
  filters: activeFilters,
  setFilters: filters => {
    console.log(filters);
  },
  regions: fakeRegions,
  departements: fakeDepartements,
};
