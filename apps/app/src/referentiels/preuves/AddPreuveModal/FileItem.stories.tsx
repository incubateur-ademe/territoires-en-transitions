import { Meta, StoryFn } from '@storybook/nextjs-vite';
import { toDocumentHash } from '@tet/domain/collectivites';
import { FileItem, FileItemProps, FileUploadItem } from './FileItem';
import { UploadErrorCode, UploadStatusCode } from './types';

// utilitaire pour générer un objet File
export const createMockFile = (name: string, size: number): File => {
  const file = new File([''], name, { type: 'some/mime-type' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

const MOCK_HASH = toDocumentHash('a'.repeat(64));
const noop = (): void => undefined;

export const fileItemMocks: Record<string, FileUploadItem> = {
  preparing: {
    id: 'preparing',
    file: createMockFile('Plan-climat-2024.pdf', 42 * 1024),
    status: {
      code: UploadStatusCode.preparing,
      hash: MOCK_HASH,
      abort: noop,
    },
  },
  running1: {
    id: 'running1',
    file: createMockFile('Délibération-Engagement-PCAET.pdf', 87 * 1024),
    status: {
      code: UploadStatusCode.running,
      hash: MOCK_HASH,
      progress: 35,
      abort: noop,
    },
  },
  running2: {
    id: 'running2',
    file: createMockFile(
      'Rapport d’activités 2019-2020 et rapport DD 2020.doc',
      8552 * 1024
    ),
    status: {
      code: UploadStatusCode.running,
      hash: MOCK_HASH,
      progress: 25,
      abort: noop,
    },
  },
  completed: {
    id: 'completed',
    file: createMockFile('feuille de route des élus responsables CAE.pdf', 100),
    status: {
      code: UploadStatusCode.completed,
      fichierId: 1,
      hash: MOCK_HASH,
    },
  },
  toobig: {
    id: 'toobig',
    file: createMockFile(
      'Rapport d’activités 2019-2020 et rapport DD 2020 nom vraiment trop long.doc',
      60 * 1024 * 1024
    ),
    status: {
      code: UploadStatusCode.failed,
      error: UploadErrorCode.sizeError,
    },
  },
  unknownFormat: {
    id: 'unknownFormat',
    file: createMockFile('Logo-comcom.SVG', 15 * 1024 * 1024),
    status: {
      code: UploadStatusCode.failed,
      error: UploadErrorCode.formatError,
    },
  },
  formatAndSize: {
    id: 'formatAndSize',
    file: createMockFile('mauvais format et taille.exe', 80 * 1024 * 1024),
    status: {
      code: UploadStatusCode.failed,
      error: UploadErrorCode.formatAndSizeError,
    },
  },
  uploadError: {
    id: 'uploadError',
    file: createMockFile('fichier.doc', 15 * 1024 * 1024),
    status: {
      code: UploadStatusCode.failed,
      error: UploadErrorCode.uploadError,
    },
  },
  duplicateWarning: {
    id: 'duplicateWarning',
    file: createMockFile('fichier.xls', 15 * 1024 * 1024),
    status: {
      code: UploadStatusCode.duplicated,
      fichierId: 1,
      filename: 'fichier.xls',
      hash: MOCK_HASH,
    },
  },
  duplicatedAndRenamedWarning: {
    id: 'duplicatedAndRenamedWarning',
    file: createMockFile('nouveau nom.xls', 15 * 1024 * 1024),
    status: {
      code: UploadStatusCode.duplicated,
      fichierId: 1,
      filename: 'fichier.xls',
      hash: MOCK_HASH,
    },
  },
};

export default {
  component: FileItem,
  excludeStories: ['createMockFile', 'fileItemMocks'],
} as Meta;

const Template: StoryFn<FileItemProps> = (args) => (
  <div style={{ maxWidth: 548, border: '1px dashed' }}>
    <FileItem {...args} />
  </div>
);

export const Preparing = {
  render: Template,
  args: { item: fileItemMocks.preparing },
};

export const Running = {
  render: Template,
  args: { item: fileItemMocks.running1 },
};

export const Running2 = {
  render: Template,
  args: { item: fileItemMocks.running2 },
};

export const Completed = {
  render: Template,
  args: { item: fileItemMocks.completed },
};

export const FailedTooBig = {
  render: Template,
  args: { item: fileItemMocks.toobig },
};

export const FailedUnknownFormat = {
  render: Template,
  args: { item: fileItemMocks.unknownFormat },
};

export const FailedFormatAndSize = {
  render: Template,
  args: { item: fileItemMocks.formatAndSize },
};

export const FailedToUpload = {
  render: Template,
  args: { item: fileItemMocks.uploadError },
};

export const FailedDuplicate = {
  render: Template,
  args: { item: fileItemMocks.duplicateWarning },
};

export const FailedDuplicatedAndRenamed = {
  render: Template,
  args: { item: fileItemMocks.duplicatedAndRenamedWarning },
};
