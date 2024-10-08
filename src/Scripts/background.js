console.log("background.js - Running");

let pattern = "https://www.autotrader.co.uk/at-gateway?opname=SearchResultsListingsQuery*";

let interceptedHTTPBody = null;
let interceptedHTTPUrl = null;
let interceptedHTTPHeaders = {};

// Listener for capturing request body
const onBeforeRequestListener = function(details) {
	console.log("Intercepted: ${details.url}");
	console.log(details);
	
	interceptedHTTPUrl = details.url;
  
	if (details.method === "POST" && details.requestBody) {
	  const requestBody = details.requestBody;

	  if (requestBody.formData) {
		console.log("Form data:", requestBody.formData);
	  } else if (requestBody.raw) {
	    interceptedHTTPBody = String.fromCharCode.apply(null,
	    new Uint8Array(details.requestBody.raw[0].bytes));
		
		const raw = requestBody.raw[0]?.bytes;
		if (raw) {
		  const decodedString = new TextDecoder("utf-8").decode(raw);
		  console.log("Raw data:", decodedString);
		}
	  }
	}
}

// Listener for capturing request headers
const onBeforeSendHeadersListener = function(details) {
	console.log("Intercepted: ${details.url}");
	console.log(details);
	
	console.log(details.requestHeaders);
	
	// Convert headers to object format
    interceptedHTTPHeaders = details.requestHeaders.reduce((headers, header) => {
      headers[header.name] = header.value;
      return headers;
    }, {});
	
	replayRequest(5);
}

function addListeners() {
	browser.webRequest.onBeforeRequest.addListener(
		onBeforeRequestListener,
		{ urls: [pattern] },
		['requestBody'],
	);
	
	browser.webRequest.onBeforeSendHeaders.addListener(
		onBeforeSendHeadersListener,
		{ urls: [pattern] },
		['requestHeaders'],
	);
}

function removeListeners() {
	browser.webRequest.onBeforeRequest.removeListener(onBeforeRequestListener);
	browser.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeadersListener);
}


// Make a request using fetch
function replayRequest(pageId) {
  // Remove listeners before sending the request
  removeListeners();
  
  amendedBody = interceptedHTTPBody.replace(/page":.*?(?=,)/i, 'page":'+pageId);
  console.log("amendedBody:");
  console.log(amendedBody);
  
  console.log("Starting fetch...");
  fetch(interceptedHTTPUrl, {
    method: 'POST', // Modify based on your captured request
    headers: interceptedHTTPHeaders, // Use the captured headers
    body: amendedBody // Use the captured body
  }).then(response => {
    console.log("Request sent successfully");
	console.log(response);
  }).catch(error => {
    console.error("Error sending request:", error);
  }).finally(() => {
	// Re-add listeners after the request is completed
    addListeners();
    interceptedHTTPBody = null;
    interceptedHTTPUrl = null;
    interceptedHTTPHeaders = {};
  });
}

// Initialise by adding listeners
//addListeners(); // TODO - TEMPORARILY DISABLED