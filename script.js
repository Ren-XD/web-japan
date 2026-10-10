// ==========================================
// RennX Japan - Quiz System
// ==========================================

const TIME_LIMIT = 10;
const WRONG_STORAGE_KEY = "rennx_wrong_v1";
const QUIZ_PROGRESS_KEY = "rennx_quiz_progress_v1";

let restoringProgress = false;


// ==========================================
// DATA FILE JSON
// ==========================================



const QUESTION_FILES = {
    all: "soal/all-soal.json",
    random: "soal/all-soal.json",

    m1: Object.fromEntries(
        Array.from({ length: 25 }, (_, i) => {
            const bab = `bab${i + 1}`;

            return [
                bab,
                `soal/minna-no-nihonggo1/${bab}.json`
            ];
        })
    ),

    m2: Object.fromEntries(
        Array.from({ length: 50 }, (_, i) => {
            const bab = `bab${i + 1}`;

            return [
                bab,
                `soal/minna-no-nihonggo2/${bab}.json`
            ];
        })
    )
};


// ==========================================
// STATE
// ==========================================

let questions = [];
let currentQuestion = 0;

let correctAnswers = 0;
let wrongAnswers = 0;
let timeoutAnswers = 0;

let timer = null;
let nextTimeout = null;
let timeLeft = TIME_LIMIT;

let currentChapter = "";
let currentChapterTitle = "";

let answered = false;
let reviewData = [];

let currentMode = "random";


// ==========================================
// ELEMENT HTML
// ==========================================

const menuScreen =
    document.getElementById("menuScreen");

const allMenuScreen =
    document.getElementById("allMenuScreen");

const mnn1Screen =
    document.getElementById("mnn1Screen");

const mnn2Screen =
    document.getElementById("mnn2Screen");

const quizScreen =
    document.getElementById("quizScreen");

const resultScreen =
    document.getElementById("resultScreen");

const backButton =
    document.getElementById("backButton");

const menuAgain =
    document.getElementById("menuAgain");

const chapterTitle =
    document.getElementById("chapterTitle");

const questionNumber =
    document.getElementById("questionNumber");

const progressBar =
    document.getElementById("progressBar");

const timerElement =
    document.getElementById("timer");

const timerText =
    document.getElementById("timerText");

const questionText =
    document.getElementById("questionText");

const answersElement =
    document.getElementById("answers");

const statusElement =
    document.getElementById("status");

const resultChapter =
    document.getElementById("resultChapter");

const scoreCorrect =
    document.getElementById("scoreCorrect");

const scorePercent =
    document.getElementById("scorePercent");

const correctCount =
    document.getElementById("correctCount");

const wrongCount =
    document.getElementById("wrongCount");

const timeoutCount =
    document.getElementById("timeoutCount");

const reviewList =
    document.getElementById("reviewList");


// ==========================================
// MULAI APLIKASI
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    setupEvents();

    const restored = restoreQuizProgress();

    if (!restored) {
        showScreen(menuScreen);
    }

    console.log("RennX Japan berhasil dimuat.");
});

// ==========================================
// EVENT
// ==========================================

