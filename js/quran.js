const container = document.getElementById("surahs-container");
const searchInput = document.getElementById("surah-search");
const reciterSelect = document.getElementById("reciter-select");
const ayahResultsContainer =
    document.getElementById("ayah-search-results");

const miniPlayer =
    document.getElementById("mini-player");

const miniPlayerSurah =
    document.getElementById("mini-player-surah");

const miniPlayerReciter =
    document.getElementById("mini-player-reciter");

const miniPlayerProgress =
    document.getElementById("mini-player-progress");

const miniPlayerToggle =
    document.getElementById("mini-player-toggle");

const miniPlayerClose =
    document.getElementById("mini-player-close");


/* =====================================================
   SURAHS
===================================================== */

let surahs = [];


/* =====================================================
   RECITERS
===================================================== */

const RECITER_CANDIDATES = [

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
        folder: "Yasser_Ad-Dussary_128kbps"
    }

];


let RECITERS = [
    ...RECITER_CANDIDATES
];


const RECITER_STORAGE_KEY =
    "kihdih_reciter";


/* =====================================================
   RECITER STORAGE
===================================================== */

function getSelectedReciterId() {

    try {

        return (
            localStorage.getItem(
                RECITER_STORAGE_KEY
            ) ||
            RECITERS[0]?.id ||
            "ar.alafasy"
        );

    } catch (error) {

        return (
            RECITERS[0]?.id ||
            "ar.alafasy"
        );

    }

}


function setSelectedReciter(id) {

    try {

        localStorage.setItem(
            RECITER_STORAGE_KEY,
            id
        );

    } catch (error) {

        console.warn(
            "localStorage indisponible"
        );

    }

}


function getSelectedReciter() {

    return (
        RECITERS.find(
            reciter =>
                reciter.id ===
                reciterSelect.value
        ) ||
        RECITERS[0]
    );

}


function getReciterName(id) {

    const reciter =
        RECITERS.find(
            item => item.id === id
        );

    return reciter
        ? reciter.name
        : id;

}


/* =====================================================
   VALIDATE RECITERS
===================================================== */

async function validateReciters() {

    try {

        const response =
            await fetch(
                "https://api.alquran.cloud/v1/edition/format/audio"
            );

        if (!response.ok) {
            throw new Error(
                "Impossible de vérifier les récitateurs"
            );
        }

        const data =
            await response.json();

        const validIds =
            new Set(
                (data.data || [])
                    .map(
                        edition =>
                            edition.identifier
                    )
            );

        RECITERS =
            RECITER_CANDIDATES.filter(
                reciter => {

                    if (
                        reciter.provider !==
                        "alquran"
                    ) {
                        return true;
                    }

                    return validIds.has(
                        reciter.id
                    );

                }
            );


        if (!RECITERS.length) {

            RECITERS = [
                RECITER_CANDIDATES[0],
                RECITER_CANDIDATES[
                    RECITER_CANDIDATES.length - 1
                ]
            ];

        }

    } catch (error) {

        console.warn(
            "Validation des récitateurs ignorée :",
            error
        );

        RECITERS = [
            ...RECITER_CANDIDATES
        ];

    }

}


/* =====================================================
   RECITER SELECT
===================================================== */

function populateReciterSelect() {

    const saved =
        getSelectedReciterId();

    reciterSelect.innerHTML =
        RECITERS
            .map(
                reciter => `
                    <option value="${reciter.id}">
                        ${reciter.name}
                    </option>
                `
            )
            .join("");


    if (
        RECITERS.some(
            reciter =>
                reciter.id === saved
        )
    ) {

        reciterSelect.value = saved;

    } else if (RECITERS[0]) {

        reciterSelect.value =
            RECITERS[0].id;

        setSelectedReciter(
            RECITERS[0].id
        );

    }

}


reciterSelect.addEventListener(
    "change",
    () => {

        setSelectedReciter(
            reciterSelect.value
        );

        stopAudio();

    }
);


/* =====================================================
   AUDIO
===================================================== */

const audioPlayer =
    new Audio();

audioPlayer.preload =
    "auto";


let currentPlayingSurah = null;

let currentSurahName = "";

let currentAyahIndex = -1;

let currentAyahs = [];

let currentAudioSources = [];

let currentAudioSourceIndex = 0;

let currentReciterId = null;

let playRequestToken = 0;


const audioManifestCache =
    new Map();


