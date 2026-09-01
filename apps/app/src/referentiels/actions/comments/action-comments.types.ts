export type ActionDiscussionStatut = 'ouvert' | 'ferme';

export type TActionDiscussionCommentaire = {
  id: number;
  modifiedAt: string;
  modified_at: string;
  modifiedBy: string;
  modifiedByNom: string;
  discussion_id: number;
  message: string;
};
