<script context="module">
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
    const methods = [
        'trackPageView'
    ]

    const queuedEvents = writable([])

    export const asyncMatomo = methods
        // ['trackPageView', (...args) => ]
        .map(method =>
            ([method, (...args) => queuedEvents.update(
                alreadyQueued => [...alreadyQueued, [method, args]])]
            )
        )
        .reduce((acc, [key, value]) => ({...acc, [key]: value}), {})
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

    let _matomo
    const url = 'https://stats.data.gouv.fr/'
    const siteId = '180'

    $: scriptUrl = `${url}/piwik.js`
    $: trackUrl = `${url}/piwik.php`
    $: tracker = _matomo && _matomo.getTracker(trackUrl, siteId)

    // Install link tracking on all applicable link elements
    $: if (tracker) tracker.enableLinkTracking(true)

    // Loop in the events memory queue
    $: while (tracker && $queuedEvents.length) {

        // Get the name of the method and remove the event from the queue
        const [fnName, args] = $queuedEvents.shift()
        if (tracker[fnName] instanceof Function) {
            // Call Matomo Tracker API method
            tracker[fnName](...args)
        } else {
            throw new Error(
                `${fnName} does not exist on Matomo Tracker API. Please check https://developer.matomo.org/api-reference/tracking-javascript for mor information.`
            )
        }
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