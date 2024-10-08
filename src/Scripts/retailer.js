/* Initialise user options */
let searchListingDate;

/* Try to process the page on pageshow */
window.addEventListener('pageshow', getSettings);

/* Any time there's a message, run the code - no current need to limit this to specific messages */
window.addEventListener('message', (event) => processMessage(event));

function processMessage(messageReceived) {
	getSettings();
}

/* Rerun the code when the page content changes - it's infinite scroll so new listings will appear and need to be processed */
const pageContent = document.getElementById('app');
const contentChanges = new MutationObserver(getSettings);
contentChanges.observe(pageContent, {
	childList: true,
	subtree: true
});

/* Start off by getting the user's preferred settings, in case they don't want listing dates added */
function getSettings() {
	/* Get user options */
	let settings = browser.storage.sync.get({
		/* Get search settings */
		searchListingDate: true
	});

	settings.then(processSettings);

	function processSettings(items) {
		/* Set search settings */
		searchListingDate = items.searchListingDate;
		getContent();
	}
}

function getContent() {
	/* Get the element containing the listings */
	const content = document.getElementById('dealerStockResultsTable');

	if (content) {
		/* Get all of the listings as a HTMLCollection so we can iterate through them */
		let listings = content.getElementsByClassName('stock-view-listing');

		/* Iterate through each, up to the length of the HTMLCollection */
		for (let i = 0; i < listings.length; i++) {
			alterListing(i);
		}

		function alterListing(i) {
			/* Get the individual listing */
			const listing = listings.item(i);

			/* Get the parent to check if we've already processed it */
			const parent = listing.parentNode;

			/* Initialise alreadyProcessed as false to make sure we process each listing by default */
			let alreadyProcessed = false;

			if (parent.id == 'at-toolkit-processed') {
				/* If we've processed, switch the flag so we don't reprocess */
				alreadyProcessed = true;
			} else {
				/* If we haven't processed, set the ID of the parent to note that we have now processed this listing */
				parent.id = 'at-toolkit-processed';
			}

			/* Get advertId string to find listing date from the first 8 characters */
			const advertId = listing.id;
			const listingYear = advertId.substring(0, 4);
			const listingMonth = advertId.substring(4, 6);
			const listingDay = advertId.substring(6, 8);

			/* Generate a date out of the Year/Month/Day */
			const listingDate = new Date(listingYear + '-' + listingMonth + '-' + listingDay);

			/* Find the difference between today (midnight) and the listing date to find the number of days' difference */
			const diffInDays = Math.floor((new Date().setHours(0, 0, 0, 0) - listingDate.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));

			/* Initialise the date descriptor using the British long date style (dd/MMM/yyyy) */
			let dateDescriptor = listingDate.toLocaleDateString('en-GB', {year:'numeric', month:'long', day:'2-digit'});

			/* Add the number of days ago to the descriptor */
			if (diffInDays < 1) {
				/* If the difference is 0 or less (can happen if the user is in another country), it was listed 'today' */
				dateDescriptor = dateDescriptor + ' (Today) | ';
			} else if (diffInDays == 1) {
				/* Exactly 1 means 'yesterday' */
				dateDescriptor = dateDescriptor + ' (Yesterday) | ';
			} else {
				/* Otherwise it's N days ago */
				dateDescriptor = dateDescriptor + ' (' + diffInDays + ' days ago) | ';
			}

			/* Find the key specs element for this listing */
			const keySpecs = listing.getElementsByClassName('information')[0];

			/* Find the actual key spec values (it's all one string so we just need to append the descriptor). A bit redundant but held over from the search.js methodology */
			const keySpecsItem1 = keySpecs.children[2];

			/* If we've found the specs and haven't already processed this record, append the descriptor */
			if (keySpecsItem1 && searchListingDate === true && !alreadyProcessed) {
				keySpecsItem1.innerText = dateDescriptor + keySpecsItem1.innerText;
			}
		}
	}
}
