'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.produceJsReport = exports.extractQuery = undefined;

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _reportUtils = require('./reportUtils');

var _jsSandbox = require('./jsSandbox');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable no-param-reassign, no-constant-condition */

var DEBUG = process.env.DEBUG_DOCX_TEMPLATES;
var log = DEBUG ? require('./debug').mainStory : null;
var chalk = DEBUG ? require('./debug').chalk : null;

var gCntIf = 0;

// Go through the document until the query string is found (normally at the beginning)
var extractQuery = function extractQuery(template, options) {
  var ctx = {
    fCmd: false,
    cmd: '',
    fSeekQuery: true, // ensure no command will be processed, except QUERY
    query: null,
    loops: [],
    options: options
  };
  var nodeIn = template;
  while (true) {
    // Move down
    if (nodeIn._children.length) nodeIn = nodeIn._children[0];else {
      // Move sideways or up
      var fFound = false;
      while (nodeIn._parent != null) {
        var _parent = nodeIn._parent;
        var nextSibling = (0, _reportUtils.getNextSibling)(nodeIn);
        if (nextSibling) {
          nodeIn = nextSibling;
          fFound = true;
          break;
        }
        nodeIn = _parent;
      }
      if (!fFound) break;
    }

    if (!nodeIn) break;
    var parent = nodeIn._parent;
    if (nodeIn._fTextNode && parent && !parent._fTextNode && // Flow, don't complain
    parent._tag === 'w:t') {
      processText(null, nodeIn, ctx);
    }
    if (ctx.query != null) break;
  }
  return ctx.query;
};

