export const DAY=86400000;
export const uid=(p='id')=>p+'_'+Math.random().toString(36).slice(2,10);
export const normalizeEmail=x=>String(x||'').trim().toLowerCase();
export const normalize=x=>String(x||'').trim().toLowerCase().replace(/\s+/g,' ');
export const sessionValid=(s,now)=>!!s&&now-s.lastActive<5*DAY;
export function discountRows(k){if(![10,11,12,13,14,15].includes(Number(k)))throw Error('Выберите сервисный сбор от 10% до 15%');return [30,40,50].map(d=>({client:d,hotel:Math.round((d+Number(k)*(1-d/100))*100)/100}));}
export function log(s,actor,action,object,hotelId='',detail='',result='Успешно',now=Date.now()){
 s.audit.unshift({id:uid('event'),time:now,actor,action,object,hotelId,orgId:s.hotels.find(h=>h.id===hotelId)?.orgId||'',detail,result});
}
const checkINN=n=>/^\d{10}$/.test(n)&&[2,4,10,3,5,9,4,6,8].reduce((a,w,i)=>a+w*Number(n[i]),0)%11%10===Number(n[9]);
const checkAccount=(a,b,corr=false)=>{if(!/^\d{20}$/.test(a)||!/^\d{9}$/.test(b))return false;const x=(corr?'0'+b.slice(4,6):b.slice(-3))+a;return [...x].reduce((v,n,i)=>v+Number(n)*[7,1,3][i%3],0)%10===0;};
export function validateOrg(o){
 const e={}; for(const k of ['name','inn','kpp','ogrn','address','bank','bic','account','corr'])if(!String(o[k]||'').trim())e[k]='Обязательное поле';
 if(o.name?.length>500)e.name='Не более 500 символов';
 if(o.address?.length>1000)e.address='Не более 1000 символов';
 if(o.inn&&!checkINN(o.inn))e.inn='ИНН ЮЛ: 10 цифр и корректная контрольная сумма';
 if(o.ogrn&&(!/^\d{13}$/.test(o.ogrn)||Number(BigInt(o.ogrn.slice(0,12))%11n%10n)!==Number(o.ogrn[12])))e.ogrn='Проверьте 13 цифр и контрольную сумму ОГРН';
 if(o.kpp&&!/^\d{4}[0-9A-Z]{2}\d{3}$/.test(o.kpp))e.kpp='КПП должен содержать 9 символов';
 if(o.bic&&!/^\d{9}$/.test(o.bic))e.bic='БИК должен содержать 9 цифр';
 if(o.account&&!checkAccount(o.account,o.bic))e.account='Проверьте номер счёта и БИК';
 if(o.corr&&!checkAccount(o.corr,o.bic,true))e.corr='Проверьте корреспондентский счёт и БИК';
 return e;
}
export function validateContract(c){const e={};if(!c.orgId)e.orgId='Выберите ЮЛ';if(!c.number&&!c.noNumber)e.number='Укажите номер или «Без номера»';if(c.number?.length>100)e.number='Не более 100 символов';if(!c.date)e.date='Укажите дату';if(!c.term)e.term='Укажите срок';if(c.term==='fixed'&&!c.end)e.end='Укажите дату окончания';if(c.end&&c.end<c.date&&c.term==='fixed')e.end='Окончание не раньше даты договора';if(![10,11,12,13,14,15].includes(Number(c.k)))e.k='Выберите ставку';if(c.a===''||c.a==null||!/^\d{1,2}([.,]\d{1,2})?$/.test(String(c.a))||Number(String(c.a).replace(',','.'))>99.99)e.a='От 0 до 99,99%, до двух знаков';return e;}
export function validateHotel(h){const e={};for(const k of ['name','city','address'])if(!h[k]?.trim())e[k]='Обязательное поле';if(h.name?.length>300)e.name='Не более 300 символов';if(h.address?.length>1000)e.address='Не более 1000 символов';if(h.site){try{const u=new URL(h.site);if(!['https:','http:'].includes(u.protocol)||h.site.length>2048)throw 0;}catch{e.site='Укажите корректную HTTP/HTTPS-ссылку';}}return e;}
export function validatePerson(p){const e={};if(!p.name?.trim())e.name='Укажите имя';if(p.name?.length>200)e.name='Не более 200 символов';if(!p.position?.trim())e.position='Укажите должность';if(p.position?.length>150)e.position='Не более 150 символов';if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(p.email))||p.email?.length>254)e.email='Проверьте email';if(p.phone&&!/^\+?[0-9 ()-]{7,22}$/.test(p.phone))e.phone='Телефон с кодом страны';return e;}
export const phone=x=>{let n=String(x||'').replace(/\D/g,'');if(n.length===11&&n[0]==='8')n='7'+n.slice(1);return n?'+'+n:'';};
export function duplicates(s,h){return s.hotels.filter(x=>x.id!==h.id&&['name','city','address'].every(k=>normalize(x[k])===normalize(h[k])));}
export function canManage(s,actor,hid){return actor==='bo'||s.users.find(u=>u.id===actor)?.access[hid]==='admin';}
export function requireManage(s,actor,hid){if(!canManage(s,actor,hid))throw Error('Нет прав для управления сотрудниками этого отеля');}
export function inviteState(i,now){return i.status==='sent'&&i.expires<=now?'expired':i.status;}
export function invite(s,p,actor,now,delivery='ok'){
 requireManage(s,actor,p.hotelId);const errors=validatePerson(p);if(Object.keys(errors).length)throw Error(Object.values(errors)[0]);
 const h=s.hotels.find(x=>x.id===p.hotelId);if(!h)throw Error('Отель не найден');
 const org=s.orgs.find(x=>x.id===h.orgId),contract=s.contracts.find(x=>x.id===h.contractId);
 if(!org||!contract||contract.orgId!==h.orgId||Object.keys(validateOrg(org)).length||Object.keys(validateContract(contract)).length||Object.keys(validateHotel(h)).length)throw Error('Сначала заполните обязательные данные ЮЛ, договора и отеля');
 const email=normalizeEmail(p.email);let u=s.users.find(x=>x.email===email);
 if(!u){u={id:uid('u'),name:p.name.trim(),email,phone:phone(p.phone),positions:{},access:{},lastLogin:null};s.users.push(u);}
 u.positions[h.orgId]=p.position.trim();
 if(u.access[h.id]&&u.access[h.id]!==p.role)throw Error('Доступ уже предоставлен. Измените роль через управление сотрудником.');
 if(u.access[h.id]===p.role){if(p.role==='admin')h.stage='complete';return {already:true,userId:u.id};}
 const previous=s.invitations.filter(i=>i.userId===u.id&&i.hotelId===h.id&&['sent','error'].includes(i.status));
 if(delivery==='ok')for(const i of previous)i.status='replaced';
 const i={id:uid('invite'),email,userId:u.id,hotelId:h.id,role:p.role,actor,created:now,expires:now+7*DAY,status:delivery==='ok'?'sent':'error'};
 s.invitations.unshift(i);
 if(delivery==='ok'){s.messages.unshift({id:uid('mail'),type:'invite',inviteId:i.id,email,time:now,hotelId:h.id});if(p.role==='admin'&&h.stage!=='complete'){h.stage='complete';h.completed=now;log(s,actor,'Этап 1 завершён',h.name,h.id,'Приглашение администратора принято почтовым сервисом','Успешно',now);}}
 log(s,actor,delivery==='ok'?'Приглашение отправлено':'Ошибка отправки',u.name,h.id,email,delivery==='ok'?'Успешно':'Ошибка',now);return i;
}
export function resend(s,id,actor,now,delivery='ok'){const i=s.invitations.find(x=>x.id===id);if(!i)throw Error('Приглашение не найдено');const u=s.users.find(x=>x.id===i.userId),h=s.hotels.find(x=>x.id===i.hotelId);return invite(s,{hotelId:h.id,email:u.email,name:u.name,phone:u.phone,position:u.positions[h.orgId],role:i.role},actor,now,delivery);}
export function accept(s,id,userId,now){const i=s.invitations.find(x=>x.id===id);if(!i||inviteState(i,now)!=='sent')throw Error('Ссылка больше не действует. Попросите новое приглашение.');const u=s.users.find(x=>x.id===userId);if(!u||u.id!==i.userId||u.email!==i.email)throw Error('Войдите с email, на который отправлено приглашение');requireManage(s,i.actor,i.hotelId);i.status='accepted';i.accepted=now;u.access[i.hotelId]=i.role;log(s,u.id,'Приглашение принято',u.name,i.hotelId,i.role==='admin'?'Администратор':'Сотрудник','Успешно',now);return i;}
export function changeAccess(s,uid,hid,role,actor,now){requireManage(s,actor,hid);const u=s.users.find(x=>x.id===uid);if(!u)throw Error('Сотрудник не найден');const old=u.access[hid];if(old==='admin'&&role!=='admin'&&s.users.filter(x=>x.access[hid]==='admin').length<=1)throw Error('Это последний действующий администратор. Сначала пригласите замену и дождитесь принятия.');if(role)u.access[hid]=role;else delete u.access[hid];log(s,actor,role?'Роль изменена':'Доступ отозван',u.name,hid,(old||'нет')+' → '+(role||'нет'),'Успешно',now);}
export function requestCode(s,email,now,purpose='login'){email=normalizeEmail(email);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Проверьте email');const key=email+'|'+purpose;const old=s.auth.codes[key];const hist=(s.auth.sent[email]||[]).filter(t=>now-t<3600000);if(hist.length&&now-hist.at(-1)<60000)throw Error('Новый код можно запросить через 60 секунд');if(hist.length>=5)throw Error('Лимит: 5 писем в час. Попробуйте позже.');const code=String(100000+Math.floor(Math.random()*900000));const c={code,created:now,expires:now+30*60000,used:false};s.auth.codes[key]=c;s.auth.sent[email]=[...hist,now];s.messages.unshift({id:uid('mail'),type:'code',email,time:now,code,purpose});return c;}
export function verifyCode(s,email,code,now,purpose='login'){email=normalizeEmail(email);let a=s.auth.attempts[email]||{count:0,until:0};if(a.until>now)throw Error('Слишком много попыток. Подождите 15 минут.');if(a.until&&a.until<=now)a={count:0,until:0};const c=s.auth.codes[email+'|'+purpose];if(!c||c.used||now>=c.expires)throw Error('Код истёк или уже использован. Запросите новый.');if(c.code!==code){a.count++;if(a.count>=5)a.until=now+15*60000;s.auth.attempts[email]=a;log(s,'guest','Неуспешный вход',email,'','Неверный код','Ошибка',now);throw Error(a.until?'После 5 ошибок вход приостановлен на 15 минут':'Неверный код');}c.used=true;s.auth.attempts[email]={count:0,until:0};if(purpose!=='login')return true;if(email==='bo@example.com'){log(s,'bo','Успешный вход','Команда Hopinn','','Бэкофис','Успешно',now);return {userId:'bo',email,created:now,lastActive:now};}const u=s.users.find(x=>x.email===email);if(!u)throw Error('Нет приглашения для этого email');u.lastLogin=now;log(s,u.id,'Успешный вход',u.name,'','Extranet','Успешно',now);return {userId:u.id,email:u.email,created:now,lastActive:now};}
function fakeInn(prefix){return prefix+([2,4,10,3,5,9,4,6,8].reduce((a,w,i)=>a+w*Number(prefix[i]),0)%11%10);}
function fakeOgrn(prefix){return prefix+String(BigInt(prefix)%11n%10n);}
function fakeAccount(prefix,bic,corr=false){for(let i=0;i<10;i++){const a=prefix.slice(0,8)+i+prefix.slice(9);if(checkAccount(a,bic,corr))return a;}}
export function seed(now=Date.now()){
 const bic='044030001';
 const orgs=['ООО «Садовая коллекция»','ООО «Северные отели»','ООО «Атлас гостеприимство»'].map((name,i)=>({id:'o'+(i+1),name,inn:fakeInn('78010000'+(i+1)),kpp:'780101001',ogrn:fakeOgrn('12678000000'+(i+1)),address:'Санкт-Петербург, ул. Демонстрационная, д. '+(i+1),bank:'Демонстрационный банк',bic,account:fakeAccount('4070281000000000000'+(i+1),bic),corr:fakeAccount('30101810000000000001',bic,true)}));
 const contracts=orgs.map((o,i)=>({id:'c'+(i+1),orgId:o.id,number:'HI-2026-00'+(i+1),date:'2026-09-01',term:'unlimited',end:'',k:[13,12,15][i],a:'0.1',versions:[]}));
 const hotels=[
 {id:'h1',name:'Садовая Резиденция',city:'Санкт-Петербург',address:'ул. Демонстрационная, д. 1',orgId:'o1',contractId:'c1',stage:'complete',site:'https://example.com/sadovaya',color:'mint'},
 {id:'h2',name:'Невский Дом',city:'Санкт-Петербург',address:'Невский пер., д. 12 (демо)',orgId:'o1',contractId:'c1',stage:'complete',site:'',color:'blue'},
 {id:'h3',name:'Северный Берег',city:'Санкт-Петербург',address:'ул. Примерная, д. 24',orgId:'o2',contractId:'c2',stage:'draft',site:'',color:'sand'},
 {id:'h4',name:'Атлас',city:'Санкт-Петербург',address:'наб. Тихая, д. 8 (демо)',orgId:'o3',contractId:'c3',stage:'complete',site:'',color:'pink'},
 {id:'h5',name:'Дом на Мойке',city:'Санкт-Петербург',address:'пер. Гостевой, д. 5 (демо)',orgId:'o2',contractId:'c2',stage:'complete',site:'',color:'purple'}
 ].map(h=>({...h,links:[],fsa:'',fsaUrl:'',created:now-3*DAY,completed:h.stage==='complete'?now-DAY:null}));
 const users=[
 {id:'u1',name:'Анна Соколова',email:'anna@example.com',phone:'+79990000001',positions:{o1:'Управляющая',o2:'Директор по развитию'},access:{h1:'admin',h2:'admin'},lastLogin:now-23*60000},
 {id:'u2',name:'Илья Морозов',email:'ilya@example.com',phone:'',positions:{o1:'Менеджер по бронированию'},access:{h1:'staff'},lastLogin:now-2*3600000},
 {id:'u3',name:'Мария Волкова',email:'maria@example.com',phone:'',positions:{o1:'Заместитель управляющей'},access:{},lastLogin:null},
 {id:'u4',name:'Алексей Миронов',email:'alex@example.com',phone:'',positions:{o3:'Управляющий'},access:{},lastLogin:null},
 {id:'u5',name:'Елена Орлова',email:'elena@example.com',phone:'',positions:{o2:'Директор'},access:{},lastLogin:null}
 ];
 const invitations=[
 {id:'i1',email:'maria@example.com',userId:'u3',hotelId:'h1',role:'admin',status:'sent',created:now-DAY,expires:now+6*DAY,actor:'bo'},
 {id:'i2',email:'alex@example.com',userId:'u4',hotelId:'h4',role:'admin',status:'sent',created:now-8*DAY,expires:now-DAY,actor:'bo'},
 {id:'i3',email:'elena@example.com',userId:'u5',hotelId:'h5',role:'admin',status:'sent',deliveryError:true,created:now-DAY,expires:now+6*DAY,actor:'bo'},
 ...['h1','h2'].map((h,i)=>({id:'ia'+i,email:'anna@example.com',userId:'u1',hotelId:h,role:'admin',status:'accepted',actor:'bo',created:now-3*DAY,accepted:now-2*DAY,expires:now+4*DAY})),
 {id:'is1',email:'ilya@example.com',userId:'u2',hotelId:'h1',role:'staff',status:'accepted',actor:'u1',created:now-2*DAY,accepted:now-DAY,expires:now+5*DAY}
 ];
 const s={schema:1,orgs,contracts,hotels,users,invitations,audit:[],messages:invitations.filter(i=>i.status==='sent').map(i=>({id:'m'+i.id,type:'invite',inviteId:i.id,email:i.email,time:i.created,hotelId:i.hotelId})),files:[{id:'f1',contractId:'c1',name:'Договор HI-2026-001.pdf',size:148200,type:'application/pdf',version:1,active:true,checked:true,time:now-2*DAY,fixture:true}],drafts:[],auth:{codes:{},sent:{},attempts:{}}};
 log(s,'bo','Приглашение отправлено','Мария Волкова','h1','Администратор · maria@example.com','Успешно',now-3600000);
 log(s,'u1','Успешный вход','Анна Соколова','h1','Extranet','Успешно',now-23*60000);
 log(s,'bo','Ошибка доставки','Елена Орлова','h5','Почтовый сервис сообщил о недоставке','Ошибка',now-2*3600000);
 log(s,'bo','Этап 1 завершён','Невский Дом','h2','Приглашение администратора отправлено','Успешно',now-DAY);
 return s;
}

export function upgradeDirectory(s){
 if(s.directoryRevision===1)return s;
 const examples=[
  {id:'hi_admin_demo',name:'Вера Миронова',email:'vera.hopinn@example.com',position:'Руководитель операций',platformRole:'platform_admin'},
  {id:'hi_bo_demo',name:'Антон Ларин',email:'anton.hopinn@example.com',position:'Специалист по подключению отелей',platformRole:'backoffice'}
 ];
 for(const p of examples){if(s.users.some(u=>u.id===p.id||normalizeEmail(u.email)===p.email))continue;s.users.push({id:p.id,name:p.name,email:p.email,phone:'',positions:{hopinn:p.position},access:{},lastLogin:null,platformRole:p.platformRole});}
 s.directoryRevision=1;return s;
}
export const organizationName=(s,id)=>id==='hopinn'?'Hopinn':s.orgs.find(o=>o.id===id)?.name||'Юрлицо не найдено';
export const platformRoleLabel=u=>({platform_admin:'Администратор Hopinn',backoffice:'Бэкофис'})[u.platformRole]||'Роль не назначена';
