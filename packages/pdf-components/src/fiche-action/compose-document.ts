import { createElement, type JSX } from 'react';
import DocumentToExport, {
  type ImageSources,
} from '../primitives/DocumentToExport';
import FicheActionPdf, {
  type FicheActionPdfExtendedProps,
} from './FicheActionPdf';
import type { PdfSectionKey } from './utils';

export function composeFichesPdfDocument({
  fiches,
  sections,
  notesYears,
  imageSources,
}: {
  fiches: FicheActionPdfExtendedProps[];
  sections?: PdfSectionKey[];
  notesYears: number[] | 'all';
  imageSources?: ImageSources;
}): JSX.Element {
  const elements = fiches.map((props) =>
    createElement(FicheActionPdf, {
      ...props,
      ...(sections ? { sections } : {}),
      notesYears,
      key: props.fiche.id,
    })
  );
  const content = elements.length === 1 ? elements[0] : elements;
  return createElement(DocumentToExport, { content, imageSources });
}