function setupEvents() {

    // --------------------------------------
    // MENU MINNA 1, MINNA 2, ALL KOSAKATA
    // --------------------------------------

    document
        .querySelectorAll("[data-open-menu]")
        .forEach(button => {

            button.addEventListener("click", () => {

                const menu = button.dataset.openMenu;

                if (menu === "mnn1") {
                    showScreen(mnn1Screen);
                }

                else if (menu === "mnn2") {
                    showScreen(mnn2Screen);
                }

                else if (menu === "all") {
                    showScreen(allMenuScreen);
                }

            });

        });


    // --------------------------------------
    // PILIH MODE ALL KOSAKATA
    // --------------------------------------

    document
        .querySelectorAll("[data-all-mode]")
        .forEach(button => {

            button.addEventListener("click", () => {

                const mode = button.dataset.allMode;

                handleAllMode(mode);

            });

        });


    
    // --------------------------------------
    // PILIH ALL KOSAKATA ATAU BAB
    // --------------------------------------

    document
        .querySelectorAll("[data-chapter]")
        .forEach(button => {

            button.addEventListener("click", async () => {

                const chapter = button.dataset.chapter;

                // Tombol All Kosakata
                if (chapter === "all") {
                    await startChapter("all", "ordered");
                    return;
                }

                // Bab Minna no Nihongo 1 dan 2
                currentMode = "ordered";

                await startChapter(chapter, currentMode);

            });

        });



    // --------------------------------------
    // KEMBALI KE MENU SEBELUMNYA
    // --------------------------------------

    document
        .querySelectorAll("[data-back-menu]")
        .forEach(button => {

            button.addEventListener("click", () => {

                stopAllActions();

                const parentScreen =
                    button.closest(".screen");

                if (
                    parentScreen &&
                    parentScreen.id === "allMenuScreen"
                ) {
                    showScreen(menuScreen);
                }

                else {
                    showScreen(menuScreen);
                }

            });

        });


    // --------------------------------------
    // KEMBALI DARI QUIZ
    // --------------------------------------

    if (backButton) {

        backButton.addEventListener("click", () => {

            stopAllActions();

            if (
                currentChapter === "all" ||
                currentChapter === "wrong"
            ) {
                showScreen(allMenuScreen);
            }

            else if (currentChapter.startsWith("m1-")) {
                showScreen(mnn1Screen);
            }

            else if (currentChapter.startsWith("m2-")) {
                showScreen(mnn2Screen);
            }

            else {
                showScreen(menuScreen);
            }

        });

    }


    // --------------------------------------
    // KEMBALI DARI HASIL
    // --------------------------------------

    if (menuAgain) {

        menuAgain.addEventListener("click", () => {

            stopAllActions();

            if (
                currentChapter === "all" ||
                currentChapter === "wrong"
            ) {
                showScreen(allMenuScreen);
            }

            else if (currentChapter.startsWith("m1-")) {
                showScreen(mnn1Screen);
            }

            else if (currentChapter.startsWith("m2-")) {
                showScreen(mnn2Screen);
            }

            else {
                showScreen(menuScreen);
            }

        });

    }

    // --------------------------------------
    // FILTER REKAP JAWABAN
    // --------------------------------------

document
    .querySelectorAll("[data-recap-filter]")
    .forEach(button => {

        button.addEventListener("click", () => {

            const filter = button.dataset.recapFilter;

            document
                .querySelectorAll("[data-recap-filter]")
                .forEach(item => {
                    item.classList.remove("active");
                });

            button.classList.add("active");

            renderReview(filter);

        });

    });

}


// ==========================================
// PILIH MODE ALL KOSAKATA
// ==========================================

async function handleAllMode(mode) {

    stopAllActions();

    switch (mode) {

        // ----------------------------------
        // MULAI MENGHAFAL
        // ----------------------------------

        case "memorize":

            currentMode = "ordered";

            await startChapter("all", "ordered");

            break;


        // ----------------------------------
        // ULANGI KOSAKATA YANG SALAH
        // ----------------------------------

        case "repeat-wrong":

            await startWrongQuestions();

            break;


        // ----------------------------------
        // SOALAN ACAK
        // ----------------------------------

        case "random":

            currentMode = "random";

            await startChapter("all", "random");

            break;


        // ----------------------------------
        // SOALAN URUT
        // ----------------------------------

        case "ordered":

            currentMode = "ordered";

            await startChapter("all", "ordered");

            break;


        // ----------------------------------
        // TABEL KOSAKATA
        // ----------------------------------

        case "table":

            showTableNotice();

            break;


        default:

            console.warn(
                "Mode All Kosakata tidak dikenali:",
                mode
            );

    }

}


// ==========================================
// NOTIFIKASI TABEL
// ==========================================

function showTableNotice() {

    /*
     * HTML saat ini belum mempunyai:
     * - tableScreen
     * - tableBody
     * - tableBackButton
     *
     * Karena itu, tabel belum bisa ditampilkan
     * tanpa menambahkan struktur HTML baru.
     */

    alert(
        "Halaman Tabel Kosakata belum tersedia di HTML."
    );

}


