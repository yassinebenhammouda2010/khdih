/* ========================================
   Kihdih - صفحة السورة
======================================== */


/* =========================
   VARIABLES
================================ */

const params = new URLSearchParams(window.location.search);

const surahNumber = Number(params.get("surah") || params.get("id") || 1);

const surahNameElement = document.getElementById("surah-name");
const surahInfoElement = document.getElementById("surah-info");
const ayahsContainer = document.getElementById("ayahs-container");

const audio = new Audio();

let currentAyah = null;

// وضع التشغيل الحالي: "single" (آية واحدة) | "range" (نطاق آيات) | "full" (السورة كاملة)
let playbackMode = "idle";


/* =========================
   RECITER
================================ */

const DEFAULT_RECITER = "ar.alafasy";

function getSelectedReciter() {

    return (
        localStorage.getItem("kihdih_reciter")
        || DEFAULT_RECITER
    );

}

function setSelectedReciter(id) {

    try {
        localStorage.setItem("kihdih_reciter", id);
    } catch (e) {
        // تجاهل
    }

}

function getReciterObject() {

    return (
        RECITERS.find(item => item.id === getSelectedReciter())
        || RECITERS[0]
    );

}


/* =========================
   RECITERS
================================ */

const RECITERS = [

    {
        id: "ar.alafasy",
        name: "مشاري راشد العفاسي",
        provider: "alquran"
    },

    {
        id: "ar.abdulbasitmurattal",
        name: "عبد الباسط عبد الصمد",
        provider: "alquran"
    },

    {
        id: "ar.husary",
        name: "محمود خليل الحصري",
        provider: "alquran"
    },

    {
        id: "ar.minshawi",
        name: "محمد صديق المنشاوي",
        provider: "alquran"
    },

    {
        id: "ar.abdurrahmaansudais",
        name: "عبد الرحمن السديس",
        provider: "alquran"
    },

    {
        id: "ar.mahermuaiqly",
        name: "ماهر المعيقلي",
        provider: "alquran"
    },

    {
        id: "ar.shaatree",
        name: "أبو بكر الشاطري",
        provider: "alquran"
    },

    {
        id: "ar.ahmedajamy",
        name: "أحمد العجمي",
        provider: "alquran"
    },

    {
        id: "everyayah.yasseraldosari",
        name: "ياسر الدوسري",
        provider: "everyayah",

        folder:
            "Yasser_Ad-Dussary_128kbps",

        // مصدر بديل موثوق لملف السورة الكاملة دفعة واحدة (mp3quran.net)
        fullSurahServer:
            "https://server11.mp3quran.net/download/yasser"
    }

];


/* =========================
   RECITER SELECT (UI)
================================ */

const reciterSelectEl = document.getElementById("reciter-select");

function populateReciterSelect() {

    if (!reciterSelectEl) return;

    reciterSelectEl.innerHTML = RECITERS
        .map(r => `<option value="${r.id}">${r.name}</option>`)
        .join("");

    reciterSelectEl.value = getSelectedReciter();

}

if (reciterSelectEl) {

    reciterSelectEl.addEventListener("change", () => {

        setSelectedReciter(reciterSelectEl.value);

        // نوقف أي تشغيل جارٍ لتفادي خلط قارئين مختلفين
        stopPlayback();

    });

}


/* =========================
   SURAH DATA
================================ */

let currentSurahAyahs = [];


/* =========================
   LOAD SURAH
================================ */

async function loadSurah() {

    if (
        !Number.isInteger(surahNumber)
        || surahNumber < 1
        || surahNumber > 114
    ) {

        showError(
            "رقم السورة غير صحيح."
        );

        return;

    }


    try {

        const response = await fetch(
            `https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`
        );


        if (!response.ok) {
            throw new Error(
                "فشل الاتصال بالخادم"
            );
        }


        const data = await response.json();


        if (
            data.code !== 200
            || !data.data
        ) {

            throw new Error(
                "بيانات السورة غير متوفرة"
            );

        }


        const surah = data.data;

        currentSurahAyahs = surah.ayahs || [];


        updateSurahHeader(surah);

        renderAyahs(surah.ayahs);


    } catch (error) {

        console.error(error);

        showError(
            "تعذر تحميل السورة. حاول مرة أخرى."
        );

    }

}


