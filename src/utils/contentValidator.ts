import { TopicCategoryType } from '../types';

export interface TopicValidationResult {
  isValid: boolean;
  hasContamination: boolean;
  score: number;
  matchedKeywords: string[];
  disqualifyingTerms: string[];
  reason: string;
}

/**
 * Validates that generated medical content is strictly aligned with the target subject and topic,
 * rejecting content that contains cross-topic contamination (e.g., RV MI in an Asthma response).
 */
export function validateTopicContentConsistency(
  content: string,
  targetSubject: string,
  targetTopic: string,
  topicType?: TopicCategoryType
): TopicValidationResult {
  if (!content || !content.trim()) {
    return {
      isValid: false,
      hasContamination: false,
      score: 0,
      matchedKeywords: [],
      disqualifyingTerms: ['empty_content'],
      reason: 'Generated content is empty',
    };
  }

  const lowerContent = content.toLowerCase();
  const lowerTopic = targetTopic.toLowerCase();
  const lowerSub = targetSubject.toLowerCase();

  // Extract core keywords from target topic (words > 2 chars, omitting generic terms)
  const genericWords = new Set(['and', 'the', 'for', 'with', 'from', 'disease', 'syndrome', 'clinical', 'high', 'yield', 'core', 'guidelines']);
  const topicKeywords = lowerTopic
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !genericWords.has(w));

  // Subject-specific cross-contamination negative terms
  // If target topic is NOT cardiology, reject prominent cardiology acute terms
  const isCardiologyTopic = lowerTopic.includes('cardio') || lowerTopic.includes('stemi') || lowerTopic.includes('infarct') || lowerTopic.includes('heart') || lowerTopic.includes('ecg') || lowerTopic.includes('arrhythmia') || lowerTopic.includes('wpw') || lowerTopic.includes('rvmi');
  const isPulmonologyTopic = lowerTopic.includes('asthma') || lowerTopic.includes('copd') || lowerTopic.includes('pneumonia') || lowerTopic.includes('lung') || lowerTopic.includes('gina') || lowerTopic.includes('gold');
  const isBiochemistryTopic = lowerTopic.includes('kinetics') || lowerTopic.includes('lineweaver') || lowerTopic.includes('enzyme') || lowerTopic.includes('metabolism') || lowerTopic.includes('glycolysis') || lowerSub.includes('biochem');
  const isAnatomyTopic = lowerSub.includes('anatomy') || lowerTopic.includes('plexus') || lowerTopic.includes('nerve') || lowerTopic.includes('triangle') || lowerTopic.includes('canal');

  const disqualifyingTerms: string[] = [];

  // Check for severe cross-topic leaks
  if (!isCardiologyTopic) {
    const cardTerms = ['rv myocardial infarction', 'rv infarction', 'rca occlusion', 'right ventricular infarction', 'inferior wall mi', 'inferior stemi', 'wolff-parkinson-white'];
    for (const term of cardTerms) {
      if (lowerContent.includes(term)) {
        disqualifyingTerms.push(term);
      }
    }
  }

  if (!isPulmonologyTopic && !isCardiologyTopic) {
    if (lowerContent.includes('gina guidelines') && !lowerTopic.includes('gina')) {
      disqualifyingTerms.push('gina guidelines');
    }
  }

  if (isBiochemistryTopic) {
    // Biochemistry shouldn't have generic acute trauma / surgery resuscitations
    const surgicalTerms = ['parkland formula', 'tube thoracostomy', 'needle thoracostomy', 'pritchard regimen'];
    for (const term of surgicalTerms) {
      if (lowerContent.includes(term)) {
        disqualifyingTerms.push(term);
      }
    }
  }

  if (disqualifyingTerms.length > 0) {
    return {
      isValid: false,
      hasContamination: true,
      score: 0,
      matchedKeywords: [],
      disqualifyingTerms,
      reason: `Disqualified due to cross-topic contamination: found "${disqualifyingTerms.join(', ')}" in a "${targetTopic}" context.`,
    };
  }

  // Count topic keyword matches
  const matchedKeywords: string[] = [];
  for (const kw of topicKeywords) {
    if (lowerContent.includes(kw)) {
      matchedKeywords.push(kw);
    }
  }

  // Check for topic type specific terms
  if (topicType === 'biochemical_concept') {
    const biochemTerms = ['km', 'vmax', 'substrate', 'inhibition', 'enzyme', 'allosteric', 'reaction', 'michaelis', 'lineweaver', 'intercept', 'slope', 'rate', 'pathway'];
    for (const term of biochemTerms) {
      if (lowerContent.includes(term) && !matchedKeywords.includes(term)) {
        matchedKeywords.push(term);
      }
    }
  } else if (topicType === 'anatomical_structure') {
    const anatTerms = ['root', 'trunk', 'nerve', 'artery', 'vein', 'relation', 'branch', 'canal', 'muscle', 'innervation', 'insertion', 'origin', 'fossa'];
    for (const term of anatTerms) {
      if (lowerContent.includes(term) && !matchedKeywords.includes(term)) {
        matchedKeywords.push(term);
      }
    }
  }

  const keywordCoverage = topicKeywords.length > 0 ? matchedKeywords.length / topicKeywords.length : 1;
  const score = Math.min(100, Math.round(keywordCoverage * 70 + (matchedKeywords.length > 0 ? 30 : 0)));

  const isValid = matchedKeywords.length >= 1 || score >= 40;

  return {
    isValid,
    hasContamination: false,
    score,
    matchedKeywords,
    disqualifyingTerms: [],
    reason: isValid
      ? `Valid topic content (matched: ${matchedKeywords.slice(0, 4).join(', ')})`
      : `Insufficient target topic keywords found for "${targetTopic}"`,
  };
}
