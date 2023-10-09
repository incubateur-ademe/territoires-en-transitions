-- Deploy tet:indicateur/filtre to pg

BEGIN;

create view private.indicateur_resume as
select indicateur.*,
       (with recursive chemin as (select axe.id     as axe_id,
                                         axe.parent,
                                         axe.*::axe as plan
                                  from axe
                                  where axe.parent is null
                                    and axe.collectivite_id = indicateur.collectivite_id
                                  union all
                                  select a.id as axe_id,
                                         a.parent,
                                         p.plan
                                  from axe a
                                           join chemin p on a.parent = p.axe_id)
        select case
                   when count(*) > 0 then array_agg(chemin.plan)
                   else null::axe[]
                   end as "case"
        from chemin
        where (chemin.axe_id in (select faa.axe_id
                                 from fiche_action_axe faa
                                          join fiche_action_indicateur fai on faa.fiche_id = fai.fiche_id
                                 where (indicateur.indicateur_personnalise is null
                                     and fai.indicateur_id = indicateur.indicateur_referentiel)
                                    or (indicateur.indicateur_referentiel is null
                                     and fai.indicateur_personnalise_id = indicateur.indicateur_personnalise)))) as plans
from (select i.id                                       as indicateur_referentiel,
             null                                       as indicateur_personnalise,
             c.id as collectivite_id,
             i.nom                                      as titre,
             i.description,
             i.unite,
             (select array_agg(row (pil.nom, pil.collectivite_id, pil.tag_id, pil.user_id)::personne) as array_agg
              from (select COALESCE(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) as nom,
                           pt.collectivite_id,
                           ip.tag_id,
                           ip.user_id
                    from indicateur_pilote ip
                             left join personne_tag pt on ip.tag_id = pt.id
                             left join dcp on ip.user_id = dcp.user_id
                    where i.id = ip.indicateur_id and c.id = ip.collectivite_id) pil) AS pilotes,
             ser.services,
             null                                       as thematiques
      from indicateur_definition i
               cross join collectivite c
               left join (select ist.indicateur_id, ist.collectivite_id,
                                 array_agg(st.*) as services
                          from service_tag st
                                   join indicateur_service_tag ist on ist.service_tag_id = st.id
                          group by ist.indicateur_id, ist.collectivite_id) ser on ser.indicateur_id = i.id
          and ser.collectivite_id = c.id
      UNION
      select null                                        as indicateur_referentiel,
             i.id                                        as indicateur_personnalise,
             i.collectivite_id,
             i.titre,
             i.description,
             i.unite,
             (select array_agg(row (pil.nom, pil.collectivite_id, pil.tag_id, pil.user_id)::personne) as array_agg
              from (select COALESCE(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) as nom,
                           pt.collectivite_id,
                           ipp.tag_id,
                           ipp.user_id
                    from indicateur_personnalise_pilote ipp
                             left join personne_tag pt on ipp.tag_id = pt.id
                             left join dcp on ipp.user_id = dcp.user_id
                    where i.id = ipp.indicateur_id) pil) as pilotes,
             ser.services,
             t.thematiques
      from indicateur_personnalise_definition i
               left join (select ipst.indicateur_id,
                                 array_agg(st.*) as services
                          from service_tag st
                                   join indicateur_personnalise_service_tag ipst on ipst.service_tag_id = st.id
                          group by ipst.indicateur_id) ser on ser.indicateur_id = i.id
               left join (select ipth.indicateur_id,
                                 array_agg(th.*) as thematiques
                          from thematique th
                                   join indicateur_personnalise_thematique ipth
                                        on ipth.thematique = th.thematique
                          GROUP BY ipth.indicateur_id) t on t.indicateur_id = i.id
     ) indicateur
;

create view public.indicateur_resume as
select ir.collectivite_id,
       ir.indicateur_referentiel,
       ir.indicateur_personnalise,
       ir.titre,
       ir.description,
       ir.unite,
       ir.services,
       ir.pilotes,
       ir.thematiques,
       ir.plans
