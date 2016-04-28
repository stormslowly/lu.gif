'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect('mongodb://127.0.0.1:27017/gif')

var GifSchema = new Schema({
  extId: {type: Number, required: true},
  title: {type: String, required: true},
  img: {type: String, required: true},
  site: {type: String, require: true}
});

GifSchema.index({site:1,extId:1}, {unique: true});

var Gif = mongoose.model('Gif', GifSchema);

module.exports = Gif;
