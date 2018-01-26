'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.runUserJsAndGetRaw = exports.runUserJsAndGetString = undefined;

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _vm = require('vm');

var _vm2 = _interopRequireDefault(_vm);

var _timm = require('timm');

var _reportUtils = require('./reportUtils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DEBUG = process.env.DEBUG_DOCX_TEMPLATES;

/* eslint-disable no-param-reassign */

var log = DEBUG ? require('./debug').mainStory : null;

var runUserJsAndGetString = function runUserJsAndGetString(data, code, ctx) {
  var result = runUserJsAndGetRaw(data, code, ctx);
  if (result == null) return '';
  var str = String(result);
  if (ctx.options.processLineBreaks) {
    var literalXmlDelimiter = ctx.options.literalXmlDelimiter;

    str = str.replace(/\n/g, literalXmlDelimiter + '<w:br/>' + literalXmlDelimiter);
  }
  return str;
};

var runUserJsAndGetRaw = function runUserJsAndGetRaw(data, code, ctx) {
  var sandbox = (0, _timm.merge)(ctx.jsSandbox || {}, {
    __code__: code,
    __result__: undefined
  }, data);
  var curLoop = (0, _reportUtils.getCurLoop)(ctx);
  if (curLoop) sandbox.$idx = curLoop.idx;
  (0, _keys2.default)(ctx.vars).forEach(function (varName) {
    sandbox['$' + varName] = ctx.vars[varName];
  });
  var context = void 0;
  var result = void 0;
  if (ctx.options.noSandbox) {
    context = sandbox;
    var wrapper = new Function('with(this) { return eval(__code__); }'); // eslint-disable-line no-new-func
    result = wrapper.call(context);
  } else {
    var script = new _vm2.default.Script('\n      __result__ = eval(__code__);\n      ', {});
    context = new _vm2.default.createContext(sandbox); // eslint-disable-line new-cap
    script.runInContext(context);
    // $FlowFixMe: this attribute is set in the inside code, not known by Flow
    result = context.__result__;
  }
  ctx.jsSandbox = (0, _timm.omit)(context, ['__code__', '__result__']);
  DEBUG && log.debug('JS result', { attach: result });
  return result;
};

// ==========================================
// Public API
// ==========================================
exports.runUserJsAndGetString = runUserJsAndGetString;
exports.runUserJsAndGetRaw = runUserJsAndGetRaw;