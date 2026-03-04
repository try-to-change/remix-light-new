'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.error = exports.warn = exports.dir = exports.info = exports.log = void 0;
const tslib_1 = require("tslib");
const ansi_gray_1 = (0, tslib_1.__importDefault)(require("ansi-gray"));
const time_stamp_1 = (0, tslib_1.__importDefault)(require("time-stamp"));
const color_support_1 = (0, tslib_1.__importDefault)(require("color-support"));
function hasFlag(flag) {
    return ((typeof (process) !== 'undefined') && (process.argv.indexOf('--' + flag) !== -1));
}
function addColor(str) {
    if (hasFlag('no-color')) {
        return str;
    }
    if (hasFlag('color')) {
        return (0, ansi_gray_1.default)(str);
    }
    if ((0, color_support_1.default)()) {
        return (0, ansi_gray_1.default)(str);
    }
    return str;
}
function stdout(arg) {
    if (typeof (process) === 'undefined' || !process.stdout)
        return;
    process.stdout.write(arg);
}
function stderr(arg) {
    if (typeof (process) === 'undefined' || process.stderr)
        return;
    process.stderr.write(arg);
}
function getTimestamp() {
    const coloredTimestamp = addColor((0, time_stamp_1.default)('HH:mm:ss'));
    return '[' + coloredTimestamp + ']';
}
function log(...args) {
    const time = getTimestamp();
    stdout(time + ' ');
    console.log(args);
}
exports.log = log;
function info(...args) {
    const time = getTimestamp();
    stdout(time + ' ');
    console.info(args);
}
exports.info = info;
function dir(...args) {
    const time = getTimestamp();
    stdout(time + ' ');
    console.dir(args);
}
exports.dir = dir;
function warn(...args) {
    const time = getTimestamp();
    stderr(time + ' ');
    console.warn(args);
}
exports.warn = warn;
function error(...args) {
    const time = getTimestamp();
    stderr(time + ' ');
    console.error(args);
}
exports.error = error;
//# sourceMappingURL=logs.js.map