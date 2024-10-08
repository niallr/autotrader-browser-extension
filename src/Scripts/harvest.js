/* Try to harvest the JSON on pageshow */
window.addEventListener('pageshow', checkProcessed);

/* Fallback to mouseover if all else fails */
window.addEventListener('mouseover', checkProcessed);

/* Try to harvest the JSON on each message received */
window.addEventListener('message', (event) => processMessage(event));

/* Any time there's a message, run the code - no current need to limit this to specific messages */
function processMessage(messageReceived) {
	checkProcessed();
}

/* Initial function to prevent running the whole code if we're already processed the page */
function checkProcessed() {
	/* Check for the JSON script in the document head */
	const findJSON = document.getElementById('at-toolkit-json');

	if (!findJSON) {
		/* If the script element doesn't exist, run the code */
		getContent();
	} else {
		/* If the script element does exist, remove the mouseover listener to improve performance */
		window.removeEventListener('mouseover', checkProcessed);
	}
}

/* Function to get the content element and loop through its react fiber to find the JSON */
function getContent() {
	/* Get the content element - the highest element with the relevant react fibers */
	const content = document.getElementById('content');

	/* Find the keys for this element so we can find the reactFiber key */
	const keys = Object.keys(content);

	/* Check through each key */
	for (i = 0; i < keys.length; i++) {
		/* If the key found is the reactFiber key, begin the datacrawl to search for the JSON */
		if (keys[i].startsWith('__reactFiber$')) {
			dataCrawl(content[keys[i]]);
		}
	}
}

/* Function to check the pendingProps of an object for the advert JSON and, if not found, call itself to check the child/sibling objects */
function dataCrawl(obj) {
	if (obj) {
		/* Check pendingProps.value for advert JSON - nested ifs at each stage in case that level is null */
		const pendingProps = obj.pendingProps;

		if (pendingProps) {
			const pendingPropsValue = pendingProps.value;

			if (pendingPropsValue) {
				const advert = pendingPropsValue.advert;

				/* advert is a JSON object */
				if (advert) {
					/* Create a script element in the document head to store the JSON and let it be available to the content script */
					const jsonScript = document.createElement('script');

					/* Give it an ID so we can check if we're already processed this page in the checkProcessed function above */
					jsonScript.id = 'at-toolkit-json';

					/* Type is text/json - don't know what this does but online it said something about being useful for escaping characters */
					jsonScript.type = 'text/json';

					/* Stringify the JSON and add it to the script element. Needs to be stringified otherwise it will read [object Object] */
					jsonScript.text = JSON.stringify(advert);

					/* Add this to the document head */
					(document.head || document.documentElement).appendChild(jsonScript);

					/* Return so we can break out of the function. Store the JSON in a window frame for better visibility in the console */
					return window['AT_TOOLKIT_JSON'] = advert;
				}
			}
		}

		/* If the JSON isn't in the pendingProps of this level, check downwards */
		if (obj.child) {
			dataCrawl(obj.child);
		}

		/* If the JSON isn't in the pendingProps of this level or downwards, check sideways */
		if (obj.sibling) {
			dataCrawl(obj.sibling);
		}
	}
}

