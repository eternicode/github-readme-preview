$(function(){
    var ta = $('#input'),
        out = $('#output'),
        $iframe = $('iframe'),
        iframe = $iframe[0],
        $window = $(window),
        $document = $(document),
        origin = document.location.protocol + '//' + document.location.host;


    // Resize
    function resize_callback(e){
        var width = $document.width(),
            x = e.pageX;
        ta.css({width: Math.round(10000 * x/width)/100 + '%'});
        out.css({width: Math.round(10000 * (width-x)/width)/100 + '%'});
        return false;
    }
    var overlay = $('<div id="resize-overlay">').on({
            mousemove: resize_callback,
            mouseup: function(){ overlay.remove(); }
        });
    $('#resizer').on('mousedown', function(e){
        if (e.which !== 1)
            return;
        // Overlay div over page, because the iframe can swallow our mousemove
        // events, and dually so we can stabilize the cursor.
        overlay.appendTo('body');
        return false;
    });


    // iframe auto-size
    function autosize(){
        var doc = iframe.contentDocument || iframe.contentWindow.document;
        iframe.height = doc.body.offsetHeight || doc.body.scrollHeight;
    }
    $iframe.on('load', autosize);
    $window.on('message', function(e){
        e = e.originalEvent; // jquery event is not helpful
        if (e.origin !== origin)
            return;
        if (e.data == 'updated')
            autosize();
    });


    // output auto-scroll-position
    out.on('scroll', function(){
        sessionStorage['preview-y'] = out.scrollTop();
    });
    $iframe.on('load', function(){
        if ('preview-y' in sessionStorage)
            out.scrollTop(sessionStorage['preview-y']);
    });


    // Periodic cache-cleaning
    setInterval(cache.cleanup, 5 * 60 * 1000);


    // Conversion
    var last_cache_key, update_timeout;
    // An impl of Java's String.hashCode, works well enough for giving us
    // hash of a string
    function hashcode(str) {
        var hash = 0;
        if (str.length === 0)
            return hash;
        for (var i = 0; i < str.length; i++) {
            chr = str.charCodeAt(i);
            hash = ((hash<<5)-hash)+chr;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }
    function onsuccess(data, status, xhr){
        if (this.cache_key)
            cache.set(this.cache_key, {
                args: Array.apply(null, arguments)
            });
        sessionStorage['text'] = this.text;
        sessionStorage['html'] = data;
        iframe.contentWindow.postMessage('update', origin);
    }
    function update(){
        var text = ta.val(),
            cache_key = hashcode(text);

        if (cache_key === last_cache_key)
            return; // No change
        else
            last_cache_key = cache_key;

        if (cache.has(cache_key)){
            onsuccess.apply({text: text, cache_key: cache_key}, cache.get(cache_key).args);
            return;
        }

        $.ajax({
            type: 'POST',
            url: 'https://api.github.com/markdown',
            data: JSON.stringify({
                text: text,
                mode: 'markdown'
            }),
            context: {
                text: text,
                cache_key: cache_key
            },
            success: onsuccess
        });
    }
    ta.on({
        keyup: function(){
            clearTimeout(update_timeout);
            update_timeout = setTimeout(update, 300);
        },
        change: update
    });


    // Load last state
    if ('text' in sessionStorage){
        ta.val(sessionStorage['text']);
    }
    else
        $.get('docs/intro.md', function(text){
            // TODO: prevent this from needing to hit the markdown API
            ta.val(text);
            update();
        });
});
