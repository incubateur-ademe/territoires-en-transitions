create table dcp
(
    user_id     uuid references auth.users,
    nom         text                                               not null,
    prenom      text                                               not null,
    email       text                                               not null,
    limited     bool                     default false             not null,
    deleted     bool                     default false             not null,
    created_at  timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at timestamp with time zone default CURRENT_TIMESTAMP not null
);
comment on table dcp is 'Les données à caractère personnel.';

alter table dcp
    enable row level security;

create policy own_dcp_only
    on dcp
    for all
    using (auth.uid() = user_id);
