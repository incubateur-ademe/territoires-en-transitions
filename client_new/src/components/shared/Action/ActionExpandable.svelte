<script lang="ts">
    import ButtonIcon from '../Button/ButtonIcon.svelte'
    import ActionBar from './ActionBar.svelte'

    export let action
</script>

<details class="expandable mb-4">
    <summary>
        <ActionBar withArrow
                   withShadow
                   classNames="cursor-pointer"
        >
            <ButtonIcon slot="aside">+</ButtonIcon>
            <h4 class="underline:hover self-center mr-4">
                {action.nom}
            </h4>
        </ActionBar>
    </summary>

    <ul class="pl-10">
        {#each action.actions as nestedAction (nestedAction.id) }
            <li>
                <ActionBar>
                    <ButtonIcon slot="aside">+</ButtonIcon>
                    <h5 class="underline:hover self-center text-base mr-4">
                        {nestedAction.nom}
                    </h5>
                </ActionBar>
            </li>
        {/each}
    </ul>
</details>
