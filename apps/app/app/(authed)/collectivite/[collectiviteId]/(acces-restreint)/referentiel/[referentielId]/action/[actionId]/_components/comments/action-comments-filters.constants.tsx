import {
  discussionOrderByEnum,
  discussionStatus,
} from '@tet/domain/collectivites';

export const statusOptions = [
  { label: 'Tous les commentaires', value: discussionStatus.ALL },
  { label: 'Commentaires ouverts', value: discussionStatus.OUVERT },
  { label: 'Commentaires fermés', value: discussionStatus.FERME },
];

export const orderByOptions = [
  { label: 'mesure', value: discussionOrderByEnum.ACTION_ID },
  { label: 'date de publication', value: discussionOrderByEnum.CREATED_AT },
  { label: 'auteur', value: discussionOrderByEnum.CREATED_BY },
];
