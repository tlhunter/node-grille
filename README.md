# Grille: Google Spreadsheet CMS

![Grille Spreadsheet Screenshot](http://static.zyu.me/projects/grille/screenshot.png)

Grille is a simple yet powerful tool for extracting data from Google Spreadsheets and transforming it into an easily consumable form.

Grille provides an extensible mechanism for storing and retrieving old versions of data.


## Purpose

Retrieve application data from Google Spreadsheets and store in memory.
It's sort of like a Content Management System, but if you're storing HTML or WYSIWYG content you're probably using the wrong tool.
Instead, use this for storing data which needs to be easily configured, e.g. part catalogs or application tuning data.

This does not allow for persisting data back into Google Spreadsheets.

Since data is stored in-memory, lookups are fast and don't require callbacks. I/O is only needed when building a new content version.


## Example Code

```javascript
var Grille = require('grille');
require('redis'); // Defaults to storing data in Redis, can be overridden

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

At a minimum your spreadsheet needs a meta worksheet.

The spreadhseet above will generate the following data structure:


### Example Meta Worksheet

The `meta` worksheet tells Grille how to parse your content.
It is loaded prior to all other sheets being loaded.

The `id` column correlates to the worksheet (tab) name to be loaded (if it's not listed it's not loaded).

The `collection` column tells Grille which top-level attribute the data for that worksheet should be stored at. Note that you can use `.` for specifying deeper nested objects.

The `format` column tells Grille which method to use when converting the raw worksheet into a native object.

As a convention, all worksheets specify data types as the second row. I suggest using Data Validation (like in the example worksheet).

id                  | collection    | format
--------------------|---------------|---------
string              | string        | string
people              | people        | hash
keyvalue\_string    | keyvalue      | keyvalue
keyvalue\_integer   | keyvalue      | keyvalue
level\_1            | levels.0      | array
level\_2            | levels.1      | array
level\_secret       | levels.secret | array


### Example Hash Worksheet

This will likely be the most common format you use.
Data is loaded into an object where each key is the value in the `id` column.
The `id` column should be a number or a string and each row should have a unique value.


id      | name              | likesgum  | gender
--------|-------------------|-----------|------
integer | string            | boolean   | string
1       | Rupert Styx       | FALSE     | m
2       | Morticia Addams   | TRUE      | f

#### Hash Output

```json
{
    "people": {
        "1": {
            "gender": "m",
            "id": 2,
            "likesgum": false,
            "name": "Rupert Styx"
        },
        "2": {
            "gender": "f",
            "id": 2,
            "likesgum": true,
            "name": "Morticia Addams"
        }
    }
}
```


### Example KeyValue Worksheet

KeyValue worksheets provide a simple collection for looking up data.

Since each worksheet can only contain a single data type, I recommend using multiple sheets for different types and merging them together.
Simply set the resulting `meta` collections for multiple sheets to be the same (see above) and they will be merged together as expected.

id          | value
------------|-----------------
string      | string
title       | Simple CMS Demo
author      | Thomas Hunter II

#### KeyValue Output

```json
{
    "keyvalue": {
        "author": "Thomas Hunter II",
        "title": "Simple CMS Demo"
    }
}
```


### Example Array Worksheet

Array worksheets are great for building 2D arrays of data.
A current eyesore is that each column needs to be name `col-*`.

id      | col-1     | col-2     | col-3     | col-4
--------|-----------|-----------|-----------|-------
integer | string    | string    | string    | string
1       | A         | B         | C         | D
2       | E         | F         | G         | H
3       | I         | J         | K         | L
4       | M         | N         | O         | P
5       | Q         | R         | S         | T
6       | U         | V         | W         | X

#### Array Output

```json
{
    "level": [
    [ "A", "B", "C", "D" ],
    [ "E", "F", "G", "H" ],
    [ "I", "J", "K", "L" ],
    [ "M", "N", "O", "P" ],
    [ "Q", "R", "S", "T" ],
    [ "U", "V", "W", "X" ]
  ]
}
```


### Example Complete Output

This is the complete output from the example spreadsheet:

```json
{
    "keyvalue": {
        "author": "Thomas Hunter II",
        "hours_in_day": 24,
        "seconds_in_minute": 60,
        "title": "Simple CMS Demo"
    },
    "levels": {
      "0": [
        [ "A", "B", "C", "D" ],
        [ "E", "F", "G", "H" ],
        [ "I", "J", "K", "L" ],
        [ "M", "N", "O", "P" ],
        [ "Q", "R", "S", "T" ],
        [ "U", "V", "W", "X" ]
      ],
      "1": [
        [ "A", "B", "C", "D" ],
        [ "E", "F", "G", "H" ],
        [ "I", "J", "K", "L" ],
        [ "M", "N", "O", "P" ],
        [ "Q", "R", "S", "T" ],
        [ "U", "V", "W", "X" ]
      ],
      "secret": [
        [ "A", "B", "C", "D" ],
        [ "E", "F", "G", "H" ],
        [ "I", "J", "K", "L" ],
        [ "M", "N", "O", "P" ],
        [ "Q", "R", "S", "T" ],
        [ "U", "V", "W", "X" ]
      ]
    },
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

## Data Types

Grille supports the following list of data types:

Name            | Examples
----------------|----------------------
integer         | 1, -2, 99999
json            | [1, 2, 3], {"a": "b"}
string          | Banana
boolean         | TRUE/FALSE
float           | 1.2, 99.9, 2
array           | [1, true, "blah"]
array.integer   | [1, 2, 3]
array.string    | ["first", "second"]
array.boolean   | [true, false]
array.float     | [1, 1.1, 1.2]

I recommend using data validation on the second row of a worksheet to enforce these (see example spreadsheet).

## Storage

If you'd like to configure how data is stored, see the example [RedisGrilleStorage](https://github.com/tlhunter/node-grille/blob/master/lib/storage/redis.js) object.


## Multiple Spreadsheets

Grille has support for multiple spreadsheets. Simply provide an array of Spreadsheet IDs instead of a single ID.

Each document should have its own meta tab, and the data from each sheet will be combined into the same object.

```javascript
var grille = new Grille([
  '1r2SaVhOH6exvevx_syqxCJFDARg-L4N1-uNL9SZAk04',
  '11_2RBdN37Q-LawzfFEJBlF3JfeDX5tC1Rp0QdAvAvoc'
]);
```


## Limitation's / Gotcha's

* Column names cannot have underscores (Google API Limitation)
* Can't have columns named `content`, `save`, `del`, `title`
* Loading data is slow and can timeout for larger spreadsheets


## Classes

* Worksheet: Represents a single tab in a Google Spreadsheet
* Spreadsheet: Represents a Google Spreadsheet
* Grille: Persists and loads data related to a Spreadsheet
* RedisGrilleStorage: Example storage engine
