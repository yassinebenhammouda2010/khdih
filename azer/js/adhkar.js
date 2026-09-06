// ========================================
// Kihdih - الأذكار
// ========================================


// ========================================
// DONNÉES
// ========================================

const adhkar = {

    morning: [

        {
            text: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ",
            count: 1
        },

        {
            text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
            count: 100
        },

        {
            text: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
            count: 10
        }

    ],


    evening: [

        {
            text: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ",
            count: 1
        },

        {
            text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
            count: 100
        },

        {
            text: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ",
            count: 100
        }

    ],


    afterPrayer: [

        {
            text: "أَسْتَغْفِرُ اللَّهَ",
            count: 3
        },

        {
            text: "سُبْحَانَ اللَّهِ",
            count: 33
        },

        {
            text: "الْحَمْدُ لِلَّهِ",
            count: 33
        },

        {
            text: "اللَّهُ أَكْبَرُ",
            count: 34
        }

    ]

};


// ========================================
// ÉLÉMENTS
// ========================================

const container =
    document.getElementById("adhkar-container");

const categoryButtons =
    document.querySelectorAll(".category-button");


// ========================================
// AFFICHER
// ========================================

function displayAdhkar(category) {

    container.innerHTML = "";


    const list =
        adhkar[category];


    list.forEach((dhikr) => {

        let currentCount = 0;


        const card =
            document.createElement("div");

        card.className =
            "dhikr-card";


        card.innerHTML = `

            <p class="dhikr-text">
                ${dhikr.text}
            </p>

            <div class="dhikr-footer">

                <span class="dhikr-count">
                    0 / ${dhikr.count}
                </span>

                <button class="dhikr-button">
                    📿 تكرار
                </button>

            </div>

        `;


        const button =
            card.querySelector(".dhikr-button");

        const countElement =
            card.querySelector(".dhikr-count");


        button.addEventListener(
            "click",
            () => {

                currentCount++;


                countElement.textContent =
                    `${currentCount} / ${dhikr.count}`;


                if (
                    currentCount >= dhikr.count
                ) {

                    button.disabled = true;

                    button.textContent =
                        "✓ اكتمل";

                }

            }
        );


        container.appendChild(card);

    });

}


// ========================================
// CHANGER DE CATÉGORIE
// ========================================

categoryButtons.forEach((button) => {

    button.addEventListener(
        "click",
        () => {

            categoryButtons.forEach(
                (btn) => {
                    btn.classList.remove("active");
                }
            );


            button.classList.add("active");


            displayAdhkar(
                button.dataset.category
            );

        }
    );

});


// ========================================
// INITIALISATION
// ========================================

displayAdhkar("morning");