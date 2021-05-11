import DataSource from "./user.datasource";
declare const _default: {
    userEntity: (user: UserEntityInput) => Promise<User>;
    userUseCases: {
        createNewUser: (userFields: Pick<UserEntityInput, "email" | "name" | "phone" | "DoB" | "gender" | "proposedPIN">) => Promise<Pick<UserEntityInput, "email" | "name" | "uuid" | "phone" | "DoB" | "gender">>;
        verifyUser: ({ proposedPIN, otp, email }: {
            proposedPIN: any;
            otp: any;
            email: any;
        }) => Promise<boolean>;
        setUp2FA: ({ email, proposedPIN }: {
            email: any;
            proposedPIN: any;
        }) => Promise<any>;
        verify2faSetup: ({ email }: {
            email: any;
        }, token: any) => Promise<boolean>;
    };
    dataSource: DataSource;
};
export default _default;
