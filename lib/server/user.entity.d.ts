export default function ({ validators, identityManager }: {
    validators: any;
    identityManager: any;
}): (user: UserEntityInput) => Promise<User>;
