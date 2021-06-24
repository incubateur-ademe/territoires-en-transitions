<script lang="ts">
    /**
     * Shows current user identity
     */
    import {onMount} from "svelte";
    import {UtilisateurConnecteStorable} from "../../../storables/UtilisateurConnecteStorable";

    let connected = false
    let user: UtilisateurConnecteStorable

    onMount(async () => {
        const auth = await import("../../../api/authentication")
        connected = auth.isConnected()
        user = auth.currentUser()
    })
</script>

<div class="">
    {#if connected}
        <span>Vous êtes connecté </span>
        {#if user}
           <span>en tant que {user.prenom} {user.nom} ({user.email})</span>
        {/if}
        <span>.</span>
    {:else }
        <p>Vous n'êtes pas connecté</p>
    {/if}
</div>



