create or replace rule no_delete as
    on delete to private_utilisateur_droit
    do instead nothing;

create or replace rule no_delete as
    on delete to collectivite
    do instead nothing;
