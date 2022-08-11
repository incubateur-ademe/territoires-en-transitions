import {NiveauAcces} from 'generated/dataLayer';
import {Membre, TRemoveFromCollectivite, TUpdateMembre} from '../types';
import MembreListTableRow from './MembreListTableRow';

const thClassNames = 'py-3 px-5 whitespace-nowrap';

export type MembreListTableProps = {
  currentUserId: string;
  currentUserAccess: NiveauAcces;
  membres?: Membre[];
  isLoading: boolean;
  updateMembre: TUpdateMembre;
  removeFromCollectivite: TRemoveFromCollectivite;
};

const MembreListTable = ({
  membres,
  isLoading,
  currentUserId,
  currentUserAccess,
  updateMembre,
  removeFromCollectivite,
}: MembreListTableProps) => {
  return (
    <div className="mx-auto border-8 border-t-0 border-bf925 bg-bf925 rounded-lg overflow-x-hidden">
      <div className="overflow-x-auto w-full">
        <table
          data-test="MembreListTable"
          className="min-w-full text-sm text-left"
        >
          <thead>
            <tr>
              <th className={thClassNames}>Nom et adresse mail</th>
              <th className={thClassNames}>Numéro de tél.</th>
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
                Détails fonction{' '}
                <span className="block text-xs font-normal">
                  dans cette collectivité
                </span>
              </th>
              <th className={`${thClassNames}`}>
                <div className="flex items-center">Accès</div>
              </th>
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
