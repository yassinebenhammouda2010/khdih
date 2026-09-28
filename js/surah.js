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
let timingData = [];
let timingLoadedFor = null;
let timingReadId = null;


/* =========================
   RECITERS
   -------------------------
   كل رابط هنا تم التحقق منه يدويًا (يعمل فعليًا):
   - السورة كاملة (ملف واحد متواصل): mp3quran.net
   - الآية الواحدة: everyayah.com
================================ */

const RECITERS = [

    {
        id: "afs",
        name: "مشاري راشد العفاسي",
        everyayahFolder: "Alafasy_128kbps",
        fullServer: "https://server8.mp3quran.net/download/afs",
        // معرف القارئ في خدمة توقيتات الآيات (mp3quran.net)، يسمح بتشغيل النطاق
        // من ملف السورة الكاملة مباشرة بدون أي توقف بين الآيات
        timingReadId: 123
    },

    {
        id: "basit",
        name: "عبد الباسط عبد الصمد",
        everyayahFolder: "Abdul_Basit_Murattal_64kbps",
        fullServer: "https://server7.mp3quran.net/download/basit",
        timingReadId: 53
    },

    {
        id: "husr",
        name: "محمود خليل الحصري",
        everyayahFolder: "Husary_128kbps",
        fullServer: "https://server13.mp3quran.net/download/husr",
        timingReadId: 118
    },

    {
        id: "minsh",
        name: "محمد صديق المنشاوي",
        everyayahFolder: "Minshawy_Murattal_128kbps",
        fullServer: "https://server10.mp3quran.net/download/minsh",
        timingReadId: 112
    },

    {
        id: "sds",
        name: "عبد الرحمن السديس",
        everyayahFolder: "Abdurrahmaan_As-Sudais_192kbps",
        fullServer: "https://server11.mp3quran.net/download/sds",
        timingReadId: 54
    },

    {
        id: "maher",
        name: "ماهر المعيقلي",
        everyayahFolder: "MaherAlMuaiqly128kbps",
        fullServer: "https://server12.mp3quran.net/download/maher",
        // لا يوجد توقيت متاح لهذا القارئ حاليًا في خدمة mp3quran
        timingReadId: null
    },

    {
        id: "hthfi",
        name: "علي الحذيفي",
        everyayahFolder: "Hudhaify_128kbps",
        fullServer: "https://server9.mp3quran.net/download/hthfi",
        timingReadId: 74
    },

    {
        id: "yasser",
        name: "ياسر الدوسري",
        everyayahFolder: "Yasser_Ad-Dussary_128kbps",
        fullServer: "https://server11.mp3quran.net/download/yasser",
        timingReadId: 92
    },

    {
        id: "lhdan",
        name: "محمد اللحيدان",
        everyayahFolder: null,
        fullServer: "https://server8.mp3quran.net/download/lhdan",
        timingReadId: null
    }

];


/* =========================
   RECITER (SÉLECTION)
================================ */

const DEFAULT_RECITER = "afs";

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
   بعض القراء (مثل محمد اللحيدان) لا يتوفر لهم لا ملفات آيات
   منفصلة (everyayah) ولا توقيتات (mp3quran)، فلا يمكن تقنيًا
   تحديد بداية/نهاية دقيقة لآية واحدة أو نطاق آيات معهم —
   فقط السورة كاملة متاحة.
================================ */

function reciterSupportsAyahSelection(reciter) {

    return Boolean(
        reciter
        && (reciter.everyayahFolder || reciter.timingReadId)
    );

}


/* =========================
   RECITER SELECT (UI)
================================ */

const reciterSelectEl = document.getElementById("reciter-select");

function populateReciterSelect() {

    if (!reciterSelectEl) return;

    reciterSelectEl.innerHTML = RECITERS
        .map(r => `<option value="${r.id}">${r.name}</option>`)
        .join("");

    // توافق مع القيم القديمة المخزنة (مثل "ar.alafasy") قبل هذا التحديث
    const stored = getSelectedReciter();
    const exists = RECITERS.some(r => r.id === stored);

    reciterSelectEl.value = exists ? stored : DEFAULT_RECITER;

    if (!exists) {
        setSelectedReciter(DEFAULT_RECITER);
    }

}

