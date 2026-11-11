# Company IQ 🧠

Har bir foydalanuvchiga **alohida (tasodifiy) savollar** beradigan IQ test sayti: Google orqali kirish, natijalar bazada, 5 bandli bepul tahlil, Premium (chuqur tahlil, miya o'yinlari, Detektiv bo'limi).

- **Frontend:** toza HTML/CSS/JS (ES modullar), build kerak emas
- **Auth + DB:** Supabase (Google OAuth, Postgres, RLS)
- **To'lov:** Stripe Checkout, faqat **test rejimi** (`sk_test_...`), haqiqiy pul yechilmaydi
- **Deploy:** Vercel (statik fayllar + `api/` serverless funksiyalari)

## Imkoniyatlar

| Bo'lim | Tavsif |
|---|---|
| IQ test | 32 savol, 25 daqiqa, 4 yo'nalish: Raven uslubidagi matritsalar (SVG), son/harf ketma-ketliklari, mantiq/so'z, fazoviy (aylantirish, kub yoyilmasi). Savollar protsedurali generatsiya qilinadi, qiyinlik 1→5 ga oshadi. |
| Baholash | Qiyinlikka qarab og'irlikli ball → z-ball → IQ = 100 + 15·z (55–160), persentil, normal taqsimot grafigi. |
| Bepul tahlil | 5 band: umumiy natija, kuchli tomon, zaif tomon, ishlash uslubi/tezlik, murakkab savollardagi natija. |
| Premium | Chuqur tahlil (Gf, Gc, ishchi xotira, tezlik indekslari, 4 haftalik reja, kasblar), cheksiz test, miya o'yinlari, Detektiv. |
| Miya o'yinlari | Schulte jadvali, Xotira panjarasi, Stroop, Tezkor hisob. |
| Detektiv | 3 ta ish: dalillarni tekshirish, gumonlanuvchilarni so'roq qilish (dalil topilgach ⚡ to'qnashtirish savollari ochiladi), bloknot, yakuniy xulosa (aybdor + motiv + dalil) → token. |

> IQ natijasi taxminiy — klinik psixometrik test emas. Norma parametrlari `js/scoring.js` dagi `NORM_MEAN`/`NORM_SD` da; haqiqiy foydalanuvchi ma'lumotlari to'plangach qayta kalibrlash tavsiya etiladi.

## Lokal ishga tushirish

### 1) Demo rejim (hech qanday kalitsiz)
```bash
npm run dev
```
http://localhost:5173 — "Demo kirish" tugmasi, natijalar `localStorage` da saqlanadi, Premium tugmasi darhol faollashtiradi.

### 2) Haqiqiy Supabase bilan
1. `js/config.example.js` ni `js/config.js` ga nusxalang va `SUPABASE_URL`, `SUPABASE_ANON_KEY` ni yozing (`js/config.js` gitignore qilingan).
2. `npm run dev`

Stripe to'lovini lokal sinash uchun: `npm run dev:full` (Vercel CLI, `.env` dan o'qiydi — `.env.example` ga qarang).

Savollar generatorini tekshirish: `npm run check`

## Sozlash

### Supabase
1. [supabase.com](https://supabase.com) → yangi loyiha.
2. **SQL Editor** → `supabase/schema.sql` ni to'liq ishga tushiring (jadvallar, RLS, trigger, `add_tokens` RPC).
3. **Project Settings → API**: `Project URL`, `anon public` va `service_role` kalitlarini oling.

### Google OAuth
1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **Create credentials → OAuth client ID** → *Web application*.
2. **Authorized redirect URI:** `https://<loyiha-ref>.supabase.co/auth/v1/callback`
3. Client ID va Secret ni Supabase → **Authentication → Providers → Google** ga kiriting va yoqing.
4. Supabase → **Authentication → URL Configuration**: *Site URL* = sayt manzili (masalan `https://company-iq.vercel.app`), *Redirect URLs* ga `http://localhost:5173` ni ham qo'shing.

### Stripe (test rejim)
1. [dashboard.stripe.com](https://dashboard.stripe.com) → **Test mode** → Developers → API keys → `sk_test_...`.
2. Test karta: `4242 4242 4242 4242`, istalgan kelajak sana va CVC.
3. Server faqat `sk_test_` bilan boshlanuvchi kalitni qabul qiladi.

### Vercel'ga deploy
1. [vercel.com/new](https://vercel.com/new) → shu repozitoriyni import qiling (Framework: *Other*, build buyrug'i kerak emas).
2. Environment Variables (`.env.example` ga qarang): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `SITE_URL`.
3. Deploy. `js/config.js` Vercel'da `api/config.js` orqali env dan avtomatik beriladi.

## Xavfsizlik
- Maxfiy kalitlar (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`) faqat serverda; repozitoriyga hech qanday kalit commit qilinmaydi.
- RLS: foydalanuvchi faqat o'z natijalarini ko'radi/qo'shadi; `profiles` ni mijoz o'zgartira olmaydi.
- Premium faqat server Stripe sessiyasini (`paid` + `client_reference_id`) tekshirgandan keyin yoqiladi.
- Bepul foydalanuvchi uchun 1 ta natija limiti DB trigger bilan ham ta'minlangan.

## Tuzilma
```
index.html            SPA qobig'i
css/style.css         dizayn va animatsiyalar
js/app.js             router, test, natija, profil
js/questions.js       savollar generatori
js/scoring.js         IQ hisoblash va tahlil
js/db.js              Supabase / demo ma'lumot qatlami
js/games.js           miya o'yinlari
js/detective.js       Detektiv ishlari
js/premium.js         tariflar va Stripe
api/                  Vercel funksiyalari (checkout, confirm, config)
supabase/schema.sql   DB sxemasi
```
