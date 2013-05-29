(function(){
    // TODO: prevent docs/ loaders from needing to hit the markdown API

    router.register_view('#intro', function(){
        $.get('docs/intro.md', function(text){
            app.textarea.val(text);
            app.update();
        });
    });

    router.register_view('#repo', function(repo){
        var import_form = $('#import'),
            import_field = import_form.find('input'),
            parts = /(\w+)\/(\w+)(#\w+)?/.exec(repo);
        if (parts){
            import_field.prop({disabled: true});
            $.get(
                'https://api.github.com/repos/' + parts[1] + '/' + parts[2] + '/readme',
                {ref: parts[3]},
                function(data){
                    import_form
                        .toggleClass('inactive active')
                        .attr('data-repo', repo);
                    import_field.val('').prop({disabled: false});
                    app.textarea.val(base64.decode(data.content.replace(/\n/g, '')));
                    app.update();
                }
            );
        }
    });

})();