/* =========================
   HEADER
================================ */

function updateSurahHeader(surah) {

    if (surahNameElement) {

        surahNameElement.textContent =
            surah.name || "السورة";

    }


    if (surahInfoElement) {

        const revelation =
            surah.revelationType === "Meccan"
                ? "مكية"
                : "مدنية";


        surahInfoElement.textContent =
            `${surah.numberOfAyahs} آية • ${revelation}`;

    }


    document.title =
        `${surah.name || "السورة"} | Kihdih`;

}


/* =========================
   RENDER AYAHS
================================ */

function renderAyahs(ayahs) {

    if (!ayahsContainer) return;


    ayahsContainer.innerHTML = "";


    if (!ayahs || !ayahs.length) {

        showError(
            "لم يتم العثور على آيات هذه السورة."
        );

        return;

    }


    ayahs.forEach(ayah => {

        const ayahElement =
            document.createElement("article");


        ayahElement.className =
            "ayah-item";


        ayahElement.dataset.ayah =
            ayah.numberInSurah;


        ayahElement.innerHTML = `

            <p class="ayah-text">

                <button
                    class="ayah-number"
                    type="button"
                    aria-label="الاستماع إلى الآية ${ayah.numberInSurah}"
                    title="اضغط للاستماع، أو لتحديد بداية/نهاية نطاق"
                >
                    ${ayah.numberInSurah}
                </button>

                ${ayah.text}

            </p>

        `;


        ayahsContainer.appendChild(
            ayahElement
        );

    });

}


/* =========================
   AUDIO URL - EVERYAYAH (آية واحدة)
================================ */

function getEveryAyahUrl(
    folder,
    surah,
    ayah
) {

    const surahNumberFormatted =
        String(surah).padStart(3, "0");


    const ayahNumberFormatted =
        String(ayah).padStart(3, "0");


    return (
        `https://everyayah.com/data/`
        + `${folder}/`
        + `${surahNumberFormatted}`
        + `${ayahNumberFormatted}.mp3`
    );

}


/* =========================
   GET AUDIO URL (آية واحدة)
================================ */

async function getAyahAudioUrl(
    ayahNumber
) {

    const reciter = getReciterObject();

    if (!reciter) {

        return null;

    }


    /* EVERYAYAH */

    if (
        reciter.provider ===
        "everyayah"
    ) {

        return getEveryAyahUrl(
            reciter.folder,
            surahNumber,
            ayahNumber
        );

    }


    /* ALQURAN CLOUD */

    try {

        const response = await fetch(
            `https://api.alquran.cloud/v1/surah/${surahNumber}/${reciter.id}`
        );


        if (!response.ok) {

            throw new Error(
                "Audio API error"
            );

        }


        const data =
            await response.json();


        if (
            data.code !== 200
            || !data.data
            || !data.data.ayahs
        ) {

            throw new Error(
                "Audio data unavailable"
            );

        }


        const ayah =
            data.data.ayahs.find(
                item =>
                    item.numberInSurah ===
                    ayahNumber
            );


        if (!ayah) {

            return null;

        }


        return ayah.audio || null;


    } catch (error) {

        console.error(
            "Erreur audio :",
            error
        );


        return null;

    }

}


/* =========================
   AUDIO URL - السورة كاملة (ملف واحد متواصل بدون توقف)
================================ */

function getFullSurahAudioUrl() {

    const reciter = getReciterObject();

    if (!reciter) return null;

    const paddedSurah =
        String(surahNumber).padStart(3, "0");


    if (reciter.provider === "everyayah") {

        // نستخدم مصدر mp3quran.net الموثوق للملف الكامل دفعة واحدة
        return `${reciter.fullSurahServer}/${paddedSurah}.mp3`;

    }


    // بقية القراء: ملف السورة الكاملة عبر شبكة islamic.network
    return `https://cdn.islamic.network/quran/audio-surah/128/${reciter.id}/${surahNumber}.mp3`;

}


