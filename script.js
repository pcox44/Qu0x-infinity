const expressionBox = document.getElementById("expressionBox");
const evaluationBox = document.getElementById("evaluationBox");
const buttonGrid = document.getElementById("buttonGrid");
const diceContainer = document.getElementById("diceContainer");
const targetBox = document.getElementById("targetBox");
const submitBtn = document.getElementById("submitBtn");
const dropdown = document.getElementById("gameDropdown");
const dailyBestScoreBox = document.getElementById("dailyBestScore");
const completionRatioBox = document.getElementById("completionRatio");
const masterScoreBox = document.getElementById("masterScore");
const gameNumberDate = document.getElementById("gameNumberDate");
const qu0xAnimation = document.getElementById("qu0xAnimation");

// New Game button at bottom
const newGameBtn = document.createElement("button");
newGameBtn.innerText = "New Game";
newGameBtn.style.position = "fixed";
newGameBtn.style.bottom = "10px";
newGameBtn.style.left = "50%";
newGameBtn.style.transform = "translateX(-50%)";
newGameBtn.style.padding = "10px 20px";
newGameBtn.style.fontSize = "16px";
document.body.appendChild(newGameBtn);

let currentDate = new Date();
let currentDay = getDayIndex(currentDate);
let maxDay = getDayIndex(new Date());
let usedDice = [];
let diceValues = [];
let target = null;
let lockedDays = JSON.parse(localStorage.getItem("lockedDays") || "{}");
let bestScores = JSON.parse(localStorage.getItem("bestScores") || "{}");

const colorBoxes = {
  "1": "🟥", // red box for 1
  "2": "⬜", // white box for 2
  "3": "🟦", // blue box for 3
  "4": "🟨", // yellow box for 4
  "5": "🟩", // green box for 5
  "6": "⬛", // black box for 6
};

function expressionToShareable(expr) {
  return expr.replace(/\d/g, d => colorBoxes[d] || d);
}

function getDayIndex(date) {
  const start = new Date("2025-05-15T00:00:00");
  const diff = Math.floor((date - start) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function mulberry32(seed) {
  return function () {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getDateFromDayIndex(index) {
  const start = new Date("2025-05-15T00:00:00");
  const date = new Date(start.getTime() + index * 86400000);
  return date.toISOString().slice(0, 10);
}

// Static puzzles for first 10 days
const staticPuzzles = [
  { dice: [3, 2, 5, 1, 1], target: 82 },
  { dice: [6, 3, 2, 4, 3], target: 46 },
  { dice: [2, 6, 2, 5, 4], target: 93 },
  { dice: [1, 6, 6, 3, 3], target: 44 },
  { dice: [1, 5, 4, 3, 2], target: 76 },
  { dice: [4, 2, 6, 3, 5], target: 4 },
  { dice: [1, 6, 4, 4, 3], target: 4 },
  { dice: [6, 3, 1, 6, 1], target: 19 },
  { dice: [3, 1, 1, 3, 5], target: 73 },
  { dice: [3, 1, 3, 2, 6], target: 31 },
  { dice: [4, 5, 5, 3, 2], target: 52 },
];

// Generate puzzle function
function generatePuzzle(day) {
  if (day < 11) {
    diceValues = staticPuzzles[day].dice.slice();
    target = staticPuzzles[day].target;
  } else {
    const rand = mulberry32(day + 1);
    diceValues = Array.from({ length: 5 }, () => Math.floor(rand() * 6) + 1);
    target = Math.floor(rand() * 100) + 1;
  }
}

// Render dice with colors as in original styleDie
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
      if (!usedDice.includes(idx) && !isLocked(currentDay)) {
        usedDice.push(idx);
        die.classList.add("faded");
        addToExpression(val.toString());
      }
    });
    diceContainer.appendChild(die);
  });
}

// Dice coloring with your colors
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

function addToExpression(char) {
  const expr = expressionBox.innerText;
  const lastChar = expr.slice(-1);

  const isDigit = c => /\d/.test(c);
  const isOperator = c => /[+\-*/^()!]/.test(c);

  // Prevent concatenation of digits
  if (isDigit(char)) {
    if (expr.length === 0) {
      expressionBox.innerText += char;
    } else if (isDigit(lastChar)) {
      // Do NOT add digit if last char is digit - no concatenation allowed
      // Optionally, can alert or ignore silently:
      // alert("Cannot concatenate digits");
      return;
    } else {
      expressionBox.innerText += char;
    }
  } else {
    // operators and parentheses allowed directly
    expressionBox.innerText += char;
  }

  evaluateExpression();
}

function doubleFactorial(n) {
  if (n < 0 || !Number.isInteger(n)) throw "Invalid double factorial";
  if (n === 0 || n === 1) return 1;
  let product = 1;
  for (let i = n; i > 1; i -= 2) {
    product *= i;
  }
  return product;
}

function tripleFactorial(n) {
  if (n < 0 || !Number.isInteger(n)) throw "Invalid triple factorial";
  if (n === 0 || n === 1) return 1;
  let product = 1;
  for (let i = n; i > 1; i -= 3) {
    product *= i;
  }
  return product;
}

function factorial(n) {
  if (n < 0 || !Number.isInteger(n)) throw "Invalid factorial";
  return n <= 1 ? 1 : n * factorial(n - 1);
}

