//
//  main background script module.

// ignore the inner frames
if (window.top === window) {

var _tabs = {
    getKey: function(tabId) { 
        return "_" + String(tabId); },
    cleanup: function(){
        var s = this, m, now = (new Date()).valueOf(); 
        for(var p in s.messages) {
            if ((m=s.messages[p])&&(m["expire"]<now)) {
                delete s.messages[p]; } } },
    getMessage: function(tabId) {
        var s = this, k = s.getKey(tabId), r = s.messages[k]; 
        delete s.messages[k]; return (r?r.msg:undefined); },
    putMessage: function(tabId, msg, agg) {
        var s = this, k = s.getKey(tabId), m;
        var expTime = ((new Date()).valueOf() + 120000);
        if ( m = s.messages[k] ) {
            // concatenating messages reflects the fact
            // one can export to Wiki faster than the 
            // Wiki page loads and assimilates the 
            // exported text. TODO: may need to cleanup 
            // (delete) the tab entry on empty message cache.
            m.expire = expTime; 
            if (msg) { 
                if (agg) { m.msg = agg(m.msg, msg); }
                else { m.msg = msg; } } }
        else {
            if (msg) { s.messages[k] = { 
                "expire": expTime, "msg": msg }; } } },
    messages: {}
};

// omnibox is available since version 9.0
var omni = (function() {
    var context = this;
    if (chrome.omnibox) {
        context.resetDefaultSuggestion = function() {
            chrome.omnibox.setDefaultSuggestion({
                description: '<url><match>wiki:</match></url> Add to your Wiki' }); }
        chrome.omnibox.onInputStarted.addListener(function() {
            resetDefaultSuggestion(); });
        chrome.omnibox.onInputCancelled.addListener(function() {
            resetDefaultSuggestion(); });
        chrome.omnibox.onInputChanged.addListener(function() {
            resetDefaultSuggestion(); });
        chrome.omnibox.onInputEntered.addListener(function(text) {
            try { chrome.tabs.getSelected(null, execWikiAction(text)); } catch (e) { ; } });
        context.resetDefaultSuggestion();
    }
    return context;
})();

var isSupportedUrl = function(u) {
    return ( u && ( u.startsWith( "http://" ) || u.startsWith( "https://" ) ) && 
                ( !u.startsWith( _options["wikiUrl"]() ) ) ); };

var getWikiTab = function(tabs) {
    var wikiUrl = _options["wikiUrl"]();
    for (var i = 0; i < tabs.length; i++) {
        with (tabs[i]) {
            if( url.startsWith(wikiUrl)) {
                return tabs[i]; } } }
    return null; };

var requestStoreToWiki = function(tabId, arg) {
    chrome.tabs.sendRequest( 
        tabId, arg,
            function(m){
                // As it turns, if no one listens to our
                // background page request, the callback is not 
                // getting called at all. Hence he deferred parameter
                // and the local message cache. 
                if (!m) { return; } 
            } ); };

var storeToWiki = function(srcTab,dstTab,deferred) {
    if (!( srcTab && dstTab ) ) { return; }
    var s = srcTab, d = dstTab;
    chrome.tabs.sendRequest( s.id, { name: "clip" }, 
        function(m) {
            if (!m) { return; }
            var arg = { name: "persist", content: m.content };
            if (deferred) {
                _tabs.putMessage( d.id, arg, function(m1,m2){
                    return ( m1.content ? String(m1.content) + "\r\n": "" ) + 
                           ( m2.content ? String(m2.content) : "" ); } ); }
            else {
                requestStoreToWiki( d.id, arg ); } } );
};

var execWikiAction = function(action) {
    return function(argTab) {
        // TODO: make sure the activity script is loaded. for now just check the
        // protocol and assume the script is available
        var u; if ( !isSupportedUrl( argTab.url ) ) {
            return; }
        // locate the wiki container
        chrome.windows.getAll( { populate: true }, function(windows){
                var tab;
                windows.forEach( function(win) {
                    if (tab) { return; }
                    tab = getWikiTab(win.tabs);
                });
                if (tab) { // just select
                    chrome.tabs.update(tab.id, { "selected": true });
                    storeToWiki(argTab, tab); }
                else { // or navigate to a new one, but be careful with the context                       
                    (function(src){
                        var s = src;
                        chrome.tabs.create({ "url": _options["wikiUrl"]() },
                            function(t){ storeToWiki( s, t, true ); } ); } )( argTab ) };
         } );
     };
};

var hasStatus = function(tab, changeInfo, status ) {
    return ((tab && (tab.status == status)) ||
            (changeInfo && (changeInfo.status == status)));
};

var getUrl = function(tab, changeInfo ) {
    return ( ( tab && tab.url ) ? tab.url : 
            ( ( changeInfo && changeInfo.url ) ? changeInfo.url: "" ) );
};

var hookActivity = function(id) {
    chrome.tabs.executeScript(id, { file: "runtime.js" });
    chrome.tabs.executeScript(id, { file: "activity.js" });
};

var setBadge = function(enabled) {
    chrome.browserAction.setBadgeText({ "text": enabled ? "+": "" });
};

var handleWindowActivate = function(id) {
    if (id===chrome.windows.WINDOW_ID_NONE) { 
        setBadge( false ); }
    else {
        chrome.tabs.getSelected( null, function(t){ handleNewTab( null, null, t ) } ); };
};

var handleNewTab = function(tabId, changeInfo, tab) {
    if (!tab) { tab = tabId; if (!tab) { return; } }
    if (tab.incognito) { return; }

    debug.print("tab " + tab.id.toString() + " changed: " + dumpObject(changeInfo));

    var u; if (hasStatus(tab, changeInfo, "complete")) {
        u = tab.url;
        // TODO: ensure content script is loaded. while doind so, silence any errors that may occur
    }
    // the badge and button state ties to the active window/tab    
    if (tab.selected) {
        setBadge( isSupportedUrl(u) ); }
    _tabs.cleanup();
 };

var handleTabClose = function(tabId) {
    _tabs.getMessage( tabId ); _tabs.cleanup();
    return; };

// processes requests from the browser tabs
var handleRequest = function(request, sender, response) {
    switch( request.name ) {
        case "fetch":
            var t, m; if ((t=sender)&&(t=t.tab)&&(t=t.id)) {
                    if (m=_tabs.getMessage(t)) {
                        response( m ); } }
            break; }
    _tabs.cleanup();
    return; };

// init the extension
(function() {
    with ( chrome.browserAction ) {
        onClicked.addListener( execWikiAction("add") );
        setBadgeBackgroundColor({ "color": [255, 0, 0, 255] });
    };
    with (chrome.tabs) {
        onRemoved.addListener( handleTabClose );
        onUpdated.addListener( handleNewTab );
        onCreated.addListener( handleNewTab );
        onSelectionChanged.addListener(
                function(tabId) {
                    get(tabId,
                        function(tab) {
                            handleNewTab(tab);
                        });
                });
    };
    with (chrome.windows) {
        onFocusChanged.addListener( handleWindowActivate );
    }; 
    with (chrome.extension) {
        onRequest.addListener(handleRequest);
    };

})();

}