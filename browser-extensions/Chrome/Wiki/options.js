
if (window.top === window) {

	window["_options"] = new (function(){
		var defaultWikiUrl = "http://localhost:1111/";
		var wikiUrl = "wikiUrl";
		this["_targetedProtocol"] = "http:";
		this[wikiUrl] = function() {
				var r = this.load({wikiUrl:wikiUrl}); 
				return ( r && ( r=r[wikiUrl] ) ) ? r: defaultWikiUrl; };
		this["load"] = function(hash) {
			var v; for(var p in hash) {
				hash[p] = (v=localStorage[p])?JSON.parse(v):defaultWikiUrl; }
			return hash; }
		this["save"] = function(hash) {
			for(var p in hash) {
				localStorage[p] = JSON.stringify(hash[p]); }; 
			return hash; };
		return this;
	})();
}