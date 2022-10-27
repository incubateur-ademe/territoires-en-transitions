import {TActionDiscussion, TActionDiscussionCommentaire} from './types';

export const fakeActionDiscussionCommentaire: TActionDiscussionCommentaire = {
  id: 1,
  created_at: '2022-10-25T14:17:58.424562+00:00',
  modified_at: '2022-10-25T14:17:58.424562+00:00',
  created_by: '1',
  created_by_nom: 'Yolo Dodo',
  discussion_id: 1,
  message: 'Bonjour le monde, ceci est un message.',
};

export const fakeActionDiscussion: TActionDiscussion = {
  id: 1,
  created_at: '2022-10-25T14:17:58.424562+00:00',
  modified_at: '2022-10-25T14:17:58.424562+00:00',
  created_by: '1',
  created_by_nom: 'Yolo Dodo',
  action_id: 'eci-1.1.1',
  collectivite_id: 1,
  status: 'ouvert',
  commentaires: [fakeActionDiscussionCommentaire],
};
