declare function computePersistedPIN(proposedPIN: string): Promise<unknown>;
declare function isValidPin({ proposedPIN, salt, iterations, hash }: {
    proposedPIN: any;
    salt: any;
    iterations: any;
    hash: any;
}): Promise<boolean | any>;
declare function encryptPass(pin: any): Promise<string>;
declare function generatePIN(n?: number): any;
declare const _default: {
    computePersistedPIN: typeof computePersistedPIN;
    encryptPass: typeof encryptPass;
    generatePIN: typeof generatePIN;
    isValidPin: typeof isValidPin;
};
export default _default;
