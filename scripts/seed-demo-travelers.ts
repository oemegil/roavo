/**
 * Demo seed: 5 public travelers with realistic public trips for Keşfet.
 * Usage: pnpm exec tsx scripts/seed-demo-travelers.ts
 *
 * Password for all accounts below: demo1234
 *   elif.deniz@roavo.demo      @elifdeniz
 *   marco.rossi@roavo.demo     @marcorossi
 *   ayla.kaya@roavo.demo       @aylakaya
 *   kenji.watanabe@roavo.demo  @kenjiw
 *   sofia.almeida@roavo.demo   @sofiaalmeida
 */
import { hash } from "@node-rs/argon2";
import { PrismaClient, type TravelPace } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile() {
  const path = resolve(process.cwd(), ".env");
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const PASSWORD = "demo1234";

const ARGON2_OPTIONS = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
  outputLen: 32,
} as const;

function utcDate(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m - 1, d));
}

type DaySeed = {
  date: Date;
  title: string;
  notes: string;
  items: Array<{
    type: "NOTE" | "ATTRACTION" | "RESTAURANT";
    title: string;
    description: string;
    locationName?: string;
  }>;
};

type TripSeed = {
  title: string;
  description: string;
  originName: string;
  originCountryCode: string;
  destinationName: string;
  destinationCountryCode: string;
  destinationRegionNameSnapshot: string;
  startDate: Date;
  endDate: Date;
  travelerCount: number;
  currencyCode: string;
  travelPace: TravelPace;
  interests: string[];
  likeCount: number;
  days: DaySeed[];
};

type TravelerSeed = {
  email: string;
  username: string;
  displayName: string;
  bio: string;
  travelerScoreMinor: number;
  homeCity: string;
  homeCountryCode: string;
  trips: TripSeed[];
};

