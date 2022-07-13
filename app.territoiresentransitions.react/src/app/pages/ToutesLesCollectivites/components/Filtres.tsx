import {
  niveauLabellisationCollectiviteOptions,
  populationCollectiviteOptions,
  referentielCollectiviteOptions,
  tauxRemplissageCollectiviteOptions,
  typeCollectiviteOptions,
  trierParOptions,
} from 'app/pages/ToutesLesCollectivites/filtreLibelles';
import {MultiSelectCheckboxes} from 'app/pages/ToutesLesCollectivites/components/MultiSelectCheckboxes';
import {MultiSelectDropdown} from 'app/pages/ToutesLesCollectivites/components/MultiSelectDropdown';
import {SelectDropdown} from 'app/pages/ToutesLesCollectivites/components/SelectDropdown';

import {RegionRead} from 'generated/dataLayer/region_read';
import {DepartementRead} from 'generated/dataLayer/departement_read';

export const TypeCollectiviteFiltre = (props: {
  selected: string[];
  onChange: (selected: string[]) => void;
}) => (
  <MultiSelectCheckboxes
    htmlId="tc"
    title="Type de collectivité"
    options={typeCollectiviteOptions}
    onChange={props.onChange}
    selected={props.selected}
  />
);

export const PopulationCollectiviteFiltre = (props: {
  selected: string[];
  onChange: (selected: string[]) => void;
}) => (
  <MultiSelectCheckboxes
    htmlId="pop"
    title="Population"
    options={populationCollectiviteOptions}
    onChange={props.onChange}
    selected={props.selected}
  />
);

export const ReferentielCollectiviteFiltre = (props: {
  selected: string[];
  onChange: (selected: string[]) => void;
}) => (
  <MultiSelectCheckboxes
    htmlId="ref"
    title="Référentiel"
    options={referentielCollectiviteOptions}
    onChange={props.onChange}
    selected={props.selected}
  />
);

export const NiveauDeLabellisationCollectiviteFiltre = (props: {
  selected: string[];
  onChange: (selected: string[]) => void;
}) => (
  <MultiSelectCheckboxes
    htmlId="nx"
    title="Niveau de labellisation"
    options={niveauLabellisationCollectiviteOptions}
    onChange={props.onChange}
    selected={props.selected}
  />
);

export const TauxRemplissageCollectiviteFiltre = (props: {
  selected: string[];
  onChange: (selected: string[]) => void;
}) => (
  <MultiSelectCheckboxes
    htmlId="tx"
    title="Taux de remplissage"
    options={tauxRemplissageCollectiviteOptions}
    onChange={props.onChange}
    selected={props.selected}
  />
);

export const TrierParFiltre = (props: {
  selected?: string;
  onChange: (selected?: string) => void;
}) => (
  <SelectDropdown
    title="Trier par"
    options={trierParOptions}
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
  regionCodes: string[];
  departements: DepartementRead[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) => {
  return (
    <MultiSelectDropdown
      title="Département"
      options={props.departements
        .filter(
          dep =>
            props.regionCodes.length === 0 ||
            props.regionCodes.includes(dep.region_code)
        )
        .map(({code, libelle}) => ({id: code, libelle}))}
      onChange={props.onChange}
      selected={props.selected}
    />
  );
};
