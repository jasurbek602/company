# Company IQ — ishlash tartibi

Sayt: **https://jasurbek602.github.io/company/**
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
6. **⚖️ Ayblov** — aybdor, motiv, usul va hal qiluvchi yolg'onni tanlang. **Faqat bir marta** topshiriladi.
7. Mukofot: 🪙 tokenlar va unvonlar (Stajyor → Afsonaviy tergovchi). 💡 Maslahat har biri mukofotni 15% kamaytiradi. Keyingi ish oldingisi yechilgach ochiladi.

## 3. Admin uchun

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
`js/premium.js` faylidagi `PLANS` ro'yxati (narx, nom, imkoniyatlar) → commit → push.

## 4. Umumiy reyting (ixtiyoriy, Supabase)
Hozir reyting har bir foydalanuvchining **o'z qurilmasida**. Hamma uchun umumiy bo'lishi uchun:
1. supabase.com → yangi loyiha → **SQL Editor** → `supabase/schema.sql` ni ishga tushiring.
2. `js/config.example.js` → `js/config.js` nusxa, `SUPABASE_URL` va `SUPABASE_ANON_KEY` ni yozing.
3. `.gitignore` dan `js/config.js` qatorini olib tashlang → commit → push.

## 5. Lokal ishga tushirish va tekshirish
```bash
npm run dev
```
→ http://localhost:5173

```bash
npm run check
```
→ savollar generatorini tekshiradi (11 200 savol).

## 6. Muhim
- **`secrets/credentials.txt` ni saqlab qo'ying** — barcha parollar faqat shu yerda. Uni hech kimga yubormang va GitHub'ga yuklamang.
- `data/premium-users.json` da faqat xeshlar — parollarni undan tiklab bo'lmaydi.
- Natijalar taxminiy; klinik IQ testi o'rnini bosmaydi.
