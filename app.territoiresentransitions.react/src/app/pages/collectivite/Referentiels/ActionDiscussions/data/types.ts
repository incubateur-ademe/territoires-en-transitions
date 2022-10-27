export type TActionDiscussionStatut = 'ouvert' | 'ferme';

export type TActionDiscussion = {
  id: number;
  created_at: string;
  modified_at: string;
  created_by: string;
  created_by_nom: string;
  action_id: string;
  collectivite_id: number;
  status: TActionDiscussionStatut;
  commentaires: TActionDiscussionCommentaire[]; // liste commentaires
};

export type TActionDiscussionCommentaire = {
  id: number;
  created_at: string;
  modified_at: string;
  created_by: string;
  created_by_nom: string;
  discussion_id: number;
  message: string;
};
