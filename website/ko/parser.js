// code based off of https://github.com/rhobot/Hangulpy/

// 한글 unicode variables
const 초성 = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const 중성 = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const 종성 = ['e','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

const NUM_초성 = 초성.length;
const NUM_중성 = 중성.length;
const NUM_종성 = 종성.length;

const FIRST_한글_UNICODE = 0xAC00 // 가
const LAST_한글_UNICODE = 0xD7A3 // 힣

/**
 * Checks whether the phrase is 한글.
 * This method ignores whitespaces, punctuations, and numbers.
 * @param {string} phrase - a target string
 * @return {boolean} True if the phrase is 한글. False otherwise.
 */
function is_한글(phrase) {
    // If the input is only one character, test whether the character is 한글.
    if (phrase.length === 1)
        return is_all_한글(phrase);

    // Remove all whitespaces, punctuations, and numbers.
    return is_all_한글(phrase.replace(/[\p{P}$+<=>^`|~ ]/gu, ''));
}

/**
 * Checks whether the phrase contains all 한글 letters.
 * @param {string} phrase - a target string
 * @return {boolean} True if the phrase only consists of 한글. False otherwise.
 */
function is_all_한글(phrase) {
    return [...phrase].every((value) =>
           value.charCodeAt(0) >= FIRST_한글_UNICODE
        && value.charCodeAt(0) <= LAST_한글_UNICODE
        || 초성.concat(중성, 종성.slice(1, NUM_종성)).includes(value)
    );
}

/**
 * Returns the index of the 한글 character in the 한글 unicode range.
 * @param {string} letter 
 * @returns {number} The index of the 한글 character.
 */
function 한글_index(letter) {
    return letter.charCodeAt(0) - FIRST_한글_UNICODE;
}

/**
 * Returns the indices of 초성, 중성, and 종성 from the 한글 unicode code.
 * @param {number} code 
 * @returns {Array<number>} An array containing the indices of 초성, 중성, and 종성.
 */
function decompose_index(code) {
    const 종성_index = code % NUM_종성;
    code = (code / NUM_종성) |0;
    const 중성_index = code % NUM_중성;
    code = (code / NUM_중성) |0;
    const 초성_index = code;
    
    return [초성_index, 중성_index, 종성_index];
}

/**
 * This function returns letters by decomposing the specified 한글 letter.
 * @param {string} 한글_letter
 * @return {Array<string>} The individual parts.
 */
function decompose(한글_letter) {
    if(한글_letter.length != 1)
        throw new Error("The target string must be one letter.");
    if(!is_한글(한글_letter))
        throw new Error("The target string must be 한글.");

    if (초성.includes(한글_letter))
        return [한글_letter, 'e', 'e'];

    if (중성.includes(한글_letter))
        return ['e', 한글_letter, 'e'];

    if (종성.includes(한글_letter))
        return ['e', 'e', 한글_letter];

    let code = 한글_index(한글_letter);
    let [초, 중, 종] = decompose_index(code);
    
    return [초성[초], 중성[중], 종성[종]];
}

/**
 * Decomposes a sequence of 한글.
 * @param {string} phrase - a sequence of 한글 characters
 * @return {string} The decomposed components of the input.
 */
function decompose_seq(phrase) {
    if (!is_all_한글(phrase))
        throw new Error("The target string must be 한글.");

    return [...phrase].flatMap(decompose).join('');
}