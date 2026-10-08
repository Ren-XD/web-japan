// ==========================================
// RennX Japan - Quiz System
// ==========================================

const TIME_LIMIT = 10;


// ==========================================
// DATA FILE JSON
// ==========================================

const QUESTION_FILES = {
    all: "soal/all-soal.json",

    m1: {
        bab1: "soal/minna-no-nihonggo1/bab1.json",
        bab2: "soal/minna-no-nihonggo1/bab2.json",
        bab3: "soal/minna-no-nihonggo1/bab3.json",
        bab4: "soal/minna-no-nihonggo1/bab4.json",
        bab5: "soal/minna-no-nihonggo1/bab5.json"
    },

    m2: {
        bab1: "soal/minna-no-nihonggo2/bab1.json",
        bab2: "soal/minna-no-nihonggo2/bab2.json"
    }
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
// STATE
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

document.addEventListener("DOMContentLoaded", () => {

    setupEvents();

    console.log("RennX Japan berhasil dimuat.");

});


// ==========================================
// EVENT
// ==========================================

function setupEvents() {

    // --------------------------------------
    // MINNA NO NIHONGGO 1 & 2
    // --------------------------------------

    document
        .querySelectorAll("[data-open-menu]")
        .forEach(button => {

            button.addEventListener("click", () => {

                const menu =
                    button.dataset.openMenu;

                if (menu === "mnn1") {

                    showScreen(mnn1Screen);

                }

                else if (menu === "mnn2") {

                    showScreen(mnn2Screen);

                }

            });

        });


    // --------------------------------------
    // ALL KOSAKATA + BAB
    // --------------------------------------

    document
        .querySelectorAll("[data-chapter]")
        .forEach(button => {

            button.addEventListener("click", () => {

                const chapter =
                    button.dataset.chapter;

                startChapter(chapter);

            });

        });


    // --------------------------------------
    // KEMBALI KE MENU
    // --------------------------------------

    document
        .querySelectorAll("[data-back-menu]")
        .forEach(button => {

            button.addEventListener("click", () => {

                stopTimer();

                showScreen(menuScreen);

            });

        });


    // --------------------------------------
    // KEMBALI DARI QUIZ
    // --------------------------------------

    if (backButton) {

        backButton.addEventListener("click", () => {

            stopTimer();

            showScreen(menuScreen);

        });

    }


    // --------------------------------------
    // KEMBALI DARI HASIL
    // --------------------------------------

    if (menuAgain) {

        menuAgain.addEventListener("click", () => {

            stopTimer();

            showScreen(menuScreen);

        });

    }

}


// ==========================================
// SHOW SCREEN
// ==========================================

function showScreen(screen) {

    if (!screen) {

        console.error(
            "Screen tidak ditemukan."
        );

        return;

    }


    document
        .querySelectorAll(".screen")
        .forEach(section => {

            section.classList.remove("active");

        });


    screen.classList.add("active");

}


// ==========================================
// MULAI CHAPTER
// ==========================================

async function startChapter(chapter) {

    let filePath = "";
    let title = "";


    // --------------------------------------
    // ALL
    // --------------------------------------

    if (chapter === "all") {

        filePath =
            QUESTION_FILES.all;

        title =
            "All Kosakata";

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


    currentChapter =
        chapter;

    currentChapterTitle =
        title;


    await loadQuestions(filePath);

}


// ==========================================
// LOAD JSON
// ==========================================

async function loadQuestions(filePath) {

    try {

        console.log(
            "Memuat:",
            filePath
        );


        const response =
            await fetch(filePath);


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        if (!data.soal) {

            throw new Error(
                "JSON tidak memiliki array soal."
            );

        }


        if (!Array.isArray(data.soal)) {

            throw new Error(
                "soal harus berupa array."
            );

        }


        questions =
            data.soal
                .map(item => ({

                    q: item.q,

                    a: Array.isArray(item.a)
                        ? item.a
                        : [],

                    c: Number(item.c)

                }))
                .filter(item => (

                    item.q &&
                    item.a.length >= 2 &&
                    Number.isInteger(item.c) &&
                    item.c >= 0 &&
                    item.c < item.a.length

                ));


        if (questions.length === 0) {

            throw new Error(
                "Tidak ada soal valid."
            );

        }


        // Acak soal
        shuffleArray(questions);


        // Reset
        currentQuestion = 0;

        correctAnswers = 0;

        wrongAnswers = 0;

        timeoutAnswers = 0;

        reviewData = [];

        answered = false;


        // Masuk quiz
        showScreen(quizScreen);

        renderQuestion();


    }

    catch (error) {

        console.error(
            "Gagal memuat soal:",
            error
        );

        alert(
            "Soal gagal dimuat.\n\n" +
            "File:\n" +
            filePath +
            "\n\n" +
            "Pastikan file JSON ada."
        );

    }

}


// ==========================================
// RENDER QUESTION
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


    // Header
    chapterTitle.textContent =
        currentChapterTitle;


    questionNumber.textContent =
        `Soal ${currentQuestion + 1} / ${questions.length}`;


    // Progress
    const progress =
        (
            currentQuestion /
            questions.length
        ) * 100;


    progressBar.style.width =
        `${progress}%`;


    // Pertanyaan
    questionText.textContent =
        question.q;


    // Status
    statusElement.textContent =
        "";

    statusElement.className =
        "status";


    // Bersihkan jawaban
    answersElement.innerHTML =
        "";


    // Buat tombol jawaban
    question.a.forEach(
        (answer, index) => {

            const button =
                document.createElement("button");


            button.type =
                "button";


            button.className =
                "answer-button";


            button.textContent =
                answer;


            button.dataset.index =
                index;


            button.addEventListener(
                "click",
                () => {

                    selectAnswer(index);

                }
            );


            answersElement.appendChild(
                button
            );

        }
    );


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


    const question =
        questions[currentQuestion];


    const buttons =
        answersElement.querySelectorAll(
            ".answer-button"
        );


    buttons.forEach(button => {

        button.disabled = true;

    });


    // --------------------------------------
    // BENAR
    // --------------------------------------

    if (answerIndex === question.c) {

        correctAnswers++;


        if (buttons[question.c]) {

            buttons[
                question.c
            ].classList.add("correct");

        }


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
    // SALAH
    // --------------------------------------

    else {

        wrongAnswers++;


        if (buttons[answerIndex]) {

            buttons[
                answerIndex
            ].classList.add("wrong");

        }


        if (buttons[question.c]) {

            buttons[
                question.c
            ].classList.add("correct");

        }


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


    // Next
    setTimeout(() => {

        currentQuestion++;

        renderQuestion();

    }, 800);

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
        setInterval(() => {

            timeLeft--;

            updateTimer();


            if (timeLeft <= 0) {

                handleTimeout();

            }

        }, 1000);

}


// ==========================================
// UPDATE TIMER
// ==========================================

function updateTimer() {

    timerText.textContent =
        timeLeft;


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

        clearInterval(timer);

        timer = null;

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


    const question =
        questions[currentQuestion];


    const buttons =
        answersElement.querySelectorAll(
            ".answer-button"
        );


    buttons.forEach(button => {

        button.disabled = true;

    });


    if (buttons[question.c]) {

        buttons[
            question.c
        ].classList.add("correct");

    }


    statusElement.textContent =
        `⌛ Waktu habis! Jawaban: ${question.a[question.c]}`;


    statusElement.classList.add(
        "timeout-status"
    );


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


    setTimeout(() => {

        currentQuestion++;

        renderQuestion();

    }, 1000);

}


// ==========================================
// RESULT
// ==========================================

function showResult() {

    stopTimer();


    showScreen(resultScreen);


    const total =
        questions.length;


    const percentage =
        total > 0
            ? Math.round(
                (correctAnswers / total) * 100
            )
            : 0;


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


    renderReview();

}


// ==========================================
// REVIEW
// ==========================================

function renderReview() {

    reviewList.innerHTML =
        "";


    reviewData.forEach(
        (item, index) => {

            const review =
                document.createElement("div");


            review.className =
                "review-item";


            review.classList.add(
                item.correct
                    ? "review-correct"
                    : "review-wrong"
            );


            const number =
                document.createElement("div");


            number.className =
                "review-number";


            number.textContent =
                `${index + 1}.`;


            const content =
                document.createElement("div");


            content.className =
                "review-content";


            const question =
                document.createElement("strong");


            question.textContent =
                item.question;


            const userAnswer =
                document.createElement("span");


            if (item.timeout) {

                userAnswer.textContent =
                    "Waktu habis";

            }

            else {

                userAnswer.textContent =
                    `Jawaban: ${item.userAnswer}`;

            }


            const correctAnswer =
                document.createElement("span");


            correctAnswer.textContent =
                `Benar: ${item.correctAnswer}`;


            content.appendChild(question);

            content.appendChild(userAnswer);

            content.appendChild(correctAnswer);


            review.appendChild(number);

            review.appendChild(content);


            reviewList.appendChild(review);

        }
    );

}


// ==========================================
// FORMAT BAB
// ==========================================

function formatBab(bab) {

    const number =
        bab.replace("bab", "");


    return `Bab ${number}`;

}


// ==========================================
// SHUFFLE
// ==========================================

function shuffleArray(array) {

    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );


        [
            array[i],
            array[j]
        ] = [
            array[j],
            array[i]
        ];

    }


    return array;

}