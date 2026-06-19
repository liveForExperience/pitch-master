/**
 * Strings are organized by namespace. Keys are stable; values may differ in
 * length per locale (English is often shorter). `{name}` placeholders are
 * replaced at runtime via i18n.ts → t().
 *
 * When adding new UI strings:
 *   1. Pick a namespace (page or component).
 *   2. Add `zh` first, then `en`.
 *   3. Keep both arrays in sync — missing `en` falls back to the `zh` value.
 */
export type Dict = Record<string, string>;

export const zh: Dict = {
  // ── common ───────────────────────────────────────────────────────────
  'common.back': '返回',
  'common.cancel': '取消',
  'common.close': '关闭',
  'common.confirm': '确认',
  'common.copy': '复制',
  'common.copied': '链接已复制',
  'common.delete': '删除',
  'common.edit': '修改',
  'common.loading': '加载中…',
  'common.next': '下一步',
  'common.retry': '重试',
  'common.save': '保存',
  'common.add': '添加',
  'common.adding': '添加中…',
  'common.redirecting': '正在跳转…',
  'common.share': '分享',
  'common.error.generic': '操作失败',
  'common.error.network':
    '无法连接服务器，请检查网络或确认后端已启动（bash bin/dev.sh）',
  'common.error.posterLoad': '海报加载失败',
  'common.error.clipboard': '当前环境无法复制到剪贴板',
  'common.error.share': '分享失败',
  'common.error.prepareShare': '准备分享…',

  // ── settings ─────────────────────────────────────────────────────────
  'settings.title': '偏好设置',
  'settings.subtitle': '语言与外观会保存在本机。',
  'settings.language': '语言',
  'settings.language.zh': '中文',
  'settings.language.en': 'English',
  'settings.theme': '外观',
  'settings.theme.light': '亮色',
  'settings.theme.dark': '夜间',
  'settings.openLabel': '打开设置',

  // ── shell / nav ──────────────────────────────────────────────────────
  'shell.back': '← 返回',

  // ── home ─────────────────────────────────────────────────────────────
  'home.title': 'PitchMaster',
  'home.newEvent': '新建活动',
  'home.join.title': '加入活动',
  'home.join.hint': '输入管理员分享的 6 位分享码，只读观看比分与比赛进度。',
  'home.join.placeholder': '例如 A4F9KQ',
  'home.join.button': '进入',
  'home.restore.title': '找回管理权限',
  'home.restore.hint': '换设备后输入分享码和 PIN，可重新获得录入与配置权限。',
  'home.restore.link': '凭 PIN 恢复管理',
  'home.ongoing.title': '进行中的活动',
  'home.ongoing.hint': '本机最近创建或访问的活动；手动「结束活动」后才会归档。',
  'home.ongoing.empty': '暂无进行中的活动，可新建或输入分享码加入。',
  'home.archived.title': '已归档',
  'home.archived.titleWithCount': '已归档 · {count}',
  'home.archived.hint': '已结束的活动记录',
  'home.archived.empty': '暂无已结束的活动。',
  'home.expand': '展开',
  'home.collapse': '收起',

  // ── new event ────────────────────────────────────────────────────────
  'newEvent.title': '新建活动',
  'newEvent.step1.label': '活动名称',
  'newEvent.step1.placeholder': '周二夜场',
  'newEvent.step2.label': '参与队伍数',
  'newEvent.step3.hint': '给每支队伍起个名字',
  'newEvent.step3.creating': '创建中…',
  'newEvent.step3.submit': '创建活动',
  'newEvent.step4.continue': '已截图保存，继续配置队员',
  'newEvent.step4.continuing': '配置队伍中…',
  'newEvent.error.create': '创建失败',
  'newEvent.error.teams': '创建队伍失败',
  'newEvent.defaults.teamA': '红队',
  'newEvent.defaults.teamB': '蓝队',
  'newEvent.defaults.team': '队伍 {n}',

  // ── credentials card ─────────────────────────────────────────────────
  'cred.savePrompt': '请截图保存一下凭证',
  'cred.defaultHint':
    '换手机后需用分享码 + PIN 找回管理权限；分享码也可发给其他人只读观看。',
  'cred.adminHint':
    '把分享码发给其他人只读观看；PIN 仅保存在本机，换设备需用截图或首页「找回管理权限」。',
  'cred.shareCode': '分享码',
  'cred.pin': '6 位 PIN',

  // ── admin restore ────────────────────────────────────────────────────
  'restore.title': '找回管理权限',
  'restore.hintBase': '换手机或清过浏览器数据后，用创建活动时保存的',
  'restore.hintWithPrefill': ' 即可重新获得录入权限（分享码已自动填入）。',
  'restore.hintNoPrefill': ' 与分享码可重新获得录入权限。',
  'restore.label.shortCode': '分享码',
  'restore.label.pin': '6 位 PIN',
  'restore.pinPlaceholder': '创建活动时显示的 PIN',
  'restore.shortCodePlaceholder': '例如 A4F9KQ',
  'restore.error.format': '请输入分享码和 6 位 PIN',
  'restore.error.wrongPin': '未能恢复管理权限，请确认 PIN 是否正确',
  'restore.error.retry': '恢复失败，请稍后再试',
  'restore.submit': '恢复管理权限',
  'restore.verifying': '验证中…',
  'restore.viewerHint': '只有观看、不需要录入？',
  'restore.viewerLink': '返回首页加入活动',
  'restore.success.title': '已恢复管理权限',
  'restore.success.desc': '「{name}」已可在本机录入比分与配置队员。',
  'restore.success.descFallback': '本机已重新获得管理权限。',
  'restore.success.enter': '进入活动',

  // ── event page ───────────────────────────────────────────────────────
  'event.fallbackTitle': '活动',
  'event.notFound.title': '找不到活动',
  'event.notFound.body':
    '分享码 {code} 打不开这场活动。',
  'event.notFound.hint':
    '请核对是否输错；若活动已结束较久或换过手机，也可能需要重新创建。',
  'event.notFound.create': '新建活动',
  'event.notFound.home': '返回首页',
  'event.loading': '加载中…',
  'event.viewer.title': '只读观看模式',
  'event.viewer.bodyA': '你通过分享码进入，只能查看比分与比赛进度。新建比赛、配置队员需管理员权限；若你是管理员，可',
  'event.viewer.restoreLink': '凭 PIN 找回',
  'event.viewer.bodyB': '。',
  'event.shareCode': '分享码',
  'event.noPinHint':
    '本机未保存 PIN，换设备后请用创建活动时的截图找回管理权限。',
  'event.games.title': '比赛列表',
  'event.games.share': '分享战报',
  'event.games.new': '新建场次',
  'event.games.emptyAdmin': '还没有比赛，点右上角新建场次。',
  'event.games.emptyViewer': '还没有比赛。',
  'event.games.adminSuffix': ' · 管理',
  'event.games.viewerSuffix': ' · 只读观看',
  'event.setupCta': '配置队伍与队员',
  'event.finish': '结束活动',
  'event.teams.title': '参赛队伍',
  'event.teams.empty': '尚未配置队伍',
  'event.teams.noRoster': '暂无队员',
  'event.finish.title': '结束这场活动？',
  'event.finish.desc':
    '结束后活动会移入首页「已归档」，仍可查看历史比分，但不能再新建比赛或录入。',
  'event.finish.confirm': '确认结束',
  'event.finish.processing': '处理中…',
  'event.finish.error': '结束活动失败',

  // ── event setup ──────────────────────────────────────────────────────
  'setup.title': '队伍配置',
  'setup.newTeamPlaceholder': '新队伍名称',
  'setup.addRosterPlaceholder': '输入队员名，逗号或换行分隔',
  'setup.addRoster': '添加队员',
  'setup.done': '完成，返回活动页',

  // ── roster import ────────────────────────────────────────────────────
  'roster.title': '快速导入报名名单',
  'roster.pending': '{count} 人待分配',
  'roster.help':
    '从微信群复制接龙文本粘贴到下方，每行序号后内容即一名球员（含 emoji、+1、门 等后缀原样保留）。',
  'roster.placeholder': '1. 张三\n2. 李四\n…',
  'roster.parse': '解析并加入名单',
  'roster.added': '已加入 {count} 人',
  'roster.skipped': '跳过 {count} 行',
  'roster.duplicates': '重复 {count} 人',
  'roster.empty.skipped': '未解析到球员，已跳过非名单行',
  'roster.empty.needText': '请先粘贴带序号的报名文本',
  'roster.poolHeader': '待分配球员',
  'roster.remove': '移除 {name}',

  // ── team import chips ────────────────────────────────────────────────
  'chips.title': '从导入名单添加到 {team}',
  'chips.allOnTeam': '导入名单中的球员已全部在本队，或名单已空。',
  'chips.addSelected': '添加选中的 {count} 人',
  'chips.adding': '添加中…',

  // ── new game ─────────────────────────────────────────────────────────
  'newGame.title': '新建场次',
  'newGame.teamA': '主队 (A)',
  'newGame.teamB': '客队 (B)',
  'newGame.duration': '比赛时长（分钟）',
  'newGame.needTeams': '请先在活动里配置至少两支队伍。',
  'newGame.error.notEnoughTeams': '至少需要两支队伍才能开赛',
  'newGame.error.sameTeam': '请选择两个不同的队伍',
  'newGame.error.minDuration': '比赛时长至少 1 分钟',
  'newGame.error.create': '创建失败',
  'newGame.submit': '创建比赛',

  // ── game record ──────────────────────────────────────────────────────
  'record.title': '录入',
  'record.statusFinished': '已结束',
  'record.statusLeft': '剩余',
  'record.pending': '有 {count} 条记录待同步…',
  'record.start': '开始比赛',
  'record.pause': '暂停',
  'record.resume': '继续',
  'record.finish': '结束',
  'record.postEdit.title': '赛后修正',
  'record.postEdit.body': '比赛已结束，可补录进球，或在下方修改/删除任意一条记录。',
  'record.goalA': 'A 队进球',
  'record.goalB': 'B 队进球',
  'record.goalAFix': '{name} 补录',
  'record.feedHint': '点击「修改」或「删除」可调整任意一条进球记录',
  'record.viewDetail': '查看详情（只读链接可分享）',
  'record.error.delete': '删除失败',
  'record.editor.holding': '你正在控制计时（设备 {tail}）· 记球无需独占',
  'record.editor.other': '设备 {tail} 正在控制计时 · 你仍可记球',
  'record.editor.readonly': '申请计时控制权后可开始/暂停；记球随时可用',
  'record.editor.claim': '申请计时控制',
  'record.editor.force': '接管计时',
  'record.editor.release': '释放计时控制',
  'record.editor.forceConfirm': '确定接管计时？原设备将无法开始/暂停。',

  // ── goal pick panel ──────────────────────────────────────────────────
  'pick.scorerEdit': '修改进球：重新选择球员',
  'pick.scorerSide': '选择进球球员 ({side} 队)',
  'pick.scoredBy': '{name} 进球',
  'pick.scoredByEdit': '修改{name} 进球',
  'pick.assistHint': '可选助攻（同队，可不选）',
  'pick.assist': '助攻 · {name}',
  'pick.confirmEdit': '确认修改',
  'pick.confirmNoAssist': '无助攻，确认进球',
  'pick.backToScorer': '返回改球员',

  // ── game event feed ──────────────────────────────────────────────────
  'feed.empty': '暂无记录',
  'feed.goal': '{side} {scorer} 进球',
  'feed.goalAssist': '{side} {scorer} 进球（助攻 {assistant}）',
  'feed.goalAnon': '{side} 进球',
  'feed.goalAnonNoSide': '进球',
  'feed.ownGoal': '{side} 乌龙球',
  'feed.ownGoalNoSide': '乌龙球',
  'feed.undo': '撤销',

  // ── result / status labels ───────────────────────────────────────────
  'result.win': '{team} 胜',
  'result.winA': 'A 队胜',
  'result.winB': 'B 队胜',
  'result.draw': '平局',
  'result.pending': '未结束',
  'status.READY': '待开始',
  'status.PLAYING': '进行中',
  'status.PAUSED': '暂停',
  'status.FINISHED': '已结束',

  // ── game detail ──────────────────────────────────────────────────────
  'detail.title': '比赛详情',
  'detail.editor.active': '计时设备 {tail}',
  'detail.editor.none': '暂无设备录入',
  'detail.finished': '已结束 · 用时 {elapsed}',
  'detail.elapsed': '已用 {elapsed} / {planned}',
  'detail.eventStream': '事件流',
  'detail.share.title': '分享单场战报',
  'detail.share.subject': '{teamA} vs {teamB} · 单场战报',
  'detail.share.preview': '打开战报 H5 预览',
  'detail.share.shortCode': '活动分享码',

  // ── reports (event & game) ───────────────────────────────────────────
  'reports.eventTitle': '活动战报',
  'reports.gameTitle': '单场战报',
  'reports.standings': '积分榜',
  'reports.standingsHeader.team': '队伍',
  'reports.standingsHeader.goals': '进/失',
  'reports.standingsHeader.points': '分',
  'reports.leaderboards': '个人榜',
  'reports.topScorers': 'TOP SCORERS · 进球',
  'reports.topAssists': 'TOP ASSISTS · 助攻',
  'reports.emptyLeader': '暂无数据',
  'reports.fixtures': '场次结果',
  'reports.fixturesMeta': '{count} 场已结束',
  'reports.fixtures.elapsed': '用时 {elapsed}',
  'reports.fixtures.inProgress': '进行中',
  'reports.fixtures.draw': '平局',
  'reports.fixtures.pending': '未结束',
  'reports.fixtures.winner': '{team} 胜',
  'reports.poster': '海报版战报',
  'reports.backToEvent': '← 返回活动主页',
  'reports.goals': '进球流水',
  'reports.goalsMeta': '{count} 球',
  'reports.goals.empty': '暂无进球记录',
  'reports.mvp': 'MATCH MVP',
  'reports.gameDuration': '· 用时 {elapsed}',
  'reports.gameInProgress': '比赛进行中',
  'reports.verdictWins': 'wins',
  'reports.verdictDraw': 'Draw',
  'reports.ownGoalTag': '（乌龙）',
  'reports.assist': '助攻 · {name}',
  'reports.gotoDetail': '比赛详情 →',
  'reports.gotoEventReport': '活动战报 →',

  // ── share ────────────────────────────────────────────────────────────
  'share.label': '分享战报',
  'share.preparing': '准备分享…',
  'share.copied': '链接已复制',
  'share.event.copy': '{name} 活动战报 · 分享码 {code}',
  'share.game.copy': '{teamA} {scoreA}:{scoreB} {teamB} · 单场战报',
  'share.openH5': '打开战报 H5 预览',
  'poster.tapToShare': '点击图片分享',
  'poster.fallback': '海报',
  'poster.imageAlt': '海报预览',
  'poster.shareAlt': '{title} · 点击分享',
  'poster.download': 'DOWNLOAD ↓',

  // ── offline ──────────────────────────────────────────────────────────
  'offline.line1': '离线模式 · 进球/撤销会暂存本机，恢复网络后自动同步',
  'offline.lineN.pending': '{count} 条待同步',
  'offline.lineN.syncing': ' · 同步中…',
  'offline.lineN.willUpload': ' · 联网后将自动上传',

  // ── poster (server-side rendered, not used in SPA dict, kept for tests) ──
};

