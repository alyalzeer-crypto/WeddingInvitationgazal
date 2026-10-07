const invitation = document.getElementById("invitation");
const invitationMusic = document.getElementById("invitationMusic");
const musicToggle = document.getElementById("musicToggle");
const scenes = [
  document.getElementById("firstScene"),
  document.getElementById("secondScene"),
  document.getElementById("thirdScene")
];
const openCurtain = document.getElementById("openCurtain");
const nextScene = document.getElementById("nextScene");
const backScene = document.getElementById("backScene");
const showEvent = document.getElementById("showEvent");
const backToInvitation = document.getElementById("backToInvitation");
const showLocation = document.getElementById("showLocation");
const backToDate = document.getElementById("backToDate");
const dateView = document.getElementById("dateView");
const locationView = document.getElementById("locationView");
const config = window.INVITATION_CONFIG || {};
const mapLink = document.getElementById("mapLink");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

let opening = false;
let changing = false;
let currentScene = 0;
let locationOpen = false;
let ready = false;
let wantsMusic = false;

function updateMusicButton() {
  const playing = !invitationMusic.paused;
  const label = playing ? "إيقاف الموسيقى" : "تشغيل الموسيقى";
  musicToggle.setAttribute("aria-label", label);
  musicToggle.setAttribute("aria-pressed", String(playing));
  musicToggle.title = label;
  musicToggle.classList.toggle("is-playing", playing);
}

async function setMusicPlaying(shouldPlay) {
  wantsMusic = shouldPlay;
  if (!shouldPlay) {
    invitationMusic.pause();
    updateMusicButton();
    return;
  }
  try {
    invitationMusic.volume = 0.38;
    await invitationMusic.play();
    if (!wantsMusic) invitationMusic.pause();
  } catch {
    wantsMusic = false;
    invitationMusic.pause();
  }
  updateMusicButton();
}

function updateButtons() {
  nextScene.disabled = changing || !ready || currentScene !== 0;
  backScene.disabled = changing || currentScene !== 1;
  showEvent.disabled = changing || currentScene !== 1;
  backToInvitation.disabled = changing || currentScene !== 2 || locationOpen;
  showLocation.disabled = changing || currentScene !== 2 || locationOpen;
  backToDate.disabled = changing || currentScene !== 2 || !locationOpen;
}

async function revealInvitation() {
  if (opening) return;
  opening = true;
  openCurtain.disabled = true;
  // استدعاء play داخل نقرة الزائر يسمح بالتشغيل في المتصفحات التي تمنع التشغيل التلقائي.
  void setMusicPlaying(true);
  invitation.classList.add("is-opening");

  await delay(reduceMotion ? 0 : 2600);
  invitation.classList.add("is-butterfly-landed");
  await delay(reduceMotion ? 0 : 250);
  invitation.classList.add("is-curtain-open", "is-open");
  await delay(reduceMotion ? 0 : 1050);
  ready = true;
  invitation.classList.add("is-ready");
  updateButtons();
}

async function goToScene(target) {
  if (changing || !ready || target === currentScene || target < 0 || target >= scenes.length) return;
  changing = true;
  updateButtons();
  invitation.classList.add("is-scene-changing");

  await delay(reduceMotion ? 0 : 280);
  currentScene = target;
  if (target < 2) {
    locationOpen = false;
    dateView.setAttribute("aria-hidden", "false");
    locationView.setAttribute("aria-hidden", "true");
  }
  invitation.classList.toggle("show-second", target >= 1);
  invitation.classList.toggle("show-event", target === 2);
  scenes.forEach((scene, index) => {
    scene.setAttribute("aria-hidden", String(index !== target));
    scene.inert = index !== target;
    if (index === target) scene.scrollTop = 0;
  });

  await delay(reduceMotion ? 0 : 520);
  invitation.classList.remove("is-scene-changing");
  await delay(reduceMotion ? 0 : 620);
  changing = false;
  updateButtons();
  [nextScene, showEvent, locationOpen ? backToDate : showLocation][target].focus();
}

async function changeEventView(openLocation) {
  if (changing || currentScene !== 2 || locationOpen === openLocation) return;
  changing = true;
  updateButtons();
  invitation.classList.add("is-location-changing");
  await delay(reduceMotion ? 0 : 230);

  locationOpen = openLocation;
  dateView.setAttribute("aria-hidden", String(openLocation));
  locationView.setAttribute("aria-hidden", String(!openLocation));
  invitation.classList.remove("is-location-changing");
  await delay(reduceMotion ? 0 : 430);

  changing = false;
  updateButtons();
  (openLocation ? backToDate : showLocation).focus();
}

openCurtain.addEventListener("click", revealInvitation);
musicToggle.addEventListener("click", () => {
  void setMusicPlaying(invitationMusic.paused);
});
invitationMusic.addEventListener("ended", updateMusicButton);
invitationMusic.addEventListener("error", () => {
  wantsMusic = false;
  updateMusicButton();
  musicToggle.title = "تعذّر تشغيل الموسيقى";
});
nextScene.addEventListener("click", () => goToScene(1));
backScene.addEventListener("click", () => goToScene(0));
showEvent.addEventListener("click", () => goToScene(2));
backToInvitation.addEventListener("click", () => goToScene(1));
showLocation.addEventListener("click", () => changeEventView(true));
backToDate.addEventListener("click", () => changeEventView(false));
if (/^https:\/\/(maps\.app\.goo\.gl|goo\.gl|(?:www\.)?google\.[a-z.]+)\//i.test(config.mapsUrl || "")) {
  mapLink.href = config.mapsUrl;
  mapLink.hidden = false;
}
scenes.forEach((scene, index) => { scene.inert = index !== 0; });
updateButtons();
