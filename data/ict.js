// 【数据层】每个系统节点的落地视角：主流厂商 / 部署方式 / 工作人员访问方式 /
// ICT 设备需求 / ICT 需求评估（以年旅客吞吐 500 万人次为一个测算单位）
//
// 口径说明：500 万人次/年 ≈ 1.37 万人次/日，高峰小时出发旅客 ≈ 1,300–1,600 人，
// 年起降 ≈ 4 万架次，对应约 20–24 个值机柜台、3–4 条安检通道、6–8 个登机口、
// 1 组行李分拣转盘。下面所有"每 +500 万"的增量都以此为基准，属于**规划量级**，
// 实际以航站楼构型、中转比例、宽体机占比与国际航班占比修正。
//
// 结构：PROFILES[systemId] 覆盖 > LAYER_DEFAULTS[layer] 兜底 > OWNER_DEFAULTS[owner]

const R = (zh, en, base, per5m) => ({ item: { zh, en }, base, per5m });

// ── 按层的通用画像 ────────────────────────────────────────────
const LAYER_DEFAULTS = {
  core: {
    deployment: { zh: '机场自建数据中心双活集群，运行网内闭环；不上公有云（可用性依赖本地网络而非互联网）', en: 'Active-active cluster in the airport data centre on the operational network; not public cloud, since availability depends on the local network' },
    access: { zh: ['运行控制中心固定工作站（7×24 值班）', '各业务部门 Web 只读视图', '大屏看板'], en: ['Fixed workstations in the operations centre (24/7)', 'Read-only web views for business units', 'Video-wall dashboards'] },
    ict: { zh: ['应用/数据库服务器（双活）', '运行网核心交换与冗余链路', '统一时钟源 NTP/PTP', '值班工作站与大屏'], en: ['Application and database servers (active-active)', 'Operational-network core switching with redundant links', 'NTP/PTP time source', 'Duty workstations and video wall'] },
    availability: { zh: '99.99%，RTO < 5 分钟', en: '99.99%, RTO < 5 min' },
  },
  'pax-processing': {
    deployment: { zh: '机场提供硬件与共用平台，航司应用以本地代理或云化方式加载（如 CUPPS/CUSS 平台）', en: 'Airport supplies hardware and the common-use platform; airline applications load locally or from the cloud' },
    access: { zh: ['值机/登机口员工用共用工作站登录航司应用', '地服代理持同一套账号体系', '旅客自助操作'], en: ['Check-in and gate staff log into airline applications on common-use workstations', 'Handlers use the same account model', 'Passengers self-serve'] },
    ict: { zh: ['共用工作站与瘦客户端', '登机牌/行李牌打印机、证件与条码读取器', '接入交换与 PoE 供电', '设备监控与远程重启'], en: ['Common-use workstations and thin clients', 'Boarding pass and bag tag printers, document and barcode readers', 'Access switching with PoE', 'Device monitoring and remote reboot'] },
    availability: { zh: '99.9%，单点故障可切换到相邻工位', en: '99.9%; a failed position falls back to the next desk' },
  },
  baggage: {
    deployment: { zh: '控制层为工业 OT 网络（PLC/SCADA），与办公网物理隔离；管理层部署在运行网', en: 'Control layer on an industrial OT network (PLC/SCADA) physically separated from corporate IT; management layer on the operational network' },
    access: { zh: ['行李控制室 SCADA 操作台', '分拣口与装卸区手持终端', '维护人员现场 HMI'], en: ['SCADA consoles in the baggage control room', 'Handhelds at make-up and loading', 'Local HMI for maintenance'] },
    ict: { zh: ['PLC 与工业交换机（环网冗余）', '扫描器/ATR 读码阵列与 RFID 读写器', '分拣控制服务器与数据库', '手持终端与充电柜'], en: ['PLCs and ring-redundant industrial switches', 'Scanner/ATR arrays and RFID readers', 'Sortation control servers and database', 'Handhelds and charging cabinets'] },
    availability: { zh: '99.95%；停机 1 小时即全场值机排队积压', en: '99.95%; one hour of downtime backs up every check-in queue' },
  },
  airside: {
    deployment: { zh: '飞行区专用网络，室外设备需防雷防雨与电磁兼容认证；多为本地部署', en: 'Dedicated airside network; outdoor equipment needs lightning, weather and EMC certification; almost always on-premise' },
    access: { zh: ['塔台/机坪塔台操作席', '场务与机务车载终端', '巡检手持与执法记录仪'], en: ['Tower and apron-tower positions', 'Vehicle-mounted terminals for airfield and engineering', 'Inspection handhelds'] },
    ict: { zh: ['室外传感器与供电（雷达/多点定位/灯光回路）', '光纤环网与户外机柜', '车载 4G/5G 或专网终端'], en: ['Outdoor sensors and power (radar, MLAT, lighting circuits)', 'Fibre ring and outdoor cabinets', 'Vehicle LTE/5G or private-network terminals'] },
    availability: { zh: '99.99%，涉及安全的子系统需冗余与降级运行方案', en: '99.99%; safety-related subsystems need redundancy and degraded-mode procedures' },
  },
  gh: {
    deployment: { zh: '地服公司自有或机场统一提供的 SaaS，重度依赖移动端', en: 'Handler-owned or airport-provided SaaS, heavily mobile-first' },
    access: { zh: ['一线作业人员手持终端 / 手机 App', '调度室排班与派工工作站', '车载终端'], en: ['Handhelds and phone apps for front-line staff', 'Dispatch workstations for rostering', 'Vehicle terminals'] },
    ict: { zh: ['三防手持终端与充电管理', '机坪 Wi-Fi 或 4G/5G 专网覆盖', '车辆定位（GNSS/UWB）'], en: ['Rugged handhelds and charging', 'Apron Wi-Fi or private LTE/5G', 'Vehicle positioning (GNSS/UWB)'] },
    availability: { zh: '99.5%，可离线暂存后补传', en: '99.5%, with offline capture and later sync' },
  },
  landside: {
    deployment: { zh: '本地部署为主，逐步云化；与市政交通数据交换走专线或 API', en: 'Mostly on-premise, moving to cloud; municipal traffic data exchanged over leased lines or APIs' },
    access: { zh: ['陆侧运行值班席', '停车场收费亭与远程坐席', '交通诱导发布终端'], en: ['Landside duty positions', 'Toll booths and remote agents', 'Traffic-guidance publishing terminals'] },
    ict: { zh: ['ANPR 相机与补光、地感/雷达检测器', '道闸与收费终端', '室外可变情报板'], en: ['ANPR cameras with illumination, loop/radar detectors', 'Barriers and payment terminals', 'Outdoor variable message signs'] },
    availability: { zh: '99.5%，道闸需断电常开的降级策略', en: '99.5%; barriers must fail open on power loss' },
  },
  commercial: {
    deployment: { zh: '商户自有 POS + 机场侧数据采集中台，多为云 SaaS', en: 'Tenant-owned POS plus an airport-side data collection platform, usually cloud SaaS' },
    access: { zh: ['商户店员 POS 终端', '机场商业管理部门 BI 报表', '招商与合同人员 Web'], en: ['Tenant staff on POS', 'Airport commercial team on BI reports', 'Leasing team on web'] },
    ict: { zh: ['POS 终端与支付受理', '商户网络接入与隔离 VLAN', '客流统计相机/传感器'], en: ['POS and payment acceptance', 'Tenant network access on isolated VLANs', 'Footfall cameras and sensors'] },
    availability: { zh: '99.5%，支付链路需离线交易兜底', en: '99.5%, with offline payment fallback' },
  },
  security: {
    deployment: { zh: '安防专网，与运行网、办公网三网隔离；监管要求本地留存', en: 'Dedicated security network segregated from operational and corporate networks; regulators require local retention' },
    access: { zh: ['安保监控中心坐席', '现场安检员与执勤终端', '监管部门受控调阅'], en: ['Security control room positions', 'Front-line screening and patrol terminals', 'Controlled regulator access'] },
    ict: { zh: ['摄像机与视频存储（占全场存储一半以上）', '门禁控制器与读卡器', '安防专网核心与接入'], en: ['Cameras and video storage (over half of all airport storage)', 'Access controllers and readers', 'Security-network core and access'] },
    availability: { zh: '99.9%；视频丢失即合规风险', en: '99.9%; lost video is a compliance risk' },
  },
  facility: {
    deployment: { zh: '楼宇自控为本地 BA 网络（BACnet/Modbus），管理层可上云', en: 'Local building-automation network (BACnet/Modbus) with a cloud-capable management layer' },
    access: { zh: ['设施运行值班室工作站', '维保人员移动工单', '能源看板'], en: ['Facility duty workstations', 'Mobile work orders for technicians', 'Energy dashboards'] },
    ict: { zh: ['DDC 控制器与现场总线', '分项计量表具', '弱电间与 UPS'], en: ['DDC controllers and field buses', 'Sub-metering', 'Comms rooms and UPS'] },
    availability: { zh: '99.5%，暖通/照明需手动降级模式', en: '99.5%; HVAC and lighting need manual fallback' },
  },
  it: {
    deployment: { zh: '双数据中心 + 异地灾备；虚拟化/容器承载绝大多数应用', en: 'Two data centres plus off-site DR; virtualisation and containers host most applications' },
    access: { zh: ['IT 运维团队集中管理', '各系统管理员按最小权限', '第三方厂商受控远程接入'], en: ['Central IT operations', 'Least-privilege system administrators', 'Controlled third-party remote access'] },
    ict: { zh: ['机柜、UPS、精密空调、消防', '计算/存储/备份', '核心交换、防火墙、堡垒机'], en: ['Racks, UPS, precision cooling, suppression', 'Compute, storage, backup', 'Core switching, firewalls, jump hosts'] },
    availability: { zh: '数据中心 Tier III 及以上', en: 'Tier III data centre or above' },
  },
  pss: {
    deployment: { zh: '**航司集中式部署**：全网一套，由 PSS 供应商在其数据中心/云上托管，各机场通过网络接入', en: 'Centralised for the whole airline and hosted by the PSS vendor; every airport connects over the network' },
    access: { zh: ['值机柜台/登机口：机场共用工作站登录航司应用', '航司呼叫中心与商务后台 Web', '地服代理按授权账号使用'], en: ['Desks and gates: airline application on airport common-use workstations', 'Airline contact centre and commercial back office on web', 'Handlers via delegated accounts'] },
    ict: { zh: ['机场侧：共用工作站、打印机、读码器', '广域网/专线到航司或供应商数据中心', '本地缓存与断网降级方案'], en: ['Airport side: common-use workstations, printers, readers', 'WAN or leased line to the airline/vendor data centre', 'Local cache and offline degraded mode'] },
    availability: { zh: '99.95%；断网时靠离线值机（OCI）保底', en: '99.95%; offline check-in covers a network outage' },
  },
  'ops-airline': {
    deployment: { zh: '航司总部集中部署或 SaaS，与各基地通过专线互联', en: 'Centralised at the airline head office or SaaS, linked to bases by leased lines' },
    access: { zh: ['运控中心值班席（7×24）', '签派、机务、机组的专用终端', '机组通过 EFB 平板'], en: ['24/7 positions in the control centre', 'Dedicated terminals for dispatch, engineering and crew', 'Crew via EFB tablets'] },
    ict: { zh: ['运控大厅席位与大屏', '航空数据链（ACARS/SATCOM）接口', 'EFB 平板与内容分发'], en: ['Control-room positions and video wall', 'ACARS/SATCOM datalink interfaces', 'EFB tablets and content distribution'] },
    availability: { zh: '99.95%，运控为业务连续性最高等级', en: '99.95%; the control centre is the top business-continuity tier' },
  },
  'commercial-airline': {
    deployment: { zh: '云优先（电商与分销弹性需求大），核心结算仍多为集中部署', en: 'Cloud-first for e-commerce and distribution; core settlement usually stays centralised' },
    access: { zh: ['商务与收益团队 Web', '呼叫中心坐席', '代理人通过 GDS/NDC 接口'], en: ['Commercial and revenue teams on web', 'Contact-centre agents', 'Agents via GDS/NDC interfaces'] },
    ict: { zh: ['弹性计算与 CDN', 'API 网关与风控', '呼叫中心话务平台'], en: ['Elastic compute and CDN', 'API gateway and fraud control', 'Contact-centre telephony'] },
    availability: { zh: '99.9%，大促与不正常航班期需弹性扩容', en: '99.9%, with elastic scaling for sales peaks and disruption' },
  },
  finance: {
    deployment: { zh: '集中部署，强审计与留痕要求', en: 'Centralised with strong audit and retention requirements' },
    access: { zh: ['财务与结算人员桌面', '审计只读账号'], en: ['Finance and settlement desktops', 'Read-only audit accounts'] },
    ict: { zh: ['应用与数据库服务器', '长周期归档存储', '与清算机构的专线'], en: ['Application and database servers', 'Long-term archive storage', 'Leased lines to settlement bodies'] },
    availability: { zh: '99.5%，可容忍分钟级中断但不可丢数据', en: '99.5%; minutes of downtime are tolerable, data loss is not' },
  },
  atm: {
    deployment: { zh: '空管自有系统，与机场之间通过受控接口交换数据', en: 'ATC-owned, exchanging data with the airport through controlled interfaces' },
    access: { zh: ['管制席位（塔台/进近/区调）', '流量管理席'], en: ['Controller positions (tower, approach, area)', 'Flow management positions'] },
    ict: { zh: ['管制席位与显示', '雷达/多点定位数据链路', '录音录像与回放'], en: ['Controller working positions and displays', 'Radar/MLAT feeds', 'Voice and screen recording'] },
    availability: { zh: '安全关键，双余度 + 应急塔台', en: 'Safety-critical: dual redundancy plus a contingency facility' },
  },
  gov: {
    deployment: { zh: '政府专网部署，机场只提供场地、供电与受控网络接入', en: 'On the government network; the airport provides only space, power and controlled connectivity' },
    access: { zh: ['执勤查验台与自助闸机', '后台审核与情报席位'], en: ['Inspection counters and self-service gates', 'Back-office review positions'] },
    ict: { zh: ['查验终端与生物特征采集', '与机场的隔离接口（单向或受控双向）', '独立机房与供电'], en: ['Inspection terminals and biometric capture', 'Isolated interfaces to airport systems', 'Separate equipment room and power'] },
    availability: { zh: '按国家规定，通常等同关键信息基础设施', en: 'Per national rules, usually treated as critical infrastructure' },
  },
};

