<script lang="typescript">
    import {setCustomMesure} from '../../api/customMesure'
    import { v4 as uuid } from 'uuid'
    import Button from '../shared/Button'

    interface Thematic {
        id: number,
        name: string,
    }

    const thematics: Thematic[] = [
        {id: 1, name: 'Stratégie'},
        {id: 2, name: 'Autre'},
    ]

    let name = ''
    let climatPraticThematic: Thematic

    function handleSave() {
      console.log('Handle Save')
      if (climatPraticThematic) {
        setCustomMesure({
          'id': uuid(),
          'climat_pratic_thematic': climatPraticThematic.name,
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
                bind:value={climatPraticThematic}
                class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100">
            {#each thematics as thematic}
                <option value={thematic}>
                    {thematic.name}
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
