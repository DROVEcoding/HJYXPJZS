export const categories = [
  {
    id: "agriculture-forestry",
    name: "农业、林业",
    items: [{ id: "future-agriculture", name: "后续开放", available: false }]
  },
  {
    id: "animal-husbandry",
    name: "畜牧业",
    items: [{ id: "pig-farming", name: "生猪养殖", available: true }]
  },
  {
    id: "fishery",
    name: "渔业",
    items: [{ id: "future-fishery", name: "后续开放", available: false }]
  },
  {
    id: "mining",
    name: "采矿业",
    items: [{ id: "future-mining", name: "后续开放", available: false }]
  },
  {
    id: "manufacturing",
    name: "制造业",
    items: [{ id: "future-manufacturing", name: "后续开放", available: false }]
  },
  {
    id: "utilities",
    name: "电力、热力、燃气及水生产供应",
    items: [{ id: "future-utilities", name: "后续开放", available: false }]
  },
  {
    id: "transport",
    name: "交通运输、仓储、邮政",
    items: [{ id: "future-transport", name: "后续开放", available: false }]
  },
  {
    id: "social-services",
    name: "社会事业与服务业",
    items: [{ id: "future-social-services", name: "后续开放", available: false }]
  },
  {
    id: "marine-engineering",
    name: "海洋工程",
    items: [{ id: "future-marine", name: "后续开放", available: false }]
  },
  {
    id: "nuclear-radiation",
    name: "核与辐射",
    items: [{ id: "future-nuclear", name: "后续开放", available: false }]
  }
];

export const corpusSummary = {
  sourceName: "32 份生猪养殖环评有效语料",
  manifestPath: "C:/Users/24308/Documents/Codex/2026-06-19/w-w/outputs/valid_32_pig_eia_manifest.csv",
  chunksPath: "C:/Users/24308/Documents/Codex/2026-06-19/w-w/outputs/valid_32_pig_eia_chunks.jsonl",
  caseCount: 32,
  chunkCount: 7551,
  pageCount: 7759,
  commonModels: ["估算模式", "AERSCREEN", "进一步预测", "AERMOD"],
  commonPollutants: ["NH3", "H2S", "氨", "硫化氢", "臭气", "臭气浓度", "颗粒物", "TSP", "PM10", "PM2.5"],
  commonProcesses: ["干清粪", "固液分离", "堆肥", "沼气", "厌氧", "污水处理站", "水冲粪", "发酵床", "粪污暂存"],
  usageNotice: "当前 demo 只使用语料摘要辅助展示，不直接复制报告原文；后续智能体可基于 JSONL 做 RAG 检索并保留案例编号和页码来源。"
};

export const projectFields = [
  { id: "projectName", label: "项目名称", placeholder: "例：某某年出栏6000头生猪养殖项目" },
  { id: "location", label: "建设地点", placeholder: "例：某省某市某县某村" },
  { id: "annualOutput", label: "年出栏生猪数量", type: "number", placeholder: "例：6000" },
  { id: "stock", label: "存栏生猪数量", type: "number", placeholder: "例：2800" },
  { id: "sensitiveArea", label: "是否涉及环境敏感区", type: "select" },
  { id: "manureTreatment", label: "粪污处理方式", placeholder: "例：干清粪、堆肥发酵、还田利用" },
  { id: "wastewaterTreatment", label: "废水处理方式", placeholder: "例：厌氧发酵、沉淀、农田消纳" },
  { id: "odorControl", label: "恶臭控制措施", placeholder: "例：加强通风、喷淋除臭、绿化隔离" }
];

export const reportSections = [
  {
    id: "basic-info",
    title: "建设项目基本情况",
    requiredFields: ["projectName", "location", "annualOutput", "stock"],
    canGenerate: true
  },
  {
    id: "engineering-analysis",
    title: "建设内容与工程分析",
    requiredFields: ["projectName", "annualOutput", "stock", "manureTreatment"],
    canGenerate: true
  },
  {
    id: "environment-status",
    title: "区域环境质量现状",
    requiredFields: ["location"],
    canGenerate: false
  },
  {
    id: "impact-measures",
    title: "主要环境影响和保护措施",
    requiredFields: ["manureTreatment", "wastewaterTreatment", "odorControl"],
    canGenerate: true
  },
  {
    id: "inspection-list",
    title: "环境保护措施监督检查清单",
    requiredFields: ["manureTreatment", "wastewaterTreatment", "odorControl"],
    canGenerate: false
  },
  {
    id: "conclusion",
    title: "结论",
    requiredFields: ["projectName"],
    canGenerate: false
  }
];
