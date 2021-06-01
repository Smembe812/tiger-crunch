import util from "@smembe812/util"
const {MailManager,otpService, validators} = util
import makeUserEntity from "./user.entity"
import identityManager from "./idmanager"
import DataSource from "./user.datasource"
import makeUserUseCases from "./user.use-cases"
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
    otpService,
    util
})
export default {
    userEntity:create,
    userUseCases,
    dataSource
}