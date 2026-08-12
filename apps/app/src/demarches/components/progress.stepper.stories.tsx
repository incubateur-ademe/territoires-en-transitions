import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { DemarchePcaetCompletion } from '../completion';
import { AvanceDemarcheSection } from './progress.stepper';

const dossierIncomplet: DemarchePcaetCompletion = {
  description: 'complete',
  documents: 'complete',
  diagnostic: 'incomplete',
  plan: 'incomplete',
  documentsAval: 'incomplete',
  canTransmettre: false,
  canPublier: false,
};

/** Dossier d'élaboration complet ; la délibération d'adoption reste à déposer. */
const dossierComplet: DemarchePcaetCompletion = {
  description: 'complete',
  documents: 'complete',
  diagnostic: 'complete',
  plan: 'complete',
  documentsAval: 'incomplete',
  canTransmettre: true,
  canPublier: false,
};

/** Pièces aval déposées : plus rien ne retient la publication. */
const dossierPubliable: DemarchePcaetCompletion = {
  ...dossierComplet,
  documentsAval: 'complete',
  canPublier: true,
};

/** Échéance d'avis relative à aujourd'hui, pour piloter le badge (J-x). */
const echeanceDans = (days: number): string =>
  new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();

const meta: Meta<typeof AvanceDemarcheSection> = {
  component: AvanceDemarcheSection,
  // Largeur du panneau latéral dans lequel le stepper est affiché.
  decorators: [
    (Story) => (
      <div className="max-w-md p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    demarcheType: 'pcaet',
    collectiviteId: 1,
    demarcheId: 1,
    activeSection: null,
  },
};

export default meta;
type Story = StoryObj<typeof AvanceDemarcheSection>;

/** Dossier incomplet : le bouton de transmission est désactivé (tooltip au survol). */
export const ElaborationDossierIncomplet: Story = {
  args: {
    statut: 'en_elaboration',
    completion: dossierIncomplet,
    activeSection: 'diagnostic',
    canTransmettre: false,
  },
};

/** Dossier complet et utilisateur pilote : la transmission est proposée. */
export const ElaborationDossierComplet: Story = {
  args: {
    statut: 'en_elaboration',
    completion: dossierComplet,
    canTransmettre: true,
  },
};

/**
 * Dossier complet mais transition indisponible pour l'utilisateur (non
 * pilote) : `availableTransitions` ne contient pas `transmettre_pour_avis`.
 */
export const ElaborationDossierCompletNonPilote: Story = {
  args: {
    statut: 'en_elaboration',
    completion: dossierComplet,
    canTransmettre: false,
  },
};

/** Démarche transmise : échéance des avis à venir, reprise possible (pilote). */
export const TransmisPourAvis: Story = {
  args: {
    statut: 'transmis_pour_avis',
    completion: dossierComplet,
    avisDeadlineAt: echeanceDans(80),
    canReprendre: true,
  },
};

/** Échéance des avis dans moins de 14 jours : badge d'avertissement. */
export const TransmisEcheanceProche: Story = {
  args: {
    statut: 'transmis_pour_avis',
    completion: dossierComplet,
    avisDeadlineAt: echeanceDans(10),
    canReprendre: true,
  },
};

/** Délai légal de 3 mois écoulé : badge d'erreur, l'adoption devient possible. */
export const TransmisDelaiEcoule: Story = {
  args: {
    statut: 'transmis_pour_avis',
    completion: dossierComplet,
    avisDeadlineAt: echeanceDans(-30),
    canReprendre: true,
  },
};

/** Utilisateur non pilote : la reprise de l'élaboration n'est pas proposée. */
export const TransmisNonPilote: Story = {
  args: {
    statut: 'transmis_pour_avis',
    completion: dossierComplet,
    avisDeadlineAt: echeanceDans(80),
    canReprendre: false,
  },
};

/**
 * PCAET adopté, non publié : la sous-étape des pièces aval (délibération
 * d'adoption…) reste à compléter — la publication est proposée mais désactivée
 * (tooltip au survol), comme la transmission sur un dossier incomplet.
 */
export const AdopteNonPublie: Story = {
  args: {
    statut: 'adopte',
    completion: dossierComplet,
    activeSection: 'documents',
    isPublished: false,
    canPublish: false,
  },
};

/** Pièces aval déposées : la publication est active. */
export const AdoptePretAPublier: Story = {
  args: {
    statut: 'adopte',
    completion: dossierPubliable,
    isPublished: false,
    canPublish: true,
  },
};

/** PCAET adopté et publié : dépublication proposée. */
export const AdoptePublie: Story = {
  args: {
    statut: 'adopte',
    completion: dossierPubliable,
    isPublished: true,
    canPublish: true,
  },
};

/** Cycle clos (évaluation finale déposée) : un nouveau dépôt peut démarrer. */
export const Archive: Story = {
  args: {
    statut: 'archive',
    completion: dossierPubliable,
    isPublished: true,
    canPublish: true,
  },
};

/** Mode aperçu de la page de création : sans liens ni actions. */
export const ApercuCreation: Story = {
  args: {
    statut: 'en_elaboration',
    completion: dossierIncomplet,
    isPreview: true,
  },
};
