const WRITE = "WRITE"
const READ = "READ"
const DELETE = "DELETE"
const EDIT = "EDIT"
export const operations = [WRITE, READ, DELETE, EDIT]

// this means that user-roles must always be stored with roles
export const roles = {
	admin: {
		can:[WRITE, READ, DELETE, EDIT]
	},
	guest:{
		can: [READ]
	}
}

interface User {
	roles: Array<string>, // set of operations
	operations?: Array<string> // allows for more granularity
}
export default class RBAC {
	roles
	user: User
	dataSource
	constructor(roles, dataSource){
		if(typeof roles !== 'object'){
			throw TypeError('Expected roles to be an object')
		}
		this.roles = roles
		this.dataSource = dataSource 
	}
	async getUser(id):Promise<User>{
		const userRoles = await this.dataSource.get(id) //always expects [roles:<string>]
		this.initUser(userRoles)
		return this.user
	}
	private initUser(userRoles){
		this.user.roles = userRoles
		const allOperations = this.user.roles
			.map(role => this.roles[role].can)
		const operationsSet = new Set(allOperations)
		this.user.operations = Array.from(operationsSet)
		return this
	}
}