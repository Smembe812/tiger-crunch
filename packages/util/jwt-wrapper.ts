import jwt from "jsonwebtoken"
export default class JWT{
    #signer={key:null, passphrase:""};
    #algo;
    #jwt;
    #verifier;
    constructor({algo, signer, verifier}){
        this.#jwt = jwt
        this.setSigner(signer)
        this.setAlgorithm(algo)
        this.setVerifier(verifier)
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
    setVerifier(verifier){
        if(verifier)
            this.#verifier = verifier
        return this
    }
    sign(payload, options=null){
        return this.#jwt.sign({...payload}, this.#signer, {...options, ...this.#algo})
    }
    verify({token, key=null}){
        if(key)
            return this.#jwt.verify(token,key)
        else
            return this.#jwt.verify(token, this.#verifier)
    }
}