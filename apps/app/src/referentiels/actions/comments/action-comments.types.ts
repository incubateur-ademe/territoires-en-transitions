export type ActionDiscussionStatut = 'ouvert' | 'ferme';

export type TActionDiscussionCommentaire = {
  id: number;
  created_at: string;
  modified_at: string;
  created_by: string;
  created_by_nom: string;
  discussion_id: number;
  message: string;
};
