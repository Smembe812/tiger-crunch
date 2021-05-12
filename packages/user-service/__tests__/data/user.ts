export const user = {
    name:"paul sembereka", 
    email:"email@fake.com",
    phone:"12345678",
    uuid:"cb568fff-c8c6-4548-9d04-586a5780c46a",
    proposedPIN:"1234"
}
export const {proposedPIN, ...userWithoutPPIN} = user
export const userAuthCred = {
    email: "paulsembereka@zohomail.eu",
    proposedPIN: "1234",
    otp:"711854"
}
export const hash="217c4f41e3a7833b64b23acc95037312119a33dbfd101a7919bdcea976217133b5390e00b24ef9979bc02d5687025a225f196fc05de16236dbae2e5be8921713"
export const user2fa = {
    ...userWithoutPPIN,
    pin:{hash, salt:"randomsalt", iterations:10000},
    twoFactor:{
        secret:"",
        tempSecret:""
    }
}
export const {twoFactor, ...userWithout2fa} = user2fa