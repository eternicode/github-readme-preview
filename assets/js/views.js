(function(){
    // TODO: prevent docs/ loaders from needing to hit the markdown API

    router.register_view('#intro', function(){
        $.get('docs/intro.md', function(text){
            app.textarea.val(text);
            app.update();
        });
    });
})();
