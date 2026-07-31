// 【数据层】管理节点全景 —— 旅客旅程只是这张图上的一条线
// 每组给出该组在旅客旅程中"露不露面"，让学习者看清：看得见的只是很小一部分
import { getSystem } from './systems.js';

export const LANDSCAPE = [
  {
    id: 'airport-core', owner: 'airport', icon: '🗄️',
    name: { zh: '机场 · 运行核心', en: 'Airport · Operations core' },
    note: { zh: '全场数据与计划的中枢。旅客几乎看不到它，但屏幕上的每一个字段都出自这里。', en: 'The hub of data and planning. Passengers never see it, yet every field on every screen comes from here.' },
    ids: ['aodb', 'rms', 'fids', 'acdm-sys', 'apoc', 'slot', 'billing', 'bi', 'twin', 'esb', 'mdm'],
  },
  {
    id: 'airport-pax', owner: 'airport', icon: '🎫',
    name: { zh: '机场 · 旅客处理', en: 'Airport · Passenger processing' },
    note: { zh: '"设备是机场的、系统是航司的"这条边界就在这一组里。', en: 'This is where the "airport hardware, airline software" boundary lives.' },
    ids: ['cupps', 'cuss', 'sbd', 'bgr', 'oneid', 'paxflow', 'queue', 'wayfind', 'prm', 'pa', 'airportapp'],
  },
  {
    id: 'airport-bag', owner: 'airport', icon: '🧳',
    name: { zh: '机场 · 行李', en: 'Airport · Baggage' },
    note: { zh: '唯一"和旅客分离却必须同机"的对象，所以它的数据链既是服务问题也是安保问题。', en: 'The only object separated from its passenger yet required to fly with them — a service and a security problem at once.' },
    ids: ['bhs', 'brs', 'hbs', 'ebs', 'rfid', 'worldtracer'],
  },
  {
    id: 'airport-airside', owner: 'airport', icon: '🛫',
    name: { zh: '机场 · 飞行区', en: 'Airport · Airside' },
    note: { zh: '旅客只在廊桥与舷窗边瞥见一眼，却决定了航班能不能准点走。', en: 'Passengers glimpse it from the bridge and the window, yet it decides whether the flight leaves on time.' },
    ids: ['asmgcs', 'vdgs', 'alcms', 'apronctl', 'deice', 'rcr', 'wildlife', 'pavement', 'arff'],
  },
  {
    id: 'airport-gh', owner: 'gh', icon: '🛠️',
    name: { zh: '地面服务', en: 'Ground handling' },
    note: { zh: '"看不见的雇主"：柜台与登机口的员工常来自地服，登录的却是航司 DCS。', en: 'The invisible employer: desk and gate staff often work for a handler while logging into the airline DCS.' },
    ids: ['gh-rms', 'tms', 'gse', 'fuel', 'catering', 'cabin', 'uldmgmt'],
  },
  {
    id: 'airport-landside', owner: 'airport', icon: '🚇',
    name: { zh: '机场 · 陆侧交通', en: 'Airport · Landside' },
    note: { zh: 'TAM 相对 A-CDM 最大的扩展方向：把"旅客怎么来"纳入统一计划。', en: 'The biggest extension TAM makes over A-CDM: planning how passengers arrive.' },
    ids: ['parking', 'anpr', 'curbside', 'taxipool', 'transit-op', 'ev'],
  },
  {
    id: 'airport-commercial', owner: 'commercial', icon: '🛍️',
    name: { zh: '机场 · 商业与非航', en: 'Airport · Commercial' },
    note: { zh: '航空性收费受管制，机场的利润主要来自这一组。', en: 'Aeronautical charges are regulated; airport profit mostly comes from this group.' },
    ids: ['pos', 'concession', 'dutyfree', 'lounge', 'adv', 'crm-airport'],
  },
  {
    id: 'airport-security', owner: 'airport', icon: '🛡️',
    name: { zh: '机场 · 安全与安保', en: 'Airport · Safety & security' },
    note: { zh: '视频与门禁是全场存储与网络的最大消耗方，也是网络安全的重点保护对象。', en: 'Video and access control consume the most storage and bandwidth, and are the top cyber-protection targets.' },
    ids: ['sec-sys', 'cctv', 'acs', 'perimeter', 'soc', 'incident'],
  },
  {
    id: 'airport-facility', owner: 'airport', icon: '🏗️',
    name: { zh: '机场 · 设施与能源', en: 'Airport · Facilities & energy' },
    note: { zh: '单位旅客能耗是绿色机场的核心指标；桥载电源替代 APU 是最大的单项减排。', en: 'Energy per passenger is the headline green metric; replacing the APU with bridge power is the single biggest cut.' },
    ids: ['bim', 'bas', 'ems', 'lift', 'fas'],
  },
  {
    id: 'airport-it', owner: 'airport', icon: '🖧',
    name: { zh: '机场 · 支撑 IT', en: 'Airport · Enabling IT' },
    note: { zh: '运行网 / 办公网 / 旅客网三网隔离是硬约束——运行网出问题会停航班。', en: 'Segregating operational, corporate and public networks is non-negotiable: an operational failure stops flights.' },
    ids: ['dc', 'net', 'clock', 'itsm'],
  },
  {
    id: 'airline-pss', owner: 'airline', icon: '✈️',
    name: { zh: '航司 · PSS 旅客服务系统', en: 'Airline · Passenger Service System' },
    note: { zh: '航司最核心的 IT 资产：订座 + 运力 + 离港。旅客数据的实际归属地。', en: 'The airline\'s core IT: reservation, inventory and departure control. This is where passenger data actually lives.' },
    ids: ['res', 'inv', 'dcs', 'rm', 'dist', 'ecom', 'loyalty'],
  },
  {
    id: 'airline-ops', owner: 'airline', icon: '🎛️',
    name: { zh: '航司 · 运行与技术', en: 'Airline · Operations & engineering' },
    note: { zh: '延误传播里最硬的约束往往不是飞机而是机组：飞机可以等，法定休息不能压缩。', en: 'The hardest constraint in delay propagation is usually crew: aircraft can wait, rest rules cannot be compressed.' },
    ids: ['aoc', 'dispatch', 'wx', 'notam', 'acars', 'crew', 'mro', 'mcc', 'disruption'],
  },
  {
    id: 'airline-fin', owner: 'airline', icon: '💰',
    name: { zh: '航司 · 财务与货运', en: 'Airline · Finance & cargo' },
    note: { zh: '收入不是卖出票那一刻确认的，而是"实际飞了"之后由 PFS 报文触发结算。', en: 'Revenue is recognised not when the ticket sells but when the passenger actually flies, triggered by the PFS message.' },
    ids: ['bss', 'ra', 'cargo'],
  },
  {
    id: 'atm', owner: 'atc', icon: '📡',
    name: { zh: '空管', en: 'Air traffic management' },
    note: { zh: '本场再准点，遇到网络流控也走不了——TSAT 里的等待有一部分来自千里之外。', en: 'A punctual airport still waits when the network is regulated — part of your TSAT delay is a bottleneck far away.' },
    ids: ['atc', 'tower', 'atfm'],
  },
  {
    id: 'gov', owner: 'gov', icon: '🛂',
    name: { zh: '政府监管', en: 'Government agencies' },
    note: { zh: '这些系统在政府专网上，机场只提供场地、供电与受控接入，但必须算进机房与配电容量。', en: 'These run on government networks; the airport supplies only space, power and controlled access — but must plan for both.' },
    ids: ['border', 'customs', 'quarantine', 'regulator'],
  },
];

