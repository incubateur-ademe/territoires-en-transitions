-- Create a bucket for each existing collectivité.
select id
from collectivite c
         join lateral ( select private.create_bucket(c) ) cb on true;
