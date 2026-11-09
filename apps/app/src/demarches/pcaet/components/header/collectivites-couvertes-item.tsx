import { appLabels } from '@/app/labels/catalog';
import { MetadataItem } from '@/app/ui/metadata-line';
import type { CollectiviteCouverte } from '@tet/domain/demarches';
import { InfoTooltip } from '@tet/ui';
import { JSX } from 'react';

/** En lecture seule : le périmètre est fixé à la création du dépôt. */
export const CollectivitesCouvertesItem = ({
  collectivitesCouvertes,
}: {
  collectivitesCouvertes: CollectiviteCouverte[];
}): JSX.Element => (
  <MetadataItem
    dataTest="demarches.header.collectivites-couvertes"
    icon="community-line"
    label={appLabels.demarcheHeaderCouvre}
    value={appLabels.demarcheHeaderCouvreValeur(collectivitesCouvertes.length)}
    tooltip={
      <InfoTooltip
        label={
          <ul className="m-0 pl-4">
            {collectivitesCouvertes.map(({ id, nom }) => (
              <li key={id}>{nom}</li>
            ))}
          </ul>
        }
      />
    }
  />
);
