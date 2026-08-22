(function () {
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  var cursor = document.getElementById("eraserCursor");
  var drawing = false;
  var mode = "pen";
  var penColor = "#000000";
  var penSize = 2;
  var eraserSize = 20;
  var undoStack = [];
  var redoStack = [];
  var MAX_UNDO = 10;
  var MAX_WORKS = 10;

  function fillWhite() {
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
  function currentImage() {
    return canvas.toDataURL("image/png");
  }
  function pushLimited(stack, data) {
    stack.push(data);
    if (stack.length > MAX_UNDO) { stack.shift(); }
  }
  function snapshot() {
    try {
      pushLimited(undoStack, currentImage());
      redoStack = [];
    } catch (e) {}
  }
  function restoreData(data, after) {
    var img = new Image();
    img.onload = function () {
      fillWhite();
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      if (after) { after(); }
    };
    img.src = data;
  }
  function saveAuto() {
    try { localStorage.setItem("MyPaintAutoSave", canvas.toDataURL("image/png")); }
    catch (e) { setMessage("自動保存できません。保存領域が不足している可能性があります。"); }
  }
  function loadAuto() {
    var data = null;
    try { data = localStorage.getItem("MyPaintAutoSave"); } catch (e) {}
    if (data) { restoreData(data); } else { fillWhite(); }
  }
  function point(e) {
    var rect = canvas.getBoundingClientRect();
    var p = e.touches && e.touches.length ? e.touches[0] : e;
    return {
      x:(p.clientX - rect.left) * canvas.width / rect.width,
      y:(p.clientY - rect.top) * canvas.height / rect.height,
      cssX:p.clientX - rect.left,
      cssY:p.clientY - rect.top
    };
  }
  function start(e) {
    if (e.preventDefault) { e.preventDefault(); }
    snapshot();
    drawing = true;
    var p = point(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    showCursor(p);
  }
  function move(e) {
    if (e.preventDefault) { e.preventDefault(); }
    var p = point(e);
    showCursor(p);
    if (!drawing) { return; }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = mode === "eraser" ? "#ffffff" : penColor;
    ctx.lineWidth = mode === "eraser" ? eraserSize : penSize;
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
  function stop(e) {
    if (e && e.preventDefault) { e.preventDefault(); }
    if (drawing) { drawing = false; saveAuto(); }
  }
  function showCursor(p) {
    if (mode !== "eraser") { cursor.style.display = "none"; return; }
    var rect = canvas.getBoundingClientRect();
    var cssSize = eraserSize * rect.width / canvas.width;
    cursor.style.display = "block";
    cursor.style.width = cssSize + "px";
    cursor.style.height = cssSize + "px";
    cursor.style.left = (p.cssX - cssSize / 2) + "px";
    cursor.style.top = (p.cssY - cssSize / 2) + "px";
  }
  function hideCursor() { cursor.style.display = "none"; }
  function setMessage(text) { document.getElementById("message").innerHTML = text; }
  function selectOnly(items, selected) {
    var i;
    for (i = 0; i < items.length; i++) { items[i].className = items[i].className.replace(" active", ""); }
    if (selected.className.indexOf(" active") < 0) { selected.className += " active"; }
  }
  function getWorks() {
    try { return JSON.parse(localStorage.getItem("MyPaintWorks") || "[]"); }
    catch (e) { return []; }
  }
  function setWorks(works) {
    localStorage.setItem("MyPaintWorks", JSON.stringify(works));
  }
  function refreshWorks() {
    var list = document.getElementById("workList");
    var works = getWorks();
    var i, option;
    list.innerHTML = '<option value="">保存作品を選択</option>';
    for (i = works.length - 1; i >= 0; i--) {
      option = document.createElement("option");
      option.value = i;
      option.appendChild(document.createTextNode(works[i].name));
      list.appendChild(option);
    }
  }

  canvas.addEventListener("mousedown", start, false);
  canvas.addEventListener("mousemove", move, false);
  canvas.addEventListener("mouseup", stop, false);
  canvas.addEventListener("mouseleave", function (e) { stop(e); hideCursor(); }, false);
  canvas.addEventListener("touchstart", start, false);
  canvas.addEventListener("touchmove", move, false);
  canvas.addEventListener("touchend", stop, false);

  var colors = document.getElementsByClassName("color");
  var i;
  for (i = 0; i < colors.length; i++) {
    colors[i].onclick = function () {
      penColor = this.getAttribute("data-color");
      mode = "pen";
      document.getElementById("currentColor").style.background = penColor;
      selectOnly(colors, this);
      hideCursor();
      setMessage("ペンモードです。");
    };
  }
  document.getElementById("colorPicker").onchange = function () {
    penColor = this.value; mode = "pen";
    document.getElementById("currentColor").style.background = penColor;
    hideCursor();
  };

  var pens = document.getElementsByClassName("penSize");
  for (i = 0; i < pens.length; i++) {
    pens[i].onclick = function () { penSize = parseInt(this.getAttribute("data-size"), 10); mode = "pen"; selectOnly(pens, this); hideCursor(); };
  }
  var erasers = document.getElementsByClassName("eraserSize");
  for (i = 0; i < erasers.length; i++) {
    erasers[i].onclick = function () { eraserSize = parseInt(this.getAttribute("data-size"), 10); mode = "eraser"; selectOnly(erasers, this); setMessage("消しゴムモードです。赤い円が消去範囲です。"); };
  }
  document.getElementById("penMode").onclick = function () { mode = "pen"; hideCursor(); setMessage("ペンモードです。"); };
  document.getElementById("eraserMode").onclick = function () { mode = "eraser"; setMessage("消しゴムモードです。赤い円が消去範囲です。"); };

  document.getElementById("undo").onclick = function () {
    if (!undoStack.length) { alert("元に戻せる操作がありません。"); return; }
    try { pushLimited(redoStack, currentImage()); } catch (e) {}
    restoreData(undoStack.pop(), saveAuto);
  };
  document.getElementById("redo").onclick = function () {
    if (!redoStack.length) { alert("前に進める操作がありません。"); return; }
    try { pushLimited(undoStack, currentImage()); } catch (e) {}
    restoreData(redoStack.pop(), saveAuto);
  };
  document.getElementById("clear").onclick = function () {
    if (window.confirm("絵を全部消しますか？")) { snapshot(); fillWhite(); saveAuto(); }
  };
  document.getElementById("png").onclick = function () {
    var data = canvas.toDataURL("image/png");
    var w = window.open("", "MyPaintPNG");
    if (w) { w.document.write('<meta name="viewport" content="width=device-width"><p>画像を長押しして保存してください。</p><img style="max-width:100%" src="' + data + '">'); w.document.close(); }
    else { alert("ポップアップを許可してください。"); }
  };
  document.getElementById("saveWork").onclick = function () {
    var works = getWorks();
    var now = new Date();
    var name = "作品 " + (now.getMonth()+1) + "/" + now.getDate() + " " + now.getHours() + ":" + (now.getMinutes()<10?"0":"") + now.getMinutes();
    works.push({name:name, data:canvas.toDataURL("image/png")});
    if (works.length > MAX_WORKS) { works.shift(); }
    try { setWorks(works); refreshWorks(); alert("作品を保存しました。"); }
    catch (e) { alert("保存領域が不足しています。古い作品を削除してください。"); }
  };
  document.getElementById("loadWork").onclick = function () {
    var index = document.getElementById("workList").value;
    var works = getWorks();
    if (index === "" || !works[index]) { alert("作品を選択してください。"); return; }
    snapshot(); restoreData(works[index].data, saveAuto);
  };
  document.getElementById("deleteWork").onclick = function () {
    var index = document.getElementById("workList").value;
    var works = getWorks();
    if (index === "" || !works[index]) { alert("削除する作品を選択してください。"); return; }
    if (window.confirm("選択した作品を削除しますか？")) { works.splice(parseInt(index,10),1); setWorks(works); refreshWorks(); }
  };

  loadAuto();
  refreshWorks();
  document.getElementById("currentColor").style.background = penColor;
})();
