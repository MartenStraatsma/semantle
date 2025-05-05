const url = "http://localhost:8082/";

const multiple = "Typ maar één woord.";

function already (word) {
    return "Het woord <b>"
         + word
         + "</b> is al gegokt.";
}

const loading = "<div class=\"loading-text\">"
              + "<span style=\"--i:  0;\" class=\"visible\">B</span>"
              + "<span style=\"--i:  1;\" class=\"visible\">e</span>"
              + "<span style=\"--i:  2;\" class=\"visible\">r</span>"
              + "<span style=\"--i:  3;\" class=\"visible\">e</span>"
              + "<span style=\"--i:  4;\" class=\"visible\">k</span>"
              + "<span style=\"--i:  5;\" class=\"visible\">e</span>"
              + "<span style=\"--i:  6;\" class=\"visible\">n</span>"
              + "<span style=\"--i:  7;\" class=\"visible\">e</span>"
              + "<span style=\"--i:  8;\" class=\"visible\">n</span>"
              + "<span style=\"--i:  9;\" class=\"visible\">.</span>"
              + "<span style=\"--i: 10;\" class=\"visible\">.</span>"
              + "<span style=\"--i: 11;\" class=\"visible\">.</span>"
              + "</div>";

const counter = "Pogingen:";

const preprocess = (x) => x;

const noprocess = "Kon het woord niet verwerken. Probeer het opnieuw.";