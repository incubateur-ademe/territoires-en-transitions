import { RouterOutput } from '@tet/api';
import {
  DocumentAttendu,
  DocumentReglementaire,
  Fichier,
  PreuveAction,
  PreuveComplementaire,
} from '../Bibliotheque/types';

type ListMesureDocumentsOutput =
  RouterOutput['referentiels']['documents']['listMesureDocuments'];

type AttenduOutput = ListMesureDocumentsOutput['attendus'][number];
type MesureOutput = AttenduOutput['action'];
type DocumentOutput = AttenduOutput['documents'][number];
type ComplementaireOutput =
  ListMesureDocumentsOutput['complementaires'][number];
type FichierOutput = NonNullable<DocumentOutput['fichier']>;

export type MesureDocuments = {
  attendus: DocumentAttendu[];
  complementaires: PreuveComplementaire[];
};

const toMesure = ({ actionId, identifiant }: MesureOutput): PreuveAction => ({
  action_id: actionId,
  identifiant,
});

const toFichier = ({
  hash,
  filename,
  filesize,
  confidentiel,
  bucketId,
}: FichierOutput): Fichier => ({
  hash,
  filename,
  filesize,
  confidentiel,
  bucket_id: bucketId,
});

const toSupport = ({ fichier, lien }: DocumentOutput | ComplementaireOutput) =>
  fichier
    ? { fichier: toFichier(fichier), lien: null }
    : { fichier: null, lien };

const toDocumentBase = (document: DocumentOutput | ComplementaireOutput) => ({
  id: document.id,
  collectivite_id: document.collectiviteId,
  commentaire: document.commentaire,
  created_at: document.modifiedAt,
  created_by: document.modifiedBy,
  created_by_nom: document.modifiedByNom,
  action: toMesure(document.action),
  demande: null,
  audit: null,
  rapport: null,
  ...toSupport(document),
});

const toDocumentReglementaire = (
  document: DocumentOutput
): DocumentReglementaire => ({
  ...toDocumentBase(document),
  preuve_type: 'reglementaire',
  preuve_reglementaire: document.preuveReglementaire,
});

const toPreuveComplementaire = (
  document: ComplementaireOutput
): PreuveComplementaire => ({
  ...toDocumentBase(document),
  preuve_type: 'complementaire',
  preuve_reglementaire: null,
});

export const toMesureDocuments = ({
  attendus,
  complementaires,
}: ListMesureDocumentsOutput): MesureDocuments => ({
  attendus: attendus.map(({ preuveReglementaire, action, documents }) => ({
    preuve_reglementaire: preuveReglementaire,
    action: toMesure(action),
    documents: documents.map(toDocumentReglementaire),
  })),
  complementaires: complementaires.map(toPreuveComplementaire),
});
