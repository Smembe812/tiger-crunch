/**
 * create a new user
 * 1. get user details from http
 * 2. validate fields with UserEntity
 * 2. verify the user
 * 3. setup 2 factor
 * @param param0
 * @returns
 */
export default function ({ userEntity, dataSource, httpUser, mailManager, identityManager, otpService }: {
    userEntity: any;
    dataSource: any;
    httpUser?: any;
    mailManager: any;
    identityManager: any;
    otpService: any;
}): {
    createNewUser: (userFields: UserInput) => Promise<UserResponse>;
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
