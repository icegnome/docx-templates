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

var _zip = require('./zip');

var _xml = require('./xml');

var _preprocessTemplate = require('./preprocessTemplate');

var _preprocessTemplate2 = _interopRequireDefault(_preprocessTemplate);

var _processTemplate = require('./processTemplate');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable no-param-reassign, no-console */

var DEBUG = process.env.DEBUG_DOCX_TEMPLATES;
var DEFAULT_CMD_DELIMITER = '+++';
var DEFAULT_LITERAL_XML_DELIMITER = '||';

var log = DEBUG ? require('./debug').mainStory : null;

// ==========================================
// Main
// ==========================================
var createReport = function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(options) {
        var template, data, queryVars, replaceImages, _probe, templatePath, literalXmlDelimiter, createOptions, xmlOptions, zip, templateXml, tic, parseResult, jsTemplate, tac, queryResult, query, finalTemplate, report, reportXml, mediaPath, imageNames, i, imageName, imageDst, imageSrc, files, _i, filePath, raw, js0, js, report2, xml, output;

        return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        DEBUG && log.debug('Report options:', { attach: options });
                        template = options.template, data = options.data, queryVars = options.queryVars, replaceImages = options.replaceImages, _probe = options._probe;
                        templatePath = 'word';
                        literalXmlDelimiter = options.literalXmlDelimiter || DEFAULT_LITERAL_XML_DELIMITER;
                        createOptions = {
                            cmdDelimiter: options.cmdDelimiter || DEFAULT_CMD_DELIMITER,
                            literalXmlDelimiter: literalXmlDelimiter,
                            processLineBreaks: options.processLineBreaks != null ? options.processLineBreaks : true,
                            noSandbox: options.noSandbox || false
                        };
                        xmlOptions = { literalXmlDelimiter: literalXmlDelimiter };

                        // ---------------------------------------------------------
                        // Unzip
                        // ---------------------------------------------------------

                        DEBUG && log.debug('Unzipping...');
                        _context2.next = 9;
                        return (0, _zip.unzipFile)(template);

                    case 9:
                        zip = _context2.sent;


                        // ---------------------------------------------------------
                        // Read the 'document.xml' file (the template) and parse it
                        // ---------------------------------------------------------
                        DEBUG && log.debug('Reading template...');
                        _context2.next = 13;
                        return zip.getText(templatePath + '/document.xml');

                    case 13:
                        templateXml = _context2.sent;

                        DEBUG && log.debug('Template file length: ' + templateXml.length);
                        DEBUG && log.debug('Parsing XML...');
                        tic = new Date().getTime();
                        _context2.next = 19;
                        return (0, _xml.parseXml)(templateXml);

                    case 19:
                        parseResult = _context2.sent;
                        jsTemplate = parseResult;
                        tac = new Date().getTime();

                        DEBUG && log.debug('File parsed in ' + (tac - tic) + ' ms', {
                            attach: jsTemplate,
                            attachLevel: 'trace'
                        });

                        // ---------------------------------------------------------
                        // Fetch the data that will fill in the template
                        // ---------------------------------------------------------
                        queryResult = null;

                        if (!(typeof data === 'function')) {
                            _context2.next = 33;
                            break;
                        }

                        DEBUG && log.debug('Looking for the query in the template...');
                        query = (0, _processTemplate.extractQuery)(jsTemplate, createOptions);

                        DEBUG && log.debug('Query: ' + (query || 'no query found'));
                        _context2.next = 30;
                        return data(query, queryVars);

                    case 30:
                        queryResult = _context2.sent;
                        _context2.next = 34;
                        break;

                    case 33:
                        queryResult = data;

                    case 34:

                        // ---------------------------------------------------------
                        // Generate the report
                        // ---------------------------------------------------------
                        // DEBUG && log.debug('Before preprocessing...', {
                        //   attach: jsTemplate,
                        //   attachLevel: 'debug',
                        //   ignoreKeys: ['_parent', '_fTextNode', '_attrs'],
                        // });
                        finalTemplate = (0, _preprocessTemplate2.default)(jsTemplate, createOptions);

                        // if (queryResult.constructor === Array) {
                        //    // ---------------------------------
                        //    // Check if data is an array, use same template for speed.
                        // }

                        DEBUG && log.debug('Generating report...', {
                            attach: finalTemplate,
                            attachLevel: 'debug',
                            ignoreKeys: ['_parent', '_fTextNode', '_attrs']
                        });
                        report = (0, _processTemplate.produceJsReport)(queryResult, finalTemplate, createOptions);

                        if (!(_probe === 'JS')) {
                            _context2.next = 39;
                            break;
                        }

                        return _context2.abrupt('return', report);

                    case 39:

                        // ---------------------------------------------------------
                        // Build output XML and write it to disk
                        // ---------------------------------------------------------
                        // DEBUG && log.debug('Report', {
                        //   attach: report,
                        //   attachLevel: 'debug',
                        //   ignoreKeys: ['_parent', '_fTextNode', '_attrs'],
                        // });
                        DEBUG && log.debug('Converting report to XML...');
                        reportXml = (0, _xml.buildXml)(report, xmlOptions);

                        if (!(_probe === 'XML')) {
                            _context2.next = 43;
                            break;
                        }

                        return _context2.abrupt('return', reportXml);

                    case 43:
                        DEBUG && log.debug('Writing report...');
                        if (options.removeXmlWhitespace) {
                            reportXml = reportXml.replace(/\s+/g, ' ').trim();
                        }
                        zip.setText(templatePath + '/document.xml', reportXml);

                        // ---------------------------------------------------------
                        // Replace images
                        // ---------------------------------------------------------

                        if (!replaceImages) {
                            _context2.next = 68;
                            break;
                        }

                        DEBUG && log.debug('Replacing images...');

                        if (!options.replaceImagesBase64) {
                            _context2.next = 67;
                            break;
                        }

                        mediaPath = templatePath + '/media';
                        imageNames = (0, _keys2.default)(replaceImages);
                        i = 0;

                    case 52:
                        if (!(i < imageNames.length)) {
                            _context2.next = 65;
                            break;
                        }

                        imageName = imageNames[i];
                        imageDst = mediaPath + '/' + imageName;

                        if (zip.exists('' + imageDst)) {
                            _context2.next = 58;
                            break;
                        }

                        console.warn('Image ' + imageName + ' cannot be replaced: destination does not exist');
                        return _context2.abrupt('continue', 62);

                    case 58:
                        imageSrc = replaceImages[imageName];

                        DEBUG && log.debug('Replacing ' + imageName + ' with <base64 buffer>...');
                        _context2.next = 62;
                        return zip.setBin(imageDst, imageSrc);

                    case 62:
                        i++;
                        _context2.next = 52;
                        break;

                    case 65:
                        _context2.next = 68;
                        break;

                    case 67:
                        console.warn('Unsupported format (path): images can only be replaced in base64 mode');

                    case 68:

                        // ---------------------------------------------------------
                        // Process all other XML files
                        // ---------------------------------------------------------
                        files = [];

                        zip.forEach(function () {
                            var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(filePath) {
                                var regex;
                                return _regenerator2.default.wrap(function _callee$(_context) {
                                    while (1) {
                                        switch (_context.prev = _context.next) {
                                            case 0:
                                                regex = new RegExp(templatePath + '\\/[^\\/]+\\.xml');

                                                if (regex.test(filePath) && filePath !== templatePath + '/document.xml') {
                                                    files.push(filePath);
                                                }

                                            case 2:
                                            case 'end':
                                                return _context.stop();
                                        }
                                    }
                                }, _callee, undefined);
                            }));

                            return function (_x2) {
                                return _ref2.apply(this, arguments);
                            };
                        }());

                        _i = 0;

                    case 71:
                        if (!(_i < files.length)) {
                            _context2.next = 87;
                            break;
                        }

                        filePath = files[_i];

                        DEBUG && log.info('Processing ' + filePath + '...');
                        _context2.next = 76;
                        return zip.getText(filePath);

                    case 76:
                        raw = _context2.sent;
                        _context2.next = 79;
                        return (0, _xml.parseXml)(raw);

                    case 79:
                        js0 = _context2.sent;
                        js = (0, _preprocessTemplate2.default)(js0, createOptions);
                        report2 = (0, _processTemplate.produceJsReport)(queryResult, js, createOptions);
                        xml = (0, _xml.buildXml)(report2, xmlOptions);

                        zip.setText(filePath, xml);

                    case 84:
                        _i++;
                        _context2.next = 71;
                        break;

                    case 87:

                        // ---------------------------------------------------------
                        // Zip the results
                        // ---------------------------------------------------------
                        DEBUG && log.debug('Zipping...');
                        _context2.next = 90;
                        return zip.toFile(options.compressionLevel);

                    case 90:
                        output = _context2.sent;
                        return _context2.abrupt('return', output);

                    case 92:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, undefined);
    }));

    return function createReport(_x) {
        return _ref.apply(this, arguments);
    };
}();

// ==========================================
// Public API
// ==========================================
exports.default = createReport;