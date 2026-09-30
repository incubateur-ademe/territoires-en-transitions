import { appLabels } from '@/app/labels/catalog';
import { DocumentSupportRenseigne } from '@tet/domain/collectivites';
import { Tooltip } from '@tet/ui';
import { JSX } from 'react';
import { DocumentTitleOptions, getDocumentTitle } from './document-label.utils';

type DocumentTitleProps = DocumentTitleOptions & {
  document: DocumentSupportRenseigne;
  onOpen: () => void;
};

export const DocumentTitle = ({
  document,
  onOpen,
  withExtension,
  withFilesize,
}: DocumentTitleProps): JSX.Element => {
  const title = getDocumentTitle(document, { withExtension, withFilesize });

  if (document.type === 'fichierManquant') {
    return <span className="text-grey-7 text-base font-bold">{title}</span>;
  }

  const openLabel =
    document.type === 'lien'
      ? appLabels.ouvrirLien
      : appLabels.telechargerFichier;

  return (
    <Tooltip label={openLabel}>
      <button
        type="button"
        className="text-primary-9 hover:text-primary-8 transition text-base font-bold cursor-pointer text-left"
        onClick={onOpen}
      >
        {title}
      </button>
    </Tooltip>
  );
};
