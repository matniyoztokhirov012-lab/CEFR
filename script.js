const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const STORAGE_KEY = "cefrMasterDarkElite_v1";
const initialState = {
  minutes: 0, tests: 0, wordsLearned: 0, streak: 1, introDone: false, bestScore: null,
  words: [
    {id:1, english:"curious", uzbek:"qiziquvchan", example:"Stay curious. Keep learning.", learned:false},
    {id:2, english:"improve", uzbek:"yaxshilamoq", example:"I want to improve my English.", learned:false},
    {id:3, english:"confident", uzbek:"o‘ziga ishongan", example:"Practice helps me feel confident.", learned:false},
    {id:4, english:"opportunity", uzbek:"imkoniyat", example:"Learning creates new opportunities.", learned:false}
  ],
  completedLessons: [], selectedLevel:"A1"
};
let state;
try { state = {...initialState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")}; }
catch { state = {...initialState}; }
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); updateStats(); }
function toast(message){ const el=$("#toast"); el.textContent=message; el.classList.add("show"); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove("show"),2500); }

const pageNames={dashboard:"Bosh sahifa",lessons:"Darsliklar",tests:"Test markazi",vocabulary:"Lug‘at daftari",typing:"Typing lab",skills:"4 ta ko‘nikma",levels:"CEFR yo‘li"};
function showPage(name){
  if(!pageNames[name]) name="dashboard";
  $$(".page").forEach(p=>p.classList.toggle("active",p.id===`page-${name}`));
  $$(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===name));
  $("#pageTitle").textContent=pageNames[name];
  $("#sidebar").classList.remove("open");
  window.scrollTo({top:0,behavior:"smooth"});
  if(name==="vocabulary") renderVocabulary();
}
$$("[data-page]").forEach(btn=>btn.addEventListener("click",e=>{e.preventDefault();showPage(btn.dataset.page)}));
$$("[data-go]").forEach(btn=>btn.addEventListener("click",()=>showPage(btn.dataset.go)));
$("#mobileMenu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
document.addEventListener("click",e=>{if(window.innerWidth<=900 && $("#sidebar").classList.contains("open") && !$("#sidebar").contains(e.target) && !$("#mobileMenu").contains(e.target))$("#sidebar").classList.remove("open")});
$("#todayDate").textContent=new Intl.DateTimeFormat("uz-UZ",{day:"2-digit",month:"short",year:"numeric"}).format(new Date());
$("#goalButton").addEventListener("click",()=>toast("Bugungi maqsad: kamida 15 daqiqa ingliz tili!"));
$("#resetProgress").addEventListener("click",()=>{if(confirm("Progress va saqlangan ma’lumotlarni tiklamoqchimisiz?")){localStorage.removeItem(STORAGE_KEY);state={...initialState,words:initialState.words.map(w=>({...w}))};saveState();renderVocabulary();renderLessons();toast("Progress qayta tiklandi.");}});

const lessons=[
 {id:1,level:"A1",title:"Salomlashish va tanishish",desc:"Hello, How are you? va o‘zingizni tanishtirish uchun kerakli iboralar.",time:12,topic:"Greetings"},
 {id:2,level:"A1",title:"To be: am / is / are",desc:"Ingliz tilidagi eng muhim fe’llardan biri va sodda gaplar tuzish.",time:15,topic:"Grammar"},
 {id:3,level:"A1",title:"Raqamlar va yosh",desc:"Raqamlar, yosh aytish va oddiy shaxsiy ma’lumotlar.",time:10,topic:"Basics"},
 {id:4,level:"A2",title:"Daily routine",desc:"Kundalik ishlar, vaqt va Present Simple bilan gapirish.",time:18,topic:"Grammar"},
 {id:5,level:"A2",title:"At the café",desc:"Kafeda buyurtma berish va muloyim iboralarni ishlatish.",time:14,topic:"Speaking"},
 {id:6,level:"A2",title:"Past Simple",desc:"O‘tgan voqealar haqida sodda va tushunarli gaplar tuzing.",time:20,topic:"Grammar"},
 {id:7,level:"B1",title:"Sharing your opinion",desc:"Fikringizni bildirish, sabab keltirish va suhbatni davom ettirish.",time:20,topic:"Speaking"},
 {id:8,level:"B1",title:"Reading for meaning",desc:"Matnning asosiy g‘oyasi va muhim detallarini toping.",time:22,topic:"Reading"},
 {id:9,level:"B1",title:"Future plans",desc:"Kelajak rejalari haqida turli tuzilmalar bilan gapiring.",time:18,topic:"Grammar"},
 {id:10,level:"B2",title:"Linking ideas",desc:"Murakkab gaplar va bog‘lovchilar bilan fikrlarni bog‘lang.",time:25,topic:"Writing"},
 {id:11,level:"B2",title:"Academic vocabulary",desc:"Ta’lim va jamiyat mavzularidagi foydali so‘zlar.",time:20,topic:"Vocabulary"},
 {id:12,level:"C1",title:"Nuanced arguments",desc:"Murakkab mavzularda aniq, asoslangan fikr bildirish.",time:30,topic:"Advanced"},
 {id:13,level:"C1",title:"Formal writing",desc:"Rasmiy uslubda fikrni tartibli va ishonchli ifodalash.",time:30,topic:"Writing"}
];
const levelInfo={
 A1:{name:"Beginner",uz:"Boshlang‘ich",desc:"Tanish iboralar va sodda gaplarni tushunish, o‘zingizni tanishtirish.",goal:"Salomlashish, shaxsiy ma’lumotlar, kundalik so‘zlar.",duration:"Boshlanish nuqtasi"},
 A2:{name:"Elementary",uz:"Oddiy muloqot",desc:"Kundalik vaziyatlarda tez-tez ishlatiladigan gaplarni tushunish.",goal:"Kundalik tartib, xarid, yo‘l so‘rash, o‘tgan voqealar.",duration:"A1 dan keyingi bosqich"},
 B1:{name:"Intermediate",uz:"O‘rta daraja",desc:"Tanish mavzularda asosiy fikrni tushunish va mustaqil muloqot qilish.",goal:"Fikr bildirish, tajriba aytish, reja va sabablarni tushuntirish.",duration:"Mustaqil muloqot"},
 B2:{name:"Upper-intermediate",uz:"O‘rta-yuqori",desc:"Murakkabroq matn va suhbatlarni tushunib, ravon muloqot qilish.",goal:"Dalil keltirish, akademik matn, munozara va taqdimot.",duration:"Murakkab mavzular"},
 C1:{name:"Advanced",uz:"Yuqori daraja",desc:"Uzun va murakkab matnlarni tushunish, fikrni ravon va moslashuvchan ifodalash.",goal:"Nuanslar, rasmiy yozuv, murakkab munozara.",duration:"Ravon va aniq nutq"}
};
function renderLessons(filter="ALL"){
 const grid=$("#lessonGrid"); grid.innerHTML="";
 lessons.filter(l=>filter==="ALL"||l.level===filter).forEach((l,i)=>{
  const done=state.completedLessons.includes(l.id);
  const card=document.createElement("article");card.className="lesson-card";
  card.innerHTML=`<div class="lesson-card-art"><span class="card-level">${l.level}</span><span class="card-index">LESSON / ${String(l.id).padStart(2,"0")}</span></div><div class="lesson-card-body"><span class="tag">${l.level} · ${levelInfo[l.level].name.toUpperCase()}</span><h3>${l.title}</h3><p>${l.desc}</p><div class="lesson-card-bottom"><small>◷ ${l.time} daqiqa</small><button data-lesson="${l.id}">${done?"Takrorlash":"Darsni ochish"} ↗</button></div></div>`;
  grid.appendChild(card);
 });
 $$("[data-lesson]",grid).forEach(btn=>btn.addEventListener("click",()=>openLesson(Number(btn.dataset.lesson))));
}
$("#lessonFilters").addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(!b)return;$$(".filter").forEach(x=>x.classList.toggle("active",x===b));renderLessons(b.dataset.filter)});
function openLesson(id){
 const l=lessons.find(x=>x.id===id); if(!l)return;
 if(id===1){
  const done=state.completedLessons.includes(1);
  const msg=`${l.title}\n\n1. Hello! — Salom!\n2. How are you? — Qalaysiz?\n3. I’m fine, thank you. — Yaxshiman, rahmat.\n4. My name is ... — Mening ismim ...\n5. I’m from Uzbekistan. — Men O‘zbekistondanman.\n\nMashq: “What is your name?” savoliga inglizcha javob bering.`;
  alert(msg);
  if(!done){state.completedLessons.push(1);state.minutes+=12;state.introDone=true;saveState();renderLessons();toast("Ajoyib! Birinchi dars bajarildi.");}
 } else {
  alert(`${l.title} (${l.level})\n\n${l.desc}\n\nFoydali ibora: ${l.level==="A1"?"I am learning English.":l.level==="A2"?"I usually study every day.":l.level==="B1"?"In my opinion, learning takes practice.":l.level==="B2"?"One important factor to consider is practice.":"A nuanced understanding develops through consistent reflection."}\n\nUshbu mavzuni daftaringizga yozib, 3 ta o‘zingizga oid gap tuzing.`);
  if(!state.completedLessons.includes(id)){state.completedLessons.push(id);state.minutes+=l.time;saveState();renderLessons();toast("Dars bajarildi deb belgilandi.");}
 }
}
$("#continueLesson").addEventListener("click",()=>openLesson(1));
$$("[data-level]").forEach(btn=>btn.addEventListener("click",()=>{state.selectedLevel=btn.dataset.level;saveState();showPage("levels");renderRoadmap();toast(`${btn.dataset.level} darajasi tanlandi.`)}));

