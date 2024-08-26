import {Divider} from '@tet/ui';
import {TAxeInsert} from 'types/alias';
import TitreFiche from './TitreFiche';
import CheminsFiche from './CheminsFiche';

type FicheActionHeaderProps = {
  titre: string | null;
  collectiviteId: number;
  axes: TAxeInsert[] | null;
  isReadonly: boolean;
  updateTitle: (value: string | null) => void;
};

const FicheActionHeader = (props: FicheActionHeaderProps) => {
  const {titre, collectiviteId, axes} = props;

  return (
    <div className="w-full mb-4">
      {/* Titre éditable de la fiche action */}
      <TitreFiche {...props} />

      {/* Fils d'ariane avec emplacements de la fiche */}
      <CheminsFiche {...{titre, collectiviteId, axes}} />

      <Divider className="mt-6" />
    </div>
  );
};

export default FicheActionHeader;
