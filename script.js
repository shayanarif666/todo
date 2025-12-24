// Smart Todo (Personal + Professional) — Search + Priority + Custom Toast + Pagination
const STORAGE_KEY = "smart_todo_bootstrap_v2";
const ITEMS_PER_PAGE = 5;

const state = loadState();

// UI-only state (not saved)
const ui = {
    personal: { page: 1 },
    professional: { page: 1 },
};

const refs = {
    personal: {
        input: document.getElementById("personalInput"),
        due: document.getElementById("personalDue"),
        prio: document.getElementById("personalPriority"),
        search: document.getElementById("personalSearch"),
        add: document.getElementById("personalAdd"),
        list: document.getElementById("personalList"),
        summary: document.getElementById("personalSummary"),
        pager: document.getElementById("personalPager"), // add in HTML
    },
    professional: {
        input: document.getElementById("professionalInput"),
        due: document.getElementById("professionalDue"),
        prio: document.getElementById("professionalPriority"),
        search: document.getElementById("professionalSearch"),
        add: document.getElementById("professionalAdd"),
        list: document.getElementById("professionalList"),
        summary: document.getElementById("professionalSummary"),
        pager: document.getElementById("professionalPager"), // add in HTML
    },
};

const toastHost = document.getElementById("toastHost");

document.getElementById("resetBtn").addEventListener("click", resetAll);

refs.personal.add.addEventListener("click", () => addTask("personal"));
refs.professional.add.addEventListener("click", () => addTask("professional"));

refs.personal.input.addEventListener("keydown", (e) => { if (e.key === "Enter") addTask("personal"); });
refs.professional.input.addEventListener("keydown", (e) => { if (e.key === "Enter") addTask("professional"); });

// Search resets pagination to page 1
refs.personal.search.addEventListener("input", () => { ui.personal.page = 1; render("personal"); });
refs.professional.search.addEventListener("input", () => { ui.professional.page = 1; render("professional"); });

document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const scope = btn.dataset.scope;

    if (action === "clearCompleted") { ui[scope].page = 1; clearCompleted(scope); }
    if (action === "sortDue") { ui[scope].page = 1; sortByDue(scope); }
});

// Pagination click (delegation per scope)
["personal", "professional"].forEach((scope) => {
    const host = refs[scope].pager;
    if (!host) return;

    host.addEventListener("click", (e) => {
        const a = e.target.closest("[data-page]");
        if (!a) return;
        e.preventDefault();

        const page = Number(a.dataset.page);
        if (!Number.isFinite(page)) return;

        ui[scope].page = page;
        render(scope);

        // Smooth scroll to list top (avoid long scrolling)
        refs[scope].list.scrollIntoView({ behavior: "smooth", block: "start" });
    });
});

