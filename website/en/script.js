const url = "http://localhost:8081/";

const multiple = "Just type one word.";

function already (word) {
    return "The word <b>"
         + word
         + "</b> was already guessed.";
}

const loading = "<div class=\"loading-text\">"
              + "<span style=\"--i:  0;\" class=\"visible\">C</span>"
              + "<span style=\"--i:  1;\" class=\"visible\">a</span>"
              + "<span style=\"--i:  2;\" class=\"visible\">l</span>"
              + "<span style=\"--i:  3;\" class=\"visible\">c</span>"
              + "<span style=\"--i:  4;\" class=\"visible\">u</span>"
              + "<span style=\"--i:  5;\" class=\"visible\">l</span>"
              + "<span style=\"--i:  6;\" class=\"visible\">a</span>"
              + "<span style=\"--i:  7;\" class=\"visible\">t</span>"
              + "<span style=\"--i:  8;\" class=\"visible\">i</span>"
              + "<span style=\"--i:  9;\" class=\"visible\">n</span>"
              + "<span style=\"--i: 10;\" class=\"visible\">g</span>"
              + "<span style=\"--i: 11;\" class=\"visible\">.</span>"
              + "<span style=\"--i: 12;\" class=\"visible\">.</span>"
              + "<span style=\"--i: 13;\" class=\"visible\">.</span>"
              + "</div>";

const counter = "Guesses:";

const preprocess = (x) => x;

const noprocess = "Could not process word. Please try again.";