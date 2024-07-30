import {FicheAction} from '../../FicheAction/data/types';
import IndicateursHeader from './IndicateursHeader';
import IndicateursListe from './IndicateursListe';

type IndicateursTabProps = {
  isReadonly: boolean;
  fiche: FicheAction;
  updateFiche: (fiche: FicheAction) => void;
};

const IndicateursTab = ({updateFiche, ...props}: IndicateursTabProps) => {
  return (
    <div className="bg-white border border-grey-3 rounded-lg py-7 lg:py-8 xl:py-10 px-5 lg:px-6 xl:px-8 flex flex-col gap-5">
      <IndicateursHeader {...props} updateFiche={updateFiche} />
      <IndicateursListe {...props} />
    </div>
  );
};

export default IndicateursTab;
