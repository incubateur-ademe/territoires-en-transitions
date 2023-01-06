-- Deploy tet:labellisation/audit to pg
BEGIN;

alter table audit
    add if not exists valide bool default false not null;
comment on column audit.valide is 'Vrai si l''audit à été validé par l''auditeur';

create function
    labellisation.update_audit()
    returns trigger
as
$$
begin
    -- si l'utilisateur n'est ni éditeur ni service
    if not (have_edition_acces(new.collectivite_id) or is_service_role())
    then -- alors on renvoie un code 403
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en édition sur la collectivité.';
    end if;

    -- si la collectivité est COT
    -- et que l'audit n'est pas dans le cadre d'une demande de labellisation
    -- et que l'audit passe en 'validé'
    if (new.collectivite_id in (select collectivite_id from cot)
        and new.demande_id is null
        and new.valide
        and not old.valide)
    then -- alors on termine l'audit
        new.date_fin = now();
    end if;

    return new;
end ;
$$ language plpgsql;
comment on function labellisation.update_audit is
    'Vérifie la mise à jour des audits, ferme l''audit si la validation intervient dans le cadre d''un COT.';

create trigger on_audit_update
    before update
    on audit
    for each row
execute procedure labellisation.update_audit();

create view audits
as
with ref as (select unnest(enum_range(null::referentiel)) as referentiel)
select c.id                       as collectivite_id,
       ref.referentiel,
       a.audit,
       d                          as demande,
       coalesce(cot.actif, false) as is_cot
from collectivite c
         join ref on true
         left join lateral (select labellisation.current_audit(c.id, ref.referentiel) as audit) a on true
         left join labellisation.demande d on d.id = (a).audit.demande_id
         left join cot on c.id = cot.collectivite_id;

create view audit_en_cours
as
select id, collectivite_id, referentiel, demande_id, date_debut, date_fin, valide
from audit a
where (a.date_fin is null and now() >= a.date_debut)
   or (a.date_fin is not null and now() between a.date_debut and a.date_fin);

create or replace function labellisation.current_audit(col integer, ref referentiel)
    returns audit as
$$
select *
from audit_en_cours a
where a.collectivite_id = col
  and a.referentiel = ref
order by date_debut desc
limit 1
$$ language sql;

COMMIT;
