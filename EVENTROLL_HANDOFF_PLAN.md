# EventRoll — Geliştirme, UI Düzenlemeleri ve Yeni Mimari Planı (Handoff Dokümanı)

Bu doküman; **EventRoll** projesinde son yapılan tüm mobil/UI düzenlemelerini, canlı test ortamı durumunu ve konuşulan iki büyük yenilik planını (**Fiş İçi Slider ile Fiyatlandırma** ve **Büyük Albüm İndirme Mimarisi**) eksiksiz olarak içerir. Claude veya herhangi bir geliştirici doğrudan bu dokümanı baz alarak çalışmaya devam edebilir.

---

## 1. Proje ve Dağıtım Durumu

* **Git Branch:** `main` (tüm son değişiklikler GitHub `origin/main`e pushlanmıştır).
* **Canlı Test Ortamı (Preview):** `https://eventroll-test.vercel.app`
* **Önemli Kural (Deployments):** Proje henüz genel yayına (production) hazır değildir. Vercel üzerinde **asla `--prod` komutu çalıştırılmamalı** ve `eventroll.vercel.app` adresi güncellenmemelidir. Yapılan tüm geliştirmeler sadece `npx vercel deploy` ile önizlemeye çıkarılıp `eventroll-test.vercel.app` alias'ına atanmalıdır.

---

## 2. Son Yapılan UI ve Mobil Düzenlemeleri (Tamamlananlar)

Son çalışmada mobil deneyimi, erişilebilirliği ve dönüşüm akışını iyileştiren şu düzenlemeler yapıldı ve test ortamına alındı:

### A. Misafir Yükleme Ekranı & QR Akışı (`/e/[slug]`)
* **İç İçe Buton/Label Hatası Çözüldü (`uploader.tsx`):** Onay kutusundaki iç içe `<label>` ve `<button>` yapısı ayrıldı. "Terms" ve "Privacy" bağlantılarına tıklarken kazara checkbox'ın işaretlenmesini önlemek için `e.stopPropagation()` eklendi.
* **Fotoğraf Tepsisi Taşması (`uploader.tsx`):** Mobilde çok sayıda fotoğraf seçildiğinde ekranın taşmaması için tepsiye `max-h-[50vh] overflow-y-auto overscroll-contain` verildi.
* **PIN Girişi:** Misafir PIN kodunu girerken ilk haneye otomatik odaklanması için `autoFocus` eklendi.
* **Tarih Seçici Popover (`date-time-field.tsx`):** Dar telefon ekranlarında takvimin ekrandan taşmasını engellemek için `collisionPadding={12}` ve `max-w-[calc(100vw-24px)]` eklendi.

### B. Header ve Hero Düzenlemeleri
* **Marka Logosu Mobilde Görünür Kılındı (`logo.tsx` & `site-header.tsx`):** 400px altındaki dar ekranlarda logo yazısını gizleyen kural kaldırıldı; logo ikonu ve marka adı mobilde orantılı olarak (`size-7 sm:size-8`, `text-lg sm:text-xl`) ölçeklenerek tüm ekranlarda her zaman görünür hale getirildi.
* **"Etkinlik Oluştur" (Create Event) Butonu Yeniden Konumlandırıldı (`marketing-header.tsx`):** EventRoll'un ana müşteri edinme hunisi *"Etkinlik Ayarları → Plan Seçimi → Giriş/Kayıt → Ödeme"* şeklindedir. Kullanıcı kayıt olmadan önce etkinlik oluşturmaya başladığı için header'daki "Etkinlik oluştur" (`/create`) butonu mobilde de birincil CTA butonu olarak korundu.
* **Mobil Header Sadeleştirildi:**
  * Dil seçici mobilde daha kompakt hale getirildi (`h-8 px-2 text-xs`).
  * Kayıtlı etkinlik sahipleri için mobilde alandan tasarruf sağlayan şık bir giriş ikonu (`LogIn`), masaüstünde tam metinli buton bırakıldı.
  * Böylece dar ekranlarda bile (360px - 390px) **Logo + Dil + Giriş + Etkinlik Oluştur** butonu birbirine çarpmadan sığıyor.
