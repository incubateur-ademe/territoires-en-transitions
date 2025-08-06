import { TagInsert } from '@/domain/collectivites';
import { FicheResume } from '@/domain/plans/fiches';
import { Thematique } from '@/domain/shared';
import { SupabaseClient } from '@supabase/supabase-js';
import { beforeAll, describe, expect, test } from 'vitest';
import { signIn, signOut } from '../../tests/auth';
import { dbAdmin, supabase } from '../../tests/supabase';
import { testReset } from '../../tests/testReset';
import {
  selectIndicateurDefinition,
  selectIndicateurServicesId,
  selectIndicateurThematiquesId
} from './indicateur.fetch';
import {
  insertIndicateurDefinition,
  updateIndicateurDefinition,
  upsertFiches,
  upsertServices,
  upsertThematiques,
} from './indicateur.save';

beforeAll(async () => {
  await signIn('yolododo');
  await testReset();

  return async () => {
    await signOut();
  };
});

async function selectIndicateurFiches(
  supabase: SupabaseClient,
  indicateurId: number,
  collectiviteId: number
) {
  console.log('selectIndicateurFiches', indicateurId, collectiviteId);

  const { data } = await supabase
    .from('fiche_action_indicateur')
    .select('...fiche_action!inner(*)')
    .eq('indicateur_id', indicateurId)
    .eq('fiche_action.collectivite_id', collectiviteId);

  return data;
}

