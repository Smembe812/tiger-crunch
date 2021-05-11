export declare function verify({ secret, encoding, token }: {
    secret: any;
    encoding: any;
    token: any;
}): any;
export declare function generateSecret(props: any): any;
export declare function generateQRCode(): Promise<{
    secret: any;
    data_url: any;
}>;
declare const _default: {
    generateQRCode: typeof generateQRCode;
    generateSecret: typeof generateSecret;
    verify: typeof verify;
};
export default _default;
