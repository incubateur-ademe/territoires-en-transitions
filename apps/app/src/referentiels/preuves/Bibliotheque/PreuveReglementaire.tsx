import { AddPreuveReglementaire } from '@/app/referentiels/preuves/AddPreuveReglementaire';
import { InfoTooltip } from '@/ui';
import classNames from 'classnames';
import DOMPurify from 'dompurify';
import { IdentifiantAction, isDisabledAction } from './IdentifiantAction';
import PreuveDoc from './PreuveDoc';
import { TPreuve, TPreuveReglementaire } from './types';

export type TPreuveReglementaireProps = {
  preuves: TPreuveReglementaire[];
  hideIdentifier?: boolean;
  displayInPanel?: boolean;
};

/**
 * Affiche une preuve règlementaire et les éventuels documents associés
 */
export const PreuveReglementaire = (props: TPreuveReglementaireProps) => {
  const { preuves, hideIdentifier, displayInPanel } = props;

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
    <div className="flex flex-col gap-5 pb-5">
      <div
        className="flex items-center justify-between gap-4"
        data-test="preuve"
      >
        {/* Titre du document + Identifiant de l'action associée */}
        <span
          data-test="desc"
          className="text-sm text-primary-9 font-medium flex flex-wrap gap-2 items-center uppercase"
        >
          {nom}{' '}
          {!(hideIdentifier ?? false) && <IdentifiantAction action={action} />}
          {description && (
            <InfoTooltip
              label={
                <div
                  className="max-w-sm [&_*]:leading-4"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(description),
                  }}
                />
              }
              activatedBy="click"
            />
          )}
        </span>

        {/* Modale d'ajout de documents */}
        <AddPreuveReglementaire preuve_id={preuve_id} isDisabled={isDisabled} />
      </div>
      {/* Liens vers les documents */}
      {haveDoc && (
        <div>
          <div
            className={classNames('grid gap-5', {
              'md:grid-cols-2 lg:grid-cols-3': !displayInPanel,
            })}
          >
            {preuves.map((preuve) => (
              <PreuveDoc key={preuve.id} preuve={preuve as TPreuve} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