* **Hero Tipografisi (`hero.tsx`):** Mobilde ekranı tamamen kaplayan "Scan. Upload. Done." başlığı `text-4xl sm:text-6xl` seviyesine çekilerek dikey boşluklar dengelendi.

---

## 3. Yeni Plan: Fiş İçi Slider & Kademeli "Premiumlaşan" Tasarım (Morphing Receipt)

### A. Konsept ve Hedef
* Şu an ana sayfada (`#pricing`) ve etkinlik oluşturma akışında (`/create` Step 2 - `PlanStep`) **Standard** ve **Premium** olmak üzere 2 ayrı fiş kartı bulunuyor.
* **Yeni Tasarım:** İki ayrı fiş yerine **TEK BİR FİŞ** olacak.
* Fişin en üst kısmında daktilo/kasa estetiğine uygun **4 Kademeli bir Slider (Ayar Çubuğu)** yer alacak.
* Müşteri slider'ı sağa kaydırdıkça fişteki fotoğraf sayısı, GB, saklama süresi ve toplam fiyat anlık olarak daktilo gibi güncellenecek.
* **Görsel Dönüşüm (Morphing):** Slider sağa kaydırıldıkça fişin fiziksel kart tasarımı da kademe kademe **"premiumlaşacak"**!

### B. 4 Kademenin Değerleri ve Limit Tablosu

| Kademe | Slider Başlığı | Fotoğraf Limiti | Depolama Alanı | Saklama Süresi (İndirme Penceresi) | Fiyat (Tek Seferlik) | Görsel Kart Tasarımı |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Kademe** | 50 Misafir (Mini) | 1.000 Fotoğraf | 10 GB | **7 Gün** | **$19** | Temiz, sade beyaz termal kasa fişi. |
| **2. Kademe** | 150 Misafir (Standart) | 2.500 Fotoğraf | 25 GB | **14 Gün** | **$29** | Fiş üzerinde özel onay damgası (stamp) ve marka detayları. |
| **3. Kademe** | 300 Misafir (Pro) | 5.000 Fotoğraf | 50 GB | **21 Gün** | **$39** | Kağıt rengi hafif fildişine döner, zarif çerçeve ve tipografi zenginleşir. |
| **4. Kademe** | 500+ Misafir (VIP) | 10.000 Fotoğraf | 100 GB | **30 Gün (1 Ay)** | **$49** | Tam altın yaldız çerçeve (`gold foil`), altın mühür, ışıltı efekti + **Yazdırılabilir QR Şablonları (Masa Kartları, Posterler)** hediye. |

### C. Teknik Yapı ve Değişecek Dosyalar
1. **`lib/plans.ts`:**
   * `PlanId` artık `"mini" | "standard" | "pro" | "vip"` veya `"tier1" | "tier2" | "tier3" | "tier4"` olarak 4 seviyeye genişletilecek.
   * `plans` sözlüğüne bu 4 kademenin `priceUsd`, `maxItems`, `maxBytes`, `retentionDays`, `printTemplates` değerleri eklenecek.
2. **`components/billing/receipt-card.tsx`:**
   * Fişin üst bölümüne (başlığın hemen altına veya daktilo başlığına) slider bileşeni eklenecek.
   * Fiş zeminine kademeye göre CSS transition ile renk geçişi verilecek (Beyaz `#fbfcfe` → Fildişi `#fdf9ee`).
   * 4. Kademede `FOIL` sınıfı, altın çerçeve ve parıltı efekti aktif olacak.
3. **`components/billing/receipt-content.ts`:**
   * 4 kademeyi destekleyecek metin ve satır üretim fonksiyonu güncellenecek.
4. **`components/marketing/pricing-receipts.tsx` ve `app/[locale]/(app)/create/plan-step.tsx`:**
   * 2 sütunlu grid yerine merkezde tek bir interaktif fiş render edilecek.
   * Mobilde iki devasa fiş yerine tek bir odaklı kart olması mobil UX'i olağanüstü ferahlatacak.

---

## 4. Büyük Albüm İndirme Mimarisi (Download Problem & Solution)