if (reciterSelectEl) {

    reciterSelectEl.addEventListener("change", () => {

        setSelectedReciter(reciterSelectEl.value);

        // نوقف أي تشغيل جارٍ لتفادي خلط قارئين مختلفين
        stopPlayback();
        timingLoadedFor = null;
        timingData = [];
        timingReadId = null;

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
   روابط الصوت (متزامنة — بدون أي طلب شبكة مسبق)
================================ */

function getAyahAudioUrl(ayahNumber) {

    const reciter = getReciterObject();

    if (!reciter || !reciter.everyayahFolder) return null;


    const paddedSurah = String(surahNumber).padStart(3, "0");
    const paddedAyah = String(ayahNumber).padStart(3, "0");


    return `https://everyayah.com/data/${reciter.everyayahFolder}/${paddedSurah}${paddedAyah}.mp3`;
}

function getFullSurahAudioUrl() {

    const reciter = getReciterObject();

    if (!reciter) return null;


    const paddedSurah = String(surahNumber).padStart(3, "0");


    return `${reciter.fullServer}/${paddedSurah}.mp3`;
}


/* =========================
   إيقاف كل تشغيل وإعادة الضبط
================================ */

function stopPlayback() {

    audio.pause();
    audio.currentTime = 0;
    audio.ontimeupdate = null;

    audio.removeAttribute("src");
    audio.load();

    playbackMode = "idle";

    currentAyah = null;

    rangeQueue = [];
    rangeQueueIndex = 0;

    if (typeof rangePreloadAudio !== "undefined") {
        rangePreloadAudio.src = "";
    }

    clearAllAyahHighlights();

    hidePlayer();

}


/* =========================
   تشغيل آية واحدة (بدون انتقال تلقائي)
================================ */

async function playSingleAyah(ayahNumber) {

    if (!ayahNumber) return;


    stopPlayback();


    if (!reciterSupportsAyahSelection(getReciterObject())) {

        updatePlayer(
            "هذا القارئ متاح للسورة كاملة فقط"
        );

        setTimeout(
            hidePlayer,
            2000
        );

        return;
    }


    playbackMode = "single";
    currentAyah = ayahNumber;

    setActiveAyah(ayahNumber);
    updatePlayer(`الآية ${ayahNumber}`);


    const timings = await loadTimingData();
    const timing = getTimingForAyah(ayahNumber);


    if (timings.length && timing) {

        const url = getFullSurahAudioUrl();

        if (!url) return;


        audio.src = url;

        audio.currentTime =
            timing.start;


        const stopAt =
            timing.end;


        audio.ontimeupdate = () => {

            if (
                playbackMode === "single"
                && audio.currentTime >= stopAt
            ) {

                audio.pause();
                audio.ontimeupdate = null;

                playbackMode = "idle";

                setActiveAyah(
                    ayahNumber,
                    false
                );

                if (playerPause)
                    playerPause.textContent = "▶";

            }

        };


        try {

            await audio.play();

        } catch (error) {

            console.error(
                "Impossible de lire l'audio :",
                error
            );

        }

        return;
    }


    const audioUrl =
        getAyahAudioUrl(ayahNumber);


    if (!audioUrl) {

        console.error(
            "Impossible de déterminer l'URL audio pour l'ayah",
            ayahNumber
        );

        return;
    }


    audio.src = audioUrl;
    audio.ontimeupdate = null;


    audio.play().catch(
        error =>
            console.error(
                "Impossible de lire l'audio :",
                error
            )
    );

}


/* =========================
   تشغيل السورة كاملة بدون أي توقف بين الآيات
================================ */

function playFullSurah() {

    audio.pause();
    audio.currentTime = 0;

    playbackMode = "full";
    currentAyah = null;

    clearAllAyahHighlights();

    updatePlayer("السورة كاملة");


    const url =
        getFullSurahAudioUrl();


    if (!url) {

        console.error(
            "تعذر تحديد رابط السورة الكاملة"
        );

        return;
    }


    audio.src = url;


    audio.play().catch(error => {

        console.error(
            "Impossible de lire la sourate complète :",
            error
        );

    });

}


/* =========================
   وضع تحديد النطاق (من آية إلى آية)
================================ */

let rangeSelectionActive = false;
let rangeStart = null;
let rangeQueue = [];
let rangeQueueIndex = 0;

const toggleRangeBtn =
    document.getElementById("toggle-range-mode");

const cancelRangeBtn =
    document.getElementById("cancel-range-mode");

const rangeModeHint =
    document.getElementById("range-mode-hint");

const playFullSurahBtn =
    document.getElementById("play-full-surah");

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
        .forEach(item =>
            item.classList.remove("is-range-start")
        );


    if (rangeModeHint) {

        rangeModeHint.textContent =
            "اضغط على رقم آية البداية، ثم رقم آية النهاية";

    }

}


function setRangeModeActive(active) {

    rangeSelectionActive = active;


    if (toggleRangeBtn) {

        toggleRangeBtn.classList.toggle(
            "active",
            active
        );

    }


    if (cancelRangeBtn) {

        cancelRangeBtn.classList.toggle(
            "hidden",
            !active
        );

    }


    if (rangeModeHint) {

        rangeModeHint.classList.toggle(
            "hidden",
            !active
        );

    }


    resetRangeSelection();

}


if (toggleRangeBtn) {

    toggleRangeBtn.addEventListener(
        "click",
        () => {

            setRangeModeActive(
                !rangeSelectionActive
            );

        }
    );

}


if (cancelRangeBtn) {

    cancelRangeBtn.addEventListener(
        "click",
        () => {

            setRangeModeActive(false);

        }
    );

}


if (playFullSurahBtn) {

    playFullSurahBtn.addEventListener(
        "click",
        () => {

            setRangeModeActive(false);
            playFullSurah();

        }
    );

}
/* =========================
   تحميل توقيتات الآيات
================================ */
async function loadTimingData() {

    const reciter = getReciterObject();

    // تجنّب إعادة التحميل إن كانت البيانات محمّلة مسبقًا لنفس السورة ونفس القارئ
    if (
        timingLoadedFor === surahNumber
        && timingReadId === (reciter ? reciter.timingReadId : null)
        && timingData.length
    ) {
        return timingData;
    }

    if (!reciter || !reciter.timingReadId) {
        // لا يوجد توقيت متاح لهذا القارئ: سنستخدم ملفات الآيات المنفصلة
        timingData = [];
        timingLoadedFor = surahNumber;
        timingReadId = reciter ? reciter.timingReadId : null;
        return timingData;
    }

    try {
        const response = await fetch(
            `https://mp3quran.net/api/v3/ayat_timing?surah=${surahNumber}&read=${reciter.timingReadId}`
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        timingData = Array.isArray(data)
            ? data
            : Array.isArray(data.ayat)
                ? data.ayat
                : Array.isArray(data.data)
                    ? data.data
                    : [];

        timingLoadedFor = surahNumber;
        timingReadId = reciter.timingReadId;

        return timingData;

    } catch (error) {
        console.error("Erreur chargement des timings :", error);

        timingData = [];
        timingLoadedFor = surahNumber;
        timingReadId = reciter.timingReadId;

        return timingData;
    }
}


/* =========================
   توقيت آية واحدة
================================ */
function getTimingForAyah(ayahNumber) {
    if (!Array.isArray(timingData) || !timingData.length) {
        return null;
    }

    const item = timingData.find(timing => {
        const number = Number(
            timing.ayah ??
            timing.ayah_number ??
            timing.verse ??
            timing.id
        );

        return number === Number(ayahNumber);
    });

    if (!item) {
        return null;
    }

    const start = Number(
        item.start_time ??
        item.start ??
        item.startTime
    );

    const end = Number(
        item.end_time ??
        item.end ??
        item.endTime
    );

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
        return null;
    }

    return {
        start: start / 1000,
        end: end / 1000
    };
}


/* =========================
   توقيت نطاق الآيات
================================ */
function getTimingRange(startAyah, endAyah) {
    const from = Math.min(startAyah, endAyah);
    const to = Math.max(startAyah, endAyah);

    const startTiming = getTimingForAyah(from);
    const endTiming = getTimingForAyah(to);

    if (!startTiming || !endTiming) {
        return null;
    }

    return {
        start: startTiming.start,
        end: endTiming.end
    };
}
/* =========================
   بدء تشغيل نطاق الآيات المحدد (تسلسل تلقائي بدون توقف)
================================ */

async function startRangePlayback(startAyah, endAyah) {

    const from = Math.min(startAyah, endAyah);
    const to = Math.max(startAyah, endAyah);

    setRangeModeActive(false);
    stopPlayback();


    if (!reciterSupportsAyahSelection(getReciterObject())) {

        updatePlayer(
            "هذا القارئ متاح للسورة كاملة فقط يتوفر قريبا"
        );

        setTimeout(
            hidePlayer,
            2000
        );

        return;
    }


    playbackMode = "range";
    currentAyah = from;

    updatePlayer(`الآيات ${from}–${to}`);

    const timings = await loadTimingData();
    const range = getTimingRange(from, to);

    if (!timings.length || !range) {

        console.warn(
            "لا توجد توقيتات متاحة لهذا القارئ، سيتم استخدام ملفات الآيات."
        );

        rangeQueue = [];

        for (let i = from; i <= to; i++)
            rangeQueue.push(i);

        rangeQueueIndex = 0;

        playCurrentRangeItem();

        return;
    }

    const url = getFullSurahAudioUrl();

    if (!url) return;

    audio.src = url;

    const stopAt = range.end;

    const startAudio = () => {

        if (playbackMode !== "range") return;

        audio.currentTime = range.start;

        audio.ontimeupdate = () => {

            if (
                playbackMode === "range"
                && audio.currentTime >= stopAt
            ) {

                audio.pause();
                audio.ontimeupdate = null;

                playbackMode = "idle";

                clearAllAyahHighlights();

                updatePlayer("اكتملت التلاوة");

                setTimeout(
                    hidePlayer,
                    1500
                );
            }
        };

        setActiveAyah(from);

        audio.play().catch(error => {

            console.error(
                "Impossible de lire la plage :",
                error
            );

        });
    };

    if (audio.readyState >= 1) {

        startAudio();

    } else {

        audio.addEventListener(
            "loadedmetadata",
            startAudio,
            { once: true }
        );

    }
}

// عنصر صوت مخفي لتحميل الآية التالية مسبقًا في الخلفية أثناء تشغيل الآية
// الحالية، بحيث يكون ملفها جاهزًا في ذاكرة التخزين المؤقت للمتصفح فور
// الوصول إليها ويقلّ الانتظار/التوقف بين الآيات إلى أدنى حد ممكن.
const rangePreloadAudio = new Audio();
rangePreloadAudio.preload = "auto";

function preloadNextRangeItem() {

    const nextUrl =
        getAyahAudioUrl(
            rangeQueue[rangeQueueIndex + 1]
        );

    if (!nextUrl) return;

    if (rangePreloadAudio.src !== nextUrl) {
        rangePreloadAudio.src = nextUrl;
        rangePreloadAudio.load();
    }

}

function playCurrentRangeItem() {

    if (
        rangeQueueIndex >= rangeQueue.length
    ) {

        playbackMode = "idle";

        clearAllAyahHighlights();

        updatePlayer("اكتملت التلاوة");

        setTimeout(
            hidePlayer,
            1500
        );

        return;
    }


    const ayahNumber =
        rangeQueue[rangeQueueIndex];


    currentAyah = ayahNumber;

    setActiveAyah(ayahNumber);

    updatePlayer(
        `الآيات ${rangeQueue[0]}–${rangeQueue[rangeQueue.length - 1]} • الآية ${ayahNumber}`
    );


    const url =
        getAyahAudioUrl(ayahNumber);


    if (!url) {

        rangeQueueIndex++;

        playCurrentRangeItem();

        return;
    }


    audio.src = url;


    audio.play()
        .then(() => {
            // نبدأ تحميل الآية التالية فور انطلاق الآية الحالية
            preloadNextRangeItem();
        })
        .catch(
            error =>
                console.error(
                    "Impossible de lire l'audio :",
                    error
                )
        );

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

                    ayahElement.classList.add(
                        "is-range-start"
                    );


                    if (rangeModeHint) {

                        rangeModeHint.textContent =
                            `بداية النطاق: الآية ${ayahNumber} — الآن اضغط على آية النهاية`;

                    }

                    return;
                }


                const startAyah = rangeStart;
                const endAyah = ayahNumber;


                setRangeModeActive(false);

                startRangePlayback(
                    startAyah,
                    endAyah
                );

                return;
            }


            /* ==== الوضع العادي: تشغيل آية واحدة فقط ==== */

            playSingleAyah(
                ayahNumber
            );

        }
    );

}


