// 【数据层】术语表 —— 正文里出现的每一个缩写/专业名词都能点开单独解释
// 三类词条来源：① 本文件的 TERMS ② systems.js 的系统节点 ③ messages.js 的报文
// 解析优先级：系统 > 报文 > 术语（同名时以更具体的为准）
import { SYSTEMS } from './systems.js';
import { MESSAGES } from './messages.js';
import { DOMAINS, CROSSCUTTING } from './domains.js';

export const TERMS = {
  // ── 管理理念 ───────────────────────────────────────────────
  TAM: {
    zh: '全面机场管理', en: 'Total Airport Management',
    cat: 'concept',
    def: {
      zh: 'SESAR 在 A-CDM 之上提出的下一代机场运行概念：把协同范围从"停机坪"扩展到陆侧+空侧+网络，用一份滚动的机场运行计划（AOP）驱动一个各域同桌办公的运行控制中心（APOC）。与 A-CDM 的三点差异：范围从落地—起飞扩到 curb-to-curb；对象从只管航班扩到同时管旅客流；并通过 SWIM 与网络运行计划 NOP 双向对接。',
      en: 'SESAR\'s next-generation concept above A-CDM: it widens collaboration from the apron to landside + airside + network, driven by a rolling Airport Operations Plan executed in a co-located Airport Operations Centre. Three differences from A-CDM: scope becomes curb-to-curb; the object of management becomes passenger flow as well as flights; and the plan links two-way with the network plan via SWIM.',
    },
    see: ['AOP', 'APOC', 'A-CDM', 'SWIM'],
  },
  'A-CDM': {
    zh: '机场协同决策', en: 'Airport Collaborative Decision Making',
    cat: 'concept',
    def: {
      zh: '本质是一个共享时间戳协议：让机场、航司、地服、空管对"这架飞机现在到底什么状态"达成唯一共识，把过站从黑箱变成 16 个可测量里程碑（MS1 飞行计划激活 … MS6 落地 ALDT、MS7 上轮档 AIBT、MS9 TOBT 更新、MS10 TSAT 下发、MS15 撤轮档 AOBT、MS16 起飞 ATOT）。理解 SOBT→EOBT→TOBT→TSAT→AOBT 这条时间链，就理解了绝大部分离港管理。',
      en: 'Essentially a shared-timestamp protocol: airport, airlines, handlers and ATC agree on one view of aircraft state, turning the turnaround from a black box into 16 measurable milestones. Understanding the chain SOBT → EOBT → TOBT → TSAT → AOBT explains most of departure management.',
    },
    see: ['TOBT', 'TSAT', 'AOBT', 'AIBT', 'ATOT', 'TAM'],
  },
  AOP: {
    zh: '机场运行计划', en: 'Airport Operations Plan',
    cat: 'concept',
    def: {
      zh: '一份滚动的、共享的、覆盖未来 24–72 小时的机场运行意图：航班、机位、值机柜台、安检通道、行李分拣口、人力与设备、旅客量预测、天气与容量约束。可以理解为"机场版本的飞行计划"。',
      en: 'A rolling, shared 24–72 hour statement of intent covering flights, stands, desks, lanes, chutes, manpower, equipment, passenger forecasts, weather and capacity constraints — the airport\'s equivalent of a flight plan.',
    },
    see: ['APOC', 'TAM', 'NOP'],
  },
  NOP: {
    zh: '网络运行计划', en: 'Network Operations Plan',
    cat: 'concept',
    def: { zh: '空管网络侧的运行计划。TAM 通过 SWIM 把本场 AOP 与 NOP 双向对接——本场机位或容量不够时，网络侧可以提前调整流量，而不是等飞机到了才发现放不下。', en: 'The network-level operations plan. TAM links the local AOP with the NOP through SWIM so flow can be adjusted upstream instead of discovering the shortage on arrival.' },
    see: ['AOP', 'SWIM', 'TAM'],
  },
  SWIM: {
    zh: '全域信息管理', en: 'System Wide Information Management',
    cat: 'standard',
    def: { zh: '空管领域的信息共享架构，用统一的数据服务替代点对点接口，是 TAM 把本场计划接入欧洲网络计划的技术底座。', en: 'The ATM information-sharing architecture that replaces point-to-point interfaces with common data services — the technical basis for linking a local plan to the network.' },
    see: ['TAM', 'NOP'],
  },
  DSS: {
    zh: '决策支持系统', en: 'Decision Support System',
    cat: 'concept',
    def: { zh: '在民航语境里通常指 APOC 内的 what-if 推演工具，例如"若 3 号跑道关闭 40 分钟，未来 2 小时机位与行李分拣口如何重排"。与 BI（看历史指标）和数字孪生（看实时三维态势）合起来构成机场的数据驱动层。', en: 'In aviation this usually means the what-if simulation tools inside an APOC — e.g. "if runway 3 closes for 40 minutes, how do stands and make-up chutes re-plan?" Together with BI and the digital twin it forms the airport\'s data-driven layer.' },
    see: ['APOC', 'AOP'],
  },
  '四型机场': {
    zh: '四型机场', en: 'The "four-type" airport (China)',
    cat: 'concept',
    def: { zh: '中国民航局《四型机场建设行动纲要（2020—2035）》确立的框架：平安、绿色、智慧、人文。落到旅客旅程上最具体的抓手是无纸化便捷出行 / 一码通行、全流程人脸识别、RFID 行李全流程跟踪。', en: 'The CAAC framework of safe, green, smart and humanistic airports. On the passenger journey it shows up as paperless travel, face recognition at every touchpoint and RFID bag tracking.' },
    see: ['One ID', 'Res 753'],
  },

  // ── 时间戳 ─────────────────────────────────────────────────
  TOBT: {
    zh: '目标撤轮档时间', en: 'Target Off-Block Time',
    cat: 'timestamp',
    def: { zh: 'A-CDM 里程碑 9。由**航司/地服**根据保障进度给出的"我们几点能好"的承诺，不是愿望。TOBT 报得越准，机场给出的 TSAT 越靠前——这是 A-CDM 的激励设计。TOBT 与 AOBT 的偏差分布是 A-CDM 健康度的第一指标。', en: 'Milestone 9. The handler\'s/airline\'s commitment on when the aircraft will actually be ready — not a wish. Better TOBT accuracy earns an earlier TSAT; the TOBT-vs-AOBT spread is the headline health metric of A-CDM.' },
    see: ['TSAT', 'AOBT', 'A-CDM'],
  },
  TSAT: {
    zh: '目标开车许可时间', en: 'Target Start-up Approval Time',
    cat: 'timestamp',
    def: { zh: 'A-CDM 里程碑 10。空管综合 TOBT、跑道容量与流量限制后下发的"排队号"。**关门后还要等十几分钟正是它**：把等待放在机位（发动机不转）而不是滑行道，全网油耗与排放都更低。', en: 'Milestone 10. ATC\'s queue ticket, computed from TOBT plus runway capacity and flow restrictions. This is why you wait after the door closes — holding at the stand with engines off beats queueing on the taxiway.' },
    see: ['TOBT', 'AOBT', 'A-CDM'],
  },
  AIBT: { zh: '实际上轮档时间', en: 'Actual In-Block Time', cat: 'timestamp',
    def: { zh: 'A-CDM 里程碑 7，飞机停稳入位的时刻，通常由 VDGS 自动产生。它是过站时间 TAT 的起点。', en: 'Milestone 7 — the moment the aircraft is on blocks, usually generated automatically by the VDGS. It is the start of turnaround time.' }, see: ['AOBT', 'TAT', 'VDGS'] },
  AOBT: { zh: '实际撤轮档时间', en: 'Actual Off-Block Time', cat: 'timestamp',
    def: { zh: 'A-CDM 里程碑 15，飞机实际离开机位的时刻。准点率 OTP 就是拿它跟计划撤轮档时间比。', en: 'Milestone 15 — when the aircraft actually leaves the stand. On-time performance compares this against the scheduled off-block time.' }, see: ['OTP', 'TOBT', 'TAT'] },
  ALDT: { zh: '实际落地时间', en: 'Actual Landing Time', cat: 'timestamp', def: { zh: 'A-CDM 里程碑 6，由空管产生。', en: 'Milestone 6, produced by ATC.' }, see: ['A-CDM'] },
  ATOT: { zh: '实际起飞时间', en: 'Actual Take-Off Time', cat: 'timestamp', def: { zh: 'A-CDM 里程碑 16，整条离港链路的终点。', en: 'Milestone 16 — the end of the departure chain.' }, see: ['A-CDM', 'AOBT'] },
  EOBT: { zh: '估计撤轮档时间', en: 'Estimated Off-Block Time', cat: 'timestamp', def: { zh: '飞行计划里申报的估计撤轮档时间，是 TOBT 之前的粗略值。时间链：SOBT（计划）→ EOBT（估计）→ TOBT（目标）→ TSAT（放行）→ AOBT（实际）。', en: 'The estimate filed in the flight plan, upstream of TOBT. The chain runs scheduled → estimated → target → approved → actual.' }, see: ['TOBT', 'AOBT'] },

  // ── 指标 ───────────────────────────────────────────────────
  OTP: { zh: '准点率', en: 'On-Time Performance', cat: 'kpi',
    def: { zh: '通常以 D0（零延误）或 D15（15 分钟内）计，拿实际撤轮档时间 AOBT 与计划撤轮档时间比较。注意：它衡量的是"离开机位"，不是"起飞"。', en: 'Usually measured as D0 or D15, comparing actual off-block against schedule. Note it measures leaving the stand, not taking off.' }, see: ['AOBT', 'TAT'] },
  TAT: { zh: '过站时间', en: 'Turnaround Time', cat: 'kpi',
    def: { zh: '从 AIBT（上轮档）到 AOBT（撤轮档）的时长，是地服与机场共同的核心 KPI。窄体机典型 35–50 分钟。', en: 'From in-block to off-block — the shared headline KPI of handlers and airports. Typically 35–50 minutes for a narrowbody.' }, see: ['AIBT', 'AOBT'] },
  MBR: { zh: '行李错运率', en: 'Mishandled Bag Rate', cat: 'kpi',
    def: { zh: '行李管理的头号指标，行业惯例按**每千名旅客**的错运件数计。错运的主要来源是中转行李，因为它必须在最短衔接时间 MCT 内完成一次跨航班搬运。', en: 'The headline baggage metric, counted per 1,000 passengers. Most mishandling comes from transfer bags, which must cross between flights inside the minimum connecting time.' }, see: ['MCT', 'Res 753', 'BRS'] },
  MCT: { zh: '最短衔接时间', en: 'Minimum Connecting Time', cat: 'kpi',
    def: { zh: '同一机场内两个航班之间允许销售的最短衔接时长，分旅客 MCT 与行李 MCT。行李 MCT 常常比旅客 MCT 更紧，是中转行李失败的直接原因。', en: 'The shortest connection an airport allows to be sold, split into passenger and baggage MCT. The baggage figure is often the binding one.' }, see: ['MBR', 'BTM'] },
  ASQ: { zh: '机场服务质量', en: 'Airport Service Quality', cat: 'kpi',
    def: { zh: 'ACI（国际机场协会）的旅客满意度测评体系，问卷驱动，覆盖排队、清洁、寻路、商业等维度，是机场对外最常引用的服务口径。', en: 'ACI\'s survey-driven passenger satisfaction programme covering queuing, cleanliness, wayfinding and retail — the most cited service benchmark for airports.' }, see: [] },

  // ── 旅客与客票 ─────────────────────────────────────────────
  PSS: {
    zh: '旅客服务系统', en: 'Passenger Service System',
    cat: 'concept',
    def: {
      zh: '航司最核心的 IT 资产，由三件套构成：**RES 订座**（维护 PNR）、**INV 运力舱位**（管航班与可售座位，与收益管理联动）、**DCS 离港控制**（从值机开放到航班关闭的全部地面动作）。主流供应商为 Amadeus Altéa、Sabre SabreSonic、中国航信 TravelSky。旅客在机场设备上办的每一件事，最终都落到某家航司的 PSS 里——这是"设备是机场的、系统是航司的"这条边界的另一半。',
      en: 'The airline\'s core IT asset, made of three parts: Reservation (holds the PNR), Inventory (flights and sellable seats, coupled to revenue management) and Departure Control (everything on the ground from check-in opening to flight close). Main vendors are Amadeus Altéa, Sabre SabreSonic and TravelSky.',
    },
    see: ['PNR', 'DCS', 'RES', 'INV', 'NDC'],
  },
  PNR: { zh: '旅客订座记录', en: 'Passenger Name Record', cat: 'data',
    def: { zh: '订座系统里代表一次行程的记录：旅客姓名、航段、联系方式、特殊服务 SSR、支付信息等。注意"有订座（PNR）"不等于"有票（电子客票）"——值机时真正被校验的是电子客票票联状态。', en: 'The reservation record for one itinerary. Having a PNR is not the same as having a ticket — check-in validates the electronic ticket coupon.' }, see: ['PSS', 'ET', 'DCS'] },
  ET: { zh: '电子客票', en: 'Electronic Ticket', cat: 'data',
    def: { zh: '客票的电子形态，按航段有票联（coupon）与状态（OPEN / CHECKED-IN / USED / REFUNDED）。DCS 值机时校验票联是否为 OPEN。', en: 'The electronic form of a ticket, with per-segment coupons and statuses. The DCS checks the coupon is OPEN at check-in.' }, see: ['PNR', 'DCS'] },
  LPN: { zh: '行李牌号', en: 'License Plate Number', cat: 'data',
    def: { zh: '行李条上的 10 位唯一编号，是行李在数字世界的身份证。DCS 发出 BSM 的那一刻它被激活，此后每一次扫描（BPM）都追加在这个号上。', en: 'The 10-digit number on the bag tag — a bag\'s identity in the data world. It is activated the moment the DCS emits a BSM; every later scan is appended to it.' }, see: ['BSM', 'BPM', 'Res 753'] },
  SSR: { zh: '特殊服务请求', en: 'Special Service Request', cat: 'data',
    def: { zh: '订座记录里的特殊需求代码，如 WCHR（轮椅）、UMNR（无人陪伴儿童）、特殊餐食。它消耗的是"人和设备"而不是"座位"，所以必须提前通过 PSM 报文到达地服。', en: 'Codes in the PNR such as wheelchair, unaccompanied minor or special meals. They consume people and equipment rather than seats, so they must reach the handler early.' }, see: ['PSM', 'PNR'] },
  'Res 753': { zh: 'IATA 行李跟踪决议 753', en: 'IATA Resolution 753', cat: 'standard',
    def: { zh: '要求承运人在四个节点获取并保存行李状态证据：**① 接收（值机/托运）② 装机 ③ 中转交接 ④ 到达交付**。这四个证据点是靠一连串 BPM 报文拼出来的，本质上把"行李在哪"从经验变成了可审计的数据。', en: 'Requires carriers to capture and keep evidence of bag status at four points: acquisition, loading, transfer and delivery. The evidence is assembled from a chain of BPM messages.' }, see: ['BSM', 'BPM', 'BRS', 'MBR'] },
  'One ID': { zh: 'One ID 数字身份', en: 'IATA One ID', cat: 'standard',
    def: { zh: 'IATA 的"只验证一次身份"倡议：一次远程注册后，在值机、托运、安检、边检、登机五个触点用生物特征通过。**变的是界面，不变的是数据链**——背后的 DCS、BRS、边检系统一个也没少。正与可验证凭证与数字旅行证件 DTC 结合。', en: 'IATA\'s "verify once" initiative: enrol remotely, then pass check-in, bag drop, security, border and boarding by biometrics. The interface changes; the underlying DCS, BRS and border systems do not.' }, see: ['DTC', 'DCS', 'BRS'] },
  DTC: { zh: '数字旅行凭证', en: 'Digital Travel Credential', cat: 'standard',
    def: { zh: 'ICAO 定义的护照数字副本标准，让旅客可以在出行前把身份凭证提交给承运人与边检，是 One ID 走向跨境互认的关键。', en: 'The ICAO standard for a digital derivative of the passport, letting travellers submit identity ahead of travel — key to making One ID work across borders.' }, see: ['One ID'] },
  NDC: { zh: '新分销能力', en: 'New Distribution Capability', cat: 'standard',
    def: { zh: 'IATA 的现代零售标准，让航司能像电商一样直接对外提供带附加服务的报价（Offer）。与 ONE Order 一起，用"报价 + 订单"取代传统 PNR/电子客票/EMD 的多凭证结构。', en: 'IATA\'s modern retailing standard letting airlines distribute rich offers directly. With ONE Order it replaces the PNR/ticket/EMD stack with offers and orders.' }, see: ['PNR', 'PSS'] },
  'ONE Order': { zh: 'ONE Order 统一订单', en: 'IATA ONE Order', cat: 'standard',
    def: { zh: '把客票、EMD、辅营等多张凭证合并成一个订单记录的标准，与 NDC 配套。', en: 'The standard that merges tickets, EMDs and ancillaries into a single order record, paired with NDC.' }, see: ['NDC'] },
  'Type B': { zh: 'IATA Type B 报文', en: 'IATA Type B messaging', cat: 'standard',
    def: { zh: '民航沿用数十年的电报式报文体系，PNL/ADL/BSM/BPM/LDM/MVT 等都属于它。格式紧凑、以行首点号标识字段，至今仍是航司与机场系统之间最广泛的接口。', en: 'The decades-old teletype-style message family — PNL, ADL, BSM, BPM, LDM, MVT and more. Compact, dot-prefixed fields, still the most widely used interface between airline and airport systems.' }, see: ['AIDX', 'BSM', 'PNL'] },
  SSIM: { zh: '标准航季时刻数据', en: 'Standard Schedules Information Manual', cat: 'standard',
    def: { zh: 'IATA 的航季计划数据标准，机场用它把整个航季的航班导入 AODB，作为资源分配与容量规划的起点。', en: 'The IATA seasonal schedule data standard, loaded into the AODB as the basis for resource allocation and capacity planning.' }, see: ['AODB'] },
  TIMATIC: { zh: '证件与签证规则库', en: 'TIMATIC (travel document rules)', cat: 'reference',
    def: { zh: '目的地证件与签证规则数据库，DCS 在值机时用它预判旅客能否入境。**拒绝入境的遣返成本由承运人承担**，所以这道关必须在值机口把住，而不是等到目的地。', en: 'The destination document-and-visa rule base the DCS checks at check-in. Since the carrier pays for refused entries, the gate-keeping must happen here.' }, see: ['DCS', 'API'] },
  APIS: { zh: '旅客预报系统', en: 'Advance Passenger Information System', cat: 'standard',
    def: { zh: '各国要求承运人在航班起飞前提交旅客名单与证件信息的法定制度，报文格式通常是 UN/EDIFACT PAXLST。这是旅客数据唯一被法定要求交给政府的通道，由航司发出，机场并不经手。', en: 'The legal regime requiring carriers to submit passenger and document data before departure, usually as UN/EDIFACT PAXLST. It is the one mandated channel for passenger data to government — sent by the airline, never touched by the airport.' }, see: ['API', 'DCS'] },
  PAXLST: { zh: '旅客名单报文', en: 'PAXLST message', cat: 'standard', def: { zh: 'API/APIS 使用的 UN/EDIFACT 报文格式。', en: 'The UN/EDIFACT format used for API/APIS.' }, see: ['API', 'APIS'] },
  EES: { zh: '欧盟出入境记录系统', en: 'EU Entry/Exit System', cat: 'reference',
    def: { zh: '欧盟对第三国旅客的自动出入境登记系统，用生物特征替代护照盖章，落地后显著改变了申根口岸的排队结构。', en: 'The EU\'s automated entry/exit register for third-country nationals, replacing passport stamps with biometrics and reshaping queueing at Schengen borders.' }, see: ['ETIAS', 'API'] },
  ETIAS: { zh: '欧盟旅行信息与授权系统', en: 'European Travel Information and Authorisation System', cat: 'reference',
    def: { zh: '面向免签第三国旅客的行前电子授权制度，与 EES 配套。', en: 'The pre-travel authorisation scheme for visa-exempt third-country nationals, paired with EES.' }, see: ['EES'] },

  // ── 设备与设施 ─────────────────────────────────────────────
  CUTE: { zh: '共用终端设备（CUPPS 前身）', en: 'Common Use Terminal Equipment', cat: 'device',
    def: { zh: 'CUPPS 的前身。让机场把同一个柜台按小时租给不同航司，是航站楼容量能被"复用"的关键，也是"设备是机场的、系统是航司的"这条边界的技术起点。', en: 'The predecessor of CUPPS: it lets an airport rent the same desk to different airlines by the hour — the origin of the "airport hardware, airline software" split.' }, see: ['CUPPS', 'CUSS'] },
  ATR: { zh: '自动读码器', en: 'Automatic Tag Reader', cat: 'device',
    def: { zh: '行李处理系统里的自动条码/RFID 读取环，读到 LPN 才能把行李分拣到正确的分拣口。读不到就进人工编码站（Manual Encoding）。', en: 'The automatic barcode/RFID reading array in the BHS. Without a successful LPN read the bag falls to a manual encoding station.' }, see: ['LPN', 'BHS'] },
  EDS: { zh: '爆炸物探测系统', en: 'Explosive Detection System', cat: 'device',
    def: { zh: '托运行李安检 HBS 使用的检测设备，现代主流是 CT 断层扫描，可自动放行大部分行李，只把可疑图像升级到人工复核与开包。', en: 'The screening equipment used in hold baggage screening; modern systems use CT so most bags auto-clear and only suspicious images escalate.' }, see: ['HBS', 'CT'] },
  CT: { zh: 'CT 断层扫描安检机', en: 'Computed tomography screening', cat: 'device',
    def: { zh: '三维断层扫描安检设备，用于托运行李（HBS）与部分随身行李通道。它的价值不只是检出率，还包括让旅客不必取出电脑与液体，从而提高通道吞吐。', en: 'Three-dimensional screening used for hold baggage and increasingly at the checkpoint. Its value is throughput as much as detection: passengers keep laptops and liquids in the bag.' }, see: ['EDS', 'HBS'] },
  ULD: { zh: '航空集装器', en: 'Unit Load Device', cat: 'device',
    def: { zh: '装载行李与货物的集装箱/托盘。行李在分拣口装入 ULD 后运到机坪装机，其分布位置会影响飞机重心，因此要通过 CPM/UCM 报文告知。', en: 'The containers and pallets bags and cargo are loaded into. Their positions affect the centre of gravity, which is why CPM/UCM messages exist.' }, see: ['LDM', 'BHS'] },
  GSE: { zh: '地面保障设备', en: 'Ground Support Equipment', cat: 'device',
    def: { zh: '牵引车、行李车、客梯车、加油车、配餐车、除冰车等机坪设备。电动化与位置监控是当前地服数字化的主线。', en: 'Tugs, dollies, steps, fuel, catering and de-icing vehicles. Electrification and position tracking are the current digitisation focus.' }, see: [] },
  APM: { zh: '旅客捷运系统', en: 'Automated People Mover', cat: 'device',
    def: { zh: '航站楼之间或停车场与航站楼之间的自动旅客运输系统，属于陆侧交通管理域。', en: 'The automated shuttle between terminals or between car parks and terminals — part of landside management.' }, see: [] },
  PCA: { zh: '桥载空调', en: 'Pre-Conditioned Air', cat: 'device',
    def: { zh: '登机桥提供的地面空调，与 400Hz 桥载电源（FEGP）一起替代飞机 APU。一次过站可省下数百公斤燃油当量，是机场碳减排的主力项之一。', en: 'Ground-supplied conditioned air which, with 400 Hz fixed power, replaces the aircraft APU — one of the biggest carbon levers a terminal has.' }, see: ['FEGP', 'APU'] },
  FEGP: { zh: '固定电源（400Hz）', en: 'Fixed Electrical Ground Power', cat: 'device',
    def: { zh: '廊桥提供的 400Hz 地面电源，替代飞机自带的辅助动力装置 APU。', en: 'The 400 Hz ground power supplied at the bridge, replacing the aircraft\'s auxiliary power unit.' }, see: ['PCA', 'APU'] },
  APU: { zh: '辅助动力装置', en: 'Auxiliary Power Unit', cat: 'device',
    def: { zh: '飞机尾部的小型燃气轮机，地面停留时供电供气。用桥载电源与空调替代它是最直接的机坪减排手段。', en: 'The small turbine in the tail that powers the aircraft on the ground. Replacing it with bridge-supplied power and air is the most direct apron emissions cut.' }, see: ['PCA', 'FEGP'] },
  'Fast Track': { zh: '安检快速通道', en: 'Fast Track security lane', cat: 'device',
    def: { zh: '面向高端旅客或付费旅客的专用安检通道。它不改变检出标准，只改变排队结构——这是安检优化的通用约束：**目标函数不是"最快"，而是"在监管给定的检出率下最快"**。', en: 'A dedicated lane for premium or paying passengers. It changes the queue, never the detection standard — screening always optimises for speed at a mandated detection rate.' }, see: ['CT'] },
  'e-Gate': { zh: '自助边检闸机', en: 'Automated border control gate', cat: 'device',
    def: { zh: '边检自助查验闸机（ABC，Automated Border Control），用护照芯片与人脸比对替代人工查验。使用率是边检域的核心 KPI 之一。', en: 'Automated border control gates matching the passport chip against a live face. e-Gate usage rate is a core border KPI.' }, see: ['One ID', 'EES'] },

  // ── 组织与角色 ─────────────────────────────────────────────
  IATA: { zh: '国际航空运输协会', en: 'International Air Transport Association', cat: 'org',
    def: { zh: '航空公司的行业组织，制定了本 Demo 里几乎所有的接口标准：Type B 报文、Res 753、AIDX、CUPPS/CUSS、NDC/ONE Order、One ID。', en: 'The airlines\' trade body behind nearly every interface standard in this demo: Type B messaging, Res 753, AIDX, CUPPS/CUSS, NDC/ONE Order and One ID.' }, see: ['ICAO', 'Type B'] },
  ICAO: { zh: '国际民航组织', en: 'International Civil Aviation Organization', cat: 'org',
    def: { zh: '联合国下属的政府间组织，管的是公约与附件（如 Annex 9 简化手续、Annex 17 航空安保），与 IATA 的行业标准分工不同。', en: 'The UN body responsible for the convention and its annexes (Annex 9 facilitation, Annex 17 security) — distinct from IATA\'s industry standards.' }, see: ['IATA'] },
  SESAR: { zh: '欧洲单一天空空管研究计划', en: 'Single European Sky ATM Research', cat: 'org',
    def: { zh: '欧洲空管现代化研究计划，其 PJ04 项目产出了 TAM 的运行概念与逻辑架构。', en: 'The European ATM modernisation programme whose PJ04 project produced the TAM operational concept.' }, see: ['TAM', 'EUROCONTROL'] },
  EUROCONTROL: { zh: '欧洲航行安全组织', en: 'EUROCONTROL', cat: 'org',
    def: { zh: '欧洲空管协调组织，A-CDM 规范（16 里程碑、TOBT/TSAT 定义）出自它。', en: 'The European ATM coordination body that publishes the A-CDM specification defining the 16 milestones and TOBT/TSAT.' }, see: ['A-CDM'] },
  ACI: { zh: '国际机场协会', en: 'Airports Council International', cat: 'org',
    def: { zh: '机场的行业组织，ASQ 旅客满意度测评由它运营。', en: 'The airports\' trade body, which runs the ASQ passenger satisfaction programme.' }, see: ['ASQ'] },
  'Ground Handler': { zh: '地面服务代理', en: 'Ground handling agent', cat: 'org',
    def: { zh: '"看不见的雇主"：旅客以为在和航空公司打交道，实际很多机场里柜台与登机口的员工来自地服代理，但他登录的是**航司的 DCS**。地服按架次或按服务项收费。', en: 'The invisible employer: the agent at the desk often works for a handler, yet logs into the airline\'s DCS. Handlers are paid per turn or per service.' }, see: ['DCS', 'GSE'] },
};

