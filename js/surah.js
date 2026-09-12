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
let currentAudioUrl = null;


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
            "Yasser_Ad-Dussary_128kbps"
    }

];


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
                    title="استمع إلى هذه الآية"
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
   AUDIO URL - EVERYAYAH
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
   GET AUDIO URL
================================ */

async function getAyahAudioUrl(
    ayahNumber
) {

    const reciterId =
        getSelectedReciter();


    const reciter =
        RECITERS.find(
            item => item.id === reciterId
        );


    if (!reciter) {

        return null;

    }


    /* =========================
       EVERYAYAH
    ========================== */

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


    /* =========================
       ALQURAN CLOUD
    ========================== */

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
   START AYAH
================================ */

async function playAyah(
    ayahNumber
) {

    if (!ayahNumber) return;


    /*
       Arrêter l'audio précédent.
    */

    audio.pause();

    audio.currentTime = 0;


    currentAyah =
        ayahNumber;


    /*
       Mettre à jour l'affichage
    */

    setActiveAyah(
        ayahNumber
    );


    updatePlayer(
        ayahNumber
    );


    /*
       Récupérer l'URL
    */

    const audioUrl =
        await getAyahAudioUrl(
            ayahNumber
        );


    if (!audioUrl) {

        console.error(
            "Audio introuvable pour l'ayah",
            ayahNumber
        );

        return;

    }


    currentAudioUrl =
        audioUrl;


    audio.src =
        audioUrl;


    try {

        await audio.play();


        updatePlayer(
            ayahNumber
        );


    } catch (error) {

        console.error(
            "Impossible de lire l'audio :",
            error
        );

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


            /*
               IMPORTANT :

               Chaque clic choisit simplement
               cette ayah.

               L'audio précédent est arrêté.

               Cette ayah est lue UNE SEULE FOIS.

               Elle ne passe PAS automatiquement
               à l'ayah suivante.
            */

            playAyah(
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

        /*
           IMPORTANT :

           On ne lance PAS l'ayah suivante.

           La lecture s'arrête simplement.
        */

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


const playerPause =
    document.getElementById(
        "player-pause"
    );


function updatePlayer(
    ayahNumber
) {

    if (surahPlayer) {

        surahPlayer.classList.add(
            "show"
        );

    }


    if (playerAyah) {

        playerAyah.textContent =
            `الآية ${ayahNumber}`;

    }


    if (playerPause) {

        playerPause.textContent =
            audio.paused
                ? "▶"
                : "⏸";

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

loadSurah();