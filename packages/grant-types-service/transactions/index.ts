import makeVerifyScopeTransaction from './verify-scope'
function makeTransactions({publish}){
    const VerifyScopeTransaction = makeVerifyScopeTransaction({publish})
    const Transactions = (message) => {
        switch(message.topic) {
            case 'VERIFY_SCOPE':
                VerifyScopeTransaction(message);
                break;
            default:
                break;
        }
    }
    return Transactions
}
export default makeTransactions