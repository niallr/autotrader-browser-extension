/* Run code on load to retrieve and display previously-set options */
document.addEventListener('DOMContentLoaded', retrieveOptions);

/* When the 'Save' button is clicked */
document.getElementById('save').addEventListener('click', saveOptions);

/* When the 'Restore to default options' button is clicked */
document.getElementById('default').addEventListener('click', defaultOptions);

/* When the 'Add' button is clicked to block a dealer */
document.getElementById('search-dealer-add').addEventListener('click', addBlockedDealer);

/* Saves options to browser.storage, except blocked dealer information */
function saveOptions() {
	/* Get listing settings */
	const listingListingDate = document.getElementById('listing-listing-date').checked;
	const listingDealerPostcode = document.getElementById('listing-dealer-postcode').checked;
	const listingMOTExpiry = document.getElementById('listing-mot-expiry').checked;
	const listingPrevOwners = document.getElementById('listing-prev-owners').checked;
	const listingPartialReg = document.getElementById('listing-partial-reg').checked;
	/* Get search settings */
	const searchListingDate = document.getElementById('search-listing-date').checked;
	const searchHidePromoted = document.getElementById('search-hide-promoted').checked;
	const searchHideTopspot = document.getElementById('search-hide-topspot').checked;
	
	/* NIALL */
	const searchNRCustom = document.getElementById('search-nr-custom').checked;
	const searchNRCustomHide = document.getElementById('search-nr-custom-hide').checked;
	const searchNRCustomExpandAppliedSearchFilters = document.getElementById('search-nr-custom-hide-expand-applied-search-filters').checked;

	let settings = browser.storage.sync.set({
		/* Set listing settings */
		listingListingDate: listingListingDate,
		listingDealerPostcode: listingDealerPostcode,
		listingMOTExpiry: listingMOTExpiry,
		listingPrevOwners: listingPrevOwners,
		listingPartialReg: listingPartialReg,
		/* Set search settings */
		searchListingDate: searchListingDate,
		searchHidePromoted: searchHidePromoted,
		searchHideTopspot: searchHideTopspot,
		/* NIALL */
		searchNRCustom: searchNRCustom,
		searchNRCustomHide: searchNRCustomHide,
		searchNRCustomExpandAppliedSearchFilters: searchNRCustomExpandAppliedSearchFilters
	});

	settings.then(processSettings);

	function processSettings() {
		/* Update status to let user know options were saved. */
		const status = document.getElementById('status');
		status.textContent = 'Options saved.';
		/* 1s later, clear out the saved message */
		setTimeout(function() {
			status.innerHTML = '<br>';
		}, 1000);
	}
}

/* Retrieve options using the preferences in storage */
function retrieveOptions() {
	/* Get options from storage and define the defaults */
	let settings = browser.storage.sync.get({
		/* Get listing settings */
		listingListingDate: true,
		listingDealerPostcode: true,
		listingMOTExpiry: true,
		listingPrevOwners: true,
		listingPartialReg: true,
		/* Get search settings */
		searchListingDate: true,
		searchHidePromoted: true,
		searchHideTopspot: true,
		searchBlockedDealersList: [],
		/* NIALL */
		searchNRCustom: true,
		searchNRCustomHide: true,
		searchNRCustomExpandAppliedSearchFilters: true
	});

	settings.then(processSettings);

	function processSettings(items) {
		/* Display listing settings */
		document.getElementById('listing-listing-date').checked = items.listingListingDate;
		document.getElementById('listing-dealer-postcode').checked = items.listingDealerPostcode;
		document.getElementById('listing-mot-expiry').checked = items.listingMOTExpiry;
		document.getElementById('listing-prev-owners').checked = items.listingPrevOwners;
		document.getElementById('listing-partial-reg').checked = items.listingPartialReg;
		/* Display search settings */
		document.getElementById('search-listing-date').checked = items.searchListingDate;
		document.getElementById('search-hide-promoted').checked = items.searchHidePromoted;
		document.getElementById('search-hide-topspot').checked = items.searchHideTopspot;
		/* NIALL */
		document.getElementById('search-nr-custom').checked = items.searchNRCustom;
		document.getElementById('search-nr-custom-hide').checked = items.searchNRCustomHide;
		document.getElementById('search-nr-custom-hide-expand-applied-search-filters').checked = items.searchNRCustomExpandAppliedSearchFilters;
		/* Display blocked dealers */
		const searchBlockedDealersList = items.searchBlockedDealersList;
		/* Pass the array of blocked dealers into the rebuildDealerList function to display the values */
		rebuildDealerList(searchBlockedDealersList);
	}
}

