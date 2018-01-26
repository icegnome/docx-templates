'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _timm = require('timm');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var createReportBuff = require('./mainBrowser').default;

/* eslint-disable no-param-reassign, no-console */

var DEBUG = process.env.DEBUG_DOCX_TEMPLATES;
var log = DEBUG ? require('./debug').mainStory : null;

// ==========================================
// Main
// ==========================================
var getDefaultOutput = function getDefaultOutput(templatePath) {
  var _path$parse = _path2.default.parse(templatePath),
      dir = _path$parse.dir,
      name = _path$parse.name,
      ext = _path$parse.ext;

  return _path2.default.join(dir, name + '_report' + ext);
};

var createReport = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options) {
    var template, replaceImages, _probe, output, buffer, newOptions, b64ReplaceImages, imageNames, i, imageName, imageSrc, imgBuff, report;

    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            template = options.template, replaceImages = options.replaceImages, _probe = options._probe;
            output = options.output || getDefaultOutput(template);

            DEBUG && log.debug('Output file: ' + output);

            // ---------------------------------------------------------
            // Load template from filesystem
            // ---------------------------------------------------------
            DEBUG && log.debug('Reading template from disk at ' + template + '...');
            _context.next = 6;
            return _fsExtra2.default.readFile(template);

          case 6:
            buffer = _context.sent;
            newOptions = (0, _timm.set)(options, 'template', buffer);

            // ---------------------------------------------------------
            // Images provided as path are converted to base64
            // ---------------------------------------------------------

            if (!replaceImages) {
              _context.next = 27;
              break;
            }

            if (options.replaceImagesBase64) {
              _context.next = 27;
              break;
            }

            DEBUG && log.debug('Converting images to base64...');
            b64ReplaceImages = {};
            imageNames = (0, _keys2.default)(replaceImages);
            i = 0;

          case 14:
            if (!(i < imageNames.length)) {
              _context.next = 25;
              break;
            }

            imageName = imageNames[i];
            imageSrc = replaceImages[imageName];

            DEBUG && log.debug('Reading ' + imageSrc + ' from disk...');
            _context.next = 20;
            return _fsExtra2.default.readFile(imageSrc);

          case 20:
            imgBuff = _context.sent;

            b64ReplaceImages[imageName] = imgBuff.toString('base64');

          case 22:
            i++;
            _context.next = 14;
            break;

          case 25:
            newOptions.replaceImagesBase64 = true;
            newOptions.replaceImages = b64ReplaceImages;

          case 27:
            _context.next = 29;
            return createReportBuff(newOptions);

          case 29:
            report = _context.sent;

            if (!(_probe === 'JS' || _probe === 'XML')) {
              _context.next = 32;
              break;
            }

            return _context.abrupt('return', report);

          case 32:

            // ---------------------------------------------------------
            // Write the result on filesystem
            // ---------------------------------------------------------
            DEBUG && log.debug('Writing report to disk...');
            _context.next = 35;
            return _fsExtra2.default.ensureDir(_path2.default.dirname(output));

          case 35:
            _context.next = 37;
            return _fsExtra2.default.writeFile(output, report);

          case 37:
            return _context.abrupt('return', null);

          case 38:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function createReport(_x) {
    return _ref.apply(this, arguments);
  };
}();

// ==========================================
// Public API
// ==========================================
exports.default = createReport;