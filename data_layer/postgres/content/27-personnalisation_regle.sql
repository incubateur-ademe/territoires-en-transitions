insert into public.personnalisation_regle (action_id, type, formule, description)
values  ('cae_4.1.1', 'reduction', 'max(reponse(AOM_2), 0.5) 
', '<p>Pour une collectivité non AOM, le score est proportionnel à la participation dans la structure AOM dans la limite de 50 %.</p>
'),
        ('cae_4.1.2', 'reduction', 'si reponse(TC_1, NON) et reponse(vehiculeCT_1, NON) alors 0.5
sinon si reponse(TC_1, NON) alors 0.8
sinon si reponse(vehiculeCT_1, NON) alors 0.7
', '<p>Pour une collectivité dont la desserte des locaux par les transports publics est inenvisageable, le score est diminué de 20 %.</p>
<p>Pour une collectivité ne disposant pas de véhicules, le score est diminué de 30 % et les statuts des sous-actions 4.1.2.1, 4.1.2.3 et 4.1.2.4 sont &quot;non concerné&quot;.</p>
<p>Ces 2 réductions sont cumulables.</p>
'),
        ('cae_4.1.2.1', 'desactivation', 'reponse(vehiculeCT_1, NON)
', ''),
        ('cae_4.1.2.3', 'desactivation', 'reponse(vehiculeCT_1, NON)
', ''),
        ('cae_4.1.2.4', 'desactivation', 'reponse(vehiculeCT_1, NON)
', ''),
        ('cae_4.2.1', 'reduction', 'si identite(type, commune) alors max(reponse(voirie_2), 2/8)
sinon si identite(type, EPCI) et reponse(voirie_1, voirie_1_b) alors 0.5
sinon si reponse(voirie_1, voirie_1_c) et reponse(centre_polarite, NON) alors 0.25
', '<p>Pour les communes, le score est réduit proportionnelle à la part dans l’EPCI en cas de transfert de la compétence en matière de voirie/stationnement, dans la limite de 2 points pour le pouvoir de police du maire.</p>
<p>Pour les intercommunalités qui n’ont la compétence que sur les voiries et parcs de stationnements communautaires, le score est réduit de 50 %.</p>
<p>En l’absence de compétences voirie et stationnement et de zones de polarités, le score est réduit de 75 %.</p>
'),
        ('cae_4.2.2', 'reduction', 'si reponse(pouvoir_police, NON) et reponse(trafic, NON) alors 2/16
sinon si reponse(pouvoir_police, NON) et reponse(voirie_1,voirie_1_b) alors 2/16
sinon si reponse(pouvoir_police, NON) et reponse(voirie_1,voirie_1_c) alors 2/16
sinon si reponse(voirie_1,voirie_1_b) et reponse(voirie_1,voirie_1_c) alors 2/16
sinon si reponse(voirie_1,voirie_1_b) et reponse(trafic, NON) alors 2/16
sinon si reponse(voirie_1,voirie_1_c) et reponse(trafic, NON) alors 2/16
sinon si reponse(pouvoir_police, NON) ou reponse(voirie_1,voirie_1_b) ou reponse(voirie_1,voirie_1_c) ou reponse
(trafic, NON) alors 0.5
', '<p>Pour les collectivités ne disposant pas des compétences en matière de circulation/gestion du trafic (pouvoir de police), le score est réduit de 50 %.</p>
<p>Pour les collectivités ne disposant pas de compétences en matière de voirie (création, aménagement, entretien) ou qui possèdent uniquement les voiries et parcs de stationnements communautaires, le score est réduit de 50 %.</p>
<p>Pour les collectivités pour lesquelles il n''y a manifestement pas de potentiel d''action ou de problèmes liés à la vitesse, le score est réduit de 50 %.</p>
<p>Ces réductions sont cumulables, dans la limite de 2 points potentiel restant.</p>
'),
        ('cae_4.2.3', 'reduction', 'si reponse(AOM_1, NON) et reponse (voirie_1, voirie_1_c) alors 0.5 
sinon si identite(population, moins_de_10000) ou reponse(centre_polarite, NON) alors 0.5
sinon si reponse(AOM_1, NON) et reponse (voirie_1, voirie_1_c) et identite(population, moins_de_10000) alors 0
sinon si reponse(AOM_1, NON) et reponse (voirie_1, voirie_1_c) et reponse(centre_polarite, NON) alors 0
', '<p>Pour une collectivité non AOM et sans compétence voirie, le score de la 4.2.3 est réduit de 50 %.</p>
<p>Pour une collectivité de moins de 10 000 habitants ou ne comportant pas de commune ou centre-bourg de plus de 2000 habitants, le score de la 4.2.3 est réduit de 50 %.</p>
<p>Les deux réductions sont cumulables.</p>
'),
        ('cae_4.3.1', 'reduction', 'si identite(type, commune) alors max(reponse(voirie_2), 0.5)
sinon si identite(type, EPCI) et reponse(voirie_1, voirie_1_b) alors 0.5
', '<p>Pour les communes, le score de la 4.3.1 est réduit proportionnellement à la part dans l’EPCI compétent en matière de voirie (création, aménagement, entretien) dans la limite de 50 % pour prendre en compte le pouvoir de police du maire.</p>
<p>Pour les intercommunalités qui n’ont la compétence que sur les voiries et parcs de stationnements communautaires, le score est réduit de 50 %.</p>
'),
        ('cae_4.3.2', 'reduction', 'si identite(localisation,DOM) alors 14/16
sinon si reponse(cyclable, NON) alors 0.5
', '<p>Pour une collectivité disposant de peu de compétences en matière de politique cyclable (ni AOM, ni compétente en matière d’infrastructures vélos, de stationnement vélos, de services associés aux vélos), le score de la 4.3.2 est réduit de 50 %.</p>
<p>Le nombre de point max pour l''action 4.3.2 est de 16 points en Métropole et de 14 points pour les collectivités DOM.</p>
'),
        ('cae_4.3.3', 'reduction', 'si reponse(AOM_1, OUI) alors 1.0
sinon si reponse(versement_mobilite, NON) alors 0.5
sinon si reponse(AOM_1, NON) et reponse(versement_mobilite, NON) alors min(reponse(AOM_2), 0.5)
', '<p>Pour une collectivité non AOM, le score de la 4.3.3 est réduit proportionnellement à la part de la collectivité dans la structure AOM.</p>
<p>Pour les collectivités non concernée par le versement mobilité, le score de la 4.3.3 est réduit de 50 %.</p>
<p>La réduction la plus forte prévaut.</p>
'),
        ('cae_4.3.4', 'reduction', 'si identite(localisation,DOM) alors 10/8
sinon si reponse(AOM_1, NON) alors max(reponse(AOM_2), 0.5)
', '<p>Pour une collectivité non AOM, le score de la 4.3.4 est réduit proportionnellement à la part de la collectivité dans la structure AOM.</p>
<p>Le nombre de point max pour l''action 4.3.4 est de 8 points en Métropole et de 10 points pour les collectivités DOM.</p>
'),
        ('cae_1.2.2', 'reduction', 'si identite(population, moins_de_5000) et reponse (AOM_1, NON) alors 2/12
sinon si reponse (AOM_1, NON) alors 6/12 
', '<p>Pour une collectivité n''ayant pas la compétence AOM, le score de la 1.2.2 est réduit de 50 %.</p>
<p>Pour une collectivité n''ayant pas de centre urbain de plus de 5000 habitants ET n''ayant pas la compétence AOM, le score de la 1.2.2 est réduit à 2 points.</p>
'),
        ('cae_1.2.3', 'reduction', 'si reponse(dechets_1, OUI) et reponse(dechets_2, OUI) et reponse(dechets_3, OUI) alors 1.0
sinon si reponse(dechets_1, NON) et reponse(dechets_2, NON) et reponse(dechets_3, NON) alors 2/12
sinon 0.75
', '<p>Pour une collectivité ne possédant que partiellement les compétences collecte, traitement des déchets et plan de prévention des déchets, le score de la 1.2.3 est réduit de 25 %.</p>
<p>Pour une collectivité n''ayant aucune des compétences collecte, traitement des déchets et plan de prévention des déchets, le score de la 1.2.3 est réduit à 2 points.</p>
'),
        ('cae_1.2.4', 'reduction', 'si identite(type, EPCI) et reponse(habitat_1, NON) alors 8/12 
sinon si identite(type, commune) alors max (reponse(habitat_2), 0.5) 
', '<p>Pour un EPCI n''ayant pas la compétence habitat, le score de la 1.2.4 est réduit à 8 points.</p>
<p>Si la collectivité est une commune, le potentiel est réduit à la part de la commune dans la collectivité compétente en matière de Programme Local de l’Habitat (PLH), dans la limite de 50 %.</p>
'),
        ('cae_1.3.1', 'reduction', 'si reponse(urba_1, NON) et reponse(SCoT, NON) alors 6/12 
sinon si reponse(urba_1, NON) et reponse(SCoT, OUI) alors 0.7 
', '<p>Pour une collectivité n''ayant ni la compétence PLU, ni la compétence SCOT, le score de la 1.3.1 est réduit de 50 %.</p>
<p>Pour une collectivité n''ayant pas la compétence PLU mais disposant de la compétence SCOT, le score de la 1.3.1 est réduit de 30 %.</p>
'),
        ('cae_1.3.2', 'reduction', 'si reponse(amenagement_1, NON) ou reponse (amenagement_2, NON) alors 5/10 
', '<p>Si une collectivité n''a pas de terrains utilisables ou vendables ou elle dispose de terrains de ce type mais n''a pas réalisé de vente ou de contrats d''utilisation alors le score de la 1.3.2 est réduit de 50 %.</p>
'),
        ('cae_1.3.3', 'desactivation', 'reponse(urba_1, NON) et reponse (urba_2, NON) et reponse(urba_3, NON)
', '<p>Pour une collectivité n''ayant ni la compétence PLU, ni l''instruction, ni l''octroi des permis de construire, le statut de la 1.3.3 est &quot;non concerné&quot;.</p>
'),
        ('cae_1.3.3', 'reduction', 'si reponse(urba_1, NON) et reponse (urba_2, NON) et reponse(urba_3, NON) alors 0
sinon si reponse(urba_1, OUI) ou reponse(urba_2, OUI) et reponse(urba_3, OUI) alors 0.5
', '<p>Pour une collectivité n''ayant ni la compétence PLU, ni l''instruction, ni l''octroi des permis de construire, le score de la 1.3.3 est réduit de 100 %.</p>
<p>Pour une collectivité ayant au moins 1 des compétences (PLU, instruction ou octroi des permis de construire), le score de la 1.3.3 est réduit de 50 %.</p>
'),
        ('eci_1.2.2', 'desactivation', 'si identite(type, syndicat) alors VRAI
sinon si reponse(dev_eco_1, NON) alors VRAI
', '<p>Les syndicats ne sont pas concernés par la sous-action 1.2.2.</p>
'),
        ('eci_1.2.3', 'desactivation', 'si identite(type, syndicat) alors VRAI
sinon si reponse(dev_eco_1, NON) alors VRAI
', '<p>Les syndicats ne sont pas concernés par la sous-action 1.2.3.</p>
'),
        ('eci_1.2.4', 'desactivation', 'si identite(type, syndicat) alors FAUX sinon VRAI
', '<p>Les syndicats ne sont pas concernés par la sous-action 1.2.4.</p>
'),
        ('eci_2.1', 'desactivation', 'reponse(dechets_3, NON) 
', '<p>Pour les collectivités n''ayant pas la compétence &quot;collecte des déchets&quot;, le score de l''action 2.1. est réduit à 0 et les statuts sont &quot;non concerné&quot;.</p>
'),
        ('eci_2.2', 'desactivation', 'reponse(dechets_1, NON) 
', '<p>Pour les collectivités n''ayant pas la compétence &quot;collecte des déchets&quot;, le score de l''action 2.2. est réduit à 0 et les statuts sont &quot;non concerné&quot;.</p>
'),
        ('eci_2.3', 'desactivation', 'reponse(dechets_2, NON) 
', '<p>Pour les collectivités n''ayant pas la compétence &quot;traitement des déchets&quot;, le score de l''action 2.3. est réduit à 0 et les statuts sont &quot;non concerné&quot;.</p>
'),
        ('eci_2.4.0', 'desactivation', 'reponse(dechets_1, NON) et reponse(dechets_2, NON)
', '<p>Pour les collectivités n''ayant ni la compétence &quot;collecte des déchets&quot;, ni la compétence &quot;traitement des déchets&quot;, le score de l''action 2.4. est réduit à 0 et les statuts sont &quot;non concerné&quot;.</p>
<p>Pour les collectivités n''ayant pas la compétence &quot;collecte des déchets&quot;, les scores des sous-actions 2.4.2 et 2.4.3 sont réduits à 0 et les statuts de ces 2 sous-actions sont &quot;non concerné&quot;.</p>
<p>Pour les collectivités n''ayant pas la compétence &quot;traitement des déchets&quot;, le score de la sous-action 2.4.4 est réduit à 0 et le statut de cette sous-action est &quot;non concerné&quot;.</p>
'),
        ('eci_2.4.1', 'desactivation', 'reponse(dechets_1, NON) et reponse(dechets_2, NON)
', ''),
        ('eci_2.4.2', 'desactivation', 'reponse(dechets_1, NON) 
', ''),
        ('eci_2.4.3', 'desactivation', 'reponse(dechets_1, NON) 
', '<pre><code>                                           ˚
</code></pre>
'),
        ('eci_2.4.4', 'desactivation', 'reponse(dechets_2, NON) 
', ''),
        ('eci_2.4.5', 'desactivation', 'reponse(dechets_1, NON) et reponse(dechets_2, NON)
', ''),
        ('eci_3.2.0', 'desactivation', 'reponse(SPASER, NON) 
', '<p>Les collectivités ayant un montant total annuel des achats inférieur à 100 millions d’euros hors-taxes ne sont pas concernées par le SPASER.</p>
'),
        ('eci_3.4', 'desactivation', 'reponse(dev_eco_1, NON) 
', '<p>Pour les collectivités n''ayant pas la compétence &quot;développement économique&quot;, le score de l''action 3.4. est réduit à 0 et les statuts sont &quot;non concerné&quot;.</p>
<p>Pour les collectivités ne possédant pas d''établissements de formation initiale et continue sur leur territoire, le score de la sous-action 3.4.2 est réduit à 0 et le statut est &quot;non concerné&quot;.</p>
'),
        ('eci_3.4.2', 'desactivation', 'reponse(formation, NON) 
', ''),
        ('eci_3.7.1', 'reduction', 'si identite(population, moins_de_100000) alors 3 
', '<p>La note du référentiel actuel est à 25 %. Pour les collectivités ayant une population inférieure à 100 000 habitants, la note de la sous-action passe à 75 %.</p>
'),
        ('eci_3.7.2', 'reduction', 'si identite(population, moins_de_100000) alors 1/3
', '<p>La note du référentiel actuel est à 75 %. Pour les collectivités ayant une population inférieure à 100 000 habitants, la note de la sous-action passe à 25 %.</p>
'),
        ('eci_4.1', 'desactivation', 'reponse(dechets_1, NON) et reponse(dechets_2, NON)
', '<p>Pour les collectivités n''ayant ni la compétence &quot;collecte des déchets&quot;, ni la compétence &quot;traitement des déchets&quot;, le score de l''action 4.1. est réduit à 0 et les statuts sont &quot;non concerné&quot;.</p>
'),
        ('eci_4.2.1', 'desactivation', 'reponse(dechets_1, NON) ou reponse(REOM, OUI) 
', '<p>Pour les collectivités n''ayant ni la compétence &quot;collecte des déchets&quot;, ni la compétence &quot;traitement des déchets&quot;, le score de l''action 4.2 est réduit à 0 et les statuts sont &quot;non concerné&quot;.</p>
<p>Pour les collectivités n''ayant pas la compétence &quot;collecte des déchets&quot;, les scores des sous-actions 4.2.1 à 4.2.4 sont réduits à 0 et les statuts de ces 4 sous-actions sont &quot;non concerné&quot;.</p>
<p>Pour les collectivités ayant mis en place la redevance d’enlèvement des ordures ménagères (REOM), les scores des sous-action 4.2.1 et 4.2.3 sont réduits à 0 et les statuts de ces 2 sous-actions sont &quot;non concerné&quot;.</p>
<p>La sous-action 4.2.5 ne s''adressent qu''aux syndicats de traitement.</p>
'),
        ('eci_4.2.2', 'desactivation', 'reponse(dechets_1, NON) 
', '<p>Pour les collectivités n''ayant ni la compétence &quot;collecte des déchets&quot;, ni la compétence &quot;traitement des déchets&quot;, le score de l''action 4.2 est réduit à 0 et les statuts sont &quot;non concerné&quot;.</p>
'),
        ('eci_4.2.3', 'desactivation', 'reponse(dechets_1, NON) ou reponse(REOM, OUI) 
', '<p>Pour les collectivités n''ayant ni la compétence &quot;collecte des déchets&quot;, ni la compétence &quot;traitement des déchets&quot;, le score de l''action 4.2 est réduit à 0 et les statuts sont &quot;non concerné&quot;.</p>
<p>Pour les collectivités ayant mis en place la redevance d’enlèvement des ordures ménagères (REOM), les scores des sous-action 4.2.1 et 4.2.3 sont réduits à 0 et les statuts de ces 2 sous-actions sont &quot;non concerné&quot;.</p>
'),
        ('eci_4.2.4', 'desactivation', 'reponse(dechets_1, NON) 
', '<p>Pour les collectivités n''ayant ni la compétence &quot;collecte des déchets&quot;, ni la compétence &quot;traitement des déchets&quot;, le score de l''action 4.2 est réduit à 0 et les statuts sont &quot;non concerné&quot;.</p>
<p>Pour les collectivités n''ayant pas la compétence &quot;collecte des déchets&quot;, les scores des sous-actions 4.2.1 à 4.2.4 sont réduits à 0 et les statuts de ces 4 sous-actions sont &quot;non concerné&quot;.</p>
'),
        ('eci_4.2.5', 'desactivation', 'si identite(type, syndicat) et reponse(dechets_2, OUI) alors FAUX sinon VRAI
', '<p>Pour les collectivités n''ayant ni la compétence &quot;collecte des déchets&quot;, ni la compétence &quot;traitement des déchets&quot;, le score de l''action 4.2 est réduit à 0 et les statuts sont &quot;non concerné&quot;.</p>
<p>La sous-action 4.2.5 ne s''adressent qu''aux syndicats de traitement.</p>
'),
        ('eci_4.3', 'desactivation', 'reponse(dev_eco_1, NON) 
', '<p>Pour les collectivités n''ayant pas la compétence &quot;développement économique&quot;, le score de l''action 4.3. est réduit à 0 et les statuts sont &quot;non concerné&quot;.</p>
'),
        ('cae_2.2.3.1', 'desactivation', 'identite(localisation, DOM) 
', '<p>Pour une collectivité hors France Métropolitaine, le statut de la tâche 2.2.3.1 est &quot;non concernée&quot;.</p>
'),
        ('cae_2.2.3.2', 'desactivation', 'identite(localisation, DOM) 
', '<p>Pour une collectivité hors France Métropolitaine, le statut de la tâche 2.2.3.2 est &quot;non concernée&quot;.</p>
'),
        ('cae_2.2.3.3', 'desactivation', 'identite(localisation, DOM) 
', '<p>Pour une collectivité hors France Métropolitaine, le statut de la tâche 2.2.3.3 est &quot;non concernée&quot;.</p>
'),
        ('cae_2.2.3', 'reduction', 'si identite(localisation, DOM) et reponse(ECS, NON) alors 0.3
', '<p>Pour une collectivité hors France Métropolitaine, et en l''absence de besoin d''eau chaude sanitaire, le score de la 2.2.3 est réduit de 70 %.</p>
<p>Pour une collectivité hors France Métropolitaine, le statut des tâches 2.2.3.1 à 2.2.3.3 est &quot;non concerné&quot;.</p>
'),
        ('cae_2.3.1', 'reduction', 'si identite(type, EPCI) et reponse(EP_1, EP_1_b) alors 2/6
sinon si identite(type, EPCI) et reponse(EP_1, EP_1_c) alors 0
sinon 1-reponse(EP_2)
', ''),
        ('cae_2.3.1', 'desactivation', 'identite(type, EPCI) et reponse(EP_1, EP_1_c)
', '<p>Si la collectivité est un EPCI sans compétence sur l''éclairage public, alors le score est réduit à 0 et les statuts sont &quot;non concernés&quot;.</p>
<p>Si la collectivité est un EPCI avec une compétence éclairage public limitée, alors la collectivité est évaluée sur 2 points (au lieu de 6).</p>
<p>Si la collectivité a délégué sa compétence éclairage public à une autre structure, alors le score est proportionnel à la participation de la collectivité dans la structure.</p>
'),
        ('cae_2.3.3', 'reduction', 'si reponse(voirie_1, voirie_1_b) alors 0.5
sinon si reponse(voirie_1, voirie_1_c) alors 0/2
', ''),
        ('cae_2.3.3', 'desactivation', 'reponse(voirie_1, voirie_1_c)
', '<p>Si la collectivité n''a pas la compétence voirie, alors le score est réduit à 0 et les statuts sont &quot;non concernés&quot;.</p>
<p>Si la collectivité a une compétence voirie limitée, alors la collectivité est évaluée sur 1 point (au lieu de 2).</p>
'),
        ('cae_6.1.2', 'reduction', 'si identite(type, commune) alors 3/4
', '<p>Les communes sont évaluées sur 3 points au lieu de 4.</p>
'),
        ('cae_6.2.1', 'reduction', 'si identite(type, commune) alors max(reponse(habitat_2), 2/10) 
sinon si identite(type, commune) et reponse(habitat_3, OUI) alors 11/10
', '<p>Si la collectivité est une commune, alors la réduction de potentiel est proportionnelle à la part dans l’EPCI compétent en matière de politique du logement et du cadre de vie, dans la limite de 2 points restant minimum.</p>
<p>Si la commune participe au conseil d’administration d''un bailleur social, le potentiel, possibilement rédest augmenté d''un point sur la 6.2.1</p>
'),
        ('cae_6.2.2', 'reduction', 'si identite(type, commune) alors max (reponse(habitat_2),1/6) 
', '<p>Si la collectivité est une commune, alors la réduction de potentiel est proportionnelle à la part dans l’EPCI compétent en matière de politique du logement et du cadre de vie, dans la limite d''un point restant minimum.</p>
'),
        ('cae_6.2.3', 'reduction', 'si identite(type, commune) alors max (reponse(habitat_2),0.5) 
', '<p>Si la collectivité est une commune, alors la réduction de potentiel est proportionnelle à la part dans l’EPCI compétent en matière de politique du logement et du cadre de vie, dans la limite de 50 % des points.</p>
'),
        ('cae_6.2.4', 'reduction', 'si identite(type, commune) alors max (reponse(dev_eco_2),2/8) 
', '<p>Si la collectivité est une commune, alors la réduction de potentiel est proportionnelle à la part dans l’EPCI compétent en matière de développement économique, dans la limite de 2 points de potentiel restant.</p>
'),
        ('cae_6.3.1', 'reduction', 'si identite(type, commune) alors max (reponse(dev_eco_2),2/8) 
', '<p>Si la collectivité est une commune, alors la réduction de potentiel est proportionnelle à la part dans l’EPCI compétent en matière de développement économique, dans la limite de 2 points de potentiel restant.</p>
<p>En l’absence de tissu économique propice à l’émergence de projets d’écologie industrielle, le score de la 6.3.1.4 est réduit à 0 et son statut est &quot;non concerné&quot; : les 2 points liés sont affectés à la 6.3.1.3 et la 6.3.1.5.</p>
'),
        ('cae_6.3.1.4', 'desactivation', 'reponse(dev_eco_4,NON) 
', ''),
        ('cae_6.3.1.3', 'reduction', 'si reponse(dev_eco_4,NON) alors 1.625
', ''),
        ('cae_6.3.1.5', 'reduction', 'si reponse(dev_eco_4,NON) alors 1.625
', ''),
        ('cae_6.3.2', 'reduction', 'si identite(type, commune) alors max (reponse(tourisme_1),1/4) 
sinon si identite(type, EPCI) et reponse(tourisme_2, NON) alors 1/4 
', '<p>Si la collectivité est une commune, alors la réduction de potentiel est proportionnelle à la part dans l’EPCI compétent en matière de tourisme, dans la limite d''un point de potentiel restant.</p>
<p>Pour les EPCI dont le territoire est très peu touristique (non dotés d’un office du tourisme, d''un syndicat d’initiative ou d''un bureau d’information touristique), le score est réduit à 1 point.</p>
'),
        ('cae_6.4.1', 'reduction', 'si reponse(SAU, OUI) alors 0.5 
', '<p>Pour les collectivités possédant moins de 3 % de surfaces agricoles, le score de la 6.4.1 est réduit de 50 %.</p>
'),
        ('cae_6.4.1.6', 'reduction', 'si identite(localisation, DOM) alors 4/3
', '<p>La note du référentiel actuel est à 15 %. Pour les collectivités DOM, la note de la sous-action passe à 20 %.</p>
'),
        ('cae_6.4.1.8', 'reduction', 'si identite(localisation, DOM) alors 2/3
', '<p>La note du référentiel actuel est à 15 %. Pour les collectivités DOM, la note de la sous-action passe à 10 %.</p>
'),
        ('cae_6.4.2', 'reduction', 'si reponse(foret, OUI) alors 0.5
', '<p>Pour les collectivités possédant moins de 10 % de surfaces agricoles, le score de la 6.4.2 est réduit de 50 %.</p>
'),
        ('cae_6.5.2.5', 'desactivation', 'reponse(dev_eco_3, NON)
', ''),
        ('cae_6.5.2', 'reduction', 'si reponse(dev_eco_3, NON) alors 5/6 
', '<p>Pour une collectivité non responsable de la publicité et des enseignes, le statut de la tâche 6.5.2.5 est &quot;non concernée&quot; et le score de la 6.5.2 est réduit d''un point.</p>
'),
        ('cae_6.5.3', 'reduction', 'si reponse(scolaire_2, NON) alors 0
sinon si reponse(scolaire_1, NON) alors 0.5
', ''),
        ('cae_6.5.3', 'desactivation', 'reponse(scolaire_2, NON)
', '<p>Si le territoire de la collectivité ne compte aucun établissement scolaire ou structure d’accueil de jeunes enfants sur le territoire, le score de l''action 6.5.3 est réduit à 0.</p>
<p>Si la collectivité n’est pas en charge des écoles, le score de l''action 6.5.3 est ''reduit de 50 % : le reste du potentiel est maintenu pour la compétence « soutien aux actions de maîtrise de la demande d''énergie » que la collectivité peut prendre de manière facultative.</p>
'),
        ('cae_3.1.1', 'reduction', 'si reponse(AOD_elec, OUI) et reponse(AOD_gaz, OUI) et reponse(AOD_chaleur, OUI) alors 1.0 
sinon si reponse(AOD_elec, NON) et reponse(AOD_gaz, NON) et reponse(AOD_chaleur, NON) alors 2/10 
sinon si reponse(AOD_elec, NON) et reponse(AOD_gaz, NON) alors 4/10 
sinon si reponse(AOD_elec, NON) et reponse(AOD_chaleur, NON) alors 3/10 
sinon si reponse(AOD_gaz, NON) et reponse(AOD_chaleur, NON) alors 3/10 
sinon si reponse(AOD_elec, NON) ou reponse(AOD_gaz, NON) alors 7/10 
sinon si reponse(AOD_chaleur, NON) alors 6/10 
', '<p>Pour une collectivité non autorité organisatrice de la distribution d''électricité, le score de la 3.1.1 est réduit de 30 %.</p>
<p>Pour une collectivité non autorité organisatrice de la distribution de gaz, le score de la 3.1.1 est réduit de 30 %.</p>
<p>Pour une collectivité non autorité organisatrice de la distribution de chaleur, le score de la 3.1.1 est réduit de 40 %.</p>
<p>Ces réductions sont cumulables dans la limite de 2 points restants pour prendre en compte la part d’influence dans les instances compétentes et les actions partenariales.</p>
'),
        ('cae_3.1.2', 'reduction', 'si reponse(AOD_elec, NON) et reponse(AOD_gaz, NON) et reponse(AOD_chaleur, NON) alors 0.5
', '<p>Pour une collectivité non autorité organisatrice de la distribution d''électricité, de gaz et de chaleur, le score de la 3.1.2 est réduit de 50 %.</p>
<p>En l’absence de fournisseurs d’énergie maîtrisés par la collectivité (SEM/régie/exploitants de réseau de chaleur urbain liés à la collectivité par DSP), le score de la 3.1.2 est réduit de 20 % et le statut de la sous-action 3.1.2.2 liée aux actions de la facturation est &quot;non concerné&quot;.</p>
<p>La réduction la plus forte prévaut.</p>
'),
        ('cae_3.1.2.2', 'reduction', 'si reponse(AOD_elec, NON) et reponse(AOD_gaz, NON) et reponse(AOD_chaleur, NON) alors 1.0
sinon si reponse(fournisseur_energie, NON) alors 0.8
', '<p>Si le parent est réduit de 50% alors la réduction de 20% ne s''applique pas même si il y a des fournisseurs d''energie maîtrisés par la collectivité.</p>
'),
        ('cae_3.1.2.2', 'desactivation', 'reponse(fournisseur_energie, NON) 
', ''),
        ('cae_3.2.1.1', 'reduction', 'si reponse(recuperation_cogeneration, NON) et identite(localisation,DOM) alors 2/10
sinon si reponse(recuperation_cogeneration, NON) alors 2/12
', ''),
        ('cae_3.2.1', 'reduction', 'si identite(localisation,DOM) alors 10/12
', '<p>Le nombre de point max pour l''action 3.2.1 est de 12 points en Métropole et de 10 points pour les collectivités DOM.</p>
<p>Pour une collectivité avec peu d''activités industrielles adaptées pour la récupération de chaleur fatale et peu de potentiel pour la cogénération voir la micro-cogénération (donc ni de chaufferies ni de consommateurs suffisants en chaleur ni de producteur-consommateur visant l’autoconsommation), le score de la 3.2.1 est réduit à 2 points et les statuts des sous-action 3.2.1.2 et 3.2.1.3 sont &quot;non concernée&quot;.</p>
'),
        ('cae_3.2.1.2', 'reduction', 'si reponse(recuperation_cogeneration, NON) alors 0
', ''),
        ('cae_3.2.1.2', 'desactivation', 'reponse(recuperation_cogeneration, NON) 
', ''),
        ('cae_3.2.1.3', 'reduction', 'si reponse(recuperation_cogeneration, NON) alors 0
', ''),
        ('cae_3.2.1.3', 'desactivation', 'reponse(recuperation_cogeneration, NON) 
', ''),
        ('cae_3.2.2', 'reduction', 'si identite(localisation,DOM) alors 10/12
', '<p>Le nombre de point max pour l''action 3.2.2 est de 12 points en Métropole et de 10 points pour les collectivités DOM.</p>
'),
        ('cae_3.2.3', 'reduction', 'si identite(localisation,DOM) alors 12/8
', '<p>Le nombre de point max pour l''action 3.2.3 est de 8 points en Métropole et de 12 points pour les collectivités DOM.</p>
'),
        ('cae_3.3.1', 'reduction', 'si reponse(eau_1, NON) alors 0/6 
', ''),
        ('cae_3.3.1', 'desactivation', 'reponse(eau_1, NON) 
', '<p>Pour une collectivité sans la compétence eau potable, le score de la 3.3.1 est réduit à 0 point et le statut de la sous-action est &quot;non concernée&quot;.</p>
'),
        ('cae_3.3.2', 'reduction', 'si reponse(assainissement_1, NON) alors 0/12
sinon si reponse(assainissement_4, NON) alors 0.5
', ''),
        ('cae_3.3.2', 'desactivation', 'reponse(assainissement_1, NON)
', '<p>Pour une collectivité sans la compétence assainissement collectif, le score de la 3.3.2 est réduit à 0 point et le statut de la sous-action est &quot;non concernée&quot;.</p>
<p>En cas d''absence de potentiel de valorisation énergétique (méthanisation ou récupération de chaleur) attestée par une étude portant sur la totalité du périmètre d’assainissement, le score de la 3.3.2 est réduit à 50 %.</p>
'),
        ('cae_3.3.3', 'reduction', 'si identite(type, EPCI) alors max(reponse(assainissement_3), 0.5)
sinon si identite(type, commune) et reponse(assainissement_1, NON) et reponse(assainissement_2, NON) alors 0.5
', '<p>Pour un EPCI, en cas de compétence &quot;assainissement&quot; partagée ou variable sur le territoire, la réduction de potentielle est proportionnelle à la part des communes ayant délégué leur compétence assainissement, dans la limite de moins 50%. Des actions sont possibles sur d’autres compétences, notamment « gestion des milieux aquatiques et prévention des inondations ».</p>
<p>Pour les communes sans compétence assainissement, le score de la 3.3.3 est réduit de 50 %.</p>
');