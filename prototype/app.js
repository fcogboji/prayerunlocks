const STORAGE_KEY = "steadfast-state-v1";
const TODAY_KEY = new Date().toISOString().slice(0, 10);

const habits = [
  {
    id: "scripture",
    badge: "1",
    title: "Read Scripture",
    description: "Spend 10 focused minutes in today's passage.",
    action: "Mark read",
  },
  {
    id: "prayer",
    badge: "2",
    title: "Pray",
    description: "Name one worry and hand it to God honestly.",
    action: "Mark prayed",
  },
  {
    id: "journal",
    badge: "3",
    title: "Reflect",
    description: "Write one sentence about what stood out.",
    action: "Mark reflected",
  },
  {
    id: "nudge",
    badge: "4",
    title: "Encourage",
    description: "Send a short prayer or verse to someone.",
    action: "Mark sent",
  },
];

const coachReplies = [
  {
    match: ["john 3:16", "john"],
    text: "John 3:16 centers on God's initiating love: salvation is received by trusting Christ, not by earning closeness to Him. A simple prayer today could be, 'Lord, help me receive Your love before I try to prove myself.'",
  },
  {
    match: ["anxiety", "worry", "pressure"],
    text: "A biblical response to anxiety is not denial; it is honest surrender. Matthew 6 invites you to bring tomorrow's weight back into today's trust. Name the concern, ask for daily bread, then take the next faithful step.",
  },
  {
    match: ["discipline", "consistent", "habit"],
    text: "Discipline grows best when it is small, repeated, and attached to love. Choose a tiny daily rhythm you can keep, then treat consistency as a way of returning to God rather than impressing Him.",
  },
];

const defaultState = {
  completedByDate: {},
  streak: 0,
  lastCompleteDate: "",
  partners: [
    { name: "Maya", status: "Prayed for you this morning" },
    { name: "Jordan", status: "Waiting for today's check-in" },
  ],
  encouragements: 2,
};

let state = loadState();

const habitGrid = document.querySelector("#habitGrid");
const completedCount = document.querySelector("#completedCount");
const progressCircle = document.querySelector("#progressCircle");
const progressText = document.querySelector("#progressText");
const streakValue = document.querySelector("#streakValue");
const dateLabel = document.querySelector("#dateLabel");
const greeting = document.querySelector("#greeting");
const toast = document.querySelector("#toast");

function loadState() {
  try {
    return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayCompleted() {
  return state.completedByDate[TODAY_KEY] || [];
}

function setTodayCompleted(nextCompleted) {
  state.completedByDate[TODAY_KEY] = nextCompleted;
  updateStreak();
  saveState();
}

function updateStreak() {
  const completed = todayCompleted().length === habits.length;
  if (!completed) {
    return;
  }

  if (state.lastCompleteDate === TODAY_KEY) {
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  state.streak = state.lastCompleteDate === yesterdayKey ? state.streak + 1 : 1;
  state.lastCompleteDate = TODAY_KEY;
}

function renderDate() {
  const now = new Date();
  dateLabel.textContent = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);

  const hour = now.getHours();
  greeting.textContent = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

function renderHabits() {
  const completed = todayCompleted();

  habitGrid.innerHTML = habits
    .map((habit) => {
      const done = completed.includes(habit.id);
      return `
        <article class="habit-card ${done ? "done" : ""}">
          <span class="badge">${habit.badge}</span>
          <div>
            <h3>${habit.title}</h3>
            <p>${habit.description}</p>
          </div>
          <button type="button" data-habit="${habit.id}">${done ? "Done" : habit.action}</button>
        </article>
      `;
    })
    .join("");
}

function renderProgress() {
  const count = todayCompleted().length;
  const percent = Math.round((count / habits.length) * 100);
  const circumference = 326.7;

  completedCount.textContent = count;
  progressText.textContent = `${percent}%`;
  progressCircle.style.strokeDashoffset = circumference - (circumference * percent) / 100;
  streakValue.textContent = state.streak;
}

function renderPartners() {
  const partnerList = document.querySelector("#partnerList");
  partnerList.innerHTML = state.partners
    .map(
      (partner, index) => `
        <article class="partner-card">
          <div>
            <h3>${escapeHtml(partner.name)}</h3>
            <p>${escapeHtml(partner.status)}</p>
          </div>
          <button type="button" data-nudge="${index}">Nudge</button>
        </article>
      `,
    )
    .join("");
}

function renderInsights() {
  const weekKeys = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - index);
    return day.toISOString().slice(0, 10);
  }).reverse();

  const totalDone = weekKeys.reduce((sum, key) => sum + (state.completedByDate[key]?.length || 0), 0);
  const maxDone = weekKeys.length * habits.length;
  const consistency = Math.round((totalDone / maxDone) * 100);
  const prayerDays = weekKeys.filter((key) => state.completedByDate[key]?.includes("prayer")).length;

  document.querySelector("#weekScore").textContent = `${consistency}%`;
  document.querySelector("#prayerCount").textContent = prayerDays;
  document.querySelector("#nudgeCount").textContent = state.encouragements;

  document.querySelector("#timeline").innerHTML = weekKeys
    .map((key) => {
      const date = new Date(`${key}T12:00:00`);
      const label = new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(date);
      const completed = state.completedByDate[key] || [];
      return `
        <div class="timeline-row">
          <span>${label}</span>
          <div class="timeline-dots" aria-label="${label} completion">
            ${habits.map((habit) => `<i class="dot ${completed.includes(habit.id) ? "on" : ""}"></i>`).join("")}
          </div>
        </div>
      `;
    })
    .join("");
}