// ---------- storage ----------
function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { personal: [], professional: [] };
        const parsed = JSON.parse(raw);
        return {
            personal: Array.isArray(parsed.personal) ? parsed.personal : [],
            professional: Array.isArray(parsed.professional) ? parsed.professional : [],
        };
    } catch {
        return { personal: [], professional: [] };
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

// ---------- toast ----------
function showToast({ type = "info", title = "Info", message = "", timeout = 2600 } = {}) {
    const meta = getToastMeta(type);

    const el = document.createElement("div");
    el.className = "ttoast";
    el.innerHTML = `
    <div class="ico">${meta.icon}</div>
    <div class="content">
      <div class="title">${escapeHtml(title)}</div>
      <div class="msg">${escapeHtml(message)}</div>
    </div>
    <button class="close" aria-label="Close">&times;</button>
  `;

    el.querySelector(".close").addEventListener("click", () => removeToast(el));
    toastHost.appendChild(el);

    requestAnimationFrame(() => el.classList.add("show"));

    const t = setTimeout(() => removeToast(el), timeout);
    el.dataset.timer = String(t);
}

function removeToast(el) {
    const t = Number(el.dataset.timer);
    if (t) clearTimeout(t);
    el.classList.remove("show");
    setTimeout(() => el.remove(), 180);
}

function getToastMeta(type) {
    if (type === "success") return { icon: `<i class="bi bi-check2-circle"></i>` };
    if (type === "danger") return { icon: `<i class="bi bi-trash3"></i>` };
    if (type === "warn") return { icon: `<i class="bi bi-exclamation-triangle"></i>` };
    return { icon: `<i class="bi bi-info-circle"></i>` };
}

// ---------- actions ----------
function addTask(scope) {
    const text = refs[scope].input.value.trim();
    const due = refs[scope].due.value || null;
    const priority = refs[scope].prio.value || "Medium";

    if (!text) {
        showToast({ type: "warn", title: "Missing task", message: "Please type a task first." });
        return;
    }

    const nextOrder = state[scope].reduce((m, t) => Math.max(m, t.order ?? 0), 0) + 1;

    state[scope].push({
        id: uid(),
        text,
        done: false,
        due,
        priority,
        order: nextOrder,
    });

    refs[scope].input.value = "";
    refs[scope].due.value = "";
    refs[scope].prio.value = ""; // back to placeholder

    // Go to last page after adding (nice UX)
    const totalPages = Math.max(1, Math.ceil(state[scope].length / ITEMS_PER_PAGE));
    ui[scope].page = totalPages;

    saveState();
    render(scope);

    showToast({
        type: "success",
        title: "Task added",
        message: `${text.slice(0, 40)}${text.length > 40 ? "..." : ""} • ${priority}`,
    });

    // Auto scroll to list
    refs[scope].list.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteTask(scope, id, rowEl, taskText) {
    rowEl.classList.add("fade-out");
    setTimeout(() => {
        state[scope] = state[scope].filter((t) => t.id !== id);
        saveState();
        render(scope);
        showToast({ type: "danger", title: "Deleted", message: taskText || "Task removed." });
    }, 180);
}

function clearCompleted(scope) {
    const before = state[scope].length;
    state[scope] = state[scope].filter((t) => !t.done);
    const removed = before - state[scope].length;

    saveState();
    render(scope);

    showToast({
        type: removed ? "success" : "info",
        title: "Clear completed",
        message: removed ? `${removed} completed task(s) removed.` : "No completed tasks to clear.",
    });
}

function sortByDue(scope) {
    const tasks = state[scope].slice();

    tasks.sort((a, b) => {
        const ad = a.due ? new Date(a.due).getTime() : Infinity;
        const bd = b.due ? new Date(b.due).getTime() : Infinity;
        if (ad !== bd) return ad - bd;
        return (a.order ?? 0) - (b.order ?? 0);
    });

    tasks.forEach((t, i) => (t.order = i + 1));
    state[scope] = tasks;

    saveState();
    render(scope);

    showToast({ type: "info", title: "Sorted", message: "Tasks sorted by due date." });
}

function resetAll() {
    if (!confirm("Reset all tasks? This cannot be undone.")) return;
    state.personal = [];
    state.professional = [];
    ui.personal.page = 1;
    ui.professional.page = 1;
    saveState();
    render("personal");
    render("professional");
    showToast({ type: "warn", title: "Reset", message: "All tasks cleared." });
}

// ---------- inline edit (FIXED) ----------
function startInlineEdit(scope, id, textEl) {
    const task = state[scope].find((t) => t.id === id);
    if (!task) return;

    const rowEl = textEl.closest(".todo-item");
    if (!rowEl) return;

    if (rowEl.dataset.editing === "1") return;
    rowEl.dataset.editing = "1";

    const original = task.text;

    const input = document.createElement("input");
    input.className = "form-control form-control-sm rounded-3 dark-input";
    input.value = original;

    textEl.replaceWith(input);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    const finish = (commit) => {
        const next = input.value.trim();
        if (commit && next && next !== original) {
            task.text = next;
            saveState();
            showToast({ type: "success", title: "Updated", message: "Task text updated." });
        }

        const restored = document.createElement("div");
        restored.className = "todo-text fw-semibold text-truncate";
        restored.title = "Click to edit";
        restored.textContent = task.text;

        input.replaceWith(restored);
        delete rowEl.dataset.editing;
    };

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") finish(true);
        if (e.key === "Escape") {
            input.value = original;
            finish(false);
        }
    });

    input.addEventListener("blur", () => finish(true));
}

// ---------- drag & drop ----------
let dragCtx = { scope: null, draggedId: null };

function wireDnD(scope, rowEl) {
    rowEl.addEventListener("dragstart", (e) => {
        dragCtx = { scope, draggedId: rowEl.dataset.id };
        rowEl.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
    });

    rowEl.addEventListener("dragend", () => {
        rowEl.classList.remove("dragging");
        document.querySelectorAll(".drop-hint").forEach((x) => x.classList.remove("drop-hint"));
    });

    rowEl.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (dragCtx.scope !== scope) return;
        rowEl.classList.add("drop-hint");
        e.dataTransfer.dropEffect = "move";
    });

    rowEl.addEventListener("dragleave", () => rowEl.classList.remove("drop-hint"));

    rowEl.addEventListener("drop", (e) => {
        e.preventDefault();
        rowEl.classList.remove("drop-hint");
        if (dragCtx.scope !== scope) return;

        const draggedId = dragCtx.draggedId;
        const targetId = rowEl.dataset.id;

        if (!draggedId || draggedId === targetId) return;

        const ordered = state[scope].slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const fromIdx = ordered.findIndex((t) => t.id === draggedId);
        const toIdx = ordered.findIndex((t) => t.id === targetId);

        if (fromIdx < 0 || toIdx < 0) return;

        const [moved] = ordered.splice(fromIdx, 1);
        ordered.splice(toIdx, 0, moved);

        ordered.forEach((t, i) => (t.order = i + 1));
        state[scope] = ordered;

        saveState();
        render(scope);

        showToast({ type: "info", title: "Reordered", message: "Task order updated." });
    });
}