export const en: Dict = {
  // ── common ───────────────────────────────────────────────────────────
  'common.back': 'Back',
  'common.cancel': 'Cancel',
  'common.close': 'Close',
  'common.confirm': 'Confirm',
  'common.copy': 'Copy',
  'common.copied': 'Link copied',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.loading': 'Loading…',
  'common.next': 'Next',
  'common.retry': 'Retry',
  'common.save': 'Save',
  'common.add': 'Add',
  'common.adding': 'Adding…',
  'common.redirecting': 'Redirecting…',
  'common.share': 'Share',
  'common.error.generic': 'Operation failed',
  'common.error.network':
    'Cannot reach the server. Check your network or restart the backend (bash bin/dev.sh).',
  'common.error.posterLoad': 'Failed to load poster',
  'common.error.clipboard': 'Clipboard is unavailable in this environment',
  'common.error.share': 'Share failed',
  'common.error.prepareShare': 'Preparing share…',

  // ── settings ─────────────────────────────────────────────────────────
  'settings.title': 'Preferences',
  'settings.subtitle': 'Language and theme are saved on this device.',
  'settings.language': 'Language',
  'settings.language.zh': '中文',
  'settings.language.en': 'English',
  'settings.theme': 'Theme',
  'settings.theme.light': 'Light',
  'settings.theme.dark': 'Dark',
  'settings.openLabel': 'Open settings',

  // ── shell / nav ──────────────────────────────────────────────────────
  'shell.back': '← Back',

  // ── home ─────────────────────────────────────────────────────────────
  'home.title': 'PitchMaster',
  'home.newEvent': 'New event',
  'home.join.title': 'Join an event',
  'home.join.hint':
    'Enter the 6-character share code from the organizer to follow the score read-only.',
  'home.join.placeholder': 'e.g. A4F9KQ',
  'home.join.button': 'Enter',
  'home.restore.title': 'Restore admin access',
  'home.restore.hint':
    'Switching devices? Enter the share code and PIN to regain recording rights.',
  'home.restore.link': 'Restore with PIN',
  'home.ongoing.title': 'Ongoing events',
  'home.ongoing.hint':
    'Events you recently created or visited on this device. Only archived after you tap "Finish event".',
  'home.ongoing.empty':
    'No events in progress yet. Create one or join with a share code.',
  'home.archived.title': 'Archived',
  'home.archived.titleWithCount': 'Archived · {count}',
  'home.archived.hint': 'Finished events',
  'home.archived.empty': 'No archived events yet.',
  'home.expand': 'Expand',
  'home.collapse': 'Collapse',

  // ── new event ────────────────────────────────────────────────────────
  'newEvent.title': 'New event',
  'newEvent.step1.label': 'Event name',
  'newEvent.step1.placeholder': 'Tuesday night',
  'newEvent.step2.label': 'Number of teams',
  'newEvent.step3.hint': 'Name each team',
  'newEvent.step3.creating': 'Creating…',
  'newEvent.step3.submit': 'Create event',
  'newEvent.step4.continue': 'Screenshot saved — continue to roster',
  'newEvent.step4.continuing': 'Creating teams…',
  'newEvent.error.create': 'Create failed',
  'newEvent.error.teams': 'Failed to create teams',
  'newEvent.defaults.teamA': 'Reds',
  'newEvent.defaults.teamB': 'Blues',
  'newEvent.defaults.team': 'Team {n}',

  // ── credentials card ─────────────────────────────────────────────────
  'cred.savePrompt': 'Take a screenshot of your credentials',
  'cred.defaultHint':
    'You need the share code + PIN to restore admin access on a new device. The share code can also be sent to viewers.',
  'cred.adminHint':
    'Share the code with viewers (read-only). The PIN lives only on this device — keep a screenshot or use "Restore admin access" on the home page.',
  'cred.shareCode': 'Share code',
  'cred.pin': '6-digit PIN',

  // ── admin restore ────────────────────────────────────────────────────
  'restore.title': 'Restore admin access',
  'restore.hintBase':
    'Switched phones or cleared browser data? Use the PIN you saved at creation',
  'restore.hintWithPrefill':
    ' to regain recording rights (share code is pre-filled).',
  'restore.hintNoPrefill':
    ' along with the share code to regain recording rights.',
  'restore.label.shortCode': 'Share code',
  'restore.label.pin': '6-digit PIN',
  'restore.pinPlaceholder': 'PIN shown when creating the event',
  'restore.shortCodePlaceholder': 'e.g. A4F9KQ',
  'restore.error.format': 'Enter the share code and 6-digit PIN',
  'restore.error.wrongPin': 'Could not restore — check the PIN and try again',
  'restore.error.retry': 'Restore failed, please try again later',
  'restore.submit': 'Restore admin access',
  'restore.verifying': 'Verifying…',
  'restore.viewerHint': 'Just watching, not recording?',
  'restore.viewerLink': 'Go back to home and join',
  'restore.success.title': 'Admin access restored',
  'restore.success.desc': 'You can now record scores and edit teams for "{name}".',
  'restore.success.descFallback': 'This device has admin rights again.',
  'restore.success.enter': 'Open event',

  // ── event page ───────────────────────────────────────────────────────
  'event.fallbackTitle': 'Event',
  'event.notFound.title': 'Event not found',
  'event.notFound.body': 'Share code {code} does not open any event.',
  'event.notFound.hint':
    'Double-check the code. If the event ended long ago or you switched phones, you may need to create a new one.',
  'event.notFound.create': 'Create event',
  'event.notFound.home': 'Back to home',
  'event.loading': 'Loading…',
  'event.viewer.title': 'Read-only viewer mode',
  'event.viewer.bodyA':
    'You opened this event with a share code, so you can only watch the score and timer. Admin rights are required to create games or edit rosters; if you are the admin, you can',
  'event.viewer.restoreLink': 'restore with PIN',
  'event.viewer.bodyB': '.',
  'event.shareCode': 'Share code',
  'event.noPinHint':
    'No PIN saved on this device. Use the screenshot from when the event was created to restore admin access on another device.',
  'event.games.title': 'Games',
  'event.games.share': 'Share report',
  'event.games.new': 'New game',
  'event.games.emptyAdmin': 'No games yet — tap "New game" in the top right.',
  'event.games.emptyViewer': 'No games yet.',
  'event.games.adminSuffix': ' · admin',
  'event.games.viewerSuffix': ' · read-only',
  'event.setupCta': 'Configure teams & roster',
  'event.finish': 'Finish event',
  'event.teams.title': 'Teams',
  'event.teams.empty': 'No teams configured yet',
  'event.teams.noRoster': 'No players yet',
  'event.finish.title': 'Finish this event?',
  'event.finish.desc':
    'Once finished, the event moves to "Archived" on the home page. You can still view past scores but cannot create new games or record events.',
  'event.finish.confirm': 'Confirm finish',
  'event.finish.processing': 'Processing…',
  'event.finish.error': 'Failed to finish event',

  // ── event setup ──────────────────────────────────────────────────────
  'setup.title': 'Roster setup',
  'setup.newTeamPlaceholder': 'New team name',
  'setup.addRosterPlaceholder': 'Player names, separated by comma or new line',
  'setup.addRoster': 'Add players',
  'setup.done': 'Done — back to event',

  // ── roster import ────────────────────────────────────────────────────
  'roster.title': 'Quick import from signup text',
  'roster.pending': '{count} pending',
  'roster.help':
    'Paste your WeChat signup list below. Each numbered line becomes one player (emoji, "+1", suffixes kept verbatim).',
  'roster.placeholder': '1. Alice\n2. Bob\n…',
  'roster.parse': 'Parse & add to pool',
  'roster.added': 'Added {count}',
  'roster.skipped': 'Skipped {count} line(s)',
  'roster.duplicates': '{count} duplicate(s)',
  'roster.empty.skipped':
    'No players parsed — non-roster lines were skipped',
  'roster.empty.needText': 'Paste numbered signup text first',
  'roster.poolHeader': 'Players to assign',
  'roster.remove': 'Remove {name}',

  // ── team import chips ────────────────────────────────────────────────
  'chips.title': 'Assign from import pool to {team}',
  'chips.allOnTeam':
    'Everyone in the pool is already on this team, or the pool is empty.',
  'chips.addSelected': 'Add selected ({count})',
  'chips.adding': 'Adding…',

  // ── new game ─────────────────────────────────────────────────────────
  'newGame.title': 'New game',
  'newGame.teamA': 'Home (A)',
  'newGame.teamB': 'Away (B)',
  'newGame.duration': 'Match length (minutes)',
  'newGame.needTeams': 'Configure at least two teams in the event first.',
  'newGame.error.notEnoughTeams': 'At least two teams are required to start',
  'newGame.error.sameTeam': 'Pick two different teams',
  'newGame.error.minDuration': 'Match length must be at least 1 minute',
  'newGame.error.create': 'Create failed',
  'newGame.submit': 'Create game',

  // ── game record ──────────────────────────────────────────────────────
  'record.title': 'Record',
  'record.statusFinished': 'FINISHED',
  'record.statusLeft': 'LEFT',
  'record.pending': '{count} record(s) pending sync…',
  'record.start': 'Start match',
  'record.pause': 'Pause',
  'record.resume': 'Resume',
  'record.finish': 'Finish',
  'record.postEdit.title': 'Post-match edits',
  'record.postEdit.body':
    'The match is over. You can still add or remove goals below.',
  'record.goalA': 'Goal · A',
  'record.goalB': 'Goal · B',
  'record.goalAFix': 'Add for {name}',
  'record.feedHint': 'Tap "Edit" or "Delete" to adjust any goal',
  'record.viewDetail': 'Open detail (shareable read-only)',
  'record.error.delete': 'Delete failed',
  'record.editor.holding': 'You control the timer ({tail}) · scoring is shared',
  'record.editor.other': 'Device {tail} controls the timer · you can still score',
  'record.editor.readonly': 'Claim the timer to start/pause; scoring is always available',
  'record.editor.claim': 'Claim timer',
  'record.editor.force': 'Take timer',
  'record.editor.release': 'Release timer',
  'record.editor.forceConfirm':
    'Take over the timer? The other device will not be able to start/pause.',

  // ── goal pick panel ──────────────────────────────────────────────────
  'pick.scorerEdit': 'Edit goal: pick scorer again',
  'pick.scorerSide': 'Pick scorer ({side})',
  'pick.scoredBy': '{name} scored',
  'pick.scoredByEdit': 'Edit · {name} scored',
  'pick.assistHint': 'Optional assist (same team)',
  'pick.assist': 'Assist · {name}',
  'pick.confirmEdit': 'Save edit',
  'pick.confirmNoAssist': 'No assist · confirm goal',
  'pick.backToScorer': 'Pick scorer again',

  // ── game event feed ──────────────────────────────────────────────────
  'feed.empty': 'No records yet',
  'feed.goal': '{side} · {scorer} scored',
  'feed.goalAssist': '{side} · {scorer} scored (assist {assistant})',
  'feed.goalAnon': '{side} scored',
  'feed.goalAnonNoSide': 'Goal',
  'feed.ownGoal': '{side} · own goal',
  'feed.ownGoalNoSide': 'Own goal',
  'feed.undo': 'Undo',

  // ── result / status labels ───────────────────────────────────────────
  'result.win': '{team} wins',
  'result.winA': 'Team A wins',
  'result.winB': 'Team B wins',
  'result.draw': 'Draw',
  'result.pending': 'In progress',
  'status.READY': 'Ready',
  'status.PLAYING': 'Playing',
  'status.PAUSED': 'Paused',
  'status.FINISHED': 'Finished',

  // ── game detail ──────────────────────────────────────────────────────
  'detail.title': 'Game detail',
  'detail.editor.active': 'Timer · device {tail}',
  'detail.editor.none': 'No active recorder',
  'detail.finished': 'Finished · {elapsed}',
  'detail.elapsed': '{elapsed} / {planned}',
  'detail.eventStream': 'Event stream',
  'detail.share.title': 'Share this game',
  'detail.share.subject': '{teamA} vs {teamB} · Game report',
  'detail.share.preview': 'Open report (H5)',
  'detail.share.shortCode': 'Event share code',

  // ── reports (event & game) ───────────────────────────────────────────
  'reports.eventTitle': 'Event report',
  'reports.gameTitle': 'Game report',
  'reports.standings': 'Standings',
  'reports.standingsHeader.team': 'Team',
  'reports.standingsHeader.goals': 'GF/GA',
  'reports.standingsHeader.points': 'Pts',
  'reports.leaderboards': 'Leaderboards',
  'reports.topScorers': 'TOP SCORERS',
  'reports.topAssists': 'TOP ASSISTS',
  'reports.emptyLeader': 'No data yet',
  'reports.fixtures': 'Fixtures',
  'reports.fixturesMeta': '{count} finished',
  'reports.fixtures.elapsed': '{elapsed}',
  'reports.fixtures.inProgress': 'In progress',
  'reports.fixtures.draw': 'Draw',
  'reports.fixtures.pending': 'In progress',
  'reports.fixtures.winner': '{team} wins',
  'reports.poster': 'POSTER',
  'reports.backToEvent': '← Back to event',
  'reports.goals': 'Goals',
  'reports.goalsMeta': '{count}',
  'reports.goals.empty': 'No goals yet',
  'reports.mvp': 'MATCH MVP',
  'reports.gameDuration': '· {elapsed}',
  'reports.gameInProgress': 'In progress',
  'reports.verdictWins': 'wins',
  'reports.verdictDraw': 'Draw',
  'reports.ownGoalTag': ' (OG)',
  'reports.assist': 'Assist · {name}',
  'reports.gotoDetail': 'Detail →',
  'reports.gotoEventReport': 'Event report →',

  // ── share ────────────────────────────────────────────────────────────
  'share.label': 'Share report',
  'share.preparing': 'Preparing share…',
  'share.copied': 'Link copied',
  'share.event.copy': '{name} · event report · code {code}',
  'share.game.copy': '{teamA} {scoreA}:{scoreB} {teamB} · game report',
  'share.openH5': 'Open report (H5)',
  'poster.tapToShare': 'Tap image to share',
  'poster.fallback': 'Poster',
  'poster.imageAlt': 'Poster preview',
  'poster.shareAlt': '{title} · tap to share',
  'poster.download': 'DOWNLOAD ↓',

  // ── offline ──────────────────────────────────────────────────────────
  'offline.line1':
    'Offline · goals/undo are buffered locally and will sync when back online',
  'offline.lineN.pending': '{count} pending',
  'offline.lineN.syncing': ' · syncing…',
  'offline.lineN.willUpload': ' · will upload when online',
};

export const dicts: Record<'zh' | 'en', Dict> = { zh, en };
