interface TwoFactor {
    secret: string
    tempSecret: string
    dataURL: string
    otpURL:string
}

interface PIN{
    hash:string
    iterations:number
    salt:string
}
interface User {
    email: string
    name: string
    uuid: string
    phone: string
    DoB?:string
    gender?:string
    twoFactor?: TwoFactor
    pin?:PIN
}
interface UserProfile{
    name: string
    phone: string
    DoB?:string
}
interface UserEntityInput extends Omit<User, "twoFactor"|"pin"> {
    proposedPIN:string
}
type UserInput = Omit<UserEntityInput, 'uuid' >

type UserResponse = Omit<UserEntityInput, 'proposedPIN' >
