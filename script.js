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

let usedDice = [];
let diceValues = [];
let target = null;
let lockedDays = JSON.parse(localStorage.getItem("lockedDays") || "{}");
let bestScores = JSON.parse(localStorage.getItem("bestScores") || "{}");

const colorBoxes = {
  "1": "🟥",
  "2": "⬜",
  "3": "🟦",
  "4": "🟨",
  "5": "🟩",
  "6": "⬛",
};

function expressionToShareable(expr) {
  return expr.replace(/\d/g, d => colorBoxes[d] || d);
}

function getDayIndex(date) {
  const start = new Date("2025-05-15T00:00:00");
  const diff = Math.floor((date - start) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function getDateFromDayIndex(index) {
  const start = new Date("2025-05-15T00:00:00");
  const date = new Date(start.getTime() + index * 86400000);
  return date.toISOString().slice(0, 10);
}

function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generatePuzzle(day) {
  const rand = mulberry32(day + 1);
  diceValues = Array.from({ length: 5 }, () => Math.floor(rand() * 6) + 1);
  target = Math.floor(rand() * 100) + 1;
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
  if (isDigit(char)) {
    if (isDigit(lastChar)) {
      expressionBox.innerText += ' ' + char;
    } else {
      expressionBox.innerText += char;
    }
  } else {
    expressionBox.innerText += char;
  }
  evaluateExpression();
}

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
  if (expr.length === 0) {
    evaluationBox.innerText = "?";
    return;
  }
  try {
    let replaced = expr;
    replaced = replaced.replace(/(\([^\)]+\)|\d+)!!!/g, (_, val) => {
      let n = isNaN(Number(val)) ? eval(val) : Number(val);
      return tripleFactorial(n);
    });
    replaced = replaced.replace(/(\([^\)]+\)|\d+)!!/g, (_, val) => {
      let n = isNaN(Number(val)) ? eval(val) : Number(val);
      return doubleFactorial(n);
    });
    replaced = replaced.replace(/(\([^\)]+\)|\d+)!/g, (_, val) => {
      let n = isNaN(Number(val)) ? eval(val) : Number(val);
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
        if (expr.length === 0) return;
        const removed = expr[expr.length - 1];
        expressionBox.innerText = expr.slice(0, -1);
        const idx = usedDice.findLast(i => diceValues[i].toString() === removed);
        if (idx !== undefined) {
          usedDice = usedDice.filter(i => i !== idx);
          document.querySelector(`.die[data-index="${idx}"]`).classList.remove("faded");
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

function submit() {
  const result = evaluationBox.innerText;
  if (result === "?" || !Number.isInteger(Number(result))) {
    alert("Invalid Submission");
    return;
  }
  if (usedDice.length !== 5) {
    alert("You must use all 5 dice.");
    return;
  }
  const dayKey = currentDay.toString();
  const score = Math.abs(Number(result) - target);
  if (!(dayKey in bestScores) || score < bestScores[dayKey]) {
    bestScores[dayKey] = score;
    localStorage.setItem("bestScores", JSON.stringify(bestScores));
  }
  if (score === 0) {
    lockedDays[dayKey] = { score, expression: expressionBox.innerText };
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
  const locked = lockedDays[day]?.score === 0;
  if (lockedDays[day]?.expression) {
    expressionBox.innerText = lockedDays[day].expression;
    evaluateExpression();
  } else {
    expressionBox.innerText = "";
    evaluationBox.innerText = "?";
  }
  targetBox.innerText = `Target: ${target}`;
  gameNumberDate.innerText = `Game #${day + 1} (${getDateFromDayIndex(day)})`;
  dailyBestScoreBox.innerText = bestScores[day]?.toString() ?? "N/A";
  const completedDays = Object.values(bestScores).filter(score => score === 0).length;
  completionRatioBox.innerText = `${completedDays}/${Object.keys(bestScores).length}`;
  const totalScore = Object.values(bestScores).reduce((a, b) => a + b, 0);
  masterScoreBox.innerText = `${totalScore}`;
  expressionBox.style.pointerEvents = locked ? "none" : "auto";
  submitBtn.disabled = locked;
  buttonGrid.querySelectorAll("button").forEach(btn => {
    btn.disabled = locked;
    btn.classList.toggle("disabled", locked);
  });
  const shareBtn = document.getElementById("shareBtn");
  shareBtn.classList.toggle("hidden", !(locked && lockedDays[day]?.expression));
  populateDropdown();
}

function populateDropdown() {
  dropdown.innerHTML = "";
  const max = currentDay + 10;
  for (let i = 0; i <= max; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.text = `${lockedDays[i]?.score === 0 ? "⭐ " : ""}Game #${i + 1}`;
    dropdown.appendChild(option);
  }
  dropdown.value = currentDay;
}

document.getElementById("prevDay").onclick = () => {
  if (currentDay > 0) {
    currentDay--;
    renderGame(currentDay);
  }
};

document.getElementById("nextDay").onclick = () => {
  currentDay++;
  renderGame(currentDay);
};

dropdown.addEventListener("change", (e) => {
  const selectedDay = Number(e.target.value);
  renderGame(selectedDay);
});

submitBtn.addEventListener("click", submit);
document.getElementById("shareBtn").addEventListener("click", () => {
  const gameNumber = currentDay + 1;
  const expression = expressionBox.innerText;
  const shareableExpr = expressionToShareable(expression);
  const shareText = `Qu0x! ${gameNumber}: ${shareableExpr}`;
  navigator.clipboard.writeText(shareText).then(() => {
    alert("Copied your Qu0x! expression to clipboard!");
  });
});

let currentDay = getDayIndex(new Date());
buildButtons();
renderGame(currentDay);