const OWNER_FALLBACK = {
  airport: LAYER_DEFAULTS.core,
  airline: LAYER_DEFAULTS['ops-airline'],
  gh: LAYER_DEFAULTS.gh,
  gov: LAYER_DEFAULTS.gov,
  atc: LAYER_DEFAULTS.atm,
  commercial: LAYER_DEFAULTS.commercial,
  transit: LAYER_DEFAULTS.landside,
  pax: {
    deployment: { zh: '旅客自有设备，无需机场部署', en: 'Passenger-owned device; nothing for the airport to deploy' },
    access: { zh: ['旅客本人操作'], en: ['Operated by the passenger'] },
    ict: { zh: ['依赖航站楼公共 Wi-Fi 与蜂窝网覆盖'], en: ['Relies on terminal Wi-Fi and cellular coverage'] },
  },
};

// ── 关键系统的具体画像（覆盖层默认）────────────────────────────
export const PROFILES = {
  aodb: {
    vendors: ['SITA Airport Management', 'Amadeus Airport Operations', 'TAV Technologies', 'INFORM', 'ADB Safegate', 'TravelSky（中国航信）'],
    sizing: {
      basis: { zh: '按年起降架次与接口系统数量测算，与旅客量弱相关但强相关于航班量', en: 'Sized by annual movements and interface count — driven by flights more than passengers' },
      rows: [
        R('应用/数据库虚机', 'App & DB VMs', '双活 4 台（16 vCPU / 64 GB）', '+1 台或 +25% 资源'),
        R('数据库容量（含 3 年归档）', 'Database incl. 3-year archive', '2–4 TB', '+1–2 TB'),
        R('对外接口数', 'External interfaces', '25–40 个（Type B / AIDX / REST）', '+3–6 个'),
        R('并发只读用户', 'Concurrent read users', '150–300', '+80–150'),
      ],
      note: { zh: 'AODB 本身不大，难点在接口数量与数据质量：接口每多一个，主数据不一致的概率就上升一档。', en: 'The AODB is small; the difficulty is interface count and data quality — each new interface adds another chance of master-data drift.' },
    },
  },
  fids: {
    vendors: ['SITA', 'Amadeus', 'RESA', 'TAV Technologies', '中国民航信息 / 本地集成商'],
    access: { zh: ['航显值班员改单（限权）', '各岗位只读', '广播与航显联动由运行席统一控制'], en: ['Restricted editing by display duty staff', 'Read-only elsewhere', 'PA and displays driven together from the ops position'] },
    sizing: {
      basis: { zh: '按航站楼面积、值机岛数与登机口数测算', en: 'Sized by terminal area, check-in islands and gate count' },
      rows: [
        R('显示屏总数', 'Display screens', '120–180 块', '+120–180 块'),
        R('播控服务器 / 播放盒', 'Playout servers / players', '2 台服务器 + 每屏 1 个播放终端', '同比例增加'),
        R('显示专网端口', 'Display network ports', '150–220', '+150–220'),
        R('年耗电（显示部分）', 'Annual power (displays)', '约 25–40 万 kWh', '同比例增加'),
      ],
      note: { zh: '屏幕数量与旅客量近似线性，是航站楼里数量最大的一类 IT 终端，也是弱电点位与运维工单的主要来源。', en: 'Screen count scales almost linearly with passengers — the largest single class of IT endpoints and the main source of cabling points and maintenance tickets.' },
    },
  },
  cuss: {
    vendors: ['Amadeus ACUS', 'SITA', 'Materna IPS', 'Embross', 'IER', 'NCR'],
    deployment: { zh: '机场采购硬件 + 共用平台（本地或云化 CUSS 2.0），航司应用按需下发到终端', en: 'Airport buys the hardware plus a common-use platform (on-premise or cloud CUSS 2.0); airline applications are pushed to the kiosk on demand' },
    access: { zh: ['旅客自助操作', '值机引导员用平板远程协助与解锁', '设备管理员集中监控纸张/故障'], en: ['Self-service by passengers', 'Floor walkers assist and unlock from a tablet', 'Central monitoring of paper and faults'] },
    sizing: {
      basis: { zh: '按高峰小时出发旅客与目标自助率（60–80%）测算，单机处理能力约 30–40 人次/小时', en: 'Sized on peak-hour departing passengers and a 60–80% self-service target; each kiosk handles 30–40 pax/hour' },
      rows: [
        R('自助值机机', 'Kiosks', '8–12 台', '+8–12 台'),
        R('高峰小时出发旅客', 'Peak-hour departing pax', '1,300–1,600 人', '+1,300–1,600 人'),
        R('打印耗材（登机牌+行李条）', 'Print consumables', '约 250–350 万张/年', '同比例增加'),
        R('接入端口与 PoE', 'Access ports / PoE', '每台 1 口，冗余 20%', '同比例增加'),
      ],
      note: { zh: '自助率每提高 10 个百分点，同等旅客量下可少建约 3–4 个人工柜台——这是自助设备最直接的投资回报口径。', en: 'Every 10-point rise in self-service saves roughly 3–4 staffed desks at the same traffic — the cleanest ROI argument for kiosks.' },
    },
  },
  cupps: {
    vendors: ['SITA', 'Amadeus ACUS', 'RESA', 'ARINC (Collins)', 'Materna'],
    sizing: {
      basis: { zh: '按高峰小时出发旅客、平均办理时长（90–150 秒）与目标排队时长（≤10 分钟）测算', en: 'Sized on peak-hour departures, 90–150 s per transaction and a ≤10 minute queue target' },
      rows: [
        R('值机柜台工位', 'Check-in desk positions', '20–24 个', '+18–22 个'),
        R('工作站/瘦客户端', 'Workstations / thin clients', '每工位 1 套', '同比例增加'),
        R('登机牌与行李条打印机', 'BP & bag tag printers', '每工位各 1 台', '同比例增加'),
        R('并发登录航司数', 'Concurrent airlines', '8–15 家', '+4–8 家'),
      ],
      note: { zh: '柜台是"按小时租给不同航司"的资源，所以规划量取决于**高峰小时的航班波形**，不是日均旅客数。', en: 'Desks are rented by the hour, so planning follows the peak-hour wave shape rather than daily average traffic.' },
    },
  },
  sbd: {
    vendors: ['Materna', 'SITA', 'ICM', 'Vanderlande', 'BEUMER', 'Embross'],
    sizing: {
      basis: { zh: '按托运率（国内 45–60%、国际 70–85%）与单机 45–60 秒/件测算', en: 'Sized on checked-bag ratio (45–60% domestic, 70–85% international) at 45–60 s per bag' },
      rows: [
        R('自助托运机位', 'Self bag drop units', '4–6 台', '+4–6 台'),
        R('高峰小时托运件数', 'Peak-hour bags', '800–1,200 件', '+800–1,200 件'),
        R('称重/量方与读码组件', 'Weigh, dimension & read units', '每台 1 套', '同比例增加'),
        R('超规行李回退柜台', 'Out-of-gauge fallback desks', '1–2 个', '+1 个'),
      ],
      note: { zh: '自助托运处理不了超规行李，所以**必须同步规划回退柜台**，否则高峰期回退队列会堵住自助区。', en: 'Self bag drop cannot take out-of-gauge bags, so fallback desks must be planned alongside or the reject queue blocks the whole area.' },
    },
  },
  dcs: {
    vendors: ['Amadeus Altéa Departure Control', 'Sabre SabreSonic Check-in', 'TravelSky DCS（中国航信离港系统）', 'Hitit Crane', 'Unisys AirCore'],
    sizing: {
      basis: { zh: '**由航司按全网规模采购，机场不为它扩容**；机场侧只需保证接入带宽与终端数量', en: 'Bought by the airline for its whole network — the airport does not size it, only the connectivity and endpoints' },
      rows: [
        R('机场侧接入带宽', 'Airport access bandwidth', '每航司 10–50 Mbps 专线/VPN', '按航司数与旅客量同比增加'),
        R('并发登录工位', 'Concurrent positions', '20–40 个（柜台+登机口）', '+18–24 个'),
        R('离线值机（OCI）预案', 'Offline check-in fallback', '每值机岛 1 套', '同比例增加'),
        R('报文吞吐（Type B）', 'Type B message volume', '每航班 30–80 条', '与航班量同比'),
      ],
      note: { zh: '这是最容易被误判的一项：**DCS 的服务器不在机场**。机场要买的是"接得上、断网也能办"，不是算力。', en: 'The most commonly misjudged item: the DCS servers are not at the airport. What the airport buys is connectivity and an offline fallback, not compute.' },
    },
  },
  bhs: {
    vendors: ['BEUMER', 'Vanderlande', 'Siemens Logistics', 'Daifuku', 'Alstef', 'Leonardo'],
    sizing: {
      basis: { zh: '按高峰小时托运件数与分拣能力测算；1 件行李平均触发 6–10 次扫描与状态上报', en: 'Sized on peak-hour bags and sortation capacity; each bag triggers 6–10 scans and status reports' },
      rows: [
        R('分拣能力', 'Sortation capacity', '1,800–2,400 件/小时', '+1,800–2,400 件/小时'),
        R('分拣口（Make-up）', 'Make-up chutes', '6–10 个', '+6–10 个'),
        R('HBS 安检机', 'Hold baggage screening machines', '2–3 台（含冗余）', '+2–3 台'),
        R('ATR 读码阵列 / RFID 点位', 'ATR arrays / RFID points', '8–14 处', '+8–14 处'),
        R('早到行李库容量', 'Early bag store', '300–600 件位', '+300–600 件位'),
        R('PLC 与工业交换机', 'PLCs & industrial switches', '30–60 台', '同比例增加'),
      ],
      note: { zh: 'BHS 是机场最贵、最难改造的资产：**它的分拣能力上限往往就是航站楼的实际处理能力上限**，扩容通常意味着土建。', en: 'The BHS is the most expensive and least alterable asset — its sortation ceiling is usually the terminal\'s real capacity ceiling, and raising it means civil works.' },
    },
  },
  brs: {
    vendors: ['SITA BagManager', 'Amadeus', 'Lyngsoe Systems', 'BEUMER', 'Damarel'],
    sizing: {
      basis: { zh: '按行李件数与 Res 753 四节点的扫描点数测算', en: 'Sized on bag volume and the scan points required by the four Res 753 evidence stages' },
      rows: [
        R('年行李件数', 'Annual bags', '350–500 万件', '+350–500 万件'),
        R('手持扫描终端', 'Handheld scanners', '40–70 台', '+40–70 台'),
        R('状态记录存储（含 2 年留存）', 'Status records (2-year retention)', '1–2 TB', '+1–2 TB'),
        R('BPM 报文量', 'BPM messages', '每件 6–10 条', '同比例增加'),
      ],
    },
  },
  'sec-sys': {
    vendors: ['Smiths Detection', 'Leidos', 'Rapiscan', 'Nuctech（同方威视）', 'Analogic', 'Vanderlande（ATRS）'],
    deployment: { zh: '由安检机构（政府或授权单位）主导，机场提供场地、供电与网络；检测数据留存受监管', en: 'Led by the screening authority; the airport supplies space, power and network. Detection data retention is regulated' },
    access: { zh: ['安检员现场终端与图像判读席', '安检指挥中心排队与开放通道调度', '监管部门抽查与回溯'], en: ['Screener terminals and image review positions', 'Checkpoint command for queue and lane opening', 'Regulator sampling and audit'] },
    sizing: {
      basis: { zh: '按高峰小时旅客与单通道吞吐（传统 130–180 人/小时，CT+ATRS 可达 200–260 人/小时）测算', en: 'Sized on peak-hour passengers against lane throughput: 130–180 pax/h traditional, 200–260 pax/h with CT and automatic tray return' },
      rows: [
        R('安检通道', 'Screening lanes', '3–4 条', '+3–4 条'),
        R('CT / X 光机与安检门', 'CT/X-ray and archways', '每通道 1 套', '同比例增加'),
        R('自动回筐系统 ATRS', 'Automatic tray return', '每通道 1 套（提升 25–40% 吞吐）', '同比例增加'),
        R('图像判读席位', 'Image review positions', '每 2–3 条通道 1 席', '同比例增加'),
        R('图像与日志存储', 'Image & log storage', '按监管留存期，30–100 TB', '同比例增加'),
      ],
      note: { zh: '安检的目标函数是"在监管给定检出率下最快"。**扩通道是土建题，提吞吐才是 ICT 题**——CT + 自动回筐是当前最有效的两项。', en: 'Screening optimises for speed at a mandated detection rate. Adding lanes is a civil problem; raising throughput is the ICT problem — CT plus automatic tray return are the two biggest levers.' },
    },
  },
  cctv: {
    vendors: ['Hikvision（海康）', 'Dahua（大华）', 'Axis', 'Bosch', 'Milestone', 'Genetec', 'Avigilon'],
    sizing: {
      basis: { zh: '按航站楼面积、控制区边界与监管留存期（常见 30–90 天）测算', en: 'Sized on terminal area, restricted-area boundary and the regulated retention period (typically 30–90 days)' },
      rows: [
        R('摄像机数量', 'Cameras', '600–900 路', '+600–900 路'),
        R('视频存储（30 天，2–4 Mbps）', 'Video storage (30 days)', '约 0.6–1.0 PB', '+0.6–1.0 PB'),
        R('存储/分析服务器', 'Storage & analytics servers', '10–20 台', '同比例增加'),
        R('安防网络带宽', 'Security network bandwidth', '汇聚 20–40 Gbps', '同比例增加'),
      ],
      note: { zh: '**视频是机场存储与带宽的最大单一消耗方，通常占全场 ICT 存储的一半以上**。做 ICT 预算时先算它，再算别的。', en: 'Video is the single largest consumer of airport storage and bandwidth — usually more than half of all ICT storage. Budget it first.' },
    },
  },
  net: {
    vendors: ['Cisco', 'Huawei', 'Juniper', 'HPE Aruba', 'Nokia', 'Extreme Networks'],
    sizing: {
      basis: { zh: '按建筑面积、终端数量与三网（运行/办公/旅客）隔离要求测算', en: 'Sized on floor area, endpoint count and the three-network (operational / corporate / public) segregation requirement' },
      rows: [
        R('有线接入端口', 'Wired access ports', '2,500–3,500 口', '+2,500–3,500 口'),
        R('Wi-Fi 接入点', 'Wi-Fi access points', '350–500 个', '+350–500 个'),
        R('弱电间 / 汇聚点', 'Comms rooms', '15–25 处', '+15–25 处'),
        R('骨干带宽', 'Core bandwidth', '双 40–100 Gbps 环网', '按需升级'),
        R('外网出口', 'Internet egress', '2–5 Gbps（旅客 Wi-Fi 为主）', '+2–5 Gbps'),
      ],
      note: { zh: '三网隔离是硬约束：运行网出问题会停航班，旅客网出问题只是投诉。**不要为了省钱把它们并成一张网**。', en: 'Three-network segregation is non-negotiable: an operational-network failure stops flights, a public-network failure only generates complaints. Never merge them to save money.' },
    },
  },
  dc: {
    vendors: ['Dell', 'HPE', 'Huawei', 'Lenovo', 'VMware', 'Nutanix', 'NetApp'],
    sizing: {
      basis: { zh: '按承载的运行系统数量与视频/日志留存测算；视频通常单独建存储池', en: 'Sized on the number of hosted operational systems plus video and log retention; video normally gets its own pool' },
      rows: [
        R('机柜数（不含视频）', 'Racks (excl. video)', '12–20 个', '+8–14 个'),
        R('计算资源', 'Compute', '400–700 vCPU / 2–4 TB 内存', '+250–450 vCPU'),
        R('通用存储', 'General storage', '150–300 TB（三副本）', '+100–200 TB'),
        R('IT 负荷功率', 'IT load', '150–300 kW', '+100–200 kW'),
        R('灾备', 'Disaster recovery', '同城双活 + 异地备份', '同步扩容'),
      ],
    },
  },
  'acdm-sys': {
    vendors: ['EUROCONTROL 规范下的多家实现', 'SITA', 'Amadeus', 'INFORM', 'ADB Safegate', 'TAV Technologies'],
    sizing: {
      basis: { zh: '按航班量测算，与旅客量弱相关；关键投入在**接口与时钟**而非算力', en: 'Driven by movements rather than passengers; the real investment is interfaces and clock discipline, not compute' },
      rows: [
        R('应用虚机', 'Application VMs', '2–4 台', '+1 台'),
        R('接入方（航司/地服/空管）', 'Connected parties', '15–30 家', '+5–10 家'),
        R('TOBT 录入终端 / App', 'TOBT entry terminals & apps', '每保障单位 1–3 个', '同比例增加'),
        R('时钟同步精度', 'Clock accuracy', '全场 < 1 秒（NTP），关键点 PTP', '不变'),
      ],
      note: { zh: 'A-CDM 的一切都建立在"大家的表是一样的"这个前提上。**时钟不同步，里程碑分析全是噪声**。', en: 'Everything in A-CDM assumes the clocks agree. Without synchronisation the milestone analysis is noise.' },
    },
  },
  'gh-rms': {
    vendors: ['INFORM GroundStar', 'Zafire', 'Amadeus Ground Handling', 'ARINC', 'Damarel'],
    sizing: {
      basis: { zh: '按年架次与保障岗位数测算，重度依赖移动终端', en: 'Sized on annual turns and front-line headcount, heavily mobile' },
      rows: [
        R('一线手持终端', 'Front-line handhelds', '120–220 台', '+120–220 台'),
        R('调度席位', 'Dispatch positions', '4–8 个', '+2–4 个'),
        R('机坪无线覆盖', 'Apron wireless', 'Wi-Fi 或 4G/5G 专网全覆盖', '按机位数扩展'),
        R('车辆定位终端', 'Vehicle trackers', '60–120 台', '+60–120 台'),
      ],
    },
  },
  parking: {
    vendors: ['Amano', 'Skidata', 'Designa', 'Scheidt & Bachmann', '捷顺 / 科拓'],
    sizing: {
      basis: { zh: '按停车位数（每百万旅客约 500–900 个车位）与出入口车道数测算', en: 'Sized on space count (roughly 500–900 spaces per million passengers) and lane count' },
      rows: [
        R('停车位', 'Parking spaces', '2,500–4,500 个', '+2,500–4,500 个'),
        R('出入口车道', 'Entry/exit lanes', '8–14 条', '+8–14 条'),
        R('车位引导相机/地磁', 'Space-guidance sensors', '按车位 1:1 或 1:4', '同比例增加'),
        R('无感支付与 ANPR', 'ANPR & frictionless payment', '每车道 1 套', '同比例增加'),
      ],
    },
  },
  paxflow: {
    vendors: ['Xovis', 'Veovo', 'Blip Systems', 'Bosch', 'SITA', 'Amadeus'],
    sizing: {
      basis: { zh: '按需要测量的节点数（安检、边检、值机、登机口、行李转盘）测算', en: 'Sized on the number of measured nodes: security, border, check-in, gates and reclaim' },
      rows: [
        R('计数/排队传感器', 'Counting & queue sensors', '80–150 个', '+80–150 个'),
        R('测量节点', 'Measured nodes', '10–18 处', '+10–18 处'),
        R('预测模型服务', 'Forecast services', '2–4 台虚机（含 GPU 可选）', '+1–2 台'),
      ],
      note: { zh: '这是当前 AI 落地最成熟的场景之一：提前 15–20 分钟预测安检拥堵，让"开通道"来得及。', en: 'One of the most mature AI use cases: predicting checkpoint congestion 15–20 minutes ahead so lanes can be opened in time.' },
    },
  },
  border: {
    vendors: ['Vision-Box', 'IDEMIA', 'Gemalto/Thales', 'Secunet', '各国自研'],
    sizing: {
      basis: { zh: '**只对国际航站楼测算**；按国际高峰小时旅客与查验速度（人工 45–90 秒、e-Gate 20–35 秒）', en: 'Only for international terminals; sized on international peak-hour passengers against 45–90 s manual or 20–35 s e-Gate' },
      rows: [
        R('人工查验台', 'Manual counters', '国际每 500 万：10–16 个', '+10–16 个'),
        R('e-Gate 自助闸机', 'e-Gates', '国际每 500 万：8–14 条', '+8–14 条'),
        R('生物特征采集终端', 'Biometric capture', '每通道 1 套', '同比例增加'),
        R('政府专网接入', 'Government network', '独立链路与机房', '按需扩容'),
      ],
      note: { zh: '这套设备**由政府投资与运维，机场只出场地、供电和受控网络接入**——规划时别把它算进机场 ICT 预算，但必须算进机房与配电容量。', en: 'Government funds and runs this equipment; the airport provides space, power and controlled connectivity. Keep it out of the ICT budget but inside the power and room plan.' },
    },
  },
  vdgs: {
    vendors: ['ADB Safegate', 'Honeywell', 'Cavotec', 'INFORM'],
    sizing: {
      basis: { zh: '按近机位数量测算（每百万旅客约 0.8–1.2 个近机位）', en: 'Sized on contact stands (about 0.8–1.2 contact stands per million passengers)' },
      rows: [
        R('近机位 VDGS', 'VDGS units', '5–8 套', '+5–8 套'),
        R('机位供电与光纤', 'Stand power & fibre', '每机位 1 组', '同比例增加'),
        R('AIBT 自动采集覆盖率', 'Automatic AIBT capture', '目标 > 95% 近机位', '保持'),
      ],
    },
  },
  bgr: {
    vendors: ['Materna', 'Vision-Box', 'IER', 'Embross', 'SITA'],
    sizing: {
      basis: { zh: '按登机口数量测算（每百万旅客约 1.2–1.6 个登机口）', en: 'Sized on gate count (roughly 1.2–1.6 gates per million passengers)' },
      rows: [
        R('登机口', 'Gates', '6–8 个', '+6–8 个'),
        R('登机读码器 / 自助登机门', 'Readers / self-boarding gates', '每口 2 通道', '同比例增加'),
        R('登机口工作站', 'Gate workstations', '每口 1–2 套', '同比例增加'),
      ],
    },
  },
  'oneid': {
    vendors: ['Vision-Box', 'IDEMIA', 'NEC', 'SITA Smart Path', 'Amadeus', '中国航信'],
    deployment: { zh: '生物特征模板集中托管（机场或国家平台），触点侧只做采集与比对；跨境需与政府平台对接', en: 'Templates hosted centrally (airport or national platform); touchpoints only capture and match. Cross-border use requires a government platform' },
    access: { zh: ['旅客自助刷脸', '注册柜台/自助注册机', '异常处置由人工坐席接管'], en: ['Passenger self-service face match', 'Enrolment desks or kiosks', 'Exceptions handed to a staffed position'] },
    sizing: {
      basis: { zh: '按启用生物识别的触点数（值机/托运/安检/边检/登机）与并发比对量测算', en: 'Sized on the number of biometric touchpoints and concurrent match volume' },
      rows: [
        R('生物识别触点', 'Biometric touchpoints', '每 500 万：25–45 个', '+25–45 个'),
        R('比对服务', 'Matching services', '2–4 台（GPU 可选）', '+1–2 台'),
        R('模板存储与留存策略', 'Template storage & retention', '按法规，多为 24 小时内销毁', '不变'),
        R('注册通道', 'Enrolment positions', '4–8 个', '+4–8 个'),
      ],
      note: { zh: '**变的是界面，不变的是数据链**：DCS、BRS、边检系统一个也没少。生物识别只是把五次"出示证件"压成一次注册加五次比对。', en: 'The interface changes, the data chain does not: DCS, BRS and border systems are all still there. Biometrics compress five document checks into one enrolment plus five matches.' },
    },
  },
  pos: {
    vendors: ['Oracle MICROS', 'Toshiba', 'SAP', '商户自有系统 + 机场采集中台'],
    sizing: {
      basis: { zh: '按商业面积与商户数测算（每百万旅客约 800–1,400 m² 商业面积）', en: 'Sized on retail area and tenant count (roughly 800–1,400 m² per million passengers)' },
      rows: [
        R('商户数', 'Tenants', '35–60 家', '+35–60 家'),
        R('POS 终端', 'POS terminals', '90–160 台', '+90–160 台'),
        R('商户网络端口（隔离 VLAN）', 'Tenant ports (isolated VLAN)', '150–250 口', '+150–250 口'),
        R('客流统计点', 'Footfall counters', '每店 1–2 个', '同比例增加'),
      ],
      note: { zh: '安检排队每减少 5 分钟，可消费停留时间就多 5 分钟——这是机场愿意为安检智能化买单的商业逻辑。', en: 'Five minutes off the security queue is five more spendable minutes — the business case for smart screening.' },
    },
  },
  bi: {
    vendors: ['Microsoft Power BI', 'Tableau', 'Qlik', 'Databricks', '自建数据湖'],
    sizing: {
      basis: { zh: '按接入系统数与历史留存年限测算', en: 'Sized on connected systems and years of history retained' },
      rows: [
        R('接入系统数', 'Connected systems', '15–30 个', '+3–6 个'),
        R('数据湖容量（5 年）', 'Data lake (5 years)', '30–80 TB', '+20–50 TB'),
        R('分析用户', 'Analytics users', '80–200 人', '+50–120 人'),
      ],
    },
  },
};

// ── 组装 ───────────────────────────────────────────────────────
export function getIct(system) {
  const p = PROFILES[system.id] || {};
  const layer = LAYER_DEFAULTS[system.layer] || OWNER_FALLBACK[system.owner] || LAYER_DEFAULTS.core;
  return {
    vendors: p.vendors || system.vendors || null,
    deployment: p.deployment || layer.deployment || null,
    access: p.access || layer.access || null,
    ict: p.ict || layer.ict || null,
    availability: p.availability || layer.availability || null,
    sizing: p.sizing || null,
    generic: !PROFILES[system.id],   // true = 用的是同层通用画像，非该系统专属测算
  };
}

export const SIZING_UNIT = {
  zh: '测算单位：年旅客吞吐 500 万人次（≈ 1.37 万人次/日，高峰小时出发 1,300–1,600 人，年起降约 4 万架次）',
  en: 'Sizing unit: 5 million annual passengers (≈13,700/day, 1,300–1,600 departing in the peak hour, ~40,000 movements/year)',
};
