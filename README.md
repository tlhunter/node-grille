# Grille: Google Spreadsheet CMS

Why Grille? Well, they look like a grid... So does a Spreadsheet... eh.

## Purpose

Retrieve application data from Google Spreadsheets and store in memory.
It's sort of like a Content Management System, but if you're storing HTML or WYSIWYG content you're doing it wrong.
Instead, use this for storing data which needs to be easily configured, e.g. part catalogs or application tuning data.

This does not allow for persisting data in Google Spreadsheets.

## Usage

```javascript
var Grille = require('grille');

var grille = new Grille('1r2SaVhOH6exvevx_syqxCJFDARg-L4N1-uNL9SZAk04');

grille.load(function(err) {
    console.log(grille.get('keyvalue', 'author'));

	// run application
});

// Whenever you want to update Grille to use the lastest data
console.log('old version', grille.version);
grille.update(function(err) {
    console.log(grille.get('keyvalue', 'author'));
    console.log('new version', grille.version);
});
```

## Spreadsheet Configuration

Follow along with the [Demo Spreadsheet](https://docs.google.com/spreadsheets/d/1r2SaVhOH6exvevx_syqxCJFDARg-L4N1-uNL9SZAk04)

At a minimum your spreadsheet needs a meta tab.

The spreadhseet above will generate the following data:

```json
{
    "keyvalue": {
        "author": "Thomas Hunter II",
        "hours_in_day": 24,
        "seconds_in_minute": 60,
        "title": "Simple CMS Demo"
    },
    "levels.0": [
        [ "A", "B", "C", "D" ],
        [ "E", "F", "G", "H" ],
        [ "I", "J", "K", "L" ],
        [ "M", "N", "O", "P" ],
        [ "Q", "R", "S", "T" ],
        [ "U", "V", "W", "X" ]
    ],
    "levels.1": [
        [ "A", "B", "C", "D" ],
        [ "E", "F", "G", "H" ],
        [ "I", "J", "K", "L" ],
        [ "M", "N", "O", "P" ],
        [ "Q", "R", "S", "T" ],
        [ "U", "V", "W", "X" ]
    ],
    "levels.secret": [
        [ "A", "B", "C", "D" ],
        [ "E", "F", "G", "H" ],
        [ "I", "J", "K", "L" ],
        [ "M", "N", "O", "P" ],
        [ "Q", "R", "S", "T" ],
        [ "U", "V", "W", "X" ]
    ],
    "people": {
        "1": {
            "gender": "m",
            "id": 1,
            "likesgum": true,
            "name": "Thomas Hunter II"
        },
        "2": {
            "gender": "m",
            "id": 2,
            "likesgum": false,
            "name": "Rupert Styx"
        },
        "3": {
            "gender": "f",
            "id": 3,
            "likesgum": true,
            "name": "Morticia Addams"
        },
        "4": {
            "gender": "m",
            "id": 4,
            "likesgum": false,
            "name": "Lurch"
        }
    }
}
```

## Class Breakdown

* Worksheet: Represents a single tab in a Google Spreadsheet
* Spreadsheet: Represents a Google Spreadsheet
* Grille: Persists and loads data related to a Spreadsheet
