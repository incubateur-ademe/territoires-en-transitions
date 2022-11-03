create function
    test.enable_evaluation_api()
    returns void
as
$$
insert into evaluation.service_configuration
values ('http://business:8888/dl_evaluation/', 'http://business:8888/dl_personnalisation/');
$$ language sql;
comment on function test.enable_evaluation_api is
    'Ajoute la configuration pour se connecter au business depuis Docker.';

create function
    test.disable_evaluation_api()
    returns void
as
$$
truncate evaluation.service_configuration;
$$ language sql;
comment on function test.disable_evaluation_api is
    'Supprime les configurations pour se connecter au business ce qui désactive les appels.';
