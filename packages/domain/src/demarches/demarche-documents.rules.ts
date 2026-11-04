import type { DemarcheDocumentsConfig } from './demarche-definition.schema';
import {
  getEtapeExigeanteDemarcheDocument,
  isDemarcheDocumentDeEtape,
  type DemarcheDocumentDefinition,
  type DemarcheDocumentDepose,
  type DemarcheDocumentDetection,
  type DemarcheDocumentEtape,
  type DemarcheDocumentsSnapshot,
} from './demarche-document.schema';

/**
 * Comment une pièce attendue est couverte. `fichier` = dépôt spécifique,
 * `substitut` = comprise dans une autre pièce du dossier, que ce soit d'office
 * ou parce que la collectivité a déclaré l'inclusion. Il n'y a pas d'autre
 * mécanique : toute couverture sans dépôt passe par une substitution.
 */
export type DemarcheDocumentCoverageOrigine = 'fichier' | 'substitut';

export type DemarcheDocumentCoverage = {
  documentId: string;
  couvert: boolean;
  origine: DemarcheDocumentCoverageOrigine | null;
  /** Renseigné quand `origine === 'substitut'` : la pièce qui couvre celle-ci. */
  substitutId: string | null;
};

/**
 * Calcule la couverture de chaque pièce attendue.
 *
 * Un dépôt spécifique prime toujours. Sinon, la pièce est couverte quand la
 * collectivité a déclaré qu'elle est comprise dans une autre pièce du dossier,
 * et que cette autre pièce est bien déposée : la déclaration ne vaut rien seule,
 * et la couverture retombe si le document qui l'accueille est retiré.
 *
 * Aucune couverture n'est implicite : le catalogue dit dans quoi une pièce
 * *peut* être comprise, et `automatic` décide seulement si la case naît cochée
 * au dépôt (cf. `listDefaultInclusions`). L'état affiché est toujours celui
 * qu'on lit en base — c'est ce qui rend la case décochable.
 */
export const computeDemarcheDocumentsCoverage = (
  snapshot: DemarcheDocumentsSnapshot
): DemarcheDocumentCoverage[] => {
  // Une pièce satisfaite sans fichier porte une déclaration d'inclusion : elle
  // ne vaut que si la pièce qui l'accueille est bien déposée.
  //
  // Les ensembles sont indexés sur (pièce, temps) : une pièce de portée `both`
  // peut avoir deux versions, et seule celle déposée au temps où la pièce est
  // exigée la couvre. Une reprise aval ne tient pas lieu de version transmise.
  const cle = (documentId: string, etape: DemarcheDocumentEtape) =>
    `${documentId}@${etape}`;
  const deposes = new Set(
    snapshot.documents
      .filter(({ fichier }) => fichier !== null)
      .map(({ documentId, etape }) => cle(documentId, etape))
  );
  const inclusionsDeclarees = new Set(
    snapshot.documents
      .filter(({ fichier }) => fichier === null)
      .map(({ documentId, etape }) => cle(documentId, etape))
  );

  /** Un dépôt couvre sa pièce s'il est au temps où celle-ci est exigée. */
  const estDepose = (documentId: string) =>
    deposes.has(
      cle(
        documentId,
        getEtapeExigeanteDemarcheDocument(
          snapshot.definitions.find(({ id }) => id === documentId)?.etape ??
            'amont'
        )
      )
    );
  const estDetecte = buildEstDetecte(snapshot);

  return snapshot.definitions.map((definition) => {
    const etapeExigeante = getEtapeExigeanteDemarcheDocument(definition.etape);
    if (deposes.has(cle(definition.id, etapeExigeante))) {
      return {
        documentId: definition.id,
        couvert: true,
        origine: 'fichier',
        substitutId: null,
      };
    }
    // Une ligne sans fichier ne couvre rien par elle-même : le modèle doit ouvrir
    // l'inclusion pour cette pièce, et le document qui l'accueille être déposé.
    const substitutId = inclusionsDeclarees.has(
      cle(definition.id, etapeExigeante)
    )
      ? listSubstitutsAccueillants(definition, estDepose, estDetecte)[0]
      : undefined;
    if (substitutId) {
      return {
        documentId: definition.id,
        couvert: true,
        origine: 'substitut',
        substitutId,
      };
    }
    return {
      documentId: definition.id,
      couvert: false,
      origine: null,
      substitutId: null,
    };
  });
};

