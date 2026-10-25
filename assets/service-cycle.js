(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var cycles = [];
  document.querySelectorAll(".service-cycle").forEach(function (root) {
    var lines = root.querySelectorAll(".service-cycle-line");
    if (lines.length > 1) cycles.push(lines);
  });
  if (!cycles.length) return;
  var index = 0;
  var started = false;
  function show(next) {
    cycles.forEach(function (lines) {
      var count = lines.length;
      var prev = (next - 1 + count) % count;
      lines.forEach(function (line, n) {
        line.classList.toggle("is-on", n === next);
        line.classList.toggle("is-leave", started && n === prev);
      });
    });
    started = true;
  }
  show(0);
  window.setInterval(function () {
    index = (index + 1) % cycles[0].length;
    show(index);
  }, 2800);
})();
