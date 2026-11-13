// =========================================================
// メダル・称号システム（medals.js）
// 練習モード・実践モード・実績一覧で共通して使う
//
// ・地方ごとに「遭遇数」と「正解数」を記録する
// ・10匹で銅、50匹で銀、地方コンプリートで金のメダル
// ・メダルごとに固有の称号がもらえる
// =========================================================

// ---------------------------------------------------------
// 地方の定義（全国図鑑番号の範囲）
// ---------------------------------------------------------
const MEDAL_REGIONS = [
    { key: "kanto",  name: "カントー", range: [1, 151] },
    { key: "johto",  name: "ジョウト", range: [152, 251] },
    { key: "hoenn",  name: "ホウエン", range: [252, 386] },
    { key: "sinnoh", name: "シンオウ", range: [387, 493] },
    { key: "unova",  name: "イッシュ", range: [494, 649] },
    { key: "kalos",  name: "カロス",   range: [650, 721] },
    { key: "alola",  name: "アローラ", range: [722, 809] },
    { key: "galar",  name: "ガラル",   range: [810, 905] },
    { key: "paldea", name: "パルデア", range: [906, 1025] }
];

// 記録の種類
const MEDAL_TYPES = [
    { key: "seen",    name: "遭遇", icon: "👀" },
    { key: "correct", name: "正解", icon: "✍️" }
];

// メダルの段階（goal が "all" のときは地方コンプリート）
const MEDAL_TIERS = [
    { key: "bronze", name: "銅", goal: 10 },
    { key: "silver", name: "銀", goal: 50 },
    { key: "gold",   name: "金", goal: "all" }
];

