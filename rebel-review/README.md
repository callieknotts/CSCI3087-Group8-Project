# RebelReview

RebelReview is a web-based spaced-repetition flashcard app. Users create decks of front/back flashcards, study them, and rate how well they recalled each card (Again, Hard, Good, Easy). The app uses those ratings to decide when each card should come back: cards you know well return less often, and cards you struggle with return sooner.

**Course:** CSCI 3087, Team 8
**Team:** Callie Knotts, Colton Crane, Dylan Bleck, Lavanya Negi

## Project status

This is an in-progress MVP. The core study loop is defined in the project requirements document: create a deck, add cards, study, rate recall, and schedule the next review.

| Feature | Status |
|---|---|
| Create and list decks | Done |
| Create cards and view a deck's cards | Done |
| Data persists after a page refresh | Done (browser `localStorage`) |
| Review scheduler (Again/Hard/Good/Easy) with unit tests | Done |
| Edit and delete cards | Not started |
| Study session (flip card, rate recall) | Not started |
| Due-card review | Not started |
| Backend, registration, email verification, login | Not started |

**Current limitation:** there is no backend yet. Decks and cards are saved in your browser's `localStorage`, so they stay on the browser and device where you created them. Clearing site data erases them.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) and npm

### Install and run

The React app is in the `rebel-review` folder. Run all commands from inside it.

```bash
git clone https://github.com/callieknotts/CSCI3087-Group8-Project.git
cd CSCI3087-Group8-Project/rebel-review
npm install
npm start
```

`npm start` opens the app in your browser, usually at `http://localhost:3000`. If that port is busy, the terminal will offer another one.

### Run the tests

```bash
npm test
```

This starts Jest in watch mode. Press `a` to run all tests and `q` to quit. For a single run:

```bash
CI=true npm test
```

(On Windows PowerShell, use `$env:CI="true"; npm test`.)

## Architecture

The code follows an onion architecture, where each layer depends only on the layers inside it.

```
src/
├── domain/           Core rules. No React, no storage.
│   ├── deck.js         validate and create decks
│   ├── card.js         validate and create cards
│   └── scheduler.js    spaced-repetition scheduling logic
├── application/      Coordinates actions using domain rules.
│   ├── deckService.js
│   └── cardService.js
├── infrastructure/   Talks to storage.
│   ├── localDeckRepository.js   localStorage (temporary)
│   ├── localCardRepository.js   localStorage (temporary)
│   └── deckAPI.js               placeholder for the future backend
├── ui/               React components and pages.
│   ├── components/     CreateDeck, CreateCard
│   └── pages/          DeckPage
├── compositionRoot.js   Wires repositories into services (the one place that knows both).
└── App.js               Routes and the deck list page.
```

Services receive their repository as a parameter instead of importing it. When the backend is ready, the `localStorage` repositories can be replaced with API-backed ones by changing the imports in `compositionRoot.js`. Nothing in `domain/`, `application/`, or `ui/` needs to change.

## How scheduling works

`src/domain/scheduler.js` is an SM-2-style scheduler.

- New and Learning cards move through short minute-based steps and graduate to Review when rated Good or Easy.
- Review cards get day-based intervals that grow with the card's ease factor.
- Again sends a Review card back to Learning and lowers its ease. Hard and Easy adjust the ease down and up.
- The scheduler is a pure function: the same card, rating, and time always give the same result. It rejects invalid input with clear errors.

## Documentation

- Requirements: see the Project Requirements Document (Milestone 2) for goals, user stories, the ERD, and scope.
- AI use: AI-assisted code on this project is reviewed and tested by team members before it is treated as final.
