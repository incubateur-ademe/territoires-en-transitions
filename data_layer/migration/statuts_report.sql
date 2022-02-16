with nc as (
    select *
    from old.actionstatus
    join old.new_collectivites on old_epci_id = epci_id

    where avancement = 'en_cours'
    and latest
    order by epci_id
), p as (
    select nom, prenom, email, collectivite_id
    from dcp
        join private_utilisateur_droit d on d.user_id = dcp.user_id
)
select array_to_string(contacts, ', '),
       c.nom,
       case
       when starts_with(action_id, 'eco') then 'économie circulaire'
       else 'climat air énergie'
       end as referentiel,
       split_part(action_id, '__', 2) as tache,
       'https://app.territoiresentransitions.fr/collectivite/' || collectivite_id || '/tableau_bord' as lien
from nc
    join named_collectivite c on c.collectivite_id = new_collectivite_id
    left join lateral (
        select array_agg(nom || ' ' || prenom || ' <' || email || '>') as contacts
        from p where p.collectivite_id = c.collectivite_id
        ) pagg on true
order by nom, referentiel;





