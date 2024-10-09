-- Deploy tet:collectivite/competence to pg

BEGIN;

create or replace function ajoute_competences_banatic() returns trigger as $$
begin
    insert into collectivite_banatic_competence (collectivite_id, competence_code)
    select new.collectivite_id, c.competence_code
    from imports.competence_banatic c
    join banatic_competence bc on c.competence_code = bc.code -- Evite d'essayer d'ajouter des competences non en BD
    where c.siren = new.siren
    on conflict (collectivite_id, competence_code) do nothing;
    return new;
exception
    when others then return new;
end;
$$ language plpgsql security definer;

create trigger after_insert_add_competence
    after insert
    on epci
    for each row
execute procedure ajoute_competences_banatic();

-- Ajoute les compétences des collectivités déjà présentes
insert into collectivite_banatic_competence (collectivite_id, competence_code)
select epci.collectivite_id, c.competence_code
from epci
join imports.competence_banatic c on epci.siren = c.siren
join banatic_competence on code = c.competence_code
on conflict (collectivite_id, competence_code) do nothing;

COMMIT;
