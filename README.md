# Core Progress Assessment (pre half term)

An online progress assessment for T Level Engineering and Manufacturing core learners. It covers Unit 8.1 Parts 1 and 2, Unit 2.1 (sectors) and Unit 1.1 (design principles), with 35 questions worth 79 marks.

## What learners get

- A start page where they enter their name and group and agree to work on their own.
- Seven sections: complete the sentence, calculations, explain it, multiple choice, select all, advanced calculations and extended answers.
- **Every question is compulsory.** Learners cannot move on from a blank question or submit until all 35 are answered. Written answers need a minimum number of words, and number answers must be a number.
- Answers save on the device as they go, so a refresh does not lose work.
- Automatic marking when they submit:
  - typed words, with small spelling slips accepted and flagged
  - number ranges, with part marks for unit-prefix or rounding slips
  - multiple choice
  - select-all, with part marks
  - written answers, marked against mark-scheme criteria. These marks are provisional until the teacher confirms them.
- A personal report:
  - score, band, topic and skill breakdown, and badges
  - personalised feedback, plus feedforward on every question
  - the mark-scheme points they missed, the three priority topics with actions and a 3-week core exam revision plan
  - a "my next step" pledge
- **Download results file** (to hand in on Teams) and **Print or save as PDF**.
- Reading support: larger text and cream background buttons, with a Verdana font throughout.

## Automatic results collection

1. Paste `setup/apps_script.gs` into a Google Sheet's Apps Script.
2. Deploy it as a web app.
3. Put its `/exec` URL in `js/config.js`.

Every learner's results then arrive in the sheet the moment they submit, and the teacher dashboard loads them with one click. Learners do nothing extra.

## Teacher dashboard

Open `teacher.html`. The teacher code is `TMC2026`, and the same code resets a learner device from the results page.

1. Drop the learners' results files onto the page.
2. See the class table, a question-by-question heat map and the answer key.
3. Click a learner to read their written answers and override any auto-mark.
4. Export everything to CSV.

Results and overrides stay in your browser. Nothing is uploaded anywhere.

## Editing questions

The questions and the encoded answer key are in `js/data.js`. They are generated from the course question bank by `gen_data.py`, which lives outside this repository. To change a question, ask for the file to be regenerated.

## Hosting

The site is plain HTML, CSS and JavaScript, with no build step. Turn on GitHub Pages for this repository, using the main branch and the root folder.
