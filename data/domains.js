// 【数据层】机场管理域地图 —— 右侧面板的骨架（报告 §6）
// 8 个一级域 + 4 个贯穿层。当前步骤所属域高亮，其余域并列可点击，
// 这就是用户要求的"更加高一层级的知识与信息解释"。

export const DOMAINS = [
  {
    id: 'landside', icon: '🚇', color: '#7fc7c2',
    name: { zh: '陆侧交通管理', en: 'Landside / Ground Transportation' },
    scope: {
      zh: '机场红线外到航站楼门口的一切移动：轨道接驳、机场巴士、出租与网约车池、路侧落客（Curbside）、停车场、旅客捷运 APM、道路信号。',
      en: 'Everything that moves between the public network and the terminal door: rail links, buses, taxi/ride-hail pools, curbside, car parks, APM people movers, road signalling.',
    },
    systems: ['parking', 'anpr', 'curbside', 'transit-op'],
    kpis: [
      { zh: '路侧平均滞留时长（车辆停留秒数）', en: 'Average curbside dwell time per vehicle' },
      { zh: '公共交通分担率', en: 'Public-transport modal share' },
      { zh: '停车场周转率', en: 'Car park turnover' },
      { zh: '门到门时间（Door-to-gate）', en: 'Door-to-gate time' },
    ],
    touchpoints: ['transit', 'entrance'],
    note: {
      zh: '路侧堵塞的第一诱因通常不是车流量，而是"停留时间"——同样的车流，平均滞留从 90 秒降到 60 秒，通行能力就提升三分之一。',
      en: 'Curb congestion is usually driven by dwell time, not volume — cutting average dwell from 90s to 60s lifts throughput by a third.',
    },
  },
  {
    id: 'terminal', icon: '🏛️', color: '#e8b86d',
    name: { zh: '航站楼管理', en: 'Terminal Operations' },
    scope: {
      zh: '航站楼内的旅客流与空间：值机岛与柜台分配、安检排队组织、登机口指派、寻路标识、航显、保洁、暖通与电梯设施。',
      en: 'Passenger flow and space inside the terminal: check-in island and desk allocation, queue management, gate assignment, wayfinding, FIDS, cleaning, HVAC and lifts.',
    },
    systems: ['rms', 'fids', 'paxflow', 'pa'],
    kpis: [
      { zh: '安检排队时长（均值 / 95 分位）', en: 'Queue time (mean / 95th percentile)' },
      { zh: '航显准确率与刷新时延', en: 'FIDS accuracy & refresh latency' },
      { zh: '寻路成功率', en: 'Wayfinding success rate' },
      { zh: 'ASQ 旅客满意度', en: 'ACI ASQ score' },
    ],
    touchpoints: ['entrance', 'checkin', 'security', 'dwell', 'gate'],
    note: {
      zh: '航站楼管理不生产航班，它生产"确定性"：让旅客在正确的时间出现在正确的位置，其余各域才有可能准点。',
      en: 'Terminal ops does not produce flights — it produces certainty: getting the right passenger to the right place at the right time so every other domain can be on time.',
    },
  },
  {
    id: 'baggage', icon: '🧳', color: '#c9a3d9',
    name: { zh: '行李管理', en: 'Baggage Operations' },
    scope: {
      zh: '从值机注入、分拣、安检（HBS）、装载、中转到到达提取的全链路；核心是"每一件行李在任何时刻都必须可定位"。',
      en: 'End-to-end: injection at check-in, sortation, hold-baggage screening, loading, transfer and reclaim. Every bag must be locatable at any moment.',
    },
    systems: ['bhs', 'brs', 'hbs'],
    kpis: [
      { zh: 'MBR 行李错运率（每千名旅客件数）', en: 'Mishandled bag rate (per 1000 pax)' },
      { zh: 'IATA Res 753 四节点覆盖率', en: 'Res 753 four-point coverage' },
      { zh: '分拣口溢出次数', en: 'Make-up overflow events' },
      { zh: '首件/末件到达转盘时间', en: 'First/last bag on belt time' },
    ],
    touchpoints: ['bagdrop', 'bhs', 'gate'],
    note: {
      zh: '行李是唯一"和旅客分离但必须与旅客同机"的对象，因此它的数据链（BSM/BPM/BUM）既是服务问题，也是安保问题。',
      en: 'Baggage is the only object separated from its passenger yet required to fly with them — so its data chain is a security matter as much as a service one.',
    },
  },
  {
    id: 'airside', icon: '🛫', color: '#8fb6e8',
    name: { zh: '飞行区管理', en: 'Airside Operations' },
    scope: {
      zh: '跑道、滑行道、机坪与机位、助航灯光、道面与除冰、鸟击防范、机位分配与泊位引导。',
      en: 'Runways, taxiways, apron and stands, airfield lighting, pavement and de-icing, wildlife hazard management, stand allocation and docking guidance.',
    },
    systems: ['asmgcs', 'vdgs', 'alcms'],
    kpis: [
      { zh: '跑道小时容量与占用率', en: 'Runway hourly capacity & occupancy' },
      { zh: '机位使用率（近机位 vs 远机位）', en: 'Stand utilisation (contact vs remote)' },
      { zh: '滑行时间 Taxi-out / Taxi-in', en: 'Taxi-out / taxi-in times' },
      { zh: '跑道侵入等安全事件数', en: 'Runway incursion events' },
    ],
    touchpoints: ['boarding', 'pushback'],
    note: {
      zh: '远机位不是"低配版廊桥"，而是机位资源紧张时的容量手段——把它当容量工具而不是服务缺陷，机场的机位排布才做得对。',
      en: 'Remote stands are a capacity tool, not a degraded jetbridge. Treating them as capacity rather than a service defect is what makes stand planning work.',
    },
  },
  {
    id: 'gh', icon: '🛠️', color: '#8fcf7a',
    name: { zh: '地面服务管理', en: 'Ground Handling' },
    scope: {
      zh: '客梯车与摆渡、行李装卸、加油、配餐、清洁与污水、牵引推出、除冰、以及代表航司在柜台与登机口作业。',
      en: 'Steps and buses, bag loading, fuelling, catering, cleaning and lavatory, pushback, de-icing — plus counter and gate duties performed on behalf of airlines.',
    },
    systems: ['gh-rms', 'tms', 'gse'],
    kpis: [
      { zh: 'TAT 过站时间（AIBT → AOBT）', en: 'Turnaround time (AIBT → AOBT)' },
      { zh: '保障节点准时率', en: 'On-time completion of turnaround milestones' },
      { zh: 'GSE 利用率与碰撞事件', en: 'GSE utilisation & ramp damage events' },
      { zh: '人力工时利用率', en: 'Manpower utilisation' },
    ],
    touchpoints: ['checkin', 'bagdrop', 'gate', 'boarding', 'pushback'],
    note: {
      zh: '地服是"看不见的雇主"：旅客以为在和航空公司打交道，实际很多机场里柜台与登机口的员工来自地服代理，登录的却是航司的 DCS。',
      en: 'Ground handling is the invisible employer: the agent at the desk often works for a handler, yet logs into the airline\'s DCS.',
    },
  },
  {
    id: 'airlineops', icon: '✈️', color: '#6fb3d9',
    name: { zh: '航司运行管理', en: 'Airline Operations' },
    scope: {
      zh: '值机与登机、座位与辅营、配载平衡与放行、机组与航班计划、不正常航班处置；拥有旅客与订座数据。',
      en: 'Check-in and boarding, seating and ancillaries, load control and dispatch, crew and flight planning, irregular-operations recovery. Owns the passenger data.',
    },
    systems: ['dcs', 'res', 'inv', 'aoc', 'loyalty', 'bss'],
    kpis: [
      { zh: 'OTP 准点率（D0 / D15）', en: 'On-time performance (D0 / D15)' },
      { zh: 'TOBT 准确度（TOBT vs AOBT 偏差）', en: 'TOBT accuracy (vs AOBT)' },
      { zh: '客座率与辅营收入', en: 'Load factor & ancillary revenue' },
      { zh: '自助值机率', en: 'Self-service check-in rate' },
    ],
    touchpoints: ['checkin', 'bagdrop', 'gate', 'boarding', 'pushback'],
    note: {
      zh: '机场知道"CA1501 有 168 人值机"，航司才知道"张三坐 12A"。这条数据边界由商业分工与数据保护法规共同划定。',
      en: 'The airport knows "168 passengers checked in on CA1501"; only the airline knows "Zhang San is in 12A". Commercial roles and privacy law draw that line together.',
    },
  },
  {
    id: 'security', icon: '🛡️', color: '#d98b6f',
    name: { zh: '安全与安保管理', en: 'Safety & Security' },
    scope: {
      zh: '旅客与行李安检、边检与海关协同、控制区门禁与员工证件、视频监控、周界防护、应急救援（ARFF）。',
      en: 'Passenger and baggage screening, border/customs coordination, restricted-area access control and staff passes, CCTV, perimeter, rescue and firefighting.',
    },
    systems: ['sec-sys', 'border', 'acs', 'arff'],
    kpis: [
      { zh: '通道吞吐（pax / 小时 / 通道）', en: 'Throughput (pax/hour/lane)' },
      { zh: '开箱率与复检率', en: 'Bag-search & re-screen rate' },
      { zh: 'e-Gate 自助查验使用率', en: 'e-Gate self-service rate' },
      { zh: '安保事件与响应时间', en: 'Security incidents & response time' },
    ],
    touchpoints: ['security', 'border', 'bhs'],
    note: {
      zh: '安检的目标函数不是"最快"，而是"在给定检出率下最快"——所有排队优化都必须在监管给定的检出标准之内做文章。',
      en: 'Screening does not optimise for speed but for speed at a mandated detection rate — every queue improvement must live inside the regulator\'s standard.',
    },
  },
  {
    id: 'commercial', icon: '🛍️', color: '#d9c46f',
    name: { zh: '商业与非航管理', en: 'Commercial / Non-aeronautical' },
    scope: {
      zh: '零售、餐饮、免税、广告、贵宾室、停车与租车收益；机场利润的主要来源。',
      en: 'Retail, F&B, duty-free, advertising, lounges, parking and car-rental income — the main source of airport profit.',
    },
    systems: ['pos', 'crm-airport'],
    kpis: [
      { zh: '人均消费（Spend per pax）', en: 'Spend per passenger' },
      { zh: '坪效（每平米销售额）', en: 'Sales per square metre' },
      { zh: '安检后停留时长 Dwell time', en: 'Post-security dwell time' },
      { zh: '非航收入占比', en: 'Non-aeronautical revenue share' },
    ],
    touchpoints: ['dwell'],
    note: {
      zh: '缩短安检排队 = 延长可消费停留时间。这是"体验改善"与"商业收入"少见的正向对齐点，也是机场愿意为安检智能化买单的商业逻辑。',
      en: 'Shorter security queues mean longer spendable dwell — the rare case where experience and revenue align, and the business case for smart screening.',
    },
  },
];

