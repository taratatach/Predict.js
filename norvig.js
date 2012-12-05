// Typing errors frequency
var p_spell_error = 1/20;

// String containing the unigrams
var unigrams;

// String containing the bigrams
var bigrams;

// String for the single edits
var singEdits;

// Instance of the distribution class for unigrams
var Pw;

// Instance of the distribution class for bigrams
var P2w;

// Instance of the distribution class for single edits
var P1edit;

var PREFIXES;

// Read N-grams from user input
var handleFile = function(files, callback) {
    var file = files[0];
    var reader = new FileReader();
    
    reader.readAsText(file);
    reader.onload = function(e) {
        callback(e.target.result);
    };
};

// Input handler for unigrams
var getUnigramsP = function(text) {
    unigrams = text;
    Pw = new Pdist(datafile(unigrams), N, avoid_long_words);
    PREFIXES = getPrefixes(Pw.getCount());
}

// Input handler for bigrams
var getBigramsP = function(text) {
    bigrams = text;
    P2w = Pdist(datafile(bigrams), N);
};

// Input handler for single edits
var getSingEditsP = function(text) {
    singEdits = text;
    P1edit = new Pdist(datafile(singEdits));
};

// A probability distribution estimated from counts in datafile.
function Pdist(data, _N, _missingfn) {
    this.count = {};
    this.N = 0;
    this.missingfn = null;
    
    for(key in data)
        if (!isNaN(data[key]))
            if (this.count[key]) {
                this.count[key] += data[key];
                this.N += data[key];
            } else {
                this.count[key] = data[key];
                this.N += data[key];
            }
    if (_N)
        this.N = _N;
    if (_missingfn)
        this.missingfn = _missingfn;
    else
        this.missingfn = function(w, n) {
            return 1/n;
        }
}

// Frequency of a word in datafile.
Pdist.prototype.freq = function(word) {
    if (this.count.hasOwnProperty(word)) {
        return this.count[word]/this.N;
    }
    else
        return this.missingfn(word, this.N);
}

// Getter function for count
Pdist.prototype.getCount = function() {
    return this.count;
}

// Read key, value pairs from file
var datafile = function(text, sep) {
    if (typeof sep === 'undefined') sep = '\t';
    
    var lines = text.split('\n');
    var words = {};
    for(var l=0; l < lines.length; l++) {
        var ws = lines[l].split(sep);
        words[ws[0]] = parseInt(ws[1]);
    }
    return words;
}

// Estimate the probability of an unknown word
var avoid_long_words = function(word, N) {
    return 10/(N*Math.pow(10, word.length));
}

// Number of tokens in corpus
var N = 1024908267229;

// Conditional probability of word, given previous word
var cPw = function(word, prev) {
    if (P2w.getCount().hasOwnProperty(prev + ' ' + word))
        return P2w.getCount()[prev + ' ' + word]/Pw.getCount()[prev];
    else
        return Pw.freq(word);
}

var corrections = function(text) {
    return text.match(/[a-zA-Z]+/).map(correct);
};

var correct = function(w) {
    var candidates = edits(w);
    return maxP(candidates, function(c, e) { return Pedit(e)*Pw.freq(c);});
};

// Returns the max of arg1 and arg2 using predicate arg3
// If arg2 is the predicate then returns the key of arg1's max element
var maxP = function(arg1, arg2, arg3) {
    if ((typeof arg1 === 'string') && (typeof arg2 === 'string') && (typeof arg3 === 'function')) {
        if (arg3(arg1) >= arg3(arg2))
            return arg1;
        else
            return arg2;
    } else if ((typeof arg1 === 'object') && (typeof arg2 === 'function')) {
        var m = 0;
        var k = null;
        for (var c in arg1) {
            var p = arg2(c, arg1[c]);
            m = Math.max(m, p);
            if (m == p)
                k = c;
        }
        return k;
    }
}

var Pedit = function(edit) {
    if (edit == "")
        return (1 - p_spell_error);
    return p_spell_error*product(edit.split("+").map(P1edit.freq, P1edit));
};

var product = function(a) {
    var res = 1;
    for (var i=0; i<a.length; i++) {
        res *= a[i];
    }
    return res;
};

var alphabet = "abcdefghijklmnopqrstuvwxyz";

var getPrefixes = function(ws) {
    var p = {};
    for(var w in ws)
        for(var i=0; i<w.length; i++)
            p[w.slice(0, i)] = 0;
    return p;
};

// Return a object of {correct: edit} pairs within d edits of word.
var edits = function(word, d) {
    if (typeof d === 'undefined') d = 2;
    
    var results = {};
    var editsR = function(hd, tl, d, edits) {
        var ed = function(L, R) {
            if (edits.length > 0)
                return (edits+','+R+'|'+L).split(',');
            else
                return [R+'|'+L];
        };
        var C = hd+tl;
        if (Pw.getCount().hasOwnProperty(C)) {
            var e = edits.join('+');
            if (!results.hasOwnProperty(C))
                results[C] = e;
            else
                results[C] = maxP(results[C], e, Pedit)
        }
        if (d <= 0)
            return;
        var extensions = [];
        for(var i=0; i<alphabet.length; i++)
            if (PREFIXES.hasOwnProperty(hd+alphabet[i]))
                extensions[hd+alphabet[i]] = 0;
        var p = (hd) ? hd[hd.length-1] : '<';
        
        // Insertion
        for(var h in extensions)
            editsR(h, tl, d-1, ed(p+h[h.length-1], p));
        if (!tl)
            return;
        // Deletion
        editsR(hd, tl.slice(1), d-1, ed(p, p+tl[0]));
        for(var h in extensions)
            if (h[h.length-1] == tl[0])
                editsR(h, tl.slice(1), d, edits);
            else
                editsR(h, tl.slice(1), d-1, ed(h[h.length-1], tl[0]));
        // Transpose
        if (tl.length >= 2 && (tl[0]!=tl[1] && PREFIXES.hasOwnProperty(hd+tl[1])))
            editsR(hd+tl[1], tl[0]+tl.slice(2), d-1, ed(tl[1]+tl[0], tl.slice(0,2)));
    };
    // Body of edits
    editsR("", word, d, []);
    return results;
};


