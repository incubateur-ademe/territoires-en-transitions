with daily as
         (with epci_with_utilisateur as
                   (select ademe_user_id, u.epci_id, u.created_at as utilisateur_added_epci_date, nom,
                           ROW_NUMBER() OVER(PARTITION BY epci_id ORDER BY u.created_at ASC) AS utilisateur_order
                    from epci
                             join utilisateurdroits u on epci.uid = u.epci_id)
          SELECT
              utilisateur_added_epci_date::date as day,
              count(utilisateur_added_epci_date) as count
          FROM epci_with_utilisateur
          WHERE utilisateur_order = 1
          GROUP BY day
         )
select day as date,
       count,
       sum(count) over (order by day rows between unbounded preceding and current row)::integer as cumulated_count
from daily;