function renderCoachGreeting() {
  addMessage("coach", "Hi, I am here for Scripture reflection, prayer prompts, and gentle accountability. What would help you walk faithfully today?");
}

function addMessage(type, text) {
  const chatWindow = document.querySelector("#chatWindow");
  const message = document.createElement("div");
  message.className = `message ${type}`;
  message.innerHTML = `<strong>${type === "user" ? "You" : "Coach"}</strong>${escapeHtml(text)}`;
  chatWindow.append(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function getCoachReply(prompt) {
  const normalized = prompt.toLowerCase();
  const found = coachReplies.find((reply) => reply.match.some((word) => normalized.includes(word)));
  return (
    found?.text ||
    "That is worth bringing to God slowly. Start by naming what is true, asking what love requires next, and choosing one faithful action you can take today."
  );
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[character];
  });
}

function renderAll() {
  renderDate();
  renderHabits();
  renderProgress();
  renderPartners();
  renderInsights();
}

document.querySelectorAll(".nav-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".nav-tab").forEach((item) => item.classList.toggle("active", item === tab));
    document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === tab.dataset.view));
  });
});

habitGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-habit]");
  if (!button) {
    return;
  }

  const completed = new Set(todayCompleted());
  const habitId = button.dataset.habit;
  completed.has(habitId) ? completed.delete(habitId) : completed.add(habitId);
  setTodayCompleted([...completed]);
  renderAll();
});

document.querySelector("#resetToday").addEventListener("click", () => {
  state.completedByDate[TODAY_KEY] = [];
  saveState();
  renderAll();
  showToast("Today has been reset.");
});

document.querySelector("#coachForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#coachInput");
  const prompt = input.value.trim();
  if (!prompt) {
    return;
  }

  addMessage("user", prompt);
  input.value = "";
  window.setTimeout(() => addMessage("coach", getCoachReply(prompt)), 320);
});

document.querySelector("#promptRow").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  document.querySelector("#coachInput").value = button.textContent;
  document.querySelector("#coachForm").requestSubmit();
});

document.querySelector("#partnerForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#partnerName");
  const name = input.value.trim();
  if (!name) {
    return;
  }

  state.partners.push({ name, status: "Ready for a weekly check-in" });
  input.value = "";
  saveState();
  renderPartners();
  showToast(`${name} added as a partner.`);
});

document.querySelector("#partnerList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-nudge]");
  if (!button) {
    return;
  }

  const partner = state.partners[Number(button.dataset.nudge)];
  state.encouragements += 1;
  saveState();
  renderInsights();
  showToast(`Encouragement sent to ${partner.name}.`);
});

document.querySelector("#inviteBtn").addEventListener("click", () => {
  showToast("Invite link copied.");
});

document.querySelector("#upgradeBtn").addEventListener("click", () => {
  showToast("Premium checkout would open here.");
});

renderAll();
renderCoachGreeting();
