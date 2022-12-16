const core = require('@actions/core');
const github = require("@actions/github");
const _sodium = require('libsodium-wrappers')
const secretValue = core.getInput('secret-value');
const secretLevel = core.getInput('secret-level');
const secretName = core.getInput('secret-name');
const orgName = core.getInput('org-name');
const repoName = core.getInput('repo-name');

const run = async () => {
  try {
    const octokit = new github.getOctokit(process.env.GITHUB_TOKEN);
    //Check if libsodium is ready and then proceed.
    const publicKey = await octokit.request('GET /repos/'+orgName+'/'+ repoName+'/actions/secrets/public-key', {
      owner: orgName,
      repo: repoName
    })
    
    await _sodium.ready;
    const sodium = _sodium;
    // Convert Secret & Base64 key to Uint8Array.
    let binkey = sodium.from_base64(publicKey.data.key, sodium.base64_variants.ORIGINAL)
    let binsec = sodium.from_string(secretValue)
    //Encrypt the secret using LibSodium
    let encBytes = sodium.crypto_box_seal(binsec, binkey)
    // Convert encrypted Uint8Array to Base64
    let output = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL)    
    if ( secretLevel.toLowerCase() === 'repository') {
      const result = await octokit.request('PUT /repos/'+orgName+'/'+ repoName+'/actions/secrets/'+secretName, {
        owner: orgName,
        repo: repoName,
        secret_name: secretName,
        encrypted_value: output,
        key_id: publicKey.data.key_id
      })
      core.setOutput('message', result.status == 204 ? "Secret Updated" : "Secret Created" );
    } 
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
