// MyPaint iOS 9.3.5 完全対応版

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

// iOS 9.3.5 用の座標取得
function getPos(e) {
    const rect = canvas.getBoundingClientRect();

    // タッチイベント（iOS 9.3.5）
    if (e.touches && e.touches.length > 0) {
        return {
            x: e.touches[0].pageX - rect.left,
            y: e.touches[0].pageY - rect.top
        };
    }

    // マウスイベント
    return {
        x: e.pageX - rect.left,
        y: e.pageY - rect.top
    };
}

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

function eraseAt(x, y) {
    ctx.clearRect(x - eraserSize / 2, y - eraserSize / 2, eraserSize, eraserSize);
}

function saveHistory() {
    history.push(canvas.toDataURL());
    redoStack = [];
}

/* -------------------------
   マウスイベント
------------------------- */
canvas.addEventListener("mousedown", (e) => {
    const pos = getPos(e);
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

canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;

    const pos = getPos(e);

    if (erasing) {
        eraseAt(pos.x, pos.y);
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
});

/* -------------------------
   タッチイベント（iOS 9.3.5）
------------------------- */
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const pos = getPos(e);

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
    if (!drawing) return;

    const pos = getPos(e);

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
   色変更
------------------------- */
function updateCurrentColorBox() {
    document.getElementById("currentColor").style.background = currentColor;
}

document.querySelectorAll(".color").forEach(btn => {
    btn.addEventListener("click", () => {
        currentColor = btn.dataset.color;
        erasing = false;
        updateCurrentColorBox();
    });
});

document.getElementById("colorPicker").addEventListener("input", (e) => {
    currentColor = e.target.value;
    erasing = false;
    updateCurrentColorBox();
});

/* -------------------------
   ペン・消しゴム
------------------------- */
document.querySelectorAll(".penSize").forEach(btn => {
    btn.addEventListener("click", () => {
        penSize = Number(btn.dataset.size);
        erasing = false;
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

function restoreFromDataURL(dataURL) {
    const img = new Image();
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
    img.src = dataURL;
}

document.getElementById("clear").addEventListener("click", () => {
    saveHistory();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});
