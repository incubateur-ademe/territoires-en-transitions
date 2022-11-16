import {DesactiverLesFiltres} from 'app/pages/ToutesLesCollectivites/components/DesactiverLesFiltres';
import {useState} from 'react';
import {MultiSelectFilter} from 'ui/shared/select/MultiSelectFilter';
import {ITEM_ALL} from 'ui/shared/select/commons';
import {HistoriqueType} from '../types';

export type TFilters = {
  /** filtre par collectivité */
  collectivite_id: number;
  /** par action */
  action_id?: string;
  /** par membres de la collectivité */
  members?: string[];
  /** Par type d'historique */
  types?: TFilterType[];
  /** par plage de dates */
  startDate?: Date;
  endDate?: Date;
  /** index de la page voulue */
  page?: number;
};

type TFilterType = HistoriqueType | 'tous';

/** Membres */
const fakeMemberList = [
  {value: ITEM_ALL, label: 'Tous'},
  {value: '1', label: 'Yoda'},
  {value: '2', label: 'Leia'},
  {value: '3', label: 'Anakin'},
  {value: '4', label: 'Luke'},
];

/** Types d'historique */
const fakeTypes: {value: TFilterType; label: string}[] = [
  {value: ITEM_ALL, label: 'Tous'},
  {value: 'action_statut', label: 'Action : statut'},
  {value: 'action_precision', label: 'Action : texte'},
  {value: 'reponse', label: 'Caractéristique de la collectivité'},
];

export type TSetFilters = (newFilter: TFilters | null) => void;

const initialFiltersStateValue: TFilters = {
  collectivite_id: 1,
  action_id: undefined,
  members: undefined,
  types: undefined,
  startDate: undefined,
  endDate: undefined,
  page: 1,
};

/** Classnames partagées */
const filtreWrapperClassnames = 'w-full md:w-1/2 lg:w-full lg:max-w-xs';
const filtreTitleClassnames = 'mb-2 font-medium';

export type HistoriqueFiltresProps = {
  setFilters: TSetFilters;
};

const HistoriqueFiltres = ({setFilters}: HistoriqueFiltresProps) => {
  const [filtersState, setFiltersState] = useState<TFilters>(
    initialFiltersStateValue
  );

  const onMembersSelect = (members: string[]) => {
    if (members.includes(ITEM_ALL)) {
      setFiltersState({...filtersState, members: undefined});
    } else {
      setFiltersState({...filtersState, members});
    }
  };

  const onTypesSelect = (types: TFilterType[]) => {
    if (types.includes(ITEM_ALL)) {
      setFiltersState({...filtersState, types: undefined});
    } else {
      setFiltersState({...filtersState, types});
    }
  };

  return (
    <div className="my-8">
      <p className="mb-6 font-bold">
        Filtrer l’historique des modifications par
      </p>
      <div className="flex flex-wrap gap-x-8 gap-y-6">
        <FiltreMembre
          collectiviteMemberList={fakeMemberList}
          filteredMembers={filtersState.members ?? [ITEM_ALL]}
          onSelect={onMembersSelect}
        />
        <FiltreType
          typeList={fakeTypes}
          filteredTypes={filtersState.types ?? [ITEM_ALL]}
          onSelect={onTypesSelect}
        />
      </div>
      <div className="flex items-baseline gap-6 mt-8">
        <span className="text-sm text-gray-400">nb resultat</span>
        <DesactiverLesFiltres
          onClick={() => setFiltersState(initialFiltersStateValue)}
        />
      </div>
      <div className="mt-16">{JSON.stringify(filtersState)}</div>
    </div>
  );
};

export default HistoriqueFiltres;

type FiltreMembreProps = {
  collectiviteMemberList: {value: string; label: string}[];
  filteredMembers: string[];
  onSelect: (membres: string[]) => void;
};

const FiltreMembre = ({
  collectiviteMemberList,
  filteredMembers,
  onSelect,
}: FiltreMembreProps) => {
  return (
    <div className={filtreWrapperClassnames}>
      <p className={filtreTitleClassnames}>Membre de la collectivité</p>
      <div className="shadow">
        <MultiSelectFilter
          values={filteredMembers}
          options={collectiviteMemberList}
          onSelect={onSelect}
          placeholderText="Sélectionner une option"
        />
      </div>
    </div>
  );
};

type FiltreTypeProps = {
  typeList: {value: TFilterType; label: string}[];
  filteredTypes: TFilterType[];
  onSelect: (types: TFilterType[]) => void;
};

const FiltreType = ({typeList, filteredTypes, onSelect}: FiltreTypeProps) => {
  return (
    <div className={filtreWrapperClassnames}>
      <p className={filtreTitleClassnames}>Type d'élément modifié</p>
      <div className="shadow">
        <MultiSelectFilter
          values={filteredTypes}
          options={typeList}
          onSelect={onSelect}
          placeholderText="Sélectionner une option"
        />
      </div>
    </div>
  );
};
