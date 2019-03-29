export function  getProfileDocumentLocation (webid) {

	if (webid.indexOf('#') >= 0 ) {
		return webid.substr(0 , webid.lastIndexOf('#'));
	}

	return '';
}

export function getProfileUrl(webid: string): string {
	const regexCardMe = new RegExp('profile/card#me');

	if ( regexCardMe.test(webid) )
	return webid;

	else

	return removeDuplicateSlashInURL(webid) + 'profile/card#me';
}

export function removeDuplicateSlashInURL(url) {

	let urlPath = url;
	let protocol = '';

	if ( url.indexOf('https') === 0 ) {
		urlPath = url.substr(8 , url.length);
		protocol = 'https://';
	} else if (url.indexOf('http') === 0 ) {
		urlPath = url.substr(7 , url.length);
		protocol = 'http://';
	}

	const comps = urlPath.split('/');
	const newComps = [];

	for ( const i in comps ) {
		const item = comps[i];

		if ( item.length > 0 )
			newComps.push(item);
	}

	return protocol + newComps.join('/');
}

export function timestampToDate(timestamp) {
	const a = new Date(timestamp * 1000);
	  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	  const year = a.getFullYear();
	  const month = months[a.getMonth()];
	  const date = a.getDate();
	  const hour = a.getHours();
	  const min = a.getMinutes();
	  const sec = a.getSeconds();
	  const time = date + ' ' + month + year + hour + ':' + min + ':' + sec ;
	  return time;
}

const friendlyWebid = function(webid) {

	return webid
			.split('/').join('')
			.split(':').join('')
			.split('#').join('')
			.split('.').join('');
};

export function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function removeTrailingSlash(str) {
	if (str.substr(-1) === '/' && str.length > 2) {
        return str.substr(0, str.length - 1);
    }
    return str;
}
