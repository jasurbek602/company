// Detektiv ishlari. Har bir ish:
//  locations[].ev[]  — dalillar (need: ochilishi uchun kerakli dalil yoki bayroq)
//  suspects[].qs[]   — savollar (st: yozib olinadigan ko'rsatma, clue: bloknot, flag: bayroq, need: shart)
//  contra[]          — qarama-qarshiliklar: [a, b] juftligi (ko'rsatma yoki dalil id), flag, insight
//  solution          — aybdor, motiv, usul, hal qiluvchi ko'rsatma (contra ichidagi st)

const ALL = [
  {
    id: "olmos", title: "Muzeydagi olmos", diff: 1, reward: 40, ico: "💎",
    tagline: "Buzilmagan vitrina. O'chirilgan kamera. Yomg'irli tun.",
    intro: [
      "Samarqand tarix muzeyidan \"Ko'k Yulduz\" olmosi 22:00 dan 23:00 gacha bo'lgan oraliqda g'oyib bo'ldi.",
      "Signalizatsiya ishlamagan, vitrina buzilmagan. Kechasi soat 22:10 da kuchli yomg'ir boshlangan.",
      "Sizning vazifangiz: joylarni tinting, xodimlarni so'roq qiling va kim yolg'on gapirayotganini fosh qiling.",
    ],
    locations: [
      { id: "zal", name: "Ko'rgazma zali", ico: "🏛", desc: "Bo'm-bo'sh vitrina, pol yaltiroq.", ev: [
        { id: "vitrina", ico: "🔐", name: "Vitrina", clue: "Vitrina buzilmagan — kalit bilan ochilgan. Ehtiyot kalitlar faqat restavrator Lola va direktor Anvarda." },
        { id: "iz", ico: "👣", name: "Poldagi izlar", clue: "Vitrina yonida ho'l poyabzal izlari: ayollar poyabzali, 37-o'lcham. Demak, o'g'ri yomg'ir boshlangan 22:10 dan keyin kirgan.", time: "22:10+" },
      ] },
      { id: "xavf", name: "Xavfsizlik xonasi", ico: "📹", desc: "Monitorlar va kirish jurnali.", ev: [
        { id: "kamera", ico: "📹", name: "Kamera yozuvlari", clue: "Qorovul Rustam 22:00–23:00 davomida kirish eshigida ko'rinib turibdi. Orqa eshik kamerasi 22:15 da o'chirilgan.", time: "22:15" },
        { id: "pin", ico: "🔢", name: "PIN jurnali", clue: "Orqa eshik kamerasi xodim PIN-kodi bilan o'chirilgan: kod \"L-07\" — restavratsiya bo'limiga tegishli.", time: "22:15" },
      ] },
      { id: "ustaxona", name: "Restavratsiya ustaxonasi", ico: "🎨", desc: "Bo'yoq hidi, ilgichda plashch.", ev: [
        { id: "plashch", ico: "🧥", name: "Ho'l plashch", clue: "Lolaning plashchi va 37-o'lchamli poyabzali hali ham ho'l." },
        { id: "metro", ico: "🎫", name: "Metro kartasi", clue: "Lolaning sumkasidagi karta: 22:05 da muzey yonidagi bekatdan chiqish qayd etilgan.", time: "22:05" },
        { id: "xat", ico: "✉️", name: "Bank xati", clue: "Lolaning stolida: 40 000 $ kredit bo'yicha oxirgi ogohlantirish. Muddat — shu hafta." },
      ] },
      { id: "kabinet", name: "Direktor kabineti", ico: "🗄", desc: "Seyf va oilaviy suratlar.", ev: [
        { id: "seyf", ico: "🗝", name: "Direktor seyfi", clue: "Anvarning ehtiyot kaliti seyfda joyida, seyf jurnali bo'yicha kecha ochilmagan." },
        { id: "foto", ico: "📸", name: "To'y suratlari", clue: "Anvarning telefonida 22:30 dagi suratlar: shahar chetidagi to'yxona. Muzeydan 40 daqiqalik yo'l.", time: "22:30" },
      ] },
    ],
    suspects: [
      { id: "rustam", face: "💂", name: "Rustam", role: "Qorovul", bio: "20 yil muzeyda ishlaydi. Intizomli.", qs: [
        { q: "Smena davomida nima qildingiz?", a: "Kirish eshigida o'tirdim, postdan jilmadim. Kameralar ham ko'rsatadi.", st: "r1" },
        { q: "Orqa eshik kamerasi qanday o'chdi?", a: "Uni faqat xodim PIN-kodi bilan o'chirish mumkin. Menda PIN yo'q.", clue: "Kamerani o'chirish uchun xodim PIN-kodi kerak — qorovulda yo'q." },
        { q: "Biror narsa eshitdingizmi?", a: "Yomg'ir boshlanganidan keyin, taxminan 22:20 da orqa tomonda eshik ovozi eshitildi.", clue: "22:20 atrofida orqa eshik ochilgan.", time: "22:20" },
      ] },
      { id: "lola", face: "👩‍🎨", name: "Lola", role: "Restavrator", bio: "Iqtidorli mutaxassis. Oxirgi paytlarda asabiy.", qs: [
        { q: "Kecha muzeydan qachon ketdingiz?", a: "Soat 21:00 da. Uyga borib, uxladim. Kechqurun ko'chaga umuman chiqmadim.", st: "l1" },
        { q: "Moliyaviy ahvolingiz qanday?", a: "Hammasi joyida. Nega so'rayapsiz?", st: "l2" },
        { q: "Metro kartangiz 22:05 da muzey yonida ishlatilgan.", need: "f_alibi", a: "Men… kartamni kimdir o'g'irlagan bo'lsa kerak!", clue: "Lola metro kartasi haqida ishonarli javob bera olmadi." },
        { q: "Qarzni qanday to'lamoqchi edingiz?", need: "f_debt", a: "Bu sizning ishingiz emas. Advokatimni chaqiring.", clue: "Lola qarzni to'lash manbasini aytishdan bosh tortdi." },
      ] },
      { id: "anvar", face: "👔", name: "Anvar", role: "Direktor", bio: "Muzey direktori, 15 yillik tajriba.", qs: [
        { q: "Kecha qayerda edingiz?", a: "Jiyanimning to'yida, 21:30 dan yarim tungacha. Yuzlab guvoh bor.", st: "a1" },
        { q: "Vitrina kalitlari kimlarda?", a: "Menda va Lolada. Meniki doim seyfda turadi." },
        { q: "\"L-07\" PIN kodi kimniki?", need: "pin", a: "Restavratsiya bo'limi — ya'ni Lolaning shaxsiy kodi.", clue: "\"L-07\" — Lolaning shaxsiy PIN kodi." },
        { q: "Lola haqida nima deysiz?", a: "Iste'dodli. Lekin yaqinda maoshdan oldindan katta pul so'radi — rad etdim.", clue: "Lola direktordan katta pul so'ragan." },
      ] },
    ],
    contra: [
      { a: "l1", b: "metro", flag: "f_alibi", insight: "Lola 21:00 da uyga ketib, ko'chaga chiqmaganini aytdi — lekin 22:05 da muzey yonidagi bekatda bo'lgan." },
      { a: "l1", b: "plashch", flag: "f_alibi", insight: "Lola kechqurun chiqmaganini aytdi, ammo plashchi yomg'irdan ho'l — yomg'ir 22:10 da boshlangan." },
      { a: "l2", b: "xat", flag: "f_debt", insight: "Lola moliyaviy ahvoli yaxshi dedi, lekin uning 40 000 $ qarzi bor va muddat shu hafta tugaydi." },
    ],
    motives: [{ id: "qarz", t: "Katta qarzni to'lash" }, { id: "qasos", t: "Direktordan qasos olish" }, { id: "kolleksiya", t: "Shaxsiy kolleksiya uchun" }, { id: "sugurta", t: "Sug'urta firibgarligi" }],
    methods: [{ id: "kalit", t: "O'z PIN-kodi bilan kamerani o'chirib, ehtiyot kalit bilan vitrinani ochgan" }, { id: "oyna", t: "Derazani sindirib kirgan" }, { id: "qorovul", t: "Qorovulni chalg'itib, eshikdan kirgan" }, { id: "sherik", t: "Ichkaridagi sherik orqali" }],
    solution: { culprit: "lola", motive: "qarz", method: "kalit", key: ["l1", "l2"], mEv: ["xat"], wEv: ["vitrina", "pin"] },
    hints: ["Kim kechqurun qayerda bo'lganini aytdi? Uning so'zlarini dalillar bilan solishtiring.", "Ustaxonadagi buyumlar yomg'ir vaqti bilan bog'liq.", "\"Dalillar taxtasi\"da Lolaning \"21:00 da ketdim\" ko'rsatmasini metro kartasi bilan taqqoslang."],
    epilogue: "Lola qarzdan qutulish uchun olmosni xorijga sotmoqchi bo'lgan. Olmos uning ijaradagi garajidan topildi.",
  },
  {
    id: "choy", title: "Choyxonadagi zahar", diff: 2, reward: 60, ico: "☕",
    tagline: "Bir piyola choy. Uch gumonlanuvchi. Bitta meros.",
    intro: [
      "Tadbirkor Davron Karimov Toshkentdagi choyxonada choy ichgandan so'ng zaharlandi. Hayoti xavf ostidan chiqdi.",
      "Ekspertiza: piyolada digitalis — kuchli yurak dorisi topilgan.",
      "Stolda u bilan hamkori Sherzod o'tirgan, choyni ofitsiant Ilhom olib kelgan, jiyani Bobur ham o'sha kuni choyxonada bo'lgan.",
    ],
    locations: [
      { id: "stol", name: "Davronning stoli", ico: "🍽", desc: "To'kilgan choy, ag'darilgan piyola.", ev: [
        { id: "choynak", ico: "🍵", name: "Choynak", clue: "Choynakda zahar yo'q — zahar faqat piyolaga solingan." },
        { id: "guvoh", ico: "🧓", name: "Qo'shni stoldagi guvoh", clue: "Guvoh: \"Ofitsiant piyolani olib keldi, Davron darhol ichdi. Sherzod piyolaga tegmadi.\"" },
      ] },
      { id: "peshtaxta", name: "Peshtaxta", ico: "🧾", desc: "Patnislar, kassa, burchakda kamera.", ev: [
        { id: "cctv", ico: "📹", name: "Peshtaxta kamerasi", clue: "13:42 da Ilhom choy quyilgan patnisni peshtaxtada qoldirib, telefonga javob berdi. 13:43 da Bobur peshtaxta yonida 20 soniya to'xtadi.", time: "13:42" },
        { id: "chek", ico: "🧾", name: "Buyurtma cheki", clue: "Davronning buyurtmasi: 13:40 da qabul qilingan, 13:45 da yetkazilgan.", time: "13:45" },
      ] },
      { id: "yolak", name: "Orqa yo'lak", ico: "🚪", desc: "Hojatxona va axlat qutilari.", ev: [
        { id: "flakon", ico: "💊", name: "Bo'sh flakon", need: "f_counter", lock: "Kim qayerga borganini aniqlamay turib, bu yerda nimani qidirasiz?", clue: "Axlat qutisida bo'sh digitalis flakoni. Retsept — Boburning buvisi nomiga." },
      ] },
      { id: "advokat", name: "Advokat idorasi", ico: "⚖", desc: "Davronning hujjatlari.", ev: [
        { id: "vasiyat", ico: "📜", name: "Vasiyatnoma", clue: "Davron kelasi dushanba vasiyatni o'zgartirmoqchi edi. Hozircha asosiy merosxo'r — jiyani Bobur." },
        { id: "nizo", ico: "📑", name: "Shartnoma nizosi", clue: "Sherzod va Davron o'rtasida 200 mln so'mlik nizo bor — sudgacha yetmagan." },
      ] },
    ],
    suspects: [
      { id: "sherzod", face: "🧔", name: "Sherzod", role: "Hamkor", bio: "Biznes hamkori. Nizolar bor.", qs: [
        { q: "Davron bilan munosabatingiz?", a: "Nizolarimiz bor, yashirmayman. Lekin bunday ish qilmayman." },
        { q: "Piyolaga tegdingizmi?", a: "Yo'q. Ofitsiant keltirdi, Davron darhol ichdi.", st: "s1" },
        { q: "Digitalis ichasizmi?", a: "Yuragim sog'lom, hech qanday dori ichmayman." },
      ] },
      { id: "ilhom", face: "🤵", name: "Ilhom", role: "Ofitsiant", bio: "Yosh ofitsiant, birinchi yil ishlayapti.", qs: [
        { q: "Choyni qanday olib keldingiz?", a: "Quydim-u, darhol olib bordim. Bir soniya ham qoldirmadim!", st: "i1" },
        { q: "Patnisni nega qoldirdingiz?", need: "f_tray", a: "Xo'jayin qo'ng'iroq qildi… ikki daqiqa. Kechirasiz! O'sha payt Davron akaning jiyani yonimdan o'tdi.", clue: "Ilhom patnisni 2 daqiqa qarovsiz qoldirganini tan oldi; o'sha payt Bobur yonida bo'lgan." },
      ] },
      { id: "bobur", face: "🧑", name: "Bobur", role: "Jiyan", bio: "Talaba. Amakisining yagona merosxo'ri.", qs: [
        { q: "Choyxonada nima qilardingiz?", a: "Amakim bilan gaplashmoqchi edim, u band edi. Ketdim." },
        { q: "Peshtaxta yoniga bordingizmi?", a: "Yo'q, umuman bormaganman. To'g'ri eshikka yurdim.", st: "b1" },
        { q: "Kamera sizni peshtaxtada ko'rsatyapti.", need: "f_counter", a: "Ha… hojatxonaga o'tgandim. Bu jinoyatmi?", clue: "Bobur peshtaxtaga bormaganini aytib yolg'on gapirdi." },
        { q: "Buvingizning dori flakoni axlatda nima qilyapti?", need: "flakon", a: "Bilmayman! Buvim tashlagan bo'lsa kerak.", st: "b2" },
        { q: "Amakingiz vasiyatni o'zgartirmoqchi bo'lganini bilarmidingiz?", need: "vasiyat", a: "Yo'q… Ya'ni, eshitgandim. Lekin bu hech narsani anglatmaydi!", clue: "Bobur vasiyat o'zgarishi haqida bilgan." },
      ] },
    ],
    contra: [
      { a: "i1", b: "cctv", flag: "f_tray", insight: "Ilhom patnisni bir soniya ham qoldirmaganini aytdi, kamera esa uni 2 daqiqa qarovsiz qoldirganini ko'rsatadi." },
      { a: "b1", b: "cctv", flag: "f_counter", insight: "Bobur peshtaxtaga bormaganini aytdi, lekin kamerada u aynan patnis qarovsiz qolgan paytda peshtaxta yonida." },
      { a: "b2", b: "flakon", flag: "f_vial", insight: "Flakon buvisinikida emas, aynan Bobur o'tgan yo'lakdagi axlatda — buvisi choyxonada bo'lmagan." },
    ],
    motives: [{ id: "meros", t: "Vasiyat o'zgarmasidan oldin merosni olish" }, { id: "biznes", t: "Biznes nizosi" }, { id: "rashk", t: "Rashk" }, { id: "tasodif", t: "Tasodifiy xato" }],
    methods: [{ id: "patnis", t: "Patnis qarovsiz qolganda piyolaga dori solgan" }, { id: "choynak", t: "Choynakka zahar qo'shgan" }, { id: "stol", t: "Stolda o'tirib piyolaga solgan" }, { id: "oshxona", t: "Oshxonada tayyorlanish paytida" }],
    solution: { culprit: "bobur", motive: "meros", method: "patnis", key: ["b1", "b2"], mEv: ["vasiyat"], wEv: ["cctv", "flakon"] },
    hints: ["Zahar choynakda emas, piyolada. Demak, piyola qachondir qarovsiz qolgan.", "Peshtaxta kamerasini ofitsiant va jiyan ko'rsatmalari bilan solishtiring.", "Boburning \"bormaganman\" degan so'zini kamera yozuvi bilan taqqoslang."],
    epilogue: "Bobur vasiyat o'zgarishidan qo'rqib, buvisining dorisini piyolaga to'kkan. Flakondagi barmoq izlari unga tegishli chiqdi.",
  },
  {
    id: "qolyozma", title: "Yopiq xonadagi sir", diff: 3, reward: 80, ico: "📚",
    tagline: "Ichkaridan qulflangan eshik. Yo'qolgan roman.",
    intro: [
      "Mashhur yozuvchi Nigora Saidova o'z kabinetida hushsiz holda topildi. Eshik ichkaridan qulflangan, kalit stolda, deraza berk.",
      "Tugallangan yangi romanning yagona qo'lyozmasi yo'qolgan. Nigora soat 15:00 da choy ichgan va uxlab qolgan.",
      "Uyda: kotib Kamron, uy bekasi Saida va mehmon — raqib yozuvchi Farhod.",
    ],
    locations: [
      { id: "kabinet", name: "Kabinet", ico: "📚", desc: "Kitob javonlari, stolda bo'sh papka.", ev: [
        { id: "kalit", ico: "🗝", name: "Kalit", clue: "Kalit halqasida mayda tirnalishlar va qizil ipak tolalari bor." },
        { id: "piyola", ico: "🍵", name: "Choy piyolasi", clue: "Choyda kuchli uyqu dori. Nigora 15:00 da ichgan.", time: "15:00" },
        { id: "eshik", ico: "🚪", name: "Eshik", clue: "Eshik tagida 3 mm tirqish — ingichka ip bemalol o'tadi." },
      ] },
      { id: "oshxona", name: "Oshxona", ico: "🍳", desc: "Choynak hali iliq.", ev: [
        { id: "shakar", ico: "🍬", name: "Shakardon", clue: "Shakardon va choynak toza — dori faqat piyolaga solingan." },
        { id: "chek", ico: "🧾", name: "Bozor cheki", clue: "Saidaning cheki: 15:20 da bozorda xarid qilgan (uydan 15 daqiqa).", time: "15:20" },
      ] },
      { id: "kotib", name: "Kotib xonasi", ico: "🗂", desc: "Papkalar, noutbuk, ilgichda galstuk.", ev: [
        { id: "galstuk", ico: "👔", name: "Qizil ipak galstuk", clue: "Kamronning qizil ipak galstugining chetidan ip sug'urib olingan." },
        { id: "shartnoma", ico: "📄", name: "Mehnat shartnomasi", clue: "Kamronning maoshi 2 yildan beri oshmagan; u Nigoraga keskin norozilik xati yozgan." },
        { id: "noutbuk", ico: "💻", name: "Noutbuk", need: "f_upstairs", lock: "Kotibning kompyuterini tekshirish uchun uning yolg'onini isbotlang.", clue: "Kecha 21:04 da nashriyotga taxallus ostida \"yangi roman\" taklif qilingan xat yuborilgan. Ilova — Nigora romanining birinchi bobi.", time: "21:04" },
      ] },
      { id: "bog", name: "Bog'", ico: "🌳", desc: "Gulzor va skameyka.", ev: [
        { id: "bogbon", ico: "👨‍🌾", name: "Bog'bon", clue: "Bog'bon: \"Farhod 14:30 dan 16:00 gacha bog'da telefonda janjallashib yurdi, uyga kirmadi.\"", time: "14:30" },
      ] },
    ],
    suspects: [
      { id: "kamron", face: "🧑‍💼", name: "Kamron", role: "Kotib", bio: "5 yildan beri kotib. Tartibli, kamgap.", qs: [
        { q: "Soat 15:00 da qayerda edingiz?", a: "Pastda, o'z xonamda hujjatlar bilan. Yuqoriga umuman chiqmadim.", st: "k1" },
        { q: "Choyni kim olib chiqdi?", need: "f_upstairs", a: "Ha… Saida opa patnisni berdi, men olib chiqdim. Esimdan chiqibdi.", clue: "Kamron choyni o'zi olib chiqqanini tan oldi." },
        { q: "Galstugingizdan ip qayerga ketdi?", need: "galstuk", a: "Eshik tutqichiga ilinib qolgandir. Arzimas narsa.", st: "k2" },
        { q: "Nashriyotga qanday roman taklif qildingiz?", need: "noutbuk", a: "…Advokatsiz bir og'iz ham gapirmayman.", clue: "Kamron nashriyot xati haqida gapirishdan bosh tortdi." },
        { q: "Nigora bilan munosabatingiz?", a: "Ish beruvchi. Hurmat qilaman, xolos." },
      ] },
      { id: "farhod", face: "🧑‍🏫", name: "Farhod", role: "Raqib yozuvchi", bio: "Nigoraning eski raqibi.", qs: [
        { q: "Nigorani yoqtirmasligingiz rostmi?", a: "Raqobat bor. Lekin men o'g'ri emasman." },
        { q: "15:00–16:00 da qayerda edingiz?", a: "Bog'da, noshirim bilan janjallashdim. Bog'bon ko'rgan." },
        { q: "Uyda kimni ko'rdingiz?", a: "Soat uchlarda kotib zinadan choy patnisi bilan yuqoriga chiqayotgan edi.", st: "f1" },
      ] },
      { id: "saida", face: "👵", name: "Saida", role: "Uy bekasi", bio: "O'tgan hafta ishdan bo'shatilgan.", qs: [
        { q: "Choyni kim tayyorladi?", a: "Men damladim, patnisni Kamronga berdim va bozorga ketdim.", st: "sa1" },
        { q: "Ishdan bo'shatilganingiz rostmi?", a: "Ha. Xafa edim, lekin Nigora opaga yomonlik qilmayman." },
        { q: "Choyga nima qo'shdingiz?", a: "Faqat shakar. Shakardon oshxonada — tekshiring." },
      ] },
    ],
    contra: [
      { a: "k1", b: "f1", flag: "f_upstairs", insight: "Kamron yuqoriga chiqmaganini aytdi, Farhod esa uni patnis bilan zinada ko'rgan." },
      { a: "k1", b: "sa1", flag: "f_upstairs", insight: "Saida patnisni Kamronga berganini aytdi — Kamron yuqoriga chiqmaganini da'vo qilgan." },
      { a: "k2", b: "kalit", flag: "f_thread", insight: "Galstukdan sug'urilgan ip va kalitdagi qizil ipak tolasi mos: kalit eshik tirqishidan ip bilan ichkariga tortilgan." },
    ],
    motives: [{ id: "pul", t: "Qo'lyozmani nashriyotga sotib pul topish" }, { id: "raqobat", t: "Adabiy raqobat" }, { id: "ishdan", t: "Ishdan bo'shatilgani uchun qasos" }, { id: "sevgi", t: "Shaxsiy munosabatlar" }],
    methods: [{ id: "ip", t: "Uyqu dori + eshikni tashqaridan qulflab, kalitni ip bilan ichkariga tortgan" }, { id: "deraza", t: "Deraza orqali chiqib ketgan" }, { id: "ehtiyot", t: "Ehtiyot kalitdan foydalangan" }, { id: "ozi", t: "Nigora o'zi qulflab, qo'lyozmani yashirgan" }],
    solution: { culprit: "kamron", motive: "pul", method: "ip", key: ["k1", "k2"], mEv: ["noutbuk", "shartnoma"], wEv: ["kalit", "eshik", "galstuk"] },
    hints: ["Kim choy patnisini yuqoriga olib chiqqan? Ko'rsatmalarni bir-biri bilan ham solishtirish mumkin.", "Eshik tagidagi tirqish va kalitdagi tolalar — \"yopiq xona\" sirining kaliti.", "Kamronning galstuk haqidagi javobini kalit bilan taqqoslang."],
    epilogue: "Kamron maoshidan norozi bo'lib, romanni o'z nomi bilan sotmoqchi bo'lgan. Qo'lyozma uning mashinasi yukxonasidan topildi.",
  },
  {
    id: "bank", title: "Seyfdagi arvoh", diff: 4, reward: 110, ico: "🏦",
    tagline: "Kod to'g'ri kiritildi. Kamera hech kimni ko'rmadi.",
    intro: [
      "Juma kechasi \"Ipak Yo'li Invest\" bankining seyfidan 1,2 mlrd so'm g'oyib bo'ldi.",
      "Seyf elektron kod bilan, bir urinishda ochilgan. Kod ikki qismdan iborat: birinchisini kassir Dilshod, ikkinchisini menejer Malika biladi.",
      "Kameralar hech kimni yozmagan. Lekin \"arvoh\"lar seyf ochmaydi.",
    ],
    locations: [
      { id: "seyf", name: "Seyf xonasi", ico: "🏦", desc: "Ochiq qolgan po'lat eshik.", ev: [
        { id: "panel", ico: "🔢", name: "Qulf jurnali", clue: "22:40 — to'liq kod bir urinishda to'g'ri kiritilgan. Hech qanday xato urinish yo'q.", time: "22:40" },
        { id: "proshivka", ico: "💾", name: "Qulf proshivkasi", need: "f_it", lock: "Qulfning ichki dasturini kim boshqarishini bilmay turib, bu yerda nimani qidirasiz?", clue: "Proshivka 2 hafta oldin yangilangan. Ichida noma'lum modul: har bir bosilgan tugmani yashirin faylga yozadi (keylogger). Yangilashni Timur imzolagan." },
      ] },
      { id: "server", name: "Server xonasi", ico: "🖥", desc: "Shovqinli serverlar.", ev: [
        { id: "video", ico: "🎞", name: "Kamera serveri", clue: "22:25–22:45 oralig'idagi yozuv: bir xil 5 daqiqalik bo'lak to'rt marta takrorlangan (soat ko'rsatkichi sakraydi).", time: "22:25" },
        { id: "karta", ico: "💳", name: "Kirish kartalari jurnali", clue: "Timurning kartasi: 22:12 da xizmat eshigidan kirish, 23:05 da chiqish.", time: "22:12" },
      ] },
      { id: "post", name: "Qo'riqchi posti", ico: "🛡", desc: "Monitorlar devori.", ev: [
        { id: "jurnal", ico: "📓", name: "Qo'riqchi jurnali", clue: "22:30 — \"monitorlar qotib qoldi, IT ga xabar berildi. Javob: 'tuzatilmoqda'\".", time: "22:30" },
        { id: "shlagbaum", ico: "🚧", name: "Shlagbaum kamerasi", clue: "Malikaning mashinasi 18:30 da chiqib ketgan va qaytmagan.", time: "18:30" },
      ] },
      { id: "kasalxona", name: "Shahar kasalxonasi", ico: "🏥", desc: "Navbatchi qabulxona.", ev: [
        { id: "qabul", ico: "📋", name: "Qabulxona qaydi", clue: "Dilshod 21:50 dan 01:30 gacha bolasi bilan qabulxonada — kamera va navbatchi tasdiqlagan.", time: "21:50" },
      ] },
      { id: "timur", name: "Timurning ish stoli", ico: "💼", desc: "Ikki monitor, qog'ozlar uyumi.", ev: [
        { id: "chipta", ico: "✈", name: "Aviachipta", need: "f_present", lock: "Timurning stolini tintish uchun uning kecha binoda bo'lganini isbotlang.", clue: "Shanba 06:10 dagi Dubay reysiga bir tomonlama chipta. Payshanba kuni sotib olingan." },
        { id: "kazino", ico: "🎰", name: "Bank ko'chirmasi", need: "f_present", lock: "Avval Timurning yolg'onini fosh qiling.", clue: "Timur 3 oyda onlayn kazinoga 300 mln so'm yutqazgan; mikroqarzlar." },
      ] },
    ],
    suspects: [
      { id: "dilshod", face: "👨‍💼", name: "Dilshod", role: "Kassir", bio: "Kodning 1-qismini biladi.", qs: [
        { q: "Kodning birinchi qismini kim biladi?", a: "Faqat men. Lekin xotiram yomon, shuning uchun stikerga yozib qo'yganman…", clue: "Dilshod kodni stikerda saqlagan — lekin ikkinchi qismsiz u foydasiz." },
        { q: "Kecha qayerda edingiz?", a: "O'g'lim isitmalab qoldi, kechasi bilan kasalxonada edim.", st: "d1" },
      ] },
      { id: "malika", face: "👩‍💼", name: "Malika", role: "Menejer", bio: "Kodning 2-qismini biladi.", qs: [
        { q: "Kecha qayerda edingiz?", a: "18:30 da ketdim, uyda edim.", st: "m1" },
        { q: "Kodning ikkinchi qismini kimga aytgansiz?", a: "Hech kimga! Har kuni ertalab panelga o'zim kiritaman." },
        { q: "Panelga kim texnik xizmat ko'rsatadi?", a: "Timur. Ikki hafta oldin qandaydir yangilanish o'rnatdi.", clue: "Ikki hafta oldin Timur qulf paneliga yangilanish o'rnatgan.", flag: "f_it" },
      ] },
      { id: "timur", face: "🧑‍💻", name: "Timur", role: "IT mutaxassisi", bio: "Bank tizimlarini boshqaradi.", qs: [
        { q: "Kecha ofisga qaytdingizmi?", a: "Yo'q. 18:00 da ketdim va qaytmadim. Uyda serial ko'rdim.", st: "t1" },
        { q: "Kameralarda nosozlik bo'ldimi?", a: "Yo'q, hammasi joyida ishladi. Masofadan tekshirdim.", st: "t2" },
        { q: "Proshivkadagi noma'lum modul nima?", need: "proshivka", a: "Bu… diagnostika moduli. Standart narsa.", st: "t3" },
        { q: "Dubayga bir tomonlama chipta?", need: "chipta", a: "Ta'tilga. Qaytish chiptasini keyin olaman.", clue: "Timur bir tomonlama chiptani ishonarsiz tushuntirdi." },
        { q: "Kazino qarzlari haqida?", need: "kazino", a: "Shaxsiy hayotimga aralashmang!", clue: "Timurning katta qarzlari bor — kuchli motiv." },
      ] },
      { id: "akmal", face: "💂‍♂️", name: "Akmal", role: "Qo'riqchi", bio: "Tungi smena qo'riqchisi.", qs: [
        { q: "Tunda nima bo'ldi?", a: "22:30 da monitorlar qotib qoldi. IT ga yozdim — \"tuzatilmoqda\" deb tez javob keldi.", clue: "IT xabarga juda tez javob bergan — go'yo hodisani kutib turgandek." },
        { q: "Timur binoda edimi?", a: "Ko'rmadim. Lekin xizmat eshigidan kirsa, mening postimdan ko'rinmaydi." },
      ] },
    ],
    contra: [
      { a: "t1", b: "karta", flag: "f_present", insight: "Timur qaytmaganini aytdi, lekin uning kartasi 22:12 da xizmat eshigidan kirgan." },
      { a: "t2", b: "video", flag: "f_loop", insight: "Timur kameralar joyida dedi — server esa yozuv takrorlanganini ko'rsatmoqda. Kimdir videoni sun'iy aylantirgan." },
      { a: "t2", b: "jurnal", flag: "f_loop", insight: "Qo'riqchi monitorlar qotganini yozgan, Timur esa nosozlik bo'lmaganini da'vo qildi." },
      { a: "t3", b: "proshivka", flag: "f_keylog", insight: "\"Diagnostika moduli\" aslida keylogger: u Dilshod va Malika kiritgan kodni yig'ib olgan." },
    ],
    motives: [{ id: "qarz", t: "Kazino qarzlarini qoplash" }, { id: "qasos", t: "Rahbariyatdan qasos" }, { id: "buyruq", t: "Kimningdir buyrug'i bilan" }, { id: "sugurta", t: "Sug'urta firibgarligi" }],
    methods: [{ id: "keylogger", t: "Qulfga keylogger o'rnatib kodni yig'gan, kamerani takrorlashga qo'yib seyfni ochgan" }, { id: "stiker", t: "Dilshodning stikeridan kodni ko'chirgan" }, { id: "majbur", t: "Malikadan kodni majburlab olgan" }, { id: "kesish", t: "Seyfni kesib ochgan" }],
    solution: { culprit: "timur", motive: "qarz", method: "keylogger", key: ["t1", "t2", "t3"], mEv: ["kazino"], wEv: ["proshivka", "video"] },
    hints: ["Kod bir urinishda kiritilgan — demak o'g'ri ikkala qismni ham bilgan. Kim ikkala qismga ham \"yetishi\" mumkin?", "Server xonasidagi ikki dalilni IT mutaxassisining so'zlari bilan solishtiring.", "Timurning \"qaytmadim\" degan gapini kirish kartalari jurnali bilan taqqoslang."],
    epilogue: "Timur keylogger orqali kodni yig'ib, videoni aylantirib qo'ygan va seyfni ochgan. Pullar aeroportdagi saqlash kamerasidan topildi.",
  },
  {
    id: "teatr", title: "So'nggi parda", diff: 4, reward: 140, ico: "🎭",
    tagline: "Zahar sharbatda emas. Faqat qadah chetining bir nuqtasida.",
    intro: [
      "Premyera kechasi, 20:40. Ikkinchi pardada bosh rol ijrochisi Shohruh sahnada qadahdan ichdi va yiqildi. Shifokorlar hayotini saqlab qolishdi.",
      "Ekspertiza: zahar qadahdagi sharbatda EMAS — faqat qadah chetining bir nuqtasida.",
      "Gumonlanuvchilar: dublyor Javlon, rejissyor Gulnora, rekvizitor Ravshan va Shohruhning sobiq rafiqasi — aktrisa Sevara.",
    ],
    locations: [
      { id: "sahna", name: "Sahna", ico: "🎭", desc: "Yorug'lik o'chgan, qadah polda.", ev: [
        { id: "qadah", ico: "🍷", name: "Qadah", clue: "Zahar qadah chetida, kichik oltin belgi turgan joyda. Sharbat toza." },
        { id: "belgi", ico: "✒", name: "Oltin belgi", clue: "Shohruh chapaqay — u aynan belgili joydan ichadi. Bu tafsilotni faqat repetitsiyada qatnashganlar biladi." },
      ] },
      { id: "rekvizit", name: "Rekvizit stoli", ico: "🧰", desc: "Sahna ortidagi uzun stol.", ev: [
        { id: "plomba", ico: "🏷", name: "Muhr lentasi", clue: "Ravshan 18:30 da qadahni sharbat bilan to'ldirib, ustidan lenta bilan muhrlagan. Lenta chetini yopmaydi.", time: "18:30" },
        { id: "royxat", ico: "📋", name: "Rekvizit ro'yxati", clue: "Antrakt (19:50–20:05) paytida stoldan buyum olganlar: faqat Sevara (yelpig'ich) — imzosi bor.", time: "19:50" },
      ] },
      { id: "grim", name: "Grimxonalar yo'lagi", ico: "🚪", desc: "Kartali eshiklar qatori.", ev: [
        { id: "karta", ico: "💳", name: "Kirish kartalari", clue: "Javlonning grimxonasi: 19:48 da chiqish, 19:56 da qaytish.", time: "19:48" },
        { id: "qolqop", ico: "🧤", name: "Lateks qo'lqop", need: "f_out", lock: "Avval Javlonning grimxonadan chiqqanini isbotlang.", clue: "Javlonning grimxonasidagi axlatda lateks qo'lqop. Ichki tomonida zahar qoldig'i — grim moddalari yo'q." },
      ] },
      { id: "ofis", name: "Rejissyor kabineti", ico: "🗂", desc: "Afishalar, ssenariylar.", ev: [
        { id: "daftar", ico: "📒", name: "Repetitsiya daftari", clue: "Yozuv: \"Qadah belgisi — chap tomon, Sh. chapaqay\". Imzolar: Gulnora, Javlon (dublyor sifatida)." },
        { id: "email", ico: "📧", name: "Prodyuser xati", clue: "Prodyuserdan Javlonga: \"Agar Shohruh premyerada chiqa olmasa, gastrol shartnomasi sizniki.\"" },
        { id: "sugurta", ico: "📑", name: "Sug'urta polisi", clue: "Spektakl sug'urtalangan, lekin aktyorning kasalligi qoplanmaydi — Gulnora katta zarar ko'radi." },
      ] },
    ],
    suspects: [
      { id: "javlon", face: "🧑‍🎤", name: "Javlon", role: "Dublyor", bio: "Yosh, shuhratparast aktyor.", qs: [
        { q: "Antraktda qayerda edingiz?", a: "Grimxonamdan chiqmadim. Matnni takrorlab o'tirdim.", st: "j1" },
        { q: "Shohruh qadahdan qaysi tomondan ichishini bilasizmi?", a: "Yo'q, bunday mayda tafsilotlarga e'tibor bermayman.", st: "j2" },
        { q: "Gastrol shartnomasi haqida bilarmidingiz?", need: "email", a: "Bu prodyuserning ishi. Men bilmasdim.", st: "j3" },
        { q: "Grimxonangizdagi qo'lqop?", need: "qolqop", a: "Grim uchun ishlataman!", clue: "Qo'lqopda grim moddasi yo'q, faqat zahar — Javlonning izohi yolg'on." },
      ] },
      { id: "ravshan", face: "🧑‍🔧", name: "Ravshan", role: "Rekvizitor", bio: "Teatrda 30 yil.", qs: [
        { q: "Qadahni qanday tayyorladingiz?", a: "18:30 da sharbat quydim, lenta bilan muhrladim. Chetiga tegmadim." },
        { q: "Antraktda stolni kuzatdingizmi?", a: "Yo'q, dekoratsiyani almashtirdim. Stol 15 daqiqa qarovsiz qoldi.", clue: "Antraktda rekvizit stoli 15 daqiqa qarovsiz qolgan." },
      ] },
      { id: "sevara", face: "👩‍🎤", name: "Sevara", role: "Aktrisa", bio: "Shohruhning sobiq rafiqasi.", qs: [
        { q: "Antraktda rekvizit stoliga bordingizmi?", a: "Ha, yelpig'ichimni oldim, ro'yxatga imzo chekdim. Qadahga tegmadim.", st: "se1" },
        { q: "Shohruh bilan munosabatingiz?", a: "Ajrashganmiz. Yoqtirmayman, lekin men jinoyatchi emasman." },
        { q: "Kimni ko'rdingiz?", a: "Yo'lak oxirida qo'lqop kiygan kimdir — yuzini ko'rmadim, lekin dublyor kostyumida edi.", clue: "Antraktda dublyor kostyumidagi qo'lqopli odam rekvizit stoli tomon yurgan." },
      ] },
      { id: "gulnora", face: "👩‍🏫", name: "Gulnora", role: "Rejissyor", bio: "Talabchan, premyeraga hammasini tikkan.", qs: [
        { q: "Shohruh spektakldan ketmoqchi edimi?", a: "Ha, mavsumdan keyin. Lekin usiz premyera — men uchun moliyaviy halokat." },
        { q: "Qadah belgisini kim biladi?", a: "Repetitsiyada qatnashganlar: men, Shohruh va dublyor Javlon.", clue: "Belgini faqat Gulnora, Shohruh va Javlon bilgan." },
      ] },
    ],
    contra: [
      { a: "j1", b: "karta", flag: "f_out", insight: "Javlon grimxonadan chiqmaganini aytdi, lekin kartasi 19:48–19:56 da chiqib-kirganini ko'rsatadi." },
      { a: "j2", b: "daftar", flag: "f_knew", insight: "Javlon belgi haqida bilmasligini aytdi, lekin repetitsiya daftarida aynan shu yozuv ostida uning imzosi bor." },
      { a: "j3", b: "email", flag: "f_motive", insight: "Javlon shartnomani bilmaganini aytdi — prodyuser xati bevosita unga yozilgan." },
    ],
    motives: [{ id: "rol", t: "Bosh rol va gastrol shartnomasi" }, { id: "rashk", t: "Rashk va eski adovat" }, { id: "sugurta", t: "Sug'urta puli" }, { id: "qasos", t: "Kasbiy qasos" }],
    methods: [{ id: "chet", t: "Qo'lqopda zaharni qadah chetidagi belgili joyga surtgan" }, { id: "sharbat", t: "Sharbatga zahar qo'shgan" }, { id: "grim", t: "Grimga zahar qo'shgan" }, { id: "pora", t: "Rekvizitorni pora bilan yollagan" }],
    solution: { culprit: "javlon", motive: "rol", method: "chet", key: ["j1", "j2", "j3"], mEv: ["email"], wEv: ["qadah", "belgi", "qolqop"] },
    hints: ["Zahar aynan belgili joyda — demak jinoyatchi Shohruh qayerdan ichishini bilgan.", "Grimxona kirish kartalarini dublyorning so'zlari bilan solishtiring.", "Repetitsiya daftari kimning \"bilmayman\" degan gapini rad etadi?"],
    epilogue: "Javlon bosh rol va gastrol uchun Shohruhni sahnadan chetlatmoqchi bo'lgan. Zahar sotib olingan dorixona kvitansiyasi uning mashinasidan topildi.",
  },
  {
    id: "poyezd", title: "Shimoliy ekspress", diff: 5, reward: 200, ico: "🚂",
    tagline: "Qulflangan kupe. Qorli perron. Ikki tomonlama o'yin.",
    intro: [
      "Toshkent–Nukus tungi poyezdi. 01:40 da kolleksioner Ergash Nurmatov 7-kupeda hushsiz topildi. 600 yillik \"Kitob ul-Hikmat\" qo'lyozmasi yo'qolgan.",
      "Kupe eshigi ichkaridan qulflangan edi. Poyezd 01:10–01:20 da Navoiy bekatida to'xtagan. Tashqarida qor yog'yapti.",
      "Vagonda: shifokor Hamid, jurnalist Madina, talaba Sanjar, kolleksioner yordamchisi Oysha va provodnik Bahrom.",
    ],
    locations: [
      { id: "kupe7", name: "7-kupe", ico: "🚪", desc: "Ochiq chamadon, bo'sh quti.", ev: [
        { id: "xlor", ico: "🧪", name: "Ro'molcha", clue: "Polda ro'molcha — xloroform qoldig'i. Ergash hushidan ketkazilgan." },
        { id: "qulf", ico: "🔒", name: "Eshik qulfi", clue: "Eshikni provodnikning universal kaliti bilan tashqaridan ham qulflash mumkin." },
        { id: "stakan", ico: "☕", name: "Choy stakani", clue: "00:50 da Oysha olib kirgan choy — toza, hech qanday modda yo'q.", time: "00:50" },
      ] },
      { id: "provodnik", name: "Provodnik xonasi", ico: "🛎", desc: "Kalitlar ilgagi, samovar.", ev: [
        { id: "ilgak", ico: "🗝", name: "Kalit ilgagi", clue: "Kondensat izi: universal kalit ilgakda bir muddat bo'lmagan va 01:40 dan keyin qaytarilgan." },
        { id: "royxat", ico: "📓", name: "Yo'lovchilar ro'yxati", clue: "5-kupe — Oysha, 6 — Hamid (shifokor), 8 — Madina, 9 — Sanjar." },
      ] },
      { id: "perron", name: "Navoiy perroni", ico: "❄", desc: "Qorli perron, yolg'iz sotuvchi.", ev: [
        { id: "sotuvchi", ico: "🧕", name: "Perron sotuvchisi", clue: "01:15 da kulrang paltoli erkak vagondan tushib, kulrang \"Nexia\"dagi odamga quti uzatdi va qaytib chiqdi.", time: "01:15" },
        { id: "izlar", ico: "👣", name: "Qordagi izlar", clue: "Vagon zinasidan faqat bitta odam tushib, qaytib chiqqan — erkaklar botinkasi, 43-o'lcham." },
      ] },
      { id: "yolak", name: "Vagon yo'lagi", ico: "🛤", desc: "Ilgichlar, tor yo'lak.", ev: [
        { id: "palto", ico: "🧥", name: "Kulrang palto", clue: "Ilgichda kulrang palto: yelkalarida hali erimagan qor uchqunlari (01:25). Cho'ntagida 6-kupe chiptasi.", time: "01:25" },
      ] },
      { id: "kupe6", name: "6-kupe (shifokor)", ico: "🧳", desc: "Tartibli, tibbiyot sumkasi.", ev: [
        { id: "sumka", ico: "💼", name: "Tibbiyot sumkasi", need: "f_coat", lock: "Shifokorning kupesini tintish uchun uning yolg'onini isbotlang.", clue: "Xloroform shishasi yarim bo'sh. Zamonaviy tibbiyotda u deyarli qo'llanilmaydi. Botinkalar — 43-o'lcham, ho'l." },
        { id: "telefon", ico: "📱", name: "Telefon xabari", need: "f_coat", lock: "Asos kerak.", clue: "Xabar (00:12): \"Navoiy, 01:15, kulrang Nexia. Qolgan yarmi Dubayda.\"", time: "00:12" },
      ] },
      { id: "kupe8", name: "8-kupe (jurnalist)", ico: "📰", desc: "Noutbuk, qog'ozlar.", ev: [
        { id: "bloknot", ico: "📝", name: "Madinaning bloknoti", clue: "\"Ergash qo'lyozmani yashirincha xorijlik xaridorga sotmoqchi. Vositachi — shifokor deb tanishtirilgan odam.\"" },
      ] },
    ],
    suspects: [
      { id: "hamid", face: "👨‍⚕️", name: "Hamid", role: "Shifokor", bio: "Xushmuomala, birinchi yordamni u ko'rsatgan.", qs: [
        { q: "01:00–01:40 da nima qildingiz?", a: "00:30 dan uxlab yotgandim. Shovqindan uyg'onib, birinchi yordam ko'rsatdim.", st: "h1" },
        { q: "Navoiyda poyezddan tushdingizmi?", a: "Yo'q. Aytdim-ku, uxlab yotgandim.", st: "h2" },
        { q: "Kulrang palto kimniki?", need: "palto", a: "…Meniki. Kecha Toshkentda qor yoqqan edi, shundan bo'lsa kerak.", st: "h3" },
        { q: "Xloroform nega sumkangizda?", need: "sumka", a: "Shifokorman, kerak bo'lib qoladi.", clue: "Hamid xloroformni ishonarsiz tushuntirdi." },
        { q: "\"Navoiy, 01:15, kulrang Nexia\" — bu nima?", need: "telefon", a: "…Advokatsiz gaplashmayman.", clue: "Hamid perrondagi uchrashuv haqida javob bermadi." },
      ] },
      { id: "bahrom", face: "🧑‍✈️", name: "Bahrom", role: "Provodnik", bio: "Vagon provodnigi, 12 yillik tajriba.", qs: [
        { q: "Universal kalit kimda edi?", a: "Faqat menda. Hech kimga bermadim.", st: "b1" },
        { q: "Kalitni kimgadir berdingizmi? Rostini ayting.", need: "f_keyq", a: "Ha… 01:30 da shifokor \"yo'lovchiga yordam kerak\" deb so'radi, berdim. Keyin qaytardi. Qo'rqib aytmadim.", st: "b2" },
        { q: "Navoiyda kim tushdi?", a: "Bilmayman, men boshqa vagonda chipta tekshirayotgandim." },
      ] },
      { id: "oysha", face: "👩‍💼", name: "Oysha", role: "Yordamchi", bio: "Ergashning shaxsiy yordamchisi.", qs: [
        { q: "Ergashni oxirgi marta qachon ko'rdingiz?", a: "00:50 da choy olib kirdim. U qo'lyozmani o'qiyotgan edi.", clue: "Ergash 00:50 da sog' bo'lgan.", time: "00:50" },
        { q: "Qo'lyozma kimga sotilmoqchi edi?", a: "Hech kimga! Ergash aka uni muzeyga sovg'a qilmoqchi edi.", st: "o1" },
        { q: "Ergash sotmoqchi bo'lganini yashirdingiz. Nega?", need: "f_oysha", a: "U iltimos qilgandi… Xaridor bilan muzokarani \"shifokor\" deb tanishtirilgan odam olib borardi. Men uni poyezdda ko'rib, hayron qoldim.", clue: "Vositachi — o'zini shifokor deb tanishtirgan odam. U poyezdda edi." },
      ] },
      { id: "madina", face: "👩‍💻", name: "Madina", role: "Jurnalist", bio: "Tergov jurnalisti.", qs: [
        { q: "Nega Ergash haqida yozyapsiz?", a: "Qo'lyozma xorijga sotilishi haqida mish-mish bor. Bu milliy boylik!" },
        { q: "01:15 da qayerda edingiz?", a: "Kupemda yozayotgandim. Derazadan perronda kulrang paltoli odamni ko'rdim — yuzi ko'rinmadi.", clue: "Madina ham perronda kulrang paltoli odamni ko'rgan." },
      ] },
      { id: "sanjar", face: "🧑‍🎓", name: "Sanjar", role: "Talaba", bio: "Kechqurun Ergash bilan janjallashgan.", qs: [
        { q: "Ergash bilan nega janjallashdingiz?", a: "Musiqam baland deb shikoyat qildi. Shu xolos." },
        { q: "Kechasi nima qildingiz?", a: "Quloqchinda o'yin o'ynadim. Hech narsa eshitmadim. Oyog'im 40-o'lcham, agar so'rasangiz." },
      ] },
    ],
    contra: [
      { a: "h2", b: "palto", flag: "f_coat", insight: "Hamid poyezddan tushmaganini aytdi, lekin uning paltosida 01:25 da hali erimagan qor bor — u Navoiy perronida bo'lgan." },
      { a: "h3", b: "palto", flag: "f_coat", insight: "Kechagi Toshkent qori issiq vagonda soatlar oldin erib ketgan bo'lardi — qor yangi." },
      { a: "b1", b: "ilgak", flag: "f_keyq", insight: "Provodnik kalit hech kimga berilmaganini aytdi, lekin kalit ilgakda bo'lmagan." },
      { a: "h1", b: "b2", flag: "f_lock", insight: "Hamid uxlab yotganini aytdi, lekin 01:30 da provodnikdan universal kalitni olgan — eshikni tashqaridan qulflash uchun." },
      { a: "o1", b: "bloknot", flag: "f_oysha", insight: "Oysha qo'lyozma sovg'a qilinmoqchi edi dedi, jurnalist esa uning yashirin sotilayotganini aniqlagan." },
    ],
    motives: [{ id: "pul", t: "Qo'lyozmani xorijlik xaridorga sotish" }, { id: "qasos", t: "Ergashdan shaxsiy qasos" }, { id: "ilm", t: "Ilmiy qiziqish" }, { id: "sugurta", t: "Sug'urta firibgarligi" }],
    methods: [{ id: "xlor", t: "Xloroform bilan hushdan ketkazib, qo'lyozmani Navoiyda sherigiga berib, kalit bilan eshikni tashqaridan qulflagan" }, { id: "deraza", t: "Qo'lyozmani derazadan tashlab yuborgan" }, { id: "choy", t: "Choyga dori solib, qo'lyozmani yashirgan" }, { id: "sherik", t: "Talaba bilan til biriktirgan" }],
    solution: { culprit: "hamid", motive: "pul", method: "xlor", key: ["h1", "h2", "h3"], mEv: ["telefon", "bloknot"], wEv: ["xlor", "sumka", "ilgak"] },
    hints: ["Vagondan faqat bitta odam tushib, qaytgan. Kimning kiyimida yangi qor bor?", "Provodnikning kalit haqidagi so'zlarini kalit ilgagi bilan taqqoslang — keyin uni qayta so'roq qiling.", "Hamidning \"tushmadim\" degan gapini yo'lakdagi palto bilan solishtiring."],
    epilogue: "\"Shifokor\" Hamid aslida qora bozor vositachisi edi. U Ergashni xloroform bilan hushdan ketkazib, qo'lyozmani Navoiyda sherigiga uzatgan, so'ng provodnik kaliti bilan eshikni tashqaridan qulflagan. Kulrang Nexia Buxoro yo'lida to'xtatildi — qo'lyozma qutida edi.",
  },
  {
    id: "tort", title: "Yo'qolgan tort", diff: 1, reward: 30, ico: "🎂",
    tagline: "Tug'ilgan kun. Shokoladli tort. Ochiq deraza.",
    intro: [
      "Bugun Akbarning tug'ilgan kuni! Soat 19:00 da mehmonlar kelishi kerak edi, lekin 18:45 da oshxonadagi katta shokoladli tort g'oyib bo'ldi.",
      "Uyda Akbar va opasi Nilufar bor edi. Qo'shni bola Temur esa tez-tez mehmonga kirib turadi.",
      "Tortni kim olib ketdi? Izlarni toping!",
    ],
    locations: [
      { id: "oshxona", name: "Oshxona", ico: "🍳", desc: "Stol ustida bo'sh likopcha.", ev: [
        { id: "likop", ico: "🍽", name: "Bo'sh likopcha", clue: "Likopcha atrofida shokolad uvoqlari va kichkina barmoq izlari bor." },
        { id: "deraza", ico: "🪟", name: "Ochiq deraza", clue: "Oshxona derazasi ochiq, tagida hovli tomonda stul turibdi — kimdir derazadan chiqqan.", time: "18:40" },
      ] },
      { id: "hovli", name: "Hovli", ico: "🌳", desc: "Gulzor va axlat qutisi.", ev: [
        { id: "iz", ico: "👣", name: "Shokoladli izlar", clue: "Hovlida shokoladli krossovka izlari — 35-o'lcham. Izlar Temurlarning darvozasi tomon ketgan." },
        { id: "kepka", ico: "🧢", name: "Sport kepkasi", clue: "Axlat qutisi yonida \"TEMUR\" deb yozilgan kepka, ustida shokolad dog'i." },
      ] },
    ],
    suspects: [
      { id: "akbar", face: "👦", name: "Akbar", role: "Tug'ilgan kun egasi", bio: "10 yosh, shirinlikni yaxshi ko'radi.", qs: [
        { q: "18:40 da nima qilayotgan eding?", a: "Xonamda sovg'a uchun uyimni yig'ishtirardim. Tortni tushdan beri ko'rmadim!" },
        { q: "Oyog'ing nechanchi o'lcham?", a: "32-o'lcham. Opam yangi krossovka olib berdi.", clue: "Akbarning oyog'i 32-o'lcham — izlar unga mos emas." },
      ] },
      { id: "nilufar", face: "👧", name: "Nilufar", role: "Opa", bio: "14 yosh, mehmonlarni kutib olishga tayyorlanyapti.", qs: [
        { q: "Oshxonaga kirdingmi?", a: "Yo'q, mehmonxonada sharlarni puflayotgan edim." },
        { q: "Biror narsa ko'rdingmi?", a: "Ha! 18:40 da derazadan sport kepkali bolani ko'rdim — hovlidan yugurib ketdi.", clue: "18:40 da sport kepkali bola hovlidan yugurib ketgan.", time: "18:40" },
      ] },
      { id: "temur", face: "🧒", name: "Temur", role: "Qo'shni bola", bio: "11 yosh, shokoladga hech qachon \"yo'q\" demaydi.", qs: [
        { q: "Kechqurun qayerda eding?", a: "Uyda multfilm ko'rdim. Hovliga umuman chiqmadim!", st: "t1" },
        { q: "Kepkangni qayerga qo'yding?", a: "Kepkam... u uyda bo'lsa kerak. Men uni bugun kiymadim.", st: "t2" },
        { q: "Qo'lingdagi shokolad dog'i nima?", need: "f_temur", a: "Mayli, aytaman… Tort juda chiroyli edi. Bir bo'lagini yemoqchi edim, keyin… ko'proq yeb qo'ydim.", clue: "Temur tortdan yeganini tan oldi!" },
      ] },
    ],
    contra: [
      { a: "t1", b: "iz", flag: "f_temur", insight: "Temur hovliga chiqmaganini aytdi, lekin shokoladli izlar aynan uning darvozasi tomon ketgan." },
      { a: "t2", b: "kepka", flag: "f_temur", insight: "Temur kepkani bugun kiymaganini aytdi — lekin kepka shokolad dog'i bilan axlat qutisi yonida yotibdi." },
    ],
    motives: [{ id: "shirin", t: "Shokoladli tortni juda yaxshi ko'rgani" }, { id: "qasos", t: "Akbardan xafa bo'lgani" }, { id: "pul", t: "Tortni sotmoqchi bo'lgani" }],
    methods: [{ id: "deraza", t: "Ochiq derazadan kirib, tortni olib qochgan" }, { id: "eshik", t: "Eshikdan kirib, hech kimga ko'rinmagan" }, { id: "mushuk", t: "Mushuk tortni ag'darib yuborgan" }],
    solution: { culprit: "temur", motive: "shirin", method: "deraza", key: ["t1", "t2"], mEv: ["likop", "iz"], wEv: ["deraza", "iz"] },
    hints: ["Izlar qaysi tomonga ketgan?", "Temurning \"hovliga chiqmadim\" degan gapini hovlidagi izlar bilan solishtiring."],
    epilogue: "Temur tortning yarmini yeb qo'ygan ekan. U uzr so'radi, qolganini qaytardi — va Akbar uni baribir tug'ilgan kunga taklif qildi! 🎉",
  },
  {
    id: "rasm", title: "Devordagi mo'ylov", diff: 1, reward: 35, ico: "🎨",
    tagline: "Kimdir direktor portretiga binafsha mo'ylov chizdi!",
    intro: [
      "Dushanba tongi. Maktab hovlisidagi yangi devoriy rasmda direktor portretiga kimdir katta binafsha mo'ylov chizib qo'yibdi!",
      "Bo'yoq maktab ustaxonasidan olingan. Ustaxona kalitini juma kuni bir nechta o'quvchi olgan.",
    ],
    locations: [
      { id: "devor", name: "Maktab devori", ico: "🧱", desc: "Rasm va binafsha mo'ylov.", ev: [
        { id: "boyoq", ico: "🟣", name: "Binafsha bo'yoq", clue: "Mo'ylov binafsha moyli bo'yoq bilan chizilgan — u faqat maktab ustaxonasida bor." },
        { id: "tomchi", ico: "💧", name: "Bo'yoq tomchilari", clue: "Devor tagida binafsha tomchilar va sport krossovkasining izi — tagida yulduzcha naqshi." },
      ] },
      { id: "ustaxona", name: "Ustaxona", ico: "🛠", desc: "Bo'yoqlar javoni.", ev: [
        { id: "jurnal", ico: "📓", name: "Kalit jurnali", clue: "Juma, 17:30 — kalitni Sardor olgan, 18:15 da qaytargan.", time: "17:30" },
        { id: "kross", ico: "👟", name: "Krossovka", clue: "Sport zalida Sardorning krossovkasi: tagida yulduzcha naqshi va binafsha dog'lar." },
      ] },
    ],
    suspects: [
      { id: "sardor", face: "🧑‍🎨", name: "Sardor", role: "Rassom o'quvchi", bio: "Rasm tanlovida 2-o'rin olgan.", qs: [
        { q: "Juma kuni ustaxonaga kirdingmi?", a: "Yo'q, juma kuni umuman maktabda qolmadim.", st: "s1" },
        { q: "Krossovkangdagi binafsha dog' nima?", need: "kross", a: "Bu… eski dog'. Men binafsha bo'yoq ishlatmayman!", st: "s2" },
        { q: "Tanlov natijasi haqida nima deysan?", a: "Direktor mening rasmimni emas, boshqasini tanladi. Adolatsiz!", clue: "Sardor tanlov natijasidan direktorga xafa bo'lgan." },
      ] },
      { id: "malika", face: "👩‍🎓", name: "Malika", role: "Sinf sardori", bio: "A'lochi, tartibni yaxshi ko'radi.", qs: [
        { q: "Juma kuni nima qilding?", a: "17:00 gacha kutubxonada edim, keyin uyga ketdim." },
        { q: "Kimnidir ko'rdingmi?", a: "Ustaxona tomonga Sardor ketayotgan edi, qo'lida katta sumka bor edi." },
      ] },
      { id: "bekzod", face: "🧑", name: "Bekzod", role: "Futbolchi", bio: "Hazilkash.", qs: [
        { q: "Sen hazil qilishni yaxshi ko'rasan-ku?", a: "Ha, lekin men faqat futbolda hazillashaman! Juma kuni musobaqada edim — butun jamoa ko'rgan." },
      ] },
    ],
    contra: [
      { a: "s1", b: "jurnal", flag: "f_sardor", insight: "Sardor juma kuni ustaxonaga kirmaganini aytdi, lekin kalit jurnalida aynan uning ismi bor." },
      { a: "s2", b: "boyoq", flag: "f_sardor", insight: "Sardor binafsha bo'yoq ishlatmasligini aytdi, lekin krossovkasidagi dog' va devordagi bo'yoq bir xil." },
    ],
    motives: [{ id: "tanlov", t: "Rasm tanlovida yutqazgani uchun hazil qilish" }, { id: "pul", t: "Bo'yoqni sotish" }, { id: "dars", t: "Darsdan qochish" }],
    methods: [{ id: "ustaxona", t: "Ustaxonadan bo'yoq olib, kechqurun mo'ylov chizgan" }, { id: "dokon", t: "Do'kondan bo'yoq sotib olgan" }, { id: "kunduzi", t: "Tanaffusda hammaning ko'z oldida chizgan" }],
    solution: { culprit: "sardor", motive: "tanlov", method: "ustaxona", key: ["s1", "s2"], mEv: ["jurnal"], wEv: ["jurnal", "boyoq", "kross"] },
    hints: ["Bo'yoq qayerdan olingan va kalit kimda bo'lgan?", "Sardorning \"ustaxonaga kirmadim\" degan gapini kalit jurnali bilan solishtiring."],
    epilogue: "Sardor uzr so'radi va mo'ylovni o'z qo'li bilan bo'yab tashladi. Direktor esa uning keyingi rasmini maktab kirish qismiga ilishga va'da berdi. 🖼",
  },
  {
    id: "kubok", title: "Kubok qayerda?", diff: 2, reward: 40, ico: "🏆",
    tagline: "Final oldidan chempionlik kubogi yo'qoldi.",
    intro: [
      "Ertaga shahar chempionati finali. Lekin maktabning oltin kubogi shkafdan g'oyib bo'ldi!",
      "Shkaf qulfi buzilmagan. Kalit faqat murabbiy Rustam aka va jamoa sardori — darvozabon Jamshidda bor.",
    ],
    locations: [
      { id: "zal", name: "Sport zali", ico: "🏟", desc: "Bo'sh shkaf, chiroqlar o'chiq.", ev: [
        { id: "shkaf", ico: "🗄", name: "Kubok shkafi", clue: "Shkaf kalit bilan ochilgan, qulf butun. Javonda kubokning chang izi qolgan." },
        { id: "qolqop", ico: "🧤", name: "Darvozabon qo'lqopi", clue: "Shkaf yonida darvozabon qo'lqopi — ichida \"J.\" harfi yozilgan." },
      ] },
      { id: "telefon", name: "Ijtimoiy tarmoq", ico: "📱", desc: "Jamoa a'zolarining sahifalari.", ev: [
        { id: "selfi", ico: "🤳", name: "Kechki selfi", clue: "Kecha 21:10 dagi post: kubok bilan selfi, izoh \"Omad tilsimi! 🍀\". Fonda — Jamshidning xonasidagi plakat.", time: "21:10" },
        { id: "chipta", ico: "🎫", name: "Avtobus chiptasi", clue: "Raqib jamoa sardori Davron kecha 18:00 dan 23:00 gacha boshqa shaharda bo'lgan — chipta va suratlar bor." },
      ] },
    ],
    suspects: [
      { id: "rustam", face: "🧔", name: "Rustam aka", role: "Murabbiy", bio: "Qattiqqo'l, lekin adolatli.", qs: [
        { q: "Kalitingiz qayerda?", a: "Mana, cho'ntagimda. Kecha 18:00 da zalni yopib ketdim, kubok joyida edi.", time: "18:00", clue: "Kubok kecha 18:00 da joyida bo'lgan." },
        { q: "Jamshid haqida nima deysiz?", a: "Ajoyib darvozabon, lekin juda irimchi — finaldan oldin doim \"omad tilsimi\" qidiradi." },
      ] },
      { id: "jamshid", face: "🧤", name: "Jamshid", role: "Darvozabon, sardor", bio: "Irimlarga ishonadi.", qs: [
        { q: "Kecha kubokni ko'rdingmi?", a: "Yo'q, kecha kubokni ko'rmadim ham! Uyda uxladim.", st: "j1" },
        { q: "Kalitingni kimgadir berdingmi?", a: "Hech kimga. Kalit doim menda.", clue: "Ikkinchi kalit faqat Jamshidda." },
        { q: "Qo'lqoping nega shkaf yonida?", need: "qolqop", a: "Uni… mashg'ulotda unutib qoldirgan bo'lsam kerak.", st: "j2" },
      ] },
      { id: "davron", face: "😎", name: "Davron", role: "Raqib jamoa sardori", bio: "Finalda raqib.", qs: [
        { q: "Kubokni sen yashirmadingmi?", a: "Kerak emas! Biz uni finalda yutib olamiz. Kecha boshqa shaharda edim." },
      ] },
    ],
    contra: [
      { a: "j1", b: "selfi", flag: "f_jamshid", insight: "Jamshid kecha kubokni ko'rmaganini aytdi, lekin 21:10 da o'z xonasida kubok bilan selfi joylagan." },
      { a: "j2", b: "shkaf", flag: "f_jamshid", insight: "Jamshid qo'lqopini \"mashg'ulotda unutganini\" aytdi — lekin u aynan kalit bilan ochilgan shkaf yonida topildi, kalit esa faqat unda va murabbiyda." },
    ],
    motives: [{ id: "omad", t: "Finaldan oldin kubokni \"omad tilsimi\" sifatida uyda saqlash" }, { id: "sotish", t: "Kubokni sotish" }, { id: "raqib", t: "Raqib jamoaga yordam berish" }],
    methods: [{ id: "kalit", t: "Sardor kaliti bilan shkafni ochib, uyiga olib ketgan" }, { id: "sindirib", t: "Shkafni sindirib olgan" }, { id: "derazadan", t: "Derazadan kirgan" }],
    solution: { culprit: "jamshid", motive: "omad", method: "kalit", key: ["j1", "j2"], mEv: ["selfi"], wEv: ["shkaf", "qolqop"] },
    hints: ["Shkaf buzilmagan — demak kalit egasi ochgan.", "Jamshidning \"kubokni ko'rmadim\" degan gapini kechki selfi bilan solishtiring."],
    epilogue: "Jamshid kubokni \"omad uchun\" yostig'i ostiga qo'ygan ekan. U kubokni qaytardi — va finalda 3 ta penaltini qaytarib, jamoani chempion qildi! 🥇",
  },
  {
    id: "tutiqush", title: "Gapiruvchi to'tiqush", diff: 2, reward: 45, ico: "🦜",
    tagline: "Hayvonot bog'ining yulduzi — to'tiqush Kesha g'oyib.",
    intro: [
      "Toshkent hayvonot bog'ining eng mashhur qushi — 100 ta so'z biladigan to'tiqush Kesha qafasidan g'oyib bo'ldi.",
      "Qafas buzilmagan, eshigi shunchaki ochilgan. Soat 17:00 da yopilish oldidan uni hamma ko'rgan edi.",
    ],
    locations: [
      { id: "qafas", name: "Qushlar bo'limi", ico: "🪺", desc: "Bo'sh qafas, pat qoldiqlari.", ev: [
        { id: "pista", ico: "🥜", name: "Pista po'chog'i", clue: "Qafas ichida yangi pista po'choqlari. Kesha pistani juda yaxshi ko'radi — lekin bog'da qushlarga pista berilmaydi." },
        { id: "kamera", ico: "📹", name: "Bo'lim kamerasi", clue: "16:50 da qora kepkali, kulrang ko'ylakli odam qafas yonida qo'lida pista bilan turibdi.", time: "16:50" },
      ] },
      { id: "kirish", name: "Kirish darvozasi", ico: "🎟", desc: "Kassa va xavfsizlik posti.", ev: [
        { id: "royxat", ico: "📋", name: "Tashrif ro'yxati", clue: "Kolleksioner Ilyos bugun 3-marta keldi; chiqishda katta sumka bilan — 17:05.", time: "17:05" },
        { id: "sumka", ico: "👜", name: "Ilyosning sumkasi", need: "f_ilyos", lock: "Sumkani tekshirish uchun asos kerak — avval yolg'onini fosh qiling.", clue: "Sumkada: pista paketi, kichik ko'chma qafas va yashil pat." },
      ] },
    ],
    suspects: [
      { id: "hasan", face: "💂", name: "Hasan aka", role: "Qorovul", bio: "20 yil bog'da ishlaydi.", qs: [
        { q: "Qafas eshigini kim ochishi mumkin?", a: "Ilgak oddiy — qo'l bilan ochiladi. Lekin Kesha begonaga yaqinlashmaydi… agar pista bermasa!", clue: "Kesha faqat pista bersa begonaga yaqinlashadi." },
      ] },
      { id: "lobar", face: "👩‍🔬", name: "Lobar", role: "Yangi parvarishchi", bio: "Ikki haftadan beri ishlaydi.", qs: [
        { q: "16:50 da qayerda edingiz?", a: "Pingvinlarni boqayotgan edim — boshqa xodimlar ko'rgan." },
        { q: "Kimdir Kesha bilan qiziqqanmi?", a: "Ha, kulrang ko'ylakli bir kishi uni qancha turishini so'ragandi." },
      ] },
      { id: "ilyos", face: "🧑‍💼", name: "Ilyos", role: "Kolleksioner", bio: "Noyob qushlar yig'adi.", qs: [
        { q: "Bugun qushlar bo'limiga bordingizmi?", a: "Yo'q, men faqat fillarni ko'rdim.", st: "i1" },
        { q: "Pista yeysizmi?", a: "Pista? Umuman yoqtirmayman!", st: "i2" },
      ] },
    ],
    contra: [
      { a: "i1", b: "kamera", flag: "f_ilyos", insight: "Ilyos qushlar bo'limiga bormaganini aytdi, lekin kamera 16:50 da uni qafas yonida qo'lida pista bilan ko'rsatmoqda." },
      { a: "i2", b: "pista", flag: "f_pista", insight: "Ilyos pistani yoqtirmasligini aytdi — qafasdagi yangi pista po'choqlari esa boshqa narsani ko'rsatadi." },
    ],
    motives: [{ id: "kolleksiya", t: "Gapiruvchi to'tiqushni kolleksiyasiga qo'shish" }, { id: "qasos", t: "Bog' rahbariyatidan qasos" }, { id: "ozod", t: "Qushni ozodlikka qo'yib yuborish" }],
    methods: [{ id: "pista", t: "Pista bilan aldab, qafasni ochib, sumkadagi qafasga solgan" }, { id: "tunda", t: "Kechasi devordan oshib kirgan" }, { id: "xodim", t: "Xodim kiyimida kirgan" }],
    solution: { culprit: "ilyos", motive: "kolleksiya", method: "pista", key: ["i1", "i2"], mEv: ["royxat"], wEv: ["pista", "kamera"] },
    hints: ["Kesha begonaga faqat pista bersa yaqinlashadi.", "Ilyosning \"qushlar bo'limiga bormadim\" degan gapini kamera bilan solishtiring."],
    epilogue: "Kesha politsiya bo'limida baland ovozda \"Ilyos — o'g'ri! Pista ber!\" deb qichqirdi. U sog'-salomat bog'ga qaytdi va endi yangi so'z o'rgandi: \"Detektiv!\" 🦜",
  },
  {
    id: "kutubxona", title: "Kutubxonadagi arvoh", diff: 2, reward: 50, ico: "👻",
    tagline: "Har kecha chiroqlar o'chadi. Noyob kitob yo'qoldi.",
    intro: [
      "Eski shahar kutubxonasida bir haftadan beri \"arvoh\" yuribdi: kechasi derazalarda g'alati yorug'lik, ertalab kitoblar sochilgan.",
      "Bugun ertalab 1890-yilgi noyob \"Yulduzlar xaritasi\" kitobi yo'qolgani ma'lum bo'ldi. Xodimlar: \"Bu arvohning ishi!\"",
    ],
    locations: [
      { id: "zal", name: "O'quv zali", ico: "📚", desc: "Sochilgan kitoblar, bo'sh vitrina.", ev: [
        { id: "fonar", ico: "🔦", name: "Ko'k fonar", clue: "Javon ortida ko'k oynali fonar — \"arvoh yorug'i\" shu. Ichida yangi batareya." },
        { id: "chek", ico: "🧾", name: "Do'kon cheki", clue: "Fonar qutisida chek: 3 kun oldin, \"Kamol\" nomidagi chegirma kartasi bilan sotib olingan." },
      ] },
      { id: "post", name: "Qorovul posti", ico: "🛡", desc: "Kirish jurnali.", ev: [
        { id: "jurnal", ico: "📓", name: "Tungi jurnal", clue: "23:10 — xodim kartasi bilan kirish: \"K. Rahimov\" (yordamchi Kamol). 23:40 — chiqish.", time: "23:10" },
        { id: "elon", ico: "💻", name: "Onlayn e'lon", clue: "Bugun ertalab saytda: \"Noyob kitob, 1890-yil, Yulduzlar xaritasi — sotiladi\". Telefon raqami — Kamolniki." },
      ] },
    ],
    suspects: [
      { id: "zuhra", face: "👵", name: "Zuhra opa", role: "Kutubxonachi", bio: "40 yil kutubxonada.", qs: [
        { q: "Arvohga ishonasizmi?", a: "Yo'q, bolam. Lekin kimdir hammani qo'rqitmoqchi." },
        { q: "Noyob kitob kalitini kim biladi?", a: "Men va yordamchim Kamol. U vitrinaning ehtiyot kalitini saqlaydi.", clue: "Vitrina ehtiyot kaliti Kamolda." },
      ] },
      { id: "kamol", face: "🧑‍💼", name: "Kamol", role: "Yordamchi", bio: "Yosh, kompyuterni yaxshi biladi.", qs: [
        { q: "Kechasi kutubxonaga keldingizmi?", a: "Yo'q! Men arvohdan qo'rqaman, kechasi bu yerga umuman kelmayman.", st: "k1" },
        { q: "Noyob kitobni ko'rganmisiz?", a: "Bu kitobni hech qachon ushlamaganman, qanday ko'rinishini ham bilmayman.", st: "k2" },
        { q: "Ko'k fonar kimniki?", need: "fonar", a: "Fonar? Bilmayman… balki arvohnikidir? Ha-ha…", clue: "Kamol fonar haqida asabiy hazil qildi." },
      ] },
      { id: "farida", face: "👩‍🎓", name: "Farida", role: "Doimiy kitobxon", bio: "Astronomiya talabasi.", qs: [
        { q: "Yulduzlar xaritasi kerakmidi?", a: "Ha, diplom ishim uchun! Lekin men uni faqat zalda o'qirdim, ruxsat bilan." },
        { q: "Kechqurun nima qildingiz?", a: "Yotoqxonada edim, xonadoshlarim tasdiqlaydi." },
      ] },
    ],
    contra: [
      { a: "k1", b: "jurnal", flag: "f_kamol", insight: "Kamol kechasi kelmasligini aytdi, lekin uning xodim kartasi 23:10 da kirish uchun ishlatilgan." },
      { a: "k2", b: "elon", flag: "f_elon", insight: "Kamol kitobni hech qachon ushlamaganini aytdi — ertalab esa aynan shu kitob uning raqami bilan sotuvga qo'yilgan." },
    ],
    motives: [{ id: "sotish", t: "Kitobni internetda sotish" }, { id: "qorqitish", t: "Xodimlarni qo'rqitib, ishdan bo'shatish" }, { id: "ilm", t: "Diplom ishi uchun" }],
    methods: [{ id: "arvoh", t: "\"Arvoh\" qilib ko'rsatib, kechasi ehtiyot kalit bilan kitobni olib chiqqan" }, { id: "kunduzi", t: "Kunduzi sumkaga solib chiqqan" }, { id: "deraza", t: "Derazadan tashqariga uzatgan" }],
    solution: { culprit: "kamol", motive: "sotish", method: "arvoh", key: ["k1", "k2"], mEv: ["elon"], wEv: ["fonar", "chek", "jurnal"] },
    hints: ["\"Arvoh yorug'i\" qayerdan keladi? Fonar kim uchun sotib olingan?", "Kamolning \"kechasi kelmayman\" degan gapini tungi jurnal bilan solishtiring."],
    epilogue: "\"Arvoh\" Kamol bo'lib chiqdi! U hammani qo'rqitib, kitobni sotmoqchi edi. Kitob qaytdi, Farida esa diplomini a'loga himoya qildi. 🔭",
  },
  {
    id: "bozor", title: "Qovun rastasidagi sir", diff: 2, reward: 55, ico: "🍈",
    tagline: "Peshin payti kassa qutisi g'oyib. Qovunlar guvoh.",
    intro: [
      "Chorsu bozori, soat 12:00. Qovunfurush Bahodir aka namozga borib kelguncha rastadagi kassa qutisi yo'qoldi.",
      "Atrofda: qo'shni sotuvchi Gulchehra opa, arava bilan yuk tashuvchi Abbos va xaridor Rahim aka.",
    ],
    locations: [
      { id: "rasta", name: "Qovun rastasi", ico: "🍈", desc: "Qovun uyumi, bo'sh stol.", ev: [
        { id: "quti", ico: "📦", name: "Bo'sh kassa qutisi", clue: "Quti qovunlar orasidan bo'sh holda topildi. Qopqog'ida oq un izlari." },
        { id: "kamera", ico: "📹", name: "Bozor kamerasi", clue: "12:05 da yuk aravasi rasta yonida 2 daqiqa to'xtagan. Aravachi yuzini yashirgan.", time: "12:05" },
      ] },
      { id: "nonvoy", name: "Nonvoyxona", ico: "🥖", desc: "Un qoplari, tandir.", ev: [
        { id: "yuk", ico: "📄", name: "Yuk xati", clue: "Bugun 11:30–12:30 da nonvoyxonaga 10 qop un tashilgan. Tashuvchi: Abbos.", time: "11:30" },
        { id: "arava", ico: "🛒", name: "Abbosning aravasi", clue: "Arava tagida yashirilgan qora paket — ichida pullar, unga belangan." },
      ] },
    ],
    suspects: [
      { id: "gulchehra", face: "👩‍🌾", name: "Gulchehra opa", role: "Qo'shni sotuvchi", bio: "Bahodir aka bilan eski raqobat.", qs: [
        { q: "12:00 da nima qildingiz?", a: "Xaridorlarga uzum tortib turdim — bir lahza ham joyimdan jilmadim. Navbat bor edi!" },
        { q: "Biror narsa ko'rdingizmi?", a: "Bir arava o'tdi, aravachi juda shoshib qovunlar orasiga engashdi." },
      ] },
      { id: "abbos", face: "🧑‍🔧", name: "Abbos", role: "Yuk tashuvchi", bio: "Aravasi bilan butun bozorni aylanadi.", qs: [
        { q: "Bugun qovun rastasiga yaqinlashdingizmi?", a: "Yo'q, umuman. Men bugun boshqa qatorda ishladim.", st: "a1" },
        { q: "Bugun nima tashidingiz?", a: "Faqat qovun tashidim. Qo'llarim toza — mana!", st: "a2" },
        { q: "Qarzingiz bormi?", need: "f_abbos", a: "…Ha. Ijara puli uchun qarzdorman. Lekin bu hech narsani anglatmaydi!", clue: "Abbosning ijara qarzi bor." },
      ] },
      { id: "rahim", face: "👴", name: "Rahim aka", role: "Xaridor", bio: "Har kuni qovun oladi.", qs: [
        { q: "Kassa yoniga keldingizmi?", a: "Bahodirni kutib, soyada o'tirdim. Kassaga tegmadim — mana, chekim ham bor." },
      ] },
    ],
    contra: [
      { a: "a1", b: "kamera", flag: "f_abbos", insight: "Abbos qovun rastasiga yaqinlashmaganini aytdi — kamera esa 12:05 da uning aravasini aynan shu yerda ko'rsatadi." },
      { a: "a2", b: "yuk", flag: "f_un", insight: "Abbos faqat qovun tashiganini aytdi, lekin bugun nonvoyxonaga un tashigan — qutidagi un izlari unga ishora qiladi." },
    ],
    motives: [{ id: "qarz", t: "Ijara qarzini to'lash" }, { id: "raqobat", t: "Bozordagi raqobat" }, { id: "hazil", t: "Hazil qilish" }],
    methods: [{ id: "arava", t: "Aravani rasta yoniga to'xtatib, qutini bo'shatgan va pulni arava tagiga yashirgan" }, { id: "xaridor", t: "Xaridor bo'lib kelib olgan" }, { id: "tunda", t: "Kechasi kelgan" }],
    solution: { culprit: "abbos", motive: "qarz", method: "arava", key: ["a1", "a2"], mEv: ["arava"], wEv: ["kamera", "arava", "quti"] },
    hints: ["Qutidagi oq izlar nima? Bugun kim un tashigan?", "Abbosning \"rastaga yaqinlashmadim\" degan gapini kamera bilan solishtiring."],
    epilogue: "Pul arava tagidan topildi. Bahodir aka Abbosni kechirdi va unga doimiy ish taklif qildi: \"Halol ishlasang, qarzing ham uziladi!\" 🍈",
  },
];

// Tartib: oson va qiziqarli ishlardan murakkabiga. 1-ish bepul, qolganlari Premium.
const ORDER = ["olmos", "tort", "rasm", "kubok", "tutiqush", "choy", "kutubxona", "bozor", "qolyozma", "bank", "teatr", "poyezd"];
export const CASES = ORDER.map((id) => ALL.find((c) => c.id === id));
export const FREE_CASES = 1;

export const RANKS = [
  { min: 0, name: "Stajyor", ico: "🔰" },
  { min: 50, name: "Detektiv", ico: "🕵️" },
  { min: 150, name: "Katta detektiv", ico: "🎖" },
  { min: 300, name: "Inspektor", ico: "⭐" },
  { min: 500, name: "Bosh inspektor", ico: "🏅" },
  { min: 750, name: "Afsonaviy tergovchi", ico: "👑" },
];
