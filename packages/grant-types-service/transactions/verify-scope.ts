function makeTransaction({publish}){
	return function handleEvents(message){
		switch(message.type) {
		case 'SCOPE_VERIFIED':
			publish({
				topic : '',
				payload : {
					data : message.payload.data
				}
			})
			break 
		default:
			break
		}
	}
}
export default makeTransaction