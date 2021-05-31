/**
 * A validator takes a value and returns null if the value is valid or an error message if the value is invalid.
 */
export type Validator = (value: any) => string | null;

/**
 * Validates a value against a validator. Returns true if the value is valid, false otherwise.
 */
export const validate = (value: any, validator: Validator): boolean => {
    return validator(value) === null;
}

/**
 * Builds a validator from many validators. The validators are executed in list order.
 */
export const joinValidators = (validators: Validator[]): Validator => {
    return (value: any) => {
        let error: string | null = null
        for (let validator of validators) {
            error = validator(value)
            if (error !== null) break;
        }
        return error
    }
}

/**
 * A validator that always returns null.
 */
export const alwaysValid: Validator = (value: any) => null;
