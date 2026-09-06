/**
 * Frontend Single Page Application (SPA) HTML Generator
 * Served directly by Cloudflare Worker at GET / and GET /app
 */

export function getAppHtml(env) {
  const botUsername = env.BOT_USERNAME || 'xminty_bot';
  const adminId = env.ADMIN_ID || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>xmi</title>
  
  <!-- Telegram WebApp SDK -->
  <script src="https://telegram.org/js/telegram-web-app.js"></script>

  <!-- Google Fonts: Inter -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
    :root {
      --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #090d16 100%);
      --card-bg: rgba(30, 41, 59, 0.75);
      --card-border: rgba(255, 255, 255, 0.1);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #38bdf8;
      --primary-hover: #0ea5e9;
      --primary-glow: rgba(56, 189, 248, 0.25);
      --accent-heart: #f43f5e;
      --accent-admin: #fbbf24;
      --accent-promoted: #f59e0b;
      --accent-telegram: #229ed9;
      --border-radius: 16px;
      --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg-gradient);
      background-attachment: fixed;
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Header */
    header {
      position: sticky;
      top: 0;
      z-index: 50;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      background: rgba(15, 23, 42, 0.88);
      border-bottom: 1px solid var(--card-border);
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: var(--text-main);
    }

    .brand-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 4px 12px var(--primary-glow);
    }

    .brand-title {
      font-weight: 800;
      font-size: 1.25rem;
      letter-spacing: -0.02em;
    }

    .brand-subtitle {
      font-size: 0.72rem;
      color: var(--primary);
      font-weight: 500;
    }

    .user-auth-area {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .admin-badge {
      background: rgba(251, 191, 36, 0.2);
      border: 1px solid rgba(251, 191, 36, 0.4);
      color: var(--accent-admin);
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .user-profile-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.07);
      padding: 5px 12px;
      border-radius: 9999px;
      border: 1px solid var(--card-border);
      font-size: 0.85rem;
      font-weight: 500;
    }

    .user-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }

    .btn {
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-family: inherit;
      font-weight: 600;
      border-radius: 12px;
      transition: var(--transition);
      border: none;
      outline: none;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 0.82rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--primary), var(--primary-hover));
      color: #04101e;
      box-shadow: 0 4px 12px var(--primary-glow);
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px var(--primary-glow);
    }

    .btn-telegram {
      background: #229ed9;
      color: white;
      padding: 7px 14px;
      border-radius: 9999px;
      font-size: 0.85rem;
    }

    .btn-ghost {
      background: transparent;
      color: var(--text-muted);
      border: 1px solid var(--card-border);
    }

    .btn-ghost:hover {
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.05);
    }

    /* Main Container */
    main {
      flex: 1;
      max-width: 900px;
      width: 100%;
      margin: 0 auto;
      padding: 20px 16px 60px 16px;
    }

    /* Admin Filter Tabs */
    .admin-tabs-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      overflow-x: auto;
      padding-bottom: 4px;
    }

    .admin-tab {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: var(--transition);
    }

    .admin-tab.active {
      background: var(--primary);
      color: #04101e;
      border-color: var(--primary);
    }

    /* Controls Bar */
    .controls-bar {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }

    @media (min-width: 640px) {
      .controls-bar {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }
    }

    .search-input-wrapper {
      position: relative;
      flex: 1;
      max-width: 450px;
    }

    .search-input {
      width: 100%;
      padding: 10px 16px 10px 40px;
      border-radius: 12px;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid var(--card-border);
      color: var(--text-main);
      font-size: 0.9rem;
      outline: none;
      transition: var(--transition);
    }

    .search-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-glow);
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 16px;
      color: var(--text-muted);
      pointer-events: none;
    }

    /* Posts Grid */
    .posts-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }

    @media (min-width: 640px) {
      .posts-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    /* Uniform Post Card */
    .post-card {
      background: var(--card-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--card-border);
      border-radius: var(--border-radius);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 100%;
      transition: var(--transition);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      position: relative;
    }

    .post-card.is-promoted {
      border: 1px solid rgba(245, 158, 11, 0.5);
      box-shadow: 0 8px 30px rgba(245, 158, 11, 0.2);
    }

    .post-card:hover {
      transform: translateY(-3px);
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
    }

    /* Full Image with Blurred Ambient Side Backdrop */
    .post-image-container {
      width: 100%;
      height: 220px;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #090d16;
    }

    .post-image-backdrop {
      position: absolute;
      inset: -15px;
      background-size: cover;
      background-position: center;
      filter: blur(20px) brightness(0.55);
      transform: scale(1.15);
      z-index: 1;
    }

    .post-image-fg {
      position: relative;
      z-index: 2;
      width: 100%;
      height: 100%;
      object-fit: contain;
      transition: transform 0.4s ease;
    }

    .post-card:hover .post-image-fg {
      transform: scale(1.03);
    }

    .post-image-placeholder {
      font-size: 44px;
      opacity: 0.4;
      z-index: 2;
    }

    .post-badges-top {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      z-index: 3;
      display: flex;
      align-items: center;
      justify-content: space-between;
      pointer-events: none;
    }

    .post-status-badge {
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      backdrop-filter: blur(8px);
    }

    .status-promoted {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.9), rgba(217, 119, 6, 0.9));
      color: #0f172a;
      font-weight: 800;
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
    }

    .status-published {
      background: rgba(34, 197, 94, 0.25);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.4);
    }

    .status-draft {
      background: rgba(245, 158, 11, 0.25);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.4);
    }

    .status-scheduled {
      background: rgba(168, 85, 247, 0.25);
      color: #c084fc;
      border: 1px solid rgba(168, 85, 247, 0.4);
    }

    .post-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .post-title {
      font-size: 1.15rem;
      font-weight: 700;
      line-height: 1.35;
      margin-bottom: 8px;
      color: #ffffff;
    }

    .post-meta {
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Admin Action Toolbar on Cards */
    .admin-card-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
    }

    .admin-btn {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--card-border);
      color: var(--text-main);
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
    }

    .admin-btn:hover {
      background: rgba(255, 255, 255, 0.18);
    }

    .admin-btn-promote {
      color: var(--accent-admin);
      border-color: rgba(251, 191, 36, 0.3);
    }

    .admin-btn-delete {
      color: #f87171;
      border-color: rgba(248, 113, 113, 0.3);
    }

    .admin-btn-delete:hover {
      background: rgba(248, 113, 113, 0.2);
    }

    .post-actions-row {
      margin-top: auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .social-counters {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .action-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 0.88rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 5px;
      cursor: pointer;
      padding: 6px 8px;
      border-radius: 8px;
      transition: var(--transition);
    }

    .action-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-main);
    }

    .action-btn.liked {
      color: var(--accent-heart);
    }

    .action-btn.liked svg {
      fill: var(--accent-heart);
      stroke: var(--accent-heart);
    }

    .post-buttons-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-open-bot {
      background: rgba(56, 189, 248, 0.12);
      color: var(--primary);
      border: 1px solid rgba(56, 189, 248, 0.25);
      padding: 7px 12px;
      border-radius: 10px;
      font-size: 0.82rem;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: var(--transition);
    }

    .btn-open-bot:hover {
      background: var(--primary);
      color: #04101e;
      box-shadow: 0 4px 12px var(--primary-glow);
    }

    .btn-direct-link {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.3);
      padding: 7px 12px;
      border-radius: 10px;
      font-size: 0.82rem;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: var(--transition);
    }

    .btn-direct-link:hover {
      background: #22c55e;
      color: #04101e;
    }

    /* Modal / Drawer for Comments & Analytics */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 100;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    @media (min-width: 640px) {
      .modal-overlay {
        align-items: center;
        padding: 20px;
      }
    }

    .modal-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }

    .modal-content {
      background: #1e293b;
      width: 100%;
      max-width: 640px;
      max-height: 85vh;
      border-top-left-radius: 20px;
      border-top-right-radius: 20px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid var(--card-border);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
      transform: translateY(100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @media (min-width: 640px) {
      .modal-content {
        border-radius: 20px;
        transform: scale(0.95);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .modal-overlay.active .modal-content {
        transform: scale(1);
      }
    }

    .modal-overlay.active .modal-content {
      transform: translateY(0);
    }

    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--card-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-title {
      font-size: 1.1rem;
      font-weight: 700;
    }

    .modal-close {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 22px;
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-close:hover {
      background: rgba(255, 255, 255, 0.08);
      color: white;
    }

    .modal-body {
      padding: 16px 20px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .folders-badge-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 8px;
    }

    .folder-badge {
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: var(--primary);
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .comment-item {
      background: rgba(15, 23, 42, 0.6);
      padding: 12px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      position: relative;
    }

    .comment-item.is-hidden {
      opacity: 0.6;
      border: 1px dashed #f87171;
    }

    .comment-author {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .comment-username {
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--primary);
    }

    .comment-time {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .comment-text {
      font-size: 0.88rem;
      line-height: 1.4;
      color: #e2e8f0;
      white-space: pre-wrap;
    }

    .comment-admin-actions {
      display: flex;
      gap: 6px;
      margin-top: 8px;
    }

    .comment-mod-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 600;
      cursor: pointer;
    }

    .comment-mod-btn:hover {
      color: white;
      background: rgba(255, 255, 255, 0.15);
    }

    /* Analytics UI Elements */
    .analytics-summary-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }

    .stat-card {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 12px;
      text-align: center;
    }

    .stat-value {
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--primary);
    }

    .stat-label {
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-top: 4px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .analytics-tabs {
      display: flex;
      gap: 6px;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 8px;
      margin-bottom: 12px;
    }

    .analytics-tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 0.82rem;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 8px;
      cursor: pointer;
    }

    .analytics-tab-btn.active {
      background: var(--primary);
      color: #04101e;
    }

    .log-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px;
      background: rgba(15, 23, 42, 0.5);
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 0.82rem;
    }

    .log-user-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .modal-footer {
      padding: 16px 20px;
      border-top: 1px solid var(--card-border);
      background: #131d2e;
    }

    .comment-form {
      display: flex;
      gap: 8px;
    }

    .comment-input {
      flex: 1;
      padding: 10px 14px;
      border-radius: 10px;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid var(--card-border);
      color: white;
      font-family: inherit;
      font-size: 0.88rem;
      outline: none;
    }

    .comment-input:focus {
      border-color: var(--primary);
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-muted);
    }

    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }

    .skeleton {
      background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    #toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: #0ea5e9;
      color: #031424;
      padding: 10px 20px;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 0.88rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
      z-index: 200;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    #toast.show {
      transform: translateX(-50%) translateY(0);
    }
  </style>
