import {Button} from '@tet/ui';
import classNames from 'classnames';
import {openPreuve} from 'ui/shared/preuves/Bibliotheque/openPreuve';
import {TPreuve} from 'ui/shared/preuves/Bibliotheque/types';

type MenuCarteDocumentProps = {
  document: TPreuve;
  className?: string;
};

const MenuCarteDocument = ({document, className}: MenuCarteDocumentProps) => {
  const {fichier, lien} = document;

  return (
    (!!fichier || !!lien) && (
      <div className={classNames('flex gap-2', className)}>
        {/* Modifier le titre du document */}
        <Button
          icon="edit-line"
          title="Renommer le document"
          variant="grey"
          size="xs"
          onClick={() => {}}
        />

        {/* Commenter */}
        <Button
          icon="discuss-line"
          title="Commenter"
          variant="grey"
          size="xs"
          onClick={() => {}}
        />

        {/* Supprimer le document */}
        <Button
          icon="delete-bin-6-line"
          title="Supprimer le document"
          variant="grey"
          size="xs"
          onClick={() => {}}
        />
      </div>
    )
  );
};

export default MenuCarteDocument;
