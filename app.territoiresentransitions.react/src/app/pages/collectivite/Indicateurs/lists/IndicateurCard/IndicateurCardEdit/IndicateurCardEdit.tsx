import { useIndicateurPilotes } from '@/app/app/pages/collectivite/Indicateurs/Indicateur/detail/useIndicateurPilotes';
import { useIndicateurServices } from '@/app/app/pages/collectivite/Indicateurs/Indicateur/detail/useIndicateurServices';
import { useIndicateurThematiques } from '@/app/app/pages/collectivite/Indicateurs/Indicateur/detail/useIndicateurThematiques';
import IndicateurCardEditModal from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCardEdit/IndicateurCardEditModal';
import { TIndicateurListItem } from '@/app/app/pages/collectivite/Indicateurs/types';
import { OpenState } from '@/ui/utils/types';

type Props = {
  definition: TIndicateurListItem;
  openState: OpenState;
};

const IndicateurCardEdit = ({ definition, openState }: Props) => {
  const { data: pilotes } = useIndicateurPilotes(definition.id);
  const { data: services } = useIndicateurServices(definition.id);
  const { data: thematiques } = useIndicateurThematiques(definition.id);

  return (
    <IndicateurCardEditModal
      indicateurId={definition.id}
      estPerso={definition.estPerso}
      openState={openState}
      pilotes={pilotes}
      serviceIds={services}
      thematiqueIds={thematiques}
    />
  );
};

export default IndicateurCardEdit;
