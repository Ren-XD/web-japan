// ==========================================
// RennX Japan - Quiz System
// ==========================================


// ==========================================
// KONFIGURASI
// ==========================================

const TIME_LIMIT = 10;


// ==========================================
// DATA FILE JSON
// ==========================================

const QUESTION_FILES = {
    all: "soal/all-soal.json",
    m1: {},
    m2: {}
};


// Minna No Nihonggo 1
for (let i = 1; i <= 25; i++) {
    QUESTION_FILES.m1[`bab${i}`] =
        `soal/minna-no-nihonggo1/bab${i}.json`;
}


// Minna No Nihonggo 2
for (let i = 1; i <= 25; i++) {
    QUESTION_FILES.m2[`bab${i}`] =
        `soal/minna-no-nihonggo2/bab${i}.json`;
}


// ==========================================
// STATE GAME
// ==========================================

let questions = [];
let currentQuestion = 0;

let correctAnswers = 0;
let wrongAnswers = 0;
let timeoutAnswers = 0;

let timer = null;
let timeLeft = TIME_LIMIT;

let currentChapter = "";
let currentChapterTitle = "";

let answered = false;

let reviewData = [];


// ==========================================
// ELEMENT HTML
// ==========================================

const menuScreen =
    document.getElementById("menuScreen");

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

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupEvents();

        console.log("RennX Japan berhasil dimuat.");

    }
);


// ==========================================
// EVENT LISTENER
// ==========================================

function setupEvents() {

    // --------------------------------------
    // BUKA MENU MINNA
    // --------------------------------------

    document
        .querySelectorAll("[data-open-menu]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const menu =
                        button.dataset.openMenu;

                    if (menu === "mnn1") {

                        showScreen(mnn1Screen);

                    }

                    if (menu === "mnn2") {

                        showScreen(mnn2Screen);

                    }

                }
            );

        });


    // --------------------------------------
    // PILIH BAB / ALL KOSAKATA
    // --------------------------------------

    document
        .querySelectorAll("[data-chapter]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const chapter =
                        button.dataset.chapter;

                    startChapter(chapter);

                }
            );

        });


    // --------------------------------------
    // TOMBOL KEMBALI DARI MENU BAB
    // --------------------------------------

    document
        .querySelectorAll("[data-back-menu]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    stopTimer();

                    showScreen(menuScreen);

                }
            );

        });


    // --------------------------------------
    // TOMBOL KEMBALI DARI QUIZ
    // --------------------------------------

    if (backButton) {

        backButton.addEventListener(
            "click",
            () => {

                stopTimer();

                showScreen(menuScreen);

            }
        );

    }


    // --------------------------------------
    // KEMBALI KE MENU DARI HASIL
    // --------------------------------------

    if (menuAgain) {

        menuAgain.addEventListener(
            "click",
            () => {

                showScreen(menuScreen);

            }
        );

    }

}


// ==========================================
// MULAI BAB
// ==========================================

async function startChapter(chapter) {

    let filePath = "";
    let title = "";


    // --------------------------------------
    // ALL KOSAKATA
    // --------------------------------------

    if (chapter === "all") {

        filePath =
            QUESTION_FILES.all;

        title =
            "All Kosakata";

    }


    // --------------------------------------
    // MINNA NO NIHONGGO 1
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
    // MINNA NO NIHONGGO 2
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
    // CEK FILE
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


    currentChapter =
        chapter;

    currentChapterTitle =
        title;


    await loadQuestions(
        filePath
    );

}


// ==========================================
// LOAD JSON
// ==========================================

