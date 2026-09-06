const feelings = document.querySelectorAll(".feeling");
const showButton = document.getElementById("show-aya");
const result = document.getElementById("aya-result");

let selectedFeeling = null;


// ========================================
// AYAT PAR SENTIMENT
// ========================================

const verses = {

    happy: [
        "93:11",
        "14:7",
        "16:18",
        "16:53",
        "16:78",
        "27:19",
        "28:73",
        "30:46",
        "31:12",
        "42:23"
    ],

    sad: [
        "94:5",
        "94:6",
        "12:86",
        "39:53",
        "2:286",
        "3:139",
        "9:40",
        "65:2",
        "65:3",
        "93:3"
    ],

    angry: [
        "3:134",
        "41:34",
        "23:96",
        "25:63",
        "42:37",
        "16:126",
        "17:53",
        "49:10",
        "5:8",
        "7:199"
    ],

    lonely: [
        "50:16",
        "57:4",
        "2:186",
        "13:28",
        "9:40",
        "58:7",
        "20:46",
        "26:62",
        "89:14",
        "96:14"
    ],

    anxious: [
        "13:28",
        "2:286",
        "94:5",
        "94:6",
        "65:2",
        "65:3",
        "3:173",
        "9:51",
        "10:62",
        "10:64"
    ],

    thankful: [
        "14:7",
        "31:12",
        "16:78",
        "16:114",
        "27:19",
        "34:13",
        "55:13",
        "93:11",
        "2:152",
        "76:3"
    ],
    hopeful: [
    "39:53",
    "94:5",
    "94:6",
    "12:87",
    "2:286"
],

patient: [
    "2:153",
    "3:200",
    "16:127",
    "39:10",
    "70:5"
],

trust: [
    "3:159",
    "5:23",
    "9:51",
    "14:12",
    "65:3"
],

mercy: [
    "39:53",
    "7:156",
    "21:107",
    "23:109",
    "6:54"
]

};


// ========================================
// CHOISIR UN SENTIMENT
// ========================================

feelings.forEach((button) => {

    button.addEventListener("click", () => {

        feelings.forEach((item) => {
            item.classList.remove("selected");
        });

        button.classList.add("selected");

        selectedFeeling =
            button.dataset.feeling;

        showButton.disabled = false;

    });

});


// ========================================
// RÉCUPÉRER UNE AYAH
// ========================================

async function getAyah(reference) {

    const url =
        `https://api.alquran.cloud/v1/ayah/${reference}/quran-uthmani-quran-academy`;

    const response =
        await fetch(url);

    if (!response.ok) {
        throw new Error("Impossible de récupérer l'ayah");
    }

    const data =
        await response.json();

    return data.data;
}


// ========================================
// AFFICHER UNE AYAH
// ========================================

showButton.addEventListener("click", async () => {

    if (!selectedFeeling) {
        return;
    }


    showButton.disabled = true;

    showButton.textContent =
        "جاري الاختيار...";


    result.innerHTML = `

        <div class="aya-result-icon">
            🌿
        </div>

        <h2>
            لحظة...
        </h2>

        <p>
            نختار لك آية
        </p>

    `;


    try {

        const list =
            verses[selectedFeeling];


        // Choisir une référence au hasard

        const reference =
            list[
                Math.floor(
                    Math.random() * list.length
                )
            ];


        const ayah =
            await getAyah(reference);


        result.innerHTML = `

            <div class="aya-result-icon">
                🌿
            </div>

            <h2>
                آية لك
            </h2>

            <p class="aya-text">
                ${ayah.text}
            </p>

            <p class="aya-reference">
                ${ayah.surah.name}
                —
                الآية ${ayah.numberInSurah}
            </p>

        `;


        result.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });


    } catch (error) {

        console.error(error);


        result.innerHTML = `

            <div class="aya-result-icon">
                ⚠️
            </div>

            <h2>
                حدث خطأ
            </h2>

            <p>
                حاول مرة أخرى
            </p>

        `;

    }


    showButton.disabled = false;

    showButton.textContent =
        "اقرأ لي ✨";

});