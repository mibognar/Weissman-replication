let neg_images = new Array();
let neu_images = new Array();

// This is a horrible lazy workaround im not proud of:
let neg_words = new Array/*('zord','bosszúság','fáradt','hátrány','lelketlen','szemét','nyálkás','kapzsiság',
'túlhajszolt','nehézség','kihalt','börtön','koporsó','hányinger','nyálka',
'vesztes','reuma','csalódott','halotti','halott','romlás','csavargó','begyulladt','csúnya',
'szar','lépfene','vérhas','kizár','bosszús','ittas','ijesztő','penész','bűnösség','temetés',
'nyomorgó','gyáva','piszok','limfóma','sértő','beteg','lopás','koldus','hanyatlás','elhagy',
'narancsbőr','méltatlan','mumpsz','taknyos','tályog','lefog','szenvedni','lepra','elfajzott','kényszer',
'éhezik','váladék','heroin','bénít','házsártos','szmog','megvető','lopás','börtön','retteg','fogoly','hálátlan');*/
('akció','anakonda','bebaszva','behatol','bosszúálló','cunami','csodálatos','drámai','élénk','emberevés',
'emberrabló','erotikus','erõszakos','fájdalom','fanatikus','fantasztikus','fantázia','faszfej',
'fegyveres','félmeztelen','fenyegetés','fulladás','gengszter','gyanú','gyilkos','gyors','halálos',
'hasmenés','hazug','hiperaktív','hisztérikus','impulzív','intimitás','izgalom','izgatott','kalandos',
'kannibál','kárhozat','kéjsóvár','kígyó','kincs','kivégzés','kockázat','közösülés','kurva','lavina',
'lövés','maszturbál','megbosszul','megcsonkított','megfullad','molesztál','ordít','orgazmus','orgia',
'orgyilkosság','ördögi','öröm','õrület','õrültség','pánik','pisztoly','pokoli','pornográf','rablás',
'rettenetes','rohanás','románc','sodródás','sürgõsség','szakítás','szenvedély','szeretkezés','szülés',
'terror','tombol','tragédia','ünnepel','vágóhíd','vakmerõ','végzet','vérhas','veszélyes','zaklat','zûrzavar');


let neu_words = new Array/*('megfigyel','rögtön','munkás','vérvonal','példátlan','gyártás','lila',
'hátizsák','ugrás','folyadék','kezelő','zarándok','globális','választó','ropogtat','hét',
'változás','orrszarvú','méhlepény','egyenlet','sáv','töltő','válasz','járda','műértő',
'liheg','kereplő','hegesztő','lakáj','mikrofon','nevező','fazék','tunkol','agár','verseny',
'kóla','kanca','főcím','lábszár','bányász','csaj','sor','benyomás','különös','borjú','kaptár',
'menyét','varr','kalapács','látszat','serdülő');*/
('abszolút','alacsony','alaphang','alázatos','alkotmány','articsóka','átfogó','borjú','csodáló',
'csomagtartó','csóvál','deciméter','diagram','divat','egybeesik','elrendezés','eltérít','emu',
'evezõs','fáradt','felöltõ','fogyasztó','futóegér','füves','gyógyász','harsona','helikopter','hidratál',
'hónalj','horoszkóp','ín','info','jogi','józanság','kábel','káposzta','kaszinó','kedvesség','képes','keringõ',
'kiadvány','kibocsátás','kikiáltó','kimonó','kismalac','kisujj','kitalált','kommentár','kortárs','köd','kulcscsont',
'légúti','lelkész','lépcsõház','letéti','lucerna','magatartás','mágnes','mantra','megerõsít','meghitt','módszeres',
'mór','nedv','nyolcvan','nyugodt','oszlop','önt','pép','pince','potpuri','pragmatikus','rágás','rágógumi','rokon',
'röppálya','shilling','székház','széles','szélsõ','szerelõ','szervezet','szobor','szövet','talaj','tárcsa','tartalmaz',
'taxi','teáskanna','technikus','tekercs','teljesség','teremt','tetõ','tûzhely','tûzõgép','ujjlenyomat','ükapa','vászon',
'világias','visszavon','viteldíj','vizel','vizes','zászlórúd')



let pos_words = new Array('gyógymód','gyümölcs','angyal','bőséges','holdfény','kert','gondtalan','napkelte','testvéri',
'felfedez','értékes','sütemény','tisztaság','elegáns','anyai','család','croissant','színes','partner','ész','selymes',
'napfény','tiszta','édesem','kutyus','mami','hálás','nyuszi','nyugalom','képzelet','álom','gyógyulás','holdfény','bizalom',
'mosoly','napnyugta','felfrissít','növény','igazi','adni','kedvesség','wellness','játék','ötlet','ebéd','szabadság','jóképű',
'eper','gyerek','trópusok','víz','élő','papa','jó','masszázs');

let high_arousal_words = new Array();
let low_arousal_words = new Array();

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}
shuffle(neu_words)
neu_words.push.apply(neu_words,neu_words)
shuffle(neg_words)
neg_words.push.apply(neg_words,neg_words)
console.log(neg_words)

if (X.type === "affective_primeprobe"){
  for (i = 1; i<=18; i++) {
    neg_images[i] = new Image();
    neg_images[i].id = "randimage";
    neg_images[i].src = "affective_images/neg" + i + ".png";
  }
  for (i = 1; i<=18; i++) {
    neu_images[i] = new Image();
    neu_images[i].id = "randimage";
    neu_images[i].src = "affective_images/neu" + i + ".jpg";
  }
}