// ==========================================
// SHOW SCREEN
// ==========================================


function showScreen(screen) {
    if (!screen) {
        console.error("Screen tidak ditemukan.");
        return;
    }

    document.querySelectorAll(".screen").forEach(section => {
        section.classList.remove("active");
    });

    screen.classList.add("active");

    // Simpan halaman yang sedang dibuka.
    if (screen.id) {
        sessionStorage.setItem("rennx_last_screen", screen.id);
    }
}


// ==========================================
// MULAI CHAPTER
// ==========================================


function formatBab(bab) {
    return String(bab).replace(/^bab/i, "Bab ");
}

function saveQuizProgress() {
    if (!questions.length) return;

    const progress = {
        questions,
        currentQuestion,
        correctAnswers,
        wrongAnswers,
        timeoutAnswers,
        timeLeft,
        currentChapter,
        currentChapterTitle,
        currentMode,
        answered,
        reviewData
    };

    try {
        localStorage.setItem(
            QUIZ_PROGRESS_KEY,
            JSON.stringify(progress)
        );
    } catch (error) {
        console.error("Gagal menyimpan progres:", error);
    }
}

function clearQuizProgress() {
    localStorage.removeItem(QUIZ_PROGRESS_KEY);
}

function restoreQuizProgress() {
    let saved;

    try {
        const raw = localStorage.getItem(QUIZ_PROGRESS_KEY);

        if (!raw) return false;

        saved = JSON.parse(raw);
    } catch (error) {
        console.error("Gagal membaca progres:", error);
        clearQuizProgress();
        return false;
    }

    if (
        !saved ||
        !Array.isArray(saved.questions) ||
        saved.questions.length === 0 ||
        !Array.isArray(saved.reviewData)
    ) {
        clearQuizProgress();
        return false;
    }

    questions = saved.questions;
    currentQuestion = Number(saved.currentQuestion) || 0;
    correctAnswers = Number(saved.correctAnswers) || 0;
    wrongAnswers = Number(saved.wrongAnswers) || 0;
    timeoutAnswers = Number(saved.timeoutAnswers) || 0;

    timeLeft = Math.max(
        1,
        Math.min(TIME_LIMIT, Number(saved.timeLeft) || TIME_LIMIT)
    );

    currentChapter = saved.currentChapter || "all";
    currentChapterTitle =
        saved.currentChapterTitle || "All Kosakata";
    currentMode = saved.currentMode || "ordered";
    reviewData = saved.reviewData;

    // Jika refresh terjadi setelah menjawab,
    // lanjutkan ke soal berikutnya tanpa menghitung ulang.
    if (saved.answered) {
        currentQuestion++;
        timeLeft = TIME_LIMIT;
    }

    answered = false;

    if (currentQuestion >= questions.length) {
        showResult();
    } else if (currentQuestion >= 0) {
        restoringProgress = true;
        showScreen(quizScreen);
        renderQuestion();
        restoringProgress = false;
    } else {
        clearQuizProgress();
        return false;
    }

    return true;
}

async function startChapter(chapter, mode = "random") {

    let filePath = "";
    let title = "";

    // --------------------------------------
    // ALL KOSAKATA
    // --------------------------------------

    if (chapter === "all") {

        filePath = QUESTION_FILES.all;

        title = "All Kosakata";

    }

    // --------------------------------------
    // MINNA 1
    // --------------------------------------

    else if (chapter.startsWith("m1-")) {

        const bab =
            chapter.replace("m1-", "");

        filePath =
            QUESTION_FILES.m1[bab];

        title =
            `Minna No Nihonggo 1 - ${formatBab(bab)}`;

    }

    // --------------------------------------
    // MINNA 2
    // --------------------------------------

    else if (chapter.startsWith("m2-")) {

        const bab =
            chapter.replace("m2-", "");

        filePath =
            QUESTION_FILES.m2[bab];

        title =
            `Minna No Nihonggo 2 - ${formatBab(bab)}`;

    }

    // --------------------------------------
    // FILE TIDAK ADA
    // --------------------------------------

    if (!filePath) {

        console.error(
            "File soal tidak ditemukan:",
            chapter
        );

        alert(
            "File soal untuk bab ini belum tersedia."
        );

        return;

    }

    currentChapter = chapter;

    currentChapterTitle = title;

    currentMode = mode;

    await loadQuestions(filePath, mode);

}


