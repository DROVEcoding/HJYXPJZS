import test from "node:test";
import assert from "node:assert/strict";
import { categories, corpusSummary, reportSections } from "../scripts/data.js";

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