/** 该节点是否出现在旅客旅程主线里（用于全景图上标注"旅客看得见/看不见"） */
const JOURNEY_IDS = new Set([
  'pax', 'transit-op', 'parking', 'anpr', 'curbside', 'aodb', 'rms', 'fids', 'acdm-sys',
  'paxflow', 'cuss', 'cupps', 'sbd', 'bgr', 'oneid', 'airline-app', 'res', 'inv', 'dcs',
  'bhs', 'brs', 'hbs', 'sec-sys', 'border', 'pos', 'crm-airport', 'gh-rms', 'tms', 'gse',
  'vdgs', 'atc', 'aoc', 'bss',
]);

export function inJourney(id) { return JOURNEY_IDS.has(id); }

export function landscapeStats() {
  const all = new Set();
  LANDSCAPE.forEach(g => g.ids.forEach(id => all.add(id)));
  let touched = 0;
  all.forEach(id => { if (inJourney(id)) touched++; });
  return { total: all.size, touched, groups: LANDSCAPE.length };
}

export function groupOf(id) { return LANDSCAPE.find(g => g.ids.includes(id)) || null; }

/** 全景里出现但字典里没有的 id（开发期自检用） */
export function missingIds() {
  const miss = [];
  LANDSCAPE.forEach(g => g.ids.forEach(id => {
    const s = getSystem(id);
    if (!s || !s.name || (s.name.zh === id && s.name.en === id)) miss.push(id);
  }));
  return miss;
}
