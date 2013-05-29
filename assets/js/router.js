var router;
(function(){
    router = {
        registry: {},
        _init_hash_handled: false,
        _init_hash: document.location.hash,
        _fix_hash: function(hash){
            if (hash[0] != '#')
                hash = '#' + hash;
            return hash;
        },
        _get_hash_args: function(hash, func){
            // Extracts positional and keyword arguments and builds an arguments
            // list matching what the given function expects.
            var parsed = {args: [], kwargs: {}},
                parts = hash.split(':').slice(1),
                l, i, part,
                key, val, args,
                out = [];

            try{
                args = func.toString().match(/function (\w+)?\(((?:\w+, )*\w+)\)/)[2].split(', ');
            }
            catch(e){
                return [];
            }

            for (i=0, l=parts.length; i<l; i++){
                part = parts[i];
                if (part.indexOf('=') > 0){
                    key = part.split('=', 1);
                    val = part.split('=').slice(1).join('=');
                    parsed.kwargs[key] = val;
                }
                else
                    parsed.args.push(part);
            }

            for (i=0, l=args.length; i<l; i++, val=undefined){
                key = args[i];
                if (parsed.args.length)
                    val = parsed.args.splice(0,1)[0];
                // kwargs override args -- should probably error?
                if (key in parsed.kwargs)
                    out.push(parsed.kwargs[key]);
                else
                    out.push(val);
            }

            return out;
        },
        register_view: function(hash, onload, onunload){
            if (!onload)
                return;
            hash = this._fix_hash(hash);
            if (!this._init_hash_handled && this._init_hash.split(':')[0] == hash){
                var args = this._get_hash_args(this._init_hash, onload);
                $(function(){ onload.apply(null, args); });
                this._init_hash_handled = true;
            }
            this.registry[hash] = {
                onload: onload,
                onunload: onunload || $.noop
            };
        },
        dispatch: function(fromhash, tohash){
            this._init_hash_handled = true;
            var args, hash;
            hash = fromhash.split(':')[0];
            if (hash in this.registry){
                args = this._get_hash_args(fromhash, this.registry[hash].onunload);
                this.registry[hash].onunload.apply(null, args);
            }
            hash = tohash.split(':')[0];
            if (hash in this.registry){
                args = this._get_hash_args(tohash, this.registry[hash].onload);
                this.registry[hash].onload.apply(null, args);
            }
        },
        goto: function(tohash, force){
            if (!tohash)
                return;
            if (!force && document.location.hash)
                return;
            tohash = this._fix_hash(tohash);
            document.location.hash = tohash;
        },
        back: function(){
            history.back();
        },
        is_at: function(hash){
            if (!hash)
                return;
            hash = this._fix_hash(hash);
            return hash == document.location.hash;
        }
    };

    $(window).on('hashchange', function(e){
        var a = $('<a>')[0],
            fromhash, tohash;
        e = e.originalEvent;
        a.href = e.oldURL;
        fromhash = a.hash;
        a.href = e.newURL;
        tohash = a.hash;
        router.dispatch(fromhash, tohash);
        return false;
    });
})();
