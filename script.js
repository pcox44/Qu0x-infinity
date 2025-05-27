<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Qu0x! Infinite Mode</title>
  <style>
    body {
      font-family: sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      background: #111;
      color: #fff;
      margin: 0;
      padding: 1em;
    }
    h1 {
      font-size: 2em;
      margin: 0.5em;
    }
    #targetBox, #gameNumberDate {
      margin: 0.5em;
      font-size: 1.2em;
    }
    #diceBox {
      margin: 1em;
    }
    .dice {
      font-size: 2em;
      margin: 0.2em;
      padding: 0.5em;
      background: #333;
      border-radius: 10px;
      display: inline-block;
      cursor: pointer;
    }
    .disabled {
      opacity: 0.4;
      pointer-events: none;
    }
    #expressionBox {
      min-height: 1.5em;
      border: 1px solid #888;
      padding: 0.5em;
      margin-bottom: 0.5em;
      width: 300px;
      text-align: center;
      background: #222;
    }
    #evalBox {
      margin: 0.5em;
    }
    #buttonGrid button {
      margin: 0.2em;
      padding: 0.5em;
      font-size: 1em;
      background: #222;
      color: #fff;
      border: 1px solid #666;
      border-radius: 5px;
    }
    #submitBtn, #newGameBtn, #shareBtn {
      margin-top: 1em;
      padding: 0.5em 1em;
      font-size: 1em;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      background: #444;
      color: white;
    }
    #shareBtn {
      display: none;
    }
  </style>
</head>
<body>
  <h1>Qu0x! 🎲∞</h1>
  <div id="targetBox">Target: --</div>
  <div id="gameNumberDate">Seed: --</div>
  <div id="diceBox"></div>

  <div id="expressionBox" contenteditable="true" oninput="evaluate()"></div>
  <div id="evalBox">= <span id="evaluation">?</span></div>

  <div id="buttonGrid">
    <button onclick="appendOperator('+')">+</button>
    <button onclick="appendOperator('-')">-</button>
    <button onclick="appendOperator('*')">*</button>
    <button onclick="appendOperator('/')">/</button>
    <button onclick="appendOperator('(')">(</button>
    <button onclick="appendOperator(')')">)</button>
    <button onclick="clearExpression()">🗑️</button>
  </div>

  <button id="submitBtn" onclick="submit()">Submit</button>
  <button id="newGameBtn" onclick="startNewGame()">New Game</button>
  <button id="shareBtn" onclick="navigator.clipboard.writeText(shareableText)">Copy Share Link</button>

  <script>
    let diceValues = [];
    let target = 0;
    let usedDice = [];
    let shareableText = "";

    const diceBox = document.getElementById("diceBox");
    const expressionBox = document.getElementById("expressionBox");
    const evaluationBox = document.getElementById("evaluation");
    const targetBox = document.getElementById("targetBox");
    const gameNumberDate = document.getElementById("gameNumberDate");

    function mulberry32(seed) {
      return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }

    function renderDice() {
      diceBox.innerHTML = "";
      diceValues.forEach((val, i) => {
        const btn = document.createElement("button");
        btn.innerText = val;
        btn.classList.add("dice");
        if (usedDice.includes(i)) {
          btn.classList.add("disabled");
        }
        btn.onclick = () => {
          if (!usedDice.includes(i)) {
            expressionBox.innerText += val;
            usedDice.push(i);
            renderDice();
            evaluate();
          }
        };
        diceBox.appendChild(btn);
      });
    }

    function appendOperator(op) {
      expressionBox.innerText += op;
      evaluate();
    }

    function clearExpression() {
      expressionBox.innerText = "";
      evaluationBox.innerText = "?";
      usedDice = [];
      renderDice();
    }

    function evaluate() {
      const expr = expressionBox.innerText;
      try {
        const result = Function('"use strict";return (' + expr + ')')();
        evaluationBox.innerText = Math.round(result * 1000) / 1000;
      } catch {
        evaluationBox.innerText = "?";
      }
    }

    function submit() {
      const result = evaluationBox.innerText;
      if (result === "?" || usedDice.length !== 5 || !Number.isInteger(Number(result))) {
        alert("Invalid or incomplete submission.");
        return;
      }
      const score = Math.abs(Number(result) - target);
      if (score === 0) {
        animateWin();
        shareableText = `I solved Qu0x! 🎲∞ with target ${target} using [${diceValues.join(", ")}]!\nTry it: https://qu0x.com`;
        document.getElementById("shareBtn").style.display = "inline-block";
        setTimeout(() => startNewGame(), 2000);
      } else {
        alert(`Close! You’re off by ${score}. Try again.`);
      }
    }

    function animateWin() {
      const h1 = document.querySelector("h1");
      h1.animate([
        { transform: "scale(1)", color: "#fff" },
        { transform: "scale(1.3)", color: "#0f0" },
        { transform: "scale(1)", color: "#fff" }
      ], {
        duration: 800,
        iterations: 1
      });
    }

    function startNewGame() {
      const seed = Math.floor(Math.random() * 99999) + 1;
      const rand = mulberry32(seed);

      diceValues = [];
      for (let i = 0; i < 5; i++) {
        diceValues.push(Math.floor(rand() * 6) + 1);
      }

      target = Math.floor(rand() * 100) + 1;

      expressionBox.innerText = "";
      evaluationBox.innerText = "?";
      usedDice = [];

      renderDice();
      targetBox.innerText = `Target: ${target}`;
      gameNumberDate.innerText = `Seed: ${seed}`;
      document.getElementById("shareBtn").style.display = "none";
    }

    startNewGame();
  </script>
</body>
</html>
