// 【数据层】全量管理节点 —— 旅客旅程之外的机场 / 航司 / 空管 / 政府系统
// 与 systems.js 的核心节点合并成一张完整的民航 IT 全景图（landscape.js 负责分组）
// owner: airport / airline / gov / gh / atc / pax / commercial / transit

export const SYSTEMS_MORE = {
  // ══ 机场 · 运行核心 ═══════════════════════════════════════════
  billing: {
    abbr: 'BILLING', owner: 'airport', layer: 'core',
    name: { zh: '航空性收费与计费', en: 'Aeronautical billing' },
    resp: { zh: ['按起降架次/机型/停场时长/旅客人数计费', '廊桥费、桥载电源、地面服务费', '账单生成与对账'], en: ['Charges by movement, aircraft type, parking time and passenger count', 'Bridge, ground power and handling fees', 'Invoicing and reconciliation'] },
    interfaces: ['aodb'],
    note: { zh: '机场的收入直接由 AODB 的时间戳决定：AIBT/AOBT 差一分钟，停场费就差一档。这是"数据质量=钱"最直白的地方。', en: 'Airport revenue is computed straight from AODB timestamps — a minute of AIBT/AOBT error is a billing tier. This is where data quality is literally money.' },
  },
  slot: {
    abbr: 'SLOT', owner: 'airport', layer: 'core',
    name: { zh: '航班时刻与容量协调', en: 'Slot & capacity coordination' },
    resp: { zh: ['航季时刻申请与分配（IATA 时刻会议）', '小时容量与跑道/机位/值机资源约束核算', '时刻使用率监控（use-it-or-lose-it）'], en: ['Seasonal slot requests and allocation', 'Hourly capacity against runway, stand and desk constraints', 'Slot utilisation monitoring'] },
    interfaces: ['aodb'], standards: ['IATA WSG', 'IATA SSIM'],
    note: { zh: '旅客感受到的"为什么这个时段永远很挤"，根子在时刻分配，而不是当天运行。', en: 'The reason a wave always feels crowded is slot allocation, not day-of operations.' },
  },
  bi: {
    abbr: 'BI', owner: 'airport', layer: 'core',
    name: { zh: '数据中台 / BI 分析', en: 'Data platform & BI' },
    resp: { zh: ['汇聚 AODB/DCS/BHS/安检/停车/商业历史数据', '产出 OTP、TAT、ASQ、单位旅客能耗等指标', '为 DSS 与 AI 预测提供训练与回溯数据'], en: ['Consolidates historic data from AODB, DCS, BHS, security, parking and retail', 'Produces OTP, TAT, ASQ and energy-per-passenger metrics', 'Feeds DSS and AI prediction'] },
    interfaces: ['aodb', 'paxflow', 'pos'],
  },
  twin: {
    abbr: 'TWIN', owner: 'airport', layer: 'core',
    name: { zh: '数字孪生 / 三维态势', en: 'Digital twin' },
    resp: { zh: ['把 DSS 与 BI 可视化并接入实时数据', '航站楼旅客流仿真、机坪 AI 视觉、全场三维态势'], en: ['Visualises DSS and BI against live data', 'Terminal flow simulation, apron AI vision, whole-airport 3D awareness'] },
    interfaces: ['aodb', 'bi', 'paxflow'],
  },
  esb: {
    abbr: 'ESB', owner: 'airport', layer: 'core',
    name: { zh: '集成中台 / 消息总线', en: 'Integration bus' },
    resp: { zh: ['把 Type B 报文、AIDX XML、REST/Kafka 之间互转', '统一鉴权、限流、审计与重放', '避免系统两两点对点直连'], en: ['Bridges Type B, AIDX XML, REST and Kafka', 'Central auth, throttling, audit and replay', 'Prevents point-to-point spaghetti'] },
    note: { zh: '一个 30 系统的机场，若两两直连是 435 条接口；走总线是 30 条。ESB 的价值不在技术，在把接口数量从平方降到线性。', en: 'Thirty systems wired pairwise is 435 interfaces; through a bus it is 30. The value is turning a quadratic into a linear.' },
  },
  mdm: {
    abbr: 'MDM', owner: 'airport', layer: 'core',
    name: { zh: '主数据管理', en: 'Master data management' },
    resp: { zh: ['机位/廊桥/柜台/登机口/转盘的唯一编码', '航司、机型、代理人主数据', '编码变更的全网同步'], en: ['Single coding for stands, bridges, desks, gates and belts', 'Airline, aircraft type and agent master data', 'Propagating code changes network-wide'] },
    note: { zh: '"C21 登机口"在五个系统里叫五个名字，是机场集成里最常见也最贵的坑。', en: 'Gate "C21" having five different names in five systems is the most common and costly integration defect.' },
  },

  // ══ 机场 · 旅客处理（旅程外）══════════════════════════════════
  queue: {
    abbr: 'QMS', owner: 'airport', layer: 'pax-processing',
    name: { zh: '排队管理与预约', en: 'Queue management & slot booking' },
    resp: { zh: ['实时排队时长测量与发布', '安检预约时段（Security Time Slot）', '按预测提前开通道'], en: ['Live queue measurement and publication', 'Security time-slot booking', 'Opening lanes ahead of the forecast'] },
    interfaces: ['paxflow', 'sec-sys'],
  },
  wayfind: {
    abbr: 'WAYFIND', owner: 'airport', layer: 'pax-processing',
    name: { zh: '导向标识与动态引导', en: 'Wayfinding & dynamic signage' },
    resp: { zh: ['静态标识体系与动态屏引导', '按登机口变更实时改指向', '室内导航与无障碍路径'], en: ['Static signage plus dynamic screens', 'Re-pointing on gate changes', 'Indoor navigation and accessible routes'] },
    interfaces: ['aodb', 'fids'],
  },
  prm: {
    abbr: 'PRM', owner: 'airport', layer: 'pax-processing',
    name: { zh: '特殊旅客服务调度', en: 'Special assistance (PRM) dispatch' },
    resp: { zh: ['轮椅、无人陪伴儿童、担架旅客的任务派发', '与航司 PSM 报文对接', '服务时效与合规记录'], en: ['Dispatching wheelchair, unaccompanied minor and stretcher services', 'Consumes the airline PSM message', 'Timeliness and compliance records'] },
    interfaces: ['dcs', 'gh-rms'],
  },
  airportapp: {
    abbr: 'A-APP', owner: 'airport', layer: 'pax-processing',
    name: { zh: '机场 App / 官网 / 小程序', en: 'Airport app & website' },
    resp: { zh: ['航班查询、停车预约、餐饮预订、排队时长', '会员与消费权益', '与商业系统打通做精准推荐'], en: ['Flight lookup, parking booking, F&B pre-order, queue times', 'Membership and benefits', 'Linked to retail for personalised offers'] },
    interfaces: ['fids', 'parking', 'pos'],
  },

  // ══ 机场 · 行李（旅程外）══════════════════════════════════════
  ebs: {
    abbr: 'EBS', owner: 'airport', layer: 'baggage',
    name: { zh: '早到行李库', en: 'Early Bag Store' },
    resp: { zh: ['缓存过早托运的行李', '按分拣口开放时间自动释放', '削峰，避免分拣口溢出'], en: ['Buffers bags checked in too early', 'Releases them when the make-up chute opens', 'Peak shaving to prevent chute overflow'] },
    interfaces: ['bhs'],
  },
  worldtracer: {
    abbr: 'TRACER', owner: 'airline', layer: 'baggage',
    name: { zh: '行李查询与理赔', en: 'Baggage tracing & claims' },
    resp: { zh: ['不正常行李登记与全球匹配', '赔付与配送', '与 BRS 的最后扫描点对齐'], en: ['Mishandled bag files and global matching', 'Compensation and delivery', 'Aligned with the last BRS scan point'] },
    interfaces: ['brs', 'dcs'], standards: ['IATA Res 753'],
  },
  rfid: {
    abbr: 'RFID', owner: 'airport', layer: 'baggage',
    name: { zh: 'RFID 行李全流程跟踪', en: 'RFID bag tracking' },
    resp: { zh: ['替代/补充条码读取，读取率显著高于光学', '装机、中转、到达节点自动打点'], en: ['Supplements barcode reading with far higher read rates', 'Automatic capture at loading, transfer and arrival'] },
    interfaces: ['bhs', 'brs'], standards: ['IATA Res 753'],
    note: { zh: '中国主要枢纽推进 RFID 全流程跟踪，本质是把 Res 753 的四个证据点从"能查"提升到"必达"。', en: 'RFID raises the four Res 753 evidence points from "traceable" to "reliably captured".' },
  },

  // ══ 机场 · 飞行区（旅程外）════════════════════════════════════
  deice: {
    abbr: 'DEICE', owner: 'airport', layer: 'airside',
    name: { zh: '除冰管理', en: 'De-icing management' },
    resp: { zh: ['除冰坪与除冰车调度', '除冰液消耗与保持时间（HOT）计算', '与离港排序联动'], en: ['De-icing pad and vehicle scheduling', 'Fluid consumption and holdover time', 'Coupled with departure sequencing'] },
    interfaces: ['acdm-sys', 'gh-rms'],
  },
  rcr: {
    abbr: 'RCR', owner: 'airport', layer: 'airside',
    name: { zh: '跑道状况报告', en: 'Runway Condition Report' },
    resp: { zh: ['道面摩擦系数与污染物评估', '按 ICAO GRF 全球报告格式发布', '影响可用跑道长度与起降限制'], en: ['Friction and contaminant assessment', 'Published in the ICAO Global Reporting Format', 'Drives declared distances and performance limits'] },
    interfaces: ['atc', 'aodb'],
  },
  wildlife: {
    abbr: 'WILDLIFE', owner: 'airport', layer: 'airside',
    name: { zh: '鸟击与野生动物防范', en: 'Wildlife hazard management' },
    resp: { zh: ['鸟情监测与驱赶作业', '鸟击事件记录与上报', '生境治理'], en: ['Bird activity monitoring and dispersal', 'Strike reporting', 'Habitat management'] },
  },
  pavement: {
    abbr: 'PAVE', owner: 'airport', layer: 'airside',
    name: { zh: '道面与场道巡检', en: 'Pavement & airfield inspection' },
    resp: { zh: ['跑道滑行道巡检计划与记录', 'FOD（外来物）管理', '道面状况指数 PCI 与养护计划'], en: ['Inspection scheduling and records', 'Foreign object debris management', 'Pavement condition index and maintenance planning'] },
  },
  apronctl: {
    abbr: 'APRON', owner: 'airport', layer: 'airside',
    name: { zh: '机坪塔台 / 机位分配', en: 'Apron control & stand allocation' },
    resp: { zh: ['机坪内滑行与拖曳指挥', '机位实时占用与冲突处置', '与 RMS 的机位计划对齐'], en: ['Apron taxi and towing control', 'Live stand occupancy and conflict resolution', 'Aligned with the RMS stand plan'] },
    interfaces: ['rms', 'asmgcs', 'vdgs'],
    note: { zh: '机坪指挥归机场还是归空管，各国体制不同——这是"同一个动作、不同主体"的典型例子。', en: 'Whether apron control belongs to the airport or ATC differs by country — a classic same-action-different-owner case.' },
  },

  // ══ 机场 · 地服（旅程外）══════════════════════════════════════
  fuel: {
    abbr: 'FUEL', owner: 'gh', layer: 'gh',
    name: { zh: '航油加注管理', en: 'Fuelling management' },
    resp: { zh: ['加油单与实际加注量', '与配载的燃油数据对齐', '管线/罐车调度与计量'], en: ['Fuel orders versus actual uplift', 'Reconciled with load control', 'Hydrant and bowser scheduling'] },
    interfaces: ['dcs', 'tms'],
  },
  catering: {
    abbr: 'CATER', owner: 'gh', layer: 'gh',
    name: { zh: '配餐管理', en: 'Catering' },
    resp: { zh: ['按订座人数与舱位配备餐食', '装卸车与升降平台调度', '餐食追溯与食品安全'], en: ['Meal counts by cabin and booking', 'Hi-loader scheduling', 'Traceability and food safety'] },
    interfaces: ['dcs', 'tms'],
  },
  cabin: {
    abbr: 'CABIN', owner: 'gh', layer: 'gh',
    name: { zh: '客舱清洁与污水清水', en: 'Cabin cleaning, water & lavatory' },
    resp: { zh: ['过站清洁与深度清洁作业', '清水加注与污水抽吸', '作业时间进入过站节点'], en: ['Transit and deep cleaning', 'Potable water and lavatory service', 'Times feed the turnaround milestones'] },
    interfaces: ['tms'],
  },
  uldmgmt: {
    abbr: 'ULD-M', owner: 'gh', layer: 'gh',
    name: { zh: '集装器管理', en: 'ULD management' },
    resp: { zh: ['ULD 库存、调拨与损伤登记', '与配载 CPM/UCM 报文对齐', '空箱回运'], en: ['ULD stock, movement and damage records', 'Reconciled with CPM/UCM', 'Repositioning of empties'] },
    interfaces: ['dcs'],
  },

  // ══ 机场 · 陆侧（旅程外）══════════════════════════════════════
  taxipool: {
    abbr: 'TAXI', owner: 'airport', layer: 'landside',
    name: { zh: '出租车 / 网约车蓄车池', en: 'Taxi & ride-hail holding pool' },
    resp: { zh: ['蓄车池叫号与放行', '按航班到达曲线动态放量', '合规稽查（与 ANPR 联动）'], en: ['Pool queueing and release', 'Release rate driven by the arrival curve', 'Compliance checks via ANPR'] },
    interfaces: ['anpr', 'aodb'],
  },
  ev: {
    abbr: 'EV', owner: 'airport', layer: 'landside',
    name: { zh: '充电桩与新能源', en: 'EV charging' },
    resp: { zh: ['停车场充电桩运营与计费', '与 GSE 电动化共用配电容量'], en: ['Charger operation and billing', 'Shares distribution capacity with GSE electrification'] },
    interfaces: ['parking', 'ems'],
  },

  // ══ 机场 · 商业（旅程外）══════════════════════════════════════
  concession: {
    abbr: 'CONC', owner: 'commercial', layer: 'commercial',
    name: { zh: '特许经营与租金管理', en: 'Concession & lease management' },
    resp: { zh: ['租约、保底租金与提成结算', '商户经营数据采集', '铺位调整与招商'], en: ['Leases, minimum guarantees and turnover rent', 'Tenant sales capture', 'Unit mix and leasing'] },
    interfaces: ['pos'],
  },
  dutyfree: {
    abbr: 'DF', owner: 'commercial', layer: 'commercial',
    name: { zh: '免税业务', en: 'Duty free' },
    resp: { zh: ['免税品销售与提货（含离境提货）', '登机牌核验与目的地限售规则', '海关监管账册'], en: ['Duty-free sales and collection', 'Boarding-pass validation and destination rules', 'Customs-supervised inventory'] },
    interfaces: ['pos', 'dcs'],
    note: { zh: '免税结账要扫登机牌——那一刻商业系统也在读航司 DCS 的数据（航班号与目的地）。', en: 'Duty-free checkout scans the boarding pass — at that moment retail is reading airline DCS data too.' },
  },
  lounge: {
    abbr: 'LOUNGE', owner: 'commercial', layer: 'commercial',
    name: { zh: '贵宾室管理', en: 'Lounge management' },
    resp: { zh: ['准入核验（舱位/常旅客/权益卡）', '容量与结算', '与航司权益系统对接'], en: ['Entitlement checks by cabin, tier or card', 'Capacity and settlement', 'Linked to airline loyalty'] },
    interfaces: ['dcs', 'loyalty'],
  },
  adv: {
    abbr: 'ADV', owner: 'commercial', layer: 'commercial',
    name: { zh: '广告媒体管理', en: 'Advertising & media' },
    resp: { zh: ['刊位、排期与播控', '客流数据支撑刊例定价'], en: ['Inventory, scheduling and playout', 'Footfall data underpinning rate cards'] },
    interfaces: ['paxflow'],
  },

  // ══ 机场 · 安全安保（旅程外）══════════════════════════════════
  cctv: {
    abbr: 'CCTV', owner: 'airport', layer: 'security',
    name: { zh: '视频监控与智能分析', en: 'CCTV & video analytics' },
    resp: { zh: ['全场视频采集、存储与回溯', '客流计数、遗留物、越界等智能分析', '与安保事件联动调阅'], en: ['Capture, storage and retrieval', 'Analytics for counting, abandoned objects and intrusion', 'Linked to incident management'] },
    interfaces: ['acs', 'paxflow'],
    note: { zh: '视频是机场**存储与网络带宽的最大单一消耗方**，通常占 ICT 存储的一半以上。', en: 'Video is the single largest consumer of airport storage and bandwidth — usually more than half of all ICT storage.' },
  },
  perimeter: {
    abbr: 'PERI', owner: 'airport', layer: 'security',
    name: { zh: '周界防护', en: 'Perimeter protection' },
    resp: { zh: ['围界入侵探测（振动/雷达/红外）', '与 CCTV 联动复核', '巡逻与处置流程'], en: ['Fence intrusion detection', 'Verification via CCTV', 'Patrol and response workflow'] },
    interfaces: ['cctv', 'acs'],
  },
  soc: {
    abbr: 'SOC', owner: 'airport', layer: 'security',
    name: { zh: '网络安全运营中心', en: 'Cyber security operations' },
    resp: { zh: ['关键信息基础设施防护', 'OT/IT 隔离（BHS、A-SMGCS、楼控是高价值攻击面）', '日志、检测、响应与演练'], en: ['Critical-infrastructure protection', 'OT/IT segmentation for BHS, A-SMGCS and building control', 'Logging, detection, response and drills'] },
    note: { zh: '机场是关键信息基础设施：BHS 停一小时的旅客影响，远大于办公网被加密。防护重心必须在 OT 侧。', en: 'An hour of BHS downtime hurts far more than an encrypted office network — protection must centre on the OT side.' },
  },
  incident: {
    abbr: 'INC', owner: 'airport', layer: 'security',
    name: { zh: '应急与事件管理', en: 'Emergency & incident management' },
    resp: { zh: ['应急预案、等级与处置流程', '多部门联动与指挥调度', '演练与复盘'], en: ['Plans, severity levels and workflows', 'Multi-agency command and dispatch', 'Drills and after-action review'] },
    interfaces: ['arff', 'apoc', 'cctv'],
  },

  // ══ 机场 · 设施与能源 ═════════════════════════════════════════
  bim: {
    abbr: 'BIM/FM', owner: 'airport', layer: 'facility',
    name: { zh: 'BIM 与资产设施管理', en: 'BIM & facility management' },
    resp: { zh: ['建筑与机电资产台账', '维保工单与生命周期', '改扩建的空间与管线协同'], en: ['Building and MEP asset register', 'Work orders and lifecycle', 'Space and services coordination for expansion'] },
  },
  bas: {
    abbr: 'BAS', owner: 'airport', layer: 'facility',
    name: { zh: '楼宇自控', en: 'Building automation' },
    resp: { zh: ['暖通、照明、给排水的自动控制', '按客流与航班波动态调节', '与消防联动'], en: ['HVAC, lighting and plumbing control', 'Modulated by passenger and flight waves', 'Interlocked with fire systems'] },
    interfaces: ['ems', 'paxflow'],
  },
  ems: {
    abbr: 'EMS', owner: 'airport', layer: 'facility',
    name: { zh: '能源管理', en: 'Energy management' },
    resp: { zh: ['分项计量与单位旅客能耗', '光伏、储能与需量控制', '桥载电源替代 APU 的减排核算'], en: ['Sub-metering and energy per passenger', 'PV, storage and demand control', 'Carbon accounting for APU replacement'] },
    interfaces: ['bas', 'aodb'],
  },
  lift: {
    abbr: 'LIFT', owner: 'airport', layer: 'facility',
    name: { zh: '电梯扶梯与登机桥监控', en: 'Lifts, escalators & bridge monitoring' },
    resp: { zh: ['设备状态与故障告警', '预测性维护', '影响旅客动线的停用调度'], en: ['Status and fault alarms', 'Predictive maintenance', 'Outage scheduling around passenger flow'] },
  },
  fas: {
    abbr: 'FAS', owner: 'airport', layer: 'facility',
    name: { zh: '消防报警与联动', en: 'Fire alarm & suppression' },
    resp: { zh: ['火灾探测与报警', '与排烟、疏散广播、门禁联动', '法定检验与记录'], en: ['Detection and alarm', 'Interlocks with smoke control, PA and access control', 'Statutory inspection records'] },
    interfaces: ['bas', 'acs', 'pa'],
  },

  // ══ 机场 · 支撑 IT ════════════════════════════════════════════
  dc: {
    abbr: 'DC', owner: 'airport', layer: 'it',
    name: { zh: '数据中心 / 私有云', en: 'Data centre & private cloud' },
    resp: { zh: ['承载运行核心系统的计算与存储', '双活/异地灾备', '虚拟化与容器平台'], en: ['Compute and storage for operational systems', 'Active-active and DR', 'Virtualisation and containers'] },
    note: { zh: '运行类系统（AODB/FIDS/BHS 控制）几乎不上公有云，因为它们的可用性依赖本地网络而不是互联网。', en: 'Operational systems rarely move to public cloud — their availability depends on the local network, not the internet.' },
  },
  net: {
    abbr: 'NET', owner: 'airport', layer: 'it',
    name: { zh: '网络与无线', en: 'Network & wireless' },
    resp: { zh: ['骨干、接入、Wi-Fi、专网与 5G 专网', '运行网/办公网/旅客网隔离', '航站楼弱电间与水平布线'], en: ['Core, access, Wi-Fi, private LTE/5G', 'Segregating operational, corporate and public networks', 'Comms rooms and horizontal cabling'] },
    interfaces: ['dc', 'soc'],
  },
  clock: {
    abbr: 'NTP', owner: 'airport', layer: 'it',
    name: { zh: '时钟同步', en: 'Time synchronisation' },
    resp: { zh: ['全场统一时间源（GPS/北斗 + NTP/PTP）', '保证 A-CDM 时间戳可比', '日志取证的时间一致性'], en: ['One time source for the whole airport', 'Makes A-CDM timestamps comparable', 'Consistent time for forensic logs'] },
    note: { zh: 'A-CDM 的一切都建立在"大家的表是一样的"这个前提上。时钟不同步，里程碑分析全是噪声。', en: 'Everything in A-CDM assumes the clocks agree. Without sync the milestone analysis is noise.' },
  },
  itsm: {
    abbr: 'ITSM', owner: 'airport', layer: 'it',
    name: { zh: 'IT 服务管理与运维', en: 'IT service management' },
    resp: { zh: ['工单、变更、事件与配置管理', '7×24 值班与 SLA', '与航司/地服的服务台对接'], en: ['Tickets, change, incident and configuration management', '24/7 duty and SLAs', 'Interfacing airline and handler service desks'] },
  },

  // ══ 航司 · 商务与收益 ═════════════════════════════════════════
  rm: {
    abbr: 'RM', owner: 'airline', layer: 'commercial-airline',
    name: { zh: '收益管理', en: 'Revenue Management' },
    resp: { zh: ['需求预测与舱位控制', '定价与超售策略', '与 INV 实时联动'], en: ['Demand forecasting and seat control', 'Pricing and overbooking policy', 'Real-time link to inventory'] },
    interfaces: ['inv', 'res'],
    note: { zh: '超售不是失误而是策略：RM 按历史 No-show 率算出可超售的座位数，代价是偶尔要在值机口征集志愿者。', en: 'Overbooking is policy, not error: RM sizes it from historic no-show rates, and pays for it occasionally at the desk.' },
  },
  dist: {
    abbr: 'DIST', owner: 'airline', layer: 'commercial-airline',
    name: { zh: '分销与 GDS / NDC', en: 'Distribution, GDS & NDC' },
    resp: { zh: ['通过 GDS、OTA、官网分销航班与辅营', 'NDC 直连报价与订单', '代理人政策与佣金'], en: ['Distributing flights and ancillaries via GDS, OTA and direct', 'NDC offers and orders', 'Agency policy and commissions'] },
    interfaces: ['inv', 'res'], standards: ['IATA NDC', 'IATA ONE Order'],
  },
  ecom: {
    abbr: 'ECOM', owner: 'airline', layer: 'commercial-airline',
    name: { zh: '航司电商 / App', en: 'Airline e-commerce & app' },
    resp: { zh: ['购票、值机、选座、行李与餐食售卖', '推送与不正常航班通知', '直连 DCS 与 RES'], en: ['Booking, check-in, seats, bags and meals', 'Notifications and disruption messaging', 'Direct to DCS and reservations'] },
    interfaces: ['res', 'dcs', 'loyalty'],
  },
  ra: {
    abbr: 'RA', owner: 'airline', layer: 'finance',
    name: { zh: '收入结算', en: 'Revenue accounting' },
    resp: { zh: ['按实际承运确认收入（由 PFS 触发）', '联运与代码共享分摊', '与 BSP/ICH/ACH 清算'], en: ['Recognising revenue from actual carriage', 'Interline and codeshare prorate', 'BSP/ICH/ACH settlement'] },
    interfaces: ['dcs', 'bss'],
  },
  cargo: {
    abbr: 'CARGO', owner: 'airline', layer: 'cargo',
    name: { zh: '货运订舱与收运', en: 'Cargo booking & acceptance' },
    resp: { zh: ['舱位销售与货物收运', '货物舱单与危险品申报', '与配载共享腹舱容量'], en: ['Capacity sales and acceptance', 'Manifests and dangerous goods', 'Shares belly capacity with load control'] },
    interfaces: ['dcs'],
    note: { zh: '腹舱货与旅客行李抢同一个货舱：配载时先保行李，剩下的容量才给货。', en: 'Belly cargo and bags compete for the same hold; load control serves bags first.' },
  },

  // ══ 航司 · 运行与技术 ═════════════════════════════════════════
  dispatch: {
    abbr: 'DISP', owner: 'airline', layer: 'ops-airline',
    name: { zh: '签派与飞行计划', en: 'Dispatch & flight planning' },
    resp: { zh: ['航路规划、油量与备降场', '性能计算与放行签署', '气象与 NOTAM 集成'], en: ['Route, fuel and alternates', 'Performance calculation and release', 'Weather and NOTAM integration'] },
    interfaces: ['aoc', 'dcs'],
  },
  wx: {
    abbr: 'WX', owner: 'airline', layer: 'ops-airline',
    name: { zh: '气象服务', en: 'Meteorological services' },
    resp: { zh: ['METAR/TAF、危险天气与风切变', '低能见度运行决策支持', '除冰与容量削减的触发条件'], en: ['METAR/TAF, hazards and windshear', 'Low-visibility decision support', 'Triggers for de-icing and capacity reduction'] },
    interfaces: ['atc', 'dispatch', 'acdm-sys'],
  },
  notam: {
    abbr: 'NOTAM', owner: 'atc', layer: 'ops-airline',
    name: { zh: '航行通告 / 航行情报', en: 'NOTAM & aeronautical information' },
    resp: { zh: ['跑道关闭、导航设施不可用等临时信息', '进入签派与机组简令', '影响机场容量申报'], en: ['Temporary information such as runway closures and navaid outages', 'Feeds dispatch and crew briefing', 'Affects declared capacity'] },
  },
  acars: {
    abbr: 'ACARS', owner: 'airline', layer: 'ops-airline',
    name: { zh: 'ACARS 数据链 / OOOI', en: 'ACARS datalink & OOOI' },
    resp: { zh: ['自动上报 Out/Off/On/In 四个时刻（OOOI）', '载重表、性能与故障数据上下行', '是 AOBT/ATOT 的自动数据源之一'], en: ['Automatic Out/Off/On/In reporting', 'Loadsheet, performance and fault data', 'An automatic source for AOBT/ATOT'] },
    interfaces: ['aoc', 'acdm-sys'],
  },
  crew: {
    abbr: 'CREW', owner: 'airline', layer: 'ops-airline',
    name: { zh: '机组计划与跟踪', en: 'Crew planning & tracking' },
    resp: { zh: ['排班、资质与执照有效期', '法定飞行时间与休息（FTL）', '不正常航班下的机组重排'], en: ['Rostering, qualifications and licence validity', 'Flight time limitations and rest', 'Crew recovery during disruption'] },
    interfaces: ['aoc'],
    note: { zh: '延误传播里最硬的约束往往不是飞机而是机组：飞机可以等，机组的法定休息不能压缩。', en: 'The hardest constraint in delay propagation is usually crew, not aircraft — rest rules cannot be compressed.' },
  },
  mro: {
    abbr: 'MRO', owner: 'airline', layer: 'ops-airline',
    name: { zh: '机务维修与航材', en: 'MRO & spares' },
    resp: { zh: ['定检与航线维护计划', '故障保留（MEL）与放行', '航材库存与周转件'], en: ['Base and line maintenance planning', 'MEL deferrals and release to service', 'Spares and rotables'] },
    interfaces: ['aoc'],
  },
  mcc: {
    abbr: 'MCC', owner: 'airline', layer: 'ops-airline',
    name: { zh: '维修控制中心', en: 'Maintenance Control Centre' },
    resp: { zh: ['实时故障处置与航材调拨', '与运控共同决定是否延误/换机', '过站维修任务派发'], en: ['Live defect handling and parts dispatch', 'Deciding with OCC whether to delay or swap aircraft', 'Line tasks during the turn'] },
    interfaces: ['aoc', 'mro', 'tms'],
  },
  disruption: {
    abbr: 'IROPS', owner: 'airline', layer: 'ops-airline',
    name: { zh: '不正常航班旅客再保护', en: 'Disruption & passenger re-accommodation' },
    resp: { zh: ['延误取消下的自动改签与酒店', '旅客通知与补偿（如 EU261）', '与 DCS/RES 联动重出票'], en: ['Automatic rebooking and hotels', 'Notification and compensation', 'Reticketing through DCS and reservations'] },
    interfaces: ['dcs', 'res', 'aoc', 'ecom'],
  },

  // ══ 空管与政府（旅程外）═══════════════════════════════════════
  atfm: {
    abbr: 'ATFM', owner: 'atc', layer: 'atm',
    name: { zh: '空中交通流量管理', en: 'Air Traffic Flow Management' },
    resp: { zh: ['按容量下发流控与时隙（CTOT）', '与本场 A-CDM 的 TSAT 联动', '网络级延误分配'], en: ['Regulations and calculated take-off times', 'Coupled with local TSAT', 'Network-level delay allocation'] },
    interfaces: ['acdm-sys', 'atc'],
    note: { zh: '本场再准点，遇到网络流控也走不了——TSAT 里的等待有一部分来自千里之外的容量瓶颈。', en: 'A perfectly punctual airport still waits when the network is regulated — part of your TSAT delay is a bottleneck far away.' },
  },
  tower: {
    abbr: 'TWR', owner: 'atc', layer: 'atm',
    name: { zh: '塔台自动化', en: 'Tower automation' },
    resp: { zh: ['放行、开车、推出与起降指挥', '电子进程单（EFS）', '与 A-SMGCS 场面监视集成'], en: ['Clearance, start-up, pushback and movement control', 'Electronic flight strips', 'Integrated with surface surveillance'] },
    interfaces: ['asmgcs', 'acdm-sys'],
  },
  customs: {
    abbr: 'CUSTOMS', owner: 'gov', layer: 'gov',
    name: { zh: '海关监管', en: 'Customs' },
    resp: { zh: ['进出境物品申报与查验（红绿通道）', '免税与保税监管账册', '货物通关'], en: ['Declaration and inspection (red/green channels)', 'Duty-free and bonded stock supervision', 'Cargo clearance'] },
    interfaces: ['dutyfree', 'cargo'],
  },
  quarantine: {
    abbr: 'QUAR', owner: 'gov', layer: 'gov',
    name: { zh: '卫生检疫与动植物检疫', en: 'Health & phytosanitary inspection' },
    resp: { zh: ['入境健康申报与体温筛查', '动植物与食品检疫', '疫情期的分流与留观'], en: ['Health declarations and screening', 'Animal, plant and food inspection', 'Segregation during outbreaks'] },
  },
  regulator: {
    abbr: 'REG', owner: 'gov', layer: 'gov',
    name: { zh: '民航监管与数据报送', en: 'Civil aviation regulator reporting' },
    resp: { zh: ['运行数据、准点率、安全事件的法定报送', '资质与运行许可审查', '安保合规检查'], en: ['Mandatory reporting of operations, punctuality and safety events', 'Certification and operating approvals', 'Security compliance audits'] },
    interfaces: ['aodb', 'aoc'],
  },
};
