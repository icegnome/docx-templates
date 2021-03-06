// @flow

/* eslint-disable new-cap */

import JSZip from 'jszip';

JSZip.prototype.exists = function exists(filename: string) {
  return this.file(filename) != null;
};
JSZip.prototype.getText = function getText(filename: string) {
  return this.file(filename).async('text');
};
JSZip.prototype.setText = function setText(filename: string, data: string) {
  this.file(filename, data);
};
JSZip.prototype.setBin = function setBin(filename: string, data: string) {
  this.file(filename, data, { base64: true });
};
JSZip.prototype.toFile = function toFile(level) {
    // if level is 0 or undefined, then only set type.  
    // else level is set to level
    let opts = level ? {
        type: 'uint8array',
        compression: "DEFLATE",
        compressionOptions: { level: level }
    } : { type: 'uint8array' }
    return this.generateAsync(opts);
};

const unzipFile = function unzipFile(inputFile: ArrayBuffer) {
  return JSZip.loadAsync(inputFile);
};

// ==========================================
// Public API
// ==========================================
export { unzipFile };
