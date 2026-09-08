/* products.js — an exact mirror of data/products.json.
   data/products.json is the source of truth; the page fetches it normally.
   It only exists so the site still works when index.html is opened by
   double-clicking, because the file:// protocol blocks fetch().
   Regenerate after editing the JSON:
     python3 tools/mirror.py
*/

var NABTA_PRODUCTS = [
  {
    "id": "bird-of-paradise",
    "index": "01",
    "name": "Bird of Paradise",
    "nameAr": "طائر الجنة",
    "latinName": "Strelitzia nicolai",
    "price": 26.5,
    "art": "birdOfParadise",
    "photo": "images/bird-of-paradise.jpg",
    "heightNow": 60,
    "heightMature": 210,
    "growYears": "3–4",
    "growYearsAr": "٣–٤",
    "light": "bright",
    "difficulty": "medium",
    "petSafe": false,
    "inStock": true,
    "hasPhoto": false,
    "wateringDays": 7,
    "rotateDays": 14,
    "fertilizeDays": 30,
    "potSizes": [
      { "label": "24 cm", "delta": 0 },
      { "label": "30 cm", "delta": 4 },
      { "label": "36 cm", "delta": 9 }
    ],
    "description": "Architectural paddle leaves that fan out like sails. Give it the brightest corner you have and it will become the single tallest thing in the room.",
    "descriptionAr": "أوراق عريضة تتفتح كأشرعة السفن. ضعها في أكثر زاوية مشمسة في منزلك وستصبح أطول عنصر في الغرفة.",
    "care": [
      "Water when the top 3 cm of soil is dry",
      "Loves bright indirect light, tolerates some direct sun",
      "Wipe the leaves monthly — they collect dust fast",
      "Rotate every two weeks so it grows evenly"
    ],
    "careAr": [
      "اسقها عندما تجف أول ٣ سم من التربة",
      "تحب الضوء الساطع غير المباشر وتتحمل بعض الشمس",
      "امسح الأوراق شهرياً فهي تجمع الغبار بسرعة",
      "أدرها كل أسبوعين لتنمو بشكل متوازن"
    ]
  },
  {
    "id": "fiddle-leaf-fig",
    "index": "02",
    "name": "Fiddle Leaf Fig",
    "nameAr": "التين ذو الأوراق الكمانية",
    "latinName": "Ficus lyrata",
    "price": 24.0,
    "art": "fiddleLeafFig",
    "photo": "images/fiddle-leaf-fig.jpg",
    "heightNow": 75,
    "heightMature": 240,
    "growYears": "4–5",
    "growYearsAr": "٤–٥",
    "light": "bright",
    "difficulty": "expert",
    "petSafe": false,
    "inStock": true,
    "hasPhoto": false,
    "wateringDays": 7,
    "rotateDays": 21,
    "fertilizeDays": 30,
    "potSizes": [
      { "label": "26 cm", "delta": 0 },
      { "label": "32 cm", "delta": 5 },
      { "label": "38 cm", "delta": 11 }
    ],
    "description": "The designer's houseplant. Glossy violin-shaped leaves on a single slim trunk. Fussy about being moved, spectacular once it settles.",
    "descriptionAr": "نبتة المصممين. أوراق لامعة على شكل كمان تنمو على ساق واحدة نحيلة. لا تحب التنقل، لكنها مذهلة بعد أن تستقر.",
    "care": [
      "Pick one bright spot and never move it",
      "Water only when the soil is dry 5 cm down",
      "Keep away from air-conditioning draughts",
      "Dust the leaves to keep them glossy"
    ],
    "careAr": [
      "اختر مكاناً ساطعاً واحداً ولا تحركها منه",
      "اسقها فقط عندما تجف التربة بعمق ٥ سم",
      "أبعدها عن تيار المكيف المباشر",
      "نظّف الأوراق لتبقى لامعة"
    ]
  },
  {
    "id": "monstera-deliciosa",
    "index": "03",
    "name": "Monstera Deliciosa",
    "nameAr": "مونستيرا ديليسيوسا",
    "latinName": "Monstera deliciosa",
    "price": 19.5,
    "art": "monstera",
    "photo": "images/monstera-deliciosa.jpg",
    "heightNow": 55,
    "heightMature": 180,
    "growYears": "3",
    "growYearsAr": "٣",
    "light": "bright",
    "difficulty": "easy",
    "petSafe": false,
    "inStock": true,
    "hasPhoto": false,
    "wateringDays": 7,
    "rotateDays": 14,
    "fertilizeDays": 30,
    "potSizes": [
      { "label": "24 cm", "delta": 0 },
      { "label": "30 cm", "delta": 4 },
      { "label": "36 cm", "delta": 8 }
    ],
    "description": "Starts with plain heart-shaped leaves, then begins carving its famous windows as it matures. The most forgiving statement plant there is.",
    "descriptionAr": "تبدأ بأوراق قلبية بسيطة، ثم تنحت فتحاتها الشهيرة كلما نمت. أكثر نبتة مميزة تتحمل الإهمال.",
    "care": [
      "Water weekly, let the top soil dry between drinks",
      "Bright indirect light brings out the splits",
      "Give it a moss pole to climb after year two",
      "Mist occasionally in the Kuwait summer"
    ],
    "careAr": [
      "اسقها أسبوعياً واترك سطح التربة يجف بين الريّات",
      "الضوء الساطع غير المباشر يبرز الفتحات",
      "أضف لها عموداً لتتسلقه بعد السنة الثانية",
      "رشها بالماء أحياناً في صيف الكويت"
    ]
  },
  {
    "id": "golden-pothos",
    "index": "04",
    "name": "Golden Pothos",
    "nameAr": "البوتس الذهبي",
    "latinName": "Epipremnum aureum",
    "price": 7.5,
    "art": "pothos",
    "photo": "images/golden-pothos.jpg",
    "heightNow": 35,
    "heightMature": 200,
    "growYears": "2",
    "growYearsAr": "٢",
    "light": "low",
    "difficulty": "easy",
    "petSafe": false,
    "inStock": true,
    "hasPhoto": false,
    "wateringDays": 8,
    "rotateDays": 21,
    "fertilizeDays": 45,
    "potSizes": [
      { "label": "16 cm", "delta": 0 },
      { "label": "20 cm", "delta": 2 },
      { "label": "24 cm", "delta": 4 }
    ],
    "description": "A short tuft on the shelf today. In two years it curtains the whole wall in trailing vines up to two metres long. The easiest plant we sell.",
    "descriptionAr": "خصلة صغيرة على الرف اليوم. بعد سنتين تتحول إلى ستارة من الأغصان المتهدلة بطول مترين. أسهل نبتة نبيعها.",
    "care": [
      "Happy even in a dim corner",
      "Water when the leaves start to look soft",
      "Trim a vine and root it in water to make more",
      "Almost impossible to kill"
    ],
    "careAr": [
      "تنمو بسعادة حتى في الزوايا المعتمة",
      "اسقها عندما تبدأ الأوراق بالترهل",
      "اقطع غصناً وضعه في الماء لإنتاج نبتة جديدة",
      "من المستحيل تقريباً أن تموت"
    ]
  },
  {
    "id": "pink-rubber-plant",
    "index": "05",
    "name": "Pink Rubber Plant",
    "nameAr": "نبتة المطاط الوردية",
    "latinName": "Ficus elastica 'Tineke'",
    "price": 15.0,
    "art": "rubberPlant",
    "photo": "images/pink-rubber-plant.jpg",
    "heightNow": 40,
    "heightMature": 170,
    "growYears": "4",
    "growYearsAr": "٤",
    "light": "bright",
    "difficulty": "medium",
    "petSafe": false,
    "inStock": true,
    "hasPhoto": false,
    "wateringDays": 9,
    "rotateDays": 14,
    "fertilizeDays": 35,
    "potSizes": [
      { "label": "20 cm", "delta": 0 },
      { "label": "26 cm", "delta": 3 },
      { "label": "32 cm", "delta": 7 }
    ],
    "description": "Cream and rose variegation over deep green, with new leaves unfurling from a bright pink sheath. The brighter the light, the pinker it gets.",
    "descriptionAr": "تعرّق كريمي ووردي على أخضر غامق، والأوراق الجديدة تتفتح من غلاف وردي زاهي. كلما زاد الضوء زاد اللون الوردي.",
    "care": [
      "Bright light keeps the pink — shade turns it green",
      "Let the soil dry out well between waterings",
      "Feed monthly through spring and summer",
      "Sap is irritating, wash hands after pruning"
    ],
    "careAr": [
      "الضوء الساطع يحافظ على الوردي، والظل يحوّلها للأخضر",
      "اترك التربة تجف جيداً بين الريّات",
      "سمّدها شهرياً في الربيع والصيف",
      "العصارة مهيّجة للجلد، اغسل يديك بعد التقليم"
    ]
  },
  {
    "id": "olive-tree",
    "index": "06",
    "name": "Olive Tree",
    "nameAr": "شجرة الزيتون",
    "latinName": "Olea europaea",
    "price": 32.0,
    "art": "oliveTree",
    "photo": "images/olive-tree.jpg",
    "heightNow": 95,
    "heightMature": 220,
    "growYears": "5+",
    "growYearsAr": "+٥",
    "light": "direct",
    "difficulty": "medium",
    "petSafe": true,
    "inStock": true,
    "hasPhoto": false,
    "wateringDays": 10,
    "rotateDays": 21,
    "fertilizeDays": 45,
    "potSizes": [
      { "label": "30 cm", "delta": 0 },
      { "label": "36 cm", "delta": 6 },
      { "label": "42 cm", "delta": 14 }
    ],
    "description": "Silver-green leaves on a gnarled trunk that thickens with every year. The one plant on this page that genuinely wants direct Gulf sun.",
    "descriptionAr": "أوراق فضية مائلة للأخضر على جذع متعرّج يزداد سمكاً كل عام. النبتة الوحيدة هنا التي تحب شمس الخليج المباشرة.",
    "care": [
      "The sunniest window in the house, all day",
      "Water deeply, then let it dry out completely",
      "Prune in late winter to shape the canopy",
      "Safe around cats and dogs"
    ],
    "careAr": [
      "أكثر نافذة مشمسة في البيت، طوال اليوم",
      "اسقها بغزارة ثم اتركها تجف تماماً",
      "قلّمها في أواخر الشتاء لتشكيل التاج",
      "آمنة مع القطط والكلاب"
    ]
  }
];
