import { IndicateurReferenceOutput } from '@/app/app/pages/collectivite/Indicateurs/data/use-indicateur-reference';
import { appLabels } from '@/app/labels/catalog';
import { Divider } from '@tet/ui';

type Props = {
  reference: NonNullable<IndicateurReferenceOutput>;
};

export const SubactionIndicateurModalResultats = ({ reference }: Props) => {
  const { cible, seuil } = reference;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span>
          {appLabels.scoreRealise}
          {' :'}
        </span>
        <div className="flex items-center gap-2">
          <span>
            {appLabels.sourceSeuilMin}
            {' : '}
            {seuil ?? '-'}
          </span>
          <Divider orientation="vertical" className="h-4" />
          <span>
            {appLabels.sourceCibleMin}
            {' : '}
            {cible ?? '-'}
          </span>
        </div>
      </div>
      <Divider className="mt-1.5 mb-2" />
      <div className="text-sm">{'TODO'}</div>
    </div>
  );
};
