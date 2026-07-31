// 【数据层】旅客旅程 10 幕 —— 主线、分支、系统链路、知识点（报告 §5、§9）
// flows 里的每条边 = 底部链路条上的一次报文流动：{from, to, msg}
// zone = 3D 世界里的锚点名（scene/world.js 里定义）

export const STEPS = [
  // ── ① 公共交通到机场 ──────────────────────────────────────────
  {
    id: 'transit', icon: '🚇', domain: 'landside', zone: 'transit',
    name: { zh: '公共交通到机场', en: 'Getting to the airport' },
    narrative: {
      zh: '你从市区出发。此刻机场已经在"算你"——它把今天的航班时刻表反推成陆侧到达曲线，据此决定加开几班巴士、开几条落客车道。这是机场的公共交通模块，也是 TAM 把陆侧纳入统一管理的起点。',
      en: 'You set off from the city. The airport is already counting you: it converts today\'s flight schedule into a landside arrival curve and decides how many buses and curb lanes to open. This is the landside module — where TAM starts pulling the landside into one plan.',
    },
    branches: [
      {
        id: 'metro', icon: '🚇',
        label: { zh: '轨道交通', en: 'Airport rail' },
        device: { zh: '车站闸机（交通运营方）', en: 'Station gates (transit operator)' },
        systems: ['transit-op', 'aodb'],
        flows: [{ from: 'aodb', to: 'transit-op', msg: 'PARKFEED' }],
        durationSec: 2400, resource: 0,
        note: { zh: '对机场最友好的方式：零路侧占用、零停车位占用。公共交通分担率是陆侧管理的头号 KPI。', en: 'The airport\'s favourite mode: zero curb, zero parking. Modal share is the landside team\'s headline KPI.' },
      },
      {
        id: 'bus', icon: '🚌',
        label: { zh: '机场巴士', en: 'Airport coach' },
        device: { zh: '巴士站台（交通运营方 + 机场）', en: 'Coach stands (operator + airport)' },
        systems: ['transit-op', 'curbside', 'aodb'],
        flows: [
          { from: 'aodb', to: 'transit-op', msg: 'PARKFEED' },
          { from: 'transit-op', to: 'curbside', msg: 'PARKFEED' },
        ],
        durationSec: 3000, resource: 1,
        note: { zh: '占用专用巴士车道与站台，比小客车效率高一个数量级：一辆车换走 40 个路侧车位需求。', en: 'Uses a dedicated bay: one coach removes about 40 private-car curb movements.' },
      },
      {
        id: 'ridehail', icon: '🚕',
        label: { zh: '网约车 / 出租车', en: 'Ride-hail / taxi' },
        device: { zh: '落客区路侧（机场）', en: 'Departures curb (airport)' },
        systems: ['curbside', 'anpr', 'parking'],
        flows: [
          { from: 'anpr', to: 'curbside', msg: 'PARKFEED' },
          { from: 'curbside', to: 'aodb', msg: 'PARKFEED' },
        ],
        durationSec: 2100, resource: 3,
        note: { zh: '最快也最贵：占用一次落客车位。路侧拥堵的第一诱因是"停留时长"而非车流量——ANPR 计时就是为了管这个。', en: 'Fastest and most expensive to the airport: one curb slot. Congestion is driven by dwell time, not volume — which is what ANPR timing manages.' },
      },
    ],
    knowledge: ['transit-op', 'curbside', 'anpr', 'parking', 'aodb'],
    kpis: [{ zh: '路侧滞留时长 / 公共交通分担率', en: 'Curb dwell time / public transport modal share' }],
    exceptions: [
      { zh: '早高峰路侧堵塞：落客车道被长时间停留的车占满', en: 'Morning curb gridlock: lanes clogged by long-dwelling vehicles' },
      { zh: '末班轨道与红眼航班时刻不匹配', en: 'Last train does not match red-eye departures' },
    ],
  },

  // ── ② 进入航站楼与航显 ────────────────────────────────────────
  {
    id: 'entrance', icon: '🏛️', domain: 'terminal', zone: 'entrance',
    name: { zh: '进入航站楼 · 看航显', en: 'Entering the terminal · reading the FIDS' },
    narrative: {
      zh: '你抬头看航显：CA1501，值机 D 岛。这块屏幕上的每一个字段都来自机场的 AODB，而"D 岛"这个答案是资源管理系统 RMS 算出来的——它刚刚把有限的柜台在几十个航班之间分配了一遍。',
      en: 'You look up: CA1501, check-in island D. Every field on that screen comes from the airport\'s AODB, and the answer "island D" was computed by the Resource Management System, which just divided a finite set of desks among dozens of flights.',
    },
    flows: [
      { from: 'rms', to: 'aodb', msg: 'RESALLOC' },
      { from: 'aodb', to: 'fids', msg: 'FIDSUPD' },
    ],
    knowledge: ['aodb', 'rms', 'fids', 'paxflow'],
    kpis: [{ zh: '航显准确率与刷新时延 / 寻路成功率', en: 'FIDS accuracy and latency / wayfinding success' }],
    exceptions: [
      { zh: '柜台临时调整未同步到航显，旅客走错值机岛', en: 'A desk change not yet propagated to the displays sends passengers to the wrong island' },
    ],
  },

  // ── ③ 值机（第一个分支点）────────────────────────────────────
  {
    id: 'checkin', icon: '🎫', domain: 'terminal', zone: 'checkin',
    name: { zh: '值机', en: 'Check-in' },
    branchTitle: { zh: '你打算怎么值机？', en: 'How will you check in?' },
    narrative: {
      zh: '关键认知就在这一步：**你面前的设备是机场的，你办的业务跑在航空公司的 DCS 上。** 值机开放时，航司的订座/运力系统已经把整份 PNL 旅客名单交给了 DCS，此后靠 ADL 增删表持续刷新。',
      en: 'The key insight lands here: **the device in front of you belongs to the airport; the transaction runs on the airline\'s DCS.** When check-in opened, the airline\'s reservation and inventory systems handed the DCS a full passenger name list, refreshed ever since by addition/deletion lists.',
    },
    branches: [
      {
        id: 'mobile', icon: '📱',
        label: { zh: '手机 / 网上值机', en: 'Mobile / online check-in' },
        device: { zh: '旅客自有手机', en: 'Passenger\'s own phone' },
        systems: ['airline-app', 'dcs'],
        flows: [
          { from: 'inv', to: 'dcs', msg: 'PNL' },
          { from: 'inv', to: 'dcs', msg: 'ADL' },
          { from: 'pax', to: 'airline-app', msg: 'ETKT' },
          { from: 'airline-app', to: 'dcs', msg: 'ETKT' },
          { from: 'dcs', to: 'aodb', msg: 'AIDX' },
        ],
        durationSec: 40, resource: 0,
        note: { zh: '机场资源占用为零，是机场最想推的方式：省下来的柜台可以租给别的航司。能处理的异常也最少。', en: 'Zero airport resource — the mode airports push hardest, because a freed desk can be sold to another airline. It also handles the fewest exceptions.' },
      },
      {
        id: 'kiosk', icon: '🖥️',
        label: { zh: '自助值机机（CUSS）', en: 'Self-service kiosk (CUSS)' },
        device: { zh: '机场共用自助终端 CUSS', en: 'Airport common-use kiosk (CUSS)' },
        systems: ['cuss', 'dcs', 'inv'],
        flows: [
          { from: 'inv', to: 'dcs', msg: 'PNL' },
          { from: 'inv', to: 'dcs', msg: 'ADL' },
          { from: 'pax', to: 'cuss', msg: 'ETKT' },
          { from: 'cuss', to: 'dcs', msg: 'ETKT' },
          { from: 'res', to: 'dcs', msg: 'PSM' },
          { from: 'dcs', to: 'aodb', msg: 'AIDX' },
        ],
        durationSec: 90, resource: 1,
        note: { zh: '你扫证件的一刻，这台机场设备正在登录你所属航司的应用。换一位旅客、换一家航司，同一台机器的界面完全不同。', en: 'The moment you scan your passport, this airport-owned kiosk logs into your airline\'s application. Next passenger, next airline — same box, different screen.' },
      },
      {
        id: 'counter', icon: '🧑‍💼',
        label: { zh: '人工柜台（CUPPS）', en: 'Staffed desk (CUPPS)' },
        device: { zh: '机场共用柜台工作站 CUPPS', en: 'Airport common-use desk (CUPPS)' },
        systems: ['cupps', 'dcs', 'inv', 'res'],
        flows: [
          { from: 'inv', to: 'dcs', msg: 'PNL' },
          { from: 'inv', to: 'dcs', msg: 'ADL' },
          { from: 'res', to: 'dcs', msg: 'PSM' },
          { from: 'pax', to: 'cupps', msg: 'ETKT' },
          { from: 'cupps', to: 'dcs', msg: 'ETKT' },
          { from: 'dcs', to: 'border', msg: 'DOCS' },
          { from: 'dcs', to: 'aodb', msg: 'AIDX' },
        ],
        durationSec: 150, resource: 3,
        note: { zh: '柜台前的员工很可能不是航司员工，而是地服代理——但他登录的是航司的 DCS。能处理的异常最多：超售、特服、超规行李、证件复核、改签。', en: 'The agent is often a ground handler, not an airline employee — yet logs into the airline\'s DCS. Handles the most exceptions: oversales, special services, out-of-gauge bags, document checks, rebooking.' },
      },
    ],
    knowledge: ['cuss', 'cupps', 'dcs', 'res', 'inv', 'airline-app', 'oneid'],
    kpis: [{ zh: '自助值机率 / 平均值机时长 / 柜台排队时间', en: 'Self-service rate / average transaction time / desk queue time' }],
    exceptions: [
      { zh: '证件或签证不符规则库（TIMATIC）→ 拒绝值机', en: 'Documents fail the destination rule base → check-in refused' },
      { zh: '超售（Oversold）→ 志愿者征集与改签', en: 'Oversold flight → volunteer solicitation and rebooking' },
      { zh: '自助机无法出登机牌 → 回退到人工柜台', en: 'Kiosk cannot issue the pass → fall back to a staffed desk' },
    ],
  },

  // ── ④ 行李托运（第二个分支点）────────────────────────────────
  {
    id: 'bagdrop', icon: '🧳', domain: 'baggage', zone: 'bagdrop',
    name: { zh: '行李托运', en: 'Bag drop' },
    branchTitle: { zh: '自助托运，还是柜台托运？', en: 'Self bag drop, or a staffed desk?' },
    narrative: {
      zh: '你把箱子放上传送带。此刻发生的不是"箱子被运走"，而是航司 DCS 发出一条 **BSM 行李源报文**——一个 10 位行李牌号 LPN 从此代表这件箱子，它在数字世界里出生了。IATA Res 753 要求的第一个证据点"接收"，就在这一秒完成。',
      en: 'You put the bag on the belt. What just happened is not "the bag was taken away" but the airline\'s DCS emitting a **Baggage Source Message** — a 10-digit licence plate number now represents this bag. It has been born in the data world, and Res 753\'s first evidence point, acquisition, is satisfied.',
    },
    branches: [
      {
        id: 'sbd', icon: '🤖',
        label: { zh: '自助行李托运（SBD）', en: 'Self bag drop (SBD)' },
        device: { zh: '机场自助托运机（含称重量方与读码）', en: 'Airport self bag drop unit (weigh, measure, read)' },
        systems: ['sbd', 'dcs', 'bhs', 'brs'],
        flows: [
          { from: 'pax', to: 'sbd', msg: 'ETKT' },
          { from: 'sbd', to: 'dcs', msg: 'ETKT' },
          { from: 'dcs', to: 'bhs', msg: 'BSM' },
          { from: 'bhs', to: 'brs', msg: 'BPM' },
          { from: 'dcs', to: 'aodb', msg: 'AIDX' },
        ],
        durationSec: 55, resource: 1,
        note: { zh: '快、省人力，但处理不了超规。行李牌通常在 Kiosk 就打好（两步式），SBD 只负责核对与放行。', en: 'Fast and light on staff, but cannot handle out-of-gauge bags. In two-step designs the tag is printed at the kiosk and the unit only verifies and releases.' },
      },
      {
        id: 'counterbag', icon: '⚖️',
        label: { zh: '柜台检查托运', en: 'Staffed bag drop' },
        device: { zh: '机场柜台电子秤 + 传送带（CUPPS）', en: 'Airport desk scale and belt (CUPPS)' },
        systems: ['cupps', 'dcs', 'bhs', 'brs'],
        flows: [
          { from: 'pax', to: 'cupps', msg: 'ETKT' },
          { from: 'cupps', to: 'dcs', msg: 'ETKT' },
          { from: 'dcs', to: 'bhs', msg: 'BSM' },
          { from: 'bhs', to: 'brs', msg: 'BPM' },
          { from: 'dcs', to: 'bss', msg: 'PFS' },
          { from: 'dcs', to: 'aodb', msg: 'AIDX' },
        ],
        durationSec: 130, resource: 3,
        note: { zh: '慢，但能现场处理超重收费、超长/易碎/危险品判定与特殊行李通道。注意：无论走哪条路径，**BSM 是同一条，行李的数据身份完全一致**。', en: 'Slower, but handles excess-weight charges, oversize/fragile/dangerous-goods calls and the out-of-gauge lane. Either way the **BSM is identical — the bag\'s data identity does not depend on the path**.' },
      },
    ],
    knowledge: ['sbd', 'cupps', 'dcs', 'bhs', 'brs'],
    kpis: [{ zh: 'MBR 行李错运率 / 托运平均时长 / Res 753 节点覆盖率', en: 'Mishandled bag rate / drop time / Res 753 coverage' }],
    exceptions: [
      { zh: '超重超规 → 自助机无法受理，转柜台或特殊行李通道', en: 'Overweight or out-of-gauge → the kiosk refuses; go to a desk or the OOG lane' },
      { zh: '行李条读取失败 → 进入人工编码站（Manual Encoding）', en: 'Tag unreadable → manual encoding station' },
    ],
  },

  // ── ⑤ 行李的幕后旅程 ──────────────────────────────────────────
  {
    id: 'bhs', icon: '⚙️', domain: 'baggage', zone: 'bhs',
    name: { zh: '行李的幕后旅程', en: 'What happens to your bag' },
    narrative: {
      zh: '镜头跟着你的箱子钻到地下。它先过自动读码器 ATR，再进 HBS 托运行李安检做断层扫描，然后被分拣到属于 CA1501 的分拣口，装进集装箱送上飞机。每经过一个点，行李系统就回一条 **BPM 行李处理报**——这些 BPM 串起来，就是 Res 753 要的证据链。',
      en: 'The camera follows your bag underground: automatic tag reader, then hold-baggage screening, then sortation to CA1501\'s make-up chute, then into a container and out to the aircraft. Each point sends back a **Baggage Processed Message** — chained together, these are exactly the evidence Res 753 demands.',
    },
    flows: [
      { from: 'bhs', to: 'brs', msg: 'BPM' },
      { from: 'bhs', to: 'hbs', msg: 'BPM' },
      { from: 'hbs', to: 'bhs', msg: 'BPM' },
      { from: 'bhs', to: 'dcs', msg: 'BPM' },
    ],
    knowledge: ['bhs', 'hbs', 'brs', 'dcs'],
    kpis: [{ zh: '分拣准确率 / 分拣口溢出次数 / 安检开包率', en: 'Sortation accuracy / make-up overflow / bag search rate' }],
    exceptions: [
      { zh: 'HBS 图像可疑 → 分流到人工开包，旅客可能被广播叫回', en: 'Suspicious image → diverted to manual search; the passenger may be paged' },
      { zh: '分拣口溢出 → 行李堆积，最终可能赶不上本班航班', en: 'Make-up overflow → bags pile up and may miss the flight' },
    ],
  },

  // ── ⑥ 安检 ───────────────────────────────────────────────────
  {
    id: 'security', icon: '🛡️', domain: 'security', zone: 'security',
    name: { zh: '安全检查', en: 'Security screening' },
    narrative: {
      zh: '安检由政府或授权机构负责，机场提供场地、排队组织与人流预测。它的目标函数不是"最快"，而是"在监管给定的检出率下最快"。当前 AI 落地最成熟的场景之一，就是提前 15–20 分钟预测这里的拥堵，好让通道来得及打开。',
      en: 'Screening belongs to the state or its agent; the airport supplies the space, the queue design and the forecast. The objective is not speed but speed at a mandated detection rate. Predicting congestion here 15–20 minutes ahead is one of the most mature AI use cases in the industry.',
    },
    flows: [
      { from: 'pax', to: 'sec-sys', msg: 'DOCS' },
      { from: 'sec-sys', to: 'dcs', msg: 'BOARD' },
      { from: 'paxflow', to: 'sec-sys', msg: 'FIDSUPD' },
    ],
    knowledge: ['sec-sys', 'paxflow', 'oneid'],
    kpis: [{ zh: '排队时长（均值 / 95 分位）/ 单通道吞吐 / 开箱率', en: 'Queue time (mean / P95) / throughput per lane / search rate' }],
    exceptions: [
      { zh: '高峰通道不足 → 排队时间超阈值，触发开放备用通道', en: 'Too few lanes at peak → queue breaches threshold, reserve lanes opened' },
      { zh: '随身行李复检 → 旅客被单独引导至开包台', en: 'Cabin bag re-screen → passenger diverted to the search table' },
    ],
  },

  // ── ⑦ 边检（国际航班）─────────────────────────────────────────
  {
    id: 'border', icon: '🛂', domain: 'security', zone: 'border', intlOnly: true,
    name: { zh: '边防检查（国际）', en: 'Border control (international)' },
    narrative: {
      zh: '只有国际航班会经过这一关。你在值机时，航司 DCS 就已经把 API 旅客预报发给了目的地与中转国——这是旅客数据唯一被法定要求交给政府的通道，由航司发出，机场并不经手。',
      en: 'Only international journeys pass here. Back at check-in, the airline\'s DCS already sent Advance Passenger Information to the destination and any transit states — the one legally mandated channel for passenger data to government, sent by the airline, never touched by the airport.',
    },
    flows: [
      { from: 'dcs', to: 'border', msg: 'API' },
      { from: 'pax', to: 'border', msg: 'DOCS' },
      { from: 'border', to: 'dcs', msg: 'DOCS' },
    ],
    knowledge: ['border', 'dcs', 'oneid'],
    kpis: [{ zh: '查验时长 / e-Gate 使用率 / 拒登率', en: 'Processing time / e-Gate usage / denied-boarding rate' }],
    exceptions: [
      { zh: '证件或签证不符 → 拒绝出境/登机，遣返成本由承运人承担', en: 'Documents fail → boarding refused; the carrier bears the return cost' },
    ],
  },

  // ── ⑧ 候机与商业 ─────────────────────────────────────────────
  {
    id: 'dwell', icon: '🛍️', domain: 'commercial', zone: 'dwell',
    name: { zh: '候机与商业区', en: 'Dwell & retail' },
    narrative: {
      zh: '你现在处在机场真正赚钱的区域。航空性收入（起降费、旅客服务费）受管制，非航收入（零售、餐饮、免税、广告、停车）才是利润主力。所以：每减少 5 分钟安检排队，就多 5 分钟可消费停留时间——这是"体验改善"与"商业收入"少见的正向对齐。',
      en: 'You are now standing in the part of the airport that actually makes money. Aeronautical charges are regulated; retail, F&B, duty-free, advertising and parking carry the profit. Hence: every 5 minutes cut from the security queue is 5 minutes added to spendable dwell — a rare alignment of experience and revenue.',
    },
    flows: [
      { from: 'paxflow', to: 'pos', msg: 'POSFEED' },
      { from: 'aodb', to: 'fids', msg: 'FIDSUPD' },
    ],
    knowledge: ['pos', 'paxflow', 'crm-airport', 'fids'],
    kpis: [{ zh: '人均消费 / 坪效 / 安检后停留时长', en: 'Spend per pax / sales per m² / post-security dwell' }],
    exceptions: [
      { zh: '登机口临时变更 → 旅客需要重新走一段路，商业停留被打断', en: 'Gate change → passengers walk again and dwell is interrupted' },
    ],
  },

  // ── ⑨ 登机口 ─────────────────────────────────────────────────
  {
    id: 'gate', icon: '🚪', domain: 'terminal', zone: 'gate',
    name: { zh: '登机口', en: 'At the gate' },
    narrative: {
      zh: '每一次"嘀"都实时改变 DCS 的已登机计数，也就实时改变了"还差谁"。如果有人最终没来，DCS 会发出一条 **BUM 行李卸载报**，行李系统必须把那件已经装进货舱的箱子找出来卸下——"人不走行李不走"是安保刚性要求，代价通常是 15–30 分钟延误。',
      en: 'Every beep updates the DCS boarded count — and therefore who is still missing. If someone never shows, the DCS issues a **Baggage Unload Message** and the handlers must dig that bag back out of the hold. "No passenger, no bag" is a hard security rule, and it usually costs 15–30 minutes.',
    },
    flows: [
      { from: 'rms', to: 'aodb', msg: 'RESALLOC' },
      { from: 'aodb', to: 'fids', msg: 'FIDSUPD' },
      { from: 'bgr', to: 'dcs', msg: 'BOARD' },
      { from: 'dcs', to: 'bhs', msg: 'BUM' },
      { from: 'dcs', to: 'acdm-sys', msg: 'TOBT' },
    ],
    knowledge: ['bgr', 'dcs', 'brs', 'rms', 'acdm-sys'],
    kpis: [{ zh: '登机时长 / 登机口准点开放率 / No-show 卸包耗时', en: 'Boarding duration / on-time gate opening / offload time after no-show' }],
    exceptions: [
      { zh: 'No-show → BUM 卸包，全航班延误', en: 'No-show → BUM offload, delaying the whole flight' },
      { zh: '登机口临时变更（RMS 重排）', en: 'Gate change (RMS re-allocation)' },
      { zh: '旅客失联 → 广播寻人（Passenger paging）', en: 'Missing passenger → paging' },
    ],
    milestone: 'MS11',
  },

  // ── ⑩ 上机与推出 ─────────────────────────────────────────────
  {
    id: 'boarding', icon: '✈️', domain: 'airside', zone: 'boarding',
    branchTitle: { zh: '近机位廊桥，还是远机位摆渡？', en: 'Contact stand with a jetbridge, or a remote stand by bus?' },
    name: { zh: '上机 · 关门 · 推出', en: 'Boarding · door closed · pushback' },
    narrative: {
      zh: '你落座了，旅客旅程结束，运行旅程才刚开始：客舱关门 → 撤桥 → **AOBT 撤轮档（MS15）**；机组按空管给的 **TSAT** 申请开车。关门后还要等十几分钟不是失误，而是把等待放在机位（发动机不转）而不是滑行道——全网油耗与排放都更低。',
      en: 'You take your seat. The passenger journey ends and the operational one begins: door closed, bridge retracted, **actual off-block (MS15)**; the crew requests start-up at the **TSAT** issued by ATC. Waiting a dozen minutes after the door closes is deliberate — holding at the stand with engines off beats queueing on the taxiway for the whole network.',
    },
    branches: [
      {
        id: 'contact', icon: '🌉',
        label: { zh: '近机位 · 廊桥登机', en: 'Contact stand · jetbridge' },
        device: { zh: '登机桥（含 PCA 桥载空调与 400Hz 电源）', en: 'Passenger boarding bridge (with PCA and 400 Hz power)' },
        systems: ['vdgs', 'gh-rms', 'tms', 'acdm-sys', 'atc'],
        flows: [
          { from: 'bgr', to: 'dcs', msg: 'BOARD' },
          { from: 'dcs', to: 'aoc', msg: 'LDM' },
          { from: 'dcs', to: 'acdm-sys', msg: 'TOBT' },
          { from: 'acdm-sys', to: 'atc', msg: 'TSAT' },
          { from: 'dcs', to: 'aodb', msg: 'MVT' },
          { from: 'dcs', to: 'bss', msg: 'PFS' },
        ],
        durationSec: 900, resource: 5,
        note: { zh: '桥载电源与空调替代飞机 APU，是机场碳减排的主力项之一：一次过站可省下数百公斤燃油当量。', en: 'Fixed ground power and pre-conditioned air replace the aircraft APU — one of the biggest carbon levers a terminal has.' },
      },
      {
        id: 'remote', icon: '🚐',
        label: { zh: '远机位 · 摆渡车登机', en: 'Remote stand · by bus' },
        device: { zh: '摆渡车 + 客梯车（地服）', en: 'Apron bus and passenger steps (ground handling)' },
        systems: ['gh-rms', 'gse', 'tms', 'acdm-sys', 'atc'],
        flows: [
          { from: 'bgr', to: 'dcs', msg: 'BOARD' },
          { from: 'gh-rms', to: 'tms', msg: 'RESALLOC' },
          { from: 'dcs', to: 'aoc', msg: 'LDM' },
          { from: 'dcs', to: 'acdm-sys', msg: 'TOBT' },
          { from: 'acdm-sys', to: 'atc', msg: 'TSAT' },
          { from: 'dcs', to: 'aodb', msg: 'MVT' },
        ],
        durationSec: 1320, resource: 4,
        note: { zh: '远机位不是"低配版廊桥"，而是机位紧张时的容量手段。代价是多一段摆渡时间与更多地服人力。', en: 'A remote stand is a capacity tool, not a downgrade — paid for in bus time and extra handling staff.' },
      },
    ],
    knowledge: ['acdm-sys', 'atc', 'vdgs', 'tms', 'gh-rms', 'dcs', 'aoc'],
    kpis: [{ zh: 'OTP 准点率 / TAT 过站时间 / TOBT 准确度 / 滑行时间', en: 'On-time performance / turnaround time / TOBT accuracy / taxi time' }],
    exceptions: [
      { zh: '配载超限 → 需要重新分配座位或卸货', en: 'Load out of limits → reseat passengers or offload cargo' },
      { zh: '流量限制 → TSAT 推迟，飞机在机位带客等待', en: 'Flow restriction → TSAT pushed back, aircraft holds at the stand with passengers aboard' },
    ],
    milestone: 'MS15',
  },
];

