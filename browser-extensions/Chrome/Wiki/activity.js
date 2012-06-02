// ignore the inner frames
if (window.top === window) {

(function(){
    // NOTE: Decided to keep this script small, so no jquery
    var $__ = function(cls,idx) {
        var c
        if (!(cls&&(c=document.getElementsByClassName(cls))&&(c.length>0))) { 
            return; }
        if (idx >= 0) { idx = Math.min(idx, c.length-1); }
        return c[(idx<0)?(c.length-1):idx]; }
    var $$ = function(cls) { return $__(cls,-1); }
    var $_ = function(cls) { return $__(cls, 0); }
    var getSelection = function() {
        var el = document;
        var r = "", s = el.getSelection(), i, h;
        if ((s.type==="Range") && (s.rangeCount)) { 
            for(var i = 0; i < s.rangeCount; i++) {
                if ((s=s.getRangeAt(i))&&(s=s.cloneContents())&&(s=s.childNodes)) {
                    for( i = 0; i < s.length; i ++ ) {
                        if (r.length) { r+= "\r\n"; }
                        r += (h=s[i]["innerText"])?h:""; } } } }
        else {
            r = el.body["innerText"]; }
        return r;
    };

    var dblClick = function(e) {
        var v = document.createEvent("MouseEvents");
        v.initMouseEvent("dblclick", true, true, window,
            0, 0, 0, 0, 0, false, false, false, false, 0, null);
        e.dispatchEvent(v); };
    var persistContent = function(c) {
        if (!c) { return; }
        var p = c.replace(/(?:\s{0,}(?:\r\n|\r|\n)\s{0,}){1,}/gi, "\n").split("\n");
        var t, injectParagraph = function() {
            if ( !p.length ) { 
                if (t) {
                    window.clearInterval(t); t = null }; 
                return; }
            var c = p.shift().trim(); if (!c.length) { return; } 
            e = $_("factory");
            if (!e) {
                if (e = $$("add-factory")) {
                    e.click(); } 
                if (! (e = $_("factory") ) ) { 
                    return; } };
            dblClick(e);
            if ((e=e.getElementsByTagName("TEXTAREA")) && (e.length>0) && (e=e[0])) {
                e.value=c; e.blur(); } };
        t = window.setInterval( injectParagraph, 100 ); 
    };

    var hook = function() {
        if (document.readyState != "complete") { return; }
        if (interval) { window.clearInterval(interval); interval = null; }
        chrome.extension.onRequest.addListener(
            function(p,sender,reply) {
                if (p && p.name && reply) {
                    // handle main window requests here
                    switch(p.name) {
                        case "clip":
                            reply({"content":getSelection()});
                            break;
                        case "persist":
                            try { persistContent( p.content );  } catch(e) {;}
                            reply({});
                            break;
                    }
                }
            });
    };
    var interval = window.setInterval(hook, 500);
})();
}
