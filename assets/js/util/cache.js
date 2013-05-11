var cache;
(function(){
    var _cache;
    _cache = cache = {
        set: function(key, value, timeout){
            // Set cache[key] = value, expiring in timeout seconds
            // timeout = 0 means no expiry; no timeout defaults to 5min
            if (timeout === 0)
                timeout = Infinity;
            else if (timeout === void 0)
                timeout = 5 * 60;
            key = 'cache:' + key;
            var expires_at = (new Date()).getTime() + (1000 * parseFloat(timeout));
            sessionStorage[key] = JSON.stringify({
                expires_at: expires_at,
                value: value
            });
        },
        get: function(key){
            // Get cache[key].  If entry is expired, removes entry and returns
            // undefined.
            key = 'cache:' + key;
            var content = sessionStorage[key];
            if (content){
                var json = JSON.parse(content);
                if (json.expires_at > new Date())
                    return json.value;
                else
                    delete sessionStorage[key];
            }
        },
        has: function(key){
            // Returns true if key is present and not expired, false otherwise
            _cache.get(key); // auto-expire if necessary
            key = 'cache:' + key;
            return key in sessionStorage;
        },
        cleanup: function(){
            // clear out expired entries
            for (var key in sessionStorage){
                if (key.indexOf('cache:') === 0)
                    _cache.get(key.slice(6)); // get auto-removes expired entries
            }
        },
        clear: function(){
            // clear out all entries
            for (var key in sessionStorage){
                if (key.indexOf('cache:') === 0)
                    delete sessionStorage[key];
            }
        }
    };
})();
