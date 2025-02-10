export default interface NodePostgresError {
  name: string;
  code: string;
  detail: string;
  severity: string;
  schema: string;
  table: string;
  constraint: string;
  file: string;
  line: string;
  routine: string;
  length: number;
}
