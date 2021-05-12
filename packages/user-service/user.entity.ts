function validateUser(user:UserEntityInput, validators){
    const validations = [
        function validateEmail({email}:{email:string}) : {email:string} {
            if (!email){
                throw new Error("email address not provided")
            }
            if (!validators.isEmail(email)){
                throw new Error("invalid email address provided")
            }
            return {email}
        },
        function validateName({name}:{name: string}): {name:string} {
            if (!name){
                throw new Error("name of user not provided")
            }
            if (!validators.isName(name)){
                throw new Error("invalid name provided")
            }
            return {name}
        },
        function validatePhoneNumber({phone}:{phone:string}): {phone: string} {
            if(!phone){
                throw new Error("user phone number not provided")
            }
            if(!validators.isPhoneNumber(phone)){
                throw new Error("invalid phone number")
            }
            return {phone}
        },
        function validateUUID({uuid}:{uuid:string}):{ uuid:string } {
            if(!uuid){
                throw new Error("uuid not provided")
            }
            if(!validators.isUUID(uuid)){
                throw new Error("invalid uuid")
            }
            return {uuid}
        },
        function validatePIN({proposedPIN}:{proposedPIN:string}):{ proposedPIN:string } {
            if(!proposedPIN){
                throw new Error("pin not provided")
            }
            if(!validators.isPIN(proposedPIN)){
                throw new Error("pin code must only have digits")
            }
            return {proposedPIN}
        }
    ]
    const validFields = validations.map(validation => {
        try {
            return validation.call(this,user)
        } catch (error) {
            throw error
        }
    })
    const validUser = Object.assign({},user, ...validFields)
    return Object.freeze(validUser)
}
export default function ({validators, identityManager}){
    return async function create(user:UserEntityInput) : Promise<User> {
        const {proposedPIN, ...validatedUser} = validateUser(user, validators)
        if(proposedPIN){
            try {
                const pin = await identityManager.computePersistedPIN(proposedPIN)
                return Object.freeze({...validatedUser, pin})
            } catch (error) {
                throw error
            }
        }
        return Object.freeze({...validatedUser})
    }
}