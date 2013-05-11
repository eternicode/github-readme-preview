// base64: http://ntt.cc/2008/01/19/base64-encoder-decoder-with-javascript.html
// Modified for more compact code
// utf8 handling: http://ecmanaut.blogspot.ca/2006/07/encoding-decoding-utf8-in-javascript.html
var base64 = {
    key: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    invalid: /[^A-Za-z0-9\+\/\=]/g,

    encode: function(input) {
        var out = "",
            chr2, chr3, enc2, enc3, enc4,

            chr1 = chr2 = chr3 = "",
            enc1 = enc2 = enc3 = enc4 = "",
            i = 0, l,

            key = this.key;

        input = unescape(encodeURIComponent(input));
        l = input.length;

        while (i < l) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {enc3 = enc4 = 64;}
            else if (isNaN(chr3)) {enc4 = 64;}

            out += key.charAt(enc1) + key.charAt(enc2) + key.charAt(enc3) + key.charAt(enc4);
        }

        return out;
    },

    decode: function(input) {
        var out = "",
            chr2, chr3, enc2, enc3, enc4,

            chr1 = chr2 = chr3 = "",
            enc1 = enc2 = enc3 = enc4 = "",
            i = 0, l,

            key = this.key, invalid = this.invalid;

        // remove invalid characters
        if (invalid.exec(input) && window.console && console.warn) {
            console.warn("Invalid characters in base64 input.");
        }
        input = input.replace(invalid, "");
        l = input.length;

        while (i < l) {
            enc1 = key.indexOf(input.charAt(i++));
            enc2 = key.indexOf(input.charAt(i++));
            enc3 = key.indexOf(input.charAt(i++));
            enc4 = key.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            out += String.fromCharCode(chr1);

            if (enc3!==64) {out = out + String.fromCharCode(chr2);}
            if (enc4!==64) {out = out + String.fromCharCode(chr3);}
        }

        return decodeURIComponent(escape(out));
    }
};
