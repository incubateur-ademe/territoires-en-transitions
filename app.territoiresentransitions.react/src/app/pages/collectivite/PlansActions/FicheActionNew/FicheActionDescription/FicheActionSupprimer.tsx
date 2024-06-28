import {Button, ButtonVariant, Modal} from '@tet/ui';
import {useDeleteFicheAction} from '../../FicheAction/data/useDeleteFicheAction';
import classNames from 'classnames';

type FicheActionSupprimerProps = {
  ficheId: number | null;
  title: string | null;
  isInMultipleAxes: boolean;
  buttonClassName?: string;
  buttonVariant?: ButtonVariant;
};

/**
 * Bouton + modale de suppression d'une fiche action
 */
const FicheActionSupprimer = ({
  ficheId,
  title,
  isInMultipleAxes,
  buttonClassName,
  buttonVariant = 'outlined',
}: FicheActionSupprimerProps) => {
  const {mutate: deleteFiche} = useDeleteFicheAction({
    ficheId: ficheId!,
    axeId: null,
  });

  const handleDelete = () => {
    deleteFiche();
    close();
  };

  return (
    <Modal
      title="Supprimer la fiche"
      subTitle={title ?? 'Fiche sans titre'}
      render={({descriptionId, close}) => (
        <div data-test="supprimer-fiche-modale" className="flex flex-col gap-8">
          {/* Texte d'avertissement */}
          <div id={descriptionId}>
            {isInMultipleAxes ? (
              <>
                <p className="mb-2">
                  Cette fiche action est présente dans plusieurs plans.
                </p>
                <p className="mb-0">
                  Souhaitez-vous vraiment supprimer cette fiche de tous les
                  plans ?
                </p>
              </>
            ) : (
              <p className="mb-0">
                Souhaitez-vous vraiment supprimer cette fiche action ?
              </p>
            )}
          </div>

          {/* Boutons pour valider / annuler la suppression */}
          <div className="flex justify-end gap-4 mt-2">
            <Button onClick={close} aria-label="Annuler" variant="outlined">
              Annuler
            </Button>
            <Button onClick={handleDelete} aria-label="Valider">
              Valider
            </Button>
          </div>
        </div>
      )}
    >
      <Button
        data-test="SupprimerFicheBouton"
        icon="delete-bin-6-line"
        title="Supprimer la fiche"
        variant={buttonVariant}
        size="xs"
        className={classNames('h-fit', buttonClassName)}
      />
    </Modal>
  );
};

export default FicheActionSupprimer;