function updateStats(){
 $("#minutesStat").textContent=state.minutes;$("#testsStat").textContent=state.tests;$("#wordsStat").textContent=state.wordsLearned;
 $("#streakStat").textContent=state.streak;$("#minutesBar").style.width=Math.min(100,state.minutes/15*100)+"%";$("#testsBar").style.width=Math.min(100,state.tests/5*100)+"%";$("#wordsBar").style.width=Math.min(100,state.wordsLearned/20*100)+"%";
 const pct=state.introDone?100:0;$("#introProgress").style.width=pct+"%";$("#introProgressText").textContent=pct+"% yakunlandi";
 $("#bestScore").textContent=state.bestScore===null?"—":`${state.bestScore}/10`;
 $("#profileLevel").textContent=`${state.selectedLevel||"A1"} · ${levelInfo[state.selectedLevel||"A1"].name}`;
 $("#vocabTotal").textContent=state.words.length;$("#vocabLearned").textContent=state.words.filter(w=>w.learned).length;$("#vocabReview").textContent=state.words.filter(w=>!w.learned).length;
}
const questions=[
 {q:"Choose the correct sentence.",answers:["She are a student.","She is a student.","She am a student."],correct:1,explain:"He/She/It bilan “is” ishlatiladi."},
 {q:"I ___ from Uzbekistan.",answers:["am","is","are"],correct:0,explain:"I bilan “am” ishlatiladi."},
 {q:"What is the meaning of “book”?",answers:["Daftar","Kitob","Qalam"],correct:1,explain:"Book — kitob."},
 {q:"They ___ football every weekend.",answers:["plays","playing","play"],correct:2,explain:"They bilan Present Simple’da fe’lning oddiy shakli ishlatiladi."},
 {q:"Choose the past form of “go”.",answers:["goed","went","gone"],correct:1,explain:"Go fe’lining Past Simple shakli — went."},
 {q:"“Beautiful” so‘zining ma’nosi?",answers:["Chiroyli","Qimmat","Qiyin"],correct:0,explain:"Beautiful — chiroyli, go‘zal."},
 {q:"There ___ two apples on the table.",answers:["is","are","am"],correct:1,explain:"Ko‘plikdagi two apples bilan “are” ishlatiladi."},
 {q:"Choose the correct future sentence.",answers:["I will study tomorrow.","I studied tomorrow.","I studying tomorrow."],correct:0,explain:"Kelajak uchun “will + fe’l” ishlatilishi mumkin."},
 {q:"“Although” so‘zi qanday ma’noni beradi?",answers:["Shuning uchun","Garchi","Masalan"],correct:1,explain:"Although — garchi, ... bo‘lsa-da."},
 {q:"Choose the closest meaning of “rapid”.",answers:["Slow","Quick","Quiet"],correct:1,explain:"Rapid — tez; quick unga yaqin ma’noli."}
];
let quiz={index:0,answers:[],locked:false};
$("#startTest").addEventListener("click",startTest);
function startTest(){quiz={index:0,answers:[],locked:false};$("#quizArea").classList.remove("hidden");renderQuestion();$("#quizArea").scrollIntoView({behavior:"smooth",block:"start"});}
function renderQuestion(){
 const q=questions[quiz.index],area=$("#quizArea");quiz.locked=false;
 area.innerHTML=`<div class="quiz-top"><span>SAVOL ${quiz.index+1} / ${questions.length}</span><span>GRAMMAR & VOCABULARY</span></div><div class="quiz-progress"><i style="width:${(quiz.index/questions.length)*100}%"></i></div><h3>${q.q}</h3><div class="answer-list">${q.answers.map((a,i)=>`<button class="answer-option" data-answer="${i}">${String.fromCharCode(65+i)}. ${a}</button>`).join("")}</div><div class="quiz-controls"><span class="quiz-feedback" id="quizFeedback">Javobni tanlang.</span><button class="btn btn-orange" id="nextQuestion" disabled>${quiz.index===questions.length-1?"Natijani ko‘rish":"Keyingi savol →"}</button></div>`;
 $$("[data-answer]",area).forEach(b=>b.addEventListener("click",()=>selectAnswer(Number(b.dataset.answer))));
 $("#nextQuestion").addEventListener("click",()=>{if(quiz.answers[quiz.index]===undefined)return;if(quiz.index<questions.length-1){quiz.index++;renderQuestion()}else finishTest()});
}
function selectAnswer(index){
 if(quiz.locked)return;quiz.locked=true;quiz.answers[quiz.index]=index;const q=questions[quiz.index];
 $$("[data-answer]",$("#quizArea")).forEach((b,i)=>{b.disabled=true;if(i===q.correct)b.classList.add("correct");else if(i===index)b.classList.add("wrong")});
 $("#quizFeedback").textContent=(index===q.correct?"To‘g‘ri! ":"Noto‘g‘ri. ")+q.explain;$("#nextQuestion").disabled=false;
}
function finishTest(){
 const score=quiz.answers.reduce((n,a,i)=>n+(a===questions[i].correct?1:0),0);state.tests++;state.minutes+=5;state.bestScore=state.bestScore===null?score:Math.max(state.bestScore,score);saveState();
 $("#quizArea").innerHTML=`<div class="test-big-icon">${score>=7?"✦":"↗"}</div><span class="section-kicker">TEST NATIJASI</span><h2 style="font-size:28px;margin:12px 0">${score}/10 — ${score>=9?"A’lo!":score>=7?"Yaxshi natija!":score>=5?"Yaxshi boshlanish!":"Mashqni davom ettiring!"}</h2><p style="color:#aaa;line-height:1.8;font-size:12px">Siz ${questions.length} ta savoldan ${score} tasiga to‘g‘ri javob berdingiz. ${score<7?"Xatolarni qayta ko‘rib chiqing va yana urinib ko‘ring.":"Shu tartibda davom eting — muntazam mashq muhim."}</p><button class="btn btn-orange" id="retryTest">Qayta topshirish ↻</button> <button class="btn btn-ghost" id="backLessons">Darslarga qaytish →</button>`;
 $("#retryTest").addEventListener("click",startTest);$("#backLessons").addEventListener("click",()=>showPage("lessons"));toast("Test natijasi saqlandi.");
}

