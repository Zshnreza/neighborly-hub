const STORAGE_KEY = "neighborly-hub-posts-v2";

const seedPosts = [
  {
    id: crypto.randomUUID(),
    category: "alert",
    title: "Street light out near Gate 3",
    body: "The corner by Gate 3 is dark after 8 PM. I filed a municipal ticket and added photos. Please use the inner lane until it is fixed.",
    author: "Priya S.",
    initials: "PS",
    distance: 0.2,
    time: "12 min ago",
    replies: 8,
    thanks: 21,
    tags: ["Safety", "Civic issue"],
  },
  {
    id: crypto.randomUUID(),
    category: "help",
    title: "Can anyone lend a drill for 20 minutes?",
    body: "Need to mount two shelves this evening. Happy to pick up and return before dinner.",
    author: "Arjun M.",
    initials: "AM",
    distance: 0.4,
    time: "34 min ago",
    replies: 5,
    thanks: 9,
    tags: ["Tools", "Quick help"],
  },
  {
    id: crypto.randomUUID(),
    category: "market",
    title: "Giving away kids study table",
    body: "Solid wood, light scratches, free pickup from Tower B lobby. Best for ages 6 to 10.",
    author: "Meera K.",
    initials: "MK",
    distance: 0.7,
    time: "1 hr ago",
    replies: 13,
    thanks: 17,
    tags: ["Free", "Furniture"],
  },
  {
    id: crypto.randomUUID(),
    category: "event",
    title: "Sunday terrace plant swap",
    body: "Bring cuttings, extra pots, or gardening tips. We will set up labels and a small watering station.",
    author: "Nikhil R.",
    initials: "NR",
    distance: 1.1,
    time: "2 hrs ago",
    replies: 11,
    thanks: 26,
    tags: ["Event", "Gardening"],
  },
];

let posts = loadPosts();
let activeFilter = "all";
let searchTerm = "";
let lastAiSuggestion = null;

const feedList = document.querySelector("#feedList");
const searchInput = document.querySelector("#searchInput");
const sortSelect = document.querySelector("#sortSelect");
const composer = document.querySelector("#composer");
const toast = document.querySelector("#toast");

function loadPosts() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return seedPosts;
  try {
    return JSON.parse(saved);
  } catch {
    return seedPosts;
  }
}

function savePosts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function icon(name) {
  const icons = {
    reply: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 17 4 12l5-5"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>',
    thanks: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11v10H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3Z"/><path d="M7 11l3-7a3 3 0 0 1 3 3v4h5.3a2 2 0 0 1 2 2.3l-1 6A2 2 0 0 1 17.3 21H7"/></svg>',
    save: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21 12 17 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z"/></svg>',
  };
  return icons[name];
}

