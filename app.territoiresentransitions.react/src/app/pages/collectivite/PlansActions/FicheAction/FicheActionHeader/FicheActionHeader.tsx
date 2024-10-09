import { Axe } from '@tet/api/plan-actions';
import { Divider } from '@tet/ui';
import CheminsFiche from './CheminsFiche';
import TitreFiche from './TitreFiche';

type FicheActionHeaderProps = {
  titre: string | null;
  collectiviteId: number;
  axes: Axe[] | null;
  isReadonly: boolean;
  updateTitle: (value: string | null) => void;
};

const FicheActionHeader = (props: FicheActionHeaderProps) => {
  const { titre, collectiviteId, axes } = props;

  return (
    <div className="w-full mb-4" data-test="fiche-header">
      {/* Titre éditable de la fiche action */}
      <TitreFiche {...props} />

      {/* Fils d'ariane avec emplacements de la fiche */}
      <CheminsFiche {...{ titre, collectiviteId, axes }} />

      <Divider className="mt-6" />
    </div>
  );
};

export default FicheActionHeader;
