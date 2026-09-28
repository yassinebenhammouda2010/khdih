const container = document.getElementById("surahs-container");
const searchInput = document.getElementById("surah-search");
const ayahResultsContainer = document.getElementById("ayah-search-results");

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

        const revelationAr = surah.revelationType === "Meccan" ? "مكية" : "مدنية";

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
                    <span>${revelationAr}</span>
                    <span>${surah.numberOfAyahs} آية</span>
                </div>

            </div>
        `;


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
// RECHERCHE (سورة + آية)
// ========================================

let ayahSearchTimeout = null;
let ayahSearchToken = 0;

function hideAyahResults() {
    ayahResultsContainer.classList.add("hidden");
    ayahResultsContainer.innerHTML = "";
}

function showSurahsGrid() {
    container.classList.remove("hidden");
}

function hideSurahsGrid() {
    container.classList.add("hidden");
}

async function searchAyahs(query) {

    const thisSearchToken = ++ayahSearchToken;

    ayahResultsContainer.classList.remove("hidden");
    ayahResultsContainer.innerHTML = `
        <p class="ayah-search-loading">🔎 جاري البحث في الآيات...</p>
    `;

    try {

        const response = await fetch(
            `https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/quran-uthmani`
        );

        if (thisSearchToken !== ayahSearchToken) return;

        if (!response.ok) {
            throw new Error("Erreur de recherche");
        }

        const data = await response.json();
        const matches = (data.data && data.data.matches) || [];

        displayAyahResults(matches, query);

    } catch (error) {

        if (thisSearchToken !== ayahSearchToken) return;

        console.error(error);

        ayahResultsContainer.innerHTML = `
            <p class="ayah-search-empty">تعذر البحث في الآيات، حاول مرة أخرى</p>
        `;

    }

}

function displayAyahResults(matches, query) {

    if (matches.length === 0) {

        ayahResultsContainer.innerHTML = `
            <p class="ayah-search-empty">لا توجد آيات تحتوي على «${query}»</p>
        `;

        return;
    }

    const heading = `
        <p class="ayah-search-heading">
            📖 ${matches.length} نتيجة في الآيات
        </p>
    `;

    const cards = matches.slice(0, 20).map((match) => `
        <div class="ayah-result-card" data-surah="${match.surah.number}">
            <p class="ayah-result-text">${match.text}</p>
            <p class="ayah-result-ref">
                سورة ${match.surah.name} — الآية ${match.numberInSurah}
            </p>
        </div>
    `).join("");

    ayahResultsContainer.innerHTML = heading + cards;

    ayahResultsContainer.querySelectorAll(".ayah-result-card").forEach((card) => {

        card.addEventListener("click", () => {
            openSurah(parseInt(card.dataset.surah, 10));
        });

    });

}

searchInput.addEventListener(
    "input",
    () => {

        const rawSearch = searchInput.value.trim();
        const search = rawSearch.toLowerCase();

        const filtered =
            surahs.filter((surah) =>
                surah.name.includes(search) ||
                surah.englishName.toLowerCase().includes(search)
            );

        displaySurahs(filtered);

        clearTimeout(ayahSearchTimeout);

        if (rawSearch.length < 3) {
            hideAyahResults();
            showSurahsGrid();
            return;
        }

        ayahSearchTimeout = setTimeout(() => {
            searchAyahs(rawSearch);
        }, 450);

        if (filtered.length === 0) {
            hideSurahsGrid();
        } else {
            showSurahsGrid();
        }

    }
);


// ========================================
// LANCER
// ========================================

loadSurahs();