import {ActionMetaInterface} from 'generated/models/action_meta';

interface MetaCommentaire {
  meta: {commentaire: string};
}

export type ActionMetaTypedInterface = ActionMetaInterface & MetaCommentaire;
