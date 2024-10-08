/* Initialise user options */
let searchListingDate, searchHidePromoted, searchHideTopspot, searchBlockedDealersList;

/* NIALL */
let searchNRCustom, searchNRCustomHide, searchNRCustomExpandAppliedSearchFilters;

/* Try to process the page on pageshow */
window.addEventListener('pageshow', getSettings);

/* Any time there's a message, run the code - no current need to limit this to specific messages */
window.addEventListener('message', (event) => processMessage(event));

function processMessage(messageReceived) {
	getSettings();
}

/* Rerun the code when the page content changes, e.g moving to next page, changing the sort order etc. */
const pageContent = document.getElementById('content');
const contentChanges = new MutationObserver(getSettings);
contentChanges.observe(pageContent, {
	childList: true,
	subtree: true
});

/* Start off by getting the user's preferred settings, to determine what to change */
function getSettings() {
	/* Get user options */
	let settings = browser.storage.sync.get({
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
		/* Set search settings */
		searchListingDate = items.searchListingDate;
		searchHidePromoted = items.searchHidePromoted;
		searchHideTopspot = items.searchHideTopspot;
		searchBlockedDealersList = items.searchBlockedDealersList;
		/* NIALL */
		searchNRCustom = items.searchNRCustom;
		searchNRCustomHide = items.searchNRCustomHide;
		searchNRCustomExpandAppliedSearchFilters = items.searchNRCustomExpandAppliedSearchFilters;
		getContent();
	}
}

function getContent() {
	const content = document.getElementById('content');
	const alreadyProcessed = document.getElementById('at-toolkit-processed');

	if (content) {

		/* -------------------- Featured dealer section start -------------------- */
		/* Try to find the featured dealer carousel */
		let topSpot = content.getElementsByClassName('top-spot').item(0);

		/* Initialise the flag to fide the topspot, deafulting to not hiding it */
		let hideTopSpot = false;

		/* If we haven't found the element, try something else. This happens if there's no topspot or the class names have changed */
		if (!topSpot) {
			/* Try to find it using querySelector instead */
			topSpot = content.querySelector('[data-testid="top-spot-dealer"]');

			/* If we found a value with that query, we actually needs its parent element */
			if (topSpot) {
				topSpot = topSpot.parentElement;
			}
		}
		
		/* NIALL */
		if (searchNRCustomHide === true && document.getElementById("nrHideWarning") === null) {
			// Create a new h2 element
			const nrHideWarning = document.createElement('h2');
			nrHideWarning.setAttribute("id", "nrHideWarning");

			// Set the content of the h1 element
			nrHideWarning.textContent = "[NR HIDE Enabled - irrelevant listings hidden!]";

			// Prepend the h1
			document.querySelector('[data-testid="desktop-search"]').prepend(nrHideWarning);
		}
		
		if (searchNRCustomExpandAppliedSearchFilters === true) {
			// Select the first <header> child of the element with data-testid="filter-pills-container"
			const container = document.querySelector('[data-testid="filter-pills-container"]');
			const firstHeader = container.querySelector('header:first-child');

			// Apply the specified styles
			if (firstHeader) {
			  firstHeader.style.flexWrap = 'wrap';
			  firstHeader.style.height = 'auto';
			  //firstHeader.style.marginRight = '50px';
			  //firstHeader.style.width = '80%';
			  //firstHeader.style.marginLeft = '50px';
			}

			// Select all <button> elements inside the element with data-testid="filter-pills-container"
			const buttons = document.querySelectorAll('[data-testid="filter-pills-container"] button');

			// Loop through each button and apply the height:auto style
			buttons.forEach(button => {
			  button.style.height = 'auto';
			});
		}

		/* If we found a topspot element, process it */
		if (topSpot) {
			/* Try to find the dealer name */
			let topSpotDealer = topSpot.getElementsByClassName('atc-type-fiesta')[0];

			/* If we didn't find it, try to find it using querySelector instead */
			if (!topSpotDealer) {
				topSpotDealer = topSpot.querySelector('[data-testid="top-spot-dealer-name"]');
			}

			/* If we've found the dealer, check if it's a blocked dealer */
			if (topSpotDealer) {
				/* Extract the dealer name string and convert to upper case for simplicity in processing */
				const topSpotDealerName = topSpotDealer.textContent.trim().toUpperCase();

				/* Iterate through each of the user's blocked dealers, checking to see if this dealer's name matches any */
				for (i = 0; i < searchBlockedDealersList.length; i++) {
					const blockedDealer = searchBlockedDealersList[i].replace(',', '').replace(';', '').trim();

					if (blockedDealer != '') {
						/* Checks are done using 'includes', so if 'a' were blocked, any dealer name containing 'a' would be blocked */
						if (topSpotDealerName.includes(blockedDealer.toUpperCase())) {
							/* If the dealer name has been blocked by the user settings, flag to hide regardless of the user's 'hide topspot' setting' */
							hideTopSpot = true;
						}
					}
				}
			}

			/* If the user has chosen to hide the topspot, flag to hide the topspot regardless of the dealer name */
			if (searchHideTopspot === true) {
				hideTopSpot = true;
			}
		}

		/* If we've found that we need to hide the topspot, set the element display style to none */
		if (hideTopSpot) {
			topSpot.style.display = 'none';
		}
		/* -------------------- Featured dealer section end -------------------- */

		/* -------------------- Search results section start -------------------- */
		/* Get all the listings in an HTMLCollection */
		let listings = content.getElementsByClassName('search-page__result');

		/* If we didn't find any, e.g. when the class name has changed, try querySelector instead */
		if (listings.length == 0) {
			listings = content.querySelectorAll('[data-testid$="-seller-listing"]');
		}

		/* Store the lenth so we know how many listings the page should have had (if we've hidden them all, we need to highlight that later on) */
		const listingsTotalCount = listings.length;

		/* Initialise the number of hidden listings so we can compare it to the total count at the end */
		let hiddenListingsCount = 0;

		/* Iterate through each of the individual listings */
		for (let i = 0; i < listingsTotalCount; i++) {
			/* Get the individual listing */
			const listing = listings.item(i);

			/* Process the listing */
			alterListing(listing);
		}

		/* Get lease listings, which are formatted differently */
		const leaseListings = content.querySelectorAll('[data-testid="LEASING_LISTING"]');

		/* Iterate through each of the individual lease listings */
		for (let i = 0; i < leaseListings.length; i++) {
			/* Get the parent node of the individual lease listing, because that has the ID */
			const leaseListing = leaseListings.item(i).parentNode;

			/* Process the listing */
			alterListing(leaseListing);
		}

		function alterListing(listing) {
			/* Initialise a flag to decide whether or not we hide this listing. defaulting to not hiding it */
			let toBeHidden = false;

			/* Find the listing's parent node and update its ID so we don't reprocess the listing when the code runs again */
			const parent = listing.parentNode;
			parent.id = 'at-toolkit-processed';

			/* Listing date section start */
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
				dateDescriptor = dateDescriptor + ' (Today)';
			} else if (diffInDays == 1) {
				/* Exactly 1 means 'yesterday' */
				dateDescriptor = dateDescriptor + ' (Yesterday)';
			} else {
				/* Otherwise it's N days ago */
				dateDescriptor = dateDescriptor + ' (' + diffInDays + ' days ago)';
			}

			/* Find the key specs element for this listing */
			let keySpecs = listing.getElementsByClassName('listing-key-specs')[0];
			let keySpecsItem1;

			/* If we didn't find it, the class names might have changed. Try querySelector instead */
			if (!keySpecs) {
				keySpecs = listing.querySelector('[data-testid="search-listing-specs"]');
			}

			/* Find the first item in the key specs */
			if (keySpecs) {
				keySpecsItem1 = keySpecs.children[0];
			}

			/* Only add the listing date if we have a key specs to copy, the user's settings want it added, and we haven't already added it */
			if (keySpecsItem1 && searchListingDate === true && !alreadyProcessed) {
				let keySpecsListingDate = keySpecsItem1.cloneNode(true);
				keySpecsListingDate.innerText = dateDescriptor;
				keySpecs.append(keySpecsListingDate);
				
				if (searchNRCustom === true) {					
					
					getAdvertDetails(advertId).then(data => {
						let anotherSpecsBox = listing.querySelector('[data-testid="search-listing-specs"]').cloneNode(true);
						anotherSpecsBox.innerHTML = "";
						
						console.log(advertId + " - " + "Boot (Seats Down): " + data.specification.techData.bootspaceSeatsUp);
						let keySpecsLuggageCapacitySeatsDown = keySpecsItem1.cloneNode(true);
						keySpecsLuggageCapacitySeatsDown.innerText = "Boot (Seats Down): " + data.specification.techData.luggageCapacitySeatsDown;
						anotherSpecsBox.prepend(keySpecsLuggageCapacitySeatsDown);
						
						console.log(advertId + " - " + "Boot (Seats Up): " + data.specification.techData.bootspaceSeatsUp);
						let keySpecsBootspaceSeatsUp = keySpecsItem1.cloneNode(true);
						keySpecsBootspaceSeatsUp.innerText = "Boot (Seats Up): " + data.specification.techData.bootspaceSeatsUp;
						anotherSpecsBox.prepend(keySpecsBootspaceSeatsUp);
						
						listing.querySelector('[data-testid="search-listing-specs"]').parentNode.append(anotherSpecsBox);
						
						let yetAnotherSpecsBox = listing.querySelector('[data-testid="search-listing-specs"]').cloneNode(true);
						yetAnotherSpecsBox.innerHTML = "";
						console.log(advertId + " - " + "Exterior Length: " + data.specification.techData.vehicleLength);
						let keySpecsExteriorLength = keySpecsItem1.cloneNode(true);
						keySpecsExteriorLength.innerText = "Exterior Length: " + data.specification.techData.vehicleLength;
						yetAnotherSpecsBox.prepend(keySpecsExteriorLength);
						
						console.log(advertId + " - " + "Emission Class: " + data.specification.emissionClass);
						let keySpecsEmissionClass = keySpecsItem1.cloneNode(true);
						keySpecsEmissionClass.innerText = "Emission Class: " + data.specification.emissionClass;
						yetAnotherSpecsBox.prepend(keySpecsEmissionClass);
						
						listing.querySelector('[data-testid="search-listing-specs"]').parentNode.append(yetAnotherSpecsBox);
						
						if (data.specification.techData.bodytype == "Estate" +(data.specification.techData.bootspaceSeatsUp.split(" ")[0]) >= 400) {
							listing.querySelector('[data-testid="advertCard"]').style.background = 'darkgreen';
						}
						else if (data.specification.techData.bodytype != "Estate" && +(data.specification.techData.bootspaceSeatsUp.split(" ")[0]) >= 400 && +(data.specification.techData.vehicleLength.split(" ")[0]) >= 4500) {
							listing.querySelector('[data-testid="advertCard"]').style.background = 'darkgreen';
						}
						else {
							if (searchNRCustomHide === true) {
								listing.style.display = 'none';
								hiddenListingsCount = hiddenListingsCount + 1;
							}
						}
					});
				}
			}
			/* Listing date section end */

			/* Ad listing section start */
			/* Get standoutType to determine whether it's an ad listing */
			let listingStandout = listing.getElementsByClassName('product-card js-standout-listing')[0];

			/* If we didn't find one, the class names might have changed. Try querySelector instead */
			if (!listingStandout) {
				/* The testid value used can be one of many options, need to check for them all */
				listingStandout = listing.querySelector('[data-testid="PROMOTED_LISTING"]')
					?? listing.querySelector('[data-testid="YOU_MAY_ALSO_LIKE"]')
					?? listing.querySelector('[data-testid="FEATURED_LISTING"]')
					?? listing.querySelector('[data-testid="LEASING_LISTING"]');
			}

			/* If we found an ad flag, double check it's an ad listing */
			if(listingStandout) {
				let standoutType = listingStandout.dataset.standoutType;

				if(!standoutType) {
					standoutType = listingStandout.dataset.testid;
				}

				/* If it's an ad listing and the user wants them hidden, flag it to be hidden */
				if (standoutType && searchHidePromoted === true) {
					toBeHidden = true;
				}
			}
			/* Ad listing section end */

			/* Hide dealer section start */
			/* Get the dealer element for this listing */
			let dealer = listing.getElementsByClassName('product-card-seller-info__name atc-type-picanto');

			/* If we didn't find one, the class names might have changed. Try querySelector instead */
			if (dealer.length == 0) {
				dealer = listing.querySelector('[data-testid="search-listing-seller"]');

				/* If we found one with that query, we actually want the children HTMLCollection */
				if (dealer != null) {
					dealer = dealer.children;
				}
			}

			/* If we found a dealer, process it */
			if (dealer) {
				/* Extract the dealer name */
				const dealerName = dealer.item(0).childNodes[0].textContent;

				/* Convert to upper case for easier comparison to blocked dealer, but leave dealerName untouched for display purposes */
				const dealerNameUpper = dealerName.toUpperCase();

				/* Iterate through each of the user's blocked dealers, checking to see if this dealer's name matches any */
				for (i = 0; i < searchBlockedDealersList.length; i++) {
					const blockedDealer = searchBlockedDealersList[i].replace(/,/g, '').replace(/;/g, '').trim();

					if (blockedDealer != '') {
						/* Checks are done using 'includes', so if 'a' were blocked, any dealer name containing 'a' would be blocked */
						if (dealerNameUpper.includes(blockedDealer.toUpperCase())) {
							/* If the dealer name has been blocked by the user settings, flag to hide */
							toBeHidden = true;
						}
					}
				}

				/* If this is a dealer (not private) and we haven't already processed this listing, add a block dealer button */
				if (dealerNameUpper != 'PRIVATE SELLER' && !alreadyProcessed) {
					/* Clone the first element so we can use it for our button */
					const dealerBlockButton = dealer.item(0).cloneNode();

					/* Clear the HTML and update it to be a button */
					dealerBlockButton.innerHTML = '<button id="hide-'
													+ advertId /* Give the button a unique ID, e.g. 'hide-123456', so we can add a click listener */
													+ '" style="white-space: normal; word-wrap: break-word; font-family: sans-serif; font-size: small; line-height: normal">' /* Style it so it doesn't stand out */
													+ '<img src="'
													+ browser.runtime.getURL('Images/icon-16.png') /* Add the AT Toolkit icon to signify this isn't a native feature */
													+ '" style="vertical-align:bottom"> Always hide '
													+ dealerName + '</button>'; /* Add dealer name so the user knows what dealer they're blocking */

					/* Append the new button (should be after the dealer name and 'see all' link but before star rating) */
					dealer.item(0).append(dealerBlockButton);

					/* Add a click listener for the button so it runs the blockDealer function when clicked */
					dealerBlockButton.addEventListener('click', () => blockDealer(dealerNameUpper));
				}
			}
			/* Hide dealer section start */

			/* If appropriate, hide the listing and increment the count */
			if (toBeHidden) {
				listing.style.display = 'none';
				hiddenListingsCount = hiddenListingsCount + 1;
			}
		}

		/* Check whether we've already processed the page and added the all listings hidden warning */
		const existingAllListingsHidden = document.getElementById('at-toolkit-all-listings-hidden');

		/* Add a red warning if the hidden count matches the total count and we've not already added the warning */
		if (hiddenListingsCount == listingsTotalCount && listingsTotalCount > 0 && !existingAllListingsHidden) {
			/* Create a header element */
			const allListingshidden = document.createElement('h2');

			/* Set its ID so we can check and prevent reprocessing if the code runs again */
			allListingshidden.id = 'at-toolkit-all-listings-hidden';

			/* Add some styling so it looks tidy */
			allListingshidden.style.color = 'red';
			allListingshidden.style.textAlign = 'center';

			/* Update the innerText to inform the user that it's normal for there to be no listings, given that they've blocked them all */
			allListingshidden.innerText = 'All listings were hidden by your AT Toolkit settings.';

			/* Get the element for the body of search results */
			let searchResults = content.getElementsByClassName('search-page__results')[0];

			/* If we can't find it, the class names might have changed. Try querySelector instead */
			if (!searchResults) {
				searchResults = content.querySelector('[data-testid="desktop-search"]');
			}

			/* Prepend the warning to the search results so it's in the page body, where the user would expect to see listings */
			searchResults.prepend(allListingshidden);
		}
		/* -------------------- Search results section end -------------------- */
	}
}