// ── 索引：别名 → 目标 ────────────────────────────────────────
// kind: system / message / domain / term
const INDEX = new Map();
const add = (alias, target) => {
  if (!alias) return;
  const k = String(alias).trim();
  if (!k || INDEX.has(k)) return;      // 先注册者优先
  INDEX.set(k, target);
};

// ① 系统（最具体，优先）
for (const [id, s] of Object.entries(SYSTEMS)) {
  add(s.abbr, { kind: 'system', id });
  add(s.name?.zh, { kind: 'system', id });
}
// ② 报文
for (const id of Object.keys(MESSAGES)) add(id, { kind: 'message', id });
// ③ 管理域
for (const d of DOMAINS) { add(d.name.zh, { kind: 'domain', id: d.id }); add(d.name.en, { kind: 'domain', id: d.id }); }
for (const c of CROSSCUTTING) add(c.id.toUpperCase(), { kind: 'domain', id: c.id });
// ④ 术语
for (const [id, t] of Object.entries(TERMS)) {
  add(id, { kind: 'term', id });
  add(t.zh, { kind: 'term', id });
}

// 手工补的同义词（写法不一致时也要能点开）
const ALIASES = {
  'ACDM': 'A-CDM', 'A‑CDM': 'A-CDM', '机场协同决策': 'A-CDM',
  '全面机场管理': 'TAM', 'Total Airport Management': 'TAM',
  '决策支持系统': 'DSS', '机场运行计划': 'AOP', '网络运行计划': 'NOP',
  '目标撤轮档时间': 'TOBT', '目标开车许可时间': 'TSAT',
  '实际撤轮档时间': 'AOBT', '实际上轮档时间': 'AIBT', '实际起飞时间': 'ATOT',
  '准点率': 'OTP', '过站时间': 'TAT', '行李错运率': 'MBR', '最短衔接时间': 'MCT',
  '行李牌号': 'LPN', '电子客票': 'ET', '旅客订座记录': 'PNR',
  'Resolution 753': 'Res 753', 'IATA Resolution 753': 'Res 753', '决议 753': 'Res 753',
  '快速通道': 'Fast Track', '集装箱': 'ULD', '地面保障设备': 'GSE',
  '桥载空调': 'PCA', '桥载电源': 'FEGP', '地面服务代理': 'Ground Handler', '地服': 'Ground Handler',
};
for (const [alias, id] of Object.entries(ALIASES)) {
  if (!INDEX.has(alias) && TERMS[id]) INDEX.set(alias, { kind: 'term', id });
}

export function resolveTerm(token) { return INDEX.get(String(token).trim()) || null; }
export function getTerm(id) { const t = TERMS[id]; return t ? { id, ...t } : null; }

/** 所有可识别别名，按长度倒序 —— 正则要先匹配长的（"A-CDM" 必须先于 "CDM"） */
export function allAliases() {
  return [...INDEX.keys()].sort((a, b) => b.length - a.length);
}

export function termCount() { return INDEX.size; }
