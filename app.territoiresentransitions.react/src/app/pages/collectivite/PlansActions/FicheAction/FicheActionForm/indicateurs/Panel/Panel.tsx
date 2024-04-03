import {Button} from '@tet/ui';

import {
  usePanelDispatch,
  usePanelState,
} from 'app/pages/collectivite/CollectivitePageLayout/Panel/PanelContext';
import {Indicateur} from 'app/pages/collectivite/Indicateurs/types';
import Content from 'app/pages/collectivite/PlansActions/FicheAction/FicheActionForm/indicateurs/Panel/Content';

type Props = {
  selectedIndicateurs: Indicateur[] | null;
  onSelect: (indicateurs: Indicateur[]) => void;
};

const Panel = ({selectedIndicateurs, onSelect}: Props) => {
  const panelState = usePanelState();
  const panelDispatch = usePanelDispatch();

  // ouvre/ferme un panneau
  const handleTogglePlanel = () => {
    if (panelState.isOpen) {
      panelDispatch({type: 'close'});
    } else {
      panelDispatch({
        type: 'open',
        toolbar: (
          <div className="text-lg font-bold mr-auto ml-6">
            Associer des indicateurs
          </div>
        ),
        content: (
          <Content
            selectedIndicateurs={selectedIndicateurs}
            onSelect={onSelect}
          />
        ),
      });
    }
  };

  return (
    <Button icon="file-add-fill" onClick={handleTogglePlanel} size="sm">
      Associer un indicateur
    </Button>
  );
};

export default Panel;
