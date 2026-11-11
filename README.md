# Company IQ 🧠

Moslashuvchan (adaptiv) IQ test sayti: har bir foydalanuvchiga **noyob savollar**, natija **IRT psixometrik modeli** asosida yosh normasi va ishonch oralig'i bilan. Reyting, Premium a'zolar bo'limi, miya trenajyorlari va to'liq Detektiv o'yini.

**Demo:** https://jasurbek602.github.io/company/ · **Ishlash tartibi:** [QOLLANMA.md](QOLLANMA.md)

- **Frontend:** toza HTML/CSS/JS (ES modullar), build kerak emas — GitHub Pages / Vercel / istalgan statik hosting
- **Ma'lumotlar:** Supabase ulansa — umumiy reyting bazada; ulanmasa — hammasi qurilmada (localStorage), sayt baribir to'liq ishlaydi
- **Premium:** admin bergan login/parol (parollar faqat SHA-256 xesh ko'rinishida saqlanadi)

## Imkoniyatlar

| Bo'lim | Tavsif |
|---|---|
| **IQ test** | 36 savol, 30 daqiqa, 7 qiyinlik darajasi, 11 savol turi: Raven matritsalari (shakl qoidalari + XOR/AND/OR mantiqiy amallar), ko'p qatlamli son ketma-ketliklari, sonli jadvallar, analogiyalar, sillogizmlar, rostgo'y/yolg'onchi jumboqlari, o'rindiq masalalari (yagona yechim avtomatik tekshiriladi), shifrlar, shakl aylantirish, kub yoyilmasi, qog'oz buklash. |
| **Adaptivlik** | Har javobdan keyin qobiliyat (θ) qayta baholanadi va keyingi savol shu darajadan beriladi. |
| **Baholash** | 3PL IRT modeli, EAP baho → IQ = 100 + 15·θ, yosh normasi, 95% ishonch oralig'i, persentil. Simulyatsiyada xato ≈ ±4 IQ. |
| **Ism + yosh** | Test oldidan kiritiladi, natija reytingga tushadi. |
| **Reyting** | Bosh sahifada TOP-10, alohida sahifada yosh guruhlari bo'yicha filtr. |
| **Bepul tahlil** | 5 band: umumiy natija, kuchli/zaif yo'nalish, ishlash uslubi, murakkab savollar. |
| **Premium** | Cheksiz test, chuqur tahlil (4 kognitiv indeks, reja, kasblar), 7 trenajyor, 6 detektiv ishi. |
| **Trenajyorlar** | Dual N-Back (adaptiv daraja), IQ trener (cheksiz, adaptiv), Aylantirish, Schulte, Xotira panjarasi, Stroop, Tezkor hisob. Rekordlar va kunlik seriya. |
| **Detektiv** | 6 ta ish (★1–★5): joylarni tintish, so'roq, **Dalillar taxtasi**da ko'rsatma va dalillarni taqqoslab yolg'onni fosh qilish (yangi savol va joylarni ochadi), avtomatik xronologiya, maslahatlar, ayblov (aybdor + motiv + usul + hal qiluvchi yolg'on), tokenlar va unvonlar. Progress avtomatik saqlanadi. |

> Bu onlayn baholash; klinik IQ testi (WAIS, Raven SPM) o'rnini bosmaydi. Savol qiyinlik parametrlari ekspert baholashi asosida — haqiqiy ma'lumotlar to'plangach kalibrlash tavsiya etiladi (`js/scoring.js`).

## Lokal ishga tushirish
```bash
npm run dev
```
http://localhost:5173 — hech qanday kalitsiz ishlaydi.

Savollar generatorini tekshirish (11 200 ta savol):
```bash
npm run check
```

## Premium foydalanuvchilar (admin)

Parollar hech qachon repozitoriyga tushmaydi: `data/premium-users.json` da faqat tuz (salt) va SHA-256 xesh saqlanadi, ochiq parollar `secrets/credentials.txt` ga yoziladi (gitignore qilingan).

```bash
npm run admin                                # admin parolini yaratish/yangilash
npm run add-premium -- ali2026 "Ali Valiyev" # yangi Premium a'zo (parol secrets/credentials.txt da)
node scripts/premium.mjs remove ali2026      # a'zoni o'chirish
npm run contact -- https://t.me/username     # "Admin bilan bog'lanish" havolasi
```
So'ng `git commit` + `git push` — GitHub Pages avtomatik yangilanadi.

Brauzerda ham mumkin: `#/admin` sahifasi (admin paroli bilan) — login va kuchli parol yaratadi, yangilangan `premium-users.json` faylini yuklab beradi.

Foydalanuvchi **Premium** sahifasida login/parol bilan kiradi; sessiya qurilmada saqlanadi (chiqib ketsa ham), lekin har safar ro'yxat bilan tekshiriladi — o'chirilgan a'zo avtomatik chiqariladi.

## Umumiy reyting uchun Supabase (ixtiyoriy)
1. [supabase.com](https://supabase.com) → yangi loyiha → **SQL Editor** → `supabase/schema.sql` ni ishga tushiring.
2. `js/config.example.js` ni `js/config.js` ga nusxalang, `SUPABASE_URL` va `SUPABASE_ANON_KEY` ni yozing.
   - GitHub Pages uchun `js/config.js` ni commit qilish kerak (anon kalit ommaviy, RLS bilan himoyalangan) — `.gitignore` dan olib tashlang.
   - Vercel'da esa env o'zgaruvchilar (`.env.example`) orqali `api/config.js` beradi.
3. Shundan so'ng reyting barcha foydalanuvchilar uchun umumiy bo'ladi.

Google orqali kirish (ixtiyoriy) uchun: Google Cloud Console → OAuth client → redirect `https://<ref>.supabase.co/auth/v1/callback` → Supabase → Authentication → Providers → Google.

## Tuzilma
```
index.html              SPA qobig'i
css/style.css, v2.css   dizayn va animatsiyalar
js/app.js               router, test (adaptiv), natija, reyting
js/questions.js         savollar generatori (7 daraja)
js/scoring.js           IRT baholash, yosh normasi, tahlil
js/db.js                ma'lumotlar qatlami, Premium kirish
js/premium.js           Premium bo'limi va kabinet
js/admin.js             admin paneli
js/games.js             trenajyorlar
js/detective.js         detektiv o'yin dvigateli
js/cases.js             6 ta detektiv ishi
data/premium-users.json Premium a'zolar (xeshlar)
scripts/premium.mjs     admin CLI
supabase/schema.sql     DB sxemasi
```
