-- Deploy tet:labellisation/action_critere_formulations_exigence to pg
-- requires: labellisation/prerequis

BEGIN;

update labellisation_action_critere
set formulation = v.formulation
from (values
    ('cae', '2', 'cae_1.1.2.0.1', 'Être en conformité vis-à-vis des obligations réglementaires PCAET'),
    ('cae', '2', 'cae_1.1.2.0.2', 'Être en conformité vis-à-vis des obligations réglementaires BGES'),
    ('eci', '1', 'eci_2.1.0', 'Respecter ou programmer la mise en conformité avec la réglementation PLPDMA'),
    ('eci', '1', 'eci_2.2.0', 'Respecter ou programmer la mise en conformité avec la réglementation liée au système de collecte'),
    ('eci', '1', 'eci_2.3.0', 'Respecter ou programmer la mise en conformité avec la règlementation concernant la valorisation des déchets (dont organiques)'),
    ('eci', '1', 'eci_2.4.0', 'Respecter ou programmer la mise en conformité avec la règlementation sur les impacts environnementaux des émissions polluantes et les nuisances (olfactives, sonores....)')
) as v (referentiel, etoile, action_id, formulation)
where labellisation_action_critere.referentiel::text = v.referentiel
  and labellisation_action_critere.etoile::text = v.etoile
  and labellisation_action_critere.action_id = v.action_id;

COMMIT;
