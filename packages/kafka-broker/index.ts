import Producer from './handlers/producer'
import Consumer from './handlers/consumer';
import Transactions from './transactions';
import publish from './handlers/routes'
const producer = new Producer();
const topics = [
    { topic : 'USER_SERVICE',partitions : 1,replicationFactor : 1 },
    { topic : 'AUTHORIZATION_SERVICE',partitions : 1,replicationFactor : 1 }
]
producer.createTopic(topics).then(res => {
    console.log(res)
})
.catch(err => {
    console.log(`Error ${err}`)
})
// try {
// const consumer = new Consumer();
// consumer.addTopics(["AUTHORIZATION_SERVICE"]).then(() => {
//     consumer.consume(message => {
//         console.log("consumed message",message);
//         Transactions(JSON.parse(message.value));
//     })
// })
// console.log("Orchestator Started successfully");
// }
// catch(e){
//     console.log(`Orchestrator Error ${e}`);
// }
// publish({
//     topic : 'VERIFY_SCOPE',
//     payload : {
//         data : {test:"hehehe"}
//     }
// })
export default {
    Producer,
    Consumer,
    Transactions,
    publish
}