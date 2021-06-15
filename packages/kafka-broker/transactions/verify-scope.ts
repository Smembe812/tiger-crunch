import Producer from '../handlers/routes'
export default (message) => {
	switch(message.type) {
		case 'SCOPE_VERIFIED':
				Producer({
					topic : '',
					payload : {
						data : message.payload.data
					}
				})
				break; 
		default:
			break;
	}
}