-- Deploy tet:utilisateur/usage to pg

BEGIN;

alter type usage_fonction add value if not exists 'export_xlsx';
alter type usage_fonction add value if not exists 'export_docx';

COMMIT;
