import MailManager from "./mail"
import validators from "./validators"
import otpService from "./otp-service"
import JWT from './jwt-wrapper'
import * as crypto from "./crypto"
import ErrorWrapper from './error-wrapper'
export default {
    MailManager,
    validators,
    otpService,
    JWT,
    ...crypto,
    ErrorWrapper
}