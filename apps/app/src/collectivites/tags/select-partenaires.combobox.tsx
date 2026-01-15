import { TagEnum, TagWithCollectiviteId } from '@tet/domain/collectivites';
import { SelectMultipleProps } from '@tet/ui';
import { SelectTagsCombobox } from './select-tags.combobox';
import { usePartenairesListe } from './use-list-partenaires';

type Props = Omit<SelectMultipleProps, 'values' | 'onChange' | 'options'> & {
  values?: number[];
  /**
   * Si spécifié, on récupère les tags de toutes ces collectivités et pas uniquement de la collectivité courante
   */
  collectiviteIds?: number[];
  onChange: ({
    partenaires,
    selectedPartenaire,
  }: {
    partenaires: TagWithCollectiviteId[];
    selectedPartenaire: TagWithCollectiviteId;
  }) => void;
};

const SelectPartenairesCombobox = (props: Props) => {
  const { data, refetch } = usePartenairesListe(props.collectiviteIds);

  return (
    <SelectTagsCombobox
      {...props}
      placeholder={(isEditionAllowed) =>
        `Sélectionner ${isEditionAllowed ? 'ou créer ' : ''}un partenaire`
      }
      tagType={TagEnum.Partenaire}
      optionsListe={data}
      refetchOptions={refetch}
      onChange={({ values, selectedValue }) => {
        props.onChange({
          partenaires: values,
          selectedPartenaire: selectedValue,
        });
      }}
    />
  );
};

export default SelectPartenairesCombobox;