/* =========================
   إيقاف كل تشغيل وإعادة الضبط
================================ */

function stopPlayback() {

    audio.pause();
    audio.currentTime = 0;
    audio.src = "";

    playbackMode = "idle";

    currentAyah = null;

    rangeQueue = [];
    rangeQueueIndex = 0;

    clearAllAyahHighlights();

    hidePlayer();

}


/* =========================
   تشغيل آية واحدة (السلوك الأصلي: بدون انتقال تلقائي)
================================ */

async function playSingleAyah(
    ayahNumber
) {

    if (!ayahNumber) return;

    audio.pause();
    audio.currentTime = 0;

    playbackMode = "single";
    currentAyah = ayahNumber;

    setActiveAyah(ayahNumber);

    updatePlayer(
        `الآية ${ayahNumber}`
    );


    const audioUrl = await getAyahAudioUrl(ayahNumber);

    if (!audioUrl) {

        console.error(
            "Audio introuvable pour l'ayah",
            ayahNumber
        );

        return;

    }

    audio.src = audioUrl;

    try {

        await audio.play();

        updatePlayer(`الآية ${ayahNumber}`);

    } catch (error) {

        console.error("Impossible de lire l'audio :", error);

    }

}


/* =========================
   تشغيل السورة كاملة بدون أي توقف بين الآيات
================================ */

async function playFullSurah() {

    audio.pause();
    audio.currentTime = 0;

    playbackMode = "full";
    currentAyah = null;

    clearAllAyahHighlights();

    updatePlayer("السورة كاملة");

    const url = getFullSurahAudioUrl();

    if (!url) {
        console.error("تعذر تحديد رابط السورة الكاملة");
        return;
    }

    audio.src = url;

    try {

        await audio.play();

        updatePlayer("السورة كاملة");

    } catch (error) {

        console.error("Impossible de lire la sourate complète :", error);

    }

}


/* =========================
   وضع تحديد النطاق (من آية إلى آية)
================================ */

let rangeSelectionActive = false;
let rangeStart = null;
let rangeQueue = [];
let rangeQueueIndex = 0;
let rangeUrlCache = {};

const toggleRangeBtn = document.getElementById("toggle-range-mode");
const cancelRangeBtn = document.getElementById("cancel-range-mode");
const rangeModeHint = document.getElementById("range-mode-hint");
const playFullSurahBtn = document.getElementById("play-full-surah");

function clearAllAyahHighlights() {

    document.querySelectorAll(".ayah-item").forEach(item => {

        item.classList.remove(
            "is-playing",
            "is-range-start",
            "is-range-queued"
        );

    });

}

function resetRangeSelection() {

    rangeStart = null;

    document.querySelectorAll(".ayah-item.is-range-start")
        .forEach(item => item.classList.remove("is-range-start"));

    if (rangeModeHint) {

        rangeModeHint.textContent =
            "اضغط على رقم آية البداية، ثم رقم آية النهاية";

    }

}

function setRangeModeActive(active) {

    rangeSelectionActive = active;

    if (toggleRangeBtn) {

        toggleRangeBtn.classList.toggle("active", active);

    }

    if (cancelRangeBtn) {

        cancelRangeBtn.classList.toggle("hidden", !active);

    }

    if (rangeModeHint) {

        rangeModeHint.classList.toggle("hidden", !active);

    }

    resetRangeSelection();

}

if (toggleRangeBtn) {

    toggleRangeBtn.addEventListener("click", () => {

        setRangeModeActive(!rangeSelectionActive);

    });

}

if (cancelRangeBtn) {

    cancelRangeBtn.addEventListener("click", () => {

        setRangeModeActive(false);

    });

}

