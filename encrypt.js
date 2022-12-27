const encrypt = async (key, secret) {
  if (typeof key !== 'string') {
    throw new Error('key not a string');
  }
  await _sodium.ready;
  const sodium = _sodium;
  let binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL)
  let binsec = sodium.from_string(secret)
  let encBytes = sodium.crypto_box_seal(binsec, binkey)
  let output = await sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL) 
  console.log("Output",output)
  return output;
  };
  
  
  module.exports = encrypt;
