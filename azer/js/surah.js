const surahHeader =
    document.getElementById("surah-header");

const ayahsContainer =
    document.getElementById("ayahs-container");


// ========================================
// RÉCUPÉRER LE NUMÉRO DE LA SOURATE
// ========================================

const params =
    new URLSearchParams(window.location.search);

const surahNumber =
    Number(params.get("surah"));


// ========================================
// BOUTONS
// ========================================

const previousButtons = [
    document.getElementById("previous-surah"),
    document.getElementById("previous-surah-bottom")
];

const nextButtons = [
    document.getElementById("next-surah"),
    document.getElementById("next-surah-bottom")
];


// ========================================
// CHARGER LA SOURATE
// ========================================

async function loadSurah() {

    if (
        !surahNumber ||
        surahNumber < 1 ||
        surahNumber > 114
    ) {

        showError();

        return;
    }


    try {

        const response = await fetch(
            `https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`
        );


        if (!response.ok) {
            throw new Error("Erreur API");
        }


        const data =
            await response.json();


        const surah =
            data.data;


        displaySurah(surah);

        setupNavigation();


    } catch (error) {

        console.error(error);

        showError();

    }

}


// ========================================
// AFFICHER LA SOURATE
// ========================================

function displaySurah(surah) {

    surahHeader.innerHTML = `

        <h1>
            ${surah.name}
        </h1>

        <p>
            ${surah.englishName}
        </p>

        <p class="surah-meta">
            عدد الآيات: ${surah.numberOfAyahs}
        </p>

    `;


    ayahsContainer.innerHTML = "";


    surah.ayahs.forEach((ayah) => {

        const ayahElement =
            document.createElement("div");


        ayahElement.className =
            "ayah-item";


        ayahElement.innerHTML = `

            <p class="ayah-text">

                <span class="ayah-number">
                    ${ayah.numberInSurah}
                </span>

                ${ayah.text}

            </p>

        `;


        ayahsContainer.appendChild(
            ayahElement
        );

    });

}


// ========================================
// NAVIGATION
// ========================================

function setupNavigation() {

    const previousSurah =
        surahNumber - 1;

    const nextSurah =
        surahNumber + 1;


    previousButtons.forEach((button) => {

        if (!button) return;


        if (previousSurah < 1) {

            button.disabled = true;

            button.style.opacity = "0.4";

            button.style.cursor = "not-allowed";

        } else {

            button.addEventListener(
                "click",
                () => {

                    window.location.href =
                        `surah.html?surah=${previousSurah}`;

                }
            );

        }

    });


    nextButtons.forEach((button) => {

        if (!button) return;


        if (nextSurah > 114) {

            button.disabled = true;

            button.style.opacity = "0.4";

            button.style.cursor = "not-allowed";

        } else {

            button.addEventListener(
                "click",
                () => {

                    window.location.href =
                        `surah.html?surah=${nextSurah}`;

                }
            );

        }

    });

}


// ========================================
// ERREUR
// ========================================

function showError() {

    surahHeader.innerHTML = `

        <h1>
            سورة غير موجودة
        </h1>

        <p>
            الرجاء العودة إلى قائمة السور
        </p>

    `;

    ayahsContainer.innerHTML = "";

}


// ========================================
// LANCER
// ========================================

loadSurah();