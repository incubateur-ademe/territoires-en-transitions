'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import {
  demarchePcaetObligationValues,
  pcaetStatutInstructionValues,
  STATUTS_INSTRUCTION_PAR_DEFAUT,
  type DemarchePcaetObligation,
  type PcaetStatutInstruction,
} from '@tet/domain/demarches';
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import { useEffect } from 'react';

const SORT_VALUES = [
  'echeance',
  'dateDebut',
  'collectivite',
  'contact',
  'statut',
] as const;
const DIRECTION_VALUES = ['asc', 'desc'] as const;

export type ColonneTriable = (typeof SORT_VALUES)[number];
export type DirectionTri = (typeof DIRECTION_VALUES)[number];

const LIMIT = 25;

const parsers = {
  page: parseAsInteger.withDefault(1),
  sort: parseAsStringLiteral(SORT_VALUES).withDefault('echeance'),
  // Voir le défaut serveur : échéance décroissante, donc transmissions les
  // plus récentes en tête.
  direction: parseAsStringLiteral(DIRECTION_VALUES).withDefault('desc'),
  /**
   * Le défaut vient du domaine, comme côté serveur : l'URL sans paramètre et
   * la requête sans filtre doivent montrer la même chose.
   */
  statuts: parseAsArrayOf(
    parseAsStringLiteral(pcaetStatutInstructionValues)
  ).withDefault([...STATUTS_INSTRUCTION_PAR_DEFAUT]),
  obligations: parseAsArrayOf(
    parseAsStringLiteral(demarchePcaetObligationValues)
  ).withDefault([]),
  regions: parseAsArrayOf(parseAsString).withDefault([]),
};

/**
 * La sélection de statuts est-elle celle que l'écran propose de lui-même ?
 *
 * Ce défaut n'est pas un choix de l'agent : le badge du filtre ne doit pas
 * annoncer quatre statuts retenus à quelqu'un qui vient d'arriver.
 */
const estDefautStatuts = (statuts: PcaetStatutInstruction[]): boolean =>
  statuts.length === STATUTS_INSTRUCTION_PAR_DEFAUT.length &&
  STATUTS_INSTRUCTION_PAR_DEFAUT.every((statut) => statuts.includes(statut));

/**
 * Ce que chaque filtre retient, défaut mis à part : le nombre que porte son
 * badge.
 *
 * Une liste vide ne compte pas — c'est l'absence de filtre, ce que dit
 * « Désélectionner les options ». Le défaut de statuts ne compte pas non plus,
 * pour la même raison : personne ne l'a posé.
 */
export type NbFiltresActifs = {
  statuts: number;
  obligations: number;
  regions: number;
};

export const useListDossiersInstruction = (serviceId: number) => {
  const trpc = useTRPC();

  const [{ page, sort, direction, statuts, obligations, regions }, setParams] =
    useQueryStates(parsers, {
      urlKeys: {
        page: '$p',
        sort: '$s',
        direction: '$d',
        statuts: '$st',
        obligations: '$ob',
        regions: '$rg',
      },
      // Un tri, une page ou un filtre ne sont pas des étapes de navigation :
      // les empiler obligerait à autant de retours en arrière pour quitter
      // l'écran.
      history: 'replace',
    });

  const { data, isLoading, isError, refetch } = useQuery(
    trpc.demarches.pcaet.listDossiersInstruction.queryOptions(
      {
        collectiviteId: serviceId,
        page,
        limit: LIMIT,
        sort,
        direction,
        statuts,
        // Un filtre vide n'est pas un filtre : l'omettre laisse le serveur
        // répondre pour tout le périmètre.
        obligations: obligations.length > 0 ? obligations : undefined,
        regionCodes: regions.length > 0 ? regions : undefined,
      },
      {
        /**
         * Garder la page précédente le temps du rechargement.
         *
         * Sans cela, chaque filtre coché vide `data`, l'écran repasse par son
         * chargement et démonte le tableau — donc le menu de filtre qu'on est en
         * train d'utiliser se referme, et cocher deux statuts d'affilée devient
         * impossible. La pagination clignotait de la même façon.
         */
        placeholderData: keepPreviousData,
      }
    )
  );

  /**
   * Une page hors plage — un lien partagé, un filtre resserré depuis la page 4 —
   * ne doit pas laisser l'écran sur un tableau vide expliqué par « aucun dossier
   * ne correspond à ces filtres » pendant que la pagination en annonce deux. Le
   * serveur ramène déjà à la dernière page garnie : l'URL le suit, sinon elle
   * mentirait sur ce qui est affiché.
   */
  const nbPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : null;
  useEffect(() => {
    if (nbPages !== null && page > nbPages) {
      setParams({ page: nbPages });
    }
  }, [nbPages, page, setParams]);

  const trierPar = (colonne: ColonneTriable) =>
    setParams({
      sort: colonne,
      direction: sort === colonne && direction === 'asc' ? 'desc' : 'asc',
      page: 1,
    });

  /** Tout changement de filtre ramène à la première page. */
  const setFiltres = (filtres: {
    statuts?: PcaetStatutInstruction[];
    obligations?: DemarchePcaetObligation[];
    regions?: string[];
  }) => setParams({ ...filtres, page: 1 });

  const reinitialiserFiltres = () =>
    setParams({
      statuts: null,
      obligations: null,
      regions: null,
      page: 1,
    });

  return {
    data,
    isLoading,
    isError,
    refetch,
    page: nbPages === null ? page : Math.min(page, nbPages),
    limit: LIMIT,
    sort,
    direction,
    filtres: { statuts, obligations, regions },
    nbFiltresActifs: {
      statuts: estDefautStatuts(statuts) ? 0 : statuts.length,
      obligations: obligations.length,
      regions: regions.length,
    } satisfies NbFiltresActifs,
    setFiltres,
    reinitialiserFiltres,
    setPage: (nouvellePage: number) => setParams({ page: nouvellePage }),
    trierPar,
  };
};
