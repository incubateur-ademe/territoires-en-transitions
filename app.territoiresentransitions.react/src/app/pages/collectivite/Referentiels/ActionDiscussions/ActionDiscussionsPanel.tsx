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
};

/** Affiche le contenu du panneau de discussion d'une action */
export const ActionDiscussionPanelContent = ({
  vue,
  changeVue,
  actionId,
  discussions,
}: ActionDiscussionsPanelProps) => {
  return (
    <>
      <ActionDiscussionsHeader vue={vue} changeVue={changeVue} />
      <ActionDiscussionNouvelleDiscussion actionId={actionId} />
      <ActionDiscussionsFeed vue={vue} discussions={discussions} />
    </>
  );
};

type ActionDiscussionConnectedProps = {
  action_id: string;
};

const ActionDiscussionConnected = ({
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
      actionId={action_id}
      vue={vue}
      changeVue={changeVue}
      discussions={discussions}
    />
  );
};

export default ActionDiscussionConnected;
