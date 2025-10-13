import { describe, expect, it } from 'vitest';
import { getActionsAndSubActionsIdIdentifiantAndName } from './use-comment-panel';

const actionNode = {
  nom: 'Définir la vision, les objectifs et la stratégie Climat-Air-Énergie',
  tags: [],
  level: 3,
  score: {
    actionId: 'cae_1.1.1',
    concerne: true,
    desactive: false,
    pointFait: 0.36,
    renseigne: false,
    pointPasFait: 0.03,
    pointPotentiel: 12,
    pointProgramme: 0.21,
    pointReferentiel: 12,
    totalTachesCount: 22,
    pointNonRenseigne: 11.4,
    pointPotentielPerso: null,
    completedTachesCount: 2,
    faitTachesAvancement: 1.2,
    pasFaitTachesAvancement: 0.1,
    programmeTachesAvancement: 0.7,
    pasConcerneTachesAvancement: 0,
  },
  points: 12,
  preuves: null,
  actionId: 'cae_1.1.1',
  categorie: null,
  scoresTag: {},
  actionType: 'action',
  identifiant: '1.1.1',
  pourcentage: 40,
  actionsEnfant: [
    {
      nom: 'Formaliser la vision et les engagements',
      tags: ['bases'],
      level: 4,
      score: {
        actionId: 'cae_1.1.1.1',
        concerne: true,
        desactive: false,
        pointFait: 0.36,
        renseigne: true,
        pointPasFait: 0.03,
        pointPotentiel: 0.6,
        pointProgramme: 0.21,
        pointReferentiel: 0.6,
        totalTachesCount: 2,
        pointNonRenseigne: 0,
        pointPotentielPerso: null,
        completedTachesCount: 2,
        faitTachesAvancement: 1.2,
        pasFaitTachesAvancement: 0.1,
        programmeTachesAvancement: 0.7,
        pasConcerneTachesAvancement: 0,
      },
      points: 0.6,
      preuves: null,
      actionId: 'cae_1.1.1.1',
      categorie: 'bases',
      scoresTag: {},
      actionType: 'sous-action',
      identifiant: '1.1.1.1',
      pourcentage: 5,
      actionsEnfant: [
        {
          nom: 'Formaliser une vision et des engagements dans une décision de politique générale (délibération)',
          tags: [],
          level: 5,
          score: {
            aStatut: true,
            actionId: 'cae_1.1.1.1.1',
            concerne: true,
            desactive: false,
            pointFait: 0.3,
            renseigne: true,
            avancement: 'fait',
            pointPasFait: 0,
            pointPotentiel: 0.3,
            pointProgramme: 0,
            pointReferentiel: 0.3,
            totalTachesCount: 1,
            pointNonRenseigne: 0,
            pointPotentielPerso: null,
            completedTachesCount: 1,
            faitTachesAvancement: 1,
            pasFaitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
          points: 0.3,
          preuves: null,
          actionId: 'cae_1.1.1.1.1',
          categorie: null,
          scoresTag: {},
          actionType: 'tache',
          identifiant: '1.1.1.1.1',
          pourcentage: 50,
          actionsEnfant: [],
        },
        {
          nom: "S'engager dans des démarches ambitieuses et reconnues (TEPOS, Convention des Maires)",
          tags: [],
          level: 5,
          score: {
            aStatut: true,
            actionId: 'cae_1.1.1.1.2',
            concerne: true,
            desactive: false,
            pointFait: 0.06,
            renseigne: true,
            avancement: 'detaille',
            pointPasFait: 0.03,
            pointPotentiel: 0.3,
            pointProgramme: 0.21,
            pointReferentiel: 0.3,
            totalTachesCount: 1,
            pointNonRenseigne: 0,
            pointPotentielPerso: null,
            completedTachesCount: 1,
            faitTachesAvancement: 0.2,
            pasFaitTachesAvancement: 0.1,
            programmeTachesAvancement: 0.7,
            pasConcerneTachesAvancement: 0,
          },
          points: 0.3,
          preuves: null,
          actionId: 'cae_1.1.1.1.2',
          categorie: null,
          scoresTag: {},
          actionType: 'tache',
          identifiant: '1.1.1.1.2',
          pourcentage: 50,
          actionsEnfant: [],
        },
      ],
    },
    {
      nom: 'Définir les principaux objectifs énergétiques et climatiques',
      tags: ['mise en œuvre'],
      level: 4,
      score: {
        actionId: 'cae_1.1.1.2',
        concerne: true,
        desactive: false,
        pointFait: 0,
        renseigne: false,
        pointPasFait: 0,
        pointPotentiel: 0.6,
        pointProgramme: 0,
        pointReferentiel: 0.6,
        totalTachesCount: 3,
        pointNonRenseigne: 0.6,
        pointPotentielPerso: null,
        completedTachesCount: 0,
        faitTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
      },
      points: 0.6,
      preuves: null,
      actionId: 'cae_1.1.1.2',
      categorie: 'mise en œuvre',
      scoresTag: {},
      actionType: 'sous-action',
      identifiant: '1.1.1.2',
      pourcentage: 5,
      actionsEnfant: [
        {
          nom: 'Définir des objectifs énergétiques et climatiques directeurs chiffrés',
          tags: [],
          level: 5,
          score: {
            actionId: 'cae_1.1.1.2.1',
            concerne: true,
            desactive: false,
            pointFait: 0,
            renseigne: false,
            pointPasFait: 0,
            pointPotentiel: 0.2,
            pointProgramme: 0,
            pointReferentiel: 0.2,
            totalTachesCount: 1,
            pointNonRenseigne: 0.2,
            pointPotentielPerso: null,
            completedTachesCount: 0,
            faitTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
          points: 0.2,
          preuves: null,
          actionId: 'cae_1.1.1.2.1',
          categorie: null,
          scoresTag: {},
          actionType: 'tache',
          identifiant: '1.1.1.2.1',
          pourcentage: 33.333333333333336,
          actionsEnfant: [],
        },
        {
          nom: 'Adapter les objectifs énergétiques et climatiques chiffrés au territoire',
          tags: [],
          level: 5,
          score: {
            actionId: 'cae_1.1.1.2.2',
            concerne: true,
            desactive: false,
            pointFait: 0,
            renseigne: false,
            pointPasFait: 0,
            pointPotentiel: 0.2,
            pointProgramme: 0,
            pointReferentiel: 0.2,
            totalTachesCount: 1,
            pointNonRenseigne: 0.2,
            pointPotentielPerso: null,
            completedTachesCount: 0,
            faitTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
          points: 0.2,
          preuves: null,
          actionId: 'cae_1.1.1.2.2',
          categorie: null,
          scoresTag: {},
          actionType: 'tache',
          identifiant: '1.1.1.2.2',
          pourcentage: 33.333333333333336,
          actionsEnfant: [],
        },
        {
          nom: 'Définir des objectifs concernant la lutte contre la pollution de l’air',
          tags: [],
          level: 5,
          score: {
            actionId: 'cae_1.1.1.2.3',
            concerne: true,
            desactive: false,
            pointFait: 0,
            renseigne: false,
            pointPasFait: 0,
            pointPotentiel: 0.2,
            pointProgramme: 0,
            pointReferentiel: 0.2,
            totalTachesCount: 1,
            pointNonRenseigne: 0.2,
            pointPotentielPerso: null,
            completedTachesCount: 0,
            faitTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
          points: 0.2,
          preuves: null,
          actionId: 'cae_1.1.1.2.3',
          categorie: null,
          scoresTag: {},
          actionType: 'tache',
          identifiant: '1.1.1.2.3',
          pourcentage: 33.333333333333336,
          actionsEnfant: [],
        },
      ],
    },
    {
      nom: 'Détailler la stratégie et les objectifs énergétiques et climatiques par secteurs d’activités (scénarios)',
      tags: ['mise en œuvre'],
      level: 4,
      score: {
        actionId: 'cae_1.1.1.3',
        concerne: true,
        desactive: false,
        pointFait: 0,
        renseigne: false,
        pointPasFait: 0,
        pointPotentiel: 1.2,
        pointProgramme: 0,
        pointReferentiel: 1.2,
        totalTachesCount: 6,
        pointNonRenseigne: 1.2,
        pointPotentielPerso: null,
        completedTachesCount: 0,
        faitTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
      },
      points: 1.2,
      preuves: null,
      actionId: 'cae_1.1.1.3',
      categorie: 'mise en œuvre',
      scoresTag: {},
      actionType: 'sous-action',
      identifiant: '1.1.1.3',
      pourcentage: 10,
      actionsEnfant: [
        {
          nom: 'Détailler des scénarios prospectifs et des objectifs chiffrés dans la stratégie',
          tags: [],
          level: 5,
          score: {
            actionId: 'cae_1.1.1.3.1',
            concerne: true,
            desactive: false,
            pointFait: 0,
            renseigne: false,
            pointPasFait: 0,
            pointPotentiel: 0.2,
            pointProgramme: 0,
            pointReferentiel: 0.2,
            totalTachesCount: 1,
            pointNonRenseigne: 0.2,
            pointPotentielPerso: null,
            completedTachesCount: 0,
            faitTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
          points: 0.2,
          preuves: null,
          actionId: 'cae_1.1.1.3.1',
          categorie: null,
          scoresTag: {},
          actionType: 'tache',
          identifiant: '1.1.1.3.1',
          pourcentage: 16.666666666666668,
          actionsEnfant: [],
        },
        {
          nom: 'Détailler les objectifs chiffrés pour chaque secteur d’activité',
          tags: [],
          level: 5,
          score: {
            actionId: 'cae_1.1.1.3.2',
            concerne: true,
            desactive: false,
            pointFait: 0,
            renseigne: false,
            pointPasFait: 0,
            pointPotentiel: 0.2,
            pointProgramme: 0,
            pointReferentiel: 0.2,
            totalTachesCount: 1,
            pointNonRenseigne: 0.2,
            pointPotentielPerso: null,
            completedTachesCount: 0,
            faitTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
          points: 0.2,
          preuves: null,
          actionId: 'cae_1.1.1.3.2',
          categorie: null,
          scoresTag: {},
          actionType: 'tache',
          identifiant: '1.1.1.3.2',
          pourcentage: 16.666666666666668,
          actionsEnfant: [],
        },
        {
          nom: 'Détailler les objectifs chiffrés à atteindre à l’horizon 2020, 2030 et 2050 par secteurs d’activités',
          tags: [],
          level: 5,
          score: {
            actionId: 'cae_1.1.1.3.3',
            concerne: true,
            desactive: false,
            pointFait: 0,
            renseigne: false,
            pointPasFait: 0,
            pointPotentiel: 0.2,
            pointProgramme: 0,
            pointReferentiel: 0.2,
            totalTachesCount: 1,
            pointNonRenseigne: 0.2,
            pointPotentielPerso: null,
            completedTachesCount: 0,
            faitTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
          points: 0.2,
          preuves: null,
          actionId: 'cae_1.1.1.3.3',
          categorie: null,
          scoresTag: {},
          actionType: 'tache',
          identifiant: '1.1.1.3.3',
          pourcentage: 16.666666666666668,
          actionsEnfant: [],
        },
        {
          nom: 'Définir des objectifs particulièrement ambitieux dans les domaines de la planification de l’aménagement, du bâtiment et des transports',
          tags: [],
          level: 5,
          score: {
            actionId: 'cae_1.1.1.3.4',
            concerne: true,
            desactive: false,
            pointFait: 0,
            renseigne: false,
            pointPasFait: 0,
            pointPotentiel: 0.2,
            pointProgramme: 0,
            pointReferentiel: 0.2,
            totalTachesCount: 1,
            pointNonRenseigne: 0.2,
            pointPotentielPerso: null,
            completedTachesCount: 0,
            faitTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
          points: 0.2,
          preuves: null,
          actionId: 'cae_1.1.1.3.4',
          categorie: null,
          scoresTag: {},
          actionType: 'tache',
          identifiant: '1.1.1.3.4',
          pourcentage: 16.666666666666668,
          actionsEnfant: [],
        },
        {
          nom: 'Détailler les objectifs de développement pour chaque filière de production d’énergies renouvelables',
          tags: [],
          level: 5,
          score: {
            actionId: 'cae_1.1.1.3.5',
            concerne: true,
            desactive: false,
            pointFait: 0,
            renseigne: false,
            pointPasFait: 0,
            pointPotentiel: 0.2,
            pointProgramme: 0,
            pointReferentiel: 0.2,
            totalTachesCount: 1,
            pointNonRenseigne: 0.2,
            pointPotentielPerso: null,
            completedTachesCount: 0,
            faitTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
          points: 0.2,
          preuves: null,
          actionId: 'cae_1.1.1.3.5',
          categorie: null,
          scoresTag: {},
          actionType: 'tache',
          identifiant: '1.1.1.3.5',
          pourcentage: 16.666666666666668,
          actionsEnfant: [],
        },
        {
          nom: 'Mettre en évidence les conséquences en matière d’emploi et de coût de l’inaction dans la stratégie',
          tags: [],
          level: 5,
          score: {
            actionId: 'cae_1.1.1.3.6',
            concerne: true,
            desactive: false,
            pointFait: 0,
            renseigne: false,
            pointPasFait: 0,
            pointPotentiel: 0.2,
            pointProgramme: 0,
            pointReferentiel: 0.2,
            totalTachesCount: 1,
            pointNonRenseigne: 0.2,
            pointPotentielPerso: null,
            completedTachesCount: 0,
            faitTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
          points: 0.2,
          preuves: null,
          actionId: 'cae_1.1.1.3.6',
          categorie: null,
          scoresTag: {},
          actionType: 'tache',
          identifiant: '1.1.1.3.6',
          pourcentage: 16.666666666666668,
          actionsEnfant: [],
        },
      ],
    },
    {
      nom: 'Préciser la stratégie sur la qualité de l’air',
      tags: ['mise en œuvre'],
      level: 4,
      score: {
        actionId: 'cae_1.1.1.4',
        concerne: true,
        desactive: false,
        pointFait: 0,
        renseigne: false,
        pointPasFait: 0,
        pointPotentiel: 0.6,
        pointProgramme: 0,
        pointReferentiel: 0.6,
        totalTachesCount: 3,
        pointNonRenseigne: 0.6,
        pointPotentielPerso: null,
        completedTachesCount: 0,
        faitTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
      },
      points: 0.6,
      preuves: null,
      actionId: 'cae_1.1.1.4',
      categorie: 'mise en œuvre',
      scoresTag: {},
      actionType: 'sous-action',
      identifiant: '1.1.1.4',
      pourcentage: 5,
      actionsEnfant: [
        {
          nom: "Faire apparaître une hiérarchisation des actions dans la stratégie sur la qualité de l'air",
          tags: [],
          level: 5,
          score: {
            actionId: 'cae_1.1.1.4.1',
            concerne: true,
            desactive: false,
            pointFait: 0,
            renseigne: false,
            pointPasFait: 0,
            pointPotentiel: 0.2,
            pointProgramme: 0,
            pointReferentiel: 0.2,
            totalTachesCount: 1,
            pointNonRenseigne: 0.2,
            pointPotentielPerso: null,
            completedTachesCount: 0,
            faitTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
          points: 0.2,
          preuves: null,
          actionId: 'cae_1.1.1.4.1',
          categorie: null,
          scoresTag: {},
          actionType: 'tache',
          identifiant: '1.1.1.4.1',
          pourcentage: 33.333333333333336,
          actionsEnfant: [],
        },
        {
          nom: "Réaliser un chiffrage des impacts du programme d'actions sur la qualité de l'air",
          tags: [],
          level: 5,
          score: {
            actionId: 'cae_1.1.1.4.2',
            concerne: true,
            desactive: false,
            pointFait: 0,
            renseigne: false,
            pointPasFait: 0,
            pointPotentiel: 0.2,
            pointProgramme: 0,
            pointReferentiel: 0.2,
            totalTachesCount: 1,
            pointNonRenseigne: 0.2,
            pointPotentielPerso: null,
            completedTachesCount: 0,
            faitTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
          points: 0.2,
          preuves: null,
          actionId: 'cae_1.1.1.4.2',
          categorie: null,
          scoresTag: {},
          actionType: 'tache',
          identifiant: '1.1.1.4.2',
          pourcentage: 33.333333333333336,
          actionsEnfant: [],
        },
        {
          nom: "Quantifier les actions en termes d'émissions de polluants atmosphériques évitées (En zone PPA)",
          tags: [],
          level: 5,
          score: {
            actionId: 'cae_1.1.1.4.3',
            concerne: true,
            desactive: false,
            pointFait: 0,
            renseigne: false,
            pointPasFait: 0,
            pointPotentiel: 0.2,
            pointProgramme: 0,
            pointReferentiel: 0.2,
            totalTachesCount: 1,
            pointNonRenseigne: 0.2,
            pointPotentielPerso: null,
            completedTachesCount: 0,
            faitTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
          points: 0.2,
          preuves: null,
          actionId: 'cae_1.1.1.4.3',
          categorie: null,
          scoresTag: {},
          actionType: 'tache',
          identifiant: '1.1.1.4.3',
          pourcentage: 33.333333333333336,
          actionsEnfant: [],
        },
      ],
    },
    {
      nom: 'Décliner la stratégie climat-air-énergie de manière opérationnelle en cohérence avec les objectifs',
      tags: ['mise en œuvre'],
      level: 4,
      score: {
        actionId: 'cae_1.1.1.5',
        concerne: true,
        desactive: false,
        pointFait: 0,
        renseigne: false,
        pointPasFait: 0,
        pointPotentiel: 3.6,
        pointProgramme: 0,
        pointReferentiel: 3.6,
        totalTachesCount: 1,
        pointNonRenseigne: 3.6,
        pointPotentielPerso: null,
        completedTachesCount: 0,
        faitTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
      },
      points: 3.6,
      preuves: null,
      actionId: 'cae_1.1.1.5',
      categorie: 'mise en œuvre',
      scoresTag: {},
      actionType: 'sous-action',
      identifiant: '1.1.1.5',
      pourcentage: 30,
      actionsEnfant: [],
    },
    {
      nom: 'Diffuser la vision, les objectifs et la stratégie Climat-Air-Énergie',
      tags: ['mise en œuvre'],
      level: 4,
      score: {
        actionId: 'cae_1.1.1.6',
        concerne: true,
        desactive: false,
        pointFait: 0,
        renseigne: false,
        pointPasFait: 0,
        pointPotentiel: 1.2,
        pointProgramme: 0,
        pointReferentiel: 1.2,
        totalTachesCount: 4,
        pointNonRenseigne: 1.2,
        pointPotentielPerso: null,
        completedTachesCount: 0,
        faitTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
      },
      points: 1.2,
      preuves: null,
      actionId: 'cae_1.1.1.6',
      categorie: 'mise en œuvre',
      scoresTag: {},
      actionType: 'sous-action',
      identifiant: '1.1.1.6',
      pourcentage: 10,
      actionsEnfant: [
        {
          nom: 'Comparer annuellement les objectifs au rythme réel de mise en œuvre sur le territoire',
          tags: [],
          level: 5,
          score: {
            actionId: 'cae_1.1.1.6.1',
            concerne: true,
            desactive: false,
            pointFait: 0,
            renseigne: false,
            pointPasFait: 0,
            pointPotentiel: 0.3,
            pointProgramme: 0,
            pointReferentiel: 0.3,
            totalTachesCount: 1,
            pointNonRenseigne: 0.3,
            pointPotentielPerso: null,
            completedTachesCount: 0,
            faitTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
          points: 0.3,
          preuves: null,
          actionId: 'cae_1.1.1.6.1',
          categorie: null,
          scoresTag: {},
          actionType: 'tache',
          identifiant: '1.1.1.6.1',
          pourcentage: 25,
          actionsEnfant: [],
        },
        {
          nom: 'Reprendre les objectifs dans les documents de planification',
          tags: [],
          level: 5,
          score: {
            actionId: 'cae_1.1.1.6.2',
            concerne: true,
            desactive: false,
            pointFait: 0,
            renseigne: false,
            pointPasFait: 0,
            pointPotentiel: 0.3,
            pointProgramme: 0,
            pointReferentiel: 0.3,
            totalTachesCount: 1,
            pointNonRenseigne: 0.3,
            pointPotentielPerso: null,
            completedTachesCount: 0,
            faitTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
          points: 0.3,
          preuves: null,
          actionId: 'cae_1.1.1.6.2',
          categorie: null,
          scoresTag: {},
          actionType: 'tache',
          identifiant: '1.1.1.6.2',
          pourcentage: 25,
          actionsEnfant: [],
        },
        {
          nom: 'Communiquer en interne et en externe pour diffuser et partager la vision',
          tags: [],
          level: 5,
          score: {
            actionId: 'cae_1.1.1.6.3',
            concerne: true,
            desactive: false,
            pointFait: 0,
            renseigne: false,
            pointPasFait: 0,
            pointPotentiel: 0.3,
            pointProgramme: 0,
            pointReferentiel: 0.3,
            totalTachesCount: 1,
            pointNonRenseigne: 0.3,
            pointPotentielPerso: null,
            completedTachesCount: 0,
            faitTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
          points: 0.3,
          preuves: null,
          actionId: 'cae_1.1.1.6.3',
          categorie: null,
          scoresTag: {},
          actionType: 'tache',
          identifiant: '1.1.1.6.3',
          pourcentage: 25,
          actionsEnfant: [],
        },
        {
          nom: 'Répondre à des appels à projets climat-air-énergie',
          tags: [],
          level: 5,
          score: {
            actionId: 'cae_1.1.1.6.4',
            concerne: true,
            desactive: false,
            pointFait: 0,
            renseigne: false,
            pointPasFait: 0,
            pointPotentiel: 0.3,
            pointProgramme: 0,
            pointReferentiel: 0.3,
            totalTachesCount: 1,
            pointNonRenseigne: 0.3,
            pointPotentielPerso: null,
            completedTachesCount: 0,
            faitTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
          points: 0.3,
          preuves: null,
          actionId: 'cae_1.1.1.6.4',
          categorie: null,
          scoresTag: {},
          actionType: 'tache',
          identifiant: '1.1.1.6.4',
          pourcentage: 25,
          actionsEnfant: [],
        },
      ],
    },
    {
      nom: 'Évaluer et valoriser les résultats de cette politique climat-air-énergie',
      tags: ['effets'],
      level: 4,
      score: {
        actionId: 'cae_1.1.1.7',
        concerne: true,
        desactive: false,
        pointFait: 0,
        renseigne: false,
        pointPasFait: 0,
        pointPotentiel: 4.2,
        pointProgramme: 0,
        pointReferentiel: 4.2,
        totalTachesCount: 3,
        pointNonRenseigne: 4.2,
        pointPotentielPerso: null,
        completedTachesCount: 0,
        faitTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
      },
      points: 4.2,
      preuves: null,
      actionId: 'cae_1.1.1.7',
      categorie: 'effets',
      scoresTag: {},
      actionType: 'sous-action',
      identifiant: '1.1.1.7',
      pourcentage: 35,
      actionsEnfant: [
        {
          nom: 'Réduire la consommation énergétique totale du territoire',
          tags: [],
          level: 5,
          score: {
            actionId: 'cae_1.1.1.7.1',
            concerne: true,
            desactive: false,
            pointFait: 0,
            renseigne: false,
            pointPasFait: 0,
            pointPotentiel: 1.4,
            pointProgramme: 0,
            pointReferentiel: 1.4,
            totalTachesCount: 1,
            pointNonRenseigne: 1.4,
            pointPotentielPerso: null,
            completedTachesCount: 0,
            faitTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
          points: 1.4000000000000004,
          preuves: null,
          actionId: 'cae_1.1.1.7.1',
          categorie: null,
          scoresTag: {},
          actionType: 'tache',
          identifiant: '1.1.1.7.1',
          pourcentage: 33.33333333333334,
          actionsEnfant: [],
        },
        {
          nom: 'Réduire les émissions annuelles de gaz à effet de serre du territoire',
          tags: [],
          level: 5,
          score: {
            actionId: 'cae_1.1.1.7.2',
            concerne: true,
            desactive: false,
            pointFait: 0,
            renseigne: false,
            pointPasFait: 0,
            pointPotentiel: 1.4,
            pointProgramme: 0,
            pointReferentiel: 1.4,
            totalTachesCount: 1,
            pointNonRenseigne: 1.4,
            pointPotentielPerso: null,
            completedTachesCount: 0,
            faitTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
          points: 1.4000000000000004,
          preuves: null,
          actionId: 'cae_1.1.1.7.2',
          categorie: null,
          scoresTag: {},
          actionType: 'tache',
          identifiant: '1.1.1.7.2',
          pourcentage: 33.33333333333334,
          actionsEnfant: [],
        },
        {
          nom: "Réduire les émissions annuelles des 6 polluants atmosphériques règlementaires de l'arrêté PCAET (NOx ; PM10 ; PM2,5 ; COV ; SO2 et ammoniac)",
          tags: [],
          level: 5,
          score: {
            actionId: 'cae_1.1.1.7.3',
            concerne: true,
            desactive: false,
            pointFait: 0,
            renseigne: false,
            pointPasFait: 0,
            pointPotentiel: 1.4,
            pointProgramme: 0,
            pointReferentiel: 1.4,
            totalTachesCount: 1,
            pointNonRenseigne: 1.4,
            pointPotentielPerso: null,
            completedTachesCount: 0,
            faitTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
          points: 1.4000000000000004,
          preuves: null,
          actionId: 'cae_1.1.1.7.3',
          categorie: null,
          scoresTag: {},
          actionType: 'tache',
          identifiant: '1.1.1.7.3',
          pourcentage: 33.33333333333334,
          actionsEnfant: [],
        },
      ],
    },
  ],
};

const result = [
  {
    actionId: 'cae_1.1.1',
    identifiant: '1.1.1',
    nom: 'Définir la vision, les objectifs et la stratégie Climat-Air-Énergie',
  },
  {
    actionId: 'cae_1.1.1.1',
    identifiant: '1.1.1.1',
    nom: 'Formaliser la vision et les engagements',
  },
  {
    actionId: 'cae_1.1.1.2',
    identifiant: '1.1.1.2',
    nom: 'Définir les principaux objectifs énergétiques et climatiques',
  },
  {
    actionId: 'cae_1.1.1.3',
    identifiant: '1.1.1.3',
    nom: 'Détailler la stratégie et les objectifs énergétiques et climatiques par secteurs d’activités (scénarios)',
  },
  {
    actionId: 'cae_1.1.1.4',
    identifiant: '1.1.1.4',
    nom: 'Préciser la stratégie sur la qualité de l’air',
  },
  {
    actionId: 'cae_1.1.1.5',
    identifiant: '1.1.1.5',
    nom: 'Décliner la stratégie climat-air-énergie de manière opérationnelle en cohérence avec les objectifs',
  },
  {
    actionId: 'cae_1.1.1.6',
    identifiant: '1.1.1.6',
    nom: 'Diffuser la vision, les objectifs et la stratégie Climat-Air-Énergie',
  },
  {
    actionId: 'cae_1.1.1.7',
    identifiant: '1.1.1.7',
    nom: 'Évaluer et valoriser les résultats de cette politique climat-air-énergie',
  },
];

describe('getActionsAndSubActionsIdIdentifiantAndName', () => {
  it('should return an empty array for null input', () => {
    const result = getActionsAndSubActionsIdIdentifiantAndName(null);
    expect(result).toEqual([]);
  });

  it('should return an empty array for undefined input', () => {
    const result = getActionsAndSubActionsIdIdentifiantAndName(undefined);
    expect(result).toEqual([]);
  });

  it('should return an empty array for an empty object', () => {
    const result = getActionsAndSubActionsIdIdentifiantAndName({});
    expect(result).toEqual([]);
  });

  it('should extract data from a single action node', () => {
    const actionNode = {
      actionType: 'action',
      actionId: 'action-1',
      identifiant: 'A1',
      nom: 'Test Action',
    };

    const result = getActionsAndSubActionsIdIdentifiantAndName(actionNode);

    expect(result).toEqual([
      {
        actionId: 'action-1',
        identifiant: 'A1',
        nom: 'Test Action',
      },
    ]);
  });

  it('should extract data from a single sous-action node', () => {
    const actionNode = {
      actionType: 'sous-action',
      actionId: 'sous-action-1',
      identifiant: 'SA1',
      nom: 'Test Sous-Action',
    };

    const result = getActionsAndSubActionsIdIdentifiantAndName(actionNode);

    expect(result).toEqual([
      {
        actionId: 'sous-action-1',
        identifiant: 'SA1',
        nom: 'Test Sous-Action',
      },
    ]);
  });

  it('should ignore action nodes with wrong actionType', () => {
    const actionNode = {
      actionType: 'tache',
      actionId: 'tache-1',
      identifiant: 'T1',
      nom: 'Test Tache',
    };

    const result = getActionsAndSubActionsIdIdentifiantAndName(actionNode);

    expect(result).toEqual([]);
  });

  it('should ignore action nodes missing actionId', () => {
    const actionNode = {
      actionType: 'action',
      identifiant: 'A1',
      nom: 'Test Action',
    };

    const result = getActionsAndSubActionsIdIdentifiantAndName(actionNode);

    expect(result).toEqual([]);
  });

  it('should ignore action nodes missing nom', () => {
    const actionNode = {
      actionType: 'action',
      actionId: 'action-1',
      identifiant: 'A1',
    };

    const result = getActionsAndSubActionsIdIdentifiantAndName(actionNode);

    expect(result).toEqual([]);
  });

  it('should extract data from parent and children actions', () => {
    const actionNode = {
      actionType: 'action',
      actionId: 'parent-1',
      identifiant: 'P1',
      nom: 'Parent Action',
      actionsEnfant: [
        {
          actionType: 'sous-action',
          actionId: 'child-1',
          identifiant: 'C1',
          nom: 'Child Action 1',
        },
        {
          actionType: 'sous-action',
          actionId: 'child-2',
          identifiant: 'C2',
          nom: 'Child Action 2',
        },
      ],
    };

    const result = getActionsAndSubActionsIdIdentifiantAndName(actionNode);

    expect(result).toEqual([
      {
        actionId: 'parent-1',
        identifiant: 'P1',
        nom: 'Parent Action',
      },
      {
        actionId: 'child-1',
        identifiant: 'C1',
        nom: 'Child Action 1',
      },
      {
        actionId: 'child-2',
        identifiant: 'C2',
        nom: 'Child Action 2',
      },
    ]);
  });

  it('should handle deeply nested action trees', () => {
    const actionNode = {
      actionType: 'action',
      actionId: 'level-1',
      identifiant: 'L1',
      nom: 'Level 1',
      actionsEnfant: [
        {
          actionType: 'sous-action',
          actionId: 'level-2-a',
          identifiant: 'L2A',
          nom: 'Level 2 A',
          actionsEnfant: [
            {
              actionType: 'action',
              actionId: 'level-3',
              identifiant: 'L3',
              nom: 'Level 3',
            },
          ],
        },
        {
          actionType: 'sous-action',
          actionId: 'level-2-b',
          identifiant: 'L2B',
          nom: 'Level 2 B',
        },
      ],
    };

    const result = getActionsAndSubActionsIdIdentifiantAndName(actionNode);

    expect(result).toEqual([
      {
        actionId: 'level-1',
        identifiant: 'L1',
        nom: 'Level 1',
      },
      {
        actionId: 'level-2-a',
        identifiant: 'L2A',
        nom: 'Level 2 A',
      },
      {
        actionId: 'level-3',
        identifiant: 'L3',
        nom: 'Level 3',
      },
      {
        actionId: 'level-2-b',
        identifiant: 'L2B',
        nom: 'Level 2 B',
      },
    ]);
  });

  it('should skip invalid children but process valid ones', () => {
    const actionNode = {
      actionType: 'action',
      actionId: 'parent-1',
      identifiant: 'P1',
      nom: 'Parent Action',
      actionsEnfant: [
        {
          actionType: 'tache', // Wrong type
          actionId: 'invalid-1',
          identifiant: 'I1',
          nom: 'Invalid Action',
        },
        {
          actionType: 'sous-action',
          actionId: 'valid-1',
          identifiant: 'V1',
          nom: 'Valid Action',
        },
        {
          actionType: 'action',
          // Missing actionId
          identifiant: 'I2',
          nom: 'Invalid Action 2',
        },
      ],
    };

    const result = getActionsAndSubActionsIdIdentifiantAndName(actionNode);

    expect(result).toEqual([
      {
        actionId: 'parent-1',
        identifiant: 'P1',
        nom: 'Parent Action',
      },
      {
        actionId: 'valid-1',
        identifiant: 'V1',
        nom: 'Valid Action',
      },
    ]);
  });

  it('should handle empty actionsEnfant array', () => {
    const actionNode = {
      actionType: 'action',
      actionId: 'action-1',
      identifiant: 'A1',
      nom: 'Test Action',
      actionsEnfant: [],
    };

    const result = getActionsAndSubActionsIdIdentifiantAndName(actionNode);

    expect(result).toEqual([
      {
        actionId: 'action-1',
        identifiant: 'A1',
        nom: 'Test Action',
      },
    ]);
  });

  it('should handle non-array actionsEnfant', () => {
    const actionNode = {
      actionType: 'action',
      actionId: 'action-1',
      identifiant: 'A1',
      nom: 'Test Action',
      actionsEnfant: 'not-an-array',
    };

    const result = getActionsAndSubActionsIdIdentifiantAndName(actionNode);

    expect(result).toEqual([
      {
        actionId: 'action-1',
        identifiant: 'A1',
        nom: 'Test Action',
      },
    ]);
  });

  it('should preserve order of actions in the result', () => {
    const actionNode = {
      actionType: 'action',
      actionId: 'first',
      identifiant: 'F',
      nom: 'First',
      actionsEnfant: [
        {
          actionType: 'sous-action',
          actionId: 'second',
          identifiant: 'S',
          nom: 'Second',
        },
        {
          actionType: 'action',
          actionId: 'third',
          identifiant: 'T',
          nom: 'Third',
        },
      ],
    };

    const result = getActionsAndSubActionsIdIdentifiantAndName(actionNode);

    expect(result.map((r) => r.actionId)).toEqual(['first', 'second', 'third']);
  });

  it('should handle complex tree with mixed valid and invalid nodes at multiple levels', () => {
    const actionNode = {
      actionType: 'action',
      actionId: 'root',
      identifiant: 'R',
      nom: 'Root',
      actionsEnfant: [
        {
          actionType: 'tache',
          actionId: 'skip-1',
          identifiant: 'S1',
          nom: 'Skip 1',
          actionsEnfant: [
            {
              actionType: 'action',
              actionId: 'nested-valid',
              identifiant: 'NV',
              nom: 'Nested Valid',
            },
          ],
        },
        {
          actionType: 'sous-action',
          actionId: 'valid-branch',
          identifiant: 'VB',
          nom: 'Valid Branch',
          actionsEnfant: [
            {
              actionType: 'action',
              // Missing nom
              actionId: 'invalid-nested',
              identifiant: 'IN',
            },
          ],
        },
      ],
    };

    const result = getActionsAndSubActionsIdIdentifiantAndName(actionNode);

    expect(result).toEqual([
      {
        actionId: 'root',
        identifiant: 'R',
        nom: 'Root',
      },
      {
        actionId: 'nested-valid',
        identifiant: 'NV',
        nom: 'Nested Valid',
      },
      {
        actionId: 'valid-branch',
        identifiant: 'VB',
        nom: 'Valid Branch',
      },
    ]);
  });

  it('should correctly extract actions and sub-actions from real-world CAE action tree', () => {
    // Using the real-world actionNode data defined at the top of the file
    const actualResult =
      getActionsAndSubActionsIdIdentifiantAndName(actionNode);

    // Verify we got the expected number of actions and sub-actions
    expect(actualResult).toHaveLength(8);

    // Verify it matches the expected result structure
    expect(actualResult).toEqual(result);

    // Verify specific properties of the first item (parent action)
    expect(actualResult[0]).toEqual({
      actionId: 'cae_1.1.1',
      identifiant: '1.1.1',
      nom: 'Définir la vision, les objectifs et la stratégie Climat-Air-Énergie',
    });

    // Verify specific properties of a sub-action
    expect(actualResult[1]).toEqual({
      actionId: 'cae_1.1.1.1',
      identifiant: '1.1.1.1',
      nom: 'Formaliser la vision et les engagements',
    });

    // Verify the last sub-action
    expect(actualResult[7]).toEqual({
      actionId: 'cae_1.1.1.7',
      identifiant: '1.1.1.7',
      nom: 'Évaluer et valoriser les résultats de cette politique climat-air-énergie',
    });

    // Verify all actionIds are unique
    const actionIds = actualResult.map((item) => item.actionId);
    const uniqueActionIds = new Set(actionIds);
    expect(uniqueActionIds.size).toBe(actionIds.length);

    // Verify all items have the required fields
    actualResult.forEach((item) => {
      expect(item).toHaveProperty('actionId');
      expect(item).toHaveProperty('identifiant');
      expect(item).toHaveProperty('nom');
      expect(typeof item.actionId).toBe('string');
      expect(typeof item.identifiant).toBe('string');
      expect(typeof item.nom).toBe('string');
      expect(item.actionId).toBeTruthy();
      expect(item.identifiant).toBeTruthy();
      expect(item.nom).toBeTruthy();
    });
  });

  it('should exclude tache type actions from the real-world CAE action tree', () => {
    const actualResult =
      getActionsAndSubActionsIdIdentifiantAndName(actionNode);

    // Verify that no tache-type actions are included
    // The actionNode has multiple tache nodes (e.g., cae_1.1.1.1.1, cae_1.1.1.1.2)
    // but they should not be in the result
    const tacheIds = ['cae_1.1.1.1.1', 'cae_1.1.1.1.2', 'cae_1.1.1.2.1'];

    actualResult.forEach((item) => {
      expect(tacheIds).not.toContain(item.actionId);
    });
  });

  it('should maintain hierarchical order in the real-world CAE action tree', () => {
    const actualResult =
      getActionsAndSubActionsIdIdentifiantAndName(actionNode);

    // The identifiants should follow a logical hierarchical order
    const identifiants = actualResult.map((item) => item.identifiant);

    expect(identifiants).toEqual([
      '1.1.1', // Parent action
      '1.1.1.1', // First sub-action
      '1.1.1.2', // Second sub-action
      '1.1.1.3', // Third sub-action
      '1.1.1.4', // Fourth sub-action
      '1.1.1.5', // Fifth sub-action
      '1.1.1.6', // Sixth sub-action
      '1.1.1.7', // Seventh sub-action
    ]);
  });
});
