import IndicateurCardEditModal from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCardEdit/IndicateurCardEditModal';
import { TIndicateurListItem } from '@/app/app/pages/collectivite/Indicateurs/types';
import { useListIndicateurPilotes } from '@/app/indicateurs/use-indicateur-pilotes';
import { useListIndicateurServices } from '@/app/indicateurs/use-indicateur-services';
import { useListIndicateurThematiques } from '@/app/indicateurs/use-indicateur-thematiques';
import { OpenState } from '@/ui/utils/types';

type Props = {
  definition: TIndicateurListItem;
  openState: OpenState;
};

const IndicateurCardEdit = ({ definition, openState }: Props) => {
  const { data: pilotes } = useListIndicateurPilotes(definition.id);
  const { data: services } = useListIndicateurServices(definition.id);
  const { data: thematiques } = useListIndicateurThematiques(definition.id);

  return (
    <IndicateurCardEditModal
      indicateurId={definition.id}
      estPerso={definition.estPerso}
      openState={openState}
      pilotes={pilotes}
      services={services ?? []}
      thematiques={thematiques ?? []}
    />
  );
};

export default IndicateurCardEdit;
