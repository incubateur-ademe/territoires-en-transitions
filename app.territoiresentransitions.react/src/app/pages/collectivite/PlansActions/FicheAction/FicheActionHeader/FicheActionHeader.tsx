import {FicheActionVueRow} from '../data/types/ficheActionVue';
import Chemins from './Chemins';

type TFicheActionHeader = {fiche: FicheActionVueRow};

const FicheActionHeader = ({fiche}: TFicheActionHeader) => {
  return (
    <div className="">
      <div className="py-6 flex justify-between">
        <Chemins fiche={fiche} />
        {/** Actions */}
        {/* <div className="flex items-center gap-4">
          <div className="border border-gray-300">
            <button className="p-2">
              <div className="fr-icon-quote-line" />
            </button>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default FicheActionHeader;