// ==========================================
// LOAD JSON
// ==========================================

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}


async function loadQuestions(filePath, mode = "random") {

    try {

        console.log("Memuat:", filePath);

        const response = await fetch(filePath);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data.soal)) {
            throw new Error(
                "JSON harus memiliki array bernama 'soal'."
            );
        }

        const loadedQuestions = data.soal
            .map(item => ({
                q: item.q,
                a: Array.isArray(item.a) ? item.a : [],
                c: Number(item.c)
            }))
            .filter(item => (
                item.q &&
                item.a.length >= 2 &&
                Number.isInteger(item.c) &&
                item.c >= 0 &&
                item.c < item.a.length
            ));

        if (loadedQuestions.length === 0) {
            throw new Error("Tidak ada soal valid.");
        }
        
questions = loadedQuestions.map(question =>
    shuffleAnswers(question)
);

// Acak urutan soal jika mode acak.
if (mode === "random") {
    shuffleArray(questions);
}

        resetQuizState();

        showScreen(quizScreen);

        renderQuestion();

    }

    
    catch (error) {
        console.error("Gagal memuat soal:", error);

        alert(
            "Soal gagal dimuat.\n\n" +
            "File: " + filePath + "\n" +
            "Penyebab: " + error.message
        );
    }


}

function shuffleAnswers(question) {
    const answers = question.a.map((answer, index) => ({
        answer,
        isCorrect: index === question.c
    }));

    shuffleArray(answers);

    return {
        ...question,
        a: answers.map(item => item.answer),
        c: answers.findIndex(item => item.isCorrect)
    };
}

// ==========================================
// RESET QUIZ
// ==========================================

function resetQuizState() {

    stopAllActions();

    currentQuestion = 0;

    correctAnswers = 0;

    wrongAnswers = 0;

    timeoutAnswers = 0;

    reviewData = [];

    answered = false;

    timeLeft = TIME_LIMIT;

}


// ==========================================
// RENDER QUESTION
// ==========================================

function renderQuestion() {
    stopTimer();

    if (currentQuestion >= questions.length) {
        showResult();
        return;
    }

    answered = false;

    if (!restoringProgress) {
        timeLeft = TIME_LIMIT;
    }

    const question = questions[currentQuestion];

    chapterTitle.textContent = currentChapterTitle;

    questionNumber.textContent =
        `Soal ${currentQuestion + 1} / ${questions.length}`;

    progressBar.style.width =
        `${(currentQuestion / questions.length) * 100}%`;

    questionText.textContent = question.q;

    statusElement.textContent = "";
    statusElement.className = "status";
    answersElement.innerHTML = "";

    question.a.forEach((answer, index) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "answer-button";
        button.textContent = answer;
        button.dataset.index = index;

        button.addEventListener("click", () => {
            selectAnswer(index);
        });

        answersElement.appendChild(button);
    });

    saveQuizProgress();
    startTimer();
}

// ==========================================
// SELECT ANSWER
// ==========================================

