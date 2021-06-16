function makePermissions({dataSource}){
    async function getAvailablePermission(params) : Promise<string> {
        if(params?.permissions < 1){
            return null
        }
        const permissions = await dataSource.get(params.id)
        if (permissions.length < 1){
            return null
        }
        const incomingPermissionsSet = new Set(params.permissions)
        const incomingPermissions = Array.from(incomingPermissionsSet)
        const available = permissions.filter(permission => incomingPermissions.includes(permission))
        return available.join(' ').trim()
    }
    return {
        getAvailablePermission
    }
}
export default makePermissions;