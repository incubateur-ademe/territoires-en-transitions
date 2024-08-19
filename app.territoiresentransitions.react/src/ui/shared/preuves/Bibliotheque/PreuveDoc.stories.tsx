import {Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {PreuveDoc} from './PreuveDoc';

import {preuveComplementaireFichier, preuveComplementaireLien} from './fixture';

export default {
  component: PreuveDoc,
} as Meta;

const handlers = {
  isEditingComment: false,
  remove: action('remove'),
  editComment: {
    value: '',
    setValue: action('setCommentValue'),
    enter: action('enterEditComment'),
    exit: action('exitEditComment'),
  },
  editFilename: {
    value: '',
    setValue: action('setFilenameValue'),
    enter: action('enterEditFilename'),
    exit: action('exitEditFilename'),
  },
};

const handlerWithEditCommentOn = {
  ...handlers,
  editComment: {
    ...handlers.editComment,
    isEditing: true,
  },
};

export const PreuveFichier = {
  args: {
    handlers,
    preuve: {...preuveComplementaireFichier, commentaire: null},
  },
};

export const PreuveFichierEditionCommentaire = {
  args: {
    handlers: handlerWithEditCommentOn,
    preuve: {
      ...preuveComplementaireFichier,
    },
  },
};

export const PreuveFichierCommentee = {
  args: {
    handlers,
    preuve: {
      ...preuveComplementaireFichier,
      commentaire:
        'Cf pp 34-35 - Document provisoire, en attente d’approbation',
    },
  },
};

export const PreuveFichierEditionNom = {
  args: {
    handlers: {
      ...handlers,
      editFilename: {
        ...handlers.editFilename,
        isEditing: true,
      },
    },
    preuve: {
      ...preuveComplementaireFichier,
    },
  },
};

export const PreuveLien = {
  args: {
    handlers,
    preuve: preuveComplementaireLien,
  },
};

export const PreuveLienEditionCommentaire = {
  args: {
    handlers: handlerWithEditCommentOn,
    preuve: preuveComplementaireLien,
  },
};

export const PreuveLienCommentee = {
  args: {
    handlers,
    preuve: {
      ...preuveComplementaireLien,
      commentaire:
        'Cf pp 34-35 - Document provisoire, en attente d’approbation',
    },
  },
};