/* =====================================================
   HELPERS
===================================================== */

function pad3(number) {

    return String(number)
        .padStart(3, "0");

}


/* =====================================================
   EVERYAYAH URL
===================================================== */

function buildEveryAyahUrl(
    folder,
    surahNumber,
    ayahNumber
) {

    return (
        "https://everyayah.com/data/" +
        `${folder}/` +
        `${pad3(surahNumber)}` +
        `${pad3(ayahNumber)}.mp3`
    );

}


/* =====================================================
   AUDIO MANIFEST
===================================================== */

async function getSurahAudioManifest(
    surahNumber,
    reciter
) {

    const cacheKey =
        `${reciter.id}:${surahNumber}`;


    if (
        audioManifestCache.has(
            cacheKey
        )
    ) {

        return audioManifestCache.get(
            cacheKey
        );

    }


    let manifest = [];


    /* =========================
       EVERYAYAH
    ========================= */

    if (
        reciter.provider ===
        "everyayah"
    ) {

        const surah =
            surahs.find(
                item =>
                    item.number ===
                    surahNumber
            );

        if (!surah) {
            throw new Error(
                "Sourate introuvable"
            );
        }


        manifest =
            Array.from(
                {
                    length:
                        surah.numberOfAyahs
                },
                (_, index) => ({

                    numberInSurah:
                        index + 1,

                    sources: [
                        buildEveryAyahUrl(
                            reciter.folder,
                            surahNumber,
                            index + 1
                        )
                    ]

                })
            );

    }


    /* =========================
       ALQURAN CLOUD
    ========================= */

    else {

        const response =
            await fetch(
                `https://api.alquran.cloud/v1/surah/` +
                `${surahNumber}/` +
                `${encodeURIComponent(
                    reciter.id
                )}`
            );


        if (!response.ok) {

            throw new Error(
                "Audio indisponible"
            );

        }


        const data =
            await response.json();


        const ayahs =
            data?.data?.ayahs || [];


        manifest =
            ayahs.map(
                ayah => {

                    const sources = [];


                    if (ayah.audio) {

                        sources.push(
                            ayah.audio
                        );

                    }


                    if (
                        Array.isArray(
                            ayah.audioSecondary
                        )
                    ) {

                        ayah.audioSecondary
                            .forEach(
                                url => {

                                    if (
                                        url &&
                                        !sources.includes(
                                            url
                                        )
                                    ) {

                                        sources.push(
                                            url
                                        );

                                    }

                                }
                            );

                    }


                    return {

                        numberInSurah:
                            ayah.numberInSurah,

                        sources

                    };

                }
            );

    }


    if (
        !manifest.length
    ) {

        throw new Error(
            "Aucun fichier audio disponible"
        );

    }


    audioManifestCache.set(
        cacheKey,
        manifest
    );


    return manifest;

}


/* =====================================================
   UPDATE PLAY BUTTONS
===================================================== */

function updatePlayButtons() {

    document
        .querySelectorAll(
            ".surah-play-button"
        )
        .forEach(
            button => {

                const surahNumber =
                    Number(
                        button.dataset.surah
                    );


                const isPlaying =
                    surahNumber ===
                        currentPlayingSurah &&
                    !audioPlayer.paused;


                button.textContent =
                    isPlaying
                        ? "⏸"
                        : "▶";


                button.classList.toggle(
                    "playing",
                    isPlaying
                );

            }
        );


    if (miniPlayerToggle) {

        miniPlayerToggle.textContent =
            audioPlayer.paused
                ? "▶️"
                : "⏸️";

    }

}


/* =====================================================
   MINI PLAYER
===================================================== */

function updateMiniPlayer() {

    if (
        currentPlayingSurah === null ||
        currentAyahIndex < 0 ||
        !currentAyahs.length
    ) {

        return;

    }


    const ayah =
        currentAyahs[
            currentAyahIndex
        ];


    const ayahNumber =
        ayah?.numberInSurah ||
        currentAyahIndex + 1;


    miniPlayerSurah.textContent =
        `${currentSurahName} — الآية ${ayahNumber}`;


    miniPlayerReciter.textContent =
        getReciterName(
            currentReciterId
        );


    miniPlayer.classList.remove(
        "hidden"
    );

}


/* =====================================================
   PLAY AUDIO SAFELY
===================================================== */

