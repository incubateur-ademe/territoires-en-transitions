import IndicateursHeader from './IndicateursHeader';
import IndicateursAssocies from './IndicateursAssocies';
import { FicheAction } from '@tet/api/plan-actions';

type IndicateursTabProps = {
  isReadonly: boolean;
  isFicheLoading: boolean;
  fiche: FicheAction;
  updateFiche: (fiche: FicheAction) => void;
};

const IndicateursTab = (props: IndicateursTabProps) => {
  return (
    <div className="bg-white border border-grey-3 rounded-lg py-7 lg:py-8 xl:py-10 px-5 lg:px-6 xl:px-8 flex flex-col gap-5">
      <IndicateursHeader {...props} />
      <IndicateursAssocies {...props} />
    </div>
  );
};

export default IndicateursTab;
