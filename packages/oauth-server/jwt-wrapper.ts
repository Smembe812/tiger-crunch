import jwt from "jsonwebtoken"
export default class JWT{
    #signer={key:null, passphrase:""};
    #algo;
    #jwt;
    constructor({algo, signer}){
        this.#jwt = jwt
        this.setSigner(signer)
        this.setAlgorithm(algo)
    }
    setSigner(signer){
        if(signer?.key){
            this.#signer.key = signer.key
        }
        if(signer?.passphrase){
            this.#signer.passphrase
        }
        return this
    }
    setAlgorithm(algo){
        if(algo){
            this.#algo = {algorithm: algo}
        }
        return this
    }
    sign(payload, options=null){
        return this.#jwt.sign({...payload}, this.#signer, {...options, ...this.#algo})
    }
    verify({token, key}){
        return this.#jwt.verify(token,key)
    }
}