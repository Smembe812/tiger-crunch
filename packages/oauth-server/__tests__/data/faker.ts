import faker from 'faker'
export const userInput = {
    name: faker.name.findName(),
    email: faker.internet.email(),
    phone: faker.phone.phoneNumberFormat(1),
    proposedPIN: "1234"
}
export const userPermissions = {
    id: faker.datatype.uuid(),
    permissions: ['user:admin']
}
export const client = {
    email: faker.internet.email(),
    project_name: faker.commerce.productName(),
    domain: faker.internet.domainName()
}