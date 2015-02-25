# Simple Google Spreadsheet CMS

## Purpose

Retrieve application data from Google Spreadsheets and store in memory.

This does not allow for persisting data in Google Spreadsheets.

## Usage

```javascript
var Registry = require('cms'); // TODO: Set name here
var datastore = {};

var content = new Registry('1r2SaVhOH6exvevx_syqxCJFDARg-L4N1-uNL9SZAk04');

content.load(function(err, data) {
	datastore = data;

	// run application
});

## Spreadsheet Configuration

Follow along with the [https://docs.google.com/spreadsheets/d/1r2SaVhOH6exvevx_syqxCJFDARg-L4N1-uNL9SZAk04](Demo Spreadsheet)

At a minimum your spreadsheet needs a meta tab.