async function safePlay() {

    try {

        await audioPlayer.play();

    } catch (error) {

        if (
            error?.name ===
            "AbortError"
        ) {
            return;
        }

        console.error(
            "Erreur audio :",
            error
        );

    }

}


/* =====================================================
   LOAD AUDIO
===================================================== */

function loadCurrentAudioSource() {

    const source =
        currentAudioSources[
            currentAudioSourceIndex
        ];


    if (!source) {

        handleBrokenAyahAudio();

        return;

    }


    audioPlayer.src =
        source;

    audioPlayer.load();

    safePlay();

}


/* =====================================================
   PLAY AYAH
===================================================== */

function playAyahAtIndex(
    index
) {

    if (
        index < 0 ||
        index >= currentAyahs.length
    ) {

        finishSurahPlayback();

        return;

    }


    currentAyahIndex =
        index;


    currentAudioSources = [
        ...currentAyahs[index]
            .sources
    ];


    currentAudioSourceIndex =
        0;


    updateMiniPlayer();

    updatePlayButtons();

    loadCurrentAudioSource();

}


/* =====================================================
   PLAY SURAH
===================================================== */

async function playSurah(
    surahNumber,
    surahName,
    startAyah = 1
) {

    const requestToken =
        ++playRequestToken;


    const reciter =
        getSelectedReciter();


    if (!reciter) {
        return;
    }


    const surah =
        surahs.find(
            item =>
                item.number ===
                surahNumber
        );


    if (!surah) {
        return;
    }


    try {

        const manifest =
            await getSurahAudioManifest(
                surahNumber,
                reciter
            );


        if (
            requestToken !==
            playRequestToken
        ) {

            return;

        }


        currentPlayingSurah =
            surahNumber;

        currentSurahName =
            surahName;

        currentAyahs =
            manifest;

        currentReciterId =
            reciter.id;


        let startIndex =
            Math.max(
                0,
                Number(startAyah) - 1
            );


        if (
            startIndex >=
            currentAyahs.length
        ) {

            startIndex = 0;

        }


        playAyahAtIndex(
            startIndex
        );

    } catch (error) {

        console.error(
            "Erreur préparation audio :",
            error
        );

        alert(
            "تعذر تشغيل التلاوة الآن. جرّب مرة أخرى أو اختر قارئًا آخر."
        );

    }

}


/* =====================================================
   BROKEN AUDIO
===================================================== */

function handleBrokenAyahAudio() {

    if (
        currentAudioSourceIndex + 1 <
        currentAudioSources.length
    ) {

        currentAudioSourceIndex++;

        loadCurrentAudioSource();

        return;

    }


    setTimeout(
        () => {

            playAyahAtIndex(
                currentAyahIndex + 1
            );

        },
        300
    );

}


/* =====================================================
   FINISH
===================================================== */

function finishSurahPlayback() {

    audioPlayer.pause();

    audioPlayer.removeAttribute(
        "src"
    );

    audioPlayer.load();


    currentPlayingSurah =
        null;

    currentAyahIndex =
        -1;

    currentAyahs = [];

    currentAudioSources = [];

    currentAudioSourceIndex =
        0;


    miniPlayer.classList.add(
        "hidden"
    );


    miniPlayerProgress.style.width =
        "0%";


    updatePlayButtons();

}


/* =====================================================
   STOP
===================================================== */

function stopAudio() {

    ++playRequestToken;


    audioPlayer.pause();

    audioPlayer.removeAttribute(
        "src"
    );

    audioPlayer.load();


    currentPlayingSurah =
        null;

    currentSurahName =
        "";

    currentAyahIndex =
        -1;

    currentAyahs = [];

    currentAudioSources = [];

    currentAudioSourceIndex =
        0;

    currentReciterId =
        null;


    miniPlayer.classList.add(
        "hidden"
    );


    miniPlayerProgress.style.width =
        "0%";


    updatePlayButtons();

}


/* =====================================================
   AUDIO EVENTS
===================================================== */

audioPlayer.addEventListener(
    "play",
    updatePlayButtons
);


audioPlayer.addEventListener(
    "pause",
    updatePlayButtons
);


/*
   Progression générale
*/

audioPlayer.addEventListener(
    "timeupdate",
    () => {

        if (
            !audioPlayer.duration ||
            !currentAyahs.length ||
            currentAyahIndex < 0
        ) {

            return;

        }


        const ayahProgress =
            audioPlayer.currentTime /
            audioPlayer.duration;


        const totalProgress =
            (
                (
                    currentAyahIndex +
                    ayahProgress
                ) /
                currentAyahs.length
            ) * 100;


        miniPlayerProgress.style.width =
            `${Math.min(
                totalProgress,
                100
            )}%`;

    }
);


