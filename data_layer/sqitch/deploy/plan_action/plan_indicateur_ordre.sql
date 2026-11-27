-- Deploy tet:plan_action/plan_indicateur_ordre to pg
-- requires: plan_action/axe_indicateur_add_audit_columns

BEGIN;

-- Ordre choisi par la collectivité pour les indicateurs du suivi d'un plan.
-- Sans ligne, l'indicateur suit l'ordre du dépôt PCAET.
create table public.plan_indicateur_ordre
(
  plan_id         integer not null references public.axe (id) on delete cascade,
  indicateur_id   integer not null references public.indicateur_definition (id) on delete cascade,
  collectivite_id integer not null references public.collectivite (id) on delete cascade,
  ordre           integer not null,
  primary key (plan_id, indicateur_id)
);

comment on table public.plan_indicateur_ordre is
  'Ordre des indicateurs dans le suivi d''un plan, choisi par la collectivité';

alter table public.plan_indicateur_ordre enable row level security;

-- la ligne doit viser un plan de la même collectivité que celle portée par la
-- ligne : l'écriture s'appuie sur la collectivité du plan, pas sur la valeur saisie
create policy allow_read on public.plan_indicateur_ordre for select using (is_authenticated());
create policy allow_insert on public.plan_indicateur_ordre for insert with check (
  have_edition_acces(collectivite_id)
  and exists (
    select 1 from public.axe a
    where a.id = public.plan_indicateur_ordre.plan_id
      and a.collectivite_id = public.plan_indicateur_ordre.collectivite_id
  )
);
create policy allow_update on public.plan_indicateur_ordre for update using (
  have_edition_acces(collectivite_id)
  and exists (
    select 1 from public.axe a
    where a.id = public.plan_indicateur_ordre.plan_id
      and a.collectivite_id = public.plan_indicateur_ordre.collectivite_id
  )
) with check (
  have_edition_acces(collectivite_id)
  and exists (
    select 1 from public.axe a
    where a.id = public.plan_indicateur_ordre.plan_id
      and a.collectivite_id = public.plan_indicateur_ordre.collectivite_id
  )
);
create policy allow_delete on public.plan_indicateur_ordre for delete using (
  have_edition_acces(collectivite_id)
  and exists (
    select 1 from public.axe a
    where a.id = public.plan_indicateur_ordre.plan_id
      and a.collectivite_id = public.plan_indicateur_ordre.collectivite_id
  )
);

COMMIT;
