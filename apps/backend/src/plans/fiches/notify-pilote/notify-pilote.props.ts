import { NotificationTemplate } from '@tet/backend/utils/notifications/models/notification-template.dto';

export interface AssignedAction {
  planNom: string | null;
  actionTitre: string | null;
  actionDateFin: string | null;
  actionUrl: string;
  sousActionTitre: string | null;
  isSousAction: boolean;
}

// données attendues par le template
export interface NotifyPiloteProps extends NotificationTemplate {
  assignedTo: string;
  assignedBy: string;
  assignedAction: AssignedAction;
  unsubscribeUrl?: string;
}
