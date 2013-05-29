var app = {
    user: null
};
$(function(){
    var ta = $('#input'),
        out = $('#output'),
        $iframe = $('iframe'),
        iframe = $iframe[0],
        $window = $(window),
        $document = $(document),
        origin = document.location.protocol + '//' + document.location.host,

        auth = null;


    // Authentication
    function set_user(data){
        app.user = data;
        if (app.user){
            sessionStorage['user'] = JSON.stringify(app.user);
            $('body')
                .removeClass('unauthenticated')
                .addClass('authenticated');
            $('.profile img').attr({src: app.user.avatar_url});
            $('.user-menu .loggedin').text('Logged in as ' + app.user.login);
        }
        else{
            delete sessionStorage['user'];
            $('body')
                .removeClass('authenticated')
                .addClass('unauthenticated');
            $('.profile img').attr({src: ''});
            $('.user-menu .loggedin').text('');
        }
    }
    function authenticate(username, password){
        if (username && password){
            sessionStorage['username'] = username;
            sessionStorage['password'] = password;
            auth = 'Basic ' + base64.encode(username + ':' + password);
        }
        else{
            auth = null;
            delete sessionStorage['username'];
            delete sessionStorage['password'];
        }
        $.get('https://api.github.com/rate_limit');
    }
    $(document).ajaxSend(function(e, xhr, opts){
        if (auth && opts.url.indexOf('api.github.com') !== -1)
            xhr.setRequestHeader('Authorization', auth);
    });
    $('.login-form').submit(function(){
        var form = this,
            username = $('[type=text]', this).val(),
            password = $('[type=password]', this).val();
        authenticate(); // "logout"
        $('p.error', form).empty();
        $('.control-group', form).removeClass('error');
        $.ajax({
            url: 'https://api.github.com/user',
            headers: {Authorization: 'Basic ' + base64.encode(username + ':' + password)},
            success: function(data){
                authenticate(username, password);
                set_user(data);
                form.reset();
            },
            error: function(xhr, status, e){
                $('p.error', form).text(xhr.responseJSON.message);
                $('.control-group', form).addClass('error');
            }
        });
        return false;
    });
    $('.user-menu .logout').click(function(){
        authenticate();
        set_user(null);
        return false;
    });



    var ratelimit = $('#ratelimit').tooltip({placement: 'bottom'});
    $(document).on('ajaxSuccess', function(e, xhr, opts, data){
        var limit = xhr.getResponseHeader('X-RateLimit-Limit'),
            remaining = xhr.getResponseHeader('X-RateLimit-Remaining');
        if (limit && remaining)
            ratelimit.text(remaining + ' / ' + limit);
    });
    $.get('https://api.github.com/rate_limit');

    authenticate(sessionStorage['username'], sessionStorage['password']);
    if ('user' in sessionStorage)
        try{
            set_user(JSON.parse(sessionStorage['user']));
        }
        catch(e){
            set_user(null);
        }


    var import_form = $('#import'),
        import_field = import_form.find('input');
    $.each([
        ['input', 'Load a readme from a repository.  Branch optional.'],
        ['.icon-download', 'Editing readme from %s'],
        ['.icon-upload', 'Commit readme to %s'],
        ['.icon-remove', 'Cancel edits']
    ], function(){
        var tooltip = this[1];
        import_form.find(this[0]).hover(function(){
            import_form.tooltip({
                placement: 'bottom',
                title: tooltip.replace(/%s/g, import_form.attr('data-repo'))
            }).tooltip('toggle');
        }, function(){
            import_form.tooltip('destroy');
        });
    });
    import_form
        .on('submit', function(){
            router.goto('#repo:' + import_field.val(), true);
            return false;
        })
        .on('click', '.icon-remove', function(){
            ta.val('');
            update();
            import_form
                .toggleClass('inactive active')
                .attr('data-repo', '');
            router.back();
        });


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
        router.goto('#intro');


    app = {
        textarea: ta,
        update: update
    };
});
