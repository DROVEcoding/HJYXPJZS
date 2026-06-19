import test from "node:test";
import assert from "node:assert/strict";
import { categories, corpusSummary, reportSections } from "../scripts/data.js";
import {
  assessPigFarmCategory,
  generateSectionDraft,
  getMissingFields
} from "../scripts/logic.js";

test("分类骨架包含可用的生猪养殖分项", () => {
  const animalHusbandry = categories.find((category) => category.id === "animal-husbandry");
  assert.ok(animalHusbandry);
  assert.equal(animalHusbandry.name, "畜牧业");
  assert.deepEqual(animalHusbandry.items[0], {
    id: "pig-farming",
    name: "生猪养殖",
    available: true
  });
});

test("报告大纲包含六个章节，且三个章节可生成", () => {
  assert.equal(reportSections.length, 6);
  const generatable = reportSections.filter((section) => section.canGenerate);
  assert.deepEqual(
    generatable.map((section) => section.id),
    ["basic-info", "engineering-analysis", "impact-measures"]
  );
});

test("语料摘要记录32份生猪养殖环评案例和常见污染因子", () => {
  assert.equal(corpusSummary.caseCount, 32);
  assert.equal(corpusSummary.chunkCount, 7551);
  assert.ok(corpusSummary.commonPollutants.includes("NH3"));
  assert.ok(corpusSummary.commonPollutants.includes("H2S"));
  assert.ok(corpusSummary.commonProcesses.includes("干清粪"));
});

test("年出栏5000头及以上时提示关注报告书", () => {
  const result = assessPigFarmCategory({
    annualOutput: "6000",
    stock: "",
    sensitiveArea: "no"
  });

  assert.equal(result.level, "报告书关注");
  assert.match(result.reason, /年出栏生猪数量达到或超过5000头/);
  assert.equal(result.legalNotice.includes("辅助判断"), true);
});

test("缺失资料能按章节 requiredFields 计算", () => {
  const section = reportSections.find((item) => item.id === "impact-measures");
  const missing = getMissingFields(section, {
    manureTreatment: "堆肥发酵",
    wastewaterTreatment: "",
    odorControl: ""
  });

  assert.deepEqual(missing, ["wastewaterTreatment", "odorControl"]);
});

test("资料完整时可以生成主要环境影响和保护措施草稿", () => {
  const text = generateSectionDraft("impact-measures", {
    projectName: "某生猪养殖项目",
    manureTreatment: "干清粪后堆肥发酵并还田利用",
    wastewaterTreatment: "厌氧发酵后用于周边农田消纳",
    odorControl: "猪舍通风、喷淋除臭和场界绿化隔离"
  });

  assert.match(text, /某生猪养殖项目/);
  assert.match(text, /干清粪后堆肥发酵并还田利用/);
  assert.match(text, /厌氧发酵后用于周边农田消纳/);
  assert.match(text, /猪舍通风、喷淋除臭和场界绿化隔离/);
});
