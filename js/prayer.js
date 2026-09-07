// ========================================
// Kihdih - الصلاة
// ========================================

const locationButton =
    document.getElementById("location-button");

const locationStatus =
    document.getElementById("location-status");

let countdownInterval = null;


// ========================================
// DATE
// ========================================

function displayDate() {

    const dateElement =
        document.getElementById("today-date");

    const today = new Date();

    const date =
        today.toLocaleDateString(
            "ar-TN",
            {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );

    dateElement.textContent = date;
}

displayDate();


// ========================================
// RÉCUPÉRER LES HORAIRES
// ========================================

async function getPrayerTimes(
    latitude,
    longitude
) {

    const today = new Date();

    const day =
        String(today.getDate())
            .padStart(2, "0");

    const month =
        String(today.getMonth() + 1)
            .padStart(2, "0");

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
            throw new Error("API error");
        }


        const data =
            await response.json();


        const timings =
            data.data.timings;


        displayPrayerTimes(timings);


    } catch (error) {

        console.error(error);

        locationStatus.textContent =
            "تعذر الحصول على مواقيت الصلاة";

    }

}


// ========================================
// AFFICHER LES HORAIRES
// ========================================

function displayPrayerTimes(timings) {

    document.getElementById(
        "fajr-time"
    ).textContent =
        cleanTime(timings.Fajr);


    document.getElementById(
        "dhuhr-time"
    ).textContent =
        cleanTime(timings.Dhuhr);


    document.getElementById(
        "asr-time"
    ).textContent =
        cleanTime(timings.Asr);


    document.getElementById(
        "maghrib-time"
    ).textContent =
        cleanTime(timings.Maghrib);


    document.getElementById(
        "isha-time"
    ).textContent =
        cleanTime(timings.Isha);


    findNextPrayer(timings);

}


// ========================================
// NETTOYER L'HEURE
// ========================================

function cleanTime(time) {

    return time.split(" ")[0];

}


// ========================================
// PROCHAINE PRIÈRE
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


    let nextPrayer = null;


    for (
        const prayer of prayers
    ) {

        const [
            hours,
            minutes
        ] =
            prayer.time
                .split(":")
                .map(Number);


        const prayerMinutes =
            hours * 60 +
            minutes;


        if (
            prayerMinutes >
            currentMinutes
        ) {

            nextPrayer = prayer;

            break;

        }

    }


    let tomorrow = false;


    if (!nextPrayer) {

        nextPrayer = prayers[0];

        tomorrow = true;

    }


    document.getElementById(
        "next-prayer-name"
    ).textContent =
        nextPrayer.name;


    document.getElementById(
        "next-prayer-time"
    ).textContent =
        nextPrayer.time;


    startCountdown(
        nextPrayer,
        tomorrow
    );

}


// ========================================
// COMPTE À REBOURS
// ========================================

function startCountdown(
    prayer,
    tomorrow
) {

    if (countdownInterval) {

        clearInterval(
            countdownInterval
        );

    }


    function updateCountdown() {

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

            document.getElementById(
                "prayer-countdown"
            ).textContent =
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


        document.getElementById(
            "prayer-countdown"
        ).textContent =

            `متبقي ` +

            `${String(hoursLeft).padStart(2, "0")}:` +

            `${String(minutesLeft).padStart(2, "0")}:` +

            `${String(secondsLeft).padStart(2, "0")}`;

    }


    updateCountdown();


    countdownInterval =
        setInterval(
            updateCountdown,
            1000
        );

}


// ========================================
// LOCALISATION
// ========================================

locationButton.addEventListener("click", () => {

    if (!navigator.geolocation) {
        locationStatus.textContent =
            "المتصفح لا يدعم تحديد الموقع";
        return;
    }

    locationStatus.textContent =
        "📍 جاري تحديد موقعك...";

    locationButton.disabled = true;

    navigator.geolocation.getCurrentPosition(

        async (position) => {

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            console.log("Latitude:", latitude);
            console.log("Longitude:", longitude);

            locationStatus.textContent =
                "تم تحديد موقعك بنجاح ✓";

            try {

                await getPrayerTimes(
                    latitude,
                    longitude
                );

            } catch (error) {

                console.error(
                    "Erreur horaires:",
                    error
                );

                locationStatus.textContent =
                    "تم تحديد الموقع لكن تعذر جلب مواقيت الصلاة";

            }

            locationButton.disabled = false;
        },

        (error) => {

            console.error(
                "Erreur localisation:",
                error
            );

            switch (error.code) {

                case error.PERMISSION_DENIED:
                    locationStatus.textContent =
                        "❌ تم رفض إذن تحديد الموقع";
                    break;

                case error.POSITION_UNAVAILABLE:
                    locationStatus.textContent =
                        "❌ موقعك غير متاح حاليًا";
                    break;

                case error.TIMEOUT:
                    locationStatus.textContent =
                        "❌ انتهى وقت تحديد الموقع، حاول مرة أخرى";
                    break;

                default:
                    locationStatus.textContent =
                        "❌ حدث خطأ أثناء تحديد الموقع";
            }

            locationButton.disabled = false;
        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }

    );

});