function escapeHTML(str){return String(str).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function renderVocabulary(query=""){
 const grid=$("#vocabGrid");grid.innerHTML="";
 const filtered=state.words.filter(w=>(w.english+" "+w.uzbek).toLowerCase().includes(query.toLowerCase()));
 $("#vocabEmpty").classList.toggle("hidden",filtered.length>0);grid.classList.toggle("hidden",filtered.length===0);
 filtered.forEach(w=>{
  const card=document.createElement("article");card.className="vocab-card";
  card.innerHTML=`<div class="vocab-card-top"><div><h3>${escapeHTML(w.english)}</h3><p>${escapeHTML(w.uzbek)}</p></div><button class="delete-word" data-delete="${w.id}" title="O‘chirish">×</button></div><div class="example">${escapeHTML(w.example||"Misol gap qo‘shilmagan.")}</div><div class="vocab-card-actions"><button class="mini-btn ${w.learned?"learned":""}" data-learn="${w.id}">${w.learned?"✓ O‘rganildi":"✓ O‘rgandim"}</button><button class="mini-btn" data-speak="${w.id}">🔊 Eshitish</button></div>`;
  grid.appendChild(card);
 });
 $$("[data-learn]",grid).forEach(b=>b.addEventListener("click",()=>{const w=state.words.find(x=>x.id===Number(b.dataset.learn));if(!w)return;w.learned=!w.learned;state.wordsLearned=state.words.filter(x=>x.learned).length;saveState();renderVocabulary($("#wordSearch").value);toast(w.learned?"So‘z o‘rganilgan deb belgilandi.":"So‘z takrorlash ro‘yxatiga qaytdi.");}));
 $$("[data-delete]",grid).forEach(b=>b.addEventListener("click",()=>{state.words=state.words.filter(x=>x.id!==Number(b.dataset.delete));state.wordsLearned=state.words.filter(x=>x.learned).length;saveState();renderVocabulary($("#wordSearch").value);toast("So‘z o‘chirildi.");}));
 $$("[data-speak]",grid).forEach(b=>b.addEventListener("click",()=>speak(state.words.find(x=>x.id===Number(b.dataset.speak))?.english)));
}
$("#wordSearch").addEventListener("input",e=>renderVocabulary(e.target.value));
function openWordModal(prefill=null){
 $("#wordForm").reset();$("#modalTitle").textContent=prefill?"Kun so‘zini lug‘atga qo‘shish":"Yangi so‘z qo‘shish";
 if(prefill){$("#newEnglish").value=prefill.english;$("#newUzbek").value=prefill.uzbek;$("#newExample").value=prefill.example||"";}
 $("#modalBackdrop").classList.remove("hidden");$("#newEnglish").focus();
}
function closeModal(){$("#modalBackdrop").classList.add("hidden")}
$("#addWordButton").addEventListener("click",()=>openWordModal());$("#modalClose").addEventListener("click",closeModal);$("#modalCancel").addEventListener("click",closeModal);$("#modalBackdrop").addEventListener("click",e=>{if(e.target===$("#modalBackdrop"))closeModal()});
$("#wordForm").addEventListener("submit",e=>{e.preventDefault();const english=$("#newEnglish").value.trim(),uzbek=$("#newUzbek").value.trim(),example=$("#newExample").value.trim();if(!english||!uzbek)return;state.words.unshift({id:Date.now(),english,uzbek,example,learned:false});saveState();renderVocabulary($("#wordSearch").value);closeModal();toast("Yangi so‘z lug‘atga qo‘shildi.");});
function speak(text){if(!text){toast("Talaffuz uchun matn topilmadi.");return}if(!("speechSynthesis" in window)){toast("Bu brauzerda ovozli talaffuz qo‘llab-quvvatlanmaydi.");return}const utter=new SpeechSynthesisUtterance(text);utter.lang="en-US";speechSynthesis.cancel();speechSynthesis.speak(utter);}
const dailyWord={english:"Curious",uzbek:"Qiziquvchan",example:"Stay curious. Keep learning."};
$("#saveDailyWord").addEventListener("click",()=>{if(state.words.some(w=>w.english.toLowerCase()==="curious")){toast("“Curious” lug‘atingizda bor.");return}state.words.unshift({id:Date.now(),...{english:"curious",uzbek:"qiziquvchan",example:"Stay curious. Keep learning.",learned:false}});saveState();renderVocabulary();toast("“Curious” lug‘atga qo‘shildi.");});

const levelOrder=["A1","A2","B1","B2","C1"];
function renderRoadmap(){
 const road=$("#roadmap");road.innerHTML="";
 levelOrder.forEach((lv,i)=>{const info=levelInfo[lv];const card=document.createElement("button");card.className="roadmap-card"+((state.selectedLevel||"A1")===lv?" selected":"");card.dataset.level=lv;card.innerHTML=`<div class="roadmap-code">${lv}</div><h3>${info.name}</h3><p>${info.desc}</p><small>STAGE 0${i+1} / 05</small>`;road.appendChild(card);});
 $$("[data-level]",road).forEach(b=>b.addEventListener("click",()=>{state.selectedLevel=b.dataset.level;saveState();renderRoadmap();toast(`${b.dataset.level} — ${levelInfo[b.dataset.level].uz} darajasi tanlandi.`)}));
}
const prompts=[
 {title:"Tell me about yourself.",text:"Ismingiz, yoshingiz, qayerdan ekaningiz va nimalarni yoqtirishingiz haqida 4–5 ta gap ayting."},
 {title:"Describe your daily routine.",text:"Ertalabdan kechgacha odatda nima qilishingizni ingliz tilida tushuntiring."},
 {title:"Talk about your favourite place.",text:"Sizga yoqadigan joyni tasvirlang va nima uchun yoqtirishingizni ayting."},
 {title:"What are your future plans?",text:"Kelajakdagi maqsadlaringiz va ularga qanday erishishingiz haqida gapiring."}
];
let promptIndex=0;
$("#showPrompt").addEventListener("click",()=>{promptIndex=(promptIndex+1)%prompts.length;$("#skillPrompt h2").textContent=prompts[promptIndex].title;$("#skillPrompt p").textContent=prompts[promptIndex].text;$("#promptTip").classList.remove("hidden")});
$$("[data-skill]").forEach(b=>b.addEventListener("click",()=>{const skill=b.dataset.skill;showPage("skills");const content={
 Listening:"Listening mashqi: “Hello, my name is Alex. I live in London and I study English every evening.” Matnni ikki marta o‘qing yoki brauzerda ovozli o‘qitishni sinab ko‘ring. Keyin asosiy ma’lumotlarni aytib bering.",
 Reading:"Reading mashqi: “Emma gets up at seven. She has breakfast and walks to school. After school, she reads a book.” Savollar: Emma soat nechada turadi? U maktabdan keyin nima qiladi?",
 Writing:"Writing mashqi: Ingliz tilida o‘zingiz haqingizda 5 ta gap yozing. “My name is…”, “I live in…”, “I like…” kabi iboralardan foydalaning.",
 Speaking:"Speaking mashqi: O‘zingiz haqingizda 4–5 ta gapni ovoz chiqarib ayting. Telefoningizdagi diktofonga yozib, talaffuzingizni tinglang."
};$("#skillPrompt h2").textContent=skill+" practice";$("#skillPrompt p").textContent=content[skill]||"Mashqni bajaring.";$("#promptTip").textContent=skill==="Speaking"?"Maslahat: sekin gapiring, sodda jumlalardan boshlang va ovozingizni yozib ko‘ring.":"Matnni diqqat bilan o‘qing, yangi so‘zlarni lug‘atga qo‘shing va mashqni bajaring.";$("#promptTip").classList.remove("hidden");$("#skillPrompt").scrollIntoView({behavior:"smooth",block:"center"});}));
$$(".skill-open").forEach(b=>b.addEventListener("click",()=>{const s=b.dataset.skill;const card=$(`[data-skill="${s}"]`);if(card)card.click();}));

const typingTexts={
 A1:["Learning English opens doors to new ideas, people, and opportunities.","My name is Alex. I live in a small town and study English every day.","Practice a little every day. Small steps can make a big difference."],
 A2:["I usually wake up early and have breakfast before I go to school.","Last weekend, I visited my grandparents and helped them in the garden.","Learning a new language takes time, patience, and regular practice."],
 B1:["People learn more effectively when they set clear goals and practise regularly.","In my opinion, technology can make education more accessible to everyone.","Reading every day helps you improve your vocabulary and understand different ideas."],
 B2:["Although learning a language can be challenging, consistent practice leads to progress.","One of the most useful skills is the ability to explain complex ideas clearly.","Digital tools provide opportunities for students to learn independently and collaboratively."],
 C1:["Developing fluency requires not only memorisation, but also meaningful communication.","A nuanced perspective allows us to evaluate information before reaching a conclusion.","Sustained curiosity encourages people to question assumptions and explore unfamiliar ideas."]
};
let typing={text:"",start:null,timer:null,remaining:30,ended:false};
function setTypingText(){
 const lv=$("#typingLevel").value,arr=typingTexts[lv];typing.text=arr[Math.floor(Math.random()*arr.length)];typing.start=null;typing.remaining=30;typing.ended=false;clearInterval(typing.timer);$("#typingTime").textContent="30s";$("#typingWpm").textContent="0";$("#typingAccuracy").textContent="100%";$("#typingInput").value="";$("#typingInput").disabled=false;$("#typingFeedback").textContent="Boshlash uchun matnni yozing.";$ ("#typingResult").classList.add("hidden");renderTypingText();
}
function renderTypingText(){
 const input=$("#typingInput").value;let html="";
 for(let i=0;i<typing.text.length;i++){let cls="";if(i<input.length)cls=input[i]===typing.text[i]?"typed-correct":"typed-wrong";else if(i===input.length&&!typing.ended)cls="typed-current";html+=`<span class="${cls}">${escapeHTML(typing.text[i])}</span>`}
 $("#typingText").innerHTML=html;
}
function finishTyping(){
 if(typing.ended)return;typing.ended=true;clearInterval(typing.timer);$("#typingInput").disabled=true;
 const input=$("#typingInput").value;let correct=0;for(let i=0;i<Math.min(input.length,typing.text.length);i++)if(input[i]===typing.text[i])correct++;
 const accuracy=input.length?Math.round(correct/input.length*100):0;const elapsed=Math.max(1,30-typing.remaining);const wpm=Math.round((correct/5)/(elapsed/60));
 $("#typingWpm").textContent=wpm;$("#typingAccuracy").textContent=accuracy+"%";$("#typingFeedback").textContent="Mashq yakunlandi.";
 $("#typingResult").classList.remove("hidden");$("#typingResult").innerHTML=`<b>Natija: ${wpm} WPM · ${accuracy}% aniqlik</b><p style="color:#aaa;line-height:1.7;margin:7px 0 0">To‘g‘ri yozilgan belgilar: ${correct}. Yaxshiroq natija uchun yana mashq qiling.</p>`;
 state.minutes+=Math.max(1,Math.round(elapsed/2));saveState();renderTypingText();
}
$("#typingInput").addEventListener("input",()=>{
 if(typing.ended)return;const input=$("#typingInput").value;
 if(typing.start===null){typing.start=Date.now();typing.timer=setInterval(()=>{typing.remaining=Math.max(0,30-Math.floor((Date.now()-typing.start)/1000));$("#typingTime").textContent=typing.remaining+"s";const correct=input=>{let n=0;for(let i=0;i<Math.min(input.length,typing.text.length);i++)if(input[i]===typing.text[i])n++;return n};const current=$("#typingInput").value;const n=correct(current);$("#typingWpm").textContent=Math.round((n/5)/Math.max(.02,(Date.now()-typing.start)/60000));if(typing.remaining<=0||current.length>=typing.text.length)finishTyping();},250)}
 let n=0;for(let i=0;i<Math.min(input.length,typing.text.length);i++)if(input[i]===typing.text[i])n++;$("#typingAccuracy").textContent=(input.length?Math.round(n/input.length*100):100)+"%";renderTypingText();
 if(input.length>=typing.text.length)finishTyping();
});
$("#typingLevel").addEventListener("change",setTypingText);$("#newTypingText").addEventListener("click",setTypingText);$("#typingRestart").addEventListener("click",setTypingText);

function init(){
 renderLessons();renderVocabulary();renderRoadmap();updateStats();setTypingText();
}
init();
