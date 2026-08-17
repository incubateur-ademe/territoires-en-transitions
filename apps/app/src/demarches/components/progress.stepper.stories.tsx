import {
  evaluateTransitions,
  type DemarchePcaetStatus,
} from '@tet/domain/demarches';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { DemarchePcaetCompletion } from '../completion';
import { AvanceDemarcheSection } from './progress.stepper';

/**
 * Évaluations serveur des transitions, telles que l'API les renvoie : le
 * stepper ne fait que les lire.
 */
const transitionsDe = (
  statut: DemarchePcaetStatus,
  guards: Parameters<typeof evaluateTransitions>[1] = {}
) => evaluateTransitions(statut, guards);

const PILOTE_DOSSIER_COMPLET = { estPilote: true, dossierComplet: true };

const dossierIncomplet: DemarchePcaetCompletion = {
  documents: 'complete',
  diagnostic: 'incomplete',
  plan: 'incomplete',
  documentsAval: 'incomplete',
};

/** Dossier d'élaboration complet ; la délibération d'adoption reste à déposer. */
const dossierComplet: DemarchePcaetCompletion = {
  documents: 'complete',
  diagnostic: 'complete',
  plan: 'complete',
  documentsAval: 'incomplete',
};

/** Pièces aval déposées : plus rien ne retient la publication. */
const dossierPubliable: DemarchePcaetCompletion = {
  ...dossierComplet,
  documentsAval: 'complete',
};

const PILOTE = { estPilote: true };

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
    transitions: transitionsDe('en_elaboration', { estPilote: true }),
  },
};

/** Dossier complet et utilisateur pilote : la transmission est proposée. */
export const ElaborationDossierComplet: Story = {
  args: {
    statut: 'en_elaboration',
    completion: dossierComplet,
    transitions: transitionsDe('en_elaboration', PILOTE_DOSSIER_COMPLET),
  },
};

/**
 * Dossier complet mais utilisateur non pilote : le serveur renvoie la
 * transmission bloquée par `estPilote`, le tooltip le dit.
 */
export const ElaborationDossierCompletNonPilote: Story = {
  args: {
    statut: 'en_elaboration',
    completion: dossierComplet,
    transitions: transitionsDe('en_elaboration', { dossierComplet: true }),
  },
};

/** Démarche transmise : échéance des avis à venir, reprise possible (pilote). */
export const TransmisPourAvis: Story = {
  args: {
    statut: 'transmis_pour_avis',
    completion: dossierComplet,
    avisDeadlineAt: echeanceDans(80),
    transitions: transitionsDe('transmis_pour_avis', { estPilote: true }),
  },
};

/** Échéance des avis dans moins de 14 jours : badge d'avertissement. */
export const TransmisEcheanceProche: Story = {
  args: {
    statut: 'transmis_pour_avis',
    completion: dossierComplet,
    avisDeadlineAt: echeanceDans(10),
    transitions: transitionsDe('transmis_pour_avis', { estPilote: true }),
  },
};

/** Délai légal de 3 mois écoulé : badge d'erreur, l'adoption devient possible. */
export const TransmisDelaiEcoule: Story = {
  args: {
    statut: 'transmis_pour_avis',
    completion: dossierComplet,
    avisDeadlineAt: echeanceDans(-30),
    transitions: transitionsDe('transmis_pour_avis', { estPilote: true }),
  },
};

/** Utilisateur non pilote : la reprise de l'élaboration n'est pas proposée. */
export const TransmisNonPilote: Story = {
  args: {
    statut: 'transmis_pour_avis',
    completion: dossierComplet,
    avisDeadlineAt: echeanceDans(80),
    transitions: transitionsDe('transmis_pour_avis'),
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
    transitions: transitionsDe('adopte', PILOTE),
  },
};

/** Pièces aval déposées : la publication est active. */
export const AdoptePretAPublier: Story = {
  args: {
    statut: 'adopte',
    completion: dossierPubliable,
    isPublished: false,
    transitions: transitionsDe('adopte', {
      ...PILOTE,
      documentsAvalComplets: true,
    }),
  },
};

/** PCAET adopté et publié : dépublication proposée. */
export const AdoptePublie: Story = {
  args: {
    statut: 'publie',
    completion: dossierPubliable,
    isPublished: true,
    transitions: transitionsDe('publie', PILOTE),
  },
};

/** Cycle clos (évaluation finale déposée) : un nouveau dépôt peut démarrer. */
export const Archive: Story = {
  args: {
    statut: 'archive',
    completion: dossierPubliable,
    isPublished: true,
    transitions: transitionsDe('archive', PILOTE),
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
