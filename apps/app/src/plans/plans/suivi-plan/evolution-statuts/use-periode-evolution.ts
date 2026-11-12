import { format, isValid, parseISO } from 'date-fns';
import { createParser, parseAsStringLiteral, useQueryStates } from 'nuqs';
import {
  getAujourdhui,
  getDateDebutPeriode,
  PERIODE_EVOLUTION_PAR_DEFAUT,
  PeriodeEvolution,
  periodeEvolutionValues,
} from './periode-evolution';

const parseAsIsoDate = createParser({
  parse: (value) => {
    const date = parseISO(value);
    return isValid(date) && format(date, 'yyyy-MM-dd') === value ? value : null;
  },
  serialize: (value: string) => value,
});

export const usePeriodeEvolution = (dateDebutPlan: string) => {
  const [{ periode, debut, fin }, setParams] = useQueryStates(
    {
      periode: parseAsStringLiteral(periodeEvolutionValues).withDefault(
        PERIODE_EVOLUTION_PAR_DEFAUT
      ),
      debut: parseAsIsoDate,
      fin: parseAsIsoDate,
    },
    {
      urlKeys: {
        periode: 'evolutionPeriode',
        debut: 'evolutionDebut',
        fin: 'evolutionFin',
      },
    }
  );

  const aujourdhui = getAujourdhui();
  const isPersonnalisee = periode === 'personnalisee';
  const dateDebut =
    periode === 'personnalisee'
      ? debut ??
        getDateDebutPeriode(PERIODE_EVOLUTION_PAR_DEFAUT, dateDebutPlan)
      : getDateDebutPeriode(periode, dateDebutPlan);
  const dateFin = isPersonnalisee ? fin ?? aujourdhui : aujourdhui;

  const setPeriode = (nouvellePeriode: PeriodeEvolution) =>
    setParams(
      nouvellePeriode === 'personnalisee'
        ? { periode: nouvellePeriode, debut: dateDebut, fin: dateFin }
        : { periode: nouvellePeriode, debut: null, fin: null }
    );

  return {
    periode,
    dateDebut,
    dateFin,
    aujourdhui,
    isDateFinAujourdhui: dateFin === aujourdhui,
    setPeriode,
    setDateDebut: (date: string) => setParams({ debut: date }),
    setDateFin: (date: string) => setParams({ fin: date }),
  };
};
