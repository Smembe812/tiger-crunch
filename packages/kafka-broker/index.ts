// import kafka from 'kafka-node';

// const client = new kafka.KafkaClient();
// const util = require('util');
// const Producer = new kafka.Producer(client);

import Producer from './handlers/producer'
import Consumer from './handlers/consumer';
import Transactions from './transactions';
import ProducerRoute from './handlers/routes'
const producer = new Producer();
const topics = [
    { topic : 'USER_SERVICE',partitions : 1,replicationFactor : 1 },
    // { topic : 'PAYMENT_SERVICE',partitions : 1,replicationFactor : 1 },
    // { topic : 'STOCK_SERVICE',partitions : 1,replicationFactor : 1 },
    { topic : 'ORCHESTATOR_SERVICE',partitions : 1,replicationFactor : 1 }
]
producer.createTopic(topics).then(res => {
    console.log(res)
})
.catch(err => {
    console.log(`Error ${err}`)
})
try {
const consumer = new Consumer();
consumer.addTopics(["ORCHESTATOR_SERVICE"]).then(() => {
    consumer.consume(message => {
        console.log("consumed message",message);
        Transactions(JSON.parse(message.value));
    })
})
console.log("Orchestator Started successfully");
}
catch(e){
    console.log(`Orchestrator Error ${e}`);
}
ProducerRoute({
    topic : 'VERIFY_SCOPE',
    payload : {
        data : {test:"hehehe"}
    }
})