/* Restore options to deafult settings */
function defaultOptions() {
	/* Initialise the clearOptions bool in case the user wants to cancel restoring to default settings */
	let clearOptions = false;

	/* Get the current blocked dealers */
	let settings = browser.storage.sync.get({
		searchBlockedDealersList: []
	});

	settings.then(processSettings);

	function processSettings(items) {
		searchBlockedDealersList = items.searchBlockedDealersList;

		/*
			If there are existing blocked dealers, the user might not want to restore to default settings
			Display a confirmation box to ensure they're aware of what they're doing
		*/
		if (searchBlockedDealersList.length > 0) {
			if (window.confirm('Please be aware that restoring to default settings will clear your hidden dealer settings.')) {
				/* If the user is happy to clear, set the bool to true, else it's left as false */
				clearOptions = true;
			}
		} else {
			/* If there are no existing blocked dealers, it's fairly safe to just restore the options to defaults and nothing valuable is lost */
			clearOptions = true;
		}

		if (clearOptions) {
			/* Clear all options in storage for this extension so it uses the default values */
			browser.storage.sync.clear();

			/* Run retrieveOptions to rebuild the page with the default options (empty blocked dealer list etc) */
			retrieveOptions();

			/* Update status to let user know options were saved. */
			const status = document.getElementById('status');
			status.textContent = 'Options restored to default values.';
			/* 1s later, clear out the defaulted message */
			setTimeout(function() {
				status.innerHTML = '<br>';
			}, 1000);
		}
	}
}

/* Add blocked dealer to list */
function addBlockedDealer() {
	/* Initialise searchBlockedDealersList as an empty array so we have something to manipulate if there are no dealers in storage */
	let searchBlockedDealersList = [];

	/* Extract the user's input dealer */
	const dealerInput = document.getElementById('search-dealer-input');
	
	/* If nothing was input, do nothing */
	if (dealerInput.value.replace(/"/g, '') != '') {
		/* Get the existing blocked dealers from storage so we can add to them */
		let settings = browser.storage.sync.get({
			searchBlockedDealersList: []
		});

		settings.then(processSettings);

		function processSettings(items) {
			searchBlockedDealersList = items.searchBlockedDealersList;

			/* Take input and replace and quotes, then set to uppercase for cleaner display and comparisons elsewhere */
			const dealerName = dealerInput.value.replace(/"/g, '').toUpperCase();

			/* If the given dealer is not already in the list, add it to storage */
			if (!searchBlockedDealersList.includes(dealerName)) {
				/* Push to the local array */
				searchBlockedDealersList.push(dealerName);

				/* Add to storage */
				browser.storage.sync.set({
					searchBlockedDealersList: searchBlockedDealersList
				});

				/* Pass the newly-modified local array into rebuildDealerList to show the new dealer on the page */
				rebuildDealerList(searchBlockedDealersList);
			} else {
				/* If the dealer is already in the list, display a message to inform the user that nothing's happened */
				const status = document.getElementById('blocked-dealer-status');
				status.innerHTML = '<span style="color:red">That dealer is already included in the list.</span>';
				/* 1s later, clear out the notification */
				setTimeout(function() {
					status.innerHTML = '<br>';
				}, 1000);
			}

			/* Clear the user input box now it's been processed, ready for another input */
			dealerInput.value = '';
		}
	}
}

/* Remove blocked dealer from list */
function removeBlockedDealer(i) {
	/* Get the existing blocked dealers from storage */
	let existingSettings = browser.storage.sync.get({
		searchBlockedDealersList: []
	});

	existingSettings.then(processExisting);

	function processExisting(items) {
		searchBlockedDealersList = items.searchBlockedDealersList;

		/* Splice out the record being removed using its index number (from the HTML) and a splice length of 1 */
		searchBlockedDealersList.splice(i, 1);

		/* Re-save the amended array to storage */
		let settings = browser.storage.sync.set({
			searchBlockedDealersList: searchBlockedDealersList
		});

		settings.then(processSettings);

		function processSettings() {
			/* Pass the newly-modified local array into rebuildDealerList to show the list on the page without the removed dealer and re-index the removal buttons*/
			rebuildDealerList(searchBlockedDealersList);
		}
	}
}

/* Rebuild the dealer list display with the newest blocked dealer array as input */
function rebuildDealerList(searchBlockedDealersList) {
	/* Initialise the dealer list how it will look in the HTML */
	let dealerListDisplay = '<b>Hidden dealers:</b><br>';

	/* If one or more dealers are in the list, we'll display their names alongside a removal button */
	if (searchBlockedDealersList.length > 0) {
		/* Iterate to add each dealer to the HTML */
		for (let i = 0; i < searchBlockedDealersList.length; i++) {
			/* Build dealerListDisplay from the seed value */
			dealerListDisplay = dealerListDisplay
								+ searchBlockedDealersList[i] /* Dealer name from the array */
								+ '<span id="delete-' /* The start of a span with an id so we can add a click listener */
								+ i /* The index in the current array, so we know which entry to remove if the delete button is clicked */
								+ '">&times;</span>' /* The multiplication sign in HTML - it looks like a nice neat X to delete a list entry */
								+ '<br>'; /* A line break so each dealer name is on its own line */
		}
		/* Add the new list appearance to the HTML */
		document.getElementById('search-blocked-dealers-list').innerHTML = dealerListDisplay;

		/* Iterate to add the event listeners now the HTML is finalised */
		for (let i = 0; i < searchBlockedDealersList.length; i++) {
			/* Find the span with the cross for this index */
			const deleteCross = document.getElementById('delete-' + i);

			/* Add an event listener so the removal function will run for this index when this index's cross is clicked */
			deleteCross.addEventListener('click', () => removeBlockedDealer(i));
		}
	} else {
		/* If no dealers are in the list, display the 'no hidden dealers' message */
		dealerListDisplay = dealerListDisplay + 'There are currently no dealers being hidden.';

		/* Update this on the page */
		document.getElementById('search-blocked-dealers-list').innerHTML = dealerListDisplay;
	}
}
