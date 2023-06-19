import {useState} from 'react';
import ActionDiscussionsHeader from './ActionDiscussionsHeader';
import ActionDiscussionsFeed from './ActionDiscussionsFeed';
import ActionDiscussionNouvelleDiscussion from './ActionDiscussionNouvelleDiscussion';
import {useActionDiscussionFeed} from './data/useActionDiscussionFeed';
import {TActionDiscussion, TActionDiscussionStatut} from './data/types';

export type ActionDiscussionsPanelProps = {
  actionId: string;
  vue: TActionDiscussionStatut;
  changeVue: (vue: TActionDiscussionStatut) => void;
  discussions: TActionDiscussion[];
  dataTest?: string;
};

/** Affiche le contenu du panneau de discussion d'une action */
export const ActionDiscussionPanelContent = ({
  vue,
  changeVue,
  actionId,
  discussions,
  dataTest,
}: ActionDiscussionsPanelProps) => {
  return (
    <div
      data-test={dataTest}
      className="flex flex-col pt-4 grow overflow-hidden"
    >
      <ActionDiscussionsHeader vue={vue} changeVue={changeVue} />
      <ActionDiscussionNouvelleDiscussion actionId={actionId} />
      <ActionDiscussionsFeed vue={vue} discussions={discussions} />
    </div>
  );
};

type ActionDiscussionConnectedProps = {
  dataTest?: string;
  action_id: string;
};

const ActionDiscussionConnected = ({
  dataTest,
  action_id,
}: ActionDiscussionConnectedProps) => {
  /** Gère la vue discussions "ouvertes" ou "fermées" */
  const [vue, setVue] = useState<TActionDiscussionStatut>('ouvert');
  const changeVue = (vue: TActionDiscussionStatut) => setVue(vue);

  /** Charge les discussions de l'action */
  const discussions = useActionDiscussionFeed({
    action_id,
    statut: vue,
  });

  return (
    <ActionDiscussionPanelContent
      dataTest={dataTest}
      actionId={action_id}
      vue={vue}
      changeVue={changeVue}
      discussions={discussions}
    />
  );
};

export default ActionDiscussionConnected;
