# Company IQ — ishlash tartibi

Sayt: **https://mindgamesdc.vercel.app** (admin: https://mindgamesdc.vercel.app/admin)
Repo: **https://github.com/jasurbek602/company**

---

## 1. Oddiy foydalanuvchi uchun

1. Saytni oching → **"Testni boshlash — bepul"**.
2. **Ism** va **yosh**ni kiriting → "Testni boshlash".
3. 3‑2‑1 sanog'idan keyin test boshlanadi: **36 savol, 30 daqiqa**.
   - Javobni tanlang → **"Keyingi"**. Klaviatura: `1–6` variant, `Enter` keyingi.
   - Bilmasangiz → **"O'tkazish (bilmayman)"** (tasodifiy javob natijani buzadi).
   - Orqaga qaytib bo'lmaydi — test moslashuvchan: to'g'ri javobdan keyin savol qiyinlashadi.
4. Natija: **IQ ± xatolik oralig'i**, persentil, yo'nalishlar bo'yicha indeks, **5 bandli tahlil**, reytingdagi o'rni, "Ulashish" tugmasi.
5. **Birinchi test bepul.** Qayta topshirish — faqat Premium.
6. **Reyting** menyusida eng yuqori natijalar, yosh guruhlari bo'yicha filtr.

## 2. Premium foydalanuvchi uchun

1. Admin bilan bog'lanadi va to'lov qiladi.
2. Admin unga **login** va **parol** yuboradi.
3. Saytda **👑 Premium** → login va parol → **"Kirish"**.
4. Parol qurilmada saqlanadi — keyingi safar avtomatik kiradi (chiqish: kabinetdagi **"Chiqish"** tugmasi).
5. Ochiladi:
   - **Cheksiz IQ test** va **chuqur tahlil** (4 kognitiv indeks, 4 haftalik reja, mos kasblar).
   - **O'yinlar**: Dual N-Back, IQ trener, Aylantirish, Schulte, Xotira panjarasi, Stroop, Tezkor hisob.
   - **Detektiv** (pastda batafsil).

