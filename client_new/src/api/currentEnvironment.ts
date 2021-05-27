type ProductionEnvironment = 'local' | 'sandbox' | 'staging' | 'release'

import {stores} from '@sapper/app';

const {page} = stores();


export const getCurrentEnvironment = (): ProductionEnvironment => {
    const hostname = page.host;
    const environment = environmentFromHostname(hostname)
    if (environment) return environment
    throw `no environment for ${hostname}`
}

export const testUIVisibility = (): boolean => {
    const environment = getCurrentEnvironment()
    return environment === 'local' || environment === 'sandbox'
}

const environmentFromHostname = (hostname: string) => {
    if (hostname.substring(0, 10) === 'localhost') return 'local'
    if (hostname === 'sandbox.territoiresentransitions.fr') return 'sandbox'
    if (hostname === 'staging.territoiresentransitions.fr') return 'staging'
}

export let currentEnvironment: string; // = getCurrentEnvironment()