</head>
<body>

  <!-- Header -->
  <header>
    <a href="#" class="brand">
      <div class="brand-icon">⚡</div>
      <div>
        <div class="brand-title">xmi</div>
        <div class="brand-subtitle">Telegram Content Hub</div>
      </div>
    </a>

    <div class="user-auth-area" id="authArea"></div>
  </header>

  <!-- Main Content Area -->
  <main>
    <!-- Admin Tabs (Visible for Admin only) -->
    <div class="admin-tabs-bar" id="adminTabsBar" style="display: none;">
      <button class="admin-tab active" data-filter="all">All Posts</button>
      <button class="admin-tab" data-filter="published">Published</button>
      <button class="admin-tab" data-filter="draft">Drafts</button>
      <button class="admin-tab" data-filter="scheduled">Scheduled</button>
    </div>

    <!-- Controls Bar -->
    <div class="controls-bar">
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input type="text" id="searchInput" class="search-input" placeholder="Search posts..." />
      </div>

      <div style="display: flex; gap: 8px;">
        <button class="btn btn-ghost btn-sm" id="btnRefresh" title="Refresh feed">
          🔄 Refresh
        </button>
      </div>
    </div>

    <!-- Feed Container -->
    <div id="postsFeed" class="posts-grid"></div>
  </main>

  <!-- Comments Modal / Drawer -->
  <div class="modal-overlay" id="commentsModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title" id="modalPostTitle">Comments</h3>
        <button class="modal-close" id="btnModalClose">&times;</button>
      </div>

      <div class="modal-body" id="modalCommentsBody">
        <div id="foldersContainer" style="display: none; margin-bottom: 12px;"></div>
        <div class="comments-list" id="commentsList"></div>
      </div>

      <div class="modal-footer">
        <form class="comment-form" id="commentForm">
          <input
            type="text"
            id="commentTextInput"
            class="comment-input"
            placeholder="Write a comment..."
            autocomplete="off"
            required
          />
          <button type="submit" class="btn btn-primary btn-sm">Post</button>
        </form>
      </div>
    </div>
  </div>

  <!-- Admin Analytics Modal -->
  <div class="modal-overlay" id="analyticsModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title" id="analyticsPostTitle">Post Analytics</h3>
        <button class="modal-close" id="btnAnalyticsClose">&times;</button>
      </div>

      <div class="modal-body">
        <div class="analytics-summary-cards">
          <div class="stat-card">
            <div class="stat-value" id="statViews">0</div>
            <div class="stat-label">👁️ Views</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="statAccesses">0</div>
            <div class="stat-label">📥 Access / Downloads</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="statLikes">0</div>
            <div class="stat-label">❤️ Likes</div>
          </div>
        </div>

        <div class="analytics-tabs">
          <button class="analytics-tab-btn active" data-atab="views">👁️ Viewers</button>
          <button class="analytics-tab-btn" data-atab="accesses">📥 File / Link Downloads</button>
          <button class="analytics-tab-btn" data-atab="likes">❤️ Likers</button>
        </div>

        <div id="analyticsList" style="display: flex; flex-direction: column; gap: 8px;"></div>
      </div>
    </div>
  </div>

  <!-- Toast Notification -->
  <div id="toast">Message</div>

  <script>
    const API_BASE_URL = window.location.origin;
    const BOT_USERNAME = '${botUsername}';
    const ADMIN_ID = '${adminId}';

    let currentUser = null;
    let isAdmin = false;
    let allPosts = [];
    let currentFilter = 'all';
    let currentModalPostId = null;
    let currentAnalyticsData = null;
    let currentAnalyticsTab = 'views';

    function init() {
      if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();

        const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
        if (tgUser && tgUser.id) {
          currentUser = {
            id: tgUser.id,
            first_name: tgUser.first_name || '',
            last_name: tgUser.last_name || '',
            username: tgUser.username || tgUser.first_name || 'User'
          };
          localStorage.setItem('tg_user', JSON.stringify(currentUser));
        }
      }

      if (!currentUser) {
        const saved = localStorage.getItem('tg_user');
        if (saved) {
          try { currentUser = JSON.parse(saved); } catch (e) {}
        }
      }

      checkAdminStatus();
      renderAuthUI();
      loadPosts();
      setupEventListeners();
    }

    function checkAdminStatus() {
      if (currentUser && ADMIN_ID && String(currentUser.id) === String(ADMIN_ID)) {
        isAdmin = true;
        document.getElementById('adminTabsBar').style.display = 'flex';
      }
    }

    window.onTelegramAuth = function(user) {
      currentUser = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name || '',
        username: user.username || user.first_name
      };
      localStorage.setItem('tg_user', JSON.stringify(currentUser));
      checkAdminStatus();
      renderAuthUI();
      loadPosts();
      showToast('Welcome, ' + currentUser.first_name + '!');
    };

    function renderAuthUI() {
      const authArea = document.getElementById('authArea');
      if (currentUser) {
        authArea.innerHTML = \`
          \${isAdmin ? '<span class="admin-badge">👑 Admin</span>' : ''}
          <div class="user-profile-badge">
            <div class="user-avatar">\${(currentUser.first_name || 'U')[0].toUpperCase()}</div>
            <span>\${escapeHtml(currentUser.first_name)}</span>
          </div>
        \`;
      } else {
        authArea.innerHTML = \`
          <button class="btn btn-telegram" id="btnLogin">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
            Login
          </button>
        \`;
        document.getElementById('btnLogin').addEventListener('click', promptTelegramLogin);
      }
    }

    function promptTelegramLogin() {
      const name = prompt("Enter your Telegram Username or Name:");
      if (name && name.trim()) {
        const mockId = Math.floor(10000000 + Math.random() * 90000000);
        window.onTelegramAuth({
          id: mockId,
          first_name: name.trim(),
          username: name.trim()
        });
      }
    }

    // =========================================================
    // API CALLS & FEED RENDERING
    // =========================================================
    async function loadPosts() {
      const feed = document.getElementById('postsFeed');
      
      feed.innerHTML = Array(4).fill(0).map(() => \`
        <div class="post-card">
          <div class="post-image-container skeleton"></div>
          <div class="post-body">
            <div class="skeleton" style="height: 22px; width: 80%; margin-bottom: 12px;"></div>
            <div class="skeleton" style="height: 14px; width: 40%; margin-bottom: 20px;"></div>
            <div class="skeleton" style="height: 32px; width: 100%; margin-top: auto;"></div>
          </div>
        </div>
      \`).join('');

      try {
        const endpoint = isAdmin 
          ? \`\${API_BASE_URL}/api/admin/posts?user_id=\${currentUser.id}\`
          : \`\${API_BASE_URL}/api/posts\`;

        const res = await fetch(endpoint);
        const data = await res.json();
        
        if (!res.ok || !data.success) {
          throw new Error(data.error || \`HTTP \${res.status}\`);
        }
        
        allPosts = data.posts || [];
        filterAndRenderPosts();

        // Track views for all posts currently loaded in user feed
        if (currentUser && !isAdmin) {
          allPosts.forEach(p => {
            fetch(\`\${API_BASE_URL}/api/posts/\${p.id}/view\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: currentUser.id,
                username: currentUser.username,
                first_name: currentUser.first_name
              })
            }).catch(() => {});
          });
        }
      } catch (err) {
        console.error('Failed to load posts:', err);
        feed.innerHTML = \`
          <div class="empty-state" style="grid-column: 1 / -1;">
            <div class="empty-state-icon">⚡</div>
            <h3>Could not load posts</h3>
            <p style="margin-top: 6px; font-size: 0.9rem; color: #f87171;">\${escapeHtml(err.message)}</p>
            <button class="btn btn-primary btn-sm" style="margin-top: 16px;" onclick="loadPosts()">Retry</button>
          </div>
        \`;
      }
    }

    function filterAndRenderPosts() {
      let posts = allPosts;
      if (isAdmin && currentFilter !== 'all') {
        posts = posts.filter(p => p.status === currentFilter);
      }
      const query = document.getElementById('searchInput').value.toLowerCase().trim();
      if (query) {
        posts = posts.filter(p => p.title.toLowerCase().includes(query));
      }
      renderPosts(posts);
    }

    function renderPosts(posts) {
      const feed = document.getElementById('postsFeed');
      
      if (!posts || posts.length === 0) {
        feed.innerHTML = \`
          <div class="empty-state" style="grid-column: 1 / -1;">
            <div class="empty-state-icon">📭</div>
            <h3>No Posts Found</h3>
            <p style="margin-top: 6px;">New posts will appear here live.</p>
          </div>
        \`;
        return;
      }

      feed.innerHTML = posts.map(post => {
        const dateStr = post.created_at ? new Date(post.created_at).toLocaleDateString(undefined, {
          month: 'short', day: 'numeric', year: 'numeric'
        }) : '';

        const botLink = \`https://t.me/\${BOT_USERNAME}?start=post_\${post.id}\`;
        const hasImage = Boolean(post.preview_image);
        const isPromoted = Boolean(post.is_promoted);

        return \`
          <div class="post-card \${isPromoted ? 'is-promoted' : ''}" data-id="\${post.id}">
            <!-- Full Image with Blurred Side Backdrop -->
            <div class="post-image-container">
              <div class="post-badges-top">
                \${isPromoted ? '<span class="post-status-badge status-promoted">⭐ Featured</span>' : '<span></span>'}
                \${isAdmin ? \`<span class="post-status-badge status-\${post.status}">\${post.status}</span>\` : ''}
              </div>
              
              \${hasImage ? \`
                <div class="post-image-backdrop" style="background-image: url('\${escapeHtml(post.preview_image)}');"></div>
                <img src="\${escapeHtml(post.preview_image)}" class="post-image-fg" alt="\${escapeHtml(post.title)}" onerror="this.style.display='none';" />
              \` : \`
                <div class="post-image-placeholder">📂</div>
              \`}
            </div>

            <div class="post-body">
              \${isAdmin ? \`
                <div class="admin-card-actions">
                  <button class="admin-btn admin-btn-promote" onclick="togglePromote(\${post.id}, \${!isPromoted})">
                    \${isPromoted ? '⭐ Unfeature' : '⭐ Promote'}
                  </button>
                  <button class="admin-btn" onclick="openAnalyticsModal(\${post.id}, '\${escapeHtml(post.title)}')">
                    📊 Stats (\${post.view_count || 0})
                  </button>
                  <button class="admin-btn" onclick="togglePostStatus(\${post.id}, '\${post.status}')">
                    \${post.status === 'published' ? '📝 Draft' : '🚀 Publish'}
                  </button>
                  <button class="admin-btn admin-btn-delete" onclick="deletePostItem(\${post.id})">
                    🗑️ Delete
                  </button>
                </div>
              \` : ''}

              <h2 class="post-title">\${escapeHtml(post.title)}</h2>
              <div class="post-meta">
                <span>📅 \${dateStr}</span>
                <span>• 👁️ \${post.view_count || 0} views</span>
              </div>

              <div class="post-actions-row">
                <div class="social-counters">
                  <button class="action-btn btn-like" onclick="handleLikeClick(\${post.id}, this)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    <span class="like-count">\${post.like_count || 0}</span>
                  </button>

                  <button class="action-btn" onclick="openCommentsModal(\${post.id})">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    <span>\${post.comment_count || 0}</span>
                  </button>
                </div>

                <div class="post-buttons-group">
                  \${post.direct_link ? \`
                    <a href="\${escapeHtml(post.direct_link)}" target="_blank" class="btn-direct-link" onclick="trackLinkClick(\${post.id}, '\${escapeHtml(post.direct_link_title || 'Direct Link')}')">
                      <span>\${escapeHtml(post.direct_link_title || '🔗 Link')}</span>
                    </a>
                  \` : ''}

                  <a href="\${botLink}" target="_blank" class="btn-open-bot">
                    <span>Open in Bot</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        \`;
      }).join('');
    }

    function trackLinkClick(postId, linkTitle) {
      if (!currentUser) return;
      fetch(\`\${API_BASE_URL}/api/posts/\${postId}/access-log\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name: linkTitle,
          user_id: currentUser.id,
          username: currentUser.username,
          first_name: currentUser.first_name
        })
      }).catch(() => {});
    }

    // =========================================================
    // ADMIN ACTIONS (Promote, Status, Delete, Moderation)
    // =========================================================
    async function togglePromote(postId, isPromoted) {
      if (!isAdmin) return;
      try {
        const res = await fetch(\`\${API_BASE_URL}/api/admin/posts/\${postId}/promote\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: currentUser.id, is_promoted: isPromoted })
        });
        if (!res.ok) throw new Error('Promote failed');
        showToast(isPromoted ? '⭐ Post Featured & Pinned!' : 'Post unpromoted');
        loadPosts();
      } catch (e) {
        showToast('Error updating promotion');
      }
    }

    async function togglePostStatus(postId, currentStatus) {
      if (!isAdmin) return;
      try {
        const res = await fetch(\`\${API_BASE_URL}/api/admin/posts/\${postId}/toggle\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: currentUser.id, status: currentStatus })
        });
        if (!res.ok) throw new Error('Action failed');
        showToast('Status updated!');
        loadPosts();
      } catch (e) {
        showToast('Error updating status');
      }
    }

    async function deletePostItem(postId) {
      if (!isAdmin) return;
      if (!confirm('Are you sure you want to delete this post?')) return;
      try {
        const res = await fetch(\`\${API_BASE_URL}/api/admin/posts/\${postId}?user_id=\${currentUser.id}\`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error('Delete failed');
        showToast('Post deleted!');
        loadPosts();
      } catch (e) {
        showToast('Error deleting post');
      }
    }

    async function moderateCommentAction(commentId, action) {
      if (!isAdmin) return;
      try {
        const res = await fetch(\`\${API_BASE_URL}/api/comments/moderate\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comment_id: commentId, user_id: currentUser.id, action })
        });
        if (!res.ok) throw new Error('Moderation failed');
        showToast(\`Comment \${action === 'delete' ? 'deleted' : action === 'hide' ? 'hidden' : 'visible'}!\`);
        openCommentsModal(currentModalPostId);
        loadPosts();
      } catch (e) {
        showToast('Error moderating comment');
      }
    }

    // =========================================================
    // ADMIN ANALYTICS MODAL
    // =========================================================
    async function openAnalyticsModal(postId, postTitle) {
      if (!isAdmin) return;
      const modal = document.getElementById('analyticsModal');
      const titleEl = document.getElementById('analyticsPostTitle');
      const listEl = document.getElementById('analyticsList');

      modal.classList.add('active');
      titleEl.textContent = 'Analytics: ' + postTitle;
      listEl.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">Loading stats...</div>';

      try {
        const res = await fetch(\`\${API_BASE_URL}/api/admin/posts/\${postId}/analytics?user_id=\${currentUser.id}\`);
        if (!res.ok) throw new Error('Failed to load analytics');

        const data = await res.json();
        currentAnalyticsData = data.analytics;

        document.getElementById('statViews').textContent = (currentAnalyticsData.views || []).length;
        document.getElementById('statAccesses').textContent = (currentAnalyticsData.accesses || []).length;
        document.getElementById('statLikes').textContent = (currentAnalyticsData.likes || []).length;

        renderAnalyticsTabContent();
      } catch (e) {
        listEl.innerHTML = '<div style="color: #f87171; text-align: center;">Failed to load analytics.</div>';
      }
    }

    function renderAnalyticsTabContent() {
      const listEl = document.getElementById('analyticsList');
      if (!currentAnalyticsData) return;

      if (currentAnalyticsTab === 'views') {
        const views = currentAnalyticsData.views || [];
        if (views.length === 0) {
          listEl.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">No view logs recorded yet.</div>';
          return;
        }
        listEl.innerHTML = views.map(v => \`
          <div class="log-item">
            <div class="log-user-info">
              <span style="font-weight: 700; color: var(--primary);">👤 \${escapeHtml(v.first_name || 'User')}</span>
              \${v.username ? \`<span style="color: var(--text-muted);">(@\${escapeHtml(v.username)})</span>\` : ''}
            </div>
            <span style="color: var(--text-muted); font-size: 0.72rem;">\${new Date(v.viewed_at).toLocaleString()}</span>
          </div>
        \`).join('');
      } else if (currentAnalyticsTab === 'accesses') {
        const accesses = currentAnalyticsData.accesses || [];
        if (accesses.length === 0) {
          listEl.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">No downloads or link clicks recorded yet.</div>';
          return;
        }
        listEl.innerHTML = accesses.map(a => \`
          <div class="log-item">
            <div>
              <div class="log-user-info">
                <span style="font-weight: 700; color: #4ade80;">📥 \${escapeHtml(a.first_name || 'User')}</span>
                \${a.username ? \`<span style="color: var(--text-muted);">(@\${escapeHtml(a.username)})</span>\` : ''}
              </div>
              <div style="font-size: 0.75rem; color: #cbd5e1; margin-top: 2px;">Item: <b>\${escapeHtml(a.item_name)}</b></div>
            </div>
            <span style="color: var(--text-muted); font-size: 0.72rem;">\${new Date(a.accessed_at).toLocaleString()}</span>
          </div>
        \`).join('');
      } else if (currentAnalyticsTab === 'likes') {
        const likes = currentAnalyticsData.likes || [];
        if (likes.length === 0) {
          listEl.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">No likes yet.</div>';
          return;
        }
        listEl.innerHTML = likes.map(l => \`
          <div class="log-item">
            <div class="log-user-info">
              <span style="font-weight: 700; color: var(--accent-heart);">❤️ \${escapeHtml(l.first_name || 'User')}</span>
              \${l.username ? \`<span style="color: var(--text-muted);">(@\${escapeHtml(l.username)})</span>\` : ''}
            </div>
            <span style="color: var(--text-muted); font-size: 0.72rem;">\${new Date(l.created_at).toLocaleString()}</span>
          </div>
        \`).join('');
      }
    }

    // =========================================================
    // LIKE TOGGLE HANDLER
    // =========================================================
    async function handleLikeClick(postId, btnElement) {
      if (!currentUser) {
        showToast('Please login to like this post!');
        promptTelegramLogin();
        return;
      }

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }

      try {
        const res = await fetch(\`\${API_BASE_URL}/api/likes\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            post_id: postId,
            user_id: currentUser.id
          })
        });

        if (!res.ok) throw new Error('Failed to toggle like');
        const data = await res.json();

        const countSpan = btnElement.querySelector('.like-count');
        if (countSpan) countSpan.textContent = data.like_count;
        
        if (data.liked) {
          btnElement.classList.add('liked');
        } else {
          btnElement.classList.remove('liked');
        }

      } catch (err) {
        console.error('Like error:', err);
        showToast('Error updating like.');
      }
    }

    // =========================================================
    // COMMENTS MODAL HANDLERS
    // =========================================================
    async function openCommentsModal(postId) {
      currentModalPostId = postId;
      const modal = document.getElementById('commentsModal');
      const commentsList = document.getElementById('commentsList');
      const modalTitle = document.getElementById('modalPostTitle');
      const foldersContainer = document.getElementById('foldersContainer');

      modal.classList.add('active');
      modalTitle.textContent = 'Post Details & Comments';
      commentsList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted);">Loading comments...</div>';

      try {
        const userIdParam = currentUser ? \`?user_id=\${currentUser.id}\` : '';
        const res = await fetch(\`\${API_BASE_URL}/api/posts/\${postId}\${userIdParam}\`);
        if (!res.ok) throw new Error('Failed to fetch post details');

        const data = await res.json();
        const post = data.post;
        modalTitle.textContent = post.title;

        if (post.folders && post.folders.length > 0) {
          foldersContainer.style.display = 'block';
          foldersContainer.innerHTML = \`
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px; font-weight: 600;">Available Folders:</div>
            <div class="folders-badge-container">
              \${post.folders.map(f => \`<span class="folder-badge">📁 \${escapeHtml(f.name)} (\${f.files ? f.files.length : 0} items)</span>\`).join('')}
            </div>
          \`;
        } else {
          foldersContainer.style.display = 'none';
        }

        renderCommentsList(post.comments || []);
      } catch (err) {
        console.error('Failed to load comments:', err);
        commentsList.innerHTML = '<div style="color: #f87171; text-align: center; padding: 10px;">Failed to load comments.</div>';
      }
    }

    function renderCommentsList(comments) {
      const commentsList = document.getElementById('commentsList');
      if (!comments || comments.length === 0) {
        commentsList.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">No comments yet. Be the first to leave a comment!</div>';
        return;
      }

      commentsList.innerHTML = comments.map(c => {
        const timeStr = c.created_at ? new Date(c.created_at).toLocaleString() : '';
        return \`
          <div class="comment-item \${c.is_hidden ? 'is-hidden' : ''}">
            <div class="comment-author">
              <span class="comment-username">@\${escapeHtml(c.username)} \${c.is_hidden ? '<span style="color:#f87171; font-size:0.75rem;">(Hidden from users)</span>' : ''}</span>
              <span class="comment-time">\${timeStr}</span>
            </div>
            <div class="comment-text">\${escapeHtml(c.text)}</div>
            
            \${isAdmin ? \`
              <div class="comment-admin-actions">
                <button class="comment-mod-btn" onclick="moderateCommentAction(\${c.id}, '\${c.is_hidden ? 'unhide' : 'hide'}')">
                  \${c.is_hidden ? '👁️ Unhide' : '🚫 Hide'}
                </button>
                <button class="comment-mod-btn" style="color: #f87171;" onclick="moderateCommentAction(\${c.id}, 'delete')">
                  🗑️ Delete
                </button>
              </div>
            \` : ''}
          </div>
        \`;
      }).join('');
    }

    // =========================================================
    // EVENT LISTENERS
    // =========================================================
    function setupEventListeners() {
      // Admin filter tabs
      document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
          document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
          e.target.classList.add('active');
          currentFilter = e.target.getAttribute('data-filter');
          filterAndRenderPosts();
        });
      });

      // Analytics tabs
      document.querySelectorAll('.analytics-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('.analytics-tab-btn').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          currentAnalyticsTab = e.target.getAttribute('data-atab');
          renderAnalyticsTabContent();
        });
      });

      // Refresh Button
      document.getElementById('btnRefresh').addEventListener('click', () => {
        showToast('Refreshing...');
        loadPosts();
      });

      // Search Filter
      document.getElementById('searchInput').addEventListener('input', () => {
        filterAndRenderPosts();
      });

      // Close Modals
      document.getElementById('btnModalClose').addEventListener('click', () => {
        document.getElementById('commentsModal').classList.remove('active');
      });

      document.getElementById('btnAnalyticsClose').addEventListener('click', () => {
        document.getElementById('analyticsModal').classList.remove('active');
      });

      document.getElementById('commentsModal').addEventListener('click', (e) => {
        if (e.target.id === 'commentsModal') {
          document.getElementById('commentsModal').classList.remove('active');
        }
      });

      document.getElementById('analyticsModal').addEventListener('click', (e) => {
        if (e.target.id === 'analyticsModal') {
          document.getElementById('analyticsModal').classList.remove('active');
        }
      });

      // Submit Comment
      document.getElementById('commentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) {
          showToast('Please login to comment!');
          promptTelegramLogin();
          return;
        }

        const input = document.getElementById('commentTextInput');
        const text = input.value.trim();
        if (!text || !currentModalPostId) return;

        try {
          const res = await fetch(\`\${API_BASE_URL}/api/comments\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              post_id: currentModalPostId,
              user_id: currentUser.id,
              username: currentUser.username || currentUser.first_name,
              text
            })
          });

          if (!res.ok) throw new Error('Failed to post comment');
          input.value = '';
          showToast('Comment posted!');
          
          openCommentsModal(currentModalPostId);
          loadPosts();
        } catch (err) {
          console.error('Comment submit error:', err);
          showToast('Error posting comment.');
        }
      });
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2500);
    }

    window.addEventListener('DOMContentLoaded', init);
  </script>
</body>
</html>`;
}
