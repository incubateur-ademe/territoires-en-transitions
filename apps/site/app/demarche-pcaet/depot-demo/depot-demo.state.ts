import {
  clamp,
  getCurrentKeyframe,
  getProgress,
  isBetween,
} from '@/site/components/animated-demo/timeline';
import {
  ADOPTION_TIME,
  AVIS,
  CLICK_DURATION,
  CLICKS,
  COMPACT_DOCUMENT_CARDS,
  CONFETTI,
  DELIBERATION_ADOPTION,
  DOCUMENTS,
  ELABORATION_SUB_STEPS,
  ETAPES,
  GES_INPUT,
  GES_VALUES,
  MAIL,
  OBJECTIF_HORIZONS,
  PROGRAMME_IMPORT,
  PUBLISH_BUTTON,
  SCREENS,
  VOLETS,
  VULNERABILITE,
  getNiveauInputTime,
  getObjectifTyping,
} from './depot-demo.scenario';

export type UploadPhase = 'empty' | 'flying' | 'uploading' | 'uploaded';
export type ImportPhase = 'idle' | 'flying' | 'loading' | 'done';
/** Même vocabulaire que les badges de complétude de l'app. */
export type CompletionStatut = 'complete' | 'incomplete';
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

const getUpload = (time: number, at: number) => ({
  phase: getUploadPhase(time, at),
  progress: getProgress(time, at + FLY_DURATION, UPLOAD_DURATION),
});

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
const getVoletValues = (voletIndex: number, rowCount: number) =>
  voletIndex === 0
    ? GES_VALUES
    : Array.from({ length: rowCount }, (_, row) => {
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
    const status: CompletionStatut =
      time >= volet.completedAt ? 'complete' : 'incomplete';
    return { ...volet, isActive: index === activeIndex, status };
  });
  const activeVolet = volets[activeIndex];

  // Le premier volet se saisit lentement, ligne par ligne ; les suivants d'un coup.
  const isFirstVolet = activeIndex === 0;
  const inputDuration = isFirstVolet ? 0.25 : 0.12;
  const values = getVoletValues(activeIndex, activeVolet.rows.length);
  const rows = activeVolet.rows.map((label, row) => {
    const revealAt = (column: number) =>
      isFirstVolet
        ? GES_INPUT.start + row * GES_INPUT.rowStep + column * 0.05
        : activeVolet.openAt + 0.05 + row * 0.02 + column * 0.01;
    return {
      label,
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
      ? VULNERABILITE.thematiques.map(({ name, niveaux }, row) => ({
          name,
          niveaux: niveaux.map((niveau, column) =>
            time >= getNiveauInputTime(row, column) ? niveau : null
          ),
          // Un horizon « non concerné » n'attend pas d'objectif, comme dans l'app.
          objectifs: OBJECTIF_HORIZONS.map((_, horizon) => {
            if (niveaux[horizon + 1] === 'non_concerne') return null;
            const typing = getObjectifTyping(row, horizon);
            return getProgress(time, typing.start, typing.duration);
          }),
        }))
      : null;

  return { volets, activeVolet, rows, vulnerabilite };
};

const getDocuments = (time: number) => {
  const uploadedNames = new Set(
    DOCUMENTS.filter(
      ({ upload }) =>
        upload && getUploadPhase(time, upload.at) === 'uploaded'
    ).map(({ name }) => name)
  );
  const documents = DOCUMENTS.map((document) => {
    if (document.upload) {
      return {
        ...document,
        ...getUpload(time, document.upload.at),
        isInclusionDeclarable: false,
        isIncluded: false,
      };
    }
    // La case d'inclusion n'apparaît qu'une fois l'une des pièces d'accueil
    // déposée : sans elle, il n'y aurait rien à cocher.
    const isInclusionDeclarable =
      document.inclusion !== undefined &&
      document.inclusion.in.some((name) => uploadedNames.has(name));
    return {
      ...document,
      phase: 'empty' as UploadPhase,
      progress: 0,
      isInclusionDeclarable,
      isIncluded:
        isInclusionDeclarable &&
        document.inclusion !== undefined &&
        time >= document.inclusion.at,
    };
  });
  // Les pièces obligatoires que la scène compacte ne détaille pas.
  const others = documents.filter(
    ({ required, name, inclusion }) =>
      required && !inclusion && !COMPACT_DOCUMENT_CARDS.includes(name)
  );
  return {
    documents,
    otherRequired: {
      done: others.filter(({ phase }) => phase === 'uploaded').length,
      total: others.length,
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

  const deliberation = getUpload(time, DELIBERATION_ADOPTION.uploadAt);
  const canPublish = deliberation.phase === 'uploaded';
  const isPublishButtonVisible = isBetween(
    time,
    PUBLISH_BUTTON.appearsAt,
    ADOPTION_TIME
  );
  const isAdopted = time >= ADOPTION_TIME;

  const primaryButton =
    screen === 'diagnostic' || screen === 'documents'
      ? { label: 'Étape suivante', enabled: true, visible: true }
      : screen === 'programme'
      ? {
          label: 'Valider le dépôt et transmettre pour avis',
          enabled: canValidate,
          visible: true,
        }
      : {
          label: 'Valider le dépôt final',
          enabled: canPublish,
          visible: isPublishButtonVisible,
        };

  return {
    screen,
    isClicking: CLICKS.some((click) =>
      isBetween(time, click, click + CLICK_DURATION)
    ),
    ...getDocuments(time),
    ...getDiagnostic(time),
    programme: {
      importPhase,
      planName: PROGRAMME_IMPORT.planName,
      hasPlan: importPhase === 'loading' || importPhase === 'done',
      actionCount: clamp(
        Math.round(
          ((time - PROGRAMME_IMPORT.doneAt) / 0.5) *
            PROGRAMME_IMPORT.actionCount
        ),
        0,
        PROGRAMME_IMPORT.actionCount
      ),
      canValidate,
    },
    etapes,
    currentEtape:
      etapes.find(({ status }) => status === 'active') ??
      etapes[etapes.length - 1],
    isElaborating: etapes[0].status === 'active',
    isFinalisation: etapes[2].status === 'active',
    subSteps: ELABORATION_SUB_STEPS.map((subStep) => ({
      ...subStep,
      status: (time >= subStep.completedAt
        ? 'complete'
        : 'incomplete') as CompletionStatut,
      isCurrent: subStep.screen === screen,
    })),
    avis: {
      title:
        time < ETAPES[2].start
          ? 'Transmission pour avis'
          : isAdopted
          ? 'Démarche adoptée'
          : 'Avis reçus et documents attendus',
      subtitle:
        time < ETAPES[2].start
          ? 'Votre dossier a été transmis au préfet de région et au conseil régional.'
          : isAdopted
          ? 'Le dossier est adopté : il passe en lecture seule et devient consultable par le public.'
          : 'Consultez les avis reçus et déposez ou mettez à jour les pièces réglementaires du dossier.',
      mailArrived: time >= MAIL.arrivesAt,
      mailOpened: time >= MAIL.opensAt,
      outgoingReport: AVIS.find(({ outAt, receivedAt }) =>
        isBetween(time, outAt, receivedAt)
      ),
      received: AVIS.map((avis) => ({
        ...avis,
        isReceived: time >= avis.receivedAt,
      })),
      // Les pièces de l'adoption n'ont de sens qu'une fois les avis rendus.
      showAdoptionPieces: time >= ETAPES[2].start,
      deliberation,
      canPublish,
      isPublishButtonVisible,
      isAdopted,
    },
    primaryButton,
    showConfetti: isBetween(time, CONFETTI.start, CONFETTI.end),
  };
};

export type DepotDemoState = ReturnType<typeof getDepotDemoState>;
