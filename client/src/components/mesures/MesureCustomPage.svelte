<script lang="typescript">
    import Title from '../shared/Title'
    import Nav from '../shared/Nav'
    import {getUrlParameter} from '../../utils/url'
    import Button from "../shared/Button.svelte";
    import Action from "../actions/Action.svelte";
    import {actionCustomStore, mesureCustomStore} from "../../api/hybridStore";
    import {ActionCustomStorable} from "../../storables/ActionCustomStorable";
    import {getCurrentEpciId} from "../../api/currentEpci";
    import {MesureCustomStorable} from "../../storables/MesureCustomStorable";

    const ecpiId = getCurrentEpciId();
    const mesureUid = getUrlParameter('mesure_uid')
    const mesureId = MesureCustomStorable.buildId(ecpiId, mesureUid)

    let mesure: MesureCustomStorable | null;
    let actions: Array<ActionCustomStorable> = []


    const updateActions = async () => {
        actions = await actionCustomStore.retrieveAtPath(`${ecpiId}/${mesureUid}`)
    }

    const fetch = async () => {
        mesure = await mesureCustomStore.retrieveById(mesureId);
        await updateActions()
    }

    fetch();
</script>

<Nav/>
<main class="container mx-auto lg:px-20 px-4" id="mesure-6.5.5">
    <header class="flex my-10">
        {#if mesure != null}
            <Title
                    name={mesure.name}
                    classNames="flex-grow"
            />
            <Button
                    asLink
                    label="Ajouter une action"
                    href="action_ajout.html?epci_id={ecpiId}&mesure_uid={mesure.uid}"
            />
        {/if}
    </header>
    {#each actions as action}
        <Action
                on:delete={updateActions}
                action={action}/>
    {/each}
</main>