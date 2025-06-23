const url = "http://localhost:8081/";

const multiple = "단어 하나만 입력하세요.";

function already (word) {
    return "<b>"
         + word
         + ((word.charCodeAt(word.length - 1) - 44032) % 28 ? "이" : "")
         + "</b>라는 단어는 이미 추측된 것이었습니다.";
}

const loading = "<div class=\"loading-text\">"
              + "<span style=\"--i: 0;\" class=\"visible\">계</span>"
              + "<span style=\"--i: 1;\" class=\"visible\">산</span>"
              + "<span style=\"--i: 2;\" class=\"visible\"> </span>"
              + "<span style=\"--i: 3;\" class=\"visible\">중</span>"
              + "<span style=\"--i: 4;\" class=\"visible\">.</span>"
              + "<span style=\"--i: 5;\" class=\"visible\">.</span>"
              + "<span style=\"--i: 6;\" class=\"visible\">.</span>"
              + "</div>";

const counter = "추측:";
const hinter = "힌트:";

const preprocess = decompose_seq;

const noprocess = "워드를 처리할 수 없습니다. 다시 시도해 주세요.";