// ---------------------------------------------------------
// 称号とメッセージ
// 地方ごとに [銅, 銀, 金] の順。{ title: 称号, msg: メッセージ }
// ここを書き換えれば好きな称号に変えられる
// ---------------------------------------------------------
const MEDAL_TITLE_DATA = {
    kanto: {
        seen: [
            { title: "人口8人の町の出身者", msg: "主人公とライバルのふるさとマサラタウンは、人口わずか8人。ジムもない、カントーで一番小さな町である。名前の由来は「真っさら（真っ新）」で、まだ何色にも染まっていない主人公の旅立ちにぴったりの名前だ。", src: "https://bulbapedia.bulbagarden.net/wiki/Pallet_Town" },
            { title: "5%の確率をつかんだ者", msg: "初代でピカチュウを野生で捕まえられるのは、トキワの森と無人発電所の2か所だけだ。しかもトキワの森での出現率はたった5%。アニメでおなじみの看板ポケモンなのに、ゲームでは出会うのがひと苦労だったのである。", src: "https://serebii.net/pokedex/location/025.shtml" },
            { title: "内部番号001を知る者", msg: "初代のプログラムの中では、ポケモンに図鑑とは別の「内部番号」が振られている。その001番はフシギダネではなく、図鑑番号112のサイドンだ。デザイナーの杉森建も、最初期に作ったポケモンとしてサイドン、ピッピ、ラプラスの名前を挙げている。", src: "https://pokemondb.net/pokebase/436953/was-any-pokemon-ever-confirmed-to-be-the-first-designed" },
        ],
        correct: [
            { title: "樫の木の系譜を継ぐ者", msg: "オーキド博士の英語名は Professor Oak、つまり「樫の木」博士だ。この伝統はその後も続き、ウツギは Elm（ニレ）、ナナカマドは Rowan、アララギは Juniper（ネズ）、プラターヌは Sycamore（プラタナス）と、歴代の博士の英語名は木の名前になっている。", src: "https://legendsoflocalization.com/?p=2311" },
            { title: "色の名を訳す者", msg: "ヤマブキ、ハナダ、クチバ、ニビ、タマムシと、カントーの町の多くは色の名前だ。英語版でもこの仕掛けは守られ、ヤマブキは Saffron（サフラン色）、ハナダは Cerulean（空色）、クチバは Vermilion（朱色）と、色の名前に訳されている。", src: "https://bulbapedia.bulbagarden.net/wiki/Kanto_region" },
            { title: "半ズボンを語る者", msg: "「たんパンこぞう」は英語版で Youngster（若者）と訳された。ところが半ズボンのよさを語るセリフはそのまま残ったため、英語圏では突然半ズボンについて熱く語り出す謎の少年になってしまい、海外で有名なネタになった。", src: "https://knowyourmeme.com/memes/i-like-shorts-theyre-comfy-and-easy-to-wear" },
        ]
    },
    johto: {
        seen: [
            { title: "植物の名の町を歩く者", msg: "主人公のふるさとで、ウツギ博士の研究所があるワカバタウン。英語名は New Bark Town（新しい樹皮の町）である。ジョウトの町は、ワカバ、ヨシノ、キキョウのように、どれも植物にちなんで名付けられている。", src: "https://pokemon-archive.fandom.com/wiki/New_Bark_Town" },
            { title: "金閣と銀閣を見上げる者", msg: "ゴーストタイプのジムリーダー、マツバがいるエンジュシティのモデルは古都・京都だ。町にそびえるスズの塔と焼けた塔は、京都の金閣寺と銀閣寺がもとになっているといわれる。『金・銀』というタイトルとも重なる、なかなか粋な組み合わせである。", src: "https://www.thegamer.com/pokemon-johto-locations-visit-real-world/" },
            { title: "城都の歴史家", msg: "ジョウトという名前は、開発者の増田順一によると漢字の「城都」がもとになっている。お城のある古い都、つまりモデルになった関西の古都・奈良とのつながりを表した名前なのだ。", src: "https://pokemondb.net/pokebase/358664/why-is-every-pokemon-region-named-the-way-it-is" },
        ],
        correct: [
            { title: "ニレの木の研究助手", msg: "ウツギ博士の英語名は Professor Elm、つまりニレの木だ。日本語のウツギも白い花を咲かせる木の名前なので、日本語でも英語でも「木の名前の博士」になっている。", src: "https://pokemon-archive.fandom.com/wiki/File:Black_and_White_Chapter.png" },
            { title: "大阪弁を聞き取る者", msg: "ジョウト最大の都市コガネシティのモデルは大阪だ。だから日本語版のジムリーダー・アカネは大阪弁でしゃべる。ミルタンクのころがるで多くのプレイヤーを泣かせた、あのアカネである。", src: "https://smogon.com/smog/issue14/traveltokansai" },
            { title: "圧縮伝説の真相を知る者", msg: "『金・銀』にカントー地方まで丸ごと入っていたのは、岩田聡がデータを圧縮して容量を空けたおかげだという話が長く語り継がれてきた。ところが2023年の調査で、岩田が作った技術は容量を減らすためではなく、読み込みを速くするためのものだったと分かった。有名な美談は、実は少しずれていたのである。", src: "https://www.nintendolife.com/news/2023/10/new-details-emerge-on-satoru-iwatas-work-on-pokemon-gold-and-silver" },
        ]
    },
    hoenn: {
        seen: [
            { title: "とくせいの始まりを知る者", msg: "今では当たり前の「とくせい」と「せいかく」は、どちらも『ルビー・サファイア』で初めて登場した。それまでは同じ種類のポケモンなら、いかくやせいでんきのような個性も、ひかえめ・いじっぱりのような性格の違いもなかったのである。", src: "https://pokemondb.net/ruby-sapphire" },
            { title: "豊かな縁を結ぶ者", msg: "ホウエンは漢字で書くと「豊縁」。「豊」は豊かさ、「縁」は人と人、人とポケモンの結びつきを表している。地方の名前そのものに、ポケモンらしいテーマが込められているのだ。", src: "https://www.pocketgamer.com/articles/062915/game-freak-on-pokemon-well-make-the-games-we-want-to-make-then-choose-the-hardware/" },
            { title: "90度回った九州の旅人", msg: "ホウエン地方の地図は、九州を左に90度回転させた形をしている。増田順一によると、遊びやすさを考えてわざと回転させたそうだ。地図を右に90度回してみると、見慣れた九州の形が浮かび上がる。", src: "https://bulbapedia.bulbagarden.net/wiki/Hoenn_region" },
        ],
        correct: [
            { title: "オダマキとカバノキの通訳", msg: "オダマキ博士の名前は花のオダマキから、英語名の Birch はカバノキからきている。日本語は草花、英語は木と、同じ博士なのにまったく別の植物の名前を持っているのだ。", src: "https://dic.pixiv.net/a/%E3%82%AA%E3%83%80%E3%83%9E%E3%82%AD%E5%8D%9A%E5%A3%AB" },
            { title: "灰の降る道を歩いた者", msg: "ホウエンには、雨が降りやまない道や、火山灰が降り積もる道がある。このように場所ごとに天気が決まっている道は、ホウエン地方で初めて登場した。灰の積もった草むらを歩くと、その灰を集めてガラス細工と交換することもできた。", src: "https://m.bulbapedia.bulbagarden.net/wiki/Hoenn" },
            { title: "火口と隕石の調査員", msg: "最後のジムがあるルネシティ（ジムリーダーは『ルビー・サファイア』ではミクリ、『エメラルド』ではアダン）は、巨大なくぼ地の中にある不思議な町だ。このくぼ地の正体は作品によって違い、『ルビー・サファイア』では火山の火口、リメイク版『オメガルビー・アルファサファイア』では隕石が落ちた跡とされている。", src: "https://bulbapedia.bulbagarden.net/wiki/Volcano" },
        ]
    },
    sinnoh: {
        seen: [
            { title: "磁場の山で進化させた者", msg: "テンガン山の中には特殊な磁場が流れている。ここでレベルを上げると、レアコイルはジバコイルに、ノズパスはダイノーズに進化する。石も道具もいらず、場所そのものが進化の条件になっている珍しい例だ。", src: "https://bulbapedia.bulbagarden.net/wiki/Mt._Coronet" },
            { title: "151匹の図鑑を埋めた者", msg: "『ダイヤモンド・パール』のシンオウ図鑑にのっているポケモンは、初代のカントー図鑑とまったく同じ151匹だった。マイナーチェンジ版の『プラチナ』では210匹に増え、旅の途中で出会えるポケモンがぐっと増えた。", src: "https://bulbapedia.bulbagarden.net/wiki/Sinnoh_Dex" },
            { title: "神奥の語り部", msg: "シンオウという名前は、増田順一によると漢字の「神奥」がもとで、神秘を意味する。時間と空間をつかさどるディアルガとパルキアの伝説が残る地方に、ぴったりの名前である。", src: "https://pokemondb.net/pokebase/358664/why-is-every-pokemon-region-named-the-way-it-is" },
        ],
        correct: [
            { title: "世界と交換した者", msg: "世界中の知らない人とポケモンを交換できるGTS（グローバルトレードステーション）は、『ダイヤモンド・パール』で初めて登場した。ほしいポケモンを書いて預けておけば、相手がいつ来ても交換が成立する仕組みで、海の向こうのプレイヤーとも交換できた。", src: "https://bulbapedia.bulbagarden.net/wiki/Global_Trade_Station" },
            { title: "心のある場所を知る者", msg: "ゴーストタイプのジムリーダー、メリッサがいるヨスガシティ。英語名は Hearthome City で、英語の言い回し「Home is where the heart is（心のある場所こそ我が家）」に由来する。日本語の「よすが」も心のよりどころという意味なので、日本語と英語で意味がうまく重なっている。", src: "https://pokemondb.net/pokebase/117866/pokemon-cities-name-origins" },
            { title: "32回話しかけた者", msg: "ミカルゲを出すには、かなめいしを209番道路の古い塔に置いたあと、地下通路でほかのプレイヤーに合計32回話しかける必要があった。同じ友だちに32回話しかけてもよかったが、一人で遊んでいると絶対に出会えない、ちょっとさびしいポケモンだったのである。", src: "https://serebii.net/pokedex-dp/442.shtml" },
        ]
    },
    unova: {
        seen: [
            { title: "新顔だけの旅人", msg: "『ブラック・ホワイト』では、殿堂入りするまで過去作のポケモンが野生で一匹も出てこない。ピカチュウもズバットもいない、出会うのは見たことのないポケモンばかりの旅だったのである。", src: "https://m.bulbapedia.bulbagarden.net/wiki/Generation_V" },
            { title: "156の新顔を数えた者", msg: "『ブラック・ホワイト』で登場した新ポケモンは156匹。初代の151匹をも上回り、1つの世代で登場した数としては過去最多である。", src: "https://www.nintendolife.com/news/2016/01/feature_a_pokemon_retrospective_generation_5_-_2010_to_2013" },
            { title: "図鑑番号000の持ち主", msg: "ビクティニはイッシュ図鑑で「000番」に登録されている。番号000を正式に持つポケモンはビクティニただ一匹だ。アララギ博士によると、勝利をもたらすビクティニの力が、図鑑を持って旅するトレーナーにも分け与えられるようにという願いが込められている。", src: "https://bulbapedia.bulbagarden.net/wiki/Victini" },
        ],
        correct: [
            { title: "動き続けるドットを見た者", msg: "戦闘中のポケモンのドット絵がずっと動き続けるようになったのは『ブラック・ホワイト』からである。それまでのポケモンは、場に出たときに少し動くだけで、あとはじっと止まっていた。", src: "https://en.wikipedia.org/wiki/Pok%C3%A9mon_Black_and_White" },
            { title: "Nの本名を知る者", msg: "プラズマ団の王として登場する N は、ポケモンの声が聞こえる青年だ。本名はナチュラル・ハルモニア・グロピウス。「N」はその頭文字、Natural のNである。", src: "https://myfigurelist.com/character/10007/Natural-Harmonia-Gropius" },
            { title: "一種の名を訳した者", msg: "イッシュの名前は「一種（1種類）」から来ている。増田順一によると、モデルのニューヨークのように、近くで見ると人もポケモンも多種多様だが、遠くから見ればみな同じ一種類の生き物だ、という意味が込められている。この意味が伝わるよう各国の言葉で訳し直されたため、イッシュは言語ごとに名前がすべて違う唯一の地方になった。英語版の Unova も「1つ」を表す言葉がもとだといわれる。", src: "https://bulbapedia.bulbagarden.net/wiki/Unova" },
        ]
    },
    kalos: {
        seen: [
            { title: "プリズムタワーを見上げる者", msg: "カロス地方のモデルはフランスだ。パリがモデルのミアレシティの中心には、エッフェル塔をもとにしたプリズムタワーがそびえ、その中にはでんきタイプのジムリーダー、シトロンのジムまである。", src: "https://bulbapedia.bulbagarden.net/wiki/User:Lewtwo/NewLumiose" },
            { title: "世界同時発売の目撃者", msg: "『X・Y』は、本編で初めて世界同時に発売された作品だ。しかもどの国で買っても、日本語や英語など7つの言語から好きなものを選んで遊べるようになった。", src: "https://pokemondungeon.com/pokemon-x-and-y-versions" },
            { title: "美の語源を知る者", msg: "カロスという名前は、ギリシャ語で「美しさ」を意味する κάλλος（カロス）に由来する。ファッションや芸術の国フランスがモデルの地方に、まさにぴったりの名前だ。", src: "https://pokemondb.net/pokebase/358664/why-is-every-pokemon-region-named-the-way-it-is" },
        ],
        correct: [
            { title: "プラタナスの研究助手", msg: "プラターヌ博士の名前は、プラタナスの木に由来する。英語名の Sycamore も北米ではプラタナスの木を指すので、日本語でも英語でも同じ木の名前の博士になっている。", src: "https://pocketmonsters.net/characters/view/2779?page=2" },
            { title: "光の都の住人", msg: "シトロンのジムがあるミアレシティの通称は「光の都」。これはパリの愛称「光の都（ラ・ヴィル・リュミエール）」が由来とみられる。町の形も、凱旋門を中心に道が放射状に伸びるパリの街並みによく似ている。", src: "https://pokemon.fandom.com/wiki/Lumiose_City" },
            { title: "エイクスとワイの名付け親", msg: "ゼルネアスとイベルタルは、それぞれXとYの文字の形をもとにデザインされた。開発中のデータに残っていた仮の名前は、ゼルネアスが「エイクス」、イベルタルが「ワイ」、そしてジガルデが「ゼット」。まさに文字そのものの名前だったのである。", src: "https://tcrf.net/Development:Pok%C3%A9mon_X_and_Y/Pok%C3%A9mon_Data" },
        ]
    },
    alola: {
        seen: [
            { title: "回文の地方の旅人", msg: "ALOLA（アローラ）は、前から読んでも後ろから読んでも同じになる「回文」の名前だ。回文の名前を持つ地方はアローラが初めてである。", src: "https://breezewiki.discard.no/pokemon/wiki/Alola" },
            { title: "UB-01の追跡者", msg: "ウルトラビーストは異世界からやって来た生き物だ。正体がはっきりするまでは、ウツロイドが「UB-01 パラサイト」と呼ばれたように、番号付きのコードネームで呼ばれていた。まるで未確認生物の調査ファイルのようである。", src: "https://bulbapedia.bulbagarden.net/wiki/Nihilego" },
            { title: "化石のない島の探検家", msg: "アローラ地方では、新しい化石ポケモンが登場しない。モデルのハワイは、数百万年前に海から生まれた新しい島々で、恐竜の化石が見つかるほど古くないからだといわれる。", src: "https://breezewiki.discard.no/pokemon/wiki/Alola" },
        ],
        correct: [
            { title: "アローラのあいさつ名人", msg: "地方の名前は、ハワイ語のあいさつ「アロハ」に由来する。アローラの人々は実際に「アローラ！」をあいさつとして使っている。", src: "https://breezewiki.discard.no/pokemon/wiki/Alola" },
            { title: "たいまつの木の教え子", msg: "ククイ博士の名前は、ハワイの州の木でもあるククイノキから。ハワイ語の「ククイ」は「明かり」「たいまつ」を意味する。昔、ククイの実からとれる油が明かりに使われていたからだ。", src: "https://mauimagazine.net/kukui-tree-of-light/2/" },
            { title: "ボツ案から生まれた者", msg: "ウルトラビーストのデザインは、杉森建がかつて不採用にした案を思い出し、その不採用の理由をあえて取り入れて作られた。ポケモンではない異世界の生き物だからこそ、ボツになった理由がそのまま個性になったのである。", src: "https://bulbapedia.bulbagarden.net/wiki/Ultra_Beast" },
        ]
    },
    galar: {
        seen: [
            { title: "据え置き機の開拓者", msg: "『ソード・シールド』は、新しい地方を舞台にした本編として初めて、据え置き機（Nintendo Switch）で発売された。それまでの本編の新作は、ずっと携帯ゲーム機で発売されてきたのである。", src: "https://www.videogameschronicle.com/news/pokemon-sword-shield-is-switchs-fastest-selling-game-launch/" },
            { title: "バースとヨークを歩いた者", msg: "ガラルの町並みには、イギリスのバースやヨークによく似た場所がある。どちらも古い街並みが今も残る、イギリスの歴史ある都市だ。", src: "https://www.wikiwand.com/en/articles/Dynamax" },
            { title: "逆さ地図の測量士", msg: "ガラル地方の地図は、イギリスを上下逆さまにした形をしている。主人公とホップのふるさとハロンタウンの英語名 Postwick はイギリスに実在する村の名前で、のどかな町並みは湖水地方のケズィックがモデルといわれる。", src: "https://ap2hyc.com/?p=68667" },
        ],
        correct: [
            { title: "ガラル図鑑の門番", msg: "『ソード・シールド』の発売当初は、ガラル図鑑にのっているポケモンしか、ほかの作品から連れてくることができなかった。すべてのポケモンが登場しない本編はこれが初めてで、大きな話題になった。", src: "https://Pokemondb.net/sword-shield" },
            { title: "イギリスの砂漠を歩いた者", msg: "『ソード』ではかくとうタイプのサイトウ、『シールド』ではゴーストタイプのオニオンがジムリーダーを務めるラテラルタウン。この町は、イギリス唯一の砂漠と呼ばれることもあるケント州のダンジネスがモデルといわれる。一方で建物は、アメリカ南西部の先住民プエブロの集落によく似ている。イギリスの町なのに、どこか西部劇のような雰囲気があるのはこのためだ。", src: "https://breezewiki.discard.no/pokemon/wiki/Stow-on-Side" },
            { title: "地上絵の謎を解く者", msg: "くさタイプのジムリーダー、ヤローがいるターフタウン。その近くの丘には、巨大な地上絵が描かれている。公式ガイド「Galar Expedition Guide」によると、この地上絵はイギリスのストーンヘンジから着想を得たものだ。", src: "https://screenrant.com/pokemon-sword-shield-town-name-meaning-galar-region/" },
        ]
    },
    paldea: {
        seen: [
            { title: "オリーブの国の住人", msg: "ミニーブはオリーブがモデルのポケモンだ。英語名 Smoliv は、small（小さい）をかわいく崩したネットスラング smol と olive（オリーブ）を合わせたもの。頭の実に栄養を油としてためこみ、1週間なにも食べなくても平気だという。モデルのスペインは、オリーブの一大産地でもある。", src: "https://pokejungle.net/2025/02/23/smoliv-doliv-arboliva-origin-of-species/" },
            { title: "エル・ドラックを知る者", msg: "ホゲータは、バルセロナのグエル公園にある竜のモザイク像「エル・ドラック」がモデルといわれる。ニャオハの英語名 Sprigatito の gatito もスペイン語で「子猫」で、御三家からしてスペインらしさにあふれている。", src: "https://game8.co/games/Pokemon-Scarlet-Violet/archives/369146" },
            { title: "パルデアの語源学者", msg: "パルデアという名前には、スペインのスペイン語名 España、スペイン語で「村」を意味する aldea、そしてパラドックスが込められているといわれる。過去と未来のポケモンが現れる地方らしい、なぞかけのような名前である。", src: "https://bulbapedia.bulbagarden.net/wiki/Paldea" },
        ],
        correct: [
            { title: "ぽっちゃり子豚の通訳", msg: "グルトンの英語名 Lechonk は、スペイン語で子豚を意味する lechón と、ぽっちゃりした動物を指すネットスラング chonk を合わせたものだ。見た目は、イベリア半島で飼われる黒いイベリコ豚の子どもがモデルとみられる。", src: "https://bulbapedia.bulbagarden.net/wiki/Lechonk_(Pok%C3%A9mon)" },
            { title: "805年の学び舎の卒業生", msg: "パルデアのアカデミーは805年前に創立された、とても歴史のある学校だ。授業の小テストでもこの「805年」がちゃんと出題されるので、話を聞き流していると答えられない。", src: "https://serebii.net/scarletviolet/academyclasses.shtml" },
            { title: "木の名を持たない博士の弟子", msg: "オーキド博士以来、博士の名前は木の名前にするのがお約束だった。しかしオーリムとフトゥーは、その決まりから外れた初めての博士だ。英語名の Sada と Turo は、スペイン語で「過去」を意味する pasada と「未来」を意味する futuro からとられたといわれ、古代と未来のポケモンを研究する二人にぴったりの名前になっている。", src: "https://breezewiki.discard.no/pokemon/wiki/Professor_Turo" },
        ]
    }
};

