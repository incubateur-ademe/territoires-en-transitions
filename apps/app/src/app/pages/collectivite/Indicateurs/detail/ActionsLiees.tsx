import { appLabels } from '@/app/labels/catalog';
import ActionPicto from '@/app/ui/pictogrammes/ActionPicto';
import { EmptyCard } from '@tet/ui';
import { MesuresLieesListe } from './mesures-liees.list';

type Props = {
  isReadonly: boolean;
  actionsIds: string[];
};

const ActionsLiees = ({ actionsIds, isReadonly }: Props) => {
  const isEmpty = actionsIds.length === 0;

  if (isEmpty) {
    return (
      <EmptyCard
        picto={(props) => <ActionPicto {...props} />}
        title={appLabels.aucuneMesureLiee}
        size="xs"
      />
    );
  }

  return (
    <div className="bg-white p-10 border border-grey-3 rounded-xl">
      <div className="w-full border-b border-primary-3 mb-6">
        <h6 className="text-lg h-[2.125rem] mb-5">
          {appLabels.mesuresLiees}
        </h6>
      </div>
      <MesuresLieesListe mesuresIds={actionsIds} isReadonly={isReadonly} />
    </div>
  );
};

export default ActionsLiees;