/*
   Passage automatique
   à l'ayah suivante
*/

audioPlayer.addEventListener(
    "ended",
    () => {

        playAyahAtIndex(
            currentAyahIndex + 1
        );

    }
);


/*
   Erreur audio
*/

audioPlayer.addEventListener(
    "error",
    () => {

        if (
            currentPlayingSurah !== null
        ) {

            handleBrokenAyahAudio();

        }

    }
);


/* =====================================================
   MINI PLAYER BUTTONS
===================================================== */

miniPlayerToggle.addEventListener(
    "click",
    () => {

        if (!audioPlayer.src) {
            return;
        }


        if (
            audioPlayer.paused
        ) {

            safePlay();

        } else {

            audioPlayer.pause();

        }

    }
);


miniPlayerClose.addEventListener(
    "click",
    () => {

        stopAudio();

    }
);


/* =====================================================
   LOAD SURAHS
===================================================== */

async function loadSurahs() {

    container.innerHTML = `
        <p class="loading">
            جاري تحميل سور القرآن...
        </p>
    `;


    try {

        const response =
            await fetch(
                "https://api.alquran.cloud/v1/surah"
            );


        if (!response.ok) {

            throw new Error(
                "Erreur chargement sourates"
            );

        }


        const data =
            await response.json();


        surahs =
            data.data || [];


        displaySurahs(
            surahs
        );


    } catch (error) {

        console.error(
            error
        );


        container.innerHTML = `
            <p class="loading">
                تعذر تحميل سور القرآن
            </p>
        `;

    }

}


/* =====================================================
   DISPLAY SURAHS
===================================================== */

function displaySurahs(
    list
) {

    container.innerHTML =
        "";


    if (!list.length) {

        container.innerHTML = `
            <p class="loading">
                لم يتم العثور على السورة
            </p>
        `;

        return;

    }


    list.forEach(
        surah => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "surah-card";


            const revelationAr =
                surah.revelationType ===
                "Meccan"
                    ? "مكية"
                    : "مدنية";


            card.innerHTML = `

                <div class="surah-number">
                    ${surah.number}
                </div>

                <div class="surah-info">

                    <div class="surah-name">
                        ${surah.name}
                    </div>

                    <div class="surah-english">
                        ${surah.englishName}
                    </div>

                    <div class="surah-meta">

                        <span>
                            ${revelationAr}
                        </span>

                        <span>
                            ${surah.numberOfAyahs} آية
                        </span>

                    </div>

                </div>

                <button
                    class="surah-play-button"
                    data-surah="${surah.number}"
                    type="button"
                    aria-label="استماع من أول السورة"
                    title="استماع من أول السورة"
                >
                    ▶
                </button>

            `;


            /*
               Clic sur la carte :
               ouvrir la page de lecture
            */

            card.addEventListener(
                "click",
                event => {

                    if (
                        event.target.closest(
                            ".surah-play-button"
                        )
                    ) {
                        return;
                    }


                    openSurah(
                        surah.number
                    );

                }
            );


            /*
               Bouton lecture
            */

            const playButton =
                card.querySelector(
                    ".surah-play-button"
                );


            playButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    /*
                       Si la même sourate
                       joue déjà :
                       pause
                    */

                    if (
                        currentPlayingSurah ===
                            surah.number &&
                        !audioPlayer.paused
                    ) {

                        audioPlayer.pause();

                        return;

                    }


                    /*
                       Si elle est en pause :
                       reprendre
                    */

                    if (
                        currentPlayingSurah ===
                            surah.number &&
                        audioPlayer.paused &&
                        audioPlayer.src
                    ) {

                        safePlay();

                        return;

                    }


                    /*
                       Nouvelle lecture
                       depuis le début
                    */

                    playSurah(
                        surah.number,
                        surah.name,
                        1
                    );

                }
            );


            container.appendChild(
                card
            );

        }
    );


    updatePlayButtons();

}


/* =====================================================
   OPEN SURAH
===================================================== */

function openSurah(
    surahNumber,
    ayahNumber = null
) {

    const ayahPart =
        ayahNumber
            ? `&ayah=${ayahNumber}`
            : "";


    window.location.href =
        `surah.html?surah=${surahNumber}${ayahPart}`;

}


