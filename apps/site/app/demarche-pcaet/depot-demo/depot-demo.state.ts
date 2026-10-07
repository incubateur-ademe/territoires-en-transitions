import {
  clamp,
  getCurrentKeyframe,
  getProgress,
  isBetween,
} from '@/site/components/animated-demo/timeline';
import {
  ADOPT_BUTTON,
  ADOPTION_TIME,
  AVIS,
  CLICK_DURATION,
  CLICKS,
  CONFETTI,
  DOCUMENTS,
  ELABORATION_SUB_STEPS,
  ETAPES,
  GES_VALUES,
  INCLUSIONS,
  MAIL,
  PROGRAMME_IMPORT,
  SCREENS,
  SECTORS,
  VOLETS,
  VULNERABILITE,
  getNiveauInputTime,
  getObjectifTyping,
} from './depot-demo.scenario';

export type UploadPhase = 'empty' | 'flying' | 'uploading' | 'uploaded';
export type ImportPhase = 'idle' | 'flying' | 'loading' | 'done';
export type VoletStatus = 'complete' | 'todo' | 'optional';
export type EtapeStatus = 'done' | 'active' | 'upcoming';

/** Temps de vol puis d'envoi d'un document déposé. */
const FLY_DURATION = 0.5;
const UPLOAD_DURATION = 0.9;

const getUploadPhase = (time: number, at: number): UploadPhase => {
  if (time < at) return 'empty';
  if (time < at + FLY_DURATION) return 'flying';
  if (time < at + FLY_DURATION + UPLOAD_DURATION) return 'uploading';
  return 'uploaded';
};

const getImportPhase = (time: number): ImportPhase => {
  if (time < PROGRAMME_IMPORT.flyAt) return 'idle';
  if (time < PROGRAMME_IMPORT.loadingAt) return 'flying';
  if (time < PROGRAMME_IMPORT.doneAt) return 'loading';
  return 'done';
};

const GLYPHS = '0123456789#%&@';

/** Les chiffres « défilent » le temps de leur saisie, avant la vraie valeur. */
const scramble = (value: number, seed: number, time: number) =>
  Array.from(
    String(value),
    (_, index) =>
      GLYPHS[(seed * 7 + index * 13 + Math.floor(time * 40)) % GLYPHS.length]
  ).join('');

/** Valeurs plausibles des volets autres que GES, déterministes. */
const getVoletValues = (voletIndex: number) =>
  voletIndex === 0
    ? GES_VALUES
    : SECTORS.map((_, row) => {
        const base = 40 + (((row + 3) * 131 * (voletIndex + 1)) % 900);
        return [
          base,
          Math.round(base * 0.8),
          Math.round(base * 0.55),
          Math.round(base * 0.3),
        ];
      });

const getDiagnostic = (time: number) => {
  const activeIndex = VOLETS.reduce(
    (current, volet, index) => (time >= volet.openAt ? index : current),
    0
  );
  const volets = VOLETS.map((volet, index) => {
    const status: VoletStatus =
      time >= volet.completedAt
        ? 'complete'
        : volet.optional
        ? 'optional'
        : 'todo';
    return { ...volet, isActive: index === activeIndex, status };
  });
  const activeVolet = volets[activeIndex];

  // Le premier volet se saisit lentement, ligne par ligne ; les suivants d'un coup.
  const isFirstVolet = activeIndex === 0;
  const inputDuration = isFirstVolet ? 0.25 : 0.12;
  const values = getVoletValues(activeIndex);
  const rows = SECTORS.map((sector, row) => {
    const revealAt = (column: number) =>
      isFirstVolet
        ? 7.0 + row * 0.22 + column * 0.05
        : activeVolet.openAt + 0.05 + row * 0.02 + column * 0.01;
    return {
      sector,
      isActive: time >= revealAt(0),
      cells: values[row].map((value, column) => {
        const start = revealAt(column);
        const isTyping = isBetween(time, start, start + inputDuration);
        return {
          isTyping,
          text:
            time >= start + inputDuration
              ? String(value)
              : isTyping
              ? scramble(value, row * 4 + column, time)
              : '',
        };
      }),
    };
  });

  const vulnerabilite =
    activeVolet.kind === 'vulnerabilite'
      ? VULNERABILITE.thematiques.map(({ name, niveaux }, row) => {
          const typing = getObjectifTyping(row);
          return {
            name,
            niveaux: niveaux.map((niveau, column) =>
              time >= getNiveauInputTime(row, column) ? niveau : null
            ),
            objectifProgress: getProgress(time, typing.start, typing.duration),
          };
        })
      : null;

  return { volets, activeVolet, rows, vulnerabilite };
};

