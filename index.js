const core = require('@actions/core');
const github = require('@actions/github');
const _sodium = require('libsodium-wrappers')
const secretValue = core.getInput('secret-value');
const secretLevel = core.getInput('secret-level');
const secretName = core.getInput('secret-name');
const orgName = core.getInput('org-name');
const repoName = core.getInput('repo-name');
const myToken = core.getInput('token');
const octokit = github.getOctokit(myToken)

const run = async () => {
  try {
    //Check if libsodium is ready and then proceed.
    const publicKey = await octokit.request('GET /repos/'+repoName+'/actions/secrets/public-key', {
      owner: orgName,
      repo: repoName
    })
    await _sodium.ready;
    const sodium = _sodium;
    // Convert Secret & Base64 key to Uint8Array.
    let binkey = sodium.from_base64(publicKey.key, sodium.base64_variants.ORIGINAL)
    let binsec = sodium.from_string(secretValue)
    //Encrypt the secret using LibSodium
    let encBytes = sodium.crypto_box_seal(binsec, binkey)
    // Convert encrypted Uint8Array to Base64
    let output = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL)    
    if ( secretLevel.toLowerCase() === 'repository') {
      const result = await octokit.request('PUT /repos/'+repoName+'/actions/secrets/'+secretName, {
        owner: orgName,
        repo: repoName,
        secret_name: secretName,
        encrypted_value: output,
        key_id: publicKey.key_id
      })
      core.setOutput('HTTP_STATUS', result.toString());
    } 
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
