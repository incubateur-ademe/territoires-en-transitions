import {useCollectiviteId} from 'core-logic/hooks/params';
import {TPartenaireRow} from 'types/alias';
import {useTagUpdate} from 'ui/dropdownLists/hooks/useTagUpdate';
import {useDeleteTag} from 'ui/dropdownLists/hooks/useTagDelete';
import {usePartenaireListe} from './usePartenaireListe';
import {Option, OptionValue, SelectFilter, SelectMultipleProps} from '@tet/ui';
import {useTagCreate} from '../hooks/useTagCreate';
import {useEffect} from 'react';

type PartenairesDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values?: number[];
  onChange: ({
    partenaires,
    selectedPartenaire,
  }: {
    partenaires: TPartenaireRow[];
    selectedPartenaire: TPartenaireRow;
  }) => void;
};

const PartenairesDropdown = (props: PartenairesDropdownProps) => {
  const collectivite_id = useCollectiviteId();

  const {data: partenaireListe} = usePartenaireListe();

  const options: Option[] = partenaireListe
    ? partenaireListe.map(partenaire => ({
        value: partenaire.id,
        label: partenaire.nom,
      }))
    : [];

  const getSelectedPartenaires = (values?: OptionValue[]) =>
    (partenaireListe ?? []).filter(p => values?.some(v => v === p.id));

  const {mutate: updateTag} = useTagUpdate({
    key: ['partenaires', collectivite_id],
    tagTableName: 'partenaire_tag',
  });

  const {mutate: deleteTag} = useDeleteTag({
    key: ['partenaires', collectivite_id],
    tagTableName: 'partenaire_tag',
  });

  const {data: newTag, mutate: createTag} = useTagCreate({
    key: ['partenaires', collectivite_id],
    tagTableName: 'partenaire_tag',
  });

  const newTagId = newTag?.data?.[0].id!;

  /** Utilise useEffect pour récupérer le nouvel id
   * du tag créé afin d'appliquer le onChange */
  useEffect(() => {
    if (newTag?.data) {
      const tag = {
        collectivite_id: collectivite_id!,
        nom: newTag.data[0].nom,
        id: newTagId,
      };

      props.onChange({
        partenaires: [tag, ...getSelectedPartenaires(props.values)],
        selectedPartenaire: tag,
      });
    }
  }, [newTagId]);

  return (
    <SelectFilter
      {...props}
      dataTest={props.dataTest}
      options={options}
      placeholder={props.placeholder ?? 'Sélectionnez ou créez un partenaire'}
      onChange={({values, selectedValue}) =>
        props.onChange({
          partenaires: getSelectedPartenaires(values),
          selectedPartenaire: getSelectedPartenaires([selectedValue])[0],
        })
      }
      createProps={{
        userCreatedOptions: partenaireListe?.map(p => p.id) ?? [],
        onUpdate: (tag_id, tag_name) => {
          updateTag({
            collectivite_id: collectivite_id!,
            id: parseInt(tag_id as string),
            nom: tag_name,
          });
        },
        onDelete: tag_id => {
          props.onChange({
            partenaires: getSelectedPartenaires(
              props.values?.filter(v => v !== tag_id)
            ),
            selectedPartenaire: getSelectedPartenaires(
              props.values?.filter(v => v === tag_id)
            )[0],
          });
          deleteTag(parseInt(tag_id as string));
        },
        onCreate: inputValue =>
          createTag({
            collectivite_id: collectivite_id!,
            nom: inputValue,
          }),
      }}
    />
  );
};

export default PartenairesDropdown;
