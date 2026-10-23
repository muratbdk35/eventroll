import type { LegalCtx, LegalDocs } from "./types";

/* Turkish translation of de.ts, for information; the German text is
 * binding (DECISIONS #68). Keep both in step. */

const UPDATED = "23 Ekim 2026";

export function docsTr(c: LegalCtx): LegalDocs {
  const seller = `${c.company}, ${c.address}`;
  const reach = `${seller}, telefon: ${c.phone}, e-posta: ${c.supportEmail}`;
  return {
    privacy: {
      title: "Gizlilik politikası",
      updated: UPDATED,
      intro: `Bu metin, etkinlik sahibi olarak etkinlik oluşturduğunuzda, misafir olarak fotoğraf yüklediğinizde ya da sitemizi ziyaret ettiğinizde ${c.appName}'ün hangi kişisel verileri hangi amaçla, hangi hukuki dayanakla ve ne kadar süreyle işlediğini ve Genel Veri Koruma Tüzüğü (GDPR/DSGVO) kapsamındaki haklarınızı açıklar.`,
      sections: [
        {
          heading: "1. Veri sorumlusu",
          body: [
            `Veri sorumlusu, Geschäftsführerin ${c.managingDirector} tarafından temsil edilen ${seller} şirketidir („biz“). E-posta: ${c.supportEmail}, iletişim formu: ${c.contactUrl}.`,
            "Yasal olarak bir veri koruma görevlisi atamak zorunda değiliz ve atamadık.",
            "Bir etkinlikteki fotoğraflar için kimin davet edileceğine ve albüme ne olacağına etkinlik sahibi karar verir. Misafirlere karşı albümden etkinlik sahibi sorumludur; biz fotoğrafları hizmeti sunmak için onun adına işleriz. Hizmeti bir şirket kullanıyorsa (örneğin bir şirket etkinliği için), talep üzerine GDPR madde 28 kapsamında bir veri işleme sözleşmesi yaparız.",
          ],
        },
        {
          heading: "2. Etkinlik sahiplerinin verileri",
          body: [
            [
              "Hesap verileri: e-posta adresiniz ve Google ile giriş yaparsanız adınız ve profil fotoğrafınız. Bunları hesabınızı oluşturmak ve sizi e-postayla gelen tek kullanımlık bir kodla ya da Google ile giriş yaptırmak için kullanırız. Hukuki dayanak: sözleşmenin ifası (GDPR m. 6/1-b).",
              "Etkinlik verileri: etkinliğin adı, türü, tarihi ve saati ile ayarlarınız (örneğin PIN, telefon başına sınır, davetiye kartının rengi). Hukuki dayanak: GDPR m. 6/1-b.",
              "Ödeme verileri: ödemeleri Stripe yürütür. Biz ödeme durumunu, tutarı, planı, fatura ülkesini ve fatura bilgilerini alırız; kart numaranızın tamamını hiçbir zaman görmeyiz. Faturaları Alman ticaret ve vergi hukukunun öngördüğü süre boyunca saklarız (genellikle 8–10 yıl). Hukuki dayanak: GDPR m. 6/1-b ve c.",
              "Sipariş ve hizmet e-postaları: sipariş onayı, fatura, etkinliğinizle ilgili bildirimler (örneğin „albüm hazır“ ve silinmeden önceki hatırlatmalar). Hukuki dayanak: GDPR m. 6/1-b.",
              "Girişte kötüye kullanıma karşı koruma: Cloudflare Turnstile tarayıcınızı otomatik erişim belirtilerine karşı kontrol eder. Hukuki dayanak: kötüye kullanımı önlemedeki meşru menfaat (GDPR m. 6/1-f).",
            ],
          ],
        },
        {
          heading: "3. Misafirlerin verileri",
          body: [
            "Misafirlerin hesaba ihtiyacı yoktur. Bir etkinlik linkini açıp fotoğraf gönderdiğinizde şunları işleriz:",
            [
              "seçtiğiniz fotoğrafları orijinal dosya olarak ve tarayıcınızın oluşturduğu küçük bir önizlemeyle. Orijinal dosyalar değiştirilmez; çekim zamanı, kamera modeli ve telefonunuz kaydettiyse çekim yeri gibi gömülü bilgiler (EXIF) etkinlik sahibinin indirdiği dosyada kalır. Konum kaydını etkinlikten önce kamera ayarlarından kapatabilirsiniz. RAW fotoğraflar tarayıcınızda içlerindeki JPEG'e dönüştürülür; yalnızca o yüklenir;",
              "adınızı, yalnızca girerseniz;",
              "bu etkinlik için bir çerezde rastgele bir cihaz kimliği; böylece telefon başına sınır çalışır ve etkinlik sahibi istenmeyen içerik yükleyen bir telefonu engelleyebilir;",
              "kötüye kullanımı tespit etmek için IP adresiniz ve tarayıcı bilginizden üretilen, geri döndürülemeyen tuzlanmış bir özet (hash);",
              "Cloudflare Turnstile kontrolü ve etkinlik sahibi belirlediyse girdiğiniz PIN (yazdığınızı saklamayız; hatalı denemeler sınırlıdır);",
              "koşulları kabul ettiğinizi ve fotoğrafları paylaşma hakkınız olduğunu onayladığınız zaman.",
            ],
            "Hukuki dayanak: fotoğraf gönderdiğiniz etkinlik sahibine yüklemenin sağlanması (GDPR m. 6/1-b) ve güvenli bir hizmetteki meşru menfaatimiz (GDPR m. 6/1-f).",
            "Fotoğraflarınızı kim görür: yalnızca etkinlik sahibi. Diğer misafirler fotoğraflarınızı hiçbir zaman görmez; albümler herkese açık değildir ve arama motorlarında listelenmez.",
            "Fotoğraflara bakmayız. Saklama, önizleme ve aşağıdaki otomatik kontrol, hiç kimse fotoğrafları görmeden yürür. Şirketimizde bir kişi bir fotoğrafı yalnızca yasa gerektirdiğinde, örneğin yasa dışı içerik bildirimi ya da resmi makam talebi üzerine, veya etkinlik sahibi belirli fotoğraflarla ilgili açıkça destek istediğinde açar. Bu erişim ilgili fotoğraflarla sınırlıdır.",
            "Müstehcen içerik için otomatik kontrol (hazırlanıyor, henüz etkin değil; başladığında şu kurallar geçerli olur): her fotoğrafın küçük önizlemesi açık cinsel içeriğe karşı otomatik olarak kontrol edilir. İşaretlenen fotoğraf silinmez; etkinlik sahibinin albümünden ve indirmelerinden uzak tutulur, etkinlik sahibi onu bulanık görüntüleyip tutup tutmayacağına karar verebilir. Kontrol kişileri tanımlamaz; sonucu fotoğrafla birlikte silinir. Hukuki dayanak: etkinlikleri müstehcen içerikten uzak tutmada bizim ve etkinlik sahibinin meşru menfaati (GDPR m. 6/1-f).",
            "Bildirimler: Etkinlik sahibi bir fotoğrafı yasa dışı olarak bildirirse, ne zaman ve neden bildirildiğini kaydeder, fotoğrafı herkesten gizleriz ve bize resim değil, etkinlik ve fotoğraf numarasıyla e-posta gelir. Fotoğraf, yetkililer daha uzun saklanmasını istemedikçe, etkinliğin diğer fotoğraflarıyla birlikte indirme süresinin sonunda silinir. Suç şüphesi olduğunda, özellikle çocuk cinsel istismarı içeriklerinde, bildirimi ve yüklemeye ait verileri yetkili makamlara iletiriz. Hukuki dayanak: yasal yükümlülükler ve yasa dışı içeriğe karşı harekete geçmedeki meşru menfaat (GDPR m. 6/1-c ve f).",
          ],
        },
        {
          heading: "4. Sitemizin ziyareti",
          body: [
            "Bir sayfayı açtığınızda barındırma sağlayıcımız, sayfayı sunmak ve güvenliğini sağlamak için tarayıcınızın gönderdiği teknik verileri (IP adresi, tarih ve saat, açılan sayfa, tarayıcı ve işletim sistemi) işler. Bu kayıtlar en geç 30 gün sonra silinir. Hukuki dayanak: GDPR m. 6/1-f.",
            "Yerel fiyat: Fiyatların yanında kendi para biriminizde yaklaşık tutarı gösterebilmek için barındırma sağlayıcımız IP adresinizden yalnızca ülkenizi belirler. Ülke kaydedilmez ve kimseye iletilmez; ödeme her zaman euro olarak alınır. Hukuki dayanak: GDPR m. 6/1-f.",
            "Erişim sınırlama: Kötüye kullanımı önlemek için IP adresi başına istekleri sayarız (örneğin yüklemede, iletişim formunda ve PIN girişinde). Bunun için IP adresi Upstash'te en fazla bir saat tutulur ve sonra otomatik olarak silinir. Hukuki dayanak: GDPR m. 6/1-f.",
            "İletişim formu: adınızı, e-posta adresinizi ve mesajınızı yalnızca size cevap vermek için kullanır, konu kapandığında, en geç 12 ay sonra sileriz. Bot kontrolü Cloudflare Turnstile ile yapılır. Hukuki dayanak: GDPR m. 6/1-b ve f.",
            `Cayma işlevi (${c.withdrawUrl}): adınızı, sipariş numarasını ve e-posta adresinizi caymayı siparişle eşleştirmek, alındığını teyit etmek ve işlemek için kullanırız. Hukuki dayanak: yasal yükümlülük (GDPR m. 6/1-c, BGB § 356a). Bu bilgileri sözleşmeden doğan talepler ileri sürülebildiği sürece, en fazla üç yıl kanıt olarak saklarız.`,
            "Analiz ve hata izleme: Şu anda hiçbir analiz veya hata izleme hizmeti kullanmıyoruz. İleride PostHog (AB bulutu, çerezsiz) ya da Sentry kullanırsak bu metni önceden güncelleriz.",
            "Yazı tipleri kendi sunucumuzdan yüklenir; Google Fonts'a veri aktarılmaz.",
          ],
        },
        {
          heading: "5. Saklama süreleri",
          body: [
            [
              "Fotoğraflar ve önizlemeler: planınızın indirme süresinin sonunda, etkinliğin bittiği günden itibaren sayılarak kalıcı olarak silinir (Mini, Standart, Pro ve VIP için 7, 14, 21 veya 30 gün; plan seçilmediği sürece 7 gün). Etkinlik sahipleri tek tek fotoğrafları, bir telefonun tüm fotoğraflarını ya da tüm etkinliği istedikleri zaman daha önce silebilir.",
              "Etkinlik ayarları ve misafir verileri (adlar, cihaz kimlikleri, özetler, onay zamanları): fotoğraflarla birlikte silinir.",
              "Hesap verileri: hesabınız var olduğu sürece; silinmesini istemenizden sonra 30 gün içinde silinir, yasal olarak saklamamız gerekenler (örneğin faturalar) hariç.",
              "Giriş kodları: 10 dakika geçerlidir, yalnızca özet olarak saklanır.",
            ],
          ],
        },
        {
          heading: "6. Alıcılar ve AB dışına aktarım",
          body: [
            "Yalnızca bir veri işleme sözleşmesiyle bağlı olan ve verileri talimatlarımız doğrultusunda işleyen hizmet sağlayıcıları kullanırız:",
            [
              "Vercel Inc. – sitenin barındırılması (AB, Frankfurt bölgesi);",
              "Neon Inc. – veritabanı (Frankfurt);",
              "Cloudflare Inc. – fotoğraf depolama (R2, AB yargı alanı), bot koruması (Turnstile) ve e-posta yönlendirme;",
              "Stripe Payments Europe Ltd. (İrlanda) – ödemeler ve faturalar;",
              "Resend Inc. – giriş, sipariş ve hizmet e-postaları;",
              "Upstash Inc. – erişim sınırlama (AB bölgesi);",
              "Sightengine SAS (Paris) – yalnızca otomatik kontrol etkinleştiğinde: önizlemelerin müstehcen içeriğe karşı otomatik kontrolü; görüntüler kontrolden sonra saklanmaz;",
              "Google Ireland Ltd. – yalnızca „Google ile giriş“i seçerseniz.",
              "Google Ireland Ltd. (Gmail) – adresimize gelen e-postaların yönlendirildiği posta kutusu (iletişim formu, cayma bildirimleri, içerik bildirimleri, talepler).",
            ],
            "Bu şirketlerden bazıları ABD'de bulunmaktadır. Verilerin oraya aktarılabildiği durumlarda AB-ABD Veri Gizliliği Çerçevesi'ne ya da AB Komisyonu'nun Standart Sözleşme Maddeleri'ne dayanırız.",
            "Kişisel verileri satmayız; fotoğraflarınızı reklam için veya yapay zekâ modellerini eğitmek için kullanmayız.",
          ],
        },
        {
          heading: "7. Haklarınız",
          body: [
            "Erişim (GDPR m. 15), düzeltme (m. 16), silme (m. 17), işlemenin kısıtlanması (m. 18), veri taşınabilirliği (m. 20) ve meşru menfaate dayanan işlemeye itiraz (m. 21) haklarına sahipsiniz. Verdiğiniz bir onayı, ileriye dönük olarak her zaman geri alabilirsiniz.",
            `Bunun için ${c.supportEmail} adresine yazın. Misafir olarak bir fotoğrafın silinmesini doğrudan etkinlik sahibinden de isteyebilirsiniz; bulabilmemiz için lütfen etkinlik linkini bize iletin.`,
            "Ayrıca bir veri koruma denetim makamına, özellikle yaşadığınız veya çalıştığınız AB ülkesindekine şikâyette bulunma hakkınız vardır. Bizden sorumlu makam Hamburg Veri Koruma ve Bilgi Edinme Özgürlüğü Komiserliği'dir.",
            "Veri verme zorunluluğu: Etkinlik sahibi hesabı için e-posta adresinize, sipariş için Stripe'ta ödeme bilgilerine ihtiyacımız var; bunlar olmadan sözleşmeyi yerine getiremeyiz. Misafirlerin yalnızca fotoğraf seçmesi yeterlidir; ad isteğe bağlıdır.",
            "Otomatik kararlar: Size karşı hukuki sonuç doğuran ve yalnızca otomatik işlemeye dayanan kararlar vermeyiz (GDPR m. 22). Müstehcen içerik için otomatik kontrol yalnızca işaretler; fotoğrafın kalıp kalmayacağına etkinlik sahibi karar verir.",
          ],
        },
        {
          heading: "8. Güvenlik",
          body: [
            "Tüm bağlantılar şifrelidir (HTTPS). Fotoğraflar özel bir depolamada tutulur ve yalnızca kısa süreli imzalı linklerle sunulur. Canlı sistemlere erişim, ihtiyacı olan kişilerle sınırlıdır, iki adımlı doğrulamayla korunur ve 3. bölümde anlatılanlar dışında fotoğraf görüntülemek için kullanılmaz.",
          ],
        },
        {
          heading: "9. Çocuklar",
          body: [
            "Etkinlik sahibi hesapları 18 yaş ve üzeri kişiler içindir. 16 yaşından küçük misafirler fotoğrafları yalnızca bir ebeveyn veya vasinin izniyle yüklemelidir.",
          ],
        },
        {
          heading: "10. Değişiklikler",
          body: [
            "Hizmet ya da yasalar değiştiğinde bu metni güncelleriz. Üstteki tarih güncel sürümü gösterir. Önemli değişiklikleri etkinlik sahiplerine e-postayla bildiririz.",
          ],
        },
      ],
    },

    terms: {
      title: "Kullanım şartları ve satış koşulları",
      updated: UPDATED,
      intro: `Bu genel işlem koşulları, ${seller} („biz“) tarafından sunulan ${c.appName}'ün kullanımı için geçerlidir. Hesap oluşturarak, sipariş vererek veya fotoğraf yükleyerek bunları kabul etmiş olursunuz.`,
      sections: [
        {
          heading: "1. Hizmet",
          body: [
            `${c.appName}, bir etkinlik sahibinin etkinlik oluşturmasını ve misafirlerinden QR kod ya da link aracılığıyla fotoğraf toplamasını sağlar. Misafirler uygulama ve hesap olmadan, telefonlarının tarayıcısından yükler. Fotoğrafları yalnızca etkinlik sahibi görür; misafirler yalnızca kendi yüklediklerini görür.`,
            "Etkinlik oluşturmak ücretsizdir. Misafirler, etkinlik sahibi o etkinlik için bir plan satın alıp etkinliği yayınladığında yükleme yapabilir. Planların kapsamı ve sınırları (fotoğraf sayısı, depolama, indirme süresi, baskı şablonları), sipariş anında fiyat sayfasında gösterildiği gibidir.",
          ],
        },
        {
          heading: "2. Hesap",
          body: [
            "Etkinlik sahibi hesabı için en az 18 yaşında olmanız gerekir. Giriş kodları oraya gönderildiği için e-posta kutunuza erişimi güvende tutun. Hesabınızdaki işlemlerden siz sorumlusunuz.",
          ],
        },
        {
          heading: "3. Sözleşmenin kurulması",
          body: [
            "Sitedeki planlar bağlayıcı bir teklif değildir. Bir plan seçer, ödeme sayfasında bilgilerinizi ve cayma hakkına ilişkin beyanı onaylarsınız ve ödeme sağlayıcımız Stripe'a yönlendirilirsiniz. Stripe sayfasında ödeme yükümlülüğü doğuran sipariş ya da ödeme butonuna tıklayarak bağlayıcı bir teklifte bulunursunuz. Sözleşme ödeme başarılı olduğunda kurulur; bunu e-postayla onaylarız.",
            "Göndermeden önce girdiklerinizi geri butonları ve düzenle linkleriyle her zaman düzeltebilir veya işlemden vazgeçebilirsiniz.",
            "Sözleşme dilleri Almanca, İngilizce ve Türkçedir; bu koşulların bağlayıcı olan sürümü Almancadır. Sözleşme metnini (sipariş bilgileri ve bu koşullar) sipariş onayıyla birlikte e-postayla göndeririz; koşulların güncel sürümü bu sayfada yer alır.",
          ],
        },
        {
          heading: "4. Fiyatlar, ödeme, plan yükseltme",
          body: [
            [
              "Plan, etkinlik başına euro cinsinden tek seferlik bir ödemedir. Abonelik yoktur; hiçbir şey otomatik olarak yenilenmez.",
              "Tüm fiyatlar yasal KDV dahil son fiyatlardır.",
              "Ödeme, Stripe üzerinden orada sunulan ödeme yöntemleriyle yapılır. Her sipariş için e-postayla fatura alırsınız.",
              "Bir etkinliği istediğiniz zaman daha büyük bir plana geçirebilir ve yalnızca ödediğiniz plana göre farkı ödersiniz.",
            ],
          ],
        },
        {
          heading: "5. Cayma hakkı ve iadeler",
          body: [
            "Tüketicilerin yasal bir cayma hakkı vardır. Ayrıntılar ve örnek cayma formu cayma bildiriminde yer alır.",
            "Plan hemen kullanılabildiği için ödemeden önce, cayma süresi dolmadan hizmete başlamamızı açıkça talep etmenizi ve hizmeti tamamen sağladığımızda cayma hakkınızın sona ereceğini bildiğinizi onaylamanızı isteriz.",
            "Hizmet başladıktan sonra cayma: Cayma süresi dolmadan başlamamızı istediyseniz ve sonra cayarsanız, o ana kadar verilen hizmet için makul bir bedel ödersiniz (BGB § 357a/2). Hizmetin özü etkinliğin kendisidir: misafirlerinizin etkinlik süresi boyunca albümünüze fotoğraf yükleyebilmesi. Sonrasındaki indirme süresi yalnızca fotoğrafları almanız içindir. Etkinlik başlamadan cayarsanız tutarın tamamını iade ederiz. Etkinlik başladıktan sonra cayarsanız hizmetin esas kısmı verilmiş olur ve iade buna göre küçük kalır.",
            "Gönüllü iade: Etkinliğinize henüz hiç fotoğraf yüklenmediyse ve ilk ödemenin üzerinden en fazla 14 gün geçtiyse, planı etkinlik ayarlarından tek tıkla iptal edip tutarın tamamını geri alabilirsiniz; etkinlik yeniden taslak olur. Bizim tarafımızda bir sorun olduysa bize yazın; tamamen veya kısmen iade ederiz. Yasal haklarınız saklıdır.",
          ],
        },
        {
          heading: "6. Etkinlik süresi ve silme",
          body: [
            "Bir etkinlik en fazla 24 saat, VIP planda en fazla 48 saat sürer. Misafirler yalnızca etkinliğin başlangıcı ile bitişi arasında fotoğraf yükleyebilir. Tüm fotoğraflar seçilen planın indirme süresinin sonuna kadar saklanır (Mini, Standart, Pro ve VIP için etkinlik bittikten sonra 7, 14, 21 veya 30 gün) ve sonra kalıcı olarak silinir. Albümü bu süre içinde indirmek etkinlik sahibinin sorumluluğundadır. Silmeden önce e-postayla hatırlatırız, ancak silinen fotoğrafları geri getiremeyiz.",
          ],
        },
        {
          heading: "7. Etkinlik sahibinin yükümlülükleri",
          body: [
            "Etkinlik sahibi olarak QR kodu ya da linki kimin alacağına siz karar verirsiniz. Şunları kabul edersiniz:",
            [
              "hizmeti yalnızca gerçek etkinlikler için kullanmak ve linki yabancıları yüklemeye davet edecek şekilde yayınlamamak;",
              "misafirlerinize fotoğrafların sizin için toplandığını uygun bir şekilde bildirmek (örneğin basılı kartta);",
              "aldığınız fotoğrafları veri koruma hukukuna ve fotoğraftaki kişilerin haklarına uygun şekilde kullanmak, özellikle başka bir yerde yayınlamadan önce;",
              "istenmeyen içerik yüklenirse sağlanan araçları (silme, telefonu engelleme, PIN, bildirme) kullanmak.",
            ],
          ],
        },
        {
          heading: "8. İçerik kuralları",
          body: [
            "Fotoğraf yükleyen kişi, fotoğrafın haklarına sahip olmalı ya da onu paylaşma hakkı bulunmalı ve yasanın gerektirdiği durumlarda fotoğraftaki kişilerin onayını almış olmalıdır. Şunlar yasaktır:",
            [
              "yasa dışı içerik, özellikle küçüklerin her türlü cinsel tasviri;",
              "başkalarının telif, kişilik veya veri koruma haklarını ihlal eden içerik;",
              "şiddeti yücelten, nefreti körükleyen, taciz eden veya pornografik içerik;",
              "zararlı yazılım veya fotoğraf olmayan dosyalar.",
            ],
            `Misafir, yükleme yaparak etkinlik sahibine fotoğrafları etkinlikle bağlantılı özel amaçlarla saklama, indirme ve kullanma hakkı verir. Fotoğraflar üzerindeki hakları misafirde kalır. Bir fotoğrafın kaldırılması için etkinlik sahibine veya ${c.supportEmail} adresine başvurun.`,
          ],
        },
        {
          heading: "9. Moderasyon ve bildirimler",
          body: [
            "Açık cinsel içerik için otomatik kontrol hazırlanıyor ve henüz etkin değil. Başladığında yüklenen her fotoğraf kontrol edilir (Sightengine). İşaretlenen fotoğraflar silinmez; albümden ve indirmelerden uzak tutulur, etkinlik sahibi bunları gösterip tutmaya karar verir. Kontrol yanılabilir; engelleme veya silme kararı vermez.",
            `Etkinlik sahipleri albümdeki bir fotoğrafı yasa dışı olarak bildirebilir; fotoğraf hemen herkesten gizlenir ve bildirimi inceleriz. Diğer herkes yasa dışı içeriği ${c.contactUrl} üzerinden ya da ${c.supportEmail} adresine bildirebilir (bkz. „İçerik bildir“). Bildirimleri hızla ele alır, bildirim yapan kişiye kararımızı iletir ve yasanın izin verdiği ölçüde etkilenen etkinlik sahibine kısıtlamaların gerekçesini bildiririz.`,
            "Bu koşulların veya yasaların ihlali halinde içeriği kaldırabilir, etkinlikleri veya hesapları askıya alabiliriz. Çocuk istismarı içeriğini yetkili makamlara bildiririz.",
          ],
        },
        {
          heading: "10. İçerik üzerindeki haklarımız",
          body: [
            "Fotoğrafları yalnızca hizmeti sunmak için kullanırız: saklamak, önizleme oluşturmak ve etkinlik sahibine sunmak. Mülkiyet talep etmeyiz, onlara bakmayız, kimseye göstermeyiz ve reklam ya da yapay zekâ eğitimi için kullanmayız. Bir fotoğrafı yalnızca yasa gerektirdiğinde veya etkinlik sahibi destek istediğinde açarız (bkz. gizlilik politikası).",
          ],
        },
        {
          heading: "11. Erişilebilirlik",
          body: [
            "Hizmeti özellikle etkinlikler sırasında erişilebilir tutmaya çalışırız, ancak bakım, mekândaki ağ sorunları veya hizmet sağlayıcılarımızdaki kesintiler gibi durumlarda kesintisiz çalışmayı garanti edemeyiz.",
          ],
        },
        {
          heading: "12. Sorumluluk",
          body: [
            "Kast ve ağır ihmal, hayat, beden veya sağlığın zarar görmesi ile Alman Ürün Sorumluluğu Kanunu kapsamındaki hallerde sınırsız sorumluyuz. Hafif ihmalde yalnızca temel sözleşme yükümlülüklerinin (sözleşmenin gereği gibi ifasını mümkün kılan ve uyulacağına düzenli olarak güvenebileceğiniz yükümlülükler) ihlalinden ve bu sözleşme için tipik ve öngörülebilir zararla sınırlı olarak sorumluyuz.",
            "Zamanında hatırlatma yapmış olmamız kaydıyla, indirme süresi içinde indirilmediği için kaybolan fotoğraflardan sorumlu değiliz.",
          ],
        },
        {
          heading: "13. Koşullarda değişiklik",
          body: [
            "Bu koşulları gelecekteki siparişler için değiştirebiliriz. Daha önce satın alınmış planlar etkilenmez. Önemli değişiklikleri hesabı olan etkinlik sahiplerine e-postayla bildiririz.",
          ],
        },
        {
          heading: "14. Son hükümler",
          body: [
            "BM Uluslararası Mal Satımı Sözleşmesi hariç olmak üzere Alman hukuku uygulanır. Tüketiciler için bu, mutad meskenlerinin bulunduğu ülkenin emredici tüketiciyi koruma hükümleriyle çelişmediği ölçüde geçerlidir.",
            "Tacir, kamu tüzel kişisi veya kamu hukukuna tabi özel fon iseniz yetkili mahkeme Hamburg'dur.",
            "Bir tüketici hakem kurulu önündeki uyuşmazlık çözüm süreçlerine katılmaya istekli ve yükümlü değiliz.",
            "Bir hükmün geçersiz olması halinde diğer hükümler geçerliliğini korur.",
          ],
        },
      ],
    },

    withdrawal: {
      title: "Cayma bildirimi",
      updated: UPDATED,
      intro:
        "Tüketiciler aşağıdaki şekilde cayma hakkına sahiptir. Tüketici, ağırlıklı olarak ticari veya serbest mesleki faaliyetine dahil olmayan amaçlarla bir hukuki işlem yapan her gerçek kişidir. (Çeviridir; bağlayıcı olan Almanca cayma bildirimidir.)",
      sections: [
        {
          heading: "Cayma hakkı",
          body: [
            "On dört gün içinde herhangi bir gerekçe göstermeksizin bu sözleşmeden cayma hakkına sahipsiniz.",
            "Cayma süresi, sözleşmenin kurulduğu günden itibaren on dört gündür.",
            `Cayma hakkınızı kullanmak için, bu sözleşmeden cayma kararınızı açık bir beyanla (örneğin postayla gönderilen bir mektup veya e-posta) bize (${reach}) bildirmeniz gerekir. Bunun için ekteki örnek cayma formunu kullanabilirsiniz, ancak bu zorunlu değildir.`,
            `Cayma hakkınızı ${c.withdrawUrl} adresinden çevrim içi olarak da kullanabilirsiniz. Bu çevrim içi işlevi kullanırsanız, cayma beyanının içeriği ile alındığı tarih ve saati içeren bir alındı teyidini size gecikmeksizin kalıcı bir veri saklayıcısıyla (örneğin e-postayla) iletiriz.`,
            "Cayma süresine uymak için, cayma hakkını kullandığınıza ilişkin bildirimi cayma süresi dolmadan göndermeniz yeterlidir.",
          ],
        },
        {
          heading: "Caymanın sonuçları",
          body: [
            "Bu sözleşmeden caymanız halinde, sizden aldığımız tüm ödemeleri gecikmeksizin ve en geç cayma bildiriminizin bize ulaştığı günden itibaren on dört gün içinde iade ederiz. Bu iade için, sizinle açıkça başka bir şey kararlaştırılmadıkça, ilk işlemde kullandığınız ödeme aracının aynısını kullanırız; bu iade nedeniyle sizden hiçbir ücret alınmaz.",
            "Hizmetlerin cayma süresi içinde başlamasını talep ettiyseniz, cayma kararınızı bize bildirdiğiniz ana kadar sağlanan hizmetlerin, sözleşmede öngörülen hizmetlerin tamamına oranına karşılık gelen makul bir tutarı bize ödersiniz.",
          ],
        },
        {
          heading: "Cayma hakkının sona ermesi",
          body: [
            "Hizmet sözleşmelerinde cayma hakkı, hizmeti tamamen sağladığımızda ve hizmetin ifasına ancak siz açık onayınızı verdikten ve aynı zamanda sözleşmeyi tamamen ifa etmemizle cayma hakkınızı kaybedeceğinizi bildiğinizi onayladıktan sonra başladığımızda sona erer.",
          ],
        },
        {
          heading: "Örnek cayma formu",
          body: [
            "(Sözleşmeden caymak istiyorsanız lütfen bu formu doldurup bize gönderin.)",
            [
              `Alıcı: ${seller}, e-posta: ${c.supportEmail}:`,
              "Aşağıdaki hizmetin sunulmasına ilişkin olarak benim/bizim (*) yaptığım/yaptığımız (*) sözleşmeden caydığımı/caydığımızı (*) bildiririm/bildiririz (*)",
              "Sipariş tarihi (*)",
              "Tüketicinin/tüketicilerin adı",
              "Tüketicinin/tüketicilerin adresi",
              "Tüketicinin/tüketicilerin imzası (yalnızca kâğıt üzerinde bildirimde)",
              "Tarih",
            ],
            "(*) Uygun olmayanı çiziniz.",
          ],
        },
      ],
    },

    cookies: {
      title: "Çerezler",
      updated: UPDATED,
      sections: [
        {
          heading: "Zorunlu çerezler",
          body: [
            "Yalnızca hizmet için teknik olarak gerekli çerezleri kullanırız (§ 25/2 TDDDG). Bunlar için onay gerekmez:",
            [
              "Giriş (etkinlik sahipleri): oturumunuzu açık tutar. Çıkış yaptığınızda veya 7 gün kullanılmadığında sona erer.",
              "Dil (NEXT_LOCALE): seçtiğiniz dili hatırlar.",
              "Misafir cihazı (erg_…): her etkinlik için bir tane; rastgele bir cihaz kimliği ve bot kontrolünün (varsa PIN'in) geçildiğine dair kanıt içerir. Kanıt 12 saat, cihaz kimliği bir yıl veya etkinlik silinene kadar geçerlidir.",
              "Tarayıcıdaki yerel depolama: Giriş yapmadan önce başladığınız etkinlik taslağı ve hangi fotoğrafları telefonunuza kaydettiğiniz bilgisi yalnızca tarayıcınızda kalır, bize gönderilmez. İkisini de tarayıcı ayarlarından silebilirsiniz.",
            ],
            "Stripe'ın ödeme sayfasında Stripe, ödeme ve dolandırıcılığı önleme için gerekli kendi çerezlerini kullanır; bunlar için Stripe'ın gizlilik politikası geçerlidir.",
          ],
        },
        {
          heading: "Analiz ve reklam çerezi yok",
          body: [
            "Analiz, takip veya reklam çerezi kullanmıyoruz. Bu değişirse bu tür çerezleri ancak bir çerez banner'ında onay vermenizden sonra kullanırız; tercihinizi istediğiniz zaman değiştirebilirsiniz.",
          ],
        },
      ],
    },

    imprint: {
      title: "Künye (Impressum)",
      updated: UPDATED,
      sections: [
        {
          heading: "§ 5 DDG uyarınca bilgiler",
          body: [
            c.company,
            c.address,
            `Temsilen Geschäftsführerin: ${c.managingDirector}`,
            `Ticaret sicili: ${c.register}`,
            `Telefon: ${c.phone}`,
            `E-posta: ${c.supportEmail}`,
            `İletişim formu: ${c.contactUrl}`,
          ],
        },
        {
          heading: "Dijital Hizmetler Yasası kapsamında iletişim noktası",
          body: [
            `Yetkili makamlar (DSA m. 11) ve kullanıcılar (DSA m. 12) için tek iletişim noktası: ${c.supportEmail} ve ${c.contactUrl}. Bize Almanca, İngilizce veya Türkçe yazabilirsiniz.`,
          ],
        },
        {
          heading: "Tüketici uyuşmazlıklarının çözümü",
          body: [
            "Bir tüketici hakem kurulu önündeki uyuşmazlık çözüm süreçlerine katılmaya istekli ve yükümlü değiliz.",
          ],
        },
      ],
    },

    "dmca-report": {
      title: "İçerik bildir",
      updated: UPDATED,
      sections: [
        {
          heading: "Nasıl bildirilir",
          body: [
            `${c.appName}'de yasa dışı olan, haklarınızı ihlal eden ya da sizi izniniz olmadan gösteren bir içerik bulursanız ${c.supportEmail} adresine yazın veya iletişim formunu (${c.contactUrl}) kullanın ve şunları belirtin:`,
            [
              "etkinlik linki (veya etkinliğin adı ve tarihi);",
              "fotoğrafın tarifi, örneğin kimin ne zaman yüklediği;",
              "içeriği neden yasa dışı bulduğunuz veya haklarınızın nasıl ihlal edildiği;",
              "adınız ve e-posta adresiniz; çocuk istismarı içeriği bildirimi anonim olarak yapılabilir;",
              "bilgilerinizin bildiğiniz kadarıyla doğru ve eksiksiz olduğuna dair beyan.",
            ],
            "Misafir olarak sizi gösteren bir fotoğrafın kaldırılmasını doğrudan etkinlik sahibinden de isteyebilirsiniz: etkinlik sahipleri her fotoğrafı istedikleri zaman silebilir.",
          ],
        },
        {
          heading: "Sonra ne olur",
          body: [
            "Bildiriminizin alındığını onaylar, her bildirimi hızla ve dikkatle inceler ve kararımızı size iletiriz. Açıkça yasa dışı içeriği hemen kaldırırız; etkinlik askıya alınabilir. Yasanın izin verdiği ölçüde etkilenen etkinlik sahibine kısıtlamaları ve gerekçelerini bildiririz. Çocuk istismarı içeriğini yetkili makamlara bildiririz.",
          ],
        },
      ],
    },
  };
}
