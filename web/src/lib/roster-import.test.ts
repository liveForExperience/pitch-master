import { describe, expect, it } from 'vitest';
import { importNamesAvailableForTeam, parseWechatSignupText } from './roster-import';

const SAMPLE = `1. 何奇丰
2. 小黄人
3. bxz
4. 小王
5. 彭
6. 🦂 mórş ýøñġ 🦂
7. 企鹅🐧 1
8. 企鹅🐧 2 门
9. 企鹅🐧 4
10. 企鹅🐧 3
11. 林
12. 天生
13. 企鹅🐧 5
14. 黄毛
15. 沈雪天
16. 沈雪天 +1
17. 小旋风🔩💰🌍🛫
18. 人满截止
19. 陈越`;

describe('parseWechatSignupText', () => {
  it('parses sample signup: one line = one player, keeps suffixes verbatim', () => {
    const { names, skippedLines } = parseWechatSignupText(SAMPLE);
    expect(skippedLines).toEqual(['18. 人满截止']);
    expect(names).toHaveLength(18);
    expect(names).toContain('沈雪天 +1');
    expect(names).toContain('企鹅🐧 2 门');
    expect(names).toContain('🦂 mórş ýøñġ 🦂');
    expect(names[names.length - 1]).toBe('陈越');
  });

  it('dedupes exact duplicate names in one paste', () => {
    const { names, duplicateNames } = parseWechatSignupText(`1. 张三\n2. 张三\n3. 李四`);
    expect(names).toEqual(['张三', '李四']);
    expect(duplicateNames).toEqual(['张三']);
  });
});

describe('importNamesAvailableForTeam', () => {
  it('excludes names already on roster', () => {
    expect(
      importNamesAvailableForTeam(['张三', '李四'], ['张三']),
    ).toEqual(['李四']);
  });
});
