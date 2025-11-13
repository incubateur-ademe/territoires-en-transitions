// données attendues par le template
export type OnUpdateFichePiloteTemplate = {
  sendTo: string;
  subject: string;
  assignedTo: string;
  assignedBy: string;
  actionTitre: string | null;
  sousActionTitre: string | null;
  planNom: string | null;
  dateFin: string | null;
  description: string | null;
  actionUrl: string;
  isSousAction: boolean;
};
