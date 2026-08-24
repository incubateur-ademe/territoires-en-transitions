import { appLabels } from '@/app/labels/catalog';
import { NOTES_OPTIONS } from './options';
import { FilterKeys } from './types';

export type LookupConfig = {
  items: any[] | undefined;
  key: string;
  valueKey: string;
  fallbackLabel?: string;
};

type LookupItems = LookupConfig['items'];

type LookupSources = {
  plans: LookupItems;
  personneOptions: LookupItems;
  services: LookupItems;
  thematiques: LookupItems;
  financeurs: LookupItems;
  structures: LookupItems;
  partenaires: LookupItems;
  libreTags: LookupItems;
  instanceGouvernanceTags: LookupItems;
};

const toPersonneLookup = (personneOptions: LookupItems): LookupConfig => ({
  items: personneOptions,
  key: 'value',
  valueKey: 'label',
  fallbackLabel: appLabels.personneInconnue,
});

export const buildLookupConfig = ({
  plans,
  personneOptions,
  services,
  thematiques,
  financeurs,
  structures,
  partenaires,
  libreTags,
  instanceGouvernanceTags,
}: LookupSources): Partial<Record<FilterKeys, LookupConfig>> => ({
  planActionIds: {
    items: plans,
    key: 'id',
    valueKey: 'nom',
    fallbackLabel: appLabels.sansTitre,
  },
  utilisateurPiloteIds: toPersonneLookup(personneOptions),
  utilisateurReferentIds: toPersonneLookup(personneOptions),
  personnePiloteIds: toPersonneLookup(personneOptions),
  personneReferenteIds: toPersonneLookup(personneOptions),
  servicePiloteIds: {
    items: services,
    key: 'id',
    valueKey: 'nom',
  },
  thematiqueIds: {
    items: thematiques,
    key: 'id',
    valueKey: 'nom',
  },
  financeurIds: {
    items: financeurs,
    key: 'id',
    valueKey: 'nom',
  },
  structurePiloteIds: {
    items: structures,
    key: 'id',
    valueKey: 'nom',
  },
  partenaireIds: {
    items: partenaires,
    key: 'id',
    valueKey: 'nom',
  },
  libreTagsIds: {
    items: libreTags,
    key: 'id',
    valueKey: 'nom',
  },
  instanceGouvernanceIds: {
    items: instanceGouvernanceTags,
    key: 'id',
    valueKey: 'nom',
  },
  notes: {
    items: NOTES_OPTIONS,
    key: 'value',
    valueKey: 'label',
  },
});
