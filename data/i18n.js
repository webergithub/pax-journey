// 【数据层】i18n —— 遵循 OPC Studio 标准方案：共享 localStorage key + t() + onLangChange
export const LANG_KEY = 'opcstudio_lang';

let lang = localStorage.getItem(LANG_KEY) || 'zh';
const listeners = [];

export function getLang() { return lang; }

export function setLang(l) {
  lang = (l === 'en') ? 'en' : 'zh';
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  listeners.forEach(fn => { try { fn(lang); } catch (e) { console.error(e); } });
}

export function toggleLang() { setLang(lang === 'zh' ? 'en' : 'zh'); }
export function onLangChange(fn) { listeners.push(fn); }

// 取双语对象的当前语言值；也接受纯字符串与字符串数组
export function T(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map(T);
  return v[lang] ?? v.zh ?? v.en ?? '';
}

// 静态界面词条
const UI = {
  zh: {
    title: '旅客旅程学习模拟器',
    subtitle: '从公共交通到落座 · 看得见的世界 × 看不见的系统',
    back: '← 返回主页',
    langBtn: 'EN',
    railTitle: '旅客旅程',
    narrTitle: '本步解说',
    branchWinTitle: '路径选择',
    btnLayout: '复位布局',
    flowEmpty: '这一步有分支：先在「路径选择」窗口里挑一条路，后台链路才会生成。',
    domainTitle: '机场管理域',
    domainHint: '当前步骤所属域高亮；点击任意域查看其职责、系统与 KPI',
    crossTitle: '贯穿层（连接所有域）',
    flowTitle: '系统与报文链路',
    flowHint: '点击节点或报文查看知识卡',
    btnNext: '下一步 ▶',
    btnPrev: '◀ 上一步',
    btnReplay: '重播本步',
    btnAuto: '自动播放',
    btnPause: '暂停',
    btnRestart: '重新开始',
    tglIntl: '国际航班',
    tglDomestic: '国内航班',
    tglOneId: 'One ID 生物识别',
    tglTrad: '传统证件核验',
    tglView: '管理者视角',
    tglViewPax: '旅客视角',
    branchTitle: '你的选择会改变后台系统链路',
    branchPick: '选择这条路径',
    branchPicked: '已选择',
    cardOwner: '归属',
    cardVendors: '典型供应商 / 实现',
    cardResp: '职责',
    cardStd: '相关标准',
    cardIfaces: '主要接口',
    cardWhen: '触发时机',
    cardSample: '报文样例',
    cardTeach: '教学要点',
    cardScope: '管理范围',
    cardSystems: '核心系统',
    cardKpis: '核心 KPI',
    cardTouch: '与本旅程的接触点',
    stepDevice: '前台设备',
    stepSystem: '后台系统',
    stepDomain: '所属管理域',
    stepKpi: 'KPI',
    stepExc: '典型异常',
    stepKnowledge: '知识点',
    ownerAirport: '机场',
    ownerAirline: '航空公司',
    ownerGov: '政府机构',
    ownerGH: '地面服务代理',
    ownerATC: '空管',
    ownerPax: '旅客自有',
    ownerCommercial: '商业租户',
    ownerTransit: '交通运营方',
    close: '关闭',
    elapsed: '累计耗时',
    resource: '占用机场资源',
    milestones: 'A-CDM 里程碑',
    done: '旅程完成',
    doneMsg: '你已走完从公共交通到落座的全流程。现在你应该能回答：值机自助机是谁的设备、跑谁的系统？行李在系统里何时"出生"？旅客不登机为什么必须卸行李？TOBT 与 TSAT 谁定的？',
    quiz: '自测题',
    tipDrag: '拖动旋转 · 滚轮缩放',
    sec: '秒',
    legendTitle: '归属图例',
  },
  en: {
    title: 'Passenger Journey Simulator',
    subtitle: 'From transit to seat · the visible world × the invisible systems',
    back: '← Home',
    langBtn: '中文',
    railTitle: 'Passenger Journey',
    narrTitle: 'This Step',
    branchWinTitle: 'Choose a path',
    btnLayout: 'Reset layout',
    flowEmpty: 'This step branches: pick a path in the "Choose a path" window and the back-office chain appears.',
    domainTitle: 'Airport Management Domains',
    domainHint: 'Current domain is highlighted; click any domain for its scope, systems and KPIs',
    crossTitle: 'Cross-cutting layer (connects all domains)',
    flowTitle: 'Systems & Message Flow',
    flowHint: 'Click a node or message for its knowledge card',
    btnNext: 'Next ▶',
    btnPrev: '◀ Back',
    btnReplay: 'Replay step',
    btnAuto: 'Auto-play',
    btnPause: 'Pause',
    btnRestart: 'Restart',
    tglIntl: 'International',
    tglDomestic: 'Domestic',
    tglOneId: 'One ID biometrics',
    tglTrad: 'Traditional documents',
    tglView: 'Manager view',
    tglViewPax: 'Passenger view',
    branchTitle: 'Your choice changes the back-office system chain',
    branchPick: 'Take this path',
    branchPicked: 'Selected',
    cardOwner: 'Owned by',
    cardVendors: 'Typical vendors / implementations',
    cardResp: 'Responsibilities',
    cardStd: 'Standards',
    cardIfaces: 'Key interfaces',
    cardWhen: 'Triggered when',
    cardSample: 'Message sample',
    cardTeach: 'Teaching point',
    cardScope: 'Scope',
    cardSystems: 'Core systems',
    cardKpis: 'Core KPIs',
    cardTouch: 'Touchpoints in this journey',
    stepDevice: 'Front-line device',
    stepSystem: 'Back-office system',
    stepDomain: 'Management domain',
    stepKpi: 'KPI',
    stepExc: 'Typical exceptions',
    stepKnowledge: 'Concepts',
    ownerAirport: 'Airport',
    ownerAirline: 'Airline',
    ownerGov: 'Government',
    ownerGH: 'Ground handler',
    ownerATC: 'ATC',
    ownerPax: 'Passenger-owned',
    ownerCommercial: 'Retail tenant',
    ownerTransit: 'Transit operator',
    close: 'Close',
    elapsed: 'Elapsed',
    resource: 'Airport resource used',
    milestones: 'A-CDM milestones',
    done: 'Journey complete',
    doneMsg: 'You have walked the full journey from transit to seat. You should now be able to answer: whose device is the kiosk and whose system runs on it? When is a bag "born" in the data world? Why must a bag be offloaded if its passenger never boards? Who sets TOBT and who sets TSAT?',
    quiz: 'Self-check',
    tipDrag: 'Drag to orbit · scroll to zoom',
    sec: 's',
    legendTitle: 'Ownership legend',
  },
};

export function t(key) { return (UI[lang] && UI[lang][key]) ?? key; }

// 归属 → 颜色 / 名称（3D 与 UI 共用，保证"谁的东西"一眼可辨）
export const OWNERS = {
  airport:    { color: '#e8b86d', key: 'ownerAirport' },
  airline:    { color: '#6fb3d9', key: 'ownerAirline' },
  gov:        { color: '#d98b6f', key: 'ownerGov' },
  gh:         { color: '#8fcf7a', key: 'ownerGH' },
  atc:        { color: '#b58fd9', key: 'ownerATC' },
  pax:        { color: '#f0ece6', key: 'ownerPax' },
  commercial: { color: '#d9c46f', key: 'ownerCommercial' },
  transit:    { color: '#7fc7c2', key: 'ownerTransit' },
};

export function ownerColor(id) { return (OWNERS[id] || OWNERS.airport).color; }
export function ownerName(id) { return t((OWNERS[id] || OWNERS.airport).key); }

// 页面加载即应用一次，保证 <html lang> 正确
document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
