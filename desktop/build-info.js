// 【数据层】构建信息 —— 由 scripts/gen-importmap.mjs 在盖版本戳时自动写入。
// 手改无意义：下次发版会被覆盖。页面右下角徽标与桌面版更新检查都读它。
export const BUILD = {
  version: '0.12',
  date: '2026-08-04',
  baseline: '2026-08-04',   // 教学内容基线：docs/ 洞察报告的口径日期
};
