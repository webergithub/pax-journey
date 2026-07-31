// 【数据层】系统节点字典 —— 底部链路条的节点、知识卡的内容来源（报告 §2、§3）
// owner 决定颜色：airport / airline / gov / gh / atc / pax / commercial / transit

export const SYSTEMS = {
  // ── 旅客与陆侧 ────────────────────────────────────────────────
  pax: {
    abbr: 'PAX', owner: 'pax',
    name: { zh: '旅客（手机 / 证件）', en: 'Passenger (phone / documents)' },
    resp: { zh: ['发起每一次交互', '持有客票、证件与行李'], en: ['Initiates every interaction', 'Holds ticket, documents and bags'] },
  },
  'transit-op': {
    abbr: 'TRANSIT', owner: 'transit',
    name: { zh: '轨道 / 巴士运营系统', en: 'Rail / bus operator systems' },
    resp: { zh: ['班次与运力', '票务与闸机', '与机场共享到达量预测'], en: ['Timetable and capacity', 'Ticketing and gates', 'Shares arrival forecasts with the airport'] },
    note: { zh: '机场把航班时刻表反推成"陆侧到达曲线"，交通运营方据此加密班次——这是 TAM 把陆侧纳入管理的第一个实用接口。', en: 'The airport converts its flight schedule into a landside arrival curve; operators use it to add services — the first practical landside interface in TAM.' },
  },
  parking: {
    abbr: 'PARKING', owner: 'airport',
    name: { zh: '停车管理系统', en: 'Car park management' },
    resp: { zh: ['车位库存与引导', '费率与支付', '预约停车'], en: ['Space inventory and guidance', 'Tariffs and payment', 'Pre-booked parking'] },
  },
  anpr: {
    abbr: 'ANPR', owner: 'airport',
    name: { zh: '车牌识别', en: 'Automatic Number Plate Recognition' },
    resp: { zh: ['进出场识别与计时', '网约车/出租车合规稽查'], en: ['Entry/exit recognition and timing', 'Ride-hail and taxi compliance'] },
  },
  curbside: {
    abbr: 'CURB', owner: 'airport',
    name: { zh: '路侧占用监测', en: 'Curbside occupancy monitoring' },
    resp: { zh: ['落客区占用率与滞留时长', '拥堵预警与诱导发布'], en: ['Curb occupancy and dwell time', 'Congestion alerts and diversion messaging'] },
    note: { zh: '成熟做法是"车辆计数层（地感/雷达/ANPR）+ 行人计数层"双层：行人堆积总是先于车辆拥堵出现。', en: 'Best practice pairs a vehicle-counting layer (loops/radar/ANPR) with a pedestrian layer — people pile up before cars do.' },
  },

  // ── 机场运行核心 ─────────────────────────────────────────────
  aodb: {
    abbr: 'AODB', owner: 'airport', layer: 'core',
    name: { zh: '机场运行数据库', en: 'Airport Operational Database' },
    vendors: ['SITA', 'Amadeus Airport', 'TAV Technologies', 'INFORM', 'TravelSky（中国航信）'],
    resp: {
      zh: ['汇聚航季计划（SSIM）与当日动态', '保存机位/廊桥/柜台/转盘分配结果', '向 FIDS、计费、BHS、地服分发唯一真源数据'],
      en: ['Merges seasonal schedule (SSIM) with live movements', 'Holds stand/bridge/desk/belt allocations', 'Distributes the single source of truth to FIDS, billing, BHS and handlers'],
    },
    interfaces: ['fids', 'rms', 'dcs', 'bhs', 'acdm-sys'],
    standards: ['IATA AIDX', 'IATA SSIM'],
    note: { zh: 'AODB 是机场的心脏，但它不含旅客个人数据——它只知道"CA1501 有 168 人值机"。', en: 'The AODB is the airport\'s heart, yet holds no personal data — it only knows "168 checked in on CA1501".' },
  },
  rms: {
    abbr: 'RMS', owner: 'airport', layer: 'core',
    name: { zh: '资源管理系统', en: 'Resource Management System' },
    vendors: ['INFORM GroundStar', 'Amadeus RMS', 'Assaia StandManager', 'SITA'],
    resp: { zh: ['分配有限物理资源：机位、廊桥、值机柜台、登机口、行李转盘与分拣口', '冲突检测与自动重排'], en: ['Allocates scarce physical resources: stands, bridges, desks, gates, belts and make-up chutes', 'Conflict detection and automatic re-allocation'] },
    interfaces: ['aodb', 'fids'],
    note: { zh: '旅客感受到的"去哪个柜台、走哪个登机口"，全部是 RMS 的输出。登机口临时变更就是一次 RMS 重排。', en: 'Which desk, which gate — all RMS output. A last-minute gate change is an RMS re-allocation.' },
  },
  fids: {
    abbr: 'FIDS', owner: 'airport', layer: 'core',
    name: { zh: '航班信息显示系统', en: 'Flight Information Display System' },
    resp: { zh: ['把 AODB 数据渲染到航显屏、广播、App 与网站', '多语言与无障碍播报'], en: ['Renders AODB data to displays, PA, app and web', 'Multilingual and accessible announcements'] },
    interfaces: ['aodb'],
    standards: ['IATA AIDX'],
    note: { zh: '航显是旅客最直接的信息界面，也是"数据链时延"最容易被旅客发现的地方——柜台调整没同步到航显，旅客就会走错。', en: 'Displays are the passenger-facing edge of the data chain, and where latency is most visible — an unsynced desk change sends people to the wrong island.' },
  },
  'acdm-sys': {
    abbr: 'A-CDM', owner: 'airport', layer: 'core',
    name: { zh: 'A-CDM 协同决策平台', en: 'A-CDM platform' },
    resp: { zh: ['维护 16 个里程碑时间戳', '计算并发布 TOBT / TSAT / TTOT', '生成预departure 排序'], en: ['Maintains the 16 milestone timestamps', 'Computes and publishes TOBT / TSAT / TTOT', 'Builds the pre-departure sequence'] },
    interfaces: ['aodb', 'dcs', 'atc'],
    standards: ['EUROCONTROL A-CDM Specification'],
    note: { zh: 'TOBT 是航司/地服的承诺，TSAT 是空管给的排队号。二者的差就是"关门后为什么还要等"。', en: 'TOBT is the handler\'s promise; TSAT is ATC\'s queue ticket. The gap between them is why you wait after the door closes.' },
  },
  apoc: {
    abbr: 'APOC', owner: 'airport', layer: 'core',
    name: { zh: '机场运行控制中心 / AOP', en: 'Airport Operations Centre / AOP' },
    resp: { zh: ['执行滚动的机场运行计划 AOP', '各管理域代表同桌办公、同屏看板', 'what-if 推演与全局取舍'], en: ['Executes the rolling Airport Operations Plan', 'Co-locates every domain around one shared picture', 'What-if simulation and global trade-offs'] },
    standards: ['SESAR PJ04 Total Airport Management'],
  },
  paxflow: {
    abbr: 'PAX-FLOW', owner: 'airport',
    name: { zh: '旅客流量测量与预测', en: 'Passenger flow measurement & forecasting' },
    resp: { zh: ['摄像头/Wi-Fi/BLE 计数与排队时长测量', '按航班时刻预测各节点到达量', '拥堵提前预警'], en: ['Camera/Wi-Fi/BLE counting and queue timing', 'Forecasting arrivals at each node from the schedule', 'Early congestion alerts'] },
    note: { zh: '当前 AI 落地最成熟的三个场景之一：提前 15–20 分钟预测安检拥堵，让开通道来得及。', en: 'One of the three most mature AI use cases: predicting checkpoint congestion 15–20 minutes ahead so lanes can be opened in time.' },
  },
  pa: { abbr: 'PA', owner: 'airport', name: { zh: '广播系统', en: 'Public address' }, resp: { zh: ['登机与寻人广播'], en: ['Boarding calls and passenger paging'] } },

  // ── 共用旅客处理设备（机场提供，跑航司系统）────────────────────
  cuss: {
    abbr: 'CUSS', owner: 'airport', layer: 'pax-processing',
    name: { zh: '共用自助值机终端', en: 'Common Use Self Service kiosk' },
    vendors: ['Amadeus ACUS', 'SITA', 'Materna', 'Embross'],
    resp: { zh: ['一台机器按需加载任意航司的值机应用', '打印登机牌与行李牌', '选座与常旅客识别'], en: ['One kiosk loads any airline\'s check-in application on demand', 'Prints boarding passes and bag tags', 'Seat selection and frequent-flyer recognition'] },
    standards: ['IATA CUSS Technical Specification'],
    note: { zh: '设备是机场的，业务跑在航司 DCS 上——这就是同一台机器前一小时给国航、后一小时给东航、界面完全不同的原因。', en: 'The kiosk belongs to the airport; the transaction runs on the airline\'s DCS — which is why the same box looks completely different hour to hour.' },
  },
  cupps: {
    abbr: 'CUPPS', owner: 'airport', layer: 'pax-processing',
    name: { zh: '共用旅客处理系统（柜台）', en: 'Common Use Passenger Processing System' },
    vendors: ['SITA', 'Amadeus ACUS', 'RESA', 'ARINC'],
    resp: { zh: ['柜台工作站按航司登录不同 DCS', '共用打印机、称重、传送带与读码设备'], en: ['Desk workstations log into different airline DCS', 'Shared printers, scales, belts and readers'] },
    standards: ['IATA RP 1797 (CUPPS)'],
    note: { zh: 'CUPPS 的前身是 CUTE。它让机场把柜台按小时租给不同航司，是航站楼容量能被"复用"的关键。', en: 'CUPPS succeeded CUTE. It lets the airport rent the same desk to different airlines by the hour — the key to reusing terminal capacity.' },
  },
  sbd: {
    abbr: 'SBD', owner: 'airport', layer: 'pax-processing',
    name: { zh: '自助行李托运机', en: 'Self Bag Drop unit' },
    resp: { zh: ['称重与量方', '读取登机牌与行李条', '自动放行进入 BHS'], en: ['Weigh and measure', 'Read boarding pass and bag tag', 'Release the bag into the BHS'] },
    note: { zh: '分一步式（打牌+托运一体）与两步式（先在 Kiosk 打牌，再到 SBD 放包）。超规行李一律无法自助，必须转柜台。', en: 'One-step (tag and drop together) or two-step (tag at a kiosk, drop at the unit). Out-of-gauge bags always fall back to a desk.' },
  },
  bgr: {
    abbr: 'BGR', owner: 'airport', layer: 'pax-processing',
    name: { zh: '登机口读码器 / 自助登机闸机', en: 'Boarding gate reader / self-boarding gate' },
    resp: { zh: ['扫描登机牌或人脸', '把登机结果实时写回航司 DCS'], en: ['Scans the boarding pass or face', 'Writes the boarding event straight back to the airline DCS'] },
  },
  'oneid': {
    abbr: 'One ID', owner: 'airport', layer: 'pax-processing',
    name: { zh: 'One ID 数字身份 / 生物识别', en: 'One ID digital identity / biometrics' },
    resp: { zh: ['一次远程注册，多点刷脸核验', '值机、托运、安检、边检、登机五点统一凭证'], en: ['Enrol once remotely, verify by face at every touchpoint', 'One credential across check-in, bag drop, security, border and boarding'] },
    standards: ['IATA One ID', 'ICAO DTC', 'W3C Verifiable Credentials'],
    note: { zh: '变的是界面，不变的是数据链：背后的 DCS、BRS、边检系统一个也没少，只是把五次"出示证件"压缩成一次注册加五次比对。', en: 'The interface changes, the data chain does not: DCS, BRS and border systems are all still there — five document checks simply become one enrolment plus five matches.' },
  },

  // ── 航空公司 PSS ─────────────────────────────────────────────
  res: {
    abbr: 'RES', owner: 'airline', layer: 'pss',
    name: { zh: '订座系统（PSS）', en: 'Reservation (PSS)' },
    vendors: ['Amadeus Altéa Reservation', 'SabreSonic', 'TravelSky ICS（中国航信）'],
    resp: { zh: ['创建与维护 PNR 旅客订座记录', '改期、退票、特殊服务 SSR', '电子客票状态'], en: ['Creates and maintains the PNR', 'Changes, refunds, special service requests', 'Electronic ticket status'] },
    interfaces: ['inv', 'dcs', 'loyalty'],
  },
  inv: {
    abbr: 'INV', owner: 'airline', layer: 'pss',
    name: { zh: '运力舱位系统（PSS）', en: 'Inventory (PSS)' },
    vendors: ['Amadeus Altéa Inventory', 'SabreSonic', 'TravelSky（中国航信）'],
    resp: { zh: ['管理航班、舱位与可售座位', '超售策略', '与收益管理联动定价'], en: ['Manages flights, classes and seat availability', 'Overbooking policy', 'Feeds revenue management'] },
    interfaces: ['res', 'dcs'],
  },
  dcs: {
    abbr: 'DCS', owner: 'airline', layer: 'pss',
    name: { zh: '离港控制系统（PSS 核心）', en: 'Departure Control System (PSS core)' },
    vendors: ['Amadeus Altéa Departure Control', 'SabreSonic Check-in', 'TravelSky DCS（中国航信离港系统）'],
    resp: {
      zh: [
        'CM 客户管理侧：值机、选座、行李接收、证件与签证核验、登机',
        'FM 航班管理侧：配载平衡 Weight & Balance、载重表 Loadsheet、舱单',
        '在值机开放时从 INV 接收 PNL，并持续用 ADL 增量刷新',
      ],
      en: [
        'Customer Management: check-in, seating, bag acceptance, document checks, boarding',
        'Flight Management: weight & balance, loadsheet, load distribution',
        'Receives the PNL at check-in opening and refreshes continuously via ADL',
      ],
    },
    interfaces: ['res', 'inv', 'bhs', 'aodb', 'border', 'bss', 'brs'],
    standards: ['IATA Type B', 'IATA AIDX'],
    note: { zh: '旅客在机场设备上办的每一件事，最终都落到某家航司的 DCS 里。它是旅客数据的实际归属地。', en: 'Everything a passenger does on airport equipment lands in some airline\'s DCS. That is where passenger data actually lives.' },
  },
  loyalty: {
    abbr: 'FQTV/CRM', owner: 'airline',
    name: { zh: '常旅客与客户管理', en: 'Loyalty & CRM' },
    resp: { zh: ['会员识别与等级权益', '积分累积与兑换', '客户画像与个性化'], en: ['Member recognition and tier benefits', 'Accrual and redemption', 'Customer profiling and personalisation'] },
  },
  bss: {
    abbr: 'BSS', owner: 'airline',
    name: { zh: '商务支撑系统（收入结算）', en: 'Business Support System (revenue accounting)' },
    resp: { zh: ['按实际承运数据确认收入', '与 BSP / ICH / ACH 清算', '辅营（选座、行李、餐食）计费'], en: ['Recognises revenue from actual carriage', 'Settlement via BSP / ICH / ACH', 'Ancillary billing for seats, bags and meals'] },
    note: { zh: '注意区分：航司语境的 BSS = Business Support System（商务支撑），与机场的 BHS（行李处理）、BRS（行李核对）完全是两回事。', en: 'Do not confuse: in airline IT, BSS means Business Support System — nothing to do with the airport\'s BHS (handling) or BRS (reconciliation).' },
  },
  aoc: {
    abbr: 'AOC', owner: 'airline',
    name: { zh: '航司运行控制中心', en: 'Airline Operations Control' },
    resp: { zh: ['航班监控与放行', '延误、取消、备降与调机决策', '机组与飞机资源再分配'], en: ['Flight watch and dispatch release', 'Delay, cancellation, diversion and ferry decisions', 'Re-allocating crew and aircraft'] },
  },

  // ── 行李 ─────────────────────────────────────────────────────
  bhs: {
    abbr: 'BHS', owner: 'airport', layer: 'baggage',
    name: { zh: '行李处理系统（物理）', en: 'Baggage Handling System (physical)' },
    vendors: ['BEUMER', 'Vanderlande', 'Siemens Logistics', 'Daifuku'],
    resp: { zh: ['传送、分拣、缓存与提取', 'ATR 自动读码与人工编码站', '把行李送到正确的分拣口'], en: ['Conveying, sortation, storage and reclaim', 'Automatic tag readers and manual encoding', 'Delivering each bag to the right make-up chute'] },
    interfaces: ['dcs', 'brs', 'hbs'],
    note: { zh: 'BHS 是机场资产中最贵、最难改造的一部分——它的分拣能力上限，往往就是航站楼的实际处理能力上限。', en: 'The BHS is the most expensive and least alterable airport asset — its sortation ceiling is usually the terminal\'s real capacity ceiling.' },
  },
  brs: {
    abbr: 'BRS', owner: 'airport', layer: 'baggage',
    name: { zh: '行李核对系统（数据）', en: 'Baggage Reconciliation System (data)' },
    resp: { zh: ['逐件跟踪行李状态', '人包一致核对（旅客未登机则必须卸包）', '满足 IATA Res 753 的证据留存'], en: ['Tracks every bag\'s state', 'Bag-passenger reconciliation — no passenger, no bag', 'Keeps the evidence required by IATA Res 753'] },
    standards: ['IATA Resolution 753'],
  },
  hbs: {
    abbr: 'HBS', owner: 'gov', layer: 'baggage',
    name: { zh: '托运行李安检', en: 'Hold Baggage Screening' },
    resp: { zh: ['EDS / CT 断层扫描逐件检查', '多级分流：自动放行 → 图像复核 → 人工开包'], en: ['EDS/CT screening of every bag', 'Multi-level flow: auto-clear → image review → manual search'] },
  },

  // ── 飞行区与地服 ─────────────────────────────────────────────
  asmgcs: { abbr: 'A-SMGCS', owner: 'atc', name: { zh: '先进场面活动引导与控制', en: 'Advanced Surface Movement Guidance & Control' }, resp: { zh: ['场面雷达与多点定位', '滑行冲突与跑道侵入告警'], en: ['Surface radar and multilateration', 'Taxi conflict and runway incursion alerting'] } },
  vdgs: { abbr: 'VDGS', owner: 'airport', name: { zh: '目视泊位引导系统', en: 'Visual Docking Guidance System' }, resp: { zh: ['引导飞机精确停位', '自动产生 AIBT 上轮档时间戳'], en: ['Guides the aircraft to the stop line', 'Automatically produces the AIBT timestamp'] } },
  alcms: { abbr: 'ALCMS', owner: 'airport', name: { zh: '助航灯光控制与监控', en: 'Airfield Lighting Control & Monitoring' }, resp: { zh: ['滑行道中线灯引导', '低能见度运行'], en: ['Taxiway centreline guidance', 'Low-visibility operations'] } },
  'gh-rms': { abbr: 'GH-RMS', owner: 'gh', name: { zh: '地服资源管理', en: 'Ground handling resource management' }, vendors: ['INFORM GroundStar', 'Zafire', 'Amadeus'], resp: { zh: ['人员排班与资质匹配', 'GSE 设备调度', '实时任务派发到手持终端'], en: ['Rostering and qualification matching', 'GSE dispatch', 'Real-time task push to handheld devices'] } },
  tms: { abbr: 'TMS', owner: 'gh', name: { zh: '过站保障管理', en: 'Turnaround management' }, vendors: ['Assaia TurnaroundControl', 'INFORM', 'ADB Safegate'], resp: { zh: ['13–20 个保障节点的计划与实际时间', '超时预警与 TOBT 更新依据', 'AI 视觉自动识别节点开始/结束'], en: ['Planned vs actual times for 13–20 turnaround milestones', 'Overrun alerts and TOBT evidence', 'AI vision auto-detects milestone start/stop'] } },
  gse: { abbr: 'GSE', owner: 'gh', name: { zh: '地面保障设备', en: 'Ground Support Equipment' }, resp: { zh: ['牵引车、行李车、客梯、加油、配餐、除冰', '电动化与位置监控'], en: ['Tugs, dollies, steps, fuel, catering, de-icing', 'Electrification and position tracking'] } },

  // ── 政府与其他 ───────────────────────────────────────────────
  border: {
    abbr: 'BORDER', owner: 'gov',
    name: { zh: '边检 / 海关系统', en: 'Border control / customs' },
    resp: { zh: ['护照与签证查验、e-Gate 自助查验', '接收航司的 API / APIS / PNRGOV 预报', '出入境记录（如欧盟 EES）'], en: ['Passport and visa checks, e-Gates', 'Receives API / APIS / PNRGOV from airlines', 'Entry/exit records such as the EU EES'] },
    standards: ['ICAO Annex 9', 'IATA/ICAO/WCO PAXLST'],
    note: { zh: '旅客因证件不符被拒绝入境，遣返成本由承运人承担——所以航司 DCS 必须在值机环节就用规则库预判。', en: 'If a passenger is refused entry, the carrier pays for the return — which is why the airline\'s DCS must pre-check documents at check-in.' },
  },
  'sec-sys': { abbr: 'SEC', owner: 'gov', name: { zh: '安检信息系统', en: 'Security screening system' }, resp: { zh: ['人证核验与登机牌校验', '通道开放数与排队预测', '开包与复检记录'], en: ['Identity and boarding-pass verification', 'Lane opening and queue prediction', 'Search and re-screen records'] } },
  acs: { abbr: 'ACS', owner: 'airport', name: { zh: '门禁与员工证件', en: 'Access control & staff passes' }, resp: { zh: ['控制区权限', '员工背景审查关联'], en: ['Restricted-area permissions', 'Linked background vetting'] } },
  arff: { abbr: 'ARFF', owner: 'airport', name: { zh: '应急救援与消防', en: 'Rescue & firefighting' }, resp: { zh: ['应急响应等级与出动'], en: ['Emergency response categories and dispatch'] } },
  pos: { abbr: 'POS', owner: 'commercial', name: { zh: '商业 POS 与租金分成', en: 'Retail POS & concession revenue' }, resp: { zh: ['销售数据与提成结算', '客流与转化分析'], en: ['Sales data and concession settlement', 'Footfall and conversion analytics'] } },
  'crm-airport': { abbr: 'A-CRM', owner: 'commercial', name: { zh: '机场旅客营销', en: 'Airport passenger marketing' }, resp: { zh: ['停车/免税/餐饮的个性化推荐'], en: ['Personalised parking, duty-free and F&B offers'] } },
  atc: { abbr: 'ATC', owner: 'atc', name: { zh: '空中交通管制', en: 'Air Traffic Control' }, resp: { zh: ['放行、开车许可与推出', '滑行与起降排序', '发布 TSAT 依据的流量限制'], en: ['Clearance, start-up approval and pushback', 'Taxi and departure sequencing', 'Flow restrictions feeding TSAT'] } },
  'airline-app': { abbr: 'APP', owner: 'airline', name: { zh: '航司 App / 官网', en: 'Airline app / website' }, resp: { zh: ['网上值机与电子登机牌', '直连 DCS，不占用机场任何设备'], en: ['Online check-in and mobile boarding pass', 'Talks straight to the DCS, using no airport equipment'] } },
};

export function getSystem(id) {
  const s = SYSTEMS[id];
  return s ? { id, ...s } : { id, abbr: id.toUpperCase(), owner: 'airport', name: { zh: id, en: id } };
}
