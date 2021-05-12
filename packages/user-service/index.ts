import validators from "./validators"
import makeUserEntity from "./user.entity"
import identityManager from "./idmanager"
import DataSource from "./user.datasource"
import makeUserUseCases from "./user.use-cases"
import MailManager from './mail'
import otpService from './otp-service'
const create = makeUserEntity({validators, identityManager})
const dataSource = new DataSource("users")
const mailManager = new MailManager({
    client: process.env.NODEMAILER_OAUTH_CLIENT, 
    service:"noreply@accounts"
})
const userUseCases = makeUserUseCases({
    userEntity:{create}, 
    dataSource, 
    mailManager, 
    identityManager,
    otpService
})
export default {
    userEntity:create,
    userUseCases,
    dataSource
}