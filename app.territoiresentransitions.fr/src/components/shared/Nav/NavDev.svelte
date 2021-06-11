<script lang="ts">
    /**
     * A navigation bar shown only for testing features.
     */

    import {UtilisateurConnecteStorable} from "../../../storables/UtilisateurConnecteStorable";
    import {onMount} from "svelte";


    let connected = false
    let user: UtilisateurConnecteStorable

    onMount(async () => {
        const auth = await import("../../../api/authentication")
        connected = auth.isConnected()
        user = auth.currentUser()
    })
</script>
<nav class="bg-pink-600">
    <!-- test only navigation items -->
    <ul class="container mx-auto lg:px-20 px-4 p-4 flex text-xl">
        <li class="mr-4 flex-grow text-center">

        </li>
        {#if connected}
            <li class="mr-4">
                <a class="p-1 rounded hover:bg-gray-100 hover:text-gray-700 focus:bg-gray-100 focus:text-gray-700 active:text-gray-900 active:shadow-inner active:bg-white"
                   href="auth/signout">
                    Se déconnecter
                </a>
            </li>
            {#if user}
                <li class="mr-4">
                    {user.email}
                </li>
            {/if}
        {:else }
            <li class="mr-4">
                <a class="p-1 rounded hover:bg-gray-100 hover:text-gray-700 focus:bg-gray-100 focus:text-gray-700 active:text-gray-900 active:shadow-inner active:bg-white"
                   href="auth/signin">
                    Se connecter
                </a>
            </li>
            <li class="mr-4">
                <a class="p-1 rounded hover:bg-gray-100 hover:text-gray-700 focus:bg-gray-100 focus:text-gray-700 active:text-gray-900 active:shadow-inner active:bg-white"
                   href="auth/register">
                    Création de compte
                </a>
            </li>
        {/if}
    </ul>
</nav>