// ---------- render ----------
function render(scope) {
    const listEl = refs[scope].list;
    const q = (refs[scope].search.value || "").trim().toLowerCase();

    const ordered = state[scope].slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const filteredTasks = ordered.filter((t) => {
        if (!q) return true;
        return (t.text || "").toLowerCase().includes(q);
    });

    const totalAll = state[scope].length;
    const doneAll = state[scope].filter((t) => t.done).length;

    const totalFiltered = filteredTasks.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / ITEMS_PER_PAGE));

    // clamp current page
    ui[scope].page = clamp(ui[scope].page, 1, totalPages);

    const page = ui[scope].page;
    const start = (page - 1) * ITEMS_PER_PAGE;
    const pageTasks = filteredTasks.slice(start, start + ITEMS_PER_PAGE);

    refs[scope].summary.textContent =
        `Total: ${totalAll} · Active: ${totalAll - doneAll} · Done: ${doneAll}` +
        (q ? ` · Showing: ${totalFiltered}` : "") +
        (totalFiltered > ITEMS_PER_PAGE ? ` · Page: ${page}/${totalPages}` : "");

    // Smooth transition
    listEl.classList.remove("show");
    listEl.classList.add("list-page-anim");

    // Build list
    listEl.innerHTML = "";

    if (totalFiltered === 0) {
        listEl.innerHTML = `
      <div class="p-3 rounded-4 border border-white-10 bg-white-06 text-white-70">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-search fs-5"></i>
          <div>
            <div class="fw-semibold text-white">${q ? "No match found" : "No tasks yet"}</div>
            <div class="small">${q ? "Try a different keyword." : "Add something above — this UI is waiting to flex 😄"}</div>
          </div>
        </div>
      </div>
    `;
        renderPagination(scope, 0, 1);
        requestAnimationFrame(() => listEl.classList.add("show"));
        return;
    }

    const frag = document.createDocumentFragment();
    pageTasks.forEach((task) => frag.appendChild(taskRow(scope, task)));
    listEl.appendChild(frag);

    renderPagination(scope, totalPages, page);

    requestAnimationFrame(() => listEl.classList.add("show"));
}

function taskRow(scope, task) {
    const row = document.createElement("div");
    row.className = `todo-item rounded-4 p-3 ${task.done ? "done" : ""}`;
    row.dataset.id = task.id;
    row.setAttribute("draggable", "true");

    const dueLabel = task.due ? formatDate(task.due) : "No due";
    const pr = task.priority || "Medium";
    const prClass = pr === "High" ? "prio-high" : pr === "Low" ? "prio-low" : "prio-med";

    row.innerHTML = `
  <div class="d-flex flex-column flex-sm-row align-items-start justify-content-between gap-3">

    <!-- LEFT -->
    <div class="d-flex align-items-start gap-3 flex-grow-1 min-w-0 w-100">
      <div class="pt-1 flex-shrink-0">
        <input class="todo-check" type="checkbox" ${task.done ? "checked" : ""} aria-label="Mark as done">
      </div>

      <div class="flex-grow-1 min-w-0 w-100">
        <!-- title: wrap on mobile, truncate on sm+ -->
        <div class="todo-text fw-semibold text-wrap text-sm-truncate" title="Click to edit">
          ${escapeHtml(task.text)}
        </div>

        <div class="mt-2 d-flex flex-wrap gap-2 align-items-center">
          <span class="badge bg-white-10 border border-white-10 rounded-pill">
            <i class="bi bi-grip-vertical me-1"></i> Drag
          </span>

          <span class="badge bg-white-10 border border-white-10 rounded-pill">
            <i class="bi bi-calendar-event me-1"></i> ${dueLabel}
          </span>

          <span class="prio-badge ${prClass}">
            <i class="bi bi-flag-fill me-1"></i>${escapeHtml(pr)}
          </span>
        </div>
      </div>
    </div>

    <!-- RIGHT (actions) -->
    <div class="d-flex gap-2 flex-shrink-0 align-self-end align-self-sm-start">
      <button class="btn btn-outline-light btn-sm rounded-4" data-btn="edit" title="Edit">
        <i class="bi bi-pencil"></i>
      </button>
      <button class="btn btn-outline-danger btn-sm rounded-4" data-btn="delete" title="Delete">
        <i class="bi bi-trash3"></i>
      </button>
    </div>

  </div>
`;

    // toggle done
    const chk = row.querySelector(".todo-check");
    chk.addEventListener("change", () => {
        task.done = chk.checked;
        saveState();
        row.classList.toggle("done", task.done);

        if (task.done) {
            row.classList.remove("pulse-done");
            void row.offsetWidth;
            row.classList.add("pulse-done");
            setTimeout(() => row.classList.remove("pulse-done"), 450);

            showToast({ type: "success", title: "Completed", message: "Task marked as completed." });
        } else {
            showToast({ type: "info", title: "Active", message: "Task moved back to active." });
        }
    });

    // click text to edit (delegated)
    row.addEventListener("click", (e) => {
        const el = e.target.closest(".todo-text");
        if (!el) return;
        startInlineEdit(scope, task.id, el);
    });

    // edit button always grabs current .todo-text (fixed)
    row.querySelector('[data-btn="edit"]').addEventListener("click", (e) => {
        e.stopPropagation();
        const currentTextEl = row.querySelector(".todo-text");
        if (currentTextEl) startInlineEdit(scope, task.id, currentTextEl);
    });

    // delete
    row.querySelector('[data-btn="delete"]').addEventListener("click", (e) => {
        e.stopPropagation();
        deleteTask(scope, task.id, row, task.text);
    });

    // DnD
    wireDnD(scope, row);

    return row;
}

