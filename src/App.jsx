import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════
//  ✦ NOOR ACADEMY v2 — Dark Luxury Islamic Educational Platform ✦
//  Full app: Auth → Dashboard → Lessons → Quiz → Du'as → Badges
//  NL 🇳🇱 | AR 🇸🇦 | EN 🇬🇧  |  Free & Plus plans  |  Mobile + Desktop
// ═══════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════
//  🔊 SOUND ENGINE
// ══════════════════════════════════════════════

// Text-to-speech: speaks Arabic text aloud using browser Web Speech API
function speakArabic(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "ar-SA";
  utt.rate = 0.82;
  utt.pitch = 1.05;
  // prefer an Arabic voice if available
  const voices = window.speechSynthesis.getVoices();
  const arabicVoice = voices.find(v => v.lang.startsWith("ar"));
  if (arabicVoice) utt.voice = arabicVoice;
  window.speechSynthesis.speak(utt);
}

function speakText(text, lang = "nl") {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang === "ar" ? "ar-SA" : lang === "en" ? "en-US" : "nl-NL";
  utt.rate = 0.88;
  window.speechSynthesis.speak(utt);
}

// AudioContext-based sound effects (no external files needed)
let _ctx = null;
function getCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  return _ctx;
}

function playTone(freq, duration = 0.18, type = "sine", vol = 0.25, delay = 0) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.02);
  } catch (_) {}
}

const SFX = {
  correct()    { playTone(523, 0.12); playTone(659, 0.12, "sine", 0.22, 0.13); playTone(784, 0.18, "sine", 0.2, 0.26); },
  wrong()      { playTone(200, 0.25, "sawtooth", 0.2); playTone(180, 0.25, "sawtooth", 0.15, 0.22); },
  star()       { [523,659,784,1047].forEach((f,i) => playTone(f, 0.14, "sine", 0.22, i*0.1)); },
  click()      { playTone(880, 0.07, "sine", 0.12); },
  celebrate()  { [523,659,784,1047,1319].forEach((f,i) => playTone(f, 0.16, "triangle", 0.18, i*0.09)); },
  levelUp()    { [392,523,659,784,1047].forEach((f,i) => playTone(f, 0.2, "sine", 0.2, i*0.12)); },
  tap()        { playTone(660, 0.08, "sine", 0.1); },
  unlock()     { playTone(440, 0.1); playTone(554, 0.1, "sine", 0.18, 0.1); playTone(659, 0.2, "sine", 0.2, 0.22); },
};

// Global mute state
let _muted = false;
const muteListeners = [];
function toggleMute() { _muted = !_muted; muteListeners.forEach(fn => fn(_muted)); if (_muted) window.speechSynthesis?.cancel(); }
function isMuted() { return _muted; }

// Safe wrappers
function sfx(name)           { if (!isMuted()) SFX[name]?.(); }
function speak(text, lang)   { if (!isMuted()) { if (lang === "ar") speakArabic(text); else speakText(text, lang); } }

// Hook: subscribe to mute state
function useMuted() {
  const [muted, setMuted] = useState(_muted);
  useEffect(() => { muteListeners.push(setMuted); return () => { const i = muteListeners.indexOf(setMuted); if (i>-1) muteListeners.splice(i,1); }; }, []);
  return muted;
}

// ── Speak button component ─────────────────────────────────────────
function SpeakBtn({ text, lang = "ar", size = 32, style: s = {} }) {
  const [speaking, setSpeaking] = useState(false);
  const handle = () => {
    if (isMuted()) return;
    sfx("tap");
    setSpeaking(true);
    speak(text, lang);
    setTimeout(() => setSpeaking(false), 2200);
  };
  return (
    <button onClick={handle} title="Uitspreken / Listen" style={{
      background: speaking ? `linear-gradient(135deg,${D.gold},${D.goldLight})` : `${D.gold}18`,
      border: `1.5px solid ${D.gold}55`, borderRadius: "50%",
      width: size, height: size, cursor: "pointer", display: "flex",
      alignItems: "center", justifyContent: "center", fontSize: size * 0.42,
      transition: "all 0.2s", flexShrink: 0, ...s,
    }}>
      {speaking ? "🔊" : "🔈"}
    </button>
  );
}

// ── Mute toggle button ─────────────────────────────────────────────
function MuteBtn() {
  const muted = useMuted();
  return (
    <button onClick={() => { sfx("click"); toggleMute(); }} title={muted ? "Geluid aan" : "Geluid uit"}
      style={{ background: muted ? `${D.error}18` : `${D.emerald}18`, border: `1.5px solid ${muted ? D.error : D.emerald}55`, borderRadius: "50%", width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, transition: "all 0.2s" }}>
      {muted ? "🔇" : "🔉"}
    </button>
  );
}

// ── DESIGN TOKENS ─────────────────────────────────────────────────
const D = {
  midnight:  "#FFFAF2",   // page bg — warm white
  deep:      "#FDF5E4",   // panel bg — soft parchment
  navy:      "#F5ECD6",   // section bg — light cream
  navyCard:  "#FFFFFF",   // card surface — pure white
  border:    "#DFD0AC",   // borders — warm tan
  gold:      "#B5820F",   // gold — deep for contrast
  goldLight: "#D4A017",   // gold mid
  goldPale:  "#F0C040",   // gold pale accent
  emerald:   "#0A6B48",   // emerald dark
  emeraldLt: "#0E9062",   // emerald light
  teal:      "#0A7B6B",   // teal
  crimson:   "#8B1A2F",
  cream:     "#2E1F00",   // primary text — dark warm brown
  parchment: "#6B5020",   // secondary text — medium brown
  white:     "#FFFFFF",
  muted:     "#9E8A6A",   // muted text
  mutedLt:   "#7A6548",   // muted darker
  error:     "#C0392B",
  success:   "#1A9E5A",
};

// ── TRANSLATIONS ───────────────────────────────────────────────────
const LANGS = {
  nl: {
    dir:"ltr", flag:"🇳🇱", label:"NL",
    // Auth
    welcome_back:"Welkom terug",
    create_account:"Account aanmaken",
    sign_in_sub:"Log in op jouw Noor Academy",
    sign_up_sub:"Begin de islamitische leerreis",
    email:"E-mailadres", password:"Wachtwoord",
    confirm_password:"Wachtwoord bevestigen",
    child_name:"Naam van het kind", child_age:"Leeftijd",
    forgot:"Wachtwoord vergeten?",
    btn_login:"Inloggen", btn_signup:"Account aanmaken",
    or:"of", google:"Doorgaan met Google",
    go_signup:"Nog geen account? Registreer",
    go_login:"Al een account? Inloggen",
    step_info:"Gegevens", step_plan:"Plan",
    choose_plan:"Kies jouw plan",
    free_name:"Gratis", plus_name:"Noor Plus",
    free_price:"€0 / maand", plus_price:"€4,99 / maand",
    trial:"14 dagen gratis proberen — geen betaalgegevens",
    popular:"Populairste keuze",
    free_f:["2 vakken","3 surahs","Dagelijkse smeekbeden","1 kind"],
    plus_f:["Alle 6 vakken","Alle surahs + tajweed","Arabische cursus (5 niveaus)","Kindermodus (4-7 jaar)","Onbeperkte quizzen","5 kinderen","Ouderrapport","Alle badges"],
    next:"Volgende →", back:"← Terug",
    err_email:"Ongeldig e-mailadres",
    err_pw:"Minimaal 8 tekens",
    err_match:"Wachtwoorden komen niet overeen",
    err_name:"Vul een naam in",
    err_creds:"Onjuist e-mail of wachtwoord",
    demo:"Demo: test@noor.com / test1234",
    reset_title:"Wachtwoord herstellen",
    reset_sub:"Voer je e-mail in voor een herstelmail",
    send_reset:"Herstelmail versturen",
    reset_ok:"Herstelmail verstuurd! Check je inbox.",
    // App
    salaam:"السلام عليكم",
    tagline:"Islamitisch Leerplatform",
    stars:"sterren", badges_ct:"badges",
    parents_btn:"Ouders",
    quick_quiz:"Snelle Quiz",
    all_duas:"Smeekbeden",
    my_subjects:"Mijn Vakken",
    hadith_day:"Hadith van de Dag",
    hadith_src:"— Ibn Majah",
    dua_day:"Smeekbede van de Dag",
    dua_tap:"Tik om te onthullen ✦",
    nav:["Thuis","Quiz","Arabisch","Kinderen","Smeekbeden","Badges","Ouders"],
    progress:"Voortgang",
    start:"Starten",
    earned:"Verdiend ✓",
    achievements:"Mijn Prestaties",
    parent_title:"Ouder Dashboard",
    overall:"Totale Voortgang",
    done_of:"activiteiten voltooid",
    week_report:"Wekelijks Rapport",
    week_l:"✅ 14 lessen voltooid",
    week_t:"⏱ 18 min/dag gemiddeld",
    week_b:"🌟 3 nieuwe badges",
    q_of:"Vraag", of:"van",
    knew:"Wist je dat?",
    score_msg:["Masha'Allah! Uitstekend!","Goed gedaan!","Blijf oefenen!"],
    scored:"Je scoorde", out_of:"van de",
    try_again:"Opnieuw proberen",
    back_home:"Terug naar Dashboard",
    logout:"Uitloggen",
    ages:["4 jaar","5 jaar","6 jaar","7 jaar","8 jaar","9 jaar","10 jaar","11 jaar","12 jaar"],
  },
  ar: {
    dir:"rtl", flag:"🇸🇦", label:"عر",
    welcome_back:"مرحباً بعودتك",
    create_account:"إنشاء حساب",
    sign_in_sub:"سجّل الدخول إلى نور أكاديمي",
    sign_up_sub:"ابدأ رحلة التعلم الإسلامي",
    email:"البريد الإلكتروني", password:"كلمة المرور",
    confirm_password:"تأكيد كلمة المرور",
    child_name:"اسم الطفل", child_age:"العمر",
    forgot:"نسيت كلمة المرور؟",
    btn_login:"تسجيل الدخول", btn_signup:"إنشاء الحساب",
    or:"أو", google:"المتابعة مع Google",
    go_signup:"ليس لديك حساب؟ سجّل",
    go_login:"لديك حساب؟ سجّل الدخول",
    step_info:"المعلومات", step_plan:"الخطة",
    choose_plan:"اختر خطتك",
    free_name:"مجاني", plus_name:"نور بلس",
    free_price:"€٠ / شهر", plus_price:"€٤٫٩٩ / شهر",
    trial:"١٤ يوماً مجاناً — بدون بطاقة ائتمان",
    popular:"الأكثر اختياراً",
    free_f:["مادتان","٣ سور","الأدعية اليومية","طفل واحد"],
    plus_f:["جميع المواد الـ٦","جميع السور + التجويد","دورة العربية (٥ مستويات)","وضع الأطفال (٤-٧ سنوات)","اختبارات غير محدودة","٥ أطفال","تقرير الوالدين","جميع الشارات"],
    next:"التالي ←", back:"→ رجوع",
    err_email:"بريد إلكتروني غير صحيح",
    err_pw:"٨ أحرف على الأقل",
    err_match:"كلمتا المرور غير متطابقتين",
    err_name:"أدخل اسم الطفل",
    err_creds:"بريد أو كلمة مرور غير صحيحة",
    demo:"تجريبي: test@noor.com / test1234",
    reset_title:"استرداد كلمة المرور",
    reset_sub:"أدخل بريدك لإرسال رابط الاسترداد",
    send_reset:"إرسال رابط الاسترداد",
    reset_ok:"تم الإرسال! تحقق من بريدك.",
    salaam:"السلام عليكم",
    tagline:"منصة تعليمية إسلامية",
    stars:"نجوم", badges_ct:"شارات",
    parents_btn:"الآباء",
    quick_quiz:"اختبار سريع",
    all_duas:"الأدعية",
    my_subjects:"موادي",
    hadith_day:"حديث اليوم",
    hadith_src:"— ابن ماجه",
    dua_day:"دعاء اليوم",
    dua_tap:"اضغط للكشف ✦",
    nav:["الرئيسية","اختبار","عربي","أطفال","أدعية","شارات","آباء"],
    progress:"التقدم",
    start:"ابدأ",
    earned:"تم الحصول عليها ✓",
    achievements:"إنجازاتي",
    parent_title:"لوحة الآباء",
    overall:"التقدم الكلي",
    done_of:"نشاطاً مكتملاً",
    week_report:"التقرير الأسبوعي",
    week_l:"✅ ١٤ درساً مكتملاً",
    week_t:"⏱ ١٨ دقيقة يومياً",
    week_b:"🌟 ٣ شارات جديدة",
    q_of:"سؤال", of:"من",
    knew:"هل تعلم؟",
    score_msg:["ما شاء الله! ممتاز!","أحسنت!","استمر في التدرب!"],
    scored:"حصلت على", out_of:"من",
    try_again:"حاول مجدداً",
    back_home:"العودة للوحة",
    logout:"تسجيل الخروج",
    ages:["٤ سنوات","٥ سنوات","٦ سنوات","٧ سنوات","٨ سنوات","٩ سنوات","١٠ سنوات","١١ سنوات","١٢ سنة"],
  },
  en: {
    dir:"ltr", flag:"🇬🇧", label:"EN",
    welcome_back:"Welcome back",
    create_account:"Create account",
    sign_in_sub:"Sign in to Noor Academy",
    sign_up_sub:"Begin your Islamic learning journey",
    email:"Email address", password:"Password",
    confirm_password:"Confirm password",
    child_name:"Child's name", child_age:"Age",
    forgot:"Forgot password?",
    btn_login:"Sign in", btn_signup:"Create account",
    or:"or", google:"Continue with Google",
    go_signup:"No account? Sign up",
    go_login:"Have an account? Sign in",
    step_info:"Details", step_plan:"Plan",
    choose_plan:"Choose your plan",
    free_name:"Free", plus_name:"Noor Plus",
    free_price:"€0 / month", plus_price:"€4.99 / month",
    trial:"14-day free trial — no card required",
    popular:"Most popular",
    free_f:["2 subjects","3 surahs","Daily du'as","1 child"],
    plus_f:["All 6 subjects","All surahs + tajweed","Arabic course (5 levels)","Kids Mode (ages 4–7)","Unlimited quizzes","5 children","Parent report","All badges"],
    next:"Next →", back:"← Back",
    err_email:"Invalid email address",
    err_pw:"At least 8 characters",
    err_match:"Passwords do not match",
    err_name:"Enter the child's name",
    err_creds:"Incorrect email or password",
    demo:"Demo: test@noor.com / test1234",
    reset_title:"Reset password",
    reset_sub:"Enter your email to receive a reset link",
    send_reset:"Send reset link",
    reset_ok:"Reset email sent! Check your inbox.",
    salaam:"السلام عليكم",
    tagline:"Islamic Learning Platform",
    stars:"stars", badges_ct:"badges",
    parents_btn:"Parents",
    quick_quiz:"Quick Quiz",
    all_duas:"Du'as",
    my_subjects:"My Subjects",
    hadith_day:"Hadith of the Day",
    hadith_src:"— Ibn Majah",
    dua_day:"Du'a of the Day",
    dua_tap:"Tap to reveal ✦",
    nav:["Home","Quiz","Arabic","Kids","Du'as","Badges","Parents"],
    progress:"Progress",
    start:"Start",
    earned:"EARNED ✓",
    achievements:"My Achievements",
    parent_title:"Parent Dashboard",
    overall:"Overall Progress",
    done_of:"activities completed",
    week_report:"Weekly Report",
    week_l:"✅ 14 lessons completed",
    week_t:"⏱ 18 min/day average",
    week_b:"🌟 3 new badges earned",
    q_of:"Question", of:"of",
    knew:"Did you know?",
    score_msg:["Masha'Allah! Excellent!","Well done!","Keep practicing!"],
    scored:"You scored", out_of:"out of",
    try_again:"Try again",
    back_home:"Back to Dashboard",
    logout:"Sign out",
    ages:["4 years","5 years","6 years","7 years","8 years","9 years","10 years","11 years","12 years"],
  },
};