// 使いやすい形に変換：MEDAL_TITLES[地方][種類][段階] と MEDAL_MESSAGES[地方][種類][段階]
const MEDAL_TITLES = {};
const MEDAL_MESSAGES = {};
const MEDAL_SOURCES = {};
for (const region in MEDAL_TITLE_DATA) {
    MEDAL_TITLES[region] = {};
    MEDAL_MESSAGES[region] = {};
    MEDAL_SOURCES[region] = {};
    for (const type in MEDAL_TITLE_DATA[region]) {
        MEDAL_TITLES[region][type] = {};
        MEDAL_MESSAGES[region][type] = {};
        MEDAL_SOURCES[region][type] = {};
        ["bronze", "silver", "gold"].forEach((tier, i) => {
            MEDAL_TITLES[region][type][tier] = MEDAL_TITLE_DATA[region][type][i].title;
            MEDAL_MESSAGES[region][type][tier] = MEDAL_TITLE_DATA[region][type][i].msg;
            MEDAL_SOURCES[region][type][tier] = MEDAL_TITLE_DATA[region][type][i].src;
        });
    }
}

// ---------------------------------------------------------
// 保存データの読み書き
// seen    : 遭遇したポケモン（前からある記録をそのまま使う）
// correct : 正解したポケモン
// medals  : 獲得済みメダル（例 "kanto-seen-bronze"）
// ---------------------------------------------------------
function medalLoad(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || "[]");
    } catch (e) {
        return [];
    }
}

function medalSave(key, list) {
    localStorage.setItem(key, JSON.stringify(list));
}

// ---------------------------------------------------------
// 地方ごとのポケモン一覧を作る
// pokedex_en.json に載っている（出題される）ポケモンだけを数える
// ---------------------------------------------------------
let medalRegionLists = null;

let medalStatData = null;   // 種族値データ（変わった実績で使う）

async function medalPrepare() {
    if (medalRegionLists) return medalRegionLists;

    const en = await (await fetch("pokedex_en.json")).json();
    const stats = await (await fetch("pokedex_stats.json")).json();
    medalStatData = stats;

    medalRegionLists = {};
    MEDAL_REGIONS.forEach(r => medalRegionLists[r.key] = []);

    Object.keys(en).forEach(name => {
        const id = Number(stats[name]?.id);
        const region = MEDAL_REGIONS.find(r => id >= r.range[0] && id <= r.range[1]);
        if (region) medalRegionLists[region.key].push(name);
    });

    return medalRegionLists;
}

// 地方・種類ごとの進み具合
function medalProgress(regionKey, typeKey) {
    const list = medalRegionLists[regionKey];
    const record = new Set(medalLoad(typeKey));
    const count = list.filter(name => record.has(name)).length;
    return { count: count, total: list.length };
}

// メダルの目標数（金は地方の総数）
function medalGoal(tier, total) {
    return tier.goal === "all" ? total : Math.min(tier.goal, total);
}

// ---------------------------------------------------------
// 新しく条件を満たしたメダルを探して授与する
// silent が true のときはポップアップを出さない
// ---------------------------------------------------------
function medalCheck(silent) {
    if (!medalRegionLists) return [];

    const owned = new Set(medalLoad("medals"));
    const newMedals = [];

    MEDAL_REGIONS.forEach(region => {
        MEDAL_TYPES.forEach(type => {
            const p = medalProgress(region.key, type.key);
            MEDAL_TIERS.forEach(tier => {
                const id = `${region.key}-${type.key}-${tier.key}`;
                if (!owned.has(id) && p.count >= medalGoal(tier, p.total)) {
                    owned.add(id);
                    newMedals.push({ region, type, tier });
                }
            });
        });
    });

    if (newMedals.length > 0) {
        medalSave("medals", [...owned]);
        if (!silent) newMedals.forEach(m => medalToast(m));
        medalBadgeUpdate();
        achCheck({}, silent);
    }
    return newMedals;
}

// ---------------------------------------------------------
// 記録する（各モードから呼ぶ）
// ---------------------------------------------------------
function medalRecord(typeKey, name) {
    if (!name) return;
    const list = medalLoad(typeKey);
    if (!list.includes(name)) {
        list.push(name);
        medalSave(typeKey, list);
        medalReady.then(() => {
            medalCheck(false);
            achCheck({}, false);
        });
    }
}

function medalRecordSeen(name) {
    medalRecord("seen", name);
    const ex = achEx();
    ex.seenCount[name] = (ex.seenCount[name] || 0) + 1;
    achExSave(ex);
}
function medalRecordCorrect(name) { medalRecord("correct", name); }

// ---------------------------------------------------------
// メダル獲得のポップアップ
// ---------------------------------------------------------
const MEDAL_EMOJI = { bronze: "🥉", silver: "🥈", gold: "🥇" };
let medalToastBox = null;

function medalToast(m) {
    const title = MEDAL_TITLES[m.region.key][m.type.key][m.tier.key];
    showToast(
        MEDAL_EMOJI[m.tier.key],
        `${m.region.name}・${m.type.name}の${m.tier.name}メダル`,
        `称号「${title}」を手に入れた！<br><small>${MEDAL_MESSAGES[m.region.key][m.type.key][m.tier.key]}</small>`,
        m.tier.key
    );
}

function showToast(icon, head, body, cls) {
    if (!medalToastBox) {
        medalToastBox = document.createElement("div");
        medalToastBox.id = "medal-toast-box";
        document.body.appendChild(medalToastBox);
    }

    const div = document.createElement("div");
    div.className = `medal-toast ${cls || ""}`;
    div.innerHTML =
        `<span class="medal-toast-icon">${icon}</span>` +
        `<span><b>${head}</b><br>${body}</span>`;
    medalToastBox.appendChild(div);

    setTimeout(() => div.classList.add("hide"), 3500);
    setTimeout(() => div.remove(), 4000);
}

// ---------------------------------------------------------
// タイトルバーの右端に獲得メダル数を表示
// ---------------------------------------------------------
function medalBadgeUpdate() {
    const header = document.querySelector("#page-header, #site-header, #header");
    if (!header) return;

    let badge = document.getElementById("medal-badge");
    if (!badge) {
        badge = document.createElement("div");
        badge.id = "medal-badge";
        badge.title = "獲得メダル数（地方メダル＋実績メダル）";
        header.appendChild(badge);
    }

    // 地方メダル＋実績メダルの合計
    const count = achMedalCount();
    medalLoad("medals").forEach(id => {
        const tier = id.split("-").pop();
        if (tier in count) count[tier]++;
    });

    const prog = medalOverallProgress();
    badge.title = `全メダルの進捗 ${prog.got} / ${prog.total}（地方メダル＋実績メダル）`;
    badge.innerHTML =
        `<span>🥇${count.gold}</span>` +
        `<span>🥈${count.silver}</span>` +
        `<span>🥉${count.bronze}</span>` +
        `<span class="badge-progress"><span class="badge-bar"><span style="width:${prog.percent}%"></span></span>${prog.percent}%</span>`;
}

// すべてのメダル（地方メダル＋実績メダル）を100%としたときの進捗
function medalOverallProgress() {
    const regionTotal = MEDAL_REGIONS.length * MEDAL_TYPES.length * MEDAL_TIERS.length;
    const achTotal = Object.keys(ACH_TIER).length;
    const total = regionTotal + achTotal;
    const regionGot = medalLoad("medals").length;
    const ac = achMedalCount();
    const achGot = ac.gold + ac.silver + ac.bronze;
    const got = Math.min(regionGot + achGot, total);
    // 小数1けた（0.0〜100.0）
    const percent = total ? Math.floor((got / total) * 1000) / 10 : 0;
    return { got, total, percent, regionGot, regionTotal, achGot, achTotal };
}

// =========================================================
// いろいろな実績
// =========================================================

// 累計の記録（正解回数・不正解回数・遊んだ日など）
function achStats() {
    try {
        return Object.assign(
            { correctTotal: 0, wrongTotal: 0, practiceBest: 0, days: [] },
            JSON.parse(localStorage.getItem("stats") || "{}")
        );
    } catch (e) {
        return { correctTotal: 0, wrongTotal: 0, practiceBest: 0, days: [] };
    }
}

function achSaveStats(st) {
    localStorage.setItem("stats", JSON.stringify(st));
}

function achOwnedMedals(tier) {
    return medalLoad("medals").filter(id => !tier || id.endsWith("-" + tier));
}

function achAllNames() {
    return medalRegionLists ? Object.values(medalRegionLists).flat() : [];
}

// 実績の一覧
// check(st, ctx) が true を返したら解除。ctx はそのときの出来事（正解した単語など）
const ACH_LIST = [
    // --- はじめの一歩 ---
    { key: "firstCorrect", icon: "🌱", name: "はじめての正解",
      desc: "どこかのモードで1問正解する",
      secret: "最初の一歩おめでとう。英単語の冒険はここから。",
      check: st => st.correctTotal >= 1 },
    { key: "firstMiss", icon: "🩹", name: "失敗は成功のもと",
      desc: "はじめて不正解になる",
      secret: "間違えた単語ほどよく覚える。気にせずいこう。",
      check: st => st.wrongTotal >= 1 },

    // --- 累計の正解 ---
    { key: "correct100", icon: "💯", name: "正解100回",
      desc: "累計で100回正解する",
      secret: "100回の正解は、100個の単語との出会い。",
      check: st => st.correctTotal >= 100 },
    { key: "correct500", icon: "📚", name: "正解500回",
      desc: "累計で500回正解する",
      secret: "単語帳1冊ぶんくらいは頭に入っているかも。",
      check: st => st.correctTotal >= 500 },
    { key: "correct1000", icon: "🎓", name: "正解1000回",
      desc: "累計で1000回正解する",
      secret: "もはや英語を勉強するテイではない。本気の勉強です。",
      check: st => st.correctTotal >= 1000 },
    { key: "miss100", icon: "🤸", name: "七転び八起き",
      desc: "累計で100回不正解になる",
      secret: "100回転んでも続けているのが一番えらい。",
      check: st => st.wrongTotal >= 100 },

    // --- 遭遇・正解の種類 ---
    { key: "seen100", icon: "🧭", name: "100種類と遭遇",
      desc: "100種類のポケモンと遭遇する",
      secret: "図鑑のページがだいぶ埋まってきました。",
      check: () => medalLoad("seen").length >= 100 },
    { key: "seen500", icon: "🗺️", name: "500種類と遭遇",
      desc: "500種類のポケモンと遭遇する",
      secret: "全国の半分を旅しました。",
      check: () => medalLoad("seen").length >= 500 },
    { key: "seenAll", icon: "🌏", name: "全国図鑑の旅人",
      desc: "出題されるすべてのポケモンと遭遇する",
      secret: "すべてのポケモンに会いました。本当にお疲れさま。",
      check: () => { const all = achAllNames(); const seen = new Set(medalLoad("seen")); return all.length > 0 && all.every(n => seen.has(n)); } },
    { key: "correctAll", icon: "👑", name: "全国図鑑の英語王",
      desc: "すべてのポケモンの問題で正解する",
      secret: "全ポケモンの図鑑文を読み解いた、真の英語王。",
      check: () => { const all = achAllNames(); const ok = new Set(medalLoad("correct")); return all.length > 0 && all.every(n => ok.has(n)); } },

    // --- 図鑑モード ---
    { key: "zukan50", icon: "📖", name: "図鑑の読者",
      desc: "図鑑モードで50種類のポケモンを読む",
      secret: "読むだけでも英語は身につきます。",
      check: () => medalLoad("zukanRead").length >= 50 },
    { key: "zukan300", icon: "🔖", name: "図鑑の愛読者",
      desc: "図鑑モードで300種類のポケモンを読む",
      secret: "ここまで読んだらもう図鑑マニアです。",
      check: () => medalLoad("zukanRead").length >= 300 },

    // --- 練習モード ---
    { key: "practice10", icon: "✏️", name: "練習の鬼",
      desc: "練習モードで10連続正解する",
      secret: "練習でできることは本番でもできる。",
      check: st => st.practiceBest >= 10 },

    // --- メダル ---
    { key: "medal10", icon: "🎖️", name: "メダルコレクター",
      desc: "メダルを10個集める",
      secret: "胸に付けきれないほどのメダルです。",
      check: () => achOwnedMedals().length >= 10 },
    { key: "firstGold", icon: "🥇", name: "はじめての金メダル",
      desc: "どこかの地方で金メダルを取る",
      secret: "ひとつの地方を極めました。",
      check: () => achOwnedMedals("gold").length >= 1 },
    { key: "allBronze", icon: "🚃", name: "全国行脚",
      desc: "9地方すべてで遭遇の銅メダルを取る",
      secret: "カントーからパルデアまで、全部の地方に足を運びました。",
      check: () => MEDAL_REGIONS.every(r => medalLoad("medals").includes(`${r.key}-seen-bronze`)) },

    // --- 遊び方 ---
    { key: "days3", icon: "📅", name: "三日坊主卒業",
      desc: "3日間遊ぶ",
      secret: "三日続いたなら、もう習慣の入り口です。",
      check: st => st.days.length >= 3 },
    { key: "days7", icon: "🗓️", name: "1週間の皆勤賞",
      desc: "7日間遊ぶ",
      secret: "毎日の積み重ねがいちばん強い。",
      check: st => st.days.length >= 7 },
    { key: "nightOwl", icon: "🦉", name: "夜ふかし研究家",
      desc: "深夜0時〜4時に正解する",
      secret: "勉強熱心なのはいいけど、ちゃんと寝てね。",
      check: (st, ctx) => ctx.correct && new Date().getHours() < 4 },
    { key: "earlyBird", icon: "🐓", name: "早起き学者",
      desc: "朝5時〜7時に正解する",
      secret: "朝の頭はよく働く。三文以上の得です。",
      check: (st, ctx) => { const h = new Date().getHours(); return ctx.correct && h >= 5 && h < 7; } },
    { key: "longWord", icon: "📏", name: "長い単語ハンター",
      desc: "10文字以上の単語で正解する",
      secret: "長い単語に出会っても、もう怖くない。",
      check: (st, ctx) => ctx.correct && (ctx.answer || "").length >= 10 },
    { key: "mythical", icon: "✨", name: "幻を見た",
      desc: "ある幻のポケモンと遭遇する",
      secret: "最初の幻、ミュウとの出会い。",
      check: () => medalLoad("seen").includes("mew") }
];

