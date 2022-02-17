create extension if not exists pgtap with schema extensions;

begin;

select plan(2);

-- make uid work as if yolododo user was connected.
create or replace function auth.uid() returns uuid as
$$
select '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'::uuid;
$$ language sql stable;

select ok(is_bucket_writer((
    select id -- yolo's bucket id
    from storage.buckets b
             join collectivite_bucket cb on cb.bucket_id = b.id
    where cb.collectivite_id = 1 -- yolo's collectivité
)), 'yolo should be a writer of his bucket');


-- connect yulududu.
create or replace function auth.uid() returns uuid as
$$
select '298235a0-60e7-4ceb-9172-0a991cce0386'::uuid;
$$ language sql stable;

select ok(not is_bucket_writer((
    select id -- yolo's bucket id
    from storage.buckets b
             join collectivite_bucket cb on cb.bucket_id = b.id
    where cb.collectivite_id = 1 -- yolo's collectivité
)), 'yulu should be not be a writer of yolo''s bucket');


rollback;