const getDocuments = (time: number) => {
  let inclusionRank = 0;
  const documents = DOCUMENTS.map((document) => {
    if (document.upload) {
      return {
        ...document,
        phase: getUploadPhase(time, document.upload.at),
        progress: getProgress(
          time,
          document.upload.at + FLY_DURATION,
          UPLOAD_DURATION
        ),
        isIncluded: false,
      };
    }
    const isIncluded =
      time >= INCLUSIONS.start + inclusionRank * INCLUSIONS.step;
    inclusionRank += 1;
    return { ...document, phase: null, progress: 0, isIncluded };
  });
  const inclusions = documents.filter(({ upload }) => !upload);
  return {
    documents,
    inclusions: {
      done: inclusions.filter(({ isIncluded }) => isIncluded).length,
      total: inclusions.length,
    },
  };
};

/** Tout ce qu'affiche la démo à l'instant de scène `time`. */
export const getDepotDemoState = (time: number) => {
  const screen = getCurrentKeyframe(
    SCREENS.map((item) => ({ ...item, at: item.start })),
    time
  ).screen;

  const etapes = ETAPES.map((etape) => {
    const isDone = time >= etape.end;
    const status: EtapeStatus = isDone
      ? 'done'
      : time >= etape.start
      ? 'active'
      : 'upcoming';
    return { ...etape, status };
  });

  const importPhase = getImportPhase(time);
  const canValidate = time >= PROGRAMME_IMPORT.validatedAt;
  const canAdopt = isBetween(time, ADOPT_BUTTON.appearsAt, ADOPTION_TIME);

  const primaryButton =
    screen === 'documents' || screen === 'diagnostic'
      ? { label: 'Étape suivante', enabled: true, visible: true }
      : screen === 'programme'
      ? {
          label: 'Valider le dépôt pour avis',
          enabled: canValidate,
          visible: true,
        }
      : { label: 'Adopter le PCAET', enabled: true, visible: canAdopt };

  return {
    screen,
    isClicking: CLICKS.some((click) =>
      isBetween(time, click, click + CLICK_DURATION)
    ),
    ...getDocuments(time),
    ...getDiagnostic(time),
    programme: {
      importPhase,
      isPlanLinked: importPhase === 'done',
      actionCount: clamp(
        Math.round(
          ((time - PROGRAMME_IMPORT.doneAt) / 0.5) *
            PROGRAMME_IMPORT.actionCount
        ),
        0,
        PROGRAMME_IMPORT.actionCount
      ),
      isVerified: time >= PROGRAMME_IMPORT.verifiedAt,
      canValidate,
    },
    etapes,
    currentEtape:
      etapes.find(({ status }) => status === 'active') ??
      etapes[etapes.length - 1],
    isElaborating: etapes[0].status === 'active',
    subSteps: ELABORATION_SUB_STEPS.map((subStep) => ({
      ...subStep,
      isDone: time >= subStep.completedAt,
      isCurrent: subStep.screen === screen,
    })),
    avis: {
      title:
        time < ETAPES[2].start
          ? 'Transmis pour avis'
          : time < ADOPTION_TIME
          ? 'Consultation des avis et délibération'
          : 'Adoption',
      subtitle:
        time < ETAPES[2].start
          ? 'Votre dossier a été transmis au conseil régional et au préfet de région.'
          : time < ADOPTION_TIME
          ? 'Les avis sont arrivés. Consultez-les, puis adoptez votre plan.'
          : 'Votre plan est adopté. Place au pilotage de vos actions.',
      mailArrived: time >= MAIL.arrivesAt,
      mailOpened: time >= MAIL.opensAt,
      outgoingReport: AVIS.find(({ outAt, receivedAt }) =>
        isBetween(time, outAt, receivedAt)
      ),
      received: AVIS.map((avis) => ({
        ...avis,
        isReceived: time >= avis.receivedAt,
      })),
      canAdopt,
      isAdopted: time >= ADOPTION_TIME,
    },
    primaryButton,
    showConfetti: isBetween(time, CONFETTI.start, CONFETTI.end),
  };
};

export type DepotDemoState = ReturnType<typeof getDepotDemoState>;