from private.indicateur_resume ir
where can_read_acces_restreint(ir.collectivite_id);

create function filter_indicateurs(
    collectivite_id integer,
    sans_plan boolean DEFAULT false,
    axes_id integer[] DEFAULT NULL::integer[],
    sans_pilote boolean DEFAULT false,
    pilotes personne[] DEFAULT NULL::personne[],
    sans_service boolean DEFAULT false,
    services service_tag[] DEFAULT NULL::service_tag[],
    sans_thematique boolean DEFAULT false,
    thematiques thematique[] DEFAULT NULL::thematique[],
    "limit" integer DEFAULT 10
) returns setof indicateur_resume
    stable
    security definer
    language plpgsql
as
$$
    # variable_conflict use_variable
begin
    if not can_read_acces_restreint(filter_indicateurs.collectivite_id) then
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en lecture sur la collectivité.';
    end if;

    return query
        with child as (select a.axe_id as axe_id
                       from axe_descendants a
                       where a.parents && (axes_id)
                          or a.axe_id in (select * from unnest(axes_id)))
        select ir.*
        from indicateur_resume ir
        where ir.collectivite_id = filter_indicateurs.collectivite_id
          and case -- axes_id
                  when sans_plan then
                              ir.indicateur_referentiel not in (select distinct indicateur_id from fiche_action_indicateur)
                          and ir.indicateur_personnalise not in (select distinct indicateur_personnalise_id from fiche_action_indicateur)
                  when axes_id is null then true
                  else ir.indicateur_referentiel in (select indicateur_id
                                                     from child
                                                              join fiche_action_axe using (axe_id)
                                                              join fiche_action_indicateur using (fiche_id))
                      or ir.indicateur_personnalise in (select indicateur_personnalise_id
                                                        from child
                                                                 join fiche_action_axe using (axe_id)
                                                                 join fiche_action_indicateur using (fiche_id))
            end
          and case -- pilotes
                  when sans_pilote then
                              ir.indicateur_referentiel not in (select distinct indicateur_id from indicateur_pilote)
                          and ir.indicateur_personnalise not in (select distinct indicateur_id from indicateur_personnalise_pilote)
                  when pilotes is null then true
                  else ir.indicateur_referentiel in
                       (select ip.indicateur_id
                        from indicateur_pilote ip
                        where ip.tag_id in (select (pi::personne).tag_id from unnest(pilotes) pi)
                           or ip.user_id in (select (pi::personne).user_id from unnest(pilotes) pi))
                      or ir.indicateur_personnalise in
                         (select ip.indicateur_id
                          from indicateur_personnalise_pilote ip
                          where ip.tag_id in (select (pi::personne).tag_id from unnest(pilotes) pi)
                             or ip.user_id in (select (pi::personne).user_id from unnest(pilotes) pi))
            end
          and case -- services
                  when sans_service then
                              ir.indicateur_referentiel not in (select distinct indicateur_id from indicateur_service_tag)
                          and ir.indicateur_personnalise not in (select distinct indicateur_id from indicateur_personnalise_service_tag)
                  when services is null then true
                  else ir.indicateur_referentiel in
                       (select ist.indicateur_id
                        from indicateur_service_tag ist
                        where ist.service_tag_id in (select (s::service_tag).id from unnest(services) s))
                      or ir.indicateur_personnalise in
                         (select ipst.indicateur_id
                          from indicateur_personnalise_service_tag ipst
                          where ipst.service_tag_id in (select (s::service_tag).id from unnest(services) s))
            end
          and case -- thematiques
                  when sans_thematique then
                          ir.indicateur_personnalise not in (select distinct indicateur_id from indicateur_personnalise_thematique)
                  when thematiques is null then true
                  else ir.indicateur_personnalise in
                       (select ipt.indicateur_id
                        from indicateur_personnalise_thematique ipt
                        where ipt.thematique in (select * from unnest(thematiques::thematique[]) th))
            end
        order by naturalsort(ir.titre)
        limit filter_indicateurs."limit";
end;
$$;

COMMIT;