function evaluateExpression() {
  const expr = expressionBox.innerText.trim();
  if (expr.length === 0) {
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
      if (isLocked(currentDay)) return;

      if (op === "Back") {
        let expr = expressionBox.innerText;
        if (expr.length === 0) return;

        const removed = expr[expr.length - 1];
        expressionBox.innerText = expr.slice(0, -1);

        if (/\d/.test(removed)) {
          // Remove used dice index matching removed digit
          // Find last usedDice index with dice value matching removed digit
          const idx = usedDice.slice().reverse().find(i => diceValues[i].toString() === removed);
          if (idx !== undefined) {
            usedDice = usedDice.filter(i => i !== idx);
            document.querySelector(`.die[data-index="${idx}"]`)?.classList.remove("faded");
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

function isLocked(day) {
  return lockedDays[day]?.score === 0;
}

function submit() {
  if (isLocked(currentDay)) return;

  const result = evaluationBox.innerText;
  if (result === "?") {
    alert("Invalid Submission");
    return;
  }
  if (!Number.isInteger(Number(result))) {
    alert("Submission must be an integer result.");
    return;
  }
  if (usedDice.length !== 5) {
    alert("You must use all 5 dice.");
    return;
  }

  const score = Math.abs(Number(result) - target);
  if (!(currentDay in bestScores) || score < bestScores[currentDay]) {
    bestScores[currentDay] = score;
    localStorage.setItem("bestScores", JSON.stringify(bestScores));
  }

  if (score === 0) {
    lockedDays[currentDay] = { score, expression: expressionBox.innerText };
    localStorage.setItem("lockedDays", JSON.stringify(lockedDays));
    animateQu0x();

    document.getElementById("shareBtn").classList.remove("hidden");
  }

  renderGame(currentDay);
}

function animateQu0x() {
  qu0xAnimation.classList.remove("hidden");
  setTimeout(() => {
    qu0xAnimation.classList.add("hidden");
  }, 3000);
}

function renderGame(day) {
  currentDay = day;

  generatePuzzle(day);
  renderDice();

  if (lockedDays[day] && lockedDays[day].expression) {
    expressionBox.innerText = lockedDays[day].expression;
    evaluateExpression();
  } else {
    expressionBox.innerText = "";
    evaluationBox.innerText = "?";
  }

  targetBox.innerText = `Target: ${target}`;
  gameNumberDate.innerText = `Game #${day + 1} (${getDateFromDayIndex(day)})`;

  if (bestScores[day] !== undefined) {
    dailyBestScoreBox.innerText = `${bestScores[day]}`;
  } else {
    dailyBestScoreBox.innerText = "N/A";
  }

  const completedDays = Object.values(bestScores).filter(score => score === 0).length;
  completionRatioBox.innerText = `${completedDays}/${maxDay + 1}`;

  const totalScore = Object.values(bestScores).reduce((a, b) => a + b, 0);
  const totalGames = maxDay + 1;

  if (Object.keys(bestScores).length === totalGames) {
    masterScoreBox.innerText = `${totalScore}`;
  } else {
    masterScoreBox.innerText = "N/A";
  }

  const locked = isLocked(day);

  expressionBox.style.pointerEvents = locked ? "none" : "auto";
  submitBtn.disabled = locked;

  buttonGrid.querySelectorAll("button").forEach(btn => {
    btn.disabled = locked;
    if (locked) {
      btn.classList.add("disabled");
    } else {
      btn.classList.remove("disabled");
    }
  });

  const shareBtn = document.getElementById("shareBtn");
  if (locked && lockedDays[day]?.expression) {
    shareBtn.classList.remove("hidden");
  } else {
    shareBtn.classList.add("hidden");
  }
}

document.getElementById("prevDay").onclick = () => {
  if (currentDay > 0) {
    currentDay--;
    renderGame(currentDay);
    populateDropdown();
  }
};

document.getElementById("nextDay").onclick = () => {
  if (currentDay < maxDay) {
    currentDay++;
    renderGame(currentDay);
    populateDropdown();
  }
};

function populateDropdown() {
  dropdown.innerHTML = "";
  for (let i = 0; i <= maxDay; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.text = `Game #${i + 1}`;
    if (lockedDays[i]?.score === 0) option.text += " ✅";
    dropdown.appendChild(option);
  }
  dropdown.value = currentDay;
}

dropdown.onchange = () => {
  currentDay = parseInt(dropdown.value);
  renderGame(currentDay);
};

submitBtn.onclick = () => submit();

newGameBtn.onclick = () => {
  // Reset for infinite play mode (random puzzle not locked)
  currentDay = maxDay + 1; // Infinite mode day index beyond maxDay
  lockedDays[currentDay] = undefined;
  bestScores[currentDay] = undefined;
  generatePuzzle(currentDay);
  usedDice = [];
  expressionBox.innerText = "";
  evaluationBox.innerText = "?";
  renderDice();
  targetBox.innerText = `Target: ${target}`;
  gameNumberDate.innerText = `New Game (Infinite Mode)`;
  submitBtn.disabled = false;
  expressionBox.style.pointerEvents = "auto";
  buttonGrid.querySelectorAll("button").forEach(btn => btn.disabled = false);
  document.getElementById("shareBtn").classList.add("hidden");
};

window.onload = () => {
  buildButtons();
  populateDropdown();
  renderGame(currentDay);
};
