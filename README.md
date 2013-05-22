#  GitHub Readme Preview

A One Page App to quickly preview and edit GitHub's Readme-flavored markdown.


## Do It Live!

http://eternicode.github.io/github-readme-preview


## Quickstart

Essentially, what you want to do after you've cloned the project is to start a webserver that serves the project directory.

### If you have Python

```bash
python -m SimpleHTTPServer 8080
```

### If you have Ruby

```bash
ruby -r webrick -e "s = WEBrick::HTTPServer.new(:Port => 8080, :DocumentRoot => Dir.pwd); trap('INT') { s.shutdown }; s.start"
```

### If you have Node.js

Node doesn't seem to have a one-liner web server -- if you know of one, please let me know!

### If you're not a developer... ;)

Give [Mongoose](http://code.google.com/p/mongoose/) (see the [user manual](https://github.com/valenok/mongoose/blob/master/UserManual.md)) a spin.

### Once you have a server running

Visit http://127.0.0.1:8080/

Since these bind to host 0.0.0.0 (the "public address"), this is also accessible from any machine which has network access to the machine you run the command on -- so your Windows test machine at 192.168.1.101 can access the site on your development machine at 192.168.1.102 by visiting http://192.168.1.102:8080/.
