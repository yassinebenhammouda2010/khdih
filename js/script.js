// ========================================
// Kihdih - Script principal
// ========================================


// ========================================
// 1. HORLOGE
// ========================================

function updateClock() {

    const now = new Date();

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const clock = document.getElementById("current-time");

    if (clock) {
        clock.textContent = `${hours}:${minutes}:${seconds}`;
    }
}

updateClock();

setInterval(updateClock, 1000);


// ========================================
// 2. VARIABLES GLOBALES
// ========================================

let nextPrayer = null;
let prayerCountdownInterval = null;


// ========================================
// 3. ÉLÉMENTS HTML
// ========================================

const locationButton =
    document.getElementById("location-button");

const locationStatus =
    document.getElementById("location-status");


// ========================================
// 4. RÉCUPÉRER LES HORAIRES
// ========================================

async function getPrayerTimes(latitude, longitude) {

    const today = new Date();

    const day =
        String(today.getDate()).padStart(2, "0");

    const month =
        String(today.getMonth() + 1).padStart(2, "0");

    const year =
        today.getFullYear();

    const date =
        `${day}-${month}-${year}`;


    const url =
        `https://api.aladhan.com/v1/timings/${date}` +
        `?latitude=${latitude}` +
        `&longitude=${longitude}` +
        `&method=18`;


    try {

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Erreur API");
        }

        const data = await response.json();

        const timings = data.data.timings;

        displayPrayerTimes(timings);

    } catch (error) {

        console.error(error);

        if (locationStatus) {
            locationStatus.textContent =
                "تعذر الحصول على مواقيت الصلاة";
        }
    }
}


// ========================================
// 5. AFFICHER LES HORAIRES
// ========================================

function displayPrayerTimes(timings) {

    const fajrEl = document.getElementById("fajr-time");
    const dhuhrEl = document.getElementById("dhuhr-time");
    const asrEl = document.getElementById("asr-time");
    const maghribEl = document.getElementById("maghrib-time");
    const ishaEl = document.getElementById("isha-time");

    if (fajrEl) fajrEl.textContent = cleanTime(timings.Fajr);
    if (dhuhrEl) dhuhrEl.textContent = cleanTime(timings.Dhuhr);
    if (asrEl) asrEl.textContent = cleanTime(timings.Asr);
    if (maghribEl) maghribEl.textContent = cleanTime(timings.Maghrib);
    if (ishaEl) ishaEl.textContent = cleanTime(timings.Isha);


    findNextPrayer(timings);
}


// ========================================
// 6. NETTOYER L'HEURE
// ========================================

function cleanTime(time) {

    return time.split(" ")[0];
}


// ========================================
// 7. TROUVER LA PROCHAINE PRIÈRE
// ========================================

function findNextPrayer(timings) {

    const prayers = [
        {
            name: "الفجر",
            time: cleanTime(timings.Fajr)
        },
        {
            name: "الظهر",
            time: cleanTime(timings.Dhuhr)
        },
        {
            name: "العصر",
            time: cleanTime(timings.Asr)
        },
        {
            name: "المغرب",
            time: cleanTime(timings.Maghrib)
        },
        {
            name: "العشاء",
            time: cleanTime(timings.Isha)
        }
    ];


    const now = new Date();

    const currentMinutes =
        now.getHours() * 60 +
        now.getMinutes();


    nextPrayer = null;


    for (const prayer of prayers) {

        const [hours, minutes] =
            prayer.time.split(":").map(Number);

        const prayerMinutes =
            hours * 60 + minutes;


        if (prayerMinutes > currentMinutes) {

            nextPrayer = prayer;

            break;
        }
    }


    // Si toutes les prières sont passées
    if (!nextPrayer) {

        nextPrayer = {
            ...prayers[0],
            tomorrow: true
        };
    }


    const nextNameEl = document.getElementById("next-prayer-name");
    const nextTimeEl = document.getElementById("next-prayer-time");

    if (nextNameEl) nextNameEl.textContent = nextPrayer.name;
    if (nextTimeEl) nextTimeEl.textContent = nextPrayer.time;


    startCountdown(nextPrayer);
}


// ========================================
// 8. COMPTE À REBOURS
// ========================================

function startCountdown(prayer) {

    if (prayerCountdownInterval) {
        clearInterval(prayerCountdownInterval);
    }


    function updateCountdown() {

        const now = new Date();

        const [hours, minutes] =
            prayer.time.split(":").map(Number);


        const target = new Date();

        target.setHours(hours, minutes, 0, 0);


        // Si c'est demain
        if (prayer.tomorrow) {
            target.setDate(target.getDate() + 1);
        }


        let difference =
            target.getTime() - now.getTime();


        const countdownEl = document.getElementById("prayer-countdown");

        if (difference <= 0) {

            if (countdownEl) {
                countdownEl.textContent = "حان وقت الصلاة";
            }

            clearInterval(prayerCountdownInterval);

            return;
        }


        const totalSeconds =
            Math.floor(difference / 1000);


        const hoursLeft =
            Math.floor(totalSeconds / 3600);

        const minutesLeft =
            Math.floor((totalSeconds % 3600) / 60);

        const secondsLeft =
            totalSeconds % 60;


        if (countdownEl) {
            countdownEl.textContent =
                `متبقي ${String(hoursLeft).padStart(2, "0")}:` +
                `${String(minutesLeft).padStart(2, "0")}:` +
                `${String(secondsLeft).padStart(2, "0")}`;
        }
    }


    updateCountdown();

    prayerCountdownInterval =
        setInterval(updateCountdown, 1000);
}


// ========================================
// 9. LOCALISATION
// ========================================

if (locationButton) {

    locationButton.addEventListener(
        "click",
        () => {

            if (!navigator.geolocation) {

                if (locationStatus) {
                    locationStatus.textContent =
                        "المتصفح لا يدعم تحديد الموقع";
                }

                return;
            }


            if (locationStatus) {
                locationStatus.textContent =
                    "جاري تحديد موقعك...";
            }


            navigator.geolocation.getCurrentPosition(

                async (position) => {

                    const latitude =
                        position.coords.latitude;

                    const longitude =
                        position.coords.longitude;


                    console.log(
                        "Position récupérée"
                    );


                    if (locationStatus) {
                        locationStatus.textContent =
                            "تم تحديد موقعك بنجاح ✓";
                    }


                    await getPrayerTimes(
                        latitude,
                        longitude
                    );

                },


                () => {

                    if (locationStatus) {
                        locationStatus.textContent =
                            "تعذر تحديد موقعك";
                    }

                }

            );

        }
    );
}