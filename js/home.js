// ========================================
// Kihdih - ACCUEIL
// ========================================

const nextPrayerName =
    document.getElementById("home-next-prayer");

const nextPrayerTime =
    document.getElementById("home-next-time");

const countdownElement =
    document.getElementById("home-countdown");


let countdownInterval = null;


// ========================================
// RÉCUPÉRER LES HORAIRES
// ========================================

async function loadHomePrayerTimes(
    latitude,
    longitude
) {

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

        const response =
            await fetch(url);


        if (!response.ok) {
            throw new Error("Erreur API");
        }


        const data =
            await response.json();


        findHomeNextPrayer(
            data.data.timings
        );


    } catch (error) {

        console.error(error);

        nextPrayerName.textContent =
            "تعذر تحميل المواقيت";

    }

}


// ========================================
// PROCHAINE PRIÈRE
// ========================================

function findHomeNextPrayer(
    timings
) {

    const prayers = [

        {
            name: "الفجر",
            time: timings.Fajr
        },

        {
            name: "الظهر",
            time: timings.Dhuhr
        },

        {
            name: "العصر",
            time: timings.Asr
        },

        {
            name: "المغرب",
            time: timings.Maghrib
        },

        {
            name: "العشاء",
            time: timings.Isha
        }

    ];


    const now = new Date();


    const currentMinutes =
        now.getHours() * 60 +
        now.getMinutes();


    let next = null;


    for (const prayer of prayers) {

        const time =
            prayer.time.split(" ")[0];


        const [
            hours,
            minutes
        ] =
            time.split(":").map(Number);


        const prayerMinutes =
            hours * 60 + minutes;


        if (
            prayerMinutes >
            currentMinutes
        ) {

            next = {
                name: prayer.name,
                time
            };

            break;

        }

    }


    let tomorrow = false;


    if (!next) {

        const time =
            prayers[0].time.split(" ")[0];

        next = {
            name: prayers[0].name,
            time
        };

        tomorrow = true;

    }


    nextPrayerName.textContent =
        next.name;

    nextPrayerTime.textContent =
        next.time;


    startHomeCountdown(
        next,
        tomorrow
    );

}


// ========================================
// COMPTE À REBOURS
// ========================================

function startHomeCountdown(
    prayer,
    tomorrow
) {

    if (countdownInterval) {

        clearInterval(
            countdownInterval
        );

    }


    function update() {

        const now = new Date();


        const [
            hours,
            minutes
        ] =
            prayer.time
                .split(":")
                .map(Number);


        const target = new Date();


        target.setHours(
            hours,
            minutes,
            0,
            0
        );


        if (tomorrow) {

            target.setDate(
                target.getDate() + 1
            );

        }


        const difference =
            target.getTime() -
            now.getTime();


        if (difference <= 0) {

            countdownElement.textContent =
                "حان وقت الصلاة";

            clearInterval(
                countdownInterval
            );

            return;

        }


        const totalSeconds =
            Math.floor(
                difference / 1000
            );


        const hoursLeft =
            Math.floor(
                totalSeconds / 3600
            );


        const minutesLeft =
            Math.floor(
                (totalSeconds % 3600) / 60
            );


        const secondsLeft =
            totalSeconds % 60;


        countdownElement.textContent =
            `متبقي ` +
            `${String(hoursLeft).padStart(2, "0")}:` +
            `${String(minutesLeft).padStart(2, "0")}:` +
            `${String(secondsLeft).padStart(2, "0")}`;

    }


    update();


    countdownInterval =
        setInterval(
            update,
            1000
        );

}


// ========================================
// LOCALISATION
// ========================================

function requestLocation() {

    if (!navigator.geolocation) {

        nextPrayerName.textContent =
            "الموقع غير مدعوم";

        return;

    }


    navigator.geolocation.getCurrentPosition(

        (position) => {

            loadHomePrayerTimes(
                position.coords.latitude,
                position.coords.longitude
            );

        },

        () => {

            nextPrayerName.textContent =
                "فعّل الموقع لمعرفة الصلاة القادمة";

        }

    );

}


requestLocation();