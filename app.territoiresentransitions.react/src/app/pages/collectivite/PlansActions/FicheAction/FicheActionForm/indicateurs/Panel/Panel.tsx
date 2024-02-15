import {Button} from '@tet/ui';

import {
  usePanelDispatch,
  usePanelState,
} from 'app/pages/collectivite/CollectivitePageLayout/Panel/PanelContext';
import Content from 'app/pages/collectivite/PlansActions/FicheAction/FicheActionForm/indicateurs/Panel/Content';

const Panel = () => {
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
        content: <Content />,
      });
    }
  };

  return (
    <Button icon="file-add-fill" onClick={handleTogglePlanel}>
      Associer un indicateur
    </Button>
  );
};

export default Panel;
