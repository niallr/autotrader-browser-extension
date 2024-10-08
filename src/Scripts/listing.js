/* Initialise user options */
let listingListingDate, listingDealerPostcode, listingMOTExpiry, listingPrevOwners, listingPartialReg;

/* Initialise variable to alternate between adding to columns 0 and 1 in the Key Specs */
let columnNumber = 1;

/* Create a script element and inject it into the document head */
const harvestScript = document.createElement('script');
harvestScript.src = browser.runtime.getURL('Scripts/harvest.js');
(document.head || document.documentElement).appendChild(harvestScript);

/* Try to process the page on pageshow */
window.addEventListener('pageshow', checkProcessed);

/* Fallback to mouseover if all else fails */
window.addEventListener('mouseover', checkProcessed);

/* Any time there's a message, run the code */
window.addEventListener('message', (event) => processMessage(event));

function processMessage(messageReceived) {
	if (messageReceived.origin === 'https://www.autotrader.co.uk') {
		checkProcessed();
	}
}

/* Rerun the code when the page content changes, not all elements will be present when the code initially runs */
const pageContent = document.getElementById('content');
const contentChanges = new MutationObserver(checkProcessed);
contentChanges.observe(pageContent, {
	childList: true,
	attributes: true,
	subtree: true
});

/* Rerun the code when the page head changes (important for when the injected script has found the JSON) */
const pageHead = document.head;
const headChanges = new MutationObserver(checkProcessed);
headChanges.observe(pageHead, {
	childList: true,
	attributes: true,
	subtree: true
});

/* Start with a function that checks whether the page has already been processed */
function checkProcessed() {
	/* Try to find an element we've added - if there are none we've either not processed the page or the user's settings prevented any being added */
	const isProcessed = document.getElementById('at-toolkit-owners')
	?? document.getElementById('at-toolkit-mot-expiry')
	?? document.getElementById('at-toolkit-dealer-postcode')
	?? document.getElementById('at-toolkit-listing-date');

	/* If we didn't find an added element, run the code */
	if (!isProcessed) {
		getSettings();
	} else {
		/* If we've already processed the page, remove the mouseover listener for performance */
		window.removeEventListener('mouseover', checkProcessed);
	}
}

/* Get the user's saved settings before processing the page */
function getSettings() {
	/* Get user options */
	let settings = browser.storage.sync.get({
		/* Get listing settings */
		listingListingDate: true,
		listingDealerPostcode: true,
		listingMOTExpiry: true,
		listingPrevOwners: true,
		listingPartialReg: true
	});

	settings.then(processSettings);

	function processSettings(items) {
		/* Set listing settings */
		listingListingDate = items.listingListingDate;
		listingDealerPostcode = items.listingDealerPostcode;
		listingMOTExpiry = items.listingMOTExpiry;
		listingPrevOwners = items.listingPrevOwners;
		listingPartialReg = items.listingPartialReg;
		getContent();
	}
}