/* =====================================================
   SEARCH AYAH
===================================================== */

let ayahSearchTimeout =
    null;

let ayahSearchToken =
    0;


function hideAyahResults() {

    ayahResultsContainer
        .classList
        .add("hidden");

    ayahResultsContainer.innerHTML =
        "";

}


function showSurahsGrid() {

    container.classList.remove(
        "hidden"
    );

}


function hideSurahsGrid() {

    container.classList.add(
        "hidden"
    );

}


async function searchAyahs(
    query
) {

    const thisToken =
        ++ayahSearchToken;


    ayahResultsContainer
        .classList
        .remove("hidden");


    ayahResultsContainer.innerHTML = `

        <p class="ayah-search-loading">
            🔎 جاري البحث في الآيات...
        </p>

    `;


    try {

        const response =
            await fetch(
                `https://api.alquran.cloud/v1/search/` +
                `${encodeURIComponent(query)}` +
                `/all/quran-uthmani`
            );


        if (
            thisToken !==
            ayahSearchToken
        ) {
            return;
        }


        if (!response.ok) {

            throw new Error(
                "Erreur recherche"
            );

        }


        const data =
            await response.json();


        const matches =
            data?.data?.matches || [];


        displayAyahResults(
            matches,
            query
        );


    } catch (error) {

        if (
            thisToken !==
            ayahSearchToken
        ) {
            return;
        }


        console.error(
            error
        );


        ayahResultsContainer.innerHTML = `

            <p class="ayah-search-empty">
                تعذر البحث في الآيات، حاول مرة أخرى
            </p>

        `;

    }

}


/* =====================================================
   DISPLAY AYAH RESULTS
===================================================== */

function displayAyahResults(
    matches,
    query
) {

    if (!matches.length) {

        ayahResultsContainer.innerHTML = `

            <p class="ayah-search-empty">
                لا توجد آيات تحتوي على «${query}»
            </p>

        `;

        return;

    }


    const heading = `

        <p class="ayah-search-heading">
            📖 ${matches.length} نتيجة في الآيات
        </p>

    `;


    const cards =
        matches
            .slice(0, 20)
            .map(
                match => `

                    <div
                        class="ayah-result-card"
                        data-surah="${match.surah.number}"
                        data-ayah="${match.numberInSurah}"
                    >

                        <p class="ayah-result-text">
                            ${match.text}
                        </p>

                        <p class="ayah-result-ref">
                            سورة ${match.surah.name}
                            — الآية ${match.numberInSurah}
                        </p>

                    </div>

                `
            )
            .join("");


    ayahResultsContainer.innerHTML =
        heading + cards;


    /*
       Cliquer sur un résultat
       ouvre la sourate
       et prépare l'ayah demandée.
    */

    ayahResultsContainer
        .querySelectorAll(
            ".ayah-result-card"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        const surahNumber =
                            Number(
                                card.dataset.surah
                            );

                        const ayahNumber =
                            Number(
                                card.dataset.ayah
                            );


                        openSurah(
                            surahNumber,
                            ayahNumber
                        );

                    }
                );

            }
        );

}


/* =====================================================
   SEARCH INPUT
===================================================== */

searchInput.addEventListener(
    "input",
    () => {

        const rawSearch =
            searchInput.value.trim();


        const search =
            rawSearch.toLowerCase();


        /*
           Recherche des sourates
        */

        const filtered =
            surahs.filter(
                surah =>
                    surah.name.includes(
                        search
                    ) ||
                    surah.englishName
                        .toLowerCase()
                        .includes(
                            search
                        )
            );


        displaySurahs(
            filtered
        );


        clearTimeout(
            ayahSearchTimeout
        );


        /*
           Recherche ayahs
           à partir de 3 caractères
        */

        if (
            rawSearch.length < 3
        ) {

            hideAyahResults();

            showSurahsGrid();

            return;

        }


        ayahSearchTimeout =
            setTimeout(
                () => {

                    searchAyahs(
                        rawSearch
                    );

                },
                450
            );


        if (
            filtered.length === 0
        ) {

            hideSurahsGrid();

        } else {

            showSurahsGrid();

        }

    }
);


/* =====================================================
   INITIALISATION
===================================================== */

async function initQuranPage() {

    await validateReciters();

    populateReciterSelect();

    await loadSurahs();

}


initQuranPage();