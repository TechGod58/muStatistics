export const spssBenchmarkDatasets = {
  compareMeansTTest: {
    caseCount: 16,
    fields: [
      { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
      { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' },
      { key: 'score', label: 'Score', source: 'attribute', valueType: 'number' },
      { key: 'group', label: 'Group', source: 'attribute', valueType: 'string' }
    ],
    rows: [
      { case_id: 'c1', case_label: 'C1', score: 62, group: 'A' },
      { case_id: 'c2', case_label: 'C2', score: 65, group: 'A' },
      { case_id: 'c3', case_label: 'C3', score: 67, group: 'A' },
      { case_id: 'c4', case_label: 'C4', score: 68, group: 'A' },
      { case_id: 'c5', case_label: 'C5', score: 70, group: 'A' },
      { case_id: 'c6', case_label: 'C6', score: 71, group: 'A' },
      { case_id: 'c7', case_label: 'C7', score: 72, group: 'A' },
      { case_id: 'c8', case_label: 'C8', score: 74, group: 'A' },
      { case_id: 'c9', case_label: 'C9', score: 55, group: 'B' },
      { case_id: 'c10', case_label: 'C10', score: 57, group: 'B' },
      { case_id: 'c11', case_label: 'C11', score: 58, group: 'B' },
      { case_id: 'c12', case_label: 'C12', score: 59, group: 'B' },
      { case_id: 'c13', case_label: 'C13', score: 60, group: 'B' },
      { case_id: 'c14', case_label: 'C14', score: 61, group: 'B' },
      { case_id: 'c15', case_label: 'C15', score: 62, group: 'B' },
      { case_id: 'c16', case_label: 'C16', score: 63, group: 'B' }
    ],
    notes: []
  },
  linearRegression: {
    caseCount: 20,
    fields: [
      { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
      { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' },
      { key: 'y', label: 'Outcome', source: 'attribute', valueType: 'number' },
      { key: 'x1', label: 'Predictor X1', source: 'attribute', valueType: 'number' },
      { key: 'x2', label: 'Predictor X2', source: 'attribute', valueType: 'number' }
    ],
    rows: [
      { case_id: 'r1', case_label: 'R1', y: 13.7, x1: 1, x2: 4 },
      { case_id: 'r2', case_label: 'R2', y: 15.6, x1: 2, x2: 9 },
      { case_id: 'r3', case_label: 'R3', y: 16.8, x1: 3, x2: 3 },
      { case_id: 'r4', case_label: 'R4', y: 19.4, x1: 4, x2: 12 },
      { case_id: 'r5', case_label: 'R5', y: 20.3, x1: 5, x2: 5 },
      { case_id: 'r6', case_label: 'R6', y: 21.7, x1: 6, x2: 7 },
      { case_id: 'r7', case_label: 'R7', y: 24.5, x1: 7, x2: 14 },
      { case_id: 'r8', case_label: 'R8', y: 24.8, x1: 8, x2: 6 },
      { case_id: 'r9', case_label: 'R9', y: 27.2, x1: 9, x2: 10 },
      { case_id: 'r10', case_label: 'R10', y: 28.4, x1: 10, x2: 8 },
      { case_id: 'r11', case_label: 'R11', y: 30.1, x1: 11, x2: 11 },
      { case_id: 'r12', case_label: 'R12', y: 31.9, x1: 12, x2: 13 },
      { case_id: 'r13', case_label: 'R13', y: 33.2, x1: 13, x2: 7 },
      { case_id: 'r14', case_label: 'R14', y: 35.5, x1: 14, x2: 15 },
      { case_id: 'r15', case_label: 'R15', y: 36.8, x1: 15, x2: 9 },
      { case_id: 'r16', case_label: 'R16', y: 39.3, x1: 16, x2: 16 },
      { case_id: 'r17', case_label: 'R17', y: 40, x1: 17, x2: 8 },
      { case_id: 'r18', case_label: 'R18', y: 43.1, x1: 18, x2: 17 },
      { case_id: 'r19', case_label: 'R19', y: 44, x1: 19, x2: 10 },
      { case_id: 'r20', case_label: 'R20', y: 46.4, x1: 20, x2: 18 }
    ],
    notes: []
  },
  logisticRegression: {
    caseCount: 24,
    fields: [
      { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
      { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' },
      { key: 'admit', label: 'Admit', source: 'attribute', valueType: 'number' },
      { key: 'gpa', label: 'GPA', source: 'attribute', valueType: 'number' }
    ],
    rows: [
      { case_id: 'l1', case_label: 'L1', admit: 0, gpa: 2.5 },
      { case_id: 'l2', case_label: 'L2', admit: 0, gpa: 2.7 },
      { case_id: 'l3', case_label: 'L3', admit: 0, gpa: 2.8 },
      { case_id: 'l4', case_label: 'L4', admit: 0, gpa: 3 },
      { case_id: 'l5', case_label: 'L5', admit: 1, gpa: 3.1 },
      { case_id: 'l6', case_label: 'L6', admit: 0, gpa: 3.2 },
      { case_id: 'l7', case_label: 'L7', admit: 1, gpa: 3.3 },
      { case_id: 'l8', case_label: 'L8', admit: 0, gpa: 3.4 },
      { case_id: 'l9', case_label: 'L9', admit: 1, gpa: 3.5 },
      { case_id: 'l10', case_label: 'L10', admit: 1, gpa: 3.6 },
      { case_id: 'l11', case_label: 'L11', admit: 1, gpa: 3.7 },
      { case_id: 'l12', case_label: 'L12', admit: 1, gpa: 3.8 },
      { case_id: 'l13', case_label: 'L13', admit: 0, gpa: 2.9 },
      { case_id: 'l14', case_label: 'L14', admit: 1, gpa: 3 },
      { case_id: 'l15', case_label: 'L15', admit: 0, gpa: 3.4 },
      { case_id: 'l16', case_label: 'L16', admit: 1, gpa: 3.5 },
      { case_id: 'l17', case_label: 'L17', admit: 1, gpa: 3.6 },
      { case_id: 'l18', case_label: 'L18', admit: 0, gpa: 2.6 },
      { case_id: 'l19', case_label: 'L19', admit: 1, gpa: 3.7 },
      { case_id: 'l20', case_label: 'L20', admit: 1, gpa: 3.2 },
      { case_id: 'l21', case_label: 'L21', admit: 0, gpa: 3.1 },
      { case_id: 'l22', case_label: 'L22', admit: 1, gpa: 3.3 },
      { case_id: 'l23', case_label: 'L23', admit: 0, gpa: 2.8 },
      { case_id: 'l24', case_label: 'L24', admit: 1, gpa: 3.9 }
    ],
    notes: []
  },
  advancedModels: {
    caseCount: 12,
    fields: [
      { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
      { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' },
      { key: 'outcome', label: 'Outcome', source: 'attribute', valueType: 'number' },
      { key: 'binary_outcome', label: 'Binary Outcome', source: 'attribute', valueType: 'number' },
      { key: 'count_outcome', label: 'Count Outcome', source: 'attribute', valueType: 'number' },
      { key: 'x1', label: 'Predictor X1', source: 'attribute', valueType: 'number' },
      { key: 'x2', label: 'Predictor X2', source: 'attribute', valueType: 'number' },
      { key: 'site', label: 'Site', source: 'attribute', valueType: 'string' },
      { key: 'weight', label: 'Weight', source: 'attribute', valueType: 'number' }
    ],
    rows: [
      { case_id: 'm1', case_label: 'M1', outcome: 10, binary_outcome: 0, count_outcome: 1, x1: 1, x2: 2, site: 'North', weight: 1 },
      { case_id: 'm2', case_label: 'M2', outcome: 11.5, binary_outcome: 0, count_outcome: 1, x1: 2, x2: 2.5, site: 'North', weight: 1 },
      { case_id: 'm3', case_label: 'M3', outcome: 13.1, binary_outcome: 0, count_outcome: 2, x1: 3, x2: 3.2, site: 'North', weight: 1.1 },
      { case_id: 'm4', case_label: 'M4', outcome: 14.2, binary_outcome: 0, count_outcome: 2, x1: 4, x2: 3.8, site: 'East', weight: 0.9 },
      { case_id: 'm5', case_label: 'M5', outcome: 16.8, binary_outcome: 1, count_outcome: 3, x1: 5, x2: 4.5, site: 'East', weight: 1.1 },
      { case_id: 'm6', case_label: 'M6', outcome: 18.4, binary_outcome: 1, count_outcome: 4, x1: 6, x2: 5.1, site: 'East', weight: 1.2 },
      { case_id: 'm7', case_label: 'M7', outcome: 19.9, binary_outcome: 1, count_outcome: 4, x1: 7, x2: 5.7, site: 'South', weight: 1.3 },
      { case_id: 'm8', case_label: 'M8', outcome: 21.5, binary_outcome: 1, count_outcome: 5, x1: 8, x2: 6.1, site: 'South', weight: 1.2 },
      { case_id: 'm9', case_label: 'M9', outcome: 23.2, binary_outcome: 1, count_outcome: 6, x1: 9, x2: 6.8, site: 'South', weight: 1.1 },
      { case_id: 'm10', case_label: 'M10', outcome: 24.8, binary_outcome: 1, count_outcome: 7, x1: 10, x2: 7.2, site: 'West', weight: 1 },
      { case_id: 'm11', case_label: 'M11', outcome: 26.2, binary_outcome: 1, count_outcome: 8, x1: 11, x2: 7.8, site: 'West', weight: 1 },
      { case_id: 'm12', case_label: 'M12', outcome: 27.9, binary_outcome: 1, count_outcome: 9, x1: 12, x2: 8.3, site: 'West', weight: 1 }
    ],
    notes: []
  },
  complexSamplesReplicate: {
    caseCount: 12,
    fields: [
      { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
      { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' },
      { key: 'score', label: 'Score', source: 'attribute', valueType: 'number' },
      { key: 'domain', label: 'Domain', source: 'attribute', valueType: 'string' },
      { key: 'strata', label: 'Strata', source: 'attribute', valueType: 'string' },
      { key: 'cluster', label: 'Cluster', source: 'attribute', valueType: 'string' },
      { key: 'weight', label: 'Weight', source: 'attribute', valueType: 'number' },
      { key: 'rep_w1', label: 'Replicate 1', source: 'attribute', valueType: 'number' },
      { key: 'rep_w2', label: 'Replicate 2', source: 'attribute', valueType: 'number' },
      { key: 'rep_w3', label: 'Replicate 3', source: 'attribute', valueType: 'number' },
      { key: 'fpc', label: 'FPC', source: 'attribute', valueType: 'number' }
    ],
    rows: [
      { case_id: 'cs1', case_label: 'CS1', score: 52, domain: 'A', strata: 'S1', cluster: 'C1', weight: 1.1, rep_w1: 1.0, rep_w2: 1.2, rep_w3: 1.1, fpc: 120 },
      { case_id: 'cs2', case_label: 'CS2', score: 55, domain: 'A', strata: 'S1', cluster: 'C1', weight: 1.0, rep_w1: 0.9, rep_w2: 1.1, rep_w3: 1.0, fpc: 120 },
      { case_id: 'cs3', case_label: 'CS3', score: 58, domain: 'A', strata: 'S1', cluster: 'C2', weight: 1.2, rep_w1: 1.3, rep_w2: 1.1, rep_w3: 1.2, fpc: 120 },
      { case_id: 'cs4', case_label: 'CS4', score: 60, domain: 'A', strata: 'S2', cluster: 'C3', weight: 1.1, rep_w1: 1.0, rep_w2: 1.2, rep_w3: 1.0, fpc: 115 },
      { case_id: 'cs5', case_label: 'CS5', score: 62, domain: 'A', strata: 'S2', cluster: 'C3', weight: 1.0, rep_w1: 1.1, rep_w2: 0.9, rep_w3: 1.0, fpc: 115 },
      { case_id: 'cs6', case_label: 'CS6', score: 65, domain: 'A', strata: 'S2', cluster: 'C4', weight: 1.2, rep_w1: 1.3, rep_w2: 1.2, rep_w3: 1.1, fpc: 115 },
      { case_id: 'cs7', case_label: 'CS7', score: 68, domain: 'B', strata: 'S1', cluster: 'C5', weight: 1.0, rep_w1: 0.9, rep_w2: 1.0, rep_w3: 1.1, fpc: 130 },
      { case_id: 'cs8', case_label: 'CS8', score: 70, domain: 'B', strata: 'S1', cluster: 'C5', weight: 1.1, rep_w1: 1.2, rep_w2: 1.0, rep_w3: 1.1, fpc: 130 },
      { case_id: 'cs9', case_label: 'CS9', score: 73, domain: 'B', strata: 'S1', cluster: 'C6', weight: 1.2, rep_w1: 1.1, rep_w2: 1.3, rep_w3: 1.2, fpc: 130 },
      { case_id: 'cs10', case_label: 'CS10', score: 75, domain: 'B', strata: 'S2', cluster: 'C7', weight: 1.0, rep_w1: 0.9, rep_w2: 1.0, rep_w3: 1.1, fpc: 125 },
      { case_id: 'cs11', case_label: 'CS11', score: 78, domain: 'B', strata: 'S2', cluster: 'C7', weight: 1.1, rep_w1: 1.0, rep_w2: 1.2, rep_w3: 1.1, fpc: 125 },
      { case_id: 'cs12', case_label: 'CS12', score: 80, domain: 'B', strata: 'S2', cluster: 'C8', weight: 1.2, rep_w1: 1.1, rep_w2: 1.3, rep_w3: 1.2, fpc: 125 }
    ],
    notes: []
  },
  factorStructure: {
    caseCount: 16,
    fields: [
      { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
      { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' },
      { key: 'item_a', label: 'Item A', source: 'attribute', valueType: 'number' },
      { key: 'item_b', label: 'Item B', source: 'attribute', valueType: 'number' },
      { key: 'item_c', label: 'Item C', source: 'attribute', valueType: 'number' },
      { key: 'item_d', label: 'Item D', source: 'attribute', valueType: 'number' }
    ],
    rows: [
      { case_id: 'f1', case_label: 'F1', item_a: 4.2, item_b: 4.1, item_c: 2.1, item_d: 2.2 },
      { case_id: 'f2', case_label: 'F2', item_a: 4.0, item_b: 4.0, item_c: 2.0, item_d: 2.1 },
      { case_id: 'f3', case_label: 'F3', item_a: 4.4, item_b: 4.2, item_c: 2.2, item_d: 2.3 },
      { case_id: 'f4', case_label: 'F4', item_a: 4.3, item_b: 4.4, item_c: 2.4, item_d: 2.2 },
      { case_id: 'f5', case_label: 'F5', item_a: 3.8, item_b: 3.7, item_c: 1.9, item_d: 2.0 },
      { case_id: 'f6', case_label: 'F6', item_a: 3.9, item_b: 3.8, item_c: 2.0, item_d: 2.1 },
      { case_id: 'f7', case_label: 'F7', item_a: 2.2, item_b: 2.3, item_c: 4.1, item_d: 4.2 },
      { case_id: 'f8', case_label: 'F8', item_a: 2.1, item_b: 2.2, item_c: 4.0, item_d: 4.1 },
      { case_id: 'f9', case_label: 'F9', item_a: 2.4, item_b: 2.5, item_c: 4.3, item_d: 4.4 },
      { case_id: 'f10', case_label: 'F10', item_a: 2.3, item_b: 2.2, item_c: 4.2, item_d: 4.3 },
      { case_id: 'f11', case_label: 'F11', item_a: 1.9, item_b: 2.0, item_c: 3.8, item_d: 3.9 },
      { case_id: 'f12', case_label: 'F12', item_a: 2.0, item_b: 2.1, item_c: 3.9, item_d: 4.0 },
      { case_id: 'f13', case_label: 'F13', item_a: 3.6, item_b: 3.5, item_c: 2.4, item_d: 2.6 },
      { case_id: 'f14', case_label: 'F14', item_a: 3.7, item_b: 3.6, item_c: 2.5, item_d: 2.7 },
      { case_id: 'f15', case_label: 'F15', item_a: 2.6, item_b: 2.7, item_c: 3.3, item_d: 3.4 },
      { case_id: 'f16', case_label: 'F16', item_a: 2.5, item_b: 2.6, item_c: 3.2, item_d: 3.3 }
    ],
    notes: []
  },
  edgeExactProcedures: {
    caseCount: 10,
    fields: [
      { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
      { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' },
      { key: 'before', label: 'Before', source: 'attribute', valueType: 'number' },
      { key: 'after', label: 'After', source: 'attribute', valueType: 'number' },
      { key: 'run_seq', label: 'Run sequence', source: 'attribute', valueType: 'number' },
      { key: 'row_cat', label: 'Row category', source: 'attribute', valueType: 'string' },
      { key: 'col_cat', label: 'Column category', source: 'attribute', valueType: 'string' }
    ],
    rows: [
      { case_id: 'e1', case_label: 'E1', before: 0, after: 1, run_seq: 2, row_cat: 'R1', col_cat: 'C1' },
      { case_id: 'e2', case_label: 'E2', before: 1, after: 1, run_seq: 4, row_cat: 'R1', col_cat: 'C1' },
      { case_id: 'e3', case_label: 'E3', before: 0, after: 0, run_seq: 6, row_cat: 'R1', col_cat: 'C2' },
      { case_id: 'e4', case_label: 'E4', before: 1, after: 0, run_seq: 8, row_cat: 'R1', col_cat: 'C2' },
      { case_id: 'e5', case_label: 'E5', before: 0, after: 1, run_seq: 1, row_cat: 'R2', col_cat: 'C1' },
      { case_id: 'e6', case_label: 'E6', before: 1, after: 1, run_seq: 3, row_cat: 'R2', col_cat: 'C1' },
      { case_id: 'e7', case_label: 'E7', before: 0, after: 0, run_seq: 5, row_cat: 'R2', col_cat: 'C2' },
      { case_id: 'e8', case_label: 'E8', before: 1, after: 0, run_seq: 7, row_cat: 'R3', col_cat: 'C2' },
      { case_id: 'e9', case_label: 'E9', before: 0, after: 1, run_seq: 9, row_cat: 'R3', col_cat: 'C2' },
      { case_id: 'e10', case_label: 'E10', before: 1, after: 1, run_seq: 10, row_cat: 'R1', col_cat: 'C1' }
    ],
    notes: []
  },
  edgeMissingImputation: {
    caseCount: 12,
    fields: [
      { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
      { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' },
      { key: 'y', label: 'Outcome', source: 'attribute', valueType: 'number' },
      { key: 'x1', label: 'Predictor X1', source: 'attribute', valueType: 'number' },
      { key: 'x2', label: 'Predictor X2', source: 'attribute', valueType: 'number' },
      { key: 'group', label: 'Group', source: 'attribute', valueType: 'string' },
      { key: 'weight', label: 'Weight', source: 'attribute', valueType: 'number' },
      { key: 'binary', label: 'Binary outcome', source: 'attribute', valueType: 'number' }
    ],
    rows: [
      { case_id: 'mi1', case_label: 'MI1', y: 21, x1: 3.1, x2: 7.2, group: 'A', weight: 1.1, binary: 1 },
      { case_id: 'mi2', case_label: 'MI2', y: 19, x1: 2.9, x2: null, group: 'A', weight: 1.0, binary: 0 },
      { case_id: 'mi3', case_label: 'MI3', y: 24, x1: null, x2: 8.1, group: 'A', weight: 1.2, binary: 1 },
      { case_id: 'mi4', case_label: 'MI4', y: 18, x1: 2.3, x2: 6.5, group: 'A', weight: 1.0, binary: 0 },
      { case_id: 'mi5', case_label: 'MI5', y: null, x1: 3.8, x2: 8.6, group: 'B', weight: 1.3, binary: 1 },
      { case_id: 'mi6', case_label: 'MI6', y: 27, x1: 4.0, x2: 8.9, group: 'B', weight: 1.2, binary: 1 },
      { case_id: 'mi7', case_label: 'MI7', y: 16, x1: 2.1, x2: null, group: 'B', weight: 0.9, binary: 0 },
      { case_id: 'mi8', case_label: 'MI8', y: 22, x1: 3.2, x2: 7.8, group: 'B', weight: 1.0, binary: null },
      { case_id: 'mi9', case_label: 'MI9', y: 28, x1: 4.2, x2: 9.1, group: 'C', weight: 1.4, binary: 1 },
      { case_id: 'mi10', case_label: 'MI10', y: null, x1: null, x2: 8.2, group: 'C', weight: 1.1, binary: 0 },
      { case_id: 'mi11', case_label: 'MI11', y: 20, x1: 3.0, x2: 7.0, group: 'C', weight: 1.0, binary: null },
      { case_id: 'mi12', case_label: 'MI12', y: 26, x1: 3.9, x2: 8.7, group: 'C', weight: 1.3, binary: 1 }
    ],
    notes: []
  },
  edgeTimeSeriesAndSurvival: {
    caseCount: 14,
    fields: [
      { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
      { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' },
      { key: 'month', label: 'Month', source: 'attribute', valueType: 'number' },
      { key: 'value', label: 'Observed value', source: 'attribute', valueType: 'number' }
    ],
    rows: [
      { case_id: 'f1', case_label: 'F1', month: 1, value: 102 },
      { case_id: 'f2', case_label: 'F2', month: 2, value: 105 },
      { case_id: 'f3', case_label: 'F3', month: 3, value: 109 },
      { case_id: 'f4', case_label: 'F4', month: 4, value: 108 },
      { case_id: 'f5', case_label: 'F5', month: 5, value: 112 },
      { case_id: 'f6', case_label: 'F6', month: 6, value: 116 },
      { case_id: 'f7', case_label: 'F7', month: 7, value: 118 },
      { case_id: 'f8', case_label: 'F8', month: 8, value: 121 },
      { case_id: 'f9', case_label: 'F9', month: 9, value: 123 },
      { case_id: 'f10', case_label: 'F10', month: 10, value: 126 },
      { case_id: 'f11', case_label: 'F11', month: 11, value: 129 },
      { case_id: 'f12', case_label: 'F12', month: 12, value: 131 },
      { case_id: 'f13', case_label: 'F13', month: 13, value: 134 },
      { case_id: 'f14', case_label: 'F14', month: 14, value: 138 }
    ],
    notes: []
  },
  edgeRepeatedMeasuresAndCox: {
    caseCount: 12,
    fields: [
      { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
      { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' },
      { key: 't1', label: 'Time 1', source: 'attribute', valueType: 'number' },
      { key: 't2', label: 'Time 2', source: 'attribute', valueType: 'number' },
      { key: 't3', label: 'Time 3', source: 'attribute', valueType: 'number' },
      { key: 'time', label: 'Survival time', source: 'attribute', valueType: 'number' },
      { key: 'event', label: 'Survival event', source: 'attribute', valueType: 'number' },
      { key: 'group', label: 'Site group', source: 'attribute', valueType: 'string' },
      { key: 'x1', label: 'Predictor X1', source: 'attribute', valueType: 'number' },
      { key: 'x2', label: 'Predictor X2', source: 'attribute', valueType: 'number' }
    ],
    rows: [
      { case_id: 's1', case_label: 'S1', t1: 10, t2: 12, t3: 14, time: 5, event: 1, group: 'A', x1: 1, x2: 2 },
      { case_id: 's2', case_label: 'S2', t1: 11, t2: 13, t3: 15, time: 7, event: 1, group: 'A', x1: 2, x2: 2.5 },
      { case_id: 's3', case_label: 'S3', t1: 9, t2: 11, t3: 12, time: 8, event: 0, group: 'A', x1: 3, x2: 3 },
      { case_id: 's4', case_label: 'S4', t1: 13, t2: 15, t3: 16, time: 10, event: 1, group: 'A', x1: 4, x2: 3.8 },
      { case_id: 's5', case_label: 'S5', t1: 8, t2: 10, t3: 11, time: 6, event: 1, group: 'B', x1: 2, x2: 2.2 },
      { case_id: 's6', case_label: 'S6', t1: 12, t2: 14, t3: 15, time: 9, event: 0, group: 'B', x1: 3, x2: 2.7 },
      { case_id: 's7', case_label: 'S7', t1: 10, t2: 11, t3: 13, time: 11, event: 1, group: 'B', x1: 4, x2: 3.4 },
      { case_id: 's8', case_label: 'S8', t1: 9, t2: 12, t3: 14, time: 12, event: 1, group: 'B', x1: 5, x2: 4.0 },
      { case_id: 's9', case_label: 'S9', t1: 12, t2: 13, t3: 15, time: 4, event: 1, group: 'C', x1: 1, x2: 1.8 },
      { case_id: 's10', case_label: 'S10', t1: 13, t2: 15, t3: 16, time: 6, event: 1, group: 'C', x1: 2, x2: 2.4 },
      { case_id: 's11', case_label: 'S11', t1: 11, t2: 13, t3: 14, time: 9, event: 0, group: 'C', x1: 3, x2: 3.1 },
      { case_id: 's12', case_label: 'S12', t1: 14, t2: 16, t3: 17, time: 13, event: 1, group: 'C', x1: 5, x2: 4.3 }
    ],
    notes: []
  }
} as const;
