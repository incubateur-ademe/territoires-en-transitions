import { QueryKey } from '@tanstack/react-query';
import { TagWithCollectiviteId } from '@tet/domain/collectivites';
import { SelectMultipleProps } from '@tet/ui';
import SelectTags from '../tags/SelectTags';
import { usePartenairesListe } from './usePartenairesListe';

type PartenairesDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
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
  additionalKeysToInvalidate?: QueryKey[];
};

const PartenairesDropdown = (props: PartenairesDropdownProps) => {
  const { data, refetch } = usePartenairesListe(props.collectiviteIds);

  return (
    <SelectTags
      {...props}
      placeholder={(isEditionAllowed) =>
        `Sélectionner ${isEditionAllowed ? 'ou créer ' : ''}un partenaire`
      }
      queryKey={['partenaires']}
      tagTableName="partenaire_tag"
      additionalKeysToInvalidate={props.additionalKeysToInvalidate}
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

export default PartenairesDropdown;
