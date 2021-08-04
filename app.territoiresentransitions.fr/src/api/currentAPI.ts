export const API_URL = import.meta.env.VITE_API_URL;

/**
 * @deprecated use API_URL instead.
 */
export const getCurrentAPI = (): string => {
    return API_URL;
}
