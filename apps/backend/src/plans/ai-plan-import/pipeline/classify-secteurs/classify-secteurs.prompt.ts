import { generatePrompt } from '@tet/backend/utils/llm/prompt-template';
import { EffetAttendu } from '@tet/domain/shared';
import {
  EFFETS_ATTENDUS_CONSIGNES,
  SECTEURS_CONSIGNES,
  SECTEURS_PROMPT,
} from '../../prompts/secteurs.prompt';

export type SecteursPromptInput = {
  renderedActions: string;
  text: string;
  withSecteurs: boolean;
  effetsAttendus: EffetAttendu[];
};

export const buildSecteursPrompt = ({
  renderedActions,
  text,
  withSecteurs,
  effetsAttendus,
}: SecteursPromptInput): string => {
  const withEffets = effetsAttendus.length > 0;
  const exempleIds = effetsAttendus.slice(0, 1).map(({ id }) => id);
  const objectifs = [
    ...(withSecteurs
      ? ['le ou les secteurs d’activité sur lesquels elle agit directement']
      : []),
    ...(withEffets ? ['les effets attendus qu’elle produit'] : []),
  ];
  const champs = [
    ...(withSecteurs
      ? [
          '• "secteurs" : la liste des codes de secteurs retenus, éventuellement vide',
        ]
      : []),
    ...(withEffets
      ? [
          '• "effetsAttendus" : la liste des identifiants des effets attendus retenus, éventuellement vide (ceux de l’exemple n’illustrent que le format)',
        ]
      : []),
    ...(withSecteurs
      ? [
          '• "justification" : une phrase courte (moins de 20 mots) qui dit pourquoi ces secteurs, sans citer le document',
        ]
      : []),
  ];
  const exemple = [
    {
      index: 0,
      ...(withSecteurs && { secteurs: ['residentiel'] }),
      ...(withEffets && { effetsAttendus: exempleIds }),
      ...(withSecteurs && {
        justification: 'Rénovation énergétique des logements privés.',
      }),
    },
    {
      index: 1,
      ...(withSecteurs && { secteurs: [] }),
      ...(withEffets && { effetsAttendus: [] }),
      ...(withSecteurs && {
        justification: 'Pilotage et suivi du PCAET, sans secteur ciblé.',
      }),
    },
  ];

  return generatePrompt(SECTEURS_PROMPT, {
    plan: withSecteurs
      ? 'un plan climat-air-énergie territorial (PCAET)'
      : 'un plan d’action territorial',
    contexte: withSecteurs
      ? 'Le programme d’actions d’un PCAET porte sur les secteurs d’activité définis par la réglementation (article R. 229-52 du code de l’environnement, arrêté du 4 août 2016). '
      : '',
    objectif: objectifs.join(', ainsi que '),
    consignes: [
      ...(withSecteurs ? [SECTEURS_CONSIGNES] : []),
      ...(withEffets
        ? [
            generatePrompt(EFFETS_ATTENDUS_CONSIGNES, {
              effetsAttendus: renderEffetsAttendus(effetsAttendus),
            }),
          ]
        : []),
    ].join(''),
    champs: champs.join('\n'),
    exemple: [
      '[',
      exemple.map((entry) => `  ${JSON.stringify(entry)}`).join(',\n'),
      ']',
    ].join('\n'),
    actions: renderedActions,
    texteSource: text,
  });
};

const renderEffetsAttendus = (effetsAttendus: EffetAttendu[]): string =>
  effetsAttendus
    .map(({ id, nom, notice }) => {
      const precision = notice?.trim();
      return `• ${id} : ${nom.trim()}${precision ? ` (${precision})` : ''}`;
    })
    .join('\n');
