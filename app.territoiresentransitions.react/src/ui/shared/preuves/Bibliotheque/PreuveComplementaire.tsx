import {TPreuveComplementaire} from './types';
import {EditablePreuveDoc} from './PreuveDoc';
import {IdentifiantAction} from './IdentifiantAction';

export type TPreuveComplementaireProps = {
  preuve: TPreuveComplementaire;
};

/** Affiche une preuve complémentaire attachée à une action */
export const PreuveComplementaire = ({preuve}: TPreuveComplementaireProps) => {
  const {action} = preuve;

  return (
    <div className="py-4" key={preuve.id}>
      <EditablePreuveDoc preuve={preuve} />
      <IdentifiantAction action={action} />
    </div>
  );
};