async function loadQuestions(filePath) {

    try {

        const response =
            await fetch(filePath);


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        // ----------------------------------
        // CEK FORMAT JSON
        // ----------------------------------

        if (!data.soal) {

            throw new Error(
                "Format JSON tidak memiliki array 'soal'."
            );

        }


        if (!Array.isArray(data.soal)) {

            throw new Error(
                "'soal' harus berupa array."
            );

        }


        // ----------------------------------
        // NORMALISASI SOAL
        // ----------------------------------

        questions =
            data.soal
                .map(item => {

                    return {

                        q: item.q,

                        a: Array.isArray(item.a)
                            ? item.a
                            : [],

                        c: Number(item.c)

                    };

                })
                .filter(item => {

                    return (
                        item.q &&
                        item.a.length >= 2 &&
                        Number.isInteger(item.c) &&
                        item.c >= 0 &&
                        item.c < item.a.length
                    );

                });


        // ----------------------------------
        // CEK APAKAH ADA SOAL
        // ----------------------------------

        if (questions.length === 0) {

            throw new Error(
                "Tidak ada soal yang valid di file JSON."
            );

        }


        // ----------------------------------
        // ACAK SOAL
        // ----------------------------------

        shuffleArray(
            questions
        );


        // ----------------------------------
        // RESET GAME
        // ----------------------------------

        currentQuestion = 0;

        correctAnswers = 0;

        wrongAnswers = 0;

        timeoutAnswers = 0;

        reviewData = [];

        answered = false;


        // ----------------------------------
        // BUKA QUIZ
        // ----------------------------------

        showScreen(
            quizScreen
        );


        renderQuestion();


    } catch (error) {

        console.error(
            "Gagal memuat soal:",
            error
        );


        alert(
            "Soal gagal dimuat.\n\n" +
            "Pastikan file JSON dan foldernya benar."
        );

    }

}


// ==========================================
// TAMPILKAN SOAL
// ==========================================

function renderQuestion() {

    stopTimer();


    if (
        currentQuestion >=
        questions.length
    ) {

        showResult();

        return;

    }


    answered = false;

    timeLeft =
        TIME_LIMIT;


    const question =
        questions[currentQuestion];


    // --------------------------------------
    // HEADER
    // --------------------------------------

    chapterTitle.textContent =
        currentChapterTitle;


    questionNumber.textContent =
        `Soal ${currentQuestion + 1} / ${questions.length}`;


    // --------------------------------------
    // PROGRESS
    // --------------------------------------

    const progress =
        (
            currentQuestion /
            questions.length
        ) * 100;


    progressBar.style.width =
        `${progress}%`;


    // --------------------------------------
    // PERTANYAAN
    // --------------------------------------

    questionText.textContent =
        question.q;


    // --------------------------------------
    // STATUS
    // --------------------------------------

    statusElement.textContent =
        "";


    statusElement.className =
        "status";


    // --------------------------------------
    // HAPUS JAWABAN LAMA
    // --------------------------------------

    answersElement.innerHTML =
        "";


    // --------------------------------------
    // BUAT TOMBOL JAWABAN
    // --------------------------------------

    question.a.forEach(
        (answer, index) => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "answer-button";


            button.textContent =
                answer;


            button.dataset.index =
                index;


            button.addEventListener(
                "click",
                () => {

                    selectAnswer(
                        index
                    );

                }
            );


            answersElement.appendChild(
                button
            );

        }
    );


    // --------------------------------------
    // MULAI TIMER
    // --------------------------------------

    startTimer();

}


// ==========================================
// PILIH JAWABAN
// ==========================================

function selectAnswer(answerIndex) {

    if (answered) {
        return;
    }


    answered = true;

    stopTimer();


    const question =
        questions[currentQuestion];


    const buttons =
        answersElement.querySelectorAll(
            ".answer-button"
        );


    // --------------------------------------
    // MATIKAN SEMUA TOMBOL
    // --------------------------------------

    buttons.forEach(
        button => {

            button.disabled =
                true;

        }
    );


    // --------------------------------------
    // JAWABAN BENAR
    // --------------------------------------

    if (
        answerIndex ===
        question.c
    ) {

        correctAnswers++;


        buttons[
            question.c
        ].classList.add(
            "correct"
        );


        statusElement.textContent =
            "✓ Jawaban benar!";


        statusElement.classList.add(
            "correct-status"
        );


        reviewData.push({

            question:
                question.q,

            userAnswer:
                question.a[answerIndex],

            correctAnswer:
                question.a[question.c],

            correct: true,

            timeout: false

        });

    }


    // --------------------------------------
    // JAWABAN SALAH
    // --------------------------------------

    else {

        wrongAnswers++;


        buttons[
            answerIndex
        ].classList.add(
            "wrong"
        );


        buttons[
            question.c
        ].classList.add(
            "correct"
        );


        statusElement.textContent =
            `✗ Salah! Jawaban: ${question.a[question.c]}`;


        statusElement.classList.add(
            "wrong-status"
        );


        reviewData.push({

            question:
                question.q,

            userAnswer:
                question.a[answerIndex],

            correctAnswer:
                question.a[question.c],

            correct: false,

            timeout: false

        });

    }


    // --------------------------------------
    // NEXT QUESTION
    // --------------------------------------

    setTimeout(
        () => {

            currentQuestion++;

            renderQuestion();

        },
        800
    );

}