/* =========================
   AUDIO TERMINÉ
================================ */

audio.addEventListener(
    "ended",
    () => {


        if (
            playbackMode === "range"
            && rangeQueue.length
        ) {

            rangeQueueIndex++;

            playCurrentRangeItem();

            return;
        }


        if (
            playbackMode === "range"
        ) {

            playbackMode = "idle";

            clearAllAyahHighlights();

            updatePlayer(
                "اكتملت التلاوة"
            );

            setTimeout(
                hidePlayer,
                1500
            );

            return;
        }


        if (
            playbackMode === "full"
        ) {

            playbackMode = "idle";

            updatePlayer(
                "اكتملت السورة"
            );

            setTimeout(
                hidePlayer,
                1500
            );

            return;
        }


        // playbackMode === "single"

        if (currentAyah) {

            setActiveAyah(
                currentAyah,
                false
            );

        }


        if (playerPause) {

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


function updatePlayer(label) {

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

        const reciter =
            getReciterObject();

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

        surahPlayer.classList.add(
            "hidden"
        );

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

audio.addEventListener(
    "timeupdate",
    () => {

        if (
            !playerProgress
            || !audio.duration
        ) {
            return;
        }


        const percent =
            (audio.currentTime / audio.duration) * 100;


        playerProgress.style.width =
            `${percent}%`;

    }
);


/* =========================
   AUDIO ERROR
   -------------------------
   في حال تعذر تحميل ملف (مثلاً اتصال ضعيف)،
   لا نُبقي المستخدم عالقًا: ننتقل تلقائيًا للآية التالية
   في وضع النطاق، أو نوقف بهدوء في باقي الأوضاع.
================================ */

audio.addEventListener(
    "error",
    () => {

        console.error(
            "Erreur lors du chargement de l'audio."
        );

        if (
            playbackMode === "range"
            && rangeQueue.length
        ) {

            rangeQueueIndex++;
            playCurrentRangeItem();

            return;
        }

        if (
            playbackMode === "range"
        ) {

            playbackMode = "idle";

            clearAllAyahHighlights();

            updatePlayer(
                "Impossible de lire la récitation"
            );

            setTimeout(
                hidePlayer,
                1500
            );

            return;
        }

        if (playerPause) {
            playerPause.textContent = "▶";
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
   التنقل بين السور (السابقة / التالية)
================================ */

const previousSurahBtn =
    document.getElementById("previous-surah");

const nextSurahBtn =
    document.getElementById("next-surah");

function goToSurah(number) {

    if (number < 1 || number > 114) {
        return;
    }

    window.location.href =
        `surah.html?surah=${number}`;
}

function updateSurahNavButtons() {

    if (previousSurahBtn) {
        previousSurahBtn.disabled = surahNumber <= 1;
    }

    if (nextSurahBtn) {
        nextSurahBtn.disabled = surahNumber >= 114;
    }

}

if (previousSurahBtn) {

    previousSurahBtn.addEventListener(
        "click",
        () => goToSurah(surahNumber - 1)
    );

}

if (nextSurahBtn) {

    nextSurahBtn.addEventListener(
        "click",
        () => goToSurah(surahNumber + 1)
    );

}

updateSurahNavButtons();


/* =========================
   START
================================ */

populateReciterSelect();
loadSurah();