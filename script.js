let guesses = [];

// generate a secret word
let answer;
let xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200)
        answer = JSON.parse(this.responseText);
};
xmlhttp.open("GET", "https://martenstraatsma.nl/semantle/getVector.php", true);
xmlhttp.send();

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
        document.getElementsByClassName("message")[0].innerHTML = "<div class=\"message-text\">단어 하나만 입력하세요</div>";
    
    else {
        // already guessed
        if (guesses.some(row => row[0] === word))
            document.getElementsByClassName("message")[0].innerHTML = "<div class=\"message-text\"><b>"
                                                                    + word
                                                                    + ((word.charCodeAt(word.length - 1) - 44032) % 28 ? "이" : "")
                                                                    + "</b>라는 단어는 이미 추측된 것이었습니다</div>";

        // valid guess
        else {
            document.getElementsByClassName("message")[0].innerHTML = "<div class=\"message-text\"><div class=\"loading-text\"><span style=\"--i: 0;\" class=\"visible\">계</span><span style=\"--i: 1;\" class=\"visible\">산</span><span style=\"--i: 2;\" class=\"visible\"> </span><span style=\"--i: 3;\" class=\"visible\">중</span><span style=\"--i: 4;\" class=\"visible\">.</span><span style=\"--i: 5;\" class=\"visible\">.</span><span style=\"--i: 6;\" class=\"visible\">.</span></div></div>";
            
            let xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    if (this.responseText === "unknown")
                        document.getElementsByClassName("message")[0].innerHTML = "<div class=\"message-text\">죄송합니다만, 이 단어를 모르겠습니다</div>";

                    else {
                        let response = JSON.parse(this.responseText);
                        let val = 50 * (1 + dot(answer.vector, response.vector) / (Math.sqrt(dot(answer.vector, answer.vector)) * Math.sqrt(dot(response.vector, response.vector))));
                        guesses.push([word, val]);
                        guesses.sort(function(x,y) {return y[1] - x[1]});
                        document.getElementsByClassName("info-bar")[0].innerHTML = "<span class=\"label\">추측:</span>\n<span>" + guesses.length.toString() + "</span>";
                        document.getElementsByClassName("message")[0].innerHTML = "<div>\n" + listEntry(word, val, true) + "\n</div>";
                    }
                }
            };
            xmlhttp.open("GET", "https://martenstraatsma.nl/semantle/getVector.php?q=" + word,false);
            xmlhttp.send();
        }

        document.getElementsByClassName("word")[0].value = "";
        document.getElementsByClassName("guess-history")[0].innerHTML = "";
        for ([entry, val] of guesses)
            document.getElementsByClassName("guess-history")[0].innerHTML += listEntry(entry, val, entry === word);
    }
});

// open the info pop-up
document.getElementsByClassName("btn")[0].addEventListener("click", e => {
    e.preventDefault();
    document.getElementsByClassName("modal-bg")[0].style["visibility"] = "visible";
});

// close the info pop-up
document.getElementsByClassName("modal-close-button")[0].addEventListener("click", e => {
    e.preventDefault();
    document.getElementsByClassName("modal-bg")[0].style["visibility"] = "hidden";
});