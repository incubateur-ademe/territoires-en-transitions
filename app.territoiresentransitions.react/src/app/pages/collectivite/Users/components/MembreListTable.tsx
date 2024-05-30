import {TNiveauAcces} from 'types/alias';
import {Membre, TRemoveFromCollectivite, TUpdateMembre} from '../types';
import MembreListTableRow from './MembreListTableRow';
import {ResendInvitationArgs} from 'app/pages/collectivite/Users/useResendInvitation';

const thClassNames = 'py-3 px-5 whitespace-nowrap text-primary-9';

export type MembreListTableProps = {
  currentUserId: string;
  currentUserAccess: TNiveauAcces;
  membres?: Membre[];
  isLoading: boolean;
  updateMembre: TUpdateMembre;
  removeFromCollectivite: TRemoveFromCollectivite;
  resendInvitation: (args: ResendInvitationArgs) => void;
};

const MembreListTable = ({
  membres,
  isLoading,
  currentUserId,
  currentUserAccess,
  updateMembre,
  removeFromCollectivite,
  resendInvitation,
}: MembreListTableProps) => {
  return (
    <div className="mx-auto border-8 border-t-0 border-primary-2 bg-primary-2 rounded-lg overflow-x-hidden">
      <div className="overflow-x-auto w-full">
        <table
          data-test="MembreListTable"
          className="min-w-full text-sm text-left"
        >
          <thead>
            <tr>
              <th className={thClassNames}>Nom et adresse mail</th>
              {/* En attente de la page gestion de compte */}
              {/* <th className={thClassNames}>Numéro de tél.</th> */}
              <th className={thClassNames}>
                Fonction{' '}
                <span className="block text-xs font-normal">
                  dans cette collectivité
                </span>
              </th>
              <th className={thClassNames}>
                Champ d'intervention{' '}
                <span className="block text-xs font-normal">
                  dans cette collectivité
                </span>
              </th>
              <th className={thClassNames}>
                Intitulé de poste{' '}
                <span className="block text-xs font-normal">
                  dans cette collectivité
                </span>
              </th>
              <th className={thClassNames}>
                <div className="flex items-center">Accès</div>
              </th>
              <th className={thClassNames}>Statut</th>
              <th className={thClassNames}>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr data-test="Loading" className="bg-white">
                <td colSpan={6} className="pt-6 pb-24 px-6">
                  Chargement...
                </td>
              </tr>
            ) : null}
            {membres
              ? membres.map(membre => (
                  <MembreListTableRow
                    key={membre.email}
                    membre={membre}
                    currentUserAccess={currentUserAccess}
                    currentUserId={currentUserId}
                    updateMembre={updateMembre}
                    removeFromCollectivite={removeFromCollectivite}
                    resendInvitation={resendInvitation}
                  />
                ))
              : null}
            {!membres && !isLoading ? (
              <tr className="bg-white">
                <td colSpan={6} className="pt-6 pb-24 px-6">
                  Personne n'est rattaché à cette collectivité
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MembreListTable;
