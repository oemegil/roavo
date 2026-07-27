export type TurkishDestinationOverride = {
  countryName?: string;
  shortDescription: string;
  longDescription: string;
  practicalNotes: string;
};

export const TURKISH_DESTINATION_OVERRIDES: Record<string, TurkishDestinationOverride> = {
  istanbul: {
    shortDescription: "Kıtaların kesişiminde tarihi mahalleler ve canlı bir yemek kültürü.",
    longDescription:
      "İstanbul, Bizans ve Osmanlı mirasını modern bir şehirle birleştirir. Tarihi yarımada, Boğaz feribotları ve yavaş tempoda keşfedilen mahalleler gezginlere çok şey sunar.",
    practicalNotes:
      "Toplu taşıma ve feribotlar birçok bölgeye ulaşır. Turistik semtlerde kartla ödeme yaygındır. Yazlar sıcak; ara mevsimler genelde daha rahattır.",
  },
  barcelona: {
    countryName: "İspanya",
    shortDescription: "Gaudí eserleri, plajlar ve pazarlarla Akdeniz şehir hayatı.",
    longDescription:
      "Barselona, mimari simgeleri yürünebilir eski şehir ve sahil şeridiyle bir araya getirir. Ana turistik güzergâhın ötesindeki mahallelere zaman ayırın.",
    practicalNotes:
      "Metro ve yürüyüş merkezi bölgeleri kapsar. Geç yemek yaygındır. Yazın ana cazibe merkezleri kalabalıktır.",
  },
  lisbon: {
    countryName: "Portekiz",
    shortDescription: "Tepelik manzaralar, çinili sokaklar ve Atlantik ışığı.",
    longDescription:
      "Lizbon, tramvay yolculukları, miradouro manzaraları ve sahil günübirlik gezilerini seven gezginlere hitap eder. Tarihi merkez kompakt ama engebelidir.",
    practicalNotes:
      "Tramvay ve yürüyüş iyi iş görür; dik sokaklara hazırlıklı olun. Şehir merkezinde kartla ödeme yaygındır.",
  },
  rome: {
    countryName: "İtalya",
    shortDescription: "Geniş bir başkentte antik simgeler ve mahalle trattoriaları.",
    longDescription:
      "Roma, antik çağdan günümüze katmanlı bir tarih sunar. Günleri birkaç önemli nokta etrafında planlayın; plansız mahalle yürüyüşleri için de zaman bırakın.",
    practicalNotes:
      "Metro ve yürüyüş turistik koridorları kapsar. Mümkünse popüler mekânları önceden ayırtın. Yazlar sıcak ve kalabalıktır.",
  },
  florence: {
    countryName: "İtalya",
    shortDescription: "Rönesans sanatı, kompakt tarihi sokaklar ve Toskana günübirlik gezileri.",
    longDescription:
      "Floransa müze severler ve yürüyüşçüler için idealdir. Tarihi merkez kompakttır; çevredeki Toskana kasabaları güçlü günübirlik rotalar sunar.",
    practicalNotes:
      "Çoğu nokta yürüyerek ulaşılabilir. Yoğun sezonda müze biletleri tükenir. Günübirlik geziler için tren düşünün.",
  },
  paris: {
    countryName: "Fransa",
    shortDescription: "Klasik bir başkentte müzeler, kafeler ve nehir kenarı mahalleler.",
    longDescription:
      "Paris, kısa bir kontrol listesinin ötesine geçen gezginlere de hitap eder. Metro, mahalleler arasında kolayca dolaşmayı sağlar.",
    practicalNotes:
      "Metro ve yürüyüş en yaygın ulaşım yollarıdır. Birçok müze haftanın bir günü kapalıdır. Yaz ve tatil dönemleri yoğundur.",
  },
  amsterdam: {
    countryName: "Hollanda",
    shortDescription: "Kanallar, müzeler ve bisiklete uygun mahalleler.",
    longDescription:
      "Amsterdam kompakt ve yürüyerek ya da bisikletle keşfedilebilir. Müzeler ve kanal bölgeleri yakın kasabalara günübirlik gezilerle iyi eşleşir.",
    practicalNotes:
      "Tramvay ve bisiklet yaygındır. Bisiklet şeritlerine dikkat edin. Popüler müzeler için önceden bilet gerekebilir.",
  },
  prague: {
    countryName: "Çekya",
    shortDescription: "Kale manzaraları, tarihi meydanlar ve yürünebilir eski şehir.",
    longDescription:
      "Prag'ın tarihi çekirdeği yoğun simgelerle doludur. En kalabalık meydanlardan kaçınmak için sabah erken ve akşam saatleri iyi çalışır.",
    practicalNotes:
      "Tramvay ve metro şehri iyi kapsar. Tarihi merkez yürüyerek keşfedilir. Yazın yoğunluk artar.",
  },
  budapest: {
    countryName: "Macaristan",
    shortDescription: "Termal hamamlar, nehir manzaraları ve ruin bar gece hayatı.",
    longDescription:
      "Budapeşte, Tuna'nın iki yakasında hamamlar, seyir noktaları ve canlı bir yemek sahnesi sunar. Şehir yürüyüşlerini hamam ziyaretiyle birleştirin.",
    practicalNotes:
      "Metro ve tramvay pratiktir. Termal hamamlar birçok ziyaretçi için öne çıkar. Turistik alanların dışında kart kabulü değişken olabilir.",
  },
  vienna: {
    countryName: "Avusturya",
    shortDescription: "İmparatorluk müzeleri, kahvehane kültürü ve yeşil parklar.",
    longDescription:
      "Viyana, müzeleri, klasik mimariyi ve sakin kafe molalarını seven gezginlere uygundur. Toplu taşıma şehirde gezinmeyi kolaylaştırır.",
    practicalNotes:
      "U-Bahn ve tramvay güvenilirdir. Birçok müze pazartesi kapalıdır. Kahvehaneler, gezi aralarında klasik bir duraktır.",
  },
  berlin: {
    countryName: "Almanya",
    shortDescription: "Katmanlı tarih, yaratıcı mahalleler ve geniş bir yemek sahnesi.",
    longDescription:
      "Berlin geniş ve mahalle odaklıdır. Her şeyi tek seferde görmeye çalışmak yerine birkaç bölgeye odaklanın.",
    practicalNotes:
      "U-Bahn ve S-Bahn uzun mesafeleri kapsar. Bazı bölgeler simgeler arasında seyrek hissedilebilir. Küçük mekânlarda nakit hâlâ işe yarar.",
  },
  copenhagen: {
    countryName: "Danimarka",
    shortDescription: "Tasarım odaklı mahalleler, bisikletler ve sahil yürüyüşleri.",
    longDescription:
      "Kopenhag yürüyüş ve bisiklet için yeterince kompakttır. Yemek ve tasarım sıklıkla gezi ritminin parçası olur.",
    practicalNotes:
      "Bisiklet ve metro yaygındır. Yeme-içme ve konaklama fiyatları yüksek gelebilir. Hava hızla değişir.",
  },
  athens: {
    countryName: "Yunanistan",
    shortDescription: "Antik simgeler ve etrafında canlı bir modern şehir.",
    longDescription:
      "Atina, önemli arkeolojik alanları mahalle yemekleri ve ada feribot bağlantılarıyla birleştirir.",
    practicalNotes:
      "Metro ana noktalara ulaşır. Yazlar sıcaktır; açık hava kalıntılarını serin saatlere planlayın. Feribotlar yakın adalara bağlanır.",
  },
  cappadocia: {
    shortDescription: "Peri bacaları, vadi yürüyüşleri ve mağara konakları.",
    longDescription:
      "Kapadokya, vadiler ve benzersiz kaya oluşumlarıyla bir bölgedir. Göreme gibi merkez kasabalar günübirlik yürüyüş ve seyir noktalarına kolay erişim sağlar.",
    practicalNotes:
      "Vadilere kısa sürüşler için merkez bir kasabada konaklayın. Hava açık hava planlarını etkileyebilir. Balon turları hava koşullarına bağlıdır ve isteğe bağlıdır.",
  },
  tokyo: {
    countryName: "Japonya",
    shortDescription: "Farklı karakterde mahalleler, yemek kültürü ve verimli ulaşım.",
    longDescription:
      "Tokyo'ya mahalle mahalle yaklaşmak en iyisidir. Toplu taşıma uzun mesafeleri yönetilebilir kılar; yemek keşfi tüm günü doldurabilir.",
    practicalNotes:
      "Tren ve metro seyahatin omurgasıdır. IC kartlar ulaşımı kolaylaştırır. Bazı küçük mekânlarda nakit hâlâ kullanışlıdır.",
  },
  kyoto: {
    countryName: "Japonya",
    shortDescription: "Tokyo'dan daha sakin tempoda tapınaklar, bahçeler ve tarihi semtler.",
    longDescription:
      "Kyoto, tarihi mekânlar ve daha sakin mahalleler isteyen gezginlere uygundur. Popüler tapınaklarda erken başlamak işe yarar.",
    practicalNotes:
      "Otobüs ve tren ana bölgeleri kapsar. Popüler noktalar öğlen kalabalıklaşır. Rahat yürüyüş ayakkabıları faydalıdır.",
  },
  bangkok: {
    countryName: "Tayland",
    shortDescription: "Tapınaklar, pazarlar ve geniş bir başkentte yoğun yemek sahnesi.",
    longDescription:
      "Bangkok, yemek odaklı gezginlere ve tapınakları nehir ile mahalle zamanıyla birleştirenlere hitap eder. Trafik yoğun olabilir; toplu taşıma yardımcı olur.",
    practicalNotes:
      "BTS/MRT trafik sürtünmesini azaltır. Sıcaklık ve nem belirgindir. Sokak yemeği birçok ziyaretçi için öne çıkar.",
  },
  singapore: {
    countryName: "Singapur",
    shortDescription: "Verimli ulaşım ve çeşitli yemeklerle kompakt bir şehir devleti.",
    longDescription:
      "Singapur gezinmesi kolaydır ve kısa konaklamalara uygundur. Mahalleler ve yemek salonları uzun yolculuklar olmadan çeşit sunar.",
    practicalNotes:
      "MRT çoğu ziyaretçi ihtiyacını karşılar. Kamusal alanlarda katı kurallar geçerlidir. Yeme fiyatları geniş bir aralıkta değişir.",
  },
  bali: {
    countryName: "Endonezya",
    shortDescription: "Plajlar, pirinç terasları ve tapınak kasabalarıyla ada bölgeleri.",
    longDescription:
      "Bali, farklı karakterde bölgelerden oluşan bir destinasyon kümesidir. Her şeyi kapsamaya çalışmak yerine plaj, kültür veya doğru önceliklere uygun bir üs seçin.",
    practicalNotes:
      "Bölgeler arasında scooter ve özel transfer yaygındır. Mesafeler kısa görünse de trafik değişkendir. Üs seçimini dikkatle yapın.",
  },
  "new-york-city": {
    countryName: "Amerika Birleşik Devletleri",
    shortDescription: "Yoğun mahalleler, müzeler ve hızlı bir kent temposu.",
    longDescription:
      "New York, odaklı mahalle günleriyle ödüllendirir. Toplu taşıma ve yürüyüş çoğu ihtiyacı karşılar; listeyi şişirmek yerine önceliklendirin.",
    practicalNotes:
      "Metro pratik omurgadır. İlçeler arası mesafeler önemlidir. Mevsimlere göre hava değişir.",
  },
  "san-francisco": {
    countryName: "Amerika Birleşik Devletleri",
    shortDescription: "Tepeler, sahil manzaraları ve kendine özgü mahalleler.",
    longDescription:
      "San Francisco kompakt ama engebelidir. Mahalle karakteri kısa mesafelerde hızla değişir.",
    practicalNotes:
      "Merkezi bölgelerde toplu taşıma ve yürüyüş iş görür. Sis ve serin yazlar bazı ziyaretçileri şaşırtır. Tepeler yürüyüş planlarını etkiler.",
  },
  "mexico-city": {
    countryName: "Meksika",
    shortDescription: "Geniş bir başkentte müzeler, pazarlar ve zengin yemek kültürü.",
    longDescription:
      "Meksiko City çok büyüktür; mahalleleri bilinçli seçin. Yemek ve müzeler birkaç günü birkaç bölgede doldurabilir.",
    practicalNotes:
      "Metro ve ride-hailing mesafelerde yardımcı olur. Rakım ve trafik tempoyu etkiler. Mahalle seçimi deneyimi şekillendirir.",
  },
  "buenos-aires": {
    countryName: "Arjantin",
    shortDescription: "Mahalle kafeleri, geç akşam yemekleri ve güçlü bir kültür takvimi.",
    longDescription:
      "Buenos Aires mahalle odaklıdır ve geç yemek kültürüne sahiptir. Yürünebilir semtler kafe molaları ve akşam planlarıyla iyi eşleşir.",
    practicalNotes:
      "Subte ve yürüyüş birçok ziyaretçi bölgesini kapsar. Akşam yemeği genelde geç başlar. Konaklama mahallesi deneyimi belirler.",
  },
  marrakech: {
    countryName: "Fas",
    shortDescription: "Medine sokakları, pazarlar ve avlulu riadlar.",
    longDescription:
      "Marakeş medine deneyimi etrafında şekillenir. Daha yavaş yürüyüş günleri planlayın ve yön bulmak için zaman ayırın.",
    practicalNotes:
      "Medine içinde yön bulmak sabır ister. Sıcaklık yoğun olabilir. Şehir dışı günübirlik gezilerde özel transfer yardımcı olur.",
  },
  "cape-town": {
    countryName: "Güney Afrika",
    shortDescription: "Dağ ve okyanus manzaraları, şarap bölgesi günübirlik gezileri.",
    longDescription:
      "Cape Town dramatik manzarayı mahalle yemekleri ve sahil sürüşleriyle birleştirir. Hava ve rüzgâr açık hava planlarını şekillendirebilir.",
    practicalNotes:
      "Sahil ve şarap rotaları için araç faydalıdır. Rüzgâr ve hava açık hava günlerinde hızla değişir. Ulaşımı düşünerek mahalle seçin.",
  },
  santorini: {
    countryName: "Yunanistan",
    shortDescription: "Uçurum köyleri, kaldera manzaraları ve Ege gün batımları.",
    longDescription:
      "Santorini kompakt ama popülerdir. Kalabalık endişeniz varsa seyir noktaları ve daha sakin köyler etrafında plan yapın.",
    practicalNotes:
      "Otobüs ve taksiler köyleri bağlar. Yaz kalabalığı ve sıcaklık belirgindir. Ara mevsimler daha rahat hissedilebilir.",
  },
  "amalfi-coast": {
    countryName: "İtalya",
    shortDescription: "Uçurum kasabaları, sahil yolları ve Akdeniz manzaraları.",
    longDescription:
      "Amalfi Kıyısı tek bir şehirden çok bir kasaba dizisidir. Bir üs seçin ve duraklar arasında otobüs veya feribot kullanın.",
    practicalNotes:
      "Yollar virajlı ve yoğun sezonda kalabalıktır. Feribotlar sürmekten daha kolay olabilir. Yazın konaklamayı erken ayırtın.",
  },
};

export function applyTurkishDestinationContent<
  T extends {
    slug: string;
    countryName: string;
    shortDescription: string;
    longDescription: string;
    practicalNotes: string;
  },
>(item: T): T {
  const tr = TURKISH_DESTINATION_OVERRIDES[item.slug];
  if (!tr) return item;
  return {
    ...item,
    countryName: tr.countryName ?? item.countryName,
    shortDescription: tr.shortDescription,
    longDescription: tr.longDescription,
    practicalNotes: tr.practicalNotes,
  };
}