// ==========================================
// TIMER
// ==========================================

function startTimer() {

    stopTimer();


    timeLeft =
        TIME_LIMIT;


    updateTimer();


    timer =
        setInterval(
            () => {

                timeLeft--;

                updateTimer();


                if (timeLeft <= 0) {

                    handleTimeout();

                }

            },
            1000
        );

}


// ==========================================
// UPDATE TIMER
// ==========================================

function updateTimer() {

    timerText.textContent =
        timeLeft;


    // Hapus class timer lama
    timerElement.classList.remove(
        "warning",
        "danger"
    );


    if (timeLeft <= 3) {

        timerElement.classList.add(
            "danger"
        );

    }

    else if (timeLeft <= 5) {

        timerElement.classList.add(
            "warning"
        );

    }

}


// ==========================================
// STOP TIMER
// ==========================================

function stopTimer() {

    if (timer !== null) {

        clearInterval(
            timer
        );

        timer = null;

    }

}


// ==========================================
// WAKTU HABIS
// ==========================================

function handleTimeout() {

    if (answered) {
        return;
    }


    answered = true;

    stopTimer();


    timeoutAnswers++;


    const question =
        questions[currentQuestion];


    const buttons =
        answersElement.querySelectorAll(
            ".answer-button"
        );


    // --------------------------------------
    // MATIKAN TOMBOL
    // --------------------------------------

    buttons.forEach(
        button => {

            button.disabled =
                true;

        }
    );


    // --------------------------------------
    // TANDAI JAWABAN BENAR
    // --------------------------------------

    if (
        buttons[question.c]
    ) {

        buttons[
            question.c
        ].classList.add(
            "correct"
        );

    }


    statusElement.textContent =
        `⌛ Waktu habis! Jawaban: ${question.a[question.c]}`;


    statusElement.classList.add(
        "timeout-status"
    );


    // --------------------------------------
    // SIMPAN REVIEW
    // --------------------------------------

    reviewData.push({

        question:
            question.q,

        userAnswer:
            "-",

        correctAnswer:
            question.a[question.c],

        correct: false,

        timeout: true

    });


    // --------------------------------------
    // NEXT QUESTION
    // --------------------------------------

    setTimeout(
        () => {

            currentQuestion++;

            renderQuestion();

        },
        1000
    );

}


// ==========================================
// HASIL QUIZ
// ==========================================

function showResult() {

    stopTimer();


    showScreen(
        resultScreen
    );


    const total =
        questions.length;


    const percentage =
        total > 0
            ? Math.round(
                (correctAnswers / total) * 100
            )
            : 0;


    // --------------------------------------
    // HASIL UTAMA
    // --------------------------------------

    resultChapter.textContent =
        currentChapterTitle;


    scoreCorrect.textContent =
        `${correctAnswers} / ${total}`;


    scorePercent.textContent =
        `${percentage}%`;


    correctCount.textContent =
        correctAnswers;


    wrongCount.textContent =
        wrongAnswers;


    timeoutCount.textContent =
        timeoutAnswers;


    // --------------------------------------
    // REVIEW
    // --------------------------------------

    renderReview();

}


// ==========================================
// REVIEW JAWABAN
// ==========================================

function renderReview() {

    reviewList.innerHTML =
        "";


    reviewData.forEach(
        (item, index) => {

            const review =
                document.createElement(
                    "div"
                );


            review.className =
                "review-item";


            if (item.correct) {

                review.classList.add(
                    "review-correct"
                );

            }

            else {

                review.classList.add(
                    "review-wrong"
                );

            }


            const number =
                document.createElement(
                    "div"
                );


            number.className =
                "review-number";


            number.textContent =
                `${index + 1}.`;


            const content =
                document.createElement(
                    "div"
                );


            content.className =
                "review-content";


            const question =
                document.createElement(
                    "strong"
                );


            question.textContent =
                item.question;


            const userAnswer =
                document.createElement(
                    "span"
                );


            if (item.timeout) {

                userAnswer.textContent =
                    "Waktu habis";

            }

            else {

                userAnswer.textContent =
                    `Jawaban: ${item.userAnswer}`;

      