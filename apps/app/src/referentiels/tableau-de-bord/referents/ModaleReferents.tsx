import { membreFonctionToLabel } from '@/app/app/labels';
import { makeCollectiviteUsersUrl } from '@/app/app/paths';
import { TMembreFonction } from '@/app/types/alias';
import { Field, Modal, ModalFooterOKCancel, OptionValue } from '@/ui';
import { pick } from 'es-toolkit';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ReferentsDropdown from './ReferentsDropdown';
import {
  CollectiviteMembre,
  groupeParFonction,
  useMembres,
} from './useMembres';
import { useUpdateMembres } from './useUpdateMembres';

export type ModaleReferentsProps = {
  collectiviteId: number;
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
};

const URL_INTRADEME =
  'https://collaboratif.ademe.fr/jcms/prod_143494/fr/cit-ergie-collectivites-cit-ergie';
const EMAIL_ADEME = 'territoireengage@ademe.fr';

/**
 * Affiche la modale d'édition des référents de la collectivité
 */
export const ModaleReferents = (props: ModaleReferentsProps) => {
  const { collectiviteId, isOpen, setIsOpen } = props;
  const { data: membresResponse } = useMembres({ collectiviteId });
  const { mutate: updateMembres } = useUpdateMembres();

  const membres = membresResponse?.data;

  // état local de la liste des membres et référents, groupés par fonction
  const [listeMembres, setListeMembres] = useState(membres);
  const parFonction = groupeParFonction(listeMembres || []);

  // synchronise l'état local après chargement de la liste des membres
  useEffect(() => {
    if (membres) {
      setListeMembres(membres);
    }
  }, [membres]);

  // met à jour l'état local après sélection/désélection dans une liste
  const handleChange = ({ selectedValue }: { selectedValue: OptionValue }) => {
    const updatedListeMembres = listeMembres?.map((membre) =>
      membre.userId === selectedValue
        ? { ...membre, estReferent: !membre.estReferent }
        : membre
    );
    setListeMembres(updatedListeMembres);
  };

  return (
    <Modal
      openState={{ isOpen, setIsOpen }}
      title="Associer des référents"
      size="md"
      render={() => (
        <>
          <p>
            “Référent” est un statut lié au programme Territoire Engagé
            Transition Écologique de l’ADEME. Les personnes désignées ci-après
            sont les contacts privilégiés de la collectivité pour l’ADEME et
            toutes les personnes intervenants dans ce cadre (Bureau d’Appui,
            auditeur, membre de la CNL) ainsi que pour leurs homologues dans
            d’autres collectivités.
          </p>

          <Field
            title="Chef·fe de projet"
            message={
              <span>
                Etes-vous inscrit-e sur l&apos;espace collaboratif{' '}
                <a href={URL_INTRADEME} target="_blank">
                  IntrADEME
                </a>{' '}
                des collectivités ? Envoyer un mail à {EMAIL_ADEME} ou via le
                chat.
              </span>
            }
          >
            <DropdownOrMessage
              collectiviteId={collectiviteId}
              fonction="technique"
              membres={parFonction?.technique}
              handleChange={handleChange}
            />
          </Field>
          <Field title="Élu·e">
            <DropdownOrMessage
              collectiviteId={collectiviteId}
              fonction="politique"
              membres={parFonction?.politique}
              handleChange={handleChange}
            />
          </Field>
          <Field title="Conseiller·ère">
            <DropdownOrMessage
              collectiviteId={collectiviteId}
              fonction="conseiller"
              membres={parFonction?.conseiller}
              handleChange={handleChange}
            />
          </Field>
        </>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{
            onClick: () => close(),
          }}
          btnOKProps={{
            onClick: () => {
              // extrait de l'état local les membres pour lesquels le flag a changé
              const toUpdate = listeMembres
                ?.filter(
                  (membre) =>
                    membre.estReferent !==
                    membres?.find((m) => membre.userId === m.userId)
                      ?.estReferent
                )
                .map((membre) => ({
                  ...pick(membre, ['userId', 'estReferent']),
                  collectiviteId,
                }));
              // et déclenche la mise à jour
              if (toUpdate?.length) {
                updateMembres(toUpdate);
              }
              close();
            },
          }}
        />
      )}
    />
  );
};

/** Affiche la liste déroulante ou un message+lien si il n'y a pas de membres */
const DropdownOrMessage = ({
  collectiviteId,
  fonction,
  membres,
  handleChange,
}: {
  collectiviteId: number;
  fonction: TMembreFonction;
  membres: CollectiviteMembre[] | undefined;
  handleChange: ({ selectedValue }: { selectedValue: OptionValue }) => void;
}) =>
  membres?.length ? (
    <ReferentsDropdown membres={membres} onChange={handleChange} />
  ) : (
    fonction && (
      <p>
        Personne n’est identifié comme “{membreFonctionToLabel[fonction]}“ dans
        la{' '}
        <Link href={makeCollectiviteUsersUrl({ collectiviteId })}>
          gestion des membres
        </Link>
      </p>
    )
  );
