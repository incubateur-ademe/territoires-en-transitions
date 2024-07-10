import {useEffect} from 'react';

import {SelectFilter, SelectMultipleProps} from '@tet/ui';
import {useDeleteTag} from 'ui/dropdownLists/hooks/useTagDelete';
import {useTagUpdate} from 'ui/dropdownLists/hooks/useTagUpdate';
import {useTagCreate} from 'ui/dropdownLists/hooks/useTagCreate';
import {useCollectiviteId} from 'core-logic/hooks/params';

import {useFinanceursListe} from 'ui/dropdownLists/FinanceursDropdown/useFinanceursListe';

type Props = Omit<SelectMultipleProps, 'values' | 'onChange' | 'options'> & {
  values?: number[];
  onChange: ({
    financeurs,
    selectedFinanceur,
  }: {
    financeurs?: number[];
    selectedFinanceur: number;
  }) => void;
  disabledOptionsIds?: number[];
};

/** Sélecteur de financeurs de la collectivité */
const FinanceursDropdown = (props: Props) => {
  const collectivite_id = useCollectiviteId();

  const {data: financeurs} = useFinanceursListe();

  const {mutate: updateTag} = useTagUpdate({
    key: ['financeurs', collectivite_id],
    tagTableName: 'financeur_tag',
  });

  const {mutate: deleteTag} = useDeleteTag({
    key: ['financeurs', collectivite_id],
    tagTableName: 'financeur_tag',
  });

  const {data: newTag, mutate: createTag} = useTagCreate({
    key: ['financeurs', collectivite_id],
    tagTableName: 'financeur_tag',
  });

  const newTagId = newTag?.data?.[0].id;

  /** Utilise useEffect pour récupérer le nouvel id
   * du tag créé afin d'appliquer le onChange */
  useEffect(() => {
    if (newTagId) {
      props.onChange({
        financeurs: props.values ? [newTagId, ...props.values] : [newTagId],
        selectedFinanceur: newTagId,
      });
    }
  }, [newTagId]);

  const options = financeurs
    ? financeurs.map(financeur => ({
        value: financeur.id,
        label: financeur.nom,
      }))
    : [];

  return (
    <SelectFilter
      {...props}
      dataTest={props.dataTest ?? 'financeurs'}
      options={options}
      onChange={({values, selectedValue}) =>
        props.onChange({
          financeurs: values as number[],
          selectedFinanceur: selectedValue as number,
        })
      }
      createProps={{
        userCreatedOptions: options.map(o => o.value),
        onUpdate: (tag_id, tag_name) => {
          updateTag({
            collectivite_id: collectivite_id!,
            id: tag_id as number,
            nom: tag_name,
          });
        },
        onDelete: tag_id => {
          props.onChange({
            financeurs: props.values?.filter(v => v !== tag_id),
            selectedFinanceur: tag_id as number,
          });
          deleteTag(tag_id as number);
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

export default FinanceursDropdown;
