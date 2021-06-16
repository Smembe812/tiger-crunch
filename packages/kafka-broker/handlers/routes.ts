import Producer from './producer';
const producer = new Producer();
const messageTypeToTopicMessaging = {
    VERIFY_SCOPE : ["USER_SERVICE"],
    SCOPE_VERIFIED : ["AUTHORIZATION_SERVICE"]
}
export default (payload) => {
    console.log("payload",payload);
    messageTypeToTopicMessaging[payload.topic].forEach(topic => {
        producer.produce(topic,JSON.stringify(payload));
    })
}