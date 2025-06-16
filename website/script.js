let guesses = [];

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
})
.catch(error => {
    console.error("Request failed", error);
});

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

// computes the dot product
dot = (a, b) => a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);

// grab the element of the initial pop-up
let howToPlay = document.getElementsByClassName("how-to-play")[0];

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
    }
    
    // multiple words
    if (/\s/.test(word))
        document.getElementsByClassName("message")[0].innerHTML = "<div class=\"message-text\">" + multiple + "</div>";
    
    else {
        // already guessed
        if (guesses.some(row => row[0] === word))
            document.getElementsByClassName("message")[0].innerHTML = "<div class=\"message-text\">" + already(word) + "</div>";

        // valid guess
        else {
            document.getElementsByClassName("message")[0].innerHTML = "<div class=\"message-text\">" + loading + "</div>";

            try {
                await fetch(url + preprocess(word))
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
                    const vector = new Float32Array(arrayBuffer);
                    let val = 50 * (1 + dot(answerVector, vector) / (Math.sqrt(dot(answerVector, answerVector)) * Math.sqrt(dot(vector, vector))));
                    guesses.push([word, val]);
                    guesses.sort(function(x,y) {return y[1] - x[1]});
                    document.getElementsByClassName("info-bar")[0].innerHTML = "<span class=\"label\">" + counter + "</span>\n<span>" + guesses.length.toString() + "</span>";
                    document.getElementsByClassName("message")[0].innerHTML = "<div>\n" + listEntry(word, val, true) + "\n</div>";
    
                })
                .catch(error => {
                    console.error("Request failed", error);
                    throw error;
                });
            } catch (e) {
                document.getElementsByClassName("message")[0].innerHTML = "<div class=\"message-text\">" + noprocess + "</div>";
            }
        }

        document.getElementsByClassName("word")[0].value = "";
        document.getElementsByClassName("guess-history")[0].innerHTML = "";
        for ([entry, val] of guesses)
            document.getElementsByClassName("guess-history")[0].innerHTML += listEntry(entry, val, entry === word);
    }
});

// open the info pop-up
document.getElementsByClassName("btn")[2].addEventListener("click", e => {
    e.preventDefault();
    document.getElementsByClassName("modal-bg")[0].style["visibility"] = "visible";
});

// close the info pop-up
document.getElementsByClassName("modal-close-button")[0].addEventListener("click", e => {
    e.preventDefault();
    document.getElementsByClassName("modal-bg")[0].style["visibility"] = "hidden";
});