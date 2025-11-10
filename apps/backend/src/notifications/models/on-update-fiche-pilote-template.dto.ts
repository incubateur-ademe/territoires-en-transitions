import { NotificationTemplate } from './notification-template.dto';

// données attendues par le template
export interface OnUpdateFichePiloteTemplate extends NotificationTemplate {
  assignedTo: string;
  assignedBy: string;
  actionTitre: string | null;
  sousActionTitre: string | null;
  planNom: string | null;
  dateFin: string | null;
  description: string | null;
  actionUrl: string;
  isSousAction: boolean;
}
