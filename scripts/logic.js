import { projectFields, reportSections } from "./data.js";

export function normalizeProjectInput(rawInput) {
  return Object.fromEntries(
    projectFields.map((field) => [field.id, String(rawInput[field.id] ?? "").trim()])
  );
}

export function assessPigFarmCategory(rawInput) {
  const input = normalizeProjectInput(rawInput);
  const annualOutput = Number(input.annualOutput || 0);
  const stock = Number(input.stock || 0);
  const sensitiveArea = input.sensitiveArea === "yes";

  if (annualOutput >= 5000) {
    return createAssessment(
      "报告书关注",
      "年出栏生猪数量达到或超过5000头，应重点关注环境影响报告书要求。"
    );
  }

  if (!annualOutput && stock >= 2500) {
    return createAssessment(
      "报告书关注",
      "未填写明确出栏量且存栏生猪数量达到或超过2500头，应重点关注环境影响报告书要求。"
    );
  }

  if (sensitiveArea) {
    return createAssessment(
      "敏感区审慎判断",
      "项目涉及环境敏感区，应结合正式名录、地方规定和专业判断提高审慎等级。"
    );
  }

  return createAssessment(
    "报告表或登记表关注",
    "当前输入未触发本 demo 的报告书关注条件，可能涉及报告表或登记表，仍需结合正式名录和地方规定判断。"
  );
}

export function getMissingFields(section, rawInput) {
  const input = normalizeProjectInput(rawInput);
  return section.requiredFields.filter((fieldId) => !input[fieldId]);
}

export function getFieldLabel(fieldId) {
  return projectFields.find((field) => field.id === fieldId)?.label ?? fieldId;
}

export function canGenerateSection(sectionId, rawInput) {
  const section = reportSections.find((item) => item.id === sectionId);
  if (!section || !section.canGenerate) {
    return false;
  }

  return getMissingFields(section, rawInput).length === 0;
}

export function generateSectionDraft(sectionId, rawInput) {
  const input = normalizeProjectInput(rawInput);

  if (sectionId === "basic-info") {
    return `《${input.projectName}》位于${input.location}。项目拟建设生猪养殖设施，年出栏规模为${input.annualOutput || "未填写"}头，存栏规模为${input.stock || "未填写"}头。本章节为根据用户输入生成的项目基本情况草稿，后续应补充用地、建设内容、周边环境敏感目标等资料。`;
  }

  if (sectionId === "engineering-analysis") {
    return `《${input.projectName}》以生猪养殖为主体工程，养殖规模为年出栏${input.annualOutput || "未填写"}头、存栏${input.stock || "未填写"}头。项目运营期主要产污环节包括猪舍冲洗废水、养殖粪污、恶臭气体和一般固体废物。粪污处理方式拟采用：${input.manureTreatment}。本章节为工程分析草稿，需进一步补充平面布置、工艺流程、物料平衡和污染源强核算。`;
  }

  if (sectionId === "impact-measures") {
    return `《${input.projectName || "本项目"}》运营期应重点关注粪污、废水和恶臭影响。粪污处理措施为：${input.manureTreatment}。废水处理措施为：${input.wastewaterTreatment}。恶臭控制措施为：${input.odorControl}。以上内容为章节草稿，实际报告需结合监测数据、排放标准、周边敏感目标和地方管理要求完善。`;
  }

  return "该章节在最小 demo 中暂未开放生成。";
}

function createAssessment(level, reason) {
  return {
    level,
    reason,
    legalNotice: "本结果仅为 demo 辅助判断，不替代环评工程师专业判断，也不作为法律最终结论。"
  };
}
