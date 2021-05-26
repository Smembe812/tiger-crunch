import MailManager from "./mail"
import validators from "./validators"
import otpService from "./otp-service"
import JWT from './jwt-wrapper'
import {generateRandomCode} from "./crypto"
export default {
    MailManager,
    validators,
    otpService,
    JWT,
    generateRandomCode
}