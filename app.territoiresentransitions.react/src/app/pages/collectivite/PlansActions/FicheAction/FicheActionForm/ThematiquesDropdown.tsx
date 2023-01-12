import {TOption} from 'ui/shared/select/commons';
import MultiSelectTagsDropdown from 'ui/shared/select/MultiSelectTagsDropdown';
import {useThematiqueListe} from '../data/options/useThematiqueListe';
import {TThematiqueRow} from '../data/types/alias';
import {selectButtonClassNames} from './FicheActionForm';

type Props = {
  thematiques: TThematiqueRow[] | null;
  onSelect: (thematique: TThematiqueRow[]) => void;
};

const ThematiquesDropdown = ({thematiques, onSelect}: Props) => {
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
      buttonClassName={selectButtonClassNames}
      values={thematiques?.map((t: TThematiqueRow) => t.thematique)}
      options={options}
      onSelect={values => onSelect(formatThematiques(values))}
    />
  );
};

export default ThematiquesDropdown;
