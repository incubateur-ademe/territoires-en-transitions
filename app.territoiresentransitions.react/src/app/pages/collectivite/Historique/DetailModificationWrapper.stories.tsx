import React from 'react';
import {
  DetailPrecedenteModificationWrapper,
  DetailNouvelleModificationWrapper,
} from './DetailModificationWrapper';

export default {
  component: DetailNouvelleModificationWrapper,
};

export const DetailModificationPrecedente = () => (
  <DetailPrecedenteModificationWrapper>
    <div>Modification précédente</div>
  </DetailPrecedenteModificationWrapper>
);
export const DetailNouvelleModification = () => (
  <DetailNouvelleModificationWrapper>
    <div>Nouvelle modification</div>
  </DetailNouvelleModificationWrapper>
);
