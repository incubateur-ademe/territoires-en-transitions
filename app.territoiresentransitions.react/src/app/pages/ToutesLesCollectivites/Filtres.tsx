import {
  niveauLabellisationCollectiviteFilterLibelleRecord,
  populationCollectiviteFilterLibelleRecord,
  referentielCollectiviteFilterLibelleRecord,
  tauxRempolissageCollectiviteFilterLibelleRecord as tauxRemplissageCollectiviteFilterLibelleRecord,
  libelleRecordToOptions,
  typeCollectiviteFilterLibelleRecord,
  trierParFilterLibelleRecord,
} from 'app/pages/ToutesLesCollectivites/filtreLibelles';
import {MultiSelectCheckboxes} from 'app/pages/ToutesLesCollectivites/MultiSelectCheckboxes';
import {MultiSelectDropdown} from 'app/pages/ToutesLesCollectivites/MultiSelectDropdown';
import {SelectDropdown} from 'app/pages/ToutesLesCollectivites/SelectDropdown';
import {
  TNiveauLabellisationFiltreOption,
  TPopulationFiltreOption,
  TReferentielFiltreOption,
  TTauxRemplissageFiltreOption,
  TTrierParFiltreOption,
  TTypeFiltreOption,
} from 'app/pages/ToutesLesCollectivites/types';
import {RegionRead} from 'generated/dataLayer/region_read';

export const TypeCollectiviteFiltre = (props: {
  selected: TTypeFiltreOption[];
  onChange: (selected: TTypeFiltreOption[]) => void;
}) => (
  <MultiSelectCheckboxes
    title="Type de collectivité"
    options={libelleRecordToOptions(typeCollectiviteFilterLibelleRecord)}
    onChange={props.onChange}
    selected={props.selected}
  />
);

export const PopulationCollectiviteFiltre = (props: {
  selected: TPopulationFiltreOption[];
  onChange: (selected: TPopulationFiltreOption[]) => void;
}) => (
  <MultiSelectCheckboxes
    title="Population"
    options={libelleRecordToOptions(populationCollectiviteFilterLibelleRecord)}
    onChange={props.onChange}
    selected={props.selected}
  />
);

export const ReferentielCollectiviteFiltre = (props: {
  selected: TReferentielFiltreOption[];
  onChange: (selected: TReferentielFiltreOption[]) => void;
}) => (
  <MultiSelectCheckboxes
    title="Réferentiel"
    options={libelleRecordToOptions(referentielCollectiviteFilterLibelleRecord)}
    onChange={props.onChange}
    selected={props.selected}
  />
);

export const NiveauDeLabellisationCollectiviteFiltre = (props: {
  selected: TNiveauLabellisationFiltreOption[];
  onChange: (selected: TNiveauLabellisationFiltreOption[]) => void;
}) => (
  <MultiSelectCheckboxes
    title="Niveau de labellisation"
    options={libelleRecordToOptions(
      niveauLabellisationCollectiviteFilterLibelleRecord
    )}
    onChange={props.onChange}
    selected={props.selected}
  />
);

export const TauxRemplissageCollectiviteFiltre = (props: {
  selected: TTauxRemplissageFiltreOption[];
  onChange: (selected: TTauxRemplissageFiltreOption[]) => void;
}) => (
  <MultiSelectCheckboxes
    title="Taux de remplissage"
    options={libelleRecordToOptions(
      tauxRemplissageCollectiviteFilterLibelleRecord
    )}
    onChange={props.onChange}
    selected={props.selected}
  />
);

export const TrierParFiltre = (props: {
  selected?: TTrierParFiltreOption;
  onChange: (selected?: TTrierParFiltreOption) => void;
}) => (
  <SelectDropdown
    title="Trier par"
    options={libelleRecordToOptions(trierParFilterLibelleRecord)}
    onChange={props.onChange}
    selected={props.selected}
  />
);

export const RegionFiltre = (props: {
  regions: RegionRead[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) => (
  <MultiSelectDropdown
    title="Région"
    options={props.regions.map(({code, libelle}) => ({id: code, libelle}))}
    onChange={props.onChange}
    selected={props.selected}
  />
);

export const DepartementFiltre = (props: {
  departements: RegionRead[]; // todo : DepartementRead
  selected: string[];
  onChange: (selected: string[]) => void;
}) => (
  <MultiSelectDropdown
    title="Département"
    options={props.departements.map(({code, libelle}) => ({id: code, libelle}))}
    onChange={props.onChange}
    selected={props.selected}
  />
);
