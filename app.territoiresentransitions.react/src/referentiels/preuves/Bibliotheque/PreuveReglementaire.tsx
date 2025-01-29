import { AddPreuveReglementaire } from '@/app/referentiels/preuves/AddPreuveReglementaire';
import { InfoTooltip } from '@/ui';
import DOMPurify from 'dompurify';
import { IdentifiantAction, isDisabledAction } from './IdentifiantAction';
import PreuveDoc from './PreuveDoc';
import { TPreuve, TPreuveReglementaire } from './types';

export type TPreuveReglementaireProps = {
  preuves: TPreuveReglementaire[];
  hideIdentifier?: boolean;
};

/**
 * Affiche une preuve règlementaire et les éventuels documents associés
 */
export const PreuveReglementaire = (props: TPreuveReglementaireProps) => {
  const { preuves, hideIdentifier } = props;

  // n'affiche rien quand la liste est vide
  if (!preuves.length) {
    return null;
  }

  // lit les informations du 1er item (identiques aux suivants)
  const first = preuves[0];
  const { action, preuve_reglementaire, fichier, lien } = first;
  const { id: preuve_id, nom, description } = preuve_reglementaire;
  const isDisabled = isDisabledAction(action);
  const haveDoc = !!fichier || !!lien;

  return (
    <div className="flex items-start gap-8 py-4" data-test="preuve">
      <div className="flex flex-1 flex-col">
        {/* Titre du document + Identifiant de l'action associée */}
        <span
          data-test="desc"
          className={`text-sm font-medium mb-3 flex gap-2 ${
            isDisabled ? 'text-grey25' : 'text-black'
          }`}
        >
          {nom}{' '}
          {!(hideIdentifier ?? false) && <IdentifiantAction action={action} />}
          {description && (
            <InfoTooltip
              label={
                <div
                  className="max-w-sm"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(description),
                  }}
                />
              }
              activatedBy="click"
              iconClassName="ml-2"
            />
          )}
        </span>

        {/* Liens vers les documents */}
        {haveDoc && (
          <div className="flex flex-col gap-3">
            {preuves.map((preuve) => (
              <PreuveDoc key={preuve.id} preuve={preuve as TPreuve} />
            ))}
          </div>
        )}
      </div>

      {/* Modale d'ajout de documents */}
      <AddPreuveReglementaire preuve_id={preuve_id} isDisabled={isDisabled} />
    </div>
  );
};
