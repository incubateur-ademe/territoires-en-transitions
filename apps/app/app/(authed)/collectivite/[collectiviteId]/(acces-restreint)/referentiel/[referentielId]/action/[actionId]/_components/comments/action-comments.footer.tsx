import { useCollectiviteId } from '@/api/collectivites/collectivite-context/collectivite-provider.no-ssr';
import { Select } from '@/ui';
import { useState } from 'react';
import ActionCommentInput from './action-comments.input';
import { useAddDiscussion } from './hooks/useAddDiscussion';

type Props = {
  mesureList: { actionId: string; identifiant: string; nom: string }[];
};

const ActionCommentFooter = ({ mesureList }: Props) => {
  const [selectedMesure, setSelectedMesure] = useState(mesureList[0].actionId);

  const collectiviteId = useCollectiviteId();

  const { mutate: handleAddDiscussion } = useAddDiscussion();

  const handleSave = (message: string) => {
    handleAddDiscussion({
      message,
      collectiviteId: collectiviteId,
      actionId: selectedMesure,
    });
  };

  return (
    <div data-test="ActionCommentFooter" className="flex flex-col gap-2">
      <Select
        options={mesureList.map((mesure) => ({
          label: `${mesure.identifiant} ${mesure.nom}`,
          value: mesure.actionId,
        }))}
        values={selectedMesure}
        onChange={(value) => setSelectedMesure(value as string)}
        customItem={(v) => (
          <span className="text-grey-8 text-xs">{v.label}</span>
        )}
      />
      <ActionCommentInput onSave={handleSave} numberOfRows={10} />
    </div>
  );
};

export default ActionCommentFooter;
