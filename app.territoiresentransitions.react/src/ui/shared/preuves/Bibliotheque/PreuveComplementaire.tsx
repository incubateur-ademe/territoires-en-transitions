import {TPreuveComplementaire} from './types';
import PreuveDoc from './PreuveDoc';
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
    <div className="flex flex-row gap-8 pt-2 pb-4">
      <div className="flex flex-1 flex-col">
        <PreuveDoc preuve={preuve} />
        {noIdentifiant ? null : <IdentifiantAction action={action} />}
      </div>
      <div className="flex flex-1 flex-col" />
    </div>
  );
};
