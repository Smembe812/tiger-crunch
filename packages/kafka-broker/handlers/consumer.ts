import kafkaNode from 'kafka-node'
const client = new kafkaNode.KafkaClient();
const offset = new kafkaNode.Offset(client);
const Consumer = kafkaNode.Consumer;
let consumer;
let consumerReady;
const bindEventListeners = function bindEventListeners(options, topic) {
    consumerReady = new Promise((resolve, reject) => {
        try {
            consumer = new Consumer(
            client,
            [],
            options
            );
        consumer.on('error', (err) => {
            console.log(`Error occured on consumer group ${topic}`);
        })
        resolve(consumer);
        } catch (e) {
            reject(e);
        }
    });
};
function ConsumerService(defaultTopic=null) {
    this.defaultOptions = {
      encoding: 'utf8', // default is utf8, use 'buffer' for binary data
      fromOffset: -1, // default,
      autoCommit: true,
    };
    this.defaultTopic = defaultTopic
    this.initializeConsumer = function (defaultTopic) {
        console.log('initializing consumer ')
        const options = this.defaultOptions;
        bindEventListeners(options, defaultTopic);
    };
    this.initializeConsumer(this.defaultTopic);
    this.addTopics = function (topicArray) {
        return new Promise((resolve, reject) => {
        consumerReady
            .then((consumer) => {
            console.log('adding topics ', topicArray);     
            consumer.addTopics(topicArray, function (err, added) {
                console.log('topics added ', err, added);
                resolve(added);
            });
            })
            .catch((e) =>{
            console.log('errror while creating topic ', e);
            });
        });
    };
  this.consume = function(cb) {
    consumerReady
      .then((consumer) => {
        console.log('consumer ready');
        consumer.on('message', (message) => {
          console.log('recieved message ', message);
          cb(message);
        })
      })
      .catch((e) =>{
        console.log('errror while consuming', e);
      }) 
  }
}
export default ConsumerService;