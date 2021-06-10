interface ClientInput {
    secret: Secret,
    id:string,
    domain:string,
    projectName: string,
    email: string
}
interface Secret{
    hash:string
    iterations:number
    salt:string
}