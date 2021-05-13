interface ClientInput {
    secret: string,
    id:string,
    url:string,
    projectName: string
}
export default function makeClient(){
    return {
        create({url, project_name}){
            return Object.freeze({url,project_name})
        }
    }
}