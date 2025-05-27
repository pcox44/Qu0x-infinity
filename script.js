const expressionBox = document.getElementById("expressionBox");
const evaluationBox = document.getElementById("evaluationBox");
const buttonGrid = document.getElementById("buttonGrid");
const diceContainer = document.getElementById("diceContainer");
const targetBox = document.getElementById("targetBox");
const submitBtn = document.getElementById("submitBtn");
const dailyBestScoreBox = document.getElementById("dailyBestScore");
const completionRatioBox = document.getElementById("completionRatio");
const masterScoreBox = document.getElementById("masterScore");
const gameNumberDate = document.getElementById("gameNumberDate");
const qu0xAnimation = document.getElementById("qu0xAnimation");

// New Puzzle button fixed at bottom center
const newPuzzleBtn = document.createElement("button");
newPuzzleBtn.innerText = "New Puzzle";
newPuzzleBtn.style.position = "fixed";
newPuzzleBtn.style.bottom = "10px";
newPuzzleBtn.style.left = "50%";
newPuzzleBtn.style.transform = "translateX(-50%)";
newPuzzleBtn.style.padding = "10px 20px";
newPuzzleBtn.style.fontSize = "16px";
document.body.appendChild(newPuzzleBtn);

let currentPuzzleSeed = 1;  // starting seed counter for sin seeding
let diceValues = [];
let target = null;
let usedDice = [];

// Dice coloring
function styleDie(die, val) {
  const styles = {
    1: { bg: "red", fg: "white" },
    2: { bg: "white", fg: "black" },
    3: { bg: "blue", fg: "white" },
    4: { bg: "yellow", fg: "black" },
    5: { bg: "green", fg: "white" },
    6: { bg: "black", fg: "yellow" }
  };
  const style = styles[val];
  die.style.backgroundColor = style.bg;
  die.style.color = style.fg;
}

function generateRandomPuzzle(seed) {
  // Use sin(seed) to generate a float between 0-1, deterministic
  // Scale and mod for dice and target

  function pseudoRand(x) {
    return Math.abs(Math.sin(x)) % 1;
  }

  diceValues = Array.from({ length: 5 }, (_, i) => {
    const val = Math.floor(pseudoRand(seed + i) * 6) + 1;
    return val;
  });

  target = Math.floor(pseudoRand(seed + 5) * 100) + 1;
}

function renderDice() {
  diceContainer.innerHTML = "";
  usedDice = [];
  diceValues.forEach((val, idx) => {
    const die = document.createElement("div");
    die.className = "die";
    die.dataset.index = idx;
    die.dataset.value = val;
    die.innerText = val;
    styleDie(die, val);
    die.addEventListener("click", () => {
      if (!usedDice.includes(idx)) {
        usedDice.push(idx);
        die.classList.add("faded");
        addToExpression(val.toString());
      }
    });
    diceContainer.appendChild(die);
  });
}

// Expression manipulation - prevent digit concatenation
function addToExpression(char) {
  const expr = expressionBox.innerText;
  const lastChar = expr.slice(-1);

  const isDigit = c => /\d/.test(c);

  if (isDigit(char)) {
    if (expr.length === 0 || !isDigit(lastChar)) {
      expressionBox.innerText += char;
    } else {
      // prevent concatenation of digits
      return;
    }
  } else {
    // operators allowed freely
    expressionBox.innerText += char;
  }
  evaluateExpression();
}

// Factorials and extended factorials (!, !!, !!!)
function doubleFactorial(n) {
  if (n < 0 || !Number.isInteger(n)) throw "Invalid double factorial";
  if (n === 0 || n === 1) return 1;
  let product = 1;
  for (let i = n; i > 1; i -= 2) product *= i;
  return product;
}

function tripleFactorial(n) {
  if (n < 0 || !Number.isInteger(n)) throw "Invalid triple factorial";
  if (n === 0 || n === 1) return 1;
  let product = 1;
  for (let i = n; i > 1; i -= 3) product *= i;
  return product;
}

function factorial(n) {
  if (n < 0 || !Number.isInteger(n)) throw "Invalid factorial";
  return n <= 1 ? 1 : n * factorial(n - 1);
}