// 実績の難易度メダル（bronze=銅 / silver=銀 / gold=金）
// 実績ごとの雑学（称号メッセージ）と出典
const ACH_TRIVIA = {
    firstCorrect: { msg: "Pokémon の é に付いている点（アクセント記号）には意味がある。英語で Pokemon と書くと、最後の e を読まずに「ポウクモン」と発音されかねない。そこで e もきちんと「ケ」と読ませるために é が付けられたといわれる。英単語の勉強の第一歩にぴったりの雑学だ。", src: "https://pokemondb.net/pokebase/206361/what-does-e-in-pokemon-mean" },
    firstMiss: { msg: "ポケモンの企画は、最初「カプセルモンスター」という名前だった。ところがこの名前は商標の登録がうまくいかず、「カプモン」を経て「ポケットモンスター」に変わった。最初の失敗がなければ、今ごろ「カプモン」と呼ばれていたかもしれない。", src: "https://bulbapedia.bulbagarden.net/wiki/Capsule_Monsters" },
    correct100: { msg: "『ダイヤモンド・パール』の発売からまもなく、日本とアメリカのプレイヤーがGTSで交換したポケモンは1000万匹を超えた。100回の正解なんて、まだまだ序の口である。", src: "https://m.bulbanews.bulbagarden.net/wiki/GTS_trades_surpass_10_million_mark" },
    correct500: { msg: "アンノーンには、AからZまでの26種類に「！」と「？」を加えた28の姿がある。初登場の『金・銀』では26種類だけで、「！」と「？」は『ルビー・サファイア』で追加された。文字の形をしたポケモンは、英単語の勉強仲間にぴったりだ。", src: "https://bulbapedia.bulbagarden.net/wiki/Unown_(Pok%C3%A9mon)" },
    correct1000: { msg: "『ルビー・サファイア』には、全国図鑑の完成判定にバグがある。本来はすべてのポケモンをそろえないと完成にならないはずなのに、チコリータだけは持っていなくても完成扱いになってしまうのだ。1000回正解したあなたなら、もちろん1匹の抜けもなく覚えているはずだ。", src: "https://bulbapedia.bulbagarden.net/wiki/Diploma" },
    miss100: { msg: "初代『赤・緑』は完成までに6年かかり、開発したゲームフリークは倒産寸前まで追い込まれた。資金不足で5人の社員が辞め、田尻智は長いあいだ給料なしで働いたという。何度転んでも続けた先に、今のポケモンがある。", src: "https://bulbapedia.bulbagarden.net/wiki/History_of_Pok%C3%A9mon" },
    seen100: { msg: "図鑑番号100番のビリリダマは、モンスターボールにそっくりなポケモンだ。図鑑によると、モンスターボールが売り出されたのと同じころに発見され、何か関係があるといわれている。", src: "https://pokemondb.net/pokedex/voltorb" },
    seen500: { msg: "『ルビー・サファイア』のヒンバスは、119番道路の川の数百マスある水面のうち、たった6マスでしか釣れなかった。しかもその6マスはプレイヤーごとに違い、ムロタウンの「流行りの言葉」を変えると場所まで変わる。ミロカロスへの道は、シリーズ屈指の険しさだった。", src: "https://serebii.net/games/feebas.shtml" },
    seenAll: { msg: "全国図鑑を完成させると「ひかるおまもり」がもらえる。持っているだけで色違いのポケモンに出会いやすくなる道具で、『ブラック2・ホワイト2』で初めて登場した。それまでの図鑑完成のごほうびは、ほぼ賞状だけだった。", src: "https://bulbapedia.bulbagarden.net/wiki/Shiny_Charm" },
    correctAll: { msg: "初代の英語版をつくるとき、151匹すべての英語名を決めるのは大仕事だった。開発資料によると、ある時点で法務の確認を通った名前は132匹分で、残りの19匹はまだ決まっていなかった。ラプラスは一度ほかの名前も考えられたが、怪物の鳴き声のような響きが姿に合っているとして、日本語と同じ名前に戻されている。全部の英語名を読み解いたあなたは、その苦労の結晶をすべて味わったことになる。", src: "https://tcrf.net/Development:Pok%C3%A9mon_Red_and_Blue/Localization" },
    zukan50: { msg: "ポケモン図鑑にも型番がある。カードゲームの設定によると、シンオウの図鑑は「HANDY910is」というモデルだ。作品ごとに見た目が変わる図鑑にも、ちゃんと機種名があるわけだ。", src: "https://m.bulbapedia.bulbagarden.net/wiki/Sdex" },
    zukan300: { msg: "ゴースの体重はわずか0.1kg。体の95%がガスでできているため、強い風が吹くと吹き飛ばされてしまう。図鑑を読み込むと、こんな数字の面白さにも気づけるようになる。", src: "https://pokemondb.net/pokedex/92" },
    practice10: { msg: "ポケモンは、倒した相手に応じて「努力値」という隠れた数値をためて強くなる。初代ではこの値の上限が今よりずっと大きく、ミュウを656匹倒せばすべての能力が最大になる計算だった。今は1匹につき合計510までと決まっている。", src: "https://bulbapedia.bulbagarden.net/wiki/Effort_Values" },
    medal10: { msg: "初代では、ジムバッジを持っているだけで手持ちのポケモンの能力が少し上がった。たとえばグレーバッジは攻撃を上げる。ところがゲーム内の説明では、オレンジバッジが素早さ、ピンクバッジが防御を上げるとされていたのに、実際の効果はその逆だった。", src: "https://bulbapedia.bulbagarden.net/wiki/Badge" },
    firstGold: { msg: "色違いのポケモンが初めて登場したのは『金・銀』だ。野生で出会える確率は8192分の1。ただしいかりのみずうみでは、物語の中で赤いギャラドスに必ず出会える。多くのプレイヤーが初めて見た色違いは、このギャラドスだった。", src: "https://screenrant.com/pokemon-shiny-origins-when-introduced-why/" },
    allBronze: { msg: "『金・銀』では、コガネシティとヤマブキシティをリニアモーターカーが結んでいる。時速550kmを超える速さで走る列車だ。ヤマブキの駅はものまね娘の家を取り壊して建てられたもので、そのおわびとして彼女はリニアパスを持っている。", src: "https://m.bulbapedia.bulbagarden.net/wiki/Magnet_Train" },
    days3: { msg: "最初の『赤・緑』のドット絵は、約9か月後に出た『青』ですべて描き直された。6年の開発の間にデザインが古くなり、デザイナー自身が恥ずかしく思っていたという。三日坊主どころか、完成したあとも磨き続けたのである。", src: "https://lavacutcontent.com/?p=8901" },
    days7: { msg: "『金・銀』のつながりのどうくつには、金曜日にだけラプラスが現れる。逃しても倒しても、次の金曜日にはまた戻ってくる。時計と曜日の仕組みが入った『金・銀』ならではの出会いだ。", src: "https://www.dragonflycave.com/locations/gen2/198" },
    nightOwl: { msg: "ホーホーの体の中には、地球の自転を感じ取る器官がある。そのおかげで毎日決まった時刻に鳴き始め、昔の人は時計の代わりに飼っていたという。夜ふかし中のあなたの横でも、正確に首をかしげているはずだ。", src: "https://veekun.com/dex/pokemon/hoothoot/flavor" },
    earlyBird: { msg: "イワンコは、進化する時間で姿が変わる。昼なら まひるのすがた、夜なら まよなかのすがた のルガルガンになる。さらに特性マイペースのイワンコを夕方5時台に進化させると、どちらでもない たそがれのすがた になる。", src: "https://serebii.net/pokemon/lycanroc" },
    longWord: { msg: "技「じばく」の英語名は、第5世代まで Selfdestruct と1語で書かれていた。ハイフン入りの Self-Destruct になったのは第6世代からだ。昔は名前に使える文字数が少なく、長い名前を枠に収めるための工夫だったとみられる。", src: "https://bulbapedia.bulbagarden.net/wiki/Self-Destruct_(move)" },
    mythical: { msg: "ミュウは、すべてのわざマシンを覚えられるポケモンとして知られている。体の中にすべてのポケモンの遺伝子を持つといわれ、ポケモンの祖先ではないかと考える学者もいる。", src: "https://bulbapedia.bulbagarden.net/wiki/Mew" },
    combo10: { msg: "トリプルキックは、1回の攻撃で3回けりを入れる技だ。威力は10、20、30と、当たるたびに上がっていく。ただし途中で1回でも外れると、そこで止まってしまう。連続正解と同じで、続けるほど強くなるのである。", src: "https://pokemondb.net/move/triple-kick" },
    combo20: { msg: "初代の「まきつく」や「しめつける」は、2〜5ターンのあいだ相手をまったく行動できなくする技だった。しかも使った側が交代したターンでも、相手は動けないまま。相手を連続で封じ込める、初代屈指の凶悪な技だったのである。", src: "https://www.smogon.com/articles/moves-left-behind" },
    combo50: { msg: "ころがるは5ターン連続で当てると、威力が30から倍々に増えて最後は480になる。先にまるくなるを使っておけば、さらに倍の960。この480という数字は、第5世代の時点で全技の中で最も高い威力だった。50回連続で積み上げたあなたにふさわしい技である。", src: "https://m.bulbapedia.bulbagarden.net/wiki/Special:MobileDiff/1847563" },
    kantoComplete: { msg: "初代で図鑑を完成させると、タマムシマンションにいるゲームフリークの開発者から賞状がもらえる。『ピカチュウ版』では、ポケットプリンタを使ってこの賞状を本物の紙に印刷することもできた。", src: "https://bulbapedia.bulbagarden.net/wiki/Diploma" },
    johtoComplete: { msg: "1997年のスペースワールドで公開された『金・銀』の体験版は、2018年にネット上に流出した。この時点ですでに100匹の新ポケモンがデザインされていたが、製品版とは違う姿のものや、結局登場しなかったものも多く含まれていた。", src: "https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Gold_and_Silver_Spaceworld_%2797_demo" },
    hoennComplete: { msg: "『ルビー・サファイア』でレジロック・レジアイス・レジスチルに会うには、遺跡の壁に書かれた点字を読み解く必要があった。レジアイスの遺跡では、点字を読んだあと2分間なにもせずに待つと扉が開く。", src: "https://Bulbapedia.Bulbagarden.net/wiki/Island_Cave" },
};
// medals.js の ACH_LIST にない実績の名前
const ACH_EXTRA_NAMES = {"combo10": "10連続正解", "combo20": "20連続正解", "combo50": "50連続正解", "kantoComplete": "カントー図鑑コンプリート", "johtoComplete": "ジョウト図鑑コンプリート", "hoennComplete": "ホウエン図鑑コンプリート"};

