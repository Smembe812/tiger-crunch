
async function computePersistedPIN(proposedPIN:string){
    const { pbkdf2, randomBytes } = await import('crypto');
    const salt = await randomBytes(128).toString('base64');
    const iterations = 100000
    return new Promise((resolve, reject) => {
      pbkdf2(proposedPIN, salt, iterations, 64, 'sha512', (error, key) => {
          if(error) throw error;
          return resolve({hash:key.toString("hex"), salt, iterations});
      })
    }) 
}

async function isValidPin({proposedPIN, salt, iterations, hash}):Promise<boolean|any>{
  const { pbkdf2 } = await import('crypto');
  return new Promise((resolve, reject) => {
    pbkdf2(proposedPIN, salt, iterations, 64, 'sha512', (error, key) => {
      if(error) throw error;
      return resolve(key.toString("hex") === hash);
    })
  }) 
}

function generatePIN(n = 4) {
    const add = 1
    let max = 12 - add
    if (n > max) {
      return generatePIN(max) + generatePIN(n - max);
    }
    max = Math.pow(10, n + add);
    const min = max / 10; // Math.pow(10, n) basically 
    const number = Math.floor(Math.random() * (max - min + 1)) + min;
    return ("" + number).substring(add);
  }

export default {
    computePersistedPIN,
    generatePIN,
    isValidPin
}