function extractDomain(url) {
    var domain;
    //find & remove protocol (http, ftp, etc.) and get domain
    if (url.indexOf("://") > -1) {
        domain = url.split('/')[2];
    }
    else {
        domain = url.split('/')[0];
    }

    //find & remove port number
    domain = domain.split(':')[0];

    return domain;
}

function extractRootDomain(domain) {
	var domainSplit = domain.split('.');
	return domainSplit[domainSplit.length-2] + "." + domainSplit[domainSplit.length-1];
}
