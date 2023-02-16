import AutocompleteInputSelect from 'ui/shared/select/AutocompleteInputSelect';
import {TOption} from 'ui/shared/select/commons';
import {useIndicateurListe} from '../data/options/useIndicateurListe';
import {IndicateurGlobal} from '../data/types/indicateurGlobal';

type Props = {
  indicateurs: IndicateurGlobal[] | null;
  onSelect: (indicateurs: IndicateurGlobal[]) => void;
  isReadonly: boolean;
};

const IndicateursDropdown = ({indicateurs, onSelect, isReadonly}: Props) => {
  const {data: indicateurListe} = useIndicateurListe();

  const formatOptions = (indicateurs?: IndicateurGlobal[] | null): TOption[] =>
    indicateurs
      ? indicateurs.map((indicateur: IndicateurGlobal) => ({
          value: indicateur.indicateur_personnalise_id
            ? indicateur.indicateur_personnalise_id.toString()
            : indicateur.indicateur_id!,
          label: indicateur.nom!,
        }))
      : [];

  const formatIndicateurs = (values: string[]) =>
    indicateurListe?.filter((indicateur: IndicateurGlobal) =>
      values.some(
        v =>
          v === indicateur.indicateur_id ||
          v === indicateur.indicateur_personnalise_id?.toString()
      )
    ) ?? [];

  // On invalide la liste des options dans useEditFicheAction
  return (
    <AutocompleteInputSelect
      containerWidthMatchButton
      values={indicateurs?.map((indicateur: IndicateurGlobal) =>
        indicateur.indicateur_personnalise_id
          ? indicateur.indicateur_personnalise_id.toString()
          : indicateur.indicateur_id!
      )}
      options={formatOptions(indicateurListe)}
      onSelect={values => onSelect(formatIndicateurs(values))}
      placeholderText={
        indicateurs && indicateurs?.length > 0
          ? 'Recherchez par mots-clés'
          : 'Recherchez par mots-clés ou sélectionnez dans la liste'
      }
      disabled={isReadonly}
    />
  );
};

export default IndicateursDropdown;
