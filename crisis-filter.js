/**
 * PACDI Crisis & Content Filter
 * Beichtraum · Onkelsorgen · Geduldstein
 * v1.0 — 2026
 *
 * KATMAN 1 — SERT ENGEL (moderatöre gitmez)
 * KATMAN 2 — KRİZ YÖNLENDİRME (uyarı + moderatöre bildirim)
 */

(function() {

  // ─── KRİZ HATLARI ───────────────────────────────────────────────
  var CRISIS_LINES = {
    de: [
      { name: "Telefonseelsorge", number: "0800 111 0 111", note: "24/7 kostenlos" },
      { name: "Nummer gegen Kummer", number: "0800 111 0 550", note: "24/7 kostenlos" }
    ],
    tr: [
      { name: "ALO Psikiyatri Hattı", number: "182", note: "7/24 ücretsiz" },
      { name: "İntiharı Önleme Hattı", number: "0800 455 0 455", note: "7/24 ücretsiz" }
    ],
    en: [
      { name: "Befrienders Worldwide", number: "befrienders.org", note: "Global 24/7" },
      { name: "Crisis Text Line", number: "Text HOME to 741741", note: "Free, 24/7" }
    ]
  };

  // ─── KATMAN 1: SERT ENGEL KELİMELERİ ───────────────────────────
  // Bu kelimeler tespit edildiğinde yazma DURUR, içerik gönderilmez
  var BLOCK_WORDS = {

    // İntihar / Kendine zarar verme
    suicide: {
      tr: ["intihar","kendimi öldür","kendime zarar","bilek kes","ilaç içeyim","son nefes","yaşamak istemiyorum","ölmek istiyorum","hayatıma son","kendimi asayım","atlayacağım","zehir içeyim"],
      de: ["suizid","selbstmord","mich umbringen","mich töten","ich will sterben","nicht mehr leben","mir das leben nehmen","aufhören zu leben","pulsader aufschneiden","tabletten schlucken","von brücke springen"],
      en: ["suicide","kill myself","end my life","self harm","cut myself","want to die","don't want to live","take my life","overdose","hang myself","jump off"]
    },

    // Şiddet tehdidi
    violence: {
      tr: ["seni öldürürüm","kanını dökerim","kafanı kırarım","yakacağım","bomba","silah","bıçaklayacağım","şiddet uygulayacağım","intikam alacağım","herkesi öldüreceğim"],
      de: ["ich bringe dich um","ich töte dich","ich schlage dich tot","bombe","waffe","ich steche dich ab","ich zünde","rache nehmen","alle töten","ich erschieße"],
      en: ["i will kill you","gonna kill","blow up","bomb threat","shoot everyone","stab you","burn down","take revenge","massacre","i have a gun"]
    },

    // Irkçılık / Nefret söylemi
    hate: {
      tr: ["zenci","göçmen defol","yabancı defol","kürt","ermeni","yahudi","ülkeni","ırkçı hakaret","katletmeli","temizlenmeli","aşağı ırk"],
      de: ["ausländer raus","nazi","heil hitler","dreckstürke","kanake","judensau","neger","zigeuner","scheiß ausländer","untermensch","volksverhetzung","rasse"],
      en: ["nigger","kike","spic","chink","go back to your country","white power","racial slur","ethnic cleansing","gas the","subhuman","white supremacy"]
    },

    // Toplulukları aşağılayıcı
    discrimination: {
      tr: ["ibne","göt","orospu","fahişe","pislik","sapık","geri zekalı","engelli hakaret","deli","kaşar","mal","gerizekalı"],
      de: ["schwuchtel","hure","fotze","behindert als schimpfwort","vollidiot","scheiß homo","pisser","dreckstück","wichser","blöde kuh","missgeburt"],
      en: ["faggot","whore","retard","cripple","lunatic","slut","bitch","bastard as slur","moron","idiot as slur","freak","dyke"]
    },

    // Siyasi provokasyon
    political: {
      tr: ["pkk","terör örgütü","devleti yık","cumhurbaşkanı öldür","erdoğan öldür","siyasi suikast","darbe","hükümeti devir","ülkeyi yak"],
      de: ["afd heil","nazis an die macht","politiker ermorden","staatsstreich","regierung stürzen","terroranschlag","islamistisch","linksextrem","rechtsextrem angriff"],
      en: ["kill the president","political assassination","overthrow government","terrorist attack","blow up parliament","isis","al qaeda","white nationalist attack","antifa violence"]
    }
  };

  // ─── KATMAN 2: KRİZ YÖNLENDİRME KELİMELERİ ─────────────────────
  // Bu kelimeler tespit edildiğinde uyarı gösterilir, içerik moderatöre gider
  var WARN_WORDS = {
    tr: ["artık dayanamıyorum","çok yalnızım","kimse anlamıyor","umudum yok","her şey boş","neden yaşıyorum","yoruldum hayattan","bıktım","çıkış yolu yok","karanlık","değersizim","kimseye gerek yok benim"],
    de: ["ich halte es nicht mehr aus","ich bin so allein","niemand versteht mich","keine hoffnung mehr","alles sinnlos","warum lebe ich noch","ich bin so müde","es gibt keinen ausweg","alles dunkel","ich bin wertlos","keiner braucht mich"],
    en: ["can't take it anymore","so alone","nobody understands","no hope left","everything is pointless","why am i alive","so tired of everything","no way out","everything is dark","i am worthless","nobody needs me"]
  };

  // ─── MESAJLAR ────────────────────────────────────────────────────
  var MESSAGES = {
    block: {
      tr: "Bu içerik platformumuzun kurallarıyla bağdaşmıyor ve gönderilemez.",
      de: "Dieser Inhalt verstößt gegen unsere Plattformregeln und kann nicht gesendet werden.",
      en: "This content violates our platform rules and cannot be submitted."
    },
    crisis: {
      tr: "Zor bir an yaşıyor olabilirsin. Yalnız değilsin — profesyonel destek almak için aşağıdaki hatlara ulaşabilirsin:",
      de: "Du scheinst gerade eine schwere Zeit durchzumachen. Du bist nicht allein — hier findest du professionelle Hilfe:",
      en: "It seems you may be going through a difficult time. You are not alone — please reach out for professional support:"
    }
  };

  // ─── YARDIMCI FONKSİYONLAR ──────────────────────────────────────
  function detectLang() {
    var l = (navigator.language || 'de').toLowerCase();
    if (l.startsWith('tr')) return 'tr';
    if (l.startsWith('en')) return 'en';
    return 'de';
  }

  function normalizeText(text) {
    return text.toLowerCase()
      .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
      .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
      .replace(/ä/g,'a').replace(/ö/g,'o').replace(/ü/g,'u')
      .replace(/[^a-z0-9\s]/g, ' ');
  }

  function checkBlock(text) {
    var t = normalizeText(text);
    for (var cat in BLOCK_WORDS) {
      var langs = BLOCK_WORDS[cat];
      for (var lang in langs) {
        var words = langs[lang];
        for (var i = 0; i < words.length; i++) {
          if (t.indexOf(normalizeText(words[i])) !== -1) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function checkWarn(text) {
    var t = normalizeText(text);
    for (var lang in WARN_WORDS) {
      var words = WARN_WORDS[lang];
      for (var i = 0; i < words.length; i++) {
        if (t.indexOf(normalizeText(words[i])) !== -1) {
          return true;
        }
      }
    }
    return false;
  }

  function showBlockModal(lang) {
    removeModal();
    var modal = document.createElement('div');
    modal.id = 'pacdi-filter-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
    modal.innerHTML =
      '<div style="background:#1a1a2e;border:1px solid #c0392b;border-radius:12px;padding:28px;max-width:480px;width:100%;text-align:center;">' +
      '<div style="font-size:2rem;margin-bottom:12px;">🚫</div>' +
      '<p style="color:#e74c3c;font-size:1rem;margin-bottom:16px;line-height:1.6;">' + MESSAGES.block[lang] + '</p>' +
      '<button onclick="document.getElementById(\'pacdi-filter-modal\').remove()" style="background:#c0392b;color:white;border:none;padding:10px 24px;border-radius:40px;cursor:pointer;font-size:0.9rem;">Kapat / Close / Schließen</button>' +
      '</div>';
    document.body.appendChild(modal);
  }

  function showCrisisModal(lang) {
    removeModal();
    var lines = CRISIS_LINES[lang] || CRISIS_LINES['de'];
    var linesHtml = lines.map(function(l) {
      return '<div style="background:rgba(255,255,255,0.06);border-radius:8px;padding:10px 14px;margin:6px 0;text-align:left;">' +
        '<strong style="color:#f39c12;">' + l.name + '</strong><br>' +
        '<span style="color:#ecf0f1;font-size:1.1rem;">' + l.number + '</span>' +
        '<span style="color:#95a5a6;font-size:0.75rem;margin-left:8px;">' + l.note + '</span>' +
        '</div>';
    }).join('');

    var modal = document.createElement('div');
    modal.id = 'pacdi-filter-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.88);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
    modal.innerHTML =
      '<div style="background:#0d1b2a;border:1px solid #2980b9;border-radius:12px;padding:28px;max-width:520px;width:100%;">' +
      '<div style="font-size:2rem;text-align:center;margin-bottom:12px;">💙</div>' +
      '<p style="color:#ecf0f1;font-size:0.95rem;margin-bottom:16px;line-height:1.7;text-align:center;">' + MESSAGES.crisis[lang] + '</p>' +
      linesHtml +
      '<div style="margin-top:16px;text-align:center;">' +
      '<a href="https://www.befrienders.org" target="_blank" style="color:#3498db;font-size:0.85rem;">🌍 befrienders.org — Global Crisis Support</a>' +
      '</div>' +
      '<button onclick="document.getElementById(\'pacdi-filter-modal\').remove()" style="display:block;width:100%;margin-top:16px;background:#2980b9;color:white;border:none;padding:10px;border-radius:40px;cursor:pointer;font-size:0.9rem;">Devam Et / Continue / Weiter</button>' +
      '</div>';
    document.body.appendChild(modal);
  }

  function removeModal() {
    var old = document.getElementById('pacdi-filter-modal');
    if (old) old.remove();
  }

  // ─── ANA FONKSİYON ───────────────────────────────────────────────
  function attachFilter(el) {
    var lang = detectLang();
    var blockTriggered = false;

    el.addEventListener('input', function() {
      var text = el.value;
      if (checkBlock(text)) {
        // Katman 1: Sert engel
        el.value = el.value.slice(0, -1); // Son karakteri sil
        if (!blockTriggered) {
          blockTriggered = true;
          showBlockModal(lang);
          setTimeout(function() { blockTriggered = false; }, 3000);
        }
      } else if (checkWarn(text)) {
        // Katman 2: Kriz yönlendirme
        showCrisisModal(lang);
      }
    });

    // Form submit'te de kontrol
    var form = el.closest('form');
    if (form) {
      form.addEventListener('submit', function(e) {
        if (checkBlock(el.value)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          showBlockModal(lang);
          return false;
        }
      }, true);
    }
  }

  // ─── SAYFA YÜKLENİNCE OTOMATIK BAĞLA ────────────────────────────
  function init() {
    var fields = document.querySelectorAll('textarea, input[type="text"]');
    for (var i = 0; i < fields.length; i++) {
      attachFilter(fields[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Global erişim için
  window.PACDIFilter = {
    checkBlock: checkBlock,
    checkWarn: checkWarn,
    attachFilter: attachFilter
  };

})();
