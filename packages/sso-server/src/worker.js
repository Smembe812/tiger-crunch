function str2ab(str) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
    }
    return buf;
}
function importPublicKey(pem) {
    // fetch the part of the PEM string between header and footer
    const pemHeader = "-----BEGIN PUBLIC KEY-----";
    const pemFooter = "-----END PUBLIC KEY-----";
    const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);
    // base64 decode the string to get the binary data
    const binaryDerString = window.atob(pemContents);
    // convert from a binary string to an ArrayBuffer
    const binaryDer = str2ab(binaryDerString);
    return window.crypto.subtle.importKey(
        "spki",
        binaryDer,
        {
            name: 'RSASSA-PKCS1-v1_5',
            hash: {name: 'SHA-512'}
        },
        false,
        ["verify"]
    );
}
onmessage = function(e) {
    console.log('Worker: Message received from main script');
    const [h, p, s, event] = e.data
    const rawPubKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwfgC/cgSha3asB3UX5m83l7iilhKlITOWDQNlixIs5FvkBlyxqhtciUx9xcR/LyGEB/a9xh2+YoglwD76kM+bq/mGG5PI7Z9R8AhIuesgh0ubtIn4HCTJvkJHdMNSfk4HZpVw2KAn67qvcdzRnSGrkNuNeSC1jWYenc3RazGRP6mozFfinEOEdbZ7jndKo2TgoiPjaH6RXM5rebYPoHNsjL7hwY9Lv69cdjEz4Lp9JpM8yItJ4gX6NUDjTXnMS9YUiLerktGAVtM2PHdO1in5LZYP9OCR1fTGkrl1KASJHDgHwIjVgIHGQk18ccj8g0TkQPdmxmRguutd86Ew3RxAQIDAQAB
-----END PUBLIC KEY-----`
    if (rawPubKey) {
        importPublicKey(rawPubKey)
        .then(async pem => {
            console.log(s, event)
            const isValid = await window.crypto.subtle.verify(
                'RSA-SHA256',
                pem,
                s, 
                'base64'
            )
            console.log(isValid)
            postMessage([isValid, event]);
        })
        .catch(error => console.log(error))
    } else {
        console.log('Worker: Posting message back to main script');
        postMessage("Nothing");
    }
}