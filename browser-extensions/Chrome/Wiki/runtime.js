
// ignore the inner frames
if (window.top === window) {

var undef;

// adds few helper methods to a string
(function enhanceString() {
    var sp = String.prototype;
    if (!sp.isWhitespace) {
        sp.isWhitespace = function() {
            if (!this) { return true; }
            return (!this.replace(/\s+/gi, ""));
        };
    };
    if (!sp.isEmpty) {
        sp.isEmpty = function() {
            return (!this.length);
        };
    };
    if (!sp.ltrim) {
        sp.ltrim = function() {
            return this.replace(/^\s+/gi, "");
        };
    };
    if (!sp.rtrim) {
        sp.rtrim = function() {
            return this.replace(/\s+$/gi, "");
        };
    };
    if (!sp.trim) {
        sp.trim = function() {
            return this.ltrim().rtrim();
        };
    };
    if (!sp.startsWith) {
        sp.startsWith = function(arg, caseSensitive) {
            if (!arg) return false;
            arg = arg.toString();
            if (arg.length <= this.length) {
                var s = this;
                if (!caseSensitive) { arg = arg.toLowerCase(); s = s.toLowerCase(); }
                return (s.substr(0, arg.length) == arg);
            }
            else {
                return false;
            };
        };
    };
    if (!sp.endsWith) {
        sp.endsWith = function(arg, caseSensitive) {
            if (!arg) return false;
            arg = arg.toString();
            if (arg.length <= this.length) {
                var s = this;
                if (!caseSensitive) { arg = arg.toLowerCase(); s = s.toLowerCase(); }
                return (s.substr(s.length - arg.length) == arg);
            }
            else {
                return false;
            };
        };
    };
    if (!sp.paragraph) {
        sp.paragraph = function(index, sizeLimit) {
            if ((!index) || isNaN(index)) { index = 1; }
            if (!sizeLimit || isNaN(sizeLimit)) { sizeLimit = -1; }
            var m = this.match(new RegExp("^(?:\\s{0,}([^\\n]{1,})\\n){" + index + "," + index + "}"));
            if (m = ((m.length > 1) ? m[m.length - 1] : undef)) {
                if ((sizeLimit > 0) && (sizeLimit < m.length)) { m = m.substr(0, sizeLimit) + "..."; };
            };
            return m;
        };
    };
    if (!sp.Split) { // VB style split
        sp.Split = function(substr, limit) {
            if (!limit) { return this.split(substr); }
            if (isNaN(limit) || (limit < 1)) { throw "Numerical positive limit expected."; }
            var r = [], s = this, i;
            while (true) {
                if ((r.length + 1 < limit) && ((i = s.indexOf(substr)) > -1)) {
                    r[r.length] = (i) ? s.substr(0, i) : "";
                    s = s.substr(i + 1);
                }
                else {
                    r[r.length] = s;
                    break;
                }
            }
            return r;
        }
    }
})();

// object serialization
(function defineDumpObject() {
    if (typeof (dumpObject) == "undefined") {
        var trimData = function(d, l) {
            if ((!l) || isNaN(l) || l < 4) { return d; }
            return (d && d.length > l) ? (d.substr(0, l - 3) + "...") : d; }
        window.dumpObject = function(o, deep, limit) {
            var retVal = "";
            for (var p in o) {
                retVal += p; retVal += ": ";
                retVal += (deep && (typeof (o[p]) == "object")) ? dumpObject(o[p], deep, limit) : trimData(o[p],limit);
                retVal += "\r\n";
            }
            return retVal;
        };
    }
})();

(function addDebug() {
    if (!window["debug"]) {
        window["debug"] = {
            level: 1, // 0 - no output, 1 - errors, 2 - warnings, 4 - info, flag combinations
            print: function(t) {
                if (!this.level) { return; }
                t = (t) ? t.toString() : "";
                var e = t.startsWith("ERROR:", true);
                var w = t.startsWith("WARNING:", true);
                var i = ((!e) && (!w));
                if (i && (this.level & 4)) { console.log(t); }
                if (w && (this.level & 2)) { console.log(t); }
                if (e && (this.level & 1)) { console.log(t); }
            }
        };
    }
})();

// TODO: set to 1 or zero before releasing
debug.level = 1;

};