function selectAnswer(answerIndex) {

    if (answered) {
        return;
    }

    answered = true;

    stopTimer();

    const question = questions[currentQuestion];

    const buttons =
        answersElement.querySelectorAll(".answer-button");

    buttons.forEach(button => {
        button.disabled = true;
    });

    const isCorrect =
        answerIndex === question.c;

    // --------------------------------------
    // JAWABAN BENAR
    // --------------------------------------

    if (isCorrect) {

        correctAnswers++;

        if (buttons[question.c]) {
            buttons[question.c].classList.add("correct");
        }

        statusElement.textContent =
            "✓ Jawaban benar!";

        statusElement.classList.add("correct-status");

        reviewData.push({
            question: question.q,
            userAnswer: question.a[answerIndex],
            correctAnswer: question.a[question.c],
            correct: true,
            timeout: false
        });

    }

    // --------------------------------------
    // JAWABAN SALAH
    // --------------------------------------

    else {

        wrongAnswers++;

        if (buttons[answerIndex]) {
            buttons[answerIndex].classList.add("wrong");
        }

        if (buttons[question.c]) {
            buttons[question.c].classList.add("correct");
        }

        statusElement.textContent =
            `✗ Salah! Jawaban: ${question.a[question.c]}`;

        statusElement.classList.add("wrong-status");

        reviewData.push({
            question: question.q,
            userAnswer: question.a[answerIndex],
            correctAnswer: question.a[question.c],
            correct: false,
            timeout: false
        });

        saveWrongQuestion(question);
        saveQuizProgress();

    }

    // --------------------------------------
    // SOAL BERIKUTNYA
    // --------------------------------------

    nextTimeout = setTimeout(() => {
    nextTimeout = null;
    currentQuestion++;
    timeLeft = TIME_LIMIT;
    renderQuestion();
}, 800);

}


// ==========================================
// TIMER
// ==========================================

function startTimer() {
    stopTimer();

    updateTimer();
    saveQuizProgress();

    timer = setInterval(() => {
        timeLeft--;

        updateTimer();
        saveQuizProgress();

        if (timeLeft <= 0) {
            handleTimeout();
        }
    }, 1000);
}

// ==========================================
// UPDATE TIMER
// ==========================================

function updateTimer() {

    timerText.textContent = timeLeft;

    timerElement.classList.remove(
        "warning",
        "danger"
    );

    if (timeLeft <= 3) {

        timerElement.classList.add("danger");

    }

    else if (timeLeft <= 5) {

        timerElement.classList.add("warning");

    }

}


// ==========================================
// STOP TIMER
// ==========================================

function stopTimer() {

    if (timer !== null) {

        clearInterval(timer);

        timer = null;

    }

}


// ==========================================
// STOP SEMUA AKSI
// ==========================================

function stopAllActions() {

    stopTimer();

    if (nextTimeout !== null) {

        clearTimeout(nextTimeout);

        nextTimeout = null;

    }

}


// ==========================================
// TIMEOUT
// ==========================================

function handleTimeout() {

    if (answered) {
        return;
    }

    answered = true;

    stopTimer();

    timeoutAnswers++;

    const question = questions[currentQuestion];

    const buttons =
        answersElement.querySelectorAll(".answer-button");

    buttons.forEach(button => {
        button.disabled = true;
    });

    if (buttons[question.c]) {
        buttons[question.c].classList.add("correct");
    }

    statusElement.textContent =
        `⌛ Waktu habis! Jawaban: ${question.a[question.c]}`;

    statusElement.classList.add("timeout-status");

    reviewData.push({
        question: question.q,
        userAnswer: "-",
        correctAnswer: question.a[question.c],
        correct: false,
        timeout: true
    });

    // Jawaban timeout ikut masuk daftar pengulangan.
    saveWrongQuestion(question);

    nextTimeout = setTimeout(() => {

        nextTimeout = null;

        currentQuestion++;

        renderQuestion();

    }, 1000);

}


// ==========================================
// SIMPAN KOSAKATA YANG SALAH
// ==========================================

function getWrongQuestions() {

    try {

        const saved =
            localStorage.getItem(WRONG_STORAGE_KEY);

        if (!saved) {
            return [];
        }

        const parsed = JSON.parse(saved);

        return Array.isArray(parsed) ? parsed : [];

    }

    catch (error) {

        console.error(
            "Gagal membaca kosakata yang salah:",
            error
        );

        return [];

    }

}


