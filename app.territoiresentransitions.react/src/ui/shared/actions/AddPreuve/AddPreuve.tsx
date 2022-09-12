/**
 * Affiche le sélecteur de preuves
 */
import {TActionPreuvePanelProps} from '../ActionPreuvePanel/ActionPreuvePanel';
import {useAddPreuveToAction} from './useAddPreuveToAction';
import {AddPreuveModal} from 'ui/shared/preuves/AddPreuveModal';

export type TAddPreuveProps = TActionPreuvePanelProps & {
  /** Index de l'onglet actif */
  defaultActiveTab?: number;
  onClose: () => void;
};

export const AddPreuve = (props: TAddPreuveProps) => {
  const {action, defaultActiveTab, onClose} = props;
  const handlers = useAddPreuveToAction(action.id);

  return (
    <AddPreuveModal
      defaultActiveTab={defaultActiveTab}
      onClose={onClose}
      handlers={handlers}
    />
  );
};
