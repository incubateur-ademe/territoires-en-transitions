import {QueryKey} from 'react-query';

import {Option, OptionValue, SelectMultiple, getFlatOptions} from '@tet/ui';

import {useCollectiviteId} from 'core-logic/hooks/params';
import {Personne} from '../data/types';
import {getPersonneId} from '../data/utils';
import {usePersonneListe} from '../data/options/usePersonneListe';
import {useDeleteTag} from '../data/options/useTagDelete';
import {useTagUpdate} from '../data/options/useTagUpdate';

type Props = {
  personnes: Personne[] | null;
  onChange: (personnes: Personne[] | null) => void;
  keysToInvalidate?: QueryKey[];
  isReadonly?: boolean;
};

const PersonnesPilotes = ({
  keysToInvalidate,
  personnes,
  onChange,
  isReadonly,
}: Props) => {
  const collectivite_id = useCollectiviteId();

  const {data: personneListe} = usePersonneListe();

  const {mutate: updateTag} = useTagUpdate({
    key: ['personnes', collectivite_id],
    tagTableName: 'personne_tag',
    keysToInvalidate,
  });

  const {mutate: deleteTag} = useDeleteTag({
    key: ['personnes', collectivite_id],
    tagTableName: 'personne_tag',
    keysToInvalidate,
  });

  const options: Option[] =
    personneListe?.map(personne => ({
      value: personne.tag_id ? personne.tag_id : personne.user_id!,
      label: personne.nom || '',
    })) ?? [];

  const userCreatedOptions = getFlatOptions(options)
    .filter(o => typeof o.value === 'number')
    .map(o => o.value);

  const formatPilotes = (values?: OptionValue[]) => {
    const pilotes = personneListe?.filter(personne =>
      values?.some(v => v.toString() === getPersonneId(personne))
    );
    return pilotes?.length ? pilotes : null;
  };

  return (
    <SelectMultiple
      data-test="PersonnePilote"
      options={options}
      values={personnes?.map((personne: Personne) =>
        personne.tag_id ? personne.tag_id : personne.user_id!
      )}
      onChange={({values}) => onChange(formatPilotes(values))}
      createProps={{
        userCreatedOptions,
        onUpdate: (tag_id, tag_name) => {
          updateTag({
            collectivite_id: collectivite_id!,
            id: parseInt(tag_id as string),
            nom: tag_name,
          });
        },
        onDelete: tag_id => {
          deleteTag(parseInt(tag_id as string));
          const newPersonnes = personnes?.filter(
            p => p.tag_id !== parseInt(tag_id as string)
          );
          onChange(newPersonnes?.length ? newPersonnes : null);
        },
      }}
      disabled={isReadonly}
    />
  );
};

export default PersonnesPilotes;