function renderPosts() {
  const sorted = [...posts]
    .filter((post) => activeFilter === "all" || post.category === activeFilter)
    .filter((post) => {
      const haystack = `${post.title} ${post.body} ${post.author} ${post.tags.join(" ")}`.toLowerCase();
      return haystack.includes(searchTerm);
    })
    .sort((a, b) => {
      if (sortSelect.value === "popular") return b.replies + b.thanks - (a.replies + a.thanks);
      if (sortSelect.value === "nearby") return a.distance - b.distance;
      return posts.indexOf(a) - posts.indexOf(b);
    });

  if (!sorted.length) {
    feedList.innerHTML = '<div class="empty-state">No matching posts yet. Try a different filter or publish the first one.</div>';
    return;
  }

  feedList.innerHTML = sorted
    .map((post) => {
      const categoryLabel = post.category === "market" ? "Market" : post.category[0].toUpperCase() + post.category.slice(1);
      return `
        <article class="post-card" data-id="${post.id}">
          <div class="post-header">
            <div class="post-author">
              <div class="avatar">${post.initials}</div>
              <div>
                <strong>${escapeHtml(post.author)}</strong>
                <div class="post-meta">
                  <span>${post.time}</span>
                  <span>${post.distance.toFixed(1)} mi away</span>
                  <span>Verified</span>
                </div>
              </div>
            </div>
            <span class="tag ${post.category === "alert" ? "alert" : ""}">${categoryLabel}</span>
          </div>
          <h3 class="post-title">${escapeHtml(post.title)}</h3>
          <p class="post-body">${escapeHtml(post.body)}</p>
          <div class="tag-row">
            ${post.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
          <div class="post-actions">
            <div>
              <button type="button" data-action="reply">${icon("reply")} ${post.replies} replies</button>
              <button type="button" data-action="thanks">${icon("thanks")} ${post.thanks} thanks</button>
            </div>
            <button type="button" data-action="save">${icon("save")} Save</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function analyzeNeighborIntent(text) {
  const lower = text.toLowerCase();
  const rules = [
    { category: "alert", urgency: "High", tags: ["Safety", "Priority"], words: ["unsafe", "theft", "fire", "accident", "suspicious", "emergency", "danger", "lost child"] },
    { category: "market", urgency: "Normal", tags: ["Market", "Offer"], words: ["sell", "selling", "free", "give away", "pickup", "available", "donate"] },
    { category: "event", urgency: "Normal", tags: ["Event", "Community"], words: ["meetup", "meeting", "event", "cleanup", "class", "workshop", "party"] },
    { category: "help", urgency: "Normal", tags: ["Help", "Neighbor request"], words: ["need", "borrow", "lend", "help", "recommend", "looking for", "can someone"] },
  ];

  const match = rules.find((rule) => rule.words.some((word) => lower.includes(word))) || rules[3];
  const urgency = lower.includes("today") || lower.includes("now") || lower.includes("urgent") || lower.includes("tonight") ? "High" : match.urgency;
  return { ...match, urgency };
}

function makeAiDraft(rawText, tone) {
  const text = rawText.trim().replace(/\s+/g, " ");
  const analysis = analyzeNeighborIntent(text);
  const openers = {
    friendly: "Hi neighbors,",
    urgent: "Hi neighbors, quick request:",
    formal: "Hello neighbors,",
    short: "Neighbors,",
  };
  const closers = {
    friendly: "Thanks in advance. I appreciate the help.",
    urgent: "Please reply if you can help or have useful information.",
    formal: "Please reply with availability or relevant details. Thank you.",
    short: "Please reply if you can help.",
  };
  const safetyNote = analysis.category === "alert"
    ? "Safety note: include the exact location, time, and whether emergency services have already been contacted."
    : "Tip: add pickup timing, location, and any constraints so neighbors can respond quickly.";
  const title = buildAiTitle(text, analysis.category);
  const body = `${openers[tone]} ${text} ${closers[tone]}`;

  return {
    ...analysis,
    title,
    body,
    note: safetyNote,
  };
}

function buildAiTitle(text, category) {
  const cleaned = text.replace(/[.?!]$/, "");
  const words = cleaned.split(" ").slice(0, 8).join(" ");
  const prefixes = {
    alert: "Safety alert",
    help: "Neighbor help request",
    market: "Neighborhood offer",
    event: "Community event",
  };
  return `${prefixes[category]}: ${words}`;
}

function renderAiSuggestion(suggestion) {
  document.querySelector("#aiCategory").textContent = `Category: ${suggestion.category[0].toUpperCase() + suggestion.category.slice(1)}`;
  document.querySelector("#aiUrgency").textContent = `Urgency: ${suggestion.urgency}`;
  document.querySelector("#aiTags").textContent = `Tags: ${suggestion.tags.join(", ")}`;
  document.querySelector("#conciergeOutput").textContent = `${suggestion.body}\n\n${suggestion.note}`;
}

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderPosts();
  });
});

document.querySelectorAll("[data-quick]").forEach((button) => {
  button.addEventListener("click", () => {
    const categoryMap = {
      "Lost & Found": "help",
      "Ask for Help": "help",
      "Sell or Give Away": "market",
      "Safety Alert": "alert",
    };
    document.querySelector("#postCategory").value = categoryMap[button.dataset.quick];
    document.querySelector("#postTitle").value = button.dataset.quick;
    composer.showModal();
  });
});

document.querySelector("#openComposer").addEventListener("click", () => composer.showModal());

document.querySelector("#publishPost").addEventListener("click", () => {
  const title = document.querySelector("#postTitle").value.trim();
  const body = document.querySelector("#postBody").value.trim();
  const category = document.querySelector("#postCategory").value;
  const distance = Number(document.querySelector("#postDistance").value) || 0.4;

  if (!title || !body) {
    showToast("Add a title and details before publishing.");
    return;
  }

  posts.unshift({
    id: crypto.randomUUID(),
    category,
    title,
    body,
    author: "Zeeshan R.",
    initials: "ZR",
    distance,
    time: "Just now",
    replies: 0,
    thanks: 0,
    tags: [document.querySelector("#postVisibility").value, category === "alert" ? "Priority" : "Neighbor post"],
  });
  savePosts();
  renderPosts();
  composer.close();
  document.querySelector(".composer-form").reset();
  showToast("Posted to verified neighbors.");
});

feedList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const card = event.target.closest(".post-card");
  const post = posts.find((item) => item.id === card.dataset.id);
  if (!post) return;

  if (button.dataset.action === "thanks") {
    post.thanks += 1;
    savePosts();
    renderPosts();
    showToast("Thanks sent.");
  }

  if (button.dataset.action === "reply") {
    post.replies += 1;
    savePosts();
    renderPosts();
    showToast("Reply interest recorded.");
  }

  if (button.dataset.action === "save") {
    button.classList.toggle("saved");
    showToast(button.classList.contains("saved") ? "Saved for later." : "Removed from saved.");
  }
});

searchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value.trim().toLowerCase();
  renderPosts();
});

sortSelect.addEventListener("change", renderPosts);

document.querySelector("#sendAlert").addEventListener("click", () => {
  const alertText = document.querySelector("#alertText").value.trim();
  if (!alertText) {
    showToast("Write a short alert first.");
    return;
  }

  posts.unshift({
    id: crypto.randomUUID(),
    category: "alert",
    title: "Neighborhood safety alert",
    body: alertText,
    author: "Zeeshan R.",
    initials: "ZR",
    distance: 0.1,
    time: "Just now",
    replies: 0,
    thanks: 0,
    tags: ["Safety", "Broadcast"],
  });
  document.querySelector("#alertText").value = "";
  savePosts();
  renderPosts();
  showToast("Alert added to the feed.");
});

document.querySelector("#draftPost").addEventListener("click", () => {
  const need = document.querySelector("#aiIntent").value.trim();
  const output = document.querySelector("#conciergeOutput");
  if (!need) {
    output.textContent = "Tell the AI Copilot what you need, and it will draft a clear neighbor-friendly post.";
    return;
  }

  lastAiSuggestion = makeAiDraft(need, document.querySelector("#aiTone").value);
  renderAiSuggestion(lastAiSuggestion);
});

document.querySelector("#improvePost").addEventListener("click", () => {
  const need = document.querySelector("#aiIntent").value.trim() || document.querySelector("#conciergeOutput").textContent.trim();
  if (!need || need === "AI draft and neighborhood safety notes will appear here.") {
    showToast("Add a rough message for AI to improve.");
    return;
  }

  lastAiSuggestion = makeAiDraft(need, "formal");
  lastAiSuggestion.body = lastAiSuggestion.body
    .replace("Hello neighbors,", "Hello neighbors, I am sharing a clear request:")
    .replace(" Thank you.", " Please include your timing, location, or any helpful details when replying. Thank you.");
  renderAiSuggestion(lastAiSuggestion);
});

document.querySelector("#useAiDraft").addEventListener("click", () => {
  if (!lastAiSuggestion) {
    showToast("Generate an AI draft first.");
    return;
  }

  document.querySelector("#postCategory").value = lastAiSuggestion.category;
  document.querySelector("#postTitle").value = lastAiSuggestion.title.slice(0, 80);
  document.querySelector("#postBody").value = lastAiSuggestion.body.slice(0, 420);
  composer.showModal();
});

document.querySelectorAll("[data-rsvp]").forEach((button) => {
  button.addEventListener("click", () => {
    button.textContent = "Going";
    button.disabled = true;
    showToast(`RSVP confirmed for ${button.dataset.rsvp}.`);
  });
});

document.querySelector("#toggleTheme").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

renderPosts();