var produceJsReport = function produceJsReport(data, template, options) {
  var out = (0, _reportUtils.cloneNodeWithoutChildren)(template);
  var ctx = {
    level: 1,
    fCmd: false,
    cmd: '',
    fSeekQuery: false,
    query: null,
    buffers: {
      'w:p': { text: '', cmds: '', fInsertedText: false },
      'w:tr': { text: '', cmds: '', fInsertedText: false }
    },
    vars: {},
    loops: [],
    fJump: false,
    shorthands: {},
    options: options
  };
  var nodeIn = template;
  var nodeOut = out;
  var move = void 0;
  var deltaJump = 0;

  while (true) {
    // eslint-disable-line no-constant-condition
    var curLoop = (0, _reportUtils.getCurLoop)(ctx);
    var nextSibling = void 0;

    // ---------------------------------------------
    // Move node pointer
    // ---------------------------------------------
    if (ctx.fJump) {
      if (!curLoop) throw new Error('INTERNAL_ERROR');
      var refNode = curLoop.refNode,
          refNodeLevel = curLoop.refNodeLevel;
      // DEBUG && log.debug(`Jumping to level ${refNodeLevel}...`,
      //   { attach: cloneNodeForLogging(refNode) });

      deltaJump = ctx.level - refNodeLevel;
      nodeIn = refNode;
      ctx.level = refNodeLevel;
      ctx.fJump = false;
      move = 'JUMP';

      // Down (only if he haven't just moved up)
    } else if (nodeIn._children.length && move !== 'UP') {
      nodeIn = nodeIn._children[0];
      ctx.level += 1;
      move = 'DOWN';

      // Sideways
    } else if (nextSibling = (0, _reportUtils.getNextSibling)(nodeIn)) {
      nodeIn = nextSibling;
      move = 'SIDE';

      // Up
    } else {
      var parent = nodeIn._parent;
      if (parent == null) break;
      nodeIn = parent;
      ctx.level -= 1;
      move = 'UP';
    }
    // DEBUG && log.debug(`Next node [${chalk.green.bold(move)}]`,
    //   { attach: cloneNodeForLogging(nodeIn) });

    // ---------------------------------------------
    // Process input node
    // ---------------------------------------------
    // Delete the last generated output node if the user inserted a paragraph
    // (or table row) with just a command, or if we're skipping nodes due to an empty FOR loop
    if (move !== 'DOWN') {
      var tag = nodeOut._fTextNode ? null : nodeOut._tag;
      var fRemoveNode = false;
      if ((tag === 'w:p' || tag === 'w:tbl' || tag === 'w:tr') && (0, _reportUtils.isLoopExploring)(ctx)) {
        fRemoveNode = true;
      } else if (tag === 'w:p' || tag === 'w:tr') {
        var buffers = ctx.buffers[tag];
        fRemoveNode = buffers.text === '' && buffers.cmds !== '' && !buffers.fInsertedText;
      }
      // Execute removal, if suitable; will no longer be accessible from the parent
      // (but the parent will be accessible from the child)
      if (fRemoveNode && nodeOut._parent != null) {
        nodeOut._parent._children.pop();
      }
    }

    if (move === 'UP') {
      // Loop exploring? Update the reference node for the current loop
      if ((0, _reportUtils.isLoopExploring)(ctx) && curLoop && // Flow, don't complain
      nodeIn === curLoop.refNode._parent) {
        curLoop.refNode = nodeIn;
        curLoop.refNodeLevel -= 1;
        // DEBUG && log.debug(`Updated loop '${curLoop.varName}' refNode:`,
        //   { attach: cloneNodeForLogging(nodeIn) });
      }
      var nodeOutParent = nodeOut._parent;
      if (nodeOutParent == null) throw new Error('INTERNAL_ERROR'); // Flow-prevention

      // `w:tc` nodes shouldn't be left with no `w:p` children
      if (!nodeOutParent._fTextNode && nodeOutParent._tag === 'w:tc' && !nodeOutParent._children.filter(function (o) {
        return !o._fTextNode && o._tag === 'w:p';
      }).length) {
        nodeOutParent._children.push({
          _parent: nodeOutParent,
          _children: [],
          _fTextNode: false,
          _tag: 'w:p',
          _attrs: {}
        });
      }
      nodeOut = nodeOutParent;
    }

    // Node creation: DOWN | SIDE
    // Note that nodes are copied to the new tree, but that doesn't mean they will be kept.
    // In some cases, they will be removed later on; for example, when a paragraph only
    // contained a command -- it will be deleted.
    if (move === 'DOWN' || move === 'SIDE') {
      if (move === 'SIDE') {
        if (nodeOut._parent == null) throw new Error('INTERNAL_ERROR'); // Flow-prevention
        nodeOut = nodeOut._parent;
      }
      var _tag = nodeIn._fTextNode ? null : nodeIn._tag;
      if (_tag === 'w:p' || _tag === 'w:tr') {
        ctx.buffers[_tag] = { text: '', cmds: '', fInsertedText: false };
      }
      var newNode = (0, _reportUtils.cloneNodeWithoutChildren)(nodeIn);
      newNode._parent = nodeOut;
      nodeOut._children.push(newNode);
      var _parent2 = nodeIn._parent;
      if (nodeIn._fTextNode && _parent2 && !_parent2._fTextNode && // Flow, don't complain
      _parent2._tag === 'w:t') {
        var newNodeAsTextNode = newNode;
        newNodeAsTextNode._text = processText(data, nodeIn, ctx);
      }
      nodeOut = newNode;
    }

    // Correct nodeOut when a jump in nodeIn has occurred
    if (move === 'JUMP') {
      while (deltaJump > 0) {
        if (nodeOut._parent == null) throw new Error('INTERNAL_ERROR'); // Flow-prevention
        nodeOut = nodeOut._parent;
        deltaJump -= 1;
      }
    }
  }

  return out;
};

var processText = function processText(data, node, ctx) {
  var cmdDelimiter = ctx.options.cmdDelimiter;

  var text = node._text;
  if (text == null || text === '') return '';
  var segments = text.split(cmdDelimiter);
  var outText = '';
  for (var idx = 0; idx < segments.length; idx++) {
    // Include the separators in the `buffers` field (used for deleting paragraphs if appropriate)
    if (idx > 0) appendTextToTagBuffers(cmdDelimiter, ctx, { fCmd: true });

    // Append segment either to the `ctx.cmd` buffer (to be executed), if we are in "command mode",
    // or to the output text
    var segment = segments[idx];
    // DEBUG && log.debug(`Token: '${segment}' (${ctx.fCmd})`);
    if (ctx.fCmd) ctx.cmd += segment;else if (!(0, _reportUtils.isLoopExploring)(ctx)) outText += segment;
    appendTextToTagBuffers(segment, ctx, { fCmd: ctx.fCmd });

    // If there are more segments, execute the command (if we are in "command mode"),
    // and toggle "command mode"
    if (idx < segments.length - 1) {
      if (ctx.fCmd) {
        var cmdResultText = processCmd(data, node, ctx);
        if (cmdResultText != null) {
          outText += cmdResultText;
          appendTextToTagBuffers(cmdResultText, ctx, {
            fCmd: false,
            fInsertedText: true
          });
        }
      }
      ctx.fCmd = !ctx.fCmd;
    }
  }
  return outText;
};

