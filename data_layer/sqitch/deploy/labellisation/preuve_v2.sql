-- Deploy tet:labellisation/preuve_v2 to pg

BEGIN;

alter table preuve_audit
    add constraint preuve_collectivite_id
        foreign key (collectivite_id) references collectivite;

alter table preuve_complementaire
    add constraint preuve_collectivite_id
        foreign key (collectivite_id) references collectivite;

alter table preuve_labellisation
    add constraint preuve_collectivite_id
        foreign key (collectivite_id) references collectivite;

alter table preuve_rapport
    add constraint preuve_collectivite_id
        foreign key (collectivite_id) references collectivite;

alter table preuve_reglementaire
    add constraint preuve_collectivite_id
        foreign key (collectivite_id) references collectivite;

create index preuve_audit_idx_collectivite on preuve_audit (collectivite_id);
create index preuve_complementaire_idx_collectivite on preuve_complementaire (collectivite_id);
create index preuve_labellisation_idx_collectivite on preuve_labellisation (collectivite_id);
create index preuve_rapport_idx_collectivite on preuve_rapport (collectivite_id);
create index preuve_reglementaire_idx_collectivite on preuve_reglementaire (collectivite_id);

COMMIT;
