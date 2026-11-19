import { appLabels } from '@/app/labels/catalog';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { Fragment, type JSX } from 'react';

type Props = {
  ancestors: IndicateurDetaille['ancestors'];
  titre: string;
};

export const IndicateurCardTitre = ({
  ancestors,
  titre,
}: Props): JSX.Element => (
  <>
    {ancestors.map((ancestor) => (
      <Fragment key={ancestor.id}>
        <span className="font-normal text-grey-7">{ancestor.titre}</span>
        <span className="font-normal text-grey-7">
          {` ${appLabels.indicateurSeparateurAncetres} `}
        </span>
      </Fragment>
    ))}
    {titre}
  </>
);
