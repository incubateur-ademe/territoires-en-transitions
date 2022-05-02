/**
 * Affiche le sélecteur de preuves
 */
import {Tabs, Tab} from '@dataesr/react-dsfr';
import {TActionPreuvePanelProps} from '../ActionPreuvePanel/ActionPreuvePanel';
import {AddPreuveLien} from './AddPreuveLien';
import {AddPreuveFichier} from './AddPreuveFichier';
import {AddPreuveFromLib} from './AddPreuveFromLib';
import {useAddPreuveToAction} from './useAddPreuveToAction';

export type TAddPreuveProps = TActionPreuvePanelProps & {
  /** Index de l'onglet actif */
  defaultActiveTab?: number;
  onClose: () => void;
};

export const AddPreuve = (props: TAddPreuveProps) => {
  const {defaultActiveTab, action} = props;
  const {addFileFromLib, addLink} = useAddPreuveToAction(action.id);

  return (
    <Tabs defaultActiveTab={defaultActiveTab}>
      <Tab label="&nbsp;Lien" icon="fr-fi-links-fill">
        <AddPreuveLien {...props} onAddLink={addLink} />
      </Tab>
      <Tab label="&nbsp;Fichier" icon="fr-fi-upload-2-fill">
        <AddPreuveFichier {...props} onAddFileFromLib={addFileFromLib} />
      </Tab>
      <Tab label="&nbsp;Bibliothèque" icon="fr-fi-archive-line">
        <AddPreuveFromLib {...props} onAddFileFromLib={addFileFromLib} />
      </Tab>
    </Tabs>
  );
};