// ── CONTENT DATA ───────────────────────────────────────────────────
const SUBJECTS = [
  { id:"quran",  icon:"📖", color:D.gold,     glow:"rgba(201,149,42,0.35)",
    nl:{name:"Koran",       desc:"Lees, luister & memoriseer"},
    ar:{name:"القرآن الكريم",desc:"اقرأ واستمع واحفظ"},
    en:{name:"Qur'an",      desc:"Read, listen & memorize"},
    stars:2, total:10,
    lessons:{
      nl:[{id:1,title:"Soera Al-Fatiha",type:"Memoriseren",done:true},{id:2,title:"Soera Al-Ikhlas",type:"Memoriseren",done:true},{id:3,title:"Soera Al-Falaq",type:"Luisteren",done:false},{id:4,title:"Soera An-Nas",type:"Lezen",done:false}],
      ar:[{id:1,title:"سورة الفاتحة",type:"حفظ",done:true},{id:2,title:"سورة الإخلاص",type:"حفظ",done:true},{id:3,title:"سورة الفلق",type:"استماع",done:false},{id:4,title:"سورة الناس",type:"قراءة",done:false}],
      en:[{id:1,title:"Surah Al-Fatiha",type:"Memorize",done:true},{id:2,title:"Surah Al-Ikhlas",type:"Memorize",done:true},{id:3,title:"Surah Al-Falaq",type:"Listen",done:false},{id:4,title:"Surah An-Nas",type:"Read",done:false}],
    }},
  { id:"arabic", icon:"✍️", color:D.emeraldLt, glow:"rgba(20,168,118,0.35)",
    nl:{name:"Arabisch",    desc:"Letters, woorden & zinnen"},
    ar:{name:"اللغة العربية",desc:"الحروف والكلمات"},
    en:{name:"Arabic",      desc:"Letters, words & sentences"},
    stars:5, total:10,
    lessons:{
      nl:[{id:1,title:"Alfabet: Alif tot Tha",type:"Schrijven",done:true},{id:2,title:"Korte Klinkers",type:"Quiz",done:true},{id:3,title:"Gewone Woorden",type:"Koppelen",done:false}],
      ar:[{id:1,title:"الأبجدية",type:"كتابة",done:true},{id:2,title:"الحركات",type:"اختبار",done:true},{id:3,title:"الكلمات الشائعة",type:"مطابقة",done:false}],
      en:[{id:1,title:"Alphabet: Alif to Tha",type:"Write",done:true},{id:2,title:"Short Vowels",type:"Quiz",done:true},{id:3,title:"Common Words",type:"Match",done:false}],
    }},
  { id:"seerah", icon:"🌙", color:"#8B6FD4",   glow:"rgba(139,111,212,0.35)",
    nl:{name:"Siera",       desc:"Leven van de Profeet ﷺ"},
    ar:{name:"السيرة النبوية",desc:"حياة النبي ﷺ"},
    en:{name:"Seerah",      desc:"Life of the Prophet ﷺ"},
    stars:3, total:8,
    lessons:{
      nl:[{id:1,title:"Geboorte van de Profeet ﷺ",type:"Verhaal",done:true},{id:2,title:"Khadijah (RA)",type:"Verhaal",done:false},{id:3,title:"De Nacht van de Macht",type:"Quiz",done:false}],
      ar:[{id:1,title:"مولد النبي ﷺ",type:"قصة",done:true},{id:2,title:"خديجة رضي الله عنها",type:"قصة",done:false},{id:3,title:"ليلة القدر",type:"اختبار",done:false}],
      en:[{id:1,title:"Birth of the Prophet ﷺ",type:"Story",done:true},{id:2,title:"Khadijah (RA)",type:"Story",done:false},{id:3,title:"The Night of Power",type:"Quiz",done:false}],
    }},
  { id:"akhlaq", icon:"💛", color:"#E8A020",   glow:"rgba(232,160,32,0.35)",
    nl:{name:"Akhlaq",      desc:"Islamitische manieren"},
    ar:{name:"الأخلاق",      desc:"الآداب الإسلامية"},
    en:{name:"Akhlaq",      desc:"Islamic character"},
    stars:7, total:10,
    lessons:{
      nl:[{id:1,title:"Eerlijkheid in de Islam",type:"Verhaal",done:true},{id:2,title:"Respect voor Ouders",type:"Quiz",done:true},{id:3,title:"Vriendelijkheid voor Dieren",type:"Activiteit",done:false}],
      ar:[{id:1,title:"الصدق في الإسلام",type:"قصة",done:true},{id:2,title:"احترام الوالدين",type:"اختبار",done:true},{id:3,title:"الرفق بالحيوانات",type:"نشاط",done:false}],
      en:[{id:1,title:"Honesty in Islam",type:"Story",done:true},{id:2,title:"Respecting Parents",type:"Quiz",done:true},{id:3,title:"Kindness to Animals",type:"Activity",done:false}],
    }},
  { id:"fiqh",   icon:"🕌", color:D.teal,      glow:"rgba(11,110,122,0.35)",
    nl:{name:"Fiqh",        desc:"Gebed & dagelijkse handelingen"},
    ar:{name:"الفقه",        desc:"الصلاة والوضوء"},
    en:{name:"Fiqh",        desc:"Prayer & daily worship"},
    stars:4, total:10,
    lessons:{
      nl:[{id:1,title:"Hoe Wudu te maken",type:"Stappen",done:true},{id:2,title:"De Vijf Gebeden",type:"Quiz",done:true},{id:3,title:"Hoe Salah te bidden",type:"Stappen",done:false}],
      ar:[{id:1,title:"كيفية الوضوء",type:"خطوات",done:true},{id:2,title:"الصلوات الخمس",type:"اختبار",done:true},{id:3,title:"كيفية الصلاة",type:"خطوات",done:false}],
      en:[{id:1,title:"How to Make Wudu",type:"Steps",done:true},{id:2,title:"The Five Prayers",type:"Quiz",done:true},{id:3,title:"How to Pray Salah",type:"Steps",done:false}],
    }},
  { id:"math",   icon:"🔢", color:"#D4845A",   glow:"rgba(212,132,90,0.35)",
    nl:{name:"Rekenen",     desc:"Getallen met islamitische context"},
    ar:{name:"الرياضيات",   desc:"الأرقام في السياق الإسلامي"},
    en:{name:"Math",        desc:"Numbers with Islamic context"},
    stars:8, total:10,
    lessons:{
      nl:[{id:1,title:"Tellen met Tasbih",type:"Spel",done:true},{id:2,title:"Zakat Verdelen",type:"Opgave",done:true},{id:3,title:"Gebedstijden Rekenen",type:"Opgave",done:false}],
      ar:[{id:1,title:"العد بالتسبيح",type:"لعبة",done:true},{id:2,title:"توزيع الزكاة",type:"مسألة",done:true},{id:3,title:"حساب أوقات الصلاة",type:"مسألة",done:false}],
      en:[{id:1,title:"Counting with Tasbih",type:"Game",done:true},{id:2,title:"Sharing Zakat",type:"Problem",done:true},{id:3,title:"Prayer Times Math",type:"Problem",done:false}],
    }},
];

const DUAS = [
  { arabic:"بِسْمِ اللَّهِ", translit:"Bismillah",
    nl:"In de naam van Allah", ar:"بسم الله", en:"In the name of Allah",
    occ_nl:"Voor het eten of enige handeling", occ_ar:"قبل الأكل أو أي عمل", occ_en:"Before eating or any action" },
  { arabic:"الحَمْدُ لِلَّهِ", translit:"Alhamdulillah",
    nl:"Alle lof zij Allah", ar:"الحمد لله", en:"All praise is for Allah",
    occ_nl:"Na het eten of bij zegeningen", occ_ar:"بعد الأكل أو عند النعم", occ_en:"After eating or receiving blessings" },
  { arabic:"سُبْحَانَ اللَّهِ", translit:"SubhanAllah",
    nl:"Glorie zij Allah", ar:"سبحان الله", en:"Glory be to Allah",
    occ_nl:"Wanneer je iets geweldigs ziet", occ_ar:"عند رؤية شيء مدهش", occ_en:"When seeing something amazing" },
  { arabic:"اللَّهُ أَكْبَرُ", translit:"Allahu Akbar",
    nl:"Allah is de Grootste", ar:"الله أكبر", en:"Allah is the Greatest",
    occ_nl:"Tijdens de Adhan en het Gebed", occ_ar:"خلال الأذان والصلاة", occ_en:"During Adhan and Prayer" },
];

const QUIZ = {
  nl:[
    {q:"Hoe vaak bidden moslims per dag?",opts:["3","4","5","7"],a:2,exp:"Moslims bidden 5 keer per dag: Fajr, Dhuhr, Asr, Maghrib en Isha."},
    {q:"Wat is de eerste Soera in de Koran?",opts:["Al-Baqarah","Al-Fatiha","Al-Ikhlas","Al-Nas"],a:1,exp:"Al-Fatiha is het eerste hoofdstuk van de Heilige Koran."},
    {q:"Wat zeggen we voor het eten?",opts:["Alhamdulillah","Bismillah","SubhanAllah","Inshallah"],a:1,exp:"We zeggen 'Bismillah' voor het eten."},
    {q:"Welke zuil van de Islam is vasten?",opts:["Salah","Zakat","Sawm","Hajj"],a:2,exp:"Sawm (vasten) in de Ramadan is de 4e zuil van de Islam."},
    {q:"Hoeveel rak'ah heeft Fajr?",opts:["2","3","4","6"],a:0,exp:"Fajr heeft 2 verplichte rak'ah."},
  ],
  ar:[
    {q:"كم مرة يصلي المسلمون في اليوم؟",opts:["٣","٤","٥","٧"],a:2,exp:"يصلي المسلمون ٥ مرات: الفجر والظهر والعصر والمغرب والعشاء."},
    {q:"ما هي أول سورة في القرآن؟",opts:["البقرة","الفاتحة","الإخلاص","الناس"],a:1,exp:"الفاتحة هي أول سورة في القرآن الكريم."},
    {q:"ماذا نقول قبل الأكل؟",opts:["الحمد لله","بسم الله","سبحان الله","إن شاء الله"],a:1,exp:"نقول بسم الله قبل الأكل."},
    {q:"أي ركن يتعلق بالصيام؟",opts:["الصلاة","الزكاة","الصوم","الحج"],a:2,exp:"الصوم في رمضان هو الركن الرابع."},
    {q:"كم ركعة في الفجر؟",opts:["٢","٣","٤","٦"],a:0,exp:"صلاة الفجر ركعتان فرضاً."},
  ],
  en:[
    {q:"How many times do Muslims pray each day?",opts:["3","4","5","7"],a:2,exp:"Muslims pray 5 times a day: Fajr, Dhuhr, Asr, Maghrib, Isha."},
    {q:"What is the first Surah in the Qur'an?",opts:["Al-Baqarah","Al-Fatiha","Al-Ikhlas","Al-Nas"],a:1,exp:"Al-Fatiha is the first chapter of the Holy Qur'an."},
    {q:"What do we say before eating?",opts:["Alhamdulillah","Bismillah","SubhanAllah","Inshallah"],a:1,exp:"We say 'Bismillah' before eating."},
    {q:"Which pillar of Islam is fasting?",opts:["Salah","Zakat","Sawm","Hajj"],a:2,exp:"Sawm (fasting) in Ramadan is the 4th pillar."},
    {q:"How many rakah in Fajr?",opts:["2","3","4","6"],a:0,exp:"Fajr has 2 fardh rakah."},
  ],
};

const BADGES_DATA = [
  {id:"first",  icon:"⭐", nl:"Eerste Stap",     ar:"الخطوة الأولى",    en:"First Step",     nl_d:"Eerste les voltooid",        ar_d:"أكملت أول درس",        en_d:"Completed first lesson",      earned:true},
  {id:"quran",  icon:"📖", nl:"Koran-hoeder",    ar:"حافظ القرآن",      en:"Qur'an Keeper",  nl_d:"Koran-lessen gestart",       ar_d:"بدأت دروس القرآن",      en_d:"Started Quran lessons",       earned:true},
  {id:"akhlaq", icon:"💛", nl:"Gouden Akhlaq",   ar:"الأخلاق الذهبية",  en:"Golden Akhlaq",  nl_d:"Akhlaq voltooid",            ar_d:"أنهيت الأخلاق",         en_d:"Finished Akhlaq chapter",    earned:true},
  {id:"math",   icon:"🔢", nl:"Rekenmeester",    ar:"عبقري الرياضيات",  en:"Math Wizard",    nl_d:"10 rekenlessen",             ar_d:"١٠ دروس رياضيات",       en_d:"10 math lessons done",       earned:false},
  {id:"hafiz",  icon:"🌟", nl:"Jonge Hafiz",     ar:"الحافظ الصغير",    en:"Young Hafiz",    nl_d:"5 soera's gememoriseerd",   ar_d:"حفظت ٥ سور",            en_d:"Memorised 5 surahs",         earned:false},
  {id:"prayer", icon:"🕌", nl:"Gebedsexpert",    ar:"خبير الصلاة",      en:"Prayer Expert",  nl_d:"Alle Salah-stappen",         ar_d:"أتقنت الصلاة",          en_d:"Mastered all Salah steps",   earned:false},
];

// ── SVG COMPONENTS ─────────────────────────────────────────────────
const GeomPattern = ({ opacity=1 }) => (
  <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",opacity}} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="gp" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
        <polygon points="50,4 96,27 96,73 50,96 4,73 4,27" fill="none" stroke={D.gold} strokeWidth="0.6"/>
        <polygon points="50,16 82,33 82,67 50,84 18,67 18,33" fill="none" stroke={D.gold} strokeWidth="0.4"/>
        <circle cx="50" cy="50" r="8" fill="none" stroke={D.gold} strokeWidth="0.5"/>
        <circle cx="50" cy="50" r="2" fill={D.gold} opacity="0.4"/>
        <line x1="50" y1="4" x2="50" y2="96" stroke={D.gold} strokeWidth="0.25"/>
        <line x1="4" y1="50" x2="96" y2="50" stroke={D.gold} strokeWidth="0.25"/>
        <line x1="18" y1="18" x2="82" y2="82" stroke={D.gold} strokeWidth="0.2"/>
        <line x1="82" y1="18" x2="18" y2="82" stroke={D.gold} strokeWidth="0.2"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#gp)"/>
  </svg>
);

const Crescent = ({ size=40, color=D.goldLight }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <path d="M20 5C11.72 5 5 11.72 5 20C5 28.28 11.72 35 20 35C25.83 35 30.94 31.84 33.65 27.17C31.88 27.93 29.94 28.33 27.93 28.33C20.3 28.33 14.1 22.13 14.1 14.5C14.1 11.36 15.28 8.5 17.2 6.35C18 5.5 18.98 5 20 5Z" fill={color}/>
    <polygon points="30,5 31.8,10.5 37.5,10.5 33.1,13.8 34.9,19.5 30,16.2 25.1,19.5 26.9,13.8 22.5,10.5 28.2,10.5" fill={color}/>
  </svg>
);

// ── UTILITY ────────────────────────────────────────────────────────
const totalStars = SUBJECTS.reduce((a,s)=>a+s.stars,0);
const earnedBadges = BADGES_DATA.filter(b=>b.earned).length;

