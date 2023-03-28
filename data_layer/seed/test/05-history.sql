create function
    test_clear_history()
    returns void
as
$$
truncate historique.action_statut;
truncate historique.action_precision;
truncate historique.reponse_proportion;
truncate historique.reponse_choix;
truncate historique.reponse_binaire;
$$ language sql security definer;
comment on function test_clear_history is
    'Vide les tables contenant les données historisées.';
