import { useActionPilotesList } from '@/app/referentiels/actions/use-action-pilotes';
import { useActionServicesPilotesList } from '@/app/referentiels/actions/use-action-services-pilotes';
import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { OpenState } from '@/ui/utils/types';

type Props = {
  actionId: string;
  openState: OpenState;
};

const Infos = ({ actionId, openState }: Props) => {
  const { data: pilotes } = useActionPilotesList(actionId);
  const { data: services } = useActionServicesPilotesList(actionId);

  const hasPilotes = pilotes && pilotes.length > 0;
  const hasServices = services && services.length > 0;

  return (
    (hasPilotes || hasServices) && (
      <div className="flex gap-4">
        {hasPilotes && (
          <div className="px-4 border-x border-primary-3">
            <ListWithTooltip
              title="Pilotes"
              list={pilotes.map((p) =>
                p.tagId ? p.nom ?? '' : `${p.prenom} ${p.nom}`
              )}
              icon="user-line"
              hoveringColor="grey"
              onClick={() => openState.setIsOpen(true)}
            />
          </div>
        )}
        {hasServices && (
          <div className="pr-4">
            <ListWithTooltip
              title="Direction ou service pilote"
              list={services.map((s) => s.nom ?? '')}
              icon="leaf-line"
              hoveringColor="grey"
              onClick={() => openState.setIsOpen(true)}
            />
          </div>
        )}
      </div>
    )
  );
};

export default Infos;