### A. Mevcut Sorun Neden Yaşanıyordu?
* **Mevcut Durum:** `lib/download/client.ts` içinde `client-zip` paketi kullanılarak indirme işlemi **tamamen kullanıcının tarayıcısının RAM belleğinde** yapılmaya çalışılıyor.
* **Safari & Mobil Çökmesi:** Chrome masaüstünde `showSaveFilePicker` API'si ile diske yazılabiliyor; ancak **iPhone Safari'de bu API yok**. 1.500+ fotoğraf (10-20 GB) telefonun RAM'inde birleştirilmeye çalışıldığında iOS Safari sekmeyi kapatıp *"A problem repeatedly occurred on this webpage"* hatası veriyor.
* **Ekran Kilidi:** İndirme sürerken telefonun ekranı kapandığında veya kullanıcı başka uygulamaya geçtiğinde iOS JavaScript'i askıya alıyor ve indirme yarıda kalıyor.
* **Vercel Serverless Sınırı:** Vercel fonksiyonları 4.5 MB payload sınırı ve 15-60 saniye timeout'a sahip olduğu için sunucu tarafında Vercel üzerinde zip oluşturulamıyor.

### B. Veritabanı ve Depolama Mimarisi (Ayrım)
* **Neon (PostgreSQL):** Sadece veritabanıdır (kullanıcılar, etkinlik ayarları, fotoğraf meta verileri ve linkler). Burada ikili dosya (fotoğraf) barındırılmaz.
* **Cloudflare R2 (S3 Uyumlu):** Fotoğrafların durduğu gerçek depolama alanıdır.
  * R2 depolama maliyeti: GB başına ayda sadece **$0.015 (1.5 cent)**.
  * R2 indirme/trafik (egress) maliyeti: **$0.00 (Tamamen Ücretsiz!)**.

### C. Tavsiye Edilen Çözüm: Cloudflare Worker ile Arka Planda ZIP & Akıllı İndirme
1. **Cloudflare Worker Servisi:**
   * Etkinlik bittiğinde veya kullanıcı panelden *"Tüm Albümü İndir"* dediğinde, Cloudflare üzerinde çalışan bir serverless Worker devreye girer.
   * R2'deki fotoğrafları Cloudflare'in kendi yüksek hızlı iç ağında (sıfır bant genişliği maliyetiyle) birleştirip R2 içine `event-[id]-album.zip` olarak yazar.
   * Müşteriye tek bir doğrudan indirme bağlantısı (Presigned URL) üretilir.
2. **Safari İndirme Sınırları ve Akıllı Parçalama (Chunking):**
   * **Doğrudan HTTP İndirmesi:** Dosya tarayıcı JavaScript belleğinde değil, Safari'nin yerel dosya indirme motoruyla indiği için Safari'nin dosya boyutu sınırı yoktur (cihazda boş yer olduğu sürece 10-20 GB da olsa iner).
   * **Mobil Boş Alan Önlemi:** 10 GB üzeri devasa albümlerde telefon hafızasını ve unzip işlemini kilitlememek için:
     * Albüm 3 GB altı ise: **Tek Parça ZIP**.
     * Albüm 10 GB+ ise: Sistem otomatik olarak 2.5-3 GB'lık parçalara böler (*"Düğün Albümü - Parça 1"*, *"Parça 2"*).
     * Müşteriye panelde: *"Büyük albümleri tek seferde orijinal kalitede açmak için bilgisayarınızı kullanmanızı öneririz"* ipucu gösterilir.
   * **Misafir Bazlı İndirme:** İstenirse panelden tüm albüm yerine misafir bazlı küçük paketler halinde indirme opsiyonu korunur.

---

## 5. Sıradaki Uygulama Adımları (Next Steps)

1. **Adım 1:** `lib/plans.ts` ve dil dosyalarındaki (`messages/*.json`) plan yapısını 4 kademeye (Mini, Standart, Pro, VIP) uyarlamak.
2. **Adım 2:** `components/billing/receipt-card.tsx` içine daktilo tarzı interaktif Slider'ı eklemek ve kademeye göre dinamik CSS geçişlerini (renk, damga, altın yaldız) kodlamak.
3. **Adım 3:** `#pricing` ve `/create` plan adımında tek fiş + slider yapısını test edip Vercel test ortamına (`eventroll-test.vercel.app`) yollamak.
4. **Adım 4:** İndirme akışı için Cloudflare Worker ZIP üretim altyapısını kurup Safari'deki bellek çökmesini kalıcı olarak tarihe gömmek.