/* Small function to add a blocked dealer name to the user's blocked dealer settings */
function blockDealer(dealerNameUpper) {
	/* Take the input name and remove any double quotes (there shouldn't be any anyway with the button method) */
	const dealerName = dealerNameUpper.replace(/"/g, '');
	
	/* If we actually have a dealer name, process it */
	if (dealerName != '') {
		/* If the dealer name is not already in the user's block list (somehow), process it */
		if (!searchBlockedDealersList.includes(dealerName)) {
			/* Add the dealer name to the array */
			searchBlockedDealersList.push(dealerName);

			/* Save the updated array to storage */
			browser.storage.sync.set({
				searchBlockedDealersList: searchBlockedDealersList
			})

			/* Rerun the whole code so the newly-blocked dealer is now hidden */
			getSettings();
		}
	}
}


/* NIALL */
function getAdvertDetails(advertId) {
	return fetch("https://www.autotrader.co.uk/at-graphql?opname=FPADataQuery", {
		"credentials": "include",
		"headers": {
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0",
			"Accept": "*/*",
			"Accept-Language": "en-GB,en;q=0.5",
			"content-type": "application/json",
			"x-sauron-app-name": "sauron-adverts-app",
			"Sec-Fetch-Dest": "empty",
			"Sec-Fetch-Mode": "cors",
			"Sec-Fetch-Site": "same-origin",
			"Priority": "u=4"
		},
		"referrer": "https://www.autotrader.co.uk/car-details/" + advertId,
		"body": "[{\"operationName\":\"FPADataQuery\",\"variables\":{\"advertId\":\"" + advertId + "\"},\"query\":\"query FPADataQuery($advertId: String!, $numberOfImages: Int, $searchOptions: SearchOptions, $postcode: String) {\\n  search {\\n    advert(advertId: $advertId, searchOptions: $searchOptions) {\\n      id\\n      stockItemId\\n      isAuction\\n      hoursUsed\\n      serviceHistory\\n      title\\n      excludePreviousOwners\\n      advertisedLocations\\n      dueAtSeller\\n      motExpiry\\n      motInsurance\\n      lastServiceOdometerReadingMiles\\n      lastServiceDate\\n      warrantyMonthsOnPurchase\\n      twelveMonthsMotIncluded\\n      heading {\\n        title\\n        subtitle\\n        __typename\\n      }\\n      attentionGrabber\\n      rrp\\n      price\\n      priceGBX\\n      priceExcludingFees\\n      priceExcludingFeesGBX\\n      suppliedPrice\\n      suppliedPriceGBX\\n      priceOnApplication\\n      plusVatIndicated\\n      vatStatus\\n      saving\\n      noAdminFees\\n      adminFee\\n      adminFeeInfoDescription\\n      dateOfRegistration\\n      homeDeliveryRegionCodes\\n      capabilities {\\n        marketExtensionHomeDelivery {\\n          enabled\\n          __typename\\n        }\\n        marketExtensionClickAndCollect {\\n          enabled\\n          __typename\\n        }\\n        marketExtensionCentrallyHeld {\\n          enabled\\n          __typename\\n        }\\n        marketExtensionOem {\\n          enabled\\n          __typename\\n        }\\n        digitalRetailing {\\n          enabled\\n          __typename\\n        }\\n        __typename\\n      }\\n      registration\\n      generation {\\n        generationId\\n        name\\n        review {\\n          expertReviewSummary {\\n            rating\\n            reviewUrl\\n            __typename\\n          }\\n          __typename\\n        }\\n        __typename\\n      }\\n      hasShowroomProductCode\\n      isPartExAvailable\\n      isFinanceAvailable\\n      isFinanceFullApplicationAvailable\\n      financeProvider\\n      financeDefaults {\\n        term\\n        mileage\\n        depositAmount\\n        __typename\\n      }\\n      hasFinanceInformation\\n      retailerId\\n      privateAdvertiser {\\n        contact {\\n          protectedNumber\\n          email\\n          __typename\\n        }\\n        location {\\n          town\\n          county\\n          postcode\\n          __typename\\n        }\\n        tola\\n        __typename\\n      }\\n      advertiserSegment\\n      dealer {\\n        dealerId\\n        description\\n        distance\\n        stockLevels {\\n          atStockCounts {\\n            car\\n            van\\n            __typename\\n          }\\n          __typename\\n        }\\n        assignedNumber {\\n          number\\n          __typename\\n        }\\n        awards {\\n          isWinner2018\\n          isWinner2019\\n          isWinner2020\\n          isWinner2021\\n          isWinner2022\\n          isWinner2023\\n          isFinalist2018\\n          isFinalist2019\\n          isFinalist2020\\n          isFinalist2021\\n          isFinalist2022\\n          isFinalist2023\\n          isHighlyRated2018\\n          isHighlyRated2019\\n          isHighlyRated2020\\n          isHighlyRated2021\\n          isHighlyRated2022\\n          isHighlyRated2023\\n          isHighlyRated2024\\n          __typename\\n        }\\n        branding {\\n          accreditations {\\n            name\\n            __typename\\n          }\\n          brands {\\n            name\\n            imageUrl\\n            __typename\\n          }\\n          __typename\\n        }\\n        capabilities {\\n          instantMessagingChat {\\n            enabled\\n            provider\\n            __typename\\n          }\\n          instantMessagingText {\\n            enabled\\n            provider\\n            overrideSmsNumber\\n            __typename\\n          }\\n          __typename\\n        }\\n        reviews {\\n          numberOfReviews\\n          overallReviewRating\\n          __typename\\n        }\\n        location {\\n          addressOne\\n          addressTwo\\n          town\\n          county\\n          postcode\\n          latLong\\n          __typename\\n        }\\n        marketing {\\n          profile\\n          brandingBanner {\\n            href\\n            __typename\\n          }\\n          __typename\\n        }\\n        media {\\n          email\\n          dealerWebsite {\\n            href\\n            __typename\\n          }\\n          phoneNumber1\\n          phoneNumber2\\n          protectedNumber\\n          __typename\\n        }\\n        name\\n        servicesOffered {\\n          sellerPromise {\\n            monthlyWarranty\\n            minMOTAndService\\n            daysMoneyBackGuarantee\\n            moneyBackRemoteOnly\\n            __typename\\n          }\\n          services\\n          products\\n          safeSelling {\\n            bulletPoints\\n            paragraphs\\n            __typename\\n          }\\n          videoWalkAround {\\n            bulletPoints\\n            paragraphs\\n            __typename\\n          }\\n          nccApproved\\n          isHomeDeliveryProductEnabled\\n          isPartExAvailable\\n          hasSafeSelling\\n          hasHomeDelivery\\n          hasVideoWalkAround\\n          additionalLinks {\\n            title\\n            href\\n            __typename\\n          }\\n          __typename\\n        }\\n        __typename\\n      }\\n      video {\\n        url\\n        preview\\n        __typename\\n      }\\n      spin {\\n        url\\n        preview\\n        __typename\\n      }\\n      imageList(limit: $numberOfImages) {\\n        nextCursor\\n        size\\n        images {\\n          url\\n          templated\\n          autotraderAllocated\\n          classificationTags {\\n            label\\n            category\\n            __typename\\n          }\\n          __typename\\n        }\\n        __typename\\n      }\\n      priceIndicatorRating\\n      priceIndicatorRatingLabel\\n      priceDeviation\\n      mileageDeviation\\n      mileage {\\n        mileage\\n        unit\\n        __typename\\n      }\\n      plate\\n      year\\n      vehicleCheckId\\n      vehicleCheckStatus\\n      vehicleCheckSummary {\\n        type\\n        title\\n        performed\\n        writeOffCategory\\n        checks {\\n          key\\n          failed\\n          advisory\\n          critical\\n          warning\\n          __typename\\n        }\\n        __typename\\n      }\\n      sellerName\\n      sellerType\\n      sellerProducts\\n      sellerLocation\\n      sellerLocationDistance {\\n        unit\\n        value\\n        __typename\\n      }\\n      sellerContact {\\n        phoneNumberOne\\n        phoneNumberTwo\\n        protectedNumber\\n        byEmail\\n        __typename\\n      }\\n      description\\n      colour\\n      manufacturerApproved\\n      insuranceWriteOffCategory\\n      owners\\n      keys\\n      vehicleCondition {\\n        tyreCondition\\n        interiorCondition\\n        bodyCondition\\n        __typename\\n      }\\n      specification {\\n        isCrossover\\n        operatingType\\n        emissionClass\\n        co2Emissions {\\n          co2Emission\\n          unit\\n          __typename\\n        }\\n        topSpeed {\\n          topSpeed\\n          __typename\\n        }\\n        minimumKerbWeight {\\n          weight\\n          unit\\n          __typename\\n        }\\n        endLayout\\n        trailerAxleNumber\\n        bedroomLayout\\n        grossVehicleWeight {\\n          weight\\n          unit\\n          __typename\\n        }\\n        capacityWeight {\\n          weight\\n          unit\\n          __typename\\n        }\\n        liftingCapacity {\\n          weight\\n          unit\\n          __typename\\n        }\\n        operatingWidth {\\n          width\\n          unit\\n          __typename\\n        }\\n        maxReach {\\n          length\\n          unit\\n          __typename\\n        }\\n        wheelbase\\n        berth\\n        bedrooms\\n        engine {\\n          power {\\n            enginePower\\n            unit\\n            __typename\\n          }\\n          sizeLitres\\n          sizeCC\\n          manufacturerEngineSize\\n          __typename\\n        }\\n        exteriorWidth {\\n          width\\n          unit\\n          __typename\\n        }\\n        exteriorLength {\\n          length\\n          unit\\n          __typename\\n        }\\n        exteriorHeight {\\n          height\\n          unit\\n          __typename\\n        }\\n        capacityWidth {\\n          width\\n          unit\\n          __typename\\n        }\\n        capacityLength {\\n          length\\n          unit\\n          __typename\\n        }\\n        capacityHeight {\\n          height\\n          unit\\n          __typename\\n        }\\n        seats\\n        axleConfig\\n        ulezCompliant\\n        doors\\n        bodyType\\n        cabType\\n        rawBodyType\\n        fuel\\n        transmission\\n        style\\n        subStyle\\n        make\\n        model\\n        trim\\n        optionalFeatures {\\n          description\\n          category\\n          __typename\\n        }\\n        standardFeatures {\\n          description\\n          category\\n          __typename\\n        }\\n        driverPosition\\n        battery {\\n          capacity {\\n            capacity\\n            unit\\n            __typename\\n          }\\n          usableCapacity {\\n            capacity\\n            unit\\n            __typename\\n          }\\n          range {\\n            range\\n            unit\\n            __typename\\n          }\\n          charging {\\n            quickChargeTime\\n            chargeTime\\n            __typename\\n          }\\n          __typename\\n        }\\n        techData {\\n          co2Emissions\\n          fuelConsumptionCombined\\n          fuelConsumptionExtraUrban\\n          fuelConsumptionUrban\\n          insuranceGroup\\n          minimumKerbWeight\\n          zeroToSixtyMph\\n          zeroToSixtyTwoMph\\n          cylinders\\n          valves\\n          enginePower\\n          topSpeed\\n          engineTorque\\n          vehicleHeight\\n          vehicleLength\\n          vehicleWidth\\n          wheelbase\\n          fuelTankCapacity\\n          grossVehicleWeight\\n          luggageCapacitySeatsDown\\n          bootspaceSeatsUp\\n          minimumKerbWeight\\n          vehicleWidthInclMirrors\\n          maxLoadingWeight\\n          standardFeatures {\\n            description\\n            category\\n            __typename\\n          }\\n          chargingData {\\n            fastestChargingPower\\n            fastestChargingDuration\\n            chargers {\\n              description\\n              fullCharge {\\n                duration\\n                endBatteryPercentage\\n                __typename\\n              }\\n              topUp {\\n                milesRange\\n                duration\\n                __typename\\n              }\\n              chargerLocation\\n              milesRangePerHourChargeTime\\n              __typename\\n            }\\n            __typename\\n          }\\n          __typename\\n        }\\n        annualTax {\\n          standardRate\\n          __typename\\n        }\\n        oemDrivetrain\\n        bikeLicenceType\\n        derivativeId\\n        frameSizeCM\\n        frameMaterial\\n        frameStyle\\n        suspensionType\\n        gearShifter\\n        brakeType\\n        motorMake\\n        chargeTimeMinutes\\n        numberOfGears\\n        tyreDiameterInches\\n        driveTrain\\n        torque {\\n          torque\\n          unit\\n          __typename\\n        }\\n        range {\\n          totalRange\\n          unit\\n          __typename\\n        }\\n        __typename\\n      }\\n      stockType\\n      condition\\n      finance {\\n        monthlyPayment\\n        representativeApr\\n        __typename\\n      }\\n      locationArea(postcode: $postcode) {\\n        code\\n        region\\n        areaOfInterest {\\n          postCode\\n          manufacturerCodes\\n          __typename\\n        }\\n        __typename\\n      }\\n      reservation {\\n        status\\n        eligibility\\n        feeCurrency\\n        feeInFractionalUnits\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\"}]",
		"method": "POST",
		"mode": "cors"
	})
	.then((response) => response.json())
	.then((data) => {return data[0].data.search.advert;});
}