/**
 * Toutes les pièces dans lesquelles celle-ci peut être comprise : celles qui
 * cochent la case au dépôt, celles qui attendent la déclaration et celles où
 * l'analyse doit l'avoir trouvée. Le calcul de couverture ne distingue les deux
 * premières qu'au défaut du dépôt ; la troisième exige en plus une détection.
 */
const listSubstituts = (
  definition: DemarcheDocumentDefinition
): readonly string[] => [
  ...definition.substituts,
  ...definition.substitutsDeclarables,
  ...definition.substitutsDetectes,
];

type EstDetecte = (definitionId: string, substitutId: string) => boolean;

const isDetectionPositive = ({
  status,
  isIncluded,
}: DemarcheDocumentDetection): boolean =>
  status === 'done' && isIncluded === true;

/** Le fichier déposé à l'amont pour chaque pièce : celui que l'analyse lit. */
const indexFichiersAmont = (
  documents: readonly DemarcheDocumentDepose[]
): ReadonlyMap<string, number> =>
  new Map(
    documents.flatMap(({ documentId, etape, fichier }) =>
      fichier !== null && etape === 'amont'
        ? [[documentId, fichier.id] as const]
        : []
    )
  );

/**
 * Une détection ne vaut que pour le fichier analysé : remplacé, il faut une
 * nouvelle analyse ; retiré, il n'y a plus rien à détecter.
 */
const isDetectionCourante = (
  detection: DemarcheDocumentDetection,
  fichiersAmont: ReadonlyMap<string, number>
): boolean => fichiersAmont.get(detection.documentId) === detection.fichierId;

const buildEstDetecte = ({
  documents,
  detections,
}: Pick<DemarcheDocumentsSnapshot, 'documents' | 'detections'>): EstDetecte => {
  const fichiersAmont = indexFichiersAmont(documents);
  return (definitionId, substitutId) =>
    detections.some(
      (detection) =>
        detection.documentId === substitutId &&
        detection.includedDocumentId === definitionId &&
        isDetectionCourante(detection, fichiersAmont) &&
        isDetectionPositive(detection)
    );
};

/**
 * Les pièces déposées qui peuvent accueillir celle-ci, dans l'ordre du
 * catalogue : pour un substitut détecté, il faut en plus que l'analyse du
 * fichier déposé y ait trouvé la pièce.
 */
const listSubstitutsAccueillants = (
  definition: DemarcheDocumentDefinition,
  estDepose: (documentId: string) => boolean,
  estDetecte: EstDetecte
): string[] => [
  ...[...definition.substituts, ...definition.substitutsDeclarables].filter(
    estDepose
  ),
  ...definition.substitutsDetectes.filter(
    (substitutId) =>
      estDepose(substitutId) && estDetecte(definition.id, substitutId)
  ),
];

/**
 * Les documents déposés dans lesquels cette pièce peut être déclarée comprise.
 * Vide, la déclaration n'aurait rien à quoi se rattacher : l'interface n'a donc
 * pas de case à proposer. Pour une pièce à substituts détectés, la liste nomme
 * les documents où l'analyse l'a trouvée.
 */
export const listDemarcheDocumentSubstitutsDeposes = (
  definition: DemarcheDocumentDefinition,
  {
    documents,
    detections,
  }: Pick<DemarcheDocumentsSnapshot, 'documents' | 'detections'>
): string[] => {
  // L'inclusion se déclare sur le dossier transmis : seules les versions amont
  // peuvent l'accueillir.
  const fichiersAmont = indexFichiersAmont(documents);
  return listSubstitutsAccueillants(
    definition,
    (id) => fichiersAmont.has(id),
    buildEstDetecte({ documents, detections })
  );
};

