-- Seeded from data/products.json. Re-runnable: conflicts update in place.
insert into public.products (id, sort_order, name, name_ar, latin_name, price,
  art_key, photo_path, has_photo, height_now_cm, height_mature_cm, grow_years,
  grow_years_ar, light, difficulty, pet_safe, in_stock, watering_days,
  rotate_days, fertilize_days, description, description_ar) values
  ($q$bird-of-paradise$q$, 1, $q$Bird of Paradise$q$, $q$طائر الجنة$q$, $q$Strelitzia nicolai$q$, 26.5, $q$birdOfParadise$q$, $q$images/bird-of-paradise.jpg$q$, false, 60, 210, $q$3–4$q$, $q$٣–٤$q$, $q$bright$q$::public.light_level, $q$medium$q$::public.care_level, false, true, 7, 14, 30, $q$Architectural paddle leaves that fan out like sails. Give it the brightest corner you have and it will become the single tallest thing in the room.$q$, $q$أوراق عريضة تتفتح كأشرعة السفن. ضعها في أكثر زاوية مشمسة في منزلك وستصبح أطول عنصر في الغرفة.$q$),
  ($q$fiddle-leaf-fig$q$, 2, $q$Fiddle Leaf Fig$q$, $q$التين ذو الأوراق الكمانية$q$, $q$Ficus lyrata$q$, 24.0, $q$fiddleLeafFig$q$, $q$images/fiddle-leaf-fig.jpg$q$, false, 75, 240, $q$4–5$q$, $q$٤–٥$q$, $q$bright$q$::public.light_level, $q$expert$q$::public.care_level, false, true, 7, 21, 30, $q$The designer's houseplant. Glossy violin-shaped leaves on a single slim trunk. Fussy about being moved, spectacular once it settles.$q$, $q$نبتة المصممين. أوراق لامعة على شكل كمان تنمو على ساق واحدة نحيلة. لا تحب التنقل، لكنها مذهلة بعد أن تستقر.$q$),
  ($q$monstera-deliciosa$q$, 3, $q$Monstera Deliciosa$q$, $q$مونستيرا ديليسيوسا$q$, $q$Monstera deliciosa$q$, 19.5, $q$monstera$q$, $q$images/monstera-deliciosa.jpg$q$, false, 55, 180, $q$3$q$, $q$٣$q$, $q$bright$q$::public.light_level, $q$easy$q$::public.care_level, false, true, 7, 14, 30, $q$Starts with plain heart-shaped leaves, then begins carving its famous windows as it matures. The most forgiving statement plant there is.$q$, $q$تبدأ بأوراق قلبية بسيطة، ثم تنحت فتحاتها الشهيرة كلما نمت. أكثر نبتة مميزة تتحمل الإهمال.$q$),
  ($q$golden-pothos$q$, 4, $q$Golden Pothos$q$, $q$البوتس الذهبي$q$, $q$Epipremnum aureum$q$, 7.5, $q$pothos$q$, $q$images/golden-pothos.jpg$q$, false, 35, 200, $q$2$q$, $q$٢$q$, $q$low$q$::public.light_level, $q$easy$q$::public.care_level, false, true, 8, 21, 45, $q$A short tuft on the shelf today. In two years it curtains the whole wall in trailing vines up to two metres long. The easiest plant we sell.$q$, $q$خصلة صغيرة على الرف اليوم. بعد سنتين تتحول إلى ستارة من الأغصان المتهدلة بطول مترين. أسهل نبتة نبيعها.$q$),
  ($q$pink-rubber-plant$q$, 5, $q$Pink Rubber Plant$q$, $q$نبتة المطاط الوردية$q$, $q$Ficus elastica 'Tineke'$q$, 15.0, $q$rubberPlant$q$, $q$images/pink-rubber-plant.jpg$q$, false, 40, 170, $q$4$q$, $q$٤$q$, $q$bright$q$::public.light_level, $q$medium$q$::public.care_level, false, true, 9, 14, 35, $q$Cream and rose variegation over deep green, with new leaves unfurling from a bright pink sheath. The brighter the light, the pinker it gets.$q$, $q$تعرّق كريمي ووردي على أخضر غامق، والأوراق الجديدة تتفتح من غلاف وردي زاهي. كلما زاد الضوء زاد اللون الوردي.$q$),
  ($q$olive-tree$q$, 6, $q$Olive Tree$q$, $q$شجرة الزيتون$q$, $q$Olea europaea$q$, 32.0, $q$oliveTree$q$, $q$images/olive-tree.jpg$q$, false, 95, 220, $q$5+$q$, $q$+٥$q$, $q$direct$q$::public.light_level, $q$medium$q$::public.care_level, true, true, 10, 21, 45, $q$Silver-green leaves on a gnarled trunk that thickens with every year. The one plant on this page that genuinely wants direct Gulf sun.$q$, $q$أوراق فضية مائلة للأخضر على جذع متعرّج يزداد سمكاً كل عام. النبتة الوحيدة هنا التي تحب شمس الخليج المباشرة.$q$)
on conflict (id) do update set
  sort_order = excluded.sort_order, name = excluded.name, name_ar = excluded.name_ar,
  latin_name = excluded.latin_name, price = excluded.price, art_key = excluded.art_key,
  photo_path = excluded.photo_path, has_photo = excluded.has_photo,
  height_now_cm = excluded.height_now_cm, height_mature_cm = excluded.height_mature_cm,
  grow_years = excluded.grow_years, grow_years_ar = excluded.grow_years_ar,
  light = excluded.light, difficulty = excluded.difficulty, pet_safe = excluded.pet_safe,
  in_stock = excluded.in_stock, watering_days = excluded.watering_days,
  rotate_days = excluded.rotate_days, fertilize_days = excluded.fertilize_days,
  description = excluded.description, description_ar = excluded.description_ar;

insert into public.product_pot_sizes (product_id, label, price_delta, sort_order) values
  ($q$bird-of-paradise$q$, $q$24 cm$q$, 0, 0),
  ($q$bird-of-paradise$q$, $q$30 cm$q$, 4, 1),
  ($q$bird-of-paradise$q$, $q$36 cm$q$, 9, 2),
  ($q$fiddle-leaf-fig$q$, $q$26 cm$q$, 0, 0),
  ($q$fiddle-leaf-fig$q$, $q$32 cm$q$, 5, 1),
  ($q$fiddle-leaf-fig$q$, $q$38 cm$q$, 11, 2),
  ($q$monstera-deliciosa$q$, $q$24 cm$q$, 0, 0),
  ($q$monstera-deliciosa$q$, $q$30 cm$q$, 4, 1),
  ($q$monstera-deliciosa$q$, $q$36 cm$q$, 8, 2),
  ($q$golden-pothos$q$, $q$16 cm$q$, 0, 0),
  ($q$golden-pothos$q$, $q$20 cm$q$, 2, 1),
  ($q$golden-pothos$q$, $q$24 cm$q$, 4, 2),
  ($q$pink-rubber-plant$q$, $q$20 cm$q$, 0, 0),
  ($q$pink-rubber-plant$q$, $q$26 cm$q$, 3, 1),
  ($q$pink-rubber-plant$q$, $q$32 cm$q$, 7, 2),
  ($q$olive-tree$q$, $q$30 cm$q$, 0, 0),
  ($q$olive-tree$q$, $q$36 cm$q$, 6, 1),
  ($q$olive-tree$q$, $q$42 cm$q$, 14, 2)
on conflict (product_id, label) do update set
  price_delta = excluded.price_delta, sort_order = excluded.sort_order;

insert into public.product_care_tips (product_id, position, tip, tip_ar) values
  ($q$bird-of-paradise$q$, 0, $q$Water when the top 3 cm of soil is dry$q$, $q$اسقها عندما تجف أول ٣ سم من التربة$q$),
  ($q$bird-of-paradise$q$, 1, $q$Loves bright indirect light, tolerates some direct sun$q$, $q$تحب الضوء الساطع غير المباشر وتتحمل بعض الشمس$q$),
  ($q$bird-of-paradise$q$, 2, $q$Wipe the leaves monthly — they collect dust fast$q$, $q$امسح الأوراق شهرياً فهي تجمع الغبار بسرعة$q$),
  ($q$bird-of-paradise$q$, 3, $q$Rotate every two weeks so it grows evenly$q$, $q$أدرها كل أسبوعين لتنمو بشكل متوازن$q$),
  ($q$fiddle-leaf-fig$q$, 0, $q$Pick one bright spot and never move it$q$, $q$اختر مكاناً ساطعاً واحداً ولا تحركها منه$q$),
  ($q$fiddle-leaf-fig$q$, 1, $q$Water only when the soil is dry 5 cm down$q$, $q$اسقها فقط عندما تجف التربة بعمق ٥ سم$q$),
  ($q$fiddle-leaf-fig$q$, 2, $q$Keep away from air-conditioning draughts$q$, $q$أبعدها عن تيار المكيف المباشر$q$),
  ($q$fiddle-leaf-fig$q$, 3, $q$Dust the leaves to keep them glossy$q$, $q$نظّف الأوراق لتبقى لامعة$q$),
  ($q$monstera-deliciosa$q$, 0, $q$Water weekly, let the top soil dry between drinks$q$, $q$اسقها أسبوعياً واترك سطح التربة يجف بين الريّات$q$),
  ($q$monstera-deliciosa$q$, 1, $q$Bright indirect light brings out the splits$q$, $q$الضوء الساطع غير المباشر يبرز الفتحات$q$),
  ($q$monstera-deliciosa$q$, 2, $q$Give it a moss pole to climb after year two$q$, $q$أضف لها عموداً لتتسلقه بعد السنة الثانية$q$),
  ($q$monstera-deliciosa$q$, 3, $q$Mist occasionally in the Kuwait summer$q$, $q$رشها بالماء أحياناً في صيف الكويت$q$),
  ($q$golden-pothos$q$, 0, $q$Happy even in a dim corner$q$, $q$تنمو بسعادة حتى في الزوايا المعتمة$q$),
  ($q$golden-pothos$q$, 1, $q$Water when the leaves start to look soft$q$, $q$اسقها عندما تبدأ الأوراق بالترهل$q$),
  ($q$golden-pothos$q$, 2, $q$Trim a vine and root it in water to make more$q$, $q$اقطع غصناً وضعه في الماء لإنتاج نبتة جديدة$q$),
  ($q$golden-pothos$q$, 3, $q$Almost impossible to kill$q$, $q$من المستحيل تقريباً أن تموت$q$),
  ($q$pink-rubber-plant$q$, 0, $q$Bright light keeps the pink — shade turns it green$q$, $q$الضوء الساطع يحافظ على الوردي، والظل يحوّلها للأخضر$q$),
  ($q$pink-rubber-plant$q$, 1, $q$Let the soil dry out well between waterings$q$, $q$اترك التربة تجف جيداً بين الريّات$q$),
  ($q$pink-rubber-plant$q$, 2, $q$Feed monthly through spring and summer$q$, $q$سمّدها شهرياً في الربيع والصيف$q$),
  ($q$pink-rubber-plant$q$, 3, $q$Sap is irritating, wash hands after pruning$q$, $q$العصارة مهيّجة للجلد، اغسل يديك بعد التقليم$q$),
  ($q$olive-tree$q$, 0, $q$The sunniest window in the house, all day$q$, $q$أكثر نافذة مشمسة في البيت، طوال اليوم$q$),
  ($q$olive-tree$q$, 1, $q$Water deeply, then let it dry out completely$q$, $q$اسقها بغزارة ثم اتركها تجف تماماً$q$),
  ($q$olive-tree$q$, 2, $q$Prune in late winter to shape the canopy$q$, $q$قلّمها في أواخر الشتاء لتشكيل التاج$q$),
  ($q$olive-tree$q$, 3, $q$Safe around cats and dogs$q$, $q$آمنة مع القطط والكلاب$q$)
on conflict (product_id, position) do update set
  tip = excluded.tip, tip_ar = excluded.tip_ar;
