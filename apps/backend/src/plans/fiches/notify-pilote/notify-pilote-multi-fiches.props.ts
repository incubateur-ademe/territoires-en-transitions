import { AssignedAction, NotifyPiloteProps } from './notify-pilote.props';

// données attendues par le template
export interface NotifyPiloteMultiFichesProps
  extends Omit<NotifyPiloteProps, 'assignedAction' | 'assignedBy'> {
  assignedActions: AssignedAction[];
}
