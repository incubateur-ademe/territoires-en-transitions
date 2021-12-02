INSERT INTO private_utilisateur_droit (
    id,
    user_id,
    epci_id,
    role_name,
    active,
    created_at,
    modified_at
  )
VALUES (
    id:integer,
    'user_id:uuid',
    epci_id:integer,
    'role_name:USER-DEFINED',
    active:boolean,
    'created_at:timestamp with time zone',
    'modified_at:timestamp with time zone'
  );