const url = "http://localhost:8082/";

const multiple = "Typ maar één woord.";

const already = word =>
    "Het woord <b>" + word + "</b> is al gegokt.";

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

const success = (guesses, hints) =>
    "<p class=\"bigger\"><span>Gefeliciteerd!</span></p>\n"
    + "<p><span>Je hebt het</span> woord <br>in <b>"
    + guesses.toString()
    + "</b> gokken"
    + (hints ? " en <b>" + hints.toString() + "</b> hints geraden.</p>\n" : " geraden.\n");

const fail = (word, guesses, hints) =>
    "<p class=\"bigger\"><span>Volgende keer beter!</span></p>\n"
    + "<p><span>Je hebt het opgegeven in <b>" + guesses.toString() + "</b> gokken"
    + (hints ? " en <b>" + hints.toString() + "</b> hints.</p>\n" : ".\n")
    + "<p>Het woord was <b>" + word + "</b>.</p>\n";

const counter = "Gokken:";
const hinter = "Hints:";

const preprocess = (x) => x;

const noprocess = "Kon het woord niet verwerken. Probeer het opnieuw.";