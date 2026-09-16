import * as M from './model.js?v=20260916b';
import * as V from './views.js?v=20260916b';
const KEY='hopinn-stage1-data-v1',UIKEY='hopinn-stage1-ui-v1';
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback;}catch{return fallback;}};
let s=read(KEY,null);if(!s||s.schema!==1)s=M.seed();M.upgradeDirectory(s);
let ui={mode:'bo',route:'hotels',filter:'all',search:'',hotelId:'h1',offset:0,errors:{},authStep:'email',...read(UIKEY,{})};
const root=document.querySelector('#app'),modal=document.querySelector('#modal');
let closeFocus=null,toastTimer;
const now=()=>Date.now()+(ui.offset||0);
const actor=()=>ui.mode==='bo'?'bo':ui.session?.userId;
function persist(){try{localStorage.setItem(KEY,JSON.stringify(s));localStorage.setItem(UIKEY,JSON.stringify({mode:ui.mode,session:ui.session,hotelId:ui.hotelId,offset:ui.offset,wizard:ui.wizard,boLast:ui.boLast,authTarget:ui.authTarget}));}catch{toast('Не удалось сохранить данные в браузере. Проверьте свободное место.',true);}}
function toast(text,error=false){const el=document.querySelector('#toast');clearTimeout(toastTimer);el.className='toast'+(error?' error':'');el.textContent=text;toastTimer=setTimeout(()=>{el.className='';el.textContent='';},5500);}
function go(path){closeModal();if(location.hash==='#/'+path){ui.route=path;render();}else location.hash='#/'+path;}
function closeModal(){if(modal.open)modal.close();if(closeFocus?.isConnected)closeFocus.focus();}
function showModal(title,body,foot=''){closeFocus=document.activeElement;modal.innerHTML=`<div class="modal-head"><h2>${title}</h2><button class="iconbtn" data-action="close-modal" aria-label="Закрыть">${V.icon('close')}</button></div><div class="modal-body">${body}</div>${foot?'<div class="modal-foot">'+foot+'</div>':''}`;if(!modal.open)modal.showModal();setTimeout(()=>modal.querySelector('input:not([disabled]),select,textarea,button')?.focus(),30);}
function details(e){return Object.fromEntries(new FormData(e).entries());}
function captureWizard(){const f=document.querySelector('#wizard-form');if(!f||!ui.wizard)return;const d=details(f),w=ui.wizard;if(w.step===0&&w.orgMode==='new')w.org={...w.org,...d};if(w.step===1&&w.contractMode==='new')w.contract={...w.contract,...d,noNumber:!!d.noNumber};if(w.step===2)w.hotel={...w.hotel,...d};if(w.step===3)w.admins=w.admins.map((p,i)=>Object.fromEntries(['name','email','phone','position'].map(k=>[k,d['admin'+i+'_'+k]||''])));}
function newWizard(h){return {id:M.uid('draft'),step:h?3:0,orgMode:'existing',orgId:h?.orgId||'',org:{},contractMode:'existing',contractId:h?.contractId||'',contract:{term:'unlimited',k:'',a:'',date:''},hotel:h?structuredClone(h):{name:'',city:'Санкт-Петербург',address:'',site:''},hotelId:h?.id,admins:[{name:'',email:'',phone:'',position:''}]};}
function currentHotel(){const u=s.users.find(u=>u.id===ui.session?.userId);return s.hotels.find(h=>h.id===ui.hotelId&&u?.access[h.id])||s.hotels.find(h=>u?.access[h.id]);}
function render(){
 ui.now=now();if(ui.mode==='bo'){ui.boLast??=ui.now;if(ui.now-ui.boLast>=5*M.DAY){ui.mode='hotel';ui.session=null;ui.authTarget='bo';ui.authStep='email';ui.authEmail='bo@example.com';ui.authError='Сессия завершена после 5 дней без активности. Войдите снова.';persist();}}let path=(location.hash.replace(/^#\/?/,'')||'hotels').split('/');ui.route=path.join('/');
 const open=['login','invite','review'];if(ui.mode==='hotel'&&ui.session&&(!M.sessionValid(ui.session,ui.now)||(ui.session.email&&ui.session.email!==s.users.find(u=>u.id===ui.session.userId)?.email))){ui.session=null;ui.authStep='email';ui.authError='Сессия завершена после 5 дней без активности. Войдите снова.';persist();}
 if(ui.mode==='hotel'&&!ui.session&&!open.includes(path[0])){path=['login'];ui.route='login';}
 if(ui.mode==='hotel'&&['hotels','wizard','orgs','org','contracts','contract','users','audit'].includes(path[0])){path=['extranet'];ui.route='extranet';}
 let content;
 try{
 switch(path[0]){
 case 'login':case 'invite':root.innerHTML=V.authPage(s,ui,path[0]==='invite'?path[1]:'');return;
 case 'hotels':content=V.hotelsPage(s,ui);break;
 case 'wizard':if(!ui.wizard)ui.wizard=newWizard();content=V.wizardPage(s,ui);break;
 case 'hotel':if(ui.mode==='hotel'&&s.users.find(u=>u.id===ui.session?.userId)?.access[path[1]]){ui.hotelId=path[1];ui.route=path[2]==='team'?'team':'extranet';history.replaceState(null,'','#/'+ui.route);content=V.extranetPage(s,ui,path[2]==='team');}else content=V.hotelPage(s,ui,path[1],path[2]||'details');break;
 case 'orgs':ui.route='hotels';history.replaceState(null,'','#/hotels');content=V.hotelsPage(s,ui);break;
 case 'org':content=V.orgPage(s,ui,path[1],path[2]);break;
 case 'contracts':ui.route='hotels';history.replaceState(null,'','#/hotels');content=V.hotelsPage(s,ui);break;
 case 'contract':content=V.contractPage(s,ui,path[1],path[2]);break;
 case 'users':content=V.usersPage(s,ui);break;
 case 'user':if(ui.mode==='hotel'&&path[2]&&M.canManage(s,ui.session?.userId,path[2]))ui.hotelId=path[2];content=V.userPage(s,ui,path[1],path[2]);break;
 case 'audit':content=V.heading('Журнал действий','История карточек, приглашений и доступов')+V.auditPanel(s,ui);break;
 case 'team':content=V.extranetPage(s,ui,true);break;
 case 'extranet':content=V.extranetPage(s,ui);break;
 case 'profile':content=V.profilePage(s,ui);break;
 case 'review':content=V.reviewPage();break;
 default:content=V.noData('Страница не найдена','Вернитесь в список отелей.');
 }
 root.innerHTML=V.shell(s,ui,content);
 }catch(e){root.innerHTML=V.shell(s,ui,V.noData('Не удалось открыть экран',V.esc(e.message),V.btn('К списку отелей','back-hotels')));console.error(e);}
}
function saveOrg(o,id=''){
 const errors=M.validateOrg(o);if(Object.keys(errors).length)return errors;
 const duplicate=s.orgs.find(x=>x.inn===o.inn&&x.id!==id);if(duplicate)return {inn:'Это ЮЛ уже есть: '+duplicate.name+'. Выберите его из списка.'};
 if(id){const old=s.orgs.find(x=>x.id===id);if(s.hotels.some(h=>h.orgId===id&&h.stage==='complete')&&(old.inn!==o.inn||old.ogrn!==o.ogrn))return {inn:'После регистрации смена контрагента выполняется через другую карточку ЮЛ'};
 const changes=Object.keys(o).filter(k=>String(old[k])!==String(o[k])).map(k=>k+': '+old[k]+' → '+o[k]).join('; ');Object.assign(old,o);M.log(s,actor(),'Реквизиты изменены',old.name,'',changes,'Успешно',now());s.audit[0].orgId=id;return old;
 }const n={...o,id:M.uid('o')};s.orgs.push(n);M.log(s,actor(),'Юрлицо создано',n.name,'','ИНН '+n.inn,'Успешно',now());s.audit[0].orgId=n.id;return n;
}
function saveContract(c,id=''){const errors=M.validateContract(c);if(Object.keys(errors).length)return errors;c={...c,k:Number(c.k),a:String(c.a).replace(',','.')};if(id){const old=s.contracts.find(x=>x.id===id);const snapshot={...old,time:now()};delete snapshot.versions;old.versions||=[];old.versions.unshift(snapshot);Object.assign(old,c);M.log(s,actor(),'Условия договора изменены',old.number,'','Сбор '+snapshot.k+'% → '+old.k+'%; агентское '+snapshot.a+'% → '+old.a+'%','Успешно',now());s.audit[0].orgId=c.orgId;return old;}const n={...c,id:M.uid('c'),versions:[]};s.contracts.push(n);M.log(s,actor(),'Договор создан',n.number||'Без номера','','Сбор '+n.k+'%','Успешно',now());s.audit[0].orgId=c.orgId;return n;}
function saveWizardDraft(){captureWizard();const w=structuredClone(ui.wizard);const idx=s.drafts.findIndex(d=>d.id===w.id);if(idx<0)s.drafts.unshift(w);else s.drafts[idx]=w;persist();toast('Черновик сохранён. Можно вернуться к этому шагу.');}
function wizardNext(override=false){
 captureWizard();const w=ui.wizard;ui.errors={};ui.personErrors=[];ui.duplicates=[];
 if(w.step===0){if(w.orgMode==='existing'){if(!w.orgId)ui.errors={orgId:'Выберите юридическое лицо'};}else{const r=saveOrg(w.org,w.orgCreatedId);if(!r.id)ui.errors=r;else w.orgId=w.orgCreatedId=r.id;}}
 if(w.step===1){if(w.contractMode==='existing'){if(!w.contractId||!s.contracts.some(c=>c.id===w.contractId&&c.orgId===w.orgId))ui.errors={contractId:'Выберите договор этого ЮЛ'};}else{const r=saveContract({...w.contract,orgId:w.orgId},w.contractCreatedId);if(!r.id)ui.errors=r;else w.contractId=w.contractCreatedId=r.id;}}
 if(w.step===2){
 if(w.hotel.site&&!/^https?:\/\//i.test(w.hotel.site))w.hotel.site='https://'+w.hotel.site;
 ui.errors=M.validateHotel(w.hotel);
 if(!Object.keys(ui.errors).length){const ds=M.duplicates(s,{...w.hotel,id:w.hotelId});if(ds.length&&!override){ui.duplicates=ds;render();return;}
 if(!s.contracts.some(c=>c.id===w.contractId&&c.orgId===w.orgId)){ui.errors={name:'Проверьте связь отеля с договором и ЮЛ'};}else{
 let h=s.hotels.find(x=>x.id===w.hotelId);if(h)Object.assign(h,w.hotel,{orgId:w.orgId,contractId:w.contractId});else{h={...w.hotel,id:M.uid('h'),orgId:w.orgId,contractId:w.contractId,stage:'draft',color:'mint',created:now(),links:[],fsa:'',fsaUrl:''};s.hotels.unshift(h);w.hotelId=h.id;}
 M.log(s,actor(),override?'Подтверждён отдельный отель':'Карточка отеля сохранена',h.name,h.id,override?'Предупреждение о дубле подтверждено':'','Успешно',now());
 }}}
 if(Object.keys(ui.errors).length){render();document.querySelector('.error')?.closest('.field')?.querySelector('input,select')?.focus();return;}
 if(w.step<3){w.step++;if(w.step===1&&!s.contracts.some(c=>c.orgId===w.orgId))w.contractMode='new';persist();render();return;}
 ui.personErrors=w.admins.map(M.validatePerson);if(ui.personErrors.some(e=>Object.keys(e).length)){render();return;}
 const result=[];for(let ix=0;ix<w.admins.length;ix++){const p=w.admins[ix];try{result.push({person:p,...M.invite(s,{...p,hotelId:w.hotelId,role:'admin'},actor(),now(),ui.delivery==='all-error'||ui.delivery==='partial'&&ix>0?'error':'ok')});}catch(e){toast(e.message,true);persist();return;}}
 const h=s.hotels.find(h=>h.id===w.hotelId),success=result.some(r=>r.status==='sent'||r.already);
 if(success){s.drafts=s.drafts.filter(d=>d.id!==w.id);ui.wizard=null;}persist();if(success){go('hotel/'+h.id+'/team');showModal(result.some(r=>r.status==='error')?'Приглашения отправлены частично':'Приглашения отправлены',V.note('<b>Этап 1 завершён</b><p>Отель «'+V.esc(h.name)+'» зарегистрирован. Продажи пока не открыты.</p>')+result.map(r=>'<div class="file-row">'+V.icon('mail')+'<div class="file-info"><b>'+V.esc(r.person.email)+'</b><small>'+(r.status==='error'?'Ошибка отправки — можно повторить':r.already?'Доступ уже предоставлен':'Ожидает принятия приглашения')+'</small></div></div>').join(''),V.btn('Открыть демопочту','mailbox')+V.btn('К карточке отеля','close-modal','primary'));}
 else{render();showModal('Письма не отправлены',V.note('Этап 1 не завершён. Все введённые данные сохранены. Можно изменить условия доставки в режиме демонстрации и повторить отправку.','red'),V.btn('Понятно','close-modal','primary'));}
}
function mailbox(){showModal('Демонстрационная почта','<p class="small muted" style="margin-bottom:18px">Письма не отправляются в настоящие ящики. Здесь можно пройти путь приглашённого сотрудника.</p>'+s.messages.slice(0,30).map(m=>m.type==='code'?'<div class="mail"><h3>Код для входа или подтверждения email</h3><p>'+V.esc(m.email)+' · '+V.date(m.time)+'</p><span class="code">'+V.esc(m.code)+'</span></div>':'<div class="mail"><h3>Приглашение в '+V.esc(s.hotels.find(h=>h.id===m.hotelId)?.name)+'</h3><p>'+V.esc(m.email)+' · '+V.date(m.time)+'</p>'+V.btn('Открыть приглашение','open-invite','sm','data-id="'+m.inviteId+'"')+'</div>').join(''));}
function demo(){showModal('Режим демонстрации','<p class="small muted" style="margin-bottom:18px">Вымышленные данные. В этом режиме можно менять роль и проверять развилки процесса.</p><div class="demo-grid">'+V.btn('<b>Кабинет БО</b><small>Карточки, договоры, приглашения</small>','mode-bo','demo-choice')+V.btn('<b>Анна · администратор</b><small>Два отеля, управление командой</small>','mode-user','demo-choice','data-user="u1"')+V.btn('<b>Илья · сотрудник</b><small>Один отель, без управления доступом</small>','mode-user','demo-choice','data-user="u2"')+V.btn('<b>Новый сотрудник</b><small>Вход по коду из email</small>','mode-login','demo-choice')+'</div><div class="section-label">Отправка приглашений</div><div class="chips">'+[['ok','Успешно'],['partial','Частичный успех'],['all-error','Все с ошибкой']].map(([v,l])=>'<button class="chip '+((ui.delivery||'ok')===v?'active':'')+'" data-action="delivery" data-value="'+v+'">'+l+'</button>').join('')+'</div><p class="small muted" style="margin-top:8px">Частичный успех: первое письмо отправится, последующие вернут ошибку.</p><div class="section-label">Демонстрационное время</div><div class="actions">'+V.btn('+31 минута','advance','sm','data-min="31"')+V.btn('+6 дней','advance','sm','data-min="8640"')+V.btn('+8 дней','advance','sm','data-min="11520"')+'</div><p class="small muted" style="margin-top:9px">'+V.date(now())+'</p><div class="divider"></div><div class="actions">'+V.btn(V.icon('mail')+'Демопочта','mailbox')+V.btn('Решения для обсуждения','review')+'</div><div style="margin-top:18px">'+V.btn('Начать показ заново','reset-confirm','sm danger')+'</div>');}
function personModal(hid){const h=s.hotels.find(x=>x.id===hid);M.requireManage(s,actor(),hid);ui.modalData={type:'invite',hid};showModal('Пригласить пользователя','<p class="small muted" style="margin-bottom:20px">'+V.esc(h.name)+' · '+V.esc(s.orgs.find(o=>o.id===h.orgId)?.name)+'</p><form id="invite-form" novalidate>'+V.personFields({})+'<div style="margin-top:18px">'+V.field('role','Роль','staff',{options:[['staff','Сотрудник'],['admin','Администратор']]})+'</div>'+V.note('Сотрудник подтвердит email и примет приглашение. До этого доступ не появится.')+'<button type="submit" class="btn primary">'+V.icon('mail')+'Отправить приглашение</button></form>');}
function userActions(uid,hid){
 M.requireManage(s,actor(),hid);const u=s.users.find(x=>x.id===uid),i=V.latestInvite(s,uid,hid),h=s.hotels.find(x=>x.id===hid);ui.modalData={type:'user-actions',uid,hid};
 const has=u.access[hid],state=i?M.inviteState(i,now()):'';
 showModal(V.esc(u.name),'<p class="small muted">'+V.esc(h.name)+' · '+V.esc(u.email)+'</p><div style="margin:18px 0">'+V.inviteBadge(i,now())+'</div>'+(!has?'<p class="small muted" style="margin-bottom:18px">Активного доступа к этому отелю нет.</p>':'')+(has?'<div class="actions">'+V.btn('Сделать '+(has==='admin'?'сотрудником':'администратором'),'role-change','','data-role="'+(has==='admin'?'staff':'admin')+'"')+V.btn('Отозвать доступ','revoke-access','danger')+'</div>':'')+(i&&state!=='accepted'?'<div class="actions" style="margin-top:15px">'+V.btn('Отправить заново','resend-invite','','data-id="'+i.id+'"')+(state==='sent'?V.btn('Отозвать приглашение','revoke-invite','danger','data-id="'+i.id+'"')+V.btn('Изменить роль в приглашении','invite-role','sm','data-id="'+i.id+'"'):'')+'</div>':'')+(!has&&state==='accepted'?V.btn('Пригласить заново','reinvite','primary','data-user="'+uid+'" data-hotel="'+hid+'"'):''));
}
function editModal(type,id){
 const obj=(type==='org'?s.orgs:type==='contract'?s.contracts:type==='hotel'?s.hotels:s.users).find(x=>x.id===id);ui.modalData={type,id};let content='';
 if(type==='org'){const locked=s.hotels.some(h=>h.orgId===id&&h.stage==='complete');content=V.sharedScopeNotice(s,'org',id)+V.orgFields(obj)+(locked?V.note('ИНН и ОГРН после завершения этапа не меняются. При смене контрагента используется другая карточка ЮЛ.','blue'):'');}
 if(type==='contract')content=V.sharedScopeNotice(s,'contract',id)+V.contractFields(obj);
 if(type==='hotel')content=V.hotelFields(obj);
 if(type==='user')content=V.field('name','Имя и фамилия',obj.name,{max:200})+'<div style="margin-top:18px">'+V.field('phone','Телефон',obj.phone,{optional:true})+'</div>'+Object.entries(obj.positions).map(([oid,p])=>'<div style="margin-top:18px">'+V.field('position_'+oid,'Должность · '+V.esc(M.organizationName(s,oid)),p,{max:150})+'</div>').join('');
 showModal('Редактировать '+({org:'юрлицо',contract:'договор',hotel:'отель',user:'пользователя'}[type]),'<form id="edit-form" novalidate>'+content+'<div id="edit-errors"></div><div style="margin-top:23px"><button type="submit" class="btn primary">Сохранить изменения</button></div></form>');
 if(type==='org'&&s.hotels.some(h=>h.orgId===id&&h.stage==='complete'))for(const k of ['inn','ogrn'])modal.querySelector('[name="'+k+'"]').disabled=true;
}
function linkModal(hid,id){ui.modalData={type:'link',hid,id};const l=s.hotels.find(h=>h.id===hid).links.find(l=>l.id===id)||{};showModal(id?'Изменить ссылку':'Внешний материал','<form id="link-form"><div class="form-grid">'+V.field('title','Название',l.title,{full:true})+V.field('url','Ссылка',l.url,{full:true,placeholder:'https://',max:2048})+V.field('comment','Комментарий',l.comment,{full:true,type:'textarea',optional:true,max:2000})+'</div><div style="margin-top:22px"><button class="btn primary" type="submit">Сохранить ссылку</button></div></form>');}
const boActions=new Set(['new-hotel','resume-hotel','resume-draft','edit-org','edit-contract','edit-hotel','edit-user','add-link','edit-link','archive-file','restore-file','replace-file','download-file']);
document.addEventListener('click',async event=>{
 const b=event.target.closest('[data-action]');const a=b?.dataset.action;
 if(!['advance','demo','mode-bo','mode-user'].includes(a)){if(ui.mode==='bo'&&now()-(ui.boLast||now())<5*M.DAY)ui.boLast=now();if(ui.mode==='hotel'&&ui.session&&M.sessionValid(ui.session,now()))ui.session.lastActive=now();persist();}
 if(!b||b.disabled)return;
 if(ui.mode==='hotel'&&ui.session&&M.sessionValid(ui.session,now())&&!['advance','mode-bo','mode-user','demo'].includes(a)){ui.session.lastActive=now();persist();}
 if(boActions.has(a)&&ui.mode!=='bo'){toast('Действие доступно только БО',true);return;}
 try{
 switch(a){
 case 'new-hotel':ui.wizard=newWizard();ui.errors={};go('wizard');break;
 case 'resume-hotel':ui.wizard=newWizard(s.hotels.find(h=>h.id===b.dataset.id));ui.errors={};go('wizard');break;
 case 'resume-draft':ui.wizard=structuredClone(s.drafts.find(d=>d.id===b.dataset.id));ui.errors={};go('wizard');break;
 case 'save-draft':saveWizardDraft();break;
 case 'cancel-wizard':saveWizardDraft();go('hotels');break;
 case 'wizard-back':captureWizard();ui.wizard.step=Math.max(0,ui.wizard.step-1);ui.errors={};render();break;
 case 'org-mode':captureWizard();ui.wizard.orgMode=b.dataset.value;ui.errors={};render();break;
 case 'contract-mode':captureWizard();ui.wizard.contractMode=b.dataset.value;ui.errors={};render();break;
 case 'pick-org':if(ui.wizard.orgId!==b.dataset.id){ui.wizard.contractId='';ui.wizard.contractCreatedId='';}ui.wizard.orgId=b.dataset.id;ui.errors={};render();break;
 case 'pick-contract':ui.wizard.contractId=b.dataset.id;ui.errors={};render();break;
 case 'sample-org':ui.wizard.org={...M.seed().orgs[0],name:'ООО «Новый партнёр»'};delete ui.wizard.org.id;ui.wizard.org.inn='7801000044';ui.wizard.org.ogrn='1267800000049';render();break;
 case 'add-admin':captureWizard();ui.wizard.admins.push({name:'',email:'',phone:'',position:''});render();break;
 case 'remove-admin':captureWizard();ui.wizard.admins.splice(Number(b.dataset.index),1);render();break;
 case 'override-duplicate':wizardNext(true);break;
 case 'filter':ui.filter=b.dataset.value;render();break;
 case 'demo':demo();break;
 case 'close-modal':closeModal();break;
 case 'mailbox':mailbox();break;
 case 'delivery':ui.delivery=b.dataset.value;demo();break;
 case 'advance':ui.offset=(ui.offset||0)+Number(b.dataset.min)*60000;persist();render();demo();break;
 case 'mode-bo':ui.mode='bo';ui.authTarget='';ui.boLast=now();go('hotels');persist();break;
 case 'mode-user':ui.authTarget='';ui.mode='hotel';ui.session={userId:b.dataset.user,email:s.users.find(u=>u.id===b.dataset.user).email,created:now(),lastActive:now()};s.users.find(u=>u.id===b.dataset.user).lastLogin=now();ui.hotelId='h1';M.log(s,b.dataset.user,'Успешный вход',s.users.find(u=>u.id===b.dataset.user).name,'','Вход через режим демонстрации','Успешно',now());go('extranet');persist();break;
 case 'mode-login':case 'login-redirect':ui.authTarget='';ui.mode='hotel';ui.session=null;ui.authStep='email';ui.authError='';go('login');persist();break;
 case 'logout':ui.session=null;ui.authStep='email';go('login');persist();break;
 case 'open-invite':ui.authTarget='';ui.mode='hotel';ui.session=null;ui.authStep='email';ui.authError='';ui.authEmail='';go('invite/'+b.dataset.id);persist();break;
 case 'accept-invite':M.accept(s,b.dataset.id,ui.session?.userId,now());ui.hotelId=s.invitations.find(i=>i.id===b.dataset.id).hotelId;persist();go('extranet');toast('Приглашение принято. Доступ к отелю открыт.');break;
 case 'auth-back':ui.authStep='email';ui.authError='';render();break;
 case 'resend-code':M.requestCode(s,ui.authEmail,now());ui.authError='';persist();render();toast('Новый код в демонстрационной почте');break;
 case 'invite-person':personModal(b.dataset.hotel);break;
 case 'user-actions':userActions(b.dataset.user,b.dataset.hotel);break;
 case 'role-change':M.changeAccess(s,ui.modalData.uid,ui.modalData.hid,b.dataset.role,actor(),now());persist();closeModal();render();toast('Роль изменена');break;
 case 'revoke-access':showModal('Отозвать доступ?',V.note('Сотрудник потеряет доступ только к этому отелю. Другие отели и история сохранятся.','amber'),V.btn('Отмена','close-modal')+V.btn('Отозвать доступ','confirm-revoke','danger'));break;
 case 'confirm-revoke':M.changeAccess(s,ui.modalData.uid,ui.modalData.hid,null,actor(),now());persist();closeModal();render();toast('Доступ отозван');break;
 case 'resend-invite':{const r=M.resend(s,b.dataset.id,actor(),now(),ui.delivery==='all-error'?'error':'ok');persist();closeModal();render();toast(r.status==='error'?'Письмо не отправлено. Прежнее приглашение сохранено.':'Новое приглашение отправлено. Старая ссылка заменена.',r.status==='error');break;}
 case 'revoke-invite':{const i=s.invitations.find(i=>i.id===b.dataset.id);M.requireManage(s,actor(),i.hotelId);i.status='revoked';M.log(s,actor(),'Приглашение отозвано',i.email,i.hotelId,'','Успешно',now());persist();closeModal();render();toast('Приглашение отозвано');break;}
 case 'invite-role':{const i=s.invitations.find(i=>i.id===b.dataset.id);i.status='revoked';i.role=i.role==='admin'?'staff':'admin';const r=M.resend(s,i.id,actor(),now(),ui.delivery==='all-error'?'error':'ok');persist();closeModal();render();toast(r.status==='error'?'Старая ссылка отозвана. Новое письмо не отправлено.':'Роль изменена, новое приглашение отправлено.',r.status==='error');break;}
 case 'reinvite':{const u=s.users.find(u=>u.id===b.dataset.user),h=s.hotels.find(h=>h.id===b.dataset.hotel);M.invite(s,{hotelId:h.id,name:u.name,email:u.email,position:u.positions[h.orgId],phone:u.phone,role:'staff'},actor(),now());persist();closeModal();render();toast('Приглашение отправлено');break;}
 case 'edit-org':case 'edit-contract':case 'edit-hotel':case 'edit-user':editModal(a.slice(5),b.dataset.id);break;
 case 'add-link':case 'edit-link':linkModal(b.dataset.hotel,b.dataset.id);break;
 case 'archive-file':{const f=s.files.find(x=>x.id===b.dataset.id);f.active=false;M.log(s,actor(),'Файл убран из актуальных',f.name,'','Версия '+f.version,'Успешно',now());persist();render();toast('Материал убран из актуальных. Его можно восстановить.');break;}
 case 'restore-file':{const f=s.files.find(x=>x.id===b.dataset.id);if(s.files.filter(x=>x.contractId===f.contractId&&x.active).length>=20)throw Error('У договора уже 20 актуальных вложений');f.active=true;M.log(s,actor(),'Файл восстановлен',f.name,'','Версия '+f.version,'Успешно',now());persist();render();break;}
 case 'replace-file':ui.replaceFile=b.dataset.id;{const old=s.files.find(x=>x.id===b.dataset.id);const inp=document.createElement('input');inp.type='file';inp.accept='.pdf,.docx,.xlsx,.jpg,.jpeg,.png';inp.onchange=()=>upload(inp.files[0],old.contractId,old.id);inp.click();}break;
 case 'download-file':await download(b.dataset.id);break;
 case 'change-email':ui.modalData={type:'email'};showModal('Изменить email','<p class="small muted" style="margin-bottom:20px">Подтвердим старый и новый адрес. Доступы и история останутся в вашей учётной записи.</p><form id="email-start">'+V.field('email','Новый email','',{type:'email',max:254})+'<button type="submit" class="btn primary" style="margin-top:20px">Получить коды</button></form>');break;
 case 'review':go('review');break;
 case 'reset-confirm':showModal('Начать показ заново?',V.note('Созданные вами демонстрационные карточки и изменения в этом браузере будут сброшены.','amber'),V.btn('Отмена','close-modal')+V.btn('Восстановить демоданные','reset','danger'));break;
 case 'reset':s=M.upgradeDirectory(M.seed());ui={mode:'bo',route:'hotels',search:'',filter:'all',offset:0,errors:{},authStep:'email'};persist();go('hotels');toast('Начальный набор восстановлен');break;
 case 'back-hotels':go('hotels');break;
 }
 }catch(e){persist();toast(e.message,true);}
});
document.addEventListener('submit',async event=>{
 event.preventDefault();const form=event.target,d=details(form);
 try{
 if(form.id==='wizard-form'){wizardNext();return;}
 if(form.id==='auth-form'){
 const inviteId=ui.route.startsWith('invite/')?ui.route.split('/')[1]:'',inv=s.invitations.find(i=>i.id===inviteId);
 try{if(ui.authStep!=='code'){ui.authEmail=inv?.email||d.email;M.requestCode(s,ui.authEmail,now());ui.authStep='code';ui.authError='';}else{ui.session=M.verifyCode(s,ui.authEmail,d.code,now());ui.authError='';if(ui.session.userId==='bo'){ui.authTarget='';ui.mode='bo';ui.boLast=now();ui.session=null;go('hotels');}else{ui.mode='hotel';if(!inviteId)go('extranet');}}}
 catch(e){ui.authError=e.message;}persist();render();return;
 }
 if(form.id==='invite-form'){const hid=ui.modalData.hid;const errs=M.validatePerson(d);if(Object.keys(errs).length){for(const [k,msg] of Object.entries(errs)){const el=form.querySelector('[name="'+k+'"]');el?.setCustomValidity(msg);el?.reportValidity();el?.addEventListener('input',()=>el.setCustomValidity(''),{once:true});}return;}const r=M.invite(s,{...d,hotelId:hid},actor(),now(),ui.delivery==='all-error'?'error':'ok');persist();closeModal();render();toast(r.status==='error'?'Ошибка отправки. Данные сотрудника сохранены.':'Приглашение отправлено',r.status==='error');return;}
 if(form.id==='edit-form'){
 const {type,id}=ui.modalData;let r;
 if(type==='org'){const old=s.orgs.find(x=>x.id===id);r=saveOrg({...old,...d},id);}
 if(type==='contract'){const old=s.contracts.find(x=>x.id===id);r=saveContract({...old,...d,noNumber:!!d.noNumber},id);}
 if(type==='hotel'){const h=s.hotels.find(x=>x.id===id);if(d.site&&!/^https?:\/\//i.test(d.site))d.site='https://'+d.site;r=M.validateHotel(d);if(!Object.keys(r).length){const ds=M.duplicates(s,{...h,...d});if(ds.length&&!ui.confirmEditDuplicate){ui.confirmEditDuplicate=true;document.querySelector('#edit-errors').innerHTML=V.note('Название и адрес совпадают с другим отелем. Нажмите «Сохранить изменения» повторно, если это отдельный объект.','amber');return;}const detail=Object.keys(d).filter(k=>h[k]!==d[k]).map(k=>k+': '+h[k]+' → '+d[k]).join('; ');Object.assign(h,d);M.log(s,actor(),'Данные отеля изменены',h.name,h.id,detail,'Успешно',now());r=h;ui.confirmEditDuplicate=false;}}
 if(type==='user'){const u=s.users.find(x=>x.id===id),keys=Object.keys(d).filter(k=>k.startsWith('position_'));if(!d.name.trim())throw Error('Укажите имя');if(keys.some(k=>!d[k].trim()))throw Error('Должность не может быть пустой');if(d.phone&&!/^\+?[0-9 ()-]{7,22}$/.test(d.phone))throw Error('Проверьте телефон');const changes=[];if(u.name!==d.name.trim())changes.push('Имя: '+u.name+' → '+d.name.trim());if(u.phone!==M.phone(d.phone))changes.push('Телефон: '+u.phone+' → '+M.phone(d.phone));for(const k of keys){const oid=k.slice(9);if(u.positions[oid]!==d[k].trim())changes.push('Должность · '+M.organizationName(s,oid)+': '+u.positions[oid]+' → '+d[k].trim());}u.name=d.name.trim();u.phone=M.phone(d.phone);for(const k of keys)u.positions[k.slice(9)]=d[k].trim();M.log(s,actor(),'Данные пользователя изменены',u.name,'',changes.join('; '),'Успешно',now());r=u;}
 if(!r?.id){document.querySelector('#edit-errors').innerHTML=V.note(Object.values(r).map(V.esc).join('<br>'),'red');return;}
 persist();closeModal();render();toast('Изменения сохранены в истории');return;
 }
 if(form.id==='link-form'){const h=s.hotels.find(x=>x.id===ui.modalData.hid);if(!d.title.trim())throw Error('Укажите название ссылки');if(!/^https?:\/\//i.test(d.url))d.url='https://'+d.url;const u=new URL(d.url);if(!['https:','http:'].includes(u.protocol)||d.url.length>2048)throw Error('Проверьте ссылку');if(!ui.modalData.id&&h.links.length>=20)throw Error('Не более 20 внешних ссылок');const l=h.links.find(x=>x.id===ui.modalData.id);if(l)Object.assign(l,d);else h.links.push({...d,id:M.uid('link')});M.log(s,actor(),'Внешняя ссылка сохранена',d.title,h.id,d.url,'Успешно',now());persist();closeModal();render();toast('Ссылка сохранена');return;}
 if(form.id==='profile-form'){const u=s.users.find(x=>x.id===ui.session.userId);const old=u.phone;u.phone=M.phone(d.phone);M.log(s,u.id,'Телефон изменён',u.name,'',old+' → '+u.phone,'Успешно',now());persist();render();toast('Телефон сохранён');return;}
 if(form.id==='email-start'){const u=s.users.find(x=>x.id===ui.session.userId),email=M.normalizeEmail(d.email);if(email===u.email)throw Error('Это ваш текущий email');if(s.users.some(x=>x.email===email))throw Error('Этот email уже занят другой учётной записью');const oldCode=M.requestCode(s,u.email,now(),'old-email'),newCode=M.requestCode(s,email,now(),'new-email');ui.modalData={type:'email-confirm',email,oldEmail:u.email};persist();showModal('Подтвердите оба адреса','<form id="email-confirm">'+V.field('oldCode','Код на '+V.esc(u.email),'',{max:6})+'<div style="margin-top:18px">'+V.field('newCode','Код на '+V.esc(email),'',{max:6})+'</div><div class="helper-code">Демопочта: старый адрес <b>'+oldCode.code+'</b><br>новый адрес <b>'+newCode.code+'</b></div><button class="btn primary" type="submit" style="margin-top:20px">Изменить email</button></form>');return;}
 if(form.id==='email-confirm'){const m=ui.modalData;if(!m.oldVerified){M.verifyCode(s,m.oldEmail,d.oldCode,now(),'old-email');m.oldVerified=true;}M.verifyCode(s,m.email,d.newCode,now(),'new-email');const u=s.users.find(x=>x.id===ui.session.userId);u.email=m.email;for(const i of s.invitations.filter(i=>i.userId===u.id&&i.status==='sent'))i.status='revoked';M.log(s,u.id,'Email изменён',u.name,'',m.oldEmail+' → '+m.email,'Успешно',now());ui.session=null;ui.authEmail=m.email;ui.authStep='email';persist();go('login');toast('Email изменён. Войдите заново. Непринятые приглашения нужно переоформить.');return;}
 }catch(e){persist();toast(e.message,true);}
});
document.addEventListener('input',e=>{
 if(e.target.id==='hotel-search'){const pos=e.target.selectionStart;ui.search=e.target.value;render();const el=document.querySelector('#hotel-search');el?.focus();try{el?.setSelectionRange(pos,pos);}catch{}}
 if(e.target.closest('#wizard-form')){captureWizard();persist();}
 if(ui.mode==='hotel'&&ui.session&&M.sessionValid(ui.session,now())){ui.session.lastActive=now();persist();}
});
document.addEventListener('change',e=>{
 const t=e.target;if(['k','term','noNumber'].includes(t.name)&&t.closest('#wizard-form')){captureWizard();render();}
 if(['k','term','noNumber'].includes(t.name)&&t.closest('#edit-form')){if(t.name==='k'){document.querySelector('#discount-preview').innerHTML=V.discount(t.value);}else{const d=details(t.form),obj=s.contracts.find(c=>c.id===ui.modalData.id);const val={...obj,...d,noNumber:!!d.noNumber};const form=t.form;form.innerHTML=V.sharedScopeNotice(s,'contract',obj.id)+V.contractFields(val)+'<div id="edit-errors"></div><div style="margin-top:23px"><button type="submit" class="btn primary">Сохранить изменения</button></div>';}}
 if(t.id==='hotel-switch'){const u=s.users.find(u=>u.id===ui.session?.userId);if(!u?.access[t.value])return;ui.hotelId=t.value;persist();const path=ui.route.split('/');if(path[0]==='hotel')go('hotel/'+t.value+'/'+(path[2]==='team'?'team':'details'));else if(path[0]==='user'||path[0]==='team')go(M.canManage(s,u.id,t.value)?'team':'extranet');else render();}
 if(['hotel-org-filter','hotel-status-filter','user-type-filter','user-org-filter'].includes(t.id)){const key={'hotel-org-filter':'hotelOrg','hotel-status-filter':'filter','user-type-filter':'userType','user-org-filter':'userOrg'}[t.id];ui[key]=t.value;render();}
 if(t.name?.startsWith('audit')){ui[t.name]=t.value;render();}
 if(t.id==='file-upload')upload(t.files[0],t.dataset.contract);
});
window.addEventListener('hashchange',()=>{ui.search='';ui.errors={};ui.duplicates=[];ui.authError='';render();window.scrollTo(0,0);});
window.addEventListener('storage',e=>{if(e.key===KEY){s=read(KEY,s);render();}});
modal.addEventListener('click',e=>{if(e.target===modal&&e.offsetX<0)closeModal();});
function db(){return new Promise((resolve,reject)=>{const q=indexedDB.open('hopinn-prototype-files',1);q.onupgradeneeded=()=>q.result.createObjectStore('files');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});}
async function blobPut(id,blob){const d=await db();await new Promise((res,rej)=>{const t=d.transaction('files','readwrite');t.objectStore('files').put(blob,id);t.oncomplete=res;t.onerror=()=>rej(t.error);});d.close();}
async function blobGet(id){const d=await db();return new Promise((res,rej)=>{const r=d.transaction('files').objectStore('files').get(id);r.onsuccess=()=>{res(r.result);d.close();};r.onerror=()=>rej(r.error);});}
async function upload(file,cid,replaceId){try{if(!file)return;if(ui.mode!=='bo')throw Error('Вложения доступны только БО');if(file.size>20*1024*1024)throw Error('Размер файла превышает 20 МБ');if(!/\.(pdf|docx|xlsx|jpe?g|png)$/i.test(file.name))throw Error('Допустимы PDF, DOCX, XLSX, JPG, PNG');if(!replaceId&&s.files.filter(f=>f.contractId===cid&&f.active).length>=20)throw Error('Не более 20 актуальных файлов');const old=s.files.find(x=>x.id===replaceId),f={id:M.uid('f'),contractId:cid,name:file.name,size:file.size,type:file.type,version:(old?.version||0)+1,active:true,checked:false,time:now()};await blobPut(f.id,file);if(old)old.active=false;s.files.push(f);M.log(s,actor(),old?'Версия файла добавлена':'Файл добавлен',f.name,'','Версия '+f.version,'Успешно',now());persist();render();toast('Файл сохранён. Выполняется демонстрационная проверка.');setTimeout(()=>{f.checked=true;persist();render();},1000);}catch(e){toast(e.message,true);}}
async function download(id){const f=s.files.find(x=>x.id===id);if(!f?.checked)throw Error('Файл ещё не проверен');let blob=await blobGet(id);let name=f.name;if(!blob&&f.fixture){blob=new Blob(['ДЕМОНСТРАЦИОННЫЙ МАТЕРИАЛ\n\nПример приложения к договору Hopinn.\nНе является настоящим договором.'],{type:'text/plain;charset=utf-8'});name='Демонстрационный договор.txt';}if(!blob)throw Error('Файл отсутствует в этом браузере. Загрузите его снова.');const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
persist();render();

