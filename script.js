(function () {
  var canvas = document.getElementById("canvas");
  var wrap = document.getElementById("canvasWrap");
  var ctx = canvas.getContext("2d");
  var drawing = false;
  var color = "#000000";
  var width = 5;

  function setupCanvas() {
    var oldImage = null;
    if (canvas.width > 0 && canvas.height > 0) {
      try { oldImage = canvas.toDataURL("image/png"); } catch (e) {}
    }
    var w = wrap.clientWidth - 4;
    var h = window.innerHeight - 155;
    if (h < 300) { h = 300; }
    if (h > 700) { h = 700; }
    canvas.width = w;
    canvas.height = h;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    fillWhite();
    if (oldImage) {
      var img = new Image();
      img.onload = function () { ctx.drawImage(img, 0, 0, w, h); };
      img.src = oldImage;
    }
  }

  function fillWhite() {
    ctx.save(); ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.restore();
  }
  function position(e) {
    var rect = canvas.getBoundingClientRect();
    var p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - rect.left, y: p.clientY - rect.top };
  }
  function start(e) {
    if (e.preventDefault) { e.preventDefault(); }
    drawing = true; var p = position(e);
    ctx.beginPath(); ctx.moveTo(p.x, p.y);
  }
  function move(e) {
    if (!drawing) { return; }
    if (e.preventDefault) { e.preventDefault(); }
    var p = position(e);
    ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.lineTo(p.x, p.y); ctx.stroke();
  }
  function stop(e) {
    if (e && e.preventDefault) { e.preventDefault(); }
    drawing = false;
  }

  canvas.addEventListener("mousedown", start, false);
  canvas.addEventListener("mousemove", move, false);
  canvas.addEventListener("mouseup", stop, false);
  canvas.addEventListener("mouseleave", stop, false);
  canvas.addEventListener("touchstart", start, false);
  canvas.addEventListener("touchmove", move, false);
  canvas.addEventListener("touchend", stop, false);

  var buttons = document.getElementsByClassName("color");
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].onclick = function () {
      color = this.getAttribute("data-color");
      for (var j = 0; j < buttons.length; j++) { buttons[j].className = "color"; }
      this.className = "color active";
    };
  }
  document.getElementById("lineWidth").onchange = function () { width = parseInt(this.value, 10); };
  document.getElementById("eraser").onclick = function () { color = "#ffffff"; };
  document.getElementById("clear").onclick = function () {
    if (window.confirm("絵を全部消しますか？")) { fillWhite(); }
  };
  document.getElementById("save").onclick = function () {
    var image = canvas.toDataURL("image/png");
    var newWindow = window.open();
    if (newWindow) {
      newWindow.document.write('<title>保存用画像</title><img src="' + image + '">');
      newWindow.document.close();
    } else { alert("ポップアップを許可してください。"); }
  };
  setupCanvas();
})();
