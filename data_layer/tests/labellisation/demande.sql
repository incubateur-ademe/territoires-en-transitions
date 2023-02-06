begin;
select plan(1);

select *
into temporary table test_collectivite
from test_create_collectivite('CC du Bois Joli');

select results_eq(
               $have$
                 select lsd.en_cours,
                        lsd.collectivite_id,
                        lsd.referentiel,
                        lsd.etoiles,
                        lsd.date,
                        lsd.sujet
                 from test_collectivite tc
                 join labellisation_submit_demande(collectivite_id := tc.collectivite_id,
                                                   referentiel := 'eci',
                                                   sujet := 'cot',
                                                   etoiles := null) lsd on true
               $have$,
               $want$
                 select false,
                        tc.collectivite_id,
                        'eci'::referentiel,
                        null::labellisation.etoile,
                        now(),
                        'cot'::labellisation.sujet_demande
                 from test_collectivite tc
               $want$,
               'La demande de labellisation créée devrait être correspondre aux paramètre de la fonction.'
           );

end;
