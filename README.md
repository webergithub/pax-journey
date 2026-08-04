# 旅客旅程学习模拟器 · Passenger Journey Simulator

以旅客第一人称走完「从公共交通到落座」的全流程 3D 交互教学 Demo。每一步同时呈现三件事：

1. **物理世界发生了什么** —— 可旋转/缩放的 3D 场景（地铁站 → 路侧 → 航站楼十个区 → 廊桥 → 飞机）
2. **数字世界发生了什么** —— 底部系统与报文链路条（PNL / ADL / BSM / BPM / BUM / AIDX / LDM / TOBT / TSAT…）
3. **这一步属于哪个管理域、旁边还有哪些域** —— 右侧常驻的 8 大机场管理域地图 + 4 个贯穿层

线上：<https://opcstudio.cc/pax-journey/>

## 教学要点

- 值机自助机是**机场**的设备，上面跑的是**航司**的 DCS（Amadeus Altéa / SabreSonic / TravelSky）
- 行李在数字世界的"出生"时刻 = DCS 发出 **BSM**，从此一个 10 位 LPN 代表这件箱子（IATA Res 753 节点①）
- 旅客不登机必须卸包：DCS 发 **BUM**，这是全流程最贵的一条报文
- **TOBT** 是航司/地服的承诺，**TSAT** 是空管给的排队号——关门后还要等，是有意把等待放在机位而不是滑行道
- 机场知道"CA1501 有 168 人值机"，只有航司知道"张三坐 12A"——这条边界由 AIDX 的粒度实现

## 交互

| 元素 | 说明 |
|---|---|
| 分支选择 | 值机三选一（手机 / CUSS 自助机 / CUPPS 柜台）、托运二选一（自助 SBD / 柜台）、上机二选一（廊桥 / 摆渡），**不同选择产生不同的 3D 动作与后台链路** |
| 全局开关 | 国内/国际（国际增加边检与 API 报文）、传统证件核验 / One ID 生物识别、旅客视角 / 管理者视角 |
| 浮窗 | 五个面板均可**拖动、最小化、关闭、拖右下角缩放**；顶栏 dock 可重新打开，「复位布局」一键还原 |
| 语言 | 中 / EN 双语，共享全站 `opcstudio_lang` |
| 术语超链接 | 正文里 344 个缩写/专业名词自动变成链接，点开是独立小窗；系统窗内含**主流厂商 / 部署方式 / 工作人员访问方式 / ICT 设备需求 / 按年旅客量 500 万为单位的 ICT 需求评估** |
| 管理节点全景 | 旅客旅程之外的全量节点：15 组 97 个机场/航司/空管/政府系统，标出其中 31 个会被旅客旅程触及 |
| 默认路径 | 可配置每个分支点的默认选择（localStorage 持久化）；点自动播放即按这套配置全程走一遍 |
| 控制悬浮球 | 流程控制（重新开始/自动播放/重播/上一步/下一步）收在一个可拖动的悬浮球里：单击展开、再点收起，位置记忆，贴边自动翻向 |

## 目录结构（UI / 数据 / 逻辑 三层）

```
pax-journey/
├── index.html              # importmap + 浮窗骨架
├── main.js                 # 总线：把四层接起来
├── data/                   # 【数据层】纯字典，无逻辑
│   ├── steps.js            #   旅程 10 幕 + 分支定义
│   ├── systems.js          #   系统节点（AODB/DCS/BHS/…）
│   ├── messages.js         #   IATA 报文（PNL/BSM/BPM/…）
│   ├── domains.js          #   8 大管理域 + 4 贯穿层
│   └── i18n.js             #   中英词条 + 归属配色
├── engine/                 # 【逻辑层】与渲染无关
│   ├── state.js            #   旅程状态机 + 事件总线
│   └── flow-engine.js      #   步骤+分支 → 系统链路与报文序列
├── scene/                  # 【UI-3D 层】Three.js r0.169 ESM
│   ├── renderer.js props.js actors.js world.js director.js tween.js
└── ui/                     # 【UI-DOM 层】
    ├── window-manager.js journey-rail.js domain-map.js
    ├── flow-bar.js narrative.js knowledge-card.js style.css
```