describe('Test indicateur.save', async () => {
  const { data: predefini } = await dbAdmin
    .from('indicateur_definition')
    .select('id')
    .not('collectivite_id', 'is', null)
    .limit(1)
    .single();

  if (!predefini) {
    expect.fail();
  }

  test('Test updateIndicateurDefinition', async () => {
    // Modification indicateur personnalisé
    const def = await selectIndicateurDefinition(supabase, predefini.id, 1);
    if (!def) {
      expect.fail();
    }

    const defToUpdate = JSON.parse(JSON.stringify(def));
    defToUpdate.commentaire = 'test nouveau com';
    defToUpdate.description = 'test nouvel des';

    await updateIndicateurDefinition(supabase, defToUpdate, 1);
    const newDef = await selectIndicateurDefinition(supabase, predefini.id, 1);

    if (!newDef) {
      expect.fail();
    }

    expect(def.commentaire).not.eq(newDef.commentaire);
    expect(def.description).not.eq(newDef.description);

    // Modification indicateur prédéfini
    const def2 = await selectIndicateurDefinition(supabase, 1, 1);
    if (!def2) {
      expect.fail();
    }

    const def2ToUpdate = JSON.parse(JSON.stringify(def2));
    def2ToUpdate.commentaire = 'test nouveau com';
    def2ToUpdate.description = 'test nouvel des';

    await updateIndicateurDefinition(supabase, def2ToUpdate, 1);
    const newDef2 = await selectIndicateurDefinition(supabase, 1, 1);

    if (!newDef2) {
      expect.fail();
    }

    expect(def2.commentaire).not.eq(newDef2.commentaire);
    expect(def2.description).eq(newDef2.description); // Ne peut pas modifier la description d'un indicateur prédéfini
  });

  test('Test insertIndicateurDefinition', async () => {
    const def: Parameters<typeof insertIndicateurDefinition>['1'] = {
      titre: 'test',
      collectiviteId: 1,
      thematiques: [{ id: 1, nom: '' }],
    };

    const newId = await insertIndicateurDefinition(supabase, def);
    if (!newId) {
      expect.fail();
    }

    const data = await selectIndicateurDefinition(supabase, newId, 1);
    expect(data).not.toBeNull();
    expect(data?.thematiques?.[0].id).eq(1);
  });

  test('Test upsertThematiques', async () => {
    // Ajout thématique sur indicateur personnalisé
    const def = await selectIndicateurDefinition(supabase, predefini.id, 1);
    if (!def) {
      expect.fail();
    }

    const them: Thematique[] = [
      {
        id: 1,
        nom: 'test',
      },
    ];

    await upsertThematiques(supabase, def.id, def.estPerso, them);
    const data = await selectIndicateurThematiquesId(supabase, predefini.id);
    expect(data).not.toBeNull();
    expect(data).toHaveLength(1);
    // Enlève thématique sur indicateur personnalisé
    await upsertThematiques(supabase, def.id, def.estPerso, []);
    const data2 = await selectIndicateurThematiquesId(supabase, predefini.id);
    expect(data2).not.toBeNull();
    expect(data2).toHaveLength(0);
    // Ajout thématique sur indicateur prédéfini (pas possible)
    const def2 = await selectIndicateurDefinition(supabase, 1, 1);
    if (!def2) {
      expect.fail();
    }

    await upsertThematiques(supabase, def2.id, def2.estPerso, them);
    const data3 = await selectIndicateurThematiquesId(supabase, 1);
    expect(data3).not.toBeNull();
    expect(data3).not.toContain(1);
  });

  test('Test upsertServices', async () => {
    // Données
    const { data: service } = await dbAdmin
      .from('service_tag')
      .insert({ nom: 'serv2', collectivite_id: 2 })
      .select()
      .limit(1)
      .single();

    if (!service) {
      expect.fail();
    }

    await dbAdmin.from('indicateur_service_tag').insert({
      indicateur_id: 1,
      service_tag_id: service.id,
      collectivite_id: 2,
    });

    // Ajout service inexistant sur indicateur personnalisé
    const def = await selectIndicateurDefinition(supabase, predefini.id, 1);
    if (!def) {
      expect.fail();
    }

    const tags: TagInsert[] = [
      {
        nom: 'test',
        collectiviteId: 1,
      },
    ];
    await upsertServices(supabase, def.id, 1, tags);
    const data = await selectIndicateurServicesId(supabase, predefini.id, 1);
    expect(data).not.toBeNull();
    expect(data).toHaveLength(1);
    // Ajout service existant sur indicateur personnalisé
    tags[0].id = data[0];
    tags.push({ nom: '', collectiviteId: 1, id: 1 });
    await upsertServices(supabase, def.id, 1, tags);
    const data2 = await selectIndicateurServicesId(supabase, predefini.id, 1);
    expect(data2).not.toBeNull();
    expect(data2).toHaveLength(2);
    // Enlève services sur indicateur personnalisé
    await upsertServices(supabase, def.id, 1, []);
    const data3 = await selectIndicateurServicesId(supabase, predefini.id, 1);
    expect(data3).not.toBeNull();
    expect(data3).toHaveLength(0);
    // Ajout services sur indicateur prédéfini
    const def2 = await selectIndicateurDefinition(supabase, 1, 1);
    if (!def2) {
      expect.fail();
    }

    await upsertServices(supabase, def2.id, 1, tags);
    const data4 = await selectIndicateurServicesId(supabase, 1, 1);
    expect(data4).not.toBeNull();
    expect(data4).toHaveLength(2);
    // Enlève services sur indicateur prédéfini
    await upsertServices(supabase, def2.id, 1, []);
    const data5 = await selectIndicateurServicesId(supabase, 1, 1);
    expect(data5).not.toBeNull();
    expect(data5).toHaveLength(0);
    // Vérifie qu'on supprime pas les services des autres collectivités
    const data6 = await selectIndicateurServicesId(supabase, 1, 2);
    expect(data6).not.toBeNull();
    expect(data6).toHaveLength(1);
  });


  test('Test upsertFiches', async () => {
    const { data: fiche } = await dbAdmin
      .from('fiche_action')
      .insert({ titre: 'test2', collectivite_id: 2 })
      .select();

    if (!fiche) {
      expect.fail();
    }

    await dbAdmin
      .from('fiche_action_indicateur')
      .insert({ fiche_id: fiche[0].id, indicateur_id: 1 });

    // Ajoute fiche sur indicateur personnalisé
    const def = await selectIndicateurDefinition(supabase, predefini.id, 1);
    if (!def) {
      expect.fail();
    }

    const fr: FicheResume[] = [
      {
        ameliorationContinue: false,
        collectiviteId: 1,
        dateDebut: '2020-01-01',
        dateFin: '2020-01-01',
        id: 1,
        modifiedAt: '2020-01-01',
        priorite: 'Bas',
        pilotes: [],
        services: [],
        plans: [],
        restreint: false,
        statut: 'En cours',
        titre: 'test',
      },
    ];
    await upsertFiches(
      supabase,
      def.id,
      1,
      fr.map((f) => f.id)
    );
    const data = await selectIndicateurFiches(supabase, predefini.id, 1);
    expect(data).not.toBeNull();
    expect(data).toHaveLength(1);
    // Enlève fiche sur indicateur personnalisé
    await upsertFiches(supabase, def.id, 1, []);
    const data3 = await selectIndicateurFiches(supabase, predefini.id, 1);
    expect(data3).not.toBeNull();
    expect(data3).toHaveLength(0);
    // Ajout fiche sur indicateur prédéfini
    const def2 = await selectIndicateurDefinition(supabase, 1, 1);
    if (!def2) {
      expect.fail();
    }

    await upsertFiches(
      supabase,
      def2.id,
      1,
      fr?.map((f) => f.id)
    );
    const data4 = await selectIndicateurFiches(supabase, 1, 1);
    expect(data4).not.toBeNull();
    expect(data4).toHaveLength(1);
    // Enlève fiche sur indicateur prédéfini
    await upsertFiches(supabase, def2.id, 1, []);
    const data5 = await selectIndicateurFiches(supabase, 1, 1);
    expect(data5).not.toBeNull();
    expect(data5).toHaveLength(0);
    // Vérifie que les fiches des autres collectivités n'ont pas été supprimés
    const data6 = await selectIndicateurFiches(supabase, 1, 2);
    expect(data6).not.toBeNull();
    expect(data6).toHaveLength(1);
  });
});
