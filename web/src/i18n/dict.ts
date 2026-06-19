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
  'settings.openLabel': '打开偏好设置',
  'settings.navTooltip': '点击切换语言与深色/亮色外观',

  'archived.openLabel': '查看已归档活动',
  'archived.navTooltip': '点击查看已结束的活动与历史比分',
  'archived.navTooltipWithCount': '点击查看 {count} 个已归档活动与历史比分',

  'restore.openLabel': '凭 PIN 恢复管理权限',
  'restore.navTooltip': '换设备后点此输入分享码和 PIN，重新获得录入与配置权限',

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
  'archived.search.placeholder': '搜索活动名称或分享码',
  'archived.search.empty': '没有匹配的活动。',
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
  'cred.sectionTitle': '活动凭证',
  'cred.savePrompt': '保存活动凭证',
  'cred.defaultHint': '复制下方文本发给队友。分享码用于只读观看，PIN 用于换设备找回录入权限。',
  'cred.adminHint': '复制或分享下方凭证。分享码可发给其他人只读观看，PIN 请勿公开。',
  'cred.shareCode': '分享码',
  'cred.pin': '6 位 PIN',
  'cred.copy': '复制凭证',
  'cred.copied': '已复制',
  'cred.share': '分享',
  'cred.shared': '已分享',
  'cred.shareSuccess.copied': '已复制，可粘贴到微信发送。',
  'cred.shareSuccess.shared': '已唤起系统分享面板。',
  'cred.shareWarning': '⚠️ PIN 是管理钥匙，只发给共同管理的人，勿发大群。',
  'cred.shareText.title': '【PitchMaster 球场记分】',
  'cred.shareText.titleWithName': '【PitchMaster 球场记分】{name}',
  'cred.shareText.viewerSection': '👀 看比分（可公开）',
  'cred.shareText.codeLine': '分享码：{code}',
  'cred.shareText.adminSection': '🔐 管理钥匙（勿公开）',
  'cred.shareText.pinLine': 'PIN：{pin}（换设备时凭 PIN + 分享码恢复管理权限）',

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
  'event.games.new': '新建场次',
  'event.games.emptyAdmin': '还没有比赛，点击下方按钮新建场次。',
  'event.games.emptyViewer': '还没有比赛。',
  'event.games.adminSuffix': ' · 管理',
  'event.games.viewerSuffix': ' · 只读观看',
  'event.games.tapAdmin': '录入',
  'event.games.tapViewer': '查看',
  'event.statusActive': '进行中',
  'event.statusEnded': '已结束',
  'event.setupCta': '配置队伍与队员',
  'event.setupSection': '准备比赛',
  'event.setupHint': '先配置两支队伍和队员，再新建场次。',
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
  'event.manageSection': '活动管理',
  'event.manageHint': '以下操作不可撤销，请确认后再执行。',
  'event.gameCount': '共 {n} 场比赛',
  'event.delete': '删除活动',
  'event.delete.title': '删除这场活动？',
  'event.delete.desc': '将永久删除活动、所有队伍、场次与记录，无法恢复。',
  'event.delete.confirm': '确认删除',
  'event.delete.processing': '删除中…',
  'event.delete.error': '删除活动失败',
  'event.games.delete': '删除场次',

  // ── event setup ──────────────────────────────────────────────────────
  'setup.title': '队伍配置',
  'setup.newTeamPlaceholder': '新队伍名称',
  'setup.addRosterPlaceholder': '手动添加队员',
  'setup.addRosterHint': '逗号或换行分隔多名球员',
  'setup.addRoster': '添加队员',
  'setup.addPlayersCount': '添加 {count} 人',
  'setup.addingPlayers': '添加中…',
  'setup.done': '完成，返回活动页',
  'setup.editTeamName': '修改队名',
  'setup.remove': '移出',
  'setup.removePlayer': '将 {name} 移出球队',
  'setup.removePlayerError': '该球员已有比赛记录，无法移出',
  'setup.noPlayersYet': '暂无队员',
  'setup.deleteTeam.aria': '删除球队 {name}',
  'setup.deleteTeam.title': '删除球队「{name}」？',
  'setup.deleteTeam.desc':
    '球队和该队全部队员都会被移除。若已在某场比赛里出场，则无法删除——请先删除对应比赛。已加入的队员会被退回到「待分配」池，可重新分配到其他队伍。',
  'setup.deleteTeam.confirm': '确认删除',
  'setup.deleteTeam.processing': '删除中…',
  'setup.deleteTeam.cannotDelete': '该球队已被某场比赛使用，请先删除对应比赛再删除球队',
  'setup.deleteTeam.error': '删除球队失败',

  // ── roster import ────────────────────────────────────────────────────
  'roster.title': '快速导入报名名单',
  'roster.subtitle': '专为微信群接龙文本优化',
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
  'roster.deleteFromPool': '从名单删除 {name}',
  'roster.example.title': '微信群接龙是这样的',
  'roster.example.lead':
    '把群里整段接龙文本复制粘贴进来即可，emoji、+1、门将后缀都会原样保留，「人满截止」之类的元信息会自动跳过。',
  'roster.example.text':
    '本周二夜场报名\n1. 张三\n2. 李四 +1\n3. 王五 🥅 门\n4. 赵六\n5. 人满截止',
  'roster.example.previewLabel': '解析后自动得到',
  'roster.example.useThis': '用此示例试一下',
  'roster.example.skipped': '已自动跳过 {count} 行非名单内容：{text}',

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
  'game.delete': '删除这场比赛',
  'game.delete.title': '删除这场比赛？',
  'game.delete.desc': '将永久删除该场次及全部进球记录，无法恢复。',
  'game.delete.confirm': '确认删除',
  'game.delete.processing': '删除中…',
  'game.delete.error': '删除比赛失败',
  'game.manageSection': '比赛管理',
  'game.manageHint': '以下操作不可撤销，请确认后再执行。',
  'record.error.delete': '删除失败',

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
  'share.sectionTitle': '战报',
  'share.previewReport': '查看战报',
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

  // ── onboarding tour ──────────────────────────────────────────────────
  'tour.aria.label': '新手引导',
  'tour.step': '第 {current} 步 / 共 {total} 步',
  'tour.skip': '跳过',
  'tour.prev': '上一步',
  'tour.next': '下一步',
  'tour.done': '完成',
  'tour.replay.title': '新手引导',
  'tour.replay.desc': '点击下面任意一项，会自动跳到对应页面再开始介绍。',
  'tour.replay.button': '重新查看引导',
  'tour.replay.home': '首页引导',
  'tour.replay.event': '活动页引导',
  'tour.replay.setup': '队伍配置引导',
  'tour.replay.record': '录入页引导',
  'tour.replay.detail': '比赛详情引导',
  'tour.replay.needEvent': '需要先有一场活动才能查看活动相关引导。',

  'tour.home.welcome.title': '欢迎使用 PitchMaster',
  'tour.home.welcome.desc':
    '一分钟带你认识首页上的按钮。随时点「跳过」结束，下次想再看可以在右上角设置里重新打开。',
  'tour.home.newEvent.title': '新建一场活动',
  'tour.home.newEvent.desc':
    '点这里开一场新活动（例如「周二夜场」）。创建后会得到分享码和 PIN，分别用于邀请观看和换设备恢复管理权限。',
  'tour.home.join.title': '凭分享码加入观看',
  'tour.home.join.desc': '别人给你 6 位分享码？输入后即可只读观看比分与进度，不需要登录。',
  'tour.home.archived.title': '查看已归档活动',
  'tour.home.archived.desc': '所有点击过「结束活动」的历史活动会在这里，可回看比分和战报。',
  'tour.home.restore.title': '换设备后找回管理权限',
  'tour.home.restore.desc': '清过浏览器数据或换手机后，凭分享码 + PIN 在这里重新获得录入权限。',
  'tour.home.settings.title': '语言、外观、引导',
  'tour.home.settings.desc': '切换中英文、深色/亮色，也可以在这里重新打开新手引导。',

  'tour.event.welcome.title': '活动主页',
  'tour.event.welcome.desc': '这里是活动的中枢：凭证、配置队伍、比赛列表、管理活动都在这一页。',
  'tour.event.credentials.title': '分享码与 PIN',
  'tour.event.credentials.desc':
    '把分享码发给队友/家长就能只读观看；PIN 是换设备恢复管理权限的钥匙，建议截图保存。',
  'tour.event.setup.title': '配置队伍与队员',
  'tour.event.setup.desc':
    '点这里去改队名、加队员、批量从微信接龙文本导入名单——比赛过程中也能反复进出调整。',
  'tour.event.newGame.title': '新建场次',
  'tour.event.newGame.desc': '选好两支队伍、比赛时长即可开赛。每场比赛独立计分、独立战报。',
  'tour.event.gamesList.title': '比赛列表',
  'tour.event.gamesList.desc':
    '每行展示状态和实时比分。管理员点行进入「录入」继续记进球；只读观众点行进入「详情」。右侧的垃圾桶可单独删掉某场比赛（不影响其他场次）。',
  'tour.event.manage.title': '管理活动：结束 / 删除',
  'tour.event.manage.desc':
    '黄色「结束活动」会把活动归档到首页「已归档」，仍可看战报但不再能录入；红色「删除活动」是彻底删除整场活动及所有比赛，不可恢复，请谨慎使用。',

  'tour.setup.welcome.title': '队伍配置',
  'tour.setup.welcome.desc':
    '这里管理参赛队伍和队员。可以反复进出，比赛过程中也能补加人——已经有比赛记录的球员才不能直接移出。',
  'tour.setup.import.title': '批量导入：粘贴微信接龙',
  'tour.setup.import.desc':
    '面板已展开，顶部就是示例：从微信群把整段接龙文本复制粘贴到下方文本框即可。emoji、「+1」、「门将」等后缀全部原样保留，「人满截止」之类元信息会自动跳过。点「用此示例试一下」可以立刻看到效果。',
  'tour.setup.newTeam.title': '新建一支队伍',
  'tour.setup.newTeam.desc': '需要加新队伍时填名字、点添加，颜色会自动分配，之后还能改名。',
  'tour.setup.teamCard.title': '队伍卡片',
  'tour.setup.teamCard.desc':
    '每张卡片支持：改队名（铅笔）、删除整支队伍（垃圾桶，仅当该队还没参加任何比赛时可用）、从待分配池勾选加入、手动输入名字（逗号/换行分隔多人）、单个移出队员。',
  'tour.setup.done.title': '完成返回',
  'tour.setup.done.desc': '配置好后点这里回到活动主页，就可以开始新建场次了。',

  'tour.detail.welcome.title': '比赛详情',
  'tour.detail.welcome.desc':
    '这是单场只读详情页。任何持有分享码的人都能看到，适合发到群里给观众回看比分。',
  'tour.detail.score.title': '比分与状态',
  'tour.detail.score.desc':
    '顶部展示比赛状态（待开始 / 进行中 / 已结束）、两队名称配色、实时比分和用时。比赛进行中数据会自动刷新。',
  'tour.detail.feed.title': '事件流',
  'tour.detail.feed.desc':
    '按时间顺序列出每一粒进球：哪队、谁射门、谁助攻、第几分钟。撤销过的进球不会出现在这里。',
  'tour.detail.share.title': '分享 / 战报预览',
  'tour.detail.share.desc':
    '左边「分享」一键转发文字+海报到微信/系统分享；右边「预览」打开战报 H5 页面，可以再分享或保存图。',

  'tour.record.welcome.title': '比赛录入',
  'tour.record.welcome.desc': '这是单人手机录入的主界面。下面带你认识 4 个关键区域。',
  'tour.record.clock.title': '比分与计时',
  'tour.record.clock.desc':
    '大屏比分实时刷新，下方显示已用时与剩余时长。计时由服务端权威，不会因切到后台漂移。',
  'tour.record.controls.title': '开始 / 暂停 / 结束',
  'tour.record.controls.desc':
    '主操作只有这一行：开赛 → 进行中可暂停或结束。结束后比赛进入"赛后修正"状态，仍可补录或删改。',
  'tour.record.goals.title': '记一个进球',
  'tour.record.goals.desc':
    '点对应队伍的「进球」按钮，再选射手和助攻，2 次点击就能记入一个进球。离线也能记，恢复网络自动同步。',
  'tour.record.feed.title': '事件流与修正',
  'tour.record.feed.desc': '每一粒进球都在下方流水中，点「修改」或「删除」可随时纠错——不会物理删除，全程可追溯。',

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
  'settings.openLabel': 'Open preferences',
  'settings.navTooltip': 'Tap to change language and light/dark theme',

  'archived.openLabel': 'View archived events',
  'archived.navTooltip': 'Tap to browse finished events and past scores',
  'archived.navTooltipWithCount': 'Tap to browse {count} archived events and past scores',

  'restore.openLabel': 'Restore admin access with PIN',
  'restore.navTooltip':
    'New device? Tap to enter share code and PIN to record scores and edit teams again',

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
  'archived.search.placeholder': 'Search by name or share code',
  'archived.search.empty': 'No matching events.',
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
  'cred.sectionTitle': 'Event credentials',
  'cred.savePrompt': 'Save your credentials',
  'cred.defaultHint':
    'Copy the text below to send to teammates. Share code is read-only; PIN restores admin on a new device.',
  'cred.adminHint':
    'Copy or share the credentials below. Share code is for viewers; keep the PIN private.',
  'cred.shareCode': 'Share code',
  'cred.pin': '6-digit PIN',
  'cred.copy': 'Copy',
  'cred.copied': 'Copied',
  'cred.share': 'Share',
  'cred.shared': 'Shared',
  'cred.shareSuccess.copied': 'Copied — paste into WeChat or any chat app.',
  'cred.shareSuccess.shared': 'System share sheet opened.',
  'cred.shareWarning':
    '⚠️ The PIN is an admin key. Send only to trusted co-admins, never to large groups.',
  'cred.shareText.title': '[PitchMaster scoreboard]',
  'cred.shareText.titleWithName': '[PitchMaster scoreboard] {name}',
  'cred.shareText.viewerSection': '👀 Watch the score (safe to share)',
  'cred.shareText.codeLine': 'Share code: {code}',
  'cred.shareText.adminSection': '🔐 Admin key (keep private)',
  'cred.shareText.pinLine': 'PIN: {pin} (PIN + code restores admin on a new device)',

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
  'event.games.new': 'New game',
  'event.games.emptyAdmin': 'No games yet — tap the button below to create one.',
  'event.games.emptyViewer': 'No games yet.',
  'event.games.adminSuffix': ' · admin',
  'event.games.viewerSuffix': ' · read-only',
  'event.games.tapAdmin': 'Record',
  'event.games.tapViewer': 'View',
  'event.statusActive': 'Active',
  'event.statusEnded': 'Ended',
  'event.setupCta': 'Configure teams & roster',
  'event.setupSection': 'Get ready',
  'event.setupHint': 'Set up teams and roster, then create a new game.',
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
  'event.manageSection': 'Manage event',
  'event.manageHint': 'These actions cannot be undone. Confirm before proceeding.',
  'event.gameCount': '{n} games',
  'event.delete': 'Delete event',
  'event.delete.title': 'Delete this event?',
  'event.delete.desc':
    'This permanently removes the event, all teams, games, and records. This cannot be undone.',
  'event.delete.confirm': 'Delete',
  'event.delete.processing': 'Deleting…',
  'event.delete.error': 'Failed to delete event',
  'event.games.delete': 'Delete game',

  // ── event setup ──────────────────────────────────────────────────────
  'setup.title': 'Roster setup',
  'setup.newTeamPlaceholder': 'New team name',
  'setup.addRosterPlaceholder': 'Add players manually',
  'setup.addRosterHint': 'Separate names with commas or new lines',
  'setup.addRoster': 'Add players',
  'setup.addPlayersCount': 'Add {count} players',
  'setup.addingPlayers': 'Adding…',
  'setup.done': 'Done — back to event',
  'setup.editTeamName': 'Edit team name',
  'setup.remove': 'Remove',
  'setup.removePlayer': 'Remove {name} from team',
  'setup.removePlayerError': 'This player has game records and cannot be removed',
  'setup.noPlayersYet': 'No players yet',
  'setup.deleteTeam.aria': 'Delete team {name}',
  'setup.deleteTeam.title': 'Delete team "{name}"?',
  'setup.deleteTeam.desc':
    'The team and all of its players will be removed. If the team is already used in any game, deletion is blocked — delete those games first. Removed players go back to the "pending" pool so you can re-assign them to other teams.',
  'setup.deleteTeam.confirm': 'Delete team',
  'setup.deleteTeam.processing': 'Deleting…',
  'setup.deleteTeam.cannotDelete':
    'This team is already used by a game. Delete that game first, then retry.',
  'setup.deleteTeam.error': 'Failed to delete team',

  // ── roster import ────────────────────────────────────────────────────
  'roster.title': 'Quick import from signup text',
  'roster.subtitle': 'Tuned for WeChat-style numbered signup paste',
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
  'roster.deleteFromPool': 'Delete {name} from pool',
  'roster.example.title': 'WeChat signup looks like this',
  'roster.example.lead':
    'Paste the whole signup block from the group chat. Emojis, "+1", and goalkeeper suffixes are kept verbatim; "list closed" / "人满截止" style meta lines are auto-skipped.',
  'roster.example.text':
    'Tuesday night signup\n1. Alice\n2. Bob +1\n3. Carol 🥅 GK\n4. Dave\n5. 人满截止',
  'roster.example.previewLabel': 'Auto-parsed into',
  'roster.example.useThis': 'Try this sample',
  'roster.example.skipped': 'Auto-skipped {count} non-roster line(s): {text}',

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
  'game.delete': 'Delete this game',
  'game.delete.title': 'Delete this game?',
  'game.delete.desc':
    'This permanently removes the game and all goal records. This cannot be undone.',
  'game.delete.confirm': 'Delete',
  'game.delete.processing': 'Deleting…',
  'game.delete.error': 'Failed to delete game',
  'game.manageSection': 'Manage game',
  'game.manageHint': 'This action cannot be undone. Confirm before proceeding.',
  'record.error.delete': 'Delete failed',

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
  'share.sectionTitle': 'Report',
  'share.previewReport': 'View report',
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

  // ── onboarding tour ──────────────────────────────────────────────────
  'tour.aria.label': 'Onboarding tour',
  'tour.step': 'Step {current} of {total}',
  'tour.skip': 'Skip',
  'tour.prev': 'Back',
  'tour.next': 'Next',
  'tour.done': 'Done',
  'tour.replay.title': 'Onboarding tour',
  'tour.replay.desc': 'Tapping any item navigates to that page and starts the walkthrough.',
  'tour.replay.button': 'Replay tour',
  'tour.replay.home': 'Home tour',
  'tour.replay.event': 'Event tour',
  'tour.replay.setup': 'Roster tour',
  'tour.replay.record': 'Record tour',
  'tour.replay.detail': 'Game detail tour',
  'tour.replay.needEvent': 'Create or join an event first to view event-related tours.',

  'tour.home.welcome.title': 'Welcome to PitchMaster',
  'tour.home.welcome.desc':
    'A 60-second tour of what each button does. Tap "Skip" any time — you can replay this from Settings.',
  'tour.home.newEvent.title': 'Start a new event',
  'tour.home.newEvent.desc':
    'Tap here to create an event (e.g. "Tuesday night"). You\'ll get a share code for viewers and a PIN to restore admin on a new device.',
  'tour.home.join.title': 'Join read-only with a code',
  'tour.home.join.desc':
    'Got a 6-character share code? Enter it here to watch the live score — no signup needed.',
  'tour.home.archived.title': 'Archived events',
  'tour.home.archived.desc':
    'Every event you finished lives here. Browse past scores and reports any time.',
  'tour.home.restore.title': 'Restore admin on a new device',
  'tour.home.restore.desc':
    'Switched phones or cleared data? Use share code + PIN here to regain recording rights.',
  'tour.home.settings.title': 'Language, theme & tour',
  'tour.home.settings.desc':
    'Switch English/中文, light/dark, and replay this onboarding tour from here.',

  'tour.event.welcome.title': 'Event home',
  'tour.event.welcome.desc':
    'Everything for one event lives here: credentials, roster setup, games, and the admin actions.',
  'tour.event.credentials.title': 'Share code & PIN',
  'tour.event.credentials.desc':
    'Share the code with viewers; keep the PIN — that\'s how you restore admin on another device. A screenshot is the safest backup.',
  'tour.event.setup.title': 'Configure teams & roster',
  'tour.event.setup.desc':
    'Open this to rename teams, add players manually, or bulk-import from a WeChat signup list. Safe to revisit mid-event.',
  'tour.event.newGame.title': 'Start a new game',
  'tour.event.newGame.desc':
    'Pick two teams and a match length to kick off. Each game is scored and reported independently.',
  'tour.event.gamesList.title': 'Games list',
  'tour.event.gamesList.desc':
    'Each row shows status and live score. Admin → row opens "Record" to log goals; viewers → row opens the read-only detail. The trash icon on the right deletes that single game (others are untouched).',
  'tour.event.manage.title': 'Manage: finish or delete',
  'tour.event.manage.desc':
    'Yellow "Finish event" archives it (reports stay, recording locks). Red "Delete event" permanently removes the event and every game — irreversible, use carefully.',

  'tour.setup.welcome.title': 'Roster setup',
  'tour.setup.welcome.desc':
    'Manage teams and players. Come back any time — even mid-event you can add players; only those with recorded goals are protected from removal.',
  'tour.setup.import.title': 'Bulk import: paste a WeChat signup',
  'tour.setup.import.desc':
    'The panel is now open — the dashed card on top shows the exact format. Copy your group-chat signup block into the textarea below; emojis, "+1", and GK suffixes are preserved, and meta lines like "人满截止 / list closed" are auto-skipped. Tap "Try this sample" to see it parse live.',
  'tour.setup.newTeam.title': 'Add a new team',
  'tour.setup.newTeam.desc':
    'Need another team? Type a name and tap Add. Colours are auto-assigned and the name can be edited later.',
  'tour.setup.teamCard.title': 'Team card',
  'tour.setup.teamCard.desc':
    'Each card lets you rename the team (pencil), delete the whole team (trash — only when it has not played any game yet), pick players from the pending pool, type names manually (comma/newline separated), and remove individual players.',
  'tour.setup.done.title': 'Done — back to event',
  'tour.setup.done.desc': 'When you\'re happy with the rosters, tap here to return and start a new game.',

  'tour.detail.welcome.title': 'Game detail',
  'tour.detail.welcome.desc':
    'This is the single-game read-only page. Anyone with the share code can view it — perfect for posting in the group chat.',
  'tour.detail.score.title': 'Score & status',
  'tour.detail.score.desc':
    'Top shows the match status (Ready / Playing / Finished), both team names with colours, the live score, and elapsed time. It refreshes automatically while playing.',
  'tour.detail.feed.title': 'Event stream',
  'tour.detail.feed.desc':
    'Every goal in chronological order: which team, the scorer, the assist, and the minute. Undone goals do not appear here.',
  'tour.detail.share.title': 'Share / preview report',
  'tour.detail.share.desc':
    'Left "Share" pushes a text + poster to WeChat or the system share sheet. Right "Preview" opens the H5 report page where you can re-share or save the image.',

  'tour.record.welcome.title': 'Game recording',
  'tour.record.welcome.desc': 'This is the single-handed recording screen. Here are the 4 areas you\'ll use.',
  'tour.record.clock.title': 'Score & clock',
  'tour.record.clock.desc':
    'Live score on top, elapsed/remaining time below. The clock is server-authoritative — backgrounding the tab won\'t drift it.',
  'tour.record.controls.title': 'Start / Pause / Finish',
  'tour.record.controls.desc':
    'The only main controls: start, then pause or finish. After "Finish" the game enters post-match edit mode for fixes.',
  'tour.record.goals.title': 'Log a goal in 2 taps',
  'tour.record.goals.desc':
    'Tap the team\'s "Goal" button, pick the scorer (and optional assist). Works offline — it syncs when you\'re back online.',
  'tour.record.feed.title': 'Event feed & fixes',
  'tour.record.feed.desc':
    'Every goal appears below. Tap "Edit" or "Delete" any time — corrections are tracked, nothing is physically destroyed.',
};

export const dicts: Record<'zh' | 'en', Dict> = { zh, en };
