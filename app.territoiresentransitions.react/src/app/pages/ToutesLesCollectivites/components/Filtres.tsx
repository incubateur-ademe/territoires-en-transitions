import {
  niveauLabellisationCollectiviteOptions,
  populationCollectiviteOptions,
  referentielCollectiviteOptions,
  tauxRemplissageCollectiviteOptions,
  typeCollectiviteOptions,
  trierParOptions,
} from 'app/pages/ToutesLesCollectivites/filtreLibelles';
import {MultiSelectCheckboxes} from 'app/pages/ToutesLesCollectivites/components/MultiSelectCheckboxes';
import MultiSelectDropdown from 'ui/shared/select/MultiSelectDropdown';
import {DSFRbuttonClassname} from 'ui/shared/select/commons';
import SelectDropdown from 'ui/shared/select/SelectDropdown';

import {TDepartement} from '../useDepartements';
import {TRegion} from '../useRegions';

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
  <fieldset>
    <label className="font-semibold mb-2 ml-0">Trier par</label>
    <SelectDropdown
      buttonClassName={DSFRbuttonClassname}
      options={trierParOptions}
      onSelect={props.onChange}
      value={props.selected}
    />
  </fieldset>
);

export const RegionFiltre = (props: {
  regions: TRegion[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) => (
  <fieldset>
    <label className="font-semibold mb-2 ml-0">Région</label>
    <MultiSelectDropdown
      dsfrButton
      options={props.regions.map(({code, libelle}) => ({
        value: code,
        label: libelle,
      }))}
      onSelect={props.onChange}
      values={props.selected}
    />
  </fieldset>
);

export const DepartementFiltre = (props: {
  regionCodes: string[];
  departements: TDepartement[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) => {
  return (
    <fieldset>
      <label className="font-semibold mb-2 ml-0">Département</label>
      <MultiSelectDropdown
        dsfrButton
        placeholderText="Sélectionnez un ou plusieurs départements"
        options={props.departements
          .filter(
            dep =>
              props.regionCodes.length === 0 ||
              props.regionCodes.includes(dep.region_code)
          )
          .map(({code, libelle}) => ({value: code, label: libelle}))}
        onSelect={props.onChange}
        values={props.selected}
      />
    </fieldset>
  );
};
