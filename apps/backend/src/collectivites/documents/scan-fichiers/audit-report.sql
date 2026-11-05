-- Rapport d'audit antivirus des fichiers déposés.
--
-- À jouer en lecture seule sur la base visée, une requête à la fois, et à
-- exporter en CSV pour revue, par exemple :
--   psql "$DATABASE_URL" -c "\copy (<requête>) to 'infectes.csv' csv header"
--
-- Un faux positif avéré se requalifie à la main, avant le passage en mode
-- de suppression :
--   update public.collectivite_fichier_scan
--   set status = 'clean', signature = null
--   where bucket_id = '<bucket>' and object_name = '<hash>';


-- 1. Avancement : stock des buckets de collectivité et verdicts.
with stock as (
  select o.bucket_id, o.name, (o.metadata ->> 'size')::bigint as size
  from storage.objects o
  where exists (
    select 1 from public.collectivite_bucket cb where cb.bucket_id = o.bucket_id
  )
)
select
  count(*)                                         as fichiers,
  pg_size_pretty(sum(stock.size))                  as volume,
  count(s.id) filter (where s.status = 'clean')    as sains,
  count(s.id) filter (where s.status = 'infected') as infectes,
  count(s.id) filter (where s.status = 'error')    as en_erreur,
  count(*) filter (where s.id is null)             as restant,
  round(100.0 * count(s.id) / nullif(count(*), 0), 1) as pct_analyse
from stock
left join public.collectivite_fichier_scan s
  on s.bucket_id = stock.bucket_id and s.object_name = stock.name;


-- 2. Fichiers infectés, avec leurs usages. Une ligne par collectivité qui
-- référence le fichier dans sa bibliothèque.
select
  c.id                  as collectivite_id,
  c.nom                 as collectivite,
  bf.filename           as nom_fichier,
  s.object_name         as hash,
  s.signature,
  s.engine_version      as moteur,
  o.created_at          as depose_le,
  s.scanned_at          as analyse_le,
  s.deleted_at          as supprime_le,
  array_remove(array[
    case when exists (select 1 from public.preuve_complementaire p where p.fichier_id = bf.id) then 'preuve complémentaire' end,
    case when exists (select 1 from public.preuve_reglementaire p where p.fichier_id = bf.id) then 'preuve réglementaire' end,
    case when exists (select 1 from public.preuve_labellisation p where p.fichier_id = bf.id) then 'preuve de labellisation' end,
    case when exists (select 1 from public.preuve_audit p where p.fichier_id = bf.id) then 'preuve d''audit' end,
    case when exists (select 1 from public.preuve_rapport p where p.fichier_id = bf.id) then 'rapport de visite' end,
    case when exists (select 1 from public.annexe a where a.fichier_id = bf.id) then 'annexe de fiche' end,
    case when exists (select 1 from public.demarche_document d where d.fichier_id = bf.id) then 'document de démarche' end,
    case when exists (select 1 from public.demarche_document_additional d where d.fichier_id = bf.id) then 'document additionnel de démarche' end,
    case when exists (select 1 from public.demarche_pcaet_avis a where s.object_name = any (a.fichier_refs)) then 'pièce d''avis PCAET' end
  ], null)              as usages
from public.collectivite_fichier_scan s
join public.collectivite_bucket cb on cb.bucket_id = s.bucket_id
join public.collectivite c on c.id = cb.collectivite_id
left join labellisation.bibliotheque_fichier bf
  on bf.collectivite_id = cb.collectivite_id and bf.hash = s.object_name
left join storage.objects o
  on o.bucket_id = s.bucket_id and o.name = s.object_name
where s.status = 'infected'
order by s.scanned_at desc;


-- 3. Fichiers en erreur : analyse impossible après plusieurs tentatives
-- (taille hors limite, archive corrompue, objet disparu…), à examiner à la main.
select
  c.id             as collectivite_id,
  c.nom            as collectivite,
  bf.filename      as nom_fichier,
  s.object_name    as hash,
  s.attempts       as tentatives,
  (o.metadata ->> 'size')::bigint as taille,
  o.id is null     as objet_disparu,
  s.scanned_at     as derniere_tentative
from public.collectivite_fichier_scan s
join public.collectivite_bucket cb on cb.bucket_id = s.bucket_id
join public.collectivite c on c.id = cb.collectivite_id
left join labellisation.bibliotheque_fichier bf
  on bf.collectivite_id = cb.collectivite_id and bf.hash = s.object_name
left join storage.objects o
  on o.bucket_id = s.bucket_id and o.name = s.object_name
where s.status = 'error'
order by s.attempts desc, s.scanned_at desc;
