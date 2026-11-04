import { appLabels } from '@/app/labels/catalog';
import { SujetDemandeEnum } from '@tet/domain/referentiels';
import { Checkbox } from '@tet/ui';
import { ReactNode } from 'react';
import { SujetCotVise } from '../sujet-vise';

const SujetCotViseField = ({
  value,
  onChange,
}: {
  value: SujetCotVise;
  onChange: (sujet: SujetCotVise) => void;
}): ReactNode => (
  <Checkbox
    variant="switch"
    label={appLabels.demandeAvecLabellisation}
    labelClassname="font-medium"
    checked={value === SujetDemandeEnum.LABELLISATION_COT}
    onChange={(event) =>
      onChange(
        event.target.checked
          ? SujetDemandeEnum.LABELLISATION_COT
          : SujetDemandeEnum.COT
      )
    }
  />
);

export { SujetCotViseField };