## 桌面版（Electron，本地离线部署）

下载：<https://opcstudio.cc/pax-journey/downloads/>（macOS 通用 DMG / Windows 一键安装 EXE / Windows 免安装 ZIP）

桌面版**完全离线**：`desktop/build-app.mjs` 会把 Web 版复制进 `desktop/app/` 并做三件事——
Three.js 从 CDN 换成内置 `vendor/`、去掉 CDN 字体链接、把「← 返回主页」改成线上绝对地址
（`file://` 下 `/` 会导航到文件系统根）。Electron 主进程零 Node 能力（contextIsolation +
sandbox），页面里的 http(s) 链接一律转交系统浏览器。

```bash
cd desktop
npm install          # 首次
npm run prep         # 生成离线 app/（下载 vendor 有缓存）
npm run smoke        # 无头冒烟：加载成功且零页面报错 → SMOKE_OK
npm run dist -- --mac   # macOS universal DMG（未签名）
npm run dist -- --win   # Windows x64 NSIS + 便携 zip（在 mac 上交叉构建）
node ../scripts/gen-downloads-page.mjs 0.5.0   # 按 dist/ 产物生成双语下载页
```

未做代码签名：mac 首次打开需右键 → 打开；Windows SmartScreen 需「更多信息 → 仍要运行」。

## 发版（门禁 → 盖戳 → 上传 → 线上校验）

```bash
npm run preflight            # 门禁：数据契约校验 + 无头冒烟，任一失败即中止
npm run stamp -- 0.12        # 盖版本戳（importmap 全量 ?v=）
rsync -az --partial index.html main.js data engine scene ui scripts vendor \
      oracle-vm:/home/ubuntu/website/pax-journey/
npm run verify               # 线上校验：版本戳一致 + 模块可达 + 无 CDN 残留
```

四个校验脚本（E0 交付）：`check-data.mjs` 数据契约 C1–C8、`smoke-web.mjs` 无头冒烟、
`verify-live.mjs` 线上校验、`vendorize.mjs` 去 CDN 化。**冒烟必须用 ANGLE 参数**——
无头 Chrome 默认 GL 后端不提供 WebGL2，会被产品自己的启动自检拦下，测成"自检生效"。

importmap 会把全部本地 ES 模块重映射为 `?v=<版本>`，并给 `main.js` 与 `ui/style.css` 换戳。
**忘跑这一步 = 线上还是旧版**：Cloudflare 会用区域设置强制 4 小时浏览器 TTL，覆盖源站的
no-cache 头，裸 URL 的模块不会更新（2026-08-01 实测踩过）。线上校验一律带 cache-bust 查询串。

## 本地运行

```bash
python3 .devserver.py 5311
```

打开 <http://localhost:5311/>。这是一个 no-cache 静态服务器——普通 http.server 会缓存嵌套 ES module，改了代码看不到效果。

排障钩子：`window.__pax = { S, world, director, camera, controls, scene, wm, pump, THREE }`。
后台标签页 rAF 会被节流到 ~1fps，动画看起来"冻住"时用 `__pax.pump(200, 16)` 手动快进并强制渲染一帧。

## 设计依据

`docs/旅客旅程洞察报告.md` 与同目录 Word 版：现代机场与航司管理体系洞察（TAM / A-CDM / AODB / PSS / DCS / BHS / DSS）+ 本 Demo 的完整设计与 M1–M6 施工计划。

## 技术约束（踩过的坑）

- Three.js 必须用 **importmap + `type="module"`**，禁用已被删除的 `examples/js/` 路径
- `renderer.setSize(w, h)` 第三参不能传 `false`——否则 canvas 以 drawingBuffer 像素尺寸铺开，容器 `overflow:hidden` 只露出左上角
- 看地下行李厅（BHS）时，除了让楼板透明，还必须隐藏 600×600 的场外地面与地面分格线，否则俯视只有一片黑
- 相机高过屋顶时整组隐藏屋顶，否则俯视全被那层半透明棕色盖住
- 左右机翼分别按符号建几何，不能用 `scale.x = -1` 镜像（法线翻转导致光照异常）

MIT License.
