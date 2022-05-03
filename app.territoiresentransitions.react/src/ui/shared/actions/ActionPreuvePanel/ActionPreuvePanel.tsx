import {PreuveRead} from 'generated/dataLayer/preuve_read';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {useActionPreuve} from 'core-logic/hooks/referentiel';
import {usePreuves} from 'core-logic/hooks/preuve';
import {AddPreuveButton} from 'ui/shared/actions/AddPreuve';
import {DocItem} from 'ui/shared/ResourceManager/DocItem';
import {useEditPreuves} from './useEditPreuves';

export type TActionPreuvePanelProps = {
  action: ActionDefinitionSummary;
};

export type TActionPreuvesProps = {
  action: ActionDefinitionSummary;
  preuves: PreuveRead[];
};

/**
 * Affiche le panneau "preuves" d'une action
 */
export default (props: TActionPreuvePanelProps) => {
  const {action} = props;
  const preuveContent = useActionPreuve(action.id);
  const preuves = usePreuves(action.id);

  return (
    <>
      <p className="text-sm text-grey425">
        Toutes les preuves ajoutées seront visibles par les membres de la
        communauté Territoires en Transitions.
      </p>
      <AddPreuveButton {...props} />
      <ActionPreuves {...props} preuves={preuves} />
      <hr className="mt-4" />
      <h6>Liste des preuves requises pour cette action</h6>
      <div
        className="content"
        dangerouslySetInnerHTML={{__html: preuveContent}}
      />
    </>
  );
};

/**
 * Affiche les fichiers attachés à l'action
 */
const ActionPreuves = ({preuves}: {preuves: PreuveRead[]}) => {
  if (!preuves.length) {
    return null;
  }

  return (
    <div className="mt-2" data-test="ActionPreuves">
      {preuves.map(preuve => (
        <PreuveFichierDetail
          key={preuve.id || preuve.filename}
          preuve={preuve}
        />
      ))}
    </div>
  );
};

/**
 * Affiche un document (nom de fichier ou titre de lien) et gère l'édition de
 * commentaire, la suppression et l'ouverture ou le téléchargement
 */
const PreuveFichierDetail = ({preuve}: {preuve: PreuveRead}) => {
  const handlers = useEditPreuves(preuve);
  return <DocItem doc={preuve} handlers={handlers} />;
};

/**
 * COMMENTER EN ATTENDANT DE POUVOIR LISTER LES LIBELLES DES PREUVES INDIVIDUELLEMENT
 *
 * Affiche le titre d'une preuve et le bouton (i) / dialogue "info" si nécessaire
const ActionPreuveTitle = ({preuve}: {preuve: TActionPreuve}) => {
  const [opened, setOpened] = useState(false);
  const {title, info} = preuve;

  return (
    <>
      <p className="pb-4">
        {title}
        {info ? (
          <i
            className="fr-fi-information-fill text-bf500"
            onClick={() => {
              if (info) {
                setOpened(true);
              }
            }}
          />
        ) : null}
      </p>
      <Dialog
        open={opened}
        onClose={() => setOpened(false)}
        maxWidth="md"
        fullWidth={true}
      >
        <div className="p-7 flex flex-col">
          <h4 className="pb-4">Pièces complémentaires</h4>
          <p>{info} </p>
        </div>
      </Dialog>
    </>
  );
};
 */
