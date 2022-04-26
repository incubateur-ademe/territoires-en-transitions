create or replace function
    business_replace_personnalisations(personnalisations json[])
    returns void
as
$$
begin
    if is_service_role() then
        truncate personnalisation cascade;
        truncate personnalisation_regle;
        perform business_upsert_personnalisations(personnalisations);
    else
        perform set_config('response.status', '401', true);
    end if;
end;
$$ language plpgsql;
comment on function business_replace_personnalisations is
    'Remplace les règles de personnalisation.';