// ── 分支补全：把国内 / 国际登机的场景遍历补齐 ──────────────────
// 后置赋值，保持上面主线定义的可读性。branch 上的 intlOnly / domesticOnly
// 由 visibleBranches() 过滤——例如免税购物只在国际航班出现。
const EXTRA_BRANCHES = {
  entrance: {
    title: { zh: '你从哪条路进航站楼？', en: 'Which way into the terminal?' },
    list: [
      {
        id: 'curb', icon: '🚕',
        label: { zh: '出发层路侧直接进', en: 'Straight in from the departures curb' },
        device: { zh: '落客区路侧（机场）', en: 'Departures curb (airport)' },
        flows: [
          { from: 'anpr', to: 'curbside', msg: 'PARKFEED' },
          { from: 'rms', to: 'aodb', msg: 'RESALLOC' },
          { from: 'aodb', to: 'fids', msg: 'FIDSUPD' },
        ],
        durationSec: 120, resource: 2,
        note: { zh: '最短路径，但占用一次落客车位。路侧的通行能力由"平均滞留时长"决定，不是车流量。', en: 'The shortest walk, but it consumes a curb slot. Curb capacity is set by dwell time, not vehicle count.' },
      },
      {
        id: 'park', icon: '🅿️',
        label: { zh: '停车楼连廊进', en: 'Via the car park link bridge' },
        device: { zh: '停车场道闸与连廊（机场）', en: 'Car park barriers and link bridge (airport)' },
        flows: [
          { from: 'anpr', to: 'parking', msg: 'PARKFEED' },
          { from: 'rms', to: 'aodb', msg: 'RESALLOC' },
          { from: 'aodb', to: 'fids', msg: 'FIDSUPD' },
        ],
        durationSec: 300, resource: 3,
        note: { zh: '占用一个车位数小时到数天，是陆侧最"贵"的方式，也是机场停车收入的来源。', en: 'Occupies a space for hours or days — the most expensive landside mode, and the source of parking revenue.' },
      },
      {
        id: 'rail', icon: '🚇',
        label: { zh: '轨道到达层上行', en: 'Up from the rail station' },
        device: { zh: '轨道站厅与垂直交通（交通运营方 + 机场）', en: 'Rail concourse and vertical circulation' },
        flows: [
          { from: 'aodb', to: 'transit-op', msg: 'PARKFEED' },
          { from: 'rms', to: 'aodb', msg: 'RESALLOC' },
          { from: 'aodb', to: 'fids', msg: 'FIDSUPD' },
        ],
        durationSec: 240, resource: 0,
        note: { zh: '零路侧、零车位占用。提高公共交通分担率是陆侧管理最有效的扩容手段——不用修一寸路。', en: 'Zero curb, zero parking. Raising modal share is the cheapest landside capacity expansion there is.' },
      },
    ],
  },

  bhs: {
    title: { zh: '你的行李在 HBS 安检会遇到什么？', en: 'What happens to your bag at screening?' },
    list: [
      {
        id: 'clear', icon: '✅',
        label: { zh: 'Level 1 自动放行', en: 'Level 1 auto-clear' },
        device: { zh: 'HBS 托运行李安检（CT 断层扫描）', en: 'Hold baggage screening (CT)' },
        systems: ['bhs', 'hbs', 'brs'],
        flows: [
          { from: 'bhs', to: 'hbs', msg: 'BPM' },
          { from: 'hbs', to: 'bhs', msg: 'BPM' },
          { from: 'bhs', to: 'brs', msg: 'BPM' },
          { from: 'bhs', to: 'dcs', msg: 'BPM' },
        ],
        durationSec: 420, resource: 1,
        note: { zh: '90–95% 的行李走这条路：CT 图像自动判读通过，旅客完全无感。', en: '90–95% of bags take this path: the CT image auto-clears and the passenger never knows.' },
      },
      {
        id: 'search', icon: '🔍',
        label: { zh: '图像可疑 → 人工开包', en: 'Suspicious image → manual search' },
        device: { zh: '图像复核席 + 开包检查台（安检机构）', en: 'Image review position and search table' },
        systems: ['bhs', 'hbs', 'sec-sys', 'brs'],
        flows: [
          { from: 'bhs', to: 'hbs', msg: 'BPM' },
          { from: 'hbs', to: 'sec-sys', msg: 'BPM' },
          { from: 'sec-sys', to: 'bhs', msg: 'BPM' },
          { from: 'bhs', to: 'dcs', msg: 'BPM' },
          { from: 'dcs', to: 'aodb', msg: 'AIDX' },
        ],
        durationSec: 900, resource: 3,
        note: { zh: '升级到人工开包时，若必须旅客到场，会通过广播寻人——这时行李的问题就变成了航班的问题。', en: 'When a search needs the passenger present, paging starts — and a baggage problem becomes a flight problem.' },
      },
    ],
  },

  security: {
    title: { zh: '走哪条安检通道？', en: 'Which security lane?' },
    list: [
      {
        id: 'standard', icon: '🚶',
        label: { zh: '普通安检通道', en: 'Standard lane' },
        device: { zh: 'X 光机 + 金属探测门（安检机构）', en: 'X-ray and walk-through detector' },
        flows: [
          { from: 'pax', to: 'sec-sys', msg: 'DOCS' },
          { from: 'sec-sys', to: 'dcs', msg: 'BOARD' },
          { from: 'paxflow', to: 'sec-sys', msg: 'FIDSUPD' },
        ],
        durationSec: 780, resource: 2,
        note: { zh: '单通道吞吐约 130–180 人/小时。排队长度由高峰小时旅客数除以开放通道数决定，与安检员是否"熟练"关系不大。', en: 'About 130–180 pax/hour per lane. Queue length is peak-hour demand divided by open lanes — operator skill barely moves it.' },
      },
      {
        id: 'fast', icon: '⚡',
        label: { zh: '快速通道 Fast Track', en: 'Fast Track' },
        device: { zh: '专用通道（头等/公务/常旅客/付费）', en: 'Dedicated premium lane' },
        flows: [
          { from: 'dcs', to: 'sec-sys', msg: 'BOARD' },
          { from: 'pax', to: 'sec-sys', msg: 'DOCS' },
          { from: 'loyalty', to: 'sec-sys', msg: 'BOARD' },
        ],
        durationSec: 300, resource: 2,
        note: { zh: '它不改变检出标准，只改变排队结构。准入资格来自航司的舱位与常旅客等级——所以安检口也要读航司数据。', en: 'It changes the queue, never the detection standard. Eligibility comes from the airline\'s cabin and tier data, so the checkpoint reads airline data too.' },
      },
      {
        id: 'smart', icon: '🤖',
        label: { zh: '智能安检（CT + 自动回筐）', en: 'Smart lane (CT + tray return)' },
        device: { zh: 'CT 断层扫描 + ATRS 自动回筐（机场投资）', en: 'CT scanner with automatic tray return' },
        flows: [
          { from: 'pax', to: 'sec-sys', msg: 'DOCS' },
          { from: 'sec-sys', to: 'dcs', msg: 'BOARD' },
          { from: 'paxflow', to: 'sec-sys', msg: 'FIDSUPD' },
          { from: 'paxflow', to: 'pos', msg: 'POSFEED' },
        ],
        durationSec: 480, resource: 3,
        note: { zh: '不必取出电脑与液体，单通道吞吐可到 200–260 人/小时。**每减少 5 分钟排队 = 多 5 分钟可消费停留时间**，商业收入是它的主要投资理由。', en: 'Laptops and liquids stay in the bag, lifting a lane to 200–260 pax/hour. Every 5 minutes cut from the queue is 5 more spendable minutes — the commercial case for the investment.' },
      },
    ],
  },

  border: {
    title: { zh: '边检怎么过？', en: 'How do you clear the border?' },
    list: [
      {
        id: 'manual', icon: '🧑‍✈️',
        label: { zh: '人工查验台', en: 'Manual counter' },
        device: { zh: '边检查验台（政府）', en: 'Border counter (government)' },
        flows: [
          { from: 'dcs', to: 'border', msg: 'API' },
          { from: 'pax', to: 'border', msg: 'DOCS' },
          { from: 'border', to: 'dcs', msg: 'DOCS' },
        ],
        durationSec: 420, resource: 0,
        note: { zh: '单人 45–90 秒。所有非常规情形（证件疑问、儿童、团队）最终都会落到人工台。', en: '45–90 seconds each. Every non-routine case — document doubts, children, groups — ends up here.' },
      },
      {
        id: 'egate', icon: '🚪',
        label: { zh: 'e-Gate 自助查验', en: 'e-Gate' },
        device: { zh: '自助查验闸机 ABC（政府投资，机场提供场地供电）', en: 'Automated border control gate' },
        flows: [
          { from: 'dcs', to: 'border', msg: 'API' },
          { from: 'pax', to: 'border', msg: 'DOCS' },
          { from: 'border', to: 'dcs', msg: 'DOCS' },
        ],
        durationSec: 180, resource: 0,
        note: { zh: '单人 20–35 秒，读护照芯片 + 人脸比对。e-Gate 使用率是边检域的核心 KPI，但设备由政府投资运维，不进机场 ICT 预算。', en: '20–35 seconds using the passport chip plus a face match. e-Gate usage is a core border KPI, though the government funds and runs the kit.' },
      },
      {
        id: 'bio', icon: '😀',
        label: { zh: 'One ID 刷脸直通', en: 'One ID face-only' },
        device: { zh: '生物识别通道（需事先注册）', en: 'Biometric corridor (pre-enrolled)' },
        systems: ['oneid', 'border', 'dcs'],
        flows: [
          { from: 'dcs', to: 'border', msg: 'API' },
          { from: 'pax', to: 'oneid', msg: 'DOCS' },
          { from: 'oneid', to: 'border', msg: 'DOCS' },
          { from: 'border', to: 'dcs', msg: 'DOCS' },
        ],
        durationSec: 120, resource: 0,
        note: { zh: '**变的是界面，不变的是数据链**：API 预报照发，边检系统照查，只是把"出示护照"压成一次比对。跨境互认要靠 DTC 与可验证凭证。', en: 'The interface changes, the data chain does not: API still goes, the border system still checks — only the document presentation is compressed into a match.' },
      },
    ],
  },

  dwell: {
    title: { zh: '安检后这段时间你做什么？', en: 'How do you spend the dwell?' },
    list: [
      {
        id: 'dutyfree', icon: '🛒', intlOnly: true,
        label: { zh: '免税购物', en: 'Duty-free shopping' },
        device: { zh: '免税店 POS（商业租户）+ 登机牌核验', en: 'Duty-free POS with boarding-pass validation' },
        systems: ['dutyfree', 'pos', 'dcs', 'customs'],
        flows: [
          { from: 'pax', to: 'dutyfree', msg: 'POSFEED' },
          { from: 'dutyfree', to: 'dcs', msg: 'BOARD' },
          { from: 'paxflow', to: 'pos', msg: 'POSFEED' },
        ],
        durationSec: 1500, resource: 1,
        note: { zh: '免税结账要扫登机牌——那一刻商业系统也在读航司 DCS 的航班号与目的地，因为限售规则按目的地走，账册还要接受海关监管。', en: 'Duty-free checkout scans the boarding pass: retail is reading airline flight and destination data, because sales rules follow the destination and stock is customs-supervised.' },
      },
      {
        id: 'dining', icon: '🍜',
        label: { zh: '餐饮消费', en: 'Food & beverage' },
        device: { zh: '餐饮 POS（商业租户）', en: 'F&B POS (tenant)' },
        systems: ['pos', 'concession', 'paxflow'],
        flows: [
          { from: 'paxflow', to: 'pos', msg: 'POSFEED' },
          { from: 'pos', to: 'aodb', msg: 'POSFEED' },
        ],
        durationSec: 1800, resource: 1,
        note: { zh: '餐饮是停留时长最敏感的品类：航班延误会让餐饮销售上升、零售下降。', en: 'F&B is the most dwell-sensitive category: a delay lifts catering sales and depresses retail.' },
      },
      {
        id: 'lounge', icon: '🛋️',
        label: { zh: '贵宾室休息', en: 'Lounge' },
        device: { zh: '贵宾室准入闸机（商业/航司权益）', en: 'Lounge access control (airline entitlement)' },
        systems: ['lounge', 'loyalty', 'dcs'],
        flows: [
          { from: 'pax', to: 'lounge', msg: 'BOARD' },
          { from: 'lounge', to: 'loyalty', msg: 'BOARD' },
          { from: 'lounge', to: 'dcs', msg: 'BOARD' },
        ],
        durationSec: 2400, resource: 2,
        note: { zh: '准入资格来自航司的舱位与常旅客等级，结算却在机场商业侧——这是"一次刷卡、两本账"的典型。', en: 'Entitlement comes from the airline, settlement sits with airport commercial — one swipe, two ledgers.' },
      },
      {
        id: 'gatearea', icon: '💺',
        label: { zh: '直接去登机口等', en: 'Straight to the gate' },
        device: { zh: '候机座椅与航显（机场）', en: 'Gate seating and displays (airport)' },
        systems: ['fids', 'aodb', 'paxflow'],
        flows: [
          { from: 'aodb', to: 'fids', msg: 'FIDSUPD' },
          { from: 'paxflow', to: 'sec-sys', msg: 'FIDSUPD' },
        ],
        durationSec: 900, resource: 0,
        note: { zh: '对旅客最省心，对机场最"不赚钱"——人均非航收入正是在这段时间里产生或流失的。', en: 'Easiest for the passenger, least profitable for the airport: non-aeronautical revenue is won or lost in exactly this window.' },
      },
    ],
  },

  gate: {
    title: { zh: '怎么完成登机核验？', en: 'How is boarding verified?' },
    list: [
      {
        id: 'scan', icon: '📇',
        label: { zh: '扫码登机（纸质/手机登机牌）', en: 'Scan a boarding pass' },
        device: { zh: '登机口读码器 BGR（机场设备）', en: 'Boarding gate reader (airport)' },
        systems: ['bgr', 'dcs', 'brs', 'rms'],
        flows: [
          { from: 'rms', to: 'aodb', msg: 'RESALLOC' },
          { from: 'aodb', to: 'fids', msg: 'FIDSUPD' },
          { from: 'bgr', to: 'dcs', msg: 'BOARD' },
          { from: 'dcs', to: 'bhs', msg: 'BUM' },
          { from: 'dcs', to: 'acdm-sys', msg: 'TOBT' },
        ],
        durationSec: 900, resource: 3,
        note: { zh: '最通用的方式。每一次"嘀"都实时改变 DCS 的已登机计数，也就实时改变了"还差谁"。', en: 'The universal method. Every beep updates the boarded count, and therefore who is still missing.' },
      },
      {
        id: 'face', icon: '😀',
        label: { zh: '人脸识别登机', en: 'Face-recognition boarding' },
        device: { zh: '自助登机门 + 生物识别（机场设备）', en: 'Self-boarding gate with biometrics' },
        systems: ['oneid', 'bgr', 'dcs', 'brs'],
        flows: [
          { from: 'rms', to: 'aodb', msg: 'RESALLOC' },
          { from: 'pax', to: 'oneid', msg: 'BOARD' },
          { from: 'oneid', to: 'dcs', msg: 'BOARD' },
          { from: 'dcs', to: 'bhs', msg: 'BUM' },
          { from: 'dcs', to: 'acdm-sys', msg: 'TOBT' },
        ],
        durationSec: 660, resource: 3,
        note: { zh: '登机速度可提升约 25–30%，但**必须保留人工兜底**：比对失败、未注册、儿童与特服旅客都要有人工通道。', en: 'Roughly 25–30% faster, but a staffed fallback is mandatory: failed matches, non-enrolled passengers, children and assistance cases all need one.' },
      },
      {
        id: 'manualgate', icon: '🧑‍💼',
        label: { zh: '人工核验登机', en: 'Manual gate check' },
        device: { zh: '登机口工作站（机场设备 + 航司应用）', en: 'Gate workstation (airport hardware, airline app)' },
        systems: ['cupps', 'dcs', 'brs', 'prm'],
        flows: [
          { from: 'rms', to: 'aodb', msg: 'RESALLOC' },
          { from: 'cupps', to: 'dcs', msg: 'BOARD' },
          { from: 'res', to: 'dcs', msg: 'PSM' },
          { from: 'dcs', to: 'bhs', msg: 'BUM' },
          { from: 'dcs', to: 'acdm-sys', msg: 'TOBT' },
        ],
        durationSec: 1140, resource: 4,
        note: { zh: '最慢，但能处理全部异常：升舱、换座、特服旅客优先登机、证件复核、超售改签。', en: 'Slowest, but it handles everything: upgrades, reseating, priority for assistance cases, document re-checks and oversale rebooking.' },
      },
    ],
  },
};

