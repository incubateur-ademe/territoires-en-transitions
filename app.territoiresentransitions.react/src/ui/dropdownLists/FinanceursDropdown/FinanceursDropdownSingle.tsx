import {Option, OptionValue, Select, SelectMultipleProps} from '@tet/ui';
import {TFinanceurTagInsert} from 'types/alias';
import {useFinanceursListe} from './useFinanceursListe';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useDeleteTag, useTagCreate, useTagUpdate} from '../hooks';
import {useEffect} from 'react';

type FinanceursDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  value: number | undefined;
  disabledOptionsIds?: number[];
  onChange: (value: TFinanceurTagInsert | undefined) => void;
};

const FinanceursDropdown = (props: FinanceursDropdownProps) => {
  const collectiviteId = useCollectiviteId();
  const {data} = useFinanceursListe();

  // Liste d'options pour le select
  const options: Option[] = (data ?? []).map(opt => ({
    value: opt.id,
    label: opt.nom,
    disabled: props.disabledOptionsIds?.includes(opt.id),
  }));

  // Ids des options pour le createProps
  const optionsIds = options.filter(opt => !opt.disabled).map(opt => opt.value);

  // Formattage des valeurs sélectionnées pour les renvoyer au composant parent
  const getSelectedValue = (value?: OptionValue) =>
    (data ?? []).filter(opt => value === opt.id)[0];

  // ***
  // Ajout d'un nouveau tag à la liste d'options
  // ***

  const {data: newTag, mutate: createTag} = useTagCreate({
    key: ['financeurs', collectiviteId],
    tagTableName: 'financeur_tag',
  });

  const handleTagCreate = (tagName: string) => {
    createTag({
      collectivite_id: collectiviteId!,
      nom: tagName,
    });
  };

  useEffect(() => {
    if (newTag?.data) {
      const tag = {
        collectivite_id: collectiviteId!,
        nom: newTag.data[0].nom,
        id: newTag.data[0].id,
      };
      props.onChange(tag);
    }
  }, [JSON.stringify(newTag)]);

  // ***
  // Mise à jour d'un tag de la liste d'options
  // ***

  const {mutate: updateTag} = useTagUpdate({
    key: ['financeurs', collectiviteId],
    tagTableName: 'financeur_tag',
  });

  const handleTagUpdate = (tagId: OptionValue, tagName: string) => {
    updateTag({
      collectivite_id: collectiviteId!,
      id: parseInt(tagId as string),
      nom: tagName,
    });
  };

  // ***
  // Suppression d'un tag de la liste d'options
  // ***

  const {mutate: deleteTag} = useDeleteTag({
    key: ['financeurs', collectiviteId],
    tagTableName: 'financeur_tag',
  });

  const handleTagDelete = (tagId: OptionValue) => {
    props.onChange(undefined);
    deleteTag(parseInt(tagId as string));
  };

  return (
    <Select
      {...props}
      values={props.value}
      options={options}
      onChange={value => props.onChange(getSelectedValue(value))}
      createProps={{
        userCreatedOptions: optionsIds,
        onCreate: handleTagCreate,
        onUpdate: handleTagUpdate,
        onDelete: handleTagDelete,
      }}
    />
  );
};

export default FinanceursDropdown;
