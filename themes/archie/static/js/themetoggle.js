function setTheme(mode) {
  localStorage.setItem("theme-storage", mode);

  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(mode);

  var e = document.querySelector("#dark-mode-toggle > .feather > use");
  const styleLink = document.getElementById("darkModeStyle");

  if (mode === "dark") {
    styleLink.disabled = false;
    styleLink.media = "all";
    e.href.baseVal = e.href.baseVal.replace(/#.*$/, "#sun");
  } else if (mode === "light") {
    styleLink.disabled = true;
    styleLink.media = "not all";
    e.href.baseVal = e.href.baseVal.replace(/#.*$/, "#moon");
  }
}

function toggleTheme() {
  if (localStorage.getItem("theme-storage") === "light") {
    setTheme("dark");
  } else if (localStorage.getItem("theme-storage") === "dark") {
    setTheme("light");
  }
}

var savedTheme =
  localStorage.getItem("theme-storage") ||
  (window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light");
setTheme(savedTheme);