const ACH_TIER = {
    // 銅：少し遊べば取れる
    firstCorrect: "bronze", firstMiss: "bronze", seen100: "bronze", zukan50: "bronze",
    days3: "bronze", nightOwl: "bronze", earlyBird: "bronze", longWord: "bronze",
    mythical: "bronze", combo10: "bronze",
    // 銀：しっかりやり込むと取れる
    correct100: "silver", correct500: "silver", miss100: "silver", seen500: "silver",
    zukan300: "silver", practice10: "silver", medal10: "silver", firstGold: "silver",
    allBronze: "silver", days7: "silver", combo20: "silver",
    kantoComplete: "silver", johtoComplete: "silver", hoennComplete: "silver",
    // 金：かなりの根気が必要
    correct1000: "gold", seenAll: "gold", correctAll: "gold", combo50: "gold"
};

// 獲得済みの実績メダルを数える
function achMedalCount() {
    const count = { gold: 0, silver: 0, bronze: 0 };
    let owned;
    try { owned = JSON.parse(localStorage.getItem("achievements") || "{}"); }
    catch (e) { owned = {}; }
    for (const key in owned) {
        if (owned[key] && ACH_TIER[key]) count[ACH_TIER[key]]++;
    }
    return count;
}

// 新しく条件を満たした実績を解除する
function achCheck(ctx, silent) {
    const st = achStats();
    let owned;
    try { owned = JSON.parse(localStorage.getItem("achievements") || "{}"); }
    catch (e) { owned = {}; }

    let changed = false;
    ACH_LIST.forEach(a => {
        if (owned[a.key]) return;
        let ok = false;
        try { ok = a.check(st, ctx || {}); } catch (e) { ok = false; }
        if (ok) {
            owned[a.key] = true;
            changed = true;
            const tier = ACH_TIER[a.key] || "bronze";
            if (!silent) showToast(MEDAL_EMOJI[tier], `実績解除：${a.icon} ${a.name}`, a.desc, tier);
        }
    });

    if (changed) {
        localStorage.setItem("achievements", JSON.stringify(owned));
        // 実践モードが持っている実績データとずれないようにする
        if (typeof achievements === "object" && achievements) Object.assign(achievements, owned);
        medalBadgeUpdate();
    }
}

// 今日遊んだことを記録
function achTouchDay() {
    const st = achStats();
    const d = new Date();
    const today = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    if (!st.days.includes(today)) {
        st.days.push(today);
        achSaveStats(st);
    }
    // 前回遊んだ日からのあき日数
    const ex = achEx();
    const now = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    if (ex.lastDay) {
        const gap = Math.round((now - ex.lastDay) / 86400000);
        if (gap > ex.maxGap) ex.maxGap = gap;
    }
    ex.lastDay = now;
    achExSave(ex);
}

// ---------------------------------------------------------
// 各モードから呼ぶ出来事
// ---------------------------------------------------------
function medalOnCorrect(name, answer, mode, combo) {
    const st = achStats();
    st.correctTotal++;
    if (mode === "practice" && combo > st.practiceBest) st.practiceBest = combo;
    achSaveStats(st);

    medalRecordCorrect(name);

    // 変わった実績用の記録
    const ex = achEx();
    const today = achToday();
    ex.daily[today] = (ex.daily[today] || 0) + 1;
    achExMode(ex, mode);
    ex.times.push(Date.now());
    if (ex.times.length > 20) ex.times = ex.times.slice(-20);
    ex.wrongStreak = 0;
    if (name && ex.wrongPending[name]) { delete ex.wrongPending[name]; ex.revenge++; }
    if (ex.comebackArmed) {
        ex.comebackCount++;
        if (ex.comebackCount >= 10) { ex.comeback++; ex.comebackArmed = false; }
    }
    achExSave(ex);

    medalReady.then(() => achCheck({ correct: true, answer: answer, name: name, mode: mode }, false));
}

function medalOnWrong() {
    const st = achStats();
    st.wrongTotal++;
    achSaveStats(st);

    const name = window.currentPokemon;
    const ex = achEx();
    ex.wrongStreak++;
    if (name) {
        ex.wrongBy[name] = (ex.wrongBy[name] || 0) + 1;
        ex.wrongPending[name] = true;
    }
    ex.comebackCount = 0;
    ex.comebackArmed = ex.wrongStreak >= 3;
    achExSave(ex);

    medalReady.then(() => achCheck({ wrong: true, name: name }, false));
}

function medalOnZukan(name) {
    const list = medalLoad("zukanRead");
    if (!list.includes(name)) {
        list.push(name);
        medalSave("zukanRead", list);
    }
    const ex = achEx();
    ex.zukanViews++;
    ex.zukanBy[name] = (ex.zukanBy[name] || 0) + 1;
    achExMode(ex, "zukan");
    achExSave(ex);
    medalReady.then(() => achCheck({ name: name, mode: "zukan" }, false));
}

// ---------------------------------------------------------
// ページを開いたときに準備（これまでの記録で取れるメダルは静かに授与）
// ---------------------------------------------------------
const medalReady = medalPrepare().then(() => {
    achTouchDay();
    medalCheck(true);
    medalBadgeUpdate();
    achCheck({}, true);
});

// =========================================================
// 変わった実績（追加の50個）
// =========================================================
// 変わった実績のための細かい記録
function achEx() {
    const base = { seenCount: {}, wrongBy: {}, wrongPending: {}, revenge: 0, wrongStreak: 0,
                   comebackArmed: false, comebackCount: 0, comeback: 0, daily: {}, times: [],
                   zukanViews: 0, zukanBy: {}, modes: {}, lastDay: 0, maxGap: 0 };
    try { return Object.assign(base, JSON.parse(localStorage.getItem("statsEx") || "{}")); }
    catch (e) { return base; }
}
function achExSave(ex) {
    try { localStorage.setItem("statsEx", JSON.stringify(ex)); } catch (e) {}
}
function achToday() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function achExToday() {
    return achEx().daily[achToday()] || 0;
}
function achExMode(ex, mode) {
    if (!mode) return;
    const t = achToday();
    ex.modes[t] = ex.modes[t] || [];
    if (!ex.modes[t].includes(mode)) ex.modes[t].push(mode);
}
// 種族値の合計
function achBst(name) {
    const s = medalStatData && medalStatData[name];
    if (!s) return 0;
    return ["hp", "attack", "defense", "special-attack", "special-defense", "speed"].reduce((a, k) => a + (s[k] || 0), 0);
}

