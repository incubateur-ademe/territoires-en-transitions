import { groupBy } from 'es-toolkit';

type SupportRow = {
  id: number | null;
  fichier: unknown;
  lien: unknown;
};

type AttenduRow = SupportRow & {
  action: { actionId: string };
  preuveReglementaire: { id: string };
};

function hasSupport({ id, fichier, lien }: SupportRow): boolean {
  return id !== null && (fichier !== null || lien !== null);
}

export function toAttendus<Row extends AttenduRow>(rows: Row[]) {
  return Object.values(
    groupBy(
      rows,
      ({ action, preuveReglementaire }) =>
        `${action.actionId}/${preuveReglementaire.id}`
    )
  ).map((depots) => ({
    preuveReglementaire: depots[0].preuveReglementaire,
    action: depots[0].action,
    documents: depots.filter(hasSupport),
  }));
}
