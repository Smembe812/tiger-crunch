function makeRBACuseCases({rbac, operations}){
	const UNSUPORTTED_PERMISSION = 'unsuported_permission';
	async function constructRoles(permissions, ctx) : Promise<Array<string>>{
		const user = await rbac.getUser(ctx.id)
		const userRoles = user.roles
		const userOperations = user.operations
		if (!userRoles){
			throw Error("no roles available for user")
		}
		const roles = permissions
			.map(permission => {
				const [resource, role] = permission.split(':')
				const hasRole = userRoles.indexOf(role !== -1)
				const hasOperation = userOperations.indexOf(role !== -1)
				if(!resource.includes('users') && !hasRole && !hasOperation){
					//ignore unsuported permissions
					return UNSUPORTTED_PERMISSION
				}
				// get specific role/operation
				if(hasRole){
					return userRoles.filters(r => role === r)[0]
				}
				return userOperations.filters(o => role === o)[0]
			})
		return roles
	}
	function PermissionAssertions(roles){
		this.roles = roles
		this.isAdmin = function(){
			return this.roles.indexOf('admin') !== -1
		}
		this.isGuest = function(){
			return this.roles.indexOf('guest') !== -1
		}
		this.canWrite = function(){
			if(!this.isAdmin()){
				return this.roles.indexOf('WRITE') !== -1
			}
			return this.isAdmin()
		}
		this.canRead = function(){
			if(!this.isAdmin() || this.isGuest()){
				return this.roles.indexOf('READ') !== -1
			}
			return this.isAdmin() || this.isGuest()
		}
		this.canEdit = function(){
			if(!this.isAdmin()){
				return this.roles.indexOf('EDIT') !== -1
			}
			return this.isAdmin()
		}
		this.canDelete = function(){
			if(!this.isAdmin()){
				return this.roles.indexOf('DELETE') !== -1
			}
			return this.isAdmin()
		}
	}
	function UserPermissions(params){
		this.params = params
		this.permissions = null
		this.verify = function(){
			const scopeIsValid = this.isValidScope(this.params.scope, this.params.ctx)
			if(scopeIsValid){
				this.userPermissions = new PermissionAssertions(this.permissions)
			}
			return this
		}
		this.isValidScope = async function (scope, ctx){
			const [openId, ...rest] = scope.split('openid')
			if(openId !== "openid"){
				throw new TypeError("invalid openid scope")
			}
			const scopeCtx = rest.trim().split(' ')
			const rolesResponse = await constructRoles(scopeCtx, ctx)
			const roles = rolesResponse.filter(p => p !== UNSUPORTTED_PERMISSION)
			if (roles.length > 0){
				this.permissions = roles
				return true
			}
			return false
		}
		this.getPermissions = function (){
			return this.userPermissions
		}
		this.getScope = function (){
			if(!this.permissions){
				return this.permissions
			}
			return this.permissions.map(p => `users:${p}`)
		}
	}
	async function getScope(params, ctx){
		try {
			const scope = new UserPermissions({ctx, ...params})
			await scope.verify()
			return scope.permissions()
		} catch (error) {
			throw error
		}
	}
	return {
		getScope
	}
}