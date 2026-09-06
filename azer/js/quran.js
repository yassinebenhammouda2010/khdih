const container = document.getElementById("surahs-container");
const searchInput = document.getElementById("surah-search");

let surahs = [];


// ========================================
// RÉCUPÉRER LES 114 SOURATES
// ========================================

async function loadSurahs() {

    container.innerHTML = `
        <p class="loading">
            جاري تحميل سور القرآن...
        </p>
    `;

    try {

        const response = await fetch(
            "https://api.alquran.cloud/v1/surah"
        );

        if (!response.ok) {
            throw new Error("Erreur lors du chargement");
        }

        const data = await response.json();

        surahs = data.data;

        displaySurahs(surahs);

    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <p class="loading">
                تعذر تحميل سور القرآن
            </p>
        `;
    }
}


// ========================================
// AFFICHER LES SOURATES
// ========================================

function displaySurahs(list) {

    container.innerHTML = "";

    if (list.length === 0) {

        container.innerHTML = `
            <p class="loading">
                لم يتم العثور على السورة
            </p>
        `;

        return;
    }


    list.forEach((surah) => {

        const card =
            document.createElement("div");

        card.className = "surah-card";


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

            </div>
        `;


        // Cliquer sur une sourate
        card.addEventListener("click", () => {

            openSurah(surah.number);

        });


        container.appendChild(card);

    });
}


// ========================================
// OUVRIR UNE SOURATE
// ========================================

function openSurah(surahNumber) {

    window.location.href =
        `surah.html?surah=${surahNumber}`;
}


// ========================================
// RECHERCHE
// ========================================

searchInput.addEventListener(
    "input",
    () => {

        const search =
            searchInput.value.trim().toLowerCase();


        const filtered =
            surahs.filter((surah) =>
                surah.name.includes(search) ||
                surah.englishName.toLowerCase().includes(search)
            );


        displaySurahs(filtered);

    }
);


// ========================================
// LANCER
// ========================================

loadSurahs();