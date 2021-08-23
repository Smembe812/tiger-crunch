function makePermissions({dataSource}){
	async function getAvailablePermission(params:{
        id: string;
        permissions: string[];
    }) : Promise<string[]> {
		if(!params?.permissions || params?.permissions.length < 1){
			return []
		}
		const permissions = await dataSource.get(params.id)
		if (permissions.length < 1){
			return []
		}
		const incomingPermissionsSet = new Set(params.permissions)
		const incomingPermissions = Array.from(incomingPermissionsSet)
		const available: string[] = permissions.filter(permission => incomingPermissions.includes(permission))
		return available
	}
	return {
		getAvailablePermission
	}
}
export default makePermissions