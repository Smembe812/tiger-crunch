import {userInput, userPermissions} from '../data/faker'
import PermissionsDataSource from '@smembe812/grant-types-service/permissions-datasource'
import User from '@smembe812/user-service'
const userPayload = userInput;
console.log(userInput)
//create user with permissions
insertUser({userUsecases:User.userUseCases, payload:userPayload})
    .then(result => Promise.resolve(result))
    .then(({id}) => {
        const permissionsDataSource = new PermissionsDataSource('level-auth-permissions')
        const permissionsPayload = {...userPermissions, id};
        return createPermissions({
            dataSource:permissionsDataSource,
            payload:permissionsPayload
        })
    })
    .then(result => console.log(result))
    .catch(error => console.error(error))

async function insertUser({userUsecases, payload}){
    return await userUsecases.createNewUser(payload)
}
async function createPermissions({dataSource, payload}){
    return await dataSource.insert(payload)
}