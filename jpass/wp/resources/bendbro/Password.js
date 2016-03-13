function findCredentialsFor(credentialList, url) {
    var credentialsFound = null;
    credentialList.forEach(function(credentials) {
        if(extractRootDomain(credentials.url) == extractRootDomain(url)) {
            credentialsFound = credentials;
        }
    });
    return credentialsFound;
}