### Detektiv qanday o'ynaladi
1. **📋 Ish** — voqea tavsifi va gumonlanuvchilar.
2. **🔍 Joylar** — joyni oching, dalillarni bosing → bloknotga iz tushadi. 🔒 dalillar keyinroq ochiladi.
3. **🗣 So'roq** — savol bering. Ba'zi javoblar **ko'rsatma** sifatida taxtaga tushadi. ⚡ savollar yolg'on fosh qilingandan keyin chiqadi.
4. **🧷 Taxta** — bir-biriga **zid** ikki kartani tanlang (masalan: "21:00 da uyda edim" + "metro kartasi 22:05") → **Taqqoslash**. To'g'ri bo'lsa — yolg'on fosh qilinadi va yangi imkoniyatlar ochiladi. Noto'g'ri taqqoslash ballni kamaytiradi.
5. **🕒 Xronologiya** — vaqtli dalillar avtomatik tartiblanadi.
6. **⚖️ Sud zali** — aybdorni safdan tanlang (⚡ belgisi — fosh qilingan yolg'onlar soni), motiv va usulni tanlang (📎 — dalil bilan tasdiqlangan variant). Xato qilsangiz, **yana 1 imkoniyat** bor (mukofot −30%).
7. Mukofot: 🪙 tokenlar va unvonlar (Stajyor → Afsonaviy tergovchi). 💡 Maslahat har biri mukofotni 15% kamaytiradi. Premium a'zolar uchun barcha ishlar birdaniga ochiq — istalgan tartibda yechish mumkin.
8. **12 ta ish**: 1-ish ("Muzeydagi olmos") — **bepul**, qolgan 11 tasi — **Premium**. Bepul o'ynagan progress Premium'ga kirganda saqlanib qoladi.

## 3. Server, ma'lumotlar bazasi va admin panel (MongoDB + Vercel)

Haqiqiy umumiy reyting va Premium akkauntlar **MongoDB**da saqlanadi. Brauzer bazaga to'g'ridan-to'g'ri ulanmaydi — orada xavfsiz server (Vercel funksiyalari) turadi, shuning uchun baza paroli hech qachon saytda ko'rinmaydi.

### Bir martalik sozlash
1. **Maxfiy kalitlar** — allaqachon yaratilgan: `company/secrets/vercel-env.txt` (GitHub'ga chiqmaydi). Unda: admin paroli, 2FA kaliti va Vercel uchun barcha qiymatlar. Faylni xavfsiz joyda (masalan parol menejerida) ham saqlang. Qayta yaratish: `npm run setup:secrets -- --force`.
2. **MongoDB Atlas** (cloud.mongodb.com):
   - *Database Access* → baza foydalanuvchisining parolini bilib oling (yoki yangilang).
   - *Network Access* → **Add IP Address → Allow access from anywhere (0.0.0.0/0)** (Vercel serverlarining IP manzili o'zgarib turadi; himoya parol va TLS orqali).
   - `vercel-env.txt` dagi `MONGODB_URI` qatorida `<PAROL>` o'rniga parolni qo'ying.
3. **Vercel** (vercel.com) → *Add New Project* → GitHub'dagi `company` repozitoriyasini tanlang → *Environment Variables* bo'limiga `vercel-env.txt` dagi **har bir `NOM=qiymat` qatorini** kiriting → *Deploy*.
4. **2FA**: telefoningizda Google Authenticator / Authy → "+" → *Setup key* → faylidagi 2FA kalitini kiriting.
5. Tayyor: sayt `https://<loyiha>.vercel.app`, admin panel `https://<loyiha>.vercel.app/admin`.

### Admin panel (`/admin`)
- Kirish: **admin paroli + telefondagi 6 raqamli kod**. Saytda bu sahifaga havola yo'q.
- **👑 Premium a'zolar** — ism, login va muddat (1 oy / 3 oy / 1 yil / cheksiz) → **Yaratish** → ekranda login va parol chiqadi (parol faqat bir marta ko'rinadi) → foydalanuvchiga yuboring. Shu yerda: muddatni uzaytirish, yangi parol, bloklash, o'chirish.
- **🏆 Reyting** — barcha natijalar; nomaqbul ism yoki soxta natijani o'chirish.
- **💾 Zaxira** — har kuni 03:00 (UTC) da avtomatik shifrlangan nusxa (oxirgi 30 ta). "Hozir nusxa olish", yuklab olish va fayldan tiklash.
- **📜 Jurnal** — kim qachon kirdi, noto'g'ri urinishlar, barcha o'zgarishlar.

### Xavfsizlik (nima qilingan)
- Baza paroli va barcha kalitlar faqat Vercel serverida (env), kodda va GitHub'da yo'q.
- Admin: kuchli parol (scrypt xesh) + **2FA kodi**; 5 ta noto'g'ri urinishdan keyin IP 30 daqiqaga bloklanadi; sessiya 2 soat, 15 daqiqa harakatsizlikda chiqib ketadi, boshqa brauzerga ko'chirib bo'lmaydi.
- Premium parollar scrypt bilan xeshlanadi; parol almashtirilsa yoki a'zo bloklansa — eski sessiyalar darhol bekor bo'ladi.
- Reyting: har bir test uchun serverdan imzolangan token, 90 soniyadan tez yuborilgan yoki takroriy natija qabul qilinmaydi, IQ chegaralari tekshiriladi, IP bo'yicha cheklov.
- NoSQL-injection, juda katta so'rovlar, boshqa saytlardan murojaat (CORS) va admin sahifasini boshqa saytga joylash (clickjacking) bloklangan.
- Zaxira nusxalar **AES-256** bilan shifrlangan. Lokal ochish: `BACKUP_KEY=... npm run backup:decrypt -- fayl.json`.
- Lokal sinov: `npm run dev:api` (xotiradagi baza bilan).

> ⚠️ `BACKUP_KEY` yo'qolsa, zaxira nusxalarni ochib bo'lmaydi. `secrets/vercel-env.txt` ni hech kimga yubormang.

## 4. Admin uchun (eski statik rejim — server ulanmagan bo'lsa)

Barcha buyruqlar `company` papkasida terminalda bajariladi.

### Yangi Premium a'zo qo'shish
```bash
npm run add-premium -- ali2026 "Ali Valiyev"
```
- Parol avtomatik yaratiladi va **`secrets/credentials.txt`** ga yoziladi (bu fayl GitHub'ga chiqmaydi).
- So'ng saytga chiqarish:
```bash
git add data/premium-users.json && git commit -m "Yangi premium a'zo" && git push
```
- 1–2 daqiqada sayt yangilanadi. Login va parolni foydalanuvchiga yuboring.

**Brauzer orqali (terminalsiz):** saytda `#/admin` → admin paroli → login va ism → **"Parol yaratish"** → parolni nusxalang → **"premium-users.json"** ni yuklab oling → GitHub'da `data/premium-users.json` faylini shu bilan almashtiring (Edit → paste → Commit).

### A'zoni o'chirish
```bash
node scripts/premium.mjs remove ali2026
git add data/premium-users.json && git commit -m "A'zo o'chirildi" && git push
```
O'chirilgan a'zo keyingi kirishda avtomatik chiqarib yuboriladi.

### Admin parolini almashtirish
```bash
npm run admin
git add data/premium-users.json && git commit -m "Admin paroli yangilandi" && git push
```
Yangi parol `secrets/credentials.txt` da.

### "Admin bilan bog'lanish" havolasi
```bash
npm run contact -- https://t.me/sizning_username
git add data/premium-users.json && git commit -m "Kontakt" && git push
```
Premium sahifadagi "Sotib olish" tugmalari shu havolaga olib boradi.

### Narxlarni o'zgartirish
`js/premium.js` faylidagi `PRICE` (narx), `BENEFITS` va `COMPARE` (imkoniyatlar) → commit → push.

## 5. Umumiy reyting (eski, Supabase — ixtiyoriy)
Hozir reyting har bir foydalanuvchining **o'z qurilmasida**. Hamma uchun umumiy bo'lishi uchun:
1. supabase.com → yangi loyiha → **SQL Editor** → `supabase/schema.sql` ni ishga tushiring.
2. `js/config.example.js` → `js/config.js` nusxa, `SUPABASE_URL` va `SUPABASE_ANON_KEY` ni yozing.
3. `.gitignore` dan `js/config.js` qatorini olib tashlang → commit → push.

## 6. Lokal ishga tushirish va tekshirish
```bash
npm run dev
```
→ http://localhost:5173

```bash
npm run check
```
→ savollar generatorini tekshiradi (11 200 savol).

## 7. Muhim
- **`secrets/credentials.txt` ni saqlab qo'ying** — barcha parollar faqat shu yerda. Uni hech kimga yubormang va GitHub'ga yuklamang.
- `data/premium-users.json` da faqat xeshlar — parollarni undan tiklab bo'lmaydi.
- Natijalar taxminiy; klinik IQ testi o'rnini bosmaydi.