// ═══════════════════════════════════════════════════════════════════
//  GLOBAL STYLES
// ═══════════════════════════════════════════════════════════════════
const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Tajawal:wght@400;500;700;800&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    body { background:${D.midnight}; }
    ::-webkit-scrollbar { width:4px; height:4px; }
    ::-webkit-scrollbar-track { background:#FDF5E4; }
    ::-webkit-scrollbar-thumb { background:#DFD0AC; border-radius:2px; }
    input,select,button,textarea { font-family:'Tajawal',sans-serif; }

    @keyframes fadeUp    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
    @keyframes floatY    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    @keyframes spin      { to{transform:rotate(360deg)} }
    @keyframes shimmer   { 0%{background-position:200% center} 100%{background-position:-200% center} }
    @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.6} }
    @keyframes scaleIn   { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
    @keyframes shake     { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }

    .gold-text {
      background: linear-gradient(90deg, #8B5E0A, #C9952A, #F0C040, #C9952A, #8B5E0A);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 4s linear infinite;
    }
    .card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
    .card-hover:hover { transform: translateY(-3px); }
    .btn-hover { transition: all 0.2s ease; }
    .btn-hover:hover { filter: brightness(1.12); transform: translateY(-1px); }
    .btn-hover:active { transform: translateY(0); }

    /* Desktop layout */
    @media (min-width: 768px) {
      .auth-hero { display:flex !important; }
      .auth-mobile-logo { display:none !important; }
      .app-sidebar { display:flex !important; }
      .app-bottomnav { display:none !important; }
      .app-content { margin-left: 220px !important; }
    }
    @media (max-width: 767px) {
      .auth-hero { display:none !important; }
      .auth-mobile-logo { display:flex !important; }
      .app-sidebar { display:none !important; }
      .app-bottomnav { display:flex !important; }
      .app-content { margin-left: 0 !important; }
    }
  `}</style>
);

// ═══════════════════════════════════════════════════════════════════
//  AUTH SCREENS
// ═══════════════════════════════════════════════════════════════════
const Input = ({ label, type="text", value, onChange, error, placeholder, dir, hint, onHintClick }) => {
  const [show, setShow] = useState(false);
  const isPw = type === "password";
  return (
    <div style={{marginBottom:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
        <label style={{fontSize:12,fontWeight:700,color:D.mutedLt,letterSpacing:0.5,textTransform:"uppercase"}}>{label}</label>
        {hint && <button type="button" onClick={onHintClick} style={{background:"none",border:"none",color:D.gold,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{hint}</button>}
      </div>
      <div style={{position:"relative"}}>
        <input type={isPw&&show?"text":type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} dir={dir}
          style={{width:"100%",padding:isPw?"14px 46px 14px 16px":"14px 16px",borderRadius:10,border:`1.5px solid ${error?D.error:D.border}`,background:D.navyCard,color:D.cream,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit",transition:"border-color 0.2s",}}
          onFocus={e=>e.target.style.borderColor=error?D.error:D.gold}
          onBlur={e=>e.target.style.borderColor=error?D.error:D.border}/>
        {isPw && <button type="button" onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:D.muted,fontSize:15,padding:0}}>{show?"🙈":"👁"}</button>}
      </div>
      {error && <p style={{margin:"5px 0 0 4px",fontSize:11,color:D.error}}>{error}</p>}
    </div>
  );
};

const Select = ({ label, value, onChange, options, dir }) => (
  <div style={{marginBottom:18}}>
    <label style={{display:"block",fontSize:12,fontWeight:700,color:D.mutedLt,letterSpacing:0.5,textTransform:"uppercase",marginBottom:7}}>{label}</label>
    <select value={value} onChange={e=>onChange(e.target.value)} dir={dir}
      style={{width:"100%",padding:"14px 16px",borderRadius:10,border:`1.5px solid ${D.border}`,background:D.navyCard,color:D.cream,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit",cursor:"pointer"}}>
      {options.map((o,i)=><option key={i} value={i+4}>{o}</option>)}
    </select>
  </div>
);

const PrimaryBtn = ({ onClick, disabled, children, color=D.gold, style:s={} }) => (
  <button onClick={onClick} disabled={disabled} className="btn-hover"
    style={{width:"100%",padding:"15px 20px",borderRadius:10,background:disabled?"#333":`linear-gradient(135deg,${color},${color}CC)`,color:disabled?D.muted:D.midnight,border:"none",fontSize:15,fontWeight:800,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:disabled?"none":`0 4px 24px ${color}44`,letterSpacing:0.3,...s}}>
    {children}
  </button>
);

const GoogleBtn = ({ t }) => (
  <button className="btn-hover"
    style={{width:"100%",padding:"14px 16px",borderRadius:10,border:`1.5px solid ${D.border}`,background:"transparent",color:D.cream,display:"flex",alignItems:"center",justifyContent:"center",gap:10,cursor:"pointer",fontSize:14,fontWeight:600,fontFamily:"inherit",letterSpacing:0.2}}>
    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
    {t.google}
  </button>
);

const Spinner = () => (
  <span style={{width:18,height:18,border:"2px solid rgba(0,0,0,0.2)",borderTopColor:D.midnight,borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block"}}/>
);

const Divider = ({ t }) => (
  <div style={{display:"flex",alignItems:"center",gap:12,margin:"18px 0"}}>
    <div style={{flex:1,height:1,background:D.border}}/>
    <span style={{color:D.muted,fontSize:12}}>{t.or}</span>
    <div style={{flex:1,height:1,background:D.border}}/>
  </div>
);

const StepDots = ({ step, t }) => (
  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:28}}>
    {[t.step_info,t.step_plan].map((l,i)=>(
      <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <div style={{width:26,height:26,borderRadius:"50%",background:step>=i+1?D.gold:D.border,color:step>=i+1?D.midnight:D.muted,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,transition:"all 0.3s"}}>
            {step>i+1?"✓":i+1}
          </div>
          <span style={{fontSize:10,color:step>=i+1?D.gold:D.muted,fontWeight:700,whiteSpace:"nowrap"}}>{l}</span>
        </div>
        {i===0 && <div style={{width:40,height:2,background:step>=2?D.gold:D.border,borderRadius:1,marginBottom:18,transition:"all 0.3s"}}/>}
      </div>
    ))}
  </div>
);

function AuthScreen({ onLogin, lang, setLang }) {
  const [tab, setTab]       = useState("login"); // login|signup|forgot
  const [step, setStep]     = useState(1);
  const [plan, setPlan]     = useState("plus");
  const [loading, setLoading] = useState(false);
  const [toast, setToast]   = useState(null);
  const [email, setEmail]   = useState("");
  const [pw, setPw]         = useState("");
  const [cpw, setCpw]       = useState("");
  const [name, setName]     = useState("");
  const [age, setAge]       = useState(7);
  const [reset, setReset]   = useState("");
  const [errs, setErrs]     = useState({});
  const t = LANGS[lang];

  const toast$ = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const validate = (mode) => {
    const e={};
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email=t.err_email;
    if (pw.length<8) e.pw=t.err_pw;
    if (mode==="signup") {
      if (pw!==cpw) e.cpw=t.err_match;
      if (!name.trim()) e.name=t.err_name;
    }
    setErrs(e); return Object.keys(e).length===0;
  };

  const doLogin = () => {
    if (!validate("login")) return;
    setLoading(true);
    setTimeout(()=>{
      setLoading(false);
      if (email==="test@noor.com" && pw==="test1234") onLogin(plan);
      else setErrs({general:t.err_creds});
    },1200);
  };

  const doSignup = () => {
    if (step===1) { if (!validate("signup")) return; setStep(2); return; }
    setLoading(true);
    setTimeout(()=>{ setLoading(false); onLogin(plan); },1400);
  };

  const doReset = () => {
    setLoading(true);
    setTimeout(()=>{ setLoading(false); toast$(t.reset_ok); setTimeout(()=>setTab("login"),2500); },1000);
  };

  return (
    <div style={{display:"flex",minHeight:"100vh",background:D.midnight,fontFamily:"'Tajawal',sans-serif",direction:t.dir}}>
      {/* ── HERO PANEL ── */}
      <div className="auth-hero" style={{width:"46%",background:`linear-gradient(160deg,#0A6B48 0%,#0D8A5E 50%,#0A7B6B 100%)`,flexDirection:"column",justifyContent:"center",alignItems:"center",padding:"60px 44px",position:"relative",overflow:"hidden",display:"none"}}>
        <GeomPattern opacity={0.08}/>
        {/* Glow orbs */}
        <div style={{position:"absolute",width:300,height:300,borderRadius:"50%",background:`radial-gradient(circle,rgba(255,255,255,0.12) 0%,transparent 70%)`,top:"20%",left:"50%",transform:"translateX(-50%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",width:200,height:200,borderRadius:"50%",background:`radial-gradient(circle,rgba(240,192,64,0.18) 0%,transparent 70%)`,bottom:"20%",left:"30%",pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:1,textAlign:"center",color:D.cream,maxWidth:340}}>
          <div style={{animation:"floatY 4s ease-in-out infinite",marginBottom:24}}>
            <Crescent size={72} color={D.goldLight}/>
          </div>
          <h1 className="gold-text" style={{fontFamily:"'Amiri',serif",fontSize:48,marginBottom:4,lineHeight:1.15}}>Noor Academy</h1>
          <p style={{fontSize:14,color:D.mutedLt,marginBottom:36,letterSpacing:0.5}}>{t.tagline}</p>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:32}}>
            {[
              {n:"10,000+", l:lang==="ar"?"طفل":lang==="nl"?"kinderen":"children"},
              {n:"6", l:lang==="ar"?"مواد":lang==="nl"?"vakken":"subjects"},
              {n:"3", l:lang==="ar"?"لغات":lang==="nl"?"talen":"languages"},
              {n:"14", l:lang==="ar"?"يوماً مجاناً":lang==="nl"?"dagen gratis":"day free trial"},
            ].map((s,i)=>(
              <div key={i} style={{background:`rgba(255,255,255,0.15)`,border:`1px solid rgba(255,255,255,0.25)`,borderRadius:14,padding:"16px 12px",backdropFilter:"blur(8px)",animation:`fadeUp 0.5s ease ${0.1*i+0.2}s both`}}>
                <p style={{fontSize:22,fontWeight:800,color:"#F5D98A",marginBottom:2}}>{s.n}</p>
                <p style={{fontSize:11,color:"rgba(255,255,255,0.75)"}}>{s.l}</p>
              </div>
            ))}
          </div>

          <div style={{background:`rgba(255,255,255,0.15)`,border:`1px solid rgba(255,255,255,0.25)`,borderRadius:16,padding:"18px 22px",backdropFilter:"blur(8px)"}}>
            <p style={{fontSize:13,fontStyle:"italic",color:D.mutedLt,lineHeight:1.7,marginBottom:10}}>
              {lang==="ar"?'«أداة رائعة! أطفالي يتعلمون القرآن بفرح»':lang==="nl"?'"Mijn kinderen leren de Koran op een prachtige manier."':'"My children love learning the Qur\'an this way."'}
            </p>
            <p style={{fontSize:12,color:D.gold,fontWeight:700}}>— {lang==="ar"?"أم أحمد، بلجيكا":lang==="nl"?"Fatima, Antwerpen":"Fatima, Antwerp"}</p>
          </div>
        </div>
      </div>

      {/* ── FORM PANEL ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflowY:"auto",background:D.deep}}>
        {/* Top bar */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 28px",borderBottom:`1px solid ${D.border}`,position:"sticky",top:0,background:D.deep,zIndex:10}}>
          {/* Mobile logo */}
          <div className="auth-mobile-logo" style={{display:"flex",alignItems:"center",gap:10}}>
            <Crescent size={30} color={D.gold}/>
            <span className="gold-text" style={{fontFamily:"'Amiri',serif",fontSize:22}}>Noor Academy</span>
          </div>
          {/* Desktop switch */}
          <div className="auth-hero" style={{display:"none",alignItems:"center"}}>
            <span style={{color:D.muted,fontSize:13}}>
              {tab==="login"?t.go_signup:t.go_login}{" "}
              <button onClick={()=>{setTab(tab==="login"?"signup":"login");setStep(1);setErrs({});}} style={{background:"none",border:"none",color:D.gold,fontWeight:800,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>{tab==="login"?t.btn_signup:t.btn_login}</button>
            </span>
          </div>
          {/* Lang switcher */}
          <div style={{display:"flex",gap:4,background:`${D.navyCard}`,borderRadius:20,padding:3,border:`1px solid ${D.border}`}}>
            {Object.entries(LANGS).map(([code,v])=>(
              <button key={code} onClick={()=>setLang(code)} style={{background:lang===code?D.gold:"transparent",border:"none",borderRadius:16,padding:"5px 10px",cursor:"pointer",color:lang===code?D.midnight:D.muted,fontSize:11,fontWeight:lang===code?800:400,transition:"all 0.2s",fontFamily:"inherit"}}>
                {v.flag} {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form body */}
        <div style={{flex:1,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"36px 24px 80px"}}>
          <div style={{width:"100%",maxWidth:420}}>

            {/* Toast */}
            {toast && (
              <div style={{background:toast.type==="success"?`${D.emerald}22`:`${D.error}22`,border:`1px solid ${toast.type==="success"?D.emeraldLt:D.error}`,borderRadius:10,padding:"12px 16px",marginBottom:20,color:toast.type==="success"?D.emeraldLt:D.error,fontSize:14,fontWeight:600,animation:"fadeIn 0.3s ease"}}>
                {toast.type==="success"?"✅":"⚠️"} {toast.msg}
              </div>
            )}

            {/* ── FORGOT ── */}
            {tab==="forgot" && (
              <div style={{animation:"scaleIn 0.35s ease"}}>
                <Crescent size={44} color={D.gold}/>
                <h2 style={{fontFamily:"'Amiri',serif",fontSize:28,color:D.cream,margin:"12px 0 4px"}}>{t.reset_title}</h2>
                <p style={{color:D.muted,fontSize:14,marginBottom:28}}>{t.reset_sub}</p>
                <Input label={t.email} type="email" value={reset} onChange={setReset} dir={t.dir}/>
                <PrimaryBtn onClick={doReset} disabled={loading}>{loading?<Spinner/>:t.send_reset}</PrimaryBtn>
                <button onClick={()=>setTab("login")} style={{background:"none",border:"none",color:D.gold,fontWeight:700,cursor:"pointer",fontSize:14,marginTop:16,fontFamily:"inherit",display:"block"}}>{t.back}</button>
              </div>
            )}

            {/* ── LOGIN ── */}
            {tab==="login" && (
              <div style={{animation:"scaleIn 0.35s ease"}}>
                <Crescent size={44} color={D.gold}/>
                <h2 style={{fontFamily:"'Amiri',serif",fontSize:30,color:D.cream,margin:"12px 0 4px"}}>{t.welcome_back}</h2>
                <p style={{color:D.muted,fontSize:14,marginBottom:28}}>{t.sign_in_sub}</p>
                {errs.general && <div style={{background:`${D.error}18`,border:`1px solid ${D.error}`,borderRadius:10,padding:"10px 14px",marginBottom:16,color:D.error,fontSize:13}}>⚠️ {errs.general}</div>}
                <Input label={t.email} type="email" value={email} onChange={setEmail} error={errs.email} dir={t.dir}/>
                <Input label={t.password} type="password" value={pw} onChange={setPw} error={errs.pw} dir={t.dir} hint={t.forgot} onHintClick={()=>setTab("forgot")}/>
                <PrimaryBtn onClick={doLogin} disabled={loading} style={{marginBottom:4}}>{loading?<Spinner/>:t.btn_login}</PrimaryBtn>
                <p style={{textAlign:"center",fontSize:11,color:D.muted,margin:"8px 0 0"}}>{t.demo}</p>
                <Divider t={t}/>
                <GoogleBtn t={t}/>
                <p style={{textAlign:"center",marginTop:20,fontSize:13,color:D.muted}}>
                  {t.go_signup}{" "}
                  <button onClick={()=>{setTab("signup");setErrs({});}} style={{background:"none",border:"none",color:D.gold,fontWeight:800,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>{t.btn_signup}</button>
                </p>
              </div>
            )}

            {/* ── SIGNUP step 1 ── */}
            {tab==="signup" && step===1 && (
              <div style={{animation:"scaleIn 0.35s ease"}}>
                <Crescent size={44} color={D.gold}/>
                <h2 style={{fontFamily:"'Amiri',serif",fontSize:30,color:D.cream,margin:"12px 0 4px"}}>{t.create_account}</h2>
                <p style={{color:D.muted,fontSize:14,marginBottom:24}}>{t.sign_up_sub}</p>
                <StepDots step={step} t={t}/>
                <Input label={t.email} type="email" value={email} onChange={setEmail} error={errs.email} dir={t.dir}/>
                <Input label={t.password} type="password" value={pw} onChange={setPw} error={errs.pw} dir={t.dir}/>
                <Input label={t.confirm_password} type="password" value={cpw} onChange={setCpw} error={errs.cpw} dir={t.dir}/>
                <Input label={t.child_name} value={name} onChange={setName} error={errs.name} placeholder={lang==="ar"?"مثال: محمد":lang==="nl"?"bijv. Aisha":"e.g. Aisha"} dir={t.dir}/>
                <Select label={t.child_age} value={age} onChange={setAge} options={t.ages} dir={t.dir}/>
                <PrimaryBtn onClick={doSignup}>{t.next}</PrimaryBtn>
                <Divider t={t}/>
                <GoogleBtn t={t}/>
                <p style={{textAlign:"center",marginTop:20,fontSize:13,color:D.muted}}>
                  {t.go_login}{" "}
                  <button onClick={()=>{setTab("login");setErrs({});}} style={{background:"none",border:"none",color:D.gold,fontWeight:800,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>{t.btn_login}</button>
                </p>
              </div>
            )}

            {/* ── SIGNUP step 2: plan ── */}
            {tab==="signup" && step===2 && (
              <div style={{animation:"scaleIn 0.35s ease"}}>
                <h2 style={{fontFamily:"'Amiri',serif",fontSize:28,color:D.cream,marginBottom:6}}>{t.choose_plan}</h2>
                <p style={{color:D.muted,fontSize:13,marginBottom:20}}>{t.sign_up_sub}</p>
                <StepDots step={step} t={t}/>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
                  {/* Free plan */}
                  {[
                    {id:"free",name:t.free_name,price:t.free_price,features:t.free_f,badge:null},
                    {id:"plus",name:t.plus_name,price:t.plus_price,features:t.plus_f,badge:t.popular},
                  ].map(pl=>(
                    <div key={pl.id} onClick={()=>setPlan(pl.id)} style={{borderRadius:14,padding:"18px 14px",cursor:"pointer",transition:"all 0.25s",background:plan===pl.id?pl.id==="plus"?`linear-gradient(145deg,${D.navy},${D.navyCard})`:`${D.navyCard}`:D.deep,border:`2px solid ${plan===pl.id?pl.id==="plus"?D.gold:D.emeraldLt:D.border}`,boxShadow:plan===pl.id?`0 6px 28px ${pl.id==="plus"?D.gold+"33":D.emeraldLt+"33"}`:"none",position:"relative",overflow:"hidden"}}>
                      {pl.badge && <div style={{position:"absolute",top:8,right:8,background:`linear-gradient(135deg,${D.gold},${D.goldLight})`,color:D.midnight,fontSize:9,fontWeight:800,padding:"3px 8px",borderRadius:20}}>{pl.badge}</div>}
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                        <div style={{width:12,height:12,borderRadius:"50%",border:`2px solid ${plan===pl.id?pl.id==="plus"?D.gold:D.emeraldLt:"#444"}`,background:plan===pl.id?pl.id==="plus"?D.gold:D.emeraldLt:"transparent",transition:"all 0.2s",flexShrink:0}}/>
                        <p style={{fontWeight:800,fontSize:15,color:D.cream,margin:0}}>{pl.name}</p>
                      </div>
                      <p style={{fontSize:13,fontWeight:700,color:pl.id==="plus"?D.gold:D.emeraldLt,marginBottom:12,marginLeft:20}}>{pl.price}</p>
                      <div style={{display:"grid",gap:5}}>
                        {pl.features.map((f,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"flex-start",gap:6}}>
                            <span style={{color:pl.id==="plus"?D.gold:D.emeraldLt,fontSize:10,marginTop:2,flexShrink:0}}>✦</span>
                            <span style={{fontSize:11,color:D.mutedLt,lineHeight:1.4}}>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {plan==="plus" && (
                  <div style={{background:`${D.gold}12`,border:`1px solid ${D.gold}44`,borderRadius:10,padding:"10px 14px",marginBottom:16,textAlign:"center",fontSize:12,color:D.goldLight}}>
                    🎁 {t.trial}
                  </div>
                )}

                <PrimaryBtn onClick={doSignup} disabled={loading} color={plan==="plus"?D.gold:D.emeraldLt}>
                  {loading?<Spinner/>:t.btn_signup}
                </PrimaryBtn>
                <button onClick={()=>setStep(1)} style={{background:"none",border:"none",color:D.muted,fontWeight:600,cursor:"pointer",fontSize:13,marginTop:14,fontFamily:"inherit",display:"block",textAlign:"center",width:"100%"}}>
                  {t.back}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════════
const NAV_ICONS = ["🏠","🎯","✍️","👶","🤲","🏅","👨‍👩‍👧"];
const SCREENS   = ["home","quiz","arabic","kids","duas","badges","parent"];

function Sidebar({ active, setScreen, t, onLogout, lang }) {
  return (
    <div className="app-sidebar" style={{position:"fixed",top:0,left:0,width:220,height:"100vh",background:D.deep,borderRight:`1px solid ${D.border}`,flexDirection:"column",zIndex:100,display:"none",padding:"28px 0"}}>
      <div style={{padding:"0 20px 28px",borderBottom:`1px solid ${D.border}`}}>
        <Crescent size={28} color={D.gold}/>
        <p className="gold-text" style={{fontFamily:"'Amiri',serif",fontSize:20,marginTop:6}}>Noor Academy</p>
        <p style={{fontSize:11,color:D.muted}}>{t.tagline}</p>
      </div>
      <div style={{flex:1,padding:"16px 12px",display:"flex",flexDirection:"column",gap:4}}>
        {SCREENS.map((s,i)=>(
          <button key={s} onClick={()=>setScreen(s)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,border:"none",background:active===s?`linear-gradient(135deg,${D.gold}22,${D.gold}11)`:"transparent",color:active===s?D.goldLight:D.muted,cursor:"pointer",fontSize:14,fontWeight:active===s?700:400,fontFamily:"inherit",transition:"all 0.2s",textAlign:"left",borderLeft:`3px solid ${active===s?D.gold:"transparent"}`}}>
            <span style={{fontSize:18}}>{NAV_ICONS[i]}</span>
            {t.nav[i]}
          </button>
        ))}
      </div>
      <div style={{padding:"16px 12px",borderTop:`1px solid ${D.border}`}}>
        <button onClick={onLogout} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,border:"none",background:"transparent",color:D.muted,cursor:"pointer",fontSize:13,fontFamily:"inherit",width:"100%"}}>
          ↩ {t.logout}
        </button>
      </div>
    </div>
  );
}

function BottomNav({ active, setScreen, t }) {
  return (
    <div className="app-bottomnav" style={{position:"fixed",bottom:0,left:0,right:0,background:D.deep,borderTop:`1px solid ${D.border}`,justifyContent:"space-around",padding:"10px 0 14px",zIndex:100,display:"none"}}>
      {SCREENS.map((s,i)=>(
        <button key={s} onClick={()=>setScreen(s)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"2px 10px"}}>
          <span style={{fontSize:20}}>{NAV_ICONS[i]}</span>
          <span style={{fontSize:9,color:active===s?D.gold:D.muted,fontWeight:active===s?800:400,fontFamily:"'Tajawal',sans-serif"}}>{t.nav[i]}</span>
          {active===s && <div style={{width:16,height:2.5,background:D.gold,borderRadius:2}}/>}
        </button>
      ))}
    </div>
  );
}

// ── HOME ──────────────────────────────────────────────────────────
function Home({ t, lang, setScreen, setActiveSub, plan, onLocked }) {
  const [revealedDua, setRevealedDua] = useState(false);
  const dua = DUAS[0];

  return (
    <div style={{padding:"24px 20px 100px",direction:t.dir}}>
      {/* Greeting */}
      <div style={{marginBottom:24}}>
        <p style={{fontSize:13,color:D.muted,marginBottom:4}}>{t.salaam}</p>
        <h1 className="gold-text" style={{fontFamily:"'Amiri',serif",fontSize:32,lineHeight:1.2,marginBottom:2}}>Noor Academy</h1>
        <p style={{fontSize:13,color:D.mutedLt}}>{t.tagline}</p>
      </div>

      {/* Stats row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
        <div style={{background:`linear-gradient(135deg,${D.navyCard},${D.navy})`,border:`1px solid ${D.border}`,borderRadius:14,padding:"16px 18px",position:"relative",overflow:"hidden"}}>
          <GeomPattern opacity={0.05}/>
          <p className="gold-text" style={{fontSize:28,fontWeight:800,marginBottom:2}}>{totalStars}</p>
          <p style={{fontSize:12,color:D.mutedLt}}>⭐ {t.stars}</p>
        </div>
        <div style={{background:`linear-gradient(135deg,${D.navyCard},${D.navy})`,border:`1px solid ${D.border}`,borderRadius:14,padding:"16px 18px",position:"relative",overflow:"hidden"}}>
          <GeomPattern opacity={0.05}/>
          <p style={{fontSize:28,fontWeight:800,color:D.emeraldLt,marginBottom:2}}>{earnedBadges}</p>
          <p style={{fontSize:12,color:D.mutedLt}}>🏅 {t.badges_ct}</p>
        </div>
      </div>

      {/* Du'a card */}
      <div onClick={()=>{ if(!revealedDua){ sfx("tap"); setRevealedDua(true); speak(dua.arabic,"ar"); } }} style={{background:`linear-gradient(135deg,${D.navy},${D.navyCard})`,border:`1px solid ${D.gold}44`,borderRadius:18,padding:"22px 22px",marginBottom:22,cursor:revealedDua?"default":"pointer",position:"relative",overflow:"hidden",boxShadow:`0 4px 32px ${D.gold}18`}}>
        <GeomPattern opacity={0.06}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <p style={{fontSize:10,color:D.gold,letterSpacing:2,textTransform:"uppercase",fontWeight:700,margin:0}}>{t.dua_day}</p>
            <SpeakBtn text={dua.arabic} lang="ar" size={30}/>
          </div>
          <p style={{fontFamily:"'Amiri',serif",fontSize:36,direction:"rtl",color:D.cream,lineHeight:1.5,marginBottom:8}}>{dua.arabic}</p>
          {revealedDua ? (
            <>
              <p style={{fontSize:13,color:D.gold,fontStyle:"italic",marginBottom:4}}>{dua.translit}</p>
              <p style={{fontSize:14,color:D.mutedLt,marginBottom:4}}>{dua[lang]}</p>
              <p style={{fontSize:12,color:D.muted}}>📍 {dua[`occ_${lang}`]}</p>
            </>
          ) : (
            <p style={{fontSize:13,color:D.muted,animation:"pulse 2s ease-in-out infinite"}}>{t.dua_tap}</p>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
        {[
          {label:lang==="ar"?"دورة العربية":lang==="nl"?"Arabische Cursus":"Arabic Course", icon:"✍️", color:D.emerald,  screen:"arabic", sub:lang==="ar"?"٥ مستويات":lang==="nl"?"5 niveaus":"5 levels"},
          {label:lang==="ar"?"وضع الأطفال":lang==="nl"?"Kindermodus":"Kids Mode",           icon:"👶", color:"#E8A020",  screen:"kids",   sub:lang==="ar"?"٤-٧ سنوات":lang==="nl"?"4-7 jaar":"4–7 years"},
          {label:t.quick_quiz,                                                              icon:"🎯", color:D.gold,     screen:"quiz",   sub:lang==="ar"?"٥ أسئلة":lang==="nl"?"5 vragen":"5 questions"},
          {label:t.all_duas,                                                                icon:"🤲", color:D.teal,     screen:"duas",   sub:lang==="ar"?"أدعية يومية":lang==="nl"?"Dagelijks":"Daily"},
        ].map((a,i)=>(
          <button key={i} onClick={()=>setScreen(a.screen)} className="btn-hover"
            style={{background:D.navyCard,border:`1px solid ${a.color}33`,borderRadius:16,padding:"18px 14px",display:"flex",flexDirection:"column",alignItems:"flex-start",gap:6,cursor:"pointer",boxShadow:`0 2px 16px ${a.color}10`,textAlign:"left"}}>
            <span style={{fontSize:28,animation:`floatY 3s ease-in-out infinite`,animationDelay:`${i*0.3}s`}}>{a.icon}</span>
            <span style={{fontSize:13,fontWeight:800,color:a.color,lineHeight:1.3}}>{a.label}</span>
            <span style={{fontSize:11,color:D.muted}}>{a.sub}</span>
          </button>
        ))}
      </div>

      {/* Subjects */}
      <h3 style={{fontFamily:"'Amiri',serif",fontSize:20,color:D.cream,marginBottom:14}}>{t.my_subjects}</h3>
      <div style={{display:"grid",gap:10}}>
        {SUBJECTS.map((s,i)=>{
          const locked = plan==="free" && i>=2;
          return (
            <button key={s.id} onClick={()=>{ if(locked){onLocked();return;} setActiveSub(s.id);setScreen("lesson"); }} className="card-hover"
              style={{background:D.navyCard,border:`1px solid ${locked?D.border:D.border}`,borderRadius:16,padding:0,cursor:"pointer",overflow:"hidden",display:"flex",alignItems:"stretch",textAlign:"left",boxShadow:`0 2px 16px rgba(0,0,0,0.07)`,animation:`fadeUp 0.4s ease ${i*0.05+0.1}s both`,opacity:locked?0.65:1,position:"relative"}}>
              <div style={{width:68,background:`linear-gradient(135deg,${s.color}${locked?"22":"44"},${s.color}${locked?"11":"22"})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,position:"relative",overflow:"hidden",borderRight:`1px solid ${s.color}33`}}>
                <div style={{position:"absolute",inset:0,background:`radial-gradient(circle,${s.glow} 0%,transparent 70%)`}}/>
                <span style={{fontSize:26,position:"relative",zIndex:1}}>{locked?"🔒":s.icon}</span>
              </div>
              <div style={{flex:1,padding:"14px 16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                  <p style={{fontWeight:800,fontSize:15,color:D.cream,margin:0}}>{s[lang].name}</p>
                  {locked
                    ? <span style={{fontSize:10,background:`linear-gradient(135deg,${D.gold},${D.goldLight})`,color:D.midnight,fontWeight:800,padding:"2px 8px",borderRadius:20}}>PLUS</span>
                    : <span style={{fontSize:11,color:s.color,fontWeight:700}}>{s.stars}/{s.total} ✦</span>
                  }
                </div>
                <p style={{margin:"0 0 8px",fontSize:12,color:D.muted}}>{s[lang].desc}</p>
                {!locked && <div style={{height:4,background:D.border,borderRadius:2,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${(s.stars/s.total)*100}%`,background:`linear-gradient(90deg,${s.color},${D.goldLight})`,borderRadius:2}}/>
                </div>}
              </div>
              <div style={{display:"flex",alignItems:"center",padding:"0 14px"}}>
                <span style={{color:D.border,fontSize:18}}>{t.dir==="rtl"?"‹":"›"}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Hadith */}
      <div style={{marginTop:20,background:`linear-gradient(135deg,${D.navyCard},${D.navy})`,border:`1px solid ${D.gold}33`,borderRadius:18,padding:"22px 22px",position:"relative",overflow:"hidden"}}>
        <GeomPattern opacity={0.05}/>
        <div style={{position:"relative",zIndex:1}}>
          <p style={{fontSize:10,color:D.gold,letterSpacing:2,textTransform:"uppercase",marginBottom:10,fontWeight:700}}>{t.hadith_day}</p>
          <p style={{fontFamily:"'Amiri',serif",fontSize:20,color:D.cream,direction:"rtl",lineHeight:1.8,marginBottom:8}}>"طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ"</p>
          <p style={{fontSize:13,color:D.mutedLt,fontStyle:"italic",marginBottom:4}}>
            {lang==="ar"?"«طلب العلم فريضة على كل مسلم»":lang==="nl"?'"Kennis zoeken is verplicht voor elke moslim."':'"Seeking knowledge is an obligation upon every Muslim."'}
          </p>
          <p style={{fontSize:11,color:D.muted}}>{t.hadith_src}</p>
        </div>
      </div>
    </div>
  );
}

// ── LESSON SCREEN ──────────────────────────────────────────────────
function LessonScreen({ subjectId, t, lang, plan, onLocked, onBack }) {
  const s = SUBJECTS.find(x=>x.id===subjectId);
  const lessons = s.lessons[lang];
  const [done, setDone] = useState(lessons.filter(l=>l.done).map(l=>l.id));

  return (
    <div style={{padding:"24px 20px 100px",direction:t.dir,animation:"fadeUp 0.3s ease"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:D.gold,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:20}}>{t.back}</button>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24}}>
        <div style={{width:52,height:52,borderRadius:14,background:`linear-gradient(135deg,${s.color}44,${s.color}22)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,border:`1px solid ${s.color}44`,boxShadow:`0 0 20px ${s.glow}`}}>{s.icon}</div>
        <div>
          <h2 style={{fontFamily:"'Amiri',serif",fontSize:22,color:D.cream,margin:"0 0 2px"}}>{s[lang].name}</h2>
          <p style={{margin:0,fontSize:12,color:D.muted}}>{s[lang].desc}</p>
        </div>
      </div>
      <div style={{display:"grid",gap:10}}>
        {lessons.map(lesson=>{
          const isDone = done.includes(lesson.id);
          return (
            <div key={lesson.id} className="card-hover"
              style={{background:D.navyCard,border:`1.5px solid ${isDone?s.color+"66":D.border}`,borderRadius:14,padding:"16px 18px",display:"flex",alignItems:"center",gap:14,boxShadow:isDone?`0 2px 16px ${s.glow}`:"none",transition:"all 0.25s"}}>
              <div style={{width:44,height:44,borderRadius:"50%",background:isDone?`linear-gradient(135deg,${s.color},${s.color}88)`:`${D.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,color:isDone?D.midnight:D.muted,fontWeight:800}}>
                {isDone?"✓":"▷"}
              </div>
              <div style={{flex:1}}>
                <p style={{margin:0,fontWeight:700,color:D.cream,fontSize:15}}>{lesson.title}</p>
                <p style={{margin:"3px 0 0",fontSize:12,color:D.muted}}>{lesson.type}</p>
              </div>
              {!isDone && (
                <button onClick={()=>setDone(p=>[...new Set([...p,lesson.id])])} className="btn-hover"
                  style={{background:`linear-gradient(135deg,${s.color},${s.color}BB)`,border:"none",borderRadius:10,padding:"8px 16px",color:D.midnight,fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>
                  {t.start}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── QUIZ ───────────────────────────────────────────────────────────
function QuizScreen({ t, lang, onBack }) {
  const qs = QUIZ[lang];
  const [idx,setIdx]       = useState(0);
  const [sel,setSel]       = useState(null);
  const [score,setScore]   = useState(0);
  const [done,setDone]     = useState(false);
  const [shake,setShake]   = useState(false);
  const q = qs[idx];

  const pick = (i) => {
    if (sel!==null) return;
    setSel(i);
    if (i===q.a) { setScore(s=>s+1); sfx("correct"); }
    else { setShake(true); sfx("wrong"); setTimeout(()=>setShake(false),500); }
    setTimeout(()=>{
      if (idx+1<qs.length){ setIdx(x=>x+1); setSel(null); }
      else { setDone(true); sfx("celebrate"); }
    },1700);
  };

  // speak question when it changes
  useEffect(() => { if(q?.q) speak(q.q, lang); }, [idx]);

  if (done) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:440,gap:20,textAlign:"center",padding:32,direction:t.dir,animation:"scaleIn 0.4s ease"}}>
      <div style={{fontSize:64,animation:"floatY 3s ease-in-out infinite"}}>{score>=4?"🌟":score>=3?"⭐":"📚"}</div>
      <h2 style={{fontFamily:"'Amiri',serif",fontSize:28,color:D.cream}}>{t.score_msg[score>=4?0:score>=3?1:2]}</h2>
      <p style={{fontSize:18,color:D.mutedLt}}>{t.scored} <span style={{color:D.goldLight,fontWeight:800}}>{score}</span> {t.out_of} <span style={{color:D.goldLight,fontWeight:800}}>{qs.length}</span></p>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
        <PrimaryBtn onClick={()=>{setIdx(0);setScore(0);setSel(null);setDone(false);}} color={D.gold} style={{maxWidth:200}}>{t.try_again}</PrimaryBtn>
        <PrimaryBtn onClick={onBack} color={D.emerald} style={{maxWidth:200}}>{t.back_home}</PrimaryBtn>
      </div>
    </div>
  );

  return (
    <div style={{padding:"24px 20px 100px",direction:t.dir,animation:"fadeUp 0.3s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:D.gold,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t.back}</button>
        <span style={{fontSize:13,color:D.muted}}>{t.q_of} {idx+1} {t.of} {qs.length}</span>
        <span style={{fontSize:13,color:D.goldLight,fontWeight:700}}>✦ {score}</span>
      </div>
      <div style={{height:5,background:D.border,borderRadius:3,marginBottom:26,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${(idx/qs.length)*100}%`,background:`linear-gradient(90deg,${D.emerald},${D.gold})`,borderRadius:3,transition:"width 0.4s"}}/>
      </div>
      <div style={{background:D.navyCard,border:`1.5px solid ${D.border}`,borderRadius:18,padding:24,marginBottom:18,animation:shake?"shake 0.5s":undefined,boxShadow:`0 4px 24px rgba(0,0,0,0.07)`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
          <p style={{fontFamily:"'Amiri',serif",fontSize:20,color:D.cream,margin:0,lineHeight:1.6,flex:1}}>{q.q}</p>
          <SpeakBtn text={q.q} lang={lang} size={34}/>
        </div>
      </div>
      <div style={{display:"grid",gap:10}}>
        {q.opts.map((opt,i)=>{
          let bg=D.navyCard, border=`1.5px solid ${D.border}`, col=D.cream;
          if (sel!==null){
            if (i===q.a){bg=`${D.emerald}22`;border=`1.5px solid ${D.emeraldLt}`;col=D.emeraldLt;}
            else if (i===sel&&i!==q.a){bg=`${D.error}18`;border=`1.5px solid ${D.error}`;col=D.error;}
          }
          return (
            <button key={i} onClick={()=>pick(i)}
              style={{background:bg,border,borderRadius:12,padding:"14px 18px",textAlign:t.dir==="rtl"?"right":"left",cursor:sel!==null?"default":"pointer",color:col,fontSize:14,fontWeight:500,transition:"all 0.3s",fontFamily:"inherit",display:"flex",alignItems:"center",gap:12}}>
              <span style={{width:26,height:26,borderRadius:"50%",background:D.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:D.muted,flexShrink:0}}>{String.fromCharCode(65+i)}</span>
              {opt}
            </button>
          );
        })}
      </div>
      {sel!==null && (
        <div style={{marginTop:16,background:sel===q.a?`${D.emerald}18`:`${D.gold}18`,border:`1px solid ${sel===q.a?D.emeraldLt:D.gold}`,borderRadius:12,padding:"14px 18px",animation:"fadeIn 0.3s ease"}}>
          <p style={{margin:0,color:D.mutedLt,fontSize:13}}>✦ <strong style={{color:sel===q.a?D.emeraldLt:D.goldLight}}>{t.knew}</strong> {q.exp}</p>
        </div>
      )}
    </div>
  );
}

// ── DU'AS ─────────────────────────────────────────────────────────
function DuasScreen({ t, lang }) {
  const [open, setOpen] = useState(null);
  return (
    <div style={{padding:"24px 20px 100px",direction:t.dir,animation:"fadeUp 0.3s ease"}}>
      <h2 style={{fontFamily:"'Amiri',serif",fontSize:24,color:D.cream,marginBottom:20}}>{t.all_duas}</h2>
      <div style={{display:"grid",gap:14}}>
        {DUAS.map((d,i)=>{
          const isOpen = open===i;
          const colors = [D.gold,D.emeraldLt,"#8B6FD4",D.teal];
          const c = colors[i%4];
          return (
            <div key={i} onClick={()=>{ sfx("tap"); const opening = !isOpen; setOpen(opening?i:null); if(opening) speak(d.arabic,"ar"); }} className="card-hover"
              style={{background:D.navyCard,border:`1.5px solid ${isOpen?c+"66":D.border}`,borderRadius:18,padding:"22px 22px",cursor:"pointer",position:"relative",overflow:"hidden",transition:"all 0.3s",boxShadow:isOpen?`0 4px 28px ${c}22`:"none"}}>
              <GeomPattern opacity={0.04}/>
              <div style={{position:"relative",zIndex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <p style={{fontFamily:"'Amiri',serif",fontSize:34,direction:"rtl",color:D.cream,lineHeight:1.5,margin:0,flex:1}}>{d.arabic}</p>
                  <SpeakBtn text={d.arabic} lang="ar" size={34} style={{marginTop:4,flexShrink:0}}/>
                </div>
                <p style={{fontSize:13,color:c,fontStyle:"italic",marginBottom:isOpen?8:0}}>{d.translit}</p>
                {isOpen && (
                  <div style={{animation:"fadeIn 0.3s ease"}}>
                    <p style={{fontSize:14,color:D.mutedLt,marginBottom:6}}>{d[lang]}</p>
                    <p style={{fontSize:12,color:D.muted}}>📍 {d[`occ_${lang}`]}</p>
                    <button onClick={e=>{e.stopPropagation(); speak(d[lang],lang);}} style={{marginTop:10,background:`${c}18`,border:`1px solid ${c}44`,borderRadius:8,padding:"6px 14px",color:c,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                      🔈 {lang==="ar"?"استمع بالعربية":lang==="nl"?"Vertaling horen":"Hear translation"}
                    </button>
                  </div>
                )}
                {!isOpen && <p style={{fontSize:12,color:D.muted,marginTop:4}}>{t.dua_tap}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── BADGES ────────────────────────────────────────────────────────
function BadgesScreen({ t, lang, plan, onLocked }) {
  return (
    <div style={{padding:"24px 20px 100px",direction:t.dir,animation:"fadeUp 0.3s ease"}}>
      <h2 style={{fontFamily:"'Amiri',serif",fontSize:24,color:D.cream,marginBottom:20}}>{t.achievements}</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {BADGES_DATA.map((b,i)=>{
          const locked = plan==="free" && i>=3;
          return (
            <div key={b.id} onClick={locked?onLocked:undefined} className="card-hover"
              style={{background:b.earned&&!locked?D.navyCard:D.deep,border:`1.5px solid ${b.earned&&!locked?D.gold+"55":D.border}`,borderRadius:16,padding:"22px 16px",textAlign:"center",opacity:locked?0.55:b.earned?1:0.45,boxShadow:b.earned&&!locked?`0 4px 24px ${D.gold}18`:"none",animation:`fadeUp 0.4s ease ${i*0.07}s both`,cursor:locked?"pointer":"default",position:"relative"}}>
              {locked && <div style={{position:"absolute",top:8,right:8,background:`linear-gradient(135deg,${D.gold},${D.goldLight})`,color:D.midnight,fontSize:9,fontWeight:800,padding:"2px 6px",borderRadius:10}}>PLUS</div>}
              <div style={{fontSize:40,marginBottom:10,filter:b.earned&&!locked?"drop-shadow(0 0 8px rgba(181,130,15,0.5))":"none"}}>{locked?"🔒":b.icon}</div>
              <p style={{fontWeight:800,fontSize:14,color:D.cream,marginBottom:4}}>{b[`${lang==="ar"?"ar":lang==="nl"?"nl":"en"}`]}</p>
              <p style={{fontSize:11,color:D.muted,marginBottom:b.earned?8:0,lineHeight:1.4}}>{b[`${lang}_d`]}</p>
              {b.earned && !locked && <div style={{fontSize:10,color:D.gold,fontWeight:800,letterSpacing:1}}>{t.earned}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PARENT DASHBOARD ──────────────────────────────────────────────
function ParentScreen({ t, lang }) {
  const total  = SUBJECTS.reduce((a,s)=>a+s.total,0);
  const done   = SUBJECTS.reduce((a,s)=>a+s.stars,0);
  const pct    = Math.round((done/total)*100);
  return (
    <div style={{padding:"24px 20px 100px",direction:t.dir,animation:"fadeUp 0.3s ease"}}>
      <h2 style={{fontFamily:"'Amiri',serif",fontSize:24,color:D.cream,marginBottom:20}}>{t.parent_title}</h2>
      {/* Big progress */}
      <div style={{background:`linear-gradient(135deg,${D.navy},${D.navyCard})`,border:`1px solid ${D.gold}44`,borderRadius:18,padding:"24px 22px",marginBottom:18,position:"relative",overflow:"hidden",boxShadow:`0 4px 32px ${D.gold}14`}}>
        <GeomPattern opacity={0.06}/>
        <div style={{position:"relative",zIndex:1}}>
          <p style={{fontSize:11,color:D.gold,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>{t.overall}</p>
          <p className="gold-text" style={{fontSize:48,fontWeight:800,lineHeight:1,marginBottom:12}}>{pct}%</p>
          <div style={{height:8,background:D.border,borderRadius:4,overflow:"hidden",marginBottom:8}}>
            <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${D.emerald},${D.gold})`,borderRadius:4,transition:"width 0.8s ease"}}/>
          </div>
          <p style={{fontSize:12,color:D.muted}}>{done} / {total} {t.done_of}</p>
        </div>
      </div>
      {/* Per subject */}
      <div style={{display:"grid",gap:10,marginBottom:18}}>
        {SUBJECTS.map(s=>(
          <div key={s.id} style={{background:D.navyCard,border:`1px solid ${D.border}`,borderRadius:12,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:38,height:38,borderRadius:10,background:`${s.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,border:`1px solid ${s.color}33`,flexShrink:0}}>{s.icon}</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <p style={{margin:0,fontWeight:700,fontSize:14,color:D.cream}}>{s[lang].name}</p>
                <p style={{margin:0,fontSize:12,color:s.color,fontWeight:700}}>{s.stars}/{s.total} ✦</p>
              </div>
              <div style={{height:4,background:D.border,borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${(s.stars/s.total)*100}%`,background:`linear-gradient(90deg,${s.color},${D.goldLight})`,borderRadius:2}}/>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Weekly */}
      <div style={{background:D.navyCard,border:`1px solid ${D.gold}33`,borderRadius:14,padding:"18px 18px"}}>
        <p style={{fontWeight:800,color:D.goldLight,fontSize:14,marginBottom:12}}>{t.week_report}</p>
        {[t.week_l,t.week_t,t.week_b].map((item,i)=>(
          <p key={i} style={{margin:"0 0 8px",fontSize:13,color:D.mutedLt}}>{item}</p>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  ROOT
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
//  ARABIC COURSE — 5 levels, 30 lessons, trilingual
// ═══════════════════════════════════════════════════════════════════
const ARABIC_LEVELS = [
  {
    id:1, icon:"🌱",
    color:"#0A6B48", glow:"rgba(10,107,72,0.3)",
    nl:{name:"Niveau 1 — Letters",      desc:"De 28 Arabische letters leren kennen"},
    ar:{name:"المستوى ١ — الحروف",      desc:"تعلّم الحروف العربية الـ٢٨"},
    en:{name:"Level 1 — Letters",       desc:"Learn the 28 Arabic letters"},
    lessons:{
      nl:[
        {id:1,  title:"Alif ا — de eerste letter",         type:"Schrijven",  done:true,  xp:10, arabic:"أَ / أ", example:"أسد (leeuw)"},
        {id:2,  title:"Ba ب & Ta ت & Tha ث",              type:"Schrijven",  done:true,  xp:10, arabic:"بَ / تَ / ثَ", example:"بيت (huis)"},
        {id:3,  title:"Jim ج & Ha ح & Kha خ",             type:"Schrijven",  done:false, xp:10, arabic:"جَ / حَ / خَ", example:"جمل (kameel)"},
        {id:4,  title:"Dal د & Dhal ذ & Ra ر & Zay ز",   type:"Schrijven",  done:false, xp:10, arabic:"دَ / ذَ / رَ / زَ", example:"دار (huis)"},
        {id:5,  title:"Sin س & Shin ش",                   type:"Quiz",       done:false, xp:15, arabic:"سَ / شَ", example:"شمس (zon)"},
        {id:6,  title:"Sad ص & Dad ض & Ta ط & Za ظ",     type:"Schrijven",  done:false, xp:15, arabic:"صَ / ضَ / طَ / ظَ", example:"صلاة (gebed)"},
      ],
      ar:[
        {id:1,  title:"الألف — أول حرف",                  type:"كتابة",     done:true,  xp:10, arabic:"أَ / أ", example:"أسد"},
        {id:2,  title:"باء وتاء وثاء",                    type:"كتابة",     done:true,  xp:10, arabic:"بَ / تَ / ثَ", example:"بيت"},
        {id:3,  title:"جيم وحاء وخاء",                    type:"كتابة",     done:false, xp:10, arabic:"جَ / حَ / خَ", example:"جمل"},
        {id:4,  title:"دال وذال وراء وزاي",               type:"كتابة",     done:false, xp:10, arabic:"دَ / ذَ / رَ / زَ", example:"دار"},
        {id:5,  title:"سين وشين",                         type:"اختبار",    done:false, xp:15, arabic:"سَ / شَ", example:"شمس"},
        {id:6,  title:"صاد وضاد وطاء وظاء",              type:"كتابة",     done:false, xp:15, arabic:"صَ / ضَ / طَ / ظَ", example:"صلاة"},
      ],
      en:[
        {id:1,  title:"Alif ا — the first letter",         type:"Write",     done:true,  xp:10, arabic:"أَ / أ", example:"أسد (lion)"},
        {id:2,  title:"Ba ب & Ta ت & Tha ث",              type:"Write",     done:true,  xp:10, arabic:"بَ / تَ / ثَ", example:"بيت (house)"},
        {id:3,  title:"Jim ج & Ha ح & Kha خ",             type:"Write",     done:false, xp:10, arabic:"جَ / حَ / خَ", example:"جمل (camel)"},
        {id:4,  title:"Dal د & Dhal ذ & Ra ر & Zay ز",   type:"Write",     done:false, xp:10, arabic:"دَ / ذَ / رَ / زَ", example:"دار (home)"},
        {id:5,  title:"Sin س & Shin ش",                   type:"Quiz",      done:false, xp:15, arabic:"سَ / شَ", example:"شمس (sun)"},
        {id:6,  title:"Sad ص & Dad ض & Ta ط & Za ظ",     type:"Write",     done:false, xp:15, arabic:"صَ / ضَ / طَ / ظَ", example:"صلاة (prayer)"},
      ],
    },
  },
  {
    id:2, icon:"💧",
    color:"#0A7B6B", glow:"rgba(10,123,107,0.3)",
    nl:{name:"Niveau 2 — Klinkers",     desc:"Korte en lange klinkers (harakat)"},
    ar:{name:"المستوى ٢ — الحركات",    desc:"الحركات القصيرة والطويلة"},
    en:{name:"Level 2 — Vowels",        desc:"Short and long vowels (harakat)"},
    lessons:{
      nl:[
        {id:1, title:"Fatha — de 'a' klank",               type:"Luisteren", done:true,  xp:10, arabic:"بَ — ba", example:"بَيْت (huis)"},
        {id:2, title:"Kasra — de 'i' klank",               type:"Luisteren", done:false, xp:10, arabic:"بِ — bi", example:"بِنت (meisje)"},
        {id:3, title:"Damma — de 'u' klank",               type:"Luisteren", done:false, xp:10, arabic:"بُ — bu", example:"بُيوت (huizen)"},
        {id:4, title:"Lange klinker Alif — 'aa'",          type:"Quiz",      done:false, xp:15, arabic:"بَا — baa", example:"بَاب (deur)"},
        {id:5, title:"Sukun & Shadda",                     type:"Quiz",      done:false, xp:15, arabic:"بْ / بّ", example:"الشَّمْس (de zon)"},
      ],
      ar:[
        {id:1, title:"الفتحة",                              type:"استماع",   done:true,  xp:10, arabic:"بَ", example:"بَيت"},
        {id:2, title:"الكسرة",                              type:"استماع",   done:false, xp:10, arabic:"بِ", example:"بِنت"},
        {id:3, title:"الضمة",                               type:"استماع",   done:false, xp:10, arabic:"بُ", example:"بُيوت"},
        {id:4, title:"المد بالألف",                         type:"اختبار",   done:false, xp:15, arabic:"بَا", example:"بَاب"},
        {id:5, title:"السكون والشدة",                       type:"اختبار",   done:false, xp:15, arabic:"بْ / بّ", example:"الشَّمْس"},
      ],
      en:[
        {id:1, title:"Fatha — the 'a' sound",               type:"Listen",   done:true,  xp:10, arabic:"بَ — ba", example:"بَيْت (house)"},
        {id:2, title:"Kasra — the 'i' sound",               type:"Listen",   done:false, xp:10, arabic:"بِ — bi", example:"بِنت (girl)"},
        {id:3, title:"Damma — the 'u' sound",               type:"Listen",   done:false, xp:10, arabic:"بُ — bu", example:"بُيوت (houses)"},
        {id:4, title:"Long vowel Alif — 'aa'",              type:"Quiz",     done:false, xp:15, arabic:"بَا — baa", example:"بَاب (door)"},
        {id:5, title:"Sukun & Shadda",                      type:"Quiz",     done:false, xp:15, arabic:"بْ / بّ", example:"الشَّمْس (the sun)"},
      ],
    },
  },
  {
    id:3, icon:"🌿",
    color:"#8B6FD4", glow:"rgba(139,111,212,0.3)",
    nl:{name:"Niveau 3 — Woorden",      desc:"Islamitische en dagelijkse woorden"},
    ar:{name:"المستوى ٣ — الكلمات",    desc:"الكلمات الإسلامية واليومية"},
    en:{name:"Level 3 — Words",         desc:"Islamic & everyday vocabulary"},
    lessons:{
      nl:[
        {id:1, title:"Familie — أسرة",                      type:"Koppelen", done:false, xp:15, arabic:"أُمّ أَب أَخ أُخت", example:"أُمّ = moeder، أَب = vader"},
        {id:2, title:"Lichaamsdelen — جسم",                 type:"Koppelen", done:false, xp:15, arabic:"يَد رَأس عَيْن أُذُن", example:"يَد = hand"},
        {id:3, title:"Kleuren — ألوان",                     type:"Quiz",     done:false, xp:15, arabic:"أَحْمَر أَخْضَر أَزْرَق", example:"أَحْمَر = rood"},
        {id:4, title:"Getallen 1-10 — أرقام",              type:"Spel",     done:false, xp:20, arabic:"١٢٣٤٥٦٧٨٩١٠", example:"وَاحِد اثْنَان ثَلاثَة"},
        {id:5, title:"Islamitische woorden",                type:"Quiz",     done:false, xp:20, arabic:"مَسجد قُرآن صَلاة", example:"مَسجد = moskee"},
        {id:6, title:"Dagelijkse uitdrukkingen",            type:"Luisteren",done:false, xp:20, arabic:"صَبَاح الخَيْر مَرْحَبا", example:"مَرْحَبا = hallo"},
      ],
      ar:[
        {id:1, title:"الأسرة",                               type:"مطابقة",  done:false, xp:15, arabic:"أُمّ أَب أَخ أُخت", example:"أُمّ — أَب"},
        {id:2, title:"أعضاء الجسم",                          type:"مطابقة",  done:false, xp:15, arabic:"يَد رَأس عَيْن أُذُن", example:"يَد — رأس"},
        {id:3, title:"الألوان",                               type:"اختبار",  done:false, xp:15, arabic:"أَحْمَر أَخْضَر أَزْرَق", example:"أَحْمَر"},
        {id:4, title:"الأرقام ١-١٠",                         type:"لعبة",    done:false, xp:20, arabic:"١٢٣٤٥٦٧٨٩١٠", example:"وَاحِد اثْنَان"},
        {id:5, title:"الكلمات الإسلامية",                    type:"اختبار",  done:false, xp:20, arabic:"مَسجد قُرآن صَلاة", example:"مَسجد"},
        {id:6, title:"تعابير يومية",                         type:"استماع",  done:false, xp:20, arabic:"صَبَاح الخَيْر مَرْحَبا", example:"مَرْحَبا"},
      ],
      en:[
        {id:1, title:"Family — أسرة",                        type:"Match",   done:false, xp:15, arabic:"أُمّ أَب أَخ أُخت", example:"أُمّ = mother، أَب = father"},
        {id:2, title:"Body parts — جسم",                    type:"Match",   done:false, xp:15, arabic:"يَد رَأس عَيْن أُذُن", example:"يَد = hand"},
        {id:3, title:"Colours — ألوان",                     type:"Quiz",    done:false, xp:15, arabic:"أَحْمَر أَخْضَر أَزْرَق", example:"أَحْمَر = red"},
        {id:4, title:"Numbers 1-10 — أرقام",                type:"Game",    done:false, xp:20, arabic:"١٢٣٤٥٦٧٨٩١٠", example:"وَاحِد اثْنَان ثَلاثَة"},
        {id:5, title:"Islamic words",                        type:"Quiz",    done:false, xp:20, arabic:"مَسجد قُرآن صَلاة", example:"مَسجد = mosque"},
        {id:6, title:"Daily expressions",                   type:"Listen",  done:false, xp:20, arabic:"صَبَاح الخَيْر مَرْحَبا", example:"مَرْحَبا = hello"},
      ],
    },
  },
  {
    id:4, icon:"🌳",
    color:"#D4845A", glow:"rgba(212,132,90,0.3)",
    nl:{name:"Niveau 4 — Zinnen",       desc:"Eenvoudige Arabische zinnen bouwen"},
    ar:{name:"المستوى ٤ — الجمل",      desc:"بناء جمل عربية بسيطة"},
    en:{name:"Level 4 — Sentences",     desc:"Building simple Arabic sentences"},
    lessons:{
      nl:[
        {id:1, title:"Ik ben — أنا",                        type:"Schrijven", done:false, xp:20, arabic:"أَنَا مُسلم", example:"أَنَا مُسلم = ik ben moslim"},
        {id:2, title:"Dit is — هذا / هذه",                 type:"Quiz",      done:false, xp:20, arabic:"هذا كِتَاب", example:"هذا كِتَاب = dit is een boek"},
        {id:3, title:"Vragen stellen — أسئلة",             type:"Quiz",      done:false, xp:25, arabic:"مَا هذا؟ مَن أنت؟", example:"مَا هذا؟ = wat is dit?"},
        {id:4, title:"Positief & negatief",                 type:"Quiz",      done:false, xp:25, arabic:"نَعَم / لا", example:"نَعَم = ja، لا = nee"},
        {id:5, title:"Samengestelde zinnen",                type:"Schrijven", done:false, xp:30, arabic:"أَنَا أُحِب الإسلام", example:"Ik hou van de Islam"},
      ],
      ar:[
        {id:1, title:"أنا — الجملة الاسمية",               type:"كتابة",     done:false, xp:20, arabic:"أَنَا مُسلم", example:"أَنَا مُسلم"},
        {id:2, title:"هذا / هذه",                           type:"اختبار",   done:false, xp:20, arabic:"هذا كِتَاب", example:"هذا كِتَاب"},
        {id:3, title:"أدوات الاستفهام",                     type:"اختبار",   done:false, xp:25, arabic:"مَا هذا؟ مَن أنت؟", example:"مَا هذا؟"},
        {id:4, title:"الإثبات والنفي",                      type:"اختبار",   done:false, xp:25, arabic:"نَعَم / لا", example:"نَعَم / لا"},
        {id:5, title:"جمل مركّبة",                          type:"كتابة",    done:false, xp:30, arabic:"أَنَا أُحِب الإسلام", example:"أُحِب الإسلام"},
      ],
      en:[
        {id:1, title:"I am — أنا",                           type:"Write",    done:false, xp:20, arabic:"أَنَا مُسلم", example:"أَنَا مُسلم = I am Muslim"},
        {id:2, title:"This is — هذا / هذه",                 type:"Quiz",     done:false, xp:20, arabic:"هذا كِتَاب", example:"هذا كِتَاب = this is a book"},
        {id:3, title:"Asking questions — أسئلة",            type:"Quiz",     done:false, xp:25, arabic:"مَا هذا؟ مَن أنت؟", example:"مَا هذا؟ = what is this?"},
        {id:4, title:"Yes & No — نَعَم / لا",              type:"Quiz",     done:false, xp:25, arabic:"نَعَم / لا", example:"نَعَم = yes، لا = no"},
        {id:5, title:"Compound sentences",                  type:"Write",    done:false, xp:30, arabic:"أَنَا أُحِب الإسلام", example:"I love Islam"},
      ],
    },
  },
  {
    id:5, icon:"🏆",
    color:"#B5820F", glow:"rgba(181,130,15,0.3)",
    nl:{name:"Niveau 5 — Gevorderd",    desc:"Koran-zinnen & islamitisch schrijven"},
    ar:{name:"المستوى ٥ — متقدم",      desc:"عبارات قرآنية والكتابة الإسلامية"},
    en:{name:"Level 5 — Advanced",      desc:"Qur'anic phrases & Islamic writing"},
    lessons:{
      nl:[
        {id:1, title:"Bismillah — volledig",                 type:"Schrijven", done:false, xp:30, arabic:"بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", example:"In de naam van Allah, de Barmhartige"},
        {id:2, title:"Al-Fatiha lezen & schrijven",         type:"Schrijven", done:false, xp:40, arabic:"الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", example:"Alle lof zij Allah, Heer der werelden"},
        {id:3, title:"99 Namen van Allah — deel 1",         type:"Quiz",      done:false, xp:35, arabic:"الرَّحْمَٰن الرَّحِيم الْمَلِك", example:"Ar-Rahman = de Barmhartige"},
        {id:4, title:"Islamitisch schrift kalligrafie",     type:"Activiteit",done:false, xp:40, arabic:"الله", example:"Schoonschrift van Allah"},
        {id:5, title:"Eindtoets — Arabisch niveau 1-5",    type:"Quiz",      done:false, xp:50, arabic:"اختبار نهائي", example:"Alle niveaus"},
      ],
      ar:[
        {id:1, title:"البسملة الكاملة",                     type:"كتابة",    done:false, xp:30, arabic:"بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", example:"بسم الله"},
        {id:2, title:"قراءة الفاتحة وكتابتها",             type:"كتابة",    done:false, xp:40, arabic:"الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", example:"الحمد لله"},
        {id:3, title:"أسماء الله الحسنى — جزء ١",         type:"اختبار",   done:false, xp:35, arabic:"الرَّحْمَٰن الرَّحِيم الْمَلِك", example:"الرحمن"},
        {id:4, title:"الخط العربي",                         type:"نشاط",     done:false, xp:40, arabic:"الله", example:"خط الله"},
        {id:5, title:"الاختبار النهائي — المستويات ١-٥",  type:"اختبار",   done:false, xp:50, arabic:"اختبار نهائي", example:"جميع المستويات"},
      ],
      en:[
        {id:1, title:"Bismillah — full text",               type:"Write",    done:false, xp:30, arabic:"بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", example:"In the name of Allah, the Most Merciful"},
        {id:2, title:"Al-Fatiha — read & write",            type:"Write",    done:false, xp:40, arabic:"الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", example:"All praise is for Allah, Lord of all worlds"},
        {id:3, title:"99 Names of Allah — part 1",          type:"Quiz",     done:false, xp:35, arabic:"الرَّحْمَٰن الرَّحِيم الْمَلِك", example:"Ar-Rahman = the Most Merciful"},
        {id:4, title:"Arabic calligraphy",                  type:"Activity", done:false, xp:40, arabic:"الله", example:"Calligraphy of Allah"},
        {id:5, title:"Final test — Arabic levels 1–5",      type:"Quiz",     done:false, xp:50, arabic:"اختبار نهائي", example:"All levels"},
      ],
    },
  },
];

// ── ARABIC COURSE SCREEN ───────────────────────────────────────────
function ArabicCourseScreen({ t, lang, plan, onLocked, onBack }) {
  const [activeLevel, setActiveLevel] = useState(null);
  const [completedLessons, setCompletedLessons] = useState({});

  const totalXP = Object.values(completedLessons).reduce((a,b)=>a+b,0);
  const totalDone = Object.keys(completedLessons).length;

  if (activeLevel !== null) {
    const level = ARABIC_LEVELS[activeLevel];
    const lessons = level.lessons[lang];
    const doneIds = Object.keys(completedLessons).filter(k=>k.startsWith(`${activeLevel}-`)).map(k=>parseInt(k.split("-")[1]));

    return (
      <div style={{padding:"24px 20px 100px",direction:t.dir,animation:"fadeUp 0.3s ease"}}>
        <button onClick={()=>setActiveLevel(null)} style={{background:"none",border:"none",color:D.gold,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:20}}>
          {lang==="ar"?"→ رجوع":lang==="nl"?"← Terug":"← Back"}
        </button>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:8}}>
          <div style={{width:52,height:52,borderRadius:14,background:`linear-gradient(135deg,${level.color}44,${level.color}22)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,border:`1px solid ${level.color}55`,boxShadow:`0 0 24px ${level.glow}`}}>{level.icon}</div>
          <div>
            <h2 style={{fontFamily:"'Amiri',serif",fontSize:20,color:D.cream,margin:"0 0 2px"}}>{level[lang].name}</h2>
            <p style={{margin:0,fontSize:12,color:D.muted}}>{level[lang].desc}</p>
          </div>
        </div>
        <div style={{height:6,background:D.border,borderRadius:3,marginBottom:20,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${(doneIds.length/lessons.length)*100}%`,background:`linear-gradient(90deg,${level.color},${D.goldLight})`,borderRadius:3,transition:"width 0.5s"}}/>
        </div>
        <div style={{display:"grid",gap:10}}>
          {lessons.map((lesson,i)=>{
            const isDone = doneIds.includes(lesson.id);
            const isLocked = plan==="free" && i>=2;
            return (
              <div key={lesson.id} onClick={isLocked?onLocked:undefined}
                style={{background:D.navyCard,border:`1.5px solid ${isDone?level.color+"77":isLocked?D.border:D.border}`,borderRadius:14,padding:"16px 18px",display:"flex",alignItems:"center",gap:14,boxShadow:isDone?`0 2px 16px ${level.glow}`:"none",opacity:isLocked?0.6:1,cursor:isLocked?"pointer":"default",animation:`fadeUp 0.3s ease ${i*0.05}s both`}}>
                <div style={{width:46,height:46,borderRadius:"50%",background:isDone?`linear-gradient(135deg,${level.color},${level.color}99)`:isLocked?"#DDD":D.navy,display:"flex",alignItems:"center",justifyContent:"center",fontSize:isDone?16:18,flexShrink:0,color:isDone?D.white:D.muted,fontWeight:800}}>
                  {isLocked?"🔒":isDone?"✓":"▷"}
                </div>
                <div style={{flex:1}}>
                  <p style={{margin:0,fontWeight:700,color:D.cream,fontSize:14}}>{lesson.title}</p>
                  <div style={{display:"flex",gap:10,marginTop:4,alignItems:"center"}}>
                    <p style={{margin:0,fontSize:12,color:D.muted}}>{lesson.type}</p>
                    <span style={{fontSize:11,color:D.gold,fontWeight:700}}>+{lesson.xp} XP</span>
                  </div>
                  {/* Arabic preview with speak button */}
                  <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
                    <p style={{margin:0,fontFamily:"'Amiri',serif",fontSize:18,direction:"rtl",color:level.color,lineHeight:1.4,flex:1}}>{lesson.arabic}</p>
                    {!isLocked && <SpeakBtn text={lesson.arabic} lang="ar" size={28}/>}
                  </div>
                  <p style={{margin:"2px 0 0",fontSize:11,color:D.muted,fontStyle:"italic"}}>{lesson.example}</p>
                </div>
                {!isDone && !isLocked && (
                  <button onClick={()=>{ sfx("levelUp"); speak(lesson.arabic,"ar"); setCompletedLessons(prev=>({...prev,[`${activeLevel}-${lesson.id}`]:lesson.xp})); }} className="btn-hover"
                    style={{background:`linear-gradient(135deg,${level.color},${level.color}BB)`,border:"none",borderRadius:10,padding:"8px 16px",color:D.white,fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>
                    {t.start}
                  </button>
                )}
                {isLocked && <span style={{background:`linear-gradient(135deg,${D.gold},${D.goldLight})`,color:D.midnight,fontSize:9,fontWeight:800,padding:"3px 8px",borderRadius:20,flexShrink:0}}>PLUS</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:"24px 20px 100px",direction:t.dir,animation:"fadeUp 0.3s ease"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:D.gold,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:16}}>{t.back}</button>

      {/* Header */}
      <div style={{background:`linear-gradient(135deg,#0A6B48,#0A7B6B)`,borderRadius:20,padding:"24px 22px",marginBottom:20,position:"relative",overflow:"hidden",boxShadow:`0 4px 32px rgba(10,107,72,0.25)`}}>
        <GeomPattern opacity={0.06}/>
        <div style={{position:"relative",zIndex:1}}>
          <p style={{fontSize:10,color:"rgba(255,255,255,0.7)",letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>{lang==="ar"?"دورة اللغة العربية":lang==="nl"?"Arabische Taalcursus":"Arabic Language Course"}</p>
          <h2 style={{fontFamily:"'Amiri',serif",fontSize:28,color:"#fff",margin:"0 0 4px"}}>
            {lang==="ar"?"تعلّم العربية":lang==="nl"?"Leer Arabisch":"Learn Arabic"}
          </h2>
          <p style={{margin:"0 0 16px",fontSize:13,color:"rgba(255,255,255,0.75)"}}>
            {lang==="ar"?"٥ مستويات • ٢٧ درساً • من المبتدئ إلى المتقدم":lang==="nl"?"5 niveaus • 27 lessen • van beginner tot gevorderd":"5 levels • 27 lessons • beginner to advanced"}
          </p>
          <div style={{display:"flex",gap:16}}>
            <div style={{textAlign:"center"}}>
              <p style={{margin:0,fontSize:22,fontWeight:800,color:"#F5D98A"}}>{totalXP}</p>
              <p style={{margin:0,fontSize:11,color:"rgba(255,255,255,0.7)"}}>XP</p>
            </div>
            <div style={{textAlign:"center"}}>
              <p style={{margin:0,fontSize:22,fontWeight:800,color:"#F5D98A"}}>{totalDone}</p>
              <p style={{margin:0,fontSize:11,color:"rgba(255,255,255,0.7)"}}>{lang==="ar"?"مكتمل":lang==="nl"?"voltooid":"completed"}</p>
            </div>
            <div style={{textAlign:"center"}}>
              <p style={{margin:0,fontSize:22,fontWeight:800,color:"#F5D98A"}}>27</p>
              <p style={{margin:0,fontSize:11,color:"rgba(255,255,255,0.7)"}}>{lang==="ar"?"درس":lang==="nl"?"lessen":"lessons"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Level cards */}
      <div style={{display:"grid",gap:12}}>
        {ARABIC_LEVELS.map((level,i)=>{
          const levelDone = Object.keys(completedLessons).filter(k=>k.startsWith(`${i}-`)).length;
          const totalLessons = level.lessons[lang].length;
          const pct = Math.round((levelDone/totalLessons)*100);
          const isLocked = plan==="free" && i>=1;
          return (
            <div key={level.id} onClick={isLocked?onLocked:()=>setActiveLevel(i)} className="card-hover"
              style={{background:D.navyCard,border:`1.5px solid ${pct>0?level.color+"66":D.border}`,borderRadius:18,padding:0,cursor:"pointer",overflow:"hidden",display:"flex",alignItems:"stretch",opacity:isLocked?0.65:1,boxShadow:pct>0?`0 4px 20px ${level.glow}`:"none",animation:`fadeUp 0.4s ease ${i*0.07}s both`}}>
              <div style={{width:72,background:`linear-gradient(135deg,${level.color}44,${level.color}18)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:30,borderRight:`1px solid ${level.color}33`,position:"relative"}}>
                {isLocked && <div style={{position:"absolute",top:6,right:6,fontSize:10}}>🔒</div>}
                {level.icon}
              </div>
              <div style={{flex:1,padding:"14px 16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                  <p style={{fontWeight:800,fontSize:14,color:D.cream,margin:0}}>{level[lang].name}</p>
                  {isLocked
                    ? <span style={{background:`linear-gradient(135deg,${D.gold},${D.goldLight})`,color:D.midnight,fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:20}}>PLUS</span>
                    : <span style={{fontSize:11,color:level.color,fontWeight:700}}>{levelDone}/{totalLessons}</span>
                  }
                </div>
                <p style={{margin:"0 0 8px",fontSize:12,color:D.muted}}>{level[lang].desc}</p>
                <div style={{height:4,background:D.border,borderRadius:2,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${level.color},${D.goldLight})`,borderRadius:2,transition:"width 0.5s"}}/>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",padding:"0 14px"}}>
                <span style={{color:D.border,fontSize:18}}>{t.dir==="rtl"?"‹":"›"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  KIDS MODE — age 4–7, big visuals, playful, simple
// ═══════════════════════════════════════════════════════════════════
const KIDS_LESSONS = [
  { id:"k1", emoji:"🌟", color:"#E8A020", bg:"linear-gradient(135deg,#F5C842,#E8A020)",
    nl:{title:"Bismillah",      desc:"Leer de eerste smeekbede"},
    ar:{title:"بسم الله",       desc:"تعلّم أول دعاء"},
    en:{title:"Bismillah",      desc:"Learn the first du'a"},
    arabic:"بِسْمِ اللَّهِ", translit:"Bismillah",
    nl_meaning:"In de naam van Allah", en_meaning:"In the name of Allah",
    fun_nl:"Zeg dit voor je gaat eten! 🍽️", fun_en:"Say this before you eat! 🍽️", fun_ar:"قلها قبل الأكل! 🍽️",
  },
  { id:"k2", emoji:"🌙", color:"#8B6FD4", bg:"linear-gradient(135deg,#B09AE8,#8B6FD4)",
    nl:{title:"Alif ا",         desc:"Eerste Arabische letter"},
    ar:{title:"الألف",          desc:"أول حرف عربي"},
    en:{title:"Alif ا",         desc:"First Arabic letter"},
    arabic:"ا", translit:"Alif",
    nl_meaning:"De eerste letter — zoals A in ons alfabet!", en_meaning:"The first letter — like A in our alphabet!", ar:{title:"الألف", desc:"أول حرف عربي"},
    fun_nl:"أسد = leeuw 🦁", fun_en:"أسد = lion 🦁", fun_ar:"أسد = أسد 🦁",
  },
  { id:"k3", emoji:"🕌", color:"#0A6B48", bg:"linear-gradient(135deg,#14A876,#0A6B48)",
    nl:{title:"Vijf Gebeden",   desc:"De vijf dagelijkse gebeden"},
    ar:{title:"الصلوات الخمس",  desc:"الصلوات اليومية الخمس"},
    en:{title:"Five Prayers",   desc:"The five daily prayers"},
    arabic:"صَلاة", translit:"Salah",
    nl_meaning:"We bidden 5 keer per dag! 🤲", en_meaning:"We pray 5 times a day! 🤲", fun_ar:"نصلي ٥ مرات يومياً! 🤲",
    fun_nl:"Fajr ☀️ Dhuhr 🌤️ Asr ☁️ Maghrib 🌇 Isha 🌙", fun_en:"Fajr ☀️ Dhuhr 🌤️ Asr ☁️ Maghrib 🌇 Isha 🌙", fun_ar_extra:"الفجر ☀️ الظهر 🌤️ العصر ☁️ المغرب 🌇 العشاء 🌙",
  },
  { id:"k4", emoji:"📖", color:"#B5820F", bg:"linear-gradient(135deg,#D4A017,#B5820F)",
    nl:{title:"Al-Fatiha",      desc:"De opening van de Koran"},
    ar:{title:"الفاتحة",        desc:"فاتحة الكتاب"},
    en:{title:"Al-Fatiha",      desc:"The opening of the Qur'an"},
    arabic:"الْحَمْدُ لِلَّهِ", translit:"Alhamdulillah",
    nl_meaning:"Alle lof zij Allah — eerste vers", en_meaning:"All praise is for Allah — first verse", ar_meaning:"الحمد لله — الآية الأولى",
    fun_nl:"Dit is de meest gelezen soera! 🌟", fun_en:"This is the most recited surah! 🌟", fun_ar:"هذه أكثر سورة تُقرأ! 🌟",
  },
  { id:"k5", emoji:"🤲", color:"#0A7B6B", bg:"linear-gradient(135deg,#14B8A6,#0A7B6B)",
    nl:{title:"Alhamdulillah",  desc:"Dankbaarheid aan Allah"},
    ar:{title:"الحمد لله",      desc:"الشكر لله"},
    en:{title:"Alhamdulillah",  desc:"Gratitude to Allah"},
    arabic:"الحَمْدُ لِلَّهِ", translit:"Alhamdulillah",
    nl_meaning:"Alle lof zij Allah!", en_meaning:"All praise is for Allah!", ar_meaning:"الحمد لله!",
    fun_nl:"Zeg dit na het eten 🍎 en bij mooie dingen!", fun_en:"Say this after eating 🍎 and when things are good!", fun_ar:"قلها بعد الأكل 🍎 وعند الجميل!",
  },
  { id:"k6", emoji:"💛", color:"#D4845A", bg:"linear-gradient(135deg,#F0A070,#D4845A)",
    nl:{title:"Aardig zijn",    desc:"Islamitische manieren voor kinderen"},
    ar:{title:"أكن لطيفاً",    desc:"الآداب الإسلامية للأطفال"},
    en:{title:"Being kind",     desc:"Islamic manners for children"},
    arabic:"رَحمَة", translit:"Rahmah",
    nl_meaning:"Vriendelijkheid = Rahmah", en_meaning:"Kindness = Rahmah", ar_meaning:"اللطف = رحمة",
    fun_nl:"Wees aardig voor je vrienden, ouders en dieren! 💛", fun_en:"Be kind to friends, parents and animals! 💛", fun_ar:"كن لطيفاً مع أصدقائك وأهلك والحيوانات! 💛",
  },
];

function KidsModeScreen({ lang, plan, onLocked, onBack }) {
  const [activeCard, setActiveCard] = useState(null);
  const [stars, setStars] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const celebrate = (id) => {
    setStars(p=>[...new Set([...p,id])]);
    setShowConfetti(true);
    setTimeout(()=>setShowConfetti(false),2000);
  };

  const title    = lang==="ar"?"وضع الأطفال 🌟":lang==="nl"?"Kindermodus 🌟":"Kids Mode 🌟";
  const subtitle = lang==="ar"?"للأطفال من ٤ إلى ٧ سنوات":lang==="nl"?"Voor kinderen van 4-7 jaar":"For children aged 4–7";
  const backBtn  = lang==="ar"?"→ رجوع":lang==="nl"?"← Terug":"← Back";

  if (activeCard !== null) {
    const lesson = KIDS_LESSONS[activeCard];
    const earned = stars.includes(lesson.id);
    const meaning = lesson[`${lang}_meaning`] || lesson.en_meaning;
    const fun = lesson[`fun_${lang}`] || lesson.fun_en;

    // Auto-speak Arabic when card opens
    useEffect(() => { speak(lesson.arabic, "ar"); }, [activeCard]);

    return (
      <div style={{padding:"24px 20px 100px",animation:"scaleIn 0.35s ease",minHeight:"100vh",background:D.midnight}}>
        <GS/>
        {showConfetti && (
          <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",fontSize:60,animation:"fadeIn 0.2s ease"}}>
            🎉🌟✨🎊⭐
          </div>
        )}
        <button onClick={()=>{ sfx("click"); setActiveCard(null); }} style={{background:"none",border:"none",color:D.gold,fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:20}}>{backBtn}</button>

        {/* Big emoji */}
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:80,animation:"floatY 3s ease-in-out infinite",marginBottom:12}}>{lesson.emoji}</div>
          <h2 style={{fontFamily:"'Amiri',serif",fontSize:32,color:D.cream,margin:"0 0 6px"}}>{lesson[lang]?.title || lesson.en.title}</h2>
          <p style={{fontSize:15,color:D.muted}}>{lesson[lang]?.desc || lesson.en.desc}</p>
        </div>

        {/* Big Arabic card with speak button */}
        <div style={{background:`linear-gradient(135deg,${lesson.color}22,${lesson.color}11)`,border:`2px solid ${lesson.color}66`,borderRadius:24,padding:"30px 24px",textAlign:"center",marginBottom:16,boxShadow:`0 8px 40px ${lesson.color}22`}}>
          <p style={{fontFamily:"'Amiri',serif",fontSize:56,direction:"rtl",color:D.cream,lineHeight:1.4,marginBottom:12}}>{lesson.arabic}</p>
          <p style={{fontSize:20,color:lesson.color,fontWeight:700,marginBottom:6}}>{lesson.translit}</p>
          <p style={{fontSize:16,color:D.parchment,marginBottom:16}}>{meaning}</p>
          {/* Big speak button for kids */}
          <button onClick={()=>{ sfx("tap"); speak(lesson.arabic,"ar"); }}
            style={{background:`linear-gradient(135deg,${lesson.color},${lesson.color}BB)`,border:"none",borderRadius:50,padding:"14px 28px",color:"#fff",fontSize:18,fontWeight:800,cursor:"pointer",fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:10,boxShadow:`0 4px 20px ${lesson.color}44`}}>
            🔊 {lang==="ar"?"استمع":lang==="nl"?"Luisteren":"Listen"}
          </button>
        </div>

        {/* Fun fact */}
        <div style={{background:D.navyCard,border:`1px solid ${D.border}`,borderRadius:18,padding:"18px 20px",marginBottom:20,textAlign:"center"}}>
          <p style={{fontSize:16,color:D.cream,lineHeight:1.7}}>{fun}</p>
          {/* Speak translation */}
          <button onClick={()=>speak(meaning, lang)} style={{marginTop:10,background:`${lesson.color}18`,border:`1px solid ${lesson.color}44`,borderRadius:8,padding:"6px 16px",color:lesson.color,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            🔈 {lang==="ar"?"استمع للترجمة":lang==="nl"?"Vertaling horen":"Hear translation"}
          </button>
        </div>

        {/* Big star button */}
        {!earned ? (
          <button onClick={()=>{ sfx("celebrate"); celebrate(lesson.id); speak(lang==="ar"?"ممتاز! حصلت على النجمة":lang==="nl"?"Super! Je hebt de ster":"Super! You got the star", lang); }} className="btn-hover"
            style={{width:"100%",padding:"20px",borderRadius:18,background:lesson.bg,border:"none",color:D.white,fontSize:20,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 6px 32px ${lesson.color}44`,display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
            <span style={{fontSize:28}}>⭐</span>
            {lang==="ar"?"حصلت عليها!":lang==="nl"?"Ik heb het!":"I got it!"}
            <span style={{fontSize:28}}>⭐</span>
          </button>
        ) : (
          <div style={{background:`linear-gradient(135deg,${D.gold}22,${D.gold}11)`,border:`2px solid ${D.gold}`,borderRadius:18,padding:"20px",textAlign:"center"}}>
            <p style={{fontSize:24,margin:"0 0 4px"}}>🌟🌟🌟</p>
            <p style={{fontWeight:800,color:D.gold,fontSize:18}}>{lang==="ar"?"ممتاز! حصلت على النجمة!":lang==="nl"?"Super! Je hebt de ster!":"Super! You got the star!"}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{padding:"24px 20px 100px",animation:"fadeUp 0.3s ease"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:D.gold,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:16}}>{backBtn}</button>

      {/* Header */}
      <div style={{background:`linear-gradient(135deg,#F5C842,#E8A020)`,borderRadius:20,padding:"22px 22px",marginBottom:20,position:"relative",overflow:"hidden",textAlign:"center"}}>
        <GeomPattern opacity={0.06}/>
        <div style={{position:"relative",zIndex:1}}>
          <p style={{fontFamily:"'Amiri',serif",fontSize:30,color:D.midnight,margin:"0 0 4px",fontWeight:700}}>{title}</p>
          <p style={{fontSize:13,color:"rgba(0,0,0,0.6)",margin:"0 0 12px"}}>{subtitle}</p>
          <div style={{display:"flex",justifyContent:"center",gap:6}}>
            {KIDS_LESSONS.map(l=>(
              <span key={l.id} style={{fontSize:20}}>{stars.includes(l.id)?"⭐":"☆"}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Lesson grid — big friendly cards */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {KIDS_LESSONS.map((lesson,i)=>{
          const earned = stars.includes(lesson.id);
          const isLocked = plan==="free" && i>=2;
          return (
            <div key={lesson.id} onClick={isLocked?onLocked:()=>{ sfx("tap"); setActiveCard(i); }} className="card-hover"
              style={{background:earned?lesson.bg:D.navyCard,border:`2px solid ${earned?lesson.color:isLocked?D.border:lesson.color+"44"}`,borderRadius:20,padding:"22px 16px",textAlign:"center",cursor:"pointer",opacity:isLocked?0.65:1,position:"relative",boxShadow:earned?`0 6px 28px ${lesson.color}33`:"none",animation:`scaleIn 0.4s ease ${i*0.08}s both`}}>
              {isLocked && <div style={{position:"absolute",top:8,right:8,background:`linear-gradient(135deg,${D.gold},${D.goldLight})`,color:D.midnight,fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:20}}>PLUS</div>}
              {earned && <div style={{position:"absolute",top:8,left:8,fontSize:16}}>⭐</div>}
              <div style={{fontSize:44,marginBottom:10,animation:earned?"floatY 3s ease-in-out infinite":undefined}}>{lesson.emoji}</div>
              <p style={{fontFamily:"'Amiri',serif",fontSize:22,direction:"rtl",color:earned?D.midnight:D.cream,marginBottom:4,lineHeight:1.3}}>{lesson.arabic}</p>
              <p style={{fontWeight:800,fontSize:14,color:earned?D.midnight:D.cream,marginBottom:2}}>{lesson[lang]?.title || lesson.en.title}</p>
              <p style={{fontSize:11,color:earned?"rgba(0,0,0,0.6)":D.muted}}>{lesson[lang]?.desc || lesson.en.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Encouragement */}
      <div style={{marginTop:20,background:D.navyCard,border:`1px solid ${D.gold}33`,borderRadius:16,padding:"16px 20px",textAlign:"center"}}>
        <p style={{fontSize:20,marginBottom:4}}>✨</p>
        <p style={{fontSize:13,color:D.muted,lineHeight:1.6}}>
          {lang==="ar"?"كل نجمة تقربك من الجنة! استمر يا بطل 🦁":lang==="nl"?"Elke ster brengt je dichter bij Allah! Ga zo door, held! 🦁":"Every star brings you closer to Allah! Keep going, hero! 🦁"}
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  LANDING PAGE
// ═══════════════════════════════════════════════════════════════════
function LandingPage({ onGetStarted, onLogin, lang, setLang }) {
  const t = LANGS[lang];
  const [activeFaq, setActiveFaq] = useState(null);

  const features = [
    { icon:"📖", nl:"Koran & Tajweed",       ar:"القرآن والتجويد",     en:"Qur'an & Tajweed",      desc_nl:"Luister, lees en memoriseer met begeleiding", desc_ar:"استمع واقرأ واحفظ مع التوجيه", desc_en:"Listen, read & memorise with guidance" },
    { icon:"✍️", nl:"Arabische Taal",         ar:"اللغة العربية",       en:"Arabic Language",        desc_nl:"Van letters tot complete zinnen", desc_ar:"من الحروف إلى الجمل الكاملة", desc_en:"From letters to full sentences" },
    { icon:"🌙", nl:"Siera & Geschiedenis",   ar:"السيرة والتاريخ",     en:"Seerah & History",       desc_nl:"Verhalen van de Profeet ﷺ en sahaba", desc_ar:"قصص النبي ﷺ والصحابة", desc_en:"Stories of the Prophet ﷺ and sahaba" },
    { icon:"💛", nl:"Akhlaq & Karakter",      ar:"الأخلاق والشخصية",   en:"Akhlaq & Character",     desc_nl:"Islamitische waarden en normen", desc_ar:"القيم والمبادئ الإسلامية", desc_en:"Islamic values and manners" },
    { icon:"🕌", nl:"Fiqh & Gebed",           ar:"الفقه والصلاة",       en:"Fiqh & Prayer",          desc_nl:"Wudu, Salah en dagelijkse aanbidding", desc_ar:"الوضوء والصلاة والعبادات اليومية", desc_en:"Wudu, Salah & daily worship" },
    { icon:"🔢", nl:"Rekenen (Islamitisch)",  ar:"الرياضيات الإسلامية", en:"Math (Islamic context)", desc_nl:"Getallen via zakat, tasbih en meer", desc_ar:"الأعداد عبر الزكاة والتسبيح", desc_en:"Numbers via zakat, tasbih & more" },
  ];

  const testimonials = [
    { name:"Fatima A.", city:lang==="ar"?"أنتويرب":lang==="nl"?"Antwerpen":"Antwerp", text:lang==="ar"?"«أطفالي يحبون التعلم الآن! القرآن والأخلاق في مكان واحد رائع»":lang==="nl"?'"Mijn kinderen leren nu met plezier! Koran en akhlaq op één plek."':'"My children love learning now! Qur\'an and akhlaq in one place."', stars:5 },
    { name:"Youssef M.", city:lang==="ar"?"روتردام":lang==="nl"?"Rotterdam":"Rotterdam", text:lang==="ar"?"«أفضل تطبيق إسلامي للأطفال. واجهة جميلة وسهلة الاستخدام»":lang==="nl"?'"De beste islamitische app voor kinderen. Mooie interface en makkelijk te gebruiken."':'"Best Islamic app for kids. Beautiful and easy to use."', stars:5 },
    { name:"Nadia K.", city:lang==="ar"?"بروكسل":lang==="nl"?"Brussel":"Brussels", text:lang==="ar"?"«الآباء يحبون لوحة التحكم والتقارير الأسبوعية. رائع!»":lang==="nl"?'"Als ouder hou ik van het dashboard en de wekelijkse rapporten."':'"As a parent I love the dashboard and weekly reports."', stars:5 },
  ];

  const faqs = [
    { q: lang==="ar"?"هل يمكنني الإلغاء في أي وقت؟":lang==="nl"?"Kan ik op elk moment opzeggen?":"Can I cancel at any time?",
      a: lang==="ar"?"نعم، يمكنك الإلغاء في أي وقت بدون رسوم إضافية.":lang==="nl"?"Ja, je kan op elk moment opzeggen zonder extra kosten.":"Yes, cancel anytime with no extra charges." },
    { q: lang==="ar"?"كم عدد الأطفال الذين يمكنني إضافتهم؟":lang==="nl"?"Hoeveel kinderen kan ik toevoegen?":"How many children can I add?",
      a: lang==="ar"?"في الخطة المجانية طفل واحد، وفي نور بلس حتى ٥ أطفال.":lang==="nl"?"In het gratis plan 1 kind, in Noor Plus tot 5 kinderen.":"Free plan: 1 child. Noor Plus: up to 5 children." },
    { q: lang==="ar"?"هل التطبيق مناسب للأطفال الصغار؟":lang==="nl"?"Is de app geschikt voor jonge kinderen?":"Is the app suitable for young children?",
      a: lang==="ar"?"نعم، مصمم للأطفال من ٤ إلى ١٢ سنة.":lang==="nl"?"Ja, ontworpen voor kinderen van 4 tot 12 jaar.":"Yes, designed for children aged 4 to 12." },
    { q: lang==="ar"?"هل هناك نسخة تجريبية مجانية؟":lang==="nl"?"Is er een gratis proefperiode?":"Is there a free trial?",
      a: lang==="ar"?"نعم، ١٤ يوماً مجاناً لنور بلس بدون بطاقة ائتمان.":lang==="nl"?"Ja, 14 dagen gratis Noor Plus, geen creditcard nodig.":"Yes, 14 days free Noor Plus, no credit card needed." },
  ];

  const heroTitle    = lang==="ar"?"تعلّم الإسلام بطريقة ممتعة":lang==="nl"?"Leer de Islam op een leuke manier":"Learn Islam in a fun way";
  const heroSub      = lang==="ar"?"منصة تعليمية إسلامية شاملة للأطفال من ٤ إلى ١٢ سنة — بالعربية والهولندية والإنجليزية":lang==="nl"?"Het complete islamitische leerplatform voor kinderen van 4-12 jaar — in het Nederlands, Arabisch en Engels":"The complete Islamic learning platform for children aged 4–12 — in Dutch, Arabic and English";
  const ctaFree      = lang==="ar"?"ابدأ مجاناً":lang==="nl"?"Gratis beginnen":"Start for free";
  const ctaPlus      = lang==="ar"?"جرّب نور بلس":lang==="nl"?"Probeer Noor Plus":"Try Noor Plus";
  const featTitle    = lang==="ar"?"كل ما يحتاجه طفلك":lang==="nl"?"Alles wat jouw kind nodig heeft":"Everything your child needs";
  const planTitle    = lang==="ar"?"خطط بسيطة وواضحة":lang==="nl"?"Eenvoudige plannen":"Simple, clear plans";
  const faqTitle     = lang==="ar"?"الأسئلة الشائعة":lang==="nl"?"Veelgestelde vragen":"Frequently asked questions";
  const reviewTitle  = lang==="ar"?"ماذا يقول الآباء":lang==="nl"?"Wat ouders zeggen":"What parents say";
  const loginLink    = lang==="ar"?"لديك حساب؟ سجّل الدخول":lang==="nl"?"Al een account? Inloggen":"Already have an account? Sign in";
  const freeLabel    = lang==="ar"?"مجاني":lang==="nl"?"Gratis":"Free";
  const plusLabel    = lang==="ar"?"نور بلس":lang==="nl"?"Noor Plus":"Noor Plus";
  const trialNote    = lang==="ar"?"١٤ يوماً مجاناً — بدون بطاقة ائتمان":lang==="nl"?"14 dagen gratis — geen creditcard":"14 days free — no card needed";
  const popular      = lang==="ar"?"الأشهر":lang==="nl"?"Populairst":"Most popular";

  return (
    <div style={{minHeight:"100vh",background:D.midnight,fontFamily:"'Tajawal',sans-serif",direction:t.dir}}>
      <GS/>

      {/* ── NAV ── */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:`${D.deep}EE`,borderBottom:`1px solid ${D.border}`,backdropFilter:"blur(12px)",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:60}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Crescent size={28} color={D.gold}/>
          <span className="gold-text" style={{fontFamily:"'Amiri',serif",fontSize:22,fontWeight:700}}>Noor Academy</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {/* Lang */}
          <div style={{display:"flex",gap:3,background:D.navy,borderRadius:20,padding:3,border:`1px solid ${D.border}`}}>
            {Object.entries(LANGS).map(([code,v])=>(
              <button key={code} onClick={()=>setLang(code)} style={{background:lang===code?D.gold:"transparent",border:"none",borderRadius:16,padding:"4px 8px",cursor:"pointer",color:lang===code?D.midnight:D.muted,fontSize:11,fontWeight:lang===code?800:400,transition:"all 0.2s",fontFamily:"inherit"}}>{v.flag} {v.label}</button>
            ))}
          </div>
          <button onClick={onLogin} style={{background:"none",border:`1.5px solid ${D.border}`,borderRadius:10,padding:"8px 16px",color:D.parchment,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{lang==="ar"?"دخول":lang==="nl"?"Inloggen":"Sign in"}</button>
          <button onClick={()=>onGetStarted("plus")} className="btn-hover" style={{background:`linear-gradient(135deg,${D.gold},${D.goldLight})`,border:"none",borderRadius:10,padding:"8px 18px",color:D.midnight,fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{ctaFree}</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{position:"relative",overflow:"hidden",padding:"80px 24px 90px",textAlign:"center"}}>
        <GeomPattern opacity={0.05}/>
        {/* Glow */}
        <div style={{position:"absolute",width:500,height:500,borderRadius:"50%",background:`radial-gradient(circle,${D.gold}14 0%,transparent 70%)`,top:"50%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:1,maxWidth:680,margin:"0 auto"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:D.navy,border:`1px solid ${D.gold}44`,borderRadius:30,padding:"6px 16px",marginBottom:24,animation:"fadeUp 0.5s ease"}}>
            <span style={{fontSize:12}}>✦</span>
            <span style={{fontSize:12,color:D.gold,fontWeight:700,letterSpacing:0.5}}>{lang==="ar"?"منصة إسلامية متعددة اللغات":lang==="nl"?"Meertalig islamitisch leerplatform":"Multilingual Islamic learning platform"}</span>
            <span style={{fontSize:12}}>✦</span>
          </div>
          <div style={{animation:"floatY 4s ease-in-out infinite",marginBottom:20}}>
            <Crescent size={64} color={D.gold}/>
          </div>
          <h1 style={{fontFamily:"'Amiri',serif",fontSize:"clamp(32px,6vw,56px)",color:D.cream,lineHeight:1.2,marginBottom:16,animation:"fadeUp 0.5s ease 0.1s both"}}>{heroTitle}</h1>
          <p style={{fontSize:"clamp(14px,2vw,17px)",color:D.muted,lineHeight:1.7,marginBottom:36,maxWidth:560,margin:"0 auto 36px",animation:"fadeUp 0.5s ease 0.2s both"}}>{heroSub}</p>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",animation:"fadeUp 0.5s ease 0.3s both"}}>
            <button onClick={()=>onGetStarted("free")} className="btn-hover" style={{background:`linear-gradient(135deg,${D.gold},${D.goldLight})`,border:"none",borderRadius:12,padding:"14px 28px",color:D.midnight,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 6px 28px ${D.gold}44`}}>{ctaFree}</button>
            <button onClick={()=>onGetStarted("plus")} className="btn-hover" style={{background:"transparent",border:`2px solid ${D.emeraldLt}`,borderRadius:12,padding:"14px 28px",color:D.emeraldLt,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{ctaPlus} — {trialNote}</button>
          </div>
          {/* Social proof */}
          <div style={{marginTop:32,display:"flex",alignItems:"center",justifyContent:"center",gap:6,animation:"fadeUp 0.5s ease 0.4s both"}}>
            <div style={{display:"flex",marginRight:4}}>
              {["🟤","🟡","🟢","🔵","🟣"].map((c,i)=>(
                <div key={i} style={{width:28,height:28,borderRadius:"50%",background:D.navy,border:`2px solid ${D.border}`,marginLeft:i>0?-8:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{["👦","👧","👦","👧","👦"][i]}</div>
              ))}
            </div>
            <span style={{fontSize:13,color:D.muted}}>{"★★★★★"} <strong style={{color:D.cream}}>{lang==="ar"?"+١٠٬٠٠٠ طفل":lang==="nl"?"+10.000 kinderen":"+10,000 children"}</strong></span>
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div style={{padding:"60px 24px",background:D.deep}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <h2 style={{fontFamily:"'Amiri',serif",fontSize:"clamp(24px,4vw,36px)",color:D.cream,textAlign:"center",marginBottom:8}}>{featTitle}</h2>
          <p style={{textAlign:"center",color:D.muted,fontSize:14,marginBottom:32}}>{lang==="ar"?"٦ مواد + دورة عربية كاملة + وضع الأطفال":lang==="nl"?"6 vakken + volledige Arabische cursus + Kindermodus":"6 subjects + full Arabic course + Kids Mode"}</p>

          {/* Arabic Course & Kids Mode highlight */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:32}}>
            <div style={{background:`linear-gradient(135deg,${D.emerald}22,${D.emerald}11)`,border:`2px solid ${D.emerald}55`,borderRadius:18,padding:"22px 18px",position:"relative",overflow:"hidden"}}>
              <GeomPattern opacity={0.04}/>
              <div style={{position:"relative",zIndex:1}}>
                <div style={{fontSize:36,marginBottom:10}}>✍️</div>
                <p style={{fontWeight:800,fontSize:16,color:D.cream,marginBottom:6}}>{lang==="ar"?"دورة العربية الكاملة":lang==="nl"?"Volledige Arabische Cursus":"Full Arabic Course"}</p>
                <p style={{fontSize:12,color:D.muted,lineHeight:1.6,marginBottom:10}}>{lang==="ar"?"٥ مستويات من الحروف إلى الكتابة القرآنية":lang==="nl"?"5 niveaus van letters tot koranschrift":"5 levels from letters to Qur'anic writing"}</p>
                {["🌱","💧","🌿","🌳","🏆"].map((ic,i)=>(
                  <span key={i} style={{fontSize:16,marginRight:4}}>{ic}</span>
                ))}
              </div>
            </div>
            <div style={{background:`linear-gradient(135deg,#E8A02022,#E8A02011)`,border:`2px solid #E8A02055`,borderRadius:18,padding:"22px 18px",position:"relative",overflow:"hidden"}}>
              <GeomPattern opacity={0.04}/>
              <div style={{position:"relative",zIndex:1}}>
                <div style={{fontSize:36,marginBottom:10}}>👶</div>
                <p style={{fontWeight:800,fontSize:16,color:D.cream,marginBottom:6}}>{lang==="ar"?"وضع الأطفال":lang==="nl"?"Kindermodus":"Kids Mode"}</p>
                <p style={{fontSize:12,color:D.muted,lineHeight:1.6,marginBottom:10}}>{lang==="ar"?"مصمم للأطفال من ٤ إلى ٧ سنوات — بطاقات كبيرة وألعاب":lang==="nl"?"Speciaal voor 4-7 jaar — grote kaarten en spelletjes":"Designed for ages 4–7 — big cards & games"}</p>
                <div style={{display:"flex",gap:4}}>
                  {["⭐","⭐","⭐","⭐","⭐","⭐"].map((s,i)=>(
                    <span key={i} style={{fontSize:14}}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16}}>
            {features.map((f,i)=>(
              <div key={i} className="card-hover" style={{background:D.navyCard,border:`1px solid ${D.border}`,borderRadius:16,padding:"22px 20px",animation:`fadeUp 0.5s ease ${i*0.07}s both`}}>
                <div style={{fontSize:32,marginBottom:12}}>{f.icon}</div>
                <p style={{fontWeight:800,fontSize:16,color:D.cream,marginBottom:6}}>{f[`${lang==="en"?"en":lang==="ar"?"ar":"nl"}`]}</p>
                <p style={{fontSize:13,color:D.muted,lineHeight:1.6}}>{f[`desc_${lang==="en"?"en":lang==="ar"?"ar":"nl"}`]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRICING ── */}
      <div style={{padding:"60px 24px",background:D.midnight}}>
        <div style={{maxWidth:700,margin:"0 auto"}}>
          <h2 style={{fontFamily:"'Amiri',serif",fontSize:"clamp(24px,4vw,36px)",color:D.cream,textAlign:"center",marginBottom:44}}>{planTitle}</h2>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            {/* Free */}
            <div style={{background:D.navyCard,border:`1.5px solid ${D.border}`,borderRadius:20,padding:"28px 22px"}}>
              <p style={{fontWeight:800,fontSize:22,color:D.cream,marginBottom:4}}>{freeLabel}</p>
              <p style={{fontSize:28,fontWeight:800,color:D.emeraldLt,marginBottom:20}}>€0<span style={{fontSize:14,fontWeight:400,color:D.muted}}>/{lang==="ar"?"شهر":lang==="nl"?"maand":"month"}</span></p>
              {["📖 2 "+( lang==="ar"?"مواد":lang==="nl"?"vakken":"subjects"),"🌙 3 "+(lang==="ar"?"سور":lang==="nl"?"surahs":"surahs"),"🤲 "+(lang==="ar"?"أدعية يومية":lang==="nl"?"Dagelijkse du'as":"Daily du'as"),"👶 1 "+(lang==="ar"?"طفل":lang==="nl"?"kind":"child")].map((f,i)=>(
                <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:10}}>
                  <span style={{color:D.emeraldLt,fontSize:13,marginTop:2}}>✓</span>
                  <span style={{fontSize:13,color:D.muted}}>{f}</span>
                </div>
              ))}
              <button onClick={()=>onGetStarted("free")} className="btn-hover" style={{width:"100%",marginTop:20,padding:"13px",borderRadius:10,background:"transparent",border:`2px solid ${D.border}`,color:D.parchment,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{ctaFree}</button>
            </div>
            {/* Plus */}
            <div style={{background:`linear-gradient(145deg,${D.navy},#EDE0C0)`,border:`2px solid ${D.gold}`,borderRadius:20,padding:"28px 22px",position:"relative",boxShadow:`0 8px 40px ${D.gold}22`}}>
              <GeomPattern opacity={0.04}/>
              <div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:`linear-gradient(135deg,${D.gold},${D.goldLight})`,color:D.midnight,fontSize:11,fontWeight:800,padding:"4px 16px",borderRadius:20,whiteSpace:"nowrap"}}>{popular} ⭐</div>
              <div style={{position:"relative",zIndex:1}}>
                <p style={{fontWeight:800,fontSize:22,color:D.cream,marginBottom:4}}>{plusLabel}</p>
                <p style={{fontSize:28,fontWeight:800,color:D.gold,marginBottom:4}}>€4,99<span style={{fontSize:14,fontWeight:400,color:D.muted}}>/{lang==="ar"?"شهر":lang==="nl"?"maand":"month"}</span></p>
                <p style={{fontSize:11,color:D.emeraldLt,fontWeight:700,marginBottom:16}}>✓ {trialNote}</p>
                {(lang==="ar"?["📖 جميع المواد الـ٦","🏅 جميع الشارات","👨‍👩‍👧 حتى ٥ أطفال","📊 تقرير أسبوعي للوالدين","🎯 اختبارات غير محدودة","✍️ دروس اللغة العربية"]:lang==="nl"?["📖 Alle 6 vakken","🏅 Alle badges","👨‍👩‍👧 Tot 5 kinderen","📊 Wekelijks ouderrapport","🎯 Onbeperkte quizzen","✍️ Arabische lessen"]:["📖 All 6 subjects","🏅 All badges","👨‍👩‍👧 Up to 5 children","📊 Weekly parent report","🎯 Unlimited quizzes","✍️ Arabic lessons"]).map((f,i)=>(
                  <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:10}}>
                    <span style={{color:D.gold,fontSize:13,marginTop:2}}>✦</span>
                    <span style={{fontSize:13,color:D.parchment}}>{f}</span>
                  </div>
                ))}
                <button onClick={()=>onGetStarted("plus")} className="btn-hover" style={{width:"100%",marginTop:20,padding:"13px",borderRadius:10,background:`linear-gradient(135deg,${D.gold},${D.goldLight})`,border:"none",color:D.midnight,fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 20px ${D.gold}44`}}>{ctaPlus}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <div style={{padding:"60px 24px",background:D.deep}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <h2 style={{fontFamily:"'Amiri',serif",fontSize:"clamp(22px,4vw,34px)",color:D.cream,textAlign:"center",marginBottom:36}}>{reviewTitle}</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>
            {testimonials.map((r,i)=>(
              <div key={i} className="card-hover" style={{background:D.navyCard,border:`1px solid ${D.border}`,borderRadius:16,padding:"22px 20px"}}>
                <p style={{color:D.gold,fontSize:16,marginBottom:10}}>{"★".repeat(r.stars)}</p>
                <p style={{fontSize:13,color:D.muted,lineHeight:1.7,marginBottom:14,fontStyle:"italic"}}>{r.text}</p>
                <p style={{fontSize:13,fontWeight:700,color:D.parchment}}>{r.name} · {r.city}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div style={{padding:"60px 24px",background:D.midnight}}>
        <div style={{maxWidth:640,margin:"0 auto"}}>
          <h2 style={{fontFamily:"'Amiri',serif",fontSize:"clamp(22px,4vw,34px)",color:D.cream,textAlign:"center",marginBottom:32}}>{faqTitle}</h2>
          <div style={{display:"grid",gap:10}}>
            {faqs.map((f,i)=>(
              <div key={i} onClick={()=>setActiveFaq(activeFaq===i?null:i)} style={{background:D.navyCard,border:`1px solid ${activeFaq===i?D.gold+"66":D.border}`,borderRadius:14,padding:"18px 20px",cursor:"pointer",transition:"all 0.25s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
                  <p style={{fontWeight:700,fontSize:14,color:D.cream,margin:0}}>{f.q}</p>
                  <span style={{color:D.gold,fontSize:18,flexShrink:0,transition:"transform 0.3s",transform:activeFaq===i?"rotate(45deg)":"rotate(0deg)"}}>{activeFaq===i?"✕":"+"}</span>
                </div>
                {activeFaq===i && <p style={{margin:"12px 0 0",fontSize:13,color:D.muted,lineHeight:1.7,animation:"fadeIn 0.3s ease"}}>{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FOOTER CTA ── */}
      <div style={{padding:"60px 24px",background:D.deep,textAlign:"center",position:"relative",overflow:"hidden"}}>
        <GeomPattern opacity={0.04}/>
        <div style={{position:"relative",zIndex:1}}>
          <Crescent size={48} color={D.gold}/>
          <h2 style={{fontFamily:"'Amiri',serif",fontSize:"clamp(22px,4vw,36px)",color:D.cream,margin:"16px 0 8px"}}>{lang==="ar"?"ابدأ الرحلة اليوم":lang==="nl"?"Begin vandaag de leerreis":"Start the learning journey today"}</h2>
          <p style={{color:D.muted,fontSize:14,marginBottom:28}}>{lang==="ar"?"بدون بطاقة ائتمان — ١٤ يوماً مجاناً":lang==="nl"?"Geen creditcard nodig — 14 dagen gratis":"No credit card needed — 14 days free"}</p>
          <button onClick={()=>onGetStarted("plus")} className="btn-hover" style={{background:`linear-gradient(135deg,${D.gold},${D.goldLight})`,border:"none",borderRadius:14,padding:"16px 36px",color:D.midnight,fontSize:16,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 6px 32px ${D.gold}44`}}>{ctaFree} →</button>
          <p style={{marginTop:16,fontSize:13,color:D.muted}}>{loginLink} <button onClick={onLogin} style={{background:"none",border:"none",color:D.gold,fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>{lang==="ar"?"←":lang==="nl"?"→":"→"}</button></p>
        </div>
      </div>
    </div>
  );
}

// ── UPGRADE MODAL ────────────────────────────────────────────────
function UpgradeModal({ onClose, onUpgrade, lang }) {
  const t = LANGS[lang];
  const title   = lang==="ar"?"أنت بحاجة إلى نور بلس":lang==="nl"?"Upgrade naar Noor Plus":"Upgrade to Noor Plus";
  const sub     = lang==="ar"?"هذا المحتوى متاح فقط لمشتركي نور بلس":lang==="nl"?"Deze inhoud is alleen beschikbaar voor Noor Plus-leden":"This content is only available for Noor Plus members";
  const btnUp   = lang==="ar"?"ترقية الآن — €٤٫٩٩/شهر":lang==="nl"?"Nu upgraden — €4,99/maand":"Upgrade now — €4.99/month";
  const btnFree = lang==="ar"?"البقاء على الخطة المجانية":lang==="nl"?"Gratis plan behouden":"Keep free plan";
  const trial   = lang==="ar"?"١٤ يوماً مجاناً — بدون بطاقة ائتمان":lang==="nl"?"14 dagen gratis proberen — geen betaalgegevens":"14-day free trial — no card required";

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)",animation:"fadeIn 0.2s ease"}}>
      <div style={{background:D.deep,border:`2px solid ${D.gold}55`,borderRadius:24,padding:"36px 28px",maxWidth:380,width:"100%",textAlign:"center",boxShadow:`0 24px 80px rgba(0,0,0,0.4)`,animation:"scaleIn 0.3s ease",position:"relative",overflow:"hidden"}}>
        <GeomPattern opacity={0.04}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{fontSize:52,marginBottom:12,animation:"floatY 3s ease-in-out infinite"}}>⭐</div>
          <h3 style={{fontFamily:"'Amiri',serif",fontSize:24,color:D.cream,marginBottom:8}}>{title}</h3>
          <p style={{fontSize:14,color:D.muted,lineHeight:1.6,marginBottom:20}}>{sub}</p>
          <div style={{background:`${D.gold}12`,border:`1px solid ${D.gold}33`,borderRadius:12,padding:"12px 16px",marginBottom:24}}>
            {(lang==="ar"?["📖 جميع المواد الـ٦","🏅 جميع الشارات","👨‍👩‍👧 حتى ٥ أطفال","📊 تقارير أسبوعية"]:lang==="nl"?["📖 Alle 6 vakken","🏅 Alle badges","👨‍👩‍👧 Tot 5 kinderen","📊 Wekelijkse rapporten"]:["📖 All 6 subjects","🏅 All badges","👨‍👩‍👧 Up to 5 children","📊 Weekly reports"]).map((f,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:i<3?8:0}}>
                <span style={{color:D.gold,fontSize:11}}>✦</span>
                <span style={{fontSize:13,color:D.mutedLt}}>{f}</span>
              </div>
            ))}
          </div>
          <p style={{fontSize:11,color:D.emeraldLt,marginBottom:16,fontWeight:700}}>✓ {trial}</p>
          <button onClick={onUpgrade} className="btn-hover" style={{width:"100%",padding:"14px",borderRadius:12,background:`linear-gradient(135deg,${D.gold},${D.goldLight})`,border:"none",color:D.midnight,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 24px ${D.gold}44`,marginBottom:10}}>{btnUp}</button>
          <button onClick={onClose} style={{width:"100%",padding:"12px",borderRadius:12,background:"transparent",border:`1.5px solid ${D.border}`,color:D.muted,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{btnFree}</button>
        </div>
      </div>
    </div>
  );
}

export default function NoorAcademy() {
  const [lang, setLang]         = useState("nl");
  const [appState, setAppState] = useState("landing"); // landing | auth | app
  const [authMode, setAuthMode] = useState("signup");
  const [plan, setPlan]         = useState("free");
  const [screen, setScreen]     = useState("home");
  const [activeSub, setActiveSub] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const t = LANGS[lang];

  const handleGetStarted = (selectedPlan) => {
    setPlan(selectedPlan);
    setAuthMode("signup");
    setAppState("auth");
  };

  const handleLogin = (selectedPlan) => {
    setPlan(selectedPlan);
    setAppState("app");
  };

  const handleLogout = () => {
    setAppState("landing");
    setScreen("home");
  };

  const handleLockedContent = () => setShowUpgrade(true);
  const handleUpgrade = () => { setPlan("plus"); setShowUpgrade(false); };

  if (appState==="landing") return <LandingPage onGetStarted={handleGetStarted} onLogin={()=>{setAuthMode("login");setAppState("auth");}} lang={lang} setLang={setLang}/>;
  if (appState==="auth") return (
    <>
      <GS/>
      <AuthScreen onLogin={handleLogin} lang={lang} setLang={setLang} initialMode={authMode} initialPlan={plan}/>
    </>
  );

  const renderScreen = () => {
    if (screen==="lesson" && activeSub) return <LessonScreen subjectId={activeSub} t={t} lang={lang} plan={plan} onLocked={handleLockedContent} onBack={()=>{setScreen("home");setActiveSub(null);}}/>;
    if (screen==="quiz")   return <QuizScreen t={t} lang={lang} onBack={()=>setScreen("home")}/>;
    if (screen==="arabic") return <ArabicCourseScreen t={t} lang={lang} plan={plan} onLocked={handleLockedContent} onBack={()=>setScreen("home")}/>;
    if (screen==="kids")   return <KidsModeScreen lang={lang} plan={plan} onLocked={handleLockedContent} onBack={()=>setScreen("home")}/>;
    if (screen==="duas")   return <DuasScreen t={t} lang={lang}/>;
    if (screen==="badges") return <BadgesScreen t={t} lang={lang} plan={plan} onLocked={handleLockedContent}/>;
    if (screen==="parent") return <ParentScreen t={t} lang={lang}/>;
    return <Home t={t} lang={lang} setScreen={setScreen} setActiveSub={setActiveSub} plan={plan} onLocked={handleLockedContent}/>;
  };

  return (
    <div style={{minHeight:"100vh",background:D.midnight,fontFamily:"'Tajawal',sans-serif",direction:t.dir}}>
      <GS/>
      {showUpgrade && <UpgradeModal onClose={()=>setShowUpgrade(false)} onUpgrade={handleUpgrade} lang={lang}/>}

      <Sidebar active={screen} setScreen={setScreen} t={t} onLogout={handleLogout} lang={lang}/>

      {/* App header */}
      <div className="app-content" style={{marginLeft:0}}>
        <div style={{background:D.deep,borderBottom:`1px solid ${D.border}`,padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:50}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Crescent size={26} color={D.gold}/>
            <span className="gold-text" style={{fontFamily:"'Amiri',serif",fontSize:20}}>Noor Academy</span>
            {plan==="plus" && <span style={{background:`linear-gradient(135deg,${D.gold},${D.goldLight})`,color:D.midnight,fontSize:9,fontWeight:800,padding:"3px 8px",borderRadius:20}}>PLUS</span>}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <MuteBtn/>
            {/* Lang switcher */}
            <div style={{display:"flex",gap:3,background:D.navyCard,borderRadius:20,padding:3,border:`1px solid ${D.border}`}}>
              {Object.entries(LANGS).map(([code,v])=>(
                <button key={code} onClick={()=>{ sfx("click"); setLang(code); }} style={{background:lang===code?D.gold:"transparent",border:"none",borderRadius:16,padding:"4px 8px",cursor:"pointer",color:lang===code?D.midnight:D.muted,fontSize:10,fontWeight:lang===code?800:400,transition:"all 0.2s",fontFamily:"inherit"}}>
                  {v.flag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{maxWidth:640,margin:"0 auto",minHeight:"calc(100vh - 57px)",paddingBottom:80}}>
          {renderScreen()}
        </div>
      </div>

      <BottomNav active={screen} setScreen={setScreen} t={t}/>
    </div>
  );
}
