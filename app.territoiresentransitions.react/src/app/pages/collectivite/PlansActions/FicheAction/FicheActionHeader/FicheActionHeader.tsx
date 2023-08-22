import {FicheAction} from '../data/types';
import {useExportFicheAction} from '../data/useExportFicheAction';
import Chemins from './Chemins';

type TFicheActionHeader = {
  fiche: FicheAction;
  isReadonly?: boolean;
};

const FicheActionHeader = ({fiche, isReadonly}: TFicheActionHeader) => {
  const {mutate: exportFiche, isLoading} = useExportFicheAction(fiche.id);
  return (
    <div className="py-6 flex justify-between">
      <Chemins fiche={fiche} />
      {!isReadonly && (
        <button
          className="fr-btn fr-btn--tertiary fr-btn--sm fr-icon-download-line"
          disabled={isLoading}
          title="Exporter cette fiche"
          onClick={() => exportFiche('docx')}
        />
      )}
    </div>
  );
};

export default FicheActionHeader;