for (const [id, cfg] of Object.entries(EXTRA_BRANCHES)) {
  const s = STEPS.find(x => x.id === id);
  if (!s) continue;
  s.branchTitle = cfg.title;
  s.branches = cfg.list.map(b => ({ systems: b.systems || [], ...b }));
}

/** 按当前开关过滤分支（国内航班没有免税购物；One ID 关闭时不显示刷脸通道） */
export function visibleBranches(step, opts = {}) {
  if (!step?.branches) return null;
  return step.branches.filter(b => {
    if (b.intlOnly && !opts.international) return false;
    if (b.domesticOnly && opts.international) return false;
    if (b.needsOneId && !opts.oneId) return false;
    return true;
  });
}

// A-CDM 里程碑（底部依次点亮，教学用简化序列）
export const MILESTONES = [
  { id: 'MS6',  label: { zh: 'MS6 落地 ALDT', en: 'MS6 Landing (ALDT)' },       atStep: null },
  { id: 'MS7',  label: { zh: 'MS7 上轮档 AIBT', en: 'MS7 In-block (AIBT)' },     atStep: null },
  { id: 'MS8',  label: { zh: 'MS8 保障开始', en: 'MS8 Ground handling starts' }, atStep: 'transit' },
  { id: 'MS9',  label: { zh: 'MS9 TOBT 更新', en: 'MS9 TOBT update' },           atStep: 'bagdrop' },
  { id: 'MS10', label: { zh: 'MS10 TSAT 下发', en: 'MS10 TSAT issued' },         atStep: 'dwell' },
  { id: 'MS11', label: { zh: 'MS11 开始登机', en: 'MS11 Boarding starts' },      atStep: 'gate' },
  { id: 'MS12', label: { zh: 'MS12 航空器就绪', en: 'MS12 Aircraft ready' },      atStep: 'boarding' },
  { id: 'MS15', label: { zh: 'MS15 撤轮档 AOBT', en: 'MS15 Off-block (AOBT)' },  atStep: 'boarding' },
  { id: 'MS16', label: { zh: 'MS16 起飞 ATOT', en: 'MS16 Take-off (ATOT)' },     atStep: 'boarding' },
];

export function getStep(id) { return STEPS.find(s => s.id === id); }

// 按当前开关过滤出实际要走的步骤（国内航班跳过边检）
export function visibleSteps(opts = {}) {
  return STEPS.filter(s => !(s.intlOnly && !opts.international));
}
