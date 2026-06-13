const tileGroups = {
  "【 萬子 】": ["一萬", "二萬", "三萬", "四萬", "五萬", "六萬", "七萬", "八萬", "九萬"],
  "【 筒子 】": ["一筒", "二筒", "三筒", "四筒", "五筒", "六筒", "七筒", "八筒", "九筒"],
  "【 索子 】": ["一索", "二索", "三索", "四索", "五索", "六索", "七索", "八索", "九索"],
  "【 字牌 】": ["東", "南", "西", "北", "白", "發", "中"],
};

const STORAGE_KEY = "mahjong-map-visible-tiles-v1";

const tileCounts = {};
const actionHistory = [];
const tileElements = {};

const tileArea = document.getElementById("tileArea");
const undoBtn = document.getElementById("undoBtn");
const resetAllBtn = document.getElementById("resetAllBtn");

function initializeCounts() {
  Object.values(tileGroups).flat().forEach((tileName) => {
    tileCounts[tileName] = 0;
  });
}

function saveState() {
  const data = {
    tileCounts,
    actionHistory,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);

    if (data.tileCounts) {
      Object.keys(tileCounts).forEach((tileName) => {
        const value = Number(data.tileCounts[tileName] ?? 0);
        tileCounts[tileName] = Math.min(4, Math.max(0, value));
      });
    }

    if (Array.isArray(data.actionHistory)) {
      actionHistory.splice(0, actionHistory.length, ...data.actionHistory);
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function createTileArea() {
  Object.entries(tileGroups).forEach(([groupName, tiles]) => {
    const group = document.createElement("section");
    group.className = "tile-group";

    const title = document.createElement("h2");
    title.className = "tile-group-title";
    title.textContent = groupName;
    group.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "tile-grid";

    tiles.forEach((tileName) => {
      const card = document.createElement("div");
      card.className = "tile-card";

      const mainButton = document.createElement("button");
      mainButton.className = "tile-main-button";
      mainButton.textContent = tileName;
      mainButton.addEventListener("click", () => addTile(tileName));

      const info = document.createElement("div");
      info.className = "tile-info";

      const miniActions = document.createElement("div");
      miniActions.className = "tile-mini-actions";

      const minusButton = document.createElement("button");
      minusButton.textContent = "−1";
      minusButton.addEventListener("click", () => removeOneTile(tileName));

      const resetButton = document.createElement("button");
      resetButton.textContent = "リセット";
      resetButton.addEventListener("click", () => resetOneTile(tileName));

      miniActions.append(minusButton, resetButton);
      card.append(mainButton, info, miniActions);
      grid.appendChild(card);

      tileElements[tileName] = {
        card,
        mainButton,
        info,
        minusButton,
        resetButton,
      };
    });

    for (let i = tiles.length; i < 9; i += 1) {
      const placeholder = document.createElement("div");
      placeholder.className = "tile-placeholder";
      grid.appendChild(placeholder);
    }

    group.appendChild(grid);
    tileArea.appendChild(group);
  });
}

function addTile(tileName) {
  if (tileCounts[tileName] >= 4) return;

  tileCounts[tileName] += 1;
  actionHistory.push({ type: "add", tileName });
  updateTile(tileName);
  saveState();
}

function removeOneTile(tileName) {
  if (tileCounts[tileName] <= 0) return;

  tileCounts[tileName] -= 1;
  actionHistory.push({ type: "remove", tileName });
  updateTile(tileName);
  saveState();
}

function resetOneTile(tileName) {
  const previousCount = tileCounts[tileName];
  if (previousCount === 0) return;

  tileCounts[tileName] = 0;
  actionHistory.push({ type: "resetOne", tileName, previousCount });
  updateTile(tileName);
  saveState();
}

function undoLastAction() {
  const lastAction = actionHistory.pop();
  if (!lastAction) return;

  const { type, tileName } = lastAction;

  if (type === "add") {
    tileCounts[tileName] = Math.max(0, tileCounts[tileName] - 1);
  } else if (type === "remove") {
    tileCounts[tileName] = Math.min(4, tileCounts[tileName] + 1);
  } else if (type === "resetOne") {
    tileCounts[tileName] = Math.min(4, Math.max(0, lastAction.previousCount));
  }

  updateTile(tileName);
  saveState();
}

function resetAllTiles() {
  const ok = confirm("すべての記録を消去して、初期状態に戻しますか？");
  if (!ok) return;

  Object.keys(tileCounts).forEach((tileName) => {
    tileCounts[tileName] = 0;
    updateTile(tileName);
  });
  actionHistory.length = 0;
  saveState();
}

function updateTile(tileName) {
  const count = tileCounts[tileName];
  const remaining = 4 - count;
  const elements = tileElements[tileName];

  elements.card.className = `tile-card count-${count}`;
  elements.info.textContent = count === 0 ? "[残:4]\n　" : `[残:${remaining}]\n出:${count}`;

  elements.mainButton.disabled = count >= 4;
  elements.minusButton.disabled = count <= 0;
  elements.resetButton.disabled = count <= 0;
}

function updateAllTiles() {
  Object.keys(tileCounts).forEach(updateTile);
}

undoBtn.addEventListener("click", undoLastAction);
resetAllBtn.addEventListener("click", resetAllTiles);

initializeCounts();
createTileArea();
loadState();
updateAllTiles();
