import VerifyScopeTransaction from './verify-scope'
const Transactions = (message) => {
	switch(message.topic) {
		case 'VERIFY_SCOPE':
			VerifyScopeTransaction(message);
			break;
		default:
			break;
	}
}
export default Transactions;