if (playFullSurahBtn) {

    playFullSurahBtn.addEventListener("click", () => {

        setRangeModeActive(false);

        playFullSurah();

    });

}


/* =========================
   بدء تشغيل نطاق الآيات المحدد
================================ */

function startRangePlayback(startAyah, endAyah) {

    const from = Math.min(startAyah, endAyah);
    const to = Math.max(startAyah, endAyah);

    rangeQueue = [];

    for (let i = from; i <= to; i++) {
        rangeQueue.push(i);
    }

    rangeQueueIndex = 0;
    rangeUrlCache = {};

    playbackMode = "range";

    playCurrentRangeItem();

}

async function playCurrentRangeItem() {

    if (rangeQueueIndex >= rangeQueue.length) {

        // انتهى النطاق بالكامل
        playbackMode = "idle";

        clearAllAyahHighlights();

        updatePlayer("اكتملت التلاوة");

        setTimeout(hidePlayer, 1500);

        return;

    }

    const ayahNumber = rangeQueue[rangeQueueIndex];

    currentAyah = ayahNumber;

    setActiveAyah(ayahNumber);

    updatePlayer(
        `الآيات ${rangeQueue[0]}–${rangeQueue[rangeQueue.length - 1]} • الآية ${ayahNumber}`
    );

    // استخدام الرابط المُحمَّل مسبقًا إن وُجد لتقليل أي تأخير بين الآيات
    let url = rangeUrlCache[ayahNumber];

    if (!url) {
        url = await getAyahAudioUrl(ayahNumber);
    }

    if (!url) {

        console.error("تعذر تحميل رابط الآية", ayahNumber);

        // ننتقل للآية التالية في النطاق بدلًا من التوقف الكامل
        rangeQueueIndex++;

        playCurrentRangeItem();

        return;

    }

    audio.src = url;

    try {

        await audio.play();

    } catch (error) {

        console.error("Impossible de lire l'audio de la plage :", error);

    }

    // تحميل مسبق للآية التالية في الخلفية (لتقليل التوقف بينها)
    const nextAyah = rangeQueue[rangeQueueIndex + 1];

    if (nextAyah && !rangeUrlCache[nextAyah]) {

        getAyahAudioUrl(nextAyah).then(nextUrl => {

            if (nextUrl) {
                rangeUrlCache[nextAyah] = nextUrl;
            }

        });

    }

}


/* =========================
   CLICK AYAH NUMBER
================================ */

if (ayahsContainer) {

    ayahsContainer.addEventListener(
        "click",
        event => {

            const numberButton =
                event.target.closest(
                    ".ayah-number"
                );


            if (!numberButton) {
                return;
            }


            const ayahElement =
                numberButton.closest(
                    ".ayah-item"
                );


            if (!ayahElement) {
                return;
            }


            const ayahNumber =
                Number(
                    ayahElement.dataset.ayah
                );


            if (!ayahNumber) {
                return;
            }


            /* ==== وضع تحديد النطاق ==== */

            if (rangeSelectionActive) {

                if (rangeStart === null) {

                    rangeStart = ayahNumber;

                    ayahElement.classList.add("is-range-start");

                    if (rangeModeHint) {

                        rangeModeHint.textContent =
                            `بداية النطاق: الآية ${ayahNumber} — الآن اضغط على آية النهاية`;

                    }

                    return;

                }

                // تم اختيار آية النهاية: نبدأ التشغيل مباشرة
                const startAyah = rangeStart;
                const endAyah = ayahNumber;

                setRangeModeActive(false);

                startRangePlayback(startAyah, endAyah);

                return;

            }


            /* ==== الوضع العادي: تشغيل آية واحدة فقط ==== */

            playSingleAyah(ayahNumber);

        }
    );

}


/* =========================
   AUDIO TERMINÉ
================================ */

