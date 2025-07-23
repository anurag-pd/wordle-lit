import { LitElement, css, html } from "lit";
import { WORD_LIST } from "./word-list.js";

const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;

function getRandomWord() {
  return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
}

function checkGuess(guess, answer) {
  // Returns array of: 'correct', 'present', 'absent'
  return guess.split("").map((char, i) => {
    if (char === answer[i]) return "correct";
    if (answer.includes(char)) return "present";
    return "absent";
  });
}

export class WordleGame extends LitElement {
  static properties = {
    board: { type: Array },
    currentGuess: { type: String },
    attempt: { type: Number },
    gameState: { type: String },
    answer: { type: String },
    message: { type: String },
    usedLetters: { type: Object },
  };

  constructor() {
    super();
    this.resetGame();
    this.usedLetters = {};
  }

  resetGame() {
    this.answer = getRandomWord();
    this.board = [];
    this.currentGuess = "";
    this.attempt = 0;
    this.gameState = "playing";
    this.message = "";
    this.usedLetters = {};
  }

  handleInput(e) {
    if (this.gameState !== "playing") return;
    const value = e.target.value.toLowerCase();
    if (/^[a-z]{0,5}$/.test(value)) {
      this.currentGuess = value;
    }
  }

  handleKeyDown(e) {
    if (e.key === "Enter") {
      this.submitGuess();
    }
  }

  submitGuess() {
    if (this.currentGuess.length !== WORD_LENGTH) {
      this.message = "Enter a 5-letter word.";
      return;
    }
    if (!WORD_LIST.includes(this.currentGuess)) {
      this.message = "Not in word list!";
      return;
    }
    const result = checkGuess(this.currentGuess, this.answer);
    this.board = [...this.board, { guess: this.currentGuess, result }];
    // Track used letters and their best status
    this.currentGuess.split("").forEach((char, idx) => {
      const prev = this.usedLetters[char];
      const curr = result[idx];
      if (
        !prev ||
        (prev === "present" && curr === "correct") ||
        (prev === "absent" && curr !== "absent")
      ) {
        this.usedLetters[char] = curr;
      }
    });
    this.attempt++;
    if (this.currentGuess === this.answer) {
      this.gameState = "won";
      this.message = "Congratulations! You guessed it!";
    } else if (this.attempt >= MAX_ATTEMPTS) {
      this.gameState = "lost";
      this.message = `Game over! The word was "${this.answer}".`;
    } else {
      this.message = "";
    }
    this.currentGuess = "";
  }

  handleVirtualKey(key) {
    if (this.gameState !== "playing") return;
    if (key === "Enter") {
      this.submitGuess();
    } else if (key === "Backspace") {
      this.currentGuess = this.currentGuess.slice(0, -1);
    } else if (
      /^[a-zA-Z]$/.test(key) &&
      this.currentGuess.length < WORD_LENGTH
    ) {
      this.currentGuess += key.toLowerCase();
    }
  }

  renderKeyboard() {
    const rows = [
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
      ["Enter", "z", "x", "c", "v", "b", "n", "m", "Backspace"],
    ];
    return html`
      ${rows.map(
        (row, rowIdx) => html`
          <div class="kb-row">
            ${row.map((key, keyIdx) => {
              let status = this.usedLetters[key];
              let extraClass = "";
              let style = "";
              if (rowIdx === 2 && (key === "Enter" || key === "Backspace")) {
                extraClass = "wide";
              }
              return html`
                <button
                  class="kb-key ${status || ""} ${extraClass}"
                  style=${style}
                  @click=${() => this.handleVirtualKey(key)}
                  ?disabled=${this.gameState !== "playing" ||
                  (key.length === 1 &&
                    this.currentGuess.length >= WORD_LENGTH &&
                    key !== "Backspace")}
                >
                  ${key === "Backspace" ? "⌫" : key.toUpperCase()}
                </button>
              `;
            })}
          </div>
        `
      )}
    `;
  }

