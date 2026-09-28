/* ========================================
   Kihdih - تلاوات مشهورة
======================================== */


/*
    لا يوجد اختيار للقارئ هنا.
    Kihdih يحدد التلاوات بنفسه.
*/


const TILAWAT = [

    {
        ayah: "قُل لِّمَنِ الْأَرْضُ وَمَن فِيهَا",
        surah: "سورة المؤمنون",
        number: "84",
        audio: "assets/audio/9ol liman al ardhou.wav"
    },

    {
        ayah: "الَّذِي خَلَقَنِي فَهُوَ يَهْدِينِ",
        surah: "سورة الشعراء",
        number: "78",
        audio: "assets/audio/aladhi khala9ani fhowa yahdin.wav"
    },

    {
        ayah: "قَالَ إِنَّهَا كَلِمَةٌ هُوَ قَائِلُهَا",
        surah: "سورة المؤمنون",
        number: "100",
        audio: "assets/audio/kala inaha kalimat howa.wav"
    },

    {
        ayah: "لَئِنْ أَطَعْتُمْ",
        surah: "",
        number: "",
        audio: "assets/audio/la2in ata3tom.wav"
    },

    {
        ayah: "إِنَّا خَلَقْنَا الْإِنسَانَ مِن نُّطْفَةٍ أَمْشَاجٍ",
        surah: "سورة الإنسان",
        number: "2",
        audio: "assets/audio/notfata ala9a.wav"
    },

    {
        ayah: "يَا لَيْتَهَا كَانَتِ الْقَاضِيَةَ",
        surah: "سورة الحاقة",
        number: "27",
        audio: "assets/audio/ya laytaha kanit al 9adhia.wav"
    },

    {
        ayah: "أَفَحَسِبْتُمْ أَنَّمَا خَلَقْنَاكُمْ عَبَثًا",
        surah: "سورة المؤمنون",
        number: "115",
        audio: "assets/audio/afa hasibtom inama 5ala9nakom 3abatha.wav"
    }

];


const container = document.getElementById("tilawat-container");


function renderTilawat() {

    if (!container) {
        return;
    }

    container.innerHTML = "";


    TILAWAT.forEach((tilawah, index) => {

        const card = document.createElement("article");

        card.className = "tilawat-card";


        card.innerHTML = `

            <h2>
                تلاوة ${index + 1}
            </h2>

            <p class="tilawat-surah">
                ${tilawah.surah}
                ${tilawah.number ? ` - الآية ${tilawah.number}` : ""}
            </p>

            <p class="tilawat-ayah">
                ${tilawah.ayah}
            </p>

            ${
                tilawah.audio
                ? `
                    <audio
                        class="tilawat-audio"
                        controls
                        preload="none"
                    >
                        <source
                            src="${tilawah.audio}"
                            type="audio/wav"
                        >

                        متصفحك لا يدعم تشغيل الصوت.
                    </audio>
                `
                : `
                    <p>
                        سيتم إضافة التلاوة قريبًا.
                    </p>
                `
            }

        `;


        container.appendChild(card);

    });

}


renderTilawat();