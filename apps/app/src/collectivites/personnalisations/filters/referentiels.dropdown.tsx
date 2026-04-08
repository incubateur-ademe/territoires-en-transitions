import { useReferentielTeEnabled } from '@/app/referentiels/use-referentiel-te-enabled';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { SelectFilter, SelectMultipleProps } from '@tet/ui';
import { getReferentielCollectiviteOptions } from '../../../app/pages/CollectivitesEngagees/data/filtreOptions';

type Props = Omit<SelectMultipleProps, 'values' | 'onChange' | 'options'> & {
  values?: ReferentielId[];
  onChange: (selectedReferentiels: ReferentielId[]) => void;
};

export const ReferentielsDropdown = (props: Props) => {
  const { onChange } = props;
  const referentielTeEnabled = useReferentielTeEnabled();
  const currentCollectivite = useCurrentCollectivite();
  const display = currentCollectivite.collectivitePreferences.referentiels
    .display as Record<string, boolean>;
  const options = getReferentielCollectiviteOptions(
    referentielTeEnabled
  ).filter((option) => display[option.value]);

  return (
    <SelectFilter
      {...props}
      dataTest={props.dataTest ?? 'personnalisation-referentiels'}
      options={options}
      onChange={({ values }) => {
        const selectedReferentiels =
          options
            ?.filter((t) => values?.some((v) => v === t.value))
            .map((t) => t.value as ReferentielId) || [];
        onChange(selectedReferentiels);
      }}
    />
  );
};
