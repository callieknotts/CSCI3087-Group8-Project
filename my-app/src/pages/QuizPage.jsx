import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ShuffleControls from '../components/ShuffleControls';
import StarButton from '../components/StarButton';
import StudyFrame from '../components/StudyFrame';
import StudyLoader from '../components/StudyLoader';
import { useStarred } from '../hooks/useStarred';
import { QUIZ_MIN_CARDS, buildQuiz, canQuiz, quizzableCards } from '../utils/quiz';

// Quiz mode (multiple choice). Routes:
//   /decks/:deckId/quiz   /decks/:deckId/subdecks/:sid/quiz   /flashcards/starred/quiz
// Each question shows a card's front and 4 choices: its back plus the backs of 3 other
// random cards. It needs at least 4 cards (with different answers) to make those choices.
export default function QuizPage() {
  return <StudyLoader mode="quiz">{(set) => <Quiz set={set} />}</StudyLoader>;
}

function Quiz({ set }) {
  const { title, backTo, backLabel, cards } = set;
  const { starred, toggle, error } = useStarred(set.starred);

  const [questions, setQuestions] = useState(() => buildQuiz(cards)); // already in random order
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null); // the choice the person clicked, or null
  const [missed, setMissed] = useState([]); // cards answered wrong, for "Retry missed"

  const enough = canQuiz(cards);
  const question = questions[index]; // undefined once every question is answered
  const answered = picked !== null;

  // start a fresh quiz: new random order, new random wrong answers. `asked` = only some cards.
  const begin = useCallback(
    (asked = cards) => {
      setQuestions(buildQuiz(cards, Math.random, asked));
      setIndex(0);
      setPicked(null);
      setMissed([]);
    },
    [cards],
  );

  const choose = useCallback(
    (choice) => {
      if (!question || picked !== null) return;
      setPicked(choice);
      if (choice !== question.answer) setMissed((prev) => [...prev, question.card]);
    },
    [question, picked],
  );

  const next = useCallback(() => {
    setIndex((i) => i + 1);
    setPicked(null);
  }, []);

  // Keyboard: 1-4 pick a choice; after answering, Space or Enter goes to the next question.
  useEffect(() => {
    function onKeyDown(event) {
      if (event.altKey || event.ctrlKey || event.metaKey || !question) return;
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (picked === null) {
        const choice = question.choices[Number(event.key) - 1];
        if (choice !== undefined) choose(choice);
      } else if (event.key === ' ' || event.key === 'Enter') {
        if (tag === 'BUTTON' || tag === 'A') return; // a focused button handles its own press
        event.preventDefault();
        next();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [question, picked, choose, next]);

  const tools = enough ? (
    <ShuffleControls shuffled={false} onShuffle={() => begin()} label="Shuffle & restart" />
  ) : null;

  if (!enough) {
    return (
      <StudyFrame backTo={backTo} backLabel={backLabel} title={title} modeName="Quiz" error={error}>
        <div className="flash-message" role="status">
          <p>
            <strong>Quiz needs at least {QUIZ_MIN_CARDS} cards</strong> with different answers to make
            its questions.
          </p>
          <p>
            There {quizzableCards(cards).length === 1 ? 'is' : 'are'} only {quizzableCards(cards).length}{' '}
            usable {quizzableCards(cards).length === 1 ? 'card' : 'cards'} here (a card needs text on both
            sides). Add more cards, or pick another mode.
          </p>
          <Link className="btn btn-type2" to={backTo}>
            ← {backLabel}
          </Link>
        </div>
      </StudyFrame>
    );
  }

  // every question answered: show the score
  if (!question) {
    const total = questions.length;
    const right = total - missed.length;
    return (
      <StudyFrame
        backTo={backTo}
        backLabel={backLabel}
        title={title}
        modeName="Quiz"
        tools={tools}
        error={error}
      >
        <div className="flash-message" role="status">
          <p>
            <strong>Quiz complete!</strong>
          </p>
          <p>
            You got {right} of {total} right ({Math.round((right / total) * 100)}%).
          </p>
          {missed.length > 0 && (
            <button type="button" className="btn btn-type1" onClick={() => begin(missed)}>
              Retry the {missed.length} you missed
            </button>
          )}{' '}
          <button type="button" className="btn btn-type2" onClick={() => begin()}>
            New quiz
          </button>
        </div>
      </StudyFrame>
    );
  }

  const isStarred = starred.has(question.card.id);
  const score = index + (answered ? 1 : 0) - missed.length; // questions answered so far, minus the wrong ones

  return (
    <StudyFrame
      backTo={backTo}
      backLabel={backLabel}
      title={title}
      modeName="Quiz"
      tools={tools}
      error={error}
    >
      <div
        className="flash-progress"
        role="progressbar"
        aria-label="Progress through the quiz"
        aria-valuemin={0}
        aria-valuemax={questions.length}
        aria-valuenow={index + (answered ? 1 : 0)}
      >
        <span style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }} />
      </div>

      <div className="flash-stage">
        <div className="study-card">
          <span className="flash-side">Question {index + 1} of {questions.length}</span>
          <p className="flash-text">{question.question}</p>
        </div>
        <StarButton starred={isStarred} onToggle={() => toggle(question.card)} />
      </div>

      <div className="quiz-choices" role="group" aria-label="Choose the answer">
        {question.choices.map((choice, i) => {
          let state = '';
          if (answered && choice === question.answer) state = ' quiz-choice--right';
          else if (answered && choice === picked) state = ' quiz-choice--wrong';
          else if (answered) state = ' quiz-choice--dim';
          return (
            <button
              key={choice}
              type="button"
              className={`quiz-choice${state}`}
              disabled={answered}
              onClick={(event) => {
                if (event.detail > 0) event.currentTarget.blur();
                choose(choice);
              }}
            >
              <span className="quiz-choice-key" aria-hidden="true">
                {i + 1}
              </span>
              {choice}
            </button>
          );
        })}
      </div>

      <p className="study-feedback" role="status" aria-live="polite">
        {answered &&
          (picked === question.answer ? '✓ Correct!' : `✗ Not quite. The answer is “${question.answer}”.`)}
      </p>

      <div className="study-actions">
        <span className="study-score">Score {score}</span>
        {answered && (
          <button
            type="button"
            className="btn btn-type1"
            onClick={(event) => {
              if (event.detail > 0) event.currentTarget.blur();
              next();
            }}
          >
            {index + 1 === questions.length ? 'See score' : 'Next question'}
          </button>
        )}
      </div>

      <p className="flash-hint">Press 1–4 to answer. Space or Enter goes to the next question.</p>
    </StudyFrame>
  );
}
