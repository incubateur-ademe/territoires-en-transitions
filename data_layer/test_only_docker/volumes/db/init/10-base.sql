create table absract_modified_at
(
    modified_at timestamp with time zone default CURRENT_TIMESTAMP not null
);

create or replace function teapot() returns json as
$$
begin
    perform set_config('response.status', '418', true);
    return json_build_object('message', 'The requested entity body is short and stout.',
                             'hint', 'Tip it over and pour it out.');
end;
$$ language plpgsql;
