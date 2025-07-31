import {usePanelDispatch, usePanelState} from './PanelContext';
import PanelToolbar from './PanelToolbar';

const Panel = () => {
  const panelState = usePanelState();
  const panelDispatch = usePanelDispatch();

  return (
    <div
      id="collectivite-page-panel-id"
      className={`sticky top-0 h-screen flex flex-col w-full border-x border-x-gray-200 bg-white overflow-hidden`}
    >
      <PanelToolbar
        onClose={() => panelDispatch({type: 'close'})}
        toolbar={panelState.toolbar}
      />
      {/** Panel main */}
      {panelState.content}
    </div>
  );
};

export default Panel;
