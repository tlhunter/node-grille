# API

grille.load(function(err, data, version) {
});

grille.update(function(err, data, version) {
});

grille.loadVersion(version, function(err, data, version) {
});

var data = grille.get(collection, item);

var version = grille.getCurrentVersion();
