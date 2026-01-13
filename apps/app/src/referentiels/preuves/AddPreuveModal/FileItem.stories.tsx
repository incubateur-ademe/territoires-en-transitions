import {StoryFn, Meta} from '@storybook/nextjs-vite';
import {FileItem, TFileItemProps} from './FileItem';

// utilitaire pour générer un objet File
export const createMockFile = (name: string, size: number): File => {
  const file = new File([''], name, {type: 'some/mime-type'});
  Object.defineProperty(file, 'size', {value: size});
  return file;
};

export const fileItemMocks = {
  running1: {
    file: createMockFile('Délibération-Engagement-PCAET.pdf', 87 * 1024),
    status: {code: 'running', progress: 35},
  },
  running2: {
    file: createMockFile(
      'Rapport d’activités 2019-2020 et rapport DD 2020.doc',
      8552 * 1024
    ),
    status: {code: 'running', progress: 25},
  },
  completed: {
    file: createMockFile('feuille de route des élus responsables CAE.pdf', 100),
    status: {code: 'completed'},
  },
  toobig: {
    file: createMockFile(
      'Rapport d’activités 2019-2020 et rapport DD 2020 nom vraiment trop long.doc',
      60 * 1024 * 1024
    ),
    status: {code: 'failed', error: 'sizeError'},
  },
  unknownFormat: {
    file: createMockFile('Logo-comcom.SVG', 15 * 1024 * 1024),
    status: {code: 'failed', error: 'formatError'},
  },
  formatAndSize: {
    file: createMockFile('mauvais format et taille.exe', 80 * 1024 * 1024),
    status: {code: 'failed', error: 'formatAndSizeError'},
  },
  uploadError: {
    file: createMockFile('fichier.doc', 15 * 1024 * 1024),
    status: {code: 'failed', error: 'uploadError'},
  },
  duplicateWarning: {
    file: createMockFile('fichier.xls', 15 * 1024 * 1024),
    status: {code: 'duplicated', fichier_id: 1, filename: 'fichier.xls'},
  },
  duplicatedAndRenamedWarning: {
    file: createMockFile('nouveau nom.xls', 15 * 1024 * 1024),
    status: {code: 'duplicated', fichier_id: 1, filename: 'fichier.xls'},
  },
};

export default {
  component: FileItem,
  excludeStories: ['createMockFile', 'fileItemMocks'],
} as Meta;

const Template: StoryFn<TFileItemProps> = args => (
  <div style={{maxWidth: 548, border: '1px dashed'}}>
    <FileItem {...args} />
  </div>
);

export const Running = {
  render: Template,
  args: {...fileItemMocks.running1},
};

export const Running2 = {
  render: Template,
  args: {...fileItemMocks.running2},
};

export const Completed = {
  render: Template,
  args: {...fileItemMocks.completed},
};

export const FailedTooBig = {
  render: Template,
  args: {...fileItemMocks.toobig},
};

export const FailedUnknownFormat = {
  render: Template,
  args: {...fileItemMocks.unknownFormat},
};

export const FailedFormatAndSize = {
  render: Template,
  args: {...fileItemMocks.formatAndSize},
};

export const FailedToUpload = {
  render: Template,
  args: {...fileItemMocks.uploadError},
};

export const FailedDuplicate = {
  render: Template,
  args: {...fileItemMocks.duplicateWarning},
};

export const FailedDuplicatedAndRenamed = {
  render: Template,

  args: {
    ...fileItemMocks.duplicatedAndRenamedWarning,
  },
};