audio.addEventListener(
    "ended",
    () => {

        if (playbackMode === "range") {

            rangeQueueIndex++;

            playCurrentRangeItem();

            return;

        }

        if (playbackMode === "full") {

            playbackMode = "idle";

            updatePlayer("اكتملت السورة");

            setTimeout(hidePlayer, 1500);

            return;

        }

        // playbackMode === "single"

        if (currentAyah) {

            setActiveAyah(
                currentAyah,
                false
            );

        }


        if (
            playerPause
        ) {

            playerPause.textContent =
                "▶";

        }

        playbackMode = "idle";

    }
);


/* =========================
   ACTIVE AYAH
================================ */

function setActiveAyah(
    ayahNumber,
    scroll = true
) {

    document
        .querySelectorAll(
            ".ayah-item"
        )
        .forEach(item => {

            item.classList.remove(
                "is-playing"
            );

        });


    const active =
        document.querySelector(
            `.ayah-item[data-ayah="${ayahNumber}"]`
        );


    if (!active) {
        return;
    }


    active.classList.add(
        "is-playing"
    );


    if (scroll) {

        active.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }

}


/* =========================
   PLAYER
================================ */

const surahPlayer =
    document.getElementById(
        "surah-player"
    );


const playerAyah =
    document.getElementById(
        "player-ayah"
    );


const playerReciterLabel =
    document.getElementById(
        "player-reciter"
    );


const playerPause =
    document.getElementById(
        "player-pause"
    );


const playerStop =
    document.getElementById(
        "player-stop"
    );


const playerProgress =
    document.getElementById(
        "player-progress"
    );


function updatePlayer(
    label
) {

    if (surahPlayer) {

        surahPlayer.classList.remove(
            "hidden"
        );

    }


    if (playerAyah) {

        playerAyah.textContent =
            label;

    }


    if (playerReciterLabel) {

        const reciter = getReciterObject();

        playerReciterLabel.textContent =
            reciter ? reciter.name : "";

    }


    if (playerPause) {

        playerPause.textContent =
            audio.paused
                ? "▶"
                : "⏸";

    }

}

function hidePlayer() {

    if (surahPlayer) {

        surahPlayer.classList.add("hidden");

    }

}


/* =========================
   PAUSE / RESUME
================================ */

if (playerPause) {

    playerPause.addEventListener(
        "click",
        () => {

            if (!audio.src) {
                return;
            }


            if (audio.paused) {

                audio.play()
                    .then(() => {

                        if (playerPause) {

                            playerPause.textContent =
                                "⏸";

                        }

                        if (currentAyah) {

                            setActiveAyah(
                                currentAyah,
                                false
                            );

                        }

                    })
                    .catch(error => {

                        console.error(
                            error
                        );

                    });

            } else {

                audio.pause();


                if (playerPause) {

                    playerPause.textContent =
                        "▶";

                }

            }

        }
    );

}


/* =========================
   STOP
================================ */

if (playerStop) {

    playerStop.addEventListener(
        "click",
        () => {

            stopPlayback();

        }
    );

}


/* =========================
   PROGRESS BAR
================================ */

audio.addEventListener("timeupdate", () => {

    if (!playerProgress || !audio.duration) return;

    const percent = (audio.currentTime / audio.duration) * 100;

    playerProgress.style.width = `${percent}%`;

});


/* =========================
   AUDIO ERROR
================================ */

audio.addEventListener(
    "error",
    () => {

        console.error(
            "Erreur lors du chargement de l'audio."
        );

        if (playerPause) {

            playerPause.textContent =
                "▶";

        }


        // في وضع النطاق، لا نتوقف بالكامل: ننتقل للآية التالية
        if (playbackMode === "range") {

            rangeQueueIndex++;

            playCurrentRangeItem();

        }

    }
);


/* =========================
   ERROR MESSAGE
================================ */

function showError(
    message
) {

    if (!ayahsContainer) {
        return;
    }


    ayahsContainer.innerHTML = `

        <div class="error-message">

            ${message}

        </div>

    `;

}


/* =========================
   START
================================ */

populateReciterSelect();
loadSurah();