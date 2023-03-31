import {DSFRbuttonClassname, TOption} from 'ui/shared/select/commons';
import MultiSelectTagsDropdown from 'ui/shared/select/MultiSelectTagsDropdown';
import {useThematiqueListe} from '../data/options/useThematiqueListe';
import {TThematiqueRow} from 'types/alias';

type Props = {
  thematiques: TThematiqueRow[] | null;
  onSelect: (thematique: TThematiqueRow[]) => void;
  isReadonly: boolean;
};

const ThematiquesDropdown = ({thematiques, onSelect, isReadonly}: Props) => {
  const {data: thematiqueListe} = useThematiqueListe();

  const options: TOption[] = thematiqueListe
    ? thematiqueListe.map(thematique => ({
        value: thematique.thematique,
        label: thematique.thematique,
      }))
    : [];

  const formatThematiques = (values: string[]) =>
    thematiqueListe?.filter(thematique =>
      values.some(v => v === thematique.thematique)
    ) ?? [];

  // On invalide la liste des options dans useEditFicheAction

  return (
    <MultiSelectTagsDropdown
      buttonClassName={DSFRbuttonClassname}
      values={thematiques?.map((t: TThematiqueRow) => t.thematique)}
      options={options}
      onSelect={values => onSelect(formatThematiques(values))}
      disabled={isReadonly}
    />
  );
};

export default ThematiquesDropdown;
