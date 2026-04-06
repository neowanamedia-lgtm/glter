import type { ContentCategory } from '../types/menu';

export type FilterGroupMode = 'single' | 'multi';

export type FilterOptionValue = ContentCategory | (string & {});

export type FilterGroupDefinition = {
  key: string;
  mode: FilterGroupMode;
  options: Array<{ value: FilterOptionValue; label: string; tags?: string[] }>;
  defaultValue?: FilterOptionValue[];
};

export type FilterSelectionState = Record<string, string[]>;

export const FILTER_GROUPS = [
  {
    key: 'philosophy_core',
    mode: 'multi',
    options: [
      { value: 'eastern_philosophy', label: '동양 철학', tags: ['eastern_philosophy'] },
      { value: 'western_philosophy', label: '서양 철학', tags: ['western_philosophy'] },
    ],
  },
  {
    key: 'philosophy_theme_primary',
    mode: 'multi',
    options: [
      { value: 'human', label: '인간', tags: ['human'] },
      { value: 'universe', label: '우주', tags: ['universe'] },
      { value: 'destiny', label: '운명', tags: ['destiny'] },
    ],
  },
  {
    key: 'philosophy_theme_secondary',
    mode: 'multi',
    options: [
      { value: 'love', label: '사랑', tags: ['love'] },
      { value: 'friendship', label: '우정', tags: ['friendship'] },
      { value: 'death', label: '죽음', tags: ['death'] },
      { value: 'money', label: '돈', tags: ['money'] },
      { value: 'work_life', label: '직장생활', tags: ['work_life'] },
      { value: 'children', label: '자녀', tags: ['children'] },
    ],
  },
  {
    key: 'literature',
    mode: 'multi',
    options: [
      { value: 'eastern_poetry', label: '동양시', tags: ['eastern_poetry'] },
      { value: 'western_poetry', label: '서양시', tags: ['western_poetry'] },
      { value: 'eastern_novel', label: '동양 소설', tags: ['eastern_novel'] },
      { value: 'western_novel', label: '서양 소설', tags: ['western_novel'] },
    ],
  },
  {
    key: 'religion',
    mode: 'multi',
    options: [
      { value: 'christianity', label: '기독교', tags: ['christianity'] },
      { value: 'buddhism', label: '불교', tags: ['buddhism'] },
      { value: 'islam', label: '이슬람교', tags: ['islam'] },
    ],
  },
] as const satisfies FilterGroupDefinition[];

const FILTER_GROUP_MAP = new Map<string, FilterGroupDefinition>(
  FILTER_GROUPS.map((group) => [group.key, group]),
);

const FILTER_OPTION_TO_GROUP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  FILTER_GROUPS.forEach((group) => {
    group.options.forEach((option) => {
      map[String(option.value)] = group.key;
    });
  });
  return map;
})();

const EMPTY_TEMPLATE = buildTemplate(() => []);
const DEFAULT_TEMPLATE = buildTemplate((group) => {
  if (Array.isArray(group.defaultValue) && group.defaultValue.length > 0) {
    return group.defaultValue;
  }

  if (group.mode === 'single' && group.options.length) {
    return [group.options[0].value];
  }

  return [];
});

function buildTemplate(getValues: (group: FilterGroupDefinition) => FilterOptionValue[]): FilterSelectionState {
  const next: FilterSelectionState = {};

  FILTER_GROUPS.forEach((group) => {
    next[group.key] = getValues(group).map((value) => String(value));
  });

  return next;
}

function cloneState(state: FilterSelectionState): FilterSelectionState {
  const next: FilterSelectionState = {};
  FILTER_GROUPS.forEach((group) => {
    next[group.key] = [...(state[group.key] ?? [])];
  });
  return next;
}

function sanitizeValues(group: FilterGroupDefinition, values: string[] | undefined): string[] {
  if (!Array.isArray(values) || !values.length) {
    return [];
  }

  const optionSet = new Set(group.options.map((option) => String(option.value)));
  const filtered = values.filter((value) => optionSet.has(value));

  if (!filtered.length) {
    return [];
  }

  if (group.mode === 'single') {
    return [filtered[filtered.length - 1]];
  }

  return Array.from(new Set(filtered));
}

export function normalizeFilterSelectionState(
  input: Partial<Record<string, string[]>> | null | undefined,
): FilterSelectionState {
  if (!input) {
    return cloneState(DEFAULT_TEMPLATE);
  }

  const next: FilterSelectionState = {};

  FILTER_GROUPS.forEach((group) => {
    const sanitized = sanitizeValues(group, input[group.key]);
    if (sanitized.length) {
      next[group.key] = sanitized;
    } else {
      next[group.key] = [...DEFAULT_TEMPLATE[group.key]];
    }
  });

  const hasAnySelection = anyGroupHasSelection(next);
  if (!hasAnySelection) {
    return cloneState(DEFAULT_TEMPLATE);
  }

  return next;
}

function anyGroupHasSelection(state: FilterSelectionState): boolean {
  return FILTER_GROUPS.some((group) => {
    const values = state[group.key];
    return Array.isArray(values) && values.length > 0;
  });
}
export function createFilterStateFromCategories(
  categories: string[] | null | undefined,
): FilterSelectionState {
  if (!Array.isArray(categories) || !categories.length) {
    return cloneState(DEFAULT_TEMPLATE);
  }

  const draft = cloneState(EMPTY_TEMPLATE);

  categories.forEach((category) => {
    const groupKey = FILTER_OPTION_TO_GROUP[category];
    if (!groupKey) {
      return;
    }

    const group = FILTER_GROUP_MAP.get(groupKey);
    if (!group) {
      return;
    }

    if (group.mode === 'single') {
      draft[group.key] = [category];
      return;
    }

    if (!draft[group.key].includes(category)) {
      draft[group.key] = [...draft[group.key], category];
    }
  });

  return normalizeFilterSelectionState(draft);
}

export function flattenFilterSelectionState(state: FilterSelectionState): string[] {
  const ordered: string[] = [];

  FILTER_GROUPS.forEach((group) => {
    const sanitized = sanitizeValues(group, state[group.key]);
    const values = sanitized.length ? sanitized : DEFAULT_TEMPLATE[group.key];

    values.forEach((value) => {
      if (value) {
        ordered.push(String(value));
      }
    });
  });

  return ordered;
}

export function collectActiveFilterTags(state: FilterSelectionState): string[] {
  const normalized = normalizeFilterSelectionState(state);
  const tags = new Set<string>();

  FILTER_GROUPS.forEach((group) => {
    const selected = normalized[group.key];
    if (!selected.length) {
      return;
    }

    group.options.forEach((option) => {
      if (selected.includes(String(option.value))) {
        const optionTags = option.tags?.length ? option.tags : [String(option.value)];
        optionTags.forEach((tag) => {
          if (tag) {
            tags.add(tag);
          }
        });
      }
    });
  });

  return Array.from(tags);
}
