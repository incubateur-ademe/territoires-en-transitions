import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { action } from 'storybook/actions';
import type { FileConstraints } from '../upload/constants';
import { AddFile } from './AddFile';
import type { FileUploadItem } from './FileItem';
import { createMockFile } from './FileItem.stories';
import { UploadErrorCode, UploadStatusCode } from './types';

const MO = 1024 * 1024;

/**
 * Contextes de dépôt fictifs : les contraintes réelles appartiennent à chaque
 * appelant, ce composant n'en connaît aucune. Les trois axes (formats, taille,
 * nombre) se règlent indépendamment les uns des autres.
 */
const PIECE_UNIQUE_FILE_CONSTRAINTS: FileConstraints = {
  formats: ['pdf'],
  mimeTypes: ['application/pdf'],
  maxSizeBytes: 20 * MO,
  maxFiles: 1,
};

const IMAGES_FILE_CONSTRAINTS: FileConstraints = {
  formats: ['png', 'jpg', 'jpeg'],
  maxSizeBytes: 2 * MO,
  maxFiles: 3,
};

const refuse = (
  name: string,
  sizeBytes: number,
  error: UploadErrorCode
): FileUploadItem => ({
  file: createMockFile(name, sizeBytes),
  status: { code: UploadStatusCode.failed, error },
});

/**
 * Les items `running` déclenchent un vrai téléversement (`useUploader`) : on
 * s'en tient ici aux états stables, qui sont aussi les seuls à survivre à un
 * rechargement de la story.
 */
const meta: Meta<typeof AddFile> = {
  component: AddFile,
  // Largeur de la modale « Ajouter une preuve » dans laquelle l'onglet s'affiche.
  decorators: [
    (Story) => (
      <div className="max-w-2xl p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    onAddFileFromLib: action('onAddFileFromLib'),
    onClose: action('onClose'),
  },
};

export default meta;
type Story = StoryObj<typeof AddFile>;

/**
 * Sans contraintes explicites : celles de la bibliothèque (20 Mo, tous les
 * formats bureautiques et images, plusieurs fichiers à la fois). C'est ce que
 * voient tous les appelants historiques.
 */
export const Defaut: Story = {};

/**
 * Contexte n'attendant qu'une seule pièce, au format PDF : le `<input>` perd
 * son attribut `multiple` et son `accept` se réduit à `.pdf`. Le type MIME est
 * vérifié en plus de l'extension.
 */
export const PieceUniqueEnPdf: Story = {
  args: {
    fileConstraints: PIECE_UNIQUE_FILE_CONSTRAINTS,
  },
};

/** Contraintes sur mesure : trois images de 2 Mo au plus. */
export const ContraintesSurMesure: Story = {
  args: {
    fileConstraints: IMAGES_FILE_CONSTRAINTS,
  },
};

/**
 * Les trois motifs de refus du contrôle client, tel qu'il s'applique avec les
 * contraintes de la bibliothèque.
 */
export const SelectionRefusee: Story = {
  args: {
    initialSelection: [
      refuse('rapport annuel 2025.doc', 60 * MO, UploadErrorCode.sizeError),
      refuse('logo-comcom.svg', 15 * MO, UploadErrorCode.formatError),
      refuse(
        'mauvais format et taille.exe',
        80 * MO,
        UploadErrorCode.formatAndSizeError
      ),
    ],
  },
};

/**
 * Le refus dépend du contexte, pas du seul fichier : ce `.docx` passerait dans
 * la bibliothèque, mais pas dans un contexte restreint au PDF. Même chose pour
 * un fichier déjà téléversé — la validation précède la détection de doublon.
 */
export const FormatRefuseParLeContexte: Story = {
  args: {
    fileConstraints: PIECE_UNIQUE_FILE_CONSTRAINTS,
    initialSelection: [
      refuse('rapport de synthèse.docx', 2 * MO, UploadErrorCode.formatError),
    ],
  },
};

/**
 * Fichier déjà présent dans la bibliothèque : il est signalé mais reste
 * sélectionnable, d'où le bouton « Ajouter » actif. Le second a été téléversé
 * sous un autre nom, que l'on rappelle.
 */
export const DejaDansLaBibliotheque: Story = {
  args: {
    initialSelection: [
      {
        file: createMockFile('deliberation.pdf', 87 * 1024),
        status: {
          code: UploadStatusCode.duplicated,
          fichier_id: 1,
          filename: 'deliberation.pdf',
          hash: 'hash-1',
        },
      },
      {
        file: createMockFile('nouveau nom.xls', 15 * MO),
        status: {
          code: UploadStatusCode.duplicated,
          fichier_id: 2,
          filename: 'budget prévisionnel.xls',
          hash: 'hash-2',
        },
      },
    ],
  },
};

/** Téléversement abouti : la pièce peut être rattachée. */
export const TeleversementAbouti: Story = {
  args: {
    initialSelection: [
      {
        file: createMockFile(
          'feuille de route des élus responsables CAE.pdf',
          340 * 1024
        ),
        status: {
          code: UploadStatusCode.completed,
          fichier_id: 3,
          hash: 'hash-3',
        },
      },
    ],
  },
};

/**
 * Preuve réglementaire : le dépôt offre le choix de la confidentialité, qui ne
 * s'appliquera qu'aux fichiers téléversés depuis la modale.
 */
export const DocReglementaire: Story = {
  args: {
    docType: 'reglementaire',
  },
};

/** Annexe : même choix, avec un message d'explication qui lui est propre. */
export const DocAnnexe: Story = {
  args: {
    docType: 'annexe',
  },
};

/**
 * Type de document sans choix de confidentialité (ici un rapport) : la case
 * n'apparaît pas et rien n'est imposé aux fichiers de la bibliothèque.
 */
export const SansChoixDeConfidentialite: Story = {
  args: {
    docType: 'rapport',
  },
};
