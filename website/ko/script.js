const url = "https://localhost:8081/";

const multiple = "단어 하나만 입력하세요.";

const already = word =>
    "<b>" + word + "</b>" + ((word.charCodeAt(word.length - 1) - 44032) % 28 ? "이" : "") + "라는 단어는 이미 추측된 것이었습니다.";

const loading = "<div class=\"loading-text\">"
              + "<span style=\"--i: 0;\" class=\"visible\">계</span>"
              + "<span style=\"--i: 1;\" class=\"visible\">산</span>"
              + "<span style=\"--i: 2;\" class=\"visible\"> </span>"
              + "<span style=\"--i: 3;\" class=\"visible\">중</span>"
              + "<span style=\"--i: 4;\" class=\"visible\">.</span>"
              + "<span style=\"--i: 5;\" class=\"visible\">.</span>"
              + "<span style=\"--i: 6;\" class=\"visible\">.</span>"
              + "</div>";

const success = (guesses, hints) =>
    "<p class=\"bigger\"><span>축하합니다!</span></p>\n"
    + "<p><span>당신은 그</span> 단어를 <br><b>"
    + guesses.toString()
    + "</b>개의 추측"
    + (hints ? "과 <b>" + hints.toString() + "</b>개의 힌트로 얻었습니다.</p>\n" : "으로 얻었습니다.\n");

const fail = (word, guesses, hints) =>
    "<p class=\"bigger\"><span>다음번에는 더 좋은 행운을 빕니다!</span></p>\n"
    + "<p><span>당신은 <b>" + guesses.toString() + "</b>번의 추측"
    + (hints ? "과 <b>" + hints.toString() + "</b>번의 힌트로 포기했습니다.</p>\n" : "으로 포기했습니다.\n")
    + "<p>그 단어는 <b>" + word + "</b>였습니다.</p>\n";

const counter = "추측:";
const hinter = "힌트:";

const preprocess = decompose_seq;

const noprocess = "워드를 처리할 수 없습니다. 다시 시도해 주세요.";