ACH_LIST.push(
    { key: "pokemonDay", icon: "🎂", name: "ポケモンの日",
      desc: "2月27日に遊ぶ", secret: "2月27日に遊ぶ",
      check: ()=>{const d=new Date();return d.getMonth()===1&&d.getDate()===27;} },
    { key: "joya", icon: "🔔", name: "除夜の鐘",
      desc: "12月31日に遊ぶ", secret: "12月31日に遊ぶ",
      check: ()=>{const d=new Date();return d.getMonth()===11&&d.getDate()===31;} },
    { key: "halloween", icon: "🎃", name: "ハロウィンの夜",
      desc: "10月31日に遊ぶ", secret: "10月31日に遊ぶ",
      check: ()=>{const d=new Date();return d.getMonth()===9&&d.getDate()===31;} },
    { key: "zoromeTime", icon: "🕐", name: "ぞろ目の時間",
      desc: "1:11、2:22、11:11、22:22のようなぞろ目の時刻に正解する", secret: "1:11、2:22、11:11、22:22のようなぞろ目の時刻に正解する",
      check: (st,c)=>{if(!c.correct)return false;const d=new Date();const t=String(d.getHours())+String(d.getMinutes()).padStart(2,'0');return t.length>=3&&t.split('').every(x=>x===t[0]);} },
    { key: "sunday", icon: "☀️", name: "日曜日の勉強家",
      desc: "日曜日に正解する", secret: "日曜日に正解する",
      check: (st,c)=>c.correct&&new Date().getDay()===0 },
    { key: "noon", icon: "🍙", name: "お昼休み",
      desc: "12時台に正解する", secret: "12時台に正解する",
      check: (st,c)=>c.correct&&new Date().getHours()===12 },
    { key: "midnight", icon: "🌑", name: "日付をまたぐ者",
      desc: "0時台に正解する", secret: "0時台に正解する",
      check: (st,c)=>c.correct&&new Date().getHours()===0 },
    { key: "days30", icon: "📆", name: "1か月の皆勤賞",
      desc: "30日間遊ぶ", secret: "30日間遊ぶ",
      check: st=>st.days.length>=30 },
    { key: "days100", icon: "💯", name: "100日の旅人",
      desc: "100日間遊ぶ", secret: "100日間遊ぶ",
      check: st=>st.days.length>=100 },
    { key: "comeback", icon: "🏠", name: "おかえりなさい",
      desc: "30日以上あけてから、また遊ぶ", secret: "30日以上あけてから、また遊ぶ",
      check: ()=>achEx().maxGap>=30 },
    { key: "just151", icon: "1️⃣", name: "初代の数",
      desc: "累計の正解数がちょうど151回になる", secret: "累計の正解数がちょうど151回になる",
      check: (st,c)=>c.correct&&st.correctTotal===151 },
    { key: "just493", icon: "🌌", name: "アルセウスの数",
      desc: "累計の正解数がちょうど493回になる", secret: "累計の正解数がちょうど493回になる",
      check: (st,c)=>c.correct&&st.correctTotal===493 },
    { key: "lucky777", icon: "🎰", name: "ラッキーセブン",
      desc: "累計の正解数がちょうど777回になる", secret: "累計の正解数がちょうど777回になる",
      check: (st,c)=>c.correct&&st.correctTotal===777 },
    { key: "miss404", icon: "🚧", name: "Not Found",
      desc: "累計の不正解数がちょうど404回になる", secret: "累計の不正解数がちょうど404回になる",
      check: (st,c)=>c.wrong&&st.wrongTotal===404 },
    { key: "correct1025", icon: "🗂️", name: "全国図鑑の数",
      desc: "累計で1025回正解する", secret: "累計で1025回正解する",
      check: st=>st.correctTotal>=1025 },
    { key: "daily100", icon: "🏃", name: "一日百問",
      desc: "1日に100問正解する", secret: "1日に100問正解する",
      check: ()=>achExToday()>=100 },
    { key: "daily300", icon: "🔥", name: "一日三百問",
      desc: "1日に300問正解する", secret: "1日に300問正解する",
      check: ()=>achExToday()>=300 },
    { key: "wrongStreak5", icon: "🙈", name: "ドジっ子",
      desc: "5回連続で不正解になる", secret: "5回連続で不正解になる",
      check: ()=>achEx().wrongStreak>=5 },
    { key: "revenge", icon: "⚔️", name: "リベンジ成功",
      desc: "前に間違えたポケモンの問題で、あとから正解する", secret: "前に間違えたポケモンの問題で、あとから正解する",
      check: ()=>achEx().revenge>=1 },
    { key: "revenge50", icon: "🗡️", name: "雪辱の鬼",
      desc: "リベンジ成功を50回する", secret: "リベンジ成功を50回する",
      check: ()=>achEx().revenge>=50 },
    { key: "nemesis", icon: "😤", name: "天敵",
      desc: "同じポケモンの問題で3回不正解になる", secret: "同じポケモンの問題で3回不正解になる",
      check: ()=>Object.values(achEx().wrongBy).some(n=>n>=3) },
    { key: "familiar", icon: "👋", name: "顔なじみ",
      desc: "同じポケモンに10回出会う", secret: "同じポケモンに10回出会う",
      check: ()=>Object.values(achEx().seenCount).some(n=>n>=10) },
    { key: "familiar30", icon: "🔗", name: "腐れ縁",
      desc: "同じポケモンに30回出会う", secret: "同じポケモンに30回出会う",
      check: ()=>Object.values(achEx().seenCount).some(n=>n>=30) },
    { key: "quick10", icon: "⚡", name: "早押し名人",
      desc: "60秒以内に10問正解する", secret: "60秒以内に10問正解する",
      check: ()=>{const t=achEx().times;return t.length>=10&&t[t.length-1]-t[t.length-10]<=60000;} },
    { key: "kishikaisei", icon: "🌅", name: "起死回生",
      desc: "3回連続で間違えたあと、10連続で正解する", secret: "3回連続で間違えたあと、10連続で正解する",
      check: ()=>achEx().comeback>=1 },
    { key: "pikachu", icon: "⚡", name: "看板ポケモンの友",
      desc: "ピカチュウの問題に正解する", secret: "ピカチュウの問題に正解する",
      check: (st,c)=>c.correct&&c.name==='pikachu' },
    { key: "magikarp", icon: "🐟", name: "はねるの達人",
      desc: "コイキングの問題に正解する", secret: "コイキングの問題に正解する",
      check: (st,c)=>c.correct&&c.name==='magikarp' },
    { key: "ditto", icon: "🫥", name: "へんしん名人",
      desc: "メタモンに出会う", secret: "メタモンに出会う",
      check: ()=>medalLoad('seen').includes('ditto') },
    { key: "eeveelution", icon: "🦊", name: "ブイズ博士",
      desc: "イーブイと8種類の進化形すべてに出会う", secret: "イーブイと8種類の進化形すべてに出会う",
      check: ()=>{const s=new Set(medalLoad('seen'));return ['eevee','vaporeon','jolteon','flareon','espeon','umbreon','leafeon','glaceon','sylveon'].every(n=>s.has(n));} },
    { key: "kantoStarters", icon: "🌱", name: "最初の三匹",
      desc: "フシギダネ・ヒトカゲ・ゼニガメすべての問題に正解する", secret: "フシギダネ・ヒトカゲ・ゼニガメすべての問題に正解する",
      check: ()=>{const s=new Set(medalLoad('correct'));return ['bulbasaur','charmander','squirtle'].every(n=>s.has(n));} },
    { key: "birds", icon: "🕊️", name: "伝説の三鳥",
      desc: "フリーザー・サンダー・ファイヤーすべてに出会う", secret: "フリーザー・サンダー・ファイヤーすべてに出会う",
      check: ()=>{const s=new Set(medalLoad('seen'));return ['articuno','zapdos','moltres'].every(n=>s.has(n));} },
    { key: "mewAndMewtwo", icon: "🧬", name: "遺伝子の親子",
      desc: "ミュウとミュウツーの両方の問題に正解する", secret: "ミュウとミュウツーの両方の問題に正解する",
      check: ()=>{const s=new Set(medalLoad('correct'));return s.has('mew')&&s.has('mewtwo');} },
    { key: "palindrome", icon: "🔁", name: "回文ハンター",
      desc: "英語名が回文のポケモン（Eevee、Ho-Oh など）の問題に正解する", secret: "英語名が回文のポケモン（Eevee、Ho-Oh など）の問題に正解する",
      check: (st,c)=>{if(!c.correct||!c.name)return false;const n=c.name.replace(/-/g,'');return n.length>2&&n===n.split('').reverse().join('');} },
    { key: "shortName", icon: "🔤", name: "三文字の名前",
      desc: "英語名が3文字のポケモン（Mew、Muk）の問題に正解する", secret: "英語名が3文字のポケモン（Mew、Muk）の問題に正解する",
      check: (st,c)=>c.correct&&!!c.name&&c.name.replace(/-/g,'').length<=3 },
    { key: "longName", icon: "📏", name: "10文字の壁を越えて",
      desc: "英語名が11文字以上のポケモン（Crabominable、Meowscarada など）の問題に正解する", secret: "英語名が11文字以上のポケモン（Crabominable、Meowscarada など）の問題に正解する",
      check: (st,c)=>c.correct&&!!c.name&&c.name.replace(/[^a-z]/gi,'').length>=11 },
    { key: "zoromeDex", icon: "🎲", name: "ぞろ目コレクター",
      desc: "図鑑番号111・222・333…999のポケモンすべてに出会う", secret: "図鑑番号111・222・333…999のポケモンすべてに出会う",
      check: ()=>{const s=new Set(medalLoad('seen'));return ['rhyhorn','corsola','swablu','gabite','darmanitan','vivillon','togedemaru','zacian','gimmighoul'].every(n=>s.has(n));} },
    { key: "alphaOmega", icon: "🔚", name: "はじまりとおわり",
      desc: "図鑑番号1番（フシギダネ）と最後の番号のポケモンの問題に正解する", secret: "図鑑番号1番（フシギダネ）と最後の番号のポケモンの問題に正解する",
      check: ()=>{const s=new Set(medalLoad('correct'));return s.has('bulbasaur')&&s.has('pecharunt');} },
    { key: "bigHP", icon: "💗", name: "ふくよかな相手",
      desc: "HPの種族値が200以上のポケモンの問題に正解する", secret: "HPの種族値が200以上のポケモンの問題に正解する",
      check: (st,c)=>c.correct&&!!c.name&&medalStatData&&(medalStatData[c.name]?.hp||0)>=200 },
    { key: "speedster", icon: "💨", name: "目にも止まらぬ",
      desc: "素早さの種族値が150以上のポケモンの問題に正解する", secret: "素早さの種族値が150以上のポケモンの問題に正解する",
      check: (st,c)=>c.correct&&!!c.name&&medalStatData&&(medalStatData[c.name]?.speed||0)>=150 },
    { key: "bst600", icon: "🐉", name: "600族の使い手",
      desc: "種族値の合計がちょうど600のポケモンの問題に正解する", secret: "種族値の合計がちょうど600のポケモンの問題に正解する",
      check: (st,c)=>c.correct&&!!c.name&&achBst(c.name)===600 },
    { key: "smallStep", icon: "🐛", name: "小さな一歩",
      desc: "種族値の合計が200以下のポケモンの問題に正解する", secret: "種族値の合計が200以下のポケモンの問題に正解する",
      check: (st,c)=>c.correct&&!!c.name&&achBst(c.name)>0&&achBst(c.name)<=200 },
    { key: "balanced", icon: "⚖️", name: "バランス型",
      desc: "6つの種族値がすべて同じポケモンの問題に正解する", secret: "6つの種族値がすべて同じポケモンの問題に正解する",
      check: (st,c)=>{if(!c.correct||!c.name||!medalStatData||!medalStatData[c.name])return false;const s=medalStatData[c.name];return new Set(['hp','attack','defense','special-attack','special-defense','speed'].map(k=>s[k])).size===1;} },
    { key: "zukanFav", icon: "❤️", name: "お気に入り",
      desc: "図鑑モードで同じポケモンを10回開く", secret: "図鑑モードで同じポケモンを10回開く",
      check: ()=>Object.values(achEx().zukanBy).some(n=>n>=10) },
    { key: "zukan1000", icon: "📚", name: "図鑑の虫",
      desc: "図鑑モードを合計1000回開く", secret: "図鑑モードを合計1000回開く",
      check: ()=>achEx().zukanViews>=1000 },
    { key: "zukanAll", icon: "🏛️", name: "図鑑の主",
      desc: "図鑑モードですべてのポケモンを読む", secret: "図鑑モードですべてのポケモンを読む",
      check: ()=>{const all=achAllNames();const r=new Set(medalLoad('zukanRead'));return all.length>0&&all.every(n=>r.has(n));} },
    { key: "allModes", icon: "🎯", name: "三刀流",
      desc: "1日のうちに練習・実践・図鑑のすべてのモードで遊ぶ", secret: "1日のうちに練習・実践・図鑑のすべてのモードで遊ぶ",
      check: ()=>{const m=achEx().modes[achToday()]||[];return ['practice','jissen','zukan'].every(x=>m.includes(x));} },
    { key: "allSilver", icon: "🥈", name: "白銀の旅人",
      desc: "9地方すべてで遭遇の銀メダルを取る", secret: "9地方すべてで遭遇の銀メダルを取る",
      check: ()=>MEDAL_REGIONS.every(r=>medalLoad('medals').includes(`${r.key}-seen-silver`)) },
    { key: "halfway", icon: "🏔️", name: "折り返し地点",
      desc: "全メダルの進捗が50%になる", secret: "全メダルの進捗が50%になる",
      check: ()=>medalOverallProgress().percent>=50 },
    { key: "allGold", icon: "🏆", name: "黄金の旅人",
      desc: "9地方すべてで遭遇の金メダルを取る", secret: "9地方すべてで遭遇の金メダルを取る",
      check: ()=>MEDAL_REGIONS.every(r=>medalLoad('medals').includes(`${r.key}-seen-gold`)) },
    { key: "master", icon: "👑", name: "真のポケモンマスター",
      desc: "ほかのすべてのメダルを集める（全メダルの進捗100%）", secret: "ほかのすべてのメダルを集める（全メダルの進捗100%）",
      check: ()=>{const p=medalOverallProgress();return p.got>=p.total-1;} },
    { key: "practice30", icon: "🥋", name: "練習の達人",
      desc: "練習モードで30連続正解する", secret: "練習モードで30連続正解する",
      check: st=>st.practiceBest>=30 }
);
Object.assign(ACH_TIER, {"pokemonDay": "bronze", "joya": "bronze", "halloween": "bronze", "zoromeTime": "bronze", "sunday": "bronze", "noon": "bronze", "midnight": "bronze", "days30": "silver", "days100": "gold", "comeback": "silver", "just151": "bronze", "just493": "silver", "lucky777": "silver", "miss404": "silver", "correct1025": "gold", "daily100": "silver", "daily300": "gold", "wrongStreak5": "bronze", "revenge": "bronze", "revenge50": "silver", "nemesis": "bronze", "familiar": "bronze", "familiar30": "silver", "quick10": "silver", "kishikaisei": "silver", "pikachu": "bronze", "magikarp": "bronze", "ditto": "bronze", "eeveelution": "silver", "kantoStarters": "bronze", "birds": "silver", "mewAndMewtwo": "silver", "palindrome": "bronze", "shortName": "bronze", "longName": "bronze", "zoromeDex": "gold", "alphaOmega": "silver", "bigHP": "silver", "speedster": "silver", "bst600": "silver", "smallStep": "bronze", "balanced": "silver", "zukanFav": "bronze", "zukan1000": "silver", "zukanAll": "gold", "allModes": "bronze", "allSilver": "silver", "halfway": "silver", "allGold": "gold", "master": "gold", "practice30": "silver"});
Object.assign(ACH_TRIVIA, {
    pokemonDay: { msg: "2月27日は、最初の『ポケットモンスター 赤・緑』が1996年に発売された日だ。この日から、151匹のポケモンを集めて育てて交換する冒険が始まった。", src: "https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mania" },
    joya: { msg: "ミカルゲは108の魂が集まってできたポケモンだ。しかも体重まで108kgで、除夜の鐘でつく煩悩の数と同じになっている。図鑑によると、かなめいしの割れ目につながれているという。", src: "https://www.dittobase.com/brilliant-diamond-shining-pearl/pokedex/spiritomb" },
    halloween: { msg: "ゴースの体は95%が毒ガスでできている。では残りの5%は何かというと、そのガスで命を落とした者たちの魂だといわれている。ハロウィンにぴったりの、ちょっと怖い雑学だ。", src: "https://bulbapedia.bulbagarden.net/wiki/Gastly_%28Pokemon%29" },
    zoromeTime: { msg: "『ルビー・サファイア』の119番道路には、波乗りできる水面が436マスある。そのうちヒンバスが釣れるのはたった6マス。適当に釣り糸を垂らして当たる確率は、およそ73分の1だった。", src: "https://pokemondb.net/pokebase/115873/how-do-you-catch-a-feebas-in-rse" },
    sunday: { msg: "『ハートゴールド・ソウルシルバー』では、カントーのジムバッジを8個集めてからタマムシのゲームフリークを訪ねると、サウンド担当の社員が「GBプレイヤー」をくれる。これを使うと、BGMが昔のゲームボーイ風の音に変わる。", src: "https://bulbapedia.bulbagarden.net/wiki/GAME_FREAK_(Trainer_class)" },
    noon: { msg: "『ウルトラムーン』では、ゲーム内の時間が現実と12時間ずれている。そのため、たそがれのすがたのルガルガンに進化させる時間も、『ウルトラサン』の夕方5時台に対して朝5時台になる。", src: "https://serebii.net/pokemon/lycanroc" },
    midnight: { msg: "日本語版の『クリスタル』には、アンノーンがアルフの遺跡に現れ始めたのは、コガネシティにポケモン通信センターができてからだとほのめかす研究者がいる。アンノーンの出現と通信の電波に、何か関係があるのかもしれない。", src: "https://m.bulbapedia.bulbagarden.net/wiki/Unown_(Pok%C3%A9mon)" },
    days30: { msg: "『ルビー・サファイア』でレジ系の封印を解くには、手持ちの先頭にジーランス、最後にホエルオーを並べる必要があった。そんな指示は点字でしか書かれておらず、根気強く解読した人だけがたどり着けた。", src: "https://ggwpacademy.com/?p=5550" },
    days100: { msg: "初代には「図鑑を完成させるとゲームフリークの人からミュウがもらえる」という有名なうわさがあった。実際にもらえるのは賞状だけで、うわさは真っ赤なうそだった。", src: "https://bulbapedia.bulbagarden.net/wiki/Special:MobileDiff/1129275" },
    comeback: { msg: "『金・銀』は、もともと1997年中に発売される予定だった。しかしより良いゲームにするために延期され、実際に発売されたのは1999年。ファンは2年近くも待たされたのである。", src: "https://lostmediaarchive.fandom.com/wiki/File:Pocket_Monsters_-_Gold_Version_Spaceworld_%2797_Title_Screen.png" },
    just151: { msg: "初代のポケモンは、もともと190匹になる予定だったといわれる。プログラムの中に39個もの「けつばん（MissingNo.）」の枠が残っているのは、その名残だと考えられている。", src: "https://m.bulbapedia.bulbagarden.net/wiki/Special:MobileDiff/2011552" },
    just493: { msg: "『ダイヤモンド・パール』の時点で最後の番号493番だったアルセウス。ところが会うための配布が行われず、多くのプレイヤーは改造ツールを使わない限り、アルセウスを見ることすらできなかった。", src: "https://www.thegamer.com/pokemon-diamond-pearl-things-superfans-know/" },
    lucky777: { msg: "韓国版の『ダイヤモンド・パール』には、ゲームコーナーがない。韓国ではギャンブルが法律で禁止されているため、スロットのある施設が削られたのである。", src: "https://www.thegamer.com/pokemon-diamond-pearl-things-superfans-know/" },
    miss404: { msg: "初代では、内部番号001がサイドンだったせいで、番号が0や152以上のバグポケモンの図鑑を開くと、なぜかサイドンのデータが表示された。存在しないはずのポケモンの正体は、サイドンだったのである。", src: "https://bulbapedia.bulbagarden.net/wiki/Special:MobileDiff/2015315" },
    correct1025: { msg: "ゲームの中で複数の姿を持つポケモンは、アンノーンが最初だった。今ではリージョンフォームなど当たり前になったが、その元祖は文字の形をしたこのポケモンである。", src: "https://bulbapedia.bulbagarden.net/wiki/Unown" },
    daily100: { msg: "色違いが生まれやすくなる「国際孵化」は、海外では Masuda method（増田メソッド）と呼ばれている。ゲームフリークの増田順一の名前にちなんだ呼び名だ。", src: "https://www.thegamer.com/pokemon-diamond-pearl-things-superfans-know/" },
    daily300: { msg: "初代には奇妙なバグがある。はかいこうせんの反動で動けないターンに、相手のしめつける系の技が外れると、はかいこうせんが勝手にもう一度撃たれる。そのときPPが0だと、撃ったあとにPPが63に跳ね上がってしまうのだ。", src: "https://bulbapedia.bulbagarden.net/wiki/Hyperbeam" },
    wrongStreak5: { msg: "初代では、じばくやだいばくはつで自分も相手も同時にひんしになって負けると、目の前が真っ暗になるのに勝利の音楽が流れるという不思議なことが起きた。", src: "https://m.bulbapedia.bulbagarden.net/wiki/Special:MobileDiff/1993655" },
    revenge: { msg: "ヒンバスの6マスを探して119番道路の水面を1マスずつ釣っても、運が悪いと6マスすべてを素通りしてしまう。その確率はおよそ64分の1。あきらめずに釣り直した人だけが報われた。", src: "https://bulbapedia.bulbagarden.net/wiki/Hoenn_Route_119" },
    revenge50: { msg: "シンオウ図鑑を完成させるのに必要なのは、ポケモンを「見る」ことだけで、捕まえる必要はない。シリーズでも珍しい、少しやさしい完成条件である。", src: "https://bulbapedia.bulbagarden.net/wiki/Diploma" },
    nemesis: { msg: "初代の まきつく は、つかまった側が交代して逃げても、新しく出てきたポケモンにそのまま続いた。しかも使う側が消費するPPはたった1。一度つかまると逃げられない、まさに天敵だった。", src: "https://www.smogon.com/articles/moves-left-behind" },
    familiar: { msg: "グルトンの種族値の合計は254。この数字を持つポケモンはグルトンただ一匹だ。2023年のエイプリルフールには、公式がグルトンだけを特集した企画まで行った。", src: "https://m.bulbapedia.bulbagarden.net/wiki/Lechonk_(Pok%C3%A9mon)" },
    familiar30: { msg: "コレクレーには古い言い伝えがある。ある少女をあやつって、宝箱を満たすための999枚のコインを集めさせたというのだ。コインを盗もうとする者からは、命を吸い取るともいわれる。", src: "https://bulbapedia.bulbagarden.net/wiki/gimmighoul" },
    quick10: { msg: "ころがるを最大まで強化して、防御を極限まで下げた最弱のレディバなどに急所で当てると、理論上は641,688,048ものダメージが出るという計算がある。", src: "https://m.bulbapedia.bulbagarden.net/wiki/Special:MobileDiff/1847563" },
    kishikaisei: { msg: "ベロリンガは、ころがるを覚えるとベロベルトに進化できるようになる。技を覚えることが進化のきっかけになる、ちょっと変わった進化の仕方だ。", src: "https://www.pokemondb.net/move/rollout" },
    pikachu: { msg: "アニメの主人公サトシの名前は、ポケモンの生みの親である田尻智（さとし）からとられている。サトシのモデルは、初代の主人公レッドだ。", src: "https://bulbapedia.bulbagarden.net/wiki/History_of_Pok%C3%A9mon" },
    magikarp: { msg: "『金・銀』のいかりのみずうみの赤いギャラドスは、個体値があらかじめ決まっていて、その結果HPの個体値は0になっている。色違いのせいで、個体値まで縛られていたのである。", src: "https://bulbapedia.bulbagarden.net/wiki/The_Red_Gyarados" },
    ditto: { msg: "『ポケモンスタジアム』の図鑑には、ミュウは南アメリカの幻のポケモンだと書かれている。ところがドイツ語版では、なぜか「どこでもない土地」で目撃されたことになっている。", src: "https://bulbapedia.bulbagarden.net/wiki/Mew_" },
    eeveelution: { msg: "リーフィアは『ダイヤモンド・パール』で登場したが、実は『金・銀』の開発中からすでに登場が考えられていた。1997年の体験版のデータに、リーフィアのもとになった姿が残っていたのだ。", src: "https://www.thegamer.com/pokemon-gold-silver-demo-leak-unused-designs-fan-theories-explained/" },
    kantoStarters: { msg: "ポケモンのアイデアのもとになったのは、虫捕りの思い出だけではない。田尻智は特撮『ウルトラセブン』でカプセルから出てくる怪獣たちも大好きで、そこから「カプセルモンスター」という発想が生まれた。", src: "https://glitterberri.com/?p=8214" },
    birds: { msg: "ひこうタイプのポケモンはたくさんいるのに、純粋なひこうタイプ（ひこう単タイプ）は『ブラック・ホワイト』のトルネロスまで1匹もいなかった。", src: "https://AllTheTropes.org/wiki/And_the_Fandom_Rejoiced_(Sugar_Wiki)/Video_Games/Pok%C3%A9mon_Black_and_White" },
    mewAndMewtwo: { msg: "ミュウはほぼすべての技を覚えられるが、例外もある。ボルテッカーのように、特定のポケモン専用の技だけは覚えられない。", src: "https://bulbapedia.bulbagarden.net/wiki/Mew" },
    palindrome: { msg: "アンノーンのうち、「！」と「？」の2つだけは目が半分閉じている。文の終わりに付く記号であることを表しているといわれる。", src: "https://pokemon.fandom.com/wiki/Unown" },
    shortName: { msg: "ポケモンにつけられるニックネームの長さは、昔から英語版では12文字、日本語版では5文字までだった。「SelfDestruct」のように技名が詰めて書かれていたのも、この文字数の制限のためだ。", src: "https://nadwpkmn.blogspot.com/2023/07/character-limits-in-pokemon-games.html" },
    longName: { msg: "ポケモンの英語名には、長いあいだ10文字までという決まりがあった。その壁を初めて越えたのがカロスの Fletchinder（ヒノヤコマ、11文字）で、アローラの Crabominable（ケケンカニ）はついに12文字に達した。11文字の名前を正しく読めたあなたは、この壁の向こう側に立っている。", src: "https://pokemondb.net/pokebase/270377" },
    zoromeDex: { msg: "イッシュ図鑑の番号は000番から300番まで。つまり、イッシュ図鑑にのっているポケモンは300匹ではなく301匹である。", src: "https://pokemondb.net/pokebase/142085/is-something-wrong-with-my-pokedex" },
    alphaOmega: { msg: "番号000が使われているのはビクティニだけではない。『Let's Go! ピカチュウ・イーブイ』や「Pokémon HOME」では、タマゴが000番として扱われている。", src: "https://bulbapedia.bulbagarden.net/wiki/0" },
    bigHP: { msg: "初代では、タウリンなどのドーピングアイテムで上げられる努力値に上限があり、1つの能力につき25600までだった。1個使うごとに2560ずつ増える計算である。", src: "https://bulbapedia.bulbagarden.net/wiki/Effort_Values" },
    speedster: { msg: "ホーホーはいつも片足で立っている。足を入れかえる動きがあまりに速いので、その瞬間を目で見ることはほとんどできないという。", src: "https://veekun.com/dex/pokemon/hoothoot/flavor" },
    bst600: { msg: "シンオウ図鑑は、600族のガブリアスよりあとにも普通のポケモンが続く、初めての地方図鑑だった。伝説でも600族でもないポケモンが、600族の後ろに並んだのである。", src: "https://m.bulbapedia.bulbagarden.net/wiki/Sdex" },
    smallStep: { msg: "トリプルキックの1発目の威力は10。これは、からみつくと並んで、攻撃技の中で最も低い威力だ。ただし2発目、3発目と当たるたびに強くなっていく。", src: "https://bulbapedia.bulbagarden.net/wiki/Triple_Kick" },
    balanced: { msg: "1997年の『金・銀』の体験版では、まだ使われていない新ポケモンの多くが、仮の種族値としてすべて50に設定されていた。", src: "https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Gold_and_Silver_Spaceworld_%2797_demo" },
    zukanFav: { msg: "『ファイアレッド・リーフグリーン』のポケモン図鑑は、その前年に出たゲームボーイアドバンスSPによく似た形をしている。", src: "https://bulbapedia.bulbagarden.net/wiki/User:Dragoness/Pok%C3%A9dex_(archive)" },
    zukan1000: { msg: "カロス図鑑は、セントラル・コースト・マウンテンの3つに分かれている。そして全国図鑑へのアップグレードを受けた、最後の図鑑でもある。", src: "https://bulbapedia.bulbagarden.net/wiki/Pok\u00e9Dex" },
    zukanAll: { msg: "アローラのロトム図鑑は、ロトムが入りこむことを前提に作られた特別な図鑑で、アローラでも珍しい機種だ。これを開発したのは、カロスのジムリーダー、シトロンである。", src: "https://bulbapedia.bulbagarden.net/wiki/Pok\u00e9mon_Dexter" },
    allModes: { msg: "『金・銀』の図鑑には、新しい図鑑順、昔の図鑑順、ABC順、そしてアンノーンを記録するアンノーンモードの4つのモードがあった。", src: "https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9dex_(spin-off_games)" },
    allSilver: { msg: "1997年の『金・銀』の体験版の地図は、日本全体がモデルだった。カントーと関西は、それぞれたった1つの町で表されていた。", src: "https://lavacutcontent.com/?p=2303" },
    halfway: { msg: "『プラチナ』では、ジムの順番が『ダイヤモンド・パール』と変わっている。ヨスガシティのメリッサが、スモモとマキシより前に戦う相手になった。", src: "https://nationaldex.io/guide/pokemon-diamond-pearl-platinum" },
    allGold: { msg: "『金・銀』では、ジムバッジを持っているとそのジムのタイプの技の威力が12.5%上がる。ところがこの効果は、ゲームの中で一度も説明されていない。", src: "https://bulbapedia.bulbagarden.net/wiki/Boulder_Badge" },
    master: { msg: "タマムシシティのゲームフリークが入っている建物は、初代の開発が始まったころに本物のゲームフリークの事務所があった、下北沢の第2鈴木ビルがモデルだといわれる。", src: "https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Journal" },
    practice30: { msg: "ジムバッジは、最初は胸に付けるバッジではなく、服に縫い付けるワッペンのようなデザインで考えられていた。初期の設定画には、その名残が残っている。", src: "https://bulbapedia.bulbagarden.net/wiki/Thunder_Badge" },
});

