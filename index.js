const core = require('@actions/core');
const github = require("@actions/github");
const encrypt = require('./encrypt');
const secretValue = core.getInput('secret-value');
const secretLevel = core.getInput('secret-level');
const secretName = core.getInput('secret-name');
const orgName = core.getInput('org-name');
const repoName = core.getInput('repo-name');
const token = core.getInput('token');
const envName = core.getInput('env-name');
const run = async () => {
  try {
    const octokit = github.getOctokit(token);
    //Check if libsodium is ready and then proceed.
    if ( secretLevel.toLowerCase() === 'repository') {
      const publicKey = await octokit.request('GET /repos/'+orgName+'/'+ repoName+'/actions/secrets/public-key', {
        owner: orgName,
        repo: repoName
      })
      const output = await encrypt(publicKey.data.key,secretValue) 
      const result = await octokit.request('PUT /repos/'+orgName+'/'+ repoName+'/actions/secrets/'+secretName, {
        owner: orgName,
        repo: repoName,
        secret_name: secretName,
        encrypted_value: output,
        key_id: publicKey.data.key_id
      })
      core.setOutput('message', result.status == 204 ? "Secret Updated" : "Secret Created" );
    } else if ( secretLevel.toLowerCase() === 'environment') {
      const repoId = await octokit.request('GET /repos/'+orgName+'/'+ repoName, {
        owner: orgName,
        repo: repoName
      });
      const repoPublicKey = await octokit.request('GET /repositories/'+repoId.data.id+'/environments/'+envName+'/secrets/public-key', {
        repository_id: repoId.data.id,
        environment_name: envName
      })
      const output = await encrypt(repoPublicKey.data.key,secretValue)
      const result = await octokit.request('PUT /repositories/'+repoId.data.id+'/environments/'+envName+'/secrets/'+ secretName, {
        repository_id: repoId.data.id,
        environment_name: envName,
        secret_name: secretName,
        encrypted_value: output,
        key_id: repoPublicKey.data.key_id
      })
      core.setOutput('message', result.status == 204 ? "Secret Updated" : "Secret Created" );
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
