'use strict';
const STORAGE_KEY = 'hopinn-extranet-prototype-v2';
const SERVICE_LIST = [
 ['parking','Парковка','CarFront','Парковка отеля или организованная для гостей.'],
 ['pool','Бассейн','Waves','Доступ к бассейну в отеле или его комплексе.'],
 ['spa','СПА-зона','Flower2','Платность посещения зоны, без стоимости процедур.'],
 ['gym','Спортзал','Dumbbell','Доступ к залу для гостей отеля.'],
 ['pets','С животными','PawPrint','Укажите существенные ограничения в условиях.'],
 ['early','Ранний заезд','Sunrise','При наличии возможности'],
 ['late','Поздний выезд','Sunset','При наличии возможности'],
 ['concierge','Консьерж-сервис','ConciergeBell','Помощь с заказами, без стоимости билетов и трансферов.'],
 ['roomservice','Рум-сервис','Utensils','Платность обслуживания и доставки, а не блюд.']
];
const CLASS_LIST=['Стандарт','Улучшенный','Полулюкс','Люкс','Премиум-люкс','Эксклюзивный люкс'];
const BED_LIST=['Одна большая кровать','Две односпальные','Без гарантированного выбора'];
const RATE_ROLES=['Основной без завтрака','Hopinn 30% — без завтрака','Hopinn 30% — с завтраком','Hopinn 40% — без завтрака','Hopinn 40% — с завтраком','Hopinn 50% — без завтрака','Hopinn 50% — с завтраком'];
const initialHotel=(id,name,ready=false)=>({id,name,stage:ready?'active':'setup',everActive:ready,firstDataReceived:ready,connected:ready,checks:true,emptyInventory:false,stale:false,unread:ready?2:1,breakfastSold:true,serviceFee:13,ratingsAvailable:true,pendingChecks:[],autoCheckedAt:ready?'Сегодня, 10:24':'Ещё не выполнялись',
 form:{name,city:'Санкт-Петербург',address:'Демонстрационный адрес, 12',stars:'4',type:'Гостиница',phone:'+7 (812) 000-00-00',email:'guest@hotel.example',website:ready?'https://hotel.example':'',checkin:'14:00',checkout:'12:00',reception:'Круглосуточно',receptionHours:'',outsideArrival:'',advanceArrival:'',deposit:ready?'Не требуется':'Не указано',depositAmount:'',depositNotes:'',petsConditions:'До 8 кг, по предварительному согласованию',conditions:''},
 services:{parking:'Платно',pool:'Нет',spa:'Платно',gym:'Бесплатно',pets:'Платно',early:'Платно',late:'Платно',concierge:'Бесплатно',roomservice:'Платно'},
 serviceTimes:{early:'',late:''},
 photos:[{id:'p1',kind:'room',asset:0,name:'Стандарт · большая кровать',source:'TravelLine'},{id:'p2',kind:'room',asset:1,name:'Стандарт · две кровати',source:'TravelLine'},{id:'p3',kind:'room',asset:2,name:'Улучшенный · интерьер',source:'TravelLine'}],
 sketches:ready?[{id:'s1',photoId:'p1',asset:0},{id:'s2',photoId:'p2',asset:1},{id:'s3',photoId:'p3',asset:2}]:[],
 rooms:[{id:'101',name:'Стандарт Double',area:24,main:2,extra:1,adultOptions:[1,2],pricesByAdults:{1:8800,2:10000},breakfastByAdults:{1:900,2:1800},children:'0–5 лет без места · 6–17 лет на дополнительном месте',beds:'Одна большая кровать',class:'Стандарт',bed:'Одна большая кровать',participating:true,base:10000}, {id:'102',name:'Стандарт Twin',area:24,main:2,extra:0,adultOptions:[1,2],pricesByAdults:{1:9100,2:10400},breakfastByAdults:{1:900,2:1800},children:'0–5 лет без места',beds:'Две односпальные',class:'Стандарт',bed:'Две односпальные',participating:true,base:10400}, {id:'103',name:'Улучшенный Double',area:30,main:3,extra:1,adultOptions:[1,2,3],pricesByAdults:{1:11000,2:12800,3:14800},breakfastByAdults:{1:900,2:1800,3:2700},children:'0–5 лет без места · 6–17 лет на дополнительном месте',beds:'Одна большая кровать',class:ready?'Улучшенный':'',bed:ready?'Одна большая кровать':'',participating:true,base:12800}],
 rates:RATE_ROLES.map((role,i)=>({id:String(201+i),name:i===0?'Открытый тариф / RO':role.replace(' — без завтрака',' / RO').replace(' — с завтраком',' / BB'),role})),
 staff:[{id:1,name:'Анна Волкова',email:'anna@hotel.example',job:'Управляющая',role:'Администратор',status:'Активен',last:'Сегодня, 10:24'},{id:2,name:'Михаил Орлов',email:'mikhail@hotel.example',job:'Менеджер по доходам',role:'Сотрудник',status:'Активен',last:'Сегодня, 09:46'}],
 notifications:[...(ready?[{id:2,title:'Данные TravelLine получены',text:'Получены 3 категории номеров и '+RATE_ROLES.length+' тарифов.',when:'Сегодня, 10:20',route:'rooms',read:false}]:[]),{id:1,title:ready?'Отель активирован':'Добро пожаловать в Hopinn',text:ready?'Отель допущен к работе. Доступность определяется данными TravelLine.':'Подключите канал Hopinn в TravelLine. После получения категорий и тарифов откроются формы отеля.',when:'Сегодня, 09:00',route:'overview',read:false}],
 boNotes:'Пожалуйста, проверьте адрес сайта и соответствие категории «Улучшенный Double».',updated:ready?'Сегодня, 10:24':'Данные ещё не получены',contentReady:ready,reviewerNotified:false
});
function createState(){return {hotelId:'1048',role:'Администратор',user:{name:'Анна Волкова',email:'anna@hotel.example',phone:'+7 (900) 000-00-00'},hotels:[initialHotel('1048','Атриум на Неве'),initialHotel('1052','Северный двор',true)]};}
function restoreState(){try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY));return s&&s.hotels&&s.hotels.length===2&&s.hotels.every(h=>typeof h.firstDataReceived==='boolean'&&Array.isArray(h.sketches)&&Array.isArray(h.pendingChecks)&&h.serviceTimes&&h.rooms.every(r=>Array.isArray(r.adultOptions)&&r.pricesByAdults))?s:createState();}catch{return createState();}}
let state=restoreState();
let view={route:location.hash.slice(1)||'overview',hotelTab:'general',roomTab:'categories',preview:'search',photoIndex:0,calendarOffset:0,calendarFilter:'all',calendarAdults:2,mobile:false,notificationFilter:'all'};
function hotel(){return state.hotels.find(h=>h.id===state.hotelId)||state.hotels[0];}
function saveState(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}catch{return false;}}
function isCabinetOpen(h=hotel()){return h.firstDataReceived===true;}
function canEdit(){return isCabinetOpen()&&!hotel().everActive;}
function requiredRateRoles(h=hotel()){return h.breakfastSold?RATE_ROLES:RATE_ROLES.filter(role=>!role.includes(' — с завтраком'));}
function participatingRooms(h=hotel()){return h.rooms.filter(r=>r.participating!==false);}
function validSketches(h=hotel()){
 const seen=new Set();
 return (h.sketches||[]).filter(s=>{const p=h.photos.find(p=>p.id===s.photoId&&p.kind==='room');if(!p||p.url||p.asset!==s.asset||seen.has(s.photoId))return false;seen.add(s.photoId);return true;});
}
function roleAdmin(){return state.role==='Администратор';}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function money(v){return new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(v)+' ₽';}
function getChecks(h=hotel()){
 const formKeys=['name','city','address','stars','type','phone','email','website','checkin','checkout','reception'];
 const reception=h.form.reception==='Круглосуточно'||['receptionHours','outsideArrival','advanceArrival'].every(k=>String(h.form[k]||'').trim());
 const info=formKeys.every(k=>String(h.form[k]||'').trim())&&/^https?:\/\/.+\..+/.test(h.form.website)&&/.+@.+\..+/.test(h.form.email)&&reception;
 const photos=h.photos.filter(p=>p.kind==='room').length;
 const roles=h.rates.map(r=>r.role);
 const rooms=participatingRooms(h),mapped=rooms.filter(r=>r.class&&r.bed).length,required=requiredRateRoles(h);
 return [{id:'connection',name:'Подключение TravelLine',detail:isCabinetOpen(h)?'Категории и тарифы получены; формы открыты':'Ожидаем первое получение категорий и тарифов',done:isCabinetOpen(h),route:'connection'}, {id:'general',name:'Общая информация',detail:info?'Контакты и условия проживания заполнены':'Проверьте обязательные сведения и контакты',done:!!info,route:'hotel/general'}, {id:'photos',name:'Фотографии номеров',detail:photos+' фото · нужно от 3 до 5',done:photos>=3&&photos<=5,route:'hotel/photos'}, {id:'rooms',name:'Категории номеров',detail:mapped+' из '+rooms.length+' участвующих категорий сопоставлены',done:rooms.length>0&&mapped===rooms.length,route:'rooms'}, {id:'rates',name:'Назначения тарифов',detail:required.length+' назначений · '+(h.breakfastSold?'основной и три пары':'основной и три тарифа без завтрака'),done:required.every(role=>roles.filter(x=>x===role).length===1),route:'rates'}];
}
function getAutoChecks(h=hotel()){
 const ready=Object.fromEntries(getChecks(h).map(c=>[c.id,c.done]));
 const current=isCabinetOpen(h)&&h.connected&&!h.stale, rooms=participatingRooms(h);
 const pending=new Set(h.pendingChecks||[]);
 const status=(id,ok,requiresTL=false)=>!isCabinetOpen(h)||(requiresTL&&!current)||pending.has(id)?'Ожидаем данные':ok?'Проверено':'Есть ошибка';
 const mappingValid=ready.rooms&&rooms.every(r=>CLASS_LIST.includes(r.class)&&BED_LIST.includes(r.bed)&&(!BED_LIST.includes(r.beds)||r.beds===r.bed));
 const hasPlacement=rooms.length>0&&rooms.every(r=>Number.isInteger(r.main)&&r.main>0&&Array.isArray(r.adultOptions)&&r.adultOptions.length>0);
 const placementValid=hasPlacement&&rooms.every(r=>r.adultOptions.every(n=>Number.isInteger(n)&&n>0&&n<=r.main)&&(r.extra==null||Number.isInteger(r.extra)&&r.extra>=0));
 const priceData=hasPlacement&&rooms.every(r=>r.adultOptions.every(n=>Number.isFinite(r.pricesByAdults?.[n])&&r.pricesByAdults[n]>0));
 const breakfastData=hasPlacement&&rooms.every(r=>r.adultOptions.every(n=>Number.isFinite(r.breakfastByAdults?.[n])&&r.breakfastByAdults[n]>=0));
 const sketches=validSketches(h),photosOkay=ready.photos&&sketches.length>=3&&sketches.length<=5;
 const photosStatus=!isCabinetOpen(h)||pending.has('photos')?'Ожидаем данные':photosOkay?'Проверено':h.sketches.length?'Есть ошибка':'Ожидаем данные';
 return [
  {id:'connection',name:'Подключение и данные TL',status:status('connection',current,true),detail:current?'Нужный объект и справочники получены':'Ждём актуальные данные; открытые ранее формы остаются доступны',route:'connection'},
  {id:'general',name:'Обязательные сведения',status:status('general',ready.general),detail:ready.general?'Контакты и условия заполнены':'Проверьте сайт, гостевую почту и обязательные условия',route:'hotel/general'},
  {id:'rooms',name:'Сопоставления категорий',status:status('rooms',mappingValid),detail:mappingValid?'Участвующие категории сопоставлены':ready.rooms?'Сопоставление противоречит известной конфигурации кроватей или справочнику Hopinn':'Нужно сопоставить хотя бы одну участвующую категорию и завершить остальные выбранные',route:'rooms'},
  {id:'rates',name:'Назначения тарифов',status:status('rates',ready.rates),detail:ready.rates?'Обязательные роли назначены без дублей':'Проверьте обязательные роли и повторные назначения',route:'rates'},
  {id:'prices',name:'Цены и скидки',status:h.checks===false?'Есть ошибка':!priceData?'Ожидаем данные':status('prices',ready.rooms&&ready.rates,true),detail:h.checks===false?'Подтверждено несоответствие цены. Исправьте источник в TL; обновление само ошибку не устраняет':'Проверка демонстрационных цен участвующих размещений',route:'calendar'},
  {id:'placement',name:'Вместимость и размещение',status:!hasPlacement?'Ожидаем данные':status('placement',placementValid,true),detail:hasPlacement?'Проверяются основные места, поддерживаемые взрослые и полученные условия детей и допмест':'Нужные параметры ещё не получены; отсутствие данных не означает ноль мест',route:'rooms'},
  {id:'breakfast',name:'Специальные пары завтрака',status:!h.breakfastSold?'Не требуется':!breakfastData?'Ожидаем данные':status('breakfast',ready.rates,true),detail:h.breakfastSold?'Сопоставимые пары 30%, 40% и 50%; демонстрационная доплата одинакова для одного размещения':'Отель не продаёт завтрак через Hopinn',route:'rates'},
  {id:'photos',name:'Скетчи и исходные фотографии',status:photosStatus,detail:sketches.length+' актуальных пар; нужно от 3 до 5. Оригиналы предоставляет отель',route:'hotel/content'},
  {id:'content',name:'Обязательный контент БО',status:!isCabinetOpen(h)||pending.has('content')||!h.contentReady?'Ожидаем данные':'Проверено',detail:h.contentReady?'Материалы подготовлены БО. Рейтинг и отзывы необязательны':'Бэкофис должен подготовить или повторно проверить материалы',route:'hotel/content'}
 ].map(c=>({...c,checkedAt:h.autoCheckedAt||'Ещё не выполнялись'}));
}
function invalidateChecks(kind,h=hotel()){
 const related={general:['general','content'],website:['general'],services:['content'],photos:['photos','content'],content:['content'],rooms:['rooms','placement','prices','breakfast'],categories:['rooms','placement','prices','breakfast'],rates:['rates','prices','breakfast'],tl:['connection','placement','prices','breakfast']};
 const ids=kind==='all'?['connection','general','rooms','rates','prices','placement','breakfast','photos','content']:(related[kind]||[kind]);
 h.pendingChecks=[...new Set([...(h.pendingChecks||[]),...ids])];
 if(ids.includes('content'))h.contentReady=false;
 return getAutoChecks(h);
}
function refreshDemoChecks(h=hotel()){
 const tlIds=new Set(['connection','prices','placement','breakfast']);
 const current=isCabinetOpen(h)&&h.connected&&!h.stale;
 h.pendingChecks=(h.pendingChecks||[]).filter(id=>tlIds.has(id)&&!current);
 h.autoCheckedAt=new Date().toLocaleString('ru-RU');
 const results=getAutoChecks(h);
 const participatingIds=new Set(['rooms','rates','prices','placement','breakfast']);
 const errors=results.filter(c=>participatingIds.has(c.id)&&c.status==='Есть ошибка');
 if(h.stage==='active'&&errors.length){
  h.stage='paused';
  const title='Работа отеля приостановлена',route='connection';
  const text='Подтверждена ошибка: '+errors.map(c=>c.name).join(', ')+'. Новые продажи остановлены. Обмен с TL продолжается; после исправления работу возобновит бэкофис.';
  const existing=h.notifications.find(n=>n.title===title&&n.route===route);
  if(existing){h.notifications=h.notifications.filter(n=>n!==existing);Object.assign(existing,{text,when:'Только что',read:false});h.notifications.unshift(existing);}
  else h.notifications.unshift({id:Date.now(),title,text,when:'Только что',route,read:false});
 }
 return results;
}
function notifyHotel(title,text,route='overview'){
 const h=hotel(),existing=h.notifications.find(n=>n.title===title&&n.route===route);
 if(existing){h.notifications=h.notifications.filter(n=>n!==existing);Object.assign(existing,{text,when:'Только что',read:false});h.notifications.unshift(existing);}
 else h.notifications.unshift({id:Date.now(),title,text,when:'Только что',route,read:false});
 saveState();
}
function applyScenario(stage){
 const h=hotel(),draft=['setup','unconnected'].includes(stage);
 Object.assign(h,initialHotel(h.id,h.name,!draft));
 h.stage=['nobreakfast','missingrating','empty'].includes(stage)?'active':['unconnected','setup'].includes(stage)?'setup':stage==='reviewnocontent'?'review':stage;
 h.everActive=['active','empty','paused','nobreakfast','missingrating'].includes(stage);
 h.emptyInventory=stage==='empty';h.checks=stage!=='paused';
 if(['review','reviewnocontent','fixes'].includes(stage)){h.contentReady=false;h.sketches=[];}
 if(stage==='nobreakfast'){h.breakfastSold=false;h.rates=h.rates.filter(r=>requiredRateRoles(h).includes(r.role));}
 if(stage==='missingrating')h.ratingsAvailable=false;
 const received=h.notifications.find(n=>n.title==='Данные TravelLine получены');
 if(received)received.text='Получены '+h.rooms.length+' категории номеров и '+h.rates.length+' тарифов.';
 if(h.everActive&&stage!=='paused')notifyHotel('Отель активирован','Бэкофис завершил проверку. Отель допущен к работе.');
 if(stage==='fixes')notifyHotel('Нужны исправления',h.boNotes,'hotel/general');
 if(stage==='paused')notifyHotel('Работа отеля приостановлена','Обнаружено несоответствие цены тарифа Hopinn 40%. Проверьте настройки в TravelLine.','connection');
 saveState();
}