function saveWrongQuestion(question) {

    const saved = getWrongQuestions();

    const key = normalizeQuestion(question.q);

    const alreadySaved = saved.some(item =>
        normalizeQuestion(item.q) === key
    );

    if (!alreadySaved) {

        saved.push({
            q: question.q,
            a: question.a,
            c: question.c
        });

    }

    try {

        localStorage.setItem(
            WRONG_STORAGE_KEY,
            JSON.stringify(saved)
        );

    }

    catch (error) {

        console.error(
            "Gagal menyimpan kosakata yang salah:",
            error
        );

    }

}



function normalizeQuestion(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}


// ==========================================
// ULANGI KOSAKATA YANG SALAH
// ==========================================

async function startWrongQuestions() {
    stopAllActions();

    const saved = getWrongQuestions();

    if (saved.length === 0) {
        alert("Belum ada kosakata yang salah untuk diulang.");
        return;
    }

    currentChapter = "wrong";
    currentChapterTitle = "Ulangi Kosakata yang Salah";
    currentMode = "ordered";

    questions = saved
    .filter(item =>
        item &&
        item.q &&
        Array.isArray(item.a) &&
        Number.isInteger(item.c) &&
        item.c >= 0 &&
        item.c < item.a.length
    )
    .map(item => shuffleAnswers({
        q: item.q,
        a: item.a,
        c: item.c
    }));

    if (questions.length === 0) {
        alert("Data kosakata yang tersimpan tidak valid.");
        return;
    }

    resetQuizState();
    showScreen(quizScreen);
    renderQuestion();
}


// ==========================================
// HASIL KUIS
// ==========================================

function showResult() {
    stopAllActions();
    showScreen(resultScreen);

    const total = questions.length;
    const percentage = total > 0
        ? Math.round((correctAnswers / total) * 100)
        : 0;

    resultChapter.textContent = currentChapterTitle;
    scoreCorrect.textContent = `${correctAnswers} / ${total}`;
    scorePercent.textContent = `${percentage}%`;

    correctCount.textContent = correctAnswers;
    wrongCount.textContent = wrongAnswers;
    timeoutCount.textContent = timeoutAnswers;

    renderReview("all");

    document.querySelectorAll("[data-recap-filter]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.recapFilter === "all"
        );
    });
}


// ==========================================
// ULASAN JAWABAN
// ==========================================

function renderReview(filter = "all") {
    if (!reviewList) return;

    reviewList.innerHTML = "";

    const filteredData = reviewData.filter(item => {
        if (filter === "correct") return item.correct === true;
        if (filter === "wrong") return item.correct === false && !item.timeout;
        if (filter === "timeout") return item.timeout === true;
        return true;
    });

    if (filteredData.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "review-empty";
        emptyMessage.textContent =
            "Belum ada jawaban dalam kategori ini.";

        reviewList.appendChild(emptyMessage);
        return;
    }

    filteredData.forEach((item, index) => {
        const review = document.createElement("article");
        review.className = "review-item";

        let statusText;
        let statusClass;

        if (item.timeout) {
            statusText = "Waktu habis";
            statusClass = "review-timeout";
        } else if (item.correct) {
            statusText = "Benar";
            statusClass = "review-correct";
        } else {
            statusText = "Salah";
            statusClass = "review-wrong";
        }

        review.classList.add(statusClass);

        const header = document.createElement("div");
        header.className = "review-header";

        const number = document.createElement("strong");
        number.textContent = `Soal ${index + 1}`;

        const badge = document.createElement("span");
        badge.className = "review-status";
        badge.textContent = statusText;

        header.append(number, badge);

        const question = document.createElement("p");
        question.className = "review-question";
        question.textContent = item.question;

        const userAnswer = document.createElement("p");
        userAnswer.className = "review-user-answer";
        userAnswer.textContent = item.timeout
            ? "Jawaban kamu: Tidak menjawab"
            : `Jawaban kamu: ${item.userAnswer}`;

        const correctAnswer = document.createElement("p");
        correctAnswer.className = "review-correct-answer";
        correctAnswer.textContent =
            `Jawaban benar: ${item.correctAnswer}`;

        review.append(
            header,
            question,
            userAnswer,
            correctAnswer
        );

        reviewList.appendChild(review);
    });
}
