import validator from "validator"

export const isEmail = (email: string) : boolean => {
    return validator.isEmail(email)
}

export const isUUID = (uuid: string) : boolean => {
    return validator.isUUID(uuid,4)
}

export const isName = (word: string) : boolean => {
    return validator.isAlpha(word, "en-GB", {ignore:" -"})
}

export const isPhoneNumber = (numberString: string) : boolean => {
    return validator.isMobilePhone(numberString,"any")
}

export const isPIN = (pin:string):boolean => {
    if(pin.length !== 4){
        throw new Error("pin code must be 4 digits long")
    }
    return (validator.isNumeric(pin))
}
export const isURL = (url:string):boolean => {
    return validator.isURL(url)
}
export const isBase64 = (base64String:string):boolean => {
    return validator.isBase64(base64String)
}
export default {
    isName,
    isEmail,
    isPhoneNumber,
    isUUID,
    isPIN,
    isURL,
    isBase64
}