function evaluateExpression() {
  const expr = expressionBox.innerText.trim();
  if (!expr) {
    evaluationBox.innerText = "?";
    return;
  }
  try {
    let replaced = expr;

    replaced = replaced.replace(/(\([^)]+\)|\d+)!!!/g, (_, val) => {
      let n = Number.isNaN(Number(val)) ? eval(val) : Number(val);
      if (!Number.isInteger(n) || n < 0) throw "Invalid triple factorial";
      return tripleFactorial(n);
    });

    replaced = replaced.replace(/(\([^)]+\)|\d+)!!/g, (_, val) => {
      let n = Number.isNaN(Number(val)) ? eval(val) : Number(val);
      if (!Number.isInteger(n) || n < 0) throw "Invalid double factorial";
      return doubleFactorial(n);
    });

    replaced = replaced.replace(/(\([^)]+\)|\d+)!/g, (_, val) => {
      let n = Number.isNaN(Number(val)) ? eval(val) : Number(val);
      if (!Number.isInteger(n) || n < 0) throw "Invalid factorial";
      return factorial(n);
    });

    replaced = replaced.replace(/\^/g, "**");

    let result = eval(replaced);

    evaluationBox.innerText = result;
  } catch {
    evaluationBox.innerText = "?";
  }
}

function buildButtons() {
  const ops = ["+", "-", "*", "/", "^", "!", "(", ")", "Back", "Clear"];
  buttonGrid.innerHTML = "";

  ops.forEach(op => {
    const btn = document.createElement("button");
    btn.innerText = op;
    btn.onclick = () => {
      if (op === "Back") {
        let expr = expressionBox.innerText;
        if (!expr) return;

        const removed = expr[expr.length - 1];
        expressionBox.innerText = expr.slice(0, -1);

        if (/\d/.test(removed)) {
          // Remove used dice by matching last die with that value
          // Find last used dice index for removed digit:
          for (let i = usedDice.length - 1; i >= 0; i--) {
            const idx = usedDice[i];
            if (diceValues[idx].toString() === removed) {
              usedDice.splice(i, 1);
              document.querySelector(`.die[data-index="${idx}"]`)?.classList.remove("faded");
              break;
            }
          }
        }
      } else if (op === "Clear") {
        expressionBox.innerText = "";
        usedDice = [];
        renderDice();
      } else {
        addToExpression(op);
      }
      evaluateExpression();
    };
    buttonGrid.appendChild(btn);
  });
}

// LocalStorage helpers to save completed puzzles
function getCompletedPuzzles() {
  const data = localStorage.getItem("completedPuzzles");
  return data ? JSON.parse(data) : [];
}

function saveCompletedPuzzle(seed) {
  let completed = getCompletedPuzzles();
  if (!completed.includes(seed)) {
    completed.push(seed);
    localStorage.setItem("completedPuzzles", JSON.stringify(completed));
  }
}

// Find first uncompleted puzzle seed starting from 1
function findFirstUncompletedSeed() {
  const completed = new Set(getCompletedPuzzles());
  let seed = 1;
  while (completed.has(seed)) {
    seed++;
  }
  return seed;
}

function submit() {
  const result = evaluationBox.innerText;
  if (result === "?") {
    alert("Invalid Submission");
    return;
  }
  if (!Number.isInteger(Number(result))) {
    alert("Submission must be an integer.");
    return;
  }
  if (usedDice.length !== 5) {
    alert("You must use all 5 dice.");
    return;
  }

  const score = Math.abs(Number(result) - target);

  if (score === 0) {
    // Perfect match (Qu0x) — save and immediately go to next puzzle
    saveCompletedPuzzle(currentPuzzleSeed);
    startNewPuzzle(currentPuzzleSeed + 1);
    return;
  }

  alert(`Your score (distance from target): ${score}`);

  // Mark this puzzle as completed
  saveCompletedPuzzle(currentPuzzleSeed);

  // Disable submit and inputs until next puzzle
  submitBtn.disabled = true;
  expressionBox.style.pointerEvents = "none";
  buttonGrid.querySelectorAll("button").forEach(btn => btn.disabled = true);
}


function startNewPuzzle(seed = null) {
  if (seed === null) {
    currentPuzzleSeed++;
  } else {
    currentPuzzleSeed = seed;
  }
  generateRandomPuzzle(currentPuzzleSeed);
  usedDice = [];
  expressionBox.innerText = "";
  evaluationBox.innerText = "?";
  renderDice();
  targetBox.innerText = `Target: ${target}`;
  gameNumberDate.innerText = `Puzzle #${currentPuzzleSeed}`;
  submitBtn.disabled = false;
  expressionBox.style.pointerEvents = "auto";
  buttonGrid.querySelectorAll("button").forEach(btn => btn.disabled = false);
}

submitBtn.onclick = () => submit();
newPuzzleBtn.onclick = () => startNewPuzzle();

window.onload = () => {
  buildButtons();
  const seedToStart = findFirstUncompletedSeed();
  startNewPuzzle(seedToStart);
};
