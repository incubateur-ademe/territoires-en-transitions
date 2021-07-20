<script lang="ts" context="module">
    /*
        Expose an object to handle Matomo asynchronously.

        This component exposes an interface with existing methods on Matomo Tracker
        (cf. https://developer.matomo.org/api-reference/tracking-javascript). Instead of
        calling a method immediately, it stores it in a queue.
     */
    import { writable } from 'svelte/store'

    // We only implement methods from Matomo API that we are using on this application.
    // You can check the documentation to add more Tracking API methods:
    // https://developer.matomo.org/api-reference/tracking-javascript.
    const methodNames = [
        'trackPageView'
    ]

    const queuedCalls = writable([])
    type EnqueuedMatomoCall = (...args: any[]) => void
    interface AsyncMatomo {
        [key: string]: EnqueuedMatomoCall
    }
    let asyncMatomo: AsyncMatomo = {}

    for (let name of methodNames) {
        let call: EnqueuedMatomoCall = (...args) => queuedCalls.update(
            alreadyQueued => [...alreadyQueued, [name, args]]
        )
        asyncMatomo[name] = call
    }

    export { asyncMatomo }
</script>

<script>
    /*
        This component handles Matomo integration on the application.

        For a better performance, we load Matomo script asynchronously. In order to use
        Matomo Tracker whenever on our application (even when the script is not fetched yet),
        we set up a queue with the calls we want to make to Matomo.
        When the script of Matomo is loaded, we subscribe to this queue and make calls
        with Matomo Tracker following calls that are piled in it.
    */
    import {onMount} from 'svelte'
    import {getCurrentEnvironment} from '$api/currentEnvironment'
    import { debug } from '$utils/logger'


    let _matomo
    const url = 'https://stats.data.gouv.fr/'
    const siteId = '180'

    $: scriptUrl = `${url}/piwik.js`
    $: trackUrl = `${url}/piwik.php`
    $: tracker = _matomo && _matomo.getTracker(trackUrl, siteId)

    // Install link tracking on all applicable link elements
    $: if (tracker) tracker.enableLinkTracking(true)

    // Loop in the events memory queue
    $: while (tracker && $queuedCalls.length) {

        // Get the name of the method and remove the event from the queue
        const [fnName, args] = $queuedCalls.shift()

        if (!tracker[fnName] instanceof Function) {
            throw new Error(
                `${fnName} does not exist on Matomo Tracker API. Please check https://developer.matomo.org/api-reference/tracking-javascript for mor information.`
            )
        }

        // On environments differents from production, we don't call Matomo.
        if (getCurrentEnvironment() != 'app') {
            debug('Matomo calls are activated only on production environment.')
            debug(`Method called: "${fnName}"`)

            if (args.length > 0) debug(`Arguments: ${args.toString()}`)

            continue
        }

        // Call Matomo Tracker API method
        tracker[fnName](...args)
    }

    onMount(() => {
        // We need to check when the Matomo script is loaded manually
        // because the on:load event if not fired correctly with Svelte:
        // cf. https://github.com/sveltejs/svelte/issues/5944
        const checkMatomoScript = setInterval(() => {
            if (window.Matomo) {
                _matomo = window.Matomo
                clearInterval(checkMatomoScript)
            }
        })
    })
</script>

<svelte:head>
    <script
            async
            src={scriptUrl}
    ></script>
</svelte:head>