/** Le premier document déposé qui peut accueillir cette pièce, `null` sinon. */
export const findDemarcheDocumentSubstitutDepose = (
  definition: DemarcheDocumentDefinition,
  snapshot: Pick<DemarcheDocumentsSnapshot, 'documents' | 'detections'>
): string | null =>
  listDemarcheDocumentSubstitutsDeposes(definition, snapshot)[0] ?? null;

/**
 * Une analyse est-elle en cours sur un fichier déposé ? Restreinte à la pièce
 * cherchée quand `includedDocumentId` est donné. Une analyse d'un fichier
 * remplacé depuis ne compte pas : son résultat sera ignoré.
 */
export const isDemarcheDocumentDetectionPending = (
  {
    documents,
    detections,
  }: Pick<DemarcheDocumentsSnapshot, 'documents' | 'detections'>,
  includedDocumentId?: string
): boolean => {
  const fichiersAmont = indexFichiersAmont(documents);
  return detections.some(
    (detection) =>
      detection.status === 'pending' &&
      (includedDocumentId === undefined ||
        detection.includedDocumentId === includedDocumentId) &&
      isDetectionCourante(detection, fichiersAmont)
  );
};

/**
 * Les pages où l'analyse a trouvé cette pièce, document par document, pour les
 * seules détections qui valent encore. Un document sans page citée n'y figure
 * pas.
 */
export const listDemarcheDocumentDetectionPages = (
  includedDocumentId: string,
  {
    documents,
    detections,
  }: Pick<DemarcheDocumentsSnapshot, 'documents' | 'detections'>
): Array<{ documentId: string; pages: string[] }> => {
  const fichiersAmont = indexFichiersAmont(documents);
  return detections.flatMap((detection) =>
    detection.includedDocumentId === includedDocumentId &&
    detection.pages.length > 0 &&
    isDetectionCourante(detection, fichiersAmont) &&
    isDetectionPositive(detection)
      ? [{ documentId: detection.documentId, pages: detection.pages }]
      : []
  );
};

/**
 * La collectivité peut-elle cocher ou décocher l'inclusion de cette pièce ? Dès
 * que le catalogue lui donne un substitut, quel qu'en soit le défaut : une case
 * cochée au dépôt doit pouvoir être décochée, sinon `automatic` redeviendrait
 * une couverture perpétuelle.
 */
export const isDemarcheDocumentInclusionDeclarable = (
  definition: DemarcheDocumentDefinition
): boolean => listSubstituts(definition).length > 0;

/**
 * Pièces dont la case doit naître cochée au dépôt de `substitutId` : celles que
 * le catalogue y range d'office (`substituts`). C'est le seul rôle de
 * `automatic` — un défaut, pas une couverture perpétuelle : la collectivité peut
 * décocher ensuite.
 */
export const listDefaultInclusions = (
  definitions: readonly DemarcheDocumentDefinition[],
  substitutId: string
): readonly string[] =>
  definitions
    .filter((definition) => definition.substituts.includes(substitutId))
    .map(({ id }) => id);

/**
 * Les pièces dont la couverture conditionne la complétude d'une étape.
 *
 * Une pièce de portée `both` est exigée à l'amont seulement : sa reprise après
 * les avis est facultative et ne doit pas retenir la publication.
 */
const isRequiredSection =
  (etape: DemarcheDocumentEtape) =>
  (definition: DemarcheDocumentDefinition): boolean =>
    definition.requis &&
    getEtapeExigeanteDemarcheDocument(definition.etape) === etape;

const areRequiredSectionsCovered = (
  snapshot: DemarcheDocumentsSnapshot,
  requiredIds: ReadonlySet<string>
): boolean =>
  computeDemarcheDocumentsCoverage(snapshot)
    .filter(({ documentId }) => requiredIds.has(documentId))
    .every(({ couvert }) => couvert);

/**
 * Le topic « Documents » du dossier d'élaboration est-il complet ? Toutes les
 * pièces amont requises doivent être couvertes, d'une manière ou d'une autre. Les pièces aval (délibération d'adoption…) ne pèsent
 * pas sur la transmission : elles conditionnent la publication.
 */
