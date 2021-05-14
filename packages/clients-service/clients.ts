interface ClientInput {
    secret: string,
    id:string,
    domain:string,
    projectName: string
}
export default function makeClient(){
    return {
        create({domain, project_name, email, id}){
            return Object.freeze({id, domain,project_name, email})
        }
    }
}