function getContent() {
	/* Get the content element */
	const content = document.getElementById('content');

	if (content) {
		/* Get the key specs element */
		let keySpecs = content.querySelector('[data-gui="key-specs-section"]');

		/* If we didn't find one, there must be no key specs and we'll need to create the element from scratch */
		if (!keySpecs) {
			/* Get the description block (which should always exist) */
			let descriptionBlock = content.querySelector('[data-gui="advert-description-title"]');

			if (descriptionBlock) {
				/* Find the description block's parent node as we'll add the overview block into that */
				descriptionBlock = descriptionBlock.parentNode;

				/* Generate a fresh block to hold the overview */
				const overviewBlock = document.createElement('section');

				/* Update the HTML and class name so it matches a listing where the overview does exist */
				overviewBlock.setAttribute('data-gui', 'key-specs-section');
				overviewBlock.className = 'sc-dzfhSK dvxhQO';
				overviewBlock.style = 'display: grid; grid-template-columns: repeat(2, minmax(0px, 1fr)); gap: calc(48px);';

				/* Insert the new element before the description block */
				descriptionBlock.parentNode.insertBefore(overviewBlock, descriptionBlock);

				/* Generate a fresh block to hold the key specs we'll be adding and set its attributes/class/style to match a listing where it exists */
				const freshKeySpecs = document.createElement('ul');
				freshKeySpecs.setAttribute('data-gui', 'description-list-column');
				freshKeySpecs.className = 'sc-hKUiOL doJJN';
				freshKeySpecs.style = 'display: flex; flex-direction: column; border-bottom: 1px solid rgb(232, 231, 230)';

				/* Append the key specs element to the overview block */
				overviewBlock.appendChild(freshKeySpecs);

				/* Update the keySpecs variable for use later */
				keySpecs = content.querySelector('[data-gui="key-specs-section"]');
			}
		}

		/* Try to find the first item in keySpecs */
		let keySpecsItem1 = keySpecs.children[0].firstChild;

		/* If we didn't find an item, create a dummy entry */
		if (!keySpecsItem1) {
			/* Generate an element fresh using class/style from a listing where it exists and X as the spec name/value */
			keySpecsItem1 = document.createElement('li');
			keySpecsItem1.className = 'sc-klnyBk hLIpay';
			keySpecsItem1.style = 'display: flex; align-tems: flex-start; justify-content: space-between';
			keySpecsItem1.innerHTML = '<dt class="sc-fYYabh sc-dhGPYp hhusnP eYzncW">X</dt><dd class="sc-fYYabh sc-gqGJVm hhusnP gReNhb">X</dd>';
		}

		/* If there's no existing second column in the key specs, add a blank one in so we can append to it */
		if (!keySpecs.children[1]) {
			/* Clone with no children included */
			let keySpecsSecondColumn = keySpecs.children[0].cloneNode(false);

			/* Append to keySpecs to make the blank column available */
			keySpecs.appendChild(keySpecsSecondColumn);
		}

		/* Find the JSON in the document head, added by the injected script */
		const jsonElement = document.getElementById('at-toolkit-json');

		if (jsonElement) {
			/* Parse the text as JSON and call this scriptJSON */
			const scriptJSON = JSON.parse(document.getElementById('at-toolkit-json').innerText);

			/* JSON section */
			if (scriptJSON) {
				/* Display hidden previous owners section start */
				/* Check whether previous owners have been deliberately excluded */
				const excludePreviousOwners = scriptJSON.excludePreviousOwners;

				/* Check whether we've already added this element */
				const existingKeySpecsOwners = document.getElementById('at-toolkit-owners');

				/* If owners have been excluded, the user wants them displayed and we haven't already added this element, run the process */
				if (excludePreviousOwners === true && listingPrevOwners === true && !existingKeySpecsOwners) {
					/* Get the number of owners from the JSON */
					const numberOfOwners = scriptJSON.owners;

					/* Only add the element if we found a value */
					if (numberOfOwners > 0) {
						/* Display number of owners if hidden */
						if (keySpecsItem1) {
							/* Clone the existing (or spoofed) item 1 */
							let keySpecsOwners = keySpecsItem1.cloneNode(true);

							/* Update the clone's ID so we don't reprocess the page if the code runs again */
							keySpecsOwners.id = 'at-toolkit-owners';

							/* Set the clone's title text */
							keySpecsOwners.children[0].innerText = 'Owners';

							/* Set the clone's content text */
							keySpecsOwners.children[1].innerText = numberOfOwners;

							/* Append the clone to the key specs */
							keySpecs.children[columnNumber].append(keySpecsOwners);

							/* Flip columnNumber (0 to 1 or 1 to 0) */
							columnNumber = (columnNumber + 1) % 2;
						}
					}
				}
				/* Display hidden previous owners section end */

				/* Display partial reg section start */
				/* Check whether we've already added this element */
				const existingKeySpecsPartialReg = document.getElementById('at-toolkit-partial-reg');

				/* Pull obfuscated registration from JSON */
				let partialReg = scriptJSON.registration;

				if (partialReg && listingPartialReg === true && !existingKeySpecsPartialReg) {
					/* Substitute asterisks with question marks for easier copy/pasting to partialnumberplate.co.uk */
					partialReg = partialReg.replaceAll('*', '?');

					/* Check for standard GB length of 7 so we can try to get fancy with the spacing and add in the regPlate */
					if (partialReg.length == 7) {
						/* Grab the last 2 characters */
						const checkNI = partialReg.substring(5);

						/* If the last two characters represent an integer, assume this is NI */
						const isNI = !isNaN(parseInt(checkNI));

						if (isNI) {
							/* Split the reg as if it's NI style (LLL NNNN) */
							partialReg = partialReg.substring(0, 3) + ' ' + partialReg.substring(3);
						} else {
							/* Split the reg as if it's GB style */
							partialReg = partialReg.substring(0, 4) + ' ' + partialReg.substring(4);

							/* Pull plate number, e.g. N reg or 58 plate, from JSON */
							const regPlate = scriptJSON.plate;

							/* Check whether it's old style or new style */
							if(regPlate.length == 2) {
								/* New style so add the plate numbers into characters 3 and 4 */
								partialReg = partialReg.substring(0, 2) + regPlate + partialReg.substring(4);
							}
						}
					}

					if (keySpecsItem1) {
						/* Clone the existing (or spoofed) item 1 */
						let keySpecsPartialReg = keySpecsItem1.cloneNode(true);

						/* Update the clone's ID so we don't reprocess the page if the code runs again */
						keySpecsPartialReg.id = 'at-toolkit-partial-reg';

						/* Set the clone's title text */
						keySpecsPartialReg.children[0].innerText = 'Estimated Reg';

						/* Set the clone's content text */
						keySpecsPartialReg.children[1].innerText = partialReg;

						/* Append the clone to the key specs */
						keySpecs.children[columnNumber].append(keySpecsPartialReg);

						/* Flip columnNumber (0 to 1 or 1 to 0) */
						columnNumber = (columnNumber + 1) % 2;
					}
				}
				/* Display partial reg section end */

				/* Display MOT expiry section start */
				/* Get  MOT expiry from JSON */
				let motExpiry = scriptJSON.motExpiry;

				/* Check whether we've already added this element */
				const existingKeySpecsMOTExpiry = document.getElementById('at-toolkit-mot-expiry');

				/* If there's a date value, the user wants it displayed and we haven't already added this element, run the process */
				if (motExpiry && listingMOTExpiry === true && !existingKeySpecsMOTExpiry) {
					/* Convert the string date from JSON to an actual date */
					motExpiry = new Date(motExpiry);

					/* Find the difference between the MOT date and today (midnight) to find the number of days' difference */
					const motExpiryDiffInDays = Math.floor((motExpiry.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));

					/* Initialise the date descriptor using the British long date style (dd/MMM/yyyy) */
					let motExpiryDescriptor = motExpiry.toLocaleDateString('en-gb', {year:'numeric', month:'long', day:'2-digit'});

					/* If the difference is less than zero, the MOT has expired */
					if (motExpiryDiffInDays < 0) {
						motExpiryDescriptor = motExpiryDescriptor + '\n(Expired)';
					} else if (motExpiryDiffInDays == 0) {
						/* If it's exactly zero, it expires today */
						motExpiryDescriptor = motExpiryDescriptor + '\n(Today)';
					} else if (motExpiryDiffInDays == 1) {
						/* If it's exactly one, it expires tomorrow */
						motExpiryDescriptor = motExpiryDescriptor + '\n(Tomorrow)';
					} else {
						/* If it's two or more, we have N days left to dislpay */
						motExpiryDescriptor = motExpiryDescriptor + '\n(' + motExpiryDiffInDays + ' days left)';
					}

					if (keySpecsItem1) {
						/* Clone the existing (or spoofed) item 1 */
						let keySpecsMOTExpiry = keySpecsItem1.cloneNode(true);

						/* Update the clone's ID so we don't reprocess the page if the code runs again */
						keySpecsMOTExpiry.id = 'at-toolkit-mot-expiry';

						/* Set the clone's title text */
						keySpecsMOTExpiry.children[0].innerText = 'MOT Expiry';

						/* Set the clone's content text */
						keySpecsMOTExpiry.children[1].innerText = motExpiryDescriptor;

						/* Append the clone to the key specs */
						keySpecs.children[columnNumber].append(keySpecsMOTExpiry);

						/* Flip columnNumber (0 to 1 or 1 to 0) */
						columnNumber = (columnNumber + 1) % 2;
					}
				}
				/* Display MOT expiry section end */

				/* Display dealer postcode section start */
				/* Get dealer node from JSON */
				const dealer = scriptJSON.dealer;

				//* Check whether we've already added this element */
				const existingKeySpecsDealerPostcode = document.getElementById('at-toolkit-dealer-postcode');

				/* If we have a dealer node, the user wants the postcode displayed and we haven't already added this element, run the process */
				if (dealer && listingDealerPostcode === true && !existingKeySpecsDealerPostcode) {
					/* Check to see if the node has a location node */
					const dealerLocation = dealer.location;

					if (dealerLocation) {
						/* Check to see if the node has a postcode node */
						const dealerPostcode = dealerLocation.postcode;

						/* If we've found a postcode, display it */
						if (keySpecsItem1 && dealerPostcode) {
							/* Clone the existing (or spoofed) item 1 */
							let keySpecsDealerPostcode = keySpecsItem1.cloneNode(true);

							/* Update the clone's ID so we don't reprocess the page if the code runs again */
							keySpecsDealerPostcode.id = 'at-toolkit-dealer-postcode';

							/* Set the clone's title text */
							keySpecsDealerPostcode.children[0].innerText = 'Dealer Postcode';

							/* Set the clone's content text */
							keySpecsDealerPostcode.children[1].innerText = dealerPostcode;

							/* Append the clone to the key specs */
							keySpecs.children[columnNumber].append(keySpecsDealerPostcode);

							/* Flip columnNumber (0 to 1 or 1 to 0) */
							columnNumber = (columnNumber + 1) % 2;
						}
					}
				}
				/* Display dealer postcode section end */

				/* Display listing date section start */
				/* Check whether we've already added this element */
				const existingKeySpecsListingDate = document.getElementById('at-toolkit-listing-date');

				/* If the user wants the listing date displayed and we haven't already added this element, run the process */
				if (listingListingDate === true && !existingKeySpecsListingDate) {
					/* Get the ad ID from the JSON to find listing date from the first 8 characters */
					const advertId = scriptJSON.id;
					const listingYear = advertId.substring(0, 4);
					const listingMonth = advertId.substring(4, 6);
					const listingDay = advertId.substring(6, 8);

					/* Generate a date out of the Year/Month/Day */
					const listingDate = new Date(listingYear + '-' + listingMonth + '-' + listingDay);

					/* Find the difference between today (midnight) and the listing date to find the number of days' difference */
					const listingDiffInDays = Math.floor((new Date().setHours(0, 0, 0, 0) - listingDate.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));

					/* Initialise the date descriptor using the British long date style (dd/MMM/yyyy) */
					let listingDateDescriptor = listingDate.toLocaleDateString('en-GB', {year:'numeric', month:'long', day:'2-digit'});

					/* Add the number of days ago to the descriptor */
					if (listingDiffInDays < 1) {
						/* If the difference is 0 or less (can happen if the user is in another country), it was listed 'today' */
						listingDateDescriptor = listingDateDescriptor + '\n(Today)';
					} else if (listingDiffInDays == 1) {
						/* Exactly 1 means 'yesterday' */
						listingDateDescriptor = listingDateDescriptor + '\n(Yesterday)';
					} else {
						/* Otherwise it's N days ago */
						listingDateDescriptor = listingDateDescriptor + '\n(' + listingDiffInDays + ' days ago)';
					}

					if (keySpecsItem1) {
						/* Clone the existing (or spoofed) item 1 */
						let keySpecsListingDate = keySpecsItem1.cloneNode(true);

						/* Update the clone's ID so we don't reprocess the page if the code runs again */
						keySpecsListingDate.id = 'at-toolkit-listing-date';

						/* Set the clone's title text */
						keySpecsListingDate.children[0].innerText = 'Listing Date';

						/* Set the clone's content text */
						keySpecsListingDate.children[1].innerText = listingDateDescriptor;

						/* Append the clone to the key specs */
						keySpecs.children[columnNumber].append(keySpecsListingDate);

						/* Flip columnNumber (0 to 1 or 1 to 0) */
						columnNumber = (columnNumber + 1) % 2;
					}
				}
				/* Display listing date section end */
			}
			/* End of JSON section */
		}

		/* Hide overview section if, after fully processing, we haven't added any nodes */
		if (keySpecs && keySpecs.childElementCount == 0) {
			keySpecs.parentNode.style.display = 'none';
		} else {
			/* Overview section might have been hidden in an earlier run, so if there are now child element, remove display = 'none' */
			keySpecs.parentNode.style.display = '';
		}
	}
}

