// MyPaint PC + iPad 対応版 script.js

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const eraserCursor = document.getElementById("eraserCursor");

let drawing = false;
let erasing = false;
let penSize = 5;
let eraserSize = 20;
let currentColor = "#000000";

let lastX = null;
let lastY = null;

let history = [];
let redoStack = [];

// 履歴保存
function saveHistory() {
    history.push(canvas.toDataURL());
    redoStack = [];
}

// 履歴復元
function restoreFromDataURL(dataURL) {
    const img = new Image();
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
    img.src = dataURL;
}

// 座標取得（マウス・タッチ共通）
function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

// ペンの線
function drawLine(x1, y1, x2, y2) {
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = penSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

// 消しゴム
function eraseAt(x, y) {
    ctx.clearRect(x - eraserSize / 2, y - eraserSize / 2, eraserSize, eraserSize);
}

// 消しゴムカーソル
function updateEraserCursorFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - eraserSize / 2;
    const y = e.clientY - rect.top - eraserSize / 2;

    eraserCursor.style.width = eraserSize + "px";
    eraserCursor.style.height = eraserSize + "px";
    eraserCursor.style.left = x + "px";
    eraserCursor.style.top = y + "px";
    eraserCursor.style.display = "block";
}

/* -------------------------
   マウスイベント（PC用）
------------------------- */
canvas.addEventListener("mousedown", (e) => {
    const pos = getPos(e);
    drawing = true;
    saveHistory();
    lastX = pos.x;
    lastY = pos.y;

    if (erasing) {
        eraseAt(pos.x, pos.y);
        updateEraserCursorFromEvent(e);
    } else {
        drawLine(pos.x, pos.y, pos.x, pos.y);
    }
});

canvas.addEventListener("mousemove", (e) => {
    const pos = getPos(e);

    if (!drawing) {
        if (erasing) updateEraserCursorFromEvent(e);
        return;
    }

    if (erasing) {
        eraseAt(pos.x, pos.y);
        updateEraserCursorFromEvent(e);
    } else {
        drawLine(lastX, lastY, pos.x, pos.y);
        lastX = pos.x;
        lastY = pos.y;
    }
});

canvas.addEventListener("mouseup", () => {
    drawing = false;
    lastX = null;
    lastY = null;
    eraserCursor.style.display = "none";
});

canvas.addEventListener("mouseleave", () => {
    drawing = false;
    lastX = null;
    lastY = null;
    eraserCursor.style.display = "none";
});

/* -------------------------
   タッチイベント（iPad用）
------------------------- */
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const pos = getPos(touch);

    drawing = true;
    saveHistory();
    lastX = pos.x;
    lastY = pos.y;

    if (erasing) {
        eraseAt(pos.x, pos.y);
    } else {
        drawLine(pos.x, pos.y, pos.x, pos.y);
    }
});

canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const pos = getPos(touch);

    if (!drawing) return;

    if (erasing) {
        eraseAt(pos.x, pos.y);
    } else {
        drawLine(lastX, lastY, pos.x, pos.y);
        lastX = pos.x;
        lastY = pos.y;
    }
});

canvas.addEventListener("touchend", () => {
    drawing = false;
    lastX = null;
    lastY = null;
});

/* -------------------------
   色変更（Safariでも四角表示）
------------------------- */
function updateCurrentColorBox() {
    document.getElementById("currentColor").style.background = currentColor;
}

document.querySelectorAll(".color").forEach(btn => {
    btn.addEventListener("click", () => {
        currentColor = btn.dataset.color;
        erasing = false;
        eraserCursor.style.display = "none";
        updateCurrentColorBox();
    });
});

// 自由色
document.getElementById("colorPicker").addEventListener("input", (e) => {
    currentColor = e.target.value;
    erasing = false;
    eraserCursor.style.display = "none";
    updateCurrentColorBox();
});

/* -------------------------
   ペン・消しゴム
------------------------- */
document.querySelectorAll(".penSize").forEach(btn => {
    btn.addEventListener("click", () => {
        penSize = Number(btn.dataset.size);
        erasing = false;
        eraserCursor.style.display = "none";
    });
});

document.querySelectorAll(".eraserSize").forEach(btn => {
    btn.addEventListener("click", () => {
        eraserSize = Number(btn.dataset.size);
        erasing = true;
    });
});

document.getElementById("penMode").addEventListener("click", () => {
    erasing = false;
    eraserCursor.style.display = "none";
});

document.getElementById("eraserMode").addEventListener("click", () => {
    erasing = true;
});

/* -------------------------
   Undo / Redo / 保存など
------------------------- */
document.getElementById("undo").addEventListener("click", () => {
    if (history.length === 0) return;
    redoStack.push(canvas.toDataURL());
    restoreFromDataURL(history.pop());
});

document.getElementById("redo").addEventListener("click", () => {
    if (redoStack.length === 0) return;
    history.push(canvas.toDataURL());
    restoreFromDataURL(redoStack.pop());
});

document.getElementById("clear").addEventListener("click", () => {
    saveHistory();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

document.getElementById("png").addEventListener("click", () => {
    const url = canvas.toDataURL("image/png");
    window.open(url, "_blank");
});

document.getElementById("saveWork").addEventListener("click", () => {
    const name = prompt("作品名を入力してください");
    if (!name) return;
    localStorage.setItem("mypaint_" + name, canvas.toDataURL());
    updateWorkList();
});

function updateWorkList() {
    const list = document.getElementById("workList");
    list.innerHTML = "<option value=''>保存作品を選択</option>";

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("mypaint_")) {
            const name = key.replace("mypaint_", "");
            const option = document.createElement("option");
            option.value = key;
            option.textContent = name;
            list.appendChild(option);
        }
    }
}
updateWorkList();

document.getElementById("loadWork").addEventListener("click", () => {
    const key = document.getElementById("workList").value;
    if (!key) return;
    restoreFromDataURL(localStorage.getItem(key));
});

document.getElementById("deleteWork").addEventListener("click", () => {
    const key = document.getElementById("workList").value;
    if (!key) return;
    localStorage.removeItem(key);
    updateWorkList();
});
