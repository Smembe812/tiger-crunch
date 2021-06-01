interface ClientInput {
    key: Key,
    id:string,
    domain:string,
    projectName: string,
    email: string
}
interface Key{
    hash:string
    iterations:number
    salt:string
}