export const isDemarcheDossierDocumentsComplet = (
  snapshot: DemarcheDocumentsSnapshot
): boolean => {
  const requiredIds = new Set(
    snapshot.definitions.filter(isRequiredSection('amont')).map(({ id }) => id)
  );
  if (requiredIds.size === 0) {
    return false;
  }
  return areRequiredSectionsCovered(snapshot, requiredIds);
};

/**
 * Les pièces aval requises sont-elles couvertes ? Contrairement à l'amont, un
 * modèle sans pièce aval requise est complet : rien n'est exigé pour publier.
 */
export const isDemarcheDocumentsAvalComplet = (
  snapshot: DemarcheDocumentsSnapshot
): boolean => {
  const requiredIds = new Set(
    snapshot.definitions.filter(isRequiredSection('aval')).map(({ id }) => id)
  );
  return areRequiredSectionsCovered(snapshot, requiredIds);
};

/**
 * Y a-t-il quelque chose à déposer pour cette étape ? Pilote l'affichage de la
 * sous-étape « Ajouter les documents attendus » du stepper. Un type qui n'attend
 * aucune pièce sur une étape mais y autorise les pièces additionnelles a bien un
 * écran à montrer.
 */
export const hasDemarcheDocumentsForEtape = (
  {
    definitions,
    config,
  }: Pick<DemarcheDocumentsSnapshot, 'definitions' | 'config'>,
  etape: DemarcheDocumentEtape
): boolean =>
  definitions.some((definition) =>
    isDemarcheDocumentDeEtape(definition.etape, etape)
  ) || isDemarcheDocumentsAdditionalAutorise(config, etape);

/**
 * Le type de démarche autorise-t-il la collectivité à joindre des pièces hors
 * catalogue à cette étape ?
 */
export const isDemarcheDocumentsAdditionalAutorise = (
  config: DemarcheDocumentsConfig,
  etape: DemarcheDocumentEtape
): boolean =>
  etape === 'amont' ? config.additionalAmont : config.additionalAval;

/**
 * Extension d'un nom de fichier, en minuscules. `undefined` s'il n'y en a pas :
 * un nom sans point (« pdf ») ou commençant par un point (« .pdf ») n'a pas
 * d'extension, il ne faut pas prendre le nom entier pour telle.
 */
const getFileExtension = (filename: string): string | undefined => {
  const separator = filename.lastIndexOf('.');
  if (separator <= 0 || separator === filename.length - 1) {
    return undefined;
  }
  return filename.slice(separator + 1).toLowerCase();
};

/**
 * Les formats d'une pièce : les siens quand le modèle en déclare (le programme
 * d'actions s'importe en plan, il accepte donc des tableurs), sinon ceux du type.
 */
export const resolveDemarcheDocumentFilesConfig = (
  config: DemarcheDocumentsConfig,
  {
    formatsAutorises,
    mimeTypesAutorises,
  }: Pick<DemarcheDocumentDefinition, 'formatsAutorises' | 'mimeTypesAutorises'>
): DemarcheDocumentsConfig => ({
  ...config,
  formatsAutorises: formatsAutorises ?? config.formatsAutorises,
  mimeTypesAutorises: mimeTypesAutorises ?? config.mimeTypesAutorises,
});

/**
 * Un fichier de la bibliothèque est-il acceptable comme pièce du dossier ? Les
 * deux restrictions valent indépendamment : absente, elle n'impose rien de plus
 * que la bibliothèque ; présente, elle doit être satisfaite. Le mime type n'est
 * vérifié que s'il est connu : il vient des métadonnées du stockage, donc
 * renseigné par le navigateur à l'upload.
 */
export const isDemarcheDocumentFileAccepted = (
  { filename, mimeType }: { filename: string; mimeType?: string | null },
  { formatsAutorises, mimeTypesAutorises }: DemarcheDocumentsConfig
): boolean => {
  if (formatsAutorises?.length) {
    const extension = getFileExtension(filename);
    if (!extension || !formatsAutorises.includes(extension)) {
      return false;
    }
  }
  if (mimeType && mimeTypesAutorises?.length) {
    return mimeTypesAutorises.includes(mimeType.toLowerCase());
  }
  return true;
};
