'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.unzipFile = undefined;

var _jszip = require('jszip');

var _jszip2 = _interopRequireDefault(_jszip);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_jszip2.default.prototype.exists = function exists(filename) {
  return this.file(filename) != null;
};

/* eslint-disable new-cap */

_jszip2.default.prototype.getText = function getText(filename) {
  return this.file(filename).async('text');
};
_jszip2.default.prototype.setText = function setText(filename, data) {
  this.file(filename, data);
};
_jszip2.default.prototype.setBin = function setBin(filename, data) {
  this.file(filename, data, { base64: true });
};
_jszip2.default.prototype.toFile = function toFile(level) {
  // if level is 0 or undefined, then only set type.  
  // else level is set to level
  var opts = level ? {
    type: 'uint8array',
    compression: "DEFLATE",
    compressionOptions: { level: level }
  } : { type: 'uint8array' };
  return this.generateAsync(opts);
};

var unzipFile = function unzipFile(inputFile) {
  return _jszip2.default.loadAsync(inputFile);
};

// ==========================================
// Public API
// ==========================================
exports.unzipFile = unzipFile;