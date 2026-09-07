// ==========================================================================
// Kihdih Habit Tracker — منطق مشترك (يُستخدم في الصفحة الرئيسية وصفحة العادات)
// ==========================================================================

const KIHDIH_HABIT_STORAGE_KEY = "kihdih_habits_v1";

const KIHDIH_HABITS = [
    { id: "fajr", label: "صلاة الفجر", icon: "🌅", group: "prayer" },
    { id: "dhuhr", label: "صلاة الظهر", icon: "☀️", group: "prayer" },
    { id: "asr", label: "صلاة العصر", icon: "🌤️", group: "prayer" },
    { id: "maghrib", label: "صلاة المغرب", icon: "🌇", group: "prayer" },
    { id: "isha", label: "صلاة العشاء", icon: "🌙", group: "prayer" },
    { id: "adhkarMorning", label: "أذكار الصباح", icon: "🌅", group: "adhkar" },
    { id: "adhkarEvening", label: "أذكار المساء", icon: "🌙", group: "adhkar" },
    { id: "quran", label: "قراءة القرآن", icon: "📖", group: "quran" }
];

const KIHDIH_BADGES = [
    { days: 3, icon: "🔥", label: "3 أيام متتالية" },
    { days: 7, icon: "🌱", label: "أسبوع كامل" },
    { days: 14, icon: "💪", label: "أسبوعان متتاليان" },
    { days: 30, icon: "🌟", label: "شهر كامل" },
    { days: 60, icon: "🏅", label: "شهران متتاليان" },
    { days: 100, icon: "🏆", label: "100 يوم متتالية" }
];

const KIHDIH_DAY_NAMES = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

function kihdihPad(n) {
    return String(n).padStart(2, "0");
}

function kihdihDateKey(date) {
    return `${date.getFullYear()}-${kihdihPad(date.getMonth() + 1)}-${kihdihPad(date.getDate())}`;
}

function kihdihTodayKey() {
    return kihdihDateKey(new Date());
}

function kihdihLoadData() {
    try {
        const raw = localStorage.getItem(KIHDIH_HABIT_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

function kihdihSaveData(data) {
    try {
        localStorage.setItem(KIHDIH_HABIT_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        // تجاهل أخطاء التخزين (وضع التصفح الخاص مثلاً)
    }
}

function kihdihIsDayComplete(data, dateKey) {
    const day = data[dateKey];
    if (!day) return false;
    return KIHDIH_HABITS.every((h) => day[h.id] === true);
}

function kihdihCountCompleted(data, dateKey) {
    const day = data[dateKey];
    if (!day) return 0;
    return KIHDIH_HABITS.filter((h) => day[h.id] === true).length;
}

function kihdihComputeCurrentStreak(data) {

    let streak = 0;
    const cursor = new Date();

    // لا نكسر السلسلة إذا كان اليوم لم ينتهِ بعد ولم يُكتمل، نبدأ العد من الأمس
    if (!kihdihIsDayComplete(data, kihdihDateKey(cursor))) {
        cursor.setDate(cursor.getDate() - 1);
    }

    while (kihdihIsDayComplete(data, kihdihDateKey(cursor))) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
    }

    return streak;

}

function kihdihComputeBestStreak(data) {

    const dates = Object.keys(data).sort();

    let best = 0;
    let current = 0;
    let previousDate = null;

    dates.forEach((dateStr) => {

        if (!kihdihIsDayComplete(data, dateStr)) {
            current = 0;
            previousDate = null;
            return;
        }

        const d = new Date(dateStr);

        if (previousDate) {
            const diffDays = Math.round((d - previousDate) / 86400000);
            current = diffDays === 1 ? current + 1 : 1;
        } else {
            current = 1;
        }

        best = Math.max(best, current);
        previousDate = d;

    });

    return Math.max(best, kihdihComputeCurrentStreak(data));

}

function kihdihGetLastNDays(n) {
    const days = [];
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d);
    }
    return days;
}