// ---------------------------------------------------------
// 実践モードの新ルール（日本語なし・10秒サバイバル・60秒タイムアタック・鬼）の実績と称号
// 記録は script_jissen.js が localStorage の jissenStats に保存する
// ---------------------------------------------------------
function jsStat() { try { return JSON.parse(localStorage.getItem("jissenStats") || "{}"); } catch (e) { return {}; } }
const jsCombo = m => ((jsStat().combo || {})[m] || 0);
const jsBest = m => ((jsStat().best || {})[m] || 0);
ACH_LIST.push(
    { key: "noja10", icon: "📖", name: "辞書いらず",
      desc: "実践モード「日本語なし」で10連続正解する", secret: "日本語訳なしで10連続正解。英文がそのまま頭に入ってきている。",
      check: () => jsCombo("noja") >= 10 },
    { key: "noja30", icon: "🗽", name: "ネイティブ級",
      desc: "実践モード「日本語なし」で30連続正解する", secret: "日本語訳なしで30連続。もう英語版の図鑑を普通に読めるレベル。",
      check: () => jsCombo("noja") >= 30 },
    { key: "sec10_10", icon: "⏱️", name: "テッカニンの羽音",
      desc: "「10秒サバイバル」で10連続正解する", secret: "10秒の壁を10回こえた。",
      check: () => jsCombo("sec10") >= 10 },
    { key: "sec10_30", icon: "💨", name: "しんそくの使い手",
      desc: "「10秒サバイバル」で30連続正解する", secret: "10秒以内の正解を30回続けた。速さも正確さも本物。",
      check: () => jsCombo("sec10") >= 30 },
    { key: "ta10", icon: "⌛", name: "時の番人",
      desc: "「60秒タイムアタック」で10問正解する", secret: "60秒で10問。1問6秒のペース。",
      check: () => jsBest("ta60") >= 10 },
    { key: "ta20", icon: "🧬", name: "スピードフォルム",
      desc: "「60秒タイムアタック」で20問正解する", secret: "60秒で20問。1問3秒のペース。",
      check: () => jsBest("ta60") >= 20 },
    { key: "ta30", icon: "⚡", name: "最速の電気",
      desc: "「60秒タイムアタック」で30問正解する", secret: "60秒で30問。1問2秒。もはや人間ばなれした速さ。",
      check: () => jsBest("ta60") >= 30 },
    { key: "oni5", icon: "👹", name: "鬼に金棒",
      desc: "「鬼モード」で5連続正解する", secret: "日本語なし・8秒の鬼モードで5連続。",
      check: () => jsCombo("oni") >= 5 },
    { key: "oni15", icon: "🐉", name: "鬼神",
      desc: "「鬼モード」で15連続正解する", secret: "鬼モードで15連続。このサイトで最難関の称号のひとつ。",
      check: () => jsCombo("oni") >= 15 },
    { key: "fast2s", icon: "🏃", name: "でんこうせっか",
      desc: "実践モードで、問題が出てから2秒以内に正解する", secret: "問題を見た瞬間に答えが出た。",
      check: () => (jsStat().fast || 0) >= 1 },
    { key: "buzzer", icon: "🔔", name: "ギリギリセーフ",
      desc: "時間制限のあるモードで、残り1秒以内に正解する", secret: "時間切れ寸前で正解。心臓に悪い。",
      check: () => (jsStat().buzzer || 0) >= 1 }
);
Object.assign(ACH_TIER, {
    noja10: "bronze", sec10_10: "bronze", ta10: "bronze", fast2s: "bronze", buzzer: "bronze",
    noja30: "silver", sec10_30: "silver", ta20: "silver", oni5: "silver",
    ta30: "gold", oni15: "gold"
});
Object.assign(ACH_TRIVIA, {
    noja10: { msg: "Pokémon という名前は、日本語の「ポケットモンスター」を縮めた言葉だ。英語圏でも Pocket Monsters の略として説明されている。英語版の図鑑を読むときは、この言葉自体が日本生まれだと思い出すと少し楽しい。", src: "https://en.wikipedia.org/wiki/Pok%C3%A9mon" },
    noja30: { msg: "初代『赤・緑』の英語版『Pokémon Red and Blue』が北米で発売されたのは1998年9月。日本での発売から約2年半後のことだ。この英語版で、151匹すべての英語名と英語の図鑑文が初めて作られた。", src: "https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Red_and_Blue_Versions" },
    sec10_10: { msg: "第3世代の対戦では、テッカニンが「バトンタッチ」の起点として大活躍した。特性かそくで毎ターン素早さが上がるので、みがわりを張りながら何ターンか粘り、上がった素早さや攻撃をまとめて後ろの仲間に引き継ぐ。速いだけの虫ポケモンが、チーム全体を加速させる司令塔だったのである。", src: "https://smogon.com/rs/articles/baton_pass" },
    sec10_30: { msg: "「しんそく」の使い手として有名なウインディは、図鑑の分類がなんと「でんせつポケモン」だ。初代から伝説のポケモンと同じ分類を名乗っているが、実際には伝説のポケモンではない。中国の伝説に語られる生き物として図鑑に書かれていることが由来とされる。", src: "https://pokemondb.net/pokedex/arcanine" },
    ta10: { msg: "ディアルガは時間を司る伝説のポケモンだ。シンオウの神話では、ディアルガが生まれたことで時間が動き出したと語られている。60秒を戦い抜いたあなたにふさわしい相手である。", src: "https://bulbapedia.bulbagarden.net/wiki/Dialga_(Pok%C3%A9mon)" },
    ta20: { msg: "第3世代では、デオキシスの姿は入っているソフトで決まっていた。『ルビー・サファイア』ではノーマル、『ファイアレッド』ではアタック、『リーフグリーン』ではディフェンス、『エメラルド』ではスピードフォルムになる。交換で別のソフトに移すと、それだけで姿が変わったのである。", src: "https://bulbapedia.bulbagarden.net/wiki/Deoxys_(Pok%C3%A9mon)" },
    ta30: { msg: "レジエレキの素早さの種族値は200。全ポケモンの中で最も高い数値で、体のほとんどが電気エネルギーでできているとされる。", src: "https://pokemondb.net/pokedex/regieleki" },
    oni5: { msg: "素早さも攻撃も最低クラスのツボツボには、対戦でまさかの攻撃型の使い方がある。技「パワートリック」で攻撃と防御の数値を入れ替えると、全ポケモンでも屈指の防御230がそのまま攻撃力になる。鈍足ゆえに「トリックルーム」の中では先手まで取れるのだ。", src: "https://serebii.net/potw-dp/213.shtml" },
    oni15: { msg: "対戦には「ほろびのうた」と、相手を逃がさない特性「かげふみ」を組み合わせる「ほろびハメ」という戦術がある。相手は交代できないまま3ターン後に倒れ、こちらだけ交代して生き残る。第6世代ではメガゲンガーがかげふみを手に入れ、この戦術で大暴れした。", src: "https://bulbapedia.bulbagarden.net/wiki/Perish_Trap" },
    fast2s: { msg: "対戦には、あえて遅いポケモンを集めて勝つ戦術がある。技「トリックルーム」を使うと、5ターンの間、素早さの低い順に行動するようになる。ふだんは最後に動くような鈍足の重量級が、いきなり先手を取って暴れ出すのだ。速さがすべてではない、というのも対戦の奥深さである。", src: "https://pokemondb.net/move/trick-room" },
    buzzer: { msg: "2014年の世界大会の決勝で、韓国のセジュン・パク選手は、ほとんど使われていなかったパチリスをチームに入れて優勝した。パチリスは「このゆびとまれ」で相手の攻撃を引き受け、バンギラスとボーマンダの強烈な攻撃を受けてもギリギリで耐えきった。この試合は今も対戦史に残る名場面として語り継がれている。", src: "https://upcomer.com/pokemon-worlds-opening-ceremony-references-sejuns-2014-win-with-pachirisu" }
});
