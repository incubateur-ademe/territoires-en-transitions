export interface AuditItemCheckedInterface {
  epci_id: string;
  isCheckedByItemText: Record<string, boolean>;
}
export class AuditItemCheckedStorable {
  epci_id: string;
  isCheckedByItemText: Record<string, boolean>;

  constructor(args: AuditItemCheckedInterface) {
    this.epci_id = args.epci_id;
    this.isCheckedByItemText = args.isCheckedByItemText;
  }
  static buildId(epci_id: string): string {
    return epci_id;
  }

  get id(): string {
    return AuditItemCheckedStorable.buildId(this.epci_id);
  }

  static get pathname(): string {
    return 'audit_item_checked';
  }

  get pathname(): string {
    return AuditItemCheckedStorable.pathname;
  }
}
