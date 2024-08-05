import {Card, Divider, Icon} from '@tet/ui';
import {TPreuve} from 'ui/shared/preuves/Bibliotheque/types';
import {openPreuve} from 'ui/shared/preuves/Bibliotheque/openPreuve';
import MenuCarteDocument from './MenuCarteDocument';
import {getAuthorAndDate, getFormattedTitle} from './utils';

type CarteDocumentProps = {
  isReadonly: boolean;
  document: TPreuve;
};

const CarteDocument = ({isReadonly, document}: CarteDocumentProps) => {
  const {
    commentaire,
    created_at: dateCreation,
    created_by_nom: auteur,
    fichier,
    lien,
  } = document;

  if (!fichier && !lien) return null;

  return (
    <>
      <div className="relative group">
        {/* Menu de la carte document */}
        {/* {!isReadonly && (
          <MenuCarteDocument
            document={document}
            className="invisible group-hover:visible absolute top-4 right-4 "
          />
        )} */}

        {/* Carte*/}
        <Card
          className="rounded-xl"
          title={!!fichier ? 'Télécharger le fichier' : 'Ouvrir le lien'}
          onClick={() => openPreuve(document)}
        >
          <div className="flex gap-4">
            {/* Icône document ou lien */}
            <div className="shrink-0 bg-primary-3 rounded-md h-9 w-9 flex items-center justify-center">
              <Icon
                icon={!!fichier ? 'file-2-line' : 'links-line'}
                className="text-primary-10"
              />
            </div>

            {/* Contenu de la carte */}
            <div className="flex flex-col gap-2">
              {/* Titre avec format et taille du fichier */}
              <span className="text-primary-10 text-base font-bold">
                {getFormattedTitle(document)}
              </span>

              {/* Date de création et auteur */}
              <span className="text-grey-8 text-sm font-medium">
                {getAuthorAndDate(dateCreation, auteur)}
              </span>

              {/* Commentaire */}
              {!!commentaire && commentaire.length > 0 && (
                <>
                  <Divider className="-mb-5" />
                  <div className="flex gap-1">
                    <Icon
                      icon="discuss-line"
                      size="xs"
                      className="text-grey-7"
                    />
                    <span className="text-grey-8 text-xs font-medium italic">
                      {commentaire}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default CarteDocument;
