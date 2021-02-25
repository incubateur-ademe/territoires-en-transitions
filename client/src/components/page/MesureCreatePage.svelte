<script lang="typescript">
    import {setCustomMesure} from '../../api/customMesure'
    import { v4 as uuid } from 'uuid'
    import Button from '../shared/Button'
    import {
      Thematique,
      thematiques as list,
    } from '../../../vendors/thematiques'

    let name = ''
    let climatPraticThematique: Thematique
    export let thematiques

    function handleSave() {
      if (climatPraticThematique) {
        setCustomMesure({
          'id': uuid(),
          'climat_pratic_thematic': climatPraticThematique,
          'name': name
        })
      }
    }
</script>

<section class="flex flex-col">
    <h1 class="text-4xl font-semibold pb-20">Ajouter une mesure</h1>
    <div class="flex flex-col w-full md:w-3/4 pb-10">
        <label for="mesure_create_name">Nom</label>
        <input id="mesure_create_name"
               bind:value={name}
               class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100">
        <div class="pb-5"></div>
        <label for="mesure_create_climat_pratic">Thématique</label>
        <select id="mesure_create_climat_pratic"
                bind:value={climatPraticThematique}
                class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100">
            {#each thematiques as thematique}
                <option value={thematique.name}>
                    {thematique.name}
                </option>
            {/each}
        </select>
    </div>

    <Button
    	full
    	label="Valider"
    	on:click={handleSave}
    	classNames="md:w-1/3 self-end"
    />
</section>
