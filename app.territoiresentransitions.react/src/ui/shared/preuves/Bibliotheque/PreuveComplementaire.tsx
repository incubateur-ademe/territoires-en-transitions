import {TPreuveComplementaire} from './types';
import {EditablePreuveDoc} from './PreuveDoc';
import {IdentifiantAction} from './IdentifiantAction';

export type TPreuveComplementaireProps = {
  preuve: TPreuveComplementaire;
  noIdentifiant?: boolean;
};

/** Affiche une preuve complémentaire attachée à une action */
export const PreuveComplementaire = ({
  preuve,
  noIdentifiant,
}: TPreuveComplementaireProps) => {
  const {action} = preuve;

  return (
    <div className="py-4" key={preuve.id}>
      <EditablePreuveDoc preuve={preuve} />
      {noIdentifiant ? null : <IdentifiantAction action={action} />}
    </div>
  );
};
