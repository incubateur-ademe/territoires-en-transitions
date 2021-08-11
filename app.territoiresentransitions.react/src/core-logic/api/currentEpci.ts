import {overmind} from "core-logic/overmind"

/**
 * @deprecated use store variable instead.
 */
export const getCurrentEpciId = (): string => {
    const a = overmind.state.epciId
    console.log("getCurrentEpciId: ", a)
    return overmind.state.epciId!;
}