// ==========================================
// Command processor
// ==========================================
var processCmd = function processCmd(data, node, ctx) {
  var cmd = getCommand(ctx);
  DEBUG && log.debug('Processing cmd: ' + chalk.cyan.bold(cmd));
  try {
    // Extract command name
    var cmdNameMatch = /^(\S+)\s*/.exec(cmd);
    var cmdName = void 0;
    var cmdRest = '';
    if (cmdNameMatch != null) {
      cmdName = cmdNameMatch[1].toUpperCase();
      cmdRest = cmd.slice(cmdName.length).trim();
    }

    // Seeking query?
    if (ctx.fSeekQuery) {
      if (cmdName === 'QUERY') ctx.query = cmdRest;
      return null;
    }

    // Process command
    var out = void 0;
    if (cmdName === 'QUERY' || cmdName === 'CMD_NODE') {
      // DEBUG && log.debug(`Ignoring ${cmdName} command`);
      // ...
      // ALIAS name ANYTHING ELSE THAT MIGHT BE PART OF THE COMMAND...
    } else if (cmdName === 'ALIAS') {
      var aliasMatch = /^(\S+)\s+(.+)/.exec(cmdRest);
      if (!aliasMatch) throw new Error('Invalid ALIAS command: ' + cmd);
      var aliasName = aliasMatch[1];
      var fullCmd = aliasMatch[2];
      ctx.shorthands[aliasName] = fullCmd;
      DEBUG && log.debug('Defined alias \'' + aliasName + '\' for: ' + fullCmd);

      // VAR <varName> <expression>
      // } else if (cmdName === 'VAR') {
      //   if (!isLoopExploring(ctx)) {
      //     const varMatch = /^(\S+)\s+(.+)/.exec(cmdRest);
      //     if (!varMatch) throw new Error(`Invalid VAR command: ${cmd}`);
      //     const varName = varMatch[1];
      //     const code = varMatch[2];
      //     const varValue = runUserJsAndGetString(data, code, ctx);
      //     ctx.vars[varName] = varValue;
      //     // DEBUG && log.debug(`${varName} is now: ${JSON.stringify(varValue)}`);
      //   }

      // FOR <varName> IN <expression>
      // IF <expression>
    } else if (cmdName === 'FOR' || cmdName === 'IF') {
      out = processForIf(data, node, ctx, cmd, cmdName, cmdRest);

      // END-FOR
      // END-IF
    } else if (cmdName === 'END-FOR' || cmdName === 'END-IF') {
      out = processEndForIf(data, node, ctx, cmd, cmdName, cmdRest);

      // INS <expression>
    } else if (cmdName === 'INS') {
      if (!(0, _reportUtils.isLoopExploring)(ctx)) out = (0, _jsSandbox.runUserJsAndGetString)(data, cmdRest, ctx);

      // EXEC <code>
    } else if (cmdName === 'EXEC') {
      if (!(0, _reportUtils.isLoopExploring)(ctx)) (0, _jsSandbox.runUserJsAndGetRaw)(data, cmdRest, ctx);

      // Invalid command
    } else throw new Error('Invalid command syntax: \'' + cmd + '\'');
    return out;
  } catch (err) {
    throw new Error('Error executing command: ' + cmd + '\n' + err.message);
  }
};

var getCommand = function getCommand(ctx) {
  var cmd = ctx.cmd;

  if (cmd[0] === '*') {
    var aliasName = cmd.slice(1).trim();
    if (!ctx.shorthands[aliasName]) throw new Error('Unknown alias');
    cmd = ctx.shorthands[aliasName];
    DEBUG && log.debug('Alias for: ' + cmd);
  } else if (cmd[0] === '=') {
    cmd = 'INS ' + cmd.slice(1).trim();
  } else if (cmd[0] === '!') {
    cmd = 'EXEC ' + cmd.slice(1).trim();
  }
  ctx.cmd = '';
  return cmd.trim();
};

// ==========================================
// Individual commands
// ==========================================
var processForIf = function processForIf(data, node, ctx, cmd, cmdName, cmdRest) {
  var isIf = cmdName === 'IF';

  // Identify FOR/IF loop
  var forMatch = void 0;
  var varName = void 0;
  if (isIf) {
    if (node._ifName == null) {
      node._ifName = '__if_' + gCntIf;
      gCntIf += 1;
    }
    varName = node._ifName;
  } else {
    forMatch = /^(\S+)\s+IN\s+(.+)/i.exec(cmdRest);
    if (!forMatch) throw new Error('Invalid FOR command: ' + cmd);
    varName = forMatch[1];
  }

  // New FOR? If not, discard
  var curLoop = (0, _reportUtils.getCurLoop)(ctx);
  if (!(curLoop && curLoop.varName === varName)) {
    var parentLoopLevel = ctx.loops.length - 1;
    var fParentIsExploring = parentLoopLevel >= 0 && ctx.loops[parentLoopLevel].idx === -1;
    var loopOver = void 0;
    if (fParentIsExploring) {
      loopOver = [];
    } else if (isIf) {
      var shouldRun = !!(0, _jsSandbox.runUserJsAndGetRaw)(data, cmdRest, ctx);
      loopOver = shouldRun ? [1] : [];
    } else {
      if (!forMatch) throw new Error('Invalid FOR command: ' + cmd);
      loopOver = (0, _jsSandbox.runUserJsAndGetRaw)(data, forMatch[2], ctx);
    }
    ctx.loops.push({
      refNode: node,
      refNodeLevel: ctx.level,
      varName: varName,
      loopOver: loopOver,
      isIf: isIf,
      // run through the loop once first, without outputting anything
      // (if we don't do it like this, we could not run empty loops!)
      idx: -1
    });
  }
  (0, _reportUtils.logLoop)(ctx.loops);

  return null;
};

var processEndForIf = function processEndForIf(data, node, ctx, cmd, cmdName, cmdRest) {
  var curLoop = (0, _reportUtils.getCurLoop)(ctx);
  if (!curLoop) throw new Error('Invalid command: ' + cmd);
  var isIf = cmdName === 'END-IF';
  var varName = isIf ? curLoop.varName : cmdRest;
  if (curLoop.varName !== varName) throw new Error('Invalid command: ' + cmd);
  var loopOver = curLoop.loopOver,
      idx = curLoop.idx;

  var _getNextItem = getNextItem(loopOver, idx),
      nextItem = _getNextItem.nextItem,
      curIdx = _getNextItem.curIdx;

  if (nextItem) {
    // next iteration
    ctx.vars[varName] = nextItem;
    ctx.fJump = true;
    curLoop.idx = curIdx;
  } else {
    // loop finished
    ctx.loops.pop();
  }

  return null;
};

// ==========================================
// Helpers
// ==========================================
var appendTextToTagBuffers = function appendTextToTagBuffers(text, ctx, options) {
  if (ctx.fSeekQuery) return;
  var fCmd = options.fCmd,
      fInsertedText = options.fInsertedText;

  var type = fCmd ? 'cmds' : 'text';
  (0, _keys2.default)(ctx.buffers).forEach(function (key) {
    var buf = ctx.buffers[key];
    buf[type] += text;
    if (fInsertedText) buf.fInsertedText = true;
  });
};

var getNextItem = function getNextItem(items, curIdx0) {
  var nextItem = null;
  var curIdx = curIdx0 != null ? curIdx0 : -1;
  while (nextItem == null) {
    curIdx += 1;
    if (curIdx >= items.length) break;
    var tempItem = items[curIdx];
    if ((typeof tempItem === 'undefined' ? 'undefined' : (0, _typeof3.default)(tempItem)) === 'object' && tempItem.isDeleted) continue;
    nextItem = tempItem;
  }
  return { nextItem: nextItem, curIdx: curIdx };
};

// ==========================================
// Public API
// ==========================================
exports.extractQuery = extractQuery;
exports.produceJsReport = produceJsReport;