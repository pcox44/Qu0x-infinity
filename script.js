document.addEventListener("DOMContentLoaded", () => {
  const targetBox = document.getElementById("targetBox");
  const diceContainer = document.getElementById("diceContainer");
  const buttonGrid = document.getElementById("buttonGrid");

  const submitBtn = document.getElementById("submitBtn");
  const evaluationBox = document.getElementById("evaluationBox");
  const expressionBox = document.getElementById("expressionBox");

  let diceValues = [];
  let targetNumber = 0;
  let expression = "";

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function generateDice() {
    diceValues = Array.from({ length: 5 }, () => getRandomInt(1, 9));
    renderDice();
  }

  function generateTarget() {
    targetNumber = getRandomInt(30, 100);
    targetBox.textContent = `Target: ${targetNumber}`;
  }

  function renderDice() {
    diceContainer.innerHTML = "";
    diceValues.forEach((val, index) => {
      const die = document.createElement("button");
      die.textContent = val;
      die.classList.add("dice");
      die.addEventListener("click", () => addToExpression(val, index));
      diceContainer.appendChild(die);
    });
  }

  function renderButtons() {
    const operators = ["+", "-", "*", "/", "^", "(", ")", "!", "←", "C"];
    buttonGrid.innerHTML = "";

    operators.forEach((op) => {
      const btn = document.createElement("button");
      btn.textContent = op;
      btn.addEventListener("click", () => handleOperator(op));
      buttonGrid.appendChild(btn);
    });
  }

  function addToExpression(value, index) {
    expression += value;
    updateExpressionBox();
  }

  function handleOperator(op) {
    if (op === "←") {
      expression = expression.slice(0, -1);
    } else if (op === "C") {
      expression = "";
    } else {
      expression += op;
    }
    updateExpressionBox();
  }

  function updateExpressionBox() {
    expressionBox.textContent = expression;
  }

  function evaluateExpression() {
    try {
      let result = eval(expression.replace(/!/g, '')); // factorial not yet handled
      evaluationBox.textContent = result;

      let score = Math.abs(targetNumber - result);
      alert(`Score: ${score}`);
    } catch (e) {
      evaluationBox.textContent = "Error";
    }
  }

  function startNewGame() {
    generateDice();
    generateTarget();
    expression = "";
    updateExpressionBox();
    evaluationBox.textContent = "?";
  }

  // Event Listeners
  submitBtn.addEventListener("click", evaluateExpression);

  // Add New Game Button
  const newGameBtn = document.createElement("button");
  newGameBtn.textContent = "New Game";
  newGameBtn.style.margin = "10px";
  newGameBtn.style.padding = "10px 20px";
  newGameBtn.style.fontSize = "1.1em";
  newGameBtn.style.backgroundColor = "green";
  newGameBtn.style.color = "white";
  newGameBtn.style.borderRadius = "8px";
  newGameBtn.style.border = "2px solid black";
  newGameBtn.style.cursor = "pointer";
  newGameBtn.addEventListener("click", startNewGame);

  document.body.insertBefore(newGameBtn, document.querySelector(".instructions"));

  // Initialize game
  renderButtons();
  startNewGame();
});