// 贯穿层：不属于任何单一域，但连接所有域
export const CROSSCUTTING = [
  {
    id: 'aodb', icon: '🗄️',
    name: { zh: 'AODB 机场运行数据库', en: 'AODB — Airport Operational Database' },
    note: { zh: '全场航班数据的唯一真源，向 FIDS/RMS/计费/BHS 分发。', en: 'The single source of truth for flight data, feeding FIDS, RMS, billing and BHS.' },
  },
  {
    id: 'acdm', icon: '⏱️',
    name: { zh: 'A-CDM 机场协同决策', en: 'A-CDM — Collaborative Decision Making' },
    note: { zh: '16 个里程碑与 TOBT/TSAT，让各方对"飞机现在什么状态"达成唯一共识。', en: '16 milestones plus TOBT/TSAT give every party one shared view of aircraft state.' },
  },
  {
    id: 'apoc', icon: '🎛️',
    name: { zh: 'APOC / AOP（TAM 指挥层）', en: 'APOC / AOP (the TAM layer)' },
    note: { zh: '一份滚动的机场运行计划 + 一个各域同桌办公的运行控制中心。', en: 'A rolling airport operations plan executed by one co-located operations centre.' },
  },
  {
    id: 'bi', icon: '📊',
    name: { zh: 'BI / DSS / 数字孪生', en: 'BI / DSS / Digital Twin' },
    note: { zh: '把历史与实时数据变成指标、推演与三维态势，支撑 what-if 决策。', en: 'Turns historic and live data into KPIs, what-if simulation and 3D situational awareness.' },
  },
];

export function getDomain(id) { return DOMAINS.find(d => d.id === id); }
