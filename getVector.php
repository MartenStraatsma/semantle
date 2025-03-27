<?php
header("Content-Type: text/html; charset=UTF-8");

try {
    $connect = new PDO(
        "mysql:charset=utf8mb4;host=localhost;dbname=strmtjs_semantle",
        "strmtjs_admin",
        "iNW%tna6Eghb8r6pk^80"
    );
} catch (PDOException $e) {
    exit($e->getMessage());
}

if (array_key_exists('q', $_REQUEST)) {
    $stmt = $connect->prepare("SELECT * FROM `word_vectors` WHERE word = :word");
    $stmt->execute(array(':word' => $_REQUEST['q']));
} else {
    $stmt = $connect->prepare("SELECT * FROM `word_vectors` ORDER BY RAND() LIMIT 1;");
    $stmt->execute();
}

$result = $stmt->fetch();

if ($result) {
    $out = '{"word" : "' . $result['word'] . '", "vector" : [' . $result['0'];
    for ($i = 1; $i < 300; $i++)
        $out .= ', ' . $result[(string)$i];
    
    echo $out . ']}';
} else
    echo "unknown";

?>