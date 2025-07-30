import { useCurrentCollectivite } from '@/api/collectivites';
import { TActionDef } from '@/app/referentiels/preuves/usePreuves';
import SelectDropdown from '@/app/ui/shared/select/SelectDropdown';
import { Button, Modal } from '@/ui';
import { useState } from 'react';
import { useSubActionOptionsListe } from '../use-sub-action-definitions';
import { AddPreuveModal } from './AddPreuveModal';
import { useAddPreuveComplementaireToAction } from './useAddPreuveToAction';

export type TAddPreuveButtonProps = {
  /** Identifiant de l'action concernée */
  action: TActionDef;
  /** indique si la preuve doit être associée à une sous-action */
  addToSubAction?: boolean;
};

/**
 * Affiche un bouton permettant d'ouvrir le sélecteur de fichiers pour ajouter
 * une preuve complémentaire à une action
 */
export const AddPreuveComplementaire = (props: TAddPreuveButtonProps) => {
  const [opened, setOpened] = useState(false);

  // détermine si on est dans le cas de l'ajout depuis l'onglet Preuves de
  // l'action dans ce cas il est nécessaire d'extraire l'identifiant de l'action
  // et de demander à laquelle de ses sous-actions doit être associée la preuve
  // complémentaire
  const { action, addToSubAction } = props;
  const [subaction_id, setSubaction] = useState('');
  const selectSubActionIsRequired = addToSubAction && !subaction_id;

  const handlers = useAddPreuveComplementaireToAction(
    addToSubAction ? subaction_id : action.id
  );

  const currentCollectivite = useCurrentCollectivite();
  if (!currentCollectivite || currentCollectivite.isReadOnly) {
    return null;
  }

  const onClose = () => {
    setOpened(false);
    // quand on ferme le dialogue il faut aussi réinitialiser la sous-action
    // sélectionnée pour que le sélecteur ré-apparaisse bien lors de la
    // prochaine ouverture
    setSubaction('');
  };

  // on désactive (avec le flag `disableDismiss`) la fermeture lors du clic en
  // en dehors de la modale, car sinon la sélection dans le dropdown ferme le
  // dialogue !
  // TODO: fixer l'ordre des floaters (j'imagine que c'est possible) pour éviter cela ?
  return (
    <Modal
      size="lg"
      openState={{ isOpen: opened, setIsOpen: setOpened }}
      disableDismiss={selectSubActionIsRequired}
      title="Ajouter un document complémentaire"
      render={() => {
        return selectSubActionIsRequired ? (
          <SelectSubAction
            action={action}
            subaction_id={subaction_id}
            setSubaction={setSubaction}
          />
        ) : (
          <AddPreuveModal
            docType="complementaire"
            onClose={onClose}
            handlers={handlers}
          />
        );
      }}
    >
      <Button
        dataTest="AddPreuveComplementaire"
        title="Ajouter un document complémentaire"
        size="xs"
        icon="file-add-line"
        className="leading-none"
        onClick={() => setOpened(true)}
      />
    </Modal>
  );
};

/** Affiche le sélecteur de sous-action */
const SelectSubAction = ({
  action,
  subaction_id,
  setSubaction,
}: {
  action: TActionDef;
  subaction_id: string;
  setSubaction: (value: string) => void;
}) => {
  const options = useSubActionOptionsListe(action);

  return (
    <fieldset className="fr-fieldset h-52">
      <label className="fr-label mb-2">
        Sous-action associée (obligatoire)
      </label>
      <SelectDropdown
        data-test="SelectSubAction"
        placeholderText="Sélectionnez une option"
        value={subaction_id}
        options={options}
        onSelect={(value) => {
          setSubaction(value);
        }}
      />
    </fieldset>
  );
};