// ---------- Pagination UI (Bootstrap 5) ----------
function renderPagination(scope, totalPages, currentPage) {
    const host = refs[scope].pager;
    if (!host) return;

    // Hide if not needed
    if (!totalPages || totalPages <= 1) {
        host.innerHTML = "";
        return;
    }

    const pages = buildPageWindow(totalPages, currentPage);

    host.innerHTML = `
    <div class="pager-glass d-flex flex-column flex-md-row align-items-center justify-content-between gap-2">
      <div class="text-white-70 small">
        <i class="bi bi-layers me-1"></i>
        Showing <b class="text-white">5</b> per page • Page <b class="text-white">${currentPage}</b> of <b class="text-white">${totalPages}</b>
      </div>

      <nav aria-label="${scope} pagination">
        <ul class="pagination pagination-sm mb-0 gap-2">
          ${pageBtn("Prev", currentPage - 1, currentPage === 1, "bi bi-chevron-left")}
          ${pages.map(p => p === "..."
        ? `<li class="page-item disabled"><span class="page-link">…</span></li>`
        : pageNumber(p, p === currentPage)
    ).join("")}
          ${pageBtn("Next", currentPage + 1, currentPage === totalPages, "bi bi-chevron-right")}
        </ul>
      </nav>
    </div>
  `;
}

function pageNumber(page, active) {
    return `
    <li class="page-item ${active ? "active" : ""}">
      <a class="page-link" href="#" data-page="${page}">${page}</a>
    </li>
  `;
}

function pageBtn(label, page, disabled, iconClass) {
    return `
    <li class="page-item ${disabled ? "disabled" : ""}">
      <a class="page-link" href="#" data-page="${page}" aria-label="${label}">
        <i class="${iconClass}"></i>
      </a>
    </li>
  `;
}

// Windowed pagination with ellipsis
function buildPageWindow(totalPages, current) {
    const windowSize = 2; // numbers around current
    const pages = [];

    const push = (x) => pages.push(x);

    push(1);

    const start = Math.max(2, current - windowSize);
    const end = Math.min(totalPages - 1, current + windowSize);

    if (start > 2) push("...");

    for (let p = start; p <= end; p++) push(p);

    if (end < totalPages - 1) push("...");

    if (totalPages > 1) push(totalPages);

    // Remove duplicates if totalPages small
    return [...new Set(pages)];
}

// ---------- helpers ----------
function formatDate(yyyy_mm_dd) {
    try {
        const d = new Date(yyyy_mm_dd + "T00:00:00");
        return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
    } catch {
        return yyyy_mm_dd;
    }
}

function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

// initial render + ensure order/priority exist
["personal", "professional"].forEach((scope) => {
    state[scope].forEach((t, i) => {
        if (typeof t.order !== "number") t.order = i + 1;
        if (!t.priority) t.priority = "Medium";
    });
    render(scope);
});