  render() {
    return html`
      <h1>Wordle (Lit)</h1>
      <div class="board">
        ${Array.from({ length: MAX_ATTEMPTS }).map((_, i) => {
          const row = this.board[i];
          return html`
            <div class="row">
              ${Array.from({ length: WORD_LENGTH }).map((_, j) => {
                const letter = row ? row.guess[j] : "";
                const status = row ? row.result[j] : "";
                return html`
                  <span class="cell ${status}"
                    >${letter ? letter.toUpperCase() : ""}</span
                  >
                `;
              })}
            </div>
          `;
        })}
      </div>
      ${this.gameState === "playing"
        ? html`
            <input
              type="text"
              .value=${this.currentGuess}
              maxlength="5"
              @input=${this.handleInput}
              @keydown=${this.handleKeyDown}
              placeholder="Guess a word"
              ?disabled=${this.gameState !== "playing"}
            />
            <button @click=${this.submitGuess}>Guess</button>
          `
        : html``}
      <div class="message">${this.message}</div>
      <button @click=${this.resetGame}>Restart</button>
      <div class="keyboard">${this.renderKeyboard()}</div>
    `;
  }

  firstUpdated() {
    this.focusInput();
  }

  updated(changedProps) {
    if (changedProps.has("gameState") || changedProps.has("currentGuess")) {
      this.focusInput();
    }
  }

  focusInput() {
    const input = this.renderRoot?.querySelector('input[type="text"]');
    if (input && this.gameState === "playing") {
      input.focus();
    }
  }

  static styles = css`
    :host {
      display: block;
      max-width: 400px;
      margin: 2rem auto;
      font-family: system-ui, sans-serif;
      text-align: center;
    }
    .board {
      margin-bottom: 1rem;
    }
    .row {
      display: flex;
      justify-content: center;
      margin-bottom: 0.3rem;
    }
    .cell {
      width: 2.2em;
      height: 2.2em;
      border: 2px solid #ccc;
      margin: 0 0.1em;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5em;
      font-weight: bold;
      text-transform: uppercase;
      background: #fff;
      transition: background 0.2s, border 0.2s;
    }
    .cell.correct {
      background: #6aaa64;
      color: #fff;
      border-color: #6aaa64;
    }
    .cell.present {
      background: #c9b458;
      color: #fff;
      border-color: #c9b458;
    }
    .cell.absent {
      background: #787c7e;
      color: #fff;
      border-color: #787c7e;
    }
    input[type="text"] {
      font-size: 1.2em;
      padding: 0.3em;
      width: 16em;
      margin-bottom: 0.5em;
      text-align: center;
      letter-spacing: 0.2em;
      text-transform: uppercase;
    }
    .message {
      min-height: 1.5em;
      margin: 0.5em 0;
      color: #b91c1c;
      font-weight: 500;
    }
    button {
      margin-top: 0.5em;
      padding: 0.5em 1.2em;
      font-size: 1em;
      border-radius: 6px;
      border: none;
      background: #646cff;
      color: #fff;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover {
      background: #535bf2;
    }
    .keyboard {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 1.5em;
      user-select: none;
      width: 100%;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }
    .kb-row {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      gap: 0.2em;
      margin-bottom: 0.2em;
    }
    .kb-key {
      flex: 1 1 0;
      min-width: 2.2em;
      min-height: 2.2em;
      margin: 0 0.1em;
      border-radius: 4px;
      border: none;
      background: #d3d6da;
      color: #222;
      font-size: 1em;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
      max-width: 3em;
    }
    .kb-key.correct {
      background: #6aaa64;
      color: #fff;
    }
    .kb-key.present {
      background: #c9b458;
      color: #fff;
    }
    .kb-key.absent {
      background: #787c7e;
      color: #fff;
    }
    .kb-key:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .kb-key.wide {
      flex: 2 1 0;
      min-width: 4.6em;
      max-width: 6em;
    }
  `;
}

customElements.define("wordle-game", WordleGame);
