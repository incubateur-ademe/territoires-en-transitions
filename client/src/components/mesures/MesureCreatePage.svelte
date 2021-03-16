<script lang="typescript">
    import {v4 as uuid} from 'uuid'
    import Button from '../shared/Button'
    import {mesureCustomStore} from "../../api/localStore";
    import {getCurrentEpciId} from "../../api/currentEpci";
    import {MesureCustomStorable} from "../../storables/MesureCustomStorable";

    let name = ''
    let climatPraticThematiqueId: string
    export let thematiques

    function handleSave() {
        if (climatPraticThematiqueId) {
            const epciId = getCurrentEpciId()
            const mesure = new MesureCustomStorable({
                uid: uuid(),
                epci_id: epciId,
                climat_pratic_thematic_id: climatPraticThematiqueId,
                name: name,
            })

            mesureCustomStore.store(mesure)
            window.location.href = `mesures.html?epci_id=${epciId}`
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
                bind:value={climatPraticThematiqueId}
                class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100">
            {#each thematiques as thematique}
                <option value={thematique.id}>
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