const TRAVELERS: TravelerSeed[] = [
  {
    email: "elif.deniz@roavo.demo",
    username: "elifdeniz",
    displayName: "Elif Deniz",
    bio: "Sofra peşinde şehirler. Sabah kahvesi, akşam pazarı, arada bir tren.",
    travelerScoreMinor: 120,
    homeCity: "İstanbul",
    homeCountryCode: "TR",
    trips: [
      {
        title: "Lizbon’da yavaş bir hafta sonu",
        description:
          "Tramvay 28, pastéis de nata ve Tejo’nun üstünde turuncu akşamlar. Yemek ve mahalle notlarıyla kısa bir Lizbon günlüğü.",
        originName: "İstanbul",
        originCountryCode: "TR",
        destinationName: "Lizbon",
        destinationCountryCode: "PT",
        destinationRegionNameSnapshot: "Alfama · Belém · Bairro Alto",
        startDate: utcDate(2026, 5, 9),
        endDate: utcDate(2026, 5, 11),
        travelerCount: 2,
        currencyCode: "EUR",
        travelPace: "RELAXED",
        interests: ["FOOD", "CULTURE", "PHOTOGRAPHY"],
        likeCount: 14,
        days: [
          {
            date: utcDate(2026, 5, 9),
            title: "Alfama’da kaybolmak",
            notes: "Dar sokaklar, çamaşır ipleri, fado sesi uzaktan.",
            items: [
              {
                type: "NOTE",
                title: "Günün notu",
                description:
                  "Sabah Mirodouro da Senhora do Monte’den şehre baktım. Öğleden sonra Alfama’da rastgele yürüdüm; harita kapalı, sadece yokuşlar açık.",
              },
              {
                type: "RESTAURANT",
                title: "Time Out Market öğle molası",
                description: "Kalabalık ama hızlı bir giriş için iyi.",
                locationName: "Mercado da Ribeira, Lizbon",
              },
            ],
          },
          {
            date: utcDate(2026, 5, 10),
            title: "Belém ve pastéis",
            notes: "Turistik ama pastéis hâlâ değer.",
            items: [
              {
                type: "ATTRACTION",
                title: "Mosteiro dos Jerónimos",
                description: "Sabah erken girmek kuyruğu yarıya indiriyor.",
                locationName: "Belém, Lizbon",
              },
              {
                type: "RESTAURANT",
                title: "Pastéis de Belém",
                description:
                  "İçeride oturup tarçınla yemek dışarıdaki acele yiğitliğinden daha iyi.",
                locationName: "Pastéis de Belém",
              },
            ],
          },
          {
            date: utcDate(2026, 5, 11),
            title: "Bairro Alto akşamı",
            notes: "Şarap, küçük tapas, yavaş kapanış.",
            items: [
              {
                type: "NOTE",
                title: "Günün notu",
                description:
                  "Gündüz LX Factory’de dolaştım. Akşam Bairro Alto’da bir masada oturduk; şehir yüksek sesle ama sıcak kapanıyor.",
              },
            ],
          },
        ],
      },
      {
        title: "Seul’de sokak lezzetleri",
        description:
          "Hongdae’den Gwangjang’a, sabah marketinden gece pojangmacha’ya: üç gün yemek rotası.",
        originName: "İstanbul",
        originCountryCode: "TR",
        destinationName: "Seul",
        destinationCountryCode: "KR",
        destinationRegionNameSnapshot: "Hongdae · Jongno · Gangnam",
        startDate: utcDate(2026, 3, 14),
        endDate: utcDate(2026, 3, 16),
        travelerCount: 1,
        currencyCode: "KRW",
        travelPace: "BALANCED",
        interests: ["FOOD", "CULTURE", "NIGHTLIFE"],
        likeCount: 22,
        days: [
          {
            date: utcDate(2026, 3, 14),
            title: "Hongdae ısınması",
            notes: "Genç mahalle, sokak sanatları, hotteok.",
            items: [
              {
                type: "RESTAURANT",
                title: "Hongdae street food",
                description: "Akşamüstü tezgâhlardan hotteok ve tteokbokki.",
                locationName: "Hongdae, Seul",
              },
            ],
          },
          {
            date: utcDate(2026, 3, 15),
            title: "Gwangjang Market",
            notes: "Maydanoz yeşili bannchan tabakları, kalabalık masalar.",
            items: [
              {
                type: "RESTAURANT",
                title: "Bindaetteok ve mayak gimbap",
                description: "Öğle için marketin kalbinde oturmak şart.",
                locationName: "Gwangjang Market",
              },
              {
                type: "ATTRACTION",
                title: "Changdeokgung gizli bahçe",
                description: "Yemek sonrası sakin bir nefes.",
                locationName: "Changdeokgung, Seul",
              },
            ],
          },
          {
            date: utcDate(2026, 3, 16),
            title: "Gece pojangmacha",
            notes: "Plastik sandalyeler, soju, yağmur.",
            items: [
              {
                type: "NOTE",
                title: "Günün notu",
                description:
                  "Son akşam Jongno’da bir pojangmacha’da oturdum. Menü İngilizce değildi; işaretle sipariş ettim, pişman olmadım.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    email: "marco.rossi@roavo.demo",
    username: "marcorossi",
    displayName: "Marco Rossi",
    bio: "Dağ, tozlu patikalar ve erken kalkışlar. Haritada kırmızı çizgi sevenlerden.",
    travelerScoreMinor: 95,
    homeCity: "Milano",
    homeCountryCode: "IT",
    trips: [
      {
        title: "Kapadokya’da iki gün",
        description:
          "Peribacaları, Göreme vadileri ve bir sabah balonu. Kısa ama yoğun bir Kapadokya kaçamakı.",
        originName: "Milano",
        originCountryCode: "IT",
        destinationName: "Göreme",
        destinationCountryCode: "TR",
        destinationRegionNameSnapshot: "Göreme · Uçhisar · Ortahisar",
        startDate: utcDate(2026, 4, 18),
        endDate: utcDate(2026, 4, 19),
        travelerCount: 2,
        currencyCode: "TRY",
        travelPace: "BALANCED",
        interests: ["NATURE", "PHOTOGRAPHY", "HIKING"],
        likeCount: 31,
        days: [
          {
            date: utcDate(2026, 4, 18),
            title: "Göreme açık hava müzesi",
            notes: "Freskler ve öğleden sonra Rose Valley yürüyüşü.",
            items: [
              {
                type: "ATTRACTION",
                title: "Göreme Open Air Museum",
                description: "Sabah erken girmek gölge ve kalabalık açısından iyi.",
                locationName: "Göreme",
              },
              {
                type: "NOTE",
                title: "Günün notu",
                description:
                  "Öğleden sonra Rose Valley’de yürüdük. Akşam Ürgüp’te şarap tadımıyla kapattık.",
              },
            ],
          },
          {
            date: utcDate(2026, 4, 19),
            title: "Balon sabahı",
            notes: "05:00 alarm, soğuk hava, sıcak kahve.",
            items: [
              {
                type: "ATTRACTION",
                title: "Sıcak hava balonu",
                description: "Bulutsuz bir sabah yakalarsan manzara affedilmez.",
                locationName: "Göreme gökyüzü",
              },
            ],
          },
        ],
      },
      {
        title: "Dolomitler’de yürüyüş",
        description:
          "Tre Cime çevresinde iki günlük patika, dağ kulübesi ve akşam çorbası.",
        originName: "Milano",
        originCountryCode: "IT",
        destinationName: "Cortina d’Ampezzo",
        destinationCountryCode: "IT",
        destinationRegionNameSnapshot: "Tre Cime · Lago di Braies",
        startDate: utcDate(2026, 7, 4),
        endDate: utcDate(2026, 7, 6),
        travelerCount: 1,
        currencyCode: "EUR",
        travelPace: "FAST_PACED",
        interests: ["HIKING", "NATURE", "PHOTOGRAPHY"],
        likeCount: 18,
        days: [
          {
            date: utcDate(2026, 7, 4),
            title: "Lago di Braies ısınması",
            notes: "Turkuaz göl, kısa tur, erken dönüş.",
            items: [
              {
                type: "ATTRACTION",
                title: "Lago di Braies",
                description: "Sabah 8’den önce gel; otopark dolmadan.",
                locationName: "Pragser Wildsee",
              },
            ],
          },
          {
            date: utcDate(2026, 7, 5),
            title: "Tre Cime turu",
            notes: "Klasik döngü, sert rüzgâr, ödüllü manzara.",
            items: [
              {
                type: "NOTE",
                title: "Günün notu",
                description:
                  "Rifugio Auronzo’dan başladım. Öğle molasında rifugio’da çorba içmek moral düzeltiyor.",
              },
            ],
          },
          {
            date: utcDate(2026, 7, 6),
            title: "Cortina’da yavaş kapanış",
            notes: "Kasaba kahvesi ve bacak dinlendirme.",
            items: [
              {
                type: "RESTAURANT",
                title: "Cortina öğle kahvesi",
                description: "Yürüyüş sonrası jambonlu sandviç yeter.",
                locationName: "Cortina d’Ampezzo",
              },
            ],
          },
        ],
      },
      {
        title: "İzlanda ring’inden bir dilim",
        description:
          "Reykjavík çıkışlı üç gün: Golden Circle, Güney Sahil şelaleleri ve siyah kum.",
        originName: "Milano",
        originCountryCode: "IT",
        destinationName: "Reykjavík",
        destinationCountryCode: "IS",
        destinationRegionNameSnapshot: "Golden Circle · South Coast",
        startDate: utcDate(2025, 9, 12),
        endDate: utcDate(2025, 9, 14),
        travelerCount: 2,
        currencyCode: "ISK",
        travelPace: "BALANCED",
        interests: ["NATURE", "PHOTOGRAPHY", "ROAD_TRIP"],
        likeCount: 27,
        days: [
          {
            date: utcDate(2025, 9, 12),
            title: "Golden Circle",
            notes: "Þingvellir, Geysir, Gullfoss.",
            items: [
              {
                type: "ATTRACTION",
                title: "Gullfoss",
                description: "Yağmurluk şart; sprey her yere ulaşıyor.",
                locationName: "Gullfoss",
              },
            ],
          },
          {
            date: utcDate(2025, 9, 13),
            title: "Güney sahil",
            notes: "Seljalandsfoss, Skógafoss, Reynisfjara.",
            items: [
              {
                type: "ATTRACTION",
                title: "Reynisfjara siyah kum",
                description: "Dalgaya yaklaşma uyarılarını ciddiye al.",
                locationName: "Reynisfjara",
              },
            ],
          },
          {
            date: utcDate(2025, 9, 14),
            title: "Reykjavík dönüş",
            notes: "Harpa ve liman yürüyüşü.",
            items: [
              {
                type: "NOTE",
                title: "Günün notu",
                description:
                  "Son gün şehre döndük. Akşam balık çorbası ve erken uyku — rüzgâr hâlâ kulaklarda.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    email: "ayla.kaya@roavo.demo",
    username: "aylakaya",
    displayName: "Ayla Kaya",
    bio: "Şehir kaçamakları, müze biletleri ve iyi otel kahvaltıları.",
    travelerScoreMinor: 70,
    homeCity: "Ankara",
    homeCountryCode: "TR",
    trips: [
      {
        title: "Paris’te müze haftası",
        description:
          "Louvre’u parçalara bölmek, Seine kenarında yürüyüş ve Montmartre akşamı.",
        originName: "Ankara",
        originCountryCode: "TR",
        destinationName: "Paris",
        destinationCountryCode: "FR",
        destinationRegionNameSnapshot: "Louvre · Marais · Montmartre",
        startDate: utcDate(2026, 2, 20),
        endDate: utcDate(2026, 2, 22),
        travelerCount: 1,
        currencyCode: "EUR",
        travelPace: "RELAXED",
        interests: ["CULTURE", "MUSEUMS", "FOOD"],
        likeCount: 11,
        days: [
          {
            date: utcDate(2026, 2, 20),
            title: "Louvre — sadece bir kanat",
            notes: "Her şeyi görmeye çalışma kuralı.",
            items: [
              {
                type: "ATTRACTION",
                title: "Louvre Denon kanadı",
                description: "2–3 saat yeter; çıkınca Tuileries’de otur.",
                locationName: "Musée du Louvre",
              },
            ],
          },
          {
            date: utcDate(2026, 2, 21),
            title: "Marais ve falafel",
            notes: "Dükkânlar, avlular, L’As du Fallafel kuyruğu.",
            items: [
              {
                type: "RESTAURANT",
                title: "L’As du Fallafel",
                description: "Kuyruk uzun; al-götür daha hızlı.",
                locationName: "Le Marais, Paris",
              },
            ],
          },
          {
            date: utcDate(2026, 2, 22),
            title: "Montmartre akşamı",
            notes: "Basilique’ten şehir ışıkları.",
            items: [
              {
                type: "NOTE",
                title: "Günün notu",
                description:
                  "Gün batımında Sacré-Cœur basamaklarında oturdum. Paris uzaktan daha sessiz duruyor.",
              },
            ],
          },
        ],
      },
      {
        title: "Barcelona tapas rotası",
        description: "Gothic Quarter labirenti, Born’da şarap ve Barceloneta’da deniz.",
        originName: "Ankara",
        originCountryCode: "TR",
        destinationName: "Barcelona",
        destinationCountryCode: "ES",
        destinationRegionNameSnapshot: "Gothic · Born · Barceloneta",
        startDate: utcDate(2026, 6, 6),
        endDate: utcDate(2026, 6, 8),
        travelerCount: 2,
        currencyCode: "EUR",
        travelPace: "BALANCED",
        interests: ["FOOD", "CULTURE", "NIGHTLIFE"],
        likeCount: 9,
        days: [
          {
            date: utcDate(2026, 6, 6),
            title: "Gothic kayboluş",
            notes: "Haritasız dar sokaklar.",
            items: [
              {
                type: "ATTRACTION",
                title: "Barcelona Katedrali çevresi",
                description: "Öğleden sonra gölge aramak için ideal.",
                locationName: "Barri Gòtic",
              },
            ],
          },
          {
            date: utcDate(2026, 6, 7),
            title: "Born tapas",
            notes: "Küçük tabaklar, uzun sohbet.",
            items: [
              {
                type: "RESTAURANT",
                title: "El Born şarap barı",
                description: "Rezervasyonsuz erken git.",
                locationName: "El Born",
              },
            ],
          },
          {
            date: utcDate(2026, 6, 8),
            title: "Barceloneta",
            notes: "Deniz, paella tuzağına düşmeden salata.",
            items: [
              {
                type: "NOTE",
                title: "Günün notu",
                description:
                  "Sabah plajda yürüdük, öğleden sonra Parc de la Ciutadella’da uzandık. Şehir sıcak ama tempo düşük tutulursa keyifli.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    email: "kenji.watanabe@roavo.demo",
    username: "kenjiw",
    displayName: "Kenji Watanabe",
    bio: "Işık peşinde. Sabah sisleri, gece neonları, ara sokaklar.",
    travelerScoreMinor: 150,
    homeCity: "Osaka",
    homeCountryCode: "JP",
    trips: [
      {
        title: "Kyoto’da erken saatler",
        description:
          "Fushimi Inari şafakta, Arashiyama bambu ormanı ve Gion’da yavaş akşam.",
        originName: "Osaka",
        originCountryCode: "JP",
        destinationName: "Kyoto",
        destinationCountryCode: "JP",
        destinationRegionNameSnapshot: "Fushimi · Arashiyama · Gion",
        startDate: utcDate(2026, 1, 10),
        endDate: utcDate(2026, 1, 12),
        travelerCount: 1,
        currencyCode: "JPY",
        travelPace: "RELAXED",
        interests: ["PHOTOGRAPHY", "CULTURE", "NATURE"],
        likeCount: 41,
        days: [
          {
            date: utcDate(2026, 1, 10),
            title: "Fushimi Inari şafak",
            notes: "Kapılar boşken başka bir yer.",
            items: [
              {
                type: "ATTRACTION",
                title: "Fushimi Inari Taisha",
                description: "06:00’dan önce başla; tur otobüslerinden önce bitir.",
                locationName: "Fushimi Inari, Kyoto",
              },
            ],
          },
          {
            date: utcDate(2026, 1, 11),
            title: "Arashiyama",
            notes: "Bambu, maymun parkı, nehir kenarı.",
            items: [
              {
                type: "ATTRACTION",
                title: "Bambu ormanı",
                description: "Ana yol kalabalık; yan patikalar daha sessiz.",
                locationName: "Arashiyama",
              },
            ],
          },
          {
            date: utcDate(2026, 1, 12),
            title: "Gion akşamı",
            notes: "Ahşap evler, yumuşak ışık.",
            items: [
              {
                type: "NOTE",
                title: "Günün notu",
                description:
                  "Son akşam Shirakawa’da yürüdüm. Fotoğraf makinesi çantada kaldı; sadece bakmak yetti.",
              },
            ],
          },
        ],
      },
      {
        title: "Marrakech renkleri",
        description: "Medina labirenti, Jardin Majorelle ve Jemaa el-Fna’da gün batımı.",
        originName: "Osaka",
        originCountryCode: "JP",
        destinationName: "Marrakech",
        destinationCountryCode: "MA",
        destinationRegionNameSnapshot: "Medina · Majorelle · Jemaa el-Fna",
        startDate: utcDate(2025, 11, 3),
        endDate: utcDate(2025, 11, 5),
        travelerCount: 1,
        currencyCode: "MAD",
        travelPace: "BALANCED",
        interests: ["PHOTOGRAPHY", "CULTURE", "FOOD"],
        likeCount: 19,
        days: [
          {
            date: utcDate(2025, 11, 3),
            title: "Medina kayboluşu",
            notes: "Harita işe yaramıyor; kabul et.",
            items: [
              {
                type: "NOTE",
                title: "Günün notu",
                description:
                  "Sabah riad’dan çıktım, öğlene kadar pazarlarda döndüm. Çay ikramlarını reddetmek zor ama bazen gerekli.",
              },
            ],
          },
          {
            date: utcDate(2025, 11, 4),
            title: "Majorelle bahçesi",
            notes: "Mavi duvarlar, kaktüsler, gölge.",
            items: [
              {
                type: "ATTRACTION",
                title: "Jardin Majorelle",
                description: "Online bilet al; öğlen sıcağından kaçın.",
                locationName: "Jardin Majorelle",
              },
            ],
          },
          {
            date: utcDate(2025, 11, 5),
            title: "Jemaa el-Fna akşamı",
            notes: "Davullar, buhar, turuncu gökyüzü.",
            items: [
              {
                type: "ATTRACTION",
                title: "Jemaa el-Fna gün batımı",
                description: "Çatı kafeden izlemek meydandan daha sakin.",
                locationName: "Jemaa el-Fna",
              },
            ],
          },
        ],
      },
      {
        title: "New York gece ışıkları",
        description: "Brooklyn Bridge şafak, MoMA öğleden sonrası ve Midtown neonları.",
        originName: "Osaka",
        originCountryCode: "JP",
        destinationName: "New York",
        destinationCountryCode: "US",
        destinationRegionNameSnapshot: "Brooklyn · Midtown · Lower East Side",
        startDate: utcDate(2026, 4, 2),
        endDate: utcDate(2026, 4, 4),
        travelerCount: 1,
        currencyCode: "USD",
        travelPace: "FAST_PACED",
        interests: ["PHOTOGRAPHY", "CULTURE", "NIGHTLIFE"],
        likeCount: 16,
        days: [
          {
            date: utcDate(2026, 4, 2),
            title: "Brooklyn Bridge şafak",
            notes: "Soğuk ama değiyor.",
            items: [
              {
                type: "ATTRACTION",
                title: "Brooklyn Bridge yürüyüşü",
                description: "Güneş doğmadan köprüye çık.",
                locationName: "Brooklyn Bridge",
              },
            ],
          },
          {
            date: utcDate(2026, 4, 3),
            title: "MoMA ve LES",
            notes: "Müze sonrası pizza dilimi.",
            items: [
              {
                type: "ATTRACTION",
                title: "MoMA",
                description: "Cuma akşamları kalabalık; gündüz daha iyi.",
                locationName: "Museum of Modern Art",
              },
            ],
          },
          {
            date: utcDate(2026, 4, 4),
            title: "Midtown gece",
            notes: "Times Square’i uzaktan izlemek yeterli.",
            items: [
              {
                type: "NOTE",
                title: "Günün notu",
                description:
                  "Son gece High Line’da yürüdüm. Şehir gürültülü; yine de ritmi tutulunca sakinleşiyor.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    email: "sofia.almeida@roavo.demo",
    username: "sofiaalmeida",
    displayName: "Sofia Almeida",
    bio: "Yavaş seyahat. Bir mahallede bir hafta, bir kafede üç sabah.",
    travelerScoreMinor: 88,
    homeCity: "Porto",
    homeCountryCode: "PT",
    trips: [
      {
        title: "Porto’da nehir günleri",
        description:
          "Ribeira’da yürüyüş, Vila Nova de Gaia’da porto tadımı ve Livraria Lello kuyruğu.",
        originName: "Porto",
        originCountryCode: "PT",
        destinationName: "Porto",
        destinationCountryCode: "PT",
        destinationRegionNameSnapshot: "Ribeira · Gaia · Cedofeita",
        startDate: utcDate(2026, 5, 1),
        endDate: utcDate(2026, 5, 3),
        travelerCount: 1,
        currencyCode: "EUR",
        travelPace: "RELAXED",
        interests: ["FOOD", "CULTURE", "PHOTOGRAPHY"],
        likeCount: 13,
        days: [
          {
            date: utcDate(2026, 5, 1),
            title: "Ribeira sabahı",
            notes: "Dourou’nun sisli hali.",
            items: [
              {
                type: "NOTE",
                title: "Günün notu",
                description:
                  "Kendi şehrimde turist gibi yürüdüm. Bazen en iyi rota evin iki sokak ötesi.",
              },
            ],
          },
          {
            date: utcDate(2026, 5, 2),
            title: "Gaia tadım",
            notes: "Nehir karşıdan daha güzel.",
            items: [
              {
                type: "RESTAURANT",
                title: "Porto wine cellar",
                description: "Öğleden sonra tadım, akşam erken dönüş.",
                locationName: "Vila Nova de Gaia",
              },
            ],
          },
          {
            date: utcDate(2026, 5, 3),
            title: "Kitapçı ve kahve",
            notes: "Lello kalabalık; yan sokaktaki kafe kurtardı.",
            items: [
              {
                type: "ATTRACTION",
                title: "Livraria Lello",
                description: "Bilet al, ama asıl keyfi dışarıdaki yürüyüşte bul.",
                locationName: "Livraria Lello",
              },
            ],
          },
        ],
      },
      {
        title: "Bali’de yavaş tempo",
        description:
          "Ubud pirinç tarlaları, Canggu gün batımı ve bir gün tamamen hiçbir şey.",
        originName: "Porto",
        originCountryCode: "PT",
        destinationName: "Ubud",
        destinationCountryCode: "ID",
        destinationRegionNameSnapshot: "Ubud · Canggu",
        startDate: utcDate(2025, 8, 8),
        endDate: utcDate(2025, 8, 10),
        travelerCount: 2,
        currencyCode: "IDR",
        travelPace: "RELAXED",
        interests: ["NATURE", "WELLNESS", "FOOD"],
        likeCount: 24,
        days: [
          {
            date: utcDate(2025, 8, 8),
            title: "Ubud pirinçleri",
            notes: "Tegallalang erken saatlerde.",
            items: [
              {
                type: "ATTRACTION",
                title: "Tegallalang Rice Terrace",
                description: "08:00’den önce gel; ışık ve kalabalık için.",
                locationName: "Tegallalang",
              },
            ],
          },
          {
            date: utcDate(2025, 8, 9),
            title: "Canggu gün batımı",
            notes: "Surf sesi, smoothie bowl, yavaş akşam.",
            items: [
              {
                type: "NOTE",
                title: "Günün notu",
                description:
                  "Bütün öğleden sonra plajda oturduk. Plan yoktu; bu da plandı.",
              },
            ],
          },
          {
            date: utcDate(2025, 8, 10),
            title: "Hiçbir şey günü",
            notes: "Villa havuzu ve kitap.",
            items: [
              {
                type: "NOTE",
                title: "Günün notu",
                description:
                  "Son gün seyahat etmedik. Bazen en iyi anı, hareket etmemektir.",
              },
            ],
          },
        ],
      },
    ],
  },
];

async function upsertTraveler(
  prisma: PrismaClient,
  passwordHash: string,
  traveler: TravelerSeed,
) {
  const emailNormalized = traveler.email.toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { emailNormalized },
    include: { profile: true },
  });

  let userId: string;
  if (existing) {
    userId = existing.id;
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        status: "ACTIVE",
        deletedAt: null,
        travelerScoreMinor: traveler.travelerScoreMinor,
        accountVisibility: "PUBLIC",
      },
    });
    if (existing.profile) {
      await prisma.userProfile.update({
        where: { userId },
        data: {
          username: traveler.username,
          usernameNormalized: traveler.username,
          displayName: traveler.displayName,
          bio: traveler.bio,
          homeCity: traveler.homeCity,
          homeCountryCode: traveler.homeCountryCode,
        },
      });
    }
    console.log("Updated", traveler.email);
  } else {
    const user = await prisma.user.create({
      data: {
        email: traveler.email,
        emailNormalized,
        passwordHash,
        status: "ACTIVE",
        role: "USER",
        travelerScoreMinor: traveler.travelerScoreMinor,
        accountVisibility: "PUBLIC",
        profile: {
          create: {
            username: traveler.username,
            usernameNormalized: traveler.username,
            displayName: traveler.displayName,
            bio: traveler.bio,
            homeCity: traveler.homeCity,
            homeCountryCode: traveler.homeCountryCode,
            travelPreferences: {},
          },
        },
      },
    });
    userId = user.id;
    console.log("Created", traveler.email);
  }

  const keepTitles = new Set(traveler.trips.map((t) => t.title));
  await prisma.trip.updateMany({
    where: {
      ownerId: userId,
      deletedAt: null,
      title: { notIn: [...keepTitles] },
    },
    data: { deletedAt: new Date(), visibility: "PRIVATE" },
  });

  for (const tripSeed of traveler.trips) {
    let trip = await prisma.trip.findFirst({
      where: { ownerId: userId, title: tripSeed.title, deletedAt: null },
    });

    const tripData = {
      description: tripSeed.description,
      status: "DRAFT" as const,
      visibility: "PUBLIC" as const,
      originName: tripSeed.originName,
      originCountryCode: tripSeed.originCountryCode,
      destinationName: tripSeed.destinationName,
      destinationCountryCode: tripSeed.destinationCountryCode,
      destinationRegionNameSnapshot: tripSeed.destinationRegionNameSnapshot,
      destinationSource: "MANUAL" as const,
      startDate: tripSeed.startDate,
      endDate: tripSeed.endDate,
      travelerCount: tripSeed.travelerCount,
      currencyCode: tripSeed.currencyCode,
      travelPace: tripSeed.travelPace,
      interests: tripSeed.interests,
      likeCount: tripSeed.likeCount,
      commentCount: 0,
      additionalNotes: "roavo-demo-seed",
    };

    if (trip) {
      await prisma.itineraryItem.deleteMany({
        where: { tripDay: { tripId: trip.id } },
      });
      await prisma.tripDay.deleteMany({ where: { tripId: trip.id } });
      await prisma.tripComment.deleteMany({ where: { tripId: trip.id } });
      trip = await prisma.trip.update({
        where: { id: trip.id },
        data: tripData,
      });
      console.log("  reset trip:", tripSeed.title);
    } else {
      trip = await prisma.trip.create({
        data: {
          ownerId: userId,
          title: tripSeed.title,
          ...tripData,
        },
      });
      console.log("  created trip:", tripSeed.title);
    }

    for (const [index, day] of tripSeed.days.entries()) {
      await prisma.tripDay.create({
        data: {
          tripId: trip.id,
          date: day.date,
          title: day.title,
          notes: day.notes,
          position: index,
          items: {
            create: day.items.map((item, itemIndex) => ({
              type: item.type,
              title: item.title,
              description: item.description,
              locationName: item.locationName,
              position: itemIndex,
              source: "MANUAL",
            })),
          },
        },
      });
    }
  }

  return {
    email: traveler.email,
    username: traveler.username,
    displayName: traveler.displayName,
  };
}

async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL / DIRECT_URL missing");
  }

  const prisma = new PrismaClient({ datasources: { db: { url } } });

  try {
    const passwordHash = await hash(PASSWORD, ARGON2_OPTIONS);
    const results = [];
    for (const traveler of TRAVELERS) {
      results.push(await upsertTraveler(prisma, passwordHash, traveler));
    }

    console.log("\nDemo travelers ready (all PUBLIC):");
    console.log(`  password for all: ${PASSWORD}`);
    for (const row of results) {
      console.log(`  ${row.displayName}  @${row.username}  ${row.email}`);
    }
    console.log(`\n${TRAVELERS.length} profiles, trips visible on Keşfet (Herkes).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
