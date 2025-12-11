import { FicheWithRelations } from '@tet/domain/plans';
import IndicateursAssocies from './IndicateursAssocies';
import IndicateursHeader from './IndicateursHeader';

type IndicateursViewProps = {
  isReadonly: boolean;
  fiche: FicheWithRelations;
};

export const IndicateursView = (props: IndicateursViewProps) => {
  return (
    <div className="bg-white border border-grey-3 rounded-lg py-7 lg:py-8 xl:py-10 px-5 lg:px-6 xl:px-8 flex flex-col gap-5">
      <IndicateursHeader {...props} />
      <IndicateursAssocies {...props} />
    </div>
  );
};
