let guesses = [];
let hintCount = 0;

// generate a secret word
let answerVector;
fetch(url + preprocess(answer))
.then(response => {
    if (response.ok)
        return Promise.resolve(response);
    else
        return Promise.reject(new Error(response.statusText));
})
.then(response => {
    return response.arrayBuffer();
})
.then(arrayBuffer => {
    answerVector = new Float32Array(arrayBuffer);
    document.getElementsByTagName("input")[0].disabled = false;
})
.catch(error => {
    console.error("Request failed", error);
    alert(noprocess);
});

function enable () {
    document.getElementsByTagName("input")[0].disabled = false;
    document.getElementsByTagName("input")[0].focus();
    if (guesses[0][0] != answer) 
        document.getElementsByClassName("btn")[2].disabled = false;
    if (guesses[0][1] < 95)
        document.getElementsByClassName("btn")[3].disabled = false;
}

function disable () {
    document.getElementsByTagName("input")[0].disabled = true;
    document.getElementsByClassName("btn")[2].disabled = true;
    document.getElementsByClassName("btn")[3].disabled = true;
}

// generate the HTML for a list entry
function listEntry (word, val, current) {
    return "<div class=\"row-wrapper"
         + (current ? " current" : "")
         + "\">\n<div class=\"outer-bar\">\n<div class=\"inner-bar\" style=\"width: "
         + val.toString()
         + "%; background-color: var(--"
         + ["red", "yellow", "green", "green"][Math.floor(val * 0.03)]
         + ");\"></div>\n</div>\n<div class=\"row\">\n<span>"
         + word
         + "</span>\n<span>"
         + Math.floor(val).toString()
         + "</span>\n</div>\n</div>";
}

function infobar () {
    document.getElementsByClassName("info-bar")[0].innerHTML =
          "<span class=\"label\">"
        + counter
        + "</span>\n<span>"
        + (guesses.length - hintCount).toString()
        + "</span>"
        + (hintCount ?
          "\n<span class=\"label\">"
        + hinter
        + "</span>\n<span>"
        + hintCount.toString()
        + "</span>" : "");
}

function guesshistory (word) {
    document.getElementsByClassName("word")[0].value = "";
    document.getElementsByClassName("guess-history")[0].innerHTML = "";
    for ([entry, val] of guesses)
        document.getElementsByClassName("guess-history")[0].innerHTML += listEntry(entry, val, entry === word);
}

// computes the dot product
dot = (a, b) => a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);

// grab the element of the initial pop-up
let howToPlay = document.getElementsByClassName("how-to-play")[0];

async function call (word, postprocess) {
    if (!document.getElementsByTagName("input")[0].disabled) {
        document.getElementsByClassName("message")[0].innerHTML = "<div class=\"message-text\">" + loading + "</div>";
        disable();
    }
    try {
        await fetch(url + preprocess(word))
        .then(response => response.ok ? Promise.resolve(response) : Promise.reject(new Error(response.statusText)))
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => (new Float32Array(arrayBuffer)))
        .then(postprocess)
        .catch(error => {
            console.error("Request failed", error);
            throw error;
        });
    } catch (e) {
        document.getElementsByClassName("message")[0].innerHTML = "<div class=\"message-text\">" + noprocess + "</div>";
    }
}

let linearScore = vector => 50 * (1 + dot(answerVector, vector) / (Math.sqrt(dot(answerVector, answerVector)) * Math.sqrt(dot(vector, vector))));

function algebraicScore (vector) {
    const x = dot(answerVector, vector) / (Math.sqrt(dot(answerVector, answerVector)) * Math.sqrt(dot(vector, vector)));
    const ret = 50000000000 / 1570796729 * (Math.asin(x) + x * Math.sqrt(1 - x*x)) + 50.000012802582773474570;
    console.log(ret);
    return ret;
}

function normalScore (vector) {
    function ncdf(x, mean=0.16, std=0.16) {
        var x = (x - mean) / std;
        var t = 1 / (1 + .2315419 * Math.abs(x));
        var d =.3989423 * Math.exp( -x * x / 2);
        var prob = d * t * (.3193815 + t * ( -.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
        if( x > 0 ) prob = 1 - prob;
        return prob;
    };

    const x = dot(answerVector, vector) / (Math.sqrt(dot(answerVector, answerVector)) * Math.sqrt(dot(vector, vector)));
    return x === 1 ? 100 : 100 * ncdf(x);
}

let score = normalScore;

// process a guess
document.getElementsByTagName("form")[0].addEventListener('submit', async e => {
    e.preventDefault();
    let word = e.currentTarget.word.value;

    if (!word)
        return;

    // remove how to play div
    if (howToPlay) {
        howToPlay.parentNode.removeChild(howToPlay);
        howToPlay = null;
        document.getElementsByClassName("btn")[3].disabled = false;
    }
    
    // multiple words
    if (/\s/.test(word))
        document.getElementsByClassName("message")[0].innerHTML = "<div class=\"message-text\">" + multiple + "</div>";
    
    else {
        // already guessed
        if (guesses.some(row => row[0] === word))
            document.getElementsByClassName("message")[0].innerHTML = "<div class=\"message-text\">" + already(word) + "</div>";

        // correct guess
        else if (word === answer) {
            guesses.unshift([word, 100]);
            infobar();
            document.getElementsByClassName("message")[0].innerHTML = "<div>\n" + listEntry(word, 100, true) + "\n</div>";

        // valid guess
        } else {
            await call(word, vector => {
                let val = score(vector);
                guesses.push([word, val]);
                guesses.sort(function(x,y) {return y[1] - x[1]});
                infobar();
                document.getElementsByClassName("message")[0].innerHTML = "<div>\n" + listEntry(word, val, true) + "\n</div>";
                enable();
            });
        }

        guesshistory(word);
    }
});

// reveal the answer
document.getElementsByClassName("btn")[2].addEventListener("click", e => {
    e.preventDefault();
    guesses.unshift([answer, 100]);
    infobar();
    document.getElementsByClassName("message")[0].innerHTML = "<div>\n" + listEntry(answer, 100, true) + "\n</div>";
    guesshistory(answer);
    document.getElementsByClassName("btn")[2].disabled = true;
    document.getElementsByClassName("btn")[3].disabled = true;
});

// provide a hint
document.getElementsByClassName("btn")[3].addEventListener("click", async e => {
    e.preventDefault();
    do {
        const word = words[Math.floor(Math.random() * words.length)];
        if (word === answer || guesses.some(row => row[0] === word))
            continue;

        await call(word, vector => {
            const val = score(vector);
            if (val <= guesses[0][1])
                return;

            guesses.unshift([word, val]);
            infobar();
            document.getElementsByClassName("message")[0].innerHTML = "<div>\n" + listEntry(word, val, true) + "\n</div>";
            guesshistory(word);
            hintCount++;
            enable();
        });
    } while (document.getElementsByTagName("input")[0].disabled);
});

// open the info pop-up
document.getElementsByClassName("btn")[4].addEventListener("click", e => {
    e.preventDefault();
    document.getElementsByClassName("modal-bg")[0].style["visibility"] = "visible";
});

// close the info pop-up
document.getElementsByClassName("modal-close-button")[0].addEventListener("click", e => {
    e.preventDefault();
    document.getElementsByClassName("modal-bg")[0].